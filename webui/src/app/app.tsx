import { Route, Routes } from 'react-router';
import AssessmentDetails from './containers/assessment-details';
import AssessmentsList from './containers/assessments-list';
import { FAQ } from './containers/faq/faq';
import Topbar from './topbar';

export function App() {
  return (
    <div className="h-screen w-full flex flex-col">
      <Topbar />
      <div className="flex-1 flex flex-col overflow-hidden items-center">
        <Routes>
          <Route path="/" element={<AssessmentsList />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/assessments/:id" element={<AssessmentDetails />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
