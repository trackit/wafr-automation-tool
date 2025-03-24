import Topbar from './topbar';
import AssessmentDetails from './containers/assessment-details';
import { Routes, Route } from 'react-router';

export function App() {
  return (
    <div className="h-screen flex flex-col">
      <Topbar />
      <div className="flex-1 flex flex-col overflow-hidden items-center">
        <Routes>
          <Route path="/assessment/:id" element={<AssessmentDetails />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
