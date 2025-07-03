import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bot, Users, BarChart3, Zap } from 'lucide-react';
import Button from '../../components/Button';
import { ExperimentConfig } from './index';

interface ExperimentSetupProps {
  onComplete: (config: ExperimentConfig) => void;
}

const ExperimentSetup = ({ onComplete }: ExperimentSetupProps) => {
  const [config, setConfig] = useState<ExperimentConfig>({
    totalTrials: 100,
    numBandits: 4,
    llmModel: 'gpt-4',
    comparisonMode: 'human-vs-llm',
    rewardStructure: 'dynamic',
    socialComparison: true,
    emotionalFeedback: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(config);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex items-center space-x-4 mb-6">
        <Settings className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">实验配置</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基础设置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              试验次数
            </label>
            <select
              value={config.totalTrials}
              onChange={(e) => setConfig(prev => ({ ...prev, totalTrials: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={50}>50次（快速测试）</option>
              <option value={100}>100次（标准）</option>
              <option value={200}>200次（深度研究）</option>
              <option value={300}>300次（完整研究）</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              老虎机数量
            </label>
            <select
              value={config.numBandits}
              onChange={(e) => setConfig(prev => ({ ...prev, numBandits: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={2}>2个（简单）</option>
              <option value={4}>4个（标准）</option>
              <option value={6}>6个（复杂）</option>
              <option value={8}>8个（高难度）</option>
            </select>
          </div>
        </div>

        {/* AI模型选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Bot className="inline w-4 h-4 mr-1" />
            AI模型选择
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {llmModels.map((model) => (
              <motion.div
                key={model.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  config.llmModel === model.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, llmModel: model.id }))}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="font-medium text-gray-900">{model.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">{model.provider}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{model.capability}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 实验模式 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline w-4 h-4 mr-1" />
            实验模式
          </label>
          <div className="space-y-3">
            {comparisonModes.map((mode) => (
              <motion.div
                key={mode.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  config.comparisonMode === mode.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, comparisonMode: mode.id as any }))}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    {mode.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{mode.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{mode.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 高级设置 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">高级设置</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                奖励结构
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="static"
                    checked={config.rewardStructure === 'static'}
                    onChange={(e) => setConfig(prev => ({ ...prev, rewardStructure: e.target.value as any }))}
                    className="mr-2"
                  />
                  静态奖励（固定概率分布）
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="dynamic"
                    checked={config.rewardStructure === 'dynamic'}
                    onChange={(e) => setConfig(prev => ({ ...prev, rewardStructure: e.target.value as any }))}
                    className="mr-2"
                  />
                  动态奖励（随时间变化）
                </label>
              </div>
            </div>

            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.socialComparison}
                  onChange={(e) => setConfig(prev => ({ ...prev, socialComparison: e.target.checked }))}
                  className="mr-2"
                />
                启用社会比较反馈
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.emotionalFeedback}
                  onChange={(e) => setConfig(prev => ({ ...prev, emotionalFeedback: e.target.checked }))}
                  className="mr-2"
                />
                启用情感反馈
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="submit" variant="primary" size="lg">
            开始实验
          </Button>
        </div>
      </form>
    </div>
  );
};

const llmModels = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: '最先进的语言模型，具有强大的推理能力',
    provider: 'OpenAI',
    capability: '高级推理'
  },
  {
    id: 'claude-3',
    name: 'Claude-3',
    description: '注重安全性和准确性的AI助手',
    provider: 'Anthropic',
    capability: '安全可靠'
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    description: 'Google的多模态AI模型',
    provider: 'Google',
    capability: '多模态'
  }
];

const comparisonModes = [
  {
    id: 'human-vs-llm',
    name: '人机对比模式',
    description: '您与AI同时进行决策，实时比较策略和表现',
    icon: <Users className="w-4 h-4" />
  },
  {
    id: 'human-only',
    name: '纯人类模式',
    description: '传统的人类决策实验，专注于人类行为研究',
    icon: <Users className="w-4 h-4" />
  },
  {
    id: 'llm-only',
    name: 'AI观察模式',
    description: '观察AI的决策过程，分析其策略和学习模式',
    icon: <Bot className="w-4 h-4" />
  }
];

export default ExperimentSetup;