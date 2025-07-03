import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { GameEvent, Resource } from '../GameInterface';

interface EventFeedProps {
  events: GameEvent[];
  selectedEvent: GameEvent | null;
  onEventSelect: (event: GameEvent | null) => void;
  resources: Resource[];
  onResourceDispatch: (resourceId: string, eventId: string) => void;
  participantRole: string;
}

const EventFeed = ({ 
  events, 
  selectedEvent, 
  onEventSelect,
  resources,
  onResourceDispatch,
  participantRole
}: EventFeedProps) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'severity'>('newest');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  
  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.status === filter;
  });
  
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortOrder === 'newest') {
      return b.timestamp - a.timestamp;
    } else if (sortOrder === 'oldest') {
      return a.timestamp - b.timestamp;
    } else { // severity
      const severityOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
      return severityOrder[b.severity as keyof typeof severityOrder] - 
             severityOrder[a.severity as keyof typeof severityOrder];
    }
  });
  
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return 'bg-yellow-500';
      case 'medium': return 'bg-orange-500';
      case 'high': return 'bg-red-500';
      case 'critical': return 'bg-purple-600';
      default: return 'bg-gray-500';
    }
  };
  
  const getSeverityText = (severity: string): string => {
    switch (severity) {
      case 'low': return '轻微';
      case 'medium': return '中等';
      case 'high': return '严重';
      case 'critical': return '灾难性';
      default: return severity;
    }
  };
  
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };
  
  // Filter resources based on participant role and event requirements
  const getAvailableResources = (event: GameEvent) => {
    return resources.filter(resource => {
      // Must be available
      if (resource.status !== 'available') return false;
      
      // Must match the participant's role or be coordination resources
      if (resource.type !== participantRole && resource.type !== 'coordination') return false;
      
      // Must be required by the event
      return event.requiredResources[resource.type] > 0;
    });
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-700 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          事件列表
        </h3>
        
        <div className="flex space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">全部事件</option>
            <option value="active">活跃事件</option>
            <option value="resolved">已解决事件</option>
          </select>
          
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="newest">最新优先</option>
            <option value="oldest">最早优先</option>
            <option value="severity">严重性优先</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无事件
          </div>
        ) : (
          <div className="space-y-2">
            {sortedEvents.map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg shadow-sm border ${
                  selectedEvent?.id === event.id ? 'border-primary-500' : 'border-gray-200'
                } overflow-hidden`}
              >
                <div 
                  className="p-3 cursor-pointer"
                  onClick={() => {
                    onEventSelect(event);
                    setExpandedEvent(expandedEvent === event.id ? null : event.id);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(event.severity)} mr-2`}></div>
                      <div>
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        <p className="text-xs text-gray-500">
                          {getSeverityText(event.severity)} | {formatTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {event.status === 'resolved' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                      )}
                      {expandedEvent === event.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedEvent === event.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-gray-100"
                    >
                      <div className="p-3 bg-gray-50">
                        <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                        
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-700 mb-1">受影响系统:</div>
                          <div className="flex flex-wrap gap-1">
                            {event.affectedSystems.map(system => (
                              <span 
                                key={system}
                                className="px-2 py-0.5 bg-gray-200 rounded-full text-xs"
                              >
                                {system === 'traffic' ? '交通' : 
                                 system === 'power' ? '电力' : 
                                 system === 'emergency' ? '应急' : 
                                 system === 'medical' ? '医疗' : system}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-700 mb-1">所需资源:</div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(event.requiredResources).map(([type, amount]) => (
                              <span 
                                key={type}
                                className="px-2 py-0.5 bg-gray-200 rounded-full text-xs"
                              >
                                {type === 'traffic' ? '交通' : 
                                 type === 'power' ? '电力' : 
                                 type === 'emergency' ? '应急' : 
                                 type === 'medical' ? '医疗' : type}: {amount}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {event.status === 'active' && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">可用资源:</div>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {getAvailableResources(event).length > 0 ? (
                                getAvailableResources(event).map(resource => (
                                  <div 
                                    key={resource.id}
                                    className="flex justify-between items-center bg-white p-1 rounded border border-gray-200"
                                  >
                                    <span className="text-xs">{resource.name} (x{resource.quantity})</span>
                                    <button
                                      onClick={() => onResourceDispatch(resource.id, event.id)}
                                      className="text-xs px-2 py-0.5 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                                    >
                                      派遣
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-gray-500 italic">
                                  没有可用的匹配资源
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventFeed;