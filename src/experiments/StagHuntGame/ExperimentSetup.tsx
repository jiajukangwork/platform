import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Users, Map, Target, Brain, Clock, Cpu, Key, Eye, EyeOff, TestTube, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../components/Button';
import { ExperimentConfig } from './index';
import { callLLMAPI } from './utils/llmService';

interface ExperimentSetupProps {
  onComplete: (config: ExperimentConfig) => void;
}

const ExperimentSetup = ({ onComplete }: ExperimentSetupProps) => {
  const [config, setConfig] = useState<ExperimentConfig>({
    playerRole: 'hunter',
    difficulty: 'medium',
    gridSize: 'medium',
    aiStrategy: 'adaptive',
    duration: 20,
    enablePhysiologicalSync: false,
    llmConfig: {
      provider: 'openai',
      model: 'gpt-4',
      apiKey: '',
      baseUrl: '',
      systemPrompt: `你是一个参与猎鹿游戏的AI代理。在这个游戏中，你需要与人类玩家协作，在网格环境中捕获猎物。

游戏规则：
1. 环境中有两种猎物：鹿和兔子
2. 捕获鹿需要两名猎人协作，奖励为10分
3. 捕获兔子可以独自完成，奖励为3分
4. 如果一名猎人尝试独自捕获鹿，将一无所获

你的目标是理解人类玩家的意图，并做出最优决策。你需要考虑：
- 人类玩家过去的行为模式
- 当前环境中猎物的位置和类型
- 最大化长期累积奖励

请根据游戏状态提供简洁、明确的决策，并简要解释你的推理过程。`
    }
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [customModel, setCustomModel] = useState('');
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If using custom model, update the config
    const finalConfig = {...config};
    if (useCustomModel && customModel.trim() !== '') {
      finalConfig.llmConfig.model = customModel.trim();
    }
    
    onComplete(finalConfig);
  };

  const testConnection = async () => {
    // 验证是否有API Key
    if (!config.llmConfig.apiKey) {
      setConnectionStatus('error');
      setConnectionMessage('请先输入API Key');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');
    setConnectionMessage('');

    try {
      // 使用简单的测试提示
      const testPrompt = "请回复数字1";
      const modelToTest = useCustomModel && customModel.trim() !== '' ? customModel.trim() : config.llmConfig.model;
      
      const response = await callLLMAPI(
        testPrompt,
        config.llmConfig.provider,
        modelToTest,
        config.llmConfig.apiKey,
        config.llmConfig.baseUrl,
        "你是一个测试助手。请简单回复。"
      );
      
      // 检查响应是否有效
      if (response && response.trim() !== '') {
        setConnectionStatus('success');
        setConnectionMessage(`连接成功！模型响应: "${response.substring(0, 30)}${response.length > 30 ? '...' : ''}"`);
      } else {
        setConnectionStatus('error');
        setConnectionMessage('连接成功但响应为空');
      }
    } catch (error) {
      console.error('API连接测试失败:', error);
      setConnectionStatus('error');
      setConnectionMessage(error instanceof Error ? error.message : '未知错误');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex items-center space-x-4 mb-6">
        <Settings className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">实验配置</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 角色选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline w-4 h-4 mr-1" />
            选择您的角色
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <motion.div
                key={role.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  config.playerRole === role.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, playerRole: role.id as any }))}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="font-medium text-gray-900">{role.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{role.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 难度设置 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Target className="inline w-4 h-4 mr-1" />
            难度设置
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {difficulties.map((difficulty) => (
              <motion.div
                key={difficulty.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  config.difficulty === difficulty.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, difficulty: difficulty.id as any }))}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="font-medium text-gray-900">{difficulty.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{difficulty.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 网格大小 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Map className="inline w-4 h-4 mr-1" />
            网格大小
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {gridSizes.map((size) => (
              <motion.div
                key={size.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  config.gridSize === size.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, gridSize: size.id as any }))}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="font-medium text-gray-900">{size.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{size.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI策略 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Brain className="inline w-4 h-4 mr-1" />
            AI策略
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiStrategies.map((strategy) => (
              <motion.div
                key={strategy.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  config.aiStrategy === strategy.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, aiStrategy: strategy.id as any }))}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="font-medium text-gray-900">{strategy.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{strategy.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 大语言模型配置 */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Key className="w-5 h-5 mr-2" />
            大语言模型配置
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API提供商
              </label>
              <select
                value={config.llmConfig.provider}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  llmConfig: { ...prev.llmConfig, provider: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="google">Google (Gemini)</option>
                <option value="custom">自定义</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模型名称
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={useCustomModel}
                    onChange={(e) => setUseCustomModel(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">使用自定义模型名称</span>
                </div>
                
                {useCustomModel ? (
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="输入自定义模型名称"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                ) : (
                  <select
                    value={config.llmConfig.model}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      llmConfig: { ...prev.llmConfig, model: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </select>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={config.llmConfig.apiKey}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    llmConfig: { ...prev.llmConfig, apiKey: e.target.value }
                  }))}
                  placeholder="输入您的API Key"
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-12 flex items-center px-2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testingConnection || !config.llmConfig.apiKey}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <TestTube className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="mt-1">
                {connectionStatus === 'success' && (
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {connectionMessage}
                  </p>
                )}
                {connectionStatus === 'error' && (
                  <p className="text-sm text-red-600 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" />
                    连接失败: {connectionMessage}
                  </p>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                您的API密钥将仅用于此实验，不会被存储或用于其他目的
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自定义API地址（可选）
              </label>
              <input
                type="url"
                value={config.llmConfig.baseUrl}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  llmConfig: { ...prev.llmConfig, baseUrl: e.target.value }
                }))}
                placeholder="例如: https://api.openai.com/v1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                留空将使用默认API地址
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                系统提示词
              </label>
              <textarea
                value={config.llmConfig.systemPrompt}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  llmConfig: { ...prev.llmConfig, systemPrompt: e.target.value }
                }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="定义AI代理的角色和行为..."
              />
              <p className="mt-1 text-xs text-gray-500">
                这将定义AI代理的行为模式和响应风格
              </p>
            </div>
          </div>
        </div>

        {/* 高级设置 */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">高级设置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline w-4 h-4 mr-1" />
                实验时长（分钟）
              </label>
              <select
                value={config.duration}
                onChange={(e) => setConfig(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={10}>10分钟（快速）</option>
                <option value={20}>20分钟（标准）</option>
                <option value={30}>30分钟（深入）</option>
                <option value={45}>45分钟（完整）</option>
              </select>
            </div>

            <div className="md:col-span-1">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enablePhysiologicalSync}
                  onChange={(e) => setConfig(prev => ({ ...prev, enablePhysiologicalSync: e.target.checked }))}
                  className="mr-2"
                />
                <Cpu className="w-4 h-4 mr-2 text-gray-600" />
                <span>启用生理信号同步（需要外部设备）</span>
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

const roles = [
  {
    id: 'hunter',
    name: '猎人',
    description: '主动参与捕猎，与AI代理协作完成任务'
  },
  {
    id: 'observer',
    name: '观察者',
    description: '观察两个AI代理之间的互动，分析其策略和信念推理过程'
  }
];

const difficulties = [
  {
    id: 'easy',
    name: '简单',
    description: 'AI代理策略相对稳定，猎物移动速度较慢'
  },
  {
    id: 'medium',
    name: '中等',
    description: 'AI代理策略有一定变化，猎物移动速度适中'
  },
  {
    id: 'hard',
    name: '困难',
    description: 'AI代理策略多变，猎物移动速度快，需要更高级的推理能力'
  }
];

const gridSizes = [
  {
    id: 'small',
    name: '小型网格 (5x5)',
    description: '较小的环境，互动更频繁，适合快速实验'
  },
  {
    id: 'medium',
    name: '中型网格 (8x8)',
    description: '平衡的环境大小，适合标准实验'
  },
  {
    id: 'large',
    name: '大型网格 (12x12)',
    description: '较大的环境，策略规划更复杂，互动较少'
  }
];

const aiStrategies = [
  {
    id: 'cooperative',
    name: '合作型',
    description: 'AI倾向于选择合作策略，优先追捕鹿'
  },
  {
    id: 'competitive',
    name: '竞争型',
    description: 'AI倾向于独立行动，优先追捕兔子'
  },
  {
    id: 'adaptive',
    name: '适应型',
    description: 'AI会根据玩家行为动态调整策略，模拟真实社会互动'
  }
];

export default ExperimentSetup;