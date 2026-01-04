import type { Feature, FeatureCollection } from 'geojson';

export const GERMANY_CENTER: [number, number] = [51.1657, 10.4515];
export const GERMANY_BOUNDS: [[number, number], [number, number]] = [
  [47.27, 5.87],
  [55.1, 15.04]
];

export function getVoltageColor(voltageTypes: string | string[] | undefined): string {
  if (!voltageTypes) return '#888888';

  const types = Array.isArray(voltageTypes)
    ? voltageTypes
    : voltageTypes.split(',').map(t => t.trim());

  const hasMittel = types.some(t => t.includes('Mittelspannung'));
  const hasNiedrig = types.some(t => t.includes('Niederspannung'));

  if (hasMittel && hasNiedrig) return '#9b59b6'; // Purple for both
  if (hasMittel) return '#e74c3c'; // Red for medium voltage
  if (hasNiedrig) return '#3498db'; // Blue for low voltage
  return '#888888';
}

export function formatArea(areaInSqM: number): string {
  if (!areaInSqM || areaInSqM <= 0) return 'N/A';

  const areaInSqKm = areaInSqM / 1_000_000;

  if (areaInSqKm < 1) {
    return `${areaInSqM.toLocaleString('de-DE', { maximumFractionDigits: 0 })} m²`;
  }

  return `${areaInSqKm.toLocaleString('de-DE', { maximumFractionDigits: 1 })} km²`;
}

export function bboxIntersects(
  bbox1: [number, number, number, number] | undefined,
  bbox2: [[number, number], [number, number]] | null
): boolean {
  if (!bbox1 || !bbox2) return true;

  const [minLon1, minLat1, maxLon1, maxLat1] = bbox1;
  const [[minLat2, minLon2], [maxLat2, maxLon2]] = bbox2;

  return !(
    maxLon1 < minLon2 ||
    minLon1 > maxLon2 ||
    maxLat1 < minLat2 ||
    minLat1 > maxLat2
  );
}

export function getFeatureName(feature: Feature): string {
  const props = feature.properties || {};
  return (
    props.vnbName ||
    props.name ||
    props.gen ||
    props.NAME_1 ||
    props.NAME_2 ||
    props.NAME_3 ||
    'Unknown'
  );
}

export function combineFeatureCollections(
  collections: FeatureCollection[]
): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: collections.flatMap(fc => fc.features)
  };
}

export const BUNDESLAENDER_COLORS: Record<string, string> = {
  'Baden-Württemberg': '#1f77b4',
  'Bayern': '#ff7f0e',
  'Berlin': '#2ca02c',
  'Brandenburg': '#d62728',
  'Bremen': '#9467bd',
  'Hamburg': '#8c564b',
  'Hessen': '#e377c2',
  'Mecklenburg-Vorpommern': '#7f7f7f',
  'Niedersachsen': '#bcbd22',
  'Nordrhein-Westfalen': '#17becf',
  'Rheinland-Pfalz': '#aec7e8',
  'Saarland': '#ffbb78',
  'Sachsen': '#98df8a',
  'Sachsen-Anhalt': '#ff9896',
  'Schleswig-Holstein': '#c5b0d5',
  'Thüringen': '#c49c94'
};
