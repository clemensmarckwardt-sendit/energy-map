import { useState } from 'react';
import { Layers, Search, BarChart3, SlidersHorizontal } from 'lucide-react';
import { LayerPanel } from './LayerPanel';
import { SearchPanel } from './SearchPanel';
import { StatsPanel } from './StatsPanel';
import { FilterPanel } from './FilterPanel';
import { AnlagenFilterPanel } from './AnlagenFilterPanel';
import clsx from 'clsx';

type TabId = 'layers' | 'filter' | 'search' | 'stats';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'layers', label: 'Ebenen', icon: <Layers size={18} /> },
  { id: 'filter', label: 'Filter', icon: <SlidersHorizontal size={18} /> },
  { id: 'search', label: 'Suche', icon: <Search size={18} /> },
  { id: 'stats', label: 'Stats', icon: <BarChart3 size={18} /> }
];

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<TabId>('layers');

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <h1>Voltpark</h1>
        <p>Energy Infrastructure Analytics</p>
      </header>

      <nav className="sidebar-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={clsx('tab-button', { active: activeTab === tab.id })}
            onClick={() => setActiveTab(tab.id)}
            title={tab.label}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-content">
        {activeTab === 'layers' && <LayerPanel />}
        {activeTab === 'filter' && <AnlagenFilterPanel />}
        {activeTab === 'search' && <SearchPanel />}
        {activeTab === 'stats' && <StatsPanel />}
      </div>

      <FilterPanel />
    </aside>
  );
}
