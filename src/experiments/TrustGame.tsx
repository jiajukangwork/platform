import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, HandshakeIcon, Users } from 'lucide-react';
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
  role: 'investor' | 'trustee';
  initialAmount: number;
  investedAmount: number;
  returnedAmount: number | null;
  timestamp: number;
}

const TOTAL_ROUNDS = 20;
const INITIAL_AMOUNT = 100;
const MULTIPLIER = 3;

const TrustGame = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [currentRound, setCurrentRound] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentRole, setCurrentRole] = useState<'investor' | 'trustee'>('investor');
  const [currentAmount, setCurrentAmount] = useState(0);
  const [history, setHistory] = useState<Round[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [aiThinkingTime, setAiThinkingTime] = useState(false);
  const [multipliedAmount, setMultipliedAmount] = useState(0);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
    setCurrentRole(Math.random() < 0.5 ? 'investor' : 'trustee');
  };

  const makeInvestment = (amount: number) => {
    const multiplied = amount * MULTIPLIER;
    setMultipliedAmount(multiplied);
    setCurrentAmount(amount);
    setAiThinkingTime(true);
    
    setTimeout(() => {
      const returnedAmount = simulateAIReturn(multiplied);
      const round: Round = {
        role: 'investor',
        initialAmount: INITIAL_AMOUNT,
        investedAmount: amount,
        returnedAmount,
        timestamp: Date.now()
      };
      
      handleRoundComplete(round);
      setAiThinkingTime(false);
    }, 1000 + Math.random() * 1000);
  };

  const makeReturn = (amount: number) => {
    const round: Round = {
      role: 'trustee',
      initialAmount: INITIAL_AMOUNT,
      investedAmount: currentAmount,
      returnedAmount: amount,
      timestamp: Date.now()
    };
    
    handleRoundComplete(round);
  };

  const handleRoundComplete = (round: Round) => {
    setHistory(prev => [...prev, round]);
    
    if (round.role === 'investor') {
      const profit = round.returnedAmount! - round.investedAmount;
      setTotalPoints(prev => prev + profit);
    } else {
      const profit = (round.investedAmount * MULTIPLIER) - round.returnedAmount!;
      setTotalPoints(prev => prev + profit);
    }

    if (currentRound + 1 >= TOTAL_ROUNDS) {
      setGameState('finished');
      setTotalTime(Date.now() - (startTime || 0));
    } else {
      setCurrentRound(prev => prev + 1);
      setCurrentRole(prev => prev === 'investor' ? 'trustee' : 'investor');
      if (currentRole === 'trustee') {
        simulateAIInvestment();
      }
    }
  };

  const simulateAIInvestment = () => {
    setAiThinkingTime(true);
    setTimeout(() => {
      // AI strategy: Invest between 40% and 70% of initial amount
      const investment = Math.round((0.4 + Math.random() * 0.3) * INITIAL_AMOUNT);
      setCurrentAmount(investment);
      setMultipliedAmount(investment * MULTIPLIER);
      setAiThinkingTime(false);
    }, 1000 + Math.random() * 1000);
  };

  const simulateAIReturn = (multipliedAmount: number): number => {
    // AI strategy: Return between 40% and 60% of multiplied amount
    return Math.round((0.4 + Math.random() * 0.2) * multipliedAmount);
  };

  useEffect(() => {
    if (gameState === 'playing' && currentRole === 'trustee' && history.length === currentRound) {
      simulateAIInvestment();
    }
  }, [currentRole, currentRound, gameState]);

  const resetGame = () => {
    setGameState('instruction');
    setCurrentRound(0);
    setTotalPoints(0);
    setHistory([]);
    setStartTime(null);
    setTotalTime(null);
    setCurrentAmount(0);
    setMultipliedAmount(0);
    setAiThinkingTime(false);
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Trust Game",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        totalRounds: TOTAL_ROUNDS,
        totalPoints,
        averageInvestment: history.filter(h => h.role === 'investor')
          .reduce((sum, h) => sum + h.investedAmount, 0) / 
          history.filter(h => h.role === 'investor').length,
        averageReturn: history.filter(h => h.returnedAmount !== null)
          .reduce((sum, h) => sum + h.returnedAmount!, 0) /
          history.filter(h => h.returnedAmount !== null).length
      },
      rounds: history.map((h, index) => ({
        round: index + 1,
        role: h.role,
        initialAmount: h.initialAmount,
        investedAmount: h.investedAmount,
        returnedAmount: h.returnedAmount,
        timestamp: new Date(h.timestamp).toISOString(),
        reactionTime: index > 0 ? h.timestamp - history[index - 1].timestamp : 0
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trust-game-results-${Date.now()}.json`;
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
    const investmentData = history.filter(h => h.role === 'investor').map((h, index) => ({
      round: index + 1,
      investment: h.investedAmount,
      return: h.returnedAmount,
      profit: h.returnedAmount! - h.investedAmount
    }));

    const returnRatioData = history.filter(h => h.returnedAmount !== null).map(h => ({
      investment: h.investedAmount,
      multiplied: h.investedAmount * MULTIPLIER,
      returned: h.returnedAmount!,
      ratio: h.returnedAmount! / (h.investedAmount * MULTIPLIER)
    }));

    const rolePerformance = [
      {
        role: '投资者',
        averageInvestment: history.filter(h => h.role === 'investor')
          .reduce((sum, h) => sum + h.investedAmount, 0) /
          history.filter(h => h.role === 'investor').length,
        averageProfit: history.filter(h => h.role === 'investor')
          .reduce((sum, h) => sum + (h.returnedAmount! - h.investedAmount), 0) /
          history.filter(h => h.role === 'investor').length
      },
      {
        role: '受托者',
        averageReturn: history.filter(h => h.role === 'trustee')
          .reduce((sum, h) => sum + (h.returnedAmount || 0), 0) /
          history.filter(h => h.role === 'trustee').length,
        averageProfit: history.filter(h => h.role === 'trustee')
          .reduce((sum, h) => sum + ((h.investedAmount * MULTIPLIER) - (h.returnedAmount || 0)), 0) /
          history.filter(h => h.role === 'trustee').length
      }
    ];

    const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b'];

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">投资和回报趋势</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={investmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="round" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="investment" 
                  stroke="#2563eb" 
                  name="投资金额"
                />
                <Line 
                  type="monotone" 
                  dataKey="return" 
                  stroke="#10b981" 
                  name="回报金额"
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#ef4444" 
                  name="收益"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">回报率分析</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="investment" 
                    name="投资金额"
                    unit="元"
                  />
                  <YAxis 
                    dataKey="ratio" 
                    name="回报率"
                    unit="%"
                    domain={[0, 1]}
                  />
                  <Tooltip />
                  <Legend />
                  <Scatter 
                    name="回报率" 
                    data={returnRatioData} 
                    fill="#2563eb"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">角色表现对比</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={rolePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="averageInvestment" 
                    fill="#2563eb" 
                    name="平均投资"
                  />
                  <Bar 
                    dataKey="averageReturn" 
                    fill="#10b981" 
                    name="平均回报"
                  />
                  <Bar 
                    dataKey="averageProfit" 
                    fill="#ef4444" 
                    name="平均收益"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">详细统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均投资率</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((history.filter(h => h.role === 'investor')
                  .reduce((sum, h) => sum + h.investedAmount, 0) /
                  (history.filter(h => h.role === 'investor').length * INITIAL_AMOUNT)) * 100)}%
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均回报率</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((history.filter(h => h.returnedAmount !== null)
                  .reduce((sum, h) => sum + h.returnedAmount!, 0) /
                  history.filter(h => h.returnedAmount !== null)
                    .reduce((sum, h) => sum + (h.investedAmount * MULTIPLIER), 0)) * 100)}%
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
                <Users className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">信任博弈</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加信任博弈实验。这个实验旨在研究人们之间的信任和互惠行为。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>每轮游戏中有两个角色：投资者和受托者</li>
                  <li>投资者初始获得{INITIAL_AMOUNT}元，可以选择投资一部分给受托者</li>
                  <li>投资金额会被乘以{MULTIPLIER}倍</li>
                  <li>受托者决定返还多少金额给投资者</li>
                  <li>实验共有{TOTAL_ROUNDS}轮</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>你将随机扮演投资者或受托者</li>
                  <li>每轮角色会互换</li>
                  <li>认真思考每个决定</li>
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
                  <p className="text-sm font-medium text-gray-500">当前角色</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {currentRole === 'investor' ? '投资者' : '受托者'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">总收益</p>
                  <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">平均收益</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentRound > 0 ? Math.round(totalPoints / currentRound) : 0}
                  </p>
                </div>
              </div>

              <motion.div
                className="bg-white rounded-xl shadow-sm p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {currentRole === 'investor' ? (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      请决定投资金额
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                      你有{INITIAL_AMOUNT}元，投资的金额将会被乘以{MULTIPLIER}倍
                    </p>
                    <div className="max-w-md mx-auto">
                      <input
                        type="range"
                        min="0"
                        max={INITIAL_AMOUNT}
                        value={currentAmount}
                        onChange={(e) => setCurrentAmount(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="mt-4 text-xl font-bold text-gray-900">
                        投资金额：{currentAmount}元
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        将变为：{currentAmount * MULTIPLIER}元
                      </div>
                      <Button
                        variant="primary"
                        className="mt-8 w-full"
                        onClick={() => makeInvestment(currentAmount)}
                        disabled={aiThinkingTime}
                      >
                        确认投资
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {aiThinkingTime ? '对方正在思考...' : '请决定返还金额'}
                    </h2>
                    {!aiThinkingTime && (
                      <>
                        <p className="text-lg text-gray-600 mb-8">
                          收到投资{currentAmount}元，已变为{multipliedAmount}元
                        </p>
                        <div className="max-w-md mx-auto">
                          <input
                            type="range"
                            min="0"
                            max={multipliedAmount}
                            value={currentAmount}
                            onChange={(e) => setCurrentAmount(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="mt-4 text-xl font-bold text-gray-900">
                            返还金额：{currentAmount}元
                          </div>
                          <div className="text-sm text-gray-500 mt-2">
                            你将获得：{multipliedAmount - currentAmount}元
                          </div>
                          <Button
                            variant="primary"
                            className="mt-8 w-full"
                            onClick={() => makeReturn(currentAmount)}
                          >
                            确认返还
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
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
                  <li>作为投资者时：
                    <ul>
                      <li>决定投资多少金额给受托者</li>
                      <li>投资金额会被乘以{MULTIPLIER}倍</li>
                      <li>等待受托者决定返还金额</li>
                    </ul>
                  </li>
                  <li>作为受托者时：
                    <ul>
                      <li>收到投资者的投资（已被乘以{MULTIPLIER}倍）</li>
                      <li>决定返还多少金额给投资者</li>
                    </ul>
                  </li>
                </ul>
                <p>提示：思考如何通过合作获得双方都满意的收益。</p>
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

export default TrustGame;