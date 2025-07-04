import { Entity, CaptureResult } from '../types';

export const getGridDimensions = (size: string): { width: number; height: number } => {
  switch (size) {
    case 'small': return { width: 5, height: 5 };
    case 'medium': return { width: 8, height: 8 };
    case 'large': return { width: 12, height: 12 };
    default: return { width: 8, height: 8 };
  }
};

export const addNewPrey = (entities: Entity[], type: 'stag' | 'hare', gridSize: { width: number; height: number }): void => {
  const { width, height } = gridSize;
  let position;
  let isValidPosition = false;
  
  // 确保新猎物不会出现在已有实体的位置
  while (!isValidPosition) {
    position = {
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height)
    };
    
    isValidPosition = !entities.some(entity => 
      entity.position.x === position.x && entity.position.y === position.y
    );
  }
  
  entities.push({
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    type,
    position
  });
};

export const moveRandomly = (entity: Entity, gridSize: { width: number; height: number }): void => {
  const { width, height } = gridSize;
  const moveProbability = entity.type === 'stag' ? 0.4 : 0.3; // 鹿比兔子移动概率高
  
  if (Math.random() < moveProbability) {
    const dx = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    const dy = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    
    const newX = Math.max(0, Math.min(width - 1, entity.position.x + dx));
    const newY = Math.max(0, Math.min(height - 1, entity.position.y + dy));
    
    entity.position = { x: newX, y: newY };
  }
};

export const calculateDistance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }): number => {
  return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2));
};

export const findClosestEntity = (position: { x: number; y: number }, entities: Entity[]): Entity => {
  if (entities.length === 0) throw new Error("No entities provided");
  
  let closestEntity = entities[0];
  let minDistance = calculateDistance(position, entities[0].position);
  
  for (let i = 1; i < entities.length; i++) {
    const distance = calculateDistance(position, entities[i].position);
    if (distance < minDistance) {
      minDistance = distance;
      closestEntity = entities[i];
    }
  }
  
  return closestEntity;
};

export const checkCaptures = (entities: Entity[]): CaptureResult[] => {
  const results: CaptureResult[] = [];
  const playerEntity = entities.find(e => e.type === 'player');
  const aiEntity = entities.find(e => e.type === 'ai');
  
  if (!playerEntity || !aiEntity) return results;
  
  // 检查兔子捕获（单人可捕获）
  entities.forEach(entity => {
    if (entity.type === 'hare') {
      // 玩家捕获兔子
      if (entity.position.x === playerEntity.position.x && entity.position.y === playerEntity.position.y) {
        results.push({
          type: 'hare',
          position: { ...entity.position },
          capturedBy: 'player'
        });
      }
      // AI捕获兔子
      else if (entity.position.x === aiEntity.position.x && entity.position.y === aiEntity.position.y) {
        results.push({
          type: 'hare',
          position: { ...entity.position },
          capturedBy: 'ai'
        });
      }
    }
  });
  
  // 检查鹿捕获（需要玩家和AI合作）
  entities.forEach(entity => {
    if (entity.type === 'stag') {
      const playerDistance = calculateDistance(playerEntity.position, entity.position);
      const aiDistance = calculateDistance(aiEntity.position, entity.position);
      
      // 如果玩家和AI都在鹿的相邻位置，则捕获成功
      if (playerDistance <= 1 && aiDistance <= 1) {
        results.push({
          type: 'stag',
          position: { ...entity.position }
        });
      }
    }
  });
  
  return results;
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};