import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import { useStore } from '../../store';
import { useVNBIndex } from '../../hooks/useVNBData';

const BASE = import.meta.env.BASE_URL;
import { getVoltageColor, formatArea } from '../../utils/geoUtils';
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import type { PathOptions, Layer, LatLngBounds } from 'leaflet';

// Batch size for parallel loading
const BATCH_SIZE = 20;

export function VNBLayer() {
  const map = useMap();
  const { layerVisibility, setSelectedVNB, filters } = useStore();
  const { vnbIndex, isLoading: indexLoading } = useVNBIndex();
  const [displayData, setDisplayData] = useState<FeatureCollection | null>(null);
  const [loadProgress, setLoadProgress] = useState({ loaded: 0, total: 0 });
  const loadedVNBsRef = useRef<Map<string, FeatureCollection>>(new Map());
  const loadingRef = useRef(false);

  // Filter VNBs based on search and voltage type
  const filteredVNBs = useMemo(() => {
    if (!vnbIndex) return [];

    let result = vnbIndex.vnbs;

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(vnb =>
        vnb.vnbName.toLowerCase().includes(query) ||
        vnb.vnbId.toLowerCase().includes(query)
      );
    }

    // Filter by voltage type
    if (filters.voltageTypes.length > 0) {
      result = result.filter(vnb =>
        filters.voltageTypes.some(vt => vnb.voltageTypes.includes(vt))
      );
    }

    return result;
  }, [vnbIndex, filters.searchQuery, filters.voltageTypes]);

  // Get list of VNB IDs to load (for stable dependency)
  const vnbIdsToLoad = useMemo(() => {
    return filteredVNBs.map(v => v.id).join(',');
  }, [filteredVNBs]);

  // Load ALL VNB geometries when layer is selected
  useEffect(() => {
    if (!layerVisibility.vnb || filteredVNBs.length === 0) {
      setDisplayData(null);
      setLoadProgress({ loaded: 0, total: 0 });
      return;
    }

    if (loadingRef.current) {
      return; // Skip if already loading
    }

    let cancelled = false;

    async function loadAllGeometries() {
      loadingRef.current = true;
      const allFeatures: Feature[] = [];
      const toLoad = filteredVNBs;

      setLoadProgress({ loaded: 0, total: toLoad.length });

      // Load in batches for better performance
      for (let i = 0; i < toLoad.length; i += BATCH_SIZE) {
        if (cancelled) break;

        const batch = toLoad.slice(i, i + BATCH_SIZE);

        // Load batch in parallel
        const batchPromises = batch.map(async (vnb) => {
          // Check cache first
          if (loadedVNBsRef.current.has(vnb.id)) {
            return loadedVNBsRef.current.get(vnb.id)?.features || [];
          }

          // Load from server
          try {
            const response = await fetch(`${BASE}data/vnb/full/${vnb.fileName}`);
            if (response.ok) {
              const data = await response.json();
              loadedVNBsRef.current.set(vnb.id, data);
              return data?.features || [];
            }
          } catch (error) {
            console.error(`Failed to load VNB ${vnb.fileName}:`, error);
          }
          return [];
        });

        const batchResults = await Promise.all(batchPromises);

        for (const features of batchResults) {
          allFeatures.push(...features);
        }

        // Update progress and display incrementally
        if (!cancelled) {
          const loaded = Math.min(i + BATCH_SIZE, toLoad.length);
          setLoadProgress({ loaded, total: toLoad.length });

          // Update display after each batch
          setDisplayData({
            type: 'FeatureCollection',
            features: [...allFeatures]
          });
        }
      }

      loadingRef.current = false;
    }

    loadAllGeometries();

    return () => {
      cancelled = true;
    };
  }, [vnbIdsToLoad, layerVisibility.vnb, filteredVNBs]);

  const style = useCallback((feature?: Feature<Geometry, GeoJsonProperties>): PathOptions => {
    const props = feature?.properties || {};
    const voltageTypes = props.voltageTypes || props['properties.voltageTypes'];

    return {
      fillColor: getVoltageColor(voltageTypes),
      weight: 1.5,
      opacity: 0.8,
      color: '#2c3e50',
      fillOpacity: 0.4
    };
  }, []);

  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    const props = feature.properties || {};
    const name = props.vnbName || 'Unknown VNB';
    const voltageTypes = props.voltageTypes || props['properties.voltageTypes'] || '';
    const area = props['properties.geometryArea'] || props.geometryArea || 0;

    const popupContent = `
      <div class="vnb-popup">
        <h3>${name}</h3>
        <table>
          <tr><td><strong>VNB ID:</strong></td><td>${props.vnbId || props['properties.vnbId'] || 'N/A'}</td></tr>
          <tr><td><strong>Voltage:</strong></td><td>${voltageTypes}</td></tr>
          <tr><td><strong>Area:</strong></td><td>${formatArea(area)}</td></tr>
          <tr><td><strong>Status:</strong></td><td>${props.state || 'N/A'}</td></tr>
        </table>
      </div>
    `;

    layer.bindPopup(popupContent);

    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          weight: 3,
          fillOpacity: 0.6
        });
        target.bringToFront();
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle(style(feature));
      },
      click: () => {
        const id = feature.id || props._id;
        setSelectedVNB(id?.toString() || null);

        // Zoom to feature
        const getBounds = (layer as unknown as { getBounds?: () => LatLngBounds }).getBounds;
        if (getBounds) {
          const bounds = getBounds();
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    });
  }, [style, setSelectedVNB, map]);

  // Don't render if layer is off or index is loading
  if (!layerVisibility.vnb || indexLoading) return null;

  // Show loading progress
  const isLoading = loadProgress.total > 0 && loadProgress.loaded < loadProgress.total;

  return (
    <>
      {isLoading && (
        <div className="vnb-loading-indicator">
          Loading VNBs: {loadProgress.loaded} / {loadProgress.total}
        </div>
      )}
      {displayData && displayData.features.length > 0 && (
        <GeoJSON
          key={`vnb-${displayData.features.length}`}
          data={displayData}
          style={style}
          onEachFeature={onEachFeature}
        />
      )}
    </>
  );
}
