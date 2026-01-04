import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { useAnlagenData } from '../../hooks/useAnlagenData';
import type { FilterRule, FilterOperator, AnlagenProperties } from '../../types';

// Field definitions with display names, types, and optional predefined options
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
  { value: 'contains', label: 'enthält' },
  { value: 'not_contains', label: 'enthält nicht' },
  { value: 'equals', label: 'ist gleich' },
  { value: 'not_equals', label: 'ist nicht gleich' },
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

// Combobox component - allows both selection and free text input
interface ComboboxProps {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
}

function Combobox({ value, options, placeholder, onChange }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal state with prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    const lower = inputValue.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(lower));
  }, [options, inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleOptionClick = (option: string) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="combobox-wrapper" ref={wrapperRef}>
      <div className="combobox-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="filter-input combobox-input"
          value={inputValue}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
        />
        <button
          type="button"
          className="combobox-toggle"
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
        >
          ▼
        </button>
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div className="combobox-dropdown">
          {filteredOptions.map((option) => (
            <div
              key={option}
              className={`combobox-option ${option === inputValue ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterRowProps {
  rule: FilterRule;
  onUpdate: (id: string, updates: Partial<FilterRule>) => void;
  onRemove: (id: string) => void;
}

function FilterRow({ rule, onUpdate, onRemove }: FilterRowProps) {
  const fieldConfig = FIELD_CONFIG[rule.field];
  const isNumber = fieldConfig?.type === 'number';
  const hasOptions = fieldConfig?.options && fieldConfig.options.length > 0;
  const operators = isNumber ? NUMBER_OPERATORS : STRING_OPERATORS;
  const needsValue = !['is_empty', 'is_not_empty'].includes(rule.operator);
  const needsSecondValue = rule.operator === 'between';

  return (
    <div className="filter-row">
      <select
        className="filter-select field-select"
        value={rule.field}
        onChange={(e) => {
          const newField = e.target.value as keyof AnlagenProperties;
          const newFieldConfig = FIELD_CONFIG[newField];
          const newIsNumber = newFieldConfig?.type === 'number';
          // Reset operator when field type changes
          const newOperator = newIsNumber ? 'gte' : 'contains';
          onUpdate(rule.id, { field: newField, operator: newOperator, value: '' });
        }}
      >
        {Object.entries(FIELD_CONFIG).map(([key, config]) => (
          <option key={key} value={key}>
            {config.label}
          </option>
        ))}
      </select>

      <select
        className="filter-select operator-select"
        value={rule.operator}
        onChange={(e) => onUpdate(rule.id, { operator: e.target.value as FilterOperator })}
      >
        {operators.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {needsValue && (
        isNumber ? (
          <input
            type="number"
            className="filter-input"
            placeholder="0"
            value={rule.value}
            onChange={(e) => onUpdate(rule.id, {
              value: e.target.value === '' ? '' : Number(e.target.value)
            })}
          />
        ) : hasOptions ? (
          <Combobox
            value={String(rule.value)}
            options={fieldConfig.options!}
            placeholder="Wert wählen oder eingeben..."
            onChange={(val) => onUpdate(rule.id, { value: val })}
          />
        ) : (
          <input
            type="text"
            className="filter-input"
            placeholder="Wert..."
            value={rule.value}
            onChange={(e) => onUpdate(rule.id, { value: e.target.value })}
          />
        )
      )}

      {needsSecondValue && (
        <>
          <span className="filter-between-label">und</span>
          <input
            type="number"
            className="filter-input"
            placeholder="0"
            value={rule.value2 ?? ''}
            onChange={(e) => onUpdate(rule.id, {
              value2: e.target.value === '' ? undefined : Number(e.target.value)
            })}
          />
        </>
      )}

      <button
        className="filter-remove-btn"
        onClick={() => onRemove(rule.id)}
        title="Filter entfernen"
      >
        ×
      </button>
    </div>
  );
}

// Evaluate a single filter rule against properties
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

export function AdvancedFilterBar() {
  const { filters, layerVisibility, addFilterRule, updateFilterRule, removeFilterRule, clearFilterRules } = useStore();
  const { data: solarData } = useAnlagenData('solar');
  const { data: bessData } = useAnlagenData('bess');
  const [isExpanded, setIsExpanded] = useState(false);

  const rules = filters.anlagen.rules;
  const hasFilters = rules.length > 0;

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
    setIsExpanded(true);
  }, [addFilterRule]);

  const activeFilterCount = useMemo(() => {
    return rules.filter((rule) => {
      if (['is_empty', 'is_not_empty'].includes(rule.operator)) return true;
      if (rule.value === '' || rule.value === undefined) return false;
      return true;
    }).length;
  }, [rules]);

  return (
    <div className={`advanced-filter-bar ${isExpanded ? 'expanded' : ''}`}>
      <div className="filter-bar-header">
        <div className="filter-bar-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </div>

        <div className="filter-bar-actions">
          <span className="filter-results">
            {filteredCount.toLocaleString('de-DE')} / {totalCount.toLocaleString('de-DE')}
          </span>

          {hasFilters && (
            <>
              <button
                className="filter-toggle-btn"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Einklappen' : 'Bearbeiten'}
              </button>
              <button
                className="filter-clear-btn"
                onClick={clearFilterRules}
              >
                Alle löschen
              </button>
            </>
          )}

          <button className="filter-add-btn" onClick={handleAddFilter}>
            + Filter hinzufügen
          </button>
        </div>
      </div>

      {isExpanded && hasFilters && (
        <div className="filter-rules-container">
          {rules.map((rule) => (
            <FilterRow
              key={rule.id}
              rule={rule}
              onUpdate={updateFilterRule}
              onRemove={removeFilterRule}
            />
          ))}
        </div>
      )}

      {!isExpanded && hasFilters && (
        <div className="filter-chips">
          {rules.map((rule) => {
            const fieldConfig = FIELD_CONFIG[rule.field];
            const operators = fieldConfig?.type === 'number' ? NUMBER_OPERATORS : STRING_OPERATORS;
            const operatorLabel = operators.find((op) => op.value === rule.operator)?.label || rule.operator;

            let displayValue = '';
            if (['is_empty', 'is_not_empty'].includes(rule.operator)) {
              displayValue = '';
            } else if (rule.operator === 'between') {
              displayValue = `${rule.value} - ${rule.value2 ?? '?'}`;
            } else {
              displayValue = String(rule.value);
            }

            return (
              <div key={rule.id} className="filter-chip-item">
                <span className="chip-field">{fieldConfig?.label}</span>
                <span className="chip-operator">{operatorLabel}</span>
                {displayValue && <span className="chip-value">{displayValue}</span>}
                <button
                  className="chip-remove"
                  onClick={() => removeFilterRule(rule.id)}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
