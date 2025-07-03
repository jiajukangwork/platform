import React from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import Button from './Button';
import { 
  Brain, 
  Network, 
  Cpu, 
  Users, 
  Sparkles, 
  Zap,
  Waves,
  Share2,
  LineChart,
  GitBranch,
  Database,
  Activity
} from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 pt-32 pb-20 text-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight">
              智能决策与
              <span className="text-primary-300">多模态交互</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-200 leading-relaxed max-w-xl">
              我们致力于人类决策建模、多智能体模拟和脑机接口多模态融合研究，打造下一代人工智能交互平台。
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                size="lg" 
                href="/experiments"
                className="border-white text-white hover:bg-white/10 border-2"
              >
                开始实验
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                href="/#about"
                className="border-white text-white hover:bg-white/10 border-2"
              >
                了解更多
              </Button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden md:block"
          >
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <InteractiveRadialChart />
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      </div>
    </section>
  );
};

const platformFeatures = [
  {
    id: 'decision-modeling',
    label: '人类决策建模',
    value: 90,
    color: '#60A5FA',
    icon: Brain,
    description: '深入研究人类决策过程',
    details: [
      { icon: LineChart, text: '行为数据分析' },
      { icon: GitBranch, text: '决策路径追踪' },
      { icon: Activity, text: '实时认知评估' }
    ],
    metrics: {
      accuracy: 95,
      speed: 88,
      reliability: 92
    }
  },
  {
    id: 'multi-agent',
    label: '多智能体模拟',
    value: 85,
    color: '#34D399',
    icon: Network,
    description: '复杂社会互动模拟',
    details: [
      { icon: Users, text: '群体行为建模' },
      { icon: Share2, text: '智能体交互' },
      { icon: Database, text: '行为数据存储' }
    ],
    metrics: {
      scalability: 90,
      complexity: 85,
      efficiency: 88
    }
  },
  {
    id: 'brain-interface',
    label: '脑机接口融合',
    value: 80,
    color: '#F472B6',
    icon: Cpu,
    description: '多模态信息整合',
    details: [
      { icon: Waves, text: '脑电信号处理' },
      { icon: Sparkles, text: '模态融合优化' },
      { icon: Zap, text: '实时反馈调节' }
    ],
    metrics: {
      precision: 92,
      latency: 95,
      stability: 88
    }
  }
];

const InteractiveRadialChart = () => {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  
  const rotation = useMotionValue(0);
  const scale = useTransform(rotation, [0, 360], [0.95, 1]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRotating && !hoveredFeature && !selectedFeature) {
      interval = setInterval(() => {
        rotation.set((rotation.get() + 0.3) % 360);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isRotating, hoveredFeature, selectedFeature]);

  const getSegmentPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const start = polarToCartesian(outerRadius, startAngle);
    const end = polarToCartesian(outerRadius, endAngle);
    const innerStart = polarToCartesian(innerRadius, startAngle);
    const innerEnd = polarToCartesian(innerRadius, endAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `
      M ${start.x} ${start.y}
      A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}
      L ${innerEnd.x} ${innerEnd.y}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}
      Z
    `;
  };

  const polarToCartesian = (radius: number, angle: number) => {
    const angleInRadians = ((angle - 90) * Math.PI) / 180;
    return {
      x: radius * Math.cos(angleInRadians),
      y: radius * Math.sin(angleInRadians)
    };
  };

  return (
    <div className="relative w-full h-full">
      <motion.div 
        className="w-full h-full"
        style={{ scale }}
        onHoverStart={() => setIsRotating(false)}
        onHoverEnd={() => !selectedFeature && setIsRotating(true)}
      >
        <svg className="w-full h-full" viewBox="-100 -100 200 200">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)"/>
              <stop offset="100%" stopColor="rgba(255,255,255,0.05)"/>
            </linearGradient>
          </defs>

          <motion.g style={{ rotate: rotation }}>
            {platformFeatures.map((feature, index) => {
              const angle = 360 / platformFeatures.length;
              const startAngle = index * angle;
              const endAngle = startAngle + angle;
              
              const isActive = hoveredFeature === feature.id || selectedFeature === feature.id;
              
              return (
                <g key={feature.id}>
                  <motion.path
                    d={getSegmentPath(startAngle, endAngle, 50, 90)}
                    fill={feature.color}
                    opacity={isActive ? 0.9 : 0.6}
                    filter="url(#glow)"
                    initial={{ scale: 1 }}
                    animate={{ 
                      scale: isActive ? 1.05 : 1,
                      opacity: isActive ? 0.9 : 0.6
                    }}
                    whileHover={{ scale: 1.05, opacity: 0.9 }}
                    onHoverStart={() => setHoveredFeature(feature.id)}
                    onHoverEnd={() => setHoveredFeature(null)}
                    onClick={() => setSelectedFeature(
                      selectedFeature === feature.id ? null : feature.id
                    )}
                    style={{ cursor: 'pointer' }}
                  />
                  
                  <motion.path
                    d={getSegmentPath(startAngle, endAngle, 30, 45)}
                    fill={feature.color}
                    opacity={isActive ? 0.7 : 0.4}
                    animate={{ opacity: isActive ? 0.7 : 0.4 }}
                  />
                  
                  {/* Feature Icon */}
                  <motion.g
                    transform={`rotate(${startAngle + angle/2}) translate(70,0) rotate(-${startAngle + angle/2})`}
                    animate={{
                      scale: isActive ? 1.2 : 1,
                      opacity: isActive ? 1 : 0.8
                    }}
                  >
                    <circle r="12" fill="rgba(255,255,255,0.1)" />
                    <g transform="translate(-8,-8)">
                      {React.createElement(feature.icon, {
                        size: 16,
                        className: "text-white"
                      })}
                    </g>
                  </motion.g>
                </g>
              );
            })}
            
            {/* Center Circle */}
            <motion.circle
              r="25"
              fill="url(#gradient)"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              initial={{ scale: 1 }}
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.g>
        </svg>
      </motion.div>

      {/* Feature Details Panel */}
      <AnimatePresence>
        {(selectedFeature || hoveredFeature) && (
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                       bg-white/10 backdrop-blur-lg rounded-lg p-6 w-64"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {(() => {
              const feature = platformFeatures.find(
                f => f.id === (selectedFeature || hoveredFeature)
              )!;
              const Icon = feature.icon;
              
              return (
                <>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: feature.color + '33' }}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{feature.label}</h3>
                      <p className="text-sm text-white/80">{feature.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    {feature.details.map((detail, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <detail.icon className="w-4 h-4 text-white/70" />
                        <span className="text-sm text-white/70">{detail.text}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(feature.metrics).map(([key, value]) => (
                      <div key={key} className="relative pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/70 capitalize">
                            {key}
                          </span>
                          <span className="text-xs text-white/90">
                            {value}%
                          </span>
                        </div>
                        <div className="overflow-hidden h-1 rounded-full bg-white/20">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: feature.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroSection;