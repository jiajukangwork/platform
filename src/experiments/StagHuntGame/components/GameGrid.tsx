import { motion } from 'framer-motion';
import { Beer as Deer, Rabbit } from 'lucide-react';
import { Entity } from '../types';

interface GameGridProps {
  entities: Entity[];
  gridSize: { width: number; height: number };
  cellSize: number;
  isPaused: boolean;
}

const GameGrid = ({ entities, gridSize, cellSize, isPaused }: GameGridProps) => {
  const getEntityColor = (type: string): string => {
    switch (type) {
      case 'player': return 'bg-blue-500';
      case 'ai': return 'bg-green-500';
      case 'stag': return 'bg-red-500';
      case 'hare': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'player': return <div className="text-white font-bold">P</div>;
      case 'ai': return <div className="text-white font-bold">A</div>;
      case 'stag': return <Deer className="w-5 h-5 text-white" />;
      case 'hare': return <Rabbit className="w-5 h-5 text-white" />;
      default: return null;
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-gray-50 relative">
      {isPaused && (
        <div className="absolute z-10 bg-black/70 text-white p-6 rounded-xl text-center">
          <h3 className="text-xl font-bold mb-4">游戏已暂停</h3>
          <p className="mb-4">使用方向键移动猎人，与AI合作捕获猎物</p>
          <button 
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }))}
          >
            开始游戏
          </button>
          <p className="mt-2 text-sm text-gray-300">或按空格键开始</p>
        </div>
      )}
      
      <div 
        className="grid gap-1 bg-white p-2 rounded-lg shadow-inner"
        style={{ 
          gridTemplateColumns: `repeat(${gridSize.width}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridSize.height}, ${cellSize}px)`
        }}
      >
        {Array.from({ length: gridSize.width * gridSize.height }).map((_, index) => {
          const x = index % gridSize.width;
          const y = Math.floor(index / gridSize.width);
          
          // 查找此位置的实体
          const entity = entities.find(e => 
            e.position.x === x && e.position.y === y
          );
          
          return (
            <div 
              key={index}
              className={`w-full h-full rounded border border-gray-200 flex items-center justify-center ${
                entity ? getEntityColor(entity.type) : 'bg-gray-100'
              }`}
              style={{ width: cellSize, height: cellSize }}
            >
              {entity && getEntityIcon(entity.type)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameGrid;