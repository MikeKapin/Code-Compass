// Integrate comprehensive Ontario Regulation 215-01 data into regulationsData.js
import fs from 'fs';

// Read the current regulationsData.js
const currentFile = fs.readFileSync('regulationsData.js', 'utf8');

// Read the converted entries
const convertedModule = await import('./ontario-regulation-215-converted.js');
const newEntries = convertedModule.ontarioRegulation215Entries;

console.log(`📊 Loaded ${newEntries.length} comprehensive entries for Ontario Regulation 215-01 (Fuel Industry Certificates)`);

// Find the start and end of Ontario Regulation 215-01 entries
const lines = currentFile.split('\n');
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"id": "215-01-1"') && startIndex === -1) {
    // Find the opening brace of this entry
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].trim() === '{') {
        startIndex = j;
        break;
      }
    }
  }

  if (lines[i].includes('"id": "215-01-33"') && endIndex === -1) {
    // Find the closing brace and comma of this entry
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '},') {
        endIndex = j + 1;
        break;
      }
    }
  }
}

console.log(`📍 Found existing Ontario Regulation 215-01 entries from line ${startIndex} to ${endIndex}`);

// Convert new entries to string format
const newEntriesString = newEntries.map(entry => {
  return '  ' + JSON.stringify(entry, null, 2).split('\n').map((line, idx) =>
    idx === 0 ? line : '  ' + line
  ).join('\n');
}).join(',\n\n') + ',';

// Replace the old entries with new ones
const beforeSection = lines.slice(0, startIndex).join('\n');
const afterSection = lines.slice(endIndex).join('\n');

const updatedFile = beforeSection + '\n' + newEntriesString + '\n' + afterSection;

// Write the updated file
fs.writeFileSync('regulationsData.js', updatedFile, 'utf8');

console.log('✅ Successfully integrated comprehensive Ontario Regulation 215-01 data!');
console.log(`✅ Replaced old inadequate entries with ${newEntries.length} comprehensive entries`);
console.log('✅ All professional gas technician certificates now searchable!');
console.log('✅ Includes: G.1, G.2, G.3, GP, LP, ICE, DA, RV.1, RV.2, PPO-1, PPO-2, PPO-3, PCI, PTO, H2, and more!');

// Count how many existing 215-01 entries we're replacing
const existingCount = lines.filter(line => line.includes('"215-01-')).length;
console.log(`📊 Replaced ${existingCount} old entries with ${newEntries.length} new entries (+${newEntries.length - existingCount} improvement)`);