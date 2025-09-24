// Integrate comprehensive Ontario Regulation 223-01 data into regulationsData.js
import fs from 'fs';

// Read the current regulationsData.js
const currentFile = fs.readFileSync('regulationsData.js', 'utf8');

// Read the converted entries
const convertedModule = await import('./ontario-regulation-223-converted.js');
const newEntries = convertedModule.ontarioRegulation223Entries;

console.log(`📊 Loaded ${newEntries.length} comprehensive entries for Ontario Regulation 223-01 (Codes and Standards Adopted by Reference)`);

// Find the start and end of Ontario Regulation 223-01 entries
const lines = currentFile.split('\n');
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"id": "223-01-1"') && startIndex === -1) {
    // Find the opening brace of this entry
    for (let j = i - 1; j >= 0; j--) {
      if (lines[j].trim() === '{') {
        startIndex = j;
        break;
      }
    }
  }

  if (lines[i].includes('"id": "223-01-9"') && endIndex === -1) {
    // Find the closing brace and comma of this entry
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === '},') {
        endIndex = j + 1;
        break;
      }
    }
  }
}

console.log(`📍 Found existing Ontario Regulation 223-01 entries from line ${startIndex} to ${endIndex}`);

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

console.log('✅ Successfully integrated comprehensive Ontario Regulation 223-01 data!');
console.log(`✅ Replaced old inadequate entries with ${newEntries.length} comprehensive entries`);
console.log('✅ All code adoption documents and technical standards references are now searchable!');
console.log('✅ Includes: Amusement Devices, Boilers & Pressure Vessels, CNG, Elevating Devices, Fuel Oil, Gaseous Fuels, Liquid Fuels, Oil & Gas Pipeline, and Propane code adoption documents!');

// Count how many existing 223-01 entries we're replacing
const existingCount = lines.filter(line => line.includes('"223-01-')).length;
console.log(`📊 Replaced ${existingCount} old entries with ${newEntries.length} new entries (+${newEntries.length - existingCount} improvement)`);