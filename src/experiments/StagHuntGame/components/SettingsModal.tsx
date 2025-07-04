import { motion } from 'framer-motion';
import { X, Download } from 'lucide-react';
import Button from '../../../components/Button';
import { ExperimentConfig } from '../index';
import { GameState } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportData: () => void;
  onEndGame: () => void;
  showAiThoughts: boolean;
  onToggleAiThoughts: () => void;
  cellSize: number;
  onCellSizeChange: (size: number) => void;
  config: ExperimentConfig;
  gameState: GameState;
}

const SettingsModal = ({
  isOpen,
  onClose,
  onExportData,
  onEndGame,
  showAiThoughts,
  onToggleAiThoughts,
  cellSize,
  onCellSizeChange,
  config,
  gameState
}: SettingsModalProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl p-6 max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">设置</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={showAiThoughts}
                onChange={onToggleAiThoughts}
                className="mr-2"
              />
              显示AI思考过程
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              网格单元大小
            </label>
            <input
              type="range"
              min="30"
              max="60"
              step="5"
              value={cellSize}
              onChange={(e) => onCellSizeChange(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>小</span>
              <span>大</span>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full mb-2"
              onClick={onExportData}
            >
              <Download className="w-4 h-4 mr-2" />
              导出实验数据
            </Button>
            
            <Button
              variant="primary"
              className="w-full"
              onClick={onEndGame}
            >
              结束实验
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsModal;