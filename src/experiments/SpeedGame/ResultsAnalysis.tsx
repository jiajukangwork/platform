import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Download, TrendingUp, Brain, Award, Clock, Target, Car, Trophy } from 'lucide-react';
import Button from '../../components/Button';
import { GameResults } from './index';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface ResultsAnalysisProps {
  results: GameResults;
  onRestart: () => void;
}

const ResultsAnalysis = ({ results, onRestart }: ResultsAnalysisProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const exportData = () => {
    const exportData = {
      results,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speed-game-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const prepareSpeedChoiceData = () => {
    // Group speed choices by frequency
    const speedCounts = results.speedChoices.reduce((acc, speed) => {
      const speedKey = Math.round(speed);
      acc[speedKey] = (acc[speedKey] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return Object.entries(speedCounts).map(([speed, count]) => ({
      speed: parseInt(speed),
      count,
      percentage: (count / results.speedChoices.length) * 100
    }));
  };

  const prepareRoundData = () => {
    return results.rounds.map((round, index) => ({
      round: round.round,
      playerSpeed: round.playerSpeed,
      opponentSpeed: round.opponentSpeed,
      winner: round.winner
    }));
  };

  const prepareWinRateData = () => {
    return [
      { name: '胜利', value: results.rounds.filter(r => r.winner === 'player').length },
      { name: '失败', value: results.rounds.filter(r => r.winner === 'opponent').length },
      { name: '平局', value: results.rounds.filter(r => r.winner === 'tie').length }
    ];
  };

  const prepareStrategyRadar = () => {
    return [
      {
        subject: '胜率',
        value: results.winRate * 100
      },
      {
        subject: '高速选择率',
        value: results.highSpeedRate * 100
      },
      {
        subject: '低速选择率',
        value: results.lowSpeedRate * 100
      },
      {
        subject: '反应速度',
        value: 100 - Math.min(100, (results.reactionTimes.reduce((a, b) => a + b, 0) / results.reactionTimes.length) / 20)
      },
      {
        subject: '策略适应性',
        value: calculateStrategyAdaptivity() * 100
      }
    ];
  };

  const calculateStrategyAdaptivity = () => {
    // Calculate how well the player adapted their strategy based on opponent's behavior
    // This is a simplified calculation for demonstration
    const strategyChanges = results.rounds.slice(1).filter((round, i) => {
      const prevRound = results.rounds[i];
      // Check if player changed strategy after losing
      return prevRound.winner === 'opponent' && 
             Math.abs(round.playerSpeed - prevRound.playerSpeed) > 10;
    }).length;
    
    return Math.min(1, strategyChanges / Math.max(1, results.rounds.length - 1));
  };

  const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">实验结果分析</h1>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </Button>
          <Button variant="primary" onClick={onRestart}>
            重新开始
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 inline mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center">
                <Trophy className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">总得分</p>
                  <p className="text-2xl font-bold text-blue-900">{results.score}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">胜率</p>
                  <p className="text-2xl font-bold text-green-900">{(results.winRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-lg">
              <div className="flex items-center">
                <Car className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">平均速度</p>
                  <p className="text-2xl font-bold text-yellow-900">{results.averageSpeed.toFixed(1)} km/h</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">平均反应时间</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {(results.reactionTimes.reduce((a, b) => a + b, 0) / results.reactionTimes.length / 1000).toFixed(2)}s
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Radar */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">策略分析</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={prepareStrategyRadar()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="玩家表现"
                    dataKey="value"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Win Rate Distribution */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">胜负分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prepareWinRateData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {prepareWinRateData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">速度选择分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepareSpeedChoiceData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="speed" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#2563eb" 
                    name="选择次数"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">回合速度对比</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareRoundData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="round" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="playerSpeed" 
                    stroke="#2563eb" 
                    name="玩家速度"
                    dot={{ fill: '#2563eb' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="opponentSpeed" 
                    stroke="#ef4444" 
                    name="对手速度"
                    dot={{ fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">反应时间分析</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.reactionTimes.map((time, index) => ({ round: index + 1, time: time / 1000 }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="round" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="time" 
                    stroke="#8b5cf6" 
                    name="反应时间(秒)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-8">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <Brain className="inline w-5 h-5 mr-2" />
              关键洞察
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">速度策略分析</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 高速选择率: {(results.highSpeedRate * 100).toFixed(1)}%</li>
                  <li>• 低速选择率: {(results.lowSpeedRate * 100).toFixed(1)}%</li>
                  <li>• 平均速度: {results.averageSpeed.toFixed(1)} km/h</li>
                  <li>• 速度变化频率: {calculateSpeedChangeFrequency()}</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">博弈表现分析</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 胜率: {(results.winRate * 100).toFixed(1)}%</li>
                  <li>• 平均反应时间: {(results.reactionTimes.reduce((a, b) => a + b, 0) / results.reactionTimes.length / 1000).toFixed(2)}秒</li>
                  <li>• 策略适应性: {(calculateStrategyAdaptivity() * 100).toFixed(1)}%</li>
                  <li>• 风险承担倾向: {calculateRiskTakingTendency()}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">实验结论</h3>
            <p className="text-gray-700">
              {generateExperimentConclusion()}
            </p>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">研究启示</h4>
              <p className="text-yellow-700 text-sm">
                本实验结果表明，在动态博弈环境中，速度选择策略与对手行为预测能力密切相关。参与者需要不断调整自身策略以适应对手的行为模式，这一过程涉及复杂的认知控制机制。实验数据为理解人类在有限控制条件下的决策过程提供了有价值的见解，同时也为交通系统中的人机交互设计提供了参考。
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <Award className="inline w-5 h-5 mr-2" />
              改进建议
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <li>• 尝试更多样化的速度策略，观察不同对手的反应</li>
              <li>• 注意观察对手的速度模式，预测其行为</li>
              <li>• 在关键时刻（如接近合并点时）更加谨慎地调整速度</li>
              <li>• 考虑在不同阶段采用不同策略，如开始阶段可能需要更激进</li>
              <li>• 练习提高反应速度，以便更快地应对对手的策略变化</li>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const calculateSpeedChangeFrequency = (): string => {
  // This would be calculated based on how often the player changes speed
  return "中等"; // Placeholder
};

const calculateRiskTakingTendency = (): string => {
  // This would be calculated based on how often the player chooses high speeds
  return "中等"; // Placeholder
};

const generateExperimentConclusion = (): string => {
  // This would generate a conclusion based on the player's performance
  return "在本次实验中，您展现了中等水平的速度策略适应能力。您的决策模式显示出对对手行为的一定预测能力，但在某些情况下未能及时调整策略。您的反应时间处于平均水平，表明在时间压力下仍能保持一定的决策质量。总体而言，您的表现反映了在动态博弈环境中平衡速度、风险与收益的能力。";
};

const tabs = [
  { id: 'overview', name: '总览', icon: BarChart2 },
  { id: 'performance', name: '表现分析', icon: TrendingUp },
  { id: 'insights', name: '深度洞察', icon: Brain }
];

export default ResultsAnalysis;