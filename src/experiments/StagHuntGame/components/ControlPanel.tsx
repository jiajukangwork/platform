import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface ControlPanelProps {
  score: number;
  aiScore: number;
  round: number;
  isPaused: boolean;
  onMove: (dx: number, dy: number) => void;
}

const ControlPanel = ({ score, aiScore, round, isPaused, onMove }: ControlPanelProps) => {
  return (
    <div className="p-4 bg-gray-100 border-t border-gray-200">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <div className="bg-white px-3 py-2 rounded-lg shadow-sm">
            <span className="text-sm font-medium text-gray-700">玩家得分:</span>
            <span className="ml-2 text-lg font-bold text-blue-600">{score}</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-lg shadow-sm">
            <span className="text-sm font-medium text-gray-700">AI得分:</span>
            <span className="ml-2 text-lg font-bold text-green-600">{aiScore}</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-lg shadow-sm">
            <span className="text-sm font-medium text-gray-700">回合:</span>
            <span className="ml-2 text-lg font-bold text-gray-900">{round}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-1 w-32">
          <div className="col-start-2">
            <button 
              onClick={() => onMove(0, -1)}
              className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
              disabled={isPaused}
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
          <div className="col-start-1 row-start-2">
            <button 
              onClick={() => onMove(-1, 0)}
              className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
              disabled={isPaused}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="col-start-2 row-start-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
          <div className="col-start-3 row-start-2">
            <button 
              onClick={() => onMove(1, 0)}
              className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
              disabled={isPaused}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="col-start-2 row-start-3">
            <button 
              onClick={() => onMove(0, 1)}
              className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
              disabled={isPaused}
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;