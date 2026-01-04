import { useEffect } from 'react';
import { useStore } from '../store';
import type { FeatureCollection } from 'geojson';

type AnlagenType = 'solar' | 'bess';

const ANLAGEN_URLS: Record<AnlagenType, string> = {
  solar: '/data/anlagen/solar.geojson',
  bess: '/data/anlagen/bess.geojson'
};

export function useAnlagenData(type: AnlagenType) {
  const { anlagenData, setAnlagenData, loading, setLoading, layerVisibility } = useStore();

  const isLayerVisible = type === 'solar'
    ? layerVisibility.anlagen_solar
    : layerVisibility.anlagen_bess;

  useEffect(() => {
    // Don't load if already loaded or currently loading
    if (anlagenData[type]) return;
    if (loading.anlagen?.[type]) return;
    // Only load when layer is visible
    if (!isLayerVisible) return;

    async function loadData() {
      setLoading(`anlagen.${type}`, true);
      try {
        const response = await fetch(ANLAGEN_URLS[type]);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data: FeatureCollection = await response.json();
        setAnlagenData(type, data);
      } catch (error) {
        console.error(`Failed to load ${type} anlagen:`, error);
      } finally {
        setLoading(`anlagen.${type}`, false);
      }
    }

    loadData();
  }, [type, anlagenData, setAnlagenData, loading.anlagen, setLoading, isLayerVisible]);

  return {
    data: anlagenData[type],
    isLoading: loading.anlagen?.[type] || false
  };
}

export function useSolarAnlagen() {
  return useAnlagenData('solar');
}

export function useBESSAnlagen() {
  return useAnlagenData('bess');
}
