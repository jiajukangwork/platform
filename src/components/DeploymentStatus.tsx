import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, CheckCircle, AlertCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import Button from './Button';

interface DeploymentInfo {
  id: string;
  url: string;
  status: 'building' | 'ready' | 'error';
  createdAt: string;
  lastUpdated: string;
  buildTime?: number;
  claimUrl?: string;
}

interface DeploymentStatusProps {
  deploymentId?: string;
  onRefresh?: () => void;
}

const DeploymentStatus = ({ deploymentId, onRefresh }: DeploymentStatusProps) => {
  const [deployment, setDeployment] = useState<DeploymentInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (deploymentId) {
      fetchDeploymentStatus();
    }
  }, [deploymentId]);

  const fetchDeploymentStatus = async () => {
    if (!deploymentId) return;
    
    setLoading(true);
    try {
      // Simulate API call to get deployment status
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock deployment data
      setDeployment({
        id: deploymentId,
        url: `https://cognixai-${deploymentId.slice(-8)}.netlify.app`,
        status: 'ready',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        buildTime: 45,
        claimUrl: `https://app.netlify.com/sites/cognixai-${deploymentId.slice(-8)}/overview`
      });
    } catch (error) {
      console.error('Failed to fetch deployment status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'building':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Globe className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'building':
        return '构建中';
      case 'ready':
        return '已上线';
      case 'error':
        return '部署失败';
      default:
        return '未知状态';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'building':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'ready':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!deployment && !loading) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-primary-600" />
          部署状态
        </h3>
        <Button
          onClick={() => {
            fetchDeploymentStatus();
            onRefresh?.();
          }}
          variant="text"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : deployment ? (
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(deployment.status)}`}>
            <div className="flex items-center space-x-3">
              {getStatusIcon(deployment.status)}
              <div>
                <p className="font-medium">{getStatusText(deployment.status)}</p>
                <p className="text-sm opacity-75">
                  {deployment.status === 'ready' && `构建时间: ${deployment.buildTime}秒`}
                  {deployment.status === 'building' && '正在构建项目...'}
                  {deployment.status === 'error' && '构建过程中出现错误'}
                </p>
              </div>
            </div>
          </div>

          {deployment.status === 'ready' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">网站地址</p>
                  <p className="text-sm text-gray-600 truncate">{deployment.url}</p>
                </div>
                <a
                  href={deployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 transition-colors"
                >
                  访问
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          )}

          {deployment.claimUrl && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">管理部署</p>
                  <p className="text-sm text-blue-700 mt-1">
                    您可以在 Netlify 控制台中管理此部署
                  </p>
                  <a
                    href={deployment.claimUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    打开控制台
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p>部署 ID: {deployment.id}</p>
            <p>创建时间: {new Date(deployment.createdAt).toLocaleString('zh-CN')}</p>
            <p>最后更新: {new Date(deployment.lastUpdated).toLocaleString('zh-CN')}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无部署信息</p>
        </div>
      )}
    </motion.div>
  );
};

export default DeploymentStatus;