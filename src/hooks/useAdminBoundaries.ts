import { useEffect } from 'react';
import { useStore } from '../store';
import type { FeatureCollection } from 'geojson';

type AdminType = 'bundeslaender' | 'kreise' | 'gemeinden';

const BASE = import.meta.env.BASE_URL;

const ADMIN_URLS: Record<AdminType, string> = {
  bundeslaender: `${BASE}data/admin/bundeslaender.geojson`,
  kreise: `${BASE}data/admin/kreise.geojson`,
  gemeinden: `${BASE}data/admin/gemeinden.geojson`
};

// Minimum zoom levels for loading each layer
const MIN_ZOOM_FOR_LOAD: Record<AdminType, number> = {
  bundeslaender: 0,
  kreise: 6,
  gemeinden: 10  // Only load Gemeinden at high zoom to prevent crash
};

export function useAdminBoundaries(type: AdminType, shouldLoad: boolean = true) {
  const { adminData, setAdminData, loading, setLoading, viewport } = useStore();

  // Check if zoom is sufficient for this layer type
  const zoomSufficient = viewport.zoom >= MIN_ZOOM_FOR_LOAD[type];

  useEffect(() => {
    // Don't load if already loaded, currently loading, or shouldn't load
    if (adminData[type]) return;
    if (loading.admin[type]) return;
    if (!shouldLoad) return;
    if (!zoomSufficient) return;

    async function loadData() {
      setLoading(`admin.${type}`, true);
      // console.log(`Loading ${type}...`);
      try {
        const response = await fetch(ADMIN_URLS[type]);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data: FeatureCollection = await response.json();
        // console.log(`Loaded ${type}: ${data.features.length} features`);
        setAdminData(type, data);
      } catch (error) {
        console.error(`Failed to load ${type}:`, error);
      } finally {
        setLoading(`admin.${type}`, false);
      }
    }

    loadData();
  }, [type, adminData, setAdminData, loading.admin, setLoading, shouldLoad, zoomSufficient]);

  return {
    data: adminData[type],
    isLoading: loading.admin[type] || false,
    zoomSufficient
  };
}

export function useBundeslaender() {
  return useAdminBoundaries('bundeslaender');
}

export function useKreise() {
  return useAdminBoundaries('kreise');
}

export function useGemeinden() {
  return useAdminBoundaries('gemeinden');
}
