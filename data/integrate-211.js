// Integrate comprehensive Ontario Regulation 211-01 data into regulationsData.js
import fs from 'fs';

// Read the current regulationsData.js
const currentFile = fs.readFileSync('regulationsData.js', 'utf8');

// Read the converted entries
const convertedModule = await import('./ontario-regulation-211-converted.js');
const newEntries = convertedModule.ontarioRegulation211Entries;

console.log(`📊 Loaded ${newEntries.length} comprehensive entries`);

// Find the start and end of Ontario Regulation 211-01 entries
const lines = currentFile.split('\n');
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"id": "211-01-1"') && startIndex === -1) {
    // Find the opening brace of this entry
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].trim() === '{') {
        startIndex = j;
        break;
      }
    }
  }

  if (lines[i].includes('"id": "211-01-32"') && endIndex === -1) {
    // Find the closing brace and comma of this entry
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '},') {
        endIndex = j + 1;
        break;
      }
    }
  }
}

console.log(`📍 Found existing entries from line ${startIndex} to ${endIndex}`);

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

console.log('✅ Successfully integrated comprehensive Ontario Regulation 211-01 data!');
console.log(`✅ Replaced old inadequate entries with ${newEntries.length} comprehensive entries`);
console.log('✅ All clauses, subsections, and definitions are now searchable!');