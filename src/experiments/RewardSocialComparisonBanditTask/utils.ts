import { jStat } from 'jstat';
import { BanditArm } from './types';

export const normalRandom = (mean: number, std: number): number => {
  return jStat.normal.sample(mean, std);
};

export const generateReward = (bandit: BanditArm): number => {
  const reward = normalRandom(bandit.meanReward, 10);
  return Math.max(0, Math.min(100, reward));
};

export const generateComparisonData = (reward: number, studyId: number) => {
  const data: { reward_B?: number; mood_B?: number } = {};
  
  if ([1, 3, 4, 6].includes(studyId)) {
    data.reward_B = Math.max(0, Math.min(100,
      reward + normalRandom(0, 15)
    ));
  }
  
  if ([2, 3, 5, 6].includes(studyId)) {
    data.mood_B = Math.random();
  }
  
  return data;
};

export const updateBanditMean = (currentMean: number): number => {
  const newMean = currentMean + normalRandom(0, 5);
  return Math.max(0, Math.min(100, newMean));
};

export const calculateTotalReward = (history: { reward: number }[]): number => {
  return history.reduce((sum, round) => sum + round.reward, 0);
};

export const calculateAverageReward = (history: { reward: number }[]): number => {
  return history.length > 0 ? calculateTotalReward(history) / history.length : 0;
};

export const calculateExplorationRate = (history: { action: number }[], window: number = 10): number => {
  if (history.length < window) return 1;
  
  const recentActions = history.slice(-window);
  const uniqueActions = new Set(recentActions.map(h => h.action)).size;
  return uniqueActions / 4;
};