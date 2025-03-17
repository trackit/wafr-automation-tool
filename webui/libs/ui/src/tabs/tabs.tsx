import './tabs.css';

export type Tab = {
  label: string;
  id: string;
};

export type TabsProps = {
  tabs: Tab[];
  activeTab: string;
  onChange: (tab: string) => void;
};

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div role="tablist" className="tabs tabs-border tabs-wrapper">
      {tabs.map((tab) => (
        <div
          role="tab"
          className={`tab ${
            tab.id === activeTab ? 'tab-active text-primary' : ''
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </div>
      ))}
    </div>
  );
}

export default Tabs;
