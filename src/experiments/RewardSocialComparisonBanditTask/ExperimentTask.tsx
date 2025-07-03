import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/Button';

interface ExperimentTaskProps {
  studyId: number;
  onFinish: () => void;
  onBack: () => void;
}

// Constants
const PRACTICE_ROUNDS = 10;
const TOTAL_ROUNDS = 200;
const NUM_BANDITS = 4;
const BANDIT_COLORS = ['yellow', 'red', 'blue', 'green'];
const MOOD_INTERVAL = 3;

interface BanditArm {
  id: number;
  color: string;
  meanReward: number;
  isAvailable: boolean;
  lastReward: number;
  timesChosen: number;
}

interface Round {
  studyId: number;
  isPractice: boolean;
  action: number;
  reward: number;
  reward_B?: number;
  mood_choice?: number;
  mood_B?: number;
  banditMeans: number[];
  timestamp: number;
}

const ExperimentTask = ({ studyId, onFinish, onBack }: ExperimentTaskProps) => {
  const [currentRound, setCurrentRound] = useState(0);
  const [bandits, setBandits] = useState<BanditArm[]>([]);
  const [history, setHistory] = useState<Round[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    setStartTime(Date.now());
    initializeBandits();
  }, []);

  const initializeBandits = () => {
    const newBandits = BANDIT_COLORS.map((color, i) => ({
      id: i,
      color,
      meanReward: 30 + Math.random() * 40,
      isAvailable: true,
      lastReward: 0,
      timesChosen: 0
    }));
    setBandits(newBandits);
  };

  const updateBanditMeans = () => {
    setBandits(prev => prev.map(bandit => ({
      ...bandit,
      meanReward: Math.max(0, Math.min(100,
        bandit.meanReward + (Math.random() - 0.5) * 10
      ))
    })));
  };

  const updateBanditAvailability = () => {
    if (Math.random() < 0.1) {
      const availableBandits = bandits.filter(b => b.isAvailable);
      const unavailableBandits = bandits.filter(b => !b.isAvailable);
      
      if (availableBandits.length > 2 && Math.random() < 0.5) {
        const indexToRemove = Math.floor(Math.random() * availableBandits.length);
        setBandits(prev => prev.map(b => 
          b.id === availableBandits[indexToRemove].id 
            ? { ...b, isAvailable: false }
            : b
        ));
      } else if (unavailableBandits.length > 0) {
        const indexToRestore = Math.floor(Math.random() * unavailableBandits.length);
        setBandits(prev => prev.map(b =>
          b.id === unavailableBandits[indexToRestore].id
            ? { ...b, isAvailable: true }
            : b
        ));
      }
    }
  };

  const generateReward = (bandit: BanditArm): number => {
    const standardDeviation = 10;
    let reward = 0;
    for (let i = 0; i < 12; i++) {
      reward += Math.random();
    }
    reward = (reward - 6) * standardDeviation + bandit.meanReward;
    return Math.max(0, Math.min(100, reward));
  };

  const generateComparisonData = (reward: number) => {
    const data: { reward_B?: number; mood_B?: number } = {};
    
    if (studyId === 1 || studyId === 3 || studyId === 4 || studyId === 6) {
      data.reward_B = Math.max(0, Math.min(100,
        reward + (Math.random() - 0.5) * 30
      ));
    }
    
    data.mood_B = Math.random();
    
    return data;
  };

  const makeChoice = (banditId: number) => {
    if (!bandits[banditId].isAvailable) return;
  
    // 更新选择次数
    setBandits(prev => prev.map(b => 
      b.id === banditId 
        ? { ...b, timesChosen: b.timesChosen + 1 }
        : b
    ));
  
    const reward = generateReward(bandits[banditId]);
    const comparison = generateComparisonData(reward);
    
    const round: Round = {
      studyId,
      isPractice: currentRound < PRACTICE_ROUNDS,
      action: banditId,
      reward,
      banditMeans: bandits.map(b => b.isAvailable ? b.meanReward : -1),
      ...comparison,
      timestamp: Date.now()
    };
  
    if ((currentRound + 1) % MOOD_INTERVAL === 0) {
      round.mood_choice = Math.random();
    }
    
    setHistory(prev => [...prev, round]);
    updateBanditMeans();
    updateBanditAvailability();
  
    if (currentRound + 1 >= TOTAL_ROUNDS + PRACTICE_ROUNDS) {
      onFinish();
    } else {
      setCurrentRound(prev => prev + 1);
    }
  };

  const getBanditColorClass = (color: string): string => {
    switch (color) {
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="text" onClick={onBack}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回选择
        </Button>
        <div className="text-right">
          <p className="text-sm text-gray-500">Study {studyId}</p>
          <p className="text-lg font-semibold">
            {currentRound < PRACTICE_ROUNDS ? '练习阶段' : '正式实验'}
          </p>
          <p className="text-sm text-gray-500">
            回合 {currentRound + 1} / {currentRound < PRACTICE_ROUNDS ? PRACTICE_ROUNDS : TOTAL_ROUNDS}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {bandits.map((bandit, index) => (
          <motion.div
            key={bandit.id}
            whileHover={{ scale: bandit.isAvailable ? 1.02 : 1 }}
            whileTap={{ scale: bandit.isAvailable ? 0.98 : 1 }}
          >
            <button
              onClick={() => makeChoice(index)}
              disabled={!bandit.isAvailable}
              className={`w-full p-6 rounded-xl border-2 transition-colors ${
                bandit.isAvailable
                  ? 'border-gray-200 hover:border-primary-400 bg-white'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className={`w-full h-24 ${getBanditColorClass(bandit.color)} rounded-lg mb-2`} />
              <div className="text-center">
                <p className="font-semibold">{bandit.color.charAt(0).toUpperCase() + bandit.color.slice(1)} Machine</p>
                <p className="text-sm text-gray-600">
                  选择次数: {bandit.timesChosen}
                </p>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {history.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">上一轮结果</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">您的奖励</p>
              <p className="text-xl font-semibold">{history[history.length - 1].reward.toFixed(2)}</p>
            </div>
            {history[history.length - 1].reward_B !== undefined && (
              <div>
                <p className="text-sm text-gray-500">
                  {studyId <= 3 ? '其他参与者' : 'AI'} 的奖励
                </p>
                <p className="text-xl font-semibold">
                  {history[history.length - 1].reward_B.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {(currentRound + 1) % MOOD_INTERVAL === 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h2 className="text-lg font-semibold mb-4">请评价您当前的心情</h2>
          <input
            type="range"
            min="0"
            max="100"
            className="w-full"
            onChange={(e) => {
              const lastRound = history[history.length - 1];
              if (lastRound) {
                lastRound.mood_choice = parseInt(e.target.value) / 100;
              }
            }}
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>非常不好</span>
            <span>一般</span>
            <span>非常好</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperimentTask;