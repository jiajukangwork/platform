import { motion } from 'framer-motion';
import { Beer as Deer, Rabbit, ChevronRight, Users, Network, Brain, Zap, Map, Target, Cpu } from 'lucide-react';
import Button from '../../components/Button';

interface IntroductionProps {
  onStart: () => void;
}

const Introduction = ({ onStart }: IntroductionProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex items-center space-x-4 mb-6">
        <Deer className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          猎鹿任务：信念推理与协作策略实验
        </h1>
      </div>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg">
          欢迎参加猎鹿任务实验。本实验基于经典博弈论中的"猎鹿游戏"设计，模拟人与智能体之间的合作博弈过程，
          探索递归信念推理与协作策略形成的认知机制。
        </p>

        <div className="my-8">
          <div className="relative h-80 rounded-xl overflow-hidden">
            <img 
              src="https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
              alt="猎鹿游戏场景" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white">信念推理与协作策略</h3>
                <p className="mt-2 text-gray-200">
                  在不确定环境中推测伙伴意图，形成最优协作策略
                </p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold mt-8 mb-4">实验概述</h2>
        <p>
          本实验基于经典博弈论中的"猎鹿游戏"设计，模拟人与智能体之间的合作博弈过程。参与者在二维网格环境中与一个策略多变的AI代理协作追捕猎物（兔子与鹿），以获得最高得分。实验核心在于递归信念推理，即玩家需推测AI是否会合作，并据此调整自身策略，从而探索"我相信你会相信我会合作"的认知过程。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 not-prose">
          <div className="bg-primary-50 p-6 rounded-xl border border-primary-100">
            <div className="flex items-center space-x-3 mb-4">
              <Deer className="w-6 h-6 text-primary-600" />
              <h3 className="text-xl font-bold text-primary-900">猎鹿策略</h3>
            </div>
            <p className="text-primary-700">
              需要两名猎人协作才能成功捕获。获得高额奖励（+10分），但风险更高，如果伙伴不配合，将一无所获（0分）。
            </p>
          </div>
          
          <div className="bg-secondary-50 p-6 rounded-xl border border-secondary-100">
            <div className="flex items-center space-x-3 mb-4">
              <Rabbit className="w-6 h-6 text-secondary-600" />
              <h3 className="text-xl font-bold text-secondary-900">猎兔策略</h3>
            </div>
            <p className="text-secondary-700">
              可以独自完成捕获。获得较低奖励（+3分），但稳定可靠，不依赖伙伴的行动选择。
            </p>
          </div>
        </div>

        <h2 className="text-xl font-bold mt-8 mb-4">实验特点</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-primary-600">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{feature.title}</h3>
                <p className="mt-1 text-gray-600">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <h2 className="text-xl font-bold mt-8 mb-4">研究价值</h2>
        <ul className="space-y-3">
          <li>探索人类在社会互动中的递归信念推理能力</li>
          <li>研究合作行为的认知基础与决策机制</li>
          <li>分析人类与AI系统在协作任务中的互动模式</li>
          <li>评估不同难度条件下的策略适应与学习过程</li>
          <li>为人机协作系统设计提供认知科学依据</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4">实验流程</h2>
        <ol className="space-y-3">
          <li>阅读实验说明并配置实验参数</li>
          <li>完成简短的训练阶段，熟悉游戏规则</li>
          <li>在网格环境中与AI代理协作捕猎</li>
          <li>根据AI行为调整自身策略，最大化得分</li>
          <li>实验结束后查看详细分析结果</li>
        </ol>
      </div>

      <Button 
        variant="primary"
        className="mt-8 w-full"
        onClick={onStart}
      >
        开始配置实验
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
};

const features = [
  {
    icon: <Network className="w-4 h-4" />,
    title: "递归信念推理",
    description: "探索'我相信你会相信我会合作'的多层次认知过程"
  },
  {
    icon: <Map className="w-4 h-4" />,
    title: "动态网格环境",
    description: "在二维网格中追踪移动猎物，需要实时调整策略"
  },
  {
    icon: <Brain className="w-4 h-4" />,
    title: "心智理论建模",
    description: "通过行为推测AI代理的意图和策略，形成最优应对"
  },
  {
    icon: <Target className="w-4 h-4" />,
    title: "策略适应机制",
    description: "根据AI行为模式的变化，动态调整自身策略"
  },
  {
    icon: <Cpu className="w-4 h-4" />,
    title: "大语言模型集成",
    description: "使用先进的LLM技术模拟智能代理的决策过程"
  },
  {
    icon: <Zap className="w-4 h-4" />,
    title: "实时反馈系统",
    description: "提供即时行为反馈，支持策略学习与调整"
  }
];

export default Introduction;