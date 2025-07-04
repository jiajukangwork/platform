import { Entity } from '../types';
import { calculateDistance, findClosestEntity } from './gameUtils';

export const moveAi = (
  aiEntity: Entity, 
  playerEntity: Entity, 
  entities: Entity[], 
  aiStrategy: string,
  gridSize: { width: number; height: number }
): void => {
  // 根据AI策略决定行动
  let targetEntity: Entity | null = null;
  
  // 获取所有猎物
  const stagEntities = entities.filter(e => e.type === 'stag');
  const hareEntities = entities.filter(e => e.type === 'hare');
  
  // 根据配置的AI策略和当前游戏状态决定目标
  switch (aiStrategy) {
    case 'cooperative':
      // 合作型AI优先选择离玩家最近的鹿
      if (stagEntities.length > 0) {
        targetEntity = findClosestEntity(aiEntity.position, stagEntities);
        aiEntity.strategy = 'stag';
      } else {
        targetEntity = findClosestEntity(aiEntity.position, hareEntities);
        aiEntity.strategy = 'hare';
      }
      break;
      
    case 'competitive':
      // 竞争型AI优先选择兔子
      if (hareEntities.length > 0) {
        targetEntity = findClosestEntity(aiEntity.position, hareEntities);
        aiEntity.strategy = 'hare';
      } else {
        targetEntity = findClosestEntity(aiEntity.position, stagEntities);
        aiEntity.strategy = 'stag';
      }
      break;
      
    case 'adaptive':
      // 适应型AI根据玩家行为调整策略
      // 计算玩家与最近的鹿之间的距离
      if (stagEntities.length > 0) {
        const closestStagToPlayer = findClosestEntity(playerEntity.position, stagEntities);
        const distanceToStag = calculateDistance(playerEntity.position, closestStagToPlayer.position);
        
        // 如果玩家靠近鹿（可能在追捕鹿），AI也选择追捕鹿
        if (distanceToStag < 3) {
          targetEntity = closestStagToPlayer;
          aiEntity.strategy = 'stag';
        } else {
          // 否则选择最近的兔子
          if (hareEntities.length > 0) {
            targetEntity = findClosestEntity(aiEntity.position, hareEntities);
            aiEntity.strategy = 'hare';
          } else {
            targetEntity = findClosestEntity(aiEntity.position, stagEntities);
            aiEntity.strategy = 'stag';
          }
        }
      } else if (hareEntities.length > 0) {
        targetEntity = findClosestEntity(aiEntity.position, hareEntities);
        aiEntity.strategy = 'hare';
      }
      break;
  }
  
  // 如果找到目标，向目标移动
  if (targetEntity) {
    const dx = targetEntity.position.x > aiEntity.position.x ? 1 : 
               targetEntity.position.x < aiEntity.position.x ? -1 : 0;
    const dy = targetEntity.position.y > aiEntity.position.y ? 1 : 
               targetEntity.position.y < aiEntity.position.y ? -1 : 0;
    
    const { width, height } = gridSize;
    const newX = Math.max(0, Math.min(width - 1, aiEntity.position.x + dx));
    const newY = Math.max(0, Math.min(height - 1, aiEntity.position.y + dy));
    
    aiEntity.position = { x: newX, y: newY };
    aiEntity.target = targetEntity.position;
  }
};

export const generateTemplateAiThought = (
  aiEntity: Entity | undefined, 
  playerEntity: Entity | undefined, 
  round: number
): { content: string; confidence: number } => {
  if (!aiEntity || !aiEntity.strategy) {
    return { 
      content: "分析当前局势，寻找最佳策略...", 
      confidence: 0.5 
    };
  }
  
  const thoughts = {
    stag: [
      "玩家似乎在靠近鹿，我应该配合追捕以获得更高奖励。",
      "合作捕鹿是最优策略，我将继续向鹿移动。",
      "玩家行为表明有合作意向，我们应该共同追捕鹿。",
      "鹿的位置很有利，如果玩家配合，我们可以成功捕获。"
    ],
    hare: [
      "玩家距离较远，独自捕兔更有效率。",
      "玩家行为不稳定，选择独立捕兔更为保险。",
      "当前局势下，追捕兔子能确保稳定得分。",
      "玩家可能不会合作，我应该专注于自己的得分。"
    ],
    unknown: [
      "需要观察玩家行为模式，确定最佳策略。",
      "局势不明朗，暂时保持灵活应对。",
      "分析玩家移动路径，推测其意图。",
      "环境中猎物分布复杂，需要权衡风险与收益。"
    ]
  };
  
  // 根据AI当前策略选择思考内容
  const thoughtList = thoughts[aiEntity.strategy];
  const thought = thoughtList[Math.floor(Math.random() * thoughtList.length)];
  
  // 计算与玩家的距离，影响置信度
  const distance = playerEntity ? calculateDistance(aiEntity.position, playerEntity.position) : 5;
  const confidence = Math.max(0.5, Math.min(0.9, 1 - distance / 10));
  
  return { content: thought, confidence };
};

export const buildLLMPrompt = (
  entities: Entity[],
  round: number,
  score: number,
  aiScore: number
): string => {
  const player = entities.find(e => e.type === 'player');
  const ai = entities.find(e => e.type === 'ai');
  const stags = entities.filter(e => e.type === 'stag');
  const hares = entities.filter(e => e.type === 'hare');
  
  return `当前游戏状态：
- 回合：${round}
- 玩家位置：(${player?.position.x}, ${player?.position.y})
- AI位置：(${ai?.position.x}, ${ai?.position.y})
- 鹿的数量：${stags.length}，位置：${stags.map(s => `(${s.position.x}, ${s.position.y})`).join(', ')}
- 兔子的数量：${hares.length}，位置：${hares.map(h => `(${h.position.x}, ${h.position.y})`).join(', ')}
- 玩家得分：${score}
- AI得分：${aiScore}

基于当前状态，你作为AI猎人的想法是什么？请简短回答（30-50字）。`;
};