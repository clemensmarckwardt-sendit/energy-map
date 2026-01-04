import * as fs from 'fs';
import * as path from 'path';

interface VNBIndexEntry {
  id: string;
  vnbId: string;
  vnbName: string;
  voltageTypes: string[];
  bbox: [number, number, number, number];
  area: number;
  fileName: string;
}

interface VNBIndex {
  vnbs: VNBIndexEntry[];
  totalCount: number;
  byVoltageType: Record<string, string[]>;
}

const VNB_DIR = path.join(__dirname, '../../vnbs');
const OUTPUT_DIR = path.join(__dirname, '../public/data/vnb');

async function buildIndex(): Promise<void> {
  console.log('Building VNB index...');

  const files = fs.readdirSync(VNB_DIR).filter(f => f.endsWith('.geojson'));
  console.log(`Found ${files.length} VNB files`);

  const index: VNBIndex = {
    vnbs: [],
    totalCount: files.length,
    byVoltageType: {
      Mittelspannung: [],
      Niederspannung: [],
    }
  };

  for (const file of files) {
    try {
      const filePath = path.join(VNB_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const geojson = JSON.parse(content);

      if (!geojson.features || geojson.features.length === 0) continue;

      const feature = geojson.features[0];
      const props = feature.properties || {};

      const voltageTypesRaw = props.voltageTypes || props['properties.voltageTypes'] || '';
      const voltageTypes = parseVoltageTypes(voltageTypesRaw);

      const entry: VNBIndexEntry = {
        id: feature.id || props._id || file.replace('.geojson', ''),
        vnbId: props.vnbId || props['properties.vnbId'] || '',
        vnbName: props.vnbName || 'Unknown',
        voltageTypes,
        bbox: feature.bbox || geojson.bbox || [0, 0, 0, 0],
        area: props['properties.geometryArea'] || props.geometryArea || 0,
        fileName: file
      };

      index.vnbs.push(entry);

      // Index by voltage type
      for (const vt of voltageTypes) {
        if (index.byVoltageType[vt]) {
          index.byVoltageType[vt].push(entry.id);
        }
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }

  // Sort by name
  index.vnbs.sort((a, b) => a.vnbName.localeCompare(b.vnbName, 'de'));

  // Write index
  const outputPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log(`Index written to ${outputPath}`);
  console.log(`Total VNBs indexed: ${index.vnbs.length}`);
}

function parseVoltageTypes(raw: string): string[] {
  if (!raw) return [];
  const types: string[] = [];
  if (raw.includes('Mittelspannung')) types.push('Mittelspannung');
  if (raw.includes('Niederspannung')) types.push('Niederspannung');
  return types;
}

buildIndex().catch(console.error);
