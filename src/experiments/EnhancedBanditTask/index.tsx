import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';
import Introduction from './Introduction';
import ExperimentSetup from './ExperimentSetup';
import ExperimentTask from './ExperimentTask';
import ResultsComparison from './ResultsComparison';

export type GameState = 'introduction' | 'setup' | 'experiment' | 'results';

export interface ExperimentConfig {
  totalTrials: number;
  numBandits: number;
  llmModel: string;
  comparisonMode: 'human-vs-llm' | 'human-only' | 'llm-only';
  rewardStructure: 'static' | 'dynamic';
  socialComparison: boolean;
  emotionalFeedback: boolean;
  // 新增的API配置
  apiConfig: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
  };
  // 新增的prompt配置
  promptConfig: {
    systemPrompt: string;
    decisionPrompt: string;
    customInstructions: string;
  };
}

export interface TrialData {
  trial: number;
  humanChoice?: number;
  llmChoice?: number;
  humanReward?: number;
  llmReward?: number;
  humanReactionTime?: number;
  llmReactionTime?: number;
  banditMeans: number[];
  timestamp: number;
  llmResponse?: string; // 新增：记录LLM的原始响应
  llmThinking?: string; // 新增：记录LLM的思考过程
}

const EnhancedBanditTask = () => {
  const [gameState, setGameState] = useState<GameState>('introduction');
  const [config, setConfig] = useState<ExperimentConfig | null>(null);
  const [experimentData, setExperimentData] = useState<TrialData[]>([]);

  const handleConfigComplete = (newConfig: ExperimentConfig) => {
    setConfig(newConfig);
    setGameState('experiment');
  };

  const handleExperimentComplete = (data: TrialData[]) => {
    setExperimentData(data);
    setGameState('results');
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
              <Introduction onStart={() => setGameState('setup')} />
            )}

            {gameState === 'setup' && (
              <ExperimentSetup onComplete={handleConfigComplete} />
            )}

            {gameState === 'experiment' && config && (
              <ExperimentTask 
                config={config}
                onComplete={handleExperimentComplete}
                onBack={() => setGameState('setup')}
              />
            )}

            {gameState === 'results' && config && (
              <ResultsComparison 
                config={config}
                data={experimentData}
                onRestart={() => {
                  setGameState('introduction');
                  setConfig(null);
                  setExperimentData([]);
                }}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBanditTask;