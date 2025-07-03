// Types for the experiment
export interface BanditArm {
  id: number;
  color: string;
  meanReward: number;
  isAvailable: boolean;
  lastReward: number;
  timesChosen: number;
}

export interface Round {
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

export interface Study {
  id: number;
  name: string;
  type: 'human' | 'ai';
  comparison: 'reward' | 'emotion' | 'both';
  description: string;
}

export const STUDIES: Study[] = [
  { 
    id: 1, 
    name: "人类奖励比较", 
    type: "human", 
    comparison: "reward",
    description: "研究与其他参与者的奖励比较如何影响决策"
  },
  { 
    id: 2, 
    name: "人类情绪比较", 
    type: "human", 
    comparison: "emotion",
    description: "研究与其他参与者的情绪比较如何影响决策"
  },
  { 
    id: 3, 
    name: "人类综合比较", 
    type: "human", 
    comparison: "both",
    description: "研究与其他参与者的奖励和情绪综合比较的影响"
  },
  { 
    id: 4, 
    name: "AI奖励比较", 
    type: "ai", 
    comparison: "reward",
    description: "研究与AI系统的奖励比较如何影响决策"
  },
  { 
    id: 5, 
    name: "AI情绪比较", 
    type: "ai", 
    comparison: "emotion",
    description: "研究与AI系统的情绪比较如何影响决策"
  },
  { 
    id: 6, 
    name: "AI综合比较", 
    type: "ai", 
    comparison: "both",
    description: "研究与AI系统的奖励和情绪综合比较的影响"
  }
];

export const PRACTICE_ROUNDS = 10;
export const TOTAL_ROUNDS = 200;
export const NUM_BANDITS = 4;
export const BANDIT_COLORS = ['Yellow', 'Red', 'Blue', 'Green'];
export const MOOD_INTERVAL = 3;