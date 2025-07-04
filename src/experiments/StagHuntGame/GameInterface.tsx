import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Beer as Deer, Rabbit, Clock, Brain, 
  MessageSquare, PauseCircle, PlayCircle, 
  ChevronRight, ChevronLeft, Settings, X, Download, 
  ArrowUp, ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight
} from 'lucide-react';
import Button from '../../components/Button';
import { ExperimentConfig } from './index';
import { usePhysiologicalSync } from '../../components/PhysiologicalSyncContext';

interface GameInterfaceProps {
  config: ExperimentConfig;
  onComplete: (results: any) => void;
  onBack: () => void;
}

// 定义游戏中的实体类型
interface Entity {
  id: string;
  type: 'player' | 'ai' | 'stag' | 'hare';
  position: { x: number; y: number };
  target?: { x: number; y: number };
  strategy?: 'stag' | 'hare' | 'unknown';
}

interface GameState {
  entities: Entity[];
  score: number;
  aiScore: number;
  round: number;
  timeLeft: number;
  gameLog: GameLogEntry[];
  aiThoughts: AiThought[];
}

interface GameLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AiThought {
  id: string;
  timestamp: number;
  content: string;
  confidence: number;
}

// Move getGridDimensions function to the top before it's used
const getGridDimensions = (size: string): { width: number; height: number } => {
  switch (size) {
    case 'small': return { width: 5, height: 5 };
    case 'medium': return { width: 8, height: 8 };
    case 'large': return { width: 12, height: 12 };
    default: return { width: 8, height: 8 };
  }
};

const GameInterface = ({ config, onComplete, onBack }: GameInterfaceProps) => {
  const [gameState, setGameState] = useState<GameState>({
    entities: [],
    score: 0,
    aiScore: 0,
    round: 1,
    timeLeft: config.duration * 60, // seconds
    gameLog: [],
    aiThoughts: []
  });
  
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAiThoughts, setShowAiThoughts] = useState(true);
  const [gridSize, setGridSize] = useState(getGridDimensions(config.gridSize));
  const [cellSize, setCellSize] = useState(40);
  const [playerMove, setPlayerMove] = useState<{ dx: number; dy: number } | null>(null);
  
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const aiThinkingRef = useRef<NodeJS.Timeout | null>(null);
  const { sendSyncMarker } = usePhysiologicalSync();
  
  // 初始化游戏
  useEffect(() => {
    initializeGame();
    startGameTimer();
    startGameLoop();
    startAiThinking();
    
    // 发送游戏开始标记
    sendSyncMarker('game_start', { 
      config,
      startTime: Date.now()
    });
    
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      if (aiThinkingRef.current) clearInterval(aiThinkingRef.current);
    };
  }, []);
  
  // 监听键盘输入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      
      switch (e.key) {
        case 'ArrowUp':
          setPlayerMove({ dx: 0, dy: -1 });
          break;
        case 'ArrowDown':
          setPlayerMove({ dx: 0, dy: 1 });
          break;
        case 'ArrowLeft':
          setPlayerMove({ dx: -1, dy: 0 });
          break;
        case 'ArrowRight':
          setPlayerMove({ dx: 1, dy: 0 });
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused]);
  
  // 处理玩家移动
  useEffect(() => {
    if (playerMove && !isPaused) {
      movePlayer(playerMove.dx, playerMove.dy);
      setPlayerMove(null);
    }
  }, [playerMove]);
  
  const initializeGame = () => {
    const { width, height } = gridSize;
    const initialEntities: Entity[] = [];
    
    // 添加玩家
    initialEntities.push({
      id: 'player',
      type: 'player',
      position: { x: Math.floor(width / 4), y: Math.floor(height / 2) }
    });
    
    // 添加AI
    initialEntities.push({
      id: 'ai',
      type: 'ai',
      position: { x: Math.floor(width * 3 / 4), y: Math.floor(height / 2) },
      strategy: 'unknown'
    });
    
    // 添加猎物
    addNewPrey(initialEntities, 'stag');
    addNewPrey(initialEntities, 'hare');
    addNewPrey(initialEntities, 'hare');
    
    setGameState(prev => ({
      ...prev,
      entities: initialEntities,
      gameLog: [
        {
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          message: '游戏开始！与AI合作捕获猎物，获取最高分数。',
          type: 'info'
        }
      ]
    }));
    
    // 发送初始化标记
    sendSyncMarker('game_initialized', {
      gridSize,
      initialEntities: initialEntities.length
    });
  };
  
  const addNewPrey = (entities: Entity[], type: 'stag' | 'hare') => {
    const { width, height } = gridSize;
    let position;
    let isValidPosition = false;
    
    // 确保新猎物不会出现在已有实体的位置
    while (!isValidPosition) {
      position = {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height)
      };
      
      isValidPosition = !entities.some(entity => 
        entity.position.x === position.x && entity.position.y === position.y
      );
    }
    
    entities.push({
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      position
    });
  };
  
  const startGameTimer = () => {
    gameTimerRef.current = setInterval(() => {
      if (!isPaused) {
        setGameState(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          
          if (newTimeLeft <= 0) {
            endGame();
            return prev;
          }
          
          return { ...prev, timeLeft: newTimeLeft };
        });
      }
    }, 1000);
  };
  
  const startGameLoop = () => {
    // 游戏主循环，每500ms执行一次
    gameLoopRef.current = setInterval(() => {
      if (!isPaused) {
        updateGameState();
      }
    }, 500);
  };
  
  const startAiThinking = () => {
    // AI思考，每5-10秒生成一次想法
    aiThinkingRef.current = setInterval(() => {
      if (!isPaused && config.llmConfig.apiKey) {
        generateAiThought();
      } else if (!isPaused) {
        // 如果没有API密钥，使用模板生成想法
        generateTemplateAiThought();
      }
    }, 5000 + Math.random() * 5000);
  };
  
  const updateGameState = () => {
    setGameState(prev => {
      const newEntities = [...prev.entities];
      
      // 移动猎物
      newEntities.forEach(entity => {
        if (entity.type === 'stag' || entity.type === 'hare') {
          moveRandomly(entity);
        }
      });
      
      // 移动AI
      const aiEntity = newEntities.find(e => e.type === 'ai');
      const playerEntity = newEntities.find(e => e.type === 'player');
      
      if (aiEntity && playerEntity) {
        moveAi(aiEntity, playerEntity, newEntities);
      }
      
      // 检查捕获
      const captureResults = checkCaptures(newEntities);
      let newScore = prev.score;
      let newAiScore = prev.aiScore;
      let newGameLog = [...prev.gameLog];
      
      captureResults.forEach(result => {
        if (result.type === 'stag') {
          // 鹿被捕获，玩家和AI各得10分
          newScore += 10;
          newAiScore += 10;
          newGameLog.push({
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            message: '成功合作捕获了鹿！+10分',
            type: 'success'
          });
          
          // 发送捕获标记
          sendSyncMarker('stag_captured', {
            position: result.position,
            playerPosition: playerEntity.position,
            aiPosition: aiEntity.position,
            round: prev.round
          });
        } else {
          // 兔子被捕获，捕获者得3分
          if (result.capturedBy === 'player') {
            newScore += 3;
            newGameLog.push({
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              message: '你捕获了兔子！+3分',
              type: 'info'
            });
          } else {
            newAiScore += 3;
            newGameLog.push({
              id: `log-${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              message: 'AI捕获了兔子！',
              type: 'info'
            });
          }
          
          // 发送捕获标记
          sendSyncMarker('hare_captured', {
            position: result.position,
            capturedBy: result.capturedBy,
            round: prev.round
          });
        }
        
        // 移除被捕获的猎物
        const index = newEntities.findIndex(e => 
          e.position.x === result.position.x && 
          e.position.y === result.position.y &&
          (e.type === 'stag' || e.type === 'hare')
        );
        
        if (index !== -1) {
          newEntities.splice(index, 1);
          
          // 添加新的猎物
          addNewPrey(newEntities, Math.random() > 0.3 ? 'hare' : 'stag');
        }
      });
      
      return {
        ...prev,
        entities: newEntities,
        score: newScore,
        aiScore: newAiScore,
        round: prev.round + 1,
        gameLog: newGameLog
      };
    });
  };
  
  const moveRandomly = (entity: Entity) => {
    const { width, height } = gridSize;
    const moveProbability = entity.type === 'stag' ? 0.4 : 0.3; // 鹿比兔子移动概率高
    
    if (Math.random() < moveProbability) {
      const dx = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      const dy = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      
      const newX = Math.max(0, Math.min(width - 1, entity.position.x + dx));
      const newY = Math.max(0, Math.min(height - 1, entity.position.y + dy));
      
      entity.position = { x: newX, y: newY };
    }
  };
  
  const movePlayer = (dx: number, dy: number) => {
    setGameState(prev => {
      const newEntities = [...prev.entities];
      const playerEntity = newEntities.find(e => e.type === 'player');
      
      if (playerEntity) {
        const { width, height } = gridSize;
        const newX = Math.max(0, Math.min(width - 1, playerEntity.position.x + dx));
        const newY = Math.max(0, Math.min(height - 1, playerEntity.position.y + dy));
        
        playerEntity.position = { x: newX, y: newY };
        
        // 发送玩家移动标记
        sendSyncMarker('player_move', {
          from: { x: playerEntity.position.x - dx, y: playerEntity.position.y - dy },
          to: playerEntity.position,
          round: prev.round
        });
      }
      
      return { ...prev, entities: newEntities };
    });
  };
  
  const moveAi = (aiEntity: Entity, playerEntity: Entity, entities: Entity[]) => {
    // 根据AI策略决定行动
    let targetEntity: Entity | null = null;
    
    // 获取所有猎物
    const stagEntities = entities.filter(e => e.type === 'stag');
    const hareEntities = entities.filter(e => e.type === 'hare');
    
    // 根据配置的AI策略和当前游戏状态决定目标
    switch (config.aiStrategy) {
      case 'cooperative':
        // 合作型AI优先选择离玩家最近的鹿
        if (stagEntities.length > 0) {
          targetEntity = findClosestEntity(aiEntity.position, stagEntities);
          aiEntity.strategy = 'stag';
        } else {
          targetEntity = findClosestEntity(aiEntity.position, hareEntities);
          aiEntity.strategy = 'hare';
        }
        break;
        
      case 'competitive':
        // 竞争型AI优先选择兔子
        if (hareEntities.length > 0) {
          targetEntity = findClosestEntity(aiEntity.position, hareEntities);
          aiEntity.strategy = 'hare';
        } else {
          targetEntity = findClosestEntity(aiEntity.position, stagEntities);
          aiEntity.strategy = 'stag';
        }
        break;
        
      case 'adaptive':
        // 适应型AI根据玩家行为调整策略
        // 计算玩家与最近的鹿之间的距离
        if (stagEntities.length > 0) {
          const closestStagToPlayer = findClosestEntity(playerEntity.position, stagEntities);
          const distanceToStag = calculateDistance(playerEntity.position, closestStagToPlayer.position);
          
          // 如果玩家靠近鹿（可能在追捕鹿），AI也选择追捕鹿
          if (distanceToStag < 3) {
            targetEntity = closestStagToPlayer;
            aiEntity.strategy = 'stag';
          } else {
            // 否则选择最近的兔子
            if (hareEntities.length > 0) {
              targetEntity = findClosestEntity(aiEntity.position, hareEntities);
              aiEntity.strategy = 'hare';
            } else {
              targetEntity = findClosestEntity(aiEntity.position, stagEntities);
              aiEntity.strategy = 'stag';
            }
          }
        } else if (hareEntities.length > 0) {
          targetEntity = findClosestEntity(aiEntity.position, hareEntities);
          aiEntity.strategy = 'hare';
        }
        break;
    }
    
    // 如果找到目标，向目标移动
    if (targetEntity) {
      const dx = targetEntity.position.x > aiEntity.position.x ? 1 : 
                 targetEntity.position.x < aiEntity.position.x ? -1 : 0;
      const dy = targetEntity.position.y > aiEntity.position.y ? 1 : 
                 targetEntity.position.y < aiEntity.position.y ? -1 : 0;
      
      const { width, height } = gridSize;
      const newX = Math.max(0, Math.min(width - 1, aiEntity.position.x + dx));
      const newY = Math.max(0, Math.min(height - 1, aiEntity.position.y + dy));
      
      aiEntity.position = { x: newX, y: newY };
      aiEntity.target = targetEntity.position;
    }
  };
  
  const findClosestEntity = (position: { x: number; y: number }, entities: Entity[]): Entity => {
    let closestEntity = entities[0];
    let minDistance = calculateDistance(position, entities[0].position);
    
    for (let i = 1; i < entities.length; i++) {
      const distance = calculateDistance(position, entities[i].position);
      if (distance < minDistance) {
        minDistance = distance;
        closestEntity = entities[i];
      }
    }
    
    return closestEntity;
  };
  
  const calculateDistance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }): number => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
  };
  
  const checkCaptures = (entities: Entity[]): { type: 'stag' | 'hare', position: { x: number; y: number }, capturedBy?: 'player' | 'ai' }[] => {
    const results: { type: 'stag' | 'hare', position: { x: number; y: number }, capturedBy?: 'player' | 'ai' }[] = [];
    const playerEntity = entities.find(e => e.type === 'player');
    const aiEntity = entities.find(e => e.type === 'ai');
    
    if (!playerEntity || !aiEntity) return results;
    
    // 检查兔子捕获（单人可捕获）
    entities.forEach(entity => {
      if (entity.type === 'hare') {
        // 玩家捕获兔子
        if (entity.position.x === playerEntity.position.x && entity.position.y === playerEntity.position.y) {
          results.push({
            type: 'hare',
            position: { ...entity.position },
            capturedBy: 'player'
          });
        }
        // AI捕获兔子
        else if (entity.position.x === aiEntity.position.x && entity.position.y === aiEntity.position.y) {
          results.push({
            type: 'hare',
            position: { ...entity.position },
            capturedBy: 'ai'
          });
        }
      }
    });
    
    // 检查鹿捕获（需要玩家和AI合作）
    entities.forEach(entity => {
      if (entity.type === 'stag') {
        const playerDistance = calculateDistance(playerEntity.position, entity.position);
        const aiDistance = calculateDistance(aiEntity.position, entity.position);
        
        // 如果玩家和AI都在鹿的相邻位置，则捕获成功
        if (playerDistance <= 1 && aiDistance <= 1) {
          results.push({
            type: 'stag',
            position: { ...entity.position }
          });
        }
      }
    });
    
    return results;
  };
  
  const generateAiThought = async () => {
    try {
      // 获取当前游戏状态
      const player = gameState.entities.find(e => e.type === 'player');
      const ai = gameState.entities.find(e => e.type === 'ai');
      const stags = gameState.entities.filter(e => e.type === 'stag');
      const hares = gameState.entities.filter(e => e.type === 'hare');
      
      // 构建提示
      const prompt = `当前游戏状态：
- 回合：${gameState.round}
- 玩家位置：(${player?.position.x}, ${player?.position.y})
- AI位置：(${ai?.position.x}, ${ai?.position.y})
- 鹿的数量：${stags.length}，位置：${stags.map(s => `(${s.position.x}, ${s.position.y})`).join(', ')}
- 兔子的数量：${hares.length}，位置：${hares.map(h => `(${h.position.x}, ${h.position.y})`).join(', ')}
- 玩家得分：${gameState.score}
- AI得分：${gameState.aiScore}

基于当前状态，你作为AI猎人的想法是什么？请简短回答（30-50字）。`;

      // 调用LLM API
      const thought = await callLLMAPI(prompt);
      
      // 添加AI思考
      const newThought: AiThought = {
        id: `thought-${Date.now()}`,
        timestamp: Date.now(),
        content: thought,
        confidence: 0.8 + Math.random() * 0.2 // 随机生成0.8-1.0的置信度
      };
      
      setGameState(prev => ({
        ...prev,
        aiThoughts: [...prev.aiThoughts, newThought]
      }));
      
      // 发送AI思考标记
      sendSyncMarker('ai_thought', {
        thoughtId: newThought.id,
        content: thought,
        confidence: newThought.confidence,
        round: gameState.round
      });
      
    } catch (error) {
      console.error('生成AI思考失败:', error);
      // 失败时使用模板生成
      generateTemplateAiThought();
    }
  };
  
  const generateTemplateAiThought = () => {
    const ai = gameState.entities.find(e => e.type === 'ai');
    const player = gameState.entities.find(e => e.type === 'player');
    
    if (!ai || !ai.strategy) return;
    
    const thoughts = {
      stag: [
        "玩家似乎在靠近鹿，我应该配合追捕以获得更高奖励。",
        "合作捕鹿是最优策略，我将继续向鹿移动。",
        "玩家行为表明有合作意向，我们应该共同追捕鹿。",
        "鹿的位置很有利，如果玩家配合，我们可以成功捕获。"
      ],
      hare: [
        "玩家距离较远，独自捕兔更有效率。",
        "玩家行为不稳定，选择独立捕兔更为保险。",
        "当前局势下，追捕兔子能确保稳定得分。",
        "玩家可能不会合作，我应该专注于自己的得分。"
      ],
      unknown: [
        "需要观察玩家行为模式，确定最佳策略。",
        "局势不明朗，暂时保持灵活应对。",
        "分析玩家移动路径，推测其意图。",
        "环境中猎物分布复杂，需要权衡风险与收益。"
      ]
    };
    
    // 根据AI当前策略选择思考内容
    const thoughtList = thoughts[ai.strategy];
    const thought = thoughtList[Math.floor(Math.random() * thoughtList.length)];
    
    // 计算与玩家的距离，影响置信度
    const distance = player ? calculateDistance(ai.position, player.position) : 5;
    const confidence = Math.max(0.5, Math.min(0.9, 1 - distance / 10));
    
    const newThought: AiThought = {
      id: `thought-${Date.now()}`,
      timestamp: Date.now(),
      content: thought,
      confidence
    };
    
    setGameState(prev => ({
      ...prev,
      aiThoughts: [...prev.aiThoughts, newThought]
    }));
    
    // 发送AI思考标记
    sendSyncMarker('ai_thought', {
      thoughtId: newThought.id,
      content: thought,
      confidence,
      round: gameState.round,
      isTemplateGenerated: true
    });
  };
  
  const callLLMAPI = async (prompt: string): Promise<string> => {
    const { provider, model, apiKey, baseUrl, systemPrompt } = config.llmConfig;
    
    let apiUrl = '';
    let requestBody = {};
    let headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    switch (provider) {
      case 'openai':
        apiUrl = baseUrl || 'https://api.openai.com/v1/chat/completions';
        requestBody = {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 100,
          temperature: 0.7
        };
        break;
      case 'anthropic':
        apiUrl = baseUrl || 'https://api.anthropic.com/v1/messages';
        requestBody = {
          model,
          max_tokens: 100,
          messages: [{ role: 'user', content: prompt }],
          system: systemPrompt
        };
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        };
        break;
      case 'google':
        apiUrl = baseUrl || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        requestBody = {
          contents: [{
            parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
          }],
          generationConfig: {
            maxOutputTokens: 100,
            temperature: 0.7
          }
        };
        // No auth header needed for Google (API key in URL)
        headers = { 'Content-Type': 'application/json' };
        break;
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract content based on provider
      let content = '';
      switch (provider) {
        case 'openai':
          content = data.choices[0]?.message?.content || '';
          break;
        case 'anthropic':
          content = data.content[0]?.text || '';
          break;
        case 'google':
          content = data.candidates[0]?.content?.parts[0]?.text || '';
          break;
        default:
          content = 'API响应解析失败';
      }
      
      return content;
    } catch (error) {
      console.error('LLM API call failed:', error);
      throw error;
    }
  };
  
  const togglePause = () => {
    setIsPaused(prev => !prev);
    
    // 发送暂停切换标记
    sendSyncMarker('game_pause_toggle', {
      isPaused: !isPaused,
      gameTime: config.duration * 60 - gameState.timeLeft
    });
  };
  
  const endGame = () => {
    // 清除定时器
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (aiThinkingRef.current) clearInterval(aiThinkingRef.current);
    
    // 计算结果
    const stagsHunted = gameState.gameLog.filter(log => 
      log.message.includes('成功合作捕获了鹿')
    ).length;
    
    const haresHunted = gameState.gameLog.filter(log => 
      log.message.includes('你捕获了兔子')
    ).length;
    
    const aiHaresHunted = gameState.gameLog.filter(log => 
      log.message.includes('AI捕获了兔子')
    ).length;
    
    const totalHunts = stagsHunted + haresHunted + aiHaresHunted;
    const cooperationRate = totalHunts > 0 ? stagsHunted / totalHunts : 0;
    
    const results = {
      totalScore: gameState.score,
      aiScore: gameState.aiScore,
      stagsHunted,
      haresHunted,
      aiHaresHunted,
      cooperationRate,
      totalRounds: gameState.round,
      gameLog: gameState.gameLog,
      aiThoughts: gameState.aiThoughts
    };
    
    // 发送游戏结束标记
    sendSyncMarker('game_end', {
      results,
      gameTime: config.duration * 60 - gameState.timeLeft
    });
    
    // 通知父组件
    onComplete(results);
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const getEntityColor = (type: string): string => {
    switch (type) {
      case 'player': return 'bg-blue-500';
      case 'ai': return 'bg-green-500';
      case 'stag': return 'bg-red-500';
      case 'hare': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'player': return <div className="text-white font-bold">P</div>;
      case 'ai': return <div className="text-white font-bold">A</div>;
      case 'stag': return <Deer className="w-5 h-5 text-white" />;
      case 'hare': return <Rabbit className="w-5 h-5 text-white" />;
      default: return null;
    }
  };
  
  const getLogTypeStyles = (type: string): string => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="text" onClick={onBack} className="text-white mr-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            退出实验
          </Button>
          <div className="flex items-center">
            <Deer className="w-5 h-5 mr-2" />
            <h1 className="text-lg font-bold">猎鹿任务</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span className="font-mono">{formatTime(gameState.timeLeft)}</span>
          </div>
          
          <button 
            onClick={togglePause}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            {isPaused ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-13rem)]">
        {/* Left Panel - Game Grid */}
        <div className="w-2/3 flex flex-col border-r border-gray-200">
          {/* Game Grid */}
          <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
            <div 
              className="grid gap-1 bg-white p-2 rounded-lg shadow-inner"
              style={{ 
                gridTemplateColumns: `repeat(${gridSize.width}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${gridSize.height}, ${cellSize}px)`
              }}
            >
              {Array.from({ length: gridSize.width * gridSize.height }).map((_, index) => {
                const x = index % gridSize.width;
                const y = Math.floor(index / gridSize.width);
                
                // 查找此位置的实体
                const entity = gameState.entities.find(e => 
                  e.position.x === x && e.position.y === y
                );
                
                return (
                  <div 
                    key={index}
                    className={`w-full h-full rounded border border-gray-200 flex items-center justify-center ${
                      entity ? getEntityColor(entity.type) : 'bg-gray-100'
                    }`}
                    style={{ width: cellSize, height: cellSize }}
                  >
                    {entity && getEntityIcon(entity.type)}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Controls */}
          <div className="p-4 bg-gray-100 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <div className="bg-white px-3 py-2 rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-700">玩家得分:</span>
                  <span className="ml-2 text-lg font-bold text-blue-600">{gameState.score}</span>
                </div>
                <div className="bg-white px-3 py-2 rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-700">AI得分:</span>
                  <span className="ml-2 text-lg font-bold text-green-600">{gameState.aiScore}</span>
                </div>
                <div className="bg-white px-3 py-2 rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-700">回合:</span>
                  <span className="ml-2 text-lg font-bold text-gray-900">{gameState.round}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-1 w-32">
                <div className="col-start-2">
                  <button 
                    onClick={() => setPlayerMove({ dx: 0, dy: -1 })}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
                    disabled={isPaused}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                </div>
                <div className="col-start-1 row-start-2">
                  <button 
                    onClick={() => setPlayerMove({ dx: -1, dy: 0 })}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
                    disabled={isPaused}
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="col-start-2 row-start-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
                <div className="col-start-3 row-start-2">
                  <button 
                    onClick={() => setPlayerMove({ dx: 1, dy: 0 })}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
                    disabled={isPaused}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
                <div className="col-start-2 row-start-3">
                  <button 
                    onClick={() => setPlayerMove({ dx: 0, dy: 1 })}
                    className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
                    disabled={isPaused}
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Panel - Game Log and AI Thoughts */}
        <div className="w-1/3 flex flex-col">
          {/* Game Log */}
          <div className="h-1/2 border-b border-gray-200">
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium text-gray-700 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                游戏日志
              </h3>
            </div>
            
            <div className="h-full overflow-y-auto p-2">
              <div className="space-y-2">
                {gameState.gameLog.slice().reverse().map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-2 rounded-lg border ${getLogTypeStyles(log.type)}`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm">{log.message}</p>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          
          {/* AI Thoughts */}
          <div className="h-1/2">
            <div className="flex justify-between items-center p-2 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium text-gray-700 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                AI思考过程
              </h3>
              <button 
                onClick={() => setShowAiThoughts(!showAiThoughts)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                {showAiThoughts ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
            
            <AnimatePresence>
              {showAiThoughts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="h-full overflow-y-auto p-2">
                    <div className="space-y-2">
                      {gameState.aiThoughts.slice().reverse().map((thought) => (
                        <motion.div
                          key={thought.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-green-50 border border-green-200 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <Brain className="w-4 h-4 text-green-600 mr-2" />
                              <h4 className="font-medium text-green-800">AI思考</h4>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(thought.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          <p className="mt-2 text-sm text-gray-700">{thought.content}</p>
                          
                          <div className="mt-2 flex items-center">
                            <div className="text-xs text-gray-500">置信度:</div>
                            <div className="ml-2 w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500"
                                style={{ width: `${thought.confidence * 100}%` }}
                              ></div>
                            </div>
                            <span className="ml-1 text-xs text-gray-500">
                              {Math.round(thought.confidence * 100)}%
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      
                      {gameState.aiThoughts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          AI尚未产生思考
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">设置</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={showAiThoughts}
                      onChange={() => setShowAiThoughts(!showAiThoughts)}
                      className="mr-2"
                    />
                    显示AI思考过程
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    网格单元大小
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="60"
                    step="5"
                    value={cellSize}
                    onChange={(e) => setCellSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>小</span>
                    <span>大</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="w-full mb-2"
                    onClick={() => {
                      // 导出游戏数据
                      const gameData = {
                        config,
                        gameState,
                        timestamp: Date.now()
                      };
                      
                      const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `stag-hunt-game-data-${Date.now()}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      // 发送数据导出标记
                      sendSyncMarker('data_export', {
                        gameTime: config.duration * 60 - gameState.timeLeft,
                        score: gameState.score,
                        aiScore: gameState.aiScore,
                        round: gameState.round
                      });
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    导出实验数据
                  </Button>
                  
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      setShowSettings(false);
                      endGame();
                    }}
                  >
                    结束实验
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameInterface;