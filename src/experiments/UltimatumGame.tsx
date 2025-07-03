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

interface Offer {
  amount: number;
  totalAmount: number;
  response: 'accept' | 'reject' | null;
  timestamp: number;
  role: 'proposer' | 'responder';
  aiOffer?: number;
}

const TOTAL_ROUNDS = 20;
const TOTAL_AMOUNT = 100;

const UltimatumGame = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [currentRound, setCurrentRound] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentRole, setCurrentRole] = useState<'proposer' | 'responder'>('proposer');
  const [currentOffer, setCurrentOffer] = useState<number>(0);
  const [history, setHistory] = useState<Offer[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [aiThinkingTime, setAiThinkingTime] = useState(false);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
    setCurrentRole(Math.random() < 0.5 ? 'proposer' : 'responder');
  };

  const makeOffer = (amount: number) => {
    setCurrentOffer(amount);
    setAiThinkingTime(true);
    
    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = simulateAIResponse(amount);
      const offer: Offer = {
        amount,
        totalAmount: TOTAL_AMOUNT,
        response: aiResponse ? 'accept' : 'reject',
        timestamp: Date.now(),
        role: 'proposer'
      };
      
      handleOfferComplete(offer);
      setAiThinkingTime(false);
    }, 1000 + Math.random() * 1000);
  };

  const respondToOffer = (accept: boolean) => {
    const offer: Offer = {
      amount: currentOffer,
      totalAmount: TOTAL_AMOUNT,
      response: accept ? 'accept' : 'reject',
      timestamp: Date.now(),
      role: 'responder',
      aiOffer: currentOffer
    };
    
    handleOfferComplete(offer);
  };

  const handleOfferComplete = (offer: Offer) => {
    setHistory(prev => [...prev, offer]);
    
    if (offer.response === 'accept') {
      if (offer.role === 'proposer') {
        setTotalPoints(prev => prev + (TOTAL_AMOUNT - offer.amount));
      } else {
        setTotalPoints(prev => prev + offer.amount);
      }
    }

    if (currentRound + 1 >= TOTAL_ROUNDS) {
      setGameState('finished');
      setTotalTime(Date.now() - (startTime || 0));
    } else {
      setCurrentRound(prev => prev + 1);
      setCurrentRole(prev => prev === 'proposer' ? 'responder' : 'proposer');
      if (currentRole === 'responder') {
        simulateAIOffer();
      }
    }
  };

  const simulateAIOffer = () => {
    setAiThinkingTime(true);
    setTimeout(() => {
      // AI strategy: Offer between 30% and 50% of total amount
      const aiOffer = Math.round((0.3 + Math.random() * 0.2) * TOTAL_AMOUNT);
      setCurrentOffer(aiOffer);
      setAiThinkingTime(false);
    }, 1000 + Math.random() * 1000);
  };

  const simulateAIResponse = (amount: number): boolean => {
    // AI strategy: Accept if offer is above 25% of total amount
    // Higher probability of accepting as offer increases
    const threshold = TOTAL_AMOUNT * 0.25;
    if (amount < threshold) return false;
    const acceptProbability = (amount - threshold) / (TOTAL_AMOUNT - threshold);
    return Math.random() < acceptProbability;
  };

  useEffect(() => {
    if (gameState === 'playing' && currentRole === 'responder' && history.length === currentRound) {
      simulateAIOffer();
    }
  }, [currentRole, currentRound, gameState]);

  const resetGame = () => {
    setGameState('instruction');
    setCurrentRound(0);
    setTotalPoints(0);
    setHistory([]);
    setStartTime(null);
    setTotalTime(null);
    setCurrentOffer(0);
    setAiThinkingTime(false);
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Ultimatum Game",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        totalRounds: TOTAL_ROUNDS,
        totalPoints,
        averageOffer: history.filter(h => h.role === 'proposer').reduce((sum, h) => sum + h.amount, 0) / 
                     history.filter(h => h.role === 'proposer').length,
        acceptanceRate: history.filter(h => h.response === 'accept').length / history.length
      },
      rounds: history.map((h, index) => ({
        round: index + 1,
        role: h.role,
        offer: h.amount,
        response: h.response,
        timestamp: new Date(h.timestamp).toISOString(),
        reactionTime: index > 0 ? h.timestamp - history[index - 1].timestamp : 0
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ultimatum-game-results-${Date.now()}.json`;
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
    const offerData = history.filter(h => h.role === 'proposer').map((h, index) => ({
      round: index + 1,
      offer: h.amount,
      accepted: h.response === 'accept'
    }));

    const acceptanceByRange = Array.from({ length: 5 }, (_, i) => ({
      range: `${i * 20}-${(i + 1) * 20}`,
      total: history.filter(h => h.amount >= i * 20 && h.amount < (i + 1) * 20).length,
      accepted: history.filter(h => 
        h.amount >= i * 20 && 
        h.amount < (i + 1) * 20 && 
        h.response === 'accept'
      ).length
    }));

    const rolePerformance = [
      {
        role: '提议者',
        averageOffer: history.filter(h => h.role === 'proposer')
          .reduce((sum, h) => sum + h.amount, 0) / 
          history.filter(h => h.role === 'proposer').length,
        acceptanceRate: history.filter(h => h.role === 'proposer' && h.response === 'accept').length /
          history.filter(h => h.role === 'proposer').length
      },
      {
        role: '回应者',
        averageOffer: history.filter(h => h.role === 'responder')
          .reduce((sum, h) => sum + h.amount, 0) /
          history.filter(h => h.role === 'responder').length,
        acceptanceRate: history.filter(h => h.role === 'responder' && h.response === 'accept').length /
          history.filter(h => h.role === 'responder').length
      }
    ];

    const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b'];

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">提议金额和接受情况</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={offerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="round" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="offer" 
                  stroke="#2563eb" 
                  name="提议金额"
                  dot={{ fill: '#2563eb', stroke: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">不同金额范围的接受率</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={acceptanceByRange}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="total" 
                    fill="#2563eb" 
                    name="总提议次数"
                  />
                  <Bar 
                    dataKey="accepted" 
                    fill="#10b981" 
                    name="被接受次数"
                  />
                </RechartsBarChart>
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
                    dataKey="averageOffer" 
                    fill="#2563eb" 
                    name="平均提议金额"
                  />
                  <Bar 
                    dataKey="acceptanceRate" 
                    fill="#10b981" 
                    name="接受率"
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
              <p className="text-sm font-medium text-gray-600">平均提议金额</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(history.reduce((sum, h) => sum + h.amount, 0) / history.length)} 元
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">总接受率</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((history.filter(h => h.response === 'accept').length / history.length) * 100)}%
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
                <h1 className="text-2xl font-bold text-gray-900">最后通牒游戏</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加最后通牒游戏。这是一个研究公平感和谈判策略的经典实验。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>每轮游戏中有两个角色：提议者和回应者</li>
                  <li>提议者决定如何分配{TOTAL_AMOUNT}元</li>
                  <li>回应者可以选择接受或拒绝提议</li>
                  <li>如果接受，双方按提议分配金额</li>
                  <li>如果拒绝，双方都得不到任何金额</li>
                  <li>实验共有{TOTAL_ROUNDS}轮</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>你将随机扮演提议者或回应者</li>
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
                    {currentRole === 'proposer' ? '提议者' : '回应者'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">总积分</p>
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
                {currentRole === 'proposer' ? (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      请提出你的分配方案
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                      总金额：{TOTAL_AMOUNT}元，请决定给对方多少金额
                    </p>
                    <div className="max-w-md mx-auto">
                      <input
                        type="range"
                        min="0"
                        max={TOTAL_AMOUNT}
                        value={currentOffer}
                        onChange={(e) => setCurrentOffer(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="mt-4 text-xl font-bold text-gray-900">
                        提议金额：{currentOffer}元
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        你将获得：{TOTAL_AMOUNT - currentOffer}元
                      </div>
                      <Button
                        variant="primary"
                        className="mt-8 w-full"
                        onClick={() => makeOffer(currentOffer)}
                        disabled={aiThinkingTime}
                      >
                        提交提议
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {aiThinkingTime ? '对方正在思考...' : '请回应对方的提议'}
                    </h2>
                    {!aiThinkingTime && (
                      <>
                        <p className="text-lg text-gray-600 mb-8">
                          对方提议给你 {currentOffer}元（总金额：{TOTAL_AMOUNT}元）
                        </p>
                        <div className="flex justify-center space-x-4">
                          <Button
                            variant="outline"
                            onClick={() => respondToOffer(false)}
                            className="w-32"
                          >
                            拒绝
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => respondToOffer(true)}
                            className="w-32"
                          >
                            接受
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
                  <li>作为提议者时：
                    <ul>
                      <li>决定如何分配{TOTAL_AMOUNT}元</li>
                      <li>考虑对方是否会接受你的提议</li>
                      <li>权衡自身收益和提议被接受的可能性</li>
                    </ul>
                  </li>
                  <li>作为回应者时：
                    <ul>
                      <li>决定是否接受对方的提议</li>
                      <li>权衡接受较低金额和双方都得不到钱的选择</li>
                    </ul>
                  </li>
                </ul>
                <p>提示：思考什么样的分配方案既能让自己获得较多收益，又能被对方接受。</p>
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

export default UltimatumGame;