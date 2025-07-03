export interface BanditArm {
  id: number;
  color: string;
  meanReward: number;
  isAvailable: boolean;
  lastReward: number;
  timesChosen: number;
}

export interface TrialData {
  trial: number;
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
  description: string;
  type: 'human' | 'ai';
}

export const STUDIES: Study[] = [
  {
    id: 1,
    name: '奖励比较',
    description: '与人类参与者进行奖励比较，观察奖励差异对探索策略的影响',
    type: 'human'
  },
  {
    id: 2,
    name: '情绪比较',
    description: '与人类参与者进行情绪比较，研究情绪状态对决策的影响',
    type: 'human'
  },
  {
    id: 3,
    name: '奖励和情绪综合比较',
    description: '同时进行奖励和情绪比较，探索多维度比较的影响',
    type: 'human'
  },
  {
    id: 4,
    name: 'AI奖励比较',
    description: '与AI系统进行奖励比较，对比人机决策差异',
    type: 'ai'
  },
  {
    id: 5,
    name: 'AI情绪比较',
    description: '与AI系统进行情绪比较，研究AI情绪模拟的影响',
    type: 'ai'
  },
  {
    id: 6,
    name: 'AI综合比较',
    description: '与AI系统进行奖励和情绪的综合比较',
    type: 'ai'
  }
];