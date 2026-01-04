import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { useStore } from '../../store';
import { useAnlagenData } from '../../hooks/useAnlagenData';
import type { FilterRule, FilterOperator, AnlagenProperties } from '../../types';

interface FieldConfig {
  label: string;
  type: 'string' | 'number';
  options?: string[];
}

const FIELD_CONFIG: Record<keyof AnlagenProperties, FieldConfig> = {
  id: { label: 'MaStR-Nr', type: 'string' },
  name: { label: 'Name', type: 'string' },
  type: {
    label: 'Typ',
    type: 'string',
    options: ['solar', 'bess']
  },
  status: {
    label: 'Status',
    type: 'string',
    options: ['In Betrieb', 'In Planung', 'Vorübergehend stillgelegt', 'Endgültig stillgelegt']
  },
  grossPower: { label: 'Bruttoleistung (kW)', type: 'number' },
  netPower: { label: 'Nettoleistung (kW)', type: 'number' },
  bundesland: {
    label: 'Bundesland',
    type: 'string',
    options: [
      'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
      'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
      'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
      'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'
    ]
  },
  city: { label: 'Stadt', type: 'string' },
  postalCode: { label: 'PLZ', type: 'string' },
  operator: { label: 'Betreiber', type: 'string' },
  commissioningDate: { label: 'Inbetriebnahme', type: 'string' },
  storageTechnology: {
    label: 'Speichertechnologie',
    type: 'string',
    options: ['Batterie', 'Pumpspeicher']
  },
  storageCapacity: { label: 'Speicherkapazität (kWh)', type: 'number' },
  solarType: {
    label: 'Anlagenart',
    type: 'string',
    options: ['Freiflächensolaranlage', 'Gebäudesolaranlage', 'Sonstige Solaranlage']
  },
  moduleCount: { label: 'Anzahl Module', type: 'number' },
};

const STRING_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: 'ist gleich' },
  { value: 'not_equals', label: 'ist nicht gleich' },
  { value: 'contains', label: 'enthält' },
  { value: 'not_contains', label: 'enthält nicht' },
  { value: 'starts_with', label: 'beginnt mit' },
  { value: 'ends_with', label: 'endet mit' },
  { value: 'is_empty', label: 'ist leer' },
  { value: 'is_not_empty', label: 'ist nicht leer' },
];

const NUMBER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'between', label: 'zwischen' },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Dropdown Select Component
interface DropdownSelectProps {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
}

function DropdownSelect({ value, options, placeholder, onChange }: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(lower));
  }, [options, search]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="dropdown-select" ref={wrapperRef}>
      <button
        type="button"
        className="dropdown-trigger"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <span className={value ? 'has-value' : 'placeholder'}>
          {value || placeholder || 'Auswählen...'}
        </span>
        <ChevronDown size={14} className={isOpen ? 'rotated' : ''} />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <input
            ref={inputRef}
            type="text"
            className="dropdown-search"
            placeholder="Suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="dropdown-options">
            {filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`dropdown-option ${option === value ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
              >
                {option}
              </button>
            ))}
            {filteredOptions.length === 0 && (
              <div className="dropdown-empty">Keine Ergebnisse</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Filter Rule Card Component
interface FilterRuleCardProps {
  rule: FilterRule;
  onUpdate: (id: string, updates: Partial<FilterRule>) => void;
  onRemove: (id: string) => void;
}

function FilterRuleCard({ rule, onUpdate, onRemove }: FilterRuleCardProps) {
  const fieldConfig = FIELD_CONFIG[rule.field];
  const isNumber = fieldConfig?.type === 'number';
  const hasOptions = fieldConfig?.options && fieldConfig.options.length > 0;
  const operators = isNumber ? NUMBER_OPERATORS : STRING_OPERATORS;
  const needsValue = !['is_empty', 'is_not_empty'].includes(rule.operator);
  const needsSecondValue = rule.operator === 'between';

  return (
    <div className="filter-rule-card">
      <div className="filter-rule-row">
        <select
          className="filter-field-select"
          value={rule.field}
          onChange={(e) => {
            const newField = e.target.value as keyof AnlagenProperties;
            const newFieldConfig = FIELD_CONFIG[newField];
            const newIsNumber = newFieldConfig?.type === 'number';
            const newOperator = newIsNumber ? 'gte' : 'equals';
            onUpdate(rule.id, { field: newField, operator: newOperator, value: '' });
          }}
        >
          {Object.entries(FIELD_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>

        <button
          className="filter-remove-btn"
          onClick={() => onRemove(rule.id)}
          title="Filter entfernen"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="filter-rule-row">
        <select
          className="filter-operator-select"
          value={rule.operator}
          onChange={(e) => onUpdate(rule.id, { operator: e.target.value as FilterOperator })}
        >
          {operators.map((op) => (
            <option key={op.value} value={op.value}>
              {op.label}
            </option>
          ))}
        </select>
      </div>

      {needsValue && (
        <div className="filter-rule-row">
          {isNumber ? (
            <input
              type="number"
              className="filter-value-input"
              placeholder="Wert eingeben..."
              value={rule.value}
              onChange={(e) => onUpdate(rule.id, {
                value: e.target.value === '' ? '' : Number(e.target.value)
              })}
            />
          ) : hasOptions ? (
            <DropdownSelect
              value={String(rule.value)}
              options={fieldConfig.options!}
              placeholder="Wert auswählen..."
              onChange={(val) => onUpdate(rule.id, { value: val })}
            />
          ) : (
            <input
              type="text"
              className="filter-value-input"
              placeholder="Wert eingeben..."
              value={rule.value}
              onChange={(e) => onUpdate(rule.id, { value: e.target.value })}
            />
          )}
        </div>
      )}

      {needsSecondValue && (
        <div className="filter-rule-row">
          <span className="filter-between-text">bis</span>
          <input
            type="number"
            className="filter-value-input"
            placeholder="Max..."
            value={rule.value2 ?? ''}
            onChange={(e) => onUpdate(rule.id, {
              value2: e.target.value === '' ? undefined : Number(e.target.value)
            })}
          />
        </div>
      )}
    </div>
  );
}

// Evaluate filter rule
function evaluateRule(props: AnlagenProperties, rule: FilterRule): boolean {
  const fieldValue = props[rule.field];
  const { operator, value, value2 } = rule;

  if (fieldValue === null || fieldValue === undefined) {
    if (operator === 'is_empty') return true;
    if (operator === 'is_not_empty') return false;
    return false;
  }

  if (typeof fieldValue === 'string') {
    const strValue = fieldValue.toLowerCase();
    const searchValue = String(value).toLowerCase();

    switch (operator) {
      case 'contains': return strValue.includes(searchValue);
      case 'not_contains': return !strValue.includes(searchValue);
      case 'equals': return strValue === searchValue;
      case 'not_equals': return strValue !== searchValue;
      case 'starts_with': return strValue.startsWith(searchValue);
      case 'ends_with': return strValue.endsWith(searchValue);
      case 'is_empty': return strValue === '';
      case 'is_not_empty': return strValue !== '';
      default: return true;
    }
  }

  if (typeof fieldValue === 'number') {
    const numValue = fieldValue;
    const compareValue = typeof value === 'number' ? value : Number(value);

    switch (operator) {
      case 'equals': return numValue === compareValue;
      case 'not_equals': return numValue !== compareValue;
      case 'gt': return numValue > compareValue;
      case 'gte': return numValue >= compareValue;
      case 'lt': return numValue < compareValue;
      case 'lte': return numValue <= compareValue;
      case 'between':
        const max = typeof value2 === 'number' ? value2 : Number(value2);
        return numValue >= compareValue && numValue <= max;
      default: return true;
    }
  }

  return true;
}

export function AnlagenFilterPanel() {
  const { filters, layerVisibility, addFilterRule, updateFilterRule, removeFilterRule, clearFilterRules } = useStore();
  const { data: solarData } = useAnlagenData('solar');
  const { data: bessData } = useAnlagenData('bess');

  const rules = filters.anlagen.rules;

  // Compute counts
  const { totalCount, filteredCount } = useMemo(() => {
    const allFeatures = [
      ...(layerVisibility.anlagen_solar && solarData?.features ? solarData.features : []),
      ...(layerVisibility.anlagen_bess && bessData?.features ? bessData.features : []),
    ];

    const total = allFeatures.length;

    if (rules.length === 0) {
      return { totalCount: total, filteredCount: total };
    }

    const activeRules = rules.filter((rule) => {
      if (['is_empty', 'is_not_empty'].includes(rule.operator)) return true;
      if (rule.value === '' || rule.value === undefined) return false;
      return true;
    });

    if (activeRules.length === 0) {
      return { totalCount: total, filteredCount: total };
    }

    const filtered = allFeatures.filter((feature) => {
      const props = feature.properties as AnlagenProperties;
      return activeRules.every((rule) => evaluateRule(props, rule));
    }).length;

    return { totalCount: total, filteredCount: filtered };
  }, [solarData, bessData, rules, layerVisibility.anlagen_solar, layerVisibility.anlagen_bess]);

  const handleAddFilter = useCallback(() => {
    const newRule: FilterRule = {
      id: generateId(),
      field: 'bundesland',
      operator: 'equals',
      value: '',
    };
    addFilterRule(newRule);
  }, [addFilterRule]);

  return (
    <div className="anlagen-filter-panel">
      <h3>Anlagen Filter</h3>
      <p className="panel-description">
        Filtern Sie Solar- und BESS-Anlagen nach verschiedenen Kriterien
      </p>

      {/* Stats Bar */}
      <div className="filter-stats-bar">
        <div className="filter-stat">
          <span className="filter-stat-value">{filteredCount.toLocaleString('de-DE')}</span>
          <span className="filter-stat-label">Sichtbar</span>
        </div>
        <div className="filter-stat-divider">/</div>
        <div className="filter-stat">
          <span className="filter-stat-value">{totalCount.toLocaleString('de-DE')}</span>
          <span className="filter-stat-label">Gesamt</span>
        </div>
      </div>

      {/* Filter Rules */}
      <div className="filter-rules-list">
        {rules.map((rule) => (
          <FilterRuleCard
            key={rule.id}
            rule={rule}
            onUpdate={updateFilterRule}
            onRemove={removeFilterRule}
          />
        ))}

        {rules.length === 0 && (
          <div className="filter-empty-state">
            <p>Keine Filter aktiv</p>
            <p className="filter-empty-hint">Fügen Sie Filter hinzu, um die Anlagen einzugrenzen</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="filter-actions">
        <button className="filter-add-button" onClick={handleAddFilter}>
          <Plus size={16} />
          <span>Filter hinzufügen</span>
        </button>

        {rules.length > 0 && (
          <button className="filter-clear-button" onClick={clearFilterRules}>
            Alle löschen
          </button>
        )}
      </div>
    </div>
  );
}
