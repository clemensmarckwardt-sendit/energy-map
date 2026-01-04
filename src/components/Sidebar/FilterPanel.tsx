import { useStore } from '../../store';
import { Filter, Zap, ZapOff } from 'lucide-react';
import clsx from 'clsx';

const VOLTAGE_TYPES = [
  { id: 'Mittelspannung', label: 'Mittelspannung', color: '#e74c3c' },
  { id: 'Niederspannung', label: 'Niederspannung', color: '#3498db' }
];

export function FilterPanel() {
  const { filters, setFilters } = useStore();

  const toggleVoltageFilter = (voltageType: string) => {
    const current = filters.voltageTypes;
    const newTypes = current.includes(voltageType)
      ? current.filter(t => t !== voltageType)
      : [...current, voltageType];

    setFilters({ voltageTypes: newTypes });
  };

  const clearFilters = () => {
    setFilters({ voltageTypes: [], searchQuery: '' });
  };

  const hasActiveFilters = filters.voltageTypes.length > 0;

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <Filter size={16} />
        <span>Filter</span>
        {hasActiveFilters && (
          <button className="clear-filters" onClick={clearFilters}>
            Zurücksetzen
          </button>
        )}
      </div>

      <div className="voltage-filters">
        {VOLTAGE_TYPES.map(type => {
          const isActive = filters.voltageTypes.includes(type.id);

          return (
            <button
              key={type.id}
              className={clsx('voltage-filter', { active: isActive })}
              onClick={() => toggleVoltageFilter(type.id)}
              style={{
                borderColor: isActive ? type.color : 'transparent',
                backgroundColor: isActive ? `${type.color}20` : 'transparent'
              }}
            >
              {isActive ? <Zap size={14} /> : <ZapOff size={14} />}
              <span>{type.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
