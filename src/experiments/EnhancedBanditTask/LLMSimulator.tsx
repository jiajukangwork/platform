interface BanditArm {
  id: number;
  meanReward: number;
  currentReward: number;
  timesChosen: number;
  totalReward: number;
  color: string;
}

interface TrialData {
  trial: number;
  humanChoice?: number;
  llmChoice?: number;
  humanReward?: number;
  llmReward?: number;
  humanReactionTime?: number;
  llmReactionTime?: number;
  banditMeans: number[];
  timestamp: number;
}

class LLMSimulator {
  private model: string;
  private explorationRate: number;
  private temperature: number;
  private memory: TrialData[];

  constructor(model: string) {
    this.model = model;
    this.explorationRate = 0.1; // ε-greedy parameter
    this.temperature = 1.0; // Softmax temperature
    this.memory = [];
  }

  async makeChoice(
    bandits: BanditArm[], 
    history: TrialData[], 
    currentTrial: number
  ): Promise<number> {
    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Different strategies based on model
    switch (this.model) {
      case 'gpt-4':
        return this.gpt4Strategy(bandits, history, currentTrial);
      case 'claude-3':
        return this.claude3Strategy(bandits, history, currentTrial);
      case 'gemini-pro':
        return this.geminiStrategy(bandits, history, currentTrial);
      default:
        return this.defaultStrategy(bandits, history, currentTrial);
    }
  }

  private gpt4Strategy(bandits: BanditArm[], history: TrialData[], currentTrial: number): number {
    // GPT-4: Advanced UCB (Upper Confidence Bound) strategy
    if (currentTrial < bandits.length) {
      // Exploration phase: try each bandit at least once
      return currentTrial;
    }

    const ucbValues = bandits.map((bandit, index) => {
      if (bandit.timesChosen === 0) return Infinity;
      
      const averageReward = bandit.totalReward / bandit.timesChosen;
      const confidence = Math.sqrt((2 * Math.log(currentTrial + 1)) / bandit.timesChosen);
      return averageReward + confidence;
    });

    return ucbValues.indexOf(Math.max(...ucbValues));
  }

  private claude3Strategy(bandits: BanditArm[], history: TrialData[], currentTrial: number): number {
    // Claude-3: Conservative ε-greedy with decay
    const decayedEpsilon = this.explorationRate * Math.exp(-currentTrial / 50);
    
    if (Math.random() < decayedEpsilon) {
      // Explore: choose randomly
      return Math.floor(Math.random() * bandits.length);
    } else {
      // Exploit: choose best known option
      const averageRewards = bandits.map(bandit => 
        bandit.timesChosen > 0 ? bandit.totalReward / bandit.timesChosen : 0
      );
      return averageRewards.indexOf(Math.max(...averageRewards));
    }
  }

  private geminiStrategy(bandits: BanditArm[], history: TrialData[], currentTrial: number): number {
    // Gemini: Softmax (Boltzmann) exploration
    const averageRewards = bandits.map(bandit => 
      bandit.timesChosen > 0 ? bandit.totalReward / bandit.timesChosen : 30 // Prior assumption
    );

    // Apply temperature decay
    const currentTemp = this.temperature * Math.exp(-currentTrial / 100);
    
    // Calculate softmax probabilities
    const expValues = averageRewards.map(reward => Math.exp(reward / currentTemp));
    const sumExp = expValues.reduce((sum, val) => sum + val, 0);
    const probabilities = expValues.map(val => val / sumExp);

    // Sample from the probability distribution
    const random = Math.random();
    let cumulativeProb = 0;
    
    for (let i = 0; i < probabilities.length; i++) {
      cumulativeProb += probabilities[i];
      if (random <= cumulativeProb) {
        return i;
      }
    }
    
    return bandits.length - 1; // Fallback
  }

  private defaultStrategy(bandits: BanditArm[], history: TrialData[], currentTrial: number): number {
    // Simple ε-greedy strategy
    if (Math.random() < this.explorationRate) {
      return Math.floor(Math.random() * bandits.length);
    } else {
      const averageRewards = bandits.map(bandit => 
        bandit.timesChosen > 0 ? bandit.totalReward / bandit.timesChosen : 0
      );
      return averageRewards.indexOf(Math.max(...averageRewards));
    }
  }

  // Simulate different LLM reasoning patterns
  getStrategyDescription(): string {
    switch (this.model) {
      case 'gpt-4':
        return 'GPT-4使用高级UCB策略，平衡探索与利用，考虑不确定性';
      case 'claude-3':
        return 'Claude-3采用保守的ε-贪婪策略，随时间减少探索';
      case 'gemini-pro':
        return 'Gemini使用Softmax探索，基于概率分布进行选择';
      default:
        return '使用标准ε-贪婪策略';
    }
  }
}

export default LLMSimulator;