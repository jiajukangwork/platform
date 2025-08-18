import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, Zap, Users, Target, AlertTriangle, Play, Pause, RotateCcw } from 'lucide-react';
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
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
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
  health: number;
  energy: number;
  speed: number;
}

interface RoundData {
  round: number;
  role: 'predator' | 'prey';
  duration: number;
  success: boolean;
  averageDistance: number;
  minDistance: number;
  reactionTime: number;
  stimulationEvents: number;
  movementDistance: number;
  energyUsed: number;
  escapeAttempts: number;
  catchAttempts: number;
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
  totalMovementDistance: number;
  averageEscapeTime: number;
  averageCatchTime: number;
  rounds: RoundData[];
}

interface GameSettings {
  enableStimulation: boolean;
  stimulationIntensity: number;
  roundDuration: number;
  playerSpeed: number;
  aiSpeed: number;
  stimulationThreshold: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const DEFAULT_ROUND_DURATION = 30; // seconds
const TOTAL_ROUNDS = 12;
const DEFAULT_PLAYER_SPEED = 4;
const DEFAULT_AI_SPEED = 3;
const ENERGY_DECAY_RATE = 0.5; // Energy lost per second
const SPEED_BOOST_COST = 2; // Energy cost for speed boost

const ReactionPredatorPrey = () => {
  const [gameState, setGameState] = useState<'instruction' | 'settings' | 'playing' | 'paused' | 'finished'>('instruction');
  const [currentRound, setCurrentRound] = useState(0);
  const [roundTime, setRoundTime] = useState(DEFAULT_ROUND_DURATION);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    enableStimulation: true,
    stimulationIntensity: 3,
    roundDuration: DEFAULT_ROUND_DURATION,
    playerSpeed: DEFAULT_PLAYER_SPEED,
    aiSpeed: DEFAULT_AI_SPEED,
    stimulationThreshold: 80
  });
  
  const [player, setPlayer] = useState<Player>({
    position: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
    velocity: { x: 0, y: 0 },
    size: 25,
    role: 'prey',
    health: 100,
    energy: 100,
    speed: DEFAULT_PLAYER_SPEED
  });
  
  const [ai, setAi] = useState<Player>({
    position: { x: CANVAS_WIDTH / 4, y: CANVAS_HEIGHT / 4 },
    velocity: { x: 0, y: 0 },
    size: 35,
    role: 'predator',
    health: 100,
    energy: 100,
    speed: DEFAULT_AI_SPEED
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
  const [movementPath, setMovementPath] = useState<Position[]>([]);
  const [escapeAttempts, setEscapeAttempts] = useState(0);
  const [catchAttempts, setCatchAttempts] = useState(0);
  const [isSpeedBoosting, setIsSpeedBoosting] = useState(false);
  const [showRoundTransition, setShowRoundTransition] = useState(false);
  const [roundResult, setRoundResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef<number>(0);
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
        
        // Speed boost with shift key
        if (e.key === 'Shift' && player.energy > 20) {
          setIsSpeedBoosting(true);
        }
        
        // Record first movement as reaction time
        if (!lastUpdateTime.current && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
          lastUpdateTime.current = Date.now();
        }
      }
      
      // Pause/resume with space
      if (e.key === ' ' && (gameState === 'playing' || gameState === 'paused')) {
        e.preventDefault();
        togglePause();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        setKeys(prev => {
          const newKeys = new Set(prev);
          newKeys.delete(e.key.toLowerCase());
          return newKeys;
        });
        
        if (e.key === 'Shift') {
          setIsSpeedBoosting(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, player.energy]);

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const gameLoop = () => {
        updateGame();
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      };
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      
      // Timer for round countdown
      gameLoopRef.current = setInterval(() => {
        setRoundTime(prev => {
          if (prev <= 1) {
            endRound(player.role === 'prey'); // Prey wins if time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    }
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
    startNewRound();
    
    sendSyncMarker('experiment_start', {
      experimentType: 'reaction-predator-prey',
      totalRounds: TOTAL_ROUNDS,
      settings: gameSettings
    });
  };

  const startNewRound = () => {
    const isPlayerPredator = Math.random() < 0.5;
    
    // Reset positions with safe distance
    const playerPos = {
      x: Math.random() * (CANVAS_WIDTH - 200) + 100,
      y: Math.random() * (CANVAS_HEIGHT - 200) + 100
    };
    
    let aiPos;
    do {
      aiPos = {
        x: Math.random() * (CANVAS_WIDTH - 200) + 100,
        y: Math.random() * (CANVAS_HEIGHT - 200) + 100
      };
    } while (getDistance(playerPos, aiPos) < 150); // Ensure minimum distance

    setPlayer({
      position: playerPos,
      velocity: { x: 0, y: 0 },
      size: isPlayerPredator ? 35 : 25,
      role: isPlayerPredator ? 'predator' : 'prey',
      health: 100,
      energy: 100,
      speed: gameSettings.playerSpeed
    });

    setAi({
      position: aiPos,
      velocity: { x: 0, y: 0 },
      size: isPlayerPredator ? 25 : 35,
      role: isPlayerPredator ? 'prey' : 'predator',
      health: 100,
      energy: 100,
      speed: gameSettings.aiSpeed
    });

    setRoundTime(gameSettings.roundDuration);
    setRoundStartTime(Date.now());
    setDistances([]);
    setMovementPath([playerPos]);
    setStimulationCount(0);
    setEscapeAttempts(0);
    setCatchAttempts(0);
    setIsSpeedBoosting(false);
    lastUpdateTime.current = 0;
    
    sendSyncMarker('round_start', {
      round: currentRound + 1,
      playerRole: isPlayerPredator ? 'predator' : 'prey',
      aiRole: isPlayerPredator ? 'prey' : 'predator',
      initialDistance: getDistance(playerPos, aiPos)
    });
  };

  const updateGame = useCallback(() => {
    const deltaTime = 1/60; // 60 FPS
    
    // Update player movement based on keys
    let playerVelocity = { x: 0, y: 0 };
    let isMoving = false;
    
    if (keys.has('arrowup') || keys.has('w')) {
      playerVelocity.y = -1;
      isMoving = true;
    }
    if (keys.has('arrowdown') || keys.has('s')) {
      playerVelocity.y = 1;
      isMoving = true;
    }
    if (keys.has('arrowleft') || keys.has('a')) {
      playerVelocity.x = -1;
      isMoving = true;
    }
    if (keys.has('arrowright') || keys.has('d')) {
      playerVelocity.x = 1;
      isMoving = true;
    }

    // Normalize diagonal movement
    if (playerVelocity.x !== 0 && playerVelocity.y !== 0) {
      const factor = Math.sqrt(2) / 2;
      playerVelocity.x *= factor;
      playerVelocity.y *= factor;
    }

    // Apply speed and energy
    if (isMoving) {
      let currentSpeed = player.speed;
      
      // Speed boost
      if (isSpeedBoosting && player.energy > 0) {
        currentSpeed *= 1.5;
        setPlayer(prev => ({ ...prev, energy: Math.max(0, prev.energy - SPEED_BOOST_COST) }));
      }
      
      playerVelocity.x *= currentSpeed;
      playerVelocity.y *= currentSpeed;
      
      // Decay energy when moving
      setPlayer(prev => ({ ...prev, energy: Math.max(0, prev.energy - ENERGY_DECAY_RATE * deltaTime) }));
    } else {
      // Regenerate energy when not moving
      setPlayer(prev => ({ ...prev, energy: Math.min(100, prev.energy + ENERGY_DECAY_RATE * deltaTime * 0.5) }));
    }

    setPlayer(prev => {
      const newPos = {
        x: Math.max(prev.size, Math.min(CANVAS_WIDTH - prev.size, prev.position.x + playerVelocity.x)),
        y: Math.max(prev.size, Math.min(CANVAS_HEIGHT - prev.size, prev.position.y + playerVelocity.y))
      };
      
      // Record movement path
      if (isMoving) {
        setMovementPath(path => [...path, newPos]);
      }
      
      return {
        ...prev,
        position: newPos,
        velocity: playerVelocity
      };
    });

    // Update AI movement with improved strategy
    setAi(prev => {
      const target = player.position;
      const dx = target.x - prev.position.x;
      const dy = target.y - prev.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      let aiVelocity = { x: 0, y: 0 };
      let newEnergy = prev.energy;
      
      if (distance > 0) {
        if (prev.role === 'predator') {
          // AI predator strategy: chase with varying intensity
          const chaseIntensity = Math.min(1, (100 - distance) / 100); // More intense when closer
          aiVelocity.x = (dx / distance) * prev.speed * (0.7 + chaseIntensity * 0.3);
          aiVelocity.y = (dy / distance) * prev.speed * (0.7 + chaseIntensity * 0.3);
          
          // AI uses energy when chasing intensely
          if (chaseIntensity > 0.7) {
            newEnergy = Math.max(0, prev.energy - ENERGY_DECAY_RATE * deltaTime * 2);
          }
          
          setCatchAttempts(attempts => attempts + (chaseIntensity > 0.8 ? 1 : 0));
        } else {
          // AI prey strategy: smart evasion
          const panicLevel = Math.max(0, (150 - distance) / 150); // Panic when predator is close
          
          // Calculate escape direction (away from predator with some randomness)
          const escapeAngle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.5;
          aiVelocity.x = Math.cos(escapeAngle) * prev.speed * (0.8 + panicLevel * 0.2);
          aiVelocity.y = Math.sin(escapeAngle) * prev.speed * (0.8 + panicLevel * 0.2);
          
          // AI uses more energy when panicking
          if (panicLevel > 0.5) {
            newEnergy = Math.max(0, prev.energy - ENERGY_DECAY_RATE * deltaTime * 1.5);
          }
          
          setEscapeAttempts(attempts => attempts + (panicLevel > 0.6 ? 1 : 0));
        }
      }
      
      // Regenerate energy when not in high-stress situations
      if (distance > 100) {
        newEnergy = Math.min(100, prev.energy + ENERGY_DECAY_RATE * deltaTime * 0.3);
      }
      
      const newPos = {
        x: Math.max(prev.size, Math.min(CANVAS_WIDTH - prev.size, prev.position.x + aiVelocity.x)),
        y: Math.max(prev.size, Math.min(CANVAS_HEIGHT - prev.size, prev.position.y + aiVelocity.y))
      };
      
      return {
        ...prev,
        position: newPos,
        velocity: aiVelocity,
        energy: newEnergy
      };
    });

    // Check for collision and stimulation
    const distance = getDistance(player.position, ai.position);
    setDistances(prev => [...prev, distance]);
    
    // Trigger stimulation if enabled and conditions are met
    const currentTime = Date.now();
    if (gameSettings.enableStimulation && 
        distance < gameSettings.stimulationThreshold && 
        currentTime - lastStimulation > 1500) { // 1.5 second cooldown
      triggerStimulation();
      setLastStimulation(currentTime);
    }
    
    // Check for capture
    const captureDistance = (player.size + ai.size) / 2 + 5;
    if (distance < captureDistance) {
      if (player.role === 'predator') {
        endRound(true); // Player caught AI
      } else {
        endRound(false); // Player was caught
      }
    }

    // Draw game
    drawGame();
  }, [keys, player, ai, lastStimulation, gameSettings, isSpeedBoosting]);

  const getDistance = (pos1: Position, pos2: Position): number => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const triggerStimulation = () => {
    setStimulationCount(prev => prev + 1);
    setShowStimulation(true);
    
    // Reduce player health slightly to simulate stress
    setPlayer(prev => ({ ...prev, health: Math.max(0, prev.health - gameSettings.stimulationIntensity) }));
    
    // Send stimulation marker
    sendSyncMarker('skin_stimulation', {
      round: currentRound + 1,
      playerRole: player.role,
      distance: getDistance(player.position, ai.position),
      intensity: gameSettings.stimulationIntensity,
      timestamp: Date.now()
    });
    
    // Hide stimulation indicator after 800ms
    setTimeout(() => setShowStimulation(false), 800);
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background with grid
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_WIDTH; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Draw movement trail for player
    if (movementPath.length > 1) {
      ctx.strokeStyle = player.role === 'predator' ? '#ef444450' : '#3b82f650';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(movementPath[0].x, movementPath[0].y);
      for (let i = 1; i < Math.min(movementPath.length, 50); i++) {
        ctx.lineTo(movementPath[movementPath.length - 1 - i].x, movementPath[movementPath.length - 1 - i].y);
      }
      ctx.stroke();
    }

    // Draw danger zone around predator
    const predatorEntity = player.role === 'predator' ? player : ai;
    ctx.strokeStyle = '#ef444430';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.arc(predatorEntity.position.x, predatorEntity.position.y, gameSettings.stimulationThreshold, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw player
    const playerColor = player.role === 'predator' ? '#ef4444' : '#3b82f6';
    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(player.position.x, player.position.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw player outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw player mouth if predator
    if (player.role === 'predator') {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      const mouthX = player.position.x + Math.cos(Math.atan2(ai.position.y - player.position.y, ai.position.x - player.position.x)) * player.size * 0.6;
      const mouthY = player.position.y + Math.sin(Math.atan2(ai.position.y - player.position.y, ai.position.x - player.position.x)) * player.size * 0.6;
      ctx.arc(mouthX, mouthY, player.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw speed boost effect
    if (isSpeedBoosting && player.energy > 0) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(player.position.x, player.position.y, player.size + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw AI
    const aiColor = ai.role === 'predator' ? '#ef4444' : '#8b5cf6';
    ctx.fillStyle = aiColor;
    ctx.beginPath();
    ctx.arc(ai.position.x, ai.position.y, ai.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw AI outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw AI mouth if predator
    if (ai.role === 'predator') {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      const mouthX = ai.position.x + Math.cos(Math.atan2(player.position.y - ai.position.y, player.position.x - ai.position.x)) * ai.size * 0.6;
      const mouthY = ai.position.y + Math.sin(Math.atan2(player.position.y - ai.position.y, player.position.x - ai.position.x)) * ai.size * 0.6;
      ctx.arc(mouthX, mouthY, ai.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw stimulation effect
    if (showStimulation) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 8;
      ctx.setLineDash([15, 15]);
      ctx.strokeRect(20, 20, CANVAS_WIDTH - 40, CANVAS_HEIGHT - 40);
      ctx.setLineDash([]);
      
      // Flash effect
      ctx.fillStyle = '#ef444420';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Draw UI elements
    drawUI(ctx);
  };

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    // Draw role indicator
    ctx.fillStyle = '#000';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`角色: ${player.role === 'predator' ? '攻击者' : '逃跑者'}`, 20, 30);
    
    // Draw timer
    ctx.fillStyle = roundTime <= 10 ? '#ef4444' : '#000';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${roundTime}`, CANVAS_WIDTH / 2, 40);
    
    // Draw round counter
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`回合 ${currentRound + 1}/${TOTAL_ROUNDS}`, CANVAS_WIDTH - 20, 30);
    
    // Draw health bar
    const healthBarWidth = 100;
    const healthBarHeight = 8;
    const healthBarX = 20;
    const healthBarY = CANVAS_HEIGHT - 60;
    
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    ctx.fillStyle = player.health > 50 ? '#10b981' : player.health > 25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(healthBarX, healthBarY, (player.health / 100) * healthBarWidth, healthBarHeight);
    
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`生命值: ${Math.round(player.health)}%`, healthBarX, healthBarY - 5);
    
    // Draw energy bar
    const energyBarY = CANVAS_HEIGHT - 40;
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(healthBarX, energyBarY, healthBarWidth, healthBarHeight);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(healthBarX, energyBarY, (player.energy / 100) * healthBarWidth, healthBarHeight);
    
    ctx.fillText(`能量: ${Math.round(player.energy)}%`, healthBarX, energyBarY - 5);
    
    // Draw stimulation counter
    if (stimulationCount > 0) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`刺激次数: ${stimulationCount}`, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20);
    }
    
    // Draw distance indicator
    const distance = getDistance(player.position, ai.position);
    ctx.fillStyle = distance < gameSettings.stimulationThreshold ? '#ef4444' : '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`距离: ${Math.round(distance)}px`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
    
    // Draw controls hint
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('WASD/方向键移动 | Shift加速 | 空格暂停', 20, CANVAS_HEIGHT - 5);
  };

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
      sendSyncMarker('game_paused', { round: currentRound + 1 });
    } else if (gameState === 'paused') {
      setGameState('playing');
      sendSyncMarker('game_resumed', { round: currentRound + 1 });
    }
  };

  const endRound = (success: boolean) => {
    const roundEndTime = Date.now();
    const roundDuration = (roundEndTime - roundStartTime) / 1000;
    const reactionTime = lastUpdateTime.current > 0 ? lastUpdateTime.current - roundStartTime : roundDuration * 1000;
    const averageDistance = distances.length > 0 
      ? distances.reduce((sum, d) => sum + d, 0) / distances.length 
      : 0;
    const minDistance = distances.length > 0 ? Math.min(...distances) : 0;
    const movementDistance = calculateMovementDistance();
    const energyUsed = 100 - player.energy;

    const newRoundData: RoundData = {
      round: currentRound + 1,
      role: player.role,
      duration: roundDuration,
      success,
      averageDistance,
      minDistance,
      reactionTime,
      stimulationEvents: stimulationCount,
      movementDistance,
      energyUsed,
      escapeAttempts,
      catchAttempts,
      timestamp: roundEndTime
    };

    setRoundData(prev => [...prev, newRoundData]);
    
    // Show round result
    setRoundResult({
      success,
      message: success 
        ? (player.role === 'predator' ? '成功捕获！' : '成功逃脱！')
        : (player.role === 'predator' ? '捕获失败！' : '被成功捕获！')
    });
    setShowRoundTransition(true);
    
    sendSyncMarker('round_end', {
      round: currentRound + 1,
      role: player.role,
      success,
      duration: roundDuration,
      stimulations: stimulationCount,
      reactionTime,
      averageDistance,
      minDistance
    });

    setTimeout(() => {
      setShowRoundTransition(false);
      setRoundResult(null);
      
      if (currentRound + 1 >= TOTAL_ROUNDS) {
        setGameState('finished');
        setTotalTime(Date.now() - (startTime || 0));
        
        sendSyncMarker('experiment_complete', {
          totalRounds: TOTAL_ROUNDS,
          totalStimulations: roundData.reduce((sum, r) => sum + r.stimulationEvents, 0) + stimulationCount,
          finalResults: calculateFinalResults()
        });
      } else {
        setCurrentRound(prev => prev + 1);
        startNewRound();
      }
    }, 3000);
  };

  const calculateMovementDistance = (): number => {
    let totalDistance = 0;
    for (let i = 1; i < movementPath.length; i++) {
      totalDistance += getDistance(movementPath[i - 1], movementPath[i]);
    }
    return totalDistance;
  };

  const calculateFinalResults = (): GameResults => {
    const predatorRounds = roundData.filter(r => r.role === 'predator');
    const preyRounds = roundData.filter(r => r.role === 'prey');
    
    return {
      totalRounds: TOTAL_ROUNDS,
      predatorRounds: predatorRounds.length,
      preyRounds: preyRounds.length,
      predatorSuccessRate: predatorRounds.length > 0 
        ? predatorRounds.filter(r => r.success).length / predatorRounds.length 
        : 0,
      preySuccessRate: preyRounds.length > 0 
        ? preyRounds.filter(r => r.success).length / preyRounds.length 
        : 0,
      averageReactionTime: roundData.reduce((sum, r) => sum + r.reactionTime, 0) / roundData.length,
      totalStimulations: roundData.reduce((sum, r) => sum + r.stimulationEvents, 0),
      totalMovementDistance: roundData.reduce((sum, r) => sum + r.movementDistance, 0),
      averageEscapeTime: preyRounds.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / 
        Math.max(1, preyRounds.filter(r => r.success).length),
      averageCatchTime: predatorRounds.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / 
        Math.max(1, predatorRounds.filter(r => r.success).length),
      rounds: roundData
    };
  };

  const resetGame = () => {
    setGameState('instruction');
    setCurrentRound(0);
    setRoundData([]);
    setStartTime(null);
    setTotalTime(null);
    setStimulationCount(0);
    setDistances([]);
    setMovementPath([]);
    setEscapeAttempts(0);
    setCatchAttempts(0);
    setShowRoundTransition(false);
    setRoundResult(null);
    
    sendSyncMarker('experiment_reset', {});
  };

  const exportData = () => {
    const results = calculateFinalResults();
    
    const data = {
      experimentInfo: {
        name: "Reaction Predator-Prey Experiment",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        settings: gameSettings,
        ...results
      },
      rounds: roundData.map((r, index) => ({
        ...r,
        timestamp: new Date(r.timestamp).toISOString()
      })),
      summary: {
        overallPerformance: calculateOverallPerformance(),
        strategyAnalysis: analyzeStrategy(),
        physiologicalResponse: analyzePhysiologicalResponse()
      }
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

  const calculateOverallPerformance = () => {
    const successRate = roundData.filter(r => r.success).length / roundData.length;
    const avgReactionTime = roundData.reduce((sum, r) => sum + r.reactionTime, 0) / roundData.length;
    const avgStimulations = roundData.reduce((sum, r) => sum + r.stimulationEvents, 0) / roundData.length;
    
    return {
      successRate,
      avgReactionTime,
      avgStimulations,
      performanceScore: (successRate * 50) + Math.max(0, (5000 - avgReactionTime) / 100) + Math.max(0, (10 - avgStimulations) * 5)
    };
  };

  const analyzeStrategy = () => {
    const predatorData = roundData.filter(r => r.role === 'predator');
    const preyData = roundData.filter(r => r.role === 'prey');
    
    return {
      predatorStrategy: {
        aggressiveness: predatorData.reduce((sum, r) => sum + r.catchAttempts, 0) / Math.max(1, predatorData.length),
        efficiency: predatorData.filter(r => r.success).length / Math.max(1, predatorData.length)
      },
      preyStrategy: {
        evasiveness: preyData.reduce((sum, r) => sum + r.escapeAttempts, 0) / Math.max(1, preyData.length),
        endurance: preyData.filter(r => r.success).length / Math.max(1, preyData.length)
      }
    };
  };

  const analyzePhysiologicalResponse = () => {
    const totalStimulations = roundData.reduce((sum, r) => sum + r.stimulationEvents, 0);
    const stimulationRate = totalStimulations / roundData.length;
    
    return {
      totalStimulations,
      stimulationRate,
      stressResponse: stimulationRate > 3 ? 'high' : stimulationRate > 1.5 ? 'medium' : 'low',
      adaptationRate: calculateAdaptationRate()
    };
  };

  const calculateAdaptationRate = () => {
    if (roundData.length < 6) return 0;
    
    const firstHalf = roundData.slice(0, Math.floor(roundData.length / 2));
    const secondHalf = roundData.slice(Math.floor(roundData.length / 2));
    
    const firstHalfStimulations = firstHalf.reduce((sum, r) => sum + r.stimulationEvents, 0) / firstHalf.length;
    const secondHalfStimulations = secondHalf.reduce((sum, r) => sum + r.stimulationEvents, 0) / secondHalf.length;
    
    return Math.max(0, (firstHalfStimulations - secondHalfStimulations) / firstHalfStimulations);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  const renderResultsAnalysis = () => {
    const results = calculateFinalResults();
    const performance = calculateOverallPerformance();
    const strategy = analyzeStrategy();
    const physiological = analyzePhysiologicalResponse();
    
    const roleData = [
      {
        role: '攻击者',
        rounds: results.predatorRounds,
        successRate: results.predatorSuccessRate * 100,
        avgDuration: results.predatorRounds > 0 ? results.averageCatchTime : 0,
        avgStimulations: roundData.filter(r => r.role === 'predator')
          .reduce((sum, r) => sum + r.stimulationEvents, 0) / Math.max(1, results.predatorRounds)
      },
      {
        role: '逃跑者',
        rounds: results.preyRounds,
        successRate: results.preySuccessRate * 100,
        avgDuration: results.preyRounds > 0 ? results.averageEscapeTime : 0,
        avgStimulations: roundData.filter(r => r.role === 'prey')
          .reduce((sum, r) => sum + r.stimulationEvents, 0) / Math.max(1, results.preyRounds)
      }
    ];

    const performanceOverTime = roundData.map((r, index) => ({
      round: r.round,
      reactionTime: r.reactionTime / 1000,
      stimulations: r.stimulationEvents,
      success: r.success ? 1 : 0,
      distance: r.averageDistance,
      energy: 100 - r.energyUsed
    }));

    const strategyRadar = [
      {
        metric: '反应速度',
        value: Math.max(0, 100 - (performance.avgReactionTime / 50))
      },
      {
        metric: '成功率',
        value: performance.successRate * 100
      },
      {
        metric: '适应能力',
        value: physiological.adaptationRate * 100
      },
      {
        metric: '压力抗性',
        value: physiological.stressResponse === 'low' ? 80 : 
               physiological.stressResponse === 'medium' ? 60 : 40
      },
      {
        metric: '策略效率',
        value: (strategy.predatorStrategy.efficiency + strategy.preyStrategy.endurance) * 50
      }
    ];

    const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

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
                <Bar dataKey="avgStimulations" fill="#ef4444" name="平均刺激次数" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">表现趋势分析</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="round" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="reactionTime" stroke="#2563eb" name="反应时间(秒)" />
                  <Line type="monotone" dataKey="stimulations" stroke="#ef4444" name="刺激次数" />
                  <Line type="monotone" dataKey="success" stroke="#10b981" name="成功" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">综合能力评估</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={strategyRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="能力评估"
                    dataKey="value"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
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
                {Math.round(performance.successRate * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                成功 {roundData.filter(r => r.success).length} / {roundData.length} 轮
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均反应时间</p>
              <p className="text-xl font-bold text-gray-900">
                {(performance.avgReactionTime / 1000).toFixed(2)}秒
              </p>
              <p className="text-xs text-gray-500 mt-1">首次移动响应时间</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">总刺激次数</p>
              <p className="text-xl font-bold text-gray-900">
                {results.totalStimulations}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                平均每轮 {(results.totalStimulations / TOTAL_ROUNDS).toFixed(1)} 次
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">综合表现分数</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(performance.performanceScore)}
              </p>
              <p className="text-xs text-gray-500 mt-1">基于多维度评估</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            <Brain className="inline w-5 h-5 mr-2" />
            实验分析报告
          </h3>
          <div className="space-y-4 text-sm text-gray-700">
            <p>
              <strong>反应能力评估：</strong>
              您的平均反应时间为 {(performance.avgReactionTime / 1000).toFixed(2)} 秒，
              {performance.avgReactionTime < 1000 ? '反应速度优秀' : 
               performance.avgReactionTime < 2000 ? '反应速度良好' : 
               performance.avgReactionTime < 3000 ? '反应速度一般' : '反应速度需要提升'}。
            </p>
            <p>
              <strong>角色适应性：</strong>
              作为攻击者时成功率为 {(results.predatorSuccessRate * 100).toFixed(1)}%，
              作为逃跑者时成功率为 {(results.preySuccessRate * 100).toFixed(1)}%。
              {Math.abs(results.predatorSuccessRate - results.preySuccessRate) < 0.2 
                ? '两种角色表现均衡，适应性良好。'
                : results.predatorSuccessRate > results.preySuccessRate
                ? '更擅长攻击角色，可能具有较强的主动性。'
                : '更擅长防御角色，可能具有较强的应变能力。'}
            </p>
            <p>
              <strong>压力响应：</strong>
              总共触发了 {results.totalStimulations} 次皮肤电刺激，
              {physiological.stressResponse === 'low' ? '压力响应较低，能够很好地控制距离。' :
               physiological.stressResponse === 'medium' ? '压力响应适中，在紧张情况下仍能保持一定控制。' :
               '压力响应较高，在高压情况下容易失去控制。'}
              适应率为 {(physiological.adaptationRate * 100).toFixed(1)}%。
            </p>
            <p>
              <strong>策略建议：</strong>
              {performance.avgReactionTime > 2000 && '建议通过练习提高反应速度；'}
              {results.predatorSuccessRate < 0.4 && '作为攻击者时可以尝试更积极的追捕策略；'}
              {results.preySuccessRate < 0.4 && '作为逃跑者时可以尝试更灵活的躲避路线；'}
              {physiological.stressResponse === 'high' && '建议在日常生活中进行压力管理训练。'}
            </p>
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
        <div className="max-w-6xl mx-auto">
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
              
              <div className="prose prose-gray max-w-none">
                <p className="text-lg">
                  这是一种反应能力测试，您将在攻击者和逃跑者两种角色之间随机切换。
                  实验旨在测试您在不同压力情境下的反应能力和适应性。
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-6">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <h3 className="text-lg font-medium text-yellow-800">重要提示</h3>
                  </div>
                  <p className="mt-2 text-yellow-700">
                    为了获得更真实且全面的测试体验，我们可能会在测试中使用皮肤电刺激设备，
                    在您手上制造轻微疼痛，模拟被攻击时的感受。刺激强度可在设置中调节。
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                  <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                    <h3 className="text-xl font-bold text-red-900 mb-3">攻击者角色</h3>
                    <ul className="space-y-2 text-red-700">
                      <li>• 体型更大，带有一张大嘴</li>
                      <li>• 目标：追上并接触逃跑者</li>
                      <li>• 需要在时间限制内完成捕获</li>
                      <li>• 可以使用能量加速追捕</li>
                    </ul>
                  </div>
                  
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h3 className="text-xl font-bold text-blue-900 mb-3">逃跑者角色</h3>
                    <ul className="space-y-2 text-blue-700">
                      <li>• 体型较小，移动更灵活</li>
                      <li>• 目标：避免被攻击者接触</li>
                      <li>• 坚持到时间结束即为成功</li>
                      <li>• 合理使用能量进行逃脱</li>
                    </ul>
                  </div>
                </div>

                <h3>操作方式：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>移动：</strong>使用方向键或WASD键控制移动</li>
                  <li><strong>加速：</strong>按住Shift键进行速度提升（消耗能量）</li>
                  <li><strong>暂停：</strong>按空格键暂停/继续游戏</li>
                  <li><strong>策略：</strong>合理分配能量，观察对手行为模式</li>
                </ul>

                <h3>实验特色：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>动态角色切换，测试不同情境下的反应能力</li>
                  <li>皮肤电刺激反馈，增强实验真实感</li>
                  <li>能量管理系统，增加策略深度</li>
                  <li>智能AI对手，提供挑战性的游戏体验</li>
                  <li>详细的数据记录和分析</li>
                </ul>
              </div>

              <div className="flex space-x-4 mt-8">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setGameState('settings')}
                >
                  实验设置
                </Button>
                <Button 
                  variant="primary"
                  className="flex-1"
                  onClick={startGame}
                >
                  开始实验
                </Button>
              </div>
            </motion.div>
          )}

          {gameState === 'settings' && (
            <motion.div 
              className="bg-white rounded-xl shadow-sm p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">实验设置</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      回合时长（秒）
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="60"
                      value={gameSettings.roundDuration}
                      onChange={(e) => setGameSettings(prev => ({ 
                        ...prev, 
                        roundDuration: parseInt(e.target.value) 
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>15秒</span>
                      <span>{gameSettings.roundDuration}秒</span>
                      <span>60秒</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      玩家移动速度
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      value={gameSettings.playerSpeed}
                      onChange={(e) => setGameSettings(prev => ({ 
                        ...prev, 
                        playerSpeed: parseInt(e.target.value) 
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>慢</span>
                      <span>{gameSettings.playerSpeed}</span>
                      <span>快</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI移动速度
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      value={gameSettings.aiSpeed}
                      onChange={(e) => setGameSettings(prev => ({ 
                        ...prev, 
                        aiSpeed: parseInt(e.target.value) 
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>慢</span>
                      <span>{gameSettings.aiSpeed}</span>
                      <span>快</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      刺激触发距离
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={gameSettings.stimulationThreshold}
                      onChange={(e) => setGameSettings(prev => ({ 
                        ...prev, 
                        stimulationThreshold: parseInt(e.target.value) 
                      }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>近</span>
                      <span>{gameSettings.stimulationThreshold}px</span>
                      <span>远</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableStimulation"
                      checked={gameSettings.enableStimulation}
                      onChange={(e) => setGameSettings(prev => ({ 
                        ...prev, 
                        enableStimulation: e.target.checked 
                      }))}
                      className="mr-3"
                    />
                    <label htmlFor="enableStimulation" className="text-sm font-medium text-gray-700">
                      启用皮肤电刺激反馈
                    </label>
                  </div>
                  
                  {gameSettings.enableStimulation && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        刺激强度
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={gameSettings.stimulationIntensity}
                        onChange={(e) => setGameSettings(prev => ({ 
                          ...prev, 
                          stimulationIntensity: parseInt(e.target.value) 
                        }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>轻微</span>
                        <span>强度 {gameSettings.stimulationIntensity}</span>
                        <span>强烈</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setGameState('instruction')}
                >
                  返回说明
                </Button>
                <Button 
                  variant="primary"
                  className="flex-1"
                  onClick={startGame}
                >
                  开始实验
                </Button>
              </div>
            </motion.div>
          )}

          {(gameState === 'playing' || gameState === 'paused') && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">当前回合</p>
                  <p className="text-2xl font-bold text-primary-600">{currentRound + 1} / {TOTAL_ROUNDS}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">剩余时间</p>
                  <p className={`text-2xl font-bold ${roundTime <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                    {roundTime}秒
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">当前角色</p>
                  <p className={`text-2xl font-bold ${player.role === 'predator' ? 'text-red-600' : 'text-blue-600'}`}>
                    {player.role === 'predator' ? '攻击者' : '逃跑者'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">能量</p>
                  <p className={`text-2xl font-bold ${player.energy < 30 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.round(player.energy)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">刺激次数</p>
                  <p className="text-2xl font-bold text-yellow-600">{stimulationCount}</p>
                </div>
              </div>

              <motion.div
                className="bg-white rounded-xl shadow-sm p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {player.role === 'predator' ? '追捕目标！' : '逃避追捕！'}
                  </h2>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePause}
                    >
                      {gameState === 'paused' ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          继续
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          暂停
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentRound(0);
                        startNewRound();
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      重置回合
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="border-2 border-gray-300 rounded-lg mx-auto"
                  />
                  
                  {gameState === 'paused' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="bg-white p-6 rounded-xl text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">游戏已暂停</h3>
                        <p className="text-gray-600 mb-4">按空格键或点击继续按钮恢复游戏</p>
                        <Button onClick={togglePause} variant="primary">
                          <Play className="w-4 h-4 mr-2" />
                          继续游戏
                        </Button>
                      </div>
                    </div>
                  )}
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
                        <Zap className="w-6 h-6 text-red-600 mr-2" />
                        <span className="text-red-800 font-bold text-lg">
                          皮肤电刺激触发 - 强度 {gameSettings.stimulationIntensity}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center text-sm text-gray-600">
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <div className="w-4 h-4 bg-orange-500 rounded-full mr-2"></div>
                      <span>您（{player.role === 'predator' ? '攻击者' : '逃跑者'}）</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                      <span>AI对手（{ai.role === 'predator' ? '攻击者' : '逃跑者'}）</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <div className="w-4 h-4 border-2 border-red-400 border-dashed rounded-full mr-2"></div>
                      <span>刺激触发区域</span>
                    </div>
                  </div>
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

          {/* Round Transition */}
          <AnimatePresence>
            {showRoundTransition && roundResult && (
              <motion.div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className={`bg-white p-8 rounded-xl text-center max-w-md ${
                    roundResult.success ? 'border-4 border-green-500' : 'border-4 border-red-500'
                  }`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                >
                  <div className={`text-6xl mb-4 ${roundResult.success ? 'text-green-500' : 'text-red-500'}`}>
                    {roundResult.success ? '✓' : '✗'}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    回合 {currentRound + 1} 结束
                  </h3>
                  <p className={`text-xl font-medium mb-4 ${
                    roundResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {roundResult.message}
                  </p>
                  <div className="text-sm text-gray-600">
                    <p>角色：{player.role === 'predator' ? '攻击者' : '逃跑者'}</p>
                    <p>刺激次数：{stimulationCount}</p>
                    <p>剩余能量：{Math.round(player.energy)}%</p>
                  </div>
                  {currentRound + 1 < TOTAL_ROUNDS && (
                    <p className="mt-4 text-gray-500">准备下一回合...</p>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">详细操作说明</h3>
              <div className="prose prose-gray">
                <h4>基本操作</h4>
                <ul>
                  <li><strong>移动：</strong>使用方向键（↑↓←→）或WASD键控制角色移动</li>
                  <li><strong>加速：</strong>按住Shift键进行速度提升，会消耗能量</li>
                  <li><strong>暂停：</strong>按空格键可以暂停/继续游戏</li>
                </ul>
                
                <h4>游戏机制</h4>
                <ul>
                  <li><strong>能量系统：</strong>移动和加速会消耗能量，静止时会缓慢恢复</li>
                  <li><strong>角色切换：</strong>每轮随机分配攻击者或逃跑者角色</li>
                  <li><strong>皮肤电刺激：</strong>当攻击者接近逃跑者时触发，模拟真实压力</li>
                  <li><strong>胜利条件：</strong>攻击者需要接触逃跑者，逃跑者需要坚持到时间结束</li>
                </ul>
                
                <h4>策略提示</h4>
                <ul>
                  <li><strong>攻击者：</strong>预测对手移动路径，合理使用加速功能</li>
                  <li><strong>逃跑者：</strong>保持距离，利用地图边界和能量管理</li>
                  <li><strong>通用：</strong>观察对手行为模式，适时调整策略</li>
                </ul>
                
                <h4>数据记录</h4>
                <p>实验会记录您的反应时间、移动轨迹、能量使用、刺激响应等多维度数据，用于分析您的反应能力和适应性。</p>
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