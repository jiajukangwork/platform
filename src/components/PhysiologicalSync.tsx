import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wifi, WifiOff, Brain, Heart, Zap, X, Settings, RefreshCw } from 'lucide-react';
import Button from './Button';

interface PhysiologicalSyncProps {
  experimentId: string;
  participantId?: string;
  onSyncEvent?: (eventType: string, timestamp: number, metadata?: any) => void;
  className?: string;
}

export type SensorType = 'eeg' | 'fmri' | 'ecg' | 'gsr' | 'eye';
export type SensorStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SensorInfo {
  type: SensorType;
  name: string;
  status: SensorStatus;
  lastSync?: number;
  sampleRate?: number;
  icon: React.ReactNode;
}

const PhysiologicalSync = ({ 
  experimentId, 
  participantId = 'anonymous', 
  onSyncEvent,
  className = ''
}: PhysiologicalSyncProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [sensors, setSensors] = useState<SensorInfo[]>([
    { type: 'eeg', name: 'EEG', status: 'disconnected', icon: <Brain className="w-4 h-4" /> },
    { type: 'fmri', name: 'fMRI', status: 'disconnected', icon: <Activity className="w-4 h-4" /> },
    { type: 'ecg', name: 'ECG', status: 'disconnected', icon: <Heart className="w-4 h-4" /> },
    { type: 'gsr', name: 'GSR', status: 'disconnected', icon: <Zap className="w-4 h-4" /> },
  ]);
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTime = useRef<number>(Date.now());
  const websocketRef = useRef<WebSocket | null>(null);
  
  // Configuration options
  const [config, setConfig] = useState({
    syncInterval: 5000, // ms
    websocketUrl: '',
    autoSync: false,
    enabledSensors: ['eeg', 'fmri'] as SensorType[],
    markerPort: '',
    participantId: participantId
  });

  useEffect(() => {
    // Initialize session
    sessionStartTime.current = Date.now();
    
    // Clean up on unmount
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (config.autoSync && !syncIntervalRef.current) {
      startAutoSync();
    } else if (!config.autoSync && syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, [config.autoSync, config.syncInterval]);

  const connectWebSocket = () => {
    if (!config.websocketUrl) return;
    
    try {
      // Close existing connection if any
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      
      // Update sensor statuses to connecting
      setSensors(prev => prev.map(sensor => 
        config.enabledSensors.includes(sensor.type) 
          ? { ...sensor, status: 'connecting' } 
          : sensor
      ));
      
      // Create new WebSocket connection
      const ws = new WebSocket(config.websocketUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        // Send initial configuration
        ws.send(JSON.stringify({
          type: 'config',
          experimentId,
          participantId: config.participantId,
          enabledSensors: config.enabledSensors,
          timestamp: Date.now()
        }));
        
        // Update sensor statuses
        setSensors(prev => prev.map(sensor => 
          config.enabledSensors.includes(sensor.type) 
            ? { ...sensor, status: 'connected' } 
            : { ...sensor, status: 'disconnected' }
        ));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'sync_ack') {
            // Handle sync acknowledgment
            setLastSyncTime(data.timestamp);
            
            // Update sensor info if provided
            if (data.sensors) {
              setSensors(prev => prev.map(sensor => {
                const updatedInfo = data.sensors.find((s: any) => s.type === sensor.type);
                return updatedInfo 
                  ? { ...sensor, ...updatedInfo } 
                  : sensor;
              }));
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setSensors(prev => prev.map(sensor => 
          config.enabledSensors.includes(sensor.type) 
            ? { ...sensor, status: 'error' } 
            : sensor
        ));
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setSensors(prev => prev.map(sensor => 
          config.enabledSensors.includes(sensor.type) 
            ? { ...sensor, status: 'disconnected' } 
            : sensor
        ));
      };
      
      websocketRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setSensors(prev => prev.map(sensor => 
        config.enabledSensors.includes(sensor.type) 
          ? { ...sensor, status: 'error' } 
          : sensor
      ));
    }
  };

  const sendSyncMarker = (eventType: string = 'manual_sync', metadata?: any) => {
    setIsSyncing(true);
    const timestamp = Date.now();
    const relativeTimestamp = timestamp - sessionStartTime.current;
    
    // Send sync marker via WebSocket if connected
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'sync_marker',
        experimentId,
        participantId: config.participantId,
        eventType,
        timestamp,
        relativeTimestamp,
        metadata
      }));
    }
    
    // Send sync marker via callback if provided
    if (onSyncEvent) {
      onSyncEvent(eventType, timestamp, metadata);
    }
    
    // Update UI
    setSyncCount(prev => prev + 1);
    setLastSyncTime(timestamp);
    
    // Reset syncing state after animation
    setTimeout(() => setIsSyncing(false), 500);
  };

  const startAutoSync = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    
    syncIntervalRef.current = setInterval(() => {
      sendSyncMarker('auto_sync');
    }, config.syncInterval);
  };

  const toggleConnection = () => {
    if (sensors.some(s => s.status === 'connected')) {
      // Disconnect
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      
      setSensors(prev => prev.map(sensor => ({
        ...sensor,
        status: 'disconnected'
      })));
    } else {
      // Connect
      connectWebSocket();
    }
  };

  const getSensorStatusColor = (status: SensorStatus): string => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-lg p-4 mb-2"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">生理信号同步配置</h3>
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  参与者ID
                </label>
                <input
                  type="text"
                  value={config.participantId}
                  onChange={(e) => setConfig(prev => ({ ...prev, participantId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="输入参与者ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WebSocket URL
                </label>
                <input
                  type="text"
                  value={config.websocketUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, websocketUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="ws://localhost:8080"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  同步间隔 (ms)
                </label>
                <input
                  type="number"
                  value={config.syncInterval}
                  onChange={(e) => setConfig(prev => ({ ...prev, syncInterval: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  min="100"
                  step="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  启用传感器
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sensors.map(sensor => (
                    <label key={sensor.type} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={config.enabledSensors.includes(sensor.type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfig(prev => ({
                              ...prev,
                              enabledSensors: [...prev.enabledSensors, sensor.type]
                            }));
                          } else {
                            setConfig(prev => ({
                              ...prev,
                              enabledSensors: prev.enabledSensors.filter(s => s !== sensor.type)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      {sensor.name}
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center">
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={config.autoSync}
                    onChange={(e) => setConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
                    className="mr-2"
                  />
                  自动同步
                </label>
              </div>
              
              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleConnection}
                  className="flex items-center"
                >
                  {sensors.some(s => s.status === 'connected') ? (
                    <>
                      <WifiOff className="w-4 h-4 mr-1" />
                      断开连接
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4 mr-1" />
                      连接
                    </>
                  )}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    sendSyncMarker('config_sync');
                    setIsConfigOpen(false);
                  }}
                >
                  保存并同步
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: 10 }}
            className="bg-white rounded-lg shadow-md p-4 mb-2 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-900">生理信号同步状态</h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsConfigOpen(true)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => sendSyncMarker('manual_sync')}
                  className="text-primary-600 hover:text-primary-800"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {sensors.map(sensor => (
                <div key={sensor.type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className={`mr-2 ${getSensorStatusColor(sensor.status)}`}>
                      {sensor.icon}
                    </span>
                    <span>{sensor.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs ${getSensorStatusColor(sensor.status)}`}>
                      {sensor.status === 'connected' ? '已连接' : 
                       sensor.status === 'connecting' ? '连接中' : 
                       sensor.status === 'error' ? '错误' : '未连接'}
                    </span>
                    {sensor.lastSync && (
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(sensor.lastSync).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <div>同步次数: {syncCount}</div>
              <div>
                {lastSyncTime ? `上次同步: ${new Date(lastSyncTime).toLocaleTimeString()}` : '未同步'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        className={`flex items-center space-x-2 rounded-full shadow-md px-4 py-2 ${
          isExpanded ? 'bg-primary-600 text-white' : 'bg-white text-gray-700'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Activity className={`w-5 h-5 ${isSyncing ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-medium">生理信号同步</span>
        {sensors.some(s => s.status === 'connected') && (
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
            <span className="relative rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
};

export default PhysiologicalSync;