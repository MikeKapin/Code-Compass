// Convert comprehensive Ontario Regulation 211-01 JSON to regulationsData format
import fs from 'fs';

// Read the comprehensive JSON file
const comprehensiveData = JSON.parse(fs.readFileSync('D:/LARKLabs/Code Compass/csa-code-search/data/ontarioRegulation_211_01.json', 'utf8'));

const convertedEntries = [];
let entryCounter = 1;

// Process each clause
comprehensiveData.document.clauses.forEach(clause => {
  const clauseNumber = clause.clause_number;
  const title = clause.title;

  // Add main clause entry
  convertedEntries.push({
    id: `211-01-${clauseNumber}`,
    regulation: "Ontario Regulation 211-01",
    section: clauseNumber,
    title: title,
    description: `Section ${clauseNumber}: ${title}`,
    document_title: "Propane Storage and Handling",
    subtitle: title,
    type: "section",
    keywords: generateKeywords(title)
  });

  // Process definitions if this is the interpretation section
  if (clause.subsections && clause.subsections[0] && clause.subsections[0].definitions) {
    clause.subsections[0].definitions.forEach(def => {
      convertedEntries.push({
        id: `211-01-${clauseNumber}-${def.term.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`,
        regulation: "Ontario Regulation 211-01",
        section: clauseNumber,
        title: `Definition: ${def.term}`,
        description: def.definition,
        document_title: "Propane Storage and Handling",
        subtitle: "Interpretation",
        type: "definition",
        keywords: generateKeywords(`${def.term} definition ${def.definition}`)
      });
    });
  }

  // Process all subsections
  if (clause.subsections) {
    clause.subsections.forEach(subsection => {
      if (subsection.subsection && subsection.content) {
        const subsectionId = subsection.subsection.replace(/[()]/g, '');

        // Build complete content
        let fullContent = subsection.content;

        // Add items if they exist
        if (subsection.items) {
          fullContent += ' ' + subsection.items.join(' ');
        }

        convertedEntries.push({
          id: `211-01-${clauseNumber}-${subsectionId}`,
          regulation: "Ontario Regulation 211-01",
          section: `${clauseNumber}(${subsectionId})`,
          title: `${title} - Subsection (${subsectionId})`,
          description: fullContent,
          document_title: "Propane Storage and Handling",
          subtitle: title,
          type: "subsection",
          keywords: generateKeywords(`${title} ${fullContent}`)
        });
      }
    });
  }
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
const output = `// Comprehensive Ontario Regulation 211-01 - Converted from official JSON
export const ontarioRegulation211Entries = ${JSON.stringify(convertedEntries, null, 2)};

console.log('✅ Converted ${convertedEntries.length} entries from comprehensive Ontario Regulation 211-01 JSON');
`;

fs.writeFileSync('ontario-regulation-211-converted.js', output, 'utf8');

console.log(`✅ Conversion complete! Generated ${convertedEntries.length} entries`);
console.log('✅ Output file: ontario-regulation-211-converted.js');