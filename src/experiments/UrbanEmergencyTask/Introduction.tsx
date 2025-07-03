import { motion } from 'framer-motion';
import { Building, ChevronRight, Users, Network, Brain, Zap, Map, AlertTriangle, Cpu, Radio } from 'lucide-react';
import Button from '../../components/Button';

interface IntroductionProps {
  onStart: () => void;
}

const Introduction = ({ onStart }: IntroductionProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex items-center space-x-4 mb-6">
        <Building className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">
          城市应急任务：多智能体认知协作与资源调配实验
        </h1>
      </div>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg">
          欢迎参加城市应急任务实验。本实验模拟智慧城市中的突发事件响应场景，您将与其他参与者共同协作，
          在信息受限的环境中完成复杂的资源调配任务。
        </p>

        <div className="my-8">
          <div className="relative h-80 rounded-xl overflow-hidden">
            <img 
              src="https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
              alt="城市应急响应中心" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white">智慧城市应急响应</h3>
                <p className="mt-2 text-gray-200">
                  在复杂的城市环境中协调多方资源，应对突发事件
                </p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold mt-8 mb-4">实验概述</h2>
        <p>
          本实验模拟智慧城市中的突发事件响应场景，参与者扮演不同系统控制角色（如交通调度、电力管理、应急响应等），
          在信息受限的网格化城市地图中协作完成任务。实验采用多智能体框架建模，每个角色拥有独立的感知输入与操作权限，
          需通过受限通信协调资源，以最小化城市系统损失。
        </p>

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

        <h2 className="text-xl font-bold mt-8 mb-4">角色与职责</h2>
        <ul className="space-y-3">
          <li><strong>交通调度员：</strong>控制交通信号、疏导车辆、规划紧急通道</li>
          <li><strong>电力管理员：</strong>管理电力分配、处理电网故障、确保关键设施供电</li>
          <li><strong>应急响应协调员：</strong>分配应急资源、协调救援行动、制定响应策略</li>
          <li><strong>医疗资源调配员：</strong>分配医疗资源、管理伤员转运、优化医院容量</li>
          <li><strong>中央协调员：</strong>整合信息、协调各部门行动、制定全局策略</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4">研究价值</h2>
        <ul className="space-y-3">
          <li>研究分布式认知与协作决策过程</li>
          <li>探索信息不对称条件下的团队协作模式</li>
          <li>分析认知负荷对决策质量的影响</li>
          <li>评估人机协同在复杂任务中的效能</li>
          <li>为智慧城市应急响应系统设计提供实证依据</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4">技术特色</h2>
        <ul className="space-y-3">
          <li>网格化城市模拟环境，支持多种突发事件类型</li>
          <li>角色特定的信息显示与操作界面</li>
          <li>可配置的通信限制机制</li>
          <li>实时资源分配与效果反馈</li>
          <li>支持人类参与者与AI代理混合参与</li>
          <li>生理信号同步记录，支持多模态数据采集</li>
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
    icon: <Network className="w-4 h-4" />,
    title: "多智能体框架",
    description: "每个参与者作为独立智能体，拥有有限的感知输入和操作权限"
  },
  {
    icon: <Map className="w-4 h-4" />,
    title: "网格化城市地图",
    description: "在动态变化的城市环境中进行决策，应对各类突发事件"
  },
  {
    icon: <Radio className="w-4 h-4" />,
    title: "受限通信机制",
    description: "模拟真实环境中的信息传递限制，增加协作挑战"
  },
  {
    icon: <AlertTriangle className="w-4 h-4" />,
    title: "动态事件生成",
    description: "系统会动态生成各类突发事件，测试团队的应变能力"
  },
  {
    icon: <Brain className="w-4 h-4" />,
    title: "认知负荷测量",
    description: "评估不同角色和任务对参与者认知资源的占用情况"
  },
  {
    icon: <Cpu className="w-4 h-4" />,
    title: "AI代理集成",
    description: "支持AI代理参与，研究人机混合团队的协作模式"
  }
];

export default Introduction;