import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, Bot as Slot } from 'lucide-react';
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
  ScatterChart,
  Scatter
} from 'recharts';

interface Bandit {
  id: number;
  meanReward: number;
  standardDeviation: number;
  timesChosen: number;
  totalReward: number;
}

const TOTAL_TRIALS = 100;
const NUM_BANDITS = 4;

// Generate bandits with different reward distributions
const generateBandits = (): Bandit[] => {
  return Array.from({ length: NUM_BANDITS }, (_, i) => ({
    id: i + 1,
    meanReward: 40 + Math.random() * 40, // Mean rewards between 40 and 80
    standardDeviation: 10 + Math.random() * 10, // SD between 10 and 20
    timesChosen: 0,
    totalReward: 0
  }));
};

const MultiArmedBanditTask = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [bandits, setBandits] = useState<Bandit[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [history, setHistory] = useState<{
    trial: number;
    banditId: number;
    reward: number;
    timestamp: number;
  }[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    setBandits(generateBandits());
  }, []);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
  };

  const pullLever = (banditId: number) => {
    const bandit = bandits[banditId];
    
    // Generate reward using normal distribution
    const reward = Math.round(
      bandit.meanReward + (bandit.standardDeviation * normalRandom())
    );
    
    // Update bandit statistics
    setBandits(prev => prev.map(b => 
      b.id === banditId + 1 
        ? {
            ...b,
            timesChosen: b.timesChosen + 1,
            totalReward: b.totalReward + reward
          }
        : b
    ));
    
    setTotalReward(prev => prev + reward);
    setLastReward(reward);
    setShowReward(true);
    
    setHistory(prev => [...prev, {
      trial: currentTrial + 1,
      banditId: banditId + 1,
      reward,
      timestamp: Date.now()
    }]);

    setTimeout(() => {
      setShowReward(false);
      if (currentTrial + 1 >= TOTAL_TRIALS) {
        setGameState('finished');
        setTotalTime(Date.now() - (startTime || 0));
      } else {
        setCurrentTrial(prev => prev + 1);
      }
    }, 1000);
  };

  // Box-Muller transform for normal distribution
  const normalRandom = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  const resetGame = () => {
    setBandits(generateBandits());
    setCurrentTrial(0);
    setTotalReward(0);
    setHistory([]);
    setGameState('instruction');
    setStartTime(null);
    setTotalTime(null);
    setLastReward(null);
    setShowReward(false);
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Multi-Armed Bandit Task",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        totalTrials: TOTAL_TRIALS,
        totalReward,
        bandits: bandits.map(b => ({
          id: b.id,
          meanReward: b.meanReward,
          standardDeviation: b.standardDeviation,
          timesChosen: b.timesChosen,
          totalReward: b.totalReward,
          averageReward: b.timesChosen > 0 ? b.totalReward / b.timesChosen : 0
        }))
      },
      trials: history.map((h, index) => ({
        trial: h.trial,
        banditId: h.banditId,
        reward: h.reward,
        timestamp: new Date(h.timestamp).toISOString(),
        reactionTime: index > 0 ? h.timestamp - history[index - 1].timestamp : 0
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multi-armed-bandit-results-${Date.now()}.json`;
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
    const rewardsByTrial = history.map(h => ({
      trial: h.trial,
      reward: h.reward,
      cumulativeAverage: history
        .slice(0, history.findIndex(trial => trial.trial === h.trial) + 1)
        .reduce((sum, trial) => sum + trial.reward, 0) / h.trial
    }));

    const banditPerformance = bandits.map(b => ({
      bandit: `选项 ${b.id}`,
      timesChosen: b.timesChosen,
      averageReward: b.timesChosen > 0 ? b.totalReward / b.timesChosen : 0
    }));

    const explorationRate = history.reduce((acc, h, i) => {
      if (i === 0) return [{ trial: 1, rate: 1 }];
      const uniqueBandits = new Set(history.slice(0, i + 1).map(t => t.banditId)).size;
      return [...acc, { trial: i + 1, rate: uniqueBandits / NUM_BANDITS }];
    }, [] as { trial: number; rate: number }[]);

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">奖励趋势分析</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rewardsByTrial}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trial" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="reward" 
                  stroke="#2563eb" 
                  name="单次奖励"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeAverage" 
                  stroke="#10b981" 
                  name="累计平均"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">选项表现分析</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={banditPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bandit" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="timesChosen" 
                    fill="#2563eb" 
                    name="选择次数"
                  />
                  <Bar 
                    dataKey="averageReward" 
                    fill="#10b981" 
                    name="平均奖励"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">探索率变化</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={explorationRate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trial" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#2563eb" 
                    name="探索率"
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
              <p className="text-sm font-medium text-gray-600">平均奖励</p>
              <p className="text-xl font-bold text-gray-900">
                {(totalReward / TOTAL_TRIALS).toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">每次选择的平均收益</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">最佳选项使用率</p>
              <p className="text-xl font-bold text-gray-900">
                {((bandits.reduce((max, b) => 
                  b.timesChosen > max.timesChosen ? b : max
                ).timesChosen / TOTAL_TRIALS) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">选择次数最多的选项占比</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均反应时间</p>
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
                <Slot className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">多臂老虎机任务</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加多臂老虎机任务。这个实验旨在研究人们如何在探索新选项和利用已知选项之间做出权衡。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>你将面对{NUM_BANDITS}个选项（老虎机）</li>
                  <li>每个选项都有其独特的奖励分布</li>
                  <li>每次选择后都会获得相应的奖励</li>
                  <li>你的目标是通过{TOTAL_TRIALS}轮选择获得最多的总奖励</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>每个选项的奖励是不确定的</li>
                  <li>需要在探索新选项和利用已知好选项之间做出权衡</li>
                  <li>保持注意力集中</li>
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
                  <p className="text-sm font-medium text-gray-500">当前进度</p>
                  <p className="text-2xl font-bold text-primary-600">{currentTrial + 1} / {TOTAL_TRIALS}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">总奖励</p>
                  <p className="text-2xl font-bold text-green-600">{totalReward}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">平均奖励</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {currentTrial > 0 ? (totalReward / currentTrial).toFixed(1) : '0'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">上次奖励</p>
                  <p className="text-2xl font-bold text-gray-900">{lastReward || '--'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Array.from({ length: NUM_BANDITS }).map((_, index) => (
                  <motion.div
                    key={index}
                    className="relative"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => pullLever(index)}
                      disabled={showReward}
                      className={`
                        w-full aspect-[3/4] bg-white rounded-xl shadow-sm overflow-hidden
                        hover:shadow-md transition-all
                        ${showReward ? 'cursor-not-allowed opacity-50' : ''}
                      `}
                    >
                      <div className="h-full flex flex-col items-center justify-center p-6">
                        <Slot className="w-12 h-12 text-primary-600 mb-4" />
                        <p className="text-lg font-bold text-gray-900">选项 {index + 1}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          已选择 {bandits[index]?.timesChosen || 0} 次
                        </p>
                      </div>
                    </button>

                    <AnimatePresence>
                      {showReward && lastReward !== null && history[history.length - 1]?.banditId === index + 1 && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="text-2xl font-bold text-white">
                            +{lastReward}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

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
                      平均每次选择 {totalTime ? Math.round(totalTime / TOTAL_TRIALS / 1000) : '--'} 秒
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart className="w-5 h-5 text-primary-600" />
                      <p className="text-lg font-medium text-gray-900">总奖励</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {totalReward}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      平均每次 {(totalReward / TOTAL_TRIALS).toFixed(1)}
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
                  <li>从{NUM_BANDITS}个选项中选择一个</li>
                  <li>每个选项都有其独特的奖励分布</li>
                  <li>通过尝试了解每个选项的特点</li>
                  <li>在探索新选项和利用已知好选项之间做出权衡</li>
                  <li>目标是在{TOTAL_TRIALS}轮中获得最多的总奖励</li>
                </ul>
                <p>提示：需要平衡探索和利用，找到最优的选择策略。</p>
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

export default MultiArmedBanditTask;