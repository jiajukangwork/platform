import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, Zap, Users, Target, AlertTriangle } from 'lucide-react';
import Button from '../components/Button';
import { Link } from 'react-router-dom';
import { usePhysiologicalSync } from '../components/PhysiologicalSyncContext';
import PhysiologicalSync from '../components/PhysiologicalSync';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';

interface Position {
  x: number;
  y: number;
}

interface Player {
  position: Position;
  velocity: Position;
  size: number;
  role: 'predator' | 'prey';
}

interface RoundData {
  round: number;
  role: 'predator' | 'prey';
  duration: number;
  success: boolean;
  averageDistance: number;
  reactionTime: number;
  stimulationEvents: number;
  timestamp: number;
}

interface GameResults {
  totalRounds: number;
  predatorRounds: number;
  preyRounds: number;
  predatorSuccessRate: number;
  preySuccessRate: number;
  averageReactionTime: number;
  totalStimulations: number;
  rounds: RoundData[];
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const ROUND_DURATION = 30; // seconds
const TOTAL_ROUNDS = 10;
const PLAYER_SPEED = 3;
const AI_SPEED = 2.5;

const ReactionPredatorPrey = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [currentRound, setCurrentRound] = useState(0);
  const [roundTime, setRoundTime] = useState(ROUND_DURATION);
  const [player, setPlayer] = useState<Player>({
    position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    velocity: { x: 0, y: 0 },
    size: 20,
    role: 'prey'
  });
  const [ai, setAi] = useState<Player>({
    position: { x: CANVAS_WIDTH / 4, y: CANVAS_HEIGHT / 4 },
    velocity: { x: 0, y: 0 },
    size: 30,
    role: 'predator'
  });
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [stimulationCount, setStimulationCount] = useState(0);
  const [lastStimulation, setLastStimulation] = useState(0);
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [distances, setDistances] = useState<number[]>([]);
  const [showStimulation, setShowStimulation] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const { sendSyncMarker } = usePhysiologicalSync();

  // Initialize game
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        setKeys(prev => new Set(prev).add(e.key.toLowerCase()));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        setKeys(prev => {
          const newKeys = new Set(prev);
          newKeys.delete(e.key.toLowerCase());
          return newKeys;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        updateGame();
      }, 16); // ~60 FPS

      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    }
  }, [gameState, keys]);

  // Round timer
  useEffect(() => {
    if (gameState === 'playing' && roundTime > 0) {
      const timer = setTimeout(() => {
        setRoundTime(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (roundTime === 0) {
      endRound(false); // Time's up, no success
    }
  }, [gameState, roundTime]);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
    startNewRound();
    
    sendSyncMarker('experiment_start', {
      experimentType: 'reaction-predator-prey',
      totalRounds: TOTAL_ROUNDS
    });
  };

  const startNewRound = () => {
    const isPlayerPredator = Math.random() < 0.5;
    
    // Reset positions
    const playerPos = {
      x: Math.random() * (CANVAS_WIDTH - 100) + 50,
      y: Math.random() * (CANVAS_HEIGHT - 100) + 50
    };
    
    let aiPos;
    do {
      aiPos = {
        x: Math.random() * (CANVAS_WIDTH - 100) + 50,
        y: Math.random() * (CANVAS_HEIGHT - 100) + 50
      };
    } while (getDistance(playerPos, aiPos) < 100); // Ensure minimum distance

    setPlayer({
      position: playerPos,
      velocity: { x: 0, y: 0 },
      size: isPlayerPredator ? 35 : 20,
      role: isPlayerPredator ? 'predator' : 'prey'
    });

    setAi({
      position: aiPos,
      velocity: { x: 0, y: 0 },
      size: isPlayerPredator ? 20 : 35,
      role: isPlayerPredator ? 'prey' : 'predator'
    });

    setRoundTime(ROUND_DURATION);
    setRoundStartTime(Date.now());
    setDistances([]);
    setStimulationCount(0);
    
    sendSyncMarker('round_start', {
      round: currentRound + 1,
      playerRole: isPlayerPredator ? 'predator' : 'prey',
      aiRole: isPlayerPredator ? 'prey' : 'predator'
    });
  };

  const updateGame = useCallback(() => {
    // Update player movement based on keys
    let playerVelocity = { x: 0, y: 0 };
    
    if (keys.has('arrowup') || keys.has('w')) playerVelocity.y = -PLAYER_SPEED;
    if (keys.has('arrowdown') || keys.has('s')) playerVelocity.y = PLAYER_SPEED;
    if (keys.has('arrowleft') || keys.has('a')) playerVelocity.x = -PLAYER_SPEED;
    if (keys.has('arrowright') || keys.has('d')) playerVelocity.x = PLAYER_SPEED;

    // Normalize diagonal movement
    if (playerVelocity.x !== 0 && playerVelocity.y !== 0) {
      const factor = Math.sqrt(2) / 2;
      playerVelocity.x *= factor;
      playerVelocity.y *= factor;
    }

    setPlayer(prev => {
      const newPos = {
        x: Math.max(prev.size, Math.min(CANVAS_WIDTH - prev.size, prev.position.x + playerVelocity.x)),
        y: Math.max(prev.size, Math.min(CANVAS_HEIGHT - prev.size, prev.position.y + playerVelocity.y))
      };
      
      return {
        ...prev,
        position: newPos,
        velocity: playerVelocity
      };
    });

    // Update AI movement
    setAi(prev => {
      const target = player.position;
      const dx = target.x - prev.position.x;
      const dy = target.y - prev.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      let aiVelocity = { x: 0, y: 0 };
      
      if (distance > 0) {
        if (prev.role === 'predator') {
          // AI chases player
          aiVelocity.x = (dx / distance) * AI_SPEED;
          aiVelocity.y = (dy / distance) * AI_SPEED;
        } else {
          // AI runs away from player
          aiVelocity.x = -(dx / distance) * AI_SPEED;
          aiVelocity.y = -(dy / distance) * AI_SPEED;
        }
      }
      
      const newPos = {
        x: Math.max(prev.size, Math.min(CANVAS_WIDTH - prev.size, prev.position.x + aiVelocity.x)),
        y: Math.max(prev.size, Math.min(CANVAS_HEIGHT - prev.size, prev.position.y + aiVelocity.y))
      };
      
      return {
        ...prev,
        position: newPos,
        velocity: aiVelocity
      };
    });

    // Check for collision
    const distance = getDistance(player.position, ai.position);
    setDistances(prev => [...prev, distance]);
    
    // Trigger stimulation if predator is close to prey
    const currentTime = Date.now();
    if (distance < 50 && currentTime - lastStimulation > 2000) { // 2 second cooldown
      triggerStimulation();
      setLastStimulation(currentTime);
    }
    
    // Check for capture
    if (distance < (player.size + ai.size) / 2) {
      if (player.role === 'predator') {
        endRound(true); // Player caught AI
      } else {
        endRound(false); // Player was caught
      }
    }

    // Draw game
    drawGame();
  }, [keys, player, ai, lastStimulation]);

  const getDistance = (pos1: Position, pos2: Position): number => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const triggerStimulation = () => {
    setStimulationCount(prev => prev + 1);
    setShowStimulation(true);
    
    // Send stimulation marker
    sendSyncMarker('skin_stimulation', {
      round: currentRound + 1,
      playerRole: player.role,
      distance: getDistance(player.position, ai.position),
      timestamp: Date.now()
    });
    
    // Hide stimulation indicator after 500ms
    setTimeout(() => setShowStimulation(false), 500);
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw border
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw player
    ctx.fillStyle = '#f97316'; // Orange
    ctx.beginPath();
    ctx.arc(player.position.x, player.position.y, player.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw player mouth if predator
    if (player.role === 'predator') {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(player.position.x + player.size * 0.3, player.position.y, player.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw AI
    ctx.fillStyle = '#8b5cf6'; // Purple
    ctx.beginPath();
    ctx.arc(ai.position.x, ai.position.y, ai.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw AI mouth if predator
    if (ai.role === 'predator') {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(ai.position.x + ai.size * 0.3, ai.position.y, ai.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw stimulation effect
    if (showStimulation) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.setLineDash([10, 10]);
      ctx.strokeRect(10, 10, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
      ctx.setLineDash([]);
    }

    // Draw role indicators
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`你的角色: ${player.role === 'predator' ? '攻击者' : '逃跑者'}`, 20, 30);
    ctx.fillText(`时间: ${roundTime}s`, 20, 50);
    ctx.fillText(`回合: ${currentRound + 1}/${TOTAL_ROUNDS}`, 20, 70);
    
    if (stimulationCount > 0) {
      ctx.fillText(`刺激次数: ${stimulationCount}`, 20, 90);
    }
  };

  const endRound = (success: boolean) => {
    const roundEndTime = Date.now();
    const roundDuration = (roundEndTime - roundStartTime) / 1000;
    const averageDistance = distances.length > 0 
      ? distances.reduce((sum, d) => sum + d, 0) / distances.length 
      : 0;

    const newRoundData: RoundData = {
      round: currentRound + 1,
      role: player.role,
      duration: roundDuration,
      success,
      averageDistance,
      reactionTime: roundDuration, // Simplified - could track first movement
      stimulationEvents: stimulationCount,
      timestamp: roundEndTime
    };

    setRoundData(prev => [...prev, newRoundData]);
    
    sendSyncMarker('round_end', {
      round: currentRound + 1,
      role: player.role,
      success,
      duration: roundDuration,
      stimulations: stimulationCount
    });

    if (currentRound + 1 >= TOTAL_ROUNDS) {
      setGameState('finished');
      setTotalTime(Date.now() - (startTime || 0));
      
      sendSyncMarker('experiment_complete', {
        totalRounds: TOTAL_ROUNDS,
        totalStimulations: roundData.reduce((sum, r) => sum + r.stimulationEvents, 0) + stimulationCount
      });
    } else {
      setTimeout(() => {
        setCurrentRound(prev => prev + 1);
        startNewRound();
      }, 2000);
    }
  };

  const resetGame = () => {
    setGameState('instruction');
    setCurrentRound(0);
    setRoundData([]);
    setStartTime(null);
    setTotalTime(null);
    setStimulationCount(0);
    setDistances([]);
    
    sendSyncMarker('experiment_reset', {});
  };

  const exportData = () => {
    const results: GameResults = {
      totalRounds: TOTAL_ROUNDS,
      predatorRounds: roundData.filter(r => r.role === 'predator').length,
      preyRounds: roundData.filter(r => r.role === 'prey').length,
      predatorSuccessRate: roundData.filter(r => r.role === 'predator' && r.success).length / 
        Math.max(1, roundData.filter(r => r.role === 'predator').length),
      preySuccessRate: roundData.filter(r => r.role === 'prey' && r.success).length / 
        Math.max(1, roundData.filter(r => r.role === 'prey').length),
      averageReactionTime: roundData.reduce((sum, r) => sum + r.reactionTime, 0) / roundData.length,
      totalStimulations: roundData.reduce((sum, r) => sum + r.stimulationEvents, 0),
      rounds: roundData
    };

    const data = {
      experimentInfo: {
        name: "Reaction Predator-Prey Experiment",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        ...results
      },
      rounds: roundData.map((r, index) => ({
        ...r,
        timestamp: new Date(r.timestamp).toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reaction-predator-prey-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  const renderResultsAnalysis = () => {
    const roleData = [
      {
        role: '攻击者',
        rounds: roundData.filter(r => r.role === 'predator').length,
        successRate: roundData.filter(r => r.role === 'predator' && r.success).length / 
          Math.max(1, roundData.filter(r => r.role === 'predator').length) * 100,
        avgDuration: roundData.filter(r => r.role === 'predator')
          .reduce((sum, r) => sum + r.duration, 0) / 
          Math.max(1, roundData.filter(r => r.role === 'predator').length)
      },
      {
        role: '逃跑者',
        rounds: roundData.filter(r => r.role === 'prey').length,
        successRate: roundData.filter(r => r.role === 'prey' && r.success).length / 
          Math.max(1, roundData.filter(r => r.role === 'prey').length) * 100,
        avgDuration: roundData.filter(r => r.role === 'prey')
          .reduce((sum, r) => sum + r.duration, 0) / 
          Math.max(1, roundData.filter(r => r.role === 'prey').length)
      }
    ];

    const stimulationData = roundData.map((r, index) => ({
      round: r.round,
      stimulations: r.stimulationEvents,
      role: r.role,
      success: r.success
    }));

    const performanceOverTime = roundData.map((r, index) => ({
      round: r.round,
      reactionTime: r.reactionTime,
      averageDistance: r.averageDistance,
      success: r.success ? 1 : 0
    }));

    const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b'];

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">角色表现对比</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={roleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="successRate" fill="#2563eb" name="成功率 (%)" />
                <Bar dataKey="avgDuration" fill="#10b981" name="平均时长 (秒)" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">皮肤电刺激分析</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="round" name="回合" />
                  <YAxis dataKey="stimulations" name="刺激次数" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter 
                    name="攻击者回合" 
                    data={stimulationData.filter(d => d.role === 'predator')} 
                    fill="#ef4444"
                  />
                  <Scatter 
                    name="逃跑者回合" 
                    data={stimulationData.filter(d => d.role === 'prey')} 
                    fill="#2563eb"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">表现趋势</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="round" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="reactionTime" 
                    stroke="#2563eb" 
                    name="反应时间"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="averageDistance" 
                    stroke="#10b981" 
                    name="平均距离"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="success" 
                    stroke="#ef4444" 
                    name="成功"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">详细统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">总成功率</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((roundData.filter(r => r.success).length / roundData.length) * 100)}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">攻击者成功率</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((roundData.filter(r => r.role === 'predator' && r.success).length / 
                  Math.max(1, roundData.filter(r => r.role === 'predator').length)) * 100)}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">逃跑者成功率</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((roundData.filter(r => r.role === 'prey' && r.success).length / 
                  Math.max(1, roundData.filter(r => r.role === 'prey').length)) * 100)}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">总刺激次数</p>
              <p className="text-xl font-bold text-gray-900">
                {roundData.reduce((sum, r) => sum + r.stimulationEvents, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={exportData}
            className="inline-flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            导出实验数据
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Link
              to="/experiments"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回实验列表
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(true)}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              帮助
            </Button>
          </div>

          {gameState === 'instruction' && (
            <motion.div 
              className="bg-white rounded-xl shadow-sm p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-4 mb-6">
                <Target className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">逃跑实验：攻击者与逃跑者</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加逃跑实验。这是一种反应能力测试，您将在攻击者和逃跑者两种角色之间切换。</p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-6">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <h3 className="text-lg font-medium text-yellow-800">重要提示</h3>
                  </div>
                  <p className="mt-2 text-yellow-700">
                    为了获得更真实且全面的测试体验，我们可能会在测试中使用皮肤电刺激设备，
                    在您手上制造轻微疼痛，模拟被攻击时的感受。
                  </p>
                </div>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>游戏场景位于一个正方形区域内</li>
                  <li>橙色圆圈代表您，紫色圆圈代表对手（AI）</li>
                  <li>您可能扮演两种角色：
                    <ul>
                      <li><strong>攻击者：</strong>您的体型更大且带有一张大嘴，需追上并吃掉对方</li>
                      <li><strong>逃跑者：</strong>对手体型更大且会试图吃掉您，您需尽力逃跑</li>
                    </ul>
                  </li>
                  <li>每回合时长为{ROUND_DURATION}秒</li>
                  <li>实验共有{TOTAL_ROUNDS}轮</li>
                  <li>当攻击者接近逃跑者时，可能会触发皮肤电刺激</li>
                </ul>

                <h3>操作方式：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>使用方向键或WASD键控制移动</li>
                  <li>攻击者：追捕对方获得成功</li>
                  <li>逃跑者：避免被捕获直到时间结束</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>保持注意力集中</li>
                  <li>如感到不适可随时停止实验</li>
                  <li>实验过程中会记录您的反应时间和移动轨迹</li>
                </ul>
              </div>

              <Button 
                variant="primary"
                className="mt-8 w-full"
                onClick={startGame}
              >
                开始实验
              </Button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">当前回合</p>
                  <p className="text-2xl font-bold text-primary-600">{currentRound + 1} / {TOTAL_ROUNDS}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">剩余时间</p>
                  <p className="text-2xl font-bold text-red-600">{roundTime}秒</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">当前角色</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {player.role === 'predator' ? '攻击者' : '逃跑者'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">刺激次数</p>
                  <p className="text-2xl font-bold text-yellow-600">{stimulationCount}</p>
                </div>
              </div>

              <motion.div
                className="bg-white rounded-xl shadow-sm p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {player.role === 'predator' ? '追捕对手！' : '逃避追捕！'}
                  </h2>
                  <p className="text-gray-600">
                    使用方向键或WASD键移动
                  </p>
                </div>

                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="border-2 border-gray-300 rounded-lg"
                  />
                </div>

                {/* Stimulation indicator */}
                <AnimatePresence>
                  {showStimulation && (
                    <motion.div
                      className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <div className="flex items-center justify-center">
                        <Zap className="w-5 h-5 text-red-600 mr-2" />
                        <span className="text-red-800 font-medium">皮肤电刺激触发</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-6 text-center text-sm text-gray-600">
                  <p>橙色圆圈：您 | 紫色圆圈：AI对手</p>
                  <p>大圆圈带嘴：攻击者 | 小圆圈：逃跑者</p>
                </div>
              </motion.div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={resetGame}
                >
                  重新开始
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowHelp(true)}
                >
                  查看说明
                </Button>
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <motion.div 
              className="bg-white rounded-xl shadow-sm p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-6">实验结束</h1>
              
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-primary-600" />
                      <p className="text-lg font-medium text-gray-900">完成时间</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {totalTime ? formatTime(totalTime) : '--'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      平均每轮 {totalTime ? Math.round(totalTime / TOTAL_ROUNDS / 1000) : '--'} 秒
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart className="w-5 h-5 text-primary-600" />
                      <p className="text-lg font-medium text-gray-900">总成功率</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {Math.round((roundData.filter(r => r.success).length / roundData.length) * 100)}%
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      成功完成 {roundData.filter(r => r.success).length} / {roundData.length} 轮
                    </p>
                  </div>
                </div>

                {renderResultsAnalysis()}

                <div className="flex space-x-4">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={resetGame}
                  >
                    再试一次
                  </Button>
                  <Button 
                    variant="primary"
                    className="flex-1"
                    href="/experiments"
                  >
                    返回实验列表
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 max-w-lg w-full"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">实验说明</h3>
              <div className="prose prose-gray">
                <p>在这个实验中，您需要：</p>
                <ul>
                  <li>根据分配的角色进行游戏：
                    <ul>
                      <li><strong>攻击者：</strong>追捕并接触对手以获得成功</li>
                      <li><strong>逃跑者：</strong>避免被对手接触，坚持到时间结束</li>
                    </ul>
                  </li>
                  <li>使用方向键或WASD键控制移动</li>
                  <li>注意皮肤电刺激可能在接近时触发</li>
                  <li>每轮角色可能会随机分配</li>
                </ul>
                <p>提示：保持专注，快速反应是成功的关键。</p>
              </div>
              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={() => setShowHelp(false)}
              >
                我知道了
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 生理信号同步组件 */}
      <PhysiologicalSync 
        experimentId="reaction-predator-prey"
        participantId={`participant-${Date.now()}`}
        onSyncEvent={(eventType, timestamp, metadata) => {
          console.log(`Sync event: ${eventType} at ${timestamp}`, metadata);
        }}
      />
    </div>
  );
};

export default ReactionPredatorPrey;