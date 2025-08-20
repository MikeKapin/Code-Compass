// scripts/processRegulations.js
// Script to process all regulation JSON files into unified searchable format

import fs from 'fs';
import path from 'path';

// Helper function to create searchable regulation entries
function createRegulationEntry(id, regulation, section, title, description, documentTitle, subtitle, type = 'clause', keywords = '', amendments = []) {
  return {
    id,
    regulation,
    section,
    title,
    description,
    document_title: documentTitle,
    subtitle,
    type,
    keywords,
    amendments: Array.isArray(amendments) ? amendments : [amendments].filter(Boolean)
  };
}

// Process TSSA Act 2000
function processTSSAAct(jsonData) {
  const entries = [];
  const doc = jsonData.document;
  
  // Process each part and section
  Object.entries(doc.parts || {}).forEach(([partKey, part]) => {
    // Handle sections directly under parts
    if (part.sections) {
      Object.entries(part.sections).forEach(([sectionKey, section]) => {
        const sectionNum = sectionKey.replace('section_', '').replace('_', '.');
        
        if (section.definitions) {
          // Process definitions separately
          Object.entries(section.definitions).forEach(([term, definition]) => {
            entries.push(createRegulationEntry(
              `TSSA-${sectionNum}-${term}`,
              'Technical Standards and Safety Act, 2000',
              `${sectionNum} - ${term}`,
              `Definition: ${term}`,
              definition,
              doc.title,
              'Main Act - Definitions',
              'definition',
              `definition ${term} ${definition}`,
              section.amendments
            ));
          });
        }
        
        entries.push(createRegulationEntry(
          `TSSA-${sectionNum}`,
          'Technical Standards and Safety Act, 2000',
          sectionNum,
          section.title,
          section.content,
          doc.title,
          'Main Act',
          'section',
          `${section.title} ${section.content}`,
          section.amendments
        ));
      });
    }
    
    // Handle subsections (like corporation, directors_and_inspectors)
    if (part.subsections) {
      Object.entries(part.subsections).forEach(([subsectionKey, subsection]) => {
        if (subsection.sections) {
          Object.entries(subsection.sections).forEach(([sectionKey, section]) => {
            const sectionNum = sectionKey.replace('section_', '').replace('_', '.');
            
            if (section.subsections) {
              // Handle numbered subsections
              Object.entries(section.subsections).forEach(([subNum, subContent]) => {
                entries.push(createRegulationEntry(
                  `TSSA-${sectionNum}-${subNum}`,
                  'Technical Standards and Safety Act, 2000',
                  `${sectionNum}(${subNum})`,
                  `${section.title} - Subsection (${subNum})`,
                  subContent,
                  doc.title,
                  `${part.title} - ${subsection.title}`,
                  'subsection',
                  `${section.title} ${subContent}`,
                  section.amendments
                ));
              });
            }
            
            entries.push(createRegulationEntry(
              `TSSA-${sectionNum}`,
              'Technical Standards and Safety Act, 2000',
              sectionNum,
              section.title,
              section.content || 'See subsections for details',
              doc.title,
              `${part.title} - ${subsection.title}`,
              'section',
              `${section.title} ${section.content || ''}`,
              section.amendments
            ));
          });
        }
      });
    }
  });
  
  return entries;
}

// Process Ontario Regulations (211/01, 212/01, etc.)
function processOntarioRegulation(jsonData, regNumber) {
  const entries = [];
  const doc = jsonData.document;
  
  if (doc.clauses) {
    doc.clauses.forEach(clause => {
      const clauseNum = clause.clause_number;
      
      // Main clause entry
      let mainDescription = clause.content || '';
      if (clause.subsections && clause.subsections.length > 0) {
        // If has subsections, use first subsection content as description
        const firstSubsection = clause.subsections[0];
        if (firstSubsection.content && firstSubsection.content !== clause.content) {
          mainDescription = firstSubsection.content;
        }
      }
      
      entries.push(createRegulationEntry(
        `${regNumber}-${clauseNum}`,
        `Ontario Regulation ${regNumber}`,
        clauseNum,
        clause.title,
        mainDescription,
        doc.title,
        doc.subtitle,
        'clause',
        `${clause.title} ${mainDescription}`,
        clause.amendments
      ));
      
      // Process definitions if present
      if (clause.subsections) {
        clause.subsections.forEach((subsection, index) => {
          if (subsection.definitions) {
            subsection.definitions.forEach(def => {
              entries.push(createRegulationEntry(
                `${regNumber}-${clauseNum}-${def.term}`,
                `Ontario Regulation ${regNumber}`,
                `${clauseNum} - ${def.term}`,
                `Definition: ${def.term}`,
                def.definition,
                doc.title,
                `${doc.subtitle} - Definitions`,
                'definition',
                `definition ${def.term} ${def.definition}`,
                clause.amendments
              ));
            });
          } else if (subsection.content && index > 0) {
            // Additional subsections beyond the first
            entries.push(createRegulationEntry(
              `${regNumber}-${clauseNum}-${index}`,
              `Ontario Regulation ${regNumber}`,
              `${clauseNum}(${index})`,
              `${clause.title} - Subsection (${index})`,
              subsection.content,
              doc.title,
              doc.subtitle,
              'subsection',
              `${clause.title} ${subsection.content}`,
              clause.amendments
            ));
          }
        });
      }
    });
  }
  
  return entries;
}

// Main processing function
function processAllRegulations() {
  const dataDir = path.join(process.cwd(), 'data');
  const allEntries = [];
  
  // Process TSSA Act
  console.log('Processing TSSA Act 2000...');
  try {
    const tssaData = JSON.parse(fs.readFileSync(path.join(dataDir, 'TSSA_Act_2000.json'), 'utf8'));
    const tssaEntries = processTSSAAct(tssaData);
    allEntries.push(...tssaEntries);
    console.log(`Processed ${tssaEntries.length} TSSA Act entries`);
  } catch (error) {
    console.error('Error processing TSSA Act:', error.message);
  }
  
  // Process Ontario Regulations
  const regulations = [
    { file: 'ontarioRegulation_211_01.json', number: '211/01' },
    { file: 'ontarioRegulation_212_01.json', number: '212/01' },
    { file: 'ontarioRegulation_215_01.json', number: '215/01' },
    { file: 'ontarioRegulation_220_01.json', number: '220/01' },
    { file: 'ontarioRegulation_223_01.json', number: '223/01' }
  ];
  
  regulations.forEach(({ file, number }) => {
    console.log(`Processing Ontario Regulation ${number}...`);
    try {
      const regData = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
      const regEntries = processOntarioRegulation(regData, number);
      allEntries.push(...regEntries);
      console.log(`Processed ${regEntries.length} entries for Regulation ${number}`);
    } catch (error) {
      console.error(`Error processing Regulation ${number}:`, error.message);
    }
  });
  
  return allEntries;
}

// Generate the regulations data file
function generateRegulationsFile(entries) {
  const fileContent = `// data/regulationsData.js
// Consolidated Ontario Regulations Data - Auto-generated from JSON files

export const regulationsData = ${JSON.stringify(entries, null, 2)};

// Create search index for regulations
export const createRegulationSearchIndex = (data) => {
  const index = new Map();
  
  data.forEach((item, idx) => {
    const searchableText = [
      item.title || '',
      item.description || '',
      item.section || '',
      item.regulation || '',
      item.keywords || '',
      item.document_title || '',
      item.subtitle || ''
    ].join(' ').toLowerCase();
    
    const words = searchableText.split(/\\s+/).filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
    );
    
    words.forEach(word => {
      if (!index.has(word)) {
        index.set(word, new Set());
      }
      index.get(word).add(idx);
    });
  });
  
  return index;
};

// Search regulations function
export const searchRegulations = (query, searchIndex) => {
  if (!query || !searchIndex) return [];
  
  const searchTerm = query.toLowerCase().trim();
  const words = searchTerm.split(/\\s+/);
  
  let resultIndices = new Set();
  
  words.forEach(word => {
    if (searchIndex.has(word)) {
      searchIndex.get(word).forEach(idx => resultIndices.add(idx));
    }
    
    // Partial matching for longer words
    if (word.length > 3) {
      searchIndex.forEach((indices, indexWord) => {
        if (indexWord.includes(word) || word.includes(indexWord)) {
          indices.forEach(idx => resultIndices.add(idx));
        }
      });
    }
  });
  
  // Fallback simple text search
  const simpleResults = regulationsData.filter(item => {
    const searchableText = [
      item.title || '',
      item.description || '',
      item.section || '',
      item.regulation || '',
      item.document_title || ''
    ].join(' ').toLowerCase();
    
    return searchableText.includes(searchTerm);
  });
  
  const indexResults = Array.from(resultIndices).map(idx => regulationsData[idx]);
  const allResults = [...indexResults, ...simpleResults];
  const uniqueResults = allResults.filter((item, index, self) => 
    index === self.findIndex(t => t.id === item.id)
  );
  
  return uniqueResults.sort((a, b) => {
    const aTitle = (a.title || '').toLowerCase();
    const bTitle = (b.title || '').toLowerCase();
    const queryLower = searchTerm.toLowerCase();
    
    // Prioritize title matches
    if (aTitle.includes(queryLower) && !bTitle.includes(queryLower)) return -1;
    if (!aTitle.includes(queryLower) && bTitle.includes(queryLower)) return 1;
    
    return 0;
  }).slice(0, 50);
};
`;

  return fileContent;
}

// Run the processing
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log('Starting regulation processing...');
  const entries = processAllRegulations();
  console.log(`\\nTotal entries processed: ${entries.length}`);
  
  const fileContent = generateRegulationsFile(entries);
  const outputPath = path.join(process.cwd(), 'data', 'regulationsData.js');
  
  // Backup existing file
  if (fs.existsSync(outputPath)) {
    fs.copyFileSync(outputPath, outputPath + '.backup');
    console.log('Existing file backed up');
  }
  
  fs.writeFileSync(outputPath, fileContent);
  console.log(`\\nRegulations data written to: ${outputPath}`);
  console.log('Processing complete!');
}

export { processAllRegulations, generateRegulationsFile };