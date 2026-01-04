import { useMemo, useCallback } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { useStore } from '../../store';
import { useAnlagenData } from '../../hooks/useAnlagenData';
import type { Feature, Point } from 'geojson';
import type { AnlagenProperties, FilterRule } from '../../types';

interface AnlagenLayerProps {
  type: 'solar' | 'bess';
}

const COLORS = {
  solar: '#ff9500',  // Solar orange
  bess: '#a855f7'    // Storage purple
};

function formatPower(kw: number): string {
  if (kw >= 1000) {
    return `${(kw / 1000).toFixed(1)} MW`;
  }
  return `${kw.toFixed(0)} kW`;
}

function getMarkerRadius(power: number): number {
  // Scale radius based on power: 5-15 pixels
  if (power >= 100000) return 15;
  if (power >= 50000) return 12;
  if (power >= 10000) return 10;
  if (power >= 5000) return 8;
  return 6;
}

// Evaluate a single filter rule against properties
function evaluateRule(props: AnlagenProperties, rule: FilterRule): boolean {
  const fieldValue = props[rule.field];
  const { operator, value, value2 } = rule;

  // Handle null/undefined field values
  if (fieldValue === null || fieldValue === undefined) {
    if (operator === 'is_empty') return true;
    if (operator === 'is_not_empty') return false;
    return false;
  }

  // String operations
  if (typeof fieldValue === 'string') {
    const strValue = fieldValue.toLowerCase();
    const searchValue = String(value).toLowerCase();

    switch (operator) {
      case 'contains':
        return strValue.includes(searchValue);
      case 'not_contains':
        return !strValue.includes(searchValue);
      case 'equals':
        return strValue === searchValue;
      case 'not_equals':
        return strValue !== searchValue;
      case 'starts_with':
        return strValue.startsWith(searchValue);
      case 'ends_with':
        return strValue.endsWith(searchValue);
      case 'is_empty':
        return strValue === '';
      case 'is_not_empty':
        return strValue !== '';
      default:
        return true;
    }
  }

  // Number operations
  if (typeof fieldValue === 'number') {
    const numValue = fieldValue;
    const compareValue = typeof value === 'number' ? value : Number(value);

    switch (operator) {
      case 'equals':
        return numValue === compareValue;
      case 'not_equals':
        return numValue !== compareValue;
      case 'gt':
        return numValue > compareValue;
      case 'gte':
        return numValue >= compareValue;
      case 'lt':
        return numValue < compareValue;
      case 'lte':
        return numValue <= compareValue;
      case 'between':
        const max = typeof value2 === 'number' ? value2 : Number(value2);
        return numValue >= compareValue && numValue <= max;
      default:
        return true;
    }
  }

  return true;
}

export function AnlagenLayer({ type }: AnlagenLayerProps) {
  const { layerVisibility, filters } = useStore();
  const { data, isLoading } = useAnlagenData(type);

  const isVisible = type === 'solar'
    ? layerVisibility.anlagen_solar
    : layerVisibility.anlagen_bess;

  // Filter features based on filter rules (AND logic)
  const filteredFeatures = useMemo(() => {
    if (!data?.features) return [];

    const rules = filters.anlagen.rules;

    // If no rules, show all features
    if (rules.length === 0) {
      return data.features;
    }

    // Filter rules that have valid values
    const activeRules = rules.filter((rule) => {
      if (['is_empty', 'is_not_empty'].includes(rule.operator)) return true;
      if (rule.value === '' || rule.value === undefined) return false;
      return true;
    });

    if (activeRules.length === 0) {
      return data.features;
    }

    return data.features.filter((feature) => {
      const props = feature.properties as AnlagenProperties;
      // All rules must pass (AND logic)
      return activeRules.every((rule) => evaluateRule(props, rule));
    });
  }, [data, filters.anlagen.rules]);

  const renderMarker = useCallback((feature: Feature<Point, AnlagenProperties>) => {
    const [lng, lat] = feature.geometry.coordinates;
    const props = feature.properties;

    return (
      <CircleMarker
        key={props.id}
        center={[lat, lng]}
        radius={getMarkerRadius(props.grossPower)}
        pane="anlagenPane"
        pathOptions={{
          fillColor: COLORS[type],
          fillOpacity: 0.7,
          color: '#fff',
          weight: 1,
          opacity: 0.9
        }}
      >
        <Popup>
          <div className="anlagen-popup">
            <h3>{props.name}</h3>
            <table>
              <tbody>
                <tr>
                  <td><strong>MaStR-Nr:</strong></td>
                  <td>{props.id}</td>
                </tr>
                <tr>
                  <td><strong>Typ:</strong></td>
                  <td>{type === 'solar' ? 'Solaranlage' : 'Batteriespeicher'}</td>
                </tr>
                <tr>
                  <td><strong>Status:</strong></td>
                  <td>{props.status}</td>
                </tr>
                <tr>
                  <td><strong>Bruttoleistung:</strong></td>
                  <td>{formatPower(props.grossPower)}</td>
                </tr>
                <tr>
                  <td><strong>Nettoleistung:</strong></td>
                  <td>{formatPower(props.netPower)}</td>
                </tr>
                {props.commissioningDate && (
                  <tr>
                    <td><strong>Inbetriebnahme:</strong></td>
                    <td>{props.commissioningDate}</td>
                  </tr>
                )}
                <tr>
                  <td><strong>PLZ / Ort:</strong></td>
                  <td>{props.postalCode} {props.city}</td>
                </tr>
                <tr>
                  <td><strong>Bundesland:</strong></td>
                  <td>{props.bundesland}</td>
                </tr>
                {props.operator && (
                  <tr>
                    <td><strong>Betreiber:</strong></td>
                    <td>{props.operator}</td>
                  </tr>
                )}
                {/* Solar-specific fields */}
                {type === 'solar' && props.solarType && (
                  <tr>
                    <td><strong>Anlagenart:</strong></td>
                    <td>{props.solarType}</td>
                  </tr>
                )}
                {type === 'solar' && props.moduleCount && props.moduleCount > 0 && (
                  <tr>
                    <td><strong>Anzahl Module:</strong></td>
                    <td>{props.moduleCount.toLocaleString('de-DE')}</td>
                  </tr>
                )}
                {/* BESS-specific fields */}
                {type === 'bess' && props.storageTechnology && (
                  <tr>
                    <td><strong>Technologie:</strong></td>
                    <td>{props.storageTechnology}</td>
                  </tr>
                )}
                {type === 'bess' && props.storageCapacity > 0 && (
                  <tr>
                    <td><strong>Kapazität:</strong></td>
                    <td>{props.storageCapacity.toLocaleString('de-DE')} kWh</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Popup>
      </CircleMarker>
    );
  }, [type]);

  // Don't render if layer is off or loading
  if (!isVisible || isLoading) return null;
  if (!data || filteredFeatures.length === 0) return null;

  return (
    <>
      {filteredFeatures.map((feature) =>
        renderMarker(feature as Feature<Point, AnlagenProperties>)
      )}
    </>
  );
}
