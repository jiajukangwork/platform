import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';
import Introduction from './Introduction';
import GameInterface from './GameInterface';
import ResultsAnalysis from './ResultsAnalysis';
import { usePhysiologicalSync } from '../../components/PhysiologicalSyncContext';
import PhysiologicalSync from '../../components/PhysiologicalSync';

export type GameState = 'introduction' | 'playing' | 'results';

export interface GameResults {
  score: number;
  opponentScore: number;
  totalRounds: number;
  winRate: number;
  averageSpeed: number;
  highSpeedRate: number;
  lowSpeedRate: number;
  reactionTimes: number[];
  speedChoices: number[];
  rounds: RoundData[];
}

export interface RoundData {
  round: number;
  playerSpeed: number;
  opponentSpeed: number;
  playerScore: number;
  opponentScore: number;
  winner: 'player' | 'opponent' | 'tie';
  reactionTime: number;
  timestamp: number;
}

const SpeedGame = () => {
  const [gameState, setGameState] = useState<GameState>('introduction');
  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const { sendSyncMarker } = usePhysiologicalSync();

  const handleStartGame = () => {
    setGameState('playing');
    sendSyncMarker('game_start', { timestamp: Date.now() });
  };

  const handleGameComplete = (results: GameResults) => {
    setGameResults(results);
    setGameState('results');
    sendSyncMarker('game_complete', { 
      score: results.score,
      opponentScore: results.opponentScore,
      winRate: results.winRate,
      timestamp: Date.now()
    });
  };

  const handleRestart = () => {
    setGameState('introduction');
    setGameResults(null);
    sendSyncMarker('game_restart', { timestamp: Date.now() });
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
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {gameState === 'introduction' && (
              <Introduction onStart={handleStartGame} />
            )}

            {gameState === 'playing' && (
              <GameInterface onComplete={handleGameComplete} />
            )}

            {gameState === 'results' && gameResults && (
              <ResultsAnalysis results={gameResults} onRestart={handleRestart} />
            )}
          </motion.div>
        </div>
      </div>
      
      {/* 生理信号同步组件 */}
      <PhysiologicalSync 
        experimentId="speed-game"
        participantId={`participant-${Date.now()}`}
        onSyncEvent={(eventType, timestamp, metadata) => {
          console.log(`Sync event: ${eventType} at ${timestamp}`, metadata);
        }}
      />
    </div>
  );
};

export default SpeedGame;