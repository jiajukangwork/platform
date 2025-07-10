import { motion } from 'framer-motion';
import { Car, ChevronRight, Gauge, Zap, Target, Brain, Clock, Trophy } from 'lucide-react';
import Button from '../../components/Button';

interface IntroductionProps {
  onStart: () => void;
}

const Introduction = ({ onStart }: IntroductionProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex items-center space-x-4 mb-6">
        <Car className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          速度博弈：动态决策与策略适应实验
        </h1>
      </div>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg">
          欢迎参加速度博弈实验。本实验模拟在交通情境下的人机对抗博弈，考察您在动态环境中的决策能力和策略适应性。
        </p>

        <div className="my-8">
          <div className="relative h-80 rounded-xl overflow-hidden">
            <img 
              src="https://images.pexels.com/photos/3422964/pexels-photo-3422964.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
              alt="交通博弈场景" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white">速度策略博弈</h3>
                <p className="mt-2 text-gray-200">
                  在动态环境中做出最优决策，赢得速度博弈
                </p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold mt-8 mb-4">实验说明</h2>
        <div className="bg-gray-50 p-6 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
          <p>
            游戏地图为一个人字形道路，两个小车开始分别在两条道路上从下往上行驶，左边的红色小车由您控制，右边的蓝色小车（您的对手）由电脑控制，最终交汇在一起一条道路上。
          </p>
          
          <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">游戏内容</h3>
          <p>
            您需要控制小车来和不同的对手（由电脑控制）在一定规则下进行博弈，最大化最终获得的得分。
          </p>
          
          <h3 className="text-lg font-medium text-gray-900 mt-6 mb-4">操作方式</h3>
          <p>
            按下主键盘的 2 / 3 / 4 / 5 控制小车的速度，例如小车当前速度为 20 如果您按下 4，那么小车会迅速加速直到速度达到 40，小车的加速度取决于当前速度与您按键对应速度的差值，差值越大加速度越大。其中选择 2 / 3 为低速行驶，选择 4 / 5 为高速行驶。
          </p>
          <p className="mt-2">
            <strong>您只能控制小车的速度，不需要控制小车的方向。</strong>
          </p>
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
          <li>探索人类在动态环境中的决策策略</li>
          <li>研究对手建模与策略适应能力</li>
          <li>分析风险偏好对博弈行为的影响</li>
          <li>评估有限控制条件下的认知负荷</li>
          <li>为交通系统中的人机交互设计提供依据</li>
        </ul>
      </div>

      <Button 
        variant="primary"
        className="mt-8 w-full"
        onClick={onStart}
      >
        开始实验
        <ChevronRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
};

const features = [
  {
    icon: <Gauge className="w-4 h-4" />,
    title: "速度策略",
    description: "通过调整速度来应对不同对手的策略，寻找最优博弈平衡"
  },
  {
    icon: <Target className="w-4 h-4" />,
    title: "对手建模",
    description: "分析对手行为模式，预测其决策，制定相应的应对策略"
  },
  {
    icon: <Zap className="w-4 h-4" />,
    title: "动态适应",
    description: "在不断变化的环境中快速调整策略，适应新的博弈情境"
  },
  {
    icon: <Brain className="w-4 h-4" />,
    title: "认知控制",
    description: "在有限控制条件下平衡速度、风险与收益的权衡决策"
  },
  {
    icon: <Clock className="w-4 h-4" />,
    title: "时间压力",
    description: "在时间限制下做出快速决策，模拟真实交通环境中的压力"
  },
  {
    icon: <Trophy className="w-4 h-4" />,
    title: "策略优化",
    description: "通过多轮博弈学习和优化策略，提高整体表现"
  }
];

export default Introduction;