// data/csaData.js
// CSA B149.1-25 Gas Code Data
// Extracted from App.jsx for better organization

export const csaData = [
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
    "clause": "3.14",
    "title": "Automatic vent damper device",
    "description": "a device intended for installation at the outlet or downstream of an individual appliance draft hood and designed to automatically open the venting system before or shortly after the main burner is activated and to automatically close the venting system after the main burner is deactivated."
  },
  {
    "clause": "C.1",
    "title": "General",
    "description": "This informative (non-mandatory) Annex has been written in normative (mandatory) language to facilitate adoption where users of the Code or regulatory authorities wish to adopt it formally as additional requirements to this Code.",
    "annex": "C",
    "category": "General"
  },
  {
    "clause": "C.2",
    "title": "General venting requirements (GVRs)",
    "description": "General venting requirements that apply to both Category I draft-hood-equipped and Category I fan-assisted combustion appliances.",
    "annex": "C",
    "category": "General"
  },
  {
    "clause": "K.1",
    "title": "Line Pressure Regulator Class Rating",
    "description": "Table K.1 - Line Pressure Regulator Class Rating: Rated inlet pressure 2 psig (13.8 kPa) - Class I maximum outlet pressure 1/2 psig (3.5 kPa), Class II not applicable.",
    "annex": "K",
    "category": "Tables"
  },
  {
    "clause": "M.1",
    "title": "Annex M application scope",
    "description": "This Annex applies to appliances that are on display at shows, exhibitions, or other similar events and are designed to be used outdoors or vented to the outdoors.",
    "annex": "M",
    "category": "General"
  },
  {
    "clause": "H.1",
    "title": "Purging requirement scope",
    "description": "Purging of piping and tubing systems where a readily accessible burner is not available or where an appliance is not equipped with a continuous pilot shall be undertaken as outlined in Clauses H.2 to H.7.",
    "annex": "H",
    "category": "General"
  }
];

// Search function with improved matching
export const searchCSAData = (query) => {
  if (!query || query.trim() === '') return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  return csaData.filter(item => {
    // Check clause number (exact match gets priority)
    if (item.clause.toLowerCase().includes(searchTerm)) return true;
    
    // Check title (word matching)
    if (item.title.toLowerCase().includes(searchTerm)) return true;
    
    // Check description (word matching)
    if (item.description.toLowerCase().includes(searchTerm)) return true;
    
    // Check annex letter (for annex searches)
    if (item.annex && item.annex.toLowerCase().includes(searchTerm)) return true;
    
    // Check category
    if (item.category && item.category.toLowerCase().includes(searchTerm)) return true;
    
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
};

// Get popular search terms (for suggestions)
export const getPopularSearchTerms = () => [
  'appliance', 'pressure', 'regulator', 'vent', 'piping',
  'combustion', 'installation', 'clearance', 'valve', 'safety'
];

// Get annex information
export const getAnnexInfo = () => ({
  'C': 'Venting Requirements and Tables',
  'K': 'Pressure Regulators and Overpressure Protection',
  'M': 'Operation at Shows and Exhibitions', 
  'H': 'Purging Procedures'
});