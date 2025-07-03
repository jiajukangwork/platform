import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, Wind } from 'lucide-react';
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
  Bar
} from 'recharts';

interface BalloonTrial {
  id: number;
  maxPumps: number;
  pointsPerPump: number;
}

const TOTAL_TRIALS = 30;
const POINTS_PER_PUMP = 10;
const BALLOON_TYPES = [
  { maxPumps: 8, probability: 0.125 },   // 高风险气球
  { maxPumps: 16, probability: 0.0625 }, // 中风险气球
  { maxPumps: 32, probability: 0.03125 } // 低风险气球
];

const generateTrials = (): BalloonTrial[] => {
  const trials: BalloonTrial[] = [];
  for (let i = 0; i < TOTAL_TRIALS; i++) {
    const balloonType = BALLOON_TYPES[Math.floor(Math.random() * BALLOON_TYPES.length)];
    trials.push({
      id: i + 1,
      maxPumps: balloonType.maxPumps,
      pointsPerPump: POINTS_PER_PUMP
    });
  }
  return trials;
};

const BalloonRiskTask = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [trials, setTrials] = useState<BalloonTrial[]>([]);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentPumps, setCurrentPumps] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [bankPoints, setBankPoints] = useState(0);
  const [history, setHistory] = useState<{
    trial: number;
    pumps: number;
    maxPumps: number;
    popped: boolean;
    points: number;
    timestamp: number;
  }[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [isPopped, setIsPopped] = useState(false);
  const [balloonSize, setBalloonSize] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setTrials(generateTrials());
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      drawBalloon();
    }
  }, [currentPumps, isPopped]);

  const drawBalloon = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isPopped) {
      // Calculate balloon size based on pumps
      const size = 50 + currentPumps * 10;
      setBalloonSize(size);

      // Draw balloon
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 130, 246, ${0.8 - currentPumps * 0.02})`;
      ctx.fill();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw string
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height / 2 + size / 2);
      ctx.lineTo(canvas.width / 2, canvas.height / 2 + size / 2 + 50);
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
  };

  const pumpBalloon = () => {
    const trial = trials[currentTrial];
    const probability = 1 / (trial.maxPumps - currentPumps);
    
    if (Math.random() < probability) {
      // Balloon popped
      setIsPopped(true);
      endTrial(true);
    } else {
      setCurrentPumps(prev => prev + 1);
      setTotalPoints(prev => prev + trial.pointsPerPump);
    }
  };

  const collectPoints = () => {
    setBankPoints(prev => prev + totalPoints);
    endTrial(false);
  };

  const endTrial = (popped: boolean) => {
    const trial = trials[currentTrial];
    
    setHistory(prev => [...prev, {
      trial: currentTrial + 1,
      pumps: currentPumps,
      maxPumps: trial.maxPumps,
      popped,
      points: popped ? 0 : totalPoints,
      timestamp: Date.now()
    }]);

    if (currentTrial + 1 >= TOTAL_TRIALS) {
      setGameState('finished');
      setTotalTime(Date.now() - (startTime || 0));
    } else {
      setTimeout(() => {
        setCurrentTrial(prev => prev + 1);
        setCurrentPumps(0);
        setTotalPoints(0);
        setIsPopped(false);
      }, 1500);
    }
  };

  const resetGame = () => {
    setTrials(generateTrials());
    setCurrentTrial(0);
    setCurrentPumps(0);
    setTotalPoints(0);
    setBankPoints(0);
    setHistory([]);
    setGameState('instruction');
    setStartTime(null);
    setTotalTime(null);
    setIsPopped(false);
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Balloon Analog Risk Task",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        totalTrials: TOTAL_TRIALS,
        totalPoints: bankPoints,
        averagePumps: history.reduce((sum, h) => sum + h.pumps, 0) / history.length,
        popRate: history.filter(h => h.popped).length / history.length
      },
      trials: history.map((h, index) => ({
        trial: h.trial,
        pumps: h.pumps,
        maxPumps: h.maxPumps,
        popped: h.popped,
        points: h.points,
        timestamp: new Date(h.timestamp).toISOString(),
        reactionTime: index > 0 ? h.timestamp - history[index - 1].timestamp : 0
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balloon-risk-task-results-${Date.now()}.json`;
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
    const averagePumps = history.reduce((sum, h) => sum + h.pumps, 0) / history.length;
    const popRate = history.filter(h => h.popped).length / history.length;
    
    const pumpsByTrial = history.map(h => ({
      trial: h.trial,
      pumps: h.pumps,
      popped: h.popped ? '是' : '否'
    }));

    const riskCategories = BALLOON_TYPES.map(type => ({
      category: `${type.maxPumps}次爆炸`,
      averagePumps: history
        .filter(h => h.maxPumps === type.maxPumps)
        .reduce((sum, h) => sum + h.pumps, 0) / 
        history.filter(h => h.maxPumps === type.maxPumps).length || 0,
      popRate: history
        .filter(h => h.maxPumps === type.maxPumps && h.popped).length /
        history.filter(h => h.maxPumps === type.maxPumps).length || 0
    }));

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">充气次数趋势</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pumpsByTrial}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trial" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pumps" 
                  stroke="#2563eb" 
                  name="充气次数"
                  dot={{ fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">不同风险水平的表现</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={riskCategories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="averagePumps" 
                    fill="#2563eb" 
                    name="平均充气次数"
                  />
                  <Bar 
                    dataKey="popRate" 
                    fill="#dc2626" 
                    name="爆炸率"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">获得积分分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={history.map(h => ({ points: h.points }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="points" 
                    fill="#10b981" 
                    name="获得积分"
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
              <p className="text-sm font-medium text-gray-600">平均充气次数</p>
              <p className="text-xl font-bold text-gray-900">{averagePumps.toFixed(2)}次</p>
              <p className="text-xs text-gray-500 mt-1">反映风险承受水平</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">爆炸率</p>
              <p className="text-xl font-bold text-gray-900">
                {(popRate * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">反映风险控制能力</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均每次获得积分</p>
              <p className="text-xl font-bold text-gray-900">
                {(bankPoints / TOTAL_TRIALS).toFixed(0)}分
              </p>
              <p className="text-xs text-gray-500 mt-1">反映整体表现</p>
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
                <Wind className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">气球模拟风险任务</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加气球模拟风险任务。这个实验旨在研究人们如何在风险与收益之间做出权衡。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>你将看到一个可以充气的气球</li>
                  <li>每次充气可以获得{POINTS_PER_PUMP}积分</li>
                  <li>你可以随时选择收集当前积分</li>
                  <li>但如果气球爆炸，本轮积分将全部损失</li>
                  <li>实验共有{TOTAL_TRIALS}轮</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>每个气球的耐受程度不同</li>
                  <li>充气次数越多，爆炸概率越大</li>
                  <li>需要权衡风险和收益</li>
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
                  <p className="text-2xl font-bold text-primary-600">{currentTrial + 1} / {TOTAL_TRIALS}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">当前积分</p>
                  <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">已存积分</p>
                  <p className="text-2xl font-bold text-blue-600">{bankPoints}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">充气次数</p>
                  <p className="text-2xl font-bold text-gray-900">{currentPumps}次</p>
                </div>
              </div>

              <motion.div
                className="bg-white rounded-xl shadow-sm p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    className="w-full max-w-md mx-auto"
                  />
                  
                  <AnimatePresence>
                    {isPopped && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                      >
                        <div className="bg-red-100 text-red-800 px-6 py-3 rounded-lg text-lg font-bold">
                          气球爆炸了！
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-8 flex justify-center space-x-4">
                  <Button
                    variant="primary"
                    onClick={pumpBalloon}
                    disabled={isPopped}
                  >
                    充气 (+{POINTS_PER_PUMP}分)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={collectPoints}
                    disabled={isPopped || totalPoints === 0}
                  >
                    收集积分
                  </Button>
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
                      平均每轮 {totalTime ? Math.round(totalTime / TOTAL_TRIALS / 1000) : '--'} 秒
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart className="w-5 h-5 text-primary-600" />
                      <p className="text-lg font-medium text-gray-900">总积分</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {bankPoints}分
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      平均每轮 {Math.round(bankPoints / TOTAL_TRIALS)} 分
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
                  <li>通过点击"充气"按钮给气球充气</li>
                  <li>每次充气可以获得{POINTS_PER_PUMP}积分</li>
                  <li>你可以随时点击"收集积分"保存当前积分</li>
                  <li>但要注意，气球可能在任何时候爆炸</li>
                  <li>如果气球爆炸，本轮积分将全部损失</li>
                </ul>
                <p>提示：需要权衡风险和收益，找到最佳的充气策略。</p>
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

export default BalloonRiskTask;