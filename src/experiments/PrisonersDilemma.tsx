import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, Users, HandshakeIcon, AlertTriangle } from 'lucide-react';
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
  choice: 'cooperate' | 'defect';
  aiChoice: 'cooperate' | 'defect';
  reward: number;
  timestamp: number;
}

const TOTAL_ROUNDS = 20;
const REWARDS = {
  bothCooperate: 30,   // Both cooperate
  bothDefect: -10,     // Both defect
  defectWin: 50,       // Defect while other cooperates
  defectLose: -30      // Cooperate while other defects
};

const PrisonersDilemma = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [currentRound, setCurrentRound] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [history, setHistory] = useState<Round[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [aiThinkingTime, setAiThinkingTime] = useState(false);
  const [lastResult, setLastResult] = useState<{
    choice: 'cooperate' | 'defect';
    aiChoice: 'cooperate' | 'defect';
    reward: number;
  } | null>(null);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
  };

  const makeChoice = (choice: 'cooperate' | 'defect') => {
    setAiThinkingTime(true);
    
    setTimeout(() => {
      const aiChoice = simulateAIChoice(choice);
      const reward = calculateReward(choice, aiChoice);
      
      const round: Round = {
        choice,
        aiChoice,
        reward,
        timestamp: Date.now()
      };
      
      setHistory(prev => [...prev, round]);
      setTotalPoints(prev => prev + reward);
      setLastResult({ choice, aiChoice, reward });

      if (currentRound + 1 >= TOTAL_ROUNDS) {
        setGameState('finished');
        setTotalTime(Date.now() - (startTime || 0));
      } else {
        setTimeout(() => {
          setCurrentRound(prev => prev + 1);
          setLastResult(null);
          setAiThinkingTime(false);
        }, 1500);
      }
    }, 1000);
  };

  const simulateAIChoice = (playerChoice: 'cooperate' | 'defect'): 'cooperate' | 'defect' => {
    // AI strategy: Tit-for-tat with forgiveness
    if (history.length === 0) return 'cooperate';
    
    const lastPlayerChoice = history[history.length - 1].choice;
    const forgiveness = 0.2; // 20% chance to cooperate even after defection
    
    if (lastPlayerChoice === 'defect' && Math.random() > forgiveness) {
      return 'defect';
    }
    return 'cooperate';
  };

  const calculateReward = (playerChoice: 'cooperate' | 'defect', aiChoice: 'cooperate' | 'defect'): number => {
    if (playerChoice === 'cooperate' && aiChoice === 'cooperate') return REWARDS.bothCooperate;
    if (playerChoice === 'defect' && aiChoice === 'defect') return REWARDS.bothDefect;
    if (playerChoice === 'defect' && aiChoice === 'cooperate') return REWARDS.defectWin;
    return REWARDS.defectLose;
  };

  const resetGame = () => {
    setGameState('instruction');
    setCurrentRound(0);
    setTotalPoints(0);
    setHistory([]);
    setStartTime(null);
    setTotalTime(null);
    setLastResult(null);
    setAiThinkingTime(false);
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Prisoner's Dilemma",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        totalRounds: TOTAL_ROUNDS,
        totalPoints,
        cooperationRate: history.filter(h => h.choice === 'cooperate').length / history.length,
        mutualCooperation: history.filter(h => h.choice === 'cooperate' && h.aiChoice === 'cooperate').length
      },
      rounds: history.map((h, index) => ({
        round: index + 1,
        playerChoice: h.choice,
        aiChoice: h.aiChoice,
        reward: h.reward,
        timestamp: new Date(h.timestamp).toISOString(),
        reactionTime: index > 0 ? h.timestamp - history[index - 1].timestamp : 0
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prisoners-dilemma-results-${Date.now()}.json`;
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
    const choiceData = history.map((h, index) => ({
      round: index + 1,
      choice: h.choice === 'cooperate' ? 1 : 0,
      aiChoice: h.aiChoice === 'cooperate' ? 1 : 0,
      reward: h.reward
    }));

    const outcomeDistribution = [
      {
        name: '双方合作',
        value: history.filter(h => h.choice === 'cooperate' && h.aiChoice === 'cooperate').length
      },
      {
        name: '双方背叛',
        value: history.filter(h => h.choice === 'defect' && h.aiChoice === 'defect').length
      },
      {
        name: '一方合作一方背叛',
        value: history.filter(h => h.choice !== h.aiChoice).length
      }
    ];

    const choicePerformance = [
      {
        choice: '选择合作',
        averageReward: history.filter(h => h.choice === 'cooperate')
          .reduce((sum, h) => sum + h.reward, 0) /
          Math.max(1, history.filter(h => h.choice === 'cooperate').length),
        frequency: history.filter(h => h.choice === 'cooperate').length
      },
      {
        choice: '选择背叛',
        averageReward: history.filter(h => h.choice === 'defect')
          .reduce((sum, h) => sum + h.reward, 0) /
          Math.max(1, history.filter(h => h.choice === 'defect').length),
        frequency: history.filter(h => h.choice === 'defect').length
      }
    ];

    const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b'];

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">选择趋势分析</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={choiceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="round" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="choice" 
                  stroke="#2563eb" 
                  name="玩家合作"
                  dot={{ fill: '#2563eb' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="aiChoice" 
                  stroke="#10b981" 
                  name="AI合作"
                  dot={{ fill: '#10b981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="reward" 
                  stroke="#ef4444" 
                  name="获得奖励"
                  yAxisId={1}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">结果分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {outcomeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">选择表现分析</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={choicePerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="choice" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="averageReward" 
                    fill="#2563eb" 
                    name="平均奖励"
                  />
                  <Bar 
                    dataKey="frequency" 
                    fill="#10b981" 
                    name="选择次数"
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
              <p className="text-sm font-medium text-gray-600">合作率</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((history.filter(h => h.choice === 'cooperate').length / history.length) * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">选择合作的比例</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">双方合作次数</p>
              <p className="text-xl font-bold text-gray-900">
                {history.filter(h => h.choice === 'cooperate' && h.aiChoice === 'cooperate').length}次
              </p>
              <p className="text-xs text-gray-500 mt-1">双方都选择合作</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均收益</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(totalPoints / TOTAL_ROUNDS)}
              </p>
              <p className="text-xs text-gray-500 mt-1">每轮平均获得的积分</p>
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
                <h1 className="text-2xl font-bold text-gray-900">囚徒困境</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加囚徒困境实验。这个经典的博弈论实验用于研究人们在冲突情境下的合作与背叛行为。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>每轮你需要在合作和背叛之间做出选择：
                    <ul>
                      <li>如果双方都合作：各得{REWARDS.bothCooperate}分</li>
                      <li>如果一方背叛一方合作：背叛方得{REWARDS.defectWin}分，合作方得{REWARDS.defectLose}分</li>
                      <li>如果双方都背叛：各得{REWARDS.bothDefect}分</li>
                    </ul>
                  </li>
                  <li>实验共有{TOTAL_ROUNDS}轮</li>
                  <li>每轮的选择都会影响最终得分</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>仔细权衡个人利益和集体利益</li>
                  <li>观察对方的选择模式</li>
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
                  <p className="text-sm font-medium text-gray-500">总积分</p>
                  <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">合作率</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {history.length > 0 ? 
                      Math.round((history.filter(h => h.choice === 'cooperate').length / history.length) * 100) : 0}%
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
                    {aiThinkingTime ? '对方正在思考...' : '请做出你的选择'}
                  </h2>
                  
                  {!aiThinkingTime && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={() => makeChoice('cooperate')}
                          className="w-full p-6 bg-blue-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-colors"
                        >
                          <div className="flex justify-center mb-4">
                            <HandshakeIcon className="w-12 h-12 text-blue-600" />
                          </div>
                          <h3 className="text-xl font-bold text-blue-900 mb-2">选择合作</h3>
                          <p className="text-sm text-blue-600">
                            双方合作各得{REWARDS.bothCooperate}分<br />
                            被背叛得{REWARDS.defectLose}分
                          </p>
                        </button>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={() => makeChoice('defect')}
                          className="w-full p-6 bg-red-50 rounded-xl border-2 border-red-200 hover:border-red-400 transition-colors"
                        >
                          <div className="flex justify-center mb-4">
                            <AlertTriangle className="w-12 h-12 text-red-600" />
                          </div>
                          <h3 className="text-xl font-bold text-red-900 mb-2">选择背叛</h3>
                          <p className="text-sm text-red-600">
                            成功背叛得{REWARDS.defectWin}分<br />
                            双方背叛得{REWARDS.bothDefect}分
                          </p>
                        </button>
                      </motion.div>
                    </div>
                  )}

                  <AnimatePresence>
                    {lastResult && (
                      <motion.div
                        className="mt-8 p-4 rounded-lg bg-gray-50"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <h3 className="text-lg font-medium text-gray-900 mb-2">本轮结果</h3>
                        <p className="text-gray-600">
                          你选择了{lastResult.choice === 'cooperate' ? '合作' : '背叛'}，
                          对方选择了{lastResult.aiChoice === 'cooperate' ? '合作' : '背叛'}
                        </p>
                        <p className={`text-xl font-bold mt-2 ${
                          lastResult.reward > 0 ? 'text-green-600' : 
                          lastResult.reward < 0 ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {lastResult.reward > 0 ? '获得 ' : '损失 '}
                          {Math.abs(lastResult.reward)} 分
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                      <p className="text-lg font-medium text-gray-900">总积分</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {totalPoints}分
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      平均每轮 {Math.round(totalPoints / TOTAL_ROUNDS)}分
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
                  <li>每轮在合作和背叛之间做出选择：
                    <ul>
                      <li>合作：
                        <ul>
                          <li>如果对方也合作：双方各得{REWARDS.bothCooperate}分</li>
                          <li>如果对方背叛：你得{REWARDS.defectLose}分</li>
                        </ul>
                      </li>
                      <li>背叛：
                        <ul>
                          <li>如果对方合作：你得{REWARDS.defectWin}分</li>
                          <li>如果对方也背叛：双方各得{REWARDS.bothDefect}分</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ul>
                <p>提示：需要权衡个人利益和集体利益，同时考虑对方的可能选择。</p>
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

export default PrisonersDilemma;