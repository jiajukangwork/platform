import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SyncEvent {
  eventType: string;
  timestamp: number;
  relativeTimestamp: number;
  metadata?: any;
}

interface PhysiologicalSyncContextType {
  isConnected: boolean;
  lastSyncTime: number | null;
  syncCount: number;
  sessionStartTime: number;
  sendSyncMarker: (eventType: string, metadata?: any) => void;
  syncEvents: SyncEvent[];
  experimentId: string;
  participantId: string;
  setParticipantId: (id: string) => void;
}

const PhysiologicalSyncContext = createContext<PhysiologicalSyncContextType | undefined>(undefined);

interface PhysiologicalSyncProviderProps {
  children: ReactNode;
  experimentId: string;
  initialParticipantId?: string;
}

export const PhysiologicalSyncProvider = ({ 
  children, 
  experimentId,
  initialParticipantId = 'anonymous'
}: PhysiologicalSyncProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncCount, setSyncCount] = useState(0);
  const [sessionStartTime] = useState(Date.now());
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);
  const [participantId, setParticipantId] = useState(initialParticipantId);

  // Initialize session
  useEffect(() => {
    // Record session start event
    const startEvent: SyncEvent = {
      eventType: 'session_start',
      timestamp: sessionStartTime,
      relativeTimestamp: 0,
      metadata: { experimentId, participantId }
    };
    
    setSyncEvents([startEvent]);
    
    // Clean up on unmount
    return () => {
      // Record session end event
      const endTime = Date.now();
      const endEvent: SyncEvent = {
        eventType: 'session_end',
        timestamp: endTime,
        relativeTimestamp: endTime - sessionStartTime,
        metadata: { 
          experimentId, 
          participantId,
          sessionDuration: endTime - sessionStartTime,
          syncCount: syncCount + 1
        }
      };
      
      // In a real implementation, we might want to ensure this gets sent
      console.log('Session ended:', endEvent);
    };
  }, []);

  const sendSyncMarker = (eventType: string, metadata?: any) => {
    const timestamp = Date.now();
    const relativeTimestamp = timestamp - sessionStartTime;
    
    const syncEvent: SyncEvent = {
      eventType,
      timestamp,
      relativeTimestamp,
      metadata: {
        ...metadata,
        experimentId,
        participantId
      }
    };
    
    // Add to local events
    setSyncEvents(prev => [...prev, syncEvent]);
    
    // Update state
    setLastSyncTime(timestamp);
    setSyncCount(prev => prev + 1);
    
    // In a real implementation, this would send the marker to external systems
    console.log('Sync marker sent:', syncEvent);
    
    return syncEvent;
  };

  return (
    <PhysiologicalSyncContext.Provider
      value={{
        isConnected,
        lastSyncTime,
        syncCount,
        sessionStartTime,
        sendSyncMarker,
        syncEvents,
        experimentId,
        participantId,
        setParticipantId
      }}
    >
      {children}
    </PhysiologicalSyncContext.Provider>
  );
};

export const usePhysiologicalSync = () => {
  const context = useContext(PhysiologicalSyncContext);
  if (context === undefined) {
    throw new Error('usePhysiologicalSync must be used within a PhysiologicalSyncProvider');
  }
  return context;
};