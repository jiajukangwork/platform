import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, BarChart3, BookOpen, GitFork, Calendar, RefreshCw, ExternalLink } from 'lucide-react';
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
}

const ExperimentPage = () => {
  const { id } = useParams();
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const exp = experimentsData.experiments.find(e => e.id === Number(id));
    setExperiment(exp || null);
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">实验未找到</h2>
          <Button href="/experiments" variant="outline">返回实验列表</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            href="/experiments"
            variant="text"
            className="mb-8 inline-flex items-center text-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回实验列表
          </Button>

          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyles(experiment.category)}`}>
                  {getCategoryName(experiment.category)}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mt-4">{experiment.title}</h1>
                <p className="text-lg text-gray-600 mt-2">作者：{experiment.authors}</p>
              </div>
              <Button variant="primary" size="lg">
                开始实验
                <ExternalLink className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">实验描述</h2>
                <p className="text-gray-600 leading-relaxed">{experiment.description}</p>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {experiment.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">相关论文</h3>
                  <div className="space-y-4">
                    {experiment.relatedPapers.map((paper, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-800">{paper}</p>
                        <Button
                          variant="text"
                          className="mt-2 text-primary-600 hover:text-primary-700"
                        >
                          查看论文
                          <ExternalLink className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">实验信息</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-5 w-5 mr-2" />
                        时长
                      </div>
                      <span className="text-gray-900">{experiment.duration}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        难度
                      </div>
                      <span className="text-gray-900">{experiment.difficulty}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <BookOpen className="h-5 w-5 mr-2" />
                        引用次数
                      </div>
                      <span className="text-gray-900">{experiment.citations}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <GitFork className="h-5 w-5 mr-2" />
                        版本
                      </div>
                      <span className="text-gray-900">v{experiment.version}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">日期信息</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-5 w-5 mr-2" />
                        发布日期
                      </div>
                      <span className="text-gray-900">{experiment.releaseDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-600">
                        <RefreshCw className="h-5 w-5 mr-2" />
                        最后更新
                      </div>
                      <span className="text-gray-900">{experiment.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">其他信息</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-gray-600 mb-1">许可证</div>
                      <div className="text-gray-900">{experiment.license}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">联系方式</div>
                      <div className="text-gray-900">{experiment.contactInfo}</div>
                    </div>
                    <div>
                      <Button
                        href={experiment.repository}
                        variant="outline"
                        className="w-full"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        查看源代码
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
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

export default ExperimentPage;