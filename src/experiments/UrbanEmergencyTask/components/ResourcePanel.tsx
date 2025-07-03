import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Filter, Truck, Zap, AlertTriangle, Activity, Building } from 'lucide-react';
import { GameEvent, Resource } from '../GameInterface';

interface ResourcePanelProps {
  resources: Resource[];
  selectedResource: Resource | null;
  onResourceSelect: (resource: Resource | null) => void;
  selectedEvent: GameEvent | null;
  onResourceDispatch: (resourceId: string, eventId: string) => void;
  participantRole: string;
}

const ResourcePanel = ({ 
  resources, 
  selectedResource, 
  onResourceSelect,
  selectedEvent,
  onResourceDispatch,
  participantRole
}: ResourcePanelProps) => {
  const [filter, setFilter] = useState<'all' | 'available' | 'dispatched'>('all');
  
  const filteredResources = resources.filter(resource => {
    // Filter by status
    if (filter === 'all') return true;
    return resource.status === filter;
  }).filter(resource => {
    // Filter by role
    return resource.type === participantRole || resource.type === 'coordination';
  });
  
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'traffic': return <Truck className="w-4 h-4" />;
      case 'power': return <Zap className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      case 'medical': return <Activity className="w-4 h-4" />;
      case 'coordination': return <Building className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };
  
  const getResourceColor = (type: string): string => {
    switch (type) {
      case 'traffic': return 'text-blue-600';
      case 'power': return 'text-yellow-600';
      case 'emergency': return 'text-red-600';
      case 'medical': return 'text-green-600';
      case 'coordination': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'dispatched': return 'bg-blue-100 text-blue-800';
      case 'depleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'available': return '可用';
      case 'dispatched': return '已派遣';
      case 'depleted': return '已耗尽';
      default: return status;
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-medium text-gray-700 flex items-center">
          <Package className="w-4 h-4 mr-2" />
          资源管理
        </h3>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="text-xs border border-gray-300 rounded px-2 py-1"
        >
          <option value="all">全部资源</option>
          <option value="available">可用资源</option>
          <option value="dispatched">已派遣资源</option>
        </select>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {filteredResources.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无可用资源
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResources.map(resource => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg shadow-sm border ${
                  selectedResource?.id === resource.id ? 'border-primary-500' : 'border-gray-200'
                } p-3 cursor-pointer ${resource.status === 'available' ? 'hover:border-gray-300' : ''}`}
                onClick={() => onResourceSelect(resource)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className={`mr-2 ${getResourceColor(resource.type)}`}>
                      {getResourceIcon(resource.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{resource.name}</h4>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500 mr-2">数量: {resource.quantity}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor(resource.status)}`}>
                          {getStatusText(resource.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {resource.status === 'dispatched' && resource.assignedTo && (
                  <div className="mt-2 text-xs text-gray-500">
                    已分配至: {events.find(e => e.id === resource.assignedTo)?.title || '未知事件'}
                  </div>
                )}
                
                {resource.status === 'available' && selectedEvent && selectedEvent.status === 'active' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResourceDispatch(resource.id, selectedEvent.id);
                    }}
                    className="mt-2 w-full py-1 px-2 bg-primary-600 text-white text-xs rounded hover:bg-primary-700 transition-colors"
                  >
                    派遣至选中事件
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcePanel;