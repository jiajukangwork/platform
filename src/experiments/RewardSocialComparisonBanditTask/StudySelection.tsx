import { motion } from 'framer-motion';
import { Users, Bot } from 'lucide-react';
import Button from '../../components/Button';
import { STUDIES } from './types';

interface StudySelectionProps {
  onSelectStudy: (studyId: number) => void;
}

const StudySelection = ({ onSelectStudy }: StudySelectionProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">选择研究</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">人类比较研究</h2>
          </div>
          <div className="space-y-4">
            {STUDIES.filter(study => study.type === 'human').map(study => (
              <motion.div
                key={study.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => onSelectStudy(study.id)}
                  className="w-full p-6 text-left bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900">Study {study.id}: {study.name}</h3>
                  <p className="mt-2 text-gray-600">{study.description}</p>
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Bot className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">AI比较研究</h2>
          </div>
          <div className="space-y-4">
            {STUDIES.filter(study => study.type === 'ai').map(study => (
              <motion.div
                key={study.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => onSelectStudy(study.id)}
                  className="w-full p-6 text-left bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-primary-400 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900">Study {study.id}: {study.name}</h3>
                  <p className="mt-2 text-gray-600">{study.description}</p>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudySelection;