import { motion } from 'framer-motion';
import { Brain, AlertTriangle } from 'lucide-react';
import { AgentThought, GameEvent } from '../GameInterface';

interface AgentThoughtPanelProps {
  thoughts: AgentThought[];
  events: GameEvent[];
}

const AgentThoughtPanel = ({ thoughts, events }: AgentThoughtPanelProps) => {
  const getEventTitle = (eventId: string): string => {
    const event = events.find(e => e.id === eventId);
    return event ? event.title : '未知事件';
  };
  
  return (
    <div className="h-full overflow-y-auto p-2">
      {thoughts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无AI代理思考
        </div>
      ) : (
        <div className="space-y-2">
          {thoughts.slice().reverse().map((thought, index) => (
            <motion.div
              key={thought.timestamp}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <Brain className="w-4 h-4 text-purple-600 mr-2" />
                  <h4 className="font-medium text-gray-900">{thought.agentRole}</h4>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(thought.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <p className="mt-2 text-sm text-gray-600">{thought.content}</p>
              
              {thought.relatedEvents && thought.relatedEvents.length > 0 && (
                <div className="mt-2 flex items-center">
                  <AlertTriangle className="w-3 h-3 text-yellow-600 mr-1" />
                  <span className="text-xs text-gray-500">
                    相关事件: {thought.relatedEvents.map(eventId => getEventTitle(eventId)).join(', ')}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentThoughtPanel;