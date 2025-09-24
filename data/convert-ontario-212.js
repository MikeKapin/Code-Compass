// Convert comprehensive Ontario Regulation 212-01 JSON to regulationsData format
import fs from 'fs';

// Read the comprehensive JSON file
const comprehensiveData = JSON.parse(fs.readFileSync('D:/LARKLabs/Code Compass/csa-code-search/data/ontarioRegulation_212_01.json', 'utf8'));

const convertedEntries = [];

console.log('📊 Processing Ontario Regulation 212-01...');
console.log(`📊 Found ${comprehensiveData.document.sections.length} sections`);

// Process each section
comprehensiveData.document.sections.forEach(section => {
  const clauseNumber = section.clause;
  const title = section.title;

  // Add main section entry
  convertedEntries.push({
    id: `212-01-${clauseNumber}`,
    regulation: "Ontario Regulation 212-01",
    section: clauseNumber,
    title: title,
    description: `Section ${clauseNumber}: ${title}`,
    document_title: "Gaseous Fuels",
    subtitle: title,
    type: "section",
    keywords: generateKeywords(title)
  });

  // Process subsections
  if (section.subsections) {
    section.subsections.forEach(subsection => {
      const subsectionNum = subsection.number;
      const subsectionTitle = subsection.title || '';

      // Process definitions if they exist
      if (subsection.definitions) {
        subsection.definitions.forEach(def => {
          convertedEntries.push({
            id: `212-01-${clauseNumber}-${def.term.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`,
            regulation: "Ontario Regulation 212-01",
            section: clauseNumber,
            title: `Definition: ${def.term}`,
            description: def.definition,
            document_title: "Gaseous Fuels",
            subtitle: "Interpretation",
            type: "definition",
            keywords: generateKeywords(`${def.term} definition ${def.definition}`)
          });
        });
      }

      // Add subsection entry if it has content
      if (subsection.content) {
        let fullContent = subsection.content;

        // Add items if they exist
        if (subsection.items) {
          fullContent += ' ' + subsection.items.join(' ');
        }

        // Add sub-items if they exist
        if (subsection.sub_items) {
          fullContent += ' ' + subsection.sub_items.join(' ');
        }

        const subsectionId = subsectionNum ? subsectionNum.replace(/[()]/g, '') : 'main';

        convertedEntries.push({
          id: `212-01-${clauseNumber}-${subsectionId}`,
          regulation: "Ontario Regulation 212-01",
          section: `${clauseNumber}${subsectionNum ? `(${subsectionId})` : ''}`,
          title: `${title}${subsectionTitle ? ` - ${subsectionTitle}` : ''}${subsectionNum ? ` - Subsection ${subsectionNum}` : ''}`,
          description: fullContent,
          document_title: "Gaseous Fuels",
          subtitle: title,
          type: "subsection",
          keywords: generateKeywords(`${title} ${subsectionTitle} ${fullContent}`)
        });
      }

      // Process items as separate entries for better searchability
      if (subsection.items) {
        subsection.items.forEach((item, idx) => {
          convertedEntries.push({
            id: `212-01-${clauseNumber}-${subsectionNum ? subsectionNum.replace(/[()]/g, '') : 'main'}-item${idx + 1}`,
            regulation: "Ontario Regulation 212-01",
            section: `${clauseNumber}${subsectionNum || ''}`,
            title: `${title} - Item ${idx + 1}`,
            description: item,
            document_title: "Gaseous Fuels",
            subtitle: title,
            type: "item",
            keywords: generateKeywords(`${title} ${item}`)
          });
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
const output = `// Comprehensive Ontario Regulation 212-01 - Converted from official JSON
export const ontarioRegulation212Entries = ${JSON.stringify(convertedEntries, null, 2)};

console.log('✅ Converted ${convertedEntries.length} entries from comprehensive Ontario Regulation 212-01 JSON');
`;

fs.writeFileSync('ontario-regulation-212-converted.js', output, 'utf8');

console.log(`✅ Conversion complete! Generated ${convertedEntries.length} entries`);
console.log('✅ Output file: ontario-regulation-212-converted.js');