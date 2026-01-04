import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VNB_DIR = path.join(__dirname, '../../vnbs');
const OUTPUT_DIR = path.join(__dirname, '../public/data/vnb');

function parseVoltageTypes(raw) {
  if (!raw) return [];
  const types = [];
  if (raw.includes('Mittelspannung')) types.push('Mittelspannung');
  if (raw.includes('Niederspannung')) types.push('Niederspannung');
  return types;
}

async function buildIndex() {
  console.log('Building VNB index...');
  console.log('VNB_DIR:', VNB_DIR);
  console.log('OUTPUT_DIR:', OUTPUT_DIR);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(VNB_DIR).filter(f => f.endsWith('.geojson'));
  console.log(`Found ${files.length} VNB files`);

  const index = {
    vnbs: [],
    totalCount: files.length,
    byVoltageType: {
      Mittelspannung: [],
      Niederspannung: []
    }
  };

  let processed = 0;
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

      const entry = {
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

      processed++;
      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${files.length} files...`);
      }
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }

  // Sort by name
  index.vnbs.sort((a, b) => a.vnbName.localeCompare(b.vnbName, 'de'));

  // Write index
  const outputPath = path.join(OUTPUT_DIR, 'index.json');
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log(`\nIndex written to ${outputPath}`);
  console.log(`Total VNBs indexed: ${index.vnbs.length}`);
  console.log(`Mittelspannung: ${index.byVoltageType.Mittelspannung.length}`);
  console.log(`Niederspannung: ${index.byVoltageType.Niederspannung.length}`);
}

buildIndex().catch(console.error);
