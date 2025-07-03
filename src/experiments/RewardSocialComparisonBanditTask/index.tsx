import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/Button';
import { Link } from 'react-router-dom';
import Introduction from './Introduction';
import StudySelection from './StudySelection';
import ExperimentTask from './ExperimentTask';

export type GameState = 'introduction' | 'selection' | 'experiment' | 'finished';

const RewardSocialComparisonBanditTask = () => {
  const [gameState, setGameState] = useState<GameState>('introduction');
  const [selectedStudy, setSelectedStudy] = useState<number | null>(null);

  const handleStartExperiment = (studyId: number) => {
    setSelectedStudy(studyId);
    setGameState('experiment');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Link
              to="/experiments"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回实验列表
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {gameState === 'introduction' && (
              <Introduction onStart={() => setGameState('selection')} />
            )}

            {gameState === 'selection' && (
              <StudySelection onSelectStudy={handleStartExperiment} />
            )}

            {gameState === 'experiment' && selectedStudy !== null && (
              <ExperimentTask 
                studyId={selectedStudy}
                onFinish={() => setGameState('finished')}
                onBack={() => setGameState('selection')}
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RewardSocialComparisonBanditTask;