import { useStore } from '../../store';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import type { LayerId } from '../../types';

interface LayerConfig {
  id: LayerId;
  label: string;
  description: string;
  color: string;
}

const LAYERS: LayerConfig[] = [
  {
    id: 'anlagen_solar',
    label: 'Solar Anlagen',
    description: '>999 kW Solaranlagen',
    color: '#ff9500'
  },
  {
    id: 'anlagen_bess',
    label: 'BESS Speicher',
    description: '>999 kW Batteriespeicher',
    color: '#a855f7'
  },
  {
    id: 'vnb',
    label: 'VNB Gebiete',
    description: 'Verteilnetzbetreiber',
    color: '#3b82f6'
  },
  {
    id: 'bundeslaender',
    label: 'Bundesländer',
    description: '16 Bundesländer',
    color: '#00d4ff'
  },
  {
    id: 'kreise',
    label: 'Landkreise',
    description: '~400 Kreise (ab Zoom 7)',
    color: '#22c55e'
  },
  {
    id: 'gemeinden',
    label: 'Gemeinden',
    description: '~11.000 Gemeinden (ab Zoom 9)',
    color: '#ec4899'
  }
];

export function LayerPanel() {
  const { layerVisibility, toggleLayer } = useStore();

  return (
    <div className="layer-panel">
      <h3>Kartenebenen</h3>
      <p className="panel-description">
        Wählen Sie die anzuzeigenden Ebenen
      </p>

      <div className="layer-list">
        {LAYERS.map(layer => {
          const isVisible = layerVisibility[layer.id];

          return (
            <button
              key={layer.id}
              className={clsx('layer-item', { active: isVisible })}
              onClick={() => toggleLayer(layer.id)}
            >
              <span
                className="layer-color"
                style={{ backgroundColor: layer.color }}
              />
              <div className="layer-info">
                <span className="layer-label">{layer.label}</span>
                <span className="layer-description">{layer.description}</span>
              </div>
              <span className="layer-toggle">
                {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="legend">
        <h4>Legende - Spannungsebenen</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ef4444' }} />
            <span>Mittelspannung</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#3b82f6' }} />
            <span>Niederspannung</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#a855f7' }} />
            <span>Beide</span>
          </div>
        </div>
      </div>
    </div>
  );
}
