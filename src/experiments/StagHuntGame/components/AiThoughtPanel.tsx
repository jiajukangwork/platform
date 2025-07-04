import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight, ChevronLeft } from 'lucide-react';
import { AiThought } from '../types';

interface AiThoughtPanelProps {
  thoughts: AiThought[];
  showThoughts: boolean;
  onToggleThoughts: () => void;
}

const AiThoughtPanel = ({ thoughts, showThoughts, onToggleThoughts }: AiThoughtPanelProps) => {
  return (
    <div className="h-1/2">
      <div className="flex justify-between items-center p-2 bg-gray-50 border-b border-gray-200">
        <h3 className="font-medium text-gray-700 flex items-center">
          <Brain className="w-4 h-4 mr-2" />
          AI思考过程
        </h3>
        <button 
          onClick={onToggleThoughts}
          className="p-1 text-gray-500 hover:text-gray-700"
        >
          {showThoughts ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      
      <AnimatePresence>
        {showThoughts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="h-full overflow-y-auto p-2">
              <div className="space-y-2">
                {thoughts.slice().reverse().map((thought) => (
                  <motion.div
                    key={thought.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Brain className="w-4 h-4 text-green-600 mr-2" />
                        <h4 className="font-medium text-green-800">AI思考</h4>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(thought.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <p className="mt-2 text-sm text-gray-700">{thought.content}</p>
                    
                    <div className="mt-2 flex items-center">
                      <div className="text-xs text-gray-500">置信度:</div>
                      <div className="ml-2 w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500"
                          style={{ width: `${thought.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-1 text-xs text-gray-500">
                        {Math.round(thought.confidence * 100)}%
                      </span>
                    </div>
                  </motion.div>
                ))}
                
                {thoughts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    AI尚未产生思考
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiThoughtPanel;