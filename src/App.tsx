import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ExperimentsPage from './pages/ExperimentsPage';
import ExperimentPage from './pages/ExperimentPage';
import IowaGamblingTask from './experiments/IowaGamblingTask';
import DelayDiscountingTask from './experiments/DelayDiscountingTask';
import BalloonRiskTask from './experiments/BalloonRiskTask';
import FramingEffectTasks from './experiments/FramingEffectTasks';
import MultiArmedBanditTask from './experiments/MultiArmedBanditTask';
import UltimatumGame from './experiments/UltimatumGame';
import TrustGame from './experiments/TrustGame';
import DictatorGame from './experiments/DictatorGame';
import StagHunt from './experiments/StagHunt';
import ChickenGame from './experiments/ChickenGame';
import PrisonersDilemma from './experiments/PrisonersDilemma';
import ThirdPartyPunishment from './experiments/ThirdPartyPunishment';
import TrolleyProblem from './experiments/TrolleyProblem';
import PublicGoodsGame from './experiments/PublicGoodsGame';
import SocialDiscountingTask from './experiments/SocialDiscountingTask';
import RewardSocialComparisonBanditTask from './experiments/RewardSocialComparisonBanditTask/index';
import EnhancedBanditTask from './experiments/EnhancedBanditTask/index';
import { PhysiologicalSyncProvider } from './components/PhysiologicalSyncContext';

const App = () => {
  return (
    <PhysiologicalSyncProvider experimentId="cognixai-platform">
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Navbar />
          <AnimatePresence mode="wait">
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/experiments" element={<ExperimentsPage />} />
                <Route path="/experiments/:id" element={<ExperimentPage />} />
                <Route path="/experiments/iowa-gambling-task" element={<IowaGamblingTask />} />
                <Route path="/experiments/delay-discounting-task" element={<DelayDiscountingTask />} />
                <Route path="/experiments/balloon-risk-task" element={<BalloonRiskTask />} />
                <Route path="/experiments/framing-effect-tasks" element={<FramingEffectTasks />} />
                <Route path="/experiments/multi-armed-bandit-task" element={<MultiArmedBanditTask />} />
                <Route path="/experiments/ultimatum-game" element={<UltimatumGame />} />
                <Route path="/experiments/trust-game" element={<TrustGame />} />
                <Route path="/experiments/dictator-game" element={<DictatorGame />} />
                <Route path="/experiments/stag-hunt" element={<StagHunt />} />
                <Route path="/experiments/chicken-game" element={<ChickenGame />} />
                <Route path="/experiments/prisoners-dilemma" element={<PrisonersDilemma />} />
                <Route path="/experiments/third-party-punishment" element={<ThirdPartyPunishment />} />
                <Route path="/experiments/trolley-problem" element={<TrolleyProblem />} />
                <Route path="/experiments/public-goods-game" element={<PublicGoodsGame />} />
                <Route path="/experiments/social-discounting-task" element={<SocialDiscountingTask />} />
                <Route path="/experiments/reward-social-comparison-bandit-task" element={<RewardSocialComparisonBanditTask />} />
                <Route path="/experiments/enhanced-bandit-task" element={<EnhancedBanditTask />} />
              </Routes>
            </main>
          </AnimatePresence>
          <Footer />
        </div>
      </Router>
    </PhysiologicalSyncProvider>
  );
};

export default App;