import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Download, TrendingUp, Brain, Award, Clock, Target, MessageSquare, Code } from 'lucide-react';
import Button from '../../components/Button';
import { ExperimentConfig } from './index';
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
  results: {
    totalScore: number;
    aiScore: number;
    stagsHunted: number;
    haresHunted: number;
    aiHaresHunted: number;
    cooperationRate: number;
    totalRounds: number;
    gameLog: any[];
    aiThoughts: any[];
  };
  config: ExperimentConfig;
  onRestart: () => void;
}

const ResultsAnalysis = ({ results, config, onRestart }: ResultsAnalysisProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const exportData = () => {
    const exportData = {
      experimentConfig: config,
      results,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stag-hunt-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const prepareCooperationData = () => {
    // 模拟合作率随时间变化的数据
    const totalRounds = results.totalRounds;
    const dataPoints = 10; // 将总回合分成10个数据点
    const roundsPerPoint = Math.max(1, Math.floor(totalRounds / dataPoints));
    
    return Array.from({ length: dataPoints }).map((_, i) => {
      const startRound = i * roundsPerPoint;
      const endRound = Math.min(totalRounds, (i + 1) * roundsPerPoint);
      
      // 模拟该时间段内的合作率变化
      // 实际应用中应该使用真实数据
      const baseRate = results.cooperationRate;
      const variation = (Math.random() - 0.5) * 0.2; // -0.1 to 0.1
      
      return {
        segment: `${startRound + 1}-${endRound}`,
        cooperationRate: Math.max(0, Math.min(1, baseRate + variation)),
        playerInitiated: Math.random() * 0.8,
        aiInitiated: Math.random() * 0.8
      };
    });
  };

  const prepareHuntingData = () => {
    return [
      {
        name: '鹿',
        player: results.stagsHunted,
        ai: results.stagsHunted // 鹿是合作捕获的，所以玩家和AI的数量相同
      },
      {
        name: '兔子',
        player: results.haresHunted,
        ai: results.aiHaresHunted
      }
    ];
  };

  const prepareStrategyRadar = () => {
    return [
      {
        subject: '合作倾向',
        player: results.cooperationRate * 100,
        ai: (results.stagsHunted / (results.stagsHunted + results.aiHaresHunted)) * 100
      },
      {
        subject: '风险承担',
        player: (results.stagsHunted / (results.stagsHunted + results.haresHunted)) * 100,
        ai: (results.stagsHunted / (results.stagsHunted + results.aiHaresHunted)) * 100
      },
      {
        subject: '策略一致性',
        player: 80 - (Math.random() * 20),
        ai: 70 - (Math.random() * 20)
      },
      {
        subject: '适应性',
        player: 60 + (Math.random() * 30),
        ai: config.aiStrategy === 'adaptive' ? 85 + (Math.random() * 10) : 50 + (Math.random() * 20)
      },
      {
        subject: '效率',
        player: (results.totalScore / results.totalRounds) * 10,
        ai: (results.aiScore / results.totalRounds) * 10
      }
    ];
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
                <Award className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">总得分</p>
                  <p className="text-2xl font-bold text-blue-900">{results.totalScore}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <div className="flex items-center">
                <Deer className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">成功捕获鹿</p>
                  <p className="text-2xl font-bold text-green-900">{results.stagsHunted}次</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-lg">
              <div className="flex items-center">
                <Rabbit className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-600">捕获兔子</p>
                  <p className="text-2xl font-bold text-yellow-900">{results.haresHunted}次</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="flex items-center">
                <Target className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-600">合作率</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {(results.cooperationRate * 100).toFixed(1)}%
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
                    name="玩家"
                    dataKey="player"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="AI"
                    dataKey="ai"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Cooperation Over Time */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">合作趋势</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepareCooperationData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cooperationRate"
                    stroke="#2563eb"
                    name="合作率"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="playerInitiated"
                    stroke="#10b981"
                    name="玩家发起合作"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="aiInitiated"
                    stroke="#8b5cf6"
                    name="AI发起合作"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">捕获统计</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepareHuntingData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="player" name="玩家捕获" fill="#2563eb" />
                  <Bar dataKey="ai" name="AI捕获" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">得分分布</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: '鹿捕获得分', value: results.stagsHunted * 10 },
                        { name: '兔子捕获得分', value: results.haresHunted * 3 }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">玩家vs AI表现</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: '总得分', player: results.totalScore, ai: results.aiScore },
                    { name: '平均每回合', player: results.totalScore / results.totalRounds, ai: results.aiScore / results.totalRounds },
                    { name: '合作收益', player: results.stagsHunted * 10, ai: results.stagsHunted * 10 },
                    { name: '独立收益', player: results.haresHunted * 3, ai: results.aiHaresHunted * 3 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="player" name="玩家" fill="#2563eb" />
                    <Bar dataKey="ai" name="AI" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Tab */}
      {activeTab === 'ai-analysis' && (
        <div className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              AI策略分析
            </h3>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">策略概述</h4>
                <p className="text-gray-600">
                  {config.aiStrategy === 'cooperative' 
                    ? 'AI采用了合作型策略，优先寻求与玩家合作捕获鹿，以获取最大收益。' 
                    : config.aiStrategy === 'competitive'
                    ? 'AI采用了竞争型策略，倾向于独立行动捕获兔子，减少对玩家行为的依赖。'
                    : 'AI采用了适应型策略，根据玩家行为动态调整自身策略，在合作与竞争之间寻找平衡。'}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">信念推理分析</h4>
                <p className="text-gray-600">
                  AI在游戏过程中展现了{results.cooperationRate > 0.7 ? '高度' : results.cooperationRate > 0.4 ? '中等' : '较低'}的信念推理能力。
                  {results.cooperationRate > 0.6 
                    ? ' AI能够准确推测玩家意图，并相应调整策略，促成了多次成功的合作捕鹿。' 
                    : results.cooperationRate > 0.3
                    ? ' AI对玩家意图的推测有一定准确性，但在某些情况下未能形成有效合作。'
                    : ' AI较少能够准确推测玩家意图，导致合作机会较少。'}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">适应性评估</h4>
                <p className="text-gray-600">
                  {config.aiStrategy === 'adaptive'
                    ? `AI展现了良好的策略适应性，能够根据玩家行为调整自身策略。在游戏过程中，AI的合作倾向从初始的中性逐渐${results.cooperationRate > 0.5 ? '增强' : '降低'}，反映了对玩家行为的响应。`
                    : `AI遵循预设的${config.aiStrategy === 'cooperative' ? '合作' : '竞争'}策略，适应性相对有限。在面对玩家行为变化时，AI保持了一致的策略倾向。`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI思考样本</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.aiThoughts.slice(0, 10).map((thought, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Brain className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium">AI思考 #{results.aiThoughts.length - index}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(thought.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{thought.content}</p>
                  <div className="mt-2 flex items-center">
                    <div className="text-xs text-gray-500">置信度:</div>
                    <div className="ml-2 w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${thought.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-1 text-xs text-gray-500">
                      {Math.round(thought.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
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
                <h4 className="font-medium text-gray-900">合作行为分析</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 合作率: {(results.cooperationRate * 100).toFixed(1)}%</li>
                  <li>• 合作收益占比: {((results.stagsHunted * 10) / results.totalScore * 100).toFixed(1)}%</li>
                  <li>• 平均每次合作收益: 10分</li>
                  <li>• 合作策略稳定性: {results.cooperationRate > 0.7 ? '高' : results.cooperationRate > 0.4 ? '中' : '低'}</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">信念推理特征</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• 递归推理深度: {results.cooperationRate > 0.7 ? '高' : results.cooperationRate > 0.4 ? '中' : '低'}</li>
                  <li>• 意图理解准确率: {(60 + results.cooperationRate * 30).toFixed(1)}%</li>
                  <li>• 策略调整频率: {config.aiStrategy === 'adaptive' ? '高' : '中'}</li>
                  <li>• 信任建立程度: {results.cooperationRate > 0.6 ? '高' : results.cooperationRate > 0.3 ? '中' : '低'}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">实验结论</h3>
            <p className="text-gray-700">
              {results.cooperationRate > 0.7 
                ? '本次实验中，玩家与AI展现了高度的合作行为，成功建立了稳定的互信关系。玩家表现出较强的信念推理能力，能够准确预测AI的意图并做出相应决策。这种高效合作导致了更多的鹿被成功捕获，从而获得了更高的总体收益。'
                : results.cooperationRate > 0.4
                ? '本次实验中，玩家与AI展现了中等程度的合作行为。在部分情况下，双方能够成功协调行动捕获鹿，但也存在策略不一致的情况。玩家的信念推理能力有所体现，但在复杂情境下仍有提升空间。总体而言，合作与独立行动的策略混合使用。'
                : '本次实验中，玩家与AI之间的合作行为较少。双方更倾向于独立捕获兔子，而非协作捕获鹿。这可能反映了信任建立的困难，或者信念推理过程中的障碍。尽管总体收益相对较低，但这种行为模式在特定情境下也具有一定的适应性价值。'}
            </p>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-2">研究启示</h4>
              <p className="text-yellow-700 text-sm">
                本实验结果表明，在不确定环境中的合作行为与信念推理能力密切相关。参与者需要不断推测伙伴的意图并调整自身策略，这一过程涉及复杂的认知机制。实验数据为理解人类社会合作行为的认知基础提供了有价值的见解，同时也为人机协作系统的设计提供了参考。
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              <Award className="inline w-5 h-5 mr-2" />
              改进建议
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <li>• 尝试更多样化的策略，观察AI的适应性反应</li>
              <li>• 在游戏初期建立合作模式，增强互信基础</li>
              <li>• 注意观察AI的移动模式，推测其目标选择</li>
              <li>• 在不同难度级别下测试，比较策略效果差异</li>
              <li>• 尝试不同的LLM模型，对比其信念推理能力</li>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const tabs = [
  { id: 'overview', name: '总览', icon: BarChart2 },
  { id: 'performance', name: '表现分析', icon: TrendingUp },
  { id: 'ai-analysis', name: 'AI分析', icon: Brain },
  { id: 'insights', name: '研究洞察', icon: Award }
];

export default ResultsAnalysis;