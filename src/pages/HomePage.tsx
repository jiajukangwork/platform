import { motion } from 'framer-motion';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import TeamSection from '../components/TeamSection';
import ContactSection from '../components/ContactSection';
import { ArrowRight, BookOpen, Brain, Compass, FlaskRound as Flask, Trophy, Settings } from 'lucide-react';
import Button from '../components/Button';

const HomePage = () => {
  return (
    <div>
      <HeroSection />
      <FeaturedSection />
      <AboutSection />
      <ResearchHighlights />
      <TeamSection />
      <AdminAccessSection />
      <ContactSection />
    </div>
  );
};

const AdminAccessSection = () => {
  return (
    <section className="py-12 bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex items-center justify-center mb-4"
          >
            <Settings className="w-8 h-8 text-primary-600" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            实验管理系统
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-lg text-gray-600 mb-8"
          >
            访问我们的管理后台，上传和配置基于Pygame的实验
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <Button href="/admin" variant="primary" size="lg">
              进入管理后台
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const FeaturedSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
              探索<span className="text-primary-600">智能决策</span>前沿实验
            </h2>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              我们的平台提供全面的智能决策实验集合，包括经典和现代实验，确保研究结果的一致性和可靠性。
            </p>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              无论您是研究人员、学生，还是对人类决策过程感兴趣的探索者，我们的实验都能为您提供深入的认知科学见解。
            </p>
            <div className="mt-8 space-y-4">
              {featuredExperiments.map((experiment, index) => (
                <motion.div 
                  key={index}
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-primary-600">
                    {experiment.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{experiment.title}</h3>
                    <p className="mt-1 text-gray-600">{experiment.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-10">
              <Button href="/experiments" variant="primary" size="lg">
                查看所有实验
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
          
          <motion.div
            className="relative lg:h-[600px] overflow-hidden rounded-xl shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <img 
              src="https://images.pexels.com/photos/3808904/pexels-photo-3808904.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
              alt="参与者进行决策实验" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col justify-end">
              <div className="p-8">
                <h3 className="text-2xl font-serif font-bold text-white">参与开创性研究</h3>
                <p className="mt-2 text-gray-200">
                  加入全球数千名参与者的行列，共同推进人类决策研究的发展。
                </p>
                <Button 
                  href="/experiments" 
                  variant="primary" 
                  className="mt-4 bg-white text-primary-800 hover:bg-gray-100"
                >
                  立即开始
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ResearchHighlights = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-serif font-bold text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            研究亮点
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
            我们研究团队最新的研究成果和发现，探索人类决策和认知过程的多个方面。
          </motion.p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {researchPapers.map((paper, index) => (
            <motion.div 
              key={index}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {paper.category}
                  </span>
                  <span className="text-sm text-gray-500">{paper.date}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900 leading-tight">{paper.title}</h3>
                <p className="mt-3 text-gray-600 line-clamp-3">{paper.abstract}</p>
                <div className="mt-4 flex items-center">
                  <div className="flex-shrink-0">
                    <img className="h-10 w-10 rounded-full" src={paper.authorImage} alt={paper.author} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{paper.author}</p>
                    <p className="text-xs text-gray-500">{paper.authorRole}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <a 
                    href="#" 
                    className="text-primary-600 hover:text-primary-800 font-medium flex items-center text-sm transition-colors"
                  >
                    阅读全文
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Button href="#" variant="outline">
            查看所有论文
          </Button>
        </div>
      </div>
    </section>
  );
};

const featuredExperiments = [
  {
    icon: <Brain className="h-4 w-4" />,
    title: "人机协作决策",
    description: "研究人类如何与AI系统协作，优化决策过程和结果质量。"
  },
  {
    icon: <Flask className="h-4 w-4" />,
    title: "多智能体模拟",
    description: "通过大规模语言模型模拟群体行为和社会互动。"
  },
  {
    icon: <Compass className="h-4 w-4" />,
    title: "脑机接口交互",
    description: "探索多模态信息融合，提升人机交互的自然性和效率。"
  },
  {
    icon: <Trophy className="h-4 w-4" />,
    title: "认知增强研究",
    description: "研究如何通过AI辅助提升人类认知能力和决策水平。"
  }
];

const researchPapers = [
  {
    title: "人机协作决策中的认知偏差：对比分析",
    abstract: "本研究考察了人类在独立决策与AI辅助决策时认知偏差的差异。结果表明锚定效应和过度自信偏差在两种情况下存在显著差异。",
    author: "张博士",
    authorRole: "首席研究员",
    authorImage: "https://images.pexels.com/photos/762020/pexels-photo-762020.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "2023年6月",
    category: "认知科学"
  },
  {
    title: "多智能体系统中的涌现行为研究",
    abstract: "使用大规模语言模型构建多智能体系统，研究群体决策中的涌现行为和集体智慧形成机制。",
    author: "李研究员",
    authorRole: "高级研究员",
    authorImage: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "2023年4月",
    category: "人工智能"
  },
  {
    title: "脑机接口的多模态信息融合",
    abstract: "探索如何通过多模态信息融合提升脑机接口的交互效果，实现更自然、高效的人机交互体验。",
    author: "王教授",
    authorRole: "脑科学专家",
    authorImage: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    date: "2023年3月",
    category: "脑机接口"
  }
];

export default HomePage;