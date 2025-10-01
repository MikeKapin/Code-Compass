// data/csaDataFree.js
// Free version of CSA B149.1-25 - Sections 1-4 only (Scope, References, Definitions, General)
// Sections 5+ and Annexes require premium subscription

// Free CSA B149.1-25 data (sections 1-4 only) - Extracted from complete dataset
const freeCSAData = [
  // Section 3 - Definitions (Core foundational definitions)
  {
    "clause": "3.1",
    "title": "Accessory",
    "description": "a part capable of performing an independent function and contributing to the operation of the appliance or gas piping system that it serves."
  },
  {
    "clause": "3.2",
    "title": "Air supply (with respect to the installation of an appliance)",
    "description": "combustion air, flue gas dilution air, and ventilation air."
  },
  {
    "clause": "3.3",
    "title": "Combustion air",
    "description": "the air required for satisfactory combustion of gas, including excess air."
  },
  {
    "clause": "3.4",
    "title": "Excess air",
    "description": "that portion of the combustion air that is supplied to the combustion zone in excess of that which is theoretically required for complete combustion."
  },
  {
    "clause": "3.5",
    "title": "Flue gas dilution air",
    "description": "the ambient air that is admitted to a venting system at the draft hood, draft diverter, or draft regulator."
  },
  {
    "clause": "3.6",
    "title": "Ventilation air",
    "description": "air that is admitted to a space containing an appliance to replace air exhausted through a ventilation opening or by means of exfiltration."
  },
  {
    "clause": "3.7",
    "title": "Appliance",
    "description": "a device to convert gas into energy or compress gas for the purpose of fuelling; the term includes any component, control, wiring, piping, or tubing required to be part of the device."
  },
  {
    "clause": "3.8",
    "title": "Category I appliance",
    "description": "an appliance that operates with a nonpositive vent static pressure and with a flue loss not less than 17%. This category consists of draft-hood-equipped appliances, appliances labelled as Category I, and fan-assisted appliances for venting into Type B vents."
  },
  {
    "clause": "3.9",
    "title": "Category II appliance",
    "description": "an appliance that operates with a nonpositive vent static pressure and with a flue loss less than 17%."
  },
  {
    "clause": "3.10",
    "title": "Category III appliance",
    "description": "an appliance that operates with a positive vent static pressure and with a flue loss not less than 17%."
  },
  {
    "clause": "3.11",
    "title": "Category IV appliance",
    "description": "an appliance that operates with a positive vent static pressure and with a flue loss less than 17%."
  },
  {
    "clause": "3.12",
    "title": "Approved",
    "description": "acceptable to the authority having jurisdiction."
  },
  {
    "clause": "3.13",
    "title": "Authority having jurisdiction",
    "description": "the governmental body responsible for the enforcement of any part of this Code, or the official or agency designated by that body to exercise such a function."
  },
  {
    "clause": "3.22",
    "title": "Boiler",
    "description": "an appliance intended to supply hot liquid or vapour for space-heating, processing, or power purposes (does not include appliances certified as water heaters)."
  },
  {
    "clause": "3.32",
    "title": "Burner",
    "description": "a device, or group of devices, that forms an integral unit for the introduction of gas, with or without air or oxygen, into the combustion zone for ignition."
  },
  {
    "clause": "3.36",
    "title": "Certified",
    "description": "investigated and identified by a designated testing organization as conforming to recognized standards, requirements, or accepted test reports."
  },
  {
    "clause": "3.37",
    "title": "Chimney",
    "description": "a primarily vertical shaft that encloses at least one flue for conducting flue gases outdoors."
  },
  {
    "clause": "3.42",
    "title": "Combustion products",
    "description": "constituents that result from the combustion of gas with the oxygen of the air and include inert gases but exclude excess air."
  },
  {
    "clause": "3.51",
    "title": "Damper",
    "description": "a plate or valve for regulating the flow of air or flue gas."
  },
  {
    "clause": "3.56",
    "title": "Direct-vent appliance",
    "description": "an appliance constructed so that all the combustion air is supplied directly from, and the products of combustion are vented directly to, the outdoors by independent enclosed passageways connected directly to the appliance."
  },
  {
    "clause": "3.58",
    "title": "Draft",
    "description": "the flow of air or combustion products, or both, through an appliance and its venting system."
  },
  {
    "clause": "3.65",
    "title": "Draft hood",
    "description": "a draft-control device having neither movable nor adjustable parts. A draft hood may be built into an appliance, attached to an appliance, or made part of a vent connector. It is designed to ensure the ready escape of flue gases from the combustion chamber in the event of either no draft or stoppage downstream from the draft hood; prevent a backdraft from entering the combustion chamber of the appliance; and neutralize the effect of stack action of either a chimney or a vent upon the operation of the appliance."
  },
  {
    "clause": "3.87",
    "title": "Flue",
    "description": "an enclosed passageway for conveying flue gases."
  },
  {
    "clause": "3.93",
    "title": "Flue gases",
    "description": "combustion products and excess air."
  },
  {
    "clause": "3.94",
    "title": "Furnace",
    "description": "an indirect-fired, flue-connected, space-heating appliance that uses warm air as the heating medium and usually has provision for the attachment of ducts."
  },
  {
    "clause": "3.102",
    "title": "Gas piping system",
    "description": "all components that convey gas or liquids, such as piping, tubing, valves, hoses, and fittings, from the point of delivery to the inlet of the appliance."
  },
  {
    "clause": "3.115",
    "title": "Installer",
    "description": "any individual, firm, corporation, or company that either directly or through a representative is engaged in the installation, replacement, repair, or servicing of gas piping systems, venting systems, appliances, components, accessories, or equipment, and whose representative is either experienced or trained, or both, in such work and has complied with the requirements of the authority having jurisdiction."
  },
  
  // Section 4 - General Requirements (Key general provisions)
  {
    "clause": "4.1",
    "title": "Scope of work",
    "description": "This Code covers the installation of gas piping systems, appliances, and related equipment from the outlet of the gas meter or service regulator to and including the appliance."
  },
  {
    "clause": "4.2",
    "title": "Materials and equipment",
    "description": "All materials, appliances, and equipment shall be suitable for the intended use and shall comply with the applicable standards referenced in Section 2."
  },
  {
    "clause": "4.3",
    "title": "Workmanship",
    "description": "All work shall be performed in a workmanlike manner in accordance with accepted trade practices."
  },
  {
    "clause": "4.4",
    "title": "Installation permits",
    "description": "Installation permits may be required by the authority having jurisdiction prior to the commencement of work."
  }
];

// Search function for free CSA data with upgrade prompts
// Normalize search terms to handle hyphenated words
const normalizeSearchTerm = (text) => {
  return text.toLowerCase().replace(/-/g, ' ');
};

export const searchFreeCSAData = (query) => {
  if (!query || query.trim() === '') return [];

  const searchTerm = query.toLowerCase().trim();
  const normalizedSearchTerm = normalizeSearchTerm(searchTerm);

  const results = freeCSAData.filter(item => {
    const normalizedClause = normalizeSearchTerm(item.clause);
    const normalizedTitle = normalizeSearchTerm(item.title);
    const normalizedDescription = normalizeSearchTerm(item.description);

    // Check clause number (exact match gets priority)
    if (item.clause.toLowerCase().includes(searchTerm) || normalizedClause.includes(normalizedSearchTerm)) return true;

    // Check title (word matching with and without hyphens)
    if (item.title.toLowerCase().includes(searchTerm) || normalizedTitle.includes(normalizedSearchTerm)) return true;

    // Check description (word matching with and without hyphens)
    if (item.description.toLowerCase().includes(searchTerm) || normalizedDescription.includes(normalizedSearchTerm)) return true;

    return false;
  }).sort((a, b) => {
    // Sort by clause number for better organization
    const aClause = a.clause.split('.').map(n => parseInt(n) || 0);
    const bClause = b.clause.split('.').map(n => parseInt(n) || 0);
    
    for (let i = 0; i < Math.max(aClause.length, bClause.length); i++) {
      const aNum = aClause[i] || 0;
      const bNum = bClause[i] || 0;
      if (aNum !== bNum) return aNum - bNum;
    }
    
    return 0;
  });

  // Add upgrade prompt for searches that might need premium content or when results are limited
  const premiumKeywords = ['piping', 'installation', 'venting', 'clearance', 'pressure', 'sizing', 'section 5', 'section 6', 'section 7', 'section 8', 'annex'];
  const needsPremium = premiumKeywords.some(keyword => searchTerm.includes(keyword));
  
  // Show upgrade prompt if: premium keywords found OR limited results OR after any search (to promote upgrade)
  if (needsPremium || results.length < 5 || searchTerm.length > 2) {
    results.push({
      clause: "UPGRADE",
      title: "🔓 Unlock Complete CSA B149.1-25 Code Book",
      description: "Get access to Pressure Controls, Piping Systems, Specific Appliances, Venting Systems and more! The entire code and annexes. Plus AI explanations for every code section.",
      category: "Premium Feature",
      isPremiumUpgrade: true
    });
  }
  
  return results;
};

// Free CSA B149.2-25 sample data (Definitions and General sections only)
const freeCSAB149_2_Data = [
  {
    "clause": "3.1",
    "title": "Accessory",
    "description": "a part capable of performing an independent function and contributing to the operation of the appliance that it serves."
  },
  {
    "clause": "3.2",
    "title": "Aerosol container", 
    "description": "a non-refillable container meeting the requirements for 2P, 2Pl, 2Q, 2Q2, or 2R aerosol containers for containment and transportation of propane under the Transportation of Dangerous Goods Regulations of Transport Canada."
  },
  {
    "clause": "3.3",
    "title": "Appliance",
    "description": "a device to convert propane into energy (including any component, control, wiring, piping, or tubing required to be part of the device)."
  },
  {
    "clause": "3.4",
    "title": "Approved",
    "description": "acceptable to the authority having jurisdiction."
  },
  {
    "clause": "3.5",
    "title": "Authority having jurisdiction",
    "description": "the governmental body responsible for the enforcement of any part of this Code, or the official or agency designated by that body to exercise such a function."
  },
  {
    "clause": "3.6",
    "title": "Container",
    "description": "either a cylinder or a tank used for propane storage."
  },
  {
    "clause": "3.7",
    "title": "Cylinder",
    "description": "a container designed and fabricated in accordance with the specifications of Transport Canada or the US Department of Transportation for the storage and transportation of gas."
  },
  {
    "clause": "3.8",
    "title": "Filling",
    "description": "the transfer of propane from a supply source to a container."
  },
  {
    "clause": "3.9",
    "title": "Propane",
    "description": "a hydrocarbon gas (C3H8) that is normally stored and transported as a liquid under pressure."
  },
  {
    "clause": "3.10",
    "title": "Tank",
    "description": "a container that exceeds the size or weight limits for cylinders as established by Transport Canada."
  }
];

// Search function for free CSA B149.2 data  
export const searchFreeCSAB149_2_Data = (query) => {
  if (!query || query.trim() === '') return [];

  const searchTerm = query.toLowerCase().trim();
  const normalizedSearchTerm = normalizeSearchTerm(searchTerm);

  const results = freeCSAB149_2_Data.filter(item => {
    const normalizedClause = normalizeSearchTerm(item.clause);
    const normalizedTitle = normalizeSearchTerm(item.title);
    const normalizedDescription = normalizeSearchTerm(item.description);

    if (item.clause.toLowerCase().includes(searchTerm) || normalizedClause.includes(normalizedSearchTerm)) return true;
    if (item.title.toLowerCase().includes(searchTerm) || normalizedTitle.includes(normalizedSearchTerm)) return true;
    if (item.description.toLowerCase().includes(searchTerm) || normalizedDescription.includes(normalizedSearchTerm)) return true;
    return false;
  });

  // Add upgrade prompt for B149.2 searches (show for most searches to promote upgrade)
  if (results.length < 5 || searchTerm.length > 2) {
    results.push({
      clause: "UPGRADE",
      title: "🔓 Unlock Complete CSA B149.2-25 Propane Code Book", 
      description: "Get access to Container Requirements, Safety Procedures, Installation Standards, Technical Specifications and more! The entire propane code and annexes. Plus AI explanations for every code section.",
      category: "Premium Feature",
      isPremiumUpgrade: true
    });
  }
  
  return results;
};

// Get free sections info
export const getFreeCSAInfo = () => ({
  title: "CSA B149.1-25 Natural Gas Installation Code (Free Preview)",
  sections: {
    1: "Scope and Application",
    2: "Reference Publications", 
    3: "Definitions",
    4: "General Requirements"
  },
  premiumSections: {
    5: "Gas Piping Systems",
    6: "Appliance Installation",
    7: "Specific Appliances", 
    8: "Venting Systems",
    9: "Air Supply",
    10: "Gas Compressors",
    "A-H": "Technical Annexes"
  },
  totalEntries: {
    free: freeCSAData.length,
    premium: 1118,
    total: 1118 + freeCSAData.length
  }
});

// Export the free data
export { freeCSAData, freeCSAB149_2_Data };