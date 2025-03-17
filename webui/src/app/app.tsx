import Topbar from './topbar';
import { Tabs } from '@webui/ui';
export function App() {
  return (
    <div>
      <Topbar />
      <Tabs
        tabs={[
          { label: 'Operational Excellence 0/11', id: 'tab1' },
          { label: 'Security 0/11', id: 'tab2' },
          { label: 'Reliability 0/11', id: 'tab3' },
          { label: 'Cost Optimization 0/11', id: 'tab4' },
          { label: 'Performance Efficiency 0/11', id: 'tab5' },
          { label: 'Sustainability 0/11', id: 'tab6' },
        ]}
        activeTab="tab1"
        onChange={(tab) => {
          console.log(tab);
        }}
      />
    </div>
  );
}

export default App;
