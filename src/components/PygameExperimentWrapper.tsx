import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCw, Download, Play, Pause, HelpCircle, X, Maximize, Minimize, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';

interface PygameExperimentWrapperProps {
  experimentId: string;
  experimentName: string;
  experimentDescription: string;
  serverUrl?: string;
}

const PygameExperimentWrapper = ({
  experimentId,
  experimentName,
  experimentDescription,
  serverUrl = 'https://pygame-server.example.com' // 默认服务器URL
}: PygameExperimentWrapperProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [experimentData, setExperimentData] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 连接到实验服务器
    connectToExperiment();

    // 监听全屏变化
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const connectToExperiment = async () => {
    setIsLoading(true);
    setError(null);
    setConnectionStatus('connecting');
    
    try {
      // 模拟连接到实验服务器
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 实际应用中，这里应该是一个真实的API调用
      // const response = await fetch(`${serverUrl}/api/experiments/${experimentId}`);
      // if (!response.ok) throw new Error('无法连接到实验服务器');
      // const data = await response.json();
      
      setConnectionStatus('connected');
      setIsLoading(false);
    } catch (err) {
      setError('连接实验服务器失败，请稍后再试');
      setConnectionStatus('disconnected');
      setIsLoading(false);
    }
  };

  const handleStartExperiment = () => {
    if (iframeRef.current) {
      // 向iframe发送开始实验的消息
      iframeRef.current.contentWindow?.postMessage({ type: 'START_EXPERIMENT' }, '*');
    }
    setIsRunning(true);
  };

  const handlePauseExperiment = () => {
    if (iframeRef.current) {
      // 向iframe发送暂停实验的消息
      iframeRef.current.contentWindow?.postMessage({ type: 'PAUSE_EXPERIMENT' }, '*');
    }
    setIsRunning(false);
  };

  const handleResetExperiment = () => {
    if (iframeRef.current) {
      // 向iframe发送重置实验的消息
      iframeRef.current.contentWindow?.postMessage({ type: 'RESET_EXPERIMENT' }, '*');
    }
    setIsRunning(true);
  };

  const handleExportData = () => {
    if (!experimentData) return;
    
    const blob = new Blob([JSON.stringify(experimentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${experimentId}-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 监听来自iframe的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 确保消息来源安全
      if (event.origin !== serverUrl && event.origin !== window.location.origin) return;
      
      const { type, data } = event.data;
      
      switch (type) {
        case 'EXPERIMENT_COMPLETE':
          setExperimentData(data);
          setIsRunning(false);
          break;
        case 'EXPERIMENT_ERROR':
          setError(data.message);
          setIsRunning(false);
          break;
        case 'EXPERIMENT_UPDATE':
          // 处理实验更新数据
          console.log('实验更新:', data);
          break;
        case 'CONNECTION_STATUS':
          setConnectionStatus(data.status);
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Link
              to="/experiments"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回实验列表
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(true)}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              帮助
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* 实验标题和控制按钮 */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{experimentName}</h1>
                    <p className="mt-1 text-gray-600">{experimentDescription}</p>
                  </div>
                  <div className="flex space-x-3">
                    {isRunning ? (
                      <Button
                        variant="outline"
                        onClick={handlePauseExperiment}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        暂停
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={handleStartExperiment}
                        disabled={isLoading || connectionStatus !== 'connected'}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isLoading ? '加载中...' : '开始'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleResetExperiment}
                      disabled={isLoading || connectionStatus !== 'connected'}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重置
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportData}
                      disabled={!experimentData}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      导出数据
                    </Button>
                    <Button
                      variant="outline"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize className="w-4 h-4 mr-2" />
                      ) : (
                        <Maximize className="w-4 h-4 mr-2" />
                      )}
                      {isFullscreen ? '退出全屏' : '全屏'}
                    </Button>
                  </div>
                </div>
                
                {/* 连接状态指示器 */}
                <div className="mt-4 flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    connectionStatus === 'connected' ? 'bg-green-500' :
                    connectionStatus === 'connecting' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    {connectionStatus === 'connected' ? '已连接到实验服务器' :
                     connectionStatus === 'connecting' ? '正在连接...' :
                     '未连接'}
                  </span>
                </div>
              </div>

              {/* 实验内容 */}
              <div ref={containerRef} className="relative" style={{ height: '600px' }}>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <Loader className="animate-spin h-12 w-12 text-primary-600 mx-auto" />
                      <p className="mt-4 text-gray-600">正在加载实验...</p>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="text-center max-w-md">
                      <div className="text-red-500 text-5xl mb-4">⚠️</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">加载失败</h3>
                      <p className="text-gray-600 mb-4">{error}</p>
                      <Button
                        variant="outline"
                        onClick={connectToExperiment}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        重试
                      </Button>
                    </div>
                  </div>
                )}
                
                {!isLoading && !error && (
                  <iframe
                    ref={iframeRef}
                    src={`${serverUrl}/experiments/${experimentId}`}
                    className="w-full h-full border-0"
                    title={experimentName}
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 帮助弹窗 */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-lg w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">实验帮助</h3>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="prose prose-gray">
                <p>本实验是使用Python/Pygame开发的交互式实验，通过网络连接到实验服务器运行。</p>
                
                <h4>操作说明：</h4>
                <ul>
                  <li>点击"开始"按钮启动实验</li>
                  <li>使用键盘进行交互（具体按键说明请参考实验内指引）</li>
                  <li>实验完成后可以导出数据进行分析</li>
                </ul>
                
                <h4>常见问题：</h4>
                <ul>
                  <li><strong>实验无法加载？</strong> - 请检查网络连接或刷新页面重试</li>
                  <li><strong>实验运行缓慢？</strong> - 这可能是由于网络延迟导致，请耐心等待</li>
                  <li><strong>数据未保存？</strong> - 请确保完成整个实验流程，中途退出可能导致数据丢失</li>
                </ul>
                
                <p>如有其他问题，请联系实验管理员获取支持。</p>
              </div>
              
              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={() => setShowHelp(false)}
              >
                我知道了
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PygameExperimentWrapper;