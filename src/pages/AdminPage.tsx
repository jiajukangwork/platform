import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Upload, FileCode, CheckCircle, XCircle, Lock, Eye, EyeOff, 
  Save, Trash2, Edit, Plus, Server, Settings, Database, Code, Play
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import DeploymentButton from '../components/DeploymentButton';

interface ExperimentFile {
  id: string;
  name: string;
  description: string;
  language: 'python' | 'javascript' | 'typescript';
  type: 'pygame' | 'web' | 'other';
  status: 'active' | 'draft' | 'archived';
  uploadDate: string;
  lastModified: string;
  author: string;
  code: string;
  config: Record<string, any>;
  serverConfig?: {
    port: number;
    requirements: string[];
    entryPoint: string;
    pythonVersion: string;
  };
}

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [experiments, setExperiments] = useState<ExperimentFile[]>([
    {
      id: '1',
      name: '速度博弈实验',
      description: '模拟在交通情境下的人机对抗博弈，研究动态决策与策略适应',
      language: 'python',
      type: 'pygame',
      status: 'active',
      uploadDate: '2025-07-10',
      lastModified: '2025-07-10',
      author: 'CogniAND研究团队',
      code: 'import pygame\n\n# 速度博弈实验代码...',
      config: {
        displayName: '速度博弈：动态决策与策略适应实验',
        category: 'cognitive',
        tags: ['博弈论', '动态决策', '速度控制'],
        duration: '15-25 分钟',
        difficulty: '中等'
      },
      serverConfig: {
        port: 8000,
        requirements: ['pygame==2.1.2', 'numpy==1.22.3'],
        entryPoint: 'main.py',
        pythonVersion: '3.9'
      }
    },
    {
      id: '2',
      name: '多臂老虎机实验',
      description: '研究探索与利用权衡的经典实验',
      language: 'typescript',
      type: 'web',
      status: 'active',
      uploadDate: '2025-06-15',
      lastModified: '2025-06-20',
      author: '张烁',
      code: 'import React from "react";\n\n// 多臂老虎机实验代码...',
      config: {
        displayName: '多臂老虎机任务',
        category: 'behavioral',
        tags: ['探索与利用', '奖励学习', '决策制定'],
        duration: '20-30 分钟',
        difficulty: '中等'
      }
    }
  ]);
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentFile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'code' | 'server'>('details');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [serverStatus, setServerStatus] = useState<'stopped' | 'running' | 'error'>('stopped');
  const [serverLogs, setServerLogs] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // 检查本地存储中是否有认证信息
    const authToken = localStorage.getItem('adminAuthToken');
    if (authToken) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 简单的身份验证逻辑，实际应用中应使用更安全的方式
    if (username === 'admin' && password === 'password') {
      localStorage.setItem('adminAuthToken', 'fake-jwt-token');
      setIsAuthenticated(true);
    } else {
      alert('用户名或密码错误');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthToken');
    setIsAuthenticated(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    setUploadSuccess(false);

    // 模拟上传进度
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    // 模拟文件读取
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // 检查文件类型
      const isPython = file.name.endsWith('.py');
      const isJavaScript = file.name.endsWith('.js') || file.name.endsWith('.jsx');
      const isTypeScript = file.name.endsWith('.ts') || file.name.endsWith('.tsx');
      
      if (!isPython && !isJavaScript && !isTypeScript) {
        setUploadError('不支持的文件类型。请上传 .py, .js, .jsx, .ts 或 .tsx 文件。');
        setIsUploading(false);
        clearInterval(interval);
        return;
      }

      // 模拟上传完成
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        setUploadSuccess(true);
        setIsUploading(false);
        
        // 创建新实验
        const newExperiment: ExperimentFile = {
          id: Date.now().toString(),
          name: file.name.replace(/\.[^/.]+$/, ""),
          description: '请添加实验描述',
          language: isPython ? 'python' : (isTypeScript ? 'typescript' : 'javascript'),
          type: isPython ? 'pygame' : 'web',
          status: 'draft',
          uploadDate: new Date().toISOString().split('T')[0],
          lastModified: new Date().toISOString().split('T')[0],
          author: '当前用户',
          code: content,
          config: {
            displayName: file.name.replace(/\.[^/.]+$/, ""),
            category: 'cognitive',
            tags: [],
            duration: '15-20 分钟',
            difficulty: '中等'
          }
        };
        
        // 如果是Python文件，添加服务器配置
        if (isPython) {
          newExperiment.serverConfig = {
            port: 8000 + Math.floor(Math.random() * 1000),
            requirements: ['pygame==2.1.2', 'numpy==1.22.3'],
            entryPoint: file.name,
            pythonVersion: '3.9'
          };
        }
        
        setExperiments(prev => [...prev, newExperiment]);
        setSelectedExperiment(newExperiment);
        setIsEditing(true);
        setActiveTab('details');
      }, 2000);
    };
    
    reader.readAsText(file);
  };

  const handleSaveExperiment = () => {
    if (!selectedExperiment) return;
    
    // 更新最后修改时间
    const updatedExperiment = {
      ...selectedExperiment,
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    setExperiments(prev => 
      prev.map(exp => 
        exp.id === updatedExperiment.id ? updatedExperiment : exp
      )
    );
    
    setSelectedExperiment(updatedExperiment);
    setIsEditing(false);
    alert('实验已保存');
  };

  const handleDeleteExperiment = (id: string) => {
    if (confirm('确定要删除这个实验吗？')) {
      setExperiments(prev => prev.filter(exp => exp.id !== id));
      if (selectedExperiment?.id === id) {
        setSelectedExperiment(null);
        setIsEditing(false);
      }
    }
  };

  const handleCreateNewExperiment = () => {
    const newExperiment: ExperimentFile = {
      id: Date.now().toString(),
      name: '新实验',
      description: '请添加实验描述',
      language: 'python',
      type: 'pygame',
      status: 'draft',
      uploadDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      author: '当前用户',
      code: '# 在此编写实验代码\nimport pygame\nimport sys\n\npygame.init()\n\nscreen = pygame.display.set_mode((800, 600))\npygame.display.set_caption("实验")\n\nwhile True:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            pygame.quit()\n            sys.exit()\n    \n    screen.fill((255, 255, 255))\n    pygame.display.flip()',
      config: {
        displayName: '新实验',
        category: 'cognitive',
        tags: [],
        duration: '15-20 分钟',
        difficulty: '中等'
      },
      serverConfig: {
        port: 8000 + Math.floor(Math.random() * 1000),
        requirements: ['pygame==2.1.2', 'numpy==1.22.3'],
        entryPoint: 'main.py',
        pythonVersion: '3.9'
      }
    };
    
    setExperiments(prev => [...prev, newExperiment]);
    setSelectedExperiment(newExperiment);
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleStartServer = () => {
    if (!selectedExperiment || !selectedExperiment.serverConfig) return;
    
    setServerStatus('running');
    setServerLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 正在启动服务器...`]);
    
    // 模拟服务器启动过程
    setTimeout(() => {
      setServerLogs(prev => [
        ...prev, 
        `[${new Date().toLocaleTimeString()}] 安装依赖...`,
        `[${new Date().toLocaleTimeString()}] 正在启动 Python ${selectedExperiment.serverConfig?.pythonVersion}...`,
        `[${new Date().toLocaleTimeString()}] 服务器启动成功，监听端口 ${selectedExperiment.serverConfig?.port}`
      ]);
    }, 2000);
  };

  const handleStopServer = () => {
    setServerStatus('stopped');
    setServerLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 服务器已停止`]);
  };

  const handlePublishExperiment = () => {
    if (!selectedExperiment) return;
    
    // 更新实验状态为已发布
    const updatedExperiment = {
      ...selectedExperiment,
      status: 'active' as const,
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    setExperiments(prev => 
      prev.map(exp => 
        exp.id === updatedExperiment.id ? updatedExperiment : exp
      )
    );
    
    setSelectedExperiment(updatedExperiment);
    alert('实验已发布，现在可以在实验列表中访问');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 pb-20 flex items-center justify-center">
        <motion.div 
          className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">管理员登录</h1>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <Button type="submit" variant="primary" className="w-full">
              登录
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-primary-600 hover:text-primary-800">
              返回首页
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Link
              to="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回首页
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">实验管理后台</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 实验列表 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">实验列表</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCreateNewExperiment}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新建实验
                </Button>
              </div>
              
              <div className="mb-4">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  上传实验文件
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".py,.js,.jsx,.ts,.tsx"
                />
              </div>
              
              {isUploading && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">上传进度</span>
                    <span className="text-sm font-medium text-gray-900">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  {uploadError && (
                    <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                  )}
                  {uploadSuccess && (
                    <p className="mt-2 text-sm text-green-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      上传成功
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {experiments.map(experiment => (
                  <div 
                    key={experiment.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedExperiment?.id === experiment.id 
                        ? 'border-primary-500 bg-primary-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedExperiment(experiment);
                      setIsEditing(false);
                      setActiveTab('details');
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{experiment.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{experiment.type === 'pygame' ? 'Python/Pygame' : 'Web/React'}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        experiment.status === 'active' ? 'bg-green-100 text-green-800' :
                        experiment.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {experiment.status === 'active' ? '已发布' : 
                         experiment.status === 'draft' ? '草稿' : '已归档'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      上传日期: {experiment.uploadDate}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 实验详情 */}
          <div className="lg:col-span-2">
            {selectedExperiment ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {isEditing ? '编辑实验' : '实验详情'}
                  </h2>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={handleSaveExperiment}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          编辑
                        </Button>
                        {selectedExperiment.status !== 'active' && (
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={handlePublishExperiment}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            发布
                          </Button>
                        )}
                      </>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteExperiment(selectedExperiment.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      删除
                    </Button>
                  </div>
                </div>
                
                {/* 标签页导航 */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex">
                    <button
                      className={`py-4 px-6 font-medium text-sm border-b-2 ${
                        activeTab === 'details'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('details')}
                    >
                      <Settings className="w-4 h-4 inline mr-2" />
                      基本信息
                    </button>
                    <button
                      className={`py-4 px-6 font-medium text-sm border-b-2 ${
                        activeTab === 'code'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('code')}
                    >
                      <Code className="w-4 h-4 inline mr-2" />
                      代码编辑
                    </button>
                    {selectedExperiment.type === 'pygame' && (
                      <button
                        className={`py-4 px-6 font-medium text-sm border-b-2 ${
                          activeTab === 'server'
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => setActiveTab('server')}
                      >
                        <Server className="w-4 h-4 inline mr-2" />
                        服务器配置
                      </button>
                    )}
                  </nav>
                </div>
                
                <div className="p-6">
                  {/* 基本信息标签页 */}
                  {activeTab === 'details' && (
                    isEditing ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              实验名称
                            </label>
                            <input
                              type="text"
                              value={selectedExperiment.name}
                              onChange={(e) => setSelectedExperiment({
                                ...selectedExperiment,
                                name: e.target.value
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              显示名称
                            </label>
                            <input
                              type="text"
                              value={selectedExperiment.config.displayName}
                              onChange={(e) => setSelectedExperiment({
                                ...selectedExperiment,
                                config: {
                                  ...selectedExperiment.config,
                                  displayName: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            实验描述
                          </label>
                          <textarea
                            value={selectedExperiment.description}
                            onChange={(e) => setSelectedExperiment({
                              ...selectedExperiment,
                              description: e.target.value
                            })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              实验类型
                            </label>
                            <select
                              value={selectedExperiment.type}
                              onChange={(e) => setSelectedExperiment({
                                ...selectedExperiment,
                                type: e.target.value as any
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="pygame">Python/Pygame</option>
                              <option value="web">Web/React</option>
                              <option value="other">其他</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              实验分类
                            </label>
                            <select
                              value={selectedExperiment.config.category}
                              onChange={(e) => setSelectedExperiment({
                                ...selectedExperiment,
                                config: {
                                  ...selectedExperiment.config,
                                  category: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="cognitive">认知心理学</option>
                              <option value="behavioral">行为经济学</option>
                              <option value="social">社会心理学</option>
                              <option value="ethical">伦理决策</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              状态
                            </label>
                            <select
                              value={selectedExperiment.status}
                              onChange={(e) => setSelectedExperiment({
                                ...selectedExperiment,
                                status: e.target.value as any
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="draft">草稿</option>
                              <option value="active">已发布</option>
                              <option value="archived">已归档</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              实验时长
                            </label>
                            <input
                              type="text"
                              value={selectedExperiment.config.duration}
                              onChange={(e) => setSelectedExperiment({
                                ...selectedExperiment,
                                config: {
                                  ...selectedExperiment.config,
                                  duration: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              难度
                            </label>
                            <select
                              value={selectedExperiment.config.difficulty}
                              onChange={(e) => setSelectedExperiment({
                                ...selectedExperiment,
                                config: {
                                  ...selectedExperiment.config,
                                  difficulty: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="简单">简单</option>
                              <option value="中等">中等</option>
                              <option value="困难">困难</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            标签（用逗号分隔）
                          </label>
                          <input
                            type="text"
                            value={selectedExperiment.config.tags.join(', ')}
                            onChange={(e) => setSelectedExperiment({
                              ...selectedExperiment,
                              config: {
                                ...selectedExperiment.config,
                                tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            作者
                          </label>
                          <input
                            type="text"
                            value={selectedExperiment.author}
                            onChange={(e) => setSelectedExperiment({
                              ...selectedExperiment,
                              author: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">实验名称</h3>
                            <p className="mt-1 text-lg text-gray-900">{selectedExperiment.name}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">显示名称</h3>
                            <p className="mt-1 text-lg text-gray-900">{selectedExperiment.config.displayName}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">实验描述</h3>
                          <p className="mt-1 text-gray-900">{selectedExperiment.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">实验类型</h3>
                            <p className="mt-1 text-gray-900">
                              {selectedExperiment.type === 'pygame' ? 'Python/Pygame' : 
                               selectedExperiment.type === 'web' ? 'Web/React' : '其他'}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">实验分类</h3>
                            <p className="mt-1 text-gray-900">
                              {selectedExperiment.config.category === 'cognitive' ? '认知心理学' :
                               selectedExperiment.config.category === 'behavioral' ? '行为经济学' :
                               selectedExperiment.config.category === 'social' ? '社会心理学' :
                               selectedExperiment.config.category === 'ethical' ? '伦理决策' :
                               selectedExperiment.config.category}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">状态</h3>
                            <p className={`mt-1 inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              selectedExperiment.status === 'active' ? 'bg-green-100 text-green-800' :
                              selectedExperiment.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedExperiment.status === 'active' ? '已发布' : 
                               selectedExperiment.status === 'draft' ? '草稿' : '已归档'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">实验时长</h3>
                            <p className="mt-1 text-gray-900">{selectedExperiment.config.duration}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">难度</h3>
                            <p className="mt-1 text-gray-900">{selectedExperiment.config.difficulty}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">标签</h3>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {selectedExperiment.config.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">上传日期</h3>
                            <p className="mt-1 text-gray-900">{selectedExperiment.uploadDate}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">最后修改</h3>
                            <p className="mt-1 text-gray-900">{selectedExperiment.lastModified}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">作者</h3>
                          <p className="mt-1 text-gray-900">{selectedExperiment.author}</p>
                        </div>
                      </div>
                    )
                  )}
                  
                  {/* 代码编辑标签页 */}
                  {activeTab === 'code' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">实验代码</h3>
                        {isEditing && (
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                if (codeEditorRef.current) {
                                  codeEditorRef.current.value = selectedExperiment.code;
                                }
                              }}
                            >
                              重置
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => {
                                if (codeEditorRef.current) {
                                  setSelectedExperiment({
                                    ...selectedExperiment,
                                    code: codeEditorRef.current.value
                                  });
                                }
                              }}
                            >
                              应用更改
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {isEditing ? (
                        <textarea
                          ref={codeEditorRef}
                          defaultValue={selectedExperiment.code}
                          rows={20}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto max-h-[500px]">
                          <pre className="text-sm font-mono whitespace-pre-wrap">{selectedExperiment.code}</pre>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 服务器配置标签页 */}
                  {activeTab === 'server' && selectedExperiment.type === 'pygame' && (
                    <div className="space-y-6">
                      {isEditing ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                端口号
                              </label>
                              <input
                                type="number"
                                value={selectedExperiment.serverConfig?.port || 8000}
                                onChange={(e) => setSelectedExperiment({
                                  ...selectedExperiment,
                                  serverConfig: {
                                    ...selectedExperiment.serverConfig!,
                                    port: parseInt(e.target.value)
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Python版本
                              </label>
                              <select
                                value={selectedExperiment.serverConfig?.pythonVersion || '3.9'}
                                onChange={(e) => setSelectedExperiment({
                                  ...selectedExperiment,
                                  serverConfig: {
                                    ...selectedExperiment.serverConfig!,
                                    pythonVersion: e.target.value
                                  }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              >
                                <option value="3.7">Python 3.7</option>
                                <option value="3.8">Python 3.8</option>
                                <option value="3.9">Python 3.9</option>
                                <option value="3.10">Python 3.10</option>
                                <option value="3.11">Python 3.11</option>
                              </select>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              入口文件
                            </label>
                            <input
                              type="text"
                              value={selectedExperiment.serverConfig?.entryPoint || 'main.py'}
                              onChange={(e) => setSelectedExperiment({
                                ...selectedExperiment,
                                serverConfig: {
                                  ...selectedExperiment.serverConfig!,
                                  entryPoint: e.target.value
                                }
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              依赖项（每行一个）
                            </label>
                            <textarea
                              value={selectedExperiment.serverConfig?.requirements.join('\n')}
                              onChange={(e) => setSelectedExperiment({
                                ...selectedExperiment,
                                serverConfig: {
                                  ...selectedExperiment.serverConfig!,
                                  requirements: e.target.value.split('\n').filter(Boolean)
                                }
                              })}
                              rows={5}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">端口号</h3>
                              <p className="mt-1 text-gray-900">{selectedExperiment.serverConfig?.port || 8000}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Python版本</h3>
                              <p className="mt-1 text-gray-900">{selectedExperiment.serverConfig?.pythonVersion || '3.9'}</p>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">入口文件</h3>
                            <p className="mt-1 text-gray-900">{selectedExperiment.serverConfig?.entryPoint || 'main.py'}</p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">依赖项</h3>
                            <div className="mt-1 bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <ul className="list-disc pl-5 space-y-1">
                                {selectedExperiment.serverConfig?.requirements.map((req, index) => (
                                  <li key={index} className="text-sm text-gray-700">{req}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">服务器控制</h3>
                            
                            <div className="flex space-x-4 mb-4">
                              {serverStatus === 'running' ? (
                                <Button 
                                  variant="outline" 
                                  onClick={handleStopServer}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  停止服务器
                                </Button>
                              ) : (
                                <Button 
                                  variant="primary" 
                                  onClick={handleStartServer}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  启动服务器
                                </Button>
                              )}
                              
                              <DeploymentButton className="ml-auto" />
                            </div>
                            
                            <div className="bg-black rounded-lg p-4 text-white font-mono text-sm h-64 overflow-y-auto">
                              {serverLogs.length > 0 ? (
                                serverLogs.map((log, index) => (
                                  <div key={index} className="mb-1">{log}</div>
                                ))
                              ) : (
                                <div className="text-gray-400">服务器日志将显示在这里...</div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center h-full">
                <FileCode className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-6">选择或上传一个实验以查看详情</p>
                <div className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    上传实验文件
                  </Button>
                  <Button 
                    variant="primary"
                    onClick={handleCreateNewExperiment}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    新建实验
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;