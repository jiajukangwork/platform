import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';
import Introduction from './Introduction';
import ExperimentSetup from './ExperimentSetup';
import GameInterface from './GameInterface';
import { usePhysiologicalSync } from '../../components/PhysiologicalSyncContext';
import PhysiologicalSync from '../../components/PhysiologicalSync';

export type GameState = 'introduction' | 'setup' | 'experiment' | 'results';

export interface ExperimentConfig {
  participantRole: 'traffic' | 'power' | 'emergency' | 'medical' | 'coordinator';
  difficulty: 'easy' | 'medium' | 'hard';
  scenarioType: 'natural' | 'manmade' | 'mixed';
  communicationMode: 'full' | 'limited' | 'hierarchical';
  aiAgents: boolean;
  duration: number; // in minutes
  teamSize: number;
  llmConfig: {
    provider: string;
    model: string;
    apiKey: string;
    baseUrl: string;
    systemPrompt: string;
  };
}

const UrbanEmergencyTask = () => {
  const [gameState, setGameState] = useState<GameState>('introduction');
  const [config, setConfig] = useState<ExperimentConfig | null>(null);
  const { sendSyncMarker } = usePhysiologicalSync();

  const handleConfigComplete = (newConfig: ExperimentConfig) => {
    setConfig(newConfig);
    setGameState('experiment');
    // 发送实验配置同步标记
    sendSyncMarker('experiment_config', { 
      config: {
        participantRole: newConfig.participantRole,
        difficulty: newConfig.difficulty,
        scenarioType: newConfig.scenarioType,
        communicationMode: newConfig.communicationMode,
        aiAgents: newConfig.aiAgents,
        duration: newConfig.duration,
        teamSize: newConfig.teamSize,
        llmModel: newConfig.llmConfig.model
      }
    });
  };

  const handleExperimentComplete = () => {
    setGameState('results');
    // 发送实验完成同步标记
    sendSyncMarker('experiment_complete', {
      timestamp: Date.now()
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

            {gameState === 'results' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">实验结束</h2>
                <p className="text-gray-600 mb-8">
                  感谢您参与城市应急任务实验！您的数据已被记录，将用于研究分析。
                </p>
                <div className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setGameState('introduction')}
                  >
                    重新开始
                  </Button>
                  <Button 
                    variant="primary" 
                    href="/experiments"
                  >
                    返回实验列表
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* 生理信号同步组件 */}
      <PhysiologicalSync 
        experimentId="urban-emergency-task"
        participantId={`participant-${Date.now()}`}
        onSyncEvent={(eventType, timestamp, metadata) => {
          console.log(`Sync event: ${eventType} at ${timestamp}`, metadata);
        }}
      />
    </div>
  );
};

export default UrbanEmergencyTask;