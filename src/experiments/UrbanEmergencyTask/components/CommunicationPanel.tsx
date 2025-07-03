import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, AlertCircle } from 'lucide-react';
import { Message } from '../GameInterface';

interface CommunicationPanelProps {
  messages: Message[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  selectedReceiver: string;
  setSelectedReceiver: (receiver: string) => void;
  onSendMessage: () => void;
  teamMembers: string[];
  communicationMode: string;
  participantRole: string;
}

const CommunicationPanel = ({ 
  messages, 
  newMessage, 
  setNewMessage,
  selectedReceiver,
  setSelectedReceiver,
  onSendMessage,
  teamMembers,
  communicationMode,
  participantRole
}: CommunicationPanelProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const getMessageStyle = (message: Message): string => {
    if (message.sender === 'System') {
      return 'bg-yellow-50 border-yellow-200';
    }
    
    if (message.sender === participantRole) {
      return 'bg-primary-50 border-primary-200 ml-auto';
    }
    
    return 'bg-gray-50 border-gray-200';
  };
  
  const getPriorityStyle = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getAvailableReceivers = () => {
    // In hierarchical mode, coordinator can talk to everyone, others can only talk to coordinator
    if (communicationMode === 'hierarchical') {
      if (participantRole === 'coordinator') {
        return teamMembers;
      } else {
        return ['coordinator'];
      }
    }
    
    // In limited mode, can talk to everyone but with restrictions (handled elsewhere)
    return teamMembers;
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
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {messages.filter(msg => 
            msg.receiver === participantRole || 
            msg.receiver === 'all' || 
            msg.sender === participantRole
          ).map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] rounded-lg border p-2 ${getMessageStyle(message)}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-gray-700">
                  {message.sender === participantRole ? '我' : getRoleName(message.sender)}
                  {message.receiver !== 'all' && message.sender !== participantRole && 
                    ` → ${message.receiver === participantRole ? '我' : getRoleName(message.receiver)}`}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              {message.priority !== 'normal' && (
                <div className="mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1 text-yellow-600" />
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${getPriorityStyle(message.priority)}`}>
                    {message.priority === 'urgent' ? '紧急' : '重要'}
                  </span>
                </div>
              )}
              
              <p className="mt-1 text-sm whitespace-pre-wrap">{message.content}</p>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-2 border-t border-gray-200">
        <div className="flex mb-2">
          <select
            value={selectedReceiver}
            onChange={(e) => setSelectedReceiver(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 mr-2"
          >
            <option value="all">所有人</option>
            {getAvailableReceivers().map(member => (
              <option key={member} value={member}>
                {getRoleName(member)}
              </option>
            ))}
          </select>
          
          {communicationMode === 'limited' && (
            <div className="text-xs text-yellow-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              通信受限
            </div>
          )}
        </div>
        
        <div className="flex">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 resize-none"
            rows={2}
          />
          <button
            onClick={onSendMessage}
            disabled={!newMessage.trim()}
            className="bg-primary-600 text-white px-3 rounded-r-md hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunicationPanel;