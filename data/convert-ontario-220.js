// Convert comprehensive Ontario Regulation 220-01 JSON to regulationsData format
import fs from 'fs';

// Read the comprehensive JSON file
const comprehensiveData = JSON.parse(fs.readFileSync('D:/LARKLabs/Code Compass/csa-code-search/data/ontarioRegulation_220_01.json', 'utf8'));

const convertedEntries = [];

console.log('📊 Processing Ontario Regulation 220-01 (Boilers and Pressure Vessels)...');
console.log(`📊 Found ${Object.keys(comprehensiveData.document.clauses).length} clauses`);

// Process each clause
Object.entries(comprehensiveData.document.clauses).forEach(([clauseKey, clause]) => {
  const clauseNumber = clauseKey.replace('clause_', '').replace('_', '.');
  const title = clause.title;

  // Add main clause entry
  convertedEntries.push({
    id: `220-01-${clauseNumber}`,
    regulation: "Ontario Regulation 220-01",
    section: clauseNumber,
    title: title,
    description: `Section ${clauseNumber}: ${title}`,
    document_title: "Boilers and Pressure Vessels",
    subtitle: title,
    type: "section",
    keywords: generateKeywords(title)
  });

  // Process subsections
  Object.entries(clause).forEach(([subKey, subsection]) => {
    if (subKey !== 'title' && subsection && typeof subsection === 'object') {
      const subsectionNum = subKey.replace('subsection_', '').replace('_', '.');

      // Handle definitions
      if (subsection.definitions) {
        Object.entries(subsection.definitions).forEach(([defKey, defValue]) => {
          const termSafe = defKey ? defKey.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') : `def_${Object.keys(subsection.definitions).indexOf(defKey)}`;

          convertedEntries.push({
            id: `220-01-${clauseNumber}-${termSafe}`,
            regulation: "Ontario Regulation 220-01",
            section: clauseNumber,
            title: `Definition: ${defKey}`,
            description: defValue,
            document_title: "Boilers and Pressure Vessels",
            subtitle: "Interpretation",
            type: "definition",
            keywords: generateKeywords(`${defKey} definition ${defValue}`)
          });
        });
      }

      // Handle exclusions as individual entries
      if (subsection.exclusions) {
        subsection.exclusions.forEach((exclusion, idx) => {
          convertedEntries.push({
            id: `220-01-${clauseNumber}-exclusion${idx + 1}`,
            regulation: "Ontario Regulation 220-01",
            section: clauseNumber,
            title: `${title} - Exclusion ${idx + 1}`,
            description: exclusion,
            document_title: "Boilers and Pressure Vessels",
            subtitle: title,
            type: "exclusion",
            keywords: generateKeywords(`${title} exclusion ${exclusion}`)
          });
        });
      }

      // Add subsection entry if it has content
      if (subsection.content) {
        const subsectionTitle = subsection.title || `Subsection ${subsectionNum}`;

        convertedEntries.push({
          id: `220-01-${clauseNumber}-${subsectionNum}`,
          regulation: "Ontario Regulation 220-01",
          section: `${clauseNumber}(${subsectionNum})`,
          title: `${title} - ${subsectionTitle}`,
          description: subsection.content,
          document_title: "Boilers and Pressure Vessels",
          subtitle: title,
          type: "subsection",
          keywords: generateKeywords(`${title} ${subsectionTitle} ${subsection.content}`)
        });
      }

      // Handle main clause content (for clauses without subsections)
      if (typeof subsection === 'string' && subKey === 'content') {
        convertedEntries.push({
          id: `220-01-${clauseNumber}-main`,
          regulation: "Ontario Regulation 220-01",
          section: clauseNumber,
          title: title,
          description: subsection,
          document_title: "Boilers and Pressure Vessels",
          subtitle: title,
          type: "content",
          keywords: generateKeywords(`${title} ${subsection}`)
        });
      }
    }
  });
});

function generateKeywords(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 20)
    .join(' ');
}

// Write the converted data
const output = `// Comprehensive Ontario Regulation 220-01 - Converted from official JSON
export const ontarioRegulation220Entries = ${JSON.stringify(convertedEntries, null, 2)};

console.log('✅ Converted ${convertedEntries.length} entries from comprehensive Ontario Regulation 220-01 JSON');
`;

fs.writeFileSync('ontario-regulation-220-converted.js', output, 'utf8');

console.log(`✅ Conversion complete! Generated ${convertedEntries.length} entries`);
console.log('✅ This includes all boiler and pressure vessel definitions, requirements, and safety standards');
console.log('✅ Output file: ontario-regulation-220-converted.js');