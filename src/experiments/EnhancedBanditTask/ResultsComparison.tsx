import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Download, TrendingUp, Brain, Bot, Users, Award, Clock, Target } from 'lucide-react';
import Button from '../../components/Button';
import { ExperimentConfig, TrialData } from './index';
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
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface ResultsComparisonProps {
  config: ExperimentConfig;
  data: TrialData[];
  onRestart: () => void;
}

const ResultsComparison = ({ config, data, onRestart }: ResultsComparisonProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  const exportData = () => {
    const exportData = {
      experimentConfig: config,
      trialData: data,
      summary: calculateSummaryStats(),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enhanced-bandit-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateSummaryStats = () => {
    const humanRewards = data.map(d => d.humanReward || 0);
    const llmRewards = data.map(d => d.llmReward || 0);
    const humanReactionTimes = data.map(d => d.humanReactionTime || 0);

    return {
      human: {
        totalReward: humanRewards.reduce((sum, r) => sum + r, 0),
        averageReward: humanRewards.reduce((sum, r) => sum + r, 0) / humanRewards.length,
        averageReactionTime: humanReactionTimes.reduce((sum, t) => sum + t, 0) / humanReactionTimes.length,
        explorationRate: calculateExplorationRate(data.map(d => d.humanChoice).filter(c => c !== undefined) as number[])
      },
      llm: config.comparisonMode === 'human-vs-llm' ? {
        totalReward: llmRewards.reduce((sum, r) => sum + r, 0),
        averageReward: llmRewards.reduce((sum, r) => sum + r, 0) / llmRewards.length,
        explorationRate: calculateExplorationRate(data.map(d => d.llmChoice).filter(c => c !== undefined) as number[])
      } : null
    };
  };

  const calculateExplorationRate = (choices: number[]): number => {
    if (choices.length < 10) return 1;
    
    const recentChoices = choices.slice(-20); // Last 20 choices
    const uniqueChoices = new Set(recentChoices).size;
    return uniqueChoices / config.numBandits;
  };

  const prepareChartData = () => {
    const cumulativeData = data.map((trial, index) => {
      const humanCumulative = data.slice(0, index + 1).reduce((sum, t) => sum + (t.humanReward || 0), 0);
      const llmCumulative = data.slice(0, index + 1).reduce((sum, t) => sum + (t.llmReward || 0), 0);
      
      return {
        trial: trial.trial,
        humanCumulative,
        llmCumulative,
        humanReward: trial.humanReward || 0,
        llmReward: trial.llmReward || 0,
        humanChoice: trial.humanChoice,
        llmChoice: trial.llmChoice
      };
    });

    return cumulativeData;
  };

  const prepareChoiceDistribution = () => {
    const humanChoices = data.map(d => d.humanChoice).filter(c => c !== undefined) as number[];
    const llmChoices = data.map(d => d.llmChoice).filter(c => c !== undefined) as number[];

    return Array.from({ length: config.numBandits }, (_, i) => ({
      bandit: `选项 ${i + 1}`,
      human: humanChoices.filter(c => c === i).length,
      llm: llmChoices.filter(c => c === i).length
    }));
  };

  const preparePerformanceRadar = () => {
    const stats = calculateSummaryStats();
    
    return [
      {
        metric: '总奖励',
        human: (stats.human.totalReward / Math.max(stats.human.totalReward, stats.llm?.totalReward || 0)) * 100,
        llm: stats.llm ? (stats.llm.totalReward / Math.max(stats.human.totalReward, stats.llm.totalReward)) * 100 : 0
      },
      {
        metric: '平均奖励',
        human: (stats.human.averageReward / Math.max(stats.human.averageReward, stats.llm?.averageReward || 0)) * 100,
        llm: stats.llm ? (stats.llm.averageReward / Math.max(stats.human.averageReward, stats.llm.averageReward)) * 100 : 0
      },
      {
        metric: '探索率',
        human: stats.human.explorationRate * 100,
        llm: stats.llm ? stats.llm.explorationRate * 100 : 0
      },
      {
        metric: '决策速度',
        human: Math.max(0, 100 - (stats.human.averageReactionTime / 5000) * 100), // Inverse of reaction time
        llm: 80 // Simulated consistent speed
      }
    ];
  };

  const chartData = prepareChartData();
  const choiceDistribution = prepareChoiceDistribution();
  const performanceRadar = preparePerformanceRadar();
  const summaryStats = calculateSummaryStats();

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
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">人类总分</p>
                  <p className="text-2xl font-bold text-blue-900">{summaryStats.human.totalReward}</p>
                </div>
              </div>
            </div>
            
            {config.comparisonMode === 'human-vs-llm' && summaryStats.llm && (
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center">
                  <Bot className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">AI总分</p>
                    <p className="text-2xl font-bold text-green-900">{summaryStats.llm.totalReward}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">平均反应时间</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {(summaryStats.human.averageReactionTime / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-6 rounded-lg">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-600">探索率</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {(summaryStats.human.explorationRate * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Comparison */}
          {config.comparisonMode === 'human-vs-llm' && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">性能对比雷达图</h3>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={performanceRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="人类"
                      dataKey="human"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="AI"
                      dataKey="llm"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">累积奖励趋势</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trial" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="humanCumulative"
                    stroke="#2563eb"
                    name="人类累积奖励"
                    strokeWidth={2}
                  />
                  {config.comparisonMode === 'human-vs-llm' && (
                    <Line
                      type="monotone"
                      dataKey="llmCumulative"
                      stroke="#10b981"
                      name="AI累积奖励"
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">单轮奖励分布</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trial" name="试验" />
                  <YAxis dataKey="reward" name="奖励" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter
                    name="人类奖励"
                    data={chartData.map(d => ({ trial: d.trial, reward: d.humanReward }))}
                    fill="#2563eb"
                  />
                  {config.comparisonMode === 'human-vs-llm' && (
                    <Scatter
                      name="AI奖励"
                      data={chartData.map(d => ({ trial: d.trial, reward: d.llmReward }))}
                      fill="#10b981"
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Tab */}
      {activeTab === 'strategy' && (
        <div className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">选择分布</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={choiceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bandit" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="human" fill="#2563eb" name="人类选择次数" />
                  {config.comparisonMode === 'human-vs-llm' && (
                    <Bar dataKey="llm" fill="#10b981" name="AI选择次数" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strategy Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="text-lg font-medium text-blue-900 mb-4">人类策略分析</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-blue-700">探索倾向:</span>
                  <span className="font-medium text-blue-900">
                    {summaryStats.human.explorationRate > 0.7 ? '高' : 
                     summaryStats.human.explorationRate > 0.4 ? '中' : '低'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">决策速度:</span>
                  <span className="font-medium text-blue-900">
                    {summaryStats.human.averageReactionTime < 2000 ? '快' : 
                     summaryStats.human.averageReactionTime < 4000 ? '中' : '慢'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">平均收益:</span>
                  <span className="font-medium text-blue-900">
                    {summaryStats.human.averageReward.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {config.comparisonMode === 'human-vs-llm' && summaryStats.llm && (
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="text-lg font-medium text-green-900 mb-4">AI策略分析</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-green-700">探索倾向:</span>
                    <span className="font-medium text-green-900">
                      {summaryStats.llm.explorationRate > 0.7 ? '高' : 
                       summaryStats.llm.explorationRate > 0.4 ? '中' : '低'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">策略类型:</span>
                    <span className="font-medium text-green-900">
                      {config.llmModel === 'gpt-4' ? 'UCB' :
                       config.llmModel === 'claude-3' ? 'ε-贪婪' : 'Softmax'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">平均收益:</span>
                    <span className="font-medium text-green-900">
                      {summaryStats.llm.averageReward.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            )}
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
                <h4 className="font-medium text-gray-900">人类行为特征</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 探索率: {(summaryStats.human.explorationRate * 100).toFixed(1)}%</li>
                  <li>• 平均反应时间: {(summaryStats.human.averageReactionTime / 1000).toFixed(1)}秒</li>
                  <li>• 决策一致性: {calculateConsistency(data.map(d => d.humanChoice).filter(c => c !== undefined) as number[])}%</li>
                  <li>• 学习效率: {calculateLearningEfficiency(chartData.map(d => d.humanReward))}%</li>
                </ul>
              </div>
              
              {config.comparisonMode === 'human-vs-llm' && summaryStats.llm && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">AI行为特征</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• 探索率: {(summaryStats.llm.explorationRate * 100).toFixed(1)}%</li>
                    <li>• 策略类型: {getStrategyDescription(config.llmModel)}</li>
                    <li>• 决策一致性: {calculateConsistency(data.map(d => d.llmChoice).filter(c => c !== undefined) as number[])}%</li>
                    <li>• 学习效率: {calculateLearningEfficiency(chartData.map(d => d.llmReward))}%</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <Award className="inline w-5 h-5 mr-2" />
              改进建议
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              {generateRecommendations(summaryStats, config)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const calculateConsistency = (choices: number[]): number => {
  if (choices.length < 10) return 0;
  
  const recentChoices = choices.slice(-20);
  const mostFrequent = recentChoices.reduce((acc, choice) => {
    acc[choice] = (acc[choice] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const maxCount = Math.max(...Object.values(mostFrequent));
  return Math.round((maxCount / recentChoices.length) * 100);
};

const calculateLearningEfficiency = (rewards: number[]): number => {
  if (rewards.length < 20) return 0;
  
  const firstHalf = rewards.slice(0, Math.floor(rewards.length / 2));
  const secondHalf = rewards.slice(Math.floor(rewards.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length;
  
  return Math.max(0, Math.round(((secondAvg - firstAvg) / firstAvg) * 100));
};

const getStrategyDescription = (model: string): string => {
  switch (model) {
    case 'gpt-4': return 'UCB (置信上界)';
    case 'claude-3': return 'ε-贪婪衰减';
    case 'gemini-pro': return 'Softmax探索';
    default: return '标准ε-贪婪';
  }
};

const generateRecommendations = (stats: any, config: ExperimentConfig): JSX.Element[] => {
  const recommendations = [];
  
  if (stats.human.explorationRate < 0.3) {
    recommendations.push(
      <li key="exploration">• 建议增加探索行为，尝试更多不同的选项以发现更好的机会</li>
    );
  }
  
  if (stats.human.averageReactionTime > 4000) {
    recommendations.push(
      <li key="speed">• 可以适当加快决策速度，过度思考可能错失机会</li>
    );
  }
  
  if (config.comparisonMode === 'human-vs-llm' && stats.llm) {
    if (stats.human.averageReward < stats.llm.averageReward) {
      recommendations.push(
        <li key="performance">• AI表现更好，可以学习其更系统化的探索策略</li>
      );
    } else {
      recommendations.push(
        <li key="human-win">• 您的表现超过了AI，展现了人类直觉的优势</li>
      );
    }
  }
  
  return recommendations;
};

const tabs = [
  { id: 'overview', name: '总览', icon: BarChart3 },
  { id: 'performance', name: '表现分析', icon: TrendingUp },
  { id: 'strategy', name: '策略分析', icon: Target },
  { id: 'insights', name: '深度洞察', icon: Brain }
];

export default ResultsComparison;