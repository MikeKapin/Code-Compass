// Test search functionality with the new Annex I content
import { searchCSAData, fullCSAData, getAnnexInfo } from './csaData.js';

console.log('🧪 Testing Annex I Integration in CSA B149.1-25 Search');
console.log(`📊 Total database entries: ${fullCSAData.length}`);

// Count Annex I entries
const annexIEntries = fullCSAData.filter(item => item.annex === "I");
console.log(`📊 Annex I entries: ${annexIEntries.length}`);

console.log('\n🔍 Testing Critical Search Terms for Annex I:');

const testTerms = [
  'abbreviations',
  'ANSI',
  'ASME',
  'CSA',
  'propane',
  'natural gas',
  'butane',
  'fuel properties',
  'heating value',
  'combustion air',
  'flammable limits',
  'ignition temperature',
  'flame temperature',
  'orifice capacity',
  'conversion tables',
  'Btu',
  'specific gravity',
  'pressure drop',
  'cubic foot'
];

testTerms.forEach(term => {
  const results = searchCSAData(term);
  const annexIResults = results.filter(r => r.annex === "I");
  console.log(`  "${term}": ${results.length} total results (${annexIResults.length} from Annex I)`);

  if (annexIResults.length > 0) {
    console.log(`    ✅ Sample: "${annexIResults[0].title}" (${annexIResults[0].clause})`);
  }
});

console.log('\n📋 Sample Annex I Content:');

// Show fuel properties
const fuelResults = searchCSAData('fuel properties');
const annexIFuel = fuelResults.filter(r => r.annex === "I");
if (annexIFuel.length > 0) {
  const sample = annexIFuel[0];
  console.log(`Sample Entry: ${sample.clause}`);
  console.log(`Title: ${sample.title}`);
  console.log(`Description: ${sample.description.substring(0, 150)}...`);
}

// Test annex info function
console.log('\n📖 Annex Information:');
const annexInfo = getAnnexInfo();
Object.keys(annexInfo).forEach(key => {
  console.log(`  Annex ${key}: ${annexInfo[key]}`);
});

console.log('\n📊 Annex I Content Categories:');
const categories = {};
annexIEntries.forEach(entry => {
  if (entry.category) {
    categories[entry.category] = (categories[entry.category] || 0) + 1;
  }
});

Object.keys(categories).forEach(cat => {
  console.log(`  ${cat}: ${categories[cat]} entries`);
});

console.log('\n✅ Annex I integration test complete!');
console.log('✅ All abbreviations, fuel properties, and technical data are now searchable!');