import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, PauseCircle, PlayCircle, Settings } from 'lucide-react';
import Button from '../../components/Button';
import { ExperimentConfig } from './index';
import { usePhysiologicalSync } from '../../components/PhysiologicalSyncContext';
import { GameState, Entity, AiThought, GameLogEntry } from './types';
import { getGridDimensions, addNewPrey, moveRandomly, checkCaptures } from './utils/gameUtils';
import { moveAi, generateTemplateAiThought, buildLLMPrompt } from './utils/aiUtils';
import { callLLMAPI } from './utils/llmService';
import GameGrid from './components/GameGrid';
import ControlPanel from './components/ControlPanel';
import GameLog from './components/GameLog';
import AiThoughtPanel from './components/AiThoughtPanel';
import SettingsModal from './components/SettingsModal';

interface GameInterfaceProps {
  config: ExperimentConfig;
  onComplete: (results: any) => void;
  onBack: () => void;
}

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
  
  const [isPaused, setIsPaused] = useState(true); // Start paused
  const [showSettings, setShowSettings] = useState(false);
  const [showAiThoughts, setShowAiThoughts] = useState(true);
  const [gridSize, setGridSize] = useState(getGridDimensions(config.gridSize));
  const [cellSize, setCellSize] = useState(40);
  const [playerMove, setPlayerMove] = useState<{ dx: number; dy: number } | null>(null);
  const [gameInitialized, setGameInitialized] = useState(false);
  
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const aiThinkingRef = useRef<NodeJS.Timeout | null>(null);
  const { sendSyncMarker } = usePhysiologicalSync();
  
  // 初始化游戏
  useEffect(() => {
    initializeGame();
    
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
      if (isPaused) {
        if (e.code === 'Space' && gameInitialized) {
          startGame();
        }
        return;
      }
      
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
  }, [isPaused, gameInitialized]);
  
  // 处理玩家移动
  useEffect(() => {
    if (playerMove && !isPaused) {
      movePlayer(playerMove.dx, playerMove.dy);
      setPlayerMove(null);
    }
  }, [playerMove]);
  
  const initializeGame = () => {
    const initialEntities: Entity[] = [];
    
    // 添加玩家
    initialEntities.push({
      id: 'player',
      type: 'player',
      position: { x: Math.floor(gridSize.width / 4), y: Math.floor(gridSize.height / 2) }
    });
    
    // 添加AI
    initialEntities.push({
      id: 'ai',
      type: 'ai',
      position: { x: Math.floor(gridSize.width * 3 / 4), y: Math.floor(gridSize.height / 2) },
      strategy: 'unknown'
    });
    
    // 添加猎物
    addNewPrey(initialEntities, 'stag', gridSize);
    addNewPrey(initialEntities, 'hare', gridSize);
    addNewPrey(initialEntities, 'hare', gridSize);
    
    setGameState(prev => ({
      ...prev,
      entities: initialEntities,
      gameLog: [
        {
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          message: '游戏已准备就绪！点击"开始游戏"按钮或按空格键开始。',
          type: 'info'
        }
      ]
    }));
    
    // 发送初始化标记
    sendSyncMarker('game_initialized', {
      gridSize,
      initialEntities: initialEntities.length
    });
    
    setGameInitialized(true);
  };
  
  const startGame = () => {
    if (!gameInitialized) return;
    
    setIsPaused(false);
    startGameTimer();
    startGameLoop();
    startAiThinking();
    
    setGameState(prev => ({
      ...prev,
      gameLog: [
        ...prev.gameLog,
        {
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          message: '游戏开始！使用方向键移动，与AI合作捕获猎物。',
          type: 'info'
        }
      ]
    }));
    
    // 发送游戏开始标记
    sendSyncMarker('game_started', {
      timestamp: Date.now()
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
      if (!isPaused) {
        generateAiThought();
      }
    }, 5000 + Math.random() * 5000);
  };
  
  const updateGameState = () => {
    setGameState(prev => {
      const newEntities = [...prev.entities];
      
      // 移动猎物
      newEntities.forEach(entity => {
        if (entity.type === 'stag' || entity.type === 'hare') {
          moveRandomly(entity, gridSize);
        }
      });
      
      // 移动AI
      const aiEntity = newEntities.find(e => e.type === 'ai');
      const playerEntity = newEntities.find(e => e.type === 'player');
      
      if (aiEntity && playerEntity) {
        moveAi(aiEntity, playerEntity, newEntities, config.aiStrategy, gridSize);
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
          addNewPrey(newEntities, Math.random() > 0.3 ? 'hare' : 'stag', gridSize);
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
  
  const movePlayer = (dx: number, dy: number) => {
    setGameState(prev => {
      const newEntities = [...prev.entities];
      const playerEntity = newEntities.find(e => e.type === 'player');
      
      if (playerEntity) {
        const newX = Math.max(0, Math.min(gridSize.width - 1, playerEntity.position.x + dx));
        const newY = Math.max(0, Math.min(gridSize.height - 1, playerEntity.position.y + dy));
        
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
  
  const generateAiThought = async () => {
    // 检查是否有有效的API密钥
    if (!config.llmConfig.apiKey || config.llmConfig.apiKey.trim() === '') {
      // 如果没有API密钥，直接使用模板生成
      generateTemplateAiThought();
      return;
    }

    try {
      // 构建提示
      const prompt = buildLLMPrompt(
        gameState.entities, 
        gameState.round, 
        gameState.score, 
        gameState.aiScore
      );

      // 调用LLM API
      const thought = await callLLMAPI(
        prompt,
        config.llmConfig.provider,
        config.llmConfig.model,
        config.llmConfig.apiKey,
        config.llmConfig.baseUrl,
        config.llmConfig.systemPrompt
      );
      
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
      // 静默处理错误，不在控制台显示错误信息
      // 直接使用模板生成思考
      generateTemplateAiThought();
    }
  };
  
  const generateTemplateAiThought = () => {
    const ai = gameState.entities.find(e => e.type === 'ai');
    const player = gameState.entities.find(e => e.type === 'player');
    
    if (!ai) return;
    
    const { content, confidence } = generateTemplateAiThought(ai, player, gameState.round);
    
    const newThought: AiThought = {
      id: `thought-${Date.now()}`,
      timestamp: Date.now(),
      content,
      confidence
    };
    
    setGameState(prev => ({
      ...prev,
      aiThoughts: [...prev.aiThoughts, newThought]
    }));
    
    // 发送AI思考标记
    sendSyncMarker('ai_thought', {
      thoughtId: newThought.id,
      content,
      confidence,
      round: gameState.round,
      isTemplateGenerated: true
    });
  };
  
  const togglePause = () => {
    if (!gameInitialized) {
      startGame();
      return;
    }
    
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
  
  const handleExportData = () => {
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
          <GameGrid 
            entities={gameState.entities}
            gridSize={gridSize}
            cellSize={cellSize}
            isPaused={isPaused}
          />
          
          {/* Controls */}
          <ControlPanel 
            score={gameState.score}
            aiScore={gameState.aiScore}
            round={gameState.round}
            isPaused={isPaused}
            onMove={(dx, dy) => setPlayerMove({ dx, dy })}
          />
        </div>
        
        {/* Right Panel - Game Log and AI Thoughts */}
        <div className="w-1/3 flex flex-col">
          {/* Game Log */}
          <GameLog logs={gameState.gameLog} />
          
          {/* AI Thoughts */}
          <AiThoughtPanel 
            thoughts={gameState.aiThoughts}
            showThoughts={showAiThoughts}
            onToggleThoughts={() => setShowAiThoughts(!showAiThoughts)}
          />
        </div>
      </div>
      
      {/* Settings Modal */}
      <AnimatePresence>
        <SettingsModal 
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onExportData={handleExportData}
          onEndGame={() => {
            setShowSettings(false);
            endGame();
          }}
          showAiThoughts={showAiThoughts}
          onToggleAiThoughts={() => setShowAiThoughts(!showAiThoughts)}
          cellSize={cellSize}
          onCellSizeChange={setCellSize}
          config={config}
          gameState={gameState}
        />
      </AnimatePresence>
    </div>
  );
};

// Import missing components
import { formatTime } from './utils/gameUtils';
import { Beer as Deer } from 'lucide-react';

export default GameInterface;