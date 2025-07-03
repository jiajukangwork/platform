import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, Users, Coins } from 'lucide-react';
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
  contribution: number;
  totalContributions: number;
  multipliedAmount: number;
  payout: number;
  otherContributions: number[];
  timestamp: number;
}

const TOTAL_ROUNDS = 20;
const INITIAL_ENDOWMENT = 100;
const MULTIPLIER = 2;
const NUM_PLAYERS = 4;

const PublicGoodsGame = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [currentRound, setCurrentRound] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentContribution, setCurrentContribution] = useState(0);
  const [history, setHistory] = useState<Round[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [aiThinkingTime, setAiThinkingTime] = useState(false);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
  };

  const makeContribution = (amount: number) => {
    setCurrentContribution(amount);
    setAiThinkingTime(true);
    
    setTimeout(() => {
      const otherContributions = simulateOtherContributions();
      const totalContributions = amount + otherContributions.reduce((a, b) => a + b, 0);
      const multipliedAmount = totalContributions * MULTIPLIER;
      const payout = (multipliedAmount / NUM_PLAYERS);
      
      const round: Round = {
        contribution: amount,
        totalContributions,
        multipliedAmount,
        payout,
        otherContributions,
        timestamp: Date.now()
      };
      
      setHistory(prev => [...prev, round]);
      setTotalPoints(prev => prev + (payout - amount));

      if (currentRound + 1 >= TOTAL_ROUNDS) {
        setGameState('finished');
        setTotalTime(Date.now() - (startTime || 0));
      } else {
        setTimeout(() => {
          setCurrentRound(prev => prev + 1);
          setCurrentContribution(0);
          setAiThinkingTime(false);
        }, 1500);
      }
    }, 1000);
  };

  const simulateOtherContributions = (): number[] => {
    // AI strategy: Adapt to player's behavior
    const playerCooperationRate = history.length > 0 
      ? history.reduce((sum, h) => sum + h.contribution, 0) / (history.length * INITIAL_ENDOWMENT)
      : 0.5;
    
    return Array(NUM_PLAYERS - 1).fill(0).map(() => {
      const baseRate = 0.3 + (playerCooperationRate * 0.4); // More likely to cooperate if player cooperates
      return Math.round(INITIAL_ENDOWMENT * (baseRate + Math.random() * 0.2));
    });
  };

  const resetGame = () => {
    setGameState('instruction');
    setCurrentRound(0);
    setTotalPoints(0);
    setHistory([]);
    setStartTime(null);
    setTotalTime(null);
    setCurrentContribution(0);
    setAiThinkingTime(false);
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Public Goods Game",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        totalRounds: TOTAL_ROUNDS,
        totalPoints,
        averageContribution: history.reduce((sum, h) => sum + h.contribution, 0) / history.length,
        averageGroupContribution: history.reduce((sum, h) => sum + h.totalContributions, 0) / history.length
      },
      rounds: history.map((h, index) => ({
        round: index + 1,
        contribution: h.contribution,
        totalContributions: h.totalContributions,
        multipliedAmount: h.multipliedAmount,
        payout: h.payout,
        otherContributions: h.otherContributions,
        timestamp: new Date(h.timestamp).toISOString(),
        reactionTime: index > 0 ? h.timestamp - history[index - 1].timestamp : 0
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `public-goods-game-results-${Date.now()}.json`;
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
    const contributionData = history.map((h, index) => ({
      round: index + 1,
      contribution: h.contribution,
      averageOthers: h.otherContributions.reduce((a, b) => a + b, 0) / (NUM_PLAYERS - 1),
      payout: h.payout
    }));

    const contributionDistribution = [
      {
        name: '低贡献 (0-30%)',
        value: history.filter(h => h.contribution <= INITIAL_ENDOWMENT * 0.3).length
      },
      {
        name: '中等贡献 (30-60%)',
        value: history.filter(h => h.contribution > INITIAL_ENDOWMENT * 0.3 && h.contribution <= INITIAL_ENDOWMENT * 0.6).length
      },
      {
        name: '高贡献 (60-100%)',
        value: history.filter(h => h.contribution > INITIAL_ENDOWMENT * 0.6).length
      }
    ];

    const efficiencyData = history.map(h => ({
      round: h.round,
      efficiency: (h.multipliedAmount / (NUM_PLAYERS * INITIAL_ENDOWMENT)) * 100,
      contribution: (h.contribution / INITIAL_ENDOWMENT) * 100,
      averageContribution: (h.totalContributions / (NUM_PLAYERS * INITIAL_ENDOWMENT)) * 100
    }));

    const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b'];

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">贡献和收益趋势</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={contributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="round" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="contribution" 
                  stroke="#2563eb" 
                  name="个人贡献"
                />
                <Line 
                  type="monotone" 
                  dataKey="averageOthers" 
                  stroke="#10b981" 
                  name="他人平均贡献"
                />
                <Line 
                  type="monotone" 
                  dataKey="payout" 
                  stroke="#ef4444" 
                  name="获得收益"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">贡献分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contributionDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {contributionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">效率分析</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={efficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="round" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="#2563eb" 
                    name="资源利用效率"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="averageContribution" 
                    stroke="#10b981" 
                    name="平均贡献率"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">详细统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均贡献率</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((history.reduce((sum, h) => sum + h.contribution, 0) / 
                  (history.length * INITIAL_ENDOWMENT)) * 100)}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">资源利用效率</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((history.reduce((sum, h) => sum + h.multipliedAmount, 0) /
                  (history.length * NUM_PLAYERS * INITIAL_ENDOWMENT)) * 100)}%
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
                <Coins className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">公共物品游戏</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加公共物品游戏实验。这个实验旨在研究人们在公共资源供给中的合作行为和搭便车现象。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>每轮你将获得{INITIAL_ENDOWMENT}元初始资金</li>
                  <li>你需要决定投入多少资金到公共项目中</li>
                  <li>所有玩家的投入将被乘以{MULTIPLIER}倍</li>
                  <li>乘以后的总金额将平均分配给所有玩家（共{NUM_PLAYERS}人）</li>
                  <li>实验共有{TOTAL_ROUNDS}轮</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>仔细权衡个人利益和集体利益</li>
                  <li>观察其他玩家的行为模式</li>
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
                  <p className="text-sm font-medium text-gray-500">总收益</p>
                  <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">平均贡献率</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {history.length > 0 ? 
                      Math.round((history.reduce((sum, h) => sum + h.contribution, 0) / 
                        (history.length * INITIAL_ENDOWMENT)) * 100) : 0}%
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">平均收益</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {history.length > 0 ? Math.round(totalPoints / history.length) : 0}
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
                    请决定投入金额
                  </h2>
                  <p className="text-lg text-gray-600 mb-8">
                    你有{INITIAL_ENDOWMENT}元，请决定投入多少到公共项目中
                  </p>
                  <div className="max-w-md mx-auto">
                    <input
                      type="range"
                      min="0"
                      max={INITIAL_ENDOWMENT}
                      value={currentContribution}
                      onChange={(e) => setCurrentContribution(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="mt-4 text-xl font-bold text-gray-900">
                      投入金额：{currentContribution}元
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      保留金额：{INITIAL_ENDOWMENT - currentContribution}元
                    </div>
                    <Button
                      variant="primary"
                      className="mt-8 w-full"
                      onClick={() => makeContribution(currentContribution)}
                      disabled={aiThinkingTime}
                    >
                      确认投入
                    </Button>
                  </div>

                  {aiThinkingTime && (
                    <motion.div
                      className="mt-8 p-4 rounded-lg bg-gray-50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <p className="text-lg font-medium text-gray-900">
                        等待其他玩家决策...
                      </p>
                    </motion.div>
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
                  <li>每轮获得{INITIAL_ENDOWMENT}元初始资金</li>
                  <li>决定投入多少资金到公共项目中：
                    <ul>
                      <li>所有玩家的投入将被乘以{MULTIPLIER}倍</li>
                      <li>乘以后的总金额将平均分配给所有{NUM_PLAYERS}位玩家</li>
                      <li>未投入的资金将直接归你所有</li>
                    </ul>
                  </li>
                </ul>
                <p>提示：需要权衡个人利益和集体利益，同时考虑其他玩家的可能行为。</p>
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

export default PublicGoodsGame;