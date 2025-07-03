import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, BarChart, Clock, Brain, Download, Scale } from 'lucide-react';
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
  title: string;
  gainFrame: {
    description: string;
    options: {
      text: string;
      value: number;
      probability?: number;
    }[];
  };
  lossFrame: {
    description: string;
    options: {
      text: string;
      value: number;
      probability?: number;
    }[];
  };
}

const scenarios: Scenario[] = [
  {
    id: 1,
    title: "医疗决策场景",
    gainFrame: {
      description: "有一种新的治疗方案可以挽救600名患者的生命。你有两个选择：",
      options: [
        { text: "方案A：确保可以挽救200人", value: 1, probability: 1 },
        { text: "方案B：有1/3的概率挽救所有600人，但有2/3的概率无人生还", value: 2, probability: 0.33 }
      ]
    },
    lossFrame: {
      description: "有一种新的治疗方案涉及600名患者。你有两个选择：",
      options: [
        { text: "方案A：确定会有400人死亡", value: 1, probability: 1 },
        { text: "方案B：有1/3的概率没有人死亡，但有2/3的概率600人都会死亡", value: 2, probability: 0.33 }
      ]
    }
  },
  {
    id: 2,
    title: "金融投资场景",
    gainFrame: {
      description: "你有机会投资一个项目，初始投资10000元。你有两个选择：",
      options: [
        { text: "方案A：确保获得3000元收益", value: 1, probability: 1 },
        { text: "方案B：有30%的概率获得10000元收益，但有70%的概率没有收益", value: 2, probability: 0.3 }
      ]
    },
    lossFrame: {
      description: "你有机会投资一个项目，初始投资10000元。你有两个选择：",
      options: [
        { text: "方案A：确定损失7000元", value: 1, probability: 1 },
        { text: "方案B：有70%的概率损失10000元，但有30%的概率不会损失", value: 2, probability: 0.7 }
      ]
    }
  },
  {
    id: 3,
    title: "环境保护场景",
    gainFrame: {
      description: "一片森林面临砍伐威胁，可能影响1000种物种。你有两个保护方案：",
      options: [
        { text: "方案A：确保保护400种物种", value: 1, probability: 1 },
        { text: "方案B：有40%的概率保护所有物种，但有60%的概率无法保护任何物种", value: 2, probability: 0.4 }
      ]
    },
    lossFrame: {
      description: "一片森林面临砍伐威胁，可能影响1000种物种。你有两个保护方案：",
      options: [
        { text: "方案A：确定会有600种物种消失", value: 1, probability: 1 },
        { text: "方案B：有60%的概率所有物种都会消失，但有40%的概率没有物种消失", value: 2, probability: 0.6 }
      ]
    }
  },
  {
    id: 4,
    title: "教育政策场景",
    gainFrame: {
      description: "一项教育改革可能影响1000名学生的学习成果。你有两个方案：",
      options: [
        { text: "方案A：确保提升300名学生的成绩", value: 1, probability: 1 },
        { text: "方案B：有25%的概率提升所有学生的成绩，但有75%的概率没有提升", value: 2, probability: 0.25 }
      ]
    },
    lossFrame: {
      description: "一项教育改革可能影响1000名学生的学习成果。你有两个方案：",
      options: [
        { text: "方案A：确定会有700名学生的成绩下降", value: 1, probability: 1 },
        { text: "方案B：有75%的概率所有学生成绩下降，但有25%的概率没有下降", value: 2, probability: 0.75 }
      ]
    }
  },
  {
    id: 5,
    title: "就业政策场景",
    gainFrame: {
      description: "一项就业政策可能影响800名失业者。你有两个方案：",
      options: [
        { text: "方案A：确保帮助240名失业者找到工作", value: 1, probability: 1 },
        { text: "方案B：有30%的概率帮助所有人找到工作，但有70%的概率没人找到工作", value: 2, probability: 0.3 }
      ]
    },
    lossFrame: {
      description: "一项就业政策可能影响800名失业者。你有两个方案：",
      options: [
        { text: "方案A：确定会有560名失业者继续失业", value: 1, probability: 1 },
        { text: "方案B：有70%的概率所有人继续失业，但有30%的概率没人失业", value: 2, probability: 0.7 }
      ]
    }
  }
];

const TOTAL_SCENARIOS = scenarios.length * 2; // Each scenario has both frames

const FramingEffectTasks = () => {
  const [gameState, setGameState] = useState<'instruction' | 'playing' | 'finished'>('instruction');
  const [currentScenario, setCurrentScenario] = useState(0);
  const [currentFrame, setCurrentFrame] = useState<'gain' | 'loss'>('gain');
  const [choices, setChoices] = useState<{
    scenarioId: number;
    frame: 'gain' | 'loss';
    choice: number;
    timestamp: number;
  }[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [totalTime, setTotalTime] = useState<number | null>(null);
  const [randomizedScenarios, setRandomizedScenarios] = useState<{
    scenarioIndex: number;
    frame: 'gain' | 'loss';
  }[]>([]);

  useEffect(() => {
    // Generate randomized scenario order with frames
    const allScenarios = scenarios.flatMap((_s, index) => [
      { scenarioIndex: index, frame: 'gain' as const },
      { scenarioIndex: index, frame: 'loss' as const }
    ]);
    setRandomizedScenarios(allScenarios.sort(() => Math.random() - 0.5));
  }, []);

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
  };

  const makeChoice = (choice: number) => {
    const currentScenarioData = randomizedScenarios[currentScenario];
    setChoices(prev => [...prev, {
      scenarioId: scenarios[currentScenarioData.scenarioIndex].id,
      frame: currentScenarioData.frame,
      choice,
      timestamp: Date.now()
    }]);

    if (currentScenario + 1 >= TOTAL_SCENARIOS) {
      setGameState('finished');
      setTotalTime(Date.now() - (startTime || 0));
    } else {
      setCurrentScenario(prev => prev + 1);
    }
  };

  const resetGame = () => {
    const allScenarios = scenarios.flatMap((_s, index) => [
      { scenarioIndex: index, frame: 'gain' as const },
      { scenarioIndex: index, frame: 'loss' as const }
    ]);
    setRandomizedScenarios(allScenarios.sort(() => Math.random() - 0.5));
    setCurrentScenario(0);
    setChoices([]);
    setGameState('instruction');
    setStartTime(null);
    setTotalTime(null);
  };

  const exportData = () => {
    const data = {
      experimentInfo: {
        name: "Framing Effect Tasks",
        startTime: new Date(startTime || 0).toISOString(),
        endTime: new Date().toISOString(),
        totalTime: totalTime,
        totalScenarios: TOTAL_SCENARIOS,
        framingEffect: calculateFramingEffect()
      },
      choices: choices.map((choice, index) => ({
        scenarioId: choice.scenarioId,
        frame: choice.frame,
        choice: choice.choice,
        timestamp: new Date(choice.timestamp).toISOString(),
        reactionTime: index > 0 ? choice.timestamp - choices[index - 1].timestamp : 0
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `framing-effect-tasks-results-${Date.now()}.json`;
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

  const calculateFramingEffect = () => {
    const gainFrameRiskyChoices = choices.filter(
      c => c.frame === 'gain' && c.choice === 2
    ).length;
    const lossFrameRiskyChoices = choices.filter(
      c => c.frame === 'loss' && c.choice === 2
    ).length;
    
    const gainFrameTotal = choices.filter(c => c.frame === 'gain').length;
    const lossFrameTotal = choices.filter(c => c.frame === 'loss').length;
    
    const gainFrameRiskyRate = gainFrameRiskyChoices / gainFrameTotal;
    const lossFrameRiskyRate = lossFrameRiskyChoices / lossFrameTotal;
    
    return lossFrameRiskyRate - gainFrameRiskyRate;
  };

  const renderResultsAnalysis = () => {
    const framingEffect = calculateFramingEffect();
    
    const choicesByFrame = [
      {
        frame: '获得框架',
        safe: choices.filter(c => c.frame === 'gain' && c.choice === 1).length,
        risky: choices.filter(c => c.frame === 'gain' && c.choice === 2).length
      },
      {
        frame: '损失框架',
        safe: choices.filter(c => c.frame === 'loss' && c.choice === 1).length,
        risky: choices.filter(c => c.frame === 'loss' && c.choice === 2).length
      }
    ];

    const scenarioAnalysis = scenarios.map(scenario => {
      const scenarioChoices = choices.filter(c => c.scenarioId === scenario.id);
      return {
        scenario: scenario.title,
        gainFrameSafe: scenarioChoices.filter(c => c.frame === 'gain' && c.choice === 1).length,
        gainFrameRisky: scenarioChoices.filter(c => c.frame === 'gain' && c.choice === 2).length,
        lossFrameSafe: scenarioChoices.filter(c => c.frame === 'loss' && c.choice === 1).length,
        lossFrameRisky: scenarioChoices.filter(c => c.frame === 'loss' && c.choice === 2).length
      };
    });

    const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b'];

    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">框架效应分析</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={choicesByFrame}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="frame" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="safe" name="保守选择" fill="#2563eb" />
                <Bar dataKey="risky" name="冒险选择" fill="#ef4444" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">场景分析</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={scenarioAnalysis} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="scenario" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="gainFrameSafe" name="获得框架-保守" stackId="a" fill={COLORS[0]} />
                  <Bar dataKey="gainFrameRisky" name="获得框架-冒险" stackId="a" fill={COLORS[1]} />
                  <Bar dataKey="lossFrameSafe" name="损失框架-保守" stackId="b" fill={COLORS[2]} />
                  <Bar dataKey="lossFrameRisky" name="损失框架-冒险" stackId="b" fill={COLORS[3]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">选择分布</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: '获得框架-保守', value: choicesByFrame[0].safe },
                      { name: '获得框架-冒险', value: choicesByFrame[0].risky },
                      { name: '损失框架-保守', value: choicesByFrame[1].safe },
                      { name: '损失框架-冒险', value: choicesByFrame[1].risky }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {[0, 1, 2, 3].map((entry, index) => (
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
              <p className="text-sm font-medium text-gray-600">框架效应强度</p>
              <p className="text-xl font-bold text-gray-900">{framingEffect.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">正值表示在损失框架下更倾向冒险</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">平均反应时间</p>
              <p className="text-xl font-bold text-gray-900">
                {(choices.reduce((sum, c, i) => sum + (i > 0 ? c.timestamp - choices[i - 1].timestamp : 0), 0) / (choices.length - 1) / 1000).toFixed(2)} 秒
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">一致性选择比例</p>
              <p className="text-xl font-bold text-gray-900">
                {(scenarios.reduce((sum, scenario) => {
                  const scenarioChoices = choices.filter(c => c.scenarioId === scenario.id);
                  return scenarioChoices.length === 2 && 
                    scenarioChoices[0].choice === scenarioChoices[1].choice ? sum + 1 : sum;
                }, 0) / scenarios.length * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 mt-1">在不同框架下做出相同选择的比例</p>
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
                <Scale className="w-8 h-8 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">框架效应任务</h1>
              </div>
              
              <div className="prose prose-gray">
                <p>欢迎参加框架效应任务。这个实验旨在研究信息呈现方式如何影响人们的决策。</p>
                
                <h3>实验说明：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>你将看到一系列决策场景</li>
                  <li>每个场景有两个选项供选择</li>
                  <li>场景会以不同的方式描述（获得或损失）</li>
                  <li>没有对错之分，请根据你的判断做出选择</li>
                  <li>实验共有{TOTAL_SCENARIOS}个决策</li>
                </ul>

                <h3>注意事项：</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>仔细阅读每个场景的描述</li>
                  <li>认真思考后再做选择</li>
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

          {gameState === 'playing' && randomizedScenarios.length > 0 && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">当前进度</p>
                  <p className="text-2xl font-bold text-primary-600">{currentScenario + 1} / {TOTAL_SCENARIOS}</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">完成百分比</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((currentScenario / TOTAL_SCENARIOS) * 100)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">保守选择</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {choices.filter(c => c.choice === 1).length}次
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-500">冒险选择</p>
                  <p className="text-2xl font-bold text-red-600">
                    {choices.filter(c => c.choice === 2).length}次
                  </p>
                </div>
              </div>

              <motion.div
                className="bg-white rounded-xl shadow-sm p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={currentScenario}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {scenarios[randomizedScenarios[currentScenario].scenarioIndex].title}
                </h2>
                
                <p className="text-lg text-gray-600 mb-8">
                  {randomizedScenarios[currentScenario].frame === 'gain' 
                    ? scenarios[randomizedScenarios[currentScenario].scenarioIndex].gainFrame.description
                    : scenarios[randomizedScenarios[currentScenario].scenarioIndex].lossFrame.description
                  }
                </p>

                <div className="space-y-4">
                  {(randomizedScenarios[currentScenario].frame === 'gain' 
                    ? scenarios[randomizedScenarios[currentScenario].scenarioIndex].gainFrame.options
                    : scenarios[randomizedScenarios[currentScenario].scenarioIndex].lossFrame.options
                  ).map((option, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        onClick={() => makeChoice(option.value)}
                        className="w-full p-6 text-left bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-colors"
                      >
                        <p className="text-lg font-medium text-gray-900">{option.text}</p>
                        {option.probability && (
                          <p className="text-sm text-gray-500 mt-2">
                            概率：{(option.probability * 100).toFixed(0)}%
                          </p>
                        )}
                      </button>
                    </motion.div>
                  ))}
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
                      平均每个决策 {totalTime ? Math.round(totalTime / TOTAL_SCENARIOS / 1000) : '--'} 秒
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart className="w-5 h-5 text-primary-600" />
                      <p className="text-lg font-medium text-gray-900">框架效应强度</p>
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                      {calculateFramingEffect().toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      正值表示在损失框架下更倾向冒险
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
                  <li>仔细阅读每个决策场景的描述</li>
                  <li>在两个选项中做出选择</li>
                  <li>注意场景可能以不同方式描述相同的情况</li>
                  <li>根据你的判断做出选择，没有对错之分</li>
                </ul>
                <p>提示：关注每个选项的具体内容和概率信息，做出你认为最合适的选择。</p>
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

export default FramingEffectTasks;