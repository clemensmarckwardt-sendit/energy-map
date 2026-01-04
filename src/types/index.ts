import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';

export interface VNBProperties {
  id: string | null;
  type: string;
  vnbId: string;
  vnbName: string;
  voltageTypes: string;
  state: string;
  geometryArea?: number;
  'properties.geometryArea'?: number;
  'properties.vnbId'?: string;
  'properties.voltageTypes'?: string;
  'properties.type'?: string;
  _id?: string;
}

export interface VNBFeature extends Feature<Polygon | MultiPolygon, VNBProperties> {
  bbox?: [number, number, number, number];
}

export interface VNBFeatureCollection extends FeatureCollection<Polygon | MultiPolygon, VNBProperties> {
  bbox?: [number, number, number, number];
}

export interface VNBIndexEntry {
  id: string;
  vnbId: string;
  vnbName: string;
  voltageTypes: string[];
  bbox: [number, number, number, number];
  area: number;
  fileName: string;
}

export interface VNBIndex {
  vnbs: VNBIndexEntry[];
  totalCount: number;
  byVoltageType: Record<string, string[]>;
}

export interface AdminProperties {
  NAME_0?: string; // Country
  NAME_1?: string; // State
  NAME_2?: string; // District
  NAME_3?: string; // Municipality
  name?: string;
  gen?: string;
  bez?: string;
  ags?: string;
}

export type LayerId = 'vnb' | 'bundeslaender' | 'kreise' | 'gemeinden' | 'anlagen_solar' | 'anlagen_bess';

export interface LayerVisibility {
  vnb: boolean;
  bundeslaender: boolean;
  kreise: boolean;
  gemeinden: boolean;
  anlagen_solar: boolean;
  anlagen_bess: boolean;
}

// Advanced filter types
export type FilterOperator =
  // String operators
  | 'contains'
  | 'not_contains'
  | 'equals'
  | 'not_equals'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  // Number operators
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between';

export interface FilterRule {
  id: string;
  field: keyof AnlagenProperties;
  operator: FilterOperator;
  value: string | number;
  value2?: number; // for 'between' operator
}

export interface AnlagenFilters {
  rules: FilterRule[];
}

export interface Filters {
  voltageTypes: string[];
  searchQuery: string;
  anlagen: AnlagenFilters;
}

export interface AnlagenProperties {
  id: string;
  name: string;
  type: 'solar' | 'bess';
  status: string;
  grossPower: number;
  netPower: number;
  bundesland: string;
  city: string;
  postalCode: string;
  operator: string;
  commissioningDate: string;
  storageTechnology: string | null;
  storageCapacity: number;
  solarType: string | null;
  moduleCount: number | null;
}

export interface ViewportState {
  center: [number, number];
  zoom: number;
  bounds: [[number, number], [number, number]] | null;
}
