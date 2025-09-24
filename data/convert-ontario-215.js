// Convert comprehensive Ontario Regulation 215-01 JSON to regulationsData format
import fs from 'fs';

// Read the comprehensive JSON file
const comprehensiveData = JSON.parse(fs.readFileSync('D:/LARKLabs/Code Compass/csa-code-search/data/ontarioRegulation_215_01.json', 'utf8'));

const convertedEntries = [];

console.log('📊 Processing Ontario Regulation 215-01 (Fuel Industry Certificates)...');
console.log(`📊 Found ${comprehensiveData.clauses.length} clauses`);

// Process each clause
comprehensiveData.clauses.forEach(clause => {
  const clauseNumber = clause.clause;
  const title = clause.title;

  // Add main clause entry
  convertedEntries.push({
    id: `215-01-${clauseNumber}`,
    regulation: "Ontario Regulation 215-01",
    section: clauseNumber,
    title: title,
    description: `Section ${clauseNumber}: ${title}`,
    document_title: "Fuel Industry Certificates",
    subtitle: title,
    type: "section",
    keywords: generateKeywords(title)
  });

  // Process subsections
  if (clause.subsections) {
    clause.subsections.forEach(subsection => {
      const subsectionNum = subsection.subsection;

      // Process definitions if they exist
      if (subsection.definitions) {
        subsection.definitions.forEach((def, idx) => {
          const termSafe = def.term ? def.term.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') : `def_${idx}`;
          const termTitle = def.term || `Definition ${idx + 1}`;
          const definition = def.definition || 'Definition content not available';

          convertedEntries.push({
            id: `215-01-${clauseNumber}-${termSafe}`,
            regulation: "Ontario Regulation 215-01",
            section: clauseNumber,
            title: `Definition: ${termTitle}`,
            description: definition,
            document_title: "Fuel Industry Certificates",
            subtitle: "Interpretation",
            type: "definition",
            keywords: generateKeywords(`${termTitle} definition ${definition}`)
          });
        });
      }

      // Process certificate types as individual entries for better searchability
      if (subsection.certificate_types) {
        subsection.certificate_types.forEach((certType, idx) => {
          const certCode = certType.match(/\"([^"]+)\"/) ? certType.match(/\"([^"]+)\"/)[1] : `cert-${idx}`;
          convertedEntries.push({
            id: `215-01-${clauseNumber}-${certCode.replace(/[^a-zA-Z0-9]/g, '_')}`,
            regulation: "Ontario Regulation 215-01",
            section: clauseNumber,
            title: `Certificate: ${certCode}`,
            description: certType,
            document_title: "Fuel Industry Certificates",
            subtitle: "Professional Certificates",
            type: "certificate",
            keywords: generateKeywords(`${certType} certificate professional qualification`)
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

        // Add qualifications if they exist
        if (subsection.qualifications) {
          fullContent += ' Qualifications: ' + subsection.qualifications.join(' ');
        }

        // Add requirements if they exist
        if (subsection.requirements) {
          fullContent += ' Requirements: ' + subsection.requirements.join(' ');
        }

        const subsectionId = subsectionNum ? subsectionNum.replace(/[()]/g, '') : 'main';

        convertedEntries.push({
          id: `215-01-${clauseNumber}-${subsectionId}`,
          regulation: "Ontario Regulation 215-01",
          section: `${clauseNumber}${subsectionNum ? `(${subsectionId})` : ''}`,
          title: `${title}${subsectionNum ? ` - Subsection ${subsectionNum}` : ''}`,
          description: fullContent,
          document_title: "Fuel Industry Certificates",
          subtitle: title,
          type: "subsection",
          keywords: generateKeywords(`${title} ${fullContent}`)
        });
      }

      // Process individual requirements/qualifications as separate searchable items
      if (subsection.requirements) {
        subsection.requirements.forEach((req, idx) => {
          convertedEntries.push({
            id: `215-01-${clauseNumber}-${subsectionNum ? subsectionNum.replace(/[()]/g, '') : 'main'}-req${idx + 1}`,
            regulation: "Ontario Regulation 215-01",
            section: `${clauseNumber}${subsectionNum || ''}`,
            title: `${title} - Requirement ${idx + 1}`,
            description: req,
            document_title: "Fuel Industry Certificates",
            subtitle: title,
            type: "requirement",
            keywords: generateKeywords(`${title} requirement ${req}`)
          });
        });
      }

      if (subsection.qualifications) {
        subsection.qualifications.forEach((qual, idx) => {
          convertedEntries.push({
            id: `215-01-${clauseNumber}-${subsectionNum ? subsectionNum.replace(/[()]/g, '') : 'main'}-qual${idx + 1}`,
            regulation: "Ontario Regulation 215-01",
            section: `${clauseNumber}${subsectionNum || ''}`,
            title: `${title} - Qualification ${idx + 1}`,
            description: qual,
            document_title: "Fuel Industry Certificates",
            subtitle: title,
            type: "qualification",
            keywords: generateKeywords(`${title} qualification ${qual}`)
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
const output = `// Comprehensive Ontario Regulation 215-01 - Converted from official JSON
export const ontarioRegulation215Entries = ${JSON.stringify(convertedEntries, null, 2)};

console.log('✅ Converted ${convertedEntries.length} entries from comprehensive Ontario Regulation 215-01 JSON');
`;

fs.writeFileSync('ontario-regulation-215-converted.js', output, 'utf8');

console.log(`✅ Conversion complete! Generated ${convertedEntries.length} entries`);
console.log('✅ This includes all professional gas technician certificates (G.1, G.2, G.3, GP, LP, ICE, DA, RV, etc.)');
console.log('✅ Output file: ontario-regulation-215-converted.js');