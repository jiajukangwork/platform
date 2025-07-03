import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, ChevronDown } from 'lucide-react';
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

interface Card {
  id: number;
  reward: number;
  penalty: number;
  probability: number;
}

const INITIAL_MONEY = 2000;
const TRIALS = 100;

const decks: Card[][] = [
  // A牌组 - 高回报高风险
  Array(40).fill({
    id: 1,
    reward: 100,
    penalty: -1250,
    probability: 0.1
  }),
  // B牌组 - 高回报高风险
  Array(40).fill({
    id: 2,
    reward: 100,
    penalty: -1250,
    probability: 0.1
  }),
  // C牌组 - 低回报低风险
  Array(40).fill({
    id: 3,
    reward: 50,
    penalty: -50,
    probability: 0.5
  }),
  // D牌组 - 低回报低风险
  Array(40).fill({
    id: 4,
    reward: 50,
    penalty: -50,
    probability: 0.5
  })
];

const IowaGamblingTask = () => {
  const [money, setMoney] = useState(INITIAL_MONEY);
  const [trial, setTrial] = useState(0);
  const [history, setHistory] = useState<{deck: number; gain: number; timestamp: number}[]>([]);
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [lastResult, setLastResult] = useState<{deck: number; gain: number} | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);

  const handleCardSelect = (deckIndex: number) => {
    if (trial >= TRIALS) return;

    const deck = decks[deckIndex];
    const card = deck[Math.floor(Math.random() * deck.length)];
    const hasPenalty = Math.random() < card.probability;
    const gain = card.reward + (hasPenalty ? card.penalty : 0);
    const timestamp = Date.now();

    setMoney(prev => prev + gain);
    setTrial(prev => prev + 1);
    setHistory(prev => [...prev, { deck: deckIndex, gain, timestamp }]);
    setLastResult({ deck: deckIndex, gain });
    setShowFeedback(true);

    setTimeout(() => {
      setShowFeedback(false);
    }, 1500);
  };

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
  };

  const resetGame = () => {
    setMoney(INITIAL_MONEY);
    setTrial(0);
    setHistory([]);
    setGameState('instruction');
    setLastResult(null);
    setShowFeedback(false);
    setStartTime(null);
    setTotalTime(null);
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Iowa Gambling Task",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        initialMoney: INITIAL_MONEY,
        finalMoney: money,
        totalTrials: TRIALS
      },
      choices: history.map((h, index) => ({
        trial: index + 1,
        deck: h.deck + 1,
        gain: h.gain,
        cumulativeMoney: INITIAL_MONEY + history.slice(0, index + 1).reduce((sum, choice) => sum + choice.gain, 0),
        timestamp: new Date(h.timestamp).toISOString(),
        reactionTime: index > 0 ? h.timestamp - history[index - 1].timestamp : 0
      })),
      statistics: calculateDeckStatistics()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iowa-gambling-task-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (trial >= TRIALS) {
      setGameState('finished');
      if (startTime) {
        setTotalTime(Date.now() - startTime);
      }
    }
  }, [trial, startTime]);

  const calculateDeckStatistics = () => {
    return [0, 1, 2, 3].map(deckIndex => {
      const deckChoices = history.filter(h => h.deck === deckIndex);
      const count = deckChoices.length;
      const totalGain = deckChoices.reduce((sum, h) => sum + h.gain, 0);
      const averageGain = count > 0 ? totalGain / count : 0;
      
      return {
        deckIndex,
        count,
        totalGain,
        averageGain
      };
    });
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  const renderResultsAnalysis = () => {
    const cumulativeData = history.map((h, index) => ({
      trial: index + 1,
      money: INITIAL_MONEY + history.slice(0, index + 1).reduce((sum, choice) => sum + choice.gain, 0)
    }));

    const deckStats = calculateDeckStatistics();
    const pieData = deckStats.map(stat => ({
      name: `牌组 ${stat.deckIndex + 1}`,
      value: stat.count
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const averageReactionTime = history.length > 1
      ? history.slice(1).reduce((sum, h, i) => sum + (h.timestamp - history[i].timestamp), 0) / (history.length - 1)
      : 0;

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">金额变化趋势</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trial" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="money"
                  stroke="#2563eb"
                  name="当前金额"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">牌组选择分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">牌组收益对比</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={deckStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="deckIndex" tickFormatter={(value) => `牌组 ${value + 1}`} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalGain" fill="#2563eb" name="总收益" />
                  <Bar dataKey="averageGain" fill="#10b981" name="平均收益" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">详细统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均反应时间</p>
              <p className="text-xl font-bold text-gray-900">{(averageReactionTime / 1000).toFixed(2)} 秒</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">最常选择的牌组</p>
              <p className="text-xl font-bold text-gray-900">
                牌组 {deckStats.reduce((max, curr) => curr.count > max.count ? curr : max).deckIndex + 1}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">收益最高的牌组</p>
              <p className="text-xl font-bold text-gray-900">
                牌组 {deckStats.reduce((max, curr) => curr.totalGain > max.totalGain ? curr : max).deckIndex + 1}
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
                <Brain className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">爱荷华赌博任务</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加爱荷华赌博任务实验。这是一个经典的决策研究任务，旨在研究人类在不确定条件下的决策能力。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>你将从四副牌中进行选择</li>
                  <li>每次选择都会获得一定金额的奖励</li>
                  <li>某些选择可能会带来损失</li>
                  <li>你的目标是在100轮选择中尽可能多地赚取金钱</li>
                  <li>初始金额为2000元</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>仔细观察每副牌的奖惩模式</li>
                  <li>尝试找出最有利的选择策略</li>
                  <li>实验过程中会记录你的选择和反应时间</li>
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
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">当前金额</p>
                  <p className="text-2xl font-bold text-primary-600">{money} 元</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">剩余次数</p>
                  <p className="text-2xl font-bold text-gray-900">{TRIALS - trial}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">已完成</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round((trial / TRIALS) * 100)}%</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">收益</p>
                  <p className={`text-2xl font-bold ${money > INITIAL_MONEY ? 'text-green-600' : 'text-red-600'}`}>
                    {money > INITIAL_MONEY ? '+' : ''}{money - INITIAL_MONEY}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[0, 1, 2, 3].map(deckIndex => (
                  <motion.div
                    key={deckIndex}
                    className={`
                      relative aspect-[3/4] bg-white rounded-xl shadow-sm overflow-hidden
                      ${lastResult?.deck === deckIndex && showFeedback ? 'ring-2 ring-primary-500' : ''}
                      hover:shadow-md transition-shadow
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      className="w-full h-full flex flex-col items-center justify-center p-6 focus:outline-none"
                      onClick={() => handleCardSelect(deckIndex)}
                      disabled={trial >= TRIALS}
                    >
                      <div className="text-2xl font-bold text-gray-900 mb-2">
                        牌组 {deckIndex + 1}
                      </div>
                      <div className="text-sm text-gray-500">点击选择</div>
                    </button>

                    <AnimatePresence>
                      {lastResult?.deck === deckIndex && showFeedback && (
                        <motion.div
                          className={`
                            absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm
                            text-2xl font-bold
                            ${lastResult.gain > 0 ? 'text-green-400' : 'text-red-400'}
                          `}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          {lastResult.gain > 0 ? '+' : ''}{lastResult.gain}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex justify-between">
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
            </>
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
                      <BarChart className="w-5 h-5 text-primary-600" />
                      <p className="text-lg font-medium text-gray-900">最终收益</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {money} 元
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      相比初始金额 {money > INITIAL_MONEY ? '增加' : '减少'} {Math.abs(money - INITIAL_MONEY)} 元
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-primary-600" />
                      <p className="text-lg font-medium text-gray-900">完成时间</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {totalTime ? formatTime(totalTime) : '--'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      平均每次选择 {totalTime ? Math.round(totalTime / TRIALS / 1000) : '--'} 秒
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
                  <li>从四副牌中选择一张牌</li>
                  <li>每次选择都会获得一定金额的奖励</li>
                  <li>某些选择可能会带来损失</li>
                  <li>通过观察和学习，找出最有利的选择策略</li>
                  <li>目标是在100轮选择中获得最多的金钱</li>
                </ul>
                <p>提示：每副牌都有其特定的奖惩模式，尝试通过多次选择来了解这些模式。</p>
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

export default IowaGamblingTask;