import { create } from 'zustand';
import type { FeatureCollection } from 'geojson';
import type { VNBIndex, VNBFeatureCollection, LayerVisibility, Filters, ViewportState, LayerId, FilterRule } from '../types';

interface GeoStore {
  // Viewport
  viewport: ViewportState;
  setViewport: (viewport: Partial<ViewportState>) => void;

  // Layer visibility
  layerVisibility: LayerVisibility;
  toggleLayer: (layerId: LayerId) => void;

  // Filters
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;

  // Anlagen filter rules
  addFilterRule: (rule: FilterRule) => void;
  updateFilterRule: (id: string, updates: Partial<FilterRule>) => void;
  removeFilterRule: (id: string) => void;
  clearFilterRules: () => void;
  setFilterRules: (rules: FilterRule[]) => void;

  // Selected feature
  selectedVNB: string | null;
  setSelectedVNB: (id: string | null) => void;

  // Data
  vnbIndex: VNBIndex | null;
  setVnbIndex: (index: VNBIndex) => void;

  adminData: {
    bundeslaender: FeatureCollection | null;
    kreise: FeatureCollection | null;
    gemeinden: FeatureCollection | null;
  };
  setAdminData: (type: 'bundeslaender' | 'kreise' | 'gemeinden', data: FeatureCollection) => void;

  // Anlagen data
  anlagenData: {
    solar: FeatureCollection | null;
    bess: FeatureCollection | null;
  };
  setAnlagenData: (type: 'solar' | 'bess', data: FeatureCollection) => void;

  // Loaded VNB geometries cache
  loadedVNBs: Map<string, VNBFeatureCollection>;
  addLoadedVNB: (id: string, data: VNBFeatureCollection) => void;

  // Loading states
  loading: {
    vnbIndex: boolean;
    admin: Record<string, boolean>;
    vnbDetails: Set<string>;
    anlagen: Record<string, boolean>;
  };
  setLoading: (key: string, value: boolean) => void;
}

export const useStore = create<GeoStore>((set) => ({
  // Viewport - centered on Germany
  viewport: {
    center: [51.1657, 10.4515],
    zoom: 6,
    bounds: null
  },
  setViewport: (viewport) => set((state) => ({
    viewport: { ...state.viewport, ...viewport }
  })),

  // Layer visibility
  layerVisibility: {
    vnb: true,
    bundeslaender: true,
    kreise: false,
    gemeinden: false,
    anlagen_solar: true,
    anlagen_bess: true
  },
  toggleLayer: (layerId) => set((state) => ({
    layerVisibility: {
      ...state.layerVisibility,
      [layerId]: !state.layerVisibility[layerId]
    }
  })),

  // Filters
  filters: {
    voltageTypes: [],
    searchQuery: '',
    anlagen: {
      rules: []
    }
  },
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),

  // Anlagen filter rule actions
  addFilterRule: (rule) => set((state) => ({
    filters: {
      ...state.filters,
      anlagen: {
        rules: [...state.filters.anlagen.rules, rule]
      }
    }
  })),
  updateFilterRule: (id, updates) => set((state) => ({
    filters: {
      ...state.filters,
      anlagen: {
        rules: state.filters.anlagen.rules.map((rule) =>
          rule.id === id ? { ...rule, ...updates } : rule
        )
      }
    }
  })),
  removeFilterRule: (id) => set((state) => ({
    filters: {
      ...state.filters,
      anlagen: {
        rules: state.filters.anlagen.rules.filter((rule) => rule.id !== id)
      }
    }
  })),
  clearFilterRules: () => set((state) => ({
    filters: {
      ...state.filters,
      anlagen: { rules: [] }
    }
  })),
  setFilterRules: (rules) => set((state) => ({
    filters: {
      ...state.filters,
      anlagen: { rules }
    }
  })),

  // Selected
  selectedVNB: null,
  setSelectedVNB: (id) => set({ selectedVNB: id }),

  // Data
  vnbIndex: null,
  setVnbIndex: (index) => set({ vnbIndex: index }),

  adminData: {
    bundeslaender: null,
    kreise: null,
    gemeinden: null
  },
  setAdminData: (type, data) => set((state) => ({
    adminData: { ...state.adminData, [type]: data }
  })),

  // Anlagen data
  anlagenData: {
    solar: null,
    bess: null
  },
  setAnlagenData: (type, data) => set((state) => ({
    anlagenData: { ...state.anlagenData, [type]: data }
  })),

  loadedVNBs: new Map(),
  addLoadedVNB: (id, data) => set((state) => {
    const newMap = new Map(state.loadedVNBs);
    // LRU eviction - keep max 100 entries
    if (newMap.size >= 100) {
      const firstKey = newMap.keys().next().value;
      if (firstKey) newMap.delete(firstKey);
    }
    newMap.set(id, data);
    return { loadedVNBs: newMap };
  }),

  // Loading
  loading: {
    vnbIndex: false,
    admin: {},
    vnbDetails: new Set(),
    anlagen: {}
  },
  setLoading: (key, value) => set((state) => ({
    loading: { ...state.loading, [key]: value }
  }))
}));
