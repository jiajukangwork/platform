import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, Scale, Users, Gavel } from 'lucide-react';
import Button from '../components/Button';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Round {
  allocation: number;
  totalAmount: number;
  punishment: number;
  punishmentCost: number;
  timestamp: number;
}

const TOTAL_ROUNDS = 20;
const TOTAL_AMOUNT = 100;
const PUNISHMENT_MULTIPLIER = 3; // Each point of punishment costs 1 but reduces allocator's points by 3
const FAIR_THRESHOLD = 0.4; // 40% of total amount is considered fair

const ThirdPartyPunishment = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [currentRound, setCurrentRound] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentAllocation, setCurrentAllocation] = useState(0);
  const [currentPunishment, setCurrentPunishment] = useState(0);
  const [history, setHistory] = useState<Round[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [aiThinkingTime, setAiThinkingTime] = useState(false);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
  };

  const simulateAllocation = () => {
    setAiThinkingTime(true);
    
    setTimeout(() => {
      // AI strategy: Allocate between 10% and 50% of total amount
      const allocation = Math.round((0.1 + Math.random() * 0.4) * TOTAL_AMOUNT);
      setCurrentAllocation(allocation);
      setAiThinkingTime(false);
    }, 1000);
  };

  const makePunishment = (punishment: number) => {
    const punishmentCost = punishment;
    const round: Round = {
      allocation: currentAllocation,
      totalAmount: TOTAL_AMOUNT,
      punishment,
      punishmentCost,
      timestamp: Date.now()
    };
    
    setHistory(prev => [...prev, round]);
    setTotalPoints(prev => prev - punishmentCost);

    if (currentRound + 1 >= TOTAL_ROUNDS) {
      setGameState('finished');
      setTotalTime(Date.now() - (startTime || 0));
    } else {
      setCurrentRound(prev => prev + 1);
      simulateAllocation();
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && history.length === currentRound) {
      simulateAllocation();
    }
  }, [gameState, currentRound, history.length]);

  const resetGame = () => {
    setGameState('instruction');
    setCurrentRound(0);
    setTotalPoints(0);
    setHistory([]);
    setStartTime(null);
    setTotalTime(null);
    setCurrentAllocation(0);
    setCurrentPunishment(0);
    setAiThinkingTime(false);
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Third-Party Punishment",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        totalRounds: TOTAL_ROUNDS,
        totalPoints,
        averagePunishment: history.reduce((sum, h) => sum + h.punishment, 0) / history.length,
        punishmentRate: history.filter(h => h.punishment > 0).length / history.length
      },
      rounds: history.map((h, index) => ({
        round: index + 1,
        allocation: h.allocation,
        totalAmount: h.totalAmount,
        punishment: h.punishment,
        punishmentCost: h.punishmentCost,
        timestamp: new Date(h.timestamp).toISOString(),
        reactionTime: index > 0 ? h.timestamp - history[index - 1].timestamp : 0
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `third-party-punishment-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  const renderResultsAnalysis = () => {
    const allocationData = history.map((h, index) => ({
      round: index + 1,
      allocation: h.allocation,
      punishment: h.punishment,
      fairnessRatio: h.allocation / h.totalAmount
    }));

    const punishmentByFairness = [
      {
        range: '非常不公平 (0-20%)',
        count: history.filter(h => h.allocation / h.totalAmount <= 0.2).length,
        avgPunishment: history.filter(h => h.allocation / h.totalAmount <= 0.2)
          .reduce((sum, h) => sum + h.punishment, 0) / 
          Math.max(1, history.filter(h => h.allocation / h.totalAmount <= 0.2).length)
      },
      {
        range: '不公平 (20-40%)',
        count: history.filter(h => h.allocation / h.totalAmount > 0.2 && h.allocation / h.totalAmount <= 0.4).length,
        avgPunishment: history.filter(h => h.allocation / h.totalAmount > 0.2 && h.allocation / h.totalAmount <= 0.4)
          .reduce((sum, h) => sum + h.punishment, 0) /
          Math.max(1, history.filter(h => h.allocation / h.totalAmount > 0.2 && h.allocation / h.totalAmount <= 0.4).length)
      },
      {
        range: '较公平 (40-60%)',
        count: history.filter(h => h.allocation / h.totalAmount > 0.4 && h.allocation / h.totalAmount <= 0.6).length,
        avgPunishment: history.filter(h => h.allocation / h.totalAmount > 0.4 && h.allocation / h.totalAmount <= 0.6)
          .reduce((sum, h) => sum + h.punishment, 0) /
          Math.max(1, history.filter(h => h.allocation / h.totalAmount > 0.4 && h.allocation / h.totalAmount <= 0.6).length)
      }
    ];

    const punishmentDistribution = [
      {
        name: '不惩罚',
        value: history.filter(h => h.punishment === 0).length
      },
      {
        name: '轻度惩罚',
        value: history.filter(h => h.punishment > 0 && h.punishment <= 10).length
      },
      {
        name: '中度惩罚',
        value: history.filter(h => h.punishment > 10 && h.punishment <= 20).length
      },
      {
        name: '重度惩罚',
        value: history.filter(h => h.punishment > 20).length
      }
    ];

    const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b'];

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">分配和惩罚趋势</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={allocationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="round" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="allocation" 
                  stroke="#2563eb" 
                  name="分配金额"
                />
                <Line 
                  type="monotone" 
                  dataKey="punishment" 
                  stroke="#ef4444" 
                  name="惩罚强度"
                />
                <Line 
                  type="monotone" 
                  dataKey="fairnessRatio" 
                  stroke="#10b981" 
                  name="公平比例"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">不同公平程度的惩罚</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={punishmentByFairness}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#2563eb" 
                    name="出现次数"
                  />
                  <Bar 
                    dataKey="avgPunishment" 
                    fill="#ef4444" 
                    name="平均惩罚"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">惩罚强度分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={punishmentDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {punishmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">详细统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">惩罚率</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((history.filter(h => h.punishment > 0).length / history.length) * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">选择惩罚的比例</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均惩罚强度</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(history.reduce((sum, h) => sum + h.punishment, 0) / history.length)}
              </p>
              <p className="text-xs text-gray-500 mt-1">每轮平均惩罚点数</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">惩罚成本</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.abs(totalPoints)}
              </p>
              <p className="text-xs text-gray-500 mt-1">用于惩罚的总点数</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={exportData}
            className="inline-flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            导出实验数据
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Link
              to="/experiments"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回实验列表
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(true)}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              帮助
            </Button>
          </div>

          {gameState === 'instruction' && (
            <motion.div 
              className="bg-white rounded-xl shadow-sm p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-4 mb-6">
                <Gavel className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">第三方惩罚范式</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加第三方惩罚范式实验。这个实验旨在研究人们作为第三方观察者如何维护社会公平。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>你将作为第三方观察者</li>
                  <li>每轮你会看到一个分配者如何分配{TOTAL_AMOUNT}元</li>
                  <li>你可以选择惩罚不公平的分配：
                    <ul>
                      <li>每点惩罚将使分配者损失{PUNISHMENT_MULTIPLIER}分</li>
                      <li>但你需要支付相应的惩罚成本</li>
                    </ul>
                  </li>
                  <li>实验共有{TOTAL_ROUNDS}轮</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>仔细观察分配的公平性</li>
                  <li>权衡惩罚的成本和效果</li>
                  <li>实验过程中会记录你的选择</li>
                </ul>
              </div>

              <Button 
                variant="primary"
                className="mt-8 w-full"
                onClick={startGame}
              >
                开始实验
              </Button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">当前轮次</p>
                  <p className="text-2xl font-bold text-primary-600">{currentRound + 1} / {TOTAL_ROUNDS}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">剩余点数</p>
                  <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">惩罚率</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {history.length > 0 ? 
                      Math.round((history.filter(h => h.punishment > 0).length / history.length) * 100) : 0}%
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">平均惩罚</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {history.length > 0 ? Math.round(history.reduce((sum, h) => sum + h.punishment, 0) / history.length) : 0}
                  </p>
                </div>
              </div>

              <motion.div
                className="bg-white rounded-xl shadow-sm p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {aiThinkingTime ? '分配者正在决策...' : '请决定是否惩罚'}
                  </h2>
                  
                  {!aiThinkingTime && (
                    <>
                      <div className="mb-8">
                        <p className="text-lg text-gray-600">
                          分配者给予接收者 {currentAllocation} 元（总金额：{TOTAL_AMOUNT}元）
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          分配比例：{Math.round((currentAllocation / TOTAL_AMOUNT) * 100)}%
                        </p>
                      </div>

                      <div className="max-w-md mx-auto">
                        <div className="mb-6">
                          <p className="text-sm font-medium text-gray-600 mb-2">选择惩罚强度</p>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            value={currentPunishment}
                            onChange={(e) => setCurrentPunishment(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="mt-2 text-sm text-gray-500">
                            惩罚强度：{currentPunishment}
                            （成本：{currentPunishment}点，
                            分配者损失：{currentPunishment * PUNISHMENT_MULTIPLIER}点）
                          </div>
                        </div>

                        <Button
                          variant="primary"
                          className="w-full"
                          onClick={() => makePunishment(currentPunishment)}
                        >
                          确认惩罚决定
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={resetGame}
                >
                  重新开始
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowHelp(true)}
                >
                  查看说明
                </Button>
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <motion.div 
              className="bg-white rounded-xl shadow-sm p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-6">实验结束</h1>
              
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-primary-600" />
                      <p className="text-lg font-medium text-gray-900">完成时间</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {totalTime ? formatTime(totalTime) : '--'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      平均每轮 {totalTime ? Math.round(totalTime / TOTAL_ROUNDS / 1000) : '--'} 秒
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart className="w-5 h-5 text-primary-600" />
                      <p className="text-lg font-medium text-gray-900">惩罚成本</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {Math.abs(totalPoints)}点
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      平均每轮 {Math.round(Math.abs(totalPoints) / TOTAL_ROUNDS)}点
                    </p>
                  </div>
                </div>

                {renderResultsAnalysis()}

                <div className="flex space-x-4">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={resetGame}
                  >
                    再试一次
                  </Button>
                  <Button 
                    variant="primary"
                    className="flex-1"
                    href="/experiments"
                  >
                    返回实验列表
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              className="bg-white rounded-xl p-6 max-w-lg w-full"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">实验说明</h3>
              <div className="prose prose-gray">
                <p>在这个任务中，你需要：</p>
                <ul>
                  <li>观察分配者的分配决定</li>
                  <li>评估分配的公平性</li>
                  <li>决定是否进行惩罚：
                    <ul>
                      <li>惩罚强度范围：0-30点</li>
                      <li>每点惩罚使分配者损失{PUNISHMENT_MULTIPLIER}点</li>
                      <li>但你需要支付等额的惩罚成本</li>
                    </ul>
                  </li>
                </ul>
                <p>提示：需要权衡惩罚的必要性和成本，维护社会公平。</p>
              </div>
              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={() => setShowHelp(false)}
              >
                我知道了
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThirdPartyPunishment;