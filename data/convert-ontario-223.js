// Convert comprehensive Ontario Regulation 223-01 JSON to regulationsData format
import fs from 'fs';

// Read the comprehensive JSON file
const comprehensiveData = JSON.parse(fs.readFileSync('D:/LARKLabs/Code Compass/csa-code-search/data/ontarioRegulation_223_01.json', 'utf8'));

const convertedEntries = [];

console.log('📊 Processing Ontario Regulation 223-01 (Codes and Standards Adopted by Reference)...');
console.log(`📊 Found ${comprehensiveData.clauses.length} clauses`);

// Process each clause
comprehensiveData.clauses.forEach(clause => {
  const clauseNumber = clause.clause_number;
  const title = clause.title;

  // Add main clause entry
  convertedEntries.push({
    id: `223-01-${clauseNumber}`,
    regulation: "Ontario Regulation 223-01",
    section: clauseNumber,
    title: title,
    description: `Section ${clauseNumber}: ${title}`,
    document_title: "Codes and Standards Adopted by Reference",
    subtitle: title,
    type: "section",
    keywords: generateKeywords(title)
  });

  // Process subsections
  if (clause.subsections) {
    clause.subsections.forEach(subsection => {
      const subsectionNum = subsection.subsection.replace(/[()]/g, '');
      const text = subsection.text;
      const citation = subsection.citation;

      if (text && text !== 'OMITTED (PROVIDES FOR COMING INTO FORCE OF PROVISIONS OF THIS REGULATION).') {
        convertedEntries.push({
          id: `223-01-${clauseNumber}-${subsectionNum}`,
          regulation: "Ontario Regulation 223-01",
          section: `${clauseNumber}${subsection.subsection ? `(${subsectionNum})` : ''}`,
          title: `${title} - Subsection ${subsection.subsection}`,
          description: text,
          document_title: "Codes and Standards Adopted by Reference",
          subtitle: title,
          type: "subsection",
          keywords: generateKeywords(`${title} ${text}`),
          citation: citation
        });
      }
    });
  }
});

// Process additional content sections
if (comprehensiveData.additional_content) {
  comprehensiveData.additional_content.forEach(section => {
    const clauseNumber = section.clause_number;
    const title = section.section;

    // Add main section entry
    convertedEntries.push({
      id: `223-01-${clauseNumber}`,
      regulation: "Ontario Regulation 223-01",
      section: clauseNumber,
      title: title,
      description: `Section ${clauseNumber}: ${title}`,
      document_title: "Codes and Standards Adopted by Reference",
      subtitle: title,
      type: "section",
      keywords: generateKeywords(title)
    });

    // Process subsections
    if (section.subsections) {
      section.subsections.forEach(subsection => {
        const subsectionNum = subsection.subsection ? subsection.subsection.replace(/[()]/g, '') : 'main';
        const text = subsection.text;
        const citation = subsection.citation;

        // Handle exceptions for confidentiality section
        let fullText = text;
        if (subsection.exceptions) {
          fullText += ' ' + subsection.exceptions.join(' ');
        }

        convertedEntries.push({
          id: `223-01-${clauseNumber}-${subsectionNum}`,
          regulation: "Ontario Regulation 223-01",
          section: `${clauseNumber}${subsection.subsection ? subsection.subsection : ''}`,
          title: `${title}${subsection.subsection ? ` - Subsection ${subsection.subsection}` : ''}`,
          description: fullText,
          document_title: "Codes and Standards Adopted by Reference",
          subtitle: title,
          type: "subsection",
          keywords: generateKeywords(`${title} ${fullText}`),
          citation: citation
        });
      });
    }
  });
}

function generateKeywords(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 20)
    .join(' ');
}

// Write the converted data
const output = `// Comprehensive Ontario Regulation 223-01 - Converted from official JSON
export const ontarioRegulation223Entries = ${JSON.stringify(convertedEntries, null, 2)};

console.log('✅ Converted ${convertedEntries.length} entries from comprehensive Ontario Regulation 223-01 JSON');
`;

fs.writeFileSync('ontario-regulation-223-converted.js', output, 'utf8');

console.log(`✅ Conversion complete! Generated ${convertedEntries.length} entries`);
console.log('✅ This includes all code adoption documents for various technical standards');
console.log('✅ Output file: ontario-regulation-223-converted.js');