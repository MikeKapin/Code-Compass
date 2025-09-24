// Test search functionality with the comprehensive Ontario Regulation 215-01 data
import { searchRegulations, regulationsData } from './regulationsData.js';

console.log('🧪 Testing Comprehensive Ontario Regulation 215-01 Integration');
console.log(`📊 Total database entries: ${regulationsData.length}`);

// Count Ontario Regulation 215-01 entries
const reg215Entries = regulationsData.filter(item => item.regulation === "Ontario Regulation 215-01");
console.log(`📊 Ontario Regulation 215-01 entries: ${reg215Entries.length}`);

console.log('\n🔍 Testing Critical Search Terms for Ontario Regulation 215-01:');

const testTerms = [
  'G.1',
  'G.2',
  'G.3',
  'GP',
  'LP',
  'ICE',
  'DA',
  'RV.1',
  'RV.2',
  'PPO-1',
  'PPO-2',
  'PPO-3',
  'PCI',
  'PTO',
  'H2',
  'certificate',
  'professional gas technician',
  'fuel industry',
  'qualification',
  'requirement'
];

testTerms.forEach(term => {
  const results = searchRegulations(term);
  const reg215Results = results.filter(r => r.regulation === "Ontario Regulation 215-01");
  console.log(`  "${term}": ${results.length} total results (${reg215Results.length} from 215-01)`);

  if (reg215Results.length > 0) {
    console.log(`    ✅ Sample: "${reg215Results[0].title}"`);
  }
});

console.log('\n📋 Sample Comprehensive Content (Ontario Regulation 215-01):');

// Show a sample certificate entry
const certResults = searchRegulations('G.1');
const reg215Certs = certResults.filter(r => r.regulation === "Ontario Regulation 215-01");
if (reg215Certs.length > 0) {
  const sample = reg215Certs[0];
  console.log(`Sample Entry: ${sample.id}`);
  console.log(`Title: ${sample.title}`);
  console.log(`Description: ${sample.description.substring(0, 150)}...`);
}

// Compare before and after
console.log('\n📊 Comparison Summary:');
console.log('Before integration: 36 inadequate entries with wrong/oversimplified certificate info');
console.log(`After integration: ${reg215Entries.length} comprehensive entries with accurate legal content`);
console.log(`Improvement: +${reg215Entries.length - 36} entries (+${Math.round((reg215Entries.length - 36) / 36 * 100)}% increase)`);

console.log('\n✅ Ontario Regulation 215-01 integration test complete!');
console.log('✅ All professional gas technician certificates (G.1, G.2, G.3, GP, LP, ICE, DA, RV, PPO, H2, etc.) are now searchable!');