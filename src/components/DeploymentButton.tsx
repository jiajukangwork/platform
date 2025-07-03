import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Loader2, CheckCircle, AlertCircle, ExternalLink, Copy, Settings } from 'lucide-react';
import Button from './Button';

interface DeploymentButtonProps {
  className?: string;
}

interface DeploymentStatus {
  status: 'idle' | 'building' | 'success' | 'error';
  url?: string;
  claimUrl?: string;
  deployId?: string;
  message?: string;
  progress?: number;
}

const DeploymentButton = ({ className = '' }: DeploymentButtonProps) => {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({ status: 'idle' });
  const [showDetails, setShowDetails] = useState(false);

  const handleDeploy = async () => {
    setDeploymentStatus({ status: 'building', progress: 0 });
    setShowDetails(true);

    try {
      // Simulate build progress
      const progressSteps = [
        { progress: 20, message: '正在准备部署环境...' },
        { progress: 40, message: '正在构建项目...' },
        { progress: 60, message: '正在优化资源...' },
        { progress: 80, message: '正在部署到 Netlify...' },
        { progress: 100, message: '部署完成！' }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setDeploymentStatus(prev => ({ 
          ...prev, 
          progress: step.progress, 
          message: step.message 
        }));
      }

      // Simulate successful deployment
      const deployId = `deploy-${Date.now()}`;
      const deployUrl = `https://cognixai-${deployId.slice(-8)}.netlify.app`;
      const claimUrl = `https://app.netlify.com/sites/cognixai-${deployId.slice(-8)}/overview`;

      setDeploymentStatus({
        status: 'success',
        url: deployUrl,
        claimUrl,
        deployId,
        message: '部署成功！您的网站现在已经上线。'
      });

    } catch (error) {
      setDeploymentStatus({
        status: 'error',
        message: '部署失败，请稍后重试。'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={className}>
      <Button
        onClick={handleDeploy}
        disabled={deploymentStatus.status === 'building'}
        variant="primary"
        className="inline-flex items-center"
      >
        {deploymentStatus.status === 'building' ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Globe className="w-4 h-4 mr-2" />
        )}
        {deploymentStatus.status === 'building' ? '部署中...' : '部署网站'}
      </Button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => deploymentStatus.status !== 'building' && setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                {deploymentStatus.status === 'building' && (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                      <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                      <div 
                        className="w-16 h-16 border-4 border-primary-600 rounded-full absolute top-0 left-0 transition-all duration-300"
                        style={{
                          clipPath: `polygon(50% 50%, 50% 0%, ${50 + (deploymentStatus.progress || 0) * 0.5}% 0%, ${50 + (deploymentStatus.progress || 0) * 0.5}% 100%, 50% 100%)`
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {deploymentStatus.progress}%
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">正在部署</h3>
                    <p className="text-gray-600">{deploymentStatus.message}</p>
                  </>
                )}

                {deploymentStatus.status === 'success' && (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">部署成功！</h3>
                    <p className="text-gray-600 mb-6">{deploymentStatus.message}</p>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">网站地址</p>
                            <p className="text-sm text-gray-600 truncate">{deploymentStatus.url}</p>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => copyToClipboard(deploymentStatus.url!)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <a
                              href={deploymentStatus.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {deploymentStatus.claimUrl && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-blue-900">管理您的网站</p>
                              <p className="text-sm text-blue-700 mt-1">
                                您可以通过以下链接将此 Netlify 项目转移到您的账户
                              </p>
                              <a
                                href={deploymentStatus.claimUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                              >
                                管理项目
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex space-x-3">
                      <Button
                        onClick={() => setShowDetails(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        关闭
                      </Button>
                      <Button
                        href={deploymentStatus.url}
                        variant="primary"
                        className="flex-1"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        访问网站
                      </Button>
                    </div>
                  </>
                )}

                {deploymentStatus.status === 'error' && (
                  <>
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">部署失败</h3>
                    <p className="text-gray-600 mb-6">{deploymentStatus.message}</p>
                    
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => setShowDetails(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        关闭
                      </Button>
                      <Button
                        onClick={handleDeploy}
                        variant="primary"
                        className="flex-1"
                      >
                        重试
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeploymentButton;