import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Truck, Zap, Activity, Building, Home, Road, Droplet } from 'lucide-react';
import { GameEvent, Resource } from '../GameInterface';

interface CityMapProps {
  events: GameEvent[];
  resources: Resource[];
  selectedEvent: GameEvent | null;
  selectedResource: Resource | null;
  zoom: number;
  onEventSelect: (event: GameEvent | null) => void;
  onResourceSelect: (resource: Resource | null) => void;
  participantRole: string;
}

interface GridCell {
  x: number;
  y: number;
  type: 'residential' | 'commercial' | 'industrial' | 'road' | 'park' | 'water';
}

const CityMap = ({ 
  events, 
  resources, 
  selectedEvent, 
  selectedResource,
  zoom,
  onEventSelect,
  onResourceSelect,
  participantRole
}: CityMapProps) => {
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const mapRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    generateCityGrid();
  }, []);
  
  const generateCityGrid = () => {
    const newGrid: GridCell[] = [];
    
    // Generate a 100x100 grid
    for (let x = 0; x < 100; x++) {
      for (let y = 0; y < 100; y++) {
        // Determine cell type based on position
        let type: GridCell['type'] = 'residential';
        
        // Create roads in a grid pattern
        if (x % 10 === 0 || y % 10 === 0) {
          type = 'road';
        }
        // Create commercial areas near roads
        else if ((x % 10 === 1 || x % 10 === 9 || y % 10 === 1 || y % 10 === 9) && Math.random() > 0.7) {
          type = 'commercial';
        }
        // Create industrial areas in specific regions
        else if (x > 70 && y > 70 && Math.random() > 0.6) {
          type = 'industrial';
        }
        // Create parks
        else if (((x > 20 && x < 30) && (y > 20 && y < 30)) || 
                ((x > 60 && x < 70) && (y > 40 && y < 50))) {
          type = 'park';
        }
        // Create water bodies
        else if (((x > 80 && x < 95) && (y > 10 && y < 30)) || 
                ((x > 10 && x < 20) && (y > 60 && y < 90))) {
          type = 'water';
        }
        // The rest is residential
        
        newGrid.push({ x, y, type });
      }
    }
    
    setGrid(newGrid);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setMapOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  
  const getCellColor = (type: string): string => {
    switch (type) {
      case 'residential': return '#E5E7EB'; // gray-200
      case 'commercial': return '#BFDBFE'; // blue-200
      case 'industrial': return '#FDE68A'; // yellow-200
      case 'road': return '#9CA3AF'; // gray-400
      case 'park': return '#BBF7D0'; // green-200
      case 'water': return '#93C5FD'; // blue-300
      default: return '#E5E7EB';
    }
  };
  
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return 'bg-yellow-500';
      case 'medium': return 'bg-orange-500';
      case 'high': return 'bg-red-500';
      case 'critical': return 'bg-purple-600';
      default: return 'bg-gray-500';
    }
  };
  
  const getResourceColor = (type: string): string => {
    switch (type) {
      case 'traffic': return 'bg-blue-500';
      case 'power': return 'bg-yellow-500';
      case 'emergency': return 'bg-red-500';
      case 'medical': return 'bg-green-500';
      case 'coordination': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'traffic': return <Truck className="w-3 h-3" />;
      case 'power': return <Zap className="w-3 h-3" />;
      case 'emergency': return <AlertTriangle className="w-3 h-3" />;
      case 'medical': return <Activity className="w-3 h-3" />;
      case 'coordination': return <Building className="w-3 h-3" />;
      default: return <Building className="w-3 h-3" />;
    }
  };
  
  const getCellIcon = (type: string) => {
    switch (type) {
      case 'residential': return <Home className="w-2 h-2 text-gray-500" />;
      case 'commercial': return <Building className="w-2 h-2 text-blue-500" />;
      case 'industrial': return <Building className="w-2 h-2 text-yellow-600" />;
      case 'road': return <Road className="w-2 h-2 text-gray-600" />;
      case 'park': return <Activity className="w-2 h-2 text-green-500" />;
      case 'water': return <Droplet className="w-2 h-2 text-blue-500" />;
      default: return null;
    }
  };
  
  // Filter resources based on participant role
  const visibleResources = resources.filter(resource => {
    // Coordinator can see all resources
    if (participantRole === 'coordinator') return true;
    
    // Others can only see their own resources
    return resource.type === participantRole || resource.type === 'coordination';
  });
  
  return (
    <div 
      ref={mapRef}
      className="w-full h-full overflow-hidden relative bg-gray-100 cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute top-2 left-2 z-10 bg-white p-2 rounded-md shadow-md text-xs">
        <div className="font-bold mb-1">地图图例</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
            <span>轻微事件</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
            <span>中等事件</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>严重事件</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-600 rounded-full mr-1"></div>
            <span>灾难性事件</span>
          </div>
        </div>
      </div>
      
      <div 
        style={{ 
          transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 0.3s ease'
        }}
        className="absolute inset-0"
      >
        {/* Render grid cells */}
        {grid.map((cell, index) => {
          // Only render cells that could be visible (optimization)
          if (
            cell.x < -mapOffset.x / zoom - 10 || 
            cell.x > -mapOffset.x / zoom + (mapRef.current?.clientWidth || 0) / zoom + 10 ||
            cell.y < -mapOffset.y / zoom - 10 || 
            cell.y > -mapOffset.y / zoom + (mapRef.current?.clientHeight || 0) / zoom + 10
          ) {
            return null;
          }
          
          return (
            <div
              key={`${cell.x}-${cell.y}`}
              style={{
                left: `${cell.x}%`,
                top: `${cell.y}%`,
                width: '1%',
                height: '1%',
                backgroundColor: getCellColor(cell.type)
              }}
              className="absolute"
            >
              {zoom > 1.5 && getCellIcon(cell.type)}
            </div>
          );
        })}
        
        {/* Render events */}
        {events.map(event => (
          <motion.div
            key={event.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              left: `${event.location.x}%`,
              top: `${event.location.y}%`,
            }}
            className={`absolute w-3 h-3 rounded-full ${getSeverityColor(event.severity)} -ml-1.5 -mt-1.5 cursor-pointer z-20 ${
              selectedEvent?.id === event.id ? 'ring-2 ring-white' : ''
            }`}
            onClick={() => onEventSelect(event)}
          >
            {event.status === 'resolved' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full"></div>
              </div>
            )}
            
            {/* Pulse animation for active critical events */}
            {event.status === 'active' && event.severity === 'critical' && (
              <div className="absolute inset-0">
                <div className="animate-ping absolute inset-0 rounded-full bg-purple-400 opacity-75"></div>
              </div>
            )}
          </motion.div>
        ))}
        
        {/* Render resources */}
        {visibleResources.map(resource => (
          <motion.div
            key={resource.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              left: `${resource.location.x}%`,
              top: `${resource.location.y}%`,
            }}
            className={`absolute w-4 h-4 ${getResourceColor(resource.type)} -ml-2 -mt-2 rounded-sm flex items-center justify-center text-white cursor-pointer z-10 ${
              selectedResource?.id === resource.id ? 'ring-2 ring-white' : ''
            } ${resource.status === 'dispatched' ? 'opacity-50' : ''}`}
            onClick={() => onResourceSelect(resource)}
          >
            {getResourceIcon(resource.type)}
          </motion.div>
        ))}
        
        {/* Connection lines between resources and assigned events */}
        {visibleResources
          .filter(resource => resource.status === 'dispatched' && resource.assignedTo)
          .map(resource => {
            const event = events.find(e => e.id === resource.assignedTo);
            if (!event) return null;
            
            const startX = resource.location.x;
            const startY = resource.location.y;
            const endX = event.location.x;
            const endY = event.location.y;
            
            return (
              <svg
                key={`${resource.id}-${event.id}`}
                className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none"
              >
                <line
                  x1={`${startX}%`}
                  y1={`${startY}%`}
                  x2={`${endX}%`}
                  y2={`${endY}%`}
                  stroke={resource.status === 'dispatched' ? '#6B7280' : '#9CA3AF'}
                  strokeWidth="0.5"
                  strokeDasharray="4,4"
                />
              </svg>
            );
          })}
      </div>
      
      {/* Event details popup */}
      {selectedEvent && (
        <div 
          className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-md z-30"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${getSeverityColor(selectedEvent.severity)} mr-2`}></div>
              <h3 className="font-bold text-gray-900">{selectedEvent.title}</h3>
            </div>
            <button 
              onClick={() => onEventSelect(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mt-2">{selectedEvent.description}</p>
          
          <div className="mt-3">
            <div className="text-xs text-gray-500">受影响系统:</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedEvent.affectedSystems.map(system => (
                <span 
                  key={system}
                  className="px-2 py-0.5 bg-gray-100 rounded-full text-xs"
                >
                  {system === 'traffic' ? '交通' : 
                   system === 'power' ? '电力' : 
                   system === 'emergency' ? '应急' : 
                   system === 'medical' ? '医疗' : system}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mt-3">
            <div className="text-xs text-gray-500">所需资源:</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(selectedEvent.requiredResources).map(([type, amount]) => (
                <span 
                  key={type}
                  className="px-2 py-0.5 bg-gray-100 rounded-full text-xs"
                >
                  {type === 'traffic' ? '交通' : 
                   type === 'power' ? '电力' : 
                   type === 'emergency' ? '应急' : 
                   type === 'medical' ? '医疗' : type}: {amount}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            状态: <span className={`font-medium ${
              selectedEvent.status === 'active' ? 'text-red-600' : 
              selectedEvent.status === 'resolved' ? 'text-green-600' : 
              'text-yellow-600'
            }`}>
              {selectedEvent.status === 'active' ? '活跃' : 
               selectedEvent.status === 'resolved' ? '已解决' : 
               '待处理'}
            </span>
          </div>
        </div>
      )}
      
      {/* Resource details popup */}
      {selectedResource && (
        <div 
          className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-md z-30"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className={`w-4 h-4 ${getResourceColor(selectedResource.type)} rounded-sm flex items-center justify-center mr-2`}>
                {getResourceIcon(selectedResource.type)}
              </div>
              <h3 className="font-bold text-gray-900">{selectedResource.name}</h3>
            </div>
            <button 
              onClick={() => onResourceSelect(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">数量:</span>
              <span className="text-sm font-medium">{selectedResource.quantity}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-sm text-gray-600">状态:</span>
              <span className={`text-sm font-medium ${
                selectedResource.status === 'available' ? 'text-green-600' : 
                selectedResource.status === 'dispatched' ? 'text-blue-600' : 
                'text-red-600'
              }`}>
                {selectedResource.status === 'available' ? '可用' : 
                 selectedResource.status === 'dispatched' ? '已派遣' : 
                 '已耗尽'}
              </span>
            </div>
            {selectedResource.assignedTo && (
              <div className="flex justify-between mt-1">
                <span className="text-sm text-gray-600">分配至:</span>
                <span className="text-sm font-medium">
                  {events.find(e => e.id === selectedResource.assignedTo)?.title || '未知事件'}
                </span>
              </div>
            )}
          </div>
          
          {selectedResource.status === 'available' && selectedEvent && selectedEvent.status === 'active' && (
            <button
              onClick={() => onResourceSelect(null)}
              className="mt-3 w-full py-1 px-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
            >
              派遣至选中事件
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CityMap;