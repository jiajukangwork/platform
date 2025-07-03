import { motion } from 'framer-motion';
import { Brain, ChevronRight, Bot, Users, BarChart3, Zap } from 'lucide-react';
import Button from '../../components/Button';

interface IntroductionProps {
  onStart: () => void;
}

const Introduction = ({ onStart }: IntroductionProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex items-center space-x-4 mb-6">
        <Brain className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          增强版多臂老虎机任务：人机决策对比研究
        </h1>
      </div>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg">
          欢迎参加我们的增强版多臂老虎机实验。这项研究将人类决策与大语言模型的决策进行对比，
          探索人工智能在探索-利用权衡中的行为模式。
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">实验创新点</h2>
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

        <h2 className="text-xl font-bold mt-8 mb-4">实验模式</h2>
        <ul className="space-y-3">
          <li><strong>人机对比模式：</strong>您与AI同时进行决策，实时比较策略差异</li>
          <li><strong>纯人类模式：</strong>传统的人类决策研究</li>
          <li><strong>AI观察模式：</strong>观察AI的决策过程和策略演化</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4">研究价值</h2>
        <ul className="space-y-3">
          <li>理解人类与AI在不确定环境下的决策差异</li>
          <li>探索AI的探索-利用策略与人类直觉的对比</li>
          <li>研究社会比较对决策行为的影响</li>
          <li>分析情感反馈在决策过程中的作用</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4">技术特色</h2>
        <ul className="space-y-3">
          <li>集成多种大语言模型（GPT-4、Claude、Gemini等）</li>
          <li>实时决策对比和可视化分析</li>
          <li>动态奖励结构和环境变化</li>
          <li>多维度数据收集和分析</li>
        </ul>
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
    icon: <Bot className="w-4 h-4" />,
    title: "AI决策模拟",
    description: "使用先进的大语言模型模拟人类决策过程，提供真实的AI行为基准"
  },
  {
    icon: <Users className="w-4 h-4" />,
    title: "实时对比",
    description: "人类与AI同步决策，实时观察策略差异和学习模式"
  },
  {
    icon: <BarChart3 className="w-4 h-4" />,
    title: "深度分析",
    description: "多维度数据分析，包括反应时间、策略演化、收益对比等"
  },
  {
    icon: <Zap className="w-4 h-4" />,
    title: "动态环境",
    description: "支持动态奖励结构，模拟真实世界的不确定性和变化"
  }
];

export default Introduction;