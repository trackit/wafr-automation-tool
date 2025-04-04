import './tabs.css';
import { EllipsisVertical, CircleMinus } from 'lucide-react';

export type Tab = {
  label: string;
  id: string;
  action?: React.ReactNode;
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
          {tab.action}
        </div>
      ))}
    </div>
  );
}

export default Tabs;
