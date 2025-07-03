import { BarChart2, AlertTriangle, Truck, Zap, Activity, Building } from 'lucide-react';
import { GameEvent } from '../GameInterface';

interface StatusPanelProps {
  cityStatus: {
    traffic: number;
    power: number;
    medical: number;
    emergency: number;
    overall: number;
  };
  events: GameEvent[];
  participantRole: string;
}

const StatusPanel = ({ cityStatus, events, participantRole }: StatusPanelProps) => {
  const getStatusColor = (value: number): string => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    if (value >= 20) return 'bg-red-500';
    return 'bg-purple-600';
  };
  
  const getActiveEventCount = () => {
    return events.filter(e => e.status === 'active').length;
  };
  
  const getResolvedEventCount = () => {
    return events.filter(e => e.status === 'resolved').length;
  };
  
  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'traffic': return <Truck className="w-4 h-4" />;
      case 'power': return <Zap className="w-4 h-4" />;
      case 'medical': return <Activity className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      case 'overall': return <Building className="w-4 h-4" />;
      default: return <BarChart2 className="w-4 h-4" />;
    }
  };
  
  // Determine which statuses to show based on role
  const getVisibleStatuses = () => {
    const statuses = [
      { id: 'overall', name: '整体状态', value: cityStatus.overall },
    ];
    
    // Coordinator sees all statuses
    if (participantRole === 'coordinator') {
      return [
        ...statuses,
        { id: 'traffic', name: '交通系统', value: cityStatus.traffic },
        { id: 'power', name: '电力系统', value: cityStatus.power },
        { id: 'medical', name: '医疗系统', value: cityStatus.medical },
        { id: 'emergency', name: '应急系统', value: cityStatus.emergency },
      ];
    }
    
    // Others see overall and their own system
    return [
      ...statuses,
      { 
        id: participantRole, 
        name: participantRole === 'traffic' ? '交通系统' : 
              participantRole === 'power' ? '电力系统' : 
              participantRole === 'medical' ? '医疗系统' : 
              participantRole === 'emergency' ? '应急系统' : '未知系统', 
        value: cityStatus[participantRole as keyof typeof cityStatus] || 0 
      }
    ];
  };
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mr-1" />
          <span className="text-sm">活跃事件: {getActiveEventCount()}</span>
        </div>
        <div className="flex items-center">
          <BarChart2 className="w-4 h-4 text-green-600 mr-1" />
          <span className="text-sm">已解决: {getResolvedEventCount()}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {getVisibleStatuses().map(status => (
          <div key={status.id} className="flex items-center">
            <div className="mr-1 text-gray-600">
              {getStatusIcon(status.id)}
            </div>
            <div className="flex items-center">
              <span className="text-sm mr-2">{status.name}:</span>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getStatusColor(status.value)}`}
                  style={{ width: `${status.value}%` }}
                ></div>
              </div>
              <span className="text-xs ml-1">{Math.round(status.value)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusPanel;