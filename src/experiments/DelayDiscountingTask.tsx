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
  ScatterChart,
  Scatter,
  ZAxis,
  Bar,
  BarChart as RechartsBarChart
} from 'recharts';

interface Choice {
  immediateAmount: number;
  delayedAmount: number;
  delay: number; // in days
}

const TRIALS = 30;
const DELAYED_AMOUNTS = [1000, 2000, 5000];
const DELAYS = [7, 30, 90, 180, 365]; // days

const generateTrials = (): Choice[] => {
  const trials: Choice[] = [];
  DELAYED_AMOUNTS.forEach(delayedAmount => {
    DELAYS.forEach(delay => {
      // Generate immediate amounts at 20%, 40%, 60%, 80% of delayed amount
      [0.2, 0.4, 0.6, 0.8].forEach(ratio => {
        trials.push({
          immediateAmount: Math.round(delayedAmount * ratio),
          delayedAmount,
          delay
        });
      });
    });
  });
  // Shuffle trials
  return trials.sort(() => Math.random() - 0.5).slice(0, TRIALS);
};

const DelayDiscountingTask = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [trials, setTrials] = useState<Choice[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [choices, setChoices] = useState<{
    trial: number;
    choice: 'immediate' | 'delayed';
    immediateAmount: number;
    delayedAmount: number;
    delay: number;
    timestamp: number;
  }[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);

  useEffect(() => {
    setTrials(generateTrials());
  }, []);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
  };

  const makeChoice = (choice: 'immediate' | 'delayed') => {
    const trial = trials[currentTrial];
    setChoices(prev => [...prev, {
      trial: currentTrial + 1,
      choice,
      immediateAmount: trial.immediateAmount,
      delayedAmount: trial.delayedAmount,
      delay: trial.delay,
      timestamp: Date.now()
    }]);

    if (currentTrial + 1 >= TRIALS) {
      setGameState('finished');
      setTotalTime(Date.now() - (startTime || 0));
    } else {
      setCurrentTrial(prev => prev + 1);
    }
  };

  const resetGame = () => {
    setTrials(generateTrials());
    setCurrentTrial(0);
    setChoices([]);
    setGameState('instruction');
    setStartTime(null);
    setTotalTime(null);
  };

  const calculateDiscountRate = () => {
    // Calculate k parameter using hyperbolic discounting model
    // V = A / (1 + kD) where V is subjective value, A is amount, D is delay
    const kValues = choices.map(choice => {
      if (choice.choice === 'immediate') {
        // If immediate was chosen, V is the immediate amount
        const V = choice.immediateAmount;
        const A = choice.delayedAmount;
        const D = choice.delay;
        // Solve for k: k = (A/V - 1) / D
        return (A / V - 1) / D;
      }
      return null;
    }).filter(k => k !== null) as number[];

    return kValues.reduce((a, b) => a + b, 0) / kValues.length;
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Delay Discounting Task",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        totalTrials: TRIALS,
        discountRate: calculateDiscountRate()
      },
      choices: choices.map((choice, index) => ({
        trial: choice.trial,
        choice: choice.choice,
        immediateAmount: choice.immediateAmount,
        delayedAmount: choice.delayedAmount,
        delay: choice.delay,
        timestamp: new Date(choice.timestamp).toISOString(),
        reactionTime: index > 0 ? choice.timestamp - choices[index - 1].timestamp : 0
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delay-discounting-task-results-${Date.now()}.json`;
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
    const discountRate = calculateDiscountRate();
    
    const choicesByDelay = DELAYS.map(delay => ({
      delay,
      immediateChoices: choices.filter(c => c.delay === delay && c.choice === 'immediate').length,
      delayedChoices: choices.filter(c => c.delay === delay && c.choice === 'delayed').length
    }));

    const choicesByAmount = DELAYED_AMOUNTS.map(amount => ({
      amount,
      immediateChoices: choices.filter(c => c.delayedAmount === amount && c.choice === 'immediate').length,
      delayedChoices: choices.filter(c => c.delayedAmount === amount && c.choice === 'delayed').length
    }));

    const scatterData = choices.map(choice => ({
      delay: choice.delay,
      ratio: choice.immediateAmount / choice.delayedAmount,
      choice: choice.choice
    }));

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">延迟折扣曲线</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="delay" 
                  name="延迟天数" 
                  unit="天"
                />
                <YAxis 
                  dataKey="ratio" 
                  name="价值比率" 
                  domain={[0, 1]} 
                />
                <ZAxis range={[100]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: any, name: any) => [value, name === 'ratio' ? '价值比率' : '延迟天数']}
                />
                <Scatter 
                  name="立即选择" 
                  data={scatterData.filter(d => d.choice === 'immediate')}
                  fill="#2563eb"
                />
                <Scatter 
                  name="延迟选择" 
                  data={scatterData.filter(d => d.choice === 'delayed')}
                  fill="#10b981"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">不同延迟时间的选择分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={choicesByDelay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="delay" name="延迟天数" unit="天" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="immediateChoices" name="选择立即" fill="#2563eb" />
                  <Bar dataKey="delayedChoices" name="选择延迟" fill="#10b981" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">不同奖励金额的选择分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={choicesByAmount}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="amount" name="延迟奖励金额" unit="元" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="immediateChoices" name="选择立即" fill="#2563eb" />
                  <Bar dataKey="delayedChoices" name="选择延迟" fill="#10b981" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">详细统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">折扣率 (k)</p>
              <p className="text-xl font-bold text-gray-900">{discountRate.toFixed(4)}</p>
              <p className="text-xs text-gray-500 mt-1">较低的值表示更强的延迟耐心</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">立即选择比例</p>
              <p className="text-xl font-bold text-gray-900">
                {((choices.filter(c => c.choice === 'immediate').length / choices.length) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均反应时间</p>
              <p className="text-xl font-bold text-gray-900">
                {(choices.reduce((sum, c, i) => sum + (i > 0 ? c.timestamp - choices[i - 1].timestamp : 0), 0) / (choices.length - 1) / 1000).toFixed(2)} 秒
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
                <h1 className="text-2xl font-bold text-gray-900">延迟折扣任务</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加延迟折扣任务实验。这个实验旨在研究人们如何在即时和延迟奖励之间做出选择。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>你将面临一系列选择</li>
                  <li>每次需要在立即获得较小金额和等待一段时间获得较大金额之间做选择</li>
                  <li>没有对错之分，请根据你的真实偏好做出选择</li>
                  <li>实验共有{TRIALS}轮</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>认真考虑每个选项</li>
                  <li>保持注意力集中</li>
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
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">当前进度</p>
                  <p className="text-2xl font-bold text-primary-600">{currentTrial + 1} / {TRIALS}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">完成百分比</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((currentTrial / TRIALS) * 100)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">立即选择</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {choices.filter(c => c.choice === 'immediate').length}次
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">延迟选择</p>
                  <p className="text-2xl font-bold text-green-600">
                    {choices.filter(c => c.choice === 'delayed').length}次
                  </p>
                </div>
              </div>

              <motion.div
                className="bg-white rounded-xl shadow-sm p-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={currentTrial}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-8">请做出你的选择</h2>
                
                <div className="grid grid-cols-2 gap-8">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={() => makeChoice('immediate')}
                      className="w-full p-6 bg-blue-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-colors"
                    >
                      <h3 className="text-xl font-bold text-blue-900 mb-2">立即获得</h3>
                      <p className="text-3xl font-bold text-blue-600">
                        {trials[currentTrial].immediateAmount}元
                      </p>
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
                      <h3 className="text-xl font-bold text-green-900 mb-2">
                        {trials[currentTrial].delay}天后获得
                      </h3>
                      <p className="text-3xl font-bold text-green-600">
                        {trials[currentTrial].delayedAmount}元
                      </p>
                    </button>
                  </motion.div>
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
                      平均每次选择 {totalTime ? Math.round(totalTime / TRIALS / 1000) : '--'} 秒
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart className="w-5 h-5 text-primary-600" />
                      <p className="text-lg font-medium text-gray-900">选择统计</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {choices.filter(c => c.choice === 'immediate').length} : {choices.filter(c => c.choice === 'delayed').length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      立即选择 vs 延迟选择
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
                  <li>在每轮选择中，决定是要立即获得较小的奖励，还是等待一段时间后获得较大的奖励</li>
                  <li>仔细权衡即时获得和延迟获得的价值</li>
                  <li>根据你的真实偏好做出选择</li>
                  <li>保持专注，完成所有{TRIALS}轮选择</li>
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

export default DelayDiscountingTask;