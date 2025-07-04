import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { GameLogEntry } from '../types';

interface GameLogProps {
  logs: GameLogEntry[];
}

const GameLog = ({ logs }: GameLogProps) => {
  const getLogTypeStyles = (type: string): string => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="h-1/2 border-b border-gray-200">
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-700 flex items-center">
          <MessageSquare className="w-4 h-4 mr-2" />
          游戏日志
        </h3>
      </div>
      
      <div className="h-full overflow-y-auto p-2">
        <div className="space-y-2">
          {logs.slice().reverse().map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-2 rounded-lg border ${getLogTypeStyles(log.type)}`}
            >
              <div className="flex justify-between items-start">
                <p className="text-sm">{log.message}</p>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameLog;