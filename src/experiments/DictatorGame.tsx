import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, Scale, Users } from 'lucide-react';
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
  timestamp: number;
}

const TOTAL_ROUNDS = 20;
const TOTAL_AMOUNT = 100;

const DictatorGame = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [currentRound, setCurrentRound] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentAllocation, setCurrentAllocation] = useState(0);
  const [history, setHistory] = useState<Round[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
  };

  const makeAllocation = (amount: number) => {
    const round: Round = {
      allocation: amount,
      totalAmount: TOTAL_AMOUNT,
      timestamp: Date.now()
    };
    
    setHistory(prev => [...prev, round]);
    setTotalPoints(prev => prev + (TOTAL_AMOUNT - amount));

    if (currentRound + 1 >= TOTAL_ROUNDS) {
      setGameState('finished');
      setTotalTime(Date.now() - (startTime || 0));
    } else {
      setCurrentRound(prev => prev + 1);
      setCurrentAllocation(0);
    }
  };

  const resetGame = () => {
    setGameState('instruction');
    setCurrentRound(0);
    setTotalPoints(0);
    setHistory([]);
    setStartTime(null);
    setTotalTime(null);
    setCurrentAllocation(0);
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Dictator Game",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        totalRounds: TOTAL_ROUNDS,
        totalPoints,
        averageAllocation: history.reduce((sum, h) => sum + h.allocation, 0) / history.length,
        fairnessIndex: history.reduce((sum, h) => 
          sum + (1 - Math.abs(h.allocation - h.totalAmount/2)/(h.totalAmount/2)), 0
        ) / history.length
      },
      rounds: history.map((h, index) => ({
        round: index + 1,
        allocation: h.allocation,
        totalAmount: h.totalAmount,
        timestamp: new Date(h.timestamp).toISOString(),
        reactionTime: index > 0 ? h.timestamp - history[index - 1].timestamp : 0
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dictator-game-results-${Date.now()}.json`;
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
      kept: h.totalAmount - h.allocation
    }));

    const distributionRanges = Array.from({ length: 5 }, (_, i) => ({
      range: `${i * 20}-${(i + 1) * 20}`,
      count: history.filter(h => 
        h.allocation >= i * 20 && h.allocation < (i + 1) * 20
      ).length
    }));

    const fairnessMetrics = {
      averageAllocation: history.reduce((sum, h) => sum + h.allocation, 0) / history.length,
      fairnessIndex: history.reduce((sum, h) => 
        sum + (1 - Math.abs(h.allocation - h.totalAmount/2)/(h.totalAmount/2)), 0
      ) / history.length,
      equalSplits: history.filter(h => h.allocation === h.totalAmount/2).length,
      selfishChoices: history.filter(h => h.allocation < h.totalAmount/4).length
    };

    const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b'];

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">分配金额趋势</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={allocationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="round" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="allocation" 
                  stroke="#2563eb" 
                  name="分配给对方"
                />
                <Line 
                  type="monotone" 
                  dataKey="kept" 
                  stroke="#10b981" 
                  name="自己保留"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">分配金额分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={distributionRanges}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#2563eb" 
                    name="次数"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">公平性分析</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: '平均分配', value: fairnessMetrics.equalSplits },
                      { name: '偏向自己', value: fairnessMetrics.selfishChoices },
                      { name: '其他', value: TOTAL_ROUNDS - fairnessMetrics.equalSplits - fairnessMetrics.selfishChoices }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {[0, 1, 2].map((entry, index) => (
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
              <p className="text-sm font-medium text-gray-600">平均分配金额</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(fairnessMetrics.averageAllocation)}元
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">公平指数</p>
              <p className="text-xl font-bold text-gray-900">
                {(fairnessMetrics.fairnessIndex * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均决策时间</p>
              <p className="text-xl font-bold text-gray-900">
                {(history.reduce((sum, h, i) => 
                  sum + (i > 0 ? h.timestamp - history[i - 1].timestamp : 0), 0
                ) / (history.length - 1) / 1000).toFixed(2)} 秒
              </p>
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
                <Scale className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">独裁者游戏</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加独裁者游戏实验。这个实验旨在研究人们在完全自主决策时的分配行为。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>你将扮演资源分配者的角色</li>
                  <li>每轮你将获得{TOTAL_AMOUNT}元</li>
                  <li>你可以自由决定分配给对方多少金额</li>
                  <li>对方只能接受你的分配决定</li>
                  <li>实验共有{TOTAL_ROUNDS}轮</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>没有对错之分</li>
                  <li>根据你的真实想法做出决定</li>
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
                  <p className="text-sm font-medium text-gray-500">总金额</p>
                  <p className="text-2xl font-bold text-blue-600">{TOTAL_AMOUNT}元</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">累计收益</p>
                  <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">平均分配</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {history.length > 0 ? Math.round(history.reduce((sum, h) => sum + h.allocation, 0) / history.length) : 0}
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
                    请决定分配金额
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    你有{TOTAL_AMOUNT}元，请决定分配给对方多少金额
                  </p>
                  <div className="max-w-md mx-auto">
                    <input
                      type="range"
                      min="0"
                      max={TOTAL_AMOUNT}
                      value={currentAllocation}
                      onChange={(e) => setCurrentAllocation(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="mt-4 text-xl font-bold text-gray-900">
                      分配金额：{currentAllocation}元
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      你将保留：{TOTAL_AMOUNT - currentAllocation}元
                    </div>
                    <Button
                      variant="primary"
                      className="mt-8 w-full"
                      onClick={() => makeAllocation(currentAllocation)}
                    >
                      确认分配
                    </Button>
                  </div>
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
                      <p className="text-lg font-medium text-gray-900">总收益</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {totalPoints}元
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      平均每轮 {Math.round(totalPoints / TOTAL_ROUNDS)}元
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
                  <li>每轮获得{TOTAL_AMOUNT}元初始金额</li>
                  <li>决定分配给对方多少金额</li>
                  <li>对方会自动接受你的分配决定</li>
                  <li>根据你的真实想法做出决定</li>
                </ul>
                <p>提示：没有对错之分，重要的是根据你的真实想法做出选择。</p>
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

export default DictatorGame;