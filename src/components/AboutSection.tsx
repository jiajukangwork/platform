import { motion } from 'framer-motion';
import { Brain, Atom, Database, Users, BookOpen, LineChart } from 'lucide-react';

const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-serif font-bold text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            关于我们的研究平台
          </motion.h2>
          <motion.div 
            className="w-24 h-1 bg-primary-600 mx-auto my-5"
            initial={{ opacity: 0, width: 0 }}
            whileInView={{ opacity: 1, width: 96 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          ></motion.div>
          <motion.p 
            className="text-lg text-gray-600 mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            我们是一个创新型研究平台，专注于人类决策建模、多智能体模拟和脑机接口多模态融合研究，致力于推动人工智能与人类认知的深度融合。
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 0.1}
            />
          ))}
        </div>
        
        <div className="mt-16 bg-gray-50 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">我们的使命</h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
                通过先进的人工智能技术和多模态交互系统，我们致力于深入理解人类决策过程，构建智能化的人机协作模式。
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                我们利用大规模语言模型和智能体技术，模拟复杂的社会互动场景，推动人工智能系统的进步。
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                  <span className="text-sm text-gray-700">实证研究</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                  <span className="text-sm text-gray-700">人工智能集成</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                  <span className="text-sm text-gray-700">社会模拟</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                  <span className="text-sm text-gray-700">跨领域研究</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="relative h-64 md:h-full rounded-xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <img 
                src="https://images.pexels.com/photos/8438923/pexels-photo-8438923.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="研究团队讨论结果" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  delay: number;
}) => {
  return (
    <motion.div 
      className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

const features = [
  {
    icon: Brain,
    title: "人类决策建模",
    description: "通过先进的认知模型和实验方法，深入研究人类决策过程，构建精确的行为预测模型。"
  },
  {
    icon: Atom,
    title: "多智能体模拟",
    description: "利用大规模语言模型和智能体技术，模拟复杂的社会互动场景，研究群体决策行为。"
  },
  {
    icon: Database,
    title: "多模态交互",
    description: "整合脑机接口与多模态信息，实现人机自然交互，提升智能系统的理解和响应能力。"
  },
  {
    icon: Users,
    title: "人机协作研究",
    description: "探索人类与人工智能系统的协作模式，优化交互效率和决策质量。"
  },
  {
    icon: BookOpen,
    title: "教育资源",
    description: "提供丰富的学习资源，涵盖实验心理学、人工智能和多智能体模拟方法论。"
  },
  {
    icon: LineChart,
    title: "数据分析",
    description: "运用先进的分析工具，深入挖掘实验数据，提取有价值的行为模式和决策规律。"
  }
];

export default AboutSection;