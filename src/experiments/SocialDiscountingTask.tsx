import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, Users, Heart } from 'lucide-react';
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

interface Choice {
  socialDistance: number;
  immediateReward: number;
  delayedReward: number;
  choice: 'immediate' | 'delayed';
  timestamp: number;
}

const TOTAL_TRIALS = 40;
const SOCIAL_DISTANCES = [1, 2, 5, 10, 20, 50, 100];
const REWARD_RATIOS = [0.2, 0.4, 0.6, 0.8];
const BASE_DELAYED_REWARD = 1000;

const generateTrials = (): { socialDistance: number; immediateReward: number; delayedReward: number }[] => {
  const trials: { socialDistance: number; immediateReward: number; delayedReward: number }[] = [];
  
  SOCIAL_DISTANCES.forEach(distance => {
    REWARD_RATIOS.forEach(ratio => {
      trials.push({
        socialDistance: distance,
        immediateReward: Math.round(BASE_DELAYED_REWARD * ratio),
        delayedReward: BASE_DELAYED_REWARD
      });
    });
  });
  
  return trials.sort(() => Math.random() - 0.5).slice(0, TOTAL_TRIALS);
};

const SocialDiscountingTask = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [trials, setTrials] = useState<{ socialDistance: number; immediateReward: number; delayedReward: number }[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);

  useEffect(() => {
    // Generate trials when component mounts
    const generatedTrials = generateTrials();
    setTrials(generatedTrials);
  }, []);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
  };

  const makeChoice = (choice: 'immediate' | 'delayed') => {
    if (!trials.length || currentTrial >= trials.length) return;

    const trial = trials[currentTrial];
    const decision: Choice = {
      socialDistance: trial.socialDistance,
      immediateReward: trial.immediateReward,
      delayedReward: trial.delayedReward,
      choice,
      timestamp: Date.now()
    };
    
    setChoices(prev => [...prev, decision]);

    if (currentTrial + 1 >= TOTAL_TRIALS) {
      setGameState('finished');
      setTotalTime(Date.now() - (startTime || 0));
    } else {
      setCurrentTrial(prev => prev + 1);
    }
  };

  const resetGame = () => {
    const newTrials = generateTrials();
    setTrials(newTrials);
    setCurrentTrial(0);
    setChoices([]);
    setGameState('instruction');
    setStartTime(null);
    setTotalTime(null);
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Social Discounting Task",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        totalTrials: TOTAL_TRIALS,
        selfishChoiceRate: choices.filter(c => c.choice === 'immediate').length / choices.length,
        socialDiscountRate: calculateSocialDiscountRate()
      },
      choices: choices.map((c, index) => ({
        trial: index + 1,
        socialDistance: c.socialDistance,
        immediateReward: c.immediateReward,
        delayedReward: c.delayedReward,
        choice: c.choice,
        timestamp: new Date(c.timestamp).toISOString(),
        reactionTime: index > 0 ? c.timestamp - choices[index - 1].timestamp : 0
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-discounting-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateSocialDiscountRate = () => {
    // Calculate k parameter using hyperbolic discounting model
    // V = A / (1 + kD) where V is subjective value, A is amount, D is social distance
    const kValues = SOCIAL_DISTANCES.map(distance => {
      const relevantChoices = choices.filter(c => c.socialDistance === distance);
      if (relevantChoices.length === 0) return null;
      
      const altruisticRate = relevantChoices.filter(c => c.choice === 'delayed').length / relevantChoices.length;
      if (altruisticRate === 1) return 0; // No discounting
      if (altruisticRate === 0) return Infinity; // Maximum discounting
      
      // Approximate k using the altruistic rate
      return (1 / altruisticRate - 1) / distance;
    }).filter(k => k !== null && isFinite(k)) as number[];
    
    return kValues.length > 0 ? kValues.reduce((a, b) => a + b, 0) / kValues.length : 0;
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}分${seconds}秒`;
  };

  const renderResultsAnalysis = () => {
    const choicesByDistance = SOCIAL_DISTANCES.map(distance => ({
      distance,
      altruistic: choices.filter(c => c.socialDistance === distance && c.choice === 'delayed').length,
      selfish: choices.filter(c => c.socialDistance === distance && c.choice === 'immediate').length
    }));

    const discountingCurve = SOCIAL_DISTANCES.map(distance => {
      const relevantChoices = choices.filter(c => c.socialDistance === distance);
      return {
        distance,
        altruisticRate: relevantChoices.length > 0 
          ? relevantChoices.filter(c => c.choice === 'delayed').length / relevantChoices.length 
          : 0
      };
    });

    const reactionTimes = choices.map((c, index) => ({
      trial: index + 1,
      time: index > 0 ? (c.timestamp - choices[index - 1].timestamp) / 1000 : 0,
      distance: c.socialDistance
    }));

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">社会贴现曲线</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={discountingCurve}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="distance" 
                  label={{ value: '社会距离', position: 'bottom' }}
                />
                <YAxis 
                  domain={[0, 1]} 
                  label={{ value: '利他选择率', angle: -90, position: 'left' }}
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="altruisticRate" 
                  stroke="#2563eb" 
                  name="利他选择率"
                  dot={{ fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">不同社会距离的选择分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={choicesByDistance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="distance" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="altruistic" 
                    fill="#2563eb" 
                    name="利他选择"
                  />
                  <Bar 
                    dataKey="selfish" 
                    fill="#ef4444" 
                    name="自利选择"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">决策时间分析</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="trial" 
                    name="试次"
                  />
                  <YAxis 
                    dataKey="time" 
                    name="决策时间(秒)"
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter 
                    name="决策时间" 
                    data={reactionTimes} 
                    fill="#2563eb"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">详细统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">社会贴现率</p>
              <p className="text-xl font-bold text-gray-900">
                {calculateSocialDiscountRate().toFixed(4)}
              </p>
              <p className="text-xs text-gray-500 mt-1">较低的值表示更强的利他倾向</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">利他选择比例</p>
              <p className="text-xl font-bold text-gray-900">
                {((choices.filter(c => c.choice === 'delayed').length / choices.length) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均决策时间</p>
              <p className="text-xl font-bold text-gray-900">
                {(choices.reduce((sum, c, i) => 
                  sum + (i > 0 ? c.timestamp - choices[i - 1].timestamp : 0), 0
                ) / (choices.length - 1) / 1000).toFixed(2)} 秒
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
                <Heart className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">社会贴现任务</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加社会贴现任务实验。这个实验旨在研究人们如何在自身利益和他人利益之间做出权衡。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>你将面对一系列选择情境</li>
                  <li>每次需要在两个选项之间做出选择：
                    <ul>
                      <li>立即获得较小金额（给自己）</li>
                      <li>给予社会距离不同的他人较大金额</li>
                    </ul>
                  </li>
                  <li>社会距离从1到100不等，数字越大表示关系越远</li>
                  <li>实验共有{TOTAL_TRIALS}轮</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>仔细考虑每个选择</li>
                  <li>根据你的真实偏好做出决定</li>
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

          {gameState === 'playing' && trials.length > 0 && currentTrial < trials.length && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">当前进度</p>
                  <p className="text-2xl font-bold text-primary-600">{currentTrial + 1} / {TOTAL_TRIALS}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">社会距离</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {trials[currentTrial].socialDistance}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">利他选择</p>
                  <p className="text-2xl font-bold text-green-600">
                    {choices.filter(c => c.choice === 'delayed').length}次
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">自利选择</p>
                  <p className="text-2xl font-bold text-red-600">
                    {choices.filter(c => c.choice === 'immediate').length}次
                  </p>
                </div>
              </div>

              <motion.div
                className="bg-white rounded-xl shadow-sm p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={currentTrial}
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    请做出你的选择
                  </h2>
                  
                  <p className="text-lg text-gray-600 mb-8">
                    社会距离：{trials[currentTrial].socialDistance}
                    （数字越大表示关系越远）
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => makeChoice('immediate')}
                        className="w-full p-6 bg-red-50 rounded-xl border-2 border-red-200 hover:border-red-400 transition-colors"
                      >
                        <h3 className="text-xl font-bold text-red-900 mb-2">立即获得</h3>
                        <p className="text-3xl font-bold text-red-600 mb-2">
                          {trials[currentTrial].immediateReward}元
                        </p>
                        <p className="text-sm text-red-600">给自己</p>
                      </button>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => makeChoice('delayed')}
                        className="w-full p-6 bg-green-50 rounded-xl border-2 border-green-200 hover:border-green-400 transition-colors"
                      >
                        <h3 className="text-xl font-bold text-green-900 mb-2">给予他人</h3>
                        <p className="text-3xl font-bold text-green-600 mb-2">
                          {trials[currentTrial].delayedReward}元
                        </p>
                        <p className="text-sm text-green-600">
                          社会距离：{trials[currentTrial].socialDistance}
                        </p>
                      </button>
                    </motion.div>
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
                      平均每个决策 {totalTime ? Math.round(totalTime / TOTAL_TRIALS / 1000) : '--'} 秒
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart className="w-5 h-5 text-primary-600" />
                      <p className="text-lg font-medium text-gray-900">利他倾向</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {((choices.filter(c => c.choice === 'delayed').length / choices.length) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      选择给予他人的比例
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
                  <li>在每个选择情境中做出决定：
                    <ul>
                      <li>选择立即获得较小金额（给自己）</li>
                      <li>选择给予他人较大金额</li>
                    </ul>
                  </li>
                  <li>考虑社会距离因素：
                    <ul>
                      <li>距离范围：1-100</li>
                      <li>1表示最亲近的人</li>
                      <li>100表示最疏远的人</li>
                    </ul>
                  </li>
                </ul>
                <p>提示：根据你的真实偏好做出选择，没有对错之分。</p>
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

export default SocialDiscountingTask;