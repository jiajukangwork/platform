import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Brain, ArrowLeft, BarChart3, Clock, Zap, MessageSquare, RefreshCw, PauseCircle, PlayCircle, Download } from 'lucide-react';
import Button from '../../components/Button';
import { ExperimentConfig, TrialData } from './index';
import LLMService from './LLMService';
import { usePhysiologicalSync } from '../../components/PhysiologicalSyncContext';

interface AIObservationModeProps {
  config: ExperimentConfig;
  onComplete: (data: TrialData[]) => void;
  onBack: () => void;
}

interface BanditArm {
  id: number;
  meanReward: number;
  currentReward: number;
  timesChosen: number;
  totalReward: number;
  color: string;
}

const AIObservationMode = ({ config, onComplete, onBack }: AIObservationModeProps) => {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [bandits, setBandits] = useState<BanditArm[]>([]);
  const [trialData, setTrialData] = useState<TrialData[]>([]);
  const [llmScore, setLlmScore] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 5x
  const [llmThinking, setLlmThinking] = useState<string>('');
  const [lastLLMChoice, setLastLLMChoice] = useState<number | null>(null);
  const [autoRunEnabled, setAutoRunEnabled] = useState(false);
  const [showThinking, setShowThinking] = useState(true);
  const [runningInterval, setRunningInterval] = useState<NodeJS.Timeout | null>(null);
  
  const llmService = useRef(LLMService.getInstance());
  const { sendSyncMarker } = usePhysiologicalSync();

  useEffect(() => {
    initializeBandits();
    // 发送AI观察模式开始标记
    sendSyncMarker('ai_observation_start', {
      config: {
        totalTrials: config.totalTrials,
        numBandits: config.numBandits,
        model: config.apiConfig.model
      }
    });
  }, []);

  useEffect(() => {
    if (autoRunEnabled && !isPaused) {
      const interval = setInterval(() => {
        if (currentTrial < config.totalTrials) {
          makeAIDecision();
        } else {
          setAutoRunEnabled(false);
          clearInterval(interval);
        }
      }, 3000 / speed);
      
      setRunningInterval(interval);
      return () => clearInterval(interval);
    } else if (runningInterval) {
      clearInterval(runningInterval);
      setRunningInterval(null);
    }
  }, [autoRunEnabled, isPaused, currentTrial, speed]);

  const initializeBandits = () => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'];
    
    const newBandits = Array.from({ length: config.numBandits }, (_, i) => ({
      id: i,
      meanReward: 30 + Math.random() * 40, // 30-70 range
      currentReward: 0,
      timesChosen: 0,
      totalReward: 0,
      color: colors[i % colors.length]
    }));
    
    setBandits(newBandits);
    
    // 发送初始化标记
    sendSyncMarker('bandits_initialized', { 
      numBandits: config.numBandits,
      initialMeans: newBandits.map(b => b.meanReward)
    });
  };

  const generateReward = (bandit: BanditArm): number => {
    // Add some noise to the reward
    const noise = (Math.random() - 0.5) * 20;
    const reward = Math.max(0, Math.min(100, bandit.meanReward + noise));
    return Math.round(reward);
  };

  const updateBanditMeans = () => {
    if (config.rewardStructure === 'dynamic') {
      const newBandits = bandits.map(bandit => ({
        ...bandit,
        meanReward: Math.max(10, Math.min(90, 
          bandit.meanReward + (Math.random() - 0.5) * 5
        ))
      }));
      
      setBandits(newBandits);
      
      // 发送环境变化标记
      sendSyncMarker('environment_change', { 
        trial: currentTrial + 1,
        newMeans: newBandits.map(b => b.meanReward)
      });
    }
  };

  const buildPrompt = (promptTemplate: string): string => {
    const banditStats = bandits.map((bandit, i) => ({
      id: i,
      timesChosen: bandit.timesChosen,
      averageReward: bandit.timesChosen > 0 ? (bandit.totalReward / bandit.timesChosen).toFixed(1) : 'N/A'
    }));

    const recentHistory = trialData.slice(-5).map(trial => ({
      trial: trial.trial,
      choice: trial.llmChoice,
      reward: trial.llmReward
    }));

    return promptTemplate
      .replace(/\{numBandits\}/g, config.numBandits.toString())
      .replace(/\{totalTrials\}/g, config.totalTrials.toString())
      .replace(/\{currentTrial\}/g, (currentTrial + 1).toString())
      .replace(/\{availableOptions\}/g, Array.from({length: config.numBandits}, (_, i) => i).join(', '))
      .replace(/\{history\}/g, JSON.stringify(recentHistory))
      .replace(/\{banditStats\}/g, JSON.stringify(banditStats));
  };

  const makeAIDecision = async () => {
    if (currentTrial >= config.totalTrials) {
      onComplete(trialData);
      return;
    }

    setIsRunning(true);
    
    // 发送AI决策开始标记
    sendSyncMarker('ai_decision_start', {
      trial: currentTrial + 1,
      totalTrials: config.totalTrials
    });
    
    try {
      // 构建prompt
      const systemPrompt = buildPrompt(config.promptConfig.systemPrompt);
      const userPrompt = buildPrompt(config.promptConfig.decisionPrompt) + 
        (config.promptConfig.customInstructions ? `\n\n额外指令：${config.promptConfig.customInstructions}` : '');

      // 发送LLM请求标记
      sendSyncMarker('llm_request', {
        trial: currentTrial + 1,
        systemPrompt,
        userPrompt
      });

      // 调用LLM API
      const llmResponse = await llmService.current.makeDecision({
        provider: config.apiConfig.provider,
        apiKey: config.apiConfig.apiKey,
        baseUrl: config.apiConfig.baseUrl,
        model: config.apiConfig.model,
        systemPrompt,
        userPrompt
      });

      const llmChoice = llmResponse.choice;
      const llmReward = generateReward(bandits[llmChoice]);
      
      setLastLLMChoice(llmChoice);
      setLlmScore(prev => prev + llmReward);
      setLlmThinking(llmResponse.thinking || llmResponse.rawResponse);
      
      // 发送LLM响应标记
      sendSyncMarker('llm_response', {
        trial: currentTrial + 1,
        choice: llmChoice,
        reward: llmReward,
        thinking: llmResponse.thinking,
        response: llmResponse.rawResponse
      });
      
      // 更新bandit统计
      setBandits(prev => prev.map((bandit, i) => 
        i === llmChoice 
          ? {
              ...bandit,
              timesChosen: bandit.timesChosen + 1,
              totalReward: bandit.totalReward + llmReward,
              currentReward: llmReward
            }
          : bandit
      ));
      
      // 记录试验数据
      const newTrialData: TrialData = {
        trial: currentTrial + 1,
        llmChoice,
        llmReward,
        llmReactionTime: 1000 + Math.random() * 2000,
        banditMeans: bandits.map(b => b.meanReward),
        timestamp: Date.now(),
        llmResponse: llmResponse.rawResponse,
        llmThinking: llmResponse.thinking
      };
      
      setTrialData(prev => [...prev, newTrialData]);
      
      // 更新环境
      updateBanditMeans();
      setCurrentTrial(prev => prev + 1);
      
      // 发送试验完成标记
      sendSyncMarker('ai_decision_complete', {
        trial: currentTrial + 1,
        choice: llmChoice,
        reward: llmReward,
        totalScore: llmScore + llmReward
      });
      
      // 检查是否完成
      if (currentTrial + 1 >= config.totalTrials) {
        setAutoRunEnabled(false);
        // 发送观察模式完成标记
        sendSyncMarker('ai_observation_complete', {
          totalTrials: currentTrial + 1,
          finalScore: llmScore + llmReward
        });
        
        setTimeout(() => {
          onComplete(trialData);
        }, 2000);
      }
    } catch (error) {
      console.error('AI决策失败:', error);
      // 发送错误标记
      sendSyncMarker('llm_error', {
        trial: currentTrial + 1,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // 使用随机选择作为fallback
      const llmChoice = Math.floor(Math.random() * config.numBandits);
      const llmReward = generateReward(bandits[llmChoice]);
      
      setLastLLMChoice(llmChoice);
      setLlmScore(prev => prev + llmReward);
      setLlmThinking('API调用失败，使用随机选择');
      
      // 更新bandit统计
      setBandits(prev => prev.map((bandit, i) => 
        i === llmChoice 
          ? {
              ...bandit,
              timesChosen: bandit.timesChosen + 1,
              totalReward: bandit.totalReward + llmReward,
              currentReward: llmReward
            }
          : bandit
      ));
      
      // 记录试验数据
      const newTrialData: TrialData = {
        trial: currentTrial + 1,
        llmChoice,
        llmReward,
        llmReactionTime: 1000,
        banditMeans: bandits.map(b => b.meanReward),
        timestamp: Date.now(),
        llmResponse: 'API调用失败',
        llmThinking: 'API调用失败，使用随机选择'
      };
      
      setTrialData(prev => [...prev, newTrialData]);
      
      // 更新环境
      updateBanditMeans();
      setCurrentTrial(prev => prev + 1);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleAutoRun = () => {
    const newState = !autoRunEnabled;
    setAutoRunEnabled(newState);
    setIsPaused(false);
    
    // 发送自动运行状态变更标记
    sendSyncMarker('auto_run_toggle', { 
      enabled: newState,
      trial: currentTrial + 1
    });
  };

  const togglePause = () => {
    const newState = !isPaused;
    setIsPaused(newState);
    
    // 发送暂停状态变更标记
    sendSyncMarker('pause_toggle', { 
      paused: newState,
      trial: currentTrial + 1
    });
  };

  const changeSpeed = () => {
    const speeds = [1, 2, 5];
    const currentIndex = speeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];
    setSpeed(newSpeed);
    
    // 发送速度变更标记
    sendSyncMarker('speed_change', { 
      oldSpeed: speed,
      newSpeed: newSpeed,
      trial: currentTrial + 1
    });
  };

  const exportData = () => {
    const data = {
      experimentConfig: config,
      trialData,
      summary: {
        totalTrials: trialData.length,
        totalReward: llmScore,
        averageReward: llmScore / Math.max(1, trialData.length),
        timestamp: new Date().toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-observation-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // 发送数据导出标记
    sendSyncMarker('data_export', { 
      totalTrials: trialData.length,
      timestamp: Date.now()
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="text" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回配置
        </Button>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            AI观察模式
          </p>
          <p className="text-lg font-semibold">
            {config.apiConfig.model}
          </p>
          <div className="flex items-center mt-1">
            <p className="text-sm text-gray-500 mr-2">
              试验 {currentTrial} / {config.totalTrials}
            </p>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentTrial / config.totalTrials) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button 
            variant={autoRunEnabled ? "primary" : "outline"}
            size="sm"
            onClick={toggleAutoRun}
            className="flex items-center"
          >
            {autoRunEnabled ? (
              <>
                <PauseCircle className="w-4 h-4 mr-2" />
                停止自动运行
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                自动运行
              </>
            )}
          </Button>
          
          {autoRunEnabled && (
            <Button 
              variant="outline"
              size="sm"
              onClick={togglePause}
              className="flex items-center"
            >
              {isPaused ? (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  继续
                </>
              ) : (
                <>
                  <PauseCircle className="w-4 h-4 mr-2" />
                  暂停
                </>
              )}
            </Button>
          )}
          
          <Button 
            variant="outline"
            size="sm"
            onClick={changeSpeed}
            className="flex items-center"
          >
            <Zap className="w-4 h-4 mr-2" />
            {speed}x 速度
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={showThinking}
              onChange={() => setShowThinking(!showThinking)}
              className="mr-2"
            />
            显示思考过程
          </label>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={makeAIDecision}
            disabled={isRunning || currentTrial >= config.totalTrials}
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            单步运行
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={exportData}
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            导出数据
          </Button>
        </div>
      </div>

      {/* Score Display */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-green-900">AI ({config.apiConfig.model})</h3>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-2xl font-bold text-green-600">{llmScore}</p>
          <p className="text-sm text-green-700">
            平均: {trialData.length > 0 ? (llmScore / trialData.length).toFixed(1) : '0'}
          </p>
        </div>
      </div>

      {/* LLM Thinking Display */}
      {showThinking && llmThinking && (
        <motion.div
          className="bg-gray-50 p-4 rounded-lg mb-6 border-l-4 border-green-500"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-4 h-4 text-green-600" />
            <h4 className="font-medium text-gray-900">AI思考过程</h4>
          </div>
          <div className="max-h-40 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{llmThinking}</p>
          </div>
        </motion.div>
      )}

      {/* Bandit Arms */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {bandits.map((bandit, index) => (
          <motion.div
            key={bandit.id}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              lastLLMChoice === index 
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200'
            }`}
          >
            <div className={`w-full h-16 ${bandit.color} rounded-lg mb-3`} />
            <div className="text-center">
              <p className="font-medium text-gray-900">选项 {index}</p>
              <p className="text-sm text-gray-600">
                选择次数: {bandit.timesChosen}
              </p>
              {bandit.timesChosen > 0 && (
                <p className="text-sm text-gray-600">
                  平均奖励: {(bandit.totalReward / bandit.timesChosen).toFixed(1)}
                </p>
              )}
            </div>
            
            {/* Choice indicators */}
            {lastLLMChoice === index && (
              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                AI选择
              </div>
            )}
            
            {/* Last reward */}
            {lastLLMChoice === index && bandit.currentReward > 0 && (
              <div className="absolute top-2 right-2 bg-white text-green-600 text-xs px-2 py-1 rounded-full font-bold border border-green-200">
                +{bandit.currentReward}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* History Log */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
          <MessageSquare className="w-4 h-4 mr-2" />
          决策历史
        </h3>
        <div className="max-h-40 overflow-y-auto">
          {trialData.slice().reverse().map((trial, index) => (
            <div key={index} className="text-sm border-b border-gray-200 py-2 last:border-0">
              <div className="flex justify-between">
                <span className="font-medium">轮次 {trial.trial}</span>
                <span className="text-gray-500">
                  {new Date(trial.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>选择: 选项 {trial.llmChoice}</span>
                <span className="text-green-600">奖励: {trial.llmReward}</span>
              </div>
            </div>
          ))}
          {trialData.length === 0 && (
            <p className="text-gray-500 text-center py-4">暂无决策历史</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIObservationMode;