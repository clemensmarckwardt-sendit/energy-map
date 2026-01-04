import { GeoJSON } from 'react-leaflet';
import { useStore } from '../../store';
import { useAdminBoundaries } from '../../hooks/useAdminBoundaries';
import { getFeatureName, BUNDESLAENDER_COLORS } from '../../utils/geoUtils';
import type { Feature, Geometry, GeoJsonProperties } from 'geojson';
import type { PathOptions, Layer } from 'leaflet';

interface AdminLayerProps {
  type: 'bundeslaender' | 'kreise' | 'gemeinden';
}

const LAYER_STYLES: Record<string, PathOptions> = {
  bundeslaender: {
    weight: 2,
    opacity: 0.8,
    color: '#333',
    fillOpacity: 0.1,
    fillColor: '#ff7800'
  },
  kreise: {
    weight: 1,
    opacity: 0.6,
    color: '#666',
    fillOpacity: 0.05,
    fillColor: '#27ae60'
  },
  gemeinden: {
    weight: 0.5,
    opacity: 0.4,
    color: '#999',
    fillOpacity: 0.02,
    fillColor: '#9b59b6'
  }
};

// Minimum zoom levels for displaying each layer
const MIN_ZOOM_FOR_DISPLAY: Record<string, number> = {
  bundeslaender: 0,
  kreise: 7,
  gemeinden: 10
};

export function AdminLayer({ type }: AdminLayerProps) {
  const { layerVisibility, viewport } = useStore();

  // Check if zoom is sufficient before loading
  const zoomSufficient = viewport.zoom >= MIN_ZOOM_FOR_DISPLAY[type];

  // Only fetch data if layer is visible AND zoom is sufficient
  const shouldLoad = layerVisibility[type] && zoomSufficient;
  const { data, isLoading } = useAdminBoundaries(type, shouldLoad);

  // Don't render if layer is hidden
  if (!layerVisibility[type]) return null;

  // Don't render if zoom is too low
  if (!zoomSufficient) return null;

  if (isLoading) {
    return null; // Could add a loading indicator here
  }

  if (!data) return null;

  const style = (feature?: Feature<Geometry, GeoJsonProperties>): PathOptions => {
    const baseStyle = LAYER_STYLES[type];
    if (!feature) return baseStyle;

    if (type === 'bundeslaender') {
      const name = getFeatureName(feature);
      const color = BUNDESLAENDER_COLORS[name] || baseStyle.fillColor;
      return { ...baseStyle, fillColor: color };
    }

    return baseStyle;
  };

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const name = getFeatureName(feature);
    const props = feature.properties || {};

    let popupContent = `<strong>${name}</strong>`;

    if (type === 'bundeslaender') {
      popupContent += '<br/><em>Bundesland</em>';
    } else if (type === 'kreise') {
      const bez = props.bez || props.BEZ || '';
      popupContent += `<br/><em>${bez || 'Landkreis'}</em>`;
    } else if (type === 'gemeinden') {
      popupContent += '<br/><em>Gemeinde</em>';
    }

    layer.bindPopup(popupContent);

    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          weight: type === 'bundeslaender' ? 3 : 2,
          fillOpacity: 0.3
        });
        target.bringToFront();
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle(style(feature));
      }
    });
  };

  return (
    <GeoJSON
      key={`${type}-${data.features.length}`}
      data={data}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}
