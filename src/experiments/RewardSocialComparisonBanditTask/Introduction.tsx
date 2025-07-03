import { motion } from 'framer-motion';
import { Brain, ChevronRight } from 'lucide-react';
import Button from '../../components/Button';

interface IntroductionProps {
  onStart: () => void;
}

const Introduction = ({ onStart }: IntroductionProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex items-center space-x-4 mb-6">
        <Brain className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">奖励比较与社会比较对探索策略影响的多臂老虎机任务</h1>
      </div>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg">
          欢迎参加本实验。这项研究旨在探究奖励比较与社会比较（与人的比较以及与AI的比较）对参与者探索策略的影响。
        </p>

        <h2 className="text-xl font-bold mt-8 mb-4">实验概述</h2>
        <ul className="space-y-3">
          <li>本实验包含6个子研究，每个研究约需30-40分钟</li>
          <li>每个研究包含10个练习回合和200个正式回合</li>
          <li>您需要从多个选项中进行选择，最大化累计奖励</li>
          <li>在不同研究中，您将看到其他参与者或AI的表现数据</li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4">研究内容</h2>
        <ul className="space-y-3">
          <li>Study 1-3：与人类参与者的比较
            <ul>
              <li>奖励比较</li>
              <li>情绪比较</li>
              <li>奖励和情绪的综合比较</li>
            </ul>
          </li>
          <li>Study 4-6：与AI系统的比较
            <ul>
              <li>奖励比较</li>
              <li>情绪比较</li>
              <li>奖励和情绪的综合比较</li>
            </ul>
          </li>
        </ul>

        <h2 className="text-xl font-bold mt-8 mb-4">注意事项</h2>
        <ul className="space-y-3">
          <li>请保持专注，认真完成每个选择</li>
          <li>实验过程中会记录您的选择和反应时间</li>
          <li>每3个回合需要评定一次您的心情状态</li>
          <li>您可以随时暂停休息，但建议一次完成一个子研究</li>
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

export default Introduction;