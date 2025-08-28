import './tabs.css';

export type Tab = {
  label: string;
  id: string;
  action?: React.ReactNode;
  disabled?: boolean;
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
          } ${tab.disabled ? 'cursor-not-allowed' : ''}`}
          key={tab.id}
          onClick={() => {
            if (tab.disabled) return;
            onChange(tab.id);
          }}
        >
          <span
            className={`${
              tab.disabled ? 'line-through text-base-content/20' : ''
            } ${tab.id === activeTab ? 'text-primary' : 'text-base-content'}`}
          >
            {tab.label}
          </span>
          {tab.action}
        </div>
      ))}
    </div>
  );
}

export default Tabs;
