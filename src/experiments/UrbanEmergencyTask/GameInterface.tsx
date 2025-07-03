import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Building, Map as MapIcon, Radio, AlertTriangle, Clock, 
  MessageSquare, Users, Zap, Cpu, Brain, PauseCircle, PlayCircle, 
  ChevronRight, ChevronLeft, BarChart2, Settings, X, Download, Send
} from 'lucide-react';
import Button from '../../components/Button';
import { ExperimentConfig } from './index';
import { usePhysiologicalSync } from '../../components/PhysiologicalSyncContext';
import CityMap from './components/CityMap';
import EventFeed from './components/EventFeed';
import ResourcePanel from './components/ResourcePanel';
import CommunicationPanel from './components/CommunicationPanel';
import AgentThoughtPanel from './components/AgentThoughtPanel';
import StatusPanel from './components/StatusPanel';

interface GameInterfaceProps {
  config: ExperimentConfig;
  onComplete: () => void;
  onBack: () => void;
}

export interface GameEvent {
  id: string;
  type: 'natural' | 'manmade' | 'system';
  title: string;
  description: string;
  location: { x: number; y: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  status: 'active' | 'pending' | 'resolved';
  affectedSystems: string[];
  requiredResources: Record<string, number>;
}

export interface Resource {
  id: string;
  type: string;
  name: string;
  quantity: number;
  location: { x: number; y: number };
  status: 'available' | 'dispatched' | 'depleted';
  assignedTo?: string;
}

export interface Message {
  id: string;
  sender: string;
  senderRole: string;
  receiver: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  priority: 'normal' | 'high' | 'urgent';
}

export interface AgentThought {
  agentId: string;
  agentRole: string;
  content: string;
  timestamp: number;
  relatedEvents?: string[];
}

const GameInterface = ({ config, onComplete, onBack }: GameInterfaceProps) => {
  const [gameTime, setGameTime] = useState(0); // in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentThoughts, setAgentThoughts] = useState<AgentThought[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [cityStatus, setCityStatus] = useState({
    traffic: 100,
    power: 100,
    medical: 100,
    emergency: 100,
    overall: 100
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showAgentThoughts, setShowAgentThoughts] = useState(true);
  const [showCommunication, setShowCommunication] = useState(true);
  const [mapZoom, setMapZoom] = useState(1);
  const [newMessage, setNewMessage] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState('all');
  
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTimeRef = useRef<number>(Date.now());
  const { sendSyncMarker } = usePhysiologicalSync();

  // Initialize game
  useEffect(() => {
    initializeGame();
    startGameTimer();
    
    // Send game start marker
    sendSyncMarker('game_start', { 
      config,
      startTime: Date.now()
    });
    
    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, []);

  const initializeGame = () => {
    // Initialize resources based on role
    const initialResources = generateInitialResources(config.participantRole);
    setResources(initialResources);
    
    // Initialize welcome message
    const welcomeMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'System',
      senderRole: 'system',
      receiver: config.participantRole,
      content: `欢迎，${getRoleName(config.participantRole)}！城市应急响应系统已激活。请密切关注事件动态，合理调配资源，与团队保持沟通。`,
      timestamp: Date.now(),
      isRead: false,
      priority: 'high'
    };
    
    setMessages([welcomeMessage]);
    
    // Send initialization marker
    sendSyncMarker('game_initialized', {
      resources: initialResources.length,
      config
    });
  };

  const startGameTimer = () => {
    gameStartTimeRef.current = Date.now();
    
    gameTimerRef.current = setInterval(() => {
      if (!isPaused) {
        setGameTime(prev => {
          const newTime = prev + 1;
          
          // Generate events based on time
          if (newTime % 30 === 0) { // Every 30 seconds
            generateRandomEvent(newTime);
          }
          
          // Generate agent thoughts
          if (newTime % 15 === 0) { // Every 15 seconds
            generateAgentThought();
          }
          
          // Update city status
          if (newTime % 10 === 0) { // Every 10 seconds
            updateCityStatus();
          }
          
          // Check for game end
          const gameDurationInSeconds = config.duration * 60;
          if (newTime >= gameDurationInSeconds) {
            endGame();
          }
          
          return newTime;
        });
      }
    }, 1000);
  };

  const generateInitialResources = (role: string): Resource[] => {
    const resources: Resource[] = [];
    
    // Generate resources based on role
    switch (role) {
      case 'traffic':
        resources.push(
          {
            id: 'traffic-signal-1',
            type: 'traffic',
            name: '交通信号控制器',
            quantity: 10,
            location: { x: 25, y: 25 },
            status: 'available'
          },
          {
            id: 'roadblock-1',
            type: 'traffic',
            name: '道路封锁设备',
            quantity: 15,
            location: { x: 30, y: 30 },
            status: 'available'
          },
          {
            id: 'traffic-drone-1',
            type: 'traffic',
            name: '交通监控无人机',
            quantity: 5,
            location: { x: 35, y: 35 },
            status: 'available'
          }
        );
        break;
      case 'power':
        resources.push(
          {
            id: 'generator-1',
            type: 'power',
            name: '应急发电机',
            quantity: 8,
            location: { x: 40, y: 40 },
            status: 'available'
          },
          {
            id: 'repair-crew-1',
            type: 'power',
            name: '电力维修队',
            quantity: 5,
            location: { x: 45, y: 45 },
            status: 'available'
          },
          {
            id: 'power-rerouter-1',
            type: 'power',
            name: '电力重路由设备',
            quantity: 3,
            location: { x: 50, y: 50 },
            status: 'available'
          }
        );
        break;
      case 'emergency':
        resources.push(
          {
            id: 'fire-truck-1',
            type: 'emergency',
            name: '消防车',
            quantity: 6,
            location: { x: 55, y: 55 },
            status: 'available'
          },
          {
            id: 'rescue-team-1',
            type: 'emergency',
            name: '救援队',
            quantity: 10,
            location: { x: 60, y: 60 },
            status: 'available'
          },
          {
            id: 'emergency-drone-1',
            type: 'emergency',
            name: '应急侦察无人机',
            quantity: 4,
            location: { x: 65, y: 65 },
            status: 'available'
          }
        );
        break;
      case 'medical':
        resources.push(
          {
            id: 'ambulance-1',
            type: 'medical',
            name: '救护车',
            quantity: 8,
            location: { x: 70, y: 70 },
            status: 'available'
          },
          {
            id: 'medical-team-1',
            type: 'medical',
            name: '医疗队',
            quantity: 12,
            location: { x: 75, y: 75 },
            status: 'available'
          },
          {
            id: 'medical-supplies-1',
            type: 'medical',
            name: '医疗物资',
            quantity: 20,
            location: { x: 80, y: 80 },
            status: 'available'
          }
        );
        break;
      case 'coordinator':
        // Coordinator has access to limited resources from all categories
        resources.push(
          {
            id: 'coordination-team-1',
            type: 'coordination',
            name: '协调小组',
            quantity: 5,
            location: { x: 50, y: 50 },
            status: 'available'
          },
          {
            id: 'emergency-fund-1',
            type: 'coordination',
            name: '应急资金',
            quantity: 1000000,
            location: { x: 50, y: 50 },
            status: 'available'
          },
          {
            id: 'command-vehicle-1',
            type: 'coordination',
            name: '指挥车',
            quantity: 2,
            location: { x: 50, y: 50 },
            status: 'available'
          }
        );
        break;
    }
    
    return resources;
  };

  const generateRandomEvent = (currentTime: number) => {
    const eventTypes = {
      natural: ['地震', '洪水', '暴风雨', '雷击', '山体滑坡'],
      manmade: ['交通事故', '建筑火灾', '化学泄漏', '电力故障', '燃气泄漏']
    };
    
    // Select event type based on scenario configuration
    let eventType: 'natural' | 'manmade';
    if (config.scenarioType === 'natural') {
      eventType = 'natural';
    } else if (config.scenarioType === 'manmade') {
      eventType = 'manmade';
    } else {
      eventType = Math.random() > 0.5 ? 'natural' : 'manmade';
    }
    
    // Select random event from the type
    const eventNames = eventTypes[eventType];
    const eventName = eventNames[Math.floor(Math.random() * eventNames.length)];
    
    // Generate severity based on difficulty
    let severityChances;
    switch (config.difficulty) {
      case 'easy':
        severityChances = [0.5, 0.3, 0.15, 0.05]; // low, medium, high, critical
        break;
      case 'medium':
        severityChances = [0.3, 0.4, 0.2, 0.1];
        break;
      case 'hard':
        severityChances = [0.1, 0.3, 0.4, 0.2];
        break;
      default:
        severityChances = [0.3, 0.4, 0.2, 0.1];
    }
    
    const randomValue = Math.random();
    let severity: 'low' | 'medium' | 'high' | 'critical';
    if (randomValue < severityChances[0]) {
      severity = 'low';
    } else if (randomValue < severityChances[0] + severityChances[1]) {
      severity = 'medium';
    } else if (randomValue < severityChances[0] + severityChances[1] + severityChances[2]) {
      severity = 'high';
    } else {
      severity = 'critical';
    }
    
    // Generate random location
    const location = {
      x: Math.floor(Math.random() * 100),
      y: Math.floor(Math.random() * 100)
    };
    
    // Generate affected systems
    const systems = ['traffic', 'power', 'medical', 'emergency'];
    const affectedSystems = systems.filter(() => Math.random() > 0.5);
    if (affectedSystems.length === 0) {
      affectedSystems.push(systems[Math.floor(Math.random() * systems.length)]);
    }
    
    // Generate required resources
    const requiredResources: Record<string, number> = {};
    affectedSystems.forEach(system => {
      const resourceAmount = Math.floor(Math.random() * 5) + 1;
      requiredResources[system] = resourceAmount;
    });
    
    // Create event
    const newEvent: GameEvent = {
      id: `event-${Date.now()}`,
      type: eventType,
      title: eventName,
      description: generateEventDescription(eventName, severity, location),
      location,
      severity,
      timestamp: Date.now(),
      status: 'active',
      affectedSystems,
      requiredResources
    };
    
    setEvents(prev => [...prev, newEvent]);
    
    // Send event marker
    sendSyncMarker('event_generated', {
      eventId: newEvent.id,
      eventType,
      severity,
      gameTime: currentTime
    });
    
    // Generate system message about the event
    const eventMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'System',
      senderRole: 'system',
      receiver: config.participantRole,
      content: `新事件: ${eventName}，严重程度: ${getSeverityText(severity)}，位置: (${location.x}, ${location.y})。请立即响应！`,
      timestamp: Date.now(),
      isRead: false,
      priority: severity === 'critical' || severity === 'high' ? 'urgent' : 'high'
    };
    
    setMessages(prev => [...prev, eventMessage]);
  };

  const generateEventDescription = (eventName: string, severity: string, location: {x: number, y: number}): string => {
    const severityTexts = {
      low: '轻微',
      medium: '中等',
      high: '严重',
      critical: '灾难性'
    };
    
    const descriptions = {
      '地震': `城市区域发生${severityTexts[severity as keyof typeof severityTexts]}地震，震中位于坐标(${location.x}, ${location.y})。`,
      '洪水': `城市区域发生${severityTexts[severity as keyof typeof severityTexts]}洪水，受灾中心位于坐标(${location.x}, ${location.y})。`,
      '暴风雨': `城市区域遭遇${severityTexts[severity as keyof typeof severityTexts]}暴风雨，风暴中心位于坐标(${location.x}, ${location.y})。`,
      '雷击': `城市区域发生${severityTexts[severity as keyof typeof severityTexts]}雷击事件，位于坐标(${location.x}, ${location.y})。`,
      '山体滑坡': `城市周边发生${severityTexts[severity as keyof typeof severityTexts]}山体滑坡，位于坐标(${location.x}, ${location.y})。`,
      '交通事故': `城市区域发生${severityTexts[severity as keyof typeof severityTexts]}交通事故，位于坐标(${location.x}, ${location.y})。`,
      '建筑火灾': `城市区域发生${severityTexts[severity as keyof typeof severityTexts]}建筑火灾，位于坐标(${location.x}, ${location.y})。`,
      '化学泄漏': `城市区域发生${severityTexts[severity as keyof typeof severityTexts]}化学泄漏事件，位于坐标(${location.x}, ${location.y})。`,
      '电力故障': `城市区域发生${severityTexts[severity as keyof typeof severityTexts]}电力故障，影响中心位于坐标(${location.x}, ${location.y})。`,
      '燃气泄漏': `城市区域发生${severityTexts[severity as keyof typeof severityTexts]}燃气泄漏事件，位于坐标(${location.x}, ${location.y})。`
    };
    
    return descriptions[eventName as keyof typeof descriptions] || 
      `城市区域发生${severityTexts[severity as keyof typeof severityTexts]}${eventName}事件，位于坐标(${location.x}, ${location.y})。`;
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

  const generateAgentThought = () => {
    if (!config.aiAgents) return;
    
    // Get roles that are not the player's role
    const aiRoles = ['traffic', 'power', 'emergency', 'medical', 'coordinator'].filter(
      role => role !== config.participantRole
    );
    
    // Randomly select an AI role
    const aiRole = aiRoles[Math.floor(Math.random() * aiRoles.length)];
    
    // Get active events
    const activeEvents = events.filter(event => event.status === 'active');
    
    // If no active events, generate a general thought
    if (activeEvents.length === 0) {
      const generalThoughts = [
        '监控城市状况，目前一切正常。',
        '检查资源分配，确保准备就绪。',
        '分析历史数据，预测可能的风险区域。',
        '与其他部门保持联系，确保协调一致。',
        '评估当前响应策略的有效性。'
      ];
      
      const newThought: AgentThought = {
        agentId: `agent-${aiRole}`,
        agentRole: getRoleName(aiRole),
        content: generalThoughts[Math.floor(Math.random() * generalThoughts.length)],
        timestamp: Date.now()
      };
      
      setAgentThoughts(prev => [...prev, newThought]);
      return;
    }
    
    // Select a random active event
    const selectedEvent = activeEvents[Math.floor(Math.random() * activeEvents.length)];
    
    // Generate thought based on role and event
    let thoughtContent = '';
    
    switch (aiRole) {
      case 'traffic':
        if (selectedEvent.affectedSystems.includes('traffic')) {
          thoughtContent = `需要处理${selectedEvent.title}导致的交通中断。正在评估是否需要重新规划交通路线或部署交通管制措施。`;
        } else {
          thoughtContent = `监控${selectedEvent.title}周边的交通状况，确保应急车辆能够顺利通行。`;
        }
        break;
      case 'power':
        if (selectedEvent.affectedSystems.includes('power')) {
          thoughtContent = `${selectedEvent.title}已经影响到电力系统。正在评估损害程度并准备应急电源。`;
        } else {
          thoughtContent = `确保${selectedEvent.title}区域的电力供应稳定，为应急操作提供支持。`;
        }
        break;
      case 'emergency':
        thoughtContent = `正在协调应对${selectedEvent.title}的救援行动。需要评估人员伤亡情况并部署救援资源。`;
        break;
      case 'medical':
        thoughtContent = `准备接收${selectedEvent.title}可能造成的伤员。正在评估医疗资源需求并协调医院容量。`;
        break;
      case 'coordinator':
        thoughtContent = `整合各部门信息，协调应对${selectedEvent.title}。需要确保资源高效分配并监控整体响应效果。`;
        break;
    }
    
    const newThought: AgentThought = {
      agentId: `agent-${aiRole}`,
      agentRole: getRoleName(aiRole),
      content: thoughtContent,
      timestamp: Date.now(),
      relatedEvents: [selectedEvent.id]
    };
    
    setAgentThoughts(prev => [...prev, newThought]);
    
    // Send agent thought marker
    sendSyncMarker('agent_thought', {
      agentRole: aiRole,
      relatedEvents: [selectedEvent.id],
      timestamp: Date.now()
    });
  };

  const updateCityStatus = () => {
    // Calculate status based on active events and resolved events
    const activeEventCount = events.filter(e => e.status === 'active').length;
    const resolvedEventCount = events.filter(e => e.status === 'resolved').length;
    const totalEventCount = events.length;
    
    // Calculate system-specific statuses
    const systemStatuses = {
      traffic: 100,
      power: 100,
      medical: 100,
      emergency: 100
    };
    
    // Reduce status based on active events
    events.forEach(event => {
      if (event.status === 'active') {
        const impactValue = getSeverityImpact(event.severity);
        event.affectedSystems.forEach(system => {
          if (system in systemStatuses) {
            systemStatuses[system as keyof typeof systemStatuses] -= impactValue;
          }
        });
      }
    });
    
    // Ensure values are within 0-100 range
    Object.keys(systemStatuses).forEach(key => {
      systemStatuses[key as keyof typeof systemStatuses] = Math.max(
        0, 
        Math.min(100, systemStatuses[key as keyof typeof systemStatuses])
      );
    });
    
    // Calculate overall status
    const overall = Object.values(systemStatuses).reduce((sum, val) => sum + val, 0) / 4;
    
    setCityStatus({
      ...systemStatuses,
      overall
    });
    
    // Send status update marker
    sendSyncMarker('status_update', {
      systemStatuses,
      overall,
      activeEvents: activeEventCount,
      gameTime
    });
  };

  const getSeverityImpact = (severity: string): number => {
    switch (severity) {
      case 'low': return 5;
      case 'medium': return 15;
      case 'high': return 30;
      case 'critical': return 50;
      default: return 10;
    }
  };

  const handleResourceDispatch = (resourceId: string, eventId: string) => {
    // Find the resource and event
    const resource = resources.find(r => r.id === resourceId);
    const event = events.find(e => e.id === eventId);
    
    if (!resource || !event) return;
    
    // Update resource status
    setResources(prev => prev.map(r => 
      r.id === resourceId 
        ? { ...r, status: 'dispatched', assignedTo: eventId }
        : r
    ));
    
    // Check if event can be resolved
    const dispatchedResources = resources.filter(r => r.assignedTo === eventId);
    const requiredResourceTypes = Object.keys(event.requiredResources);
    
    const canResolve = requiredResourceTypes.every(type => {
      const requiredAmount = event.requiredResources[type];
      const dispatchedAmount = dispatchedResources
        .filter(r => r.type === type)
        .reduce((sum, r) => sum + r.quantity, 0);
      
      return dispatchedAmount >= requiredAmount;
    });
    
    // If can resolve, update event status
    if (canResolve) {
      setEvents(prev => prev.map(e => 
        e.id === eventId 
          ? { ...e, status: 'resolved' }
          : e
      ));
      
      // Generate system message
      const resolveMessage: Message = {
        id: `msg-${Date.now()}`,
        sender: 'System',
        senderRole: 'system',
        receiver: config.participantRole,
        content: `事件"${event.title}"已成功解决！感谢您的高效处理。`,
        timestamp: Date.now(),
        isRead: false,
        priority: 'normal'
      };
      
      setMessages(prev => [...prev, resolveMessage]);
      
      // Send event resolved marker
      sendSyncMarker('event_resolved', {
        eventId,
        resourcesUsed: dispatchedResources.map(r => r.id),
        gameTime
      });
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: `msg-${Date.now()}`,
      sender: config.participantRole,
      senderRole: getRoleName(config.participantRole),
      receiver: selectedReceiver,
      content: newMessage,
      timestamp: Date.now(),
      isRead: true,
      priority: 'normal'
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // Send message marker
    sendSyncMarker('message_sent', {
      messageId: message.id,
      receiver: selectedReceiver,
      gameTime
    });
    
    // If communication mode is limited, simulate delay for AI response
    if (config.communicationMode === 'limited' || config.communicationMode === 'hierarchical') {
      setTimeout(() => {
        generateAIResponse(message);
      }, 5000 + Math.random() * 5000); // 5-10 second delay
    } else {
      // Immediate response in full communication mode
      generateAIResponse(message);
    }
  };

  const generateAIResponse = (userMessage: Message) => {
    if (!config.aiAgents) return;
    
    // Only respond if the message was directed to an AI agent
    if (userMessage.receiver === 'all' || userMessage.receiver === config.participantRole) return;
    
    const responseTemplates = [
      `收到您的消息。我们正在处理${events.length > 0 ? events[0].title : '当前事件'}。`,
      `感谢您的信息。我们将优先考虑您的请求。`,
      `正在按照您的建议调整资源分配。`,
      `已收到。我们需要额外的资源来处理这个情况。`,
      `正在协调团队响应。请保持通信畅通。`
    ];
    
    const response: Message = {
      id: `msg-${Date.now()}`,
      sender: userMessage.receiver,
      senderRole: getRoleName(userMessage.receiver),
      receiver: config.participantRole,
      content: responseTemplates[Math.floor(Math.random() * responseTemplates.length)],
      timestamp: Date.now(),
      isRead: false,
      priority: 'normal'
    };
    
    setMessages(prev => [...prev, response]);
    
    // Send AI response marker
    sendSyncMarker('ai_response', {
      messageId: response.id,
      inResponseTo: userMessage.id,
      gameTime
    });
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
    
    // Send pause toggle marker
    sendSyncMarker('game_pause_toggle', {
      isPaused: !isPaused,
      gameTime
    });
  };

  const endGame = () => {
    // Clear game timer
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
    }
    
    // Calculate final score
    const resolvedEvents = events.filter(e => e.status === 'resolved').length;
    const totalEvents = events.length;
    const resolvedPercentage = totalEvents > 0 ? (resolvedEvents / totalEvents) * 100 : 100;
    
    // Send game end marker
    sendSyncMarker('game_end', {
      gameTime,
      cityStatus,
      resolvedEvents,
      totalEvents,
      resolvedPercentage
    });
    
    // Show end game message
    const endMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'System',
      senderRole: 'system',
      receiver: config.participantRole,
      content: `实验结束！您成功解决了${resolvedEvents}个事件，占总事件数的${resolvedPercentage.toFixed(1)}%。城市系统状态：${cityStatus.overall.toFixed(1)}%。`,
      timestamp: Date.now(),
      isRead: false,
      priority: 'urgent'
    };
    
    setMessages(prev => [...prev, endMessage]);
    
    // Notify parent component
    setTimeout(() => {
      onComplete();
    }, 5000);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRoleName = (roleId: string): string => {
    switch (roleId) {
      case 'traffic': return '交通调度员';
      case 'power': return '电力管理员';
      case 'emergency': return '应急响应协调员';
      case 'medical': return '医疗资源调配员';
      case 'coordinator': return '中央协调员';
      case 'system': return '系统';
      case 'all': return '所有人';
      default: return roleId;
    }
  };

  const getTeamMembers = () => {
    const allRoles = ['traffic', 'power', 'emergency', 'medical', 'coordinator'];
    return allRoles.filter(role => role !== config.participantRole);
  };

  return (
    <div className="bg-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Top Bar */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="text" onClick={onBack} className="text-white mr-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            退出实验
          </Button>
          <div className="flex items-center">
            <Building className="w-5 h-5 mr-2" />
            <h1 className="text-lg font-bold">城市应急任务</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span className="font-mono">{formatTime(gameTime)} / {formatTime(config.duration * 60)}</span>
          </div>
          
          <button 
            onClick={togglePause}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            {isPaused ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-13rem)]">
        {/* Left Panel - Map and Events */}
        <div className="w-2/3 flex flex-col border-r border-gray-200">
          {/* Map */}
          <div className="h-2/3 border-b border-gray-200 relative">
            <div className="absolute top-2 right-2 z-10 flex space-x-2">
              <button 
                onClick={() => setMapZoom(prev => Math.max(0.5, prev - 0.1))}
                className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setMapZoom(prev => Math.min(2, prev + 0.1))}
                className="p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <CityMap 
              events={events}
              resources={resources}
              selectedEvent={selectedEvent}
              selectedResource={selectedResource}
              zoom={mapZoom}
              onEventSelect={setSelectedEvent}
              onResourceSelect={setSelectedResource}
              participantRole={config.participantRole}
            />
          </div>
          
          {/* Events Feed */}
          <div className="h-1/3 overflow-y-auto">
            <EventFeed 
              events={events}
              selectedEvent={selectedEvent}
              onEventSelect={setSelectedEvent}
              resources={resources}
              onResourceDispatch={handleResourceDispatch}
              participantRole={config.participantRole}
            />
          </div>
        </div>
        
        {/* Right Panel - Resources, Communication, Agent Thoughts */}
        <div className="w-1/3 flex flex-col">
          {/* Resources */}
          <div className="h-1/3 border-b border-gray-200">
            <ResourcePanel 
              resources={resources}
              selectedResource={selectedResource}
              onResourceSelect={setSelectedResource}
              selectedEvent={selectedEvent}
              onResourceDispatch={handleResourceDispatch}
              participantRole={config.participantRole}
            />
          </div>
          
          {/* Communication */}
          <div className="h-1/3 border-b border-gray-200">
            <div className="flex justify-between items-center p-2 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium text-gray-700 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                通信中心
              </h3>
              <button 
                onClick={() => setShowCommunication(!showCommunication)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                {showCommunication ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
            
            <AnimatePresence>
              {showCommunication && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <CommunicationPanel 
                    messages={messages}
                    newMessage={newMessage}
                    setNewMessage={setNewMessage}
                    selectedReceiver={selectedReceiver}
                    setSelectedReceiver={setSelectedReceiver}
                    onSendMessage={handleSendMessage}
                    teamMembers={getTeamMembers()}
                    communicationMode={config.communicationMode}
                    participantRole={config.participantRole}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Agent Thoughts */}
          <div className="h-1/3">
            <div className="flex justify-between items-center p-2 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium text-gray-700 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                AI代理思考
              </h3>
              <button 
                onClick={() => setShowAgentThoughts(!showAgentThoughts)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                {showAgentThoughts ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
            
            <AnimatePresence>
              {showAgentThoughts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <AgentThoughtPanel 
                    thoughts={agentThoughts}
                    events={events}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-200 p-2">
        <StatusPanel 
          cityStatus={cityStatus}
          events={events}
          participantRole={config.participantRole}
        />
      </div>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">设置</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={showAgentThoughts}
                      onChange={() => setShowAgentThoughts(!showAgentThoughts)}
                      className="mr-2"
                    />
                    显示AI代理思考
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showCommunication}
                      onChange={() => setShowCommunication(!showCommunication)}
                      className="mr-2"
                    />
                    显示通信面板
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    地图缩放
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={mapZoom}
                    onChange={(e) => setMapZoom(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="w-full mb-2"
                    onClick={() => {
                      // Export game data
                      const gameData = {
                        config,
                        events,
                        resources,
                        messages,
                        agentThoughts,
                        cityStatus,
                        gameTime,
                        timestamp: Date.now()
                      };
                      
                      const blob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `urban-emergency-data-${Date.now()}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      // Send data export marker
                      sendSyncMarker('data_export', {
                        gameTime,
                        eventsCount: events.length,
                        resolvedEvents: events.filter(e => e.status === 'resolved').length
                      });
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    导出实验数据
                  </Button>
                  
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      setShowSettings(false);
                      endGame();
                    }}
                  >
                    结束实验
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameInterface;