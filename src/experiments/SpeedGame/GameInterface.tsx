import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gauge, Clock, PauseCircle, PlayCircle, HelpCircle, Car, Trophy, X } from 'lucide-react';
import Button from '../../components/Button';
import { GameResults, RoundData } from './index';
import { usePhysiologicalSync } from '../../components/PhysiologicalSyncContext';

interface GameInterfaceProps {
  onComplete: (results: GameResults) => void;
}

interface Position {
  x: number;
  y: number;
}

interface Vehicle {
  position: Position;
  speed: number;
  targetSpeed: number;
  lane: 'left' | 'right' | 'center';
  progress: number; // 0-100
}

const TOTAL_ROUNDS = 10;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const ROAD_WIDTH = 60;
const MERGE_POINT = 400; // y-coordinate where roads merge
const FINISH_LINE = 100; // y-coordinate of finish line
const CAR_WIDTH = 30;
const CAR_HEIGHT = 50;

// Speed levels
const SPEED_LEVELS = {
  2: 20, // Slow
  3: 30, // Medium
  4: 40, // Fast
  5: 50  // Very fast
};

// Opponent strategies
const OPPONENT_STRATEGIES = [
  'aggressive', // Prefers high speed
  'cautious',   // Prefers low speed
  'adaptive',   // Adapts to player's strategy
  'random'      // Random speed choices
];

const GameInterface = ({ onComplete }: GameInterfaceProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [roundStarted, setRoundStarted] = useState(false);
  const [roundEnded, setRoundEnded] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [player, setPlayer] = useState<Vehicle>({
    position: { x: CANVAS_WIDTH / 4, y: CANVAS_HEIGHT - 100 },
    speed: 0,
    targetSpeed: 0,
    lane: 'left',
    progress: 0
  });
  const [opponent, setOpponent] = useState<Vehicle>({
    position: { x: (CANVAS_WIDTH / 4) * 3, y: CANVAS_HEIGHT - 100 },
    speed: 0,
    targetSpeed: 0,
    lane: 'right',
    progress: 0
  });
  const [currentStrategy, setCurrentStrategy] = useState(OPPONENT_STRATEGIES[0]);
  const [roundData, setRoundData] = useState<RoundData[]>([]);
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [lastKeyPressTime, setLastKeyPressTime] = useState(0);
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [roundWinner, setRoundWinner] = useState<'player' | 'opponent' | 'tie'>('tie');
  
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const { sendSyncMarker } = usePhysiologicalSync();

  // Initialize game
  useEffect(() => {
    startNewRound();
    
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = (timestamp - lastTimeRef.current) / 1000; // Convert to seconds
    lastTimeRef.current = timestamp;
    
    if (!isPaused && roundStarted && !roundEnded) {
      // Update elapsed time
      setElapsedTime(prev => prev + deltaTime);
      
      // Update player
      updateVehicle(player, setPlayer, deltaTime);
      
      // Update opponent
      updateOpponent(deltaTime);
      
      // Check for round end
      if (player.progress >= 100 || opponent.progress >= 100) {
        endRound();
      }
      
      // Draw game
      drawGame();
    }
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [isPaused, roundStarted, roundEnded, player, opponent]);

  // Start animation loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop]);

  // Start countdown when round begins
  useEffect(() => {
    if (countdown > 0 && !roundStarted && !roundEnded) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !roundStarted && !roundEnded) {
      setRoundStarted(true);
      setRoundStartTime(Date.now());
      
      // Send round start marker
      sendSyncMarker('round_start', { 
        round: currentRound,
        strategy: currentStrategy,
        timestamp: Date.now()
      });
    }
  }, [countdown, roundStarted, roundEnded, currentRound, currentStrategy]);

  // Handle key presses
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!roundStarted || roundEnded) return;
    
    // Speed control keys
    if (['2', '3', '4', '5'].includes(e.key)) {
      const speed = SPEED_LEVELS[e.key as keyof typeof SPEED_LEVELS];
      setPlayer(prev => ({ ...prev, targetSpeed: speed }));
      setLastKeyPressTime(Date.now());
      
      // Send speed change marker
      sendSyncMarker('speed_change', { 
        round: currentRound,
        speed,
        timestamp: Date.now()
      });
    }
    
    // Pause/resume with space
    if (e.code === 'Space') {
      setIsPaused(prev => !prev);
    }
  }, [roundStarted, roundEnded, currentRound]);

  // Update vehicle position and speed
  const updateVehicle = (vehicle: Vehicle, setVehicle: React.Dispatch<React.SetStateAction<Vehicle>>, deltaTime: number) => {
    // Calculate new speed (accelerate/decelerate towards target)
    const speedDiff = vehicle.targetSpeed - vehicle.speed;
    const acceleration = Math.sign(speedDiff) * Math.min(Math.abs(speedDiff), 20) * deltaTime;
    const newSpeed = vehicle.speed + acceleration;
    
    // Calculate new position
    const distance = newSpeed * deltaTime;
    let newY = vehicle.position.y - distance;
    let newX = vehicle.position.x;
    let newLane = vehicle.lane;
    
    // Calculate progress
    const totalDistance = CANVAS_HEIGHT - FINISH_LINE;
    const distanceTraveled = CANVAS_HEIGHT - newY;
    const newProgress = (distanceTraveled / totalDistance) * 100;
    
    // Handle lane merging
    if (newY <= MERGE_POINT && vehicle.lane !== 'center') {
      // Calculate merge point
      const mergeX = CANVAS_WIDTH / 2;
      const distanceToMerge = Math.abs(vehicle.position.x - mergeX);
      const mergeSpeed = distanceToMerge * (newY / MERGE_POINT) * deltaTime;
      
      if (vehicle.lane === 'left') {
        newX = Math.min(mergeX, vehicle.position.x + mergeSpeed);
        if (newX >= mergeX) newLane = 'center';
      } else {
        newX = Math.max(mergeX, vehicle.position.x - mergeSpeed);
        if (newX <= mergeX) newLane = 'center';
      }
    }
    
    setVehicle({
      position: { x: newX, y: newY },
      speed: newSpeed,
      targetSpeed: vehicle.targetSpeed,
      lane: newLane,
      progress: newProgress
    });
  };

  // Update opponent based on strategy
  const updateOpponent = (deltaTime: number) => {
    let targetSpeed = opponent.targetSpeed;
    
    // Update target speed based on strategy
    switch (currentStrategy) {
      case 'aggressive':
        // Prefers high speed
        targetSpeed = Math.random() < 0.7 ? SPEED_LEVELS[5] : SPEED_LEVELS[4];
        break;
      case 'cautious':
        // Prefers low speed
        targetSpeed = Math.random() < 0.7 ? SPEED_LEVELS[2] : SPEED_LEVELS[3];
        break;
      case 'adaptive':
        // Adapts to player's strategy
        if (player.speed > 35) {
          // If player is fast, go slightly faster
          targetSpeed = player.speed + (Math.random() * 10 - 5);
        } else {
          // If player is slow, go slightly slower
          targetSpeed = player.speed + (Math.random() * 10 - 5);
        }
        break;
      case 'random':
        // Random speed changes
        if (Math.random() < 0.05) { // 5% chance to change speed each frame
          const speeds = Object.values(SPEED_LEVELS);
          targetSpeed = speeds[Math.floor(Math.random() * speeds.length)];
        }
        break;
    }
    
    setOpponent(prev => ({ ...prev, targetSpeed }));
    updateVehicle(opponent, setOpponent, deltaTime);
  };

  // Draw game on canvas
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw road
    drawRoad(ctx);
    
    // Draw vehicles
    drawVehicle(ctx, player, 'red');
    drawVehicle(ctx, opponent, 'blue');
    
    // Draw finish line
    ctx.fillStyle = 'black';
    ctx.fillRect(CANVAS_WIDTH / 2 - ROAD_WIDTH, FINISH_LINE, ROAD_WIDTH * 2, 5);
    ctx.fillStyle = 'white';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(CANVAS_WIDTH / 2 - ROAD_WIDTH + i * 15, FINISH_LINE, 7.5, 5);
    }
    
    // Draw progress indicators
    drawProgressIndicator(ctx, player.progress, 'red', 20);
    drawProgressIndicator(ctx, opponent.progress, 'blue', CANVAS_WIDTH - 20);
    
    // Draw speed indicators
    drawSpeedIndicator(ctx, player.speed, 'red', 60);
    drawSpeedIndicator(ctx, opponent.speed, 'blue', CANVAS_WIDTH - 60);
  };

  // Draw road
  const drawRoad = (ctx: CanvasRenderingContext2D) => {
    // Draw background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw left road
    ctx.fillStyle = '#333';
    ctx.fillRect(CANVAS_WIDTH / 4 - ROAD_WIDTH / 2, MERGE_POINT, ROAD_WIDTH, CANVAS_HEIGHT - MERGE_POINT);
    
    // Draw right road
    ctx.fillRect(CANVAS_WIDTH * 3 / 4 - ROAD_WIDTH / 2, MERGE_POINT, ROAD_WIDTH, CANVAS_HEIGHT - MERGE_POINT);
    
    // Draw center road
    ctx.fillRect(CANVAS_WIDTH / 2 - ROAD_WIDTH, FINISH_LINE, ROAD_WIDTH * 2, MERGE_POINT - FINISH_LINE);
    
    // Draw road markings
    ctx.strokeStyle = 'white';
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, FINISH_LINE);
    ctx.lineTo(CANVAS_WIDTH / 2, MERGE_POINT);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw merge indicators
    ctx.fillStyle = 'yellow';
    for (let i = 0; i < 3; i++) {
      // Left merge
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 4 + ROAD_WIDTH / 2, MERGE_POINT + i * 20);
      ctx.lineTo(CANVAS_WIDTH / 4 + ROAD_WIDTH / 2 + 10, MERGE_POINT + i * 20 - 10);
      ctx.lineTo(CANVAS_WIDTH / 4 + ROAD_WIDTH / 2 + 10, MERGE_POINT + i * 20 + 10);
      ctx.fill();
      
      // Right merge
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH * 3 / 4 - ROAD_WIDTH / 2, MERGE_POINT + i * 20);
      ctx.lineTo(CANVAS_WIDTH * 3 / 4 - ROAD_WIDTH / 2 - 10, MERGE_POINT + i * 20 - 10);
      ctx.lineTo(CANVAS_WIDTH * 3 / 4 - ROAD_WIDTH / 2 - 10, MERGE_POINT + i * 20 + 10);
      ctx.fill();
    }
  };

  // Draw vehicle
  const drawVehicle = (ctx: CanvasRenderingContext2D, vehicle: Vehicle, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(
      vehicle.position.x - CAR_WIDTH / 2,
      vehicle.position.y - CAR_HEIGHT / 2,
      CAR_WIDTH,
      CAR_HEIGHT
    );
    
    // Draw windows
    ctx.fillStyle = '#ddd';
    ctx.fillRect(
      vehicle.position.x - CAR_WIDTH / 2 + 5,
      vehicle.position.y - CAR_HEIGHT / 2 + 5,
      CAR_WIDTH - 10,
      15
    );
  };

  // Draw progress indicator
  const drawProgressIndicator = (ctx: CanvasRenderingContext2D, progress: number, color: string, x: number) => {
    const height = 200;
    const width = 15;
    
    // Draw background
    ctx.fillStyle = '#ddd';
    ctx.fillRect(x - width / 2, CANVAS_HEIGHT - height - 20, width, height);
    
    // Draw progress
    ctx.fillStyle = color;
    const progressHeight = (progress / 100) * height;
    ctx.fillRect(
      x - width / 2,
      CANVAS_HEIGHT - 20 - progressHeight,
      width,
      progressHeight
    );
    
    // Draw percentage
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(progress)}%`, x, CANVAS_HEIGHT - 5);
  };

  // Draw speed indicator
  const drawSpeedIndicator = (ctx: CanvasRenderingContext2D, speed: number, color: string, x: number) => {
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(speed)} km/h`, x, 30);
    
    // Draw speed gauge
    const radius = 25;
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    
    // Draw background
    ctx.beginPath();
    ctx.arc(x, 60, radius, startAngle, endAngle);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 5;
    ctx.stroke();
    
    // Draw speed
    const speedAngle = startAngle + (speed / 60) * Math.PI;
    ctx.beginPath();
    ctx.arc(x, 60, radius, startAngle, speedAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.stroke();
    
    // Draw needle
    ctx.beginPath();
    ctx.moveTo(x, 60);
    ctx.lineTo(
      x + radius * Math.cos(speedAngle),
      60 + radius * Math.sin(speedAngle)
    );
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Start a new round
  const startNewRound = () => {
    // Reset vehicles
    setPlayer({
      position: { x: CANVAS_WIDTH / 4, y: CANVAS_HEIGHT - 100 },
      speed: 0,
      targetSpeed: 0,
      lane: 'left',
      progress: 0
    });
    
    setOpponent({
      position: { x: (CANVAS_WIDTH / 4) * 3, y: CANVAS_HEIGHT - 100 },
      speed: 0,
      targetSpeed: 0,
      lane: 'right',
      progress: 0
    });
    
    // Choose a random strategy for the opponent
    const newStrategy = OPPONENT_STRATEGIES[Math.floor(Math.random() * OPPONENT_STRATEGIES.length)];
    setCurrentStrategy(newStrategy);
    
    // Reset round state
    setRoundStarted(false);
    setRoundEnded(false);
    setElapsedTime(0);
    setCountdown(3);
    setShowRoundResult(false);
    
    // Draw initial state
    drawGame();
    
    // Send new round marker
    sendSyncMarker('round_setup', { 
      round: currentRound,
      strategy: newStrategy,
      timestamp: Date.now()
    });
  };

  // End the current round
  const endRound = () => {
    setRoundEnded(true);
    
    // Determine winner
    let winner: 'player' | 'opponent' | 'tie' = 'tie';
    let playerRoundScore = 0;
    let opponentRoundScore = 0;
    
    if (player.progress > opponent.progress) {
      winner = 'player';
      playerRoundScore = 10;
    } else if (opponent.progress > player.progress) {
      winner = 'opponent';
      opponentRoundScore = 10;
    } else {
      playerRoundScore = 5;
      opponentRoundScore = 5;
    }
    
    setRoundWinner(winner);
    setPlayerScore(prev => prev + playerRoundScore);
    setOpponentScore(prev => prev + opponentRoundScore);
    
    // Record round data
    const roundEndTime = Date.now();
    const reactionTime = lastKeyPressTime > 0 ? lastKeyPressTime - roundStartTime : 0;
    
    const newRoundData: RoundData = {
      round: currentRound,
      playerSpeed: player.speed,
      opponentSpeed: opponent.speed,
      playerScore: playerRoundScore,
      opponentScore: opponentRoundScore,
      winner,
      reactionTime,
      timestamp: roundEndTime
    };
    
    setRoundData(prev => [...prev, newRoundData]);
    
    // Send round end marker
    sendSyncMarker('round_end', { 
      round: currentRound,
      winner,
      playerSpeed: player.speed,
      opponentSpeed: opponent.speed,
      timestamp: roundEndTime
    });
    
    // Show round result
    setShowRoundResult(true);
    
    // Proceed to next round or end game after delay
    setTimeout(() => {
      if (currentRound < TOTAL_ROUNDS) {
        setCurrentRound(prev => prev + 1);
        startNewRound();
      } else {
        finishGame();
      }
    }, 3000);
  };

  // Finish the game and calculate results
  const finishGame = () => {
    const speedChoices = roundData.map(round => round.playerSpeed);
    const reactionTimes = roundData.map(round => round.reactionTime).filter(time => time > 0);
    const playerWins = roundData.filter(round => round.winner === 'player').length;
    
    const results: GameResults = {
      score: playerScore,
      opponentScore: opponentScore,
      totalRounds: TOTAL_ROUNDS,
      winRate: playerWins / TOTAL_ROUNDS,
      averageSpeed: speedChoices.reduce((sum, speed) => sum + speed, 0) / speedChoices.length,
      highSpeedRate: speedChoices.filter(speed => speed >= 40).length / speedChoices.length,
      lowSpeedRate: speedChoices.filter(speed => speed < 40).length / speedChoices.length,
      reactionTimes,
      speedChoices,
      rounds: roundData
    };
    
    // Send game finish marker
    sendSyncMarker('game_finish', { 
      score: playerScore,
      opponentScore: opponentScore,
      winRate: playerWins / TOTAL_ROUNDS,
      timestamp: Date.now()
    });
    
    onComplete(results);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Car className="w-6 h-6 text-primary-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">速度博弈</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Trophy className="w-5 h-5 text-amber-500 mr-2" />
            <span className="text-lg font-bold">
              {playerScore} - {opponentScore}
            </span>
          </div>
          
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-gray-600 mr-2" />
            <span className="font-mono">
              {Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:
              {Math.floor(elapsedTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-600 mr-2">
              回合 {currentRound}/{TOTAL_ROUNDS}
            </span>
          </div>
          
          <button 
            onClick={() => setIsPaused(prev => !prev)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            {isPaused ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setShowHelp(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="relative">
        <canvas 
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-gray-200 rounded-lg mx-auto"
        />
        
        {/* Countdown overlay */}
        <AnimatePresence>
          {!roundStarted && !roundEnded && countdown > 0 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="text-6xl font-bold text-white"
              >
                {countdown}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Round result overlay */}
        <AnimatePresence>
          {showRoundResult && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="bg-white p-6 rounded-xl shadow-lg text-center"
              >
                <h3 className="text-2xl font-bold mb-4">
                  {roundWinner === 'player' 
                    ? '你赢了！' 
                    : roundWinner === 'opponent' 
                      ? '对手赢了！' 
                      : '平局！'}
                </h3>
                <div className="flex justify-center items-center space-x-8 mb-4">
                  <div className="text-center">
                    <Car className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">你的速度</p>
                    <p className="text-xl font-bold">{Math.round(player.speed)} km/h</p>
                  </div>
                  <div className="text-center">
                    <Car className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">对手速度</p>
                    <p className="text-xl font-bold">{Math.round(opponent.speed)} km/h</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  {currentRound < TOTAL_ROUNDS ? '准备下一回合...' : '实验即将结束...'}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Speed controls */}
        <div className="mt-6 flex justify-center space-x-4">
          {Object.entries(SPEED_LEVELS).map(([key, speed]) => (
            <button
              key={key}
              onClick={() => {
                if (roundStarted && !roundEnded) {
                  setPlayer(prev => ({ ...prev, targetSpeed: speed }));
                  setLastKeyPressTime(Date.now());
                  
                  // Send speed change marker
                  sendSyncMarker('speed_change', { 
                    round: currentRound,
                    speed,
                    timestamp: Date.now()
                  });
                }
              }}
              className={`px-6 py-3 rounded-lg font-bold transition-colors ${
                player.targetSpeed === speed
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
              disabled={!roundStarted || roundEnded}
            >
              {key}
            </button>
          ))}
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          按下 2/3/4/5 键或点击上方按钮控制速度
        </div>
      </div>
      
      {/* Help modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 max-w-md w-full"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">游戏说明</h3>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">基本规则</h4>
                  <p className="text-gray-600">
                    您控制红色小车，电脑控制蓝色小车。两车从不同的道路出发，最终汇合到同一条道路上。先到达终点的一方获胜。
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">操作方式</h4>
                  <p className="text-gray-600">
                    按下键盘上的 2/3/4/5 键或点击屏幕上的按钮来控制小车速度：
                  </p>
                  <ul className="list-disc pl-5 mt-2 text-gray-600">
                    <li>2 - 20 km/h（慢速）</li>
                    <li>3 - 30 km/h（中速）</li>
                    <li>4 - 40 km/h（快速）</li>
                    <li>5 - 50 km/h（极速）</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">对手策略</h4>
                  <p className="text-gray-600">
                    电脑控制的对手会采用不同的策略，包括激进型、谨慎型、适应型和随机型。您需要观察对手行为并调整自己的策略。
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">计分规则</h4>
                  <p className="text-gray-600">
                    每轮胜利可获得10分，平局各得5分。实验共{TOTAL_ROUNDS}轮，总分最高者获胜。
                  </p>
                </div>
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
    </div>
  );
};

export default GameInterface;