import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bot, Users, BarChart3, Zap, Key, MessageSquare, Eye, EyeOff, TestTube } from 'lucide-react';
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
    emotionalFeedback: true,
    // 新增的API配置
    apiConfig: {
      provider: 'openai',
      apiKey: '',
      baseUrl: '',
      model: 'gpt-4'
    },
    // 新增的prompt配置
    promptConfig: {
      systemPrompt: `你是一个参与多臂老虎机实验的智能体。你需要在多个选项中做出选择以最大化累积奖励。

实验规则：
- 你面前有{numBandits}个选项（老虎机）
- 每个选项都有不同的奖励分布
- 你的目标是通过学习找到最优策略
- 需要平衡探索新选项和利用已知好选项

请根据当前情况做出理性的选择。`,
      decisionPrompt: `当前状态：
- 轮次：{currentTrial}/{totalTrials}
- 可选选项：{availableOptions}
- 历史选择记录：{history}
- 各选项统计：{banditStats}

请分析当前情况并选择一个选项（0到{numBandits-1}）。只需要返回选项编号，不需要解释。`,
      customInstructions: ''
    }
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(config);
  };

  const testApiConnection = async () => {
    if (!config.apiConfig.apiKey) {
      alert('请先输入API Key');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const response = await fetch('/api/test-llm-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: config.apiConfig.provider,
          apiKey: config.apiConfig.apiKey,
          baseUrl: config.apiConfig.baseUrl,
          model: config.apiConfig.model
        })
      });

      if (response.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('API连接测试失败:', error);
      setConnectionStatus('error');
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

        {/* API配置部分 */}
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Key className="w-5 h-5 mr-2" />
            大模型API配置
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API提供商
              </label>
              <select
                value={config.apiConfig.provider}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  apiConfig: { ...prev.apiConfig, provider: e.target.value }
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
              <input
                type="text"
                value={config.apiConfig.model}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  apiConfig: { ...prev.apiConfig, model: e.target.value }
                }))}
                placeholder="例如: gpt-4, claude-3-sonnet, gemini-pro"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={config.apiConfig.apiKey}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    apiConfig: { ...prev.apiConfig, apiKey: e.target.value }
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
                  onClick={testApiConnection}
                  disabled={testingConnection || !config.apiConfig.apiKey}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <TestTube className={`w-4 h-4 ${testingConnection ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {connectionStatus === 'success' && (
                <p className="mt-1 text-sm text-green-600">✓ API连接测试成功</p>
              )}
              {connectionStatus === 'error' && (
                <p className="mt-1 text-sm text-red-600">✗ API连接测试失败，请检查配置</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自定义API地址（可选）
              </label>
              <input
                type="url"
                value={config.apiConfig.baseUrl}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  apiConfig: { ...prev.apiConfig, baseUrl: e.target.value }
                }))}
                placeholder="例如: https://api.openai.com/v1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                留空将使用默认API地址
              </p>
            </div>
          </div>
        </div>

        {/* Prompt配置部分 */}
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Prompt配置
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                系统提示词
              </label>
              <textarea
                value={config.promptConfig.systemPrompt}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  promptConfig: { ...prev.promptConfig, systemPrompt: e.target.value }
                }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="定义AI的角色和基本规则..."
              />
              <p className="mt-1 text-xs text-gray-500">
                可使用变量: {'{numBandits}'}, {'{totalTrials}'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                决策提示词
              </label>
              <textarea
                value={config.promptConfig.decisionPrompt}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  promptConfig: { ...prev.promptConfig, decisionPrompt: e.target.value }
                }))}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="每次决策时发送给AI的提示..."
              />
              <p className="mt-1 text-xs text-gray-500">
                可使用变量: {'{currentTrial}'}, {'{totalTrials}'}, {'{availableOptions}'}, {'{history}'}, {'{banditStats}'}, {'{numBandits}'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自定义指令（可选）
              </label>
              <textarea
                value={config.promptConfig.customInstructions}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  promptConfig: { ...prev.promptConfig, customInstructions: e.target.value }
                }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="添加特殊的实验指令或约束..."
              />
            </div>
          </div>
        </div>

        {/* 实验模式 */}
        <div className="border-t pt-8">
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
        <div className="border-t pt-8">
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