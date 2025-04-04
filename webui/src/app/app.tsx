import Topbar from './topbar';
import AssessmentDetails from './containers/assessment-details';
import { Routes, Route } from 'react-router';
import AssessmentsList from './containers/assessments-list';

export function App() {
  return (
    <div className="h-screen w-full flex flex-col">
      <Topbar />
      <div className="flex-1 flex flex-col overflow-hidden items-center">
        <Routes>
          <Route path="/" element={<AssessmentsList />} />
          <Route path="/assessments/:id" element={<AssessmentDetails />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
