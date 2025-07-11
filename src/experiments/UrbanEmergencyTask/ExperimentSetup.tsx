import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Users, Map, Radio, AlertCircle, Clock, Cpu, Key, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/Button';
import { ExperimentConfig } from './index';

interface ExperimentSetupProps {
  onComplete: (config: ExperimentConfig) => void;
}

const ExperimentSetup = ({ onComplete }: ExperimentSetupProps) => {
  const [config, setConfig] = useState<ExperimentConfig>({
    participantRole: 'coordinator',
    difficulty: 'medium',
    scenarioType: 'mixed',
    communicationMode: 'limited',
    aiAgents: true,
    duration: 30,
    teamSize: 5,
    llmConfig: {
      provider: 'openai',
      model: 'gpt-4',
      apiKey: '',
      baseUrl: '',
      systemPrompt: `你是一个城市应急响应系统中的AI代理，负责在突发事件中协助人类决策者。
你的目标是提供有用的建议，帮助协调资源，并确保城市系统的稳定运行。

在回应时，请考虑以下因素：
1. 事件的严重程度和影响范围
2. 可用资源的类型和数量
3. 其他系统的状态
4. 优先级和紧急程度

保持简洁、专业和有帮助的态度。在紧急情况下，直接提供行动建议。`
    }
  });
  const [showApiKey, setShowApiKey] = useState(false);

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
        {/* 角色选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="inline w-4 h-4 mr-1" />
            选择您的角色
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((role) => (
              <motion.div
                key={role.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  config.participantRole === role.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, participantRole: role.id as any }))}
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
            <AlertCircle className="inline w-4 h-4 mr-1" />
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

        {/* 场景类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Map className="inline w-4 h-4 mr-1" />
            场景类型
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarioTypes.map((scenario) => (
              <motion.div
                key={scenario.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  config.scenarioType === scenario.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, scenarioType: scenario.id as any }))}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="font-medium text-gray-900">{scenario.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{scenario.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 通信模式 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Radio className="inline w-4 h-4 mr-1" />
            通信模式
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {communicationModes.map((mode) => (
              <motion.div
                key={mode.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  config.communicationMode === mode.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setConfig(prev => ({ ...prev, communicationMode: mode.id as any }))}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="font-medium text-gray-900">{mode.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{mode.description}</p>
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
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
                <option value={15}>15分钟（快速）</option>
                <option value={30}>30分钟（标准）</option>
                <option value={45}>45分钟（深入）</option>
                <option value={60}>60分钟（完整）</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                团队规模
              </label>
              <select
                value={config.teamSize}
                onChange={(e) => setConfig(prev => ({ ...prev, teamSize: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={3}>3人团队（小型）</option>
                <option value={5}>5人团队（标准）</option>
                <option value={7}>7人团队（大型）</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.aiAgents}
                  onChange={(e) => setConfig(prev => ({ ...prev, aiAgents: e.target.checked }))}
                  className="mr-2"
                />
                <Cpu className="w-4 h-4 mr-2 text-gray-600" />
                <span>启用AI代理（未填满的角色将由AI代理扮演）</span>
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
    id: 'traffic',
    name: '交通调度员',
    description: '控制交通信号、疏导车辆、规划紧急通道'
  },
  {
    id: 'power',
    name: '电力管理员',
    description: '管理电力分配、处理电网故障、确保关键设施供电'
  },
  {
    id: 'emergency',
    name: '应急响应协调员',
    description: '分配应急资源、协调救援行动、制定响应策略'
  },
  {
    id: 'medical',
    name: '医疗资源调配员',
    description: '分配医疗资源、管理伤员转运、优化医院容量'
  },
  {
    id: 'coordinator',
    name: '中央协调员',
    description: '整合信息、协调各部门行动、制定全局策略'
  }
];

const difficulties = [
  {
    id: 'easy',
    name: '简单',
    description: '事件发生频率低，资源充足，通信限制少'
  },
  {
    id: 'medium',
    name: '中等',
    description: '适中的事件频率和资源限制，部分通信限制'
  },
  {
    id: 'hard',
    name: '困难',
    description: '高频率事件，严格的资源限制，严格的通信限制'
  }
];

const scenarioTypes = [
  {
    id: 'natural',
    name: '自然灾害',
    description: '地震、洪水、暴风雨等自然灾害场景'
  },
  {
    id: 'manmade',
    name: '人为事件',
    description: '交通事故、建筑火灾、基础设施故障等人为事件'
  },
  {
    id: 'mixed',
    name: '混合场景',
    description: '自然灾害和人为事件的混合场景，更贴近现实'
  }
];

const communicationModes = [
  {
    id: 'full',
    name: '完全通信',
    description: '所有参与者可以自由通信，无限制'
  },
  {
    id: 'limited',
    name: '有限通信',
    description: '通信受到时间和频率限制，模拟资源受限情况'
  },
  {
    id: 'hierarchical',
    name: '层级通信',
    description: '只能与特定角色通信，模拟组织层级结构'
  }
];

export default ExperimentSetup;