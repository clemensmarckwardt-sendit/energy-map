import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourceDir = '/Users/clemensmarckwardt/Desktop/Voltpark/graphql/geo_data/anlagen';
const outputDir = join(__dirname, '../public/data/anlagen');

// Ensure output directory exists
mkdirSync(outputDir, { recursive: true });

function parseCSV(content) {
  // Remove BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }

  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ';' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseGermanNumber(str) {
  if (!str || str === '') return null;
  // German format: "48,688" -> 48.688
  return parseFloat(str.replace(',', '.'));
}

function convertToGeoJSON(rows, type) {
  const features = [];

  for (const row of rows) {
    const lat = parseGermanNumber(row['Koordinate: Breitengrad (WGS84)']);
    const lng = parseGermanNumber(row['Koordinate: Längengrad (WGS84)']);

    // Skip rows without valid coordinates
    if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) {
      continue;
    }

    // Skip coordinates outside Germany bounds
    if (lat < 47 || lat > 55 || lng < 5 || lng > 16) {
      continue;
    }

    const grossPower = parseGermanNumber(row['Bruttoleistung der Einheit']) || 0;
    const netPower = parseGermanNumber(row['Nettonennleistung der Einheit']) || 0;
    const capacity = parseGermanNumber(row['Nutzbare Speicherkapazität in kWh']) || 0;

    const feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      properties: {
        id: row['MaStR-Nr. der Einheit'],
        name: row['Anzeige-Name der Einheit'] || 'Unnamed',
        type: type,
        status: row['Betriebs-Status'],
        grossPower: grossPower,
        netPower: netPower,
        bundesland: row['Bundesland'],
        city: row['Ort'],
        postalCode: row['Postleitzahl'],
        operator: row['Name des Anlagenbetreibers (nur Org.)'],
        commissioningDate: row['Inbetriebnahmedatum der Einheit'],
        // BESS-specific
        storageTechnology: row['Speichertechnologie'] || null,
        storageCapacity: capacity,
        // Solar-specific
        solarType: row['Art der Solaranlage'] || null,
        moduleCount: parseGermanNumber(row['Anzahl der Solar-Module']) || null
      }
    };

    features.push(feature);
  }

  return {
    type: 'FeatureCollection',
    features: features
  };
}

function processFile(filename, type) {
  console.log(`Processing ${filename}...`);

  const content = readFileSync(join(sourceDir, filename), 'utf-8');
  const rows = parseCSV(content);
  console.log(`  Parsed ${rows.length} rows`);

  const geojson = convertToGeoJSON(rows, type);
  console.log(`  Converted ${geojson.features.length} features with valid coordinates`);

  // Count by status
  const statusCounts = {};
  for (const f of geojson.features) {
    const status = f.properties.status || 'Unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }
  console.log('  Status breakdown:', statusCounts);

  const outputFile = join(outputDir, `${type}.geojson`);
  writeFileSync(outputFile, JSON.stringify(geojson, null, 2));
  console.log(`  Written to ${outputFile}\n`);

  return geojson;
}

// Process single combined file
console.log('Converting Anlagen CSV to GeoJSON...\n');

console.log('Reading anlagen.csv...');
const content = readFileSync(join(sourceDir, 'anlagen.csv'), 'utf-8');
const allRows = parseCSV(content);
console.log(`Parsed ${allRows.length} total rows\n`);

// Split by Energieträger
const solarRows = allRows.filter(row => row['Energieträger'] === 'Solare Strahlungsenergie');
const bessRows = allRows.filter(row => row['Energieträger'] === 'Speicher');

console.log(`Solar rows: ${solarRows.length}`);
console.log(`BESS rows: ${bessRows.length}\n`);

// Convert to GeoJSON
const solarGeoJSON = convertToGeoJSON(solarRows, 'solar');
const bessGeoJSON = convertToGeoJSON(bessRows, 'bess');

// Count by status for solar
console.log('Solar status breakdown:');
const solarStatus = {};
for (const f of solarGeoJSON.features) {
  const status = f.properties.status || 'Unknown';
  solarStatus[status] = (solarStatus[status] || 0) + 1;
}
console.log(solarStatus);

// Count by status for BESS
console.log('\nBESS status breakdown:');
const bessStatus = {};
for (const f of bessGeoJSON.features) {
  const status = f.properties.status || 'Unknown';
  bessStatus[status] = (bessStatus[status] || 0) + 1;
}
console.log(bessStatus);

// Write output files
writeFileSync(join(outputDir, 'solar.geojson'), JSON.stringify(solarGeoJSON, null, 2));
writeFileSync(join(outputDir, 'bess.geojson'), JSON.stringify(bessGeoJSON, null, 2));

console.log('\nSummary:');
console.log(`  Solar: ${solarGeoJSON.features.length} installations`);
console.log(`  BESS: ${bessGeoJSON.features.length} installations`);
console.log('\nDone!');
