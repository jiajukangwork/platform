import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bot, User, BarChart3, Clock, Zap, MessageSquare, Brain } from 'lucide-react';
import Button from '../../components/Button';
import { ExperimentConfig, TrialData } from './index';
import LLMService from './LLMService';

interface ExperimentTaskProps {
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

const ExperimentTask = ({ config, onComplete, onBack }: ExperimentTaskProps) => {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [bandits, setBandits] = useState<BanditArm[]>([]);
  const [trialData, setTrialData] = useState<TrialData[]>([]);
  const [humanScore, setHumanScore] = useState(0);
  const [llmScore, setLlmScore] = useState(0);
  const [isWaitingForLLM, setIsWaitingForLLM] = useState(false);
  const [lastHumanChoice, setLastHumanChoice] = useState<number | null>(null);
  const [lastLLMChoice, setLastLLMChoice] = useState<number | null>(null);
  const [trialStartTime, setTrialStartTime] = useState<number>(Date.now());
  const [showComparison, setShowComparison] = useState(false);
  const [llmThinking, setLlmThinking] = useState<string>('');
  const [showLLMThinking, setShowLLMThinking] = useState(false);
  
  const llmService = useRef(LLMService.getInstance());

  useEffect(() => {
    initializeBandits();
    setTrialStartTime(Date.now());
  }, []);

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
  };

  const generateReward = (bandit: BanditArm): number => {
    // Add some noise to the reward
    const noise = (Math.random() - 0.5) * 20;
    const reward = Math.max(0, Math.min(100, bandit.meanReward + noise));
    return Math.round(reward);
  };

  const updateBanditMeans = () => {
    if (config.rewardStructure === 'dynamic') {
      setBandits(prev => prev.map(bandit => ({
        ...bandit,
        meanReward: Math.max(10, Math.min(90, 
          bandit.meanReward + (Math.random() - 0.5) * 5
        ))
      })));
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

  const handleHumanChoice = async (banditIndex: number) => {
    if (isWaitingForLLM) return;
    
    const reactionTime = Date.now() - trialStartTime;
    const humanReward = generateReward(bandits[banditIndex]);
    
    setLastHumanChoice(banditIndex);
    setHumanScore(prev => prev + humanReward);
    
    // Update bandit stats
    setBandits(prev => prev.map((bandit, i) => 
      i === banditIndex 
        ? {
            ...bandit,
            timesChosen: bandit.timesChosen + 1,
            totalReward: bandit.totalReward + humanReward,
            currentReward: humanReward
          }
        : bandit
    ));

    if (config.comparisonMode === 'human-vs-llm') {
      setIsWaitingForLLM(true);
      setShowLLMThinking(true);
      
      try {
        // 构建prompt
        const systemPrompt = buildPrompt(config.promptConfig.systemPrompt);
        const userPrompt = buildPrompt(config.promptConfig.decisionPrompt) + 
          (config.promptConfig.customInstructions ? `\n\n额外指令：${config.promptConfig.customInstructions}` : '');

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
        
        // Record trial data
        const newTrialData: TrialData = {
          trial: currentTrial + 1,
          humanChoice: banditIndex,
          llmChoice,
          humanReward,
          llmReward,
          humanReactionTime: reactionTime,
          llmReactionTime: 1000 + Math.random() * 2000, // Simulated LLM thinking time
          banditMeans: bandits.map(b => b.meanReward),
          timestamp: Date.now(),
          llmResponse: llmResponse.rawResponse,
          llmThinking: llmResponse.thinking
        };
        
        setTrialData(prev => [...prev, newTrialData]);
        
        if (config.socialComparison) {
          setShowComparison(true);
          setTimeout(() => setShowComparison(false), 3000);
        }
      } catch (error) {
        console.error('LLM调用失败:', error);
        // Fallback to random choice
        const llmChoice = Math.floor(Math.random() * config.numBandits);
        const llmReward = generateReward(bandits[llmChoice]);
        
        setLastLLMChoice(llmChoice);
        setLlmScore(prev => prev + llmReward);
        setLlmThinking('API调用失败，使用随机选择');
        
        const newTrialData: TrialData = {
          trial: currentTrial + 1,
          humanChoice: banditIndex,
          llmChoice,
          humanReward,
          llmReward,
          humanReactionTime: reactionTime,
          llmReactionTime: 1000,
          banditMeans: bandits.map(b => b.meanReward),
          timestamp: Date.now(),
          llmResponse: 'API调用失败',
          llmThinking: 'API调用失败，使用随机选择'
        };
        
        setTrialData(prev => [...prev, newTrialData]);
      }
      
      setIsWaitingForLLM(false);
      setTimeout(() => setShowLLMThinking(false), 2000);
    } else {
      // Human-only mode
      const newTrialData: TrialData = {
        trial: currentTrial + 1,
        humanChoice: banditIndex,
        humanReward,
        humanReactionTime: reactionTime,
        banditMeans: bandits.map(b => b.meanReward),
        timestamp: Date.now()
      };
      
      setTrialData(prev => [...prev, newTrialData]);
    }

    // Check if experiment is complete
    if (currentTrial + 1 >= config.totalTrials) {
      setTimeout(() => {
        onComplete(trialData);
      }, 2000);
    } else {
      updateBanditMeans();
      setCurrentTrial(prev => prev + 1);
      setTrialStartTime(Date.now());
      setLastHumanChoice(null);
      setLastLLMChoice(null);
    }
  };

  const getPerformanceComparison = () => {
    if (config.comparisonMode !== 'human-vs-llm' || trialData.length === 0) return null;
    
    const humanAvg = humanScore / Math.max(1, currentTrial);
    const llmAvg = llmScore / Math.max(1, currentTrial);
    
    return {
      humanAvg,
      llmAvg,
      difference: humanAvg - llmAvg,
      humanLeading: humanAvg > llmAvg
    };
  };

  const comparison = getPerformanceComparison();

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="text" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回配置
        </Button>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            试验 {currentTrial + 1} / {config.totalTrials}
          </p>
          <div className="w-64 bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentTrial / config.totalTrials) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Score Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">人类玩家</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{humanScore}</p>
          {comparison && (
            <p className="text-sm text-gray-600">
              平均: {comparison.humanAvg.toFixed(1)}
            </p>
          )}
        </div>
        
        {config.comparisonMode === 'human-vs-llm' && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-900">AI ({config.apiConfig.model})</h3>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">{llmScore}</p>
            {comparison && (
              <p className="text-sm text-gray-600">
                平均: {comparison.llmAvg.toFixed(1)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Performance Comparison Alert */}
      <AnimatePresence>
        {showComparison && comparison && (
          <motion.div
            className={`p-4 rounded-lg mb-6 ${
              comparison.humanLeading ? 'bg-blue-100 border-blue-300' : 'bg-green-100 border-green-300'
            } border`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p className="text-center font-medium">
              {comparison.humanLeading 
                ? `🎉 您领先AI ${Math.abs(comparison.difference).toFixed(1)} 分！` 
                : `🤖 AI领先您 ${Math.abs(comparison.difference).toFixed(1)} 分！`
              }
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LLM Thinking Display */}
      <AnimatePresence>
        {showLLMThinking && llmThinking && (
          <motion.div
            className="bg-gray-50 p-4 rounded-lg mb-6 border-l-4 border-green-500"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-gray-900">AI思考过程</h4>
            </div>
            <p className="text-sm text-gray-700 italic">"{llmThinking}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bandit Arms */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {bandits.map((bandit, index) => (
          <motion.div
            key={bandit.id}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
              lastHumanChoice === index 
                ? 'border-blue-500 bg-blue-50' 
                : lastLLMChoice === index
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${isWaitingForLLM ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isWaitingForLLM && handleHumanChoice(index)}
            whileHover={!isWaitingForLLM ? { scale: 1.02 } : {}}
            whileTap={!isWaitingForLLM ? { scale: 0.98 } : {}}
          >
            <div className={`w-full h-16 ${bandit.color} rounded-lg mb-3`} />
            <div className="text-center">
              <p className="font-medium text-gray-900">选项 {index + 1}</p>
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
            {lastHumanChoice === index && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                人类选择
              </div>
            )}
            {lastLLMChoice === index && (
              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                AI选择
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Waiting for LLM */}
      {isWaitingForLLM && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            <span>AI正在思考...</span>
          </div>
        </div>
      )}

      {/* Last round results */}
      {(lastHumanChoice !== null || lastLLMChoice !== null) && !isWaitingForLLM && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">上一轮结果</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lastHumanChoice !== null && (
              <div>
                <p className="text-sm text-gray-600">人类选择: 选项 {lastHumanChoice + 1}</p>
                <p className="text-lg font-medium text-blue-600">
                  奖励: {bandits[lastHumanChoice]?.currentReward || 0}
                </p>
              </div>
            )}
            {lastLLMChoice !== null && config.comparisonMode === 'human-vs-llm' && (
              <div>
                <p className="text-sm text-gray-600">AI选择: 选项 {lastLLMChoice + 1}</p>
                <p className="text-lg font-medium text-green-600">
                  奖励: {generateReward(bandits[lastLLMChoice])}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentTask;