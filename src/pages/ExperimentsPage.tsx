import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowUpRight, Star, BookOpen, Clock, BarChart3, GitFork, Calendar, RefreshCw } from 'lucide-react';
import Button from '../components/Button';
import experimentsData from '../data/experiments.json';

interface Experiment {
  id: number;
  title: string;
  authors: string;
  description: string;
  category: string;
  tags: string[];
  duration: string;
  difficulty: string;
  citations: number;
  isPopular: boolean;
  version: string;
  releaseDate: string;
  lastUpdated: string;
  relatedPapers: string[];
  license: string;
  repository: string;
  contactInfo: string;
  experimentPath: string;
}

const ExperimentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [displayedExperiments, setDisplayedExperiments] = useState<Experiment[]>([]);
  
  useEffect(() => {
    setExperiments(experimentsData?.experiments || []);
  }, []);

  useEffect(() => {
    const filtered = experiments.filter(experiment => {
      const matchesSearch = experiment.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         experiment.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         experiment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
      const matchesFilter = activeFilter === 'all' || experiment.category === activeFilter;
    
      return matchesSearch && matchesFilter;
    });

    setDisplayedExperiments(filtered.slice(0, 20));
  }, [searchTerm, activeFilter, experiments]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="pt-24 pb-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-12"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-900">
            智能决策实验
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            探索我们设计的经典和现代实验，研究人类决策过程与人工智能交互。
          </p>
        </motion.div>
        
        <motion.div 
          className="max-w-4xl mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="搜索实验（按标题、作者或关键词）..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="relative inline-block">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                className="appearance-none pl-10 pr-8 py-3 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <option value="all">所有类别</option>
                <option value="cognitive">认知心理学</option>
                <option value="behavioral">行为经济学</option>
                <option value="social">社会心理学</option>
                <option value="ethical">伦理决策</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
        
        <div className="mt-8">
          <motion.div 
            className="font-medium text-lg mb-6 text-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            显示 {displayedExperiments.length} 个实验
            {displayedExperiments.length < experiments.filter(e => 
              (activeFilter === 'all' || e.category === activeFilter) && 
              (e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
               e.authors.toLowerCase().includes(searchTerm.toLowerCase()) || 
               e.description.toLowerCase().includes(searchTerm.toLowerCase()))
            ).length && ' (限制显示前20个结果)'}
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedExperiments.map((experiment, index) => (
              <ExperimentCard 
                key={experiment.id} 
                experiment={experiment} 
                delay={index * 0.05}
              />
            ))}
          </div>
          
          {displayedExperiments.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-gray-500 text-lg">未找到符合搜索条件的实验。</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilter('all');
                }}
              >
                清除筛选
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

const ExperimentCard = ({ experiment, delay }: { experiment: Experiment; delay: number }) => {
  return (
    <motion.div
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 group h-full flex flex-col"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex-grow p-6">
        <div className="flex justify-between items-start">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyles(experiment.category)}`}>
            {getCategoryName(experiment.category)}
          </span>
          {experiment.isPopular && (
            <span className="inline-flex items-center text-amber-600 text-sm">
              <Star className="h-4 w-4 mr-1 fill-amber-500 stroke-amber-500" />
              热门
            </span>
          )}
        </div>
        
        <h3 className="mt-4 text-xl font-semibold text-gray-900">{experiment.title}</h3>
        
        <p className="mt-2 text-sm text-primary-600">
          作者：{experiment.authors}
        </p>
        
        <p className="mt-4 text-gray-600 line-clamp-3">{experiment.description}</p>
        
        <div className="mt-6 flex flex-wrap gap-2">
          {experiment.tags.map((tag, i) => (
            <span key={i} className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-gray-400" />
            {experiment.duration}
          </div>
          <div className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-1 text-gray-400" />
            {experiment.difficulty}
          </div>
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-1 text-gray-400" />
            {experiment.citations} 引用
          </div>
          <div className="flex items-center">
            <GitFork className="h-4 w-4 mr-1 text-gray-400" />
            v{experiment.version}
          </div>
          <div className="flex items-center col-span-2">
            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
            发布于 {experiment.releaseDate}
          </div>
          <div className="flex items-center col-span-2">
            <RefreshCw className="h-4 w-4 mr-1 text-gray-400" />
            更新于 {experiment.lastUpdated}
          </div>
        </div>
      </div>
      
      <div className="p-6 pt-0 mt-4 border-t border-gray-100">
        <Button href={experiment.experimentPath} variant="primary" className="w-full">
          开始实验
          <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
        <div className="mt-3 flex flex-col space-y-2">
          <a 
            href={experiment.repository} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
          >
            查看源代码
          </a>
          <a 
            href="#" 
            className="text-center text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
          >
            相关论文 ({experiment.relatedPapers.length})
          </a>
        </div>
      </div>
    </motion.div>
  );
};

const getCategoryName = (category: string): string => {
  switch (category) {
    case 'cognitive': return '认知心理学';
    case 'behavioral': return '行为经济学';
    case 'social': return '社会心理学';
    case 'ethical': return '伦理决策';
    default: return category;
  }
};

const getCategoryStyles = (category: string): string => {
  switch (category) {
    case 'cognitive': return 'bg-blue-100 text-blue-800';
    case 'behavioral': return 'bg-green-100 text-green-800';
    case 'social': return 'bg-purple-100 text-purple-800';
    case 'ethical': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default ExperimentsPage;