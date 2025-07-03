import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, Train, Users } from 'lucide-react';
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

interface Scenario {
  id: number;
  type: 'personal' | 'impersonal';
  description: string;
  options: {
    action: string;
    consequence: string;
    utilitarian: boolean;
  }[];
}

interface Decision {
  scenarioId: number;
  type: 'personal' | 'impersonal';
  choice: boolean; // true for utilitarian choice
  reactionTime: number;
  timestamp: number;
}

const scenarios: Scenario[] = [
  {
    id: 1,
    type: 'impersonal',
    description: '一辆失控的电车正朝着五个工人驶去。你可以通过拉动操纵杆改变电车方向，使其转向另一条轨道。但那条轨道上有一个工人。你会拉动操纵杆吗？',
    options: [
      {
        action: '拉动操纵杆',
        consequence: '一人死亡，救下五人',
        utilitarian: true
      },
      {
        action: '不采取行动',
        consequence: '五人死亡',
        utilitarian: false
      }
    ]
  },
  {
    id: 2,
    type: 'personal',
    description: '你站在一座人行天桥上，下方是电车轨道。一辆失控的电车正朝着五个工人驶去。你旁边站着一个体型较大的陌生人，将他推下去可以阻止电车，但会导致他死亡。你会推他吗？',
    options: [
      {
        action: '推下陌生人',
        consequence: '一人死亡，救下五人',
        utilitarian: true
      },
      {
        action: '不采取行动',
        consequence: '五人死亡',
        utilitarian: false
      }
    ]
  },
  {
    id: 3,
    type: 'impersonal',
    description: '一辆失控的电车正朝着五个儿童驶去。你可以按下一个按钮，使一个重物落下阻挡电车，但这会导致一个工人死亡。你会按下按钮吗？',
    options: [
      {
        action: '按下按钮',
        consequence: '一个工人死亡，救下五个儿童',
        utilitarian: true
      },
      {
        action: '不采取行动',
        consequence: '五个儿童死亡',
        utilitarian: false
      }
    ]
  },
  {
    id: 4,
    type: 'personal',
    description: '你是一名医生，有五个病人需要不同的器官移植才能存活。一个健康的病人来做常规检查，他的器官可以救活这五个人。你会进行器官移植手术吗？',
    options: [
      {
        action: '进行手术',
        consequence: '一人死亡，救下五人',
        utilitarian: true
      },
      {
        action: '不进行手术',
        consequence: '五人死亡',
        utilitarian: false
      }
    ]
  },
  {
    id: 5,
    type: 'impersonal',
    description: '一辆失控的电车正朝着五个工人驶去。你可以启动一个紧急装置，将一个维修工人传送到轨道上阻挡电车。你会启动装置吗？',
    options: [
      {
        action: '启动装置',
        consequence: '一人死亡，救下五人',
        utilitarian: true
      },
      {
        action: '不采取行动',
        consequence: '五人死亡',
        utilitarian: false
      }
    ]
  }
];

const TOTAL_SCENARIOS = scenarios.length;

const TrolleyProblem = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [currentScenario, setCurrentScenario] = useState(0);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [scenarioStartTime, setScenarioStartTime] = useState<number | null>(null);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
    setScenarioStartTime(Date.now());
  };

  const makeDecision = (utilitarian: boolean) => {
    const scenario = scenarios[currentScenario];
    const decision: Decision = {
      scenarioId: scenario.id,
      type: scenario.type,
      choice: utilitarian,
      reactionTime: Date.now() - (scenarioStartTime || 0),
      timestamp: Date.now()
    };
    
    setDecisions(prev => [...prev, decision]);

    if (currentScenario + 1 >= TOTAL_SCENARIOS) {
      setGameState('finished');
      setTotalTime(Date.now() - (startTime || 0));
    } else {
      setCurrentScenario(prev => prev + 1);
      setScenarioStartTime(Date.now());
    }
  };

  const resetGame = () => {
    setGameState('instruction');
    setCurrentScenario(0);
    setDecisions([]);
    setStartTime(null);
    setTotalTime(null);
    setScenarioStartTime(null);
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Trolley Problem",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        totalScenarios: TOTAL_SCENARIOS,
        utilitarianChoiceRate: decisions.filter(d => d.choice).length / decisions.length,
        personalDilemmaRate: decisions.filter(d => d.type === 'personal' && d.choice).length /
          decisions.filter(d => d.type === 'personal').length
      },
      decisions: decisions.map((d, index) => ({
        scenarioId: d.scenarioId,
        type: d.type,
        choice: d.choice,
        reactionTime: d.reactionTime,
        timestamp: new Date(d.timestamp).toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trolley-problem-results-${Date.now()}.json`;
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
    const decisionsByType = [
      {
        type: '个人困境',
        utilitarian: decisions.filter(d => d.type === 'personal' && d.choice).length,
        nonUtilitarian: decisions.filter(d => d.type === 'personal' && !d.choice).length
      },
      {
        type: '非个人困境',
        utilitarian: decisions.filter(d => d.type === 'impersonal' && d.choice).length,
        nonUtilitarian: decisions.filter(d => d.type === 'impersonal' && !d.choice).length
      }
    ];

    const reactionTimes = [
      {
        type: '个人困境',
        avgTime: decisions.filter(d => d.type === 'personal')
          .reduce((sum, d) => sum + d.reactionTime, 0) /
          decisions.filter(d => d.type === 'personal').length / 1000
      },
      {
        type: '非个人困境',
        avgTime: decisions.filter(d => d.type === 'impersonal')
          .reduce((sum, d) => sum + d.reactionTime, 0) /
          decisions.filter(d => d.type === 'impersonal').length / 1000
      }
    ];

    const decisionDistribution = [
      {
        name: '功利主义选择',
        value: decisions.filter(d => d.choice).length
      },
      {
        name: '非功利主义选择',
        value: decisions.filter(d => !d.choice).length
      }
    ];

    const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b'];

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">困境类型与决策分析</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={decisionsByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="utilitarian" 
                  fill="#2563eb" 
                  name="功利主义选择"
                />
                <Bar 
                  dataKey="nonUtilitarian" 
                  fill="#ef4444" 
                  name="非功利主义选择"
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">反应时间分析</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={reactionTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar 
                    dataKey="avgTime" 
                    fill="#2563eb" 
                    name="平均反应时间(秒)"
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">决策分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={decisionDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {decisionDistribution.map((entry, index) => (
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
              <p className="text-sm font-medium text-gray-600">功利主义倾向</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((decisions.filter(d => d.choice).length / decisions.length) * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">选择功利主义方案的比例</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">个人困境功利主义率</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round((decisions.filter(d => d.type === 'personal' && d.choice).length /
                  decisions.filter(d => d.type === 'personal').length) * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">个人困境中选择功利主义的比例</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均决策时间</p>
              <p className="text-xl font-bold text-gray-900">
                {(decisions.reduce((sum, d) => sum + d.reactionTime, 0) / 
                  (decisions.length * 1000)).toFixed(1)} 秒
              </p>
              <p className="text-xs text-gray-500 mt-1">每个决策的平均用时</p>
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
                <Train className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">电车难题</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加电车难题实验。这个经典的伦理学实验旨在研究人们在道德困境中的决策过程。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>你将面对{TOTAL_SCENARIOS}个道德困境场景</li>
                  <li>每个场景中你需要在两个选项之间做出选择</li>
                  <li>没有对错之分，请根据你的道德判断做出选择</li>
                  <li>场景分为两类：
                    <ul>
                      <li>个人困境：需要直接采取行动</li>
                      <li>非个人困境：通过间接方式采取行动</li>
                    </ul>
                  </li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>仔细阅读每个场景的描述</li>
                  <li>认真思考后再做选择</li>
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
                  <p className="text-sm font-medium text-gray-500">当前场景</p>
                  <p className="text-2xl font-bold text-primary-600">{currentScenario + 1} / {TOTAL_SCENARIOS}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">场景类型</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {scenarios[currentScenario].type === 'personal' ? '个人困境' : '非个人困境'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">功利主义选择</p>
                  <p className="text-2xl font-bold text-green-600">
                    {decisions.filter(d => d.choice).length}次
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">平均决策时间</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {decisions.length > 0 ? 
                      (decisions.reduce((sum, d) => sum + d.reactionTime, 0) / 
                        (decisions.length * 1000)).toFixed(1) : 0} 秒
                  </p>
                </div>
              </div>

              <motion.div
                className="bg-white rounded-xl shadow-sm p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={currentScenario}
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    道德困境 #{currentScenario + 1}
                  </h2>
                  
                  <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
                    {scenarios[currentScenario].description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    {scenarios[currentScenario].options.map((option, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={() => makeDecision(option.utilitarian)}
                          className="w-full p-6 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-colors"
                        >
                          <h3 className="text-xl font-bold text-gray-900 mb-3">
                            {option.action}
                          </h3>
                          <p className="text-gray-600">
                            {option.consequence}
                          </p>
                        </button>
                      </motion.div>
                    ))}
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
                      平均每个场景 {totalTime ? Math.round(totalTime / TOTAL_SCENARIOS / 1000) : '--'} 秒
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart className="w-5 h-5 text-primary-600" />
                      <p className="text-lg font-medium text-gray-900">功利主义倾向</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {Math.round((decisions.filter(d => d.choice).length / decisions.length) * 100)}%
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      选择功利主义方案的比例
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
                  <li>面对一系列道德困境场景</li>
                  <li>每个场景提供两个选择：
                    <ul>
                      <li>功利主义选择：最大化拯救人数</li>
                      <li>非功利主义选择：遵循传统道德准则</li>
                    </ul>
                  </li>
                  <li>场景分为两类：
                    <ul>
                      <li>个人困境：需要直接采取行动（如推人）</li>
                      <li>非个人困境：通过间接方式采取行动（如拉动开关）</li>
                    </ul>
                  </li>
                </ul>
                <p>提示：根据你的道德判断做出选择，没有对错之分。</p>
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

export default TrolleyProblem;