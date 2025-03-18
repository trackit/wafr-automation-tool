import Topbar from './topbar';
import AssessmentDetails from './containers/assessment-details';

export function App() {
  return (
    <div className="h-screen flex flex-col">
      <Topbar />
      <div className="flex-1 flex flex-col overflow-hidden items-center">
        <AssessmentDetails />
      </div>
    </div>
  );
}

export default App;
