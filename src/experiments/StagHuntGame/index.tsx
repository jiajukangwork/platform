import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';
import Introduction from './Introduction';
import ExperimentSetup from './ExperimentSetup';
import GameInterface from './GameInterface';
import ResultsAnalysis from './ResultsAnalysis';
import { usePhysiologicalSync } from '../../components/PhysiologicalSyncContext';
import PhysiologicalSync from '../../components/PhysiologicalSync';

export type GameState = 'introduction' | 'setup' | 'experiment' | 'results';

export interface ExperimentConfig {
  playerRole: 'hunter' | 'observer';
  difficulty: 'easy' | 'medium' | 'hard';
  gridSize: 'small' | 'medium' | 'large';
  aiStrategy: 'cooperative' | 'competitive' | 'adaptive';
  duration: number; // in minutes
  enablePhysiologicalSync: boolean;
  llmConfig: {
    provider: string;
    model: string;
    apiKey: string;
    baseUrl: string;
    systemPrompt: string;
  };
}

const StagHuntGame = () => {
  const [gameState, setGameState] = useState<GameState>('introduction');
  const [config, setConfig] = useState<ExperimentConfig | null>(null);
  const [gameResults, setGameResults] = useState<any>(null);
  const { sendSyncMarker } = usePhysiologicalSync();

  const handleConfigComplete = (newConfig: ExperimentConfig) => {
    setConfig(newConfig);
    setGameState('experiment');
    // 发送实验配置同步标记
    sendSyncMarker('experiment_config', { 
      config: {
        playerRole: newConfig.playerRole,
        difficulty: newConfig.difficulty,
        gridSize: newConfig.gridSize,
        aiStrategy: newConfig.aiStrategy,
        duration: newConfig.duration,
        llmModel: newConfig.llmConfig.model
      }
    });
  };

  const handleExperimentComplete = (results: any) => {
    setGameResults(results);
    setGameState('results');
    // 发送实验完成同步标记
    sendSyncMarker('experiment_complete', {
      timestamp: Date.now(),
      results: {
        totalScore: results.totalScore,
        stagsHunted: results.stagsHunted,
        haresHunted: results.haresHunted,
        cooperationRate: results.cooperationRate
      }
    });
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
              <Introduction onStart={() => {
                setGameState('setup');
                sendSyncMarker('experiment_start', { stage: 'introduction' });
              }} />
            )}

            {gameState === 'setup' && (
              <ExperimentSetup onComplete={handleConfigComplete} />
            )}

            {gameState === 'experiment' && config && (
              <GameInterface 
                config={config}
                onComplete={handleExperimentComplete}
                onBack={() => setGameState('setup')}
              />
            )}

            {gameState === 'results' && gameResults && (
              <ResultsAnalysis 
                results={gameResults}
                config={config!}
                onRestart={() => {
                  setGameState('introduction');
                  setConfig(null);
                  setGameResults(null);
                  sendSyncMarker('experiment_restart');
                }}
              />
            )}
          </motion.div>
        </div>
      </div>
      
      {/* 生理信号同步组件 */}
      {config?.enablePhysiologicalSync && (
        <PhysiologicalSync 
          experimentId="stag-hunt-game"
          participantId={`participant-${Date.now()}`}
          onSyncEvent={(eventType, timestamp, metadata) => {
            console.log(`Sync event: ${eventType} at ${timestamp}`, metadata);
          }}
        />
      )}
    </div>
  );
};

export default StagHuntGame;