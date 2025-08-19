import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Import the new search functionality
import { searchCSACode, createCSASearchIndex, csaB149Data } from '../data/csaDataB149_2.js';
import { searchRegulations, createRegulationSearchIndex, regulationsData } from '../data/regulationsData.js';
import { trialManager } from './utils/trialManager.js';
// Add this import at the top
import { paymentHandler } from './utils/paymentHandler.js';
import { validateEmail } from './utils/emailcollection.js';
import { 
  trackTrialStarted,
  trackSearch,
  trackSubscriptionAttempt,
  trackEmailSubmission 
} from './utils/analytics.js';
// AI Interpretation imports
import AIInterpretation from './components/AIInterpretation.jsx';
// Authentication imports
import AuthModal from './components/Auth/AuthModal.jsx';
import DeviceManager from './components/Auth/DeviceManager.jsx';

// Full CSA data array (all the codes from your original file)
const fullCSAData = [
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
    "clause": "3.15",
    "title": "Electrically operated vent damper device",
    "description": "an automatic vent damper device that is controlled by electrical energy."
  },
  {
    "clause": "3.16",
    "title": "Thermally actuated vent damper device",
    "description": "an automatic vent damper device dependent for operation exclusively upon the direct conversion of the thermal energy of the vent gases into mechanical energy."
  },
  {
    "clause": "3.17",
    "title": "Baffle",
    "description": "a stationary device used to divert the flow of fluid (air, water, or steam) and flue gases (in the case of a flue baffle) or used to shield parts of an appliance from the effects of flame (in the case of a flame baffle) or heat (in the case of a heat baffle)."
  },
  {
    "clause": "3.18",
    "title": "Bathroom",
    "description": "a room used primarily for bathing and containing a bathtub and/or shower."
  },
  {
    "clause": "3.19",
    "title": "Bedroom",
    "description": "a room furnished with a bed and used primarily for sleeping."
  },
  {
    "clause": "3.20",
    "title": "Bed-sitting room",
    "description": "a one-room apartment serving as both a bedroom and a sitting room."
  },
  {
    "clause": "3.21",
    "title": "Bleed vent",
    "description": "a vent where the expiration or inspiration of air or gas occurs from or to one side of a diaphragm of any accessory, component, or equipment such as a valve, pressure regulator, or switch."
  },
  {
    "clause": "3.22",
    "title": "Boiler",
    "description": "an appliance intended to supply hot liquid or vapour for space-heating, processing, or power purposes (does not include appliances certified as water heaters)."
  },
  {
    "clause": "3.23",
    "title": "Branch line",
    "description": "the part of a piping or tubing system that conveys gas from the main piping or tubing or header to an appliance(s)."
  },
  {
    "clause": "3.24",
    "title": "Building",
    "description": "a structure or part thereof used or intended for supporting or sheltering persons, animals, or property and classified by its occupancy in accordance with the applicable building code of the authority having jurisdiction or, in the absence of such a code, in accordance with the National Building Code of Canada."
  },
  {
    "clause": "3.25",
    "title": "Aircraft hangar",
    "description": "a building or other structure in any part of which aircraft are housed or stored and in which aircraft can undergo servicing, repairs, or alterations."
  },
  {
    "clause": "3.26",
    "title": "Assembly building",
    "description": "any building or part of a building used by a gathering of persons for civic, political, travel, religious, social, educational, recreational, or like purposes, or for the consumption of food or drink."
  },
  {
    "clause": "3.27",
    "title": "Care or detention occupancy building",
    "description": "any building or part thereof used or occupied by persons who require special care or treatment because of cognitive or physical limitations, or by persons who are incapable of self-preservation and who are restrained from self-destruction by security measures not under their control."
  },
  {
    "clause": "3.28",
    "title": "Commercial building",
    "description": "any building used in connection with direct trade with, or service of, the public."
  },
  {
    "clause": "3.29",
    "title": "Industrial building",
    "description": "any building used in connection with production or process work or with storage or warehousing."
  },
  {
    "clause": "3.30",
    "title": "Residential building",
    "description": "any building or part thereof used by persons for whom sleeping accommodation is provided but who are not harboured or detained to receive medical care or treatment or are not involuntarily detained."
  },
  {
    "clause": "3.31",
    "title": "Building opening",
    "description": "a planned aperture that is intended to permit air infiltration but does not include an exhaust vent or a non-openable window."
  },
  {
    "clause": "3.32",
    "title": "Burner",
    "description": "a device, or group of devices, that forms an integral unit for the introduction of gas, with or without air or oxygen, into the combustion zone for ignition."
  },
  {
    "clause": "3.33",
    "title": "Fan-assisted burner",
    "description": "a burner in which the combustion air is supplied by a mechanical device such as a fan or blower at sufficient pressure to overcome the resistance of the burner only."
  },
  {
    "clause": "3.34",
    "title": "Forced-draft burner",
    "description": "a burner in which the combustion air is supplied by a mechanical device such as a fan or blower at sufficient pressure to overcome the resistance of the burner and the appliance."
  },
  {
    "clause": "3.35",
    "title": "Natural-draft burner",
    "description": "a burner that is not equipped with a mechanical device for supplying combustion air."
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
    "clause": "3.38",
    "title": "Factory-built chimney",
    "description": "a chimney that consists entirely of factory-made parts, each designed to be assembled with the other without requiring fabrication on site."
  },
  {
    "clause": "3.39",
    "title": "Masonry or concrete chimney",
    "description": "a chimney of brick, stone, concrete, or approved masonry units constructed on site."
  },
  {
    "clause": "3.40",
    "title": "Metal chimney (smokestack)",
    "description": "a single-wall chimney of metal constructed on site."
  },
  {
    "clause": "3.41",
    "title": "Combustible",
    "description": "material that fails to conform to CAN/ULC-S114 requirements for noncombustibility."
  },
  {
    "clause": "3.42",
    "title": "Combustion products",
    "description": "constituents that result from the combustion of gas with the oxygen of the air and include inert gases but exclude excess air."
  },
  {
    "clause": "3.43",
    "title": "Combustion safety control (flame safeguard)",
    "description": "a primary safety control that senses the presence of flame and causes gas to be shut off in the event of flame or ignition failure."
  },
  {
    "clause": "3.44",
    "title": "Commercial- and industrial-type appliance or equipment",
    "description": "an appliance or equipment other than a residential or recreational type."
  },
  {
    "clause": "3.45",
    "title": "Commercial cooking appliance",
    "description": "an appliance that complies with the applicable CSA Standard covering hotel and restaurant ranges and unit broilers, hotel and restaurant deep fat fryers, commercial baking and roasting ovens, counter appliances, kettles, steam cookers, or steam generators."
  },
  {
    "clause": "3.46",
    "title": "Component",
    "description": "an essential part of an appliance or equipment."
  },
  {
    "clause": "3.47",
    "title": "Concealed piping or tubing",
    "description": "piping or tubing that, when in place in a wall, floor, or ceiling of a finished building, is hidden from view and can only be exposed by use of a tool. The term does not apply to piping or tubing that passes directly through a wall or partition."
  },
  {
    "clause": "3.48",
    "title": "Condensate (condensation)",
    "description": "a liquid separated from a gas (including flue gas) due to a reduction in temperature or an increase in pressure."
  },
  {
    "clause": "3.49",
    "title": "Container (with respect to NGV/propane storage)",
    "description": "either a cylinder or a tank."
  },
  {
    "clause": "3.50",
    "title": "Cylinder (with respect to NGV/propane storage)",
    "description": "a container designed and fabricated in accordance with the specifications of Transport Canada or the US Department of Transportation for the storage and transportation of gas."
  },
  {
    "clause": "3.51",
    "title": "Damper",
    "description": "a plate or valve for regulating the flow of air or flue gas."
  },
  {
    "clause": "3.52",
    "title": "Delivery pressure",
    "description": "the outlet gas pressure from the service regulator for natural gas or a second stage propane regulator for propane."
  },
  {
    "clause": "3.53",
    "title": "Depressurization",
    "description": "the maximum appliance input rating of a Category I appliance equipped with a draft hood that could be attached to the vent when the appliance is located in a structure that can experience sustained depressurization of up to 0.02 in w.c. (5 Pa), e.g., a tight structure with a mechanically ventilated structure."
  },
  {
    "clause": "3.54",
    "title": "Design pressure",
    "description": "the maximum inlet pressure a gas piping system or valve train is capable and intended to continuously sustain, contain, or control under normal conditions."
  },
  {
    "clause": "3.55",
    "title": "Direct-fired appliance",
    "description": "an appliance in which the combustion products or flue gases are intermixed with the medium being heated."
  },
  {
    "clause": "3.56",
    "title": "Direct-vent appliance",
    "description": "an appliance constructed so that all the combustion air is supplied directly from, and the products of combustion are vented directly to, the outdoors by independent enclosed passageways connected directly to the appliance."
  },
  {
    "clause": "3.57",
    "title": "Dirt pocket (dust pocket)",
    "description": "a pocket in a piping system designed for the collection of dirt and from which the dirt can be removed."
  },
  {
    "clause": "3.58",
    "title": "Draft",
    "description": "the flow of air or combustion products, or both, through an appliance and its venting system."
  },
  {
    "clause": "3.59",
    "title": "Chimney draft",
    "description": "the available natural draft of the chimney measured at or near the base of the chimney."
  },
  {
    "clause": "3.60",
    "title": "Mechanical draft",
    "description": "a draft produced by a mechanical device, such as a fan, blower, or aspirator, that can supplement natural draft."
  },
  {
    "clause": "3.61",
    "title": "Forced draft",
    "description": "a mechanical draft produced by a device upstream from the combustion zone of an appliance."
  },
  {
    "clause": "3.62",
    "title": "Induced draft",
    "description": "a mechanical draft produced by a device downstream from the combustion zone of an appliance."
  },
  {
    "clause": "3.63",
    "title": "Natural draft",
    "description": "a draft other than a mechanical draft."
  },
  {
    "clause": "3.64",
    "title": "Draft-control device",
    "description": "either a draft hood or a draft regulator."
  },
  {
    "clause": "3.65",
    "title": "Draft hood",
    "description": "a draft-control device having neither movable nor adjustable parts. A draft hood may be built into an appliance, attached to an appliance, or made part of a vent connector. It is designed to ensure the ready escape of flue gases from the combustion chamber in the event of either no draft or stoppage downstream from the draft hood; prevent a backdraft from entering the combustion chamber of the appliance; and neutralize the effect of stack action of either a chimney or a vent upon the operation of the appliance."
  },
  {
    "clause": "3.66",
    "title": "Draft regulator (barometric damper)",
    "description": "a draft-control device intended to stabilize the natural draft in an appliance by admitting room air to the venting system. A double-acting draft regulator is one whose balancing damper is free to move in either direction."
  },
  {
    "clause": "3.67",
    "title": "Drip pocket (drip)",
    "description": "a pocket in a piping system designed for the collection of condensate and from which the condensate can be removed."
  },
  {
    "clause": "3.68",
    "title": "Dwelling unit",
    "description": "a housekeeping unit used or intended to be used as a domicile by one or more persons, and usually containing cooking, eating, living, sleeping, and sanitary facilities."
  },
  {
    "clause": "3.69",
    "title": "Emergency generators (generators)",
    "description": "engines that operate to provide power to critical operational support such as protection of property, firefighting activities, and building evacuation."
  },
  {
    "clause": "3.70",
    "title": "Enclosure",
    "description": "a secondary structure (room) within or attached to a structure (building) in which an appliance is installed."
  },
  {
    "clause": "3.71",
    "title": "Engine",
    "description": "a device that performs mechanical work that is used to operate other machinery and equipment."
  },
  {
    "clause": "3.72",
    "title": "Reciprocating engine (also known as a piston engine)",
    "description": "an engine that utilizes one or more pistons in order to convert pressure into a rotating motion."
  },
  {
    "clause": "3.73",
    "title": "Turbine engine",
    "description": "a rotary engine that extracts energy from a flow of combustion gas. It has an upstream compressor coupled to a downstream turbine and a combustion chamber in between."
  },
  {
    "clause": "3.74",
    "title": "Equipment",
    "description": "a device, other than an appliance, accessory, or component, that is connected to a piping or tubing system."
  },
  {
    "clause": "3.75",
    "title": "False ceiling space",
    "description": "ceiling space that is enclosed with tiles or panels that are removable without the use of a tool. A typical type is the T-bar-constructed suspended ceiling."
  },
  {
    "clause": "3.76",
    "title": "Fan-assisted combustion system",
    "description": "an appliance equipped with an integral mechanical means to either draw or force products of combustion through the combustion chamber and/or heat exchanger."
  },
  {
    "clause": "3.77",
    "title": "FAN Max",
    "description": "the maximum appliance input rating of a Category I appliance with a fan-assisted combustion system that could be attached to the vent."
  },
  {
    "clause": "3.78",
    "title": "FAN Min",
    "description": "the minimum appliance input rating of a category I appliance with a fan-assisted combustion system that could be attached to the vent."
  },
  {
    "clause": "3.79",
    "title": "FAN+FAN",
    "description": "the maximum combined input rating of two or more fan-assisted appliances attached to the common vent."
  },
  {
    "clause": "3.80",
    "title": "FAN+NAT",
    "description": "the maximum combined input rating of one or more fan-assisted appliances and one or more draft-hood-equipped appliances attached to the common vent."
  },
  {
    "clause": "3.81",
    "title": "Fireplace",
    "description": "a device for burning solid fuel that has the major portion of one or more essentially vertical sides open or openable for refuelling and for the visual effects of the burning fuel."
  },
  {
    "clause": "3.82",
    "title": "Fitting",
    "description": "an item in a piping or tubing system that is used as a means of connection, such as an elbow, return bend, tee, union, bushing, coupling, or cross, but does not include such functioning items as a valve or pressure regulator."
  },
  {
    "clause": "3.83",
    "title": "Fixed-liquid-level gauge",
    "description": "a type of liquid-level gauge that uses a small bleed valve and is designed to indicate when the liquid level in a container being filled reaches the point at which the gauge or its connecting tube communicates with the interior of the container."
  },
  {
    "clause": "3.84",
    "title": "Flammable liquid",
    "description": "a liquid that has a flashpoint below 100 °F (38 °C) and that has a vapour pressure not exceeding 40 psia (276 kPa absolute) at 100 °F (38 °C)."
  },
  {
    "clause": "3.85",
    "title": "Flashpoint",
    "description": "the minimum temperature at which a liquid within a container gives off vapour in sufficient concentration to form an ignitable mixture with air near the surface of the liquid."
  },
  {
    "clause": "3.86",
    "title": "Floor furnace",
    "description": "a furnace that is suspended from the floor of the space being heated and that supplies warm air to such space through integral floor or wall grilles without the use of ducts."
  },
  {
    "clause": "3.87",
    "title": "Flue",
    "description": "an enclosed passageway for conveying flue gases."
  },
  {
    "clause": "3.88",
    "title": "Flue backflow preventer",
    "description": "a system or device used in common venting of positive pressure appliances to prevent the exhaust flue from active appliances sharing the system from flowing back into the vent of dormant or idling appliance(s)."
  },
  {
    "clause": "3.89",
    "title": "Flue collar",
    "description": "that portion of an appliance designed for the attachment of a draft hood, vent connector, or venting system."
  },
  {
    "clause": "3.90",
    "title": "Flue damper",
    "description": "a movable plate for regulating the flow of flue gases and intended for installation either in the flue outlet of any gas appliance or in the vent connector from an individual appliance that is not equipped with a draft-control device."
  },
  {
    "clause": "3.91",
    "title": "Automatic flue damper",
    "description": "a flue damper that is designed to fully open the venting system automatically before ignition of the main burner and is either interlocked to automatically close off the supply of gas to the appliance or provided with means to ensure that the damper will fall fully open upon loss of the driving medium."
  },
  {
    "clause": "3.92",
    "title": "Manually operated flue damper",
    "description": "a flue damper that is adjustable and manually set and locked in the desired position, and is designed or constructed to provide a fixed minimum opening."
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
    "clause": "3.95",
    "title": "Gallon",
    "description": "the Canadian standard gallon as defined under the Canadian Weights and Measures Act. For the purpose of this Code, 1 imperial gallon is considered equal to 1 Canadian standard gallon."
  },
  {
    "clause": "3.96",
    "title": "Private garage",
    "description": "a building, designed for the parking, storage, or repair of vehicles used to transport propane, that is approved by the authority having jurisdiction for its purpose and is located on property owned or leased by the owner of the vehicles."
  },
  {
    "clause": "3.97",
    "title": "Repair garage",
    "description": "a building or part of a building where facilities are provided for the repair or servicing of a motor vehicle."
  },
  {
    "clause": "3.98",
    "title": "Storage garage",
    "description": "a building or part of a building that is used or intended for either the storage or parking of motor vehicles and that contains no provision for either the repair or servicing of such vehicles."
  },
  {
    "clause": "3.99",
    "title": "Gas connector",
    "description": "a factory-fabricated assembly consisting of gas conduit and related fittings designed to convey gaseous fuel from a gas supply piping to the gas inlet of an appliance. A gas connector is not intended for vibration isolation, nor expansion or contraction control."
  },
  {
    "clause": "3.100",
    "title": "Gas convenience outlet",
    "description": "a permanently mounted hand-operated device that is certified to CSA/ANSI 221.90/CSA 6.24 providing a means for connecting and disconnecting an appliance to the gas supply piping by way of a gas hose or gas connector."
  },
  {
    "clause": "3.101",
    "title": "Gas hose",
    "description": "a factory-fabricated flexible hose assembly and related fittings designed to convey gaseous fuel from a gas supply piping to the gas inlet to an appliance."
  },
  {
    "clause": "3.102",
    "title": "Gas piping system",
    "description": "all components that convey gas or liquids, such as piping, tubing, valves, hoses, and fittings, from the point of delivery to the inlet of the appliance."
  },
  {
    "clause": "3.103",
    "title": "Heat reclaimer",
    "description": "a device installed either externally or internally to a venting system to extract heat from flue gases."
  },
  {
    "clause": "3.104",
    "title": "Catalytic heater",
    "description": "a heater that employs a porous matrix on or in which is distributed a catalytic agent such as platinum; the role of the matrix is to support the catalyst and to provide a surface on which the combustion of the hydrocarbon fuel vapour takes place."
  },
  {
    "clause": "3.105",
    "title": "Construction heater",
    "description": "a portable heater intended only for temporary use in heating buildings under construction, alteration, or repair."
  },
  {
    "clause": "3.106",
    "title": "Direct-fired make-up air heater (DFMAH)",
    "description": "a self-contained direct-fired air heater used only to heat outside air to replace inside air that is exhausted; it is not intended for building heating."
  },
  {
    "clause": "3.107",
    "title": "Direct gas-fired process air heater (DFPAH)",
    "description": "a direct gas-fired air heater that can be capable of either or both of two operating modes: the ventilation mode, suitable for use when people are present, in which all the products of combustion generated by the gas-burning device are released into the airstream being heated, and whose purpose is to offset building heat loss by heating only incoming outside air; and the process mode, for use when people are not present, in which the heater can operate as a direct gas-fired heater intended for the drying, baking, or curing of product."
  },
  {
    "clause": "3.108",
    "title": "Infrared heater",
    "description": "a heater that transfers heat from the source to the heated objects without heating the intervening air."
  },
  {
    "clause": "3.109",
    "title": "Non-recirculating direct gas-fired industrial air heater (DFIAH)",
    "description": "a heater in which all the products of combustion generated by the gas-burning device are released into the airstream being heated and whose purpose is to offset building heat loss by heating only incoming outside air."
  },
  {
    "clause": "3.110",
    "title": "Radiant heater",
    "description": "a heater that radiates heat to the surrounding air."
  },
  {
    "clause": "3.111",
    "title": "Ignition",
    "description": "the establishment of a flame."
  },
  {
    "clause": "3.112",
    "title": "Intermittent ignition",
    "description": "a source of ignition that continues to function during the entire period that the flame is present."
  },
  {
    "clause": "3.113",
    "title": "Interrupted ignition",
    "description": "a source of ignition that ceases to function after the trial-for-ignition period."
  },
  {
    "clause": "3.114",
    "title": "Indirect-fired appliance",
    "description": "an appliance in which the combustion products or flue gases are not mixed within the appliance with the medium that is being heated."
  },
  {
    "clause": "3.115",
    "title": "Installer",
    "description": "any individual, firm, corporation, or company that either directly or through a representative is engaged in the installation, replacement, repair, or servicing of gas piping systems, venting systems, appliances, components, accessories, or equipment, and whose representative is either experienced or trained, or both, in such work and has complied with the requirements of the authority having jurisdiction."
  },
  {
    "clause": "3.116",
    "title": "Insulating millboard",
    "description": "a factory-fabricated board formed with noncombustible materials, normally fibres, and having a thermal conductivity not exceeding 1 Btu • in / h•ft² •°F (0.144 W / m•K)."
  },
  {
    "clause": "3.117",
    "title": "Lock-up (positive shut-off)",
    "description": "a feature of a pressure regulator that is capable of maintaining a reduced outlet pressure when the fuel flow condition is static."
  },
  {
    "clause": "3.118",
    "title": "Maximum operating pressure",
    "description": "the maximum pressure to which any component or portion of the fuel system can be subjected."
  },
  {
    "clause": "3.119",
    "title": "Mechanical air intake",
    "description": "a means to mechanically provide ventilation and/or combustion and flue gas dilution air requirements to a building."
  },
  {
    "clause": "3.120",
    "title": "Mobile home",
    "description": "a dwelling that consists of a vehicular portable structure built on a chassis and designed to be used with or without a permanent foundation and to be connected to indicated utilities."
  },
  {
    "clause": "3.121",
    "title": "Mobile industrial or commercial structure",
    "description": "a structure that is not intended as a dwelling unit, is towable on its own chassis, and is designed for use without a permanent foundation. Such a structure is built specifically for commercial or industrial use, such as a construction office, bunkhouse, wash house, kitchen and dining unit, library, television unit, industrial display unit, laboratory unit, or medical clinic."
  },
  {
    "clause": "3.122",
    "title": "Multiple-section mobile home",
    "description": "a single structure composed of separate mobile units, each towable on its own chassis; when the units are towed to the site, they are coupled together mechanically and electrically to form the single structure. These structures are sometimes referred to as 'double-wide mobile homes' when only two units are joined together."
  },
  {
    "clause": "3.123",
    "title": "Swing-out and expandable room-section mobile home",
    "description": "a mobile home that can be telescoped when towed and expanded later for additional capacity."
  },
  {
    "clause": "3.124",
    "title": "Mobile outdoor food service unit",
    "description": "a unit used outdoors for preparation and dispensing of food or beverages and that contains appliances or equipment operated by propane in the vapour state. The unit can be equipped with wheels and its own motive power."
  },
  {
    "clause": "3.125",
    "title": "N/A",
    "description": "not applicable due to physical or geometric constraints."
  },
  {
    "clause": "3.126",
    "title": "NAT Max",
    "description": "the maximum appliance input rating of a Category I appliance equipped with a draft hood that could be attached to the vent. There are no minimum appliance input ratings for draft-hood-equipped appliances."
  },
  {
    "clause": "3.127",
    "title": "NAT+NAT",
    "description": "the maximum combined input rating of two or more draft-hood-equipped appliances attached to the common vent."
  },
  {
    "clause": "3.128",
    "title": "NGV",
    "description": "natural gas stored in a gaseous state to be used as engine fuel for a highway vehicle."
  },
  {
    "clause": "3.129",
    "title": "Noncombustible",
    "description": "material that conforms to CAN/ULC-S114 requirements for noncombustibility."
  },
  {
    "clause": "3.130",
    "title": "NR",
    "description": "not recommended due to potential for condensate formation and/or pressurization of the venting system."
  },
  {
    "clause": "3.131",
    "title": "Operating control",
    "description": "a control used to regulate or control the normal operation of an appliance."
  },
  {
    "clause": "3.132",
    "title": "Overpressure protection device",
    "description": "a device that under abnormal conditions will act to reduce, restrict, or shut off the supply of gas flowing into a system to prevent gas pressure in that system from exceeding the rated pressure of the system components."
  },
  {
    "clause": "3.133",
    "title": "Monitoring regulator",
    "description": "an overpressure protection device that functions as a second gas pressure regulator in series with the primary gas pressure regulator."
  },
  {
    "clause": "3.134",
    "title": "Overpressure relief device",
    "description": "an overpressure protection device that functions by discharging gas from the downstream system."
  },
  {
    "clause": "3.135",
    "title": "Overpressure shut-off device",
    "description": "an overpressure protection device that functions by completely shutting off the flow of gas into the downstream system."
  },
  {
    "clause": "3.136",
    "title": "Pilot",
    "description": "a flame that is used to ignite a gas/air or propane/air mixture at the main burner(s)."
  },
  {
    "clause": "3.137",
    "title": "Continuous pilot",
    "description": "a pilot that burns without turndown throughout the entire time the burner is in service, whether the main burner is firing or not."
  },
  {
    "clause": "3.138",
    "title": "Expanding pilot",
    "description": "a pilot that burns at low turndown throughout the entire time the burner is in service, whether or not the main burner is firing, except that upon a call for heat, the fuel flow to the pilot is automatically increased to produce a flame that will reliably ignite the main burner fuel."
  },
  {
    "clause": "3.139",
    "title": "Intermittent pilot",
    "description": "a pilot that is automatically lighted each time there is a call for heat and that burns during the entire period that the main burner is firing."
  },
  {
    "clause": "3.140",
    "title": "Interrupted pilot",
    "description": "a pilot that is automatically lighted each time there is a call for heat and that is cut off automatically at the end of the trial-for-ignition period of the main burner."
  },
  {
    "clause": "3.141",
    "title": "Proved pilot",
    "description": "a pilot flame supervised by a primary safety control that senses the presence of the pilot prior to gas being admitted to the main burner."
  },
  {
    "clause": "3.142",
    "title": "Pipe wrap tape",
    "description": "adhesive tape made of PVC or polyethylene material with minimum thickness of 10 mil (0.3 mm), with an adhesive resistant to water."
  },
  {
    "clause": "3.143",
    "title": "Piping",
    "description": "components of a gas piping system that include fittings, rigid pipe, and flanges."
  },
  {
    "clause": "3.144",
    "title": "Point of transfer",
    "description": "the dispensing hose inlet connection."
  },
  {
    "clause": "3.145",
    "title": "Power venter",
    "description": "a field-installed device that provides mechanical draft and, when installed, is located between the appliance flue outlet or draft-control device and the vent or chimney termination, or at the vent or chimney termination."
  },
  {
    "clause": "3.146",
    "title": "Pressure regulator",
    "description": "a device, either adjustable or nonadjustable, for controlling, maintaining within acceptable limits, a uniform outlet pressure."
  },
  {
    "clause": "3.147",
    "title": "Appliance regulator",
    "description": "a pressure regulator located in the valve train of an appliance."
  },
  {
    "clause": "3.148",
    "title": "Industrial regulator",
    "description": "a pressure regulator installed downstream of the service regulator and upstream of utilization equipment or another pressure regulator and that is either not certified, or certified but used in an application different than the scope of its certification."
  },
  {
    "clause": "3.149",
    "title": "Line pressure regulator",
    "description": "a pressure regulator installed downstream of the service regulator or second stage propane service regulator and upstream of gas utilization equipment, and certified to CSA/ANSI 221.80/CSA 6.22 or UL 144."
  },
  {
    "clause": "3.150",
    "title": "Lock-up (positive shut-off) regulator",
    "description": "a regulator that is capable of maintaining a reduced outlet pressure when the fuel flow condition is static."
  },
  {
    "clause": "3.151",
    "title": "Service regulator",
    "description": "a pressure regulator installed on a service line to control the pressure of the gas delivered to the customer."
  },
  {
    "clause": "3.152",
    "title": "Second stage propane regulator",
    "description": "in a propane application, a pressure regulator at the service entrance intended to reduce first-stage pressure to control the gas pressure inside a building. This regulator is also sometimes known as a '2 psi liquefied propane regulator'."
  },
  {
    "clause": "3.153",
    "title": "Purge",
    "description": "to replace the existing fluid (gaseous or liquid) in piping, tubing, equipment, a container, or an appliance with a desired fluid."
  },
  {
    "clause": "3.154",
    "title": "Purge burner",
    "description": "a burner equipped with a constant ignition source and a flame arrestor, intended to burn the escaping (discharged) gas during purging operations."
  },
  {
    "clause": "3.155",
    "title": "Quick-disconnect device",
    "description": "a hand-operated device that is used for connecting and disconnecting an appliance or a hose or certain types of gas connectors to a gas supply, that is equipped with an automatic means to shut off the gas supply when the device is disconnected, and that is certified to CSA/ANSI 221.41/CSA 6.9."
  },
  {
    "clause": "3.156",
    "title": "Rated pressure",
    "description": "the maximum pressure that the materials, gas piping, devices, valve train components, operating controls, or safety controls are designed to contain or control."
  },
  {
    "clause": "3.157",
    "title": "Readily accessible",
    "description": "capable of being reached quickly for operation, renewal, servicing, or inspection, without requiring climbing over, or the removal of, an obstacle or the use of a portable ladder."
  },
  {
    "clause": "3.158",
    "title": "Recreational vehicle",
    "description": "a portable structure intended as temporary accommodation for travel, vacation, or recreational use. Such a structure includes a chassis-mounted camper, motorized home, slide-in camper, tent trailer, or travel trailer."
  },
  {
    "clause": "3.159",
    "title": "Chassis-mounted camper",
    "description": "an accommodation body that attaches onto a truck chassis and is not intended for removal."
  },
  {
    "clause": "3.160",
    "title": "Motorized home",
    "description": "a vehicular portable structure of self-propelled design."
  },
  {
    "clause": "3.161",
    "title": "Slide-in camper",
    "description": "an accommodation body that fits into a standard vehicle and is designed to be easily removable."
  },
  {
    "clause": "3.162",
    "title": "Tent trailer",
    "description": "a vehicular portable structure built on its own chassis and having a rigid or canvas top and side walls that can be folded or otherwise condensed for transit."
  },
  {
    "clause": "3.163",
    "title": "Travel trailer",
    "description": "a vehicular portable structure that is intended to be towed by a motor vehicle and that does not fold up or reduce in size for transit."
  },
  {
    "clause": "3.164",
    "title": "Relief device",
    "description": "a device designed to open to prevent a rise of gas pressure in excess of a specified value due to an emergency or abnormal conditions."
  },
  {
    "clause": "3.165",
    "title": "Residential appliance",
    "description": "an appliance commonly used in, but not restricted to use in, a dwelling unit."
  },
  {
    "clause": "3.166",
    "title": "Residential fuelling appliance (RFA)",
    "description": "an appliance that dispenses natural gas for vehicles directly into the vehicle natural gas fuel storage system."
  },
  {
    "clause": "3.167",
    "title": "Safe location (for venting of gas)",
    "description": "a location that allows for the destruction or dispersal of vented gas so that it can reasonably be expected that the following will be prevented: blocking of the vent termination by snow, ice, water, or any other object or thing; gas accumulating in or under a building or enclosure; gas accumulating near a source of ignition, hot surface, electrical equipment, or operating control; gas accumulating in an area where a person would likely have difficulty in quickly leaving the area; or in an industrial application, gas discharging directly toward a person, walkway, staircase, or ladder."
  },
  {
    "clause": "3.168",
    "title": "Safety limit control",
    "description": "a safety control intended to prevent an unsafe condition of temperature, pressure, or liquid level."
  },
  {
    "clause": "3.169",
    "title": "Spray area",
    "description": "any fully enclosed, partly enclosed, or unenclosed area within a building in which spray processes are performed that could result in dangerous quantities of flammable or combustible vapours, mists, residues, dust, or deposits. Spray areas can include any area in the direct path of a spray operation process, a spray booth, a spray room, or a spray workstation."
  },
  {
    "clause": "3.170",
    "title": "Structure",
    "description": "the entire building in which an appliance is installed."
  },
  {
    "clause": "3.171",
    "title": "Supply pressure",
    "description": "the gas pressure at the manual shut-off valve of an appliance or equipment."
  },
  {
    "clause": "3.172",
    "title": "Tank (with respect to NGV/propane storage)",
    "description": "the class of container for the storage and transportation of gas, designed and fabricated in accordance with CSA B51."
  },
  {
    "clause": "3.173",
    "title": "Tubing",
    "description": "components of a gas piping system that include fittings and flexible pipe, tube, corrugated stainless steel tubing (CSST), and feedback lines."
  },
  {
    "clause": "3.174",
    "title": "Two-stage regulation",
    "description": "a propane gas vapour delivery system that utilizes a first-stage regulator and a second-stage regulator(s) or utilizes an integral two-stage regulator or automatic changeover regulator."
  },
  {
    "clause": "3.175",
    "title": "Valve",
    "description": "a device by which the flow of a fluid can be started, stopped, or regulated by a movable part that opens or obstructs passage."
  },
  {
    "clause": "3.176",
    "title": "Back check valve",
    "description": "a valve that is normally closed and allows flow in only one direction."
  },
  {
    "clause": "3.177",
    "title": "Cylinder valve",
    "description": "a valve fitted to a cylinder."
  },
  {
    "clause": "3.178",
    "title": "Emergency shut-off valve",
    "description": "a valve that is part of a system that is designed to limit and shut down the flow of propane in the event that a vehicle moves away from a transfer point with the transfer hose or swivel-type piping connected to it."
  },
  {
    "clause": "3.179",
    "title": "Excess-flow valve",
    "description": "a valve designed to close when the liquid or vapour passing through it exceeds a prescribed flow rate as determined by a pressure drop across the valve."
  },
  {
    "clause": "3.180",
    "title": "Fast-closing valve",
    "description": "an automatic valve that has a closing time of less than 5 s upon being de-energized."
  },
  {
    "clause": "3.181",
    "title": "Hydrostatic relief valve",
    "description": "a pressure relief valve installed in a liquid propane line."
  },
  {
    "clause": "3.182",
    "title": "Internal excess-flow valve",
    "description": "an excess-flow valve that remains functional within the tank when any portion of the valve external to the tank's perimeter is sheared off or otherwise damaged. An internal excess-flow valve can be integral to another valve."
  },
  {
    "clause": "3.183",
    "title": "Internal relief valve",
    "description": "an overpressure relief device that is built into the body of the diaphragm assembly of a pressure regulator."
  },
  {
    "clause": "3.184",
    "title": "Internal valve",
    "description": "a valve designed and installed so that its seat is within a tank and the arrangement of the parts of the valve are such that damage to the parts outside the tank will not prevent effective seating of the valve."
  },
  {
    "clause": "3.185",
    "title": "Line relief valve",
    "description": "an overpressure relief device installed in the piping or tubing system downstream of a pressure regulator."
  },
  {
    "clause": "3.186",
    "title": "Lubricated-plug-type valve",
    "description": "a manually operated valve of the plug and barrel type that is provided with means for maintaining a lubricant between its bearing surfaces; so designed that the lapped bearing surfaces can be lubricated and the lubricant level maintained without removing the valve from service; so constructed that the lubricant can be stored in a reservoir that enables the lubricant to be distributed evenly over the entire lapped bearing surfaces of the valve when the plug is rotated; and equipped with built-in stops to limit the rotation of the plug to one quarter turn when fully opening or fully closing the valve."
  },
  {
    "clause": "3.187",
    "title": "Manual shut-off valve",
    "description": "a manually operated valve in a gas piping system or a valve train for shutting off the fuel for maintenance, testing, and safety purposes."
  },
  {
    "clause": "3.188",
    "title": "Safety shut-off valve",
    "description": "a valve that automatically shuts off the supply of gas when de-energized by a combustion safety control, safety limit control, or loss of actuating medium."
  },
  {
    "clause": "3.189",
    "title": "Stop-fill valve",
    "description": "a device in a container that is intended to automatically shut off the flow of liquid into the container when a predetermined fixed level is achieved."
  },
  {
    "clause": "3.190",
    "title": "Valve train",
    "description": "all gas-confining valves, controls, piping, fittings, hoses, and tubing of an appliance downstream of the manual shut-off valve to the inlet of the burner."
  },
  {
    "clause": "3.191",
    "title": "Vapourizer",
    "description": "an appliance for converting liquid propane to vapour by means other than atmospheric heat transfer through the surface of the container."
  },
  {
    "clause": "3.192",
    "title": "Direct-fired vapourizer",
    "description": "a vapourizer in which heat furnished by a flame is directly applied to a heat-exchange surface in contact with the liquid propane to be vapourized."
  },
  {
    "clause": "3.193",
    "title": "Indirect vapourizer",
    "description": "a vapourizer in which heat furnished by steam, hot water, or another heating medium is applied to a vapourizing chamber's tubing, pipe coils, or other heat-exchange surface containing the liquid propane to be vapourized. The heating of the medium being used occurs at a point remote from the vapourizer."
  },
  {
    "clause": "3.194",
    "title": "Vehicle fuelling appliance (VFA)",
    "description": "an appliance that compresses natural gas for vehicles and dispenses directly into onboard vehicle storage or delivers to external natural gas storage systems."
  },
  {
    "clause": "3.195",
    "title": "Vent",
    "description": "that portion of a venting system designed to convey flue gases directly to the outdoors from either a vent connector or an appliance when a vent connector is not used."
  },
  {
    "clause": "3.196",
    "title": "Type B vent",
    "description": "a vent complying with CAN/ULC-S605 consisting entirely of factory-made parts, each designed to be assembled with the others without requiring field fabrication, and intended for venting gas appliances."
  },
  {
    "clause": "3.197",
    "title": "Type BH vent",
    "description": "a vent complying with ULC S636 consisting entirely of factory-made parts, each designed to be assembled with the others without requiring field fabrication, and intended for venting gas appliances."
  },
  {
    "clause": "3.198",
    "title": "Type BW vent",
    "description": "a vent complying with CAN/ULC-S605 consisting entirely of factory-made parts, each designed to be assembled with the others without requiring field fabrication, and intended for venting only wall furnaces for use with this type of vent."
  },
  {
    "clause": "3.199",
    "title": "Type L vent",
    "description": "a vent complying with CAN/ULC-S609 consisting of factory-made parts, each designed to be assembled with the others without requiring field fabrication."
  },
  {
    "clause": "3.200",
    "title": "Vent connector",
    "description": "that part of a venting system that conducts the flue gases from the flue collar of an appliance to a chimney or vent, and that may include a draft-control device."
  },
  {
    "clause": "3.201",
    "title": "Vent limiter",
    "description": "a means that limits the flow of gas from a pressure regulator's atmospheric diaphragm chamber to the atmosphere in the event of a diaphragm rupture. This may be either a limiting orifice or a limiting device."
  },
  {
    "clause": "3.202",
    "title": "Limiting orifice type",
    "description": "a vent limiter where the flow through the limiter is the same in both directions."
  },
  {
    "clause": "3.203",
    "title": "Ventilated space",
    "description": "a space where there is an air change by means of natural ventilation or mechanical means, or where the space communicates with the rest of the structure by means of permanent openings."
  },
  {
    "clause": "3.204",
    "title": "Ventilation (with respect to the space in which an appliance is installed)",
    "description": "the removal of inside air, leaked or spilled products of combustion, or flue gases from the space in which an appliance is installed to outside the space, and the replacement of same by air from outside the space."
  },
  {
    "clause": "3.205",
    "title": "Venting system",
    "description": "a system for the removal of flue gases to the outdoors by means of a chimney, vent connector, vent, or a natural or mechanical exhaust system."
  },
  {
    "clause": "3.206",
    "title": "Special venting system",
    "description": "a venting system certified with the appliance and either supplied or specified by the appliance manufacturer."
  },
  {
    "clause": "3.207",
    "title": "Wash-mobile",
    "description": "a mobile outdoor unit that uses propane-heated water, or a solution, for the purpose of cleaning."
  },
  {
    "clause": "3.208",
    "title": "Zero governor",
    "description": "a regulating device that is adjusted to deliver gas at atmospheric pressure within its flow rating."
  },
  {
    "clause": "4.1",
    "title": "Application",
    "description": "General application requirements for the gas code."
  },
  {
    "clause": "4.1.1",
    "title": "Requirements",
    "description": "For the purpose of this Code, the requirements contained in CAN/CGSB-3.14 for propane or CAN/CGSB-3.13 for butane shall apply."
  },
  {
    "clause": "4.1.2",
    "title": "Code conflicts",
    "description": "When a specification or document referenced in Clause 1 contains a requirement that conflicts with a requirement in this Code, the requirement in this Code shall govern."
  },
  {
    "clause": "4.1.3",
    "title": "Installation instructions",
    "description": "Except as required by Clause 4.1.4 an appliance, accessory, component, equipment, or any other item shall be installed in accordance with the manufacturer's certified instructions and this Code."
  },
  {
    "clause": "4.1.4",
    "title": "Field-approved appliance installation",
    "description": "A field-approved appliance or equipment shall be installed in accordance with the Clause 10.1 of CSA B149.3 and this Code."
  },
  {
    "clause": "4.1.5",
    "title": "Conflicts",
    "description": "Where a conflict exists between the manufacturer's instructions and this Code, the requirements of this Code shall prevail unless otherwise approved."
  },
  {
    "clause": "4.2",
    "title": "Approval of appliances, accessories, components, equipment, and material",
    "description": "Requirements for approval of equipment and materials used in gas installations."
  },
  {
    "clause": "4.2.1",
    "title": "Installation",
    "description": "An appliance, accessory, component, equipment, or material used in an installation shall be of a type and rating approved for the specific purpose for which it is employed."
  },
  {
    "clause": "4.2.2",
    "title": "Deviation",
    "description": "When deviation from or postponement of these requirements is necessary, permission in writing shall be obtained from the authority having jurisdiction before the work proceeds, and this permission shall apply only to the particular installation for which it is given."
  },
  {
    "clause": "4.2.3",
    "title": "Assembly or construction approval",
    "description": "The approval of the assembly or construction of an appliance is subject to the authority having jurisdiction. (CSA B149.3 contains provisions for the assembly and construction of appliances.)"
  },
  {
    "clause": "4.2.4",
    "title": "Biogas",
    "description": "When using biogas, this Code shall be used in conjunction with CSA/ANSI B149.6."
  },
  {
    "clause": "4.3",
    "title": "Responsibilities of the installer",
    "description": "Duties and responsibilities of gas equipment installers."
  },
  {
    "clause": "4.3.1",
    "title": "Initial installation",
    "description": "Before leaving installations, installers shall ensure that the appliance, accessory, component, equipment, or piping and tubing they installed complies with the Code requirements, and the person initially activating the appliance shall ensure that the appliance is in safe working order."
  },
  {
    "clause": "4.3.2",
    "title": "User instructions",
    "description": "Installers shall instruct the user in the safe and correct operation of all appliances or equipment that they install."
  },
  {
    "clause": "4.3.3",
    "title": "Manufacturer instructions",
    "description": "The installer shall ensure that the manufacturer's instructions supplied with the appliance are left with the user."
  },
  {
    "clause": "4.3.4",
    "title": "Replacement parts",
    "description": "Before installing any replacement part of an appliance, the installer shall ensure that the replacement part provides operational characteristics at least equivalent to those of the original part."
  },
  {
    "clause": "4.3.5",
    "title": "Appliance conversion",
    "description": "When the installation or conversion of an appliance constitutes a conversion from another form of energy, the installer shall advise the user of the appliance, at the time of installation or conversion, to have the former form of energy either removed or left safe and secure from accidental activation."
  },
  {
    "clause": "4.3.6",
    "title": "User procedures",
    "description": "The installer installing the installation or conversion, as specified in Clause 4.3.5, shall advise the user of the appliance in writing of the procedures to be followed in discontinuing the supply of the former form of energy."
  },
  {
    "clause": "4.3.7",
    "title": "Piping pressure test",
    "description": "It shall be the responsibility of the installer of a gas piping system to perform pressure tests in accordance with Clause 6.22.2 and to ensure that the piping or tubing system is gas-tight at the completion of the tests."
  },
  {
    "clause": "4.3.8",
    "title": "Gas tight test",
    "description": "It shall be the responsibility of the installer of an appliance to perform tests in accordance with Clause 6.22.3 and to ensure that the system is gas-tight at the completion of the tests."
  },
  {
    "clause": "4.4",
    "title": "Training and quality of labour",
    "description": "Requirements for worker training and work quality standards."
  },
  {
    "clause": "4.4.1",
    "title": "Work quality",
    "description": "All work shall be done in a skillful, thorough manner. Careful attention shall be paid not only to the mechanical execution of the work but also to the arrangement of the installation."
  },
  {
    "clause": "4.4.2",
    "title": "Training",
    "description": "Personnel performing installation, operation, and maintenance work shall be properly trained in such functions."
  },
  {
    "clause": "4.5",
    "title": "Suitability of use",
    "description": "Requirements for proper application and use of gas equipment."
  },
  {
    "clause": "4.5.1",
    "title": "Type of gas and pressure",
    "description": "An appliance shall not be installed unless it is designed for use with the type of gas to which it is to be connected and is suitable for the pressure supplied."
  },
  {
    "clause": "4.5.2",
    "title": "Hazards",
    "description": "The use of an appliance, accessory, component, equipment, or material shall be prohibited where a hazard is created."
  },
  {
    "clause": "4.5.3",
    "title": "Appliance conversion",
    "description": "When an appliance is converted from the gas or fuel specified on the rating plate, the conversion shall be in accordance with the manufacturer's certified instructions. If there are no manufacturer's instructions for conversion of the appliance, the converted appliance shall be approved."
  },
  {
    "clause": "4.5.4",
    "title": "Rating plate conversion",
    "description": "If an appliance is converted from one gas to another, the gas to which it is converted shall be marked on the appliance rating plate by the fitter making the conversion. For hydrogen-natural gas blends, the maximum percentage of hydrogen shall be marked."
  },
  {
    "clause": "4.5.5",
    "title": "Damaged appliances and piping",
    "description": "Appliances, accessories, components, equipment, and gas piping systems that have been exposed to fire, explosion, flood, or other damage shall not be offered for sale, installed, reactivated, or reconnected to the supply until the appliance, accessory, component, equipment, gas piping system has been inspected by a person acceptable to the authority having jurisdiction."
  },
  {
    "clause": "4.5.6",
    "title": "Used appliances",
    "description": "A used appliance shall be inspected and determined to be safe for continued use by the installer before reconnection to the gas piping system."
  },
  {
    "clause": "4.6",
    "title": "Meter and service regulator installations",
    "description": "Requirements for meter and service regulator installations."
  },
  {
    "clause": "4.6.1",
    "title": "Installations",
    "description": "Meter and service regulator installations shall be in accordance with CSA Z662."
  },
  {
    "clause": "4.6.2",
    "title": "Supplier distributor systems",
    "description": "No person other than an employee or person authorized by the supplier or distributor shall perform any alterations, repairs, tests, services, removals, changes, installations, connections, or any other type of work on the supplier's or distributor's system."
  },
  {
    "clause": "4.7",
    "title": "Electrical connections and components",
    "description": "Requirements for electrical connections in gas appliance installations."
  },
  {
    "clause": "4.7.1",
    "title": "Code requirements",
    "description": "Electrical connections between an appliance and building wiring shall comply with the local electrical code or, in the absence of such, with the Canadian Electrical Code, Part I."
  },
  {
    "clause": "4.7.2",
    "title": "Electrical circuit",
    "description": "An electrical circuit employed for operating an automatic main control valve, automatic pilot, room-temperature thermostat, safety limit control, or another electrical device used with an appliance shall be in accordance with the appliance wiring diagram."
  },
  {
    "clause": "4.7.3",
    "title": "Equipotential bonding",
    "description": "All building metal gas piping systems connected to one or more gas-fired appliances, shall be made electrically continuous and shall be equipotentially bonded as specified."
  },
  {
    "clause": "4.7.4",
    "title": "Bonding through appliance",
    "description": "Gas piping systems shall be considered to be bonded to the electrical system when the metal gas piping system or CSST certified with an arc-resistant jacket or coating system in compliance with CSA/ANSI LC 1/CSA 6.26 used in a gas piping system is connected to one or more appliances permanently connected to the bonding conductor of the circuit supplying the appliance."
  },
  {
    "clause": "4.7.5",
    "title": "Bonding non arc-resistance CSST",
    "description": "In addition to the requirements of Clause 4.7.3, CSST that does not have an arc-resistant jacket or coating system in compliance with CSA/ANSI LC 1/CSA 6.26 used in a gas piping system shall be bonded according to the CSST manufacturer's installation instructions."
  },
  {
    "clause": "4.8",
    "title": "Mobile homes and recreational vehicles",
    "description": "Special requirements for gas installations in mobile homes and recreational vehicles."
  },
  {
    "clause": "4.8.1",
    "title": "Appliance installation",
    "description": "The installation of gas-burning appliances and the gas piping system in mobile homes shall be in accordance with CSA Z240.4.1. In a recreational vehicle, it shall comply with the requirements of CSA Z240.4.2."
  },
  {
    "clause": "4.8.2",
    "title": "Placement",
    "description": "When a vehicle ceases to be used as a mobile home or recreational vehicle and is placed at a location in a permanent fixed manner, the system shall comply with all applicable requirements of this Code."
  },
  {
    "clause": "4.8.3",
    "title": "Appliance application",
    "description": "An appliance in the application described in Clause 4.8.2 shall not be required to be certified specifically for use within a mobile home."
  },
  {
    "clause": "4.9",
    "title": "Hazardous and corrosive locations",
    "description": "Restrictions on appliance installation in hazardous or corrosive environments."
  },
  {
    "clause": "4.9.1",
    "title": "Installation",
    "description": "An appliance shall not be installed in a location that has an environment corrosive to an appliance or venting system."
  },
  {
    "clause": "4.9.2",
    "title": "Approved installation",
    "description": "An appliance, unless certified or approved for installation in a hazardous location, shall not be installed in any location where a flammable vapour, combustible dust or fibres, or an explosive mixture is present."
  },
  {
    "clause": "4.10",
    "title": "Smoking",
    "description": "Smoking or providing any other source of ignition shall not be permitted in the area where work is being done on piping, tubing, or equipment that either contains or has contained gas, unless the gas piping system or equipment has been purged of all gas as outlined in Clause 6.23."
  },
  {
    "clause": "4.11",
    "title": "Isolation of safety devices",
    "description": "Isolating or rendering inoperative a safety shut-off valve, safety limit control, or relief valve shall be prohibited."
  },
  {
    "clause": "4.12",
    "title": "Leak detection",
    "description": "Safety requirements for detecting gas leaks."
  },
  {
    "clause": "4.12.1",
    "title": "Sources of ignition",
    "description": "A match, candle, flame, or other source of ignition shall not be used to check for a gas leak."
  },
  {
    "clause": "4.12.2",
    "title": "Light and/or flashlight use",
    "description": "A light, including a flashlight, used in connection with a search for gas leakage shall be of the Class I, Group IIA type."
  },
  {
    "clause": "4.12.3",
    "title": "Electric switches",
    "description": "An electric switch either in or adjacent to an area of gas leakage shall not be operated unless it is a Class I, Group IIA type."
  },
  {
    "clause": "4.13",
    "title": "Appliance clearances to combustible material",
    "description": "Requirements for maintaining safe clearances between appliances and combustible materials."
  },
  {
    "clause": "4.13.1",
    "title": "Clearances",
    "description": "The clearances required in Clause 7 between an appliance and combustible material shall be considered the minimum without protection and shall be measured from the appliance, disregarding either the burner or any other projecting component."
  },
  {
    "clause": "4.13.2",
    "title": "Clearance reduction",
    "description": "The clearances to combustible material specified in Clause 7 shall not be reduced unless such reduced clearance is certified as safe by a nationally recognized certification organization acceptable to the authority having jurisdiction and so marked on the appliance nameplate; or protection is provided for the combustible material, and such protection and such reduced clearance are in accordance with Table 4.1."
  },
  {
    "clause": "4.13.3",
    "title": "Combustible floor material",
    "description": "An appliance with an input up to and including 400,000 Btu/h (120 kW) and certified for installation on noncombustible flooring may be installed on a floor constructed of combustible material, provided that the floor is protected with at least two continuous courses of 4 in (100 mm) thick hollow masonry units covered with sheet metal at least 0.0195 in (0.56 mm) thick; the masonry units are arranged so that the hollow cores will permit air circulation through them; and the base as specified extends not less than 6 in (150 mm) beyond the sides of the appliance."
  },
  {
    "clause": "4.13.4",
    "title": "Aircraft storage installations",
    "description": "A heater located in an aircraft storage or servicing area shall be installed so that no portion of an aircraft that can occupy the area is within the clearance to combustible material, as marked on the appliance rating plate. Clearances specified in Table 4.1 shall not apply."
  },
  {
    "clause": "4.14",
    "title": "Accessibility",
    "description": "Requirements for ensuring appliances are accessible for servicing and maintenance."
  },
  {
    "clause": "4.14.1",
    "title": "Installation",
    "description": "An appliance shall be installed so that it is accessible for servicing."
  },
  {
    "clause": "4.14.2",
    "title": "Service clearances",
    "description": "An appliance shall be installed with a minimum service clearance of 24 in (610 mm) to any side, top, or bottom where service could be necessary, except where a greater distance is indicated on the appliance rating plate; or the distance is not sufficient for the removal, replacement, or repair of a component, an accessory, or any equipment either forming an integral part of the appliance or connected to the appliance."
  },
  {
    "clause": "4.14.3",
    "title": "Access dimensions",
    "description": "An access opening with minimum dimensions of 24 x 30 in (610 x 760 mm) shall be provided to the space in which an appliance is located."
  },
  {
    "clause": "4.14.4",
    "title": "Appliance passageways",
    "description": "A clear and unobstructed passageway at least 36 in (900 mm) high and 36 in (900 mm) wide shall be provided to each appliance."
  },
  {
    "clause": "4.14.5",
    "title": "Roof access",
    "description": "An appliance shall not be installed on a roof exceeding 13 ft (4 m) in height from grade to roof elevation unless fixed access to the roof is provided; and exceeding 26 ft (8 m) in height from grade to roof elevation unless permanent fixed access to the roof by means of either a stairway or a stairway leading to a ladder not exceeding 13 ft (4 m) in height is provided."
  },
  {
    "clause": "4.14.6",
    "title": "Roof installation clearances",
    "description": "When an appliance is installed on a roof, specific requirements for drainage, walkways, clearances, and enclosures must be met as detailed in the clause."
  },
  {
    "clause": "4.14.7",
    "title": "Means of service",
    "description": "An appliance installed at a distance of 10 ft (3 m) or more from either the floor or finished grade level, as measured from the lowest point of the appliance, shall be provided with either a permanent accessible service platform that permits access to all parts of the appliance requiring service; or other approved means of service access."
  },
  {
    "clause": "4.15",
    "title": "Outdoor installations",
    "description": "Special requirements for appliances installed outdoors."
  },
  {
    "clause": "4.15.1",
    "title": "Appliance approval",
    "description": "An appliance installed outdoors shall be approved for outdoor use."
  },
  {
    "clause": "4.15.2",
    "title": "Flue gases",
    "description": "An appliance installed outdoors shall be located to prevent circulation of flue gases into the combustion air inlet or circulating airstream of an adjacent appliance."
  },
  {
    "clause": "4.15.3",
    "title": "Space heater or pool heater installation",
    "description": "A space-heating or pool-heating appliance installed outdoors at grade level shall be placed on a base consisting of poured-in-place concrete or a reinforced concrete slab of the preformed type, extending at least 6 in (150 mm) beyond all sides of the appliance; and 2 in (50 mm) above grade level. The ground shall first be prepared and provided with gravel for drainage."
  },
  {
    "clause": "4.16",
    "title": "Appliances in garages",
    "description": "Special requirements for gas appliances installed in garages."
  },
  {
    "clause": "4.16.1",
    "title": "Protection",
    "description": "An appliance in a garage shall be protected against damage."
  },
  {
    "clause": "4.16.2",
    "title": "Flammable vapours",
    "description": "In a storage garage, except for an appliance certified as flammable vapours ignition resistant (FVIR), an appliance shall be installed so that a component capable of igniting a flammable vapour is located not less than 18 in (450 mm) above the floor."
  },
  {
    "clause": "4.16.3",
    "title": "Flammable vapour clearance",
    "description": "In a repair garage, an appliance shall be installed so that a component capable of igniting a flammable vapour is located not less than 4.5 ft (1400 mm) above the floor."
  },
  {
    "clause": "4.16.4",
    "title": "Building Code requirements",
    "description": "The installation of a forced-air appliance in a garage shall be in accordance with local building codes or, in the absence of local codes, the National Building Code of Canada."
  },
  {
    "clause": "4.17",
    "title": "Appliance ductwork connections",
    "description": "Requirements for connecting ductwork to gas appliances."
  },
  {
    "clause": "4.17.1",
    "title": "Approved use",
    "description": "Ductwork shall not be connected to an appliance unless the appliance is approved for use with ductwork."
  },
  {
    "clause": "4.17.2",
    "title": "Return air ducts",
    "description": "Return air ducts installed in an enclosure shall be in accordance with the provisions set out for duct systems in the National Building Code of Canada."
  },
  {
    "clause": "4.18",
    "title": "Combined heating systems",
    "description": "Requirements for systems that combine gas and solid fuel heating."
  },
  {
    "clause": "4.18.1",
    "title": "Solid fuel heated air",
    "description": "Air heated by a solid-fuel-fired appliance or fireplace shall not be introduced into any part of the ductwork system of a gas-fired appliance, except where either a certified combination gas and solid-fuel-fired appliance is installed; or a certified solid-fuel-fired furnace downstream series add-on to a gas-fired furnace is installed."
  },
  {
    "clause": "4.18.2",
    "title": "Building code requirements",
    "description": "The installation of a solid-fuel-fired portion of the appliance referred to in Clause 4.18.1 a) and the installation of a solid-fuel-fired downstream series add-on furnace referred to in Clause 4.18.1 b) shall conform to the applicable provincial or territorial building code or, in its absence, to CAN/CSA-B365."
  },
  {
    "clause": "4.19",
    "title": "Appliances protected by automatic fire-extinguishing systems",
    "description": "Requirements for appliances protected by automatic fire suppression systems."
  },
  {
    "clause": "4.19.1",
    "title": "Interlock system",
    "description": "When an exhaust system protected by an automatic fire-extinguishing system is installed over an appliance not provided with a flame safeguard, the operation of the fire-extinguishing system shall be interlocked with the gas supply to the appliance so as to automatically shut off the gas, including the pilot, to the appliance to be protected by the system and also to any other appliance that can be affected by the extinguishing system."
  },
  {
    "clause": "4.19.2",
    "title": "Interlock valve",
    "description": "The valve used to shut off the gas supply referred to in Clause 4.19.1 shall be located outside the protected area, be identified as to its function, and have permanent legible relighting instructions posted adjacent to it. The valve shall be either an approved mechanical non-electric fast-closing valve of the manual-reset type; or an automatic electrically operated fast-closing valve of the manual-reset type; or provided with a remote manual-reset function to open."
  },
  {
    "clause": "4.19.3",
    "title": "Manual shutoff valve",
    "description": "A manual shut-off valve shall be installed immediately upstream of the valve referred to in Clause 4.19.2."
  },
  {
    "clause": "4.20",
    "title": "Control of appliances with self-energizing pilots",
    "description": "When two or more appliances with self-energizing pilots are installed, each shall be independently controlled by a separate actuating device such as a thermostat."
  },
  {
    "clause": "4.21",
    "title": "Defective heat exchangers",
    "description": "Requirements for handling defective heat exchangers in gas appliances."
  },
  {
    "clause": "4.21.1",
    "title": "Replacement",
    "description": "Where the heat exchanger of a furnace installed in a dwelling unit is found to be defective, it shall be replaced."
  },
  {
    "clause": "4.21.2",
    "title": "Temporary repair",
    "description": "The heat exchanger referred to in Clause 4.21.1 may be temporarily repaired if necessary, and the repair shall be in accordance with procedures acceptable to the authority having jurisdiction."
  },
  {
    "clause": "4.21.3",
    "title": "Commercial or industrial repair",
    "description": "Where the heat exchanger of a commercial or industrial appliance is found to be defective, it may be repaired, and the repair shall be in accordance with procedures acceptable to the authority having jurisdiction."
  },
  {
    "clause": "4.22",
    "title": "High-altitude installations",
    "description": "Special requirements for gas appliances installed at high altitudes."
  },
  {
    "clause": "4.22.1",
    "title": "Certification and adjustment",
    "description": "For high-altitude installations, appliances shall be certified in compliance with CSA Z17 and shall be adjusted to the high-altitude rating shown on the nameplate following the manufacturer's instructions when installed at elevations between 2000 and 4500 ft (600 and 1350 m) above sea level."
  },
  {
    "clause": "4.22.2",
    "title": "Elevation input rating",
    "description": "When an appliance is installed at elevations above the maximum elevation option provided by the manufacturer, the input rate shall be reduced following the manufacturer's certified instructions. If no instructions are given for configuring the appliance for higher altitudes, the input rate shall be reduced at the rate of 4% for each additional 1000 ft (300 m)."
  },
  {
    "clause": "4.23",
    "title": "Protection of appliances from physical damage",
    "description": "Where an appliance is installed in an area where physical damage can be incurred, the appliance shall be protected from such damage."
  },
  {
    "clause": "4.24",
    "title": "Odourization",
    "description": "Requirements for adding odorants to gas supplies for safety detection."
  },
  {
    "clause": "4.24.1",
    "title": "Natural gas odourization",
    "description": "Natural gas or hydrogen-natural gas blends used for fuel purposes supplying an occupied building shall be odourized in accordance with CSA Z662 or be otherwise readily detectable, or the building shall be equipped with an approved means of gas detection."
  },
  {
    "clause": "4.24.2",
    "title": "Propane odourization",
    "description": "Propane distributed for fuel purposes shall be odourized in accordance with CAN/CGSB-3.14."
  },
  {
    "clause": "4.24.3",
    "title": "Propane odourization responsibility",
    "description": "Odourization of the propane shall be the responsibility of the producer or processor, who shall indicate on the shipping document its compliance with CAN/CGSB-3.14 as referenced in Clause 4.24.2 of this Code."
  },
  {
    "clause": "4.25",
    "title": "Mobile homes and recreational vehicles",
    "description": "Additional specific requirements for mobile homes and recreational vehicles beyond those in Clause 4.8."
  },
  {
    "clause": "4.25.1",
    "title": "Appliance type and separation",
    "description": "Every heating appliance, water heater, or refrigerator installed in a mobile home or a vehicle, other than a canvas-top tent trailer, shall be of the direct-vent appliance type or equivalent, and shall be installed to provide complete separation of the combustion system from the atmosphere of the space provided for living."
  },
  {
    "clause": "4.25.2",
    "title": "Air inlet or flue gas outlet clearances",
    "description": "A combustion air inlet or flue gas outlet of an appliance or any other vehicle opening shall be located at least 3 ft (0.9 m) from any container filler spout or fixed-liquid-level gauge of a vehicle if the intake, outlet, or opening is located above or at the same level. If any portion of such inlet, outlet, or opening is located below the spout or fixed-liquid-level gauge, the clearance shall be the sum of the vertical distance below the spout or fixed-liquid-level gauge plus 3 ft (0.9 m)."
  },
  {
    "clause": "4.25.3",
    "title": "Propane vapour supply pressure",
    "description": "Propane vapour, at a pressure not in excess of 13 in w.c. (3.2 kPa), shall be supplied into the piping or tubing supplying any appliance."
  },
  {
    "clause": "4.25.4",
    "title": "Appliance certification",
    "description": "An appliance installed in a propane-equipped mobile home or recreational vehicle shall be certified for use with propane."
  },
  {
    "clause": "4.25.5",
    "title": "Combustion air",
    "description": "Provision shall be made to ensure a supply of combustion air for an appliance, other than an appliance of the direct-vent type, as described in Clause 8."
  },
  {
    "clause": "4.25.6",
    "title": "Alternate means of combustion or ventilation air",
    "description": "An open door may be used as an alternative means of providing combustion or ventilation air to a wash-mobile or food service vehicle, provided that the door is interlocked to the propane supply to ensure that the door remains open during appliance operation."
  },
  {
    "clause": "4.25.7",
    "title": "Cargo heater",
    "description": "A cargo heater shall be installed in a readily accessible location."
  },
  {
    "clause": "4.25.8",
    "title": "Cargo heater installation",
    "description": "A cargo heater shall be protected to prevent damage or impaired operation resulting from the shifting or handling of cargo."
  },
  {
    "clause": "4.25.9",
    "title": "Propane warning labels",
    "description": "A durable label in both English and French made of a material that is not adversely affected by water, employing an adhesive that is not water soluble, and measuring not less than 4.5 x 5.75 in (100 x 125 mm) shall be provided. This label shall be located on the vehicle, adjacent to the propane container and shall contain specific warnings about propane system use, safety procedures, and operational requirements as detailed in the clause."
  },
  {
    "clause": "4.25.10",
    "title": "Appliance warning labels",
    "description": "On all vehicles equipped with appliances, a durable label, made of material not adversely affected by water and employing an adhesive that is not water soluble, shall be provided in both English and French. This label shall be attached adjacent to any fuel-filling locations (gasoline, diesel, or NGV) and propane cylinders. The label warns that engine ignition and all appliance pilot lights shall be turned off before and during refuelling of motor fuel tanks or any mounted propane container."
  },
  {
    "clause": "5.1",
    "title": "Delivery pressure",
    "description": "Requirements for gas delivery pressures in piping systems."
  },
  {
    "clause": "5.1.1",
    "title": "Gas piping system pressures",
    "description": "Subject to Clause 5.1.2, the gas pressure in a gas piping system, extending from the termination of the utility/distributor's installation inside a building, shall not be higher than that shown in Table 5.1 in normal operation."
  },
  {
    "clause": "5.1.2",
    "title": "Piping to central boilers or mechanical rooms",
    "description": "Piping to central boiler or mechanical rooms at gas pressures that are greater than allowed for other building locations shall not pass anywhere inside the building other than the central boiler or mechanical room."
  },
  {
    "clause": "5.1.3",
    "title": "Gas piping system design",
    "description": "A gas piping system shall be designed so that the gas pressure shall not exceed the rated pressure of any accessory, equipment, or appliance, under normal operation and in the event of a failure of an upstream pressure regulator."
  },
  {
    "clause": "5.1.4",
    "title": "Delivery pressure and overpressure protection set-points",
    "description": "The delivery pressure and overpressure protection set-points, as supplied by the gas utility or fuel distributor, shall be considered in the design and installation of a gas piping system, including any modifications to an existing gas piping system."
  },
  {
    "clause": "5.1.5",
    "title": "Residential applications",
    "description": "In a residential application using propane, propane vapour pressure in a gas piping system between the first-stage pressure regulator and second-stage propane regulator shall not be higher than 10 psig (70 kPa). In other applications using propane, means shall be provided to prevent liquefaction of propane."
  },
  {
    "clause": "5.1.6",
    "title": "Piping propane in the liquid phase",
    "description": "Propane shall not be piped into or within any building in the liquid phase, except when the building is used exclusively to house appliances or equipment for vapourization (including grain dryers), pressure reduction, propane/air mixing, or distribution; the building is a container-filling building; the fire-separated portion of the building is used exclusively for housing an internal combustion engine or industrial process; or the fire-separated portion of the building is occupied exclusively by research and experimental laboratories."
  },
  {
    "clause": "5.1.7",
    "title": "Line pressure regulator location",
    "description": "For applications using propane, a second stage propane regulator installed within a one- or two-family dwelling or row housing shall not be located more than 3 ft (0.9 m) from the point where the propane supply enters the dwelling."
  },
  {
    "clause": "5.2",
    "title": "Pressure regulators",
    "description": "General requirements for pressure regulators in gas systems."
  },
  {
    "clause": "5.2.1",
    "title": "General",
    "description": "General requirements for pressure regulator installation and operation."
  },
  {
    "clause": "5.2.1.1",
    "title": "Gas supply pressures",
    "description": "Gas shall be supplied to an appliance, equipment, or accessory at a normal operating pressure that is within the pressure range specified on the appliance's, equipment's, or accessory's rating plate, or as indicated by the manufacturer's instructions."
  },
  {
    "clause": "5.2.1.2",
    "title": "Pressure regulators and overprotection devices",
    "description": "To meet Clause 5.2.1.1, when the delivery pressure is greater than the maximum rated pressure of the downstream valve train, appliance, or equipment, one or more or a combination of the following shall be installed: a line pressure regulator; or an industrial pressure regulator."
  },
  {
    "clause": "5.2.1.3",
    "title": "Pressure regulator features",
    "description": "Every pressure regulator shall be suitable for the gas; of sufficient size to provide the required flow of gas; factory set or field-adjusted to provide, under normal operating conditions, an outlet pressure required for the gas piping system at the extremes of inlet pressures to which the regulator can be exposed; capable of supplying the gas pressure as required by Clause 5.2.1.1; installed in accordance with the manufacturer's instructions and ratings; and be constructed so that the outlet pressure does not exceed 150% of the normal outlet operating pressure under no flow conditions when the downstream appliance or equipment is shut down."
  },
  {
    "clause": "5.2.1.4",
    "title": "Minimum clearances",
    "description": "The minimum clearance specified in Clauses 7.4.4 and 7.5.2 between a pressure regulator and the moisture-exhaust duct shall be maintained."
  },
  {
    "clause": "5.2.1.5",
    "title": "Bypassing pressure regulators",
    "description": "A pressure regulator shall not be bypassed, and a safety limit or a safety relief device shall not be isolated, bypassed, or in any way made ineffective by a valve or other device."
  },
  {
    "clause": "5.2.1.6",
    "title": "Lock-up type pressure regulators",
    "description": "A pressure regulator shall be of the lock-up (positive shut-off) type."
  },
  {
    "clause": "5.2.1.7",
    "title": "Manual shut-off valves and overpressure protection devices",
    "description": "A pressure regulator shall have a manual shut-off valve installed upstream of the pressure regulator; and an overpressure protection device in accordance with Clause 5.3."
  },
  {
    "clause": "5.2.1.8",
    "title": "Pressure regulators",
    "description": "A pressure regulator provided in a gas supply line shall not be installed where it is inaccessible for repair, replacement, servicing, or inspection; in a concealed location; or where it could be reasonably expected to be subject to physical or chemical damage."
  },
  {
    "clause": "5.2.1.9",
    "title": "Outdoor installations and unheated areas",
    "description": "A pressure regulator installed outdoors or in an unheated area shall be positioned so that the bonnet vent opening discharges vertically downward, except that when installed within a container dome, the vent opening shall be positioned downward not less than 15° from the horizontal; and a single-stage pressure regulator of a capacity not exceeding 150,000 Btu/h (45 kW) may be installed in a horizontal position, provided that it is protected from inclement weather."
  },
  {
    "clause": "5.2.1.10",
    "title": "Pressure regulators installed on vehicles",
    "description": "A pressure regulator shall be installed on a vehicle in such a manner that its safe operation will not be impeded by weather conditions, and it shall be protected by a substantial metal or plastic hood of the enclosed style."
  },
  {
    "clause": "5.2.1.11",
    "title": "Mounting cylinders on A-frames",
    "description": "When provision is made for mounting a cylinder on the A-frame of a vehicle, a rigidly mounted support bracket for mounting the pressure regulator shall be provided. The pressure regulator shall be protected in accordance with Clause 5.2.1.10."
  },
  {
    "clause": "5.2.2",
    "title": "Additional requirements for line pressure regulators",
    "description": "Specific requirements for line pressure regulators."
  },
  {
    "clause": "5.2.2.1",
    "title": "Line pressure regulator",
    "description": "A line pressure regulator, where installed shall be certified to either CSA/ANSI 221.80/CSA 6.22; or UL 144."
  },
  {
    "clause": "5.2.2.2",
    "title": "Two-stage regulation",
    "description": "Not less than two-stage regulation shall be utilized on all permanent propane installations."
  },
  {
    "clause": "5.2.3",
    "title": "Additional requirements for industrial pressure regulators",
    "description": "Specific requirements for industrial pressure regulators."
  },
  {
    "clause": "5.2.3.1",
    "title": "Industrial pressure regulator",
    "description": "An industrial pressure regulator, where installed, shall directly serve any of the following in the downstream gas piping system: a line pressure regulator that complies with Clause 5.2.2 and mounted upstream of the appliance, equipment, or valve train; another industrial pressure regulator; or a high and a low gas pressure device installed on the valve train of the appliance or in the downstream piping system upstream of the valve train of the appliance."
  },
  {
    "clause": "5.2.3.2",
    "title": "High and low gas pressure devices",
    "description": "Where high and low gas pressure devices are required in Clause 5.2.3.1, they shall be interlocked into the downstream appliance(s) to cause safety shut down when either device detects a fault condition."
  },
  {
    "clause": "5.2.3.3",
    "title": "Pressure regulator(s) downstream of another pressure regulator",
    "description": "Where a pressure regulator(s) is installed downstream of another pressure regulator, the downstream pressure regulator shall be protected by an overpressure protection device complying with Clause 5.3 if failure of the upstream pressure regulator could result in exposing the downstream pressure regulator to inlet pressure greater than its rated pressure."
  },
  {
    "clause": "5.3",
    "title": "Overpressure protection devices",
    "description": "Requirements for overpressure protection devices in gas systems."
  },
  {
    "clause": "5.3.1",
    "title": "Overpressure protection",
    "description": "Except as permitted in Clause 5.3.2 a line pressure regulator or an industrial pressure regulator shall be provided with an overpressure protection device, and based on its intended outlet pressure, set to not exceed the maximum allowable downstream pressures shown in Table 5.2."
  },
  {
    "clause": "5.3.2",
    "title": "Overpressure protection devices",
    "description": "An overpressure protection device shall not be required for a Class I line pressure regulator certified to CSA/ANSI 221.80/CSA 6.22 and rated for inlet pressure of 2 psig (14 kPa), provided every appliance it directly serves is equipped with either an appliance regulator certified to CSA/ANSI 221.18/CSA 6.3, an automatic gas valve certified to CSA/ANSI 221.21/CSA 6.5, or a combination control valve certified to CSA/ANSI 221.78/CSA 6.20."
  },
  {
    "clause": "5.3.3",
    "title": "Class I line pressure regulator",
    "description": "A Class I line pressure regulator certified to CSA ANSI 221.80/CSA 6.22 with a rated inlet pressure of more than 2 psig (14 kPa) shall be installed only with the factory pre-assembled or supplied overpressure protection device with which the regulator is certified."
  },
  {
    "clause": "5.3.4",
    "title": "Internal relief valve or line relief valve",
    "description": "If an internal relief valve or line relief valve is used as the overpressure protection device, it shall be sized to fully relieve the rated capacity of the line pressure regulator when in the wide-open position."
  },
  {
    "clause": "5.4",
    "title": "Hydrostatic relief devices for propane applications",
    "description": "Requirements for hydrostatic relief devices in propane systems."
  },
  {
    "clause": "5.4.1",
    "title": "Hydrostatic relief valves",
    "description": "A hydrostatic relief valve (to relieve at a safe location outdoors) shall be installed between each pair of shut-off valves on a propane liquid piping system. The start-to-discharge pressure setting of such a hydrostatic relief valve shall be neither less than 375 psig (2500 kPa) nor more than 500 psig (3500 kPa)."
  },
  {
    "clause": "5.4.2",
    "title": "Discharge lines from hydrostatic relief devices",
    "description": "Discharge lines from two or more hydrostatic relief devices may run into a common discharge header, provided that the cross-sectional area of the header is at least equal to the sum of the cross-sectional areas of the individual discharge lines and that the header is not connected to any vent or bleed line."
  },
  {
    "clause": "5.5",
    "title": "Venting of pressure control devices",
    "description": "Requirements for venting of pressure control devices."
  },
  {
    "clause": "5.5.1",
    "title": "Construction of vent piping for pressure control devices other than overpressure relief devices",
    "description": "Requirements for vent piping construction for pressure control devices excluding overpressure relief devices."
  },
  {
    "clause": "5.5.1.1",
    "title": "Inclusions",
    "description": "The requirements in Clause 5.5.1 apply to bleed vents from pressure control devices including, but not limited to, automatic valves; diaphragm valves; and combination controls."
  },
  {
    "clause": "5.5.1.2",
    "title": "Exceptions",
    "description": "The requirements in Clause 5.5.1 do not apply to pressure regulators (including monitoring regulators) equipped with internal relief valves; and line overpressure relief valves."
  },
  {
    "clause": "5.5.1.3",
    "title": "Venting",
    "description": "Except as permitted in Clauses 5.5.1.4 and 5.5.1.5 for natural gas and hydrogen-natural gas blend applications and Clauses 5.5.1.5 and 5.5.3.1 for propane, the bleed vent from a pressure control device shall be constructed of steel pipe, copper, seamless aluminum, or steel tubing that complies with Clause 6.2; be of a size at least equal to the nominal pipe size of the vent outlet of the valve, combination control, pressure regulator, or control device, and in no case shall the inside diameter be less than 0.25 in (6 mm); connect to any other bleed vent only as permitted in Clause 5.5.1.5; and terminate in accordance with Clause 5.6."
  },
  {
    "clause": "5.5.1.4",
    "title": "Natural gas and hydrogen-natural gas blend applications",
    "description": "For natural gas and hydrogen-natural gas blend applications, the bleed vent line from a diaphragm valve or combination control that is installed on an appliance that has rated inlet pressure not in excess of 0.5 psig (3.5 kPa) may terminate in the appliance combustion chamber adjacent to a continuous pilot, provided that the terminus of the bleed vent is in a burner tip having a melting point in excess of 1450°F (790°C) and that is securely held in a fixed position relative to the pilot flame and that will not adversely affect the operation of the thermal element."
  },
  {
    "clause": "5.5.1.5",
    "title": "Bleed vents",
    "description": "The bleed vents of any two or more pressure control devices of any type, or any combination thereof, may be connected into a single, common bleed vent, provided that there is compliance with Clause 5.5.1.3 for inlet pressure not in excess of 0.5 psig (3.5 kPa); or Clause 5.5.2.5 a) and b) for inlet pressure in excess of 0.5 psig (3.5 kPa); and the single, common bleed vent line has an area of not less than twice the total area of the connected bleed vents upstream of the connection."
  },
  {
    "clause": "5.5.2",
    "title": "Construction of vent lines for overpressure relief devices",
    "description": "Requirements for vent line construction for overpressure relief devices."
  },
  {
    "clause": "5.5.2.1",
    "title": "Inclusions",
    "description": "The requirements in Clause 5.5.2 apply to vent lines originating from pressure regulators (including monitoring regulators) equipped with internal relief valves; and line overpressure relief valve."
  },
  {
    "clause": "5.5.2.2",
    "title": "Exceptions",
    "description": "The requirements in Clause 5.5.2 do not apply to bleed vents from pressure control devices, including but not limited to automatic valves; diaphragm valves; and combination controls."
  },
  {
    "clause": "5.5.2.3",
    "title": "Vent line",
    "description": "A vent line shall be of sufficient size and configuration to prevent impedance upon a regulator."
  },
  {
    "clause": "5.5.2.4",
    "title": "Outdoor vent line termination",
    "description": "The outdoor vent line termination of a pressure regulator or a line relief device shall be equipped with a means to prevent the entry of water, insects, or foreign material."
  },
  {
    "clause": "5.5.2.5",
    "title": "Vent line material and sizing",
    "description": "Except as specified in Clause 5.5.2.6 when a pressure regulator with internal relief valve or a line relief valve is installed, it shall be vented separately and terminate in accordance with Clause 5.6 by a vent line of steel pipe, or of seamless steel tubing or copper tubing or CSST that complies with Clause 6.2 and of a size at least equal to the nominal pipe size of the vent outlet of the valve or regulator increased as specified by the manufacturer's instructions and for CSST increased by one pipe size diameter; or in the absence of manufacturer's instructions, increased by one pipe size diameter for every 50 ft (15 m) or part thereof that the vent line extends beyond the initial 50 ft (15 m)."
  },
  {
    "clause": "5.5.2.6",
    "title": "Common vent lines",
    "description": "Except as required by Clause 5.5.2.7 when two or more gas overpressure relief valves are installed, they may be connected into a single vent line, provided that there is compliance with Clause 5.5.2.5; the single vent line has an area equal to the largest relief valve opening plus 50% of the total area of the other relief valve openings; the highest inlet pressure of any one line relief valve does not exceed 1.1 times the lowest inlet pressure of any other line relief valve, based on manufacturer's product literature; and the highest start-to-discharge pressure of one line relief valve does not exceed 1.1 times the lowest start-to-discharge pressure of any of the other line relief valves, based on manufacturer's product literature."
  },
  {
    "clause": "5.5.2.7",
    "title": "Vent line for internal relief valve",
    "description": "A vent line from a pressure regulator with an internal relief valve shall be piped independently to the outdoors and shall not be manifolded with any other vent line."
  },
  {
    "clause": "5.5.3",
    "title": "Additional requirements for venting of propane pressure control devices",
    "description": "Special venting requirements for propane pressure control devices."
  },
  {
    "clause": "5.5.3.1",
    "title": "Vent lines",
    "description": "For propane applications, except as specified in Clause 5.5.4, a pressure regulator, line relief device, or hydrostatic relief device on an appliance using gas heavier than air shall be equipped with a vent line in accordance with Clause 5.5.2.4 a) and b); and terminating outdoors in accordance with Clause 5.6."
  },
  {
    "clause": "5.5.3.2",
    "title": "Propane applications",
    "description": "For propane applications, a regulator vent, line relief device, or hydrostatic relief valve discharging vertically upward shall be provided with a loose-fitting rain cap. When discharging downward, it shall be provided with a protective screen."
  },
  {
    "clause": "5.5.4",
    "title": "Venting exemptions for pressure regulators",
    "description": "Exemptions from venting requirements for certain pressure regulators."
  },
  {
    "clause": "5.5.4.1",
    "title": "Exemptions",
    "description": "The following shall be exempt from Clause 5.6 provided the conditions in Clause 5.5.4.2 are also met: a line pressure regulator certified to CSA/ANSI 221.80/CSA 6.22 that incorporates a vent limiter; an appliance pressure regulator certified to ANSI 221.18/CSA 6.3 that incorporates a vent limiter, and with a rated pressure no higher than 2 psig (14 kPa); or an industrial pressure regulator equipped with a safety diaphragm if installed on a valve train of a CSA B149.3 approved appliance having a capacity greater than 400,000 btu/h (120 kW)."
  },
  {
    "clause": "5.5.4.2",
    "title": "Exemption conditions",
    "description": "The conditions for exemption from Clause 5.6 shall be the vent limiter limits the escape of gas to not more than 2.5 ft³/h (0.0706 m³/h) for natural gas; and not more than 1 ft³/h (0.0283 m³/h) for LP gases and subject to the limitation in Clause 5.5.4.3; the pressure regulator is installed in a ventilated space and to where the accumulation of fuel gas from the vent limiter does not exceed 25% of the gas's lower explosive limit; and the clearance from the vent limiter to any source of ignition is met, as listed in Table 5.3."
  },
  {
    "clause": "5.5.4.3",
    "title": "Line pressure regulator rated for 5 psig (35 kPa) or 10 psig (70 kPa)",
    "description": "The exemption permitted in Clause 5.5.4.1 shall not apply to a line pressure regulator rated for 5 psig (35 kPa) or 10 psig (70 kPa) when the fuel is propane."
  },
  {
    "clause": "5.6",
    "title": "Termination of vent lines",
    "description": "Except where permitted by Clauses 5.5.1.4 and 5.5.4, the vent line from overpressure protection devices, relief devices, and internal relief valves, and the termination of any other vent line not eligible to be vented into a ventilated space shall terminate outdoors with the clearances specified in Table 5.3."
  },
  {
    "clause": "5.7",
    "title": "Pressure regulators on appliances using propane",
    "description": "Special requirements for pressure regulators on propane appliances."
  },
  {
    "clause": "5.7.1",
    "title": "Excess propane pressures",
    "description": "An appliance that can be subjected, through supply pressure, design, creepage, or fluctuation, to propane pressure in excess of that for which it is rated shall be equipped with an appliance pressure regulator."
  },
  {
    "clause": "5.7.2",
    "title": "Pilots",
    "description": "When a pressure regulator is required by Clause 5.7.1, the propane supply to the pilot or group of pilots shall be regulated by an approved pressure regulator independent of the main burner propane supply."
  },
{
    "clause": "6.1",
    "title": "General",
    "description": "General requirements for gas piping systems."
  },
  {
    "clause": "6.1.1",
    "title": "Piping",
    "description": "Gas piping or tubing shall be of steel, copper, or plastic."
  },
  {
    "clause": "6.1.2",
    "title": "Removal",
    "description": "If removed from a gas installation, piping, tubing, and fittings shall not be reused unless thoroughly cleaned, inspected, and ascertained to be equivalent to new material. Piping, tubing, or fittings previously used with other gases may be reused with gas, provided that it is ascertained that the piping, tubing, or fittings to be used are equivalent to new material; and the piping, tubing, or fittings to be used are cleaned, inspected, and tested."
  },
  {
    "clause": "6.2",
    "title": "Material",
    "description": "Requirements for materials used in gas piping systems."
  },
  {
    "clause": "6.2.1",
    "title": "Piping standard specification",
    "description": "Piping shall comply with ASTM A53/A53M or ASTM A106/A106M."
  },
  {
    "clause": "6.2.2",
    "title": "Fittings",
    "description": "A fitting used with steel pipe shall be either malleable iron or steel and shall comply with the material selection requirements of CSA Z662 or the applicable ASME B16 series of standards; or certified to CSA/ANSI LC 4/CSA 6.32. When Schedule 80 pipe is required, the minimum Class of fitting used with the pipe shall be Class 300."
  },
  {
    "clause": "6.2.3",
    "title": "Piping schedule",
    "description": "Requirements for piping schedules based on operating pressure."
  },
  {
    "clause": "6.2.3.1",
    "title": "Operating pressure equal to or less than 125 psig (860 kPa)",
    "description": "A gas piping system using natural gas, hydrogen-natural gas blends, or propane vapour phase with operating pressures up to and including 125 psig (860 kPa) shall comply with the following as applicable: Piping shall be at least Schedule 10 for NPS 1/2 to 2. When using Schedule 10 to less than Schedule 40, piping shall be located indoors, and joints shall use fittings certified to CSA/ANSI LC 4/CSA 6.32. Piping shall be at least Schedule 40 for NPS 2-1/2 to 10. Pipe larger than NPS 10 shall be at least standard weight."
  },
  {
    "clause": "6.2.3.2",
    "title": "Operating pressure exceeding 125 psig (860 kPa)",
    "description": "A gas piping system using natural gas, hydrogen-natural gas blends, or propane vapour phase with operating pressures exceeding 125 psig (860 kPa) and all liquid piping systems shall comply with either of the following: For pipe sizes up to and including NPS 10: piping shall be at least Schedule 40 when using welded or flanged joints; or piping shall be at least Schedule 80 when using threaded joints. Threaded joints shall be threaded or threaded and back welded. Pipe larger than NPS 10 shall be at least standard weight."
  },
  {
    "clause": "6.2.4",
    "title": "Copper tubing for gas",
    "description": "Copper tubing used for gas shall be Type G, K, or L, and shall meet the requirements of one of the following Standards, as applicable: Type G tube shall meet ASTM B837; or Types K and L tube shall meet ASTM B88."
  },
  {
    "clause": "6.2.5",
    "title": "Copper tubing for propane",
    "description": "Copper tubing Types K and L specified in Clause 6.2.4 b) may be used for liquid propane or propane in the vapour phase."
  },
  {
    "clause": "6.2.6",
    "title": "Flare nuts",
    "description": "Flare nuts shall be forged from UNS C37700 brass and shall not be externally machined."
  },
  {
    "clause": "6.2.7",
    "title": "Tubing fittings rated pressure",
    "description": "Tubing fittings shall be rated for a working pressure of not less than 125 psig (860 kPa) for operating pressures of 125 psig (860 kPa) or less. For higher operating pressures, tubing and fittings shall be rated for a minimum of 250 psig (1725 kPa)."
  },
  {
    "clause": "6.2.8",
    "title": "Copper tubing underground",
    "description": "Copper tubing for underground use shall be either Type L or G, externally coated with extruded polyethylene or PVC resin at the time of manufacture, or Type K, and any portion of the copper tubing that extends above ground shall be protected against physical damage."
  },
  {
    "clause": "6.2.9",
    "title": "Tubing",
    "description": "Tubing shall be one of the following: CSST; seamless copper; or seamless steel."
  },
  {
    "clause": "6.2.10",
    "title": "Hoses and hose fittings",
    "description": "Except as required in Clauses 6.2.11 and 6.2.12, every non-metallic hose and hose fitting shall have a minimum working pressure of 350 psig (2400 kPa) and shall comply with CSA B.1 or CSA B.3."
  },
  {
    "clause": "6.2.11",
    "title": "Hoses for cutting and welding",
    "description": "Every hose and hose connection used in cutting or welding systems shall comply with CAN/CSA-W117.2."
  },
  {
    "clause": "6.2.12",
    "title": "Liquid propane hose prohibition",
    "description": "Hoses certified to CSA B-3 shall not be used in a liquid propane system."
  },
  {
    "clause": "6.2.13",
    "title": "Seamless steel tubing standard specification",
    "description": "Seamless steel tubing shall comply with ASTM A179/A179M."
  },
  {
    "clause": "6.2.14",
    "title": "Alternative material",
    "description": "Materials not specified in Clause 6.2 may be used if they conform to a nationally recognized standard or to a test report of a nationally recognized certification organization."
  },
  {
    "clause": "6.2.15",
    "title": "Plastic piping and tubing standard specification",
    "description": "Plastic piping and tubing shall comply with CSA B137.4."
  },
  {
    "clause": "6.2.16",
    "title": "Plastic piping and tubing fittings",
    "description": "Fittings for plastic piping and tubing systems shall comply with CSA B137.4 or CSA B137.4.L."
  },
  {
    "clause": "6.2.17",
    "title": "Plastic pipe prohibition",
    "description": "Plastic pipe shall not be used in a liquid propane system."
  },
  {
    "clause": "6.2.18",
    "title": "Plastic piping or tubing use",
    "description": "Except as mentioned in Clause 6.2.19 plastic piping or tubing shall only be used for outdoor underground service."
  },
  {
    "clause": "6.2.19",
    "title": "Plastic pipe propane prohibition",
    "description": "Plastic pipe shall not be used for, as a minimum, the first 10 ft (3 m) of piping on the downstream side of a vapourizer in a propane application and shall not exceed the temperatures specified in Clause 6.2.20."
  },
  {
    "clause": "6.2.20",
    "title": "Plastic piping or tubing temperature",
    "description": "Plastic piping or tubing shall not be used at ambient temperatures exceeding 122°F (50°C) or where the steady-state operating temperature of the materials will exceed 86°F (30°C)."
  },
  {
    "clause": "6.2.21",
    "title": "Plastic piping or tubing termination",
    "description": "Plastic piping or tubing may terminate above ground and outside a building, provided that the aboveground portions are completely encased with a certified metallic sheathing or anodeless riser that extends a minimum of 6 in (15 cm) below grade; and the plastic piping or tubing is not subject to external loading stresses created by other piping, appliances, or equipment."
  },
  {
    "clause": "6.2.22",
    "title": "CSST standard specification",
    "description": "CSST and associated fittings shall comply with CSA/ANSI LC 1/CSA 6.26 or CSA publication CGA Certification laboratory Requirement LAB-009."
  },
  {
    "clause": "6.2.23",
    "title": "CSST prohibition",
    "description": "CSST shall not be used as a gas connector."
  },
  {
    "clause": "6.3",
    "title": "Size",
    "description": "Requirements for sizing gas piping systems."
  },
  {
    "clause": "6.3.1",
    "title": "General",
    "description": "Piping, tubing, and hose shall be of sufficient size to provide a supply of gas to meet the requirements of volume and pressure at the point of use."
  },
  {
    "clause": "6.3.2",
    "title": "Pressure equal to or less than 14 in w.c. (3.5 kPa)",
    "description": "A gas piping system supplied at pressures up to and including 14 in w.c. (3.5 kPa) shall be designed to prevent the loss in pressure between the appliance and either the termination of the utility installation or the last-stage regulator from exceeding the maximum allowable pressure drop specified in Table 6.1. The minimum size of piping, tubing, and fittings shall be determined in accordance with good engineering practice, such as by the use of Tables A1 and A.8 of Annex A, for natural gas or hydrogen-natural gas blends, which include allowance for a reasonable number of fittings, when the maximum allowable pressure drop is 0.5 in w.c (0.125 kPa); by the use of Tables A2 and A.9 in Annex A for natural gas or hydrogen-natural gas blends or Tables B.1 and B.6 in Annex B for propane, which include allowance for a reasonable number of fittings, when the maximum allowable pressure drop is 1 in w.c. (0.25 kPa); by the method of calculation outlined in Annex A for natural gas or hydrogen-natural gas blends or Annex B for propane; or for CSST, by the use of sizing methods and tables supplied by the manufacturer."
  },
  {
    "clause": "6.3.3",
    "title": "Pressure exceeding 14 in w.c. (3.5 kPa)",
    "description": "A gas piping system operating at a pressure exceeding 14 in w.c. (3.5 kPa) shall be designed to ensure an adequate supply of gas to each appliance served at the respective designated pressure rating, and to ensure that the appliance will not be overpressured under conditions of no flow. The minimum size of piping, tubing, and fittings shall be determined in accordance with Clause 6.3.4 for 2 psig (14 kPa) systems or good engineering practice, such as by the use of the applicable tables in Annex A for natural gas or hydrogen-natural gas blends or Annex B for propane, making allowance for fittings as necessary; by the method of calculation outlined in Annex A for natural gas or hydrogen-natural gas blends or Annex B for propane; or for CSST, by the use of sizing methods and tables supplied by the manufacturer."
  },
  {
    "clause": "6.3.4",
    "title": "Pressure regulator",
    "description": "The gas piping system shall be designed to provide adequate gas pressure to the 2 psig (14 kPa) pressure regulator to match downstream load requirements. Pressure regulator sizing shall be subject to the minimum available inlet supply pressure. See Tables A.2, A.8, A.9, A.10, and A.11 in Annex A for natural gas or hydrogen-natural gas blends or Tables B.2 and B.7 in Annex B for propane, which include allowance for a reasonable number of fittings."
  },
  {
    "clause": "6.3.5",
    "title": "Plastic piping",
    "description": "Plastic piping shall be sized by the use of Table A.7 in Annex A for natural gas or hydrogen-natural gas blends or Tables B.1 to B.5 in Annex B for propane; or by the method of calculation outlined in Annex A for natural gas or Annex B for propane."
  },
  {
    "clause": "6.3.6",
    "title": "Relative density",
    "description": "Annex A is based on natural gas of 0.60 relative density. For gas having a relative density other than 0.60, the multipliers given in Table A.15 in Annex A shall be applied to the capacities listed. Annex B is based on propane of 1.52 relative density."
  },
  {
    "clause": "6.3.7",
    "title": "Equivalent length",
    "description": "Annexes A and B give the resistance of bends, fittings, and valves as an equivalent length of straight pipe in ft (m) to be added to the actual length to obtain the total equivalent length on which pressure loss calculations shall be based. See Tables A.16 and B.11."
  },
  {
    "clause": "6.3.8",
    "title": "Size less than NPS 1/2",
    "description": "Special requirements for piping sizes less than NPS 1/2."
  },
  {
    "clause": "6.3.8.1",
    "title": "Natural gas and hydrogen-natural gas blends threaded pipe and fittings",
    "description": "For natural gas and hydrogen-natural gas blends, threaded pipe and fittings less than NPS 1/2 used in a piping system shall be Schedule 80."
  },
  {
    "clause": "6.3.8.2",
    "title": "Propane piping location",
    "description": "For propane, piping less than NPS 1/2 shall not be used indoors, except that NPS 3/8 piping may be used as a branch line not exceeding 25 ft (7.5 m) in length."
  },
  {
    "clause": "6.3.9",
    "title": "Piping concealed location",
    "description": "Piping less than NPS 1/2 shall not be used in a concealed location."
  },
  {
    "clause": "6.4",
    "title": "Volume of gas to be used for sizing gas piping systems",
    "description": "Requirements for determining gas volume for sizing purposes."
  },
  {
    "clause": "6.4.1",
    "title": "Total volume",
    "description": "The total volume of gas required shall be determined as the total volume for all appliances supplied, except as permitted in Clause 6.4.3; and include an allowance for known future extensions."
  },
  {
    "clause": "6.4.2",
    "title": "Volume determination",
    "description": "The volume of gas required for each appliance shall be determined from either the appliance rating plate; or the appliance manufacturer when the rating is not shown on the appliance."
  },
  {
    "clause": "6.4.3",
    "title": "Diversity load",
    "description": "When a diversity of load has been established to the satisfaction of the authority having jurisdiction, a percentage of the total volume may be used."
  },
  {
    "clause": "6.5",
    "title": "Allowable pressure and pressure drop",
    "description": "Requirements for pressure determination and regulation."
  },
  {
    "clause": "6.5.1",
    "title": "Pressure determination",
    "description": "The gas pressure required for each appliance shall be determined from either the appliance rating plate; or the appliance manufacturer when the required pressure is not shown on the appliance."
  },
  {
    "clause": "6.5.2",
    "title": "Pressure regulator requirement",
    "description": "When the pressure is in excess of that determined by Clause 6.5.1 or when either excessive fluctuation or creepage exists, a pressure regulator shall be provided in the gas piping system to the appliance."
  },
  {
    "clause": "6.5.3",
    "title": "Pressure drop determination",
    "description": "In determining the pressure drop in the gas piping system, the resistance offered by bends, fittings, and valves shall be included in the calculations, together with the resistance offered by the length of piping or tubing."
  },
  {
    "clause": "6.6",
    "title": "Extensions",
    "description": "Requirements for extending existing gas piping systems."
  },
  {
    "clause": "6.6.1",
    "title": "Adequate capacity",
    "description": "When an existing gas piping system is of adequate capacity for an additional appliance, any required extension that also contains the existing system shall be sized to meet the requirements of Clause 6.3."
  },
  {
    "clause": "6.6.2",
    "title": "Insufficient capacity",
    "description": "When an existing gas piping system is of insufficient capacity for an additional appliance, the supply piping or tubing to any extension shall be sized to meet the requirements of Clause 6.3 to within 24 in (610 mm) of the point of the supplier termination or the pressure regulator, at which point it may be reduced if necessary."
  },
  {
    "clause": "6.7",
    "title": "Location",
    "description": "Requirements for gas piping location and installation restrictions."
  },
  {
    "clause": "6.7.1",
    "title": "Concealed piping or tubing",
    "description": "Concealed piping or tubing that contains fittings or joints shall not be run where the fittings or joints cannot be inspected and tested in accordance with Clause 6.22 in their final position prior to being concealed."
  },
  {
    "clause": "6.7.2",
    "title": "Piping or tubing installation prohibition",
    "description": "Piping or tubing shall not be installed in a stairwell other than a stairwell within a dwelling unit unless it is totally enclosed by a chase consisting of material that has the same fire-resistance rating as that required for the stairwell; in a chimney, flue, elevator, dumbwaiter or material lift shaft, or any chute including for linen or refuse use; in a heating or ventilating plenum, duct, or shaft except as permitted in Clause 6.7.6; or in contact with either cinders, ashes, or other corrosive materials."
  },
  {
    "clause": "6.7.3",
    "title": "Corrosive chemical",
    "description": "Piping or tubing shall not be concealed in a location where a corrosive chemical is used."
  },
  {
    "clause": "6.7.4",
    "title": "Solid flooring",
    "description": "Piping or tubing in solid flooring, such as concrete, shall be laid in channels and suitably covered to permit access to the piping or tubing. Alternatively, the piping or tubing shall be encased in ducts so that there is free air space around the pipe or tube. Such a duct shall be ventilated."
  },
  {
    "clause": "6.7.5",
    "title": "Vertical piping",
    "description": "Each vertical piping chase shall have an opening at the top and bottom, and the opening shall have a minimum area equivalent to a round opening of 1 in (25 mm) in diameter."
  },
  {
    "clause": "6.7.6",
    "title": "False ceiling space",
    "description": "Piping or tubing may be installed in a false ceiling space, including one used as a return-air plenum of a central warm-air or air-conditioning system."
  },
  {
    "clause": "6.8",
    "title": "Piping practices",
    "description": "General requirements for gas piping installation practices."
  },
  {
    "clause": "6.8.1",
    "title": "General",
    "description": "Piping and fittings shall be clear and free from cutting burrs, threading burrs, scale, and defects."
  },
  {
    "clause": "6.8.2",
    "title": "Piping ends",
    "description": "The ends of all piping shall be reamed."
  },
  {
    "clause": "6.8.3",
    "title": "Piping support",
    "description": "Piping or tubing shall not be supported by other piping or tubing, and shall be installed with individual supports of sufficient strength and quality. Supports shall be spaced in accordance with Table 6.2."
  },
  {
    "clause": "6.8.4",
    "title": "Structural integrity",
    "description": "A girder, beam, joist, or other structural member shall not be cut for the installation of piping in such a manner as to reduce its strength below that required for the purpose for which it is intended."
  },
  {
    "clause": "6.8.5",
    "title": "Back flow prevention",
    "description": "When air, oxygen, or other gas under pressure is used in connection with the gas supply, either a back-check valve or other suitable equipment shall be provided as close as practicable to the point of interconnection to prevent any interchange of such in the piping or tubing system."
  },
  {
    "clause": "6.8.6",
    "title": "Filter requirements",
    "description": "When a filter is used in a piping system, a low-pressure indicator shall be installed directly downstream of the filter."
  },
  {
    "clause": "6.8.7",
    "title": "Manufacturer's fabricated fittings",
    "description": "Manufacturer's fabricated fittings shall be used in welded gas piping systems except as permitted in Clause 6.8.8."
  },
  {
    "clause": "6.8.8",
    "title": "Supply header exceeds NPS 2-1/2",
    "description": "When a gas supply header is NPS 2-1/2 or larger, the branch line connection may be a job-fabricated welded fitting, provided that the branch line does not exceed 50% of the pipe diameter of the gas supply header, and in no case shall the branch connection be less than NPS 3/4."
  },
  {
    "clause": "6.8.9",
    "title": "Support material",
    "description": "Where piping and tubing supports are used, they shall be metallic and shall be installed to avoid galvanic action between the piping or tubing and the supports."
  },
 {
    "clause": "6.8.10",
    "title": "Test ports",
    "description": "A test port shall be installed immediately downstream of a line pressure regulator or an industrial pressure regulator except where the pressure regulator can be adjusted while measuring and observing the supply pressure at any appliance being served by the pressure regulator. Where opening the test port could create an uncontrolled release of gas, the test port shall be equipped with a manual shut-off valve that is either capped or plugged."
  },
  {
    "clause": "6.9",
    "title": "Joints and connections",
    "description": "General requirements for joints and connections in gas piping systems."
  },
  {
    "clause": "6.9.1",
    "title": "Steel piping",
    "description": "Joints in steel piping shall be threaded, flanged, press-connected, or welded, and shall be as specified in Clause 6.15.2. When mating flanges, they shall be of the same face type and rating."
  },
  {
    "clause": "6.9.2",
    "title": "Type",
    "description": "Piping of NPS 2-1/2 to 4 shall have either press-connect fittings certified to CSA/ANSI LC 4/CSA 6.32 or welded pipe joints. Piping greater than NPS 4 shall have welded pipe joints."
  },
  {
    "clause": "6.9.3",
    "title": "Welding",
    "description": "Welding of gas piping systems shall be performed in accordance with a procedure and by an operator registered under the applicable provincial or territorial legislation."
  },
  {
    "clause": "6.9.4",
    "title": "Welding acceptance criteria",
    "description": "The acceptance criteria for any welds shall: a) for design pressures greater than 250 psig (1720 kPa), comply with the visual and radiographic inspection requirements of Clause Z of CSA 2662 or other approved methods; b) for design pressures between 100 psig (700 kPa) and up to 250 psig (1720 kPa), be in accordance with the visual and radiographic inspection requirements of Chapter VI of ASME B31.3; or c) for design pressures of 100 psig (700 kPa) and less, be by visual inspection of the external weld surface, as well as the internal weld surface where accessible without the use of special tools. Acceptance criteria of the weld shall be in accordance with the requirements of Annex I."
  },
  {
    "clause": "6.9.5",
    "title": "Piping or fitting thread",
    "description": "A piping or fitting thread shall be tapered and shall comply with ANSI/ASME B1.20.1."
  },
  {
    "clause": "6.9.6",
    "title": "Jointing sealant",
    "description": "When a jointing sealant is used, it shall be certified to CAN/ULC-S542 and shall be applied to the male threads of a metal pipe. Tape shall be stretched and applied in a clockwise direction, with a 50% overlap leaving the first two starter threads bare. Tape shall not be used for pipe sizes larger than 1-1/2 in (38 mm) nominal pipe size for hydrogen-natural gas blends."
  },
  {
    "clause": "6.9.7",
    "title": "Gasket material",
    "description": "Gasket materials shall be of either neoprene or other similar material resistant to any action of gas. Natural rubber shall not be used."
  },
  {
    "clause": "6.9.8",
    "title": "Lubricant use",
    "description": "A lubricant used in either a valve or a control shall be of a type approved for gas use. It shall be capable of withstanding the service conditions to which it can be subjected when used in accordance with the manufacturer's recommendations."
  },
  {
    "clause": "6.9.9",
    "title": "Seamless copper, brass, or steel tubing",
    "description": "A joint in seamless copper, brass, or steel tubing shall be made by: a) a flare joint; b) an approved fitting, other than a metallic ball sleeve compression-type fitting; c) brazing with a material that has a melting point exceeding 1000 °F (525 °C); or d) a press-connect fitting."
  },
  {
    "clause": "6.9.10",
    "title": "Bushing",
    "description": "A bushing shall be made of: a) steel for a change of one pipe size; or b) steel or malleable iron for a change of two or more pipe sizes."
  },
  {
    "clause": "6.9.11",
    "title": "Plastic pipe and fittings",
    "description": "Plastic pipe and fittings shall be joined by heat fusion, electrofusion, or mechanical methods. Such joining methods shall be compatible with the materials being joined, in accordance with CSA 2662 and the manufacturer's instructions."
  },
  {
    "clause": "6.10",
    "title": "Branch piping outlets",
    "description": "If a branch piping outlet is installed in the main gas piping system before it is known what size of piping is required to be connected to it, the outlet shall be of the same size as the piping which supplies it."
  },
  {
    "clause": "6.11",
    "title": "Appliance connections",
    "description": "General requirements for appliance connections to gas piping systems."
  },
  {
    "clause": "6.11.1",
    "title": "General",
    "description": "The following requirements apply to appliance connections: a) Where approved, rigid piping may be used to connect an appliance to the building gas piping system. b) A vented appliance shall be connected directly to the gas supply with piping or tubing or by means specified in Clause 6.21. c) CSST and copper tubing shall only be connected to an appliance secured in place (nonmovable) or to rigid piping."
  },
  {
    "clause": "6.11.2",
    "title": "Gas hose or connector requirements",
    "description": "An appliance connection shall satisfy one of the following requirements: a) An appliance permitted by Clauses 6.20 and 6.21 for use with a gas hose may be connected to the building piping by means of a gas convenience outlet or by means of a quick-disconnect device, and where a quick-disconnect device is used, a readily accessible manual shut-off valve shall be installed upstream of, and as close as practicable to, the quick-disconnect device. b) An appliance permitted by Clauses 6.20 and 6.21 for use with a gas connector that is certified to CSA/ANSI 221.24/CSA 6.10 shall be directly connected to the building gas piping system secure outlet. c) An appliance permitted by Clauses 6.20 and 6.21 for use with a gas connector that is certified to ANSI 221.69/CSA 6.16 may be connected directly to the building gas piping system secure outlet or connected by means of a gas convenience outlet or a quick-disconnect device, and where a quick-disconnect device is used, a readily accessible manual shut-off valve shall be installed upstream of, and as close as practicable to, the quick-disconnect device. d) An appliance permitted by Clauses 6.20 and 6.21 for use with a gas connector that is certified to CSA/ANSI 221.101/CSA 8.5 shall be connected to the building gas piping system by means of a gas convenience outlet."
  },
  {
    "clause": "6.11.3",
    "title": "Quick-disconnect location",
    "description": "A quick-disconnect device shall not be used to connect appliances indoors in a residential building."
  },
  {
    "clause": "6.11.4",
    "title": "Gas convenience outlet certification",
    "description": "A gas convenience outlet shall be certified to CSA/ANSI 221.90/CSA 6.24."
  },
  {
    "clause": "6.11.5",
    "title": "Quick-disconnect certification",
    "description": "A quick-disconnect device shall be certified to CSA/ANSI 221.41/CSA 6.9."
  },
  {
    "clause": "6.11.6",
    "title": "Support",
    "description": "An appliance shall be adequately supported and connected to the piping so that there is no undue strain on the connection."
  },
  {
    "clause": "6.12",
    "title": "Piping outlets",
    "description": "General requirements for piping outlets in gas systems."
  },
  {
    "clause": "6.12.1",
    "title": "General",
    "description": "During the period when an appliance is not connected to an outlet of a piping system, the outlet shall be made tight by means of: a) a plugged valve; or b) either a cap or plug made of material compatible with the material of the piping or tubing system."
  },
  {
    "clause": "6.12.2",
    "title": "Unthreaded piping",
    "description": "An unthreaded portion of a piping outlet shall extend at least 1 in (25 mm) through either a finished ceiling or a finished wall and at least 2 in (50 mm) through a floor."
  },
  {
    "clause": "6.12.3",
    "title": "Piping outlet location",
    "description": "A piping outlet shall be located as close as practicable to the appliance being served."
  },
  {
    "clause": "6.13",
    "title": "Drip and dirt pockets",
    "description": "Requirements for drip and dirt pockets in gas piping systems."
  },
  {
    "clause": "6.13.1",
    "title": "Dirt pocket installation",
    "description": "A dirt pocket shall be installed at the bottom of any piping or tubing on the final drop serving an appliance other than: a) an illuminating appliance; b) a range; c) a clothes dryer; d) an outdoor grill; e) a portable appliance or equipment; f) a decorative appliance; g) a gas log; h) a room heater; and i) an appliance incorporating a sediment trap."
  },
  {
    "clause": "6.13.2",
    "title": "Size",
    "description": "Both a drip pocket and a dirt pocket shall be sized as follows: a) The depth of the pocket shall be either 3 in (75 mm) or equal to the internal diameter of the piping it serves, whichever is greater. b) The diameter of the pocket shall be either NPS 2 or equal to the diameter of the piping it serves, whichever is less."
  },
  {
    "clause": "6.13.3",
    "title": "Location",
    "description": "A drip or dirt pocket shall be located where readily accessible to permit cleaning and emptying."
  },
  {
    "clause": "6.13.4",
    "title": "Termination",
    "description": "A drip or dirt pocket shall be capped."
  },
  {
    "clause": "6.13.5",
    "title": "Drip pocket installation",
    "description": "A drip pocket shall be provided at all points in a piping system where condensation can collect, such as points where the piping is exposed to either wide ranges or sudden changes in temperature."
  },
  {
    "clause": "6.13.6",
    "title": "Additional requirements",
    "description": "When a drip or dirt pocket is required by either Clause 6.13.1 or 6.13.5, it shall be connected to the piping it serves through the bottom opening of a tee, the other two openings of which shall serve as continuity for the piping system."
  },
  {
    "clause": "6.14",
    "title": "Prohibited practices",
    "description": "General prohibited practices in gas piping systems."
  },
  {
    "clause": "6.14.1",
    "title": "Defective piping",
    "description": "A defective section of piping or tubing shall be replaced and not repaired."
  },
  {
    "clause": "6.14.2",
    "title": "Nesting",
    "description": "Bushings shall not be nested."
  },
  {
    "clause": "6.14.3",
    "title": "Left and right hand threads",
    "description": "A pipe fitting containing both left- and right-hand threads, a thread protector, or running threads shall not be used."
  },
  {
    "clause": "6.14.4",
    "title": "Union or combination of fittings",
    "description": "A union or a combination of fittings designed and intended to act as a swing joint shall not be used where piping is concealed."
  },
  {
    "clause": "6.14.5",
    "title": "Field bending",
    "description": "Piping shall not be field bent."
  },
  {
    "clause": "6.14.6",
    "title": "Electrical",
    "description": "Piping or tubing shall not be used for an electrical ground. An electric circuit shall not utilize piping or tubing in lieu of wiring, except for a low-voltage control circuit, ignition circuit, or electronic flame-detection device circuit incorporated as part of an appliance."
  },
  {
    "clause": "6.14.7",
    "title": "Fittings",
    "description": "A close nipple, a street elbow, or a street tee shall not be used in a piping system."
  },
  {
    "clause": "6.14.8",
    "title": "Meter connection",
    "description": "CSST or copper tubing shall not be used to connect to a meter, unless the meter assembly is independently supported."
  },
  {
    "clause": "6.15",
    "title": "Underground piping and tubing",
    "description": "Requirements for underground gas piping and tubing installations."
  },
  {
    "clause": "6.15.1",
    "title": "Prohibition",
    "description": "Piping having a nominal diameter of less than NPS 1/2 shall not be used underground."
  },
  {
    "clause": "6.15.2",
    "title": "Piping connection",
    "description": "Underground piping systems shall be joined or connected by welding, approved mechanical compression, or press-connect fittings."
  },
  {
    "clause": "6.15.3",
    "title": "Tubing connection",
    "description": "Underground tubing systems shall be joined or connected by brazing, approved mechanical compression, or approved flared or press-connect fittings."
  },
  {
    "clause": "6.15.4",
    "title": "Location depth",
    "description": "Piping and tubing shall be located neither less than 15 in (400 mm) underground nor less than 24 in (610 mm) under a commercial driveway or parking lot, except when it rises above ground at the point of supply to either a building or an outdoor appliance. Additional depth of cover shall be required where the piping is located in areas where physical damage is likely to occur, such as farm operations."
  },
  {
    "clause": "6.15.5",
    "title": "Trench",
    "description": "A trench for underground piping or tubing shall be properly graded to prevent a sag in the piping or tubing."
  },
  {
    "clause": "6.15.6",
    "title": "Backfill",
    "description": "Backfill material shall be free of sharp objects, large stones, or any other material that can damage the piping or tubing."
  },
  {
    "clause": "6.15.7",
    "title": "Location",
    "description": "Underground piping or tubing shall not pass below a foundation or wall, or under a building."
  },
   {
    "clause": "6.15.8",
    "title": "Building entrance",
    "description": "Piping or tubing entering a building shall rise above grade before entry unless otherwise permitted by the authority having jurisdiction."
  },
  {
    "clause": "6.15.9",
    "title": "Outside wall",
    "description": "A watertight seal shall be provided at any point where piping or tubing passes through an outside wall below ground level."
  },
  {
    "clause": "6.15.10",
    "title": "Under pavement",
    "description": "When piping or tubing is laid under pavement and an entry to a building is made above ground level, a sleeve shall be inserted to protect the piping or tubing where it comes through the pavement to permit free movement of the soil and covering without placing strain on the piping or tubing."
  },
  {
    "clause": "6.15.11",
    "title": "Vent pipe",
    "description": "A vent pipe inspection point shall be installed adjacent to a building, either when the entire piping or tubing is covered with paving or when paving extends 25 ft (7.5 m) or more from the building, unless other approved provisions have been made for venting the area surrounding the piping."
  },
  {
    "clause": "6.15.12",
    "title": "Connection to plastic",
    "description": "An approved transition fitting shall be used for connecting piping or tubing of either steel or copper to plastic."
  },
  {
    "clause": "6.15.13",
    "title": "Gas supply to plastic piping or tubing",
    "description": "The gas supply to underground plastic piping or tubing shall be controlled by a shut-off valve situated above ground."
  },
  {
    "clause": "6.15.14",
    "title": "Plastic piping or tubing",
    "description": "Plastic piping or tubing shall be accompanied by a tracing wire or other electronically detectable tracing media."
  },
  {
    "clause": "6.15.15",
    "title": "Common trench",
    "description": "When underground piping or tubing share a common trench with underground electrical systems, a minimum separation of 1.2 in (300 mm) shall be maintained between the gas system and the electrical system."
  },
  {
    "clause": "6.16",
    "title": "Protection of piping and tubing",
    "description": "General section covering protection requirements for piping and tubing systems."
  },
  {
    "clause": "6.16.1",
    "title": "Corrosive atmospheres",
    "description": "Outdoor piping or indoor piping and tubing that is exposed to atmospheres that are corrosive to the piping or tubing shall be protected by either painting or coating."
  },
  {
    "clause": "6.16.2",
    "title": "Underground",
    "description": "Piping, tubing, or fittings laid underground shall be protected against corrosion in accordance with good engineering practice or in accordance with the manufacturer's instructions."
  },
  {
    "clause": "6.16.3",
    "title": "Movement",
    "description": "Piping or tubing shall be mounted, braced, and supported to provide for expansion, contraction, jarring, vibration, and settling, and shall be protected against either damage or breakage due to strain, wear, and mechanical impact. Note: Moving snow loads and ice on sloped roofs have been known to damage or break pipes."
  },
  {
    "clause": "6.16.4",
    "title": "Hollow walls or partitions",
    "description": "Tubing run inside hollow walls or partitions within 1.75 in (43 mm) of the surface shall be protected against physical damage and puncture at the joists, studs, and plates by the use of No. 16 USG (1.59 mm) plates or sleeves. This provision shall not apply to tubing that passes directly through walls or partitions."
  },
  {
    "clause": "6.16.5",
    "title": "Appliance doors or covers",
    "description": "Piping or tubing shall be located in a position free from the arc of movement of all appliance doors or covers."
  },
  {
    "clause": "6.16.6",
    "title": "Galvanic corrosion",
    "description": "To avoid galvanic corrosion, metallic piping or tubing shall be installed in such a manner that it is not in contact with any other dissimilar metallic pipe or structure."
  },
  {
    "clause": "6.16.7",
    "title": "Exterior wall above ground",
    "description": "When piping or tubing passes through an exterior wall above ground, it shall be sealed watertight and the portion of piping or tubing that runs through the wall shall be sleeved or double wrapped with a pipe wrap tape."
  },
  {
    "clause": "6.16.8",
    "title": "Masonry or concrete",
    "description": "When piping or tubing passes through masonry or concrete, the portion of piping or tubing that runs through this material shall be sleeved or double wrapped with a pipe wrap tape."
  },
  {
    "clause": "6.16.9",
    "title": "Sleeve use",
    "description": "A sleeve shall enclose the entire length of piping or tubing that passes through an exterior wall to an unheated, inaccessible building element, sealed watertight and the portion of piping or tubing that runs through the sleeve shall be double wrapped with a pipe wrap tape."
  },
  {
    "clause": "6.16.10",
    "title": "Sleeve material",
    "description": "When piping or tubing is run in a sleeve, the sleeve shall be of such material and so installed as to protect the piping or tubing from damage and galvanic action."
  },
  {
    "clause": "6.16.11",
    "title": "Plastic material",
    "description": "Care shall be exercised to protect plastic materials from excessive heat and harmful chemicals."
  },
  {
    "clause": "6.16.12",
    "title": "Plastic pipe and tubing support",
    "description": "Plastic pipe and tubing shall be adequately supported during storage."
  },
  {
    "clause": "6.16.13",
    "title": "Plastic direct sunlight exposure",
    "description": "Plastic pipe and tubing shall be protected from exposure to direct sunlight."
  },
  {
    "clause": "6.16.14",
    "title": "CSST",
    "description": "CSST and fittings shall be protected against physical damage in accordance with the manufacturer's certified installation instructions and with this Code."
  },
  {
    "clause": "6.16.15",
    "title": "Vehicle protection",
    "description": "The portions of gas piping systems installed above grade in locations that do not afford protection from damage from vehicles on any street, highway, avenue, alley, or a parking lot shall be protected by posts or guardrails in compliance with clause 6.16.16 unless otherwise approved by the authority having jurisdiction."
  },
  {
    "clause": "6.16.16",
    "title": "Vehicle protection requirements",
    "description": "Gas piping systems shall be protected from vehicular damage by posts or guardrails meeting specific dimensional and material requirements including minimum distances, burial depths, and construction specifications."
  },
  {
    "clause": "6.17",
    "title": "Identification of piping or tubing",
    "description": "General section covering identification requirements for gas piping and tubing systems."
  },
  {
    "clause": "6.17.1",
    "title": "General",
    "description": "At every care or detention occupancy, commercial, industrial, and assembly building, piping or tubing shall be identified by painting yellow, yellow banding (minimum 1 in/25 mm width), or labeling 'GAS' or 'PROPANE' with yellow labels or markings. Identification intervals shall not exceed 20 ft (6 m)."
  },
  {
    "clause": "6.17.2",
    "title": "Pressure in excess of 14 in w.c. (3.5 kPa)",
    "description": "At every care or detention occupancy, commercial, industrial, and assembly building, where the piping or tubing pressure is in excess of 14 in w.c. (3.5 kPa), both the piping or tubing and the pressure shall be identified at shut-off valves and wall, ceiling, and floor penetrations."
  },
  {
    "clause": "6.17.3",
    "title": "Residential buildings",
    "description": "Tubing systems for residential buildings shall be identified in accordance with Clause 6.17.1, except that identification intervals shall not exceed 6 ft (2 m) along their entire length."
  },
  {
    "clause": "6.17.4",
    "title": "Two or more gas meters",
    "description": "Every piping or tubing system that enters a building that has two or more gas meters shall be permanently identified with the room number, apartment number, or the area of the building it serves."
  },
  {
    "clause": "6.18",
    "title": "Manual shut-off valves",
    "description": "General section covering manual shut-off valve requirements."
  },
  {
    "clause": "6.18.1",
    "title": "Certification or approval",
    "description": "A manual shut-off valve shall be certified to CSA 3.11, CSA 3.16, or CSA/ANSI 221.15/CSA 9.1, or approved for use with gas, and it shall not be subjected to either a temperature or a pressure outside of its certified rating range."
  },
  {
    "clause": "6.18.2",
    "title": "Appliance manual shut-off",
    "description": "A readily accessible manual shut-off valve for each appliance shall be installed in specific locations including the drop or riser, horizontal piping between drop/riser and appliance valve train, or within 50 ft (15 m) of residential appliances with proper identification."
  },
  {
    "clause": "6.18.3",
    "title": "Appliance manual shut-off exception",
    "description": "The requirements for an individual manual shut-off valve specified in Clause 6.18.2 may be waived when a readily accessible single manual shut-off valve is installed for commercial cooking appliances manifolded in line or common supply piping to direct-vent room heaters in dwelling units within 50 ft (15 m)."
  },
  {
    "clause": "6.18.4",
    "title": "Type and size",
    "description": "A readily accessible manual shut-off valve shall be of either the ball, eccentric, or lubricated-plug-type where the piping is larger than NPS 1, tubing is 1 in (25.4 mm) OD or larger, or pressure exceeds 0.5 psig (3.5 kPa)."
  },
  {
    "clause": "6.18.5",
    "title": "Several piping systems",
    "description": "When a shut-off valve controls several piping systems, it shall be readily accessible for operation at all times, provided with an installed handle, installed to provide protection from damage, and clearly marked with permanent tags for identification."
  },
  {
    "clause": "6.18.6",
    "title": "Spring-loaded valve",
    "description": "A spring-loaded valve shall be installed in a manner that will prevent its plug from being accidentally lifted off the valve seat."
  },
  {
    "clause": "6.18.7",
    "title": "Quick-disconnect",
    "description": "A quick-disconnect device shall not be substituted for a manual shut-off valve."
  },
  {
    "clause": "6.18.8",
    "title": "Adjoining buildings",
    "description": "Piping or tubing that extends from one building to another shall have a shut-off valve at the point of exit from the first building and one at the point of entry to the adjoining building."
  },
  {
    "clause": "6.18.9",
    "title": "Propane",
    "description": "Where propane is distributed from a storage tank to more than one riser by an underground system, a valve shall be installed on each riser."
  },
  {
    "clause": "6.18.10",
    "title": "Underground propane storage tank",
    "description": "Where a building is supplied from an underground propane storage tank, a manual gas shutoff valve shall be installed and readily accessible in the gas supply piping system or riser before it enters the building(s). It shall be identified with a prominent sign with red lettering minimum 1 in (25 mm) high on white background."
  },
  {
    "clause": "6.18.11",
    "title": "Classroom, laboratory, or similar facility",
    "description": "When multiple outlets are installed in a classroom, laboratory, or similar facility, they shall be controlled by a clearly identified master shut-off valve in a readily accessible location within that room."
  },
  {
    "clause": "6.18.12",
    "title": "Classroom, laboratory, or similar facility out of service",
    "description": "When a facility as described in Clause 6.18.11 is taken out of service, the supply of gas to the facility shall be either plugged or capped."
  },
  {
    "clause": "6.19",
    "title": "Manual-reset valves",
    "description": "A safety control device external to a piping system shall include an automatic valve of the manual-reset type to shut off the gas supply."
  },
  {
    "clause": "6.20",
    "title": "Gas hose and fittings",
    "description": "General section covering gas hose and fitting requirements."
  },
  {
    "clause": "6.20.1",
    "title": "Vented appliance",
    "description": "Except as required in Clause 7.23.3, a gas hose connection to a vented appliance shall be prohibited."
  },
  {
    "clause": "6.20.2",
    "title": "Vibration",
    "description": "A gas hose may be used with an unvented appliance when such an appliance is mobile during operation, is portable, or requires isolation from vibration."
  },
  {
    "clause": "6.20.3",
    "title": "Installation",
    "description": "Detailed requirements for gas hose installation including length limitations, temperature restrictions, protection requirements, and specific provisions for different applications including permanent installation (10 ft max), portable appliances (30 ft max), construction heaters (15-75 ft), and cutting/welding equipment (100 ft max)."
  },
  {
    "clause": "6.20.4",
    "title": "Replacement",
    "description": "When a sign of wear, deterioration, or other damage is apparent in the reinforcement material of a gas hose, the gas hose shall be replaced immediately."
  },
  {
    "clause": "6.20.5",
    "title": "Metallic gas hose",
    "description": "A metallic gas hose may be used in commercial, industrial, or process applications when vibration, expansion, contraction, or other circumstances warrant its use. It shall not be used in concealed locations, shall not extend between rooms or pass through walls/partitions/ceilings/floors, requires upstream shut-off valve, and must comply with CGA CR96-001 or ANSI/CAN/UL 536."
  },
  {
    "clause": "6.20.6",
    "title": "Interconnected equipment",
    "description": "When tanks or pieces of equipment are interconnected, provisions shall be made to compensate for vibration and differential settling of the tanks, equipment, and interconnecting piping. Where a gas hose is used for this purpose, it shall be a metallic gas hose complying with ANSI/CAN/UL 536 or a Type II or Type III gas hose complying with CSA 8.1."
  },
  {
    "clause": "6.20.7",
    "title": "Transferring liquid propane",
    "description": "When a gas hose is used for transferring liquid propane from one container to another, the gas hose shall be protected by a hydrostatic relief valve located between the shut-off valves on the gas hose."
  },
  {
    "clause": "6.20.8",
    "title": "Propane applications",
    "description": "In propane applications, a gas hose shall not be run from a tank and/or vapourizer that is installed outdoors to an appliance located within a building, except where the gas hose connects to an appliance used for temporary construction-heating purposes."
  },
  {
    "clause": "6.21",
    "title": "Gas connectors",
    "description": "Requirements for gas connectors including certification, installation, and various applications."
  },
  {
    "clause": "6.21.1",
    "title": "Certification for gas connectors",
    "description": "A gas connector shall be certified to CSA/ANSI 221.24/CSA 6.10, ANSI 221.69/CSA 6.16, ANSI 221.75/CSA 6.27, CSA/ANSI Z21.54/CSA8.4, or CSA/ANSI 221.101/CSA 8.5."
  },
  {
    "clause": "6.21.2",
    "title": "Installation for gas connectors",
    "description": "A gas connector shall be protected from damage, not pass through a wall, floor, ceiling, or partition, be connected to rigid piping or tubing located in the same area as the appliance, and comply with Clauses 4.5.2 and 4.9.1."
  },
  {
    "clause": "6.21.3",
    "title": "Corrugated metal gas connector",
    "description": "Except as specified in Clause 7.23.3, a corrugated metal gas connector certified to CSA/ANSI 221.24/CSA 6.10 may be used to connect ranges, refrigerators, clothes dryers, built-in counter appliances (max 6 ft), suspended appliances (max 2 ft), or decorative appliances, room heaters, or direct-vent wall furnaces (max 2 ft unless free-standing)."
  },
  {
    "clause": "6.21.4",
    "title": "Additional application",
    "description": "A gas connector certified to ANSI 221.101/CSA 8.5 may be used to connect an appliance such as a range, refrigerator, or clothes dryer to the building piping."
  },
  {
    "clause": "6.21.5",
    "title": "Large gas utilization equipment",
    "description": "Commercial cooking appliances certified for use with casters or otherwise subject to movement during cleaning and other large gas utilization equipment that can be moved shall be connected by a gas connector that is certified to either ANSI 221.69/CSA 6.16 or CSA/ANSI 221.101/CSA 8.5."
  },
  {
    "clause": "6.21.6",
    "title": "Commercial cooking appliance",
    "description": "When the gas connector described in Clause 6.21.5 is used with a commercial cooking appliance installed on wheels or rollers, a noncombustible restraining device shall be provided to protect the gas connector, and the installation shall be in accordance with Clause 7.32.4."
  },
  {
    "clause": "6.21.7",
    "title": "Vented appliance",
    "description": "A gas connector not exceeding 2 ft (600 mm) may be used on a vented appliance, such as a freestanding space heater, provided that the appliance is secured to prevent dislodgement of the vent."
  },
  {
    "clause": "6.21.8",
    "title": "Outdoor gas appliance and manufactured homes",
    "description": "A gas connector certified to ANSI 221.75/CSA 6.27 may be used to connect an appliance for outdoor use that is not frequently moved after installation, or a mobile home that is not installed on a permanent foundation. These connectors are not intended for use with wheeled, caster mounted, or portable appliances."
  },
  {
    "clause": "6.21.9",
    "title": "Portable outdoor appliances",
    "description": "A gas connector certified to CSA/ANSI 221.54/CSA 8.4 may be used to connect a portable outdoor appliance in an unconcealed space."
  },
  {
    "clause": "6.22",
    "title": "Testing of piping, tubing, hose, and fittings",
    "description": "Requirements for testing gas piping systems including pressure testing, duration requirements, and procedures."
  },
  {
    "clause": "6.22.1",
    "title": "Requirements",
    "description": "The source of test pressure shall be isolated while the piping or tubing system is under test, and the system shall retain the test pressure for the minimum duration required in Table 6.3 without showing any drop in pressure."
  },
  {
    "clause": "6.22.2",
    "title": "Before connection requirements",
    "description": "Before an appliance is connected to, and before fuel gas is introduced to, a new gas piping system or a replacement, modification, or addition to an in-service gas piping system, the new, replacement, or modified gas piping system not yet introduced to the fuel gas shall be pressure tested using either air, inert gas, or carbon dioxide according to specific procedures and Table 6.3 requirements."
  },
  {
    "clause": "6.22.3",
    "title": "After connection requirements",
    "description": "Before an appliance is first activated after its installation or after gas is reintroduced to part or all of a gas piping system after an interruption of service, one or more valves shall be selected to isolate the necessary portion of the gas piping system and all of the gas piping system downstream of these valves, through to the inlet of the appliance's valve train, shall be tested for leakage in a specific manner including a 10-minute duration test."
  },
  {
    "clause": "6.22.4",
    "title": "Valve train leak test",
    "description": "Subsequent to a leak test prescribed in Clause 6.22.3, each appliance connection, valve, valve train, and system component shall be checked for leaks at the threaded or flanged connection to gas piping, tubing, or hose, while under normal operating pressure with either a liquid solution or a leak-detection device."
  },
  {
    "clause": "6.22.5",
    "title": "Addition to existing piping or tubing",
    "description": "An addition to an existing piping or tubing system shall be tested as an individual system in accordance with Clause 6.22 except for specific conditions regarding additions 20 ft or less in length and welded tie-ins."
  },
  {
    "clause": "6.22.6",
    "title": "Enclosed or concealed systems",
    "description": "When any part of a piping or tubing system is to be enclosed or concealed, the tests specified in Clause 6.22.2 shall precede the work of closing in."
  },
  {
    "clause": "6.23",
    "title": "Purging of gas piping systems",
    "description": "Requirements for purging gas piping systems to the outdoors using approved engineering practices."
  },
  {
    "clause": "6.23.1",
    "title": "Purging outdoors",
    "description": "A gas piping system shall be purged to the outdoors using approved engineering practices or in accordance with Clauses 6.23.2 through 6.23.4 where the gas pressure is greater than 2 psig (14 kPa) or the system contains sections meeting the size and length criteria described in Table 6.4."
  },
  {
    "clause": "6.23.2",
    "title": "Containing air",
    "description": "When a gas piping system meeting the description of Table 6.4 and containing air is placed in service, it shall be first purged with an inert gas and then purged with fuel gas in accordance with Clause 6.23.4."
  },
  {
    "clause": "6.23.3",
    "title": "Removal of existing gas piping system",
    "description": "Where an existing gas piping system is removed from service for the purpose of repair, alteration, or abandonment, the section that is opened shall be isolated from the gas supply and the line purged in accordance with Clause 6.23.4. Where the piping, tubing, or gas hose meets the description of Table 6.4, the residual fuel gas shall be purged with an inert gas."
  },
  {
    "clause": "6.23.4",
    "title": "Purge discharging and operations",
    "description": "The open end of a gas piping system being purged shall be discharged directly to an outdoor location. Purging operations shall comply with specific requirements including continuous attendance by a qualified person, direct control via quarter-turn shut-off valve within 5 ft of open end, monitoring with combustible gas indicator, proper distances from ignition sources and buildings, and maintenance of continuously burning flame during fuel gas introduction."
  },
  {
    "clause": "6.23.5",
    "title": "Flaring",
    "description": "When flaring is used to purge a gas piping system, an approved purge burner shall be used."
  },
  {
    "clause": "6.23.6",
    "title": "Additional purging conditions",
    "description": "A gas piping system not meeting the conditions specified in Clause 6.23.1 may be purged either to the outdoors in accordance with Clause 6.23.4, to the indoors in accordance with Clause 6.23.7, or in accordance with good engineering practice."
  },
  {
    "clause": "6.23.7",
    "title": "Purging indoors",
    "description": "When the conditions in Clause 6.23.6 allow it, a gas piping system shall be purged in an indoor space only in accordance with specific options: igniting gas at an appliance with input rating up to 400,000 Btu/h with readily accessible burner not in combustion chamber, or for appliances not equipped with continuous pilot, following procedures in Annex. Open discharge points must be continuously attended and monitored with combustible gas indicator."
  },
  {
    "clause": "6.23.8",
    "title": "Appliance purging",
    "description": "When all gas piping systems have been purged and placed in service, the appliance or equipment piping shall be purged prior to being placed in service and the pilot lighted."
  },
  {
    "clause": "6.24",
    "title": "Purging gas from a piping or tubing system",
    "description": "Carbon dioxide or nitrogen, or a mixture of these, or air shall be used when purging gas from a piping or tubing system for the purpose of repair, alteration, or abandonment. The applicable procedures in Clause 6.23 shall apply."
  },
  {
    "clause": "6.25",
    "title": "Rooftop gas piping systems",
    "description": "Requirements for gas piping systems installed on rooftops including support, expansion, and flexibility considerations."
  },
  {
    "clause": "6.25.1",
    "title": "Piping support",
    "description": "Piping on a rooftop may be supported with treated wood blocks or material having characteristics at least equivalent to treated wood blocks and protection against outdoor exposure. Support spacing of piping NPS 1 and greater shall comply with specified tables and support shall be provided for every fitting. Piping less than NPS 1 shall be supported vertically according to tables and horizontally every 4 ft (1.2 m)."
  },
  {
    "clause": "6.25.2",
    "title": "Tubing support",
    "description": "The support spacing on a rooftop for all tubing shall be supported vertically according to Table 6.2 and continuously with treated wood and planks when it is laid horizontally."
  },
  {
    "clause": "6.25.3",
    "title": "Expansion and flexibility",
    "description": "Piping and tubing shall be installed in accordance with Clauses 6.16.1 and 6.16.3, and means for expansion shall be provided."
  },
  {
    "clause": "6.26",
    "title": "Inspection",
    "description": "Requirements for inspection of plastic piping and tubing systems."
  },
  {
    "clause": "6.26.1",
    "title": "Plastic piping and tubing",
    "description": "Plastic piping and tubing shall be inspected before and after installation for defects such as cuts, scratches, and gouges. Damaged cylindrical pieces shall be cut out and replaced. Inspection shall be adequate to confirm that sound joints have been made."
  },
  {
    "clause": "6.26.2",
    "title": "Plastic piping and tubing joints",
    "description": "Joints in plastic piping and tubing shall be visually checked for evidence of poor bonding. Where inspection reveals defective joints, they shall be cut out and replaced."
  },
  {
    "clause": "6.27",
    "title": "Highway vehicles, recreational vehicles, mobile outdoor food service units, wash-mobiles, and mobile homes",
    "description": "Special requirements for gas installations in mobile applications and vehicles."
  },
  {
    "clause": "6.27.1",
    "title": "Hose connector",
    "description": "A hose connector rated at not less than 350 psig (2500 kPa) shall be provided between the cylinder valve outlet and the inlet of the regulator when the regulator is rigidly mounted on a support bracket, or between the regulator outlet and the main propane piping or tubing when the regulator is rigidly fixed to the cylinder valve outlet."
  },
  {
    "clause": "6.27.2",
    "title": "Propane piping",
    "description": "A propane line supplying a furnace in a mobile home may be routed through a combustion air or outdoor air make-up opening in the furnace base, provided that the propane piping through the furnace base consists of a single piece and any connection to this piping is made above the level of the top of the furnace base and below the lowest level of the floor or furnace base extension."
  },
  {
    "clause": "6.27.3",
    "title": "Shut-off valve",
    "description": "An individual shut-off valve shall not be required for each appliance in a recreational vehicle."
  },
  {
    "clause": "6.27.4",
    "title": "Hose",
    "description": "Hose shall not be used in lieu of piping or tubing but may be used in conjunction with piping or tubing."
  },
  {
    "clause": "6.27.5",
    "title": "Connections",
    "description": "Except for the final connection of piping, tubing, or hose to an appliance or for connection to a valve as described in Clause 4.19.2, there shall be no connections in the piping or tubing within a vehicle. This requirement does not apply to the piping systems installed at the factory and certified in accordance with CSA Z240 RV."
  },
 {
    "clause": "7.1",
    "title": "Boilers",
    "description": "General requirements for boiler installation including provincial compliance, location requirements, and clearances."
  },
  {
    "clause": "7.1.1",
    "title": "Provincial requirement",
    "description": "A boiler shall conform to the requirements of the provincial boiler and pressure vessel regulations as applicable."
  },
  {
    "clause": "7.1.2",
    "title": "Installation location",
    "description": "A boiler shall be installed on a firm and level base and noncombustible floor or support, with specific exceptions for certified installations."
  },
  {
    "clause": "7.1.3",
    "title": "Clearances",
    "description": "Minimum clearances from combustible material: vertical - 18 in (450 mm), sides and rear - 18 in (450 mm), front - 48 in (1200 mm)."
  },
  {
    "clause": "7.2",
    "title": "Generators, compressors/pressure boosters, engines, and turbines",
    "description": "General requirements for installation of generators, compressors, pressure boosters, engines, and turbines."
  },
  {
    "clause": "7.2.1",
    "title": "General requirements",
    "description": "Overall installation requirements including certification, access, venting, housing, foundation, and protection requirements."
  },
  {
    "clause": "7.2.1.1",
    "title": "Certification body acceptance",
    "description": "Installation shall comply with this Code, applicable Standards, manufacturer's instructions, and local requirements including fire regulations, building codes, and zoning requirements."
  },
  {
    "clause": "7.2.1.2",
    "title": "Installation access",
    "description": "Appliances shall be installed such that all service, maintenance, inspection, and repair as required by the manufacturer can be accomplished."
  },
  {
    "clause": "7.2.1.3",
    "title": "Venting and air minimum requirements",
    "description": "Venting and air-supply requirements shall be provided in accordance with applicable clauses or designed per manufacturer's instructions, with ventilation openings arranged to minimize short-circuiting."
  },
  {
    "clause": "7.2.1.4",
    "title": "Housing codes",
    "description": "Rooms or enclosures housing appliances shall be constructed in accordance with national or local building codes."
  },
  {
    "clause": "7.2.1.5",
    "title": "Housing ventilation",
    "description": "Rooms or structures housing appliances shall have ventilation designed to minimize the possibility of hazardous accumulation of flammable vapours or gases."
  },
  {
    "clause": "7.2.1.6",
    "title": "Foundation and framework",
    "description": "Appliances shall be installed on a firm level foundation, set on a suitable framework supplied by the manufacturer, or field fabricated per manufacturer's instructions."
  },
  {
    "clause": "7.2.1.7",
    "title": "Rooftop installation",
    "description": "Appliances located on rooftops shall comply with specific clauses and provisions shall be made for oil spill containment."
  },
  {
    "clause": "7.2.1.8",
    "title": "Installation protection",
    "description": "Installation shall be protected by approved means against impact, ice build-up, flooding, and blockage of ventilation."
  },
  {
    "clause": "7.2.1.9",
    "title": "Installation protection",
    "description": "Ventilation shall be interconnected with a gas detector that activates at gas detection levels at one-fifth of the lower limit of flammability, produces audible and visual alarms, and is interlocked with ventilation and appliance shutdown."
  },
  {
    "clause": "7.2.2",
    "title": "Compressors/pressure boosters",
    "description": "Specific requirements for compressor and pressure booster installation including compliance, ventilation, and installation requirements."
  },
  {
    "clause": "7.2.2.1",
    "title": "Compliance and approval",
    "description": "A compressor/pressure booster shall comply with Clause 17.2 of CSA B149.3 and shall be approved by the authority having jurisdiction."
  },
  {
    "clause": "7.2.2.2",
    "title": "Ventilation",
    "description": "Ventilation air shall be provided to the space occupied by a pressure booster to prevent any accumulation of gas in the event that leakage occurs."
  },
  {
    "clause": "7.2.2.3",
    "title": "Installation requirements",
    "description": "Requirements for all piping, tubing, hose, compressor/pressure boosters, and components operating at outlet pressures higher than those permitted by Table 5.1."
  },
  {
    "clause": "7.2.2.4",
    "title": "Installation location",
    "description": "The compressor shall be installed outdoors unless approved and labelled for indoor installation."
  },
  {
    "clause": "7.2.2.5",
    "title": "Fittings",
    "description": "The number of fittings used in supply line, discharge line, or hose shall be minimized to reduce the possibility of leakage."
  },
  {
    "clause": "7.2.2.6",
    "title": "Discharge piping",
    "description": "The discharge piping shall be supported in accordance with manufacturer's instructions or CSA B51 requirements for pressure piping."
  },
  {
    "clause": "7.2.2.7",
    "title": "Pressure booster",
    "description": "It is not necessary to meet ventilation requirements where a hermetically sealed pressure booster is installed."
  },
  {
    "clause": "7.2.2.8",
    "title": "Pressure boosting compressors",
    "description": "Hermetically sealed compressors used for pressure boosting for burners, torches, or cylinder-filling applications shall comply with requirements and shall not have a capacity greater than 500 scf/h."
  },
  {
    "clause": "7.2.2.9",
    "title": "Cylinder filling",
    "description": "Cylinder-filling applications are covered in Clause 9."
  },
  {
    "clause": "7.2.3",
    "title": "Emergency generators",
    "description": "Requirements for emergency generator installation including independent piping, dedicated gas supply, and overpressure protection."
  },
  {
    "clause": "7.2.3.1",
    "title": "Independent piping",
    "description": "Piping serving a generator for safety purposes shall be independent of other gas supplies and provided with a manual valve with permanent sign at building entry point."
  },
  {
    "clause": "7.2.3.2",
    "title": "Dedicated gas supply",
    "description": "When gas supply to generator is required for safety purposes, supply shall be arranged so other appliances can be shut off without interrupting generator supply."
  },
  {
    "clause": "7.2.3.3",
    "title": "Overpressure protection",
    "description": "Overpressure protection device for emergency generator piping shall be either a monitoring regulator or overpressure relief device only. Overpressure shut-off devices are not permitted."
  },
  {
    "clause": "7.2.4",
    "title": "Non-motive engines and turbines",
    "description": "Requirements for non-motive engines and turbines including certification, supply piping sizing, exhaust gas piping, and venting."
  },
  {
    "clause": "7.2.4.1",
    "title": "Certification",
    "description": "An engine or turbine shall be certified to ANSI/CAN UL/ULC 2200 or comply with CSA B149.3."
  },
  {
    "clause": "7.2.4.2",
    "title": "Supply piping sizing",
    "description": "Supply piping shall be sized according to maximum rate of gas consumption and Clause 6 requirements. Normal operation considered 10,000 Btu/h per brake horsepower for 4-cycle engines and 13,000 Btu/h for 2-cycle engines."
  },
  {
    "clause": "7.2.4.3",
    "title": "Exhaust gas piping",
    "description": "Engine or turbine exhaust gases shall be piped so they can neither be trapped nor be drawn into a building through windows, doors, or other openings."
  },
  {
    "clause": "7.2.4.4",
    "title": "Venting",
    "description": "Pressure regulators and overpressure relief devices in valve train shall be vented in accordance with Clause 22, with outdoor vent terminations per Clause 5.6."
  },
  {
    "clause": "7.2.5",
    "title": "Additional requirements for gas engines and turbines in buildings",
    "description": "Additional requirements for gas engines and turbines installed within buildings including ventilation location and operation."
  },
  {
    "clause": "7.2.5.1",
    "title": "Ventilation location",
    "description": "A room containing an engine or turbine shall be ventilated at floor level for propane fuel or as close as practicable to ceiling for natural gas."
  },
  {
    "clause": "7.2.5.2",
    "title": "Ventilation operation",
    "description": "When propane-fuelled engine or turbine is installed below grade, mechanical exhaust ventilation shall be provided and operated continuously with electrical interlock to shut down engine if exhaust system fails."
  },
  {
    "clause": "7.2.5.3",
    "title": "Fire protection",
    "description": "Engine or turbine shall be installed in room with minimum 2h fire separation from remainder of building, with 1.5h fire protection rating door that is swinging automatic-closing type and gasketed on all sides."
  },
  {
    "clause": "7.2.5.4",
    "title": "Exhaust gas discharge",
    "description": "Exhaust gases shall be discharged from building to outdoors in manner that will not create fire or other hazard, with specific requirements for different exhaust gas temperatures."
  },
  {
    "clause": "7.2.5.5",
    "title": "Exhaust gas piping",
    "description": "Exhaust gases shall be piped by most direct route to outdoor location where they cannot be trapped or drawn into building, to conforming chimney, or per manufacturer's instructions."
  },
  {
    "clause": "7.2.5.6",
    "title": "Exhaust gas discharge",
    "description": "An exhaust pipe shall not discharge into a gas vent, chimney with temperature rating less than maximum exhaust gas temperature, or chimney serving another appliance."
  },
  {
    "clause": "7.2.5.7",
    "title": "Exhaust pipe termination",
    "description": "Exhaust pipe passing through combustible roof shall be insulated at point of passage by ventilated metal thimble extending 9 in above and below roof construction and 12 in larger in diameter than pipe."
  },
  {
    "clause": "7.2.5.8",
    "title": "Exhaust pipe guarding",
    "description": "Exhaust pipe passing through combustible wall or partition shall be guarded at point of passage by double-ventilated metal thimble or metal/burned fire clay thimble built into noncombustible material."
  },
  {
    "clause": "7.2.5.9",
    "title": "Exhaust piping limitations",
    "description": "Exhaust pipe shall not be installed in floor, ceiling, attic, or concealed space but may pass through such spaces if installed inside masonry or factory-built chimney of appropriate temperature rating."
  },
  {
    "clause": "7.2.5.10",
    "title": "Exhaust pipe clearances",
    "description": "Exhaust pipe shall have clearance of at least 9 in to adjacent combustible materials, except as specified in previous clauses."
  },
  {
    "clause": "7.3",
    "title": "Carbon dioxide generators",
    "description": "Requirements for carbon dioxide generator installation including certification, combustion air, and carbon dioxide production limits."
  },
  {
    "clause": "7.3.1",
    "title": "Certification",
    "description": "A generator used in a greenhouse shall be certified for the application."
  },
  {
    "clause": "7.3.2",
    "title": "Combustion air",
    "description": "A generator used in a produce storage area shall take its combustion air from outside the storage area."
  },
  {
    "clause": "7.3.3",
    "title": "Carbon dioxide production",
    "description": "Generator for CO2 production in greenhouse may take combustion air from inside when combustion rate doesn't exceed 20 Btu/h/ft³, CO2 doesn't exceed 5000 ppm, and CO doesn't exceed 35 ppm."
  },
  {
    "clause": "7.4",
    "title": "Commercial-type clothes dryers",
    "description": "Requirements for commercial clothes dryer installation including hot surface protection, clearances, and exhaust ducting."
  },
  {
    "clause": "7.4.1",
    "title": "Hot surface protection",
    "description": "A dryer used in laundromat-type installation shall be installed such that access to top of dryer is screened or otherwise protected to prevent material contact with hot surface."
  },
  {
    "clause": "7.4.2",
    "title": "Minimum clearances",
    "description": "Minimum clearances from combustible material: above - 18 in, front - 18 in, back and sides - 18 in, except where permitted by Clause 4.13.2."
  },
  {
    "clause": "7.4.3",
    "title": "Flexible exhaust ducting",
    "description": "A UL 2158A certified flexible foil noncombustible-type duct may be used as transition connection between dryer exhaust and rigid moisture duct if no requirement specified in dryer installation instructions."
  },
  {
    "clause": "7.4.4",
    "title": "Exhaust terminations",
    "description": "Dryer shall be connected to metal moisture-exhaust duct terminating outdoors not less than 3 ft from pressure regulator vent termination and not less than 10 ft from outdoor air intake."
  },
  {
    "clause": "7.4.5",
    "title": "Exhaust duct limitations",
    "description": "Moisture-exhaust duct shall not be secured with screws and shall not be connected into any vent connector, vent, or chimney."
  },
  {
    "clause": "7.4.6",
    "title": "Make-up air",
    "description": "Provision shall be made for make-up air to the area where the dryer is installed."
  },
  {
    "clause": "7.4.7",
    "title": "Exhaust duct clearances",
    "description": "Moisture-exhaust duct shall have clearance of at least 6 in to combustible material but may be installed with reduced clearance if combustible material is protected as specified in Table 4.1."
  },
  {
    "clause": "7.5",
    "title": "Domestic-type clothes dryers",
    "description": "Requirements for domestic clothes dryer installation including exhaust duct requirements, termination, and clearances."
  },
  {
    "clause": "7.5.1",
    "title": "Exhaust duct requirements",
    "description": "Dryer shall be equipped with moisture-exhaust duct terminating outside building, constructed of noncombustible material or certified as meeting Class 1 air duct requirements."
  },
  {
    "clause": "7.5.2",
    "title": "Exhaust duct termination",
    "description": "Moisture-exhaust duct shall not terminate within 3 ft in any direction of any pressure regulator vent termination or outdoor air intake."
  },
  {
    "clause": "7.5.3",
    "title": "Exhaust duct limitations",
    "description": "Moisture-exhaust duct shall not be secured with screws and shall not be connected into any vent connector, vent, or chimney."
  },
  {
    "clause": "7.5.4",
    "title": "Minimum clearances",
    "description": "Minimum clearances from combustible material: above - 6 in, front - 24 in, back and sides - 6 in, except where permitted by Clause 4.13.2."
  },
  {
    "clause": "7.6",
    "title": "Conversions",
    "description": "Requirements for converting appliances to gas operation including minimum clearances and conversion requirements."
  },
  {
    "clause": "7.6.1",
    "title": "Minimum clearances",
    "description": "Minimum clearances from combustible material for boiler or furnace converted to gas, with specific measurements for different furnace types."
  },
  {
    "clause": "7.6.2",
    "title": "Conversion requirements",
    "description": "Appliance to be converted shall be thoroughly cleaned, leak tested, and examined for serviceability. Any unserviceable parts shall be repaired or replaced."
  },
  {
    "clause": "7.6.3",
    "title": "Chimney requirements",
    "description": "When existing vented appliance is converted from solid or liquid fuel, chimney shall be examined and meet requirements of Clauses 8.12.2 to 8.12.11."
  },
  {
    "clause": "7.7",
    "title": "Conversion burners",
    "description": "Requirements for conversion burner installation including conversion requirements, mobile home applications, and flame impingement prevention."
  },
  {
    "clause": "7.7.1",
    "title": "Conversion requirements",
    "description": "A conversion burner designed by appliance manufacturer or compatible burner shall be used for conversions."
  },
  {
    "clause": "7.7.2",
    "title": "Mobile homes",
    "description": "When oil-fired furnace in mobile home is converted to gas, conversion shall be by manufacturer's certified burner conversion package or certified conversion burner meeting compatibility requirements."
  },
  {
    "clause": "7.7.3",
    "title": "Flame impingement",
    "description": "Conversion burner shall be correctly positioned and firmly secured to eliminate direct flame impingement on any surface other than flame spreader."
  },
  {
    "clause": "7.8",
    "title": "Conversion of warm air furnaces",
    "description": "Specific requirements for converting warm air furnaces to gas operation including installation limitations and bypass requirements."
  },
  {
    "clause": "7.8.1",
    "title": "Installation",
    "description": "Detailed requirements for installing natural-draft or fan-assisted burners in revertible flue furnaces, including flue collar positioning and bypass requirements."
  },
  {
    "clause": "7.8.2",
    "title": "Bypass requirements",
    "description": "Bypass shall be gas-tight and constructed of metal at least equivalent in strength and corrosion resistance to the metal from which it is extended."
  },
  {
    "clause": "7.8.3",
    "title": "Secondary heating surfaces",
    "description": "Forced-air furnace with secondary heating surface on suction side of circulating air blower shall not be converted to gas except where heating surface consists of single cylindrical flue pipe with single continuously gas-tight welded joint."
  },
  {
    "clause": "7.8.4",
    "title": "Markings",
    "description": "Warning sign with specific bilingual text and letter size requirements shall be attached to circulating air blower compartment access door of fuel converted forced-air furnace."
  },
  {
    "clause": "7.8.5",
    "title": "Flue outlet material",
    "description": "Flue outlet shall be made of material at least equivalent in strength and corrosion resistance to No. 24 GSG galvanized steel."
  },
  {
    "clause": "7.8.6",
    "title": "Temperature limits",
    "description": "Automatically controlled gravity or forced-air furnace shall be equipped with high-temperature limit control with maximum setting of 350°F for gravity furnace and 250°F for forced-air furnace."
  },
  {
    "clause": "7.9",
    "title": "Conversion of ranges",
    "description": "Requirements for converting ranges to gas operation including control valve access, burner location, and draft regulator."
  },
  {
    "clause": "7.9.1",
    "title": "Control valve access",
    "description": "Range burner with control valve located at rear of range shall not be installed unless such valve is readily accessible."
  },
  {
    "clause": "7.9.2",
    "title": "Burner location",
    "description": "Burner shall be located so that proper flame characteristics are maintained at all times."
  },
  {
    "clause": "7.9.3",
    "title": "Draft regulator",
    "description": "Manually operated damper shall be replaced with draft regulator, and vent size may be reduced to minimum of 4 in."
  },
  {
    "clause": "7.10",
    "title": "Counter appliances",
    "description": "Minimum clearance requirements for counter appliances from combustible material."
  },
  {
    "clause": "7.11",
    "title": "Direct-vent appliances",
    "description": "Requirements for direct-vent appliance vent terminal location."
  },
  {
    "clause": "7.12",
    "title": "Furnaces used with cooling units",
    "description": "Requirements for furnace installation in conjunction with cooling units including condensate management and damper control."
  },
  {
    "clause": "7.12.1",
    "title": "Cooling coil condensate",
    "description": "When furnace is installed with refrigeration coil, arrangement shall prevent condensate from dripping onto heating surface by disposal or other means."
  },
  {
    "clause": "7.12.2",
    "title": "Parallel damper control",
    "description": "When furnace is installed parallel with refrigeration coil, damper or other means shall effectively prevent circulation of cooled air through furnace and heated air over refrigeration coil."
  },
  {
    "clause": "7.12.3",
    "title": "Furnace upstream requirements",
    "description": "When forced-air furnace is installed upstream from refrigeration coil, coil shall be designed to withstand high pressure or be equipped with suitable device to prevent excessive pressure."
  },
  {
    "clause": "7.12.4",
    "title": "Furnace downstream requirements",
    "description": "Forced-air furnace installed downstream of refrigeration coil shall be designed for such use."
  },
  {
    "clause": "7.13",
    "title": "Central furnaces",
    "description": "Requirements for central furnace installation including installation base, clearances, return air inlets, and construction heat applications."
  },
  {
    "clause": "7.13.1",
    "title": "Installation",
    "description": "Central furnace shall be installed on firm, level base and noncombustible floor or support, with exceptions for certified installations."
  },
  {
    "clause": "7.13.2",
    "title": "Minimum clearances",
    "description": "Minimum clearances from combustible material: above - 1 in, jacket sides and rear - 6 in, front - 24 in, except where permitted by Clause 4.13.2."
  },
  {
    "clause": "7.13.3",
    "title": "Return air inlets",
    "description": "Return-air inlets shall not be installed in enclosure or crawl space that provides combustion air to furnace."
  },
  {
    "clause": "7.13.4",
    "title": "Floor furnaces",
    "description": "Floor furnaces shall not be installed."
  },
  {
    "clause": "7.13.5",
    "title": "Construction heat",
    "description": "Detailed requirements for furnace used to heat residence under construction, including installation options, piping, venting, and thermostat requirements."
  },
  {
    "clause": "7.13.6",
    "title": "Return air ducting",
    "description": "Furnace return-air ducting in enclosure with spillage-susceptible appliances shall be sealed to furnace casing with sealed joints to prevent air infiltration from enclosure."
  },
  {
    "clause": "7.14",
    "title": "Downflow furnaces",
    "description": "Requirements for downflow furnace installation including marking, floor openings, and enclosure air limitations."
  },
  {
    "clause": "7.14.1",
    "title": "Marking",
    "description": "Downflow furnace marked for noncombustible floors only shall be provided with separate certified base when installed on or passing through combustible floor."
  },
  {
    "clause": "7.14.2",
    "title": "Floor openings",
    "description": "Downflow furnace shall be installed so there is not an open passage in floor through which flame or hot gases from fire in area below can travel to room above."
  },
  {
    "clause": "7.14.3",
    "title": "Enclosure air limitations",
    "description": "When downflow furnace is located in enclosure, circulating air and combustion air shall not be taken from same space."
  },
  {
    "clause": "7.15",
    "title": "Duct furnaces",
    "description": "Requirements for duct furnace installation including location, access, circulating air limitations, and control locations."
  },
  {
    "clause": "7.15.1",
    "title": "Location",
    "description": "Duct furnace shall not be installed on negative pressure side of air-circulating blower."
  },
  {
    "clause": "7.15.2",
    "title": "Duct access",
    "description": "Duct furnace shall have removable access panel located in duct connected to furnace on both upstream and downstream sides."
  },
  {
    "clause": "7.15.3",
    "title": "Circulating air limitations",
    "description": "Circulating air shall not be taken from enclosure containing duct furnace."
  },
  {
    "clause": "7.15.4",
    "title": "Control locations",
    "description": "All controls shall be located outside duct except for sensing element of control."
  },
  {
    "clause": "7.15.5",
    "title": "Structural support",
    "description": "Duct furnace shall be supported in such manner that no weight is carried by supply piping."
  },
  {
    "clause": "7.15.6",
    "title": "Minimum clearances",
    "description": "Minimum clearances from combustible material: above - 6 in, front (burner side) - 24 in, back and sides - 6 in, bottom - 6 in."
  },
  {
    "clause": "7.16",
    "title": "Horizontal furnaces",
    "description": "Requirements for horizontal furnace installation including installation options, attic space requirements, and clearances."
  },
  {
    "clause": "7.16.1",
    "title": "Installation options",
    "description": "Horizontal furnace may be installed in crawl space or suspended from floor or ceiling."
  },
  {
    "clause": "7.16.2",
    "title": "Attic space walkway",
    "description": "When horizontal furnace is installed in attic space, permanent substantial walkway shall be provided to control side of horizontal furnace."
  },
  {
    "clause": "7.16.3",
    "title": "Attic limitations",
    "description": "Horizontal furnace shall not be installed in attic space containing exposed combustible insulation or wrapping for such insulation."
  },
  {
    "clause": "7.16.4",
    "title": "Minimum clearances",
    "description": "Minimum clearances from combustible material: above - 6 in, front (burner side) - 24 in, back and sides - 6 in, bottom - 6 in."
  },
  {
    "clause": "7.17",
    "title": "Wall furnaces (recessed heaters)",
    "description": "Requirements for wall furnace installation including combustible wall approval, service access, and partition venting."
  },
  {
    "clause": "7.17.1",
    "title": "Combustible wall approval",
    "description": "Wall furnace installed in combustible wall shall be approved for such installation."
  },
  {
    "clause": "7.17.2",
    "title": "Service access",
    "description": "Panel, grille, or access door that must be removed for normal servicing shall not be attached to building."
  },
  {
    "clause": "7.17.3",
    "title": "Partition venting",
    "description": "When vent is required to be concealed in partition, Type BW vent kit shall be used."
  },
  {
    "clause": "7.18",
    "title": "Construction heaters and torches",
    "description": "Requirements for construction heater and torch installation including location, installation, clearances, and responsibilities."
  },
  {
    "clause": "7.18.1",
    "title": "Location",
    "description": "Construction heater shall be located to minimize danger of damage and upset."
  },
  {
    "clause": "7.18.2",
    "title": "Installation",
    "description": "Construction heater shall be installed on solid, level, noncombustible base or suspended per manufacturer's certified installation instructions."
  },
  {
    "clause": "7.18.3",
    "title": "Clearance to combustibles",
    "description": "Combustible material such as straw, canvas, wood, and debris shall be kept clear of construction heater per clearances specified on heater's instruction plate."
  },
  {
    "clause": "7.18.4",
    "title": "Air supply",
    "description": "When construction heater is operating, adequate air supply shall be provided."
  },
  {
    "clause": "7.18.5",
    "title": "Piping",
    "description": "Piping, tubing, hose, and fittings shall be supported, secured, and protected from damage and strain."
  },
  {
    "clause": "7.18.6",
    "title": "Temporary piping",
    "description": "When construction heater is connected to temporary piping, piping and connections shall be per Clause 6 requirements, with shut-off valve provided when branch line is in service."
  },
  {
    "clause": "7.18.7",
    "title": "Lessor responsibility",
    "description": "Lessor responsibility at delivery to ensure construction heater is approved and in safe operating condition, and lessee is instructed in safe installation and use."
  },
  {
    "clause": "7.18.8",
    "title": "User responsibility",
    "description": "User responsibility to ensure construction heater and components are installed and used per requirements, maintained by qualified installer, operated by instructed persons, and malfunctioning units removed from service."
  },
  {
    "clause": "7.18.9",
    "title": "Installation limitations",
    "description": "Construction heater shall only be installed in building under construction, repair, or improvement and not be installed in any inhabited dwelling unit or inhabited sections of building."
  },
  {
    "clause": "7.18.10",
    "title": "Torch attendance",
    "description": "A torch intended for manual operation shall not be left unattended while in operation."
  },
  {
    "clause": "7.19",
    "title": "Direct-fired door air heaters",
    "description": "Requirements for direct-fired door air heaters that were certified to CAN1-3.12 or earlier editions."
  },
  {
    "clause": "7.19.1",
    "title": "Installation references",
    "description": "Direct-fired door air heater shall be installed in accordance with requirements of Clauses 7.20.7 to 7.20.11."
  },
  {
    "clause": "7.19.2",
    "title": "Interlocking",
    "description": "Direct-fired door air heater shall be interlocked with associated door so heater can operate only when door is at least 80% open or at least 15% open with interlocked time relay proving 80% open within 60s."
  },
  {
    "clause": "7.19.3",
    "title": "Heated air direction",
    "description": "Heated air and combustion products from direct-fired door air heater shall be directed outdoors."
  },
  {
    "clause": "7.19.4",
    "title": "Installation references",
    "description": "Combination direct-fired make-up air heater for use in doorway shall be installed in accordance with Clauses 7.19 and 7.20."
  },
  {
    "clause": "7.20",
    "title": "Direct-fired make-up air heaters (DFMAH)",
    "description": "Requirements for DFMAHs that were certified to CGA 3.7 or CAN1-3.7 or earlier editions."
  },
  {
    "clause": "7.20.1",
    "title": "Exhaust requirements",
    "description": "DFMAH shall not be installed unless it is necessary to exhaust inside air and replace it with preheated air, except as specified in certain clauses."
  },
  {
    "clause": "7.20.2",
    "title": "Sleeping areas",
    "description": "DFMAH shall not supply make-up air to area where sleeping accommodation is provided."
  },
  {
    "clause": "7.20.3",
    "title": "Exhaust air balance",
    "description": "DFMAH shall have air discharge capacity not exceeding total exhaust system discharge capacity by more than 10% and be interlocked to prevent operation unless exhaust system is functioning."
  },
  {
    "clause": "7.20.4",
    "title": "System air balance",
    "description": "Total air replacement of installation in spray booth shall not exceed total exhaust capacity of booth."
  },
  {
    "clause": "7.20.5",
    "title": "Mine shafts",
    "description": "DFMAH installed in or ducted to mine shaft with adequate exhaust opening need not comply with Clause 7.20.3."
  },
  {
    "clause": "7.20.6",
    "title": "Interlocking",
    "description": "When exhaust system can affect satisfactory venting of other gas appliances, DFMAH shall have exhaust system interlocked to function only when DFMAH blower is operating."
  },
  {
    "clause": "7.20.7",
    "title": "Outside air",
    "description": "All air handled by DFMAH shall be brought directly from outdoors, except primary combustion air not exceeding 0.5% of total air handled may be taken from inside building."
  },
  {
    "clause": "7.20.8",
    "title": "Automatic louvre interlocking",
    "description": "Automatically operated louvres for inlet or discharge air shall have louvres interlocked to ensure maximum designed opening prior to DFMAH start-up."
  },
  {
    "clause": "7.20.9",
    "title": "Intake location",
    "description": "Outdoor intake of DFMAH shall be located not less than 20 ft horizontally from vertical plane in which combustible gas, vapour, or dust is present."
  },
  {
    "clause": "7.20.10",
    "title": "Clearance to combustibles",
    "description": "DFMAH shall be installed with clearance from combustible material of not less than that marked on rating plate."
  },
  {
    "clause": "7.20.11",
    "title": "Duct trapping",
    "description": "Supply or discharge ducting in which accumulations of gas or combustion products can be trapped shall not be attached to DFMAH."
  },
  {
    "clause": "7.20.12",
    "title": "Elevator shaft or stairwell",
    "description": "DFMAH for ventilating or pressurizing elevator shaft or stairwell shall be activated only by fire alarm system and equipped with normally open momentary manual switch for testing."
  },
  {
    "clause": "7.20.13",
    "title": "CO Sensing",
    "description": "When DFMAH for storage garage ventilation is solely actuated by carbon monoxide sensor, shall be installed with normally open momentary manual switch for testing."
  },
  {
    "clause": "7.20.14",
    "title": "Kitchens",
    "description": "When DFMAH is installed in or ducted to kitchen, specific interlocking and airflow capacity requirements apply based on interconnection between food preparation area and public area."
  },
  {
    "clause": "7.21",
    "title": "Non-recirculating and recirculating direct gas-fired industrial air heaters (DFIAH)",
    "description": "Requirements for DFIAH installation in industrial buildings with specific functionality and operational requirements."
  },
  {
    "clause": "7.21.1",
    "title": "Installation limitations",
    "description": "DFIAH shall be installed only in industrial buildings, except as specified in certain clauses."
  },
  {
    "clause": "7.21.2",
    "title": "Sleeping areas",
    "description": "DFIAH shall not supply air to area where sleeping accommodation is provided."
  },
  {
    "clause": "7.21.3",
    "title": "Functionality references",
    "description": "DFIAH may be used as door air heater, make-up air heater, or space heater, with requirements superseding those of previous clauses when used in these applications."
  },
  {
    "clause": "7.21.4",
    "title": "Clearance to combustibles",
    "description": "DFIAH shall be installed with clearance from combustible material not less than that marked on rating plate."
  },
  {
    "clause": "7.21.5",
    "title": "Supply air",
    "description": "Non-recirculating DFIAH supply air shall be ducted directly from outdoors. Recirculating DFIAH may use combination of outdoor and return air with minimum ventilation rate as indicated on rating plate."
  },
  {
    "clause": "7.21.6",
    "title": "Duct purge",
    "description": "Inlet ducting, when used, shall be purged with at least four air changes prior to ignition attempt."
  },
  {
    "clause": "7.21.7",
    "title": "Damper interlocks",
    "description": "Outside air dampers or closing louvres not certified as integral part of appliance shall be interlocked so main burners do not operate until air dampers are fully open."
  },
  {
    "clause": "7.21.8",
    "title": "Exhaust options and exfiltration",
    "description": "Installation design shall include adequate provisions to permit DFIAH to operate at rated capacity, taking into account structure's designed exfiltration rate by providing properly designed relief openings or interlocked powered exhaust system."
  },
  {
    "clause": "7.21.9",
    "title": "Exhaust interlocking",
    "description": "When DFIAH is interlocked with powered exhaust system, specific startup, airflow proving, and operation requirements apply, including matching airflow capacity for VAV systems."
  },
  {
    "clause": "7.21.10",
    "title": "Intake location",
    "description": "Outdoor air intake of DFIAH shall be located not less than 20 ft horizontally from vertical plane in which combustible gas, vapour, or dust is present."
  },
  {
    "clause": "7.21.11",
    "title": "Fire alarm",
    "description": "DFIAH for ventilating or pressurizing elevator shaft or stairwell shall be non-recirculating type, activated only by fire alarm system, and equipped with normally open momentary manual switch for testing."
  },
  {
    "clause": "7.21.12",
    "title": "Storage garages",
    "description": "DFIAH for storage garage ventilation solely actuated by carbon monoxide sensor shall be installed with normally open momentary manual switch for testing and provide adequate outside air to positively pressurize storage space."
  },
  {
    "clause": "7.21.13",
    "title": "Kitchens",
    "description": "When DFIAH is installed in or ducted to kitchen, specific interlocking and airflow capacity requirements apply based on interconnection between food preparation area and public area."
  },
  {
    "clause": "7.22",
    "title": "Direct gas-fired process air heaters (DFPAH)",
    "description": "Requirements for DFPAH installation in industrial buildings with ventilation and process operating modes."
  },
  {
    "clause": "7.22.1",
    "title": "Location",
    "description": "DFPAH shall be installed only in industrial buildings."
  },
  {
    "clause": "7.22.2",
    "title": "Sleeping areas",
    "description": "DFPAH shall not supply air to area where sleeping accommodation is provided."
  },
  {
    "clause": "7.22.3",
    "title": "Standard reference",
    "description": "DFPAH shall be certified to be in compliance with ANSI Z83.25/CSA 3.19."
  },
  {
    "clause": "7.22.4",
    "title": "Clearance to combustibles",
    "description": "DFPAH shall be installed with clearance from combustible material not less than that marked on rating plate."
  },
  {
    "clause": "7.22.5",
    "title": "Operating modes",
    "description": "DFPAH can have two operating modes: ventilation (space can be occupied, make-up supply air ducted directly from outdoors) and process (space shall not be occupied, recirculation of air allowed)."
  },
  {
    "clause": "7.22.6",
    "title": "Exhaust and relief - Ventilation mode",
    "description": "Design and installation requirements for ventilation mode including adequate provisions for rated capacity operation, exfiltration considerations, and relief opening specifications."
  },
  {
    "clause": "7.22.7",
    "title": "Exhaust and relief - Process mode",
    "description": "Design and installation requirements for process mode including adequate provisions for non-recirculating airflow, ducted relief openings, and powered exhaust limitations."
  },
  {
    "clause": "7.22.8",
    "title": "Spray area exhaust interlocking",
    "description": "For spray area installation, interlocked exhaust system shall be utilized to exhaust ventilation air supply in ventilation mode and outside air supply in process mode."
  },
  {
    "clause": "7.22.9",
    "title": "Spray booth mode",
    "description": "In spray booth application, interlock shall be provided to lock out spraying equipment unless DFPAH is operated in ventilation mode."
  },
  {
    "clause": "7.22.10",
    "title": "Duct purge",
    "description": "In spray booth application, inlet ducting when used shall be purged with at least four air changes prior to ignition attempt."
  },
  {
    "clause": "7.22.11",
    "title": "Process mode",
    "description": "In DFPAH application with process mode, interlock shall be provided to lockout spray area lighting and spraying equipment while in process mode."
  },
  {
    "clause": "7.22.12",
    "title": "Ventilation mode purge",
    "description": "Interlock shall ensure DFPAH is operated in ventilation mode for minimum of 3 min or minimum of four air changes of enclosure volume including inlet ducting at start of process."
  },
  {
    "clause": "7.22.13",
    "title": "Access interlocking",
    "description": "For space served by DFPAH operating in process mode, interlock for access points shall immediately shut down process mode if entry is made, with specific warning markings required."
  },
  {
    "clause": "7.22.14",
    "title": "Post process purge",
    "description": "In process applications intended to be entered by personnel following process mode operation, controls shall include post-purge timer to purge contaminants and cool products."
  },
  {
    "clause": "7.22.15",
    "title": "Remote interlocking",
    "description": "Outside air dampers or closing louvres not certified as integral part of appliance shall be interlocked so main burners do not operate until air dampers are fully open."
  },
  {
    "clause": "7.22.16",
    "title": "Air intake location",
    "description": "Outdoor air intake of DFPAH shall be located not less than 20 ft horizontally from vertical plane with combustible gas, vapour, or dust, except for DFPAH serving spray area with specific interlocking."
  },
  {
    "clause": "7.22.17",
    "title": "Process minimum ventilation",
    "description": "In process mode, DFPAH that recirculates process area air must provide minimum ventilation airflow for complete combustion plus allowance to dilute VOCs to maintain LEL below 25% threshold."
  },
  {
    "clause": "7.22.18",
    "title": "Inspection and maintenance",
    "description": "In spray applications or applications with flammable airborne particulate matter, duct system shall be provided with access means for inspection, maintenance, cleaning, and fire protection devices, with suitable filters installed."
  },
  {
    "clause": "7.23",
    "title": "Infrared heaters",
    "description": "Requirements for infrared heater installation including unvented and vented installation requirements, vehicle applications, and aircraft area restrictions."
  },
  {
    "clause": "7.23.1",
    "title": "Unvented installation requirements",
    "description": "Unvented infrared heaters shall be protected against physical damage, comply with specified clauses, not be installed in residential or care/detention buildings, and meet ventilation requirements including mechanical ventilation specifications."
  },
  {
    "clause": "7.23.2",
    "title": "CO2 detection",
    "description": "Where heaters cannot be interlocked due to use of portable infrared heaters, ventilation system shall be connected to carbon dioxide monitor with audible and visual alarm."
  },
  {
    "clause": "7.23.3",
    "title": "Vented installation requirements",
    "description": "Vented infrared heaters shall be installed per certified markings and manufacturer's instructions, protected against physical damage, with tube-type heaters connected only with certified Type I gas hose of specified length."
  },
  {
    "clause": "7.23.4",
    "title": "Vehicles",
    "description": "When infrared heater is installed in garage or car wash area where vehicles can be exposed to radiant heat, specific clearance and interlock requirements apply to maintain minimum specified clearances."
  },
  {
    "clause": "7.23.5",
    "title": "Aircraft repair areas",
    "description": "When infrared heater is installed in repair or shop area communicating with aircraft hangar, minimum clearance from floor to infrared heater shall be 8 ft."
  },
  {
    "clause": "7.23.6",
    "title": "Aircraft hangers",
    "description": "Infrared heater shall not be located in area of aircraft hangar where it can be subjected to physical damage by aircraft, cranes, movable scaffolding, or other objects."
  },
  {
    "clause": "7.23.7",
    "title": "Garages",
    "description": "Where infrared heater is installed in garage and clearance from combustible material cannot be maintained when vehicle is raised on hoist, electrical interlock shall shut off burner until required clearance is re-established."
  },
  {
    "clause": "7.24",
    "title": "Room heaters",
    "description": "Requirements for room heater installation including bathroom heaters, fireplace installation, venting, and clearance requirements."
  },
  {
    "clause": "7.24.1",
    "title": "Bathroom heaters",
    "description": "Room heater in bathroom shall be of direct-vent type."
  },
  {
    "clause": "7.24.2",
    "title": "Fireplace installation",
    "description": "Room heater installed in fireplace shall be designed for fireplace installation and marked for use in noncombustible fireplaces, with installation complying with local building code or National Building Code of Canada."
  },
  {
    "clause": "7.24.3",
    "title": "Venting",
    "description": "Products of combustion from radiant-type room heater shall enter either a vent or chimney."
  },
  {
    "clause": "7.24.4",
    "title": "Fireplace damper",
    "description": "When radiant-type room heater is installed in fireplace with manual damper, permanent stop shall be provided on damper control to prevent complete closure of flue outlet."
  },
  {
    "clause": "7.24.5",
    "title": "Sleeping or public area installation",
    "description": "Room heater installed in sleeping accommodation or public area shall be automatic temperature-controlled type, equipped with pressure regulator, have 100% safety shut-off control, and be vented."
  },
  {
    "clause": "7.24.6",
    "title": "General Installation",
    "description": "Room heater shall be placed so as not to cause hazard to wall, floor, curtain, furniture, or door when open, or hinder free movement of persons."
  },
  {
    "clause": "7.24.7",
    "title": "Circulating type minimum clearances",
    "description": "Free-standing circulating-type room heater minimum clearances from combustible material: above - 36 in, front - 24 in, back and sides - 6 in."
  },
  {
    "clause": "7.24.8",
    "title": "Radiant type minimum clearances",
    "description": "Free-standing radiant-type room heater minimum clearances from combustible material: above - 36 in, front - 24 in, back and sides - 6 in."
  },
  {
    "clause": "7.25",
    "title": "Decorative appliances and gas logs",
    "description": "Requirements for decorative appliance and gas log installation including manufacturer instructions, fireplace installation, and venting."
  },
  {
    "clause": "7.25.1",
    "title": "Manufacture instructions",
    "description": "Decorative appliances and gas logs shall be installed in accordance with manufacturer's certified installation instructions."
  },
  {
    "clause": "7.25.2",
    "title": "Fireplace installation",
    "description": "Decorative appliance installed in fireplace shall be designed for fireplace installation and marked for use in noncombustible fireplaces, with installation complying with local building code or National Building Code of Canada."
  },
  {
    "clause": "7.25.3",
    "title": "Venting",
    "description": "Products of combustion from decorative appliance shall enter either a vent or chimney."
  },
  {
    "clause": "7.25.4",
    "title": "Bathroom and bedroom installation",
    "description": "Decorative appliance shall not be installed in bathroom or sleeping accommodation room, except certified appliances may be installed in specific conditions for direct-vent types or specially marked appliances."
  },
  {
    "clause": "7.25.5",
    "title": "Chimney damper",
    "description": "Gas log shall be certified for application, and when installed, chimney damper shall be permanently secured in open position to effectively vent the appliance."
  },
  {
    "clause": "7.26",
    "title": "Pool heaters",
    "description": "Requirements for pool heater installation including location, clearances, outdoor installation, and maintenance requirements."
  },
  {
    "clause": "7.26.1",
    "title": "Installation location",
    "description": "Pool heater shall be installed on firm and level base and noncombustible floor or support, with exceptions for certified installations."
  },
  {
    "clause": "7.26.2",
    "title": "Minimum clearances",
    "description": "Minimum clearances from combustible material: vertical - 18 in, sides and rear - 18 in, front - 48 in, except where permitted by Clause 4.13.2."
  },
  {
    "clause": "7.26.3",
    "title": "Outdoor installation",
    "description": "Pool heater installed outdoors shall be located minimum of 18 in from any property line."
  },
  {
    "clause": "7.26.4",
    "title": "Wall-mounted type",
    "description": "Wall-mounted pool heater shall be securely attached."
  },
  {
    "clause": "7.26.5",
    "title": "Outdoor type",
    "description": "Outdoor pool heater shall not be installed beneath any structure, including a deck."
  },
  {
    "clause": "7.26.6",
    "title": "Finned-tube outdoor installation",
    "description": "Pool heater of finned-tube type shall be installed outdoors or in enclosure that is not normally occupied and does not directly communicate with occupied areas. Direct-vent pool heaters are exempt."
  },
  {
    "clause": "7.26.7",
    "title": "Indoor installation",
    "description": "When finned-tube indoor gas-fired pool heater that had prior approval for indoor installation communicating with occupied area is being replaced, new heater shall be direct-vent type."
  },
  {
    "clause": "7.26.8",
    "title": "Maintenance",
    "description": "Where heater is installed per Clause 7.26.7, it shall be owner's responsibility to provide maintenance per manufacturer's instructions, but in no case less than once annually."
  },
  {
    "clause": "7.26.9",
    "title": "Outdoor flue discharge",
    "description": "Outdoor pool heater shall be installed so flue discharge is in accordance with Clause 8.14.10."
  },
  {
    "clause": "7.27",
    "title": "Water heaters",
    "description": "Requirements for water heater installation including location restrictions, pressure relief termination, and combustible protection."
  },
  {
    "clause": "7.27.1",
    "title": "Installation location",
    "description": "Water heater, unless of direct-vent type, shall not be installed in bathroom, bedroom, or any enclosure where sleeping accommodation is provided."
  },
  {
    "clause": "7.27.2",
    "title": "Pressure relief termination",
    "description": "Temperature and pressure relief device on tank-type water heater or pressure relief device for instantaneous water heater shall have discharge pipe of size at least equal to device outlet, terminating not more than 12 in above floor."
  },
  {
    "clause": "7.27.3",
    "title": "Combustibles protection",
    "description": "Instantaneous-type water heater, unless certified for installation on combustible wall, shall be provided with appropriate protection as specified in Table 4.1, extending full length and width of heater and draft hood."
  },
  {
    "clause": "7.27.4",
    "title": "Minimum clearances",
    "description": "Minimum clearance from combustible material for underfired storage-type water heater shall be 2 in, and for any other type shall be 6 in, except where permitted by Clause 4.13.2."
  },
  {
    "clause": "7.27.5",
    "title": "Water supply",
    "description": "Before installing instantaneous-type water heater, installer shall ensure there is sufficient water supply for proper operation of heater."
  },
  {
    "clause": "7.27.6",
    "title": "Return and combustion air",
    "description": "Except for direct-vent water heaters, when water heater is used in combo heating system, return-air inlets shall not be installed in same enclosure containing both air-handling unit and water heater. Adequate combustion air shall be provided."
  },
  {
    "clause": "7.27.7",
    "title": "Return air infiltration",
    "description": "When return air duct(s) of air-handling unit in combo heating system is installed in enclosure with spillage-susceptible appliances, it shall be sealed to air-handling unit casing with joints sealed to prevent air infiltration."
  },
  {
    "clause": "7.28",
    "title": "Unit heaters",
    "description": "Requirements for unit heater installation including suspended installation, negative pressure considerations, and garage installation."
  },
  {
    "clause": "7.28.1",
    "title": "Suspended installation",
    "description": "Suspended unit heater shall be firmly supported with metal hangers or brackets."
  },
  {
    "clause": "7.28.2",
    "title": "Negative pressure",
    "description": "Location of suspended unit heater or duct attached to suspended unit heater shall be such that negative pressure will not be created in room in which unit heater is located."
  },
  {
    "clause": "7.28.3",
    "title": "Garage installation",
    "description": "When unit heater is installed in garage, minimum clearance of 8 ft shall be maintained between base of heater and garage floor. Minimum clearance may be reduced when substantial guard prevents vehicles from striking heater."
  },
  {
    "clause": "7.28.4",
    "title": "Clearance to combustibles",
    "description": "All clearances from combustible material shall be minimum of 18 in, except where permitted by Clause 4.13.2."
  },
  {
    "clause": "7.29",
    "title": "Hotplates",
    "description": "Requirements for hotplate installation including piping, installation locations, and clearances."
  },
  {
    "clause": "7.29.1",
    "title": "Piping",
    "description": "Hotplate shall be connected with rigid piping and secured to prevent movement."
  },
  {
    "clause": "7.29.2",
    "title": "Installation locations",
    "description": "Hotplate shall not be installed in bedroom but may be installed in bed-sitting room, provided it is not required to be used for space-heating purposes."
  },
  {
    "clause": "7.29.3",
    "title": "Clearance to combustibles",
    "description": "Minimum clearances from combustible material: above - 30 in, front - 6 in, back and sides - 6 in, except where permitted by Clause 4.13.2."
  },
  {
    "clause": "7.30",
    "title": "Incinerators",
    "description": "Requirements for incinerator installation including chimney location, wall-type installations, and draft regulation."
  },
  {
    "clause": "7.30.1",
    "title": "Chimney location",
    "description": "Incinerator shall be installed as close as practicable to a chimney."
  },
  {
    "clause": "7.30.2",
    "title": "Wall-type installations",
    "description": "Incinerator of wall type shall be installed in noncombustible wall that communicates directly with chimney flue."
  },
  {
    "clause": "7.30.3",
    "title": "Draft regulator",
    "description": "Incinerator shall not be equipped with draft hood. When draft control is required, draft regulator of single-acting type shall be used."
  },
  {
    "clause": "7.30.4",
    "title": "Chimney connection",
    "description": "Vent connector shall be directly connected to chimney through separate thimble."
  },
  {
    "clause": "7.30.5",
    "title": "Vent guarding",
    "description": "When vent connector passes through wall or partition of combustible material, it shall be guarded at point of passage as specified in Clause 8.18.12."
  },
  {
    "clause": "7.30.6",
    "title": "Clearance to combustibles",
    "description": "Incinerator shall be installed with minimum clearance of 12 in from all combustible material, except where permitted by Clause 4.13.2."
  },
  {
    "clause": "7.31",
    "title": "Lighting",
    "description": "Requirements for lighting appliance installation including pendant type support, wall installation, and ventilation."
  },
  {
    "clause": "7.31.1",
    "title": "Pendant type support",
    "description": "Pendant-type light fixture shall be supported to remove direct weight of fixture from gas piping systems."
  },
  {
    "clause": "7.31.2",
    "title": "Wall installation",
    "description": "Wall bracket fixture shall be firmly supported, and if of swing type, shall be provided with stop to prevent contact of globe with combustible material."
  },
  {
    "clause": "7.31.3",
    "title": "Clearance to combustibles",
    "description": "Bracket or pendant fixture minimum clearances from combustible material: above - 18 in, all sides - 5 in, except where permitted by Clause 4.13.2."
  },
  {
    "clause": "7.31.4",
    "title": "Ventilation",
    "description": "Ventilation shall be provided when lighting appliance is installed or used in enclosure. Ventilation openings shall be at top and bottom of enclosure, minimum 4 in² for each lighting appliance installed."
  },
  {
    "clause": "7.32",
    "title": "Commercial cooking appliances",
    "description": "Requirements for commercial cooking appliance installation including floor mounting, clearances, and fryer separation."
  },
  {
    "clause": "7.32.1",
    "title": "Floor mounting",
    "description": "Commercial cooking appliance shall be installed level on firm foundation."
  },
  {
    "clause": "7.32.2",
    "title": "Floor mount clearances",
    "description": "When installed on unprotected combustible material, appliance shall have legs that provide minimum of 4 in clearance between metal base and material."
  },
  {
    "clause": "7.32.3",
    "title": "Floor mount construction",
    "description": "When appliance does not have legs at least 4 in high, it shall not be installed on combustible material, except when material under appliance is protected with sheet metal and 2 in of air space is maintained between base and sheet metal."
  },
  {
    "clause": "7.32.4",
    "title": "Side clearances",
    "description": "Noncombustible fixed means shall be provided to maintain minimum clearance of 6 in between combustible material and sides and rear of appliance."
  },
  {
    "clause": "7.32.5",
    "title": "Top clearances",
    "description": "Any portion of combustible material located within 18 in horizontally of cooking top section shall be protected for vertical distance of 36 in above surface of cooking top."
  },
  {
    "clause": "7.32.6",
    "title": "Fryer separation",
    "description": "Clearance of not less than 16 in shall be provided between deep fat fryer and open flame of adjacent appliance unless noncombustible divider extending not less than 7 in above fryer and open flame is provided."
  },
  {
    "clause": "7.33",
    "title": "Residential-type ranges",
    "description": "Requirements for residential-type range installation including installation limitations, floor mounting, venting, and clearances."
  },
  {
    "clause": "7.33.1",
    "title": "Installation limitations",
    "description": "Range shall not be installed in bedroom but may be installed in bed-sitting room, provided it is not required to be used for space-heating purposes."
  },
  {
    "clause": "7.33.2",
    "title": "Floor mounting",
    "description": "Residential-type range shall be installed level. When installed on combustible floor, it shall be set on its own legs or baffled base and shall be certified for such mounting."
  },
  {
    "clause": "7.33.3",
    "title": "Venting",
    "description": "When vent connector is attached to range, suitable provision shall be made by installer for protection of adjacent combustible material."
  },
  {
    "clause": "7.33.4",
    "title": "Clearance to combustibles",
    "description": "Minimum clearances from combustible material: above - 30 in, back and sides - 6 in, except where permitted by specified clauses."
  },
  {
    "clause": "7.33.5",
    "title": "Zero clearance requirements",
    "description": "Residential-type range certified for zero side and rear clearances may be installed with zero side clearance from combustible material, provided there is 1 in clearance at back and 28 MSG sheet metal shield on side walls spaced out minimum 0.25 in."
  },
  {
    "clause": "7.33.6",
    "title": "New appliance clearances",
    "description": "New residential-type range shall be installed in accordance with its certified clearances from combustible material as specified on appliance rating plate."
  },
  {
    "clause": "7.33.7",
    "title": "Clearance reductions",
    "description": "When underside of combustible material above residential-type range is protected with insulating millboard at least 0.25 in thick covered with sheet metal not less than 28 MSG, clearance above range may be reduced to 24 in."
  },
  {
    "clause": "7.33.8",
    "title": "Exhaust hoods",
    "description": "Exhaust hood, exhaust appliance, or combination thereof installed above range shall be installed in accordance with instructions for such exhaust hood or appliance."
  },
  {
    "clause": "7.34",
    "title": "Refrigerators",
    "description": "Requirements for refrigerator installation including minimum clearances, direct vent requirements, and unvented installation restrictions."
  },
  {
    "clause": "7.34.1",
    "title": "Minimum clearances",
    "description": "Minimum clearances from combustible material, disregarding any guard or baffle on refrigerator: above - 12 in, back and sides - 2 in, except where permitted by Clause 4.13.2."
  },
  {
    "clause": "7.34.2",
    "title": "Direct vent",
    "description": "Refrigerator installed in dwelling unit shall be of direct-vent type."
  },
  {
    "clause": "7.34.3",
    "title": "Unvented",
    "description": "Unvented refrigerator shall be installed in area that is not normally occupied and does not directly communicate with occupied areas."
  },
  {
    "clause": "7.35",
    "title": "Operation of appliances at shows, exhibitions, or other similar events",
    "description": "Operation of appliances at shows, exhibitions, or other similar events shall comply with Annex M and meet any additional requirements of authority having jurisdiction."
  },
  {
    "clause": "8.1.1",
    "title": "Requirements",
    "description": "The requirements of Clause 8.2 shall apply to central-heating furnaces, boilers, and hot-water heaters."
  },
  {
    "clause": "8.1.2",
    "title": "Direct vent exceptions",
    "description": "The requirements of Clauses 8.2 to 8.5 shall not apply to a direct-vent appliance. Note: Regardless of the category type, when an appliance utilizes indoor combustion air, it is not considered a direct-vent appliance."
  },
  {
    "clause": "8.1.3",
    "title": "Air supply interference",
    "description": "Interference with the air supply for an appliance shall be prohibited."
  },
  {
    "clause": "8.1.4",
    "title": "Input reference",
    "description": "Air supply shall be provided in accordance with a) Clauses 8.2 and 8.3 when either an appliance or a combination of appliances has a total input of up to and including 400 000 Btu/h (120 kW); or b) Clause 8.4 when either an appliance or a combination of appliances has a total input exceeding 400 000 Btu/h (120 kW)."
  },
  {
    "clause": "8.1.5",
    "title": "Combustion air",
    "description": "When an appliance other than a central-heating appliance or a domestic water heater is installed in a location where there is insufficient air for combustion, provisions shall be made to provide an air supply sized in accordance with Table 8.1 or 8.2."
  },
  {
    "clause": "8.2.1",
    "title": "Requirements",
    "description": "An outdoor air supply sized in accordance with Clause 8.2.2 shall be provided for an enclosure or a structure in which an appliance is installed when the enclosure or structure a) has windows and doors of either close-fitting or sealed construction, and the exterior walls are covered by a continuous, sealed vapour barrier and gypsum wallboard (drywall) or plywood or a similar material having sealed joints; or b) has an equivalent leakage area of 78 in² (0.05 m²) or less at a differential pressure of 0.00145 psig (10 Pa) as determined by a recognized Canadian fan depressurization test procedure."
  },
  {
    "clause": "8.2.2",
    "title": "Sizing",
    "description": "Except as required in Clause 8.2.3, the free area of the outdoor air supply required by Clause 8.2.1 shall be determined from Table 8.1 for an appliance having a draft-control device and from Table 8.2 for an appliance not having a draft-control device, using the total input of all appliances in the structure or enclosure."
  },
  {
    "clause": "8.2.3",
    "title": "Input exceptions",
    "description": "An outdoor air supply shall not be required for a single water heater with an input of 50 000 Btu/h (15 kW) or less within an enclosure or structure where there are no other appliances that require an air supply. Except for direct-vent water heaters, when the water heater is contained in an enclosure, permanent openings shall be provided as described in Clause 8.2.6."
  },
  {
    "clause": "8.2.4",
    "title": "Other exceptions",
    "description": "An outdoor air supply, if required, shall be sized in accordance with Clause 8.2.5 and shall be provided for an enclosure or a structure in which an appliance is installed when the enclosure or structure is neither constructed as described in Clause 8.2.1 a) nor complies with Clause 8.2.1 b)."
  },
  {
    "clause": "8.2.5",
    "title": "Free area sizing",
    "description": "The free area of the outdoor air supply, if required by Clause 8.2.4 shall be determined from Table 8.3 for an appliance having a draft-control device and Table 8.4 for an appliance not having a draft-control device, using the total input of all appliances in the structure or enclosure."
  },
  {
    "clause": "8.2.6",
    "title": "Enclosure volume",
    "description": "When an appliance(s) is located within an enclosure and permanent openings sized and located in accordance with Items a) and b) of this clause are supplied to allow communication between the enclosure and the rest of the structure, the total volume of the structure may be used to determine air supply requirements, provided that the structure is not constructed as described in Clause 8.2.1 a) and does not comply with Clause 8.2.1 b)."
  },
  {
    "clause": "8.3.1",
    "title": "General requirements",
    "description": "Except as specified in Clauses 8.3.3 and 8.3.4, a duct shall be used to provide the outside air supply required by Clauses 8.2.1 and 8.2.4. The duct shall a) be of either metal or a material meeting the Class I requirements of CAN/ULC-S110; b) communicate directly with the outdoors; c) be of at least the same cross-sectional area as the free area of the air-supply inlet opening to which it connects; and d) terminate within 1 ft (300 mm) above, and within 2 ft (600 mm) horizontally from, the burner level of the appliance having the largest input."
  },
  {
    "clause": "8.3.2",
    "title": "Duct type",
    "description": "A square- or rectangular-shaped duct shall only be used when the required free area of the air-supply opening is 9 in² (5800 mm²) or larger, and when used, its smaller dimension shall not be less than 3 in (75 mm)."
  },
  {
    "clause": "8.3.3",
    "title": "Non-ducted openings",
    "description": "An opening may be used in lieu of a duct to provide the outside air supply to an appliance as required by Clauses 8.2.1 and 8.2.4. The opening shall be located within 1 ft (300 mm) above, and 2 ft (600 mm) horizontally from, the burner level of the appliance having the largest input."
  },
  {
    "clause": "8.3.4",
    "title": "Combustion-air supply devices",
    "description": "A certified combustion-air supply device may be used in lieu of a duct to provide the outside air supply to an appliance as required in Clauses 8.2.1 and 8.2.4. The combustion-air supply system shall have air flow proving interlocked to the appliance(s) served, and sufficient airflow shall be demonstrated."
  },
  {
    "clause": "8.3.5",
    "title": "Inlet opening",
    "description": "An air-supply inlet opening from the outdoors shall be equipped with a means to prevent the direct entry of rain and wind, and such means shall not reduce the required free area of the air-supply opening."
  },
  {
    "clause": "8.3.6",
    "title": "Inlet location",
    "description": "An air-supply inlet opening from the outdoors shall be located not less than 12 in (300 mm) above the outside grade level."
  },
  {
    "clause": "8.3.7",
    "title": "Inlet clearances",
    "description": "An air-supply opening shall not be located within 3 ft (0.9 m) of a moisture exhaust duct. Note: A moisture-exhaust duct (e.g., a gas or electric clothes dryer discharge; spa exhaust) is considered to interfere with the combustion air intake when located within 3 ft (0.9 m) of the air intake."
  },
  {
    "clause": "8.4.1",
    "title": "Location",
    "description": "Ventilation of the space occupied by an appliance or equipment shall be provided by an opening for ventilation air at the highest practicable point communicating with the outdoors, and this opening shall not terminate within 12 in (300 mm) of any combustion air opening. The total cross-sectional area of such an opening shall be at least 10% of the area required in Clauses 8.4.2 and 8.4.3, but in no case shall the cross-sectional area be less than 10 in² (6500 mm²)."
  },
  {
    "clause": "8.4.2",
    "title": "With draft control device",
    "description": "When the air supply is provided by natural airflow from the outdoors for an appliance and a venting system with a draft control device is installed in the same space or enclosure, there shall be a permanent air-supply opening having a cross-sectional area of not less than 1 in²/7000 Btu/h (310 mm²/kW) up to and including 1 000 000 Btu/h (300 kW), plus 1 in²/14 000 Btu/h (155 mm²/kW) in excess of 1 000 000 Btu/h (300 kW)."
  },
  {
    "clause": "8.4.3",
    "title": "Without draft control device",
    "description": "When air supply is provided by natural airflow from outdoors for an appliance and a venting system without a draft-control device is installed in the same space or enclosure, there shall be a permanent air-supply opening having a total cross-sectional area of not less than 1 in² for each 30 000 Btu/h (70 mm² for each kW) of the total rated input."
  },
  {
    "clause": "8.4.4",
    "title": "Combination",
    "description": "When air is provided by natural airflow from outdoors into a space or enclosure containing both types of appliances or venting systems described in Clauses 8.4.2 and 8.4.3, the cross-sectional area of the opening shall not be less than the sum of the required cross-sectional areas for all types of appliances or venting systems when calculated in accordance with Clauses 8.4.2 and 8.4.3 as applicable."
  },
  {
    "clause": "8.4.5",
    "title": "Discharge opening",
    "description": "When an air-supply duct is used to meet the requirements of either Clause 8.4.2 or 8.4.3, its discharge opening shall be located where there is no possibility of cold air affecting steam or water pipes and electrical or mechanical equipment."
  },
  {
    "clause": "8.5.1",
    "title": "Free area calculation",
    "description": "The free area of an air-supply opening required in Clauses 8.2 and 8.3 shall be calculated by subtracting the blockage area of all fixed louvres, grilles, or screens from the gross area of the opening."
  },
  {
    "clause": "8.5.2",
    "title": "Minimum aperture size",
    "description": "Apertures in a fixed louvre, grille, or screen shall have no dimension smaller than 0.25 in (6 mm)."
  },
  {
    "clause": "8.5.3",
    "title": "Manual dampers and louvres",
    "description": "Neither a manually operated damper nor manually adjustable louvres shall be used."
  },
  {
    "clause": "8.5.4",
    "title": "Automatic dampers and louvres",
    "description": "Except as permitted by Clause 8.5.6, an automatically operated damper or automatically adjustable louvre shall be interlocked so that the main burner cannot operate unless either the damper or louvre is in the fully open position."
  },
  {
    "clause": "8.5.5",
    "title": "Automatic combustion air damper",
    "description": "An automatic combustion air damper installed in the air supply within a dwelling unit shall be certified."
  },
  {
    "clause": "8.5.6",
    "title": "Emergency generators, stand-by generators, and firewater pumps",
    "description": "For emergency generators, stand-by generators, or firewater pumps, the combustion air damper interlock is not required, provided the intake combustion air dampers and the ventilation air dampers, if provided separately, are sized for a maximum face velocity of 500 fpm (2.5 m/s)."
  },
  {
    "clause": "8.6",
    "title": "Conditions created by exhaust fans, air-supply fans, circulating fans, or fireplaces",
    "description": "When it is determined that the operation of another appliance or other equipment, including an exhaust fan, air-supply fan, circulating fan, or fireplace adversely affects the venting, combustion, or burning characteristics of a gas appliance, either the condition shall be corrected or the fuel supply to the affected appliance shall be discontinued."
  },
  {
    "clause": "8.7",
    "title": "Engineered installations",
    "description": "Subject to the approval of the authority having jurisdiction, outdoor air-supply provisions other than those described in Clauses 8.2 and 8.3 may be used if designed in accordance with good engineering practice."
  },
  {
    "clause": "8.8.1",
    "title": "Airflow sensing",
    "description": "When the air supply is provided by mechanical means, an airflow-sensing device shall be installed. It shall be wired into the safety limit circuit of the primary safety control to shut off the gas in the event of air-supply failure. When an appliance is not equipped with a combustion safety control, the restoration of the gas supply shall be by a manual-reset device."
  },
  {
    "clause": "8.8.2",
    "title": "Make-up air heater",
    "description": "When adequate air supply is provided for combustion air for all appliances by a make-up air heater and the appliances are interlocked with the heater, the requirements of Clauses 8.1 to 8.6 shall not apply."
  },
  {
    "clause": "8.9.1",
    "title": "General exceptions",
    "description": "Every appliance shall be connected to either an effective chimney or a vent, except a) for a radiant heater installed in a masonry fireplace with a permanently opened flue; b) for an appliance that is approved for use without a vent; c) for an appliance installed in accordance with Clause 8.24.5 in a building (other than a residential or care or detention occupancy building) where adequate ventilation is provided by an exhaust fan, by a natural-draft ventilator, or by other means acceptable to the authority having jurisdiction; d) for an appliance installed for the production of carbon dioxide in a greenhouse where the rate of combustion does not exceed 3 Btu/h/ft³ (30 W/m³) of greenhouse volume and the concentration of carbon dioxide in the atmosphere does not exceed 5000 ppm (0.5%); and e) as provided in Clauses 8.14.12, 8.24, and 8.30."
  },
  {
    "clause": "8.9.2",
    "title": "Appliance location",
    "description": "Except for a direct-vent appliance, an appliance requiring venting shall be located as close as practicable to either a chimney or vent."
  },
  {
    "clause": "8.9.3",
    "title": "Fasteners",
    "description": "A venting system shall be firmly attached to either a draft-hood outlet or flue collar by sheet metal screws or mechanical fasteners, or in accordance with the manufacturer's instructions."
  },
  {
    "clause": "8.9.4",
    "title": "Hangers",
    "description": "A venting system shall be securely supported by noncombustible hangers suitable for the weight and design of the materials employed. A slip joint in the horizontal section of a venting system shall be secured either with sheet metal screws or in accordance with the manufacturer's instructions to prevent sagging."
  },
  {
    "clause": "8.9.5",
    "title": "Plastic vent inspection",
    "description": "Venting systems that employ plastic vents shall be installed such that the first 3 ft (0.9 m), or total vent run if less than 3 ft (0.9 m) from the appliance flue outlet, is readily accessible for visual inspection."
  },
  {
    "clause": "8.9.6",
    "title": "Plastic vent type",
    "description": "Vents constructed using plastic piping shall be certified to ULC S636."
  },
  {
    "clause": "8.10.1",
    "title": "Effective venting",
    "description": "A vent or chimney shall provide effective venting and shall be designed and constructed to remove all flue gases to the outdoors."
  },
  {
    "clause": "8.10.2",
    "title": "Chimney applications",
    "description": "A chimney suitable to the application shall be used for venting the following appliances: a) an incinerator, except as provided in Clause 8.10.11; b) an appliance that may be readily converted to the use of solid or liquid fuels; c) a combination gas- and oil-burning appliance; and d) an appliance approved for use with a chimney only."
  },
  {
    "clause": "8.10.3",
    "title": "Venting system",
    "description": "The type of venting system to be used shall be in accordance with Table 8.5."
  },
  {
    "clause": "8.10.4",
    "title": "Special venting system",
    "description": "A special venting system or a BH venting system shall be installed in accordance with the terms of its listing and the appliance and vent manufacturer's instructions."
  },
  {
    "clause": "8.10.5",
    "title": "Draft control device location",
    "description": "When used on an appliance having a special venting system, a draft-control device shall be located in a position where positive vent pressures will not occur."
  },
  {
    "clause": "8.10.6",
    "title": "Positive venting limitations",
    "description": "An appliance that operates at a positive vent pressure shall not be connected to a venting system serving any other appliance (common vent), except for cases in which all of the following conditions are met: All the appliances sharing the vent are of the same type and manufacturer. All the appliances are certified by the manufacturer for application in common vent configurations. The venting system is sized appropriately by the appliance manufacturer or in accordance with its instructions and as such is considered a special venting system as defined in Clause 1. The venting components are either supplied or as recommended by the appliance manufacturer. A method of flue backflow prevention is present in either the appliance or vent for each appliance and is installed in accordance with the appliance manufacturer's instructions. The manufacturer's operation and installation instructions include common venting specific instructions. The special venting system or unique feature(s) necessary for common venting application are in accordance with the applicable ANSI or CSA standards for the specific appliance type."
  },
  {
    "clause": "8.10.7",
    "title": "Type B vent",
    "description": "A Type B vent shall only be used with an appliance that is a) certified with a draft hood; or b) certified and marked for use with a Type B vent."
  },
  {
    "clause": "8.10.8",
    "title": "Type BW vent",
    "description": "A Type BW vent shall only be used with a recessed wall furnace."
  },
  {
    "clause": "8.10.9",
    "title": "Type L vent",
    "description": "Except as specified in Clause 8.10.10, a Type L vent shall only be used with an appliance certified for use with Type L vents."
  },
  {
    "clause": "8.10.10",
    "title": "Type L in lieu of type B",
    "description": "A Type L vent may be used in lieu of a Type B vent."
  },
  {
    "clause": "8.10.11",
    "title": "Incinerator venting",
    "description": "Pipe that is either metal of not less than No. 20 GSG (0.8 mm) galvanized sheet steel or an equivalent noncombustible, corrosion-resistant material shall be used for venting an incinerator installed in locations such as an open shed, a breezeway, or a carport, provided that the metal pipe is exposed for its full length and suitable clearances are maintained."
  },
  {
    "clause": "8.10.12",
    "title": "Vent location limitations",
    "description": "A flue gas vent or a vent connector shall not be installed in either a duct or a shaft used for return air, hot air, ventilating air, or combustion air."
  },
  {
    "clause": "8.10.13",
    "title": "Vent joints and seams",
    "description": "Joints and seams in vents or vent connectors installed in space used to convey return air, such as the space in a false ceiling, shall be sealed."
  },
  {
    "clause": "8.10.14",
    "title": "Special venting limitations",
    "description": "A special venting system shall neither pass through an unheated space nor be installed outdoors unless insulated in accordance with the appliance and/or vent manufacturer's instructions."
  },
  {
    "clause": "8.11",
    "title": "Vent and chimney requirements",
    "description": "A Type B, BH, BW, or L vent or a factory-built chimney used for venting an appliance shall be certified."
  },
  {
    "clause": "8.12.1",
    "title": "Code requirements",
    "description": "A masonry, concrete, or metal chimney shall be built and installed in accordance with the local building code or, in the absence of such, in accordance with the National Building Code of Canada."
  },
  {
    "clause": "8.12.2",
    "title": "Chimney flue examination",
    "description": "Except as provided in Clause 8.21.6 before replacing an existing appliance or connecting a vent connector to a chimney, the chimney flue shall be examined to ascertain that the chimney a) is properly constructed; b) is lined with a tile or a metal liner; c) is clear and free of soot, creosote, or obstructions; d) will effectively conduct the products of combustion outdoors; and e) is sized in accordance with Clause 8.13."
  },
  {
    "clause": "8.12.3",
    "title": "Connection to solid fuel flues",
    "description": "An appliance installed in a dwelling unit shall not be connected to a flue serving a) a solid-fuelled appliance; or b) a solid-fuelled fireplace unless the opening from the fireplace to the flue is permanently closed."
  },
  {
    "clause": "8.12.4",
    "title": "Connection to liquid fuel flues",
    "description": "When a chimney flue serving an appliance that burns a liquid fuel also serves a gas-fuelled appliance, the gas-fuelled appliance vent connector shall be a) through a separate flue opening above the flue pipe connection from the liquid-fuelled appliance; or b) connected into a shop-fabricated branch fitting that is located i) in a dwelling unit, not more than 30 in (760 mm) from the flue entrance; and ii) in other than a dwelling unit, as close as practicable to the chimney."
  },
  {
    "clause": "8.12.5",
    "title": "Two or more openings",
    "description": "When two or more openings are provided into one chimney flue, they shall be at different levels."
  },
  {
    "clause": "8.12.6",
    "title": "Connection to gas fuel flues",
    "description": "When a chimney flue serving an appliance that burns a solid fuel also serves a gas-fuelled appliance in other than a dwelling unit, the venting of the gas-fuelled appliance shall be through a separate flue opening above the flue pipe connection from the other appliance."
  },
  {
    "clause": "8.12.7",
    "title": "Chimney clean-outs",
    "description": "A chimney shall be provided with a clean-out opening. The clean-out shall be of such construction that it will remain tightly closed when not in use. A tee fitting used as either a clean-out or condensate drain shall have a tight-fitting cap to prevent entrance of air into the chimney at that point."
  },
  {
    "clause": "8.12.8",
    "title": "Masonry chimneys",
    "description": "The flue of a masonry chimney that vents one or more gas-fuelled space-heating appliances with combined inputs of 400 000 Btu/h (120 kW) or less shall be lined in accordance with Clause 8.12.10, except where the flue has an existing clay-tile or transite liner a) that is capable of removing the total volume of flue gases to the outdoors; b) in which the capacity of the liner, as determined by the use of Table C.5, C.6, C.7, or C.8 in Annex C, does not exceed the total input of the appliances to be connected thereto by more than 25%; and c) that has been inspected and accepted by an installer in accordance with Clause 8.12.2."
  },
  {
    "clause": "8.12.9",
    "title": "Unsafe chimneys",
    "description": "Where inspection reveals that an existing masonry, concrete, or metal chimney is not safe for the intended application, it shall be a) repaired or rebuilt; b) replaced with a chimney of the same type that complies with Clause 8.12.1; or c) replaced by either an approved vent or approved factory-built chimney that complies with Clause 8.13."
  },
  {
    "clause": "8.12.10",
    "title": "Chimney liner",
    "description": "A metal chimney liner shall provide a continuous lining from the base inside the space where the appliance is located to the top of the masonry chimney flue, and it shall comply with the requirements of ULC S635. It shall be installed in accordance with the manufacturer's instructions."
  },
  {
    "clause": "8.12.11",
    "title": "Semi-detached house venting",
    "description": "The venting of a gas-fired appliance into a chimney flue common to both halves of a semi-detached house shall not be permitted."
  },
  {
    "clause": "8.13.1",
    "title": "Sizing",
    "description": "A vent or a chimney serving a single appliance shall provide effective venting and shall be sized a) so that its effective area is not less than that of the draft-control device outlet or the flue outlet; or b) in accordance with good engineering practice, such as by the use of i) Table C.1, C.2, C.5, or C.6 of Annex C for a draft-hood-equipped or a fan-assisted category I appliance; or ii) engineered venting tables acceptable to the authority having jurisdiction."
  },
  {
    "clause": "8.13.2",
    "title": "Multiple appliance venting",
    "description": "A vent or a chimney serving more than one appliance shall provide effective venting and shall be sized a) so that its effective flue area is not less than that of the largest draft-control device outlet or the largest flue outlet, plus 50% of the sum of the outlet areas of the additional appliances; or b) in accordance with good engineering practice, such as by the use of i) Table C.3, C.4, C.7 or C.8 of Annex C for a draft-hood-equipped or a fan-assisted category I appliance; or ii) engineered venting tables acceptable to the authority having jurisdiction."
  },
  {
    "clause": "8.13.3",
    "title": "Vent shape",
    "description": "A vent may be any shape, provided that its venting capacity is equal to the capacity of the round pipe for which it is substituted, and its minimum internal dimension is not less than 2 in (50 mm). In no case shall the area be less than the area of a 3 in (75 mm) inside diameter pipe."
  },
  {
    "clause": "8.14.1",
    "title": "Wind consideration",
    "description": "A vent or chimney shall extend high enough above either a building or a neighbouring obstruction so that wind from any direction will not create a positive pressure in the vicinity of either the vent termination or the chimney termination."
  },
  {
    "clause": "8.14.2",
    "title": "Vent minimum distances",
    "description": "Except for a special venting system with positive vent pressure, a vent shall extend not less than 2 ft (600 mm) above the highest point where it passes through a flat roof of a building and not less than 2 ft (600 mm) higher than any portion of a building within a horizontal distance of 10 ft (3 m)."
  },
  {
    "clause": "8.14.3",
    "title": "Positive vent pressure minimum distances",
    "description": "A vent used in a special venting system with positive vent pressure and passing through a roof shall extend at least 18 in (450 mm) above the highest point where it passes through the roof surface and the same distance above any other obstruction within a horizontal distance of 18 in (450 mm)."
  },
  {
    "clause": "8.14.4",
    "title": "Chimney minimum distances",
    "description": "A chimney shall extend not less than 3 ft (0.9 m) above the highest point where it passes through the roof of a building and not less than 2 ft (600 mm) higher than any portion of a building within a horizontal distance of 10 ft (3 m)."
  },
  {
    "clause": "8.14.5",
    "title": "Pitched roof distances",
    "description": "Except for a special venting system with positive vent pressure, a vent passing through a pitched roof shall extend above the highest point where it passes through a roof surface in accordance with Figure 8.1 and shall extend not less than 2 ft (600 mm) above any obstruction within a horizontal distance of 10 ft (3 m)."
  },
  {
    "clause": "8.14.6",
    "title": "Height above appliance",
    "description": "A vent or chimney shall extend not less than 5 ft (1.5 m) in height above either the highest connected appliance draft-hood outlet or flue collar except as provided in Clause 8.24.1."
  },
  {
    "clause": "8.14.7",
    "title": "Wall furnace vent height",
    "description": "A vent serving a wall furnace shall extend not less than 12 ft (3.6 m) in height above the bottom of the furnace and shall contain neither lateral nor horizontal sections unless the furnace is certified for room-heater-type venting and is so marked."
  },
  {
    "clause": "8.14.8",
    "title": "Vent termination limitations",
    "description": "A vent shall not terminate a) where it could cause hazardous frost or ice accumulations on adjacent property surfaces; b) less than 7 ft (2.1 m) above a paved sidewalk or a paved driveway that is located on public property; c) within 6 ft (1.8 m) of a mechanical air-supply inlet to any building; d) above a regulator within 3 ft (0.9 m) horizontally of the vertical centreline of the regulator vent outlet to a maximum vertical distance of 15 ft (4.5 m); e) except as required by Clause 8.14.8 d), any distance less than that of any gas pressure regulator vent outlet as detailed in Table 5.3; f) less than 1 ft (300 mm) above grade level; g) within specified distances of a window or door that can be opened in any building, of any nonmechanical air-supply inlet to any building, or of the combustion air inlet of any other appliance; and h) underneath a veranda, porch, or deck unless the veranda, porch, or deck is fully open on a minimum of two sides beneath the floor and the distance between the top of the vent termination and the underside of the veranda, porch, or deck is greater than 1 ft (300 mm)."
  },
  {
    "clause": "8.14.9",
    "title": "Direct-vent clearances",
    "description": "When more than one direct-vent appliance of the same make and model are installed, the clearances between the air-intake and exhaust vent terminals may be reduced from the clearances required by this Code, provided that the appliances have been tested and certified for such reduced clearances. The manufacturer's instructions shall specify and illustrate the reduced clearances."
  },
  {
    "clause": "8.14.10",
    "title": "Outdoor pool heater flue",
    "description": "The flue gas discharge opening for an outdoor pool heater shall terminate not less than 10 ft (3 m) from any building opening."
  },
  {
    "clause": "8.14.11",
    "title": "Termination cap",
    "description": "A terminus of a vent shall be fitted with a cap either in accordance with the vent manufacturer's installation instructions or in accordance with the manufacturer's installation instructions for a special venting system."
  },
  {
    "clause": "8.14.12",
    "title": "Wall termination vent limitations",
    "description": "A vent from an appliance shall not extend through an exterior wall and terminate adjacent to the exterior wall unless a) the appliance is a direct-vent appliance; b) the appliance is intended for connection to a special venting system; c) the appliance and its complete vent assembly are specifically certified to be installed in this manner; d) the venting system is equipped with a certified power venter that complies with Clause 8.29.2; or e) the venting system is equipped with a certified power venter that complies with Clause 8.24.2."
  },
  {
    "clause": "8.14.13",
    "title": "Dormant vent installation",
    "description": "The vent from one or more gas-fired appliances may be installed vertically inside a dormant masonry flue, a dormant certified chimney, or a dormant vent, provided that a) each appliance is equipped with its own individual vent or common stack(s), as is the case with common vented appliance sets meeting the requirements of Clause 8.10.6 installed in accordance with the requirements of Clauses 8.12 to 8.14, as applicable; and b) spacers are installed to maintain a minimum clearance of 1 in (25 mm) between an active vent and a combustible vent. The space surrounding any vent shall not be used to convey flue gases for any other appliance."
  },
  {
    "clause": "8.15.1",
    "title": "Independent support",
    "description": "A vent or chimney shall be adequately supported independent of the appliance being served."
  },
  {
    "clause": "8.15.2",
    "title": "Manufacturer's instructions",
    "description": "A vent or factory-built chimney shall be installed in accordance with the manufacturer's instructions."
  },
  {
    "clause": "8.15.3",
    "title": "Direct connection to flue outlet or draft-hood outlet",
    "description": "A vent may be directly connected to the flue outlet or draft-hood outlet of the appliance that it serves, provided that the vent is independently supported, and the connection is made in accordance with the manufacturer's instructions."
  },
  {
    "clause": "8.15.4",
    "title": "Double to single wall adapter",
    "description": "When the vent referred to in Clause 8.15.3 is of double-wall construction, the connection shall be made by the use of a certified double-wall to single-wall adapter, and by a) an adjustable telescopic-type fitting, fabricated by the vent manufacturer; or b) a single-wall vent connector having a maximum length not exceeding 18 in (450 mm) and a minimum length not less than 12 in (300 mm)."
  },
  {
    "clause": "8.15.5",
    "title": "Single-wall vent connector",
    "description": "When a single-wall vent connector connects an appliance to a Type B vent a) the base fitting shall be accessible for inspection; b) the connection shall be by means of a certified double-wall to single-wall adapter; and c) the clearance from combustibles as specified in Table 8.6 shall be maintained."
  },
  {
    "clause": "8.16.1",
    "title": "Connection locations",
    "description": "When two or more vent connectors enter either a common vent or a common chimney, they shall not enter at the same horizontal plane. The smallest vent connector shall enter at the highest level consistent with the available headroom and clearance from combustible material, except that a vent connector from an incinerator shall be installed at the lowest level. When the vent connectors are of the same diameter, the vent connector serving the appliance with the lowest British thermal unit input shall be connected at the highest level."
  },
  {
    "clause": "8.16.2",
    "title": "Common vent connector",
    "description": "When two or more appliances are vented through a common vent connector, the common vent connector shall be located at the highest level consistent with the available headroom and clearance from combustible material."
  },
  {
    "clause": "8.17.1",
    "title": "Natural-draft type",
    "description": "When the installation of a vent used in a natural-draft venting system is impracticable inside a building, it may be done outdoors, provided that the vent is a) certified for outside installation; and b) installed in accordance with the vent manufacturer's instructions."
  },
  {
    "clause": "8.17.2",
    "title": "Type B or Type L",
    "description": "The portion of an indoor-installed Type B or Type L vent that extends above the roof line shall be certified for exterior use, and each length shall be so identified."
  },
  {
    "clause": "8.18.1",
    "title": "Materials without dilution air",
    "description": "A vent connector that serves an appliance without flue gas dilution air shall be constructed of materials having corrosion resistance at least equivalent to that of No. 24 GSG (0.60 mm) galvanized steel."
  },
  {
    "clause": "8.18.2",
    "title": "Materials for incinerators",
    "description": "A vent connector that serves an incinerator shall be constructed of materials suitable for the intended use of the incinerator and shall have corrosion resistance and durability to heat at least equivalent to that of No. 20 GSG (0.90 mm) galvanized steel."
  },
  {
    "clause": "8.18.3",
    "title": "Materials with dilution air",
    "description": "Unless certified, a vent connector that serves an appliance with a draft hood shall not be made of material less than a) No. 28 GSG (0.38 mm) for all sizes up to and including 5 in (127 mm) diameter; b) No. 26 GSG (0.47 mm) for sizes over 5 in (127 mm) up to and including 8 in (203 mm) diameter; c) No. 24 GSG (0.60 mm) for sizes over 8 in (203 mm) up to and including 16 in (406 mm) diameter; and d) No. 20 GSG (0.90 mm) for sizes over 16 in (406 mm) up to and including 30 in (760 mm) diameter."
  },
  {
    "clause": "8.18.4",
    "title": "Minimum size",
    "description": "A vent connector that serves a single appliance with a single flue outlet shall not be smaller than the minimum size of either the vent or chimney as determined in Clause 8.13.1."
  },
  {
    "clause": "8.18.5",
    "title": "Size change",
    "description": "When a vent connector is required to have a size other than that of either the appliance flue collar or draft-hood outlet, the change in size shall be made as follows: a) If the size is increased, the change in size shall be made at either the appliance flue collar or draft-hood outlet, except that when either the flue collar or draft-hood outlet is inside the casing of the appliance, the increase shall be made immediately external to the appliance casing. b) If the size is reduced, the change in size shall be made at the appliance flue collar."
  },
  {
    "clause": "8.18.6",
    "title": "Size change calculations",
    "description": "When the size of either a draft hood or a flue collar is changed in accordance with Clause 8.18.5, the revised size shall be considered the size of either the draft hood or flue-collar outlet when making calculations in accordance with Clauses 8.13.1 to 8.13.3 and 8.18.7."
  },
  {
    "clause": "8.18.7",
    "title": "Multiple appliances",
    "description": "A vent connector that serves two or more appliances, or a vent connector that serves a single appliance with two or more flue outlets, shall a) have i) an area not less than the total area of all vent connectors, with the size of each individual vent connector determined separately in accordance with Clause 8.18.5; and ii) a total length not exceeding the values specified in Table C.9. The total length of the connector in Table C.9 shall include manifold length and each individual appliance length; or b) be sized in accordance with an engineering table acceptable to the authority having jurisdiction."
  },
  {
    "clause": "8.18.8",
    "title": "Size change location",
    "description": "When either a chimney or a vent has been sized in accordance with the requirements of Clauses 8.13.1 and 8.13.2, and the flue area is less than the area of the vent connector, the change in size shall be made where the vent connector is attached to either the chimney or the vent."
  },
  {
    "clause": "8.18.9",
    "title": "Special venting system minimum clearances",
    "description": "A special venting system shall be installed with a minimum clearance from combustible material in accordance with its certification."
  },
  {
    "clause": "8.18.10",
    "title": "Type B minimum clearances",
    "description": "Except as provided in Clause 8.18.13, a vent connector material of Type B vent shall be installed with a minimum clearance from combustible material. This clearance shall be maintained if it passes through either a combustible wall or partition, in accordance with Table 8.6."
  },
  {
    "clause": "8.18.11",
    "title": "Appliance minimum clearances",
    "description": "Except as provided in Clause 8.18.13, the minimum clearance of a vent connector of other than Type B vent material from a combustible wall or partition shall be in accordance with Table 8.6."
  },
  {
    "clause": "8.18.12",
    "title": "Combustible wall or partition penetrations",
    "description": "When a vent connector of other than Type B vent material passes through either a combustible wall or partition, the combustible material shall be guarded at the point of passage with a) a ventilated metal thimble not smaller than specified requirements; or b) noncombustible insulation and clearances that will prevent the surface temperature of the combustible material from exceeding 194 °F (90 °C)."
  },
  {
    "clause": "8.18.13",
    "title": "Combustible wall protection",
    "description": "Except for passage through either a combustible wall or combustible partition, the clearance from a vent connector to combustible material may be reduced when the combustible material is protected as specified in Table 8.7."
  },
  {
    "clause": "8.18.14",
    "title": "General installation",
    "description": "A vent connector shall be installed so as to avoid unnecessary turns and other features that create added resistance to the flow of flue gases."
  },
  {
    "clause": "8.18.15",
    "title": "Fasteners",
    "description": "A vent connector shall be firmly attached to either a draft-hood outlet or flue collar by sheet metal screws or mechanical fasteners, or in accordance with the manufacturer's instructions."
  },
  {
    "clause": "8.18.16",
    "title": "General installation for type B",
    "description": "A vent connector of Type B vent material shall be securely assembled in accordance with the manufacturer's instructions."
  },
  {
    "clause": "8.18.17",
    "title": "No dips or sags",
    "description": "A vent connector shall be installed without dips or sags."
  },
  {
    "clause": "8.18.18",
    "title": "Converted furnace or boiler",
    "description": "A vent connector of either Type B or Type L vent material shall not be used between the flue outlet and the draft-control device of either a converted furnace or converted boiler."
  },
  {
    "clause": "8.18.19",
    "title": "Horizontal design",
    "description": "The horizontal run of a vent connector shall be as short as practicable, and the appliance shall be located as near the vent or chimney as practicable."
  },
  {
    "clause": "8.18.20",
    "title": "Hanger support",
    "description": "A vent connector shall be securely supported by noncombustible hangers suitable for the weight and design of the materials employed. A slip joint in the horizontal section of a vent connector shall be secured with either sheet metal screws or in accordance with the manufacturer's instructions to prevent sagging."
  },
  {
    "clause": "8.18.21",
    "title": "Unheated spaces",
    "description": "When a vent connector from a Category I appliance passes through an unheated space, that portion of the vent connector shall be either a Type B or Type L vent."
  },
  {
    "clause": "8.18.22",
    "title": "General construction",
    "description": "A vent connector shall be of either metal or other noncombustible material capable of withstanding the flue gas temperatures involved. It shall have sufficient strength to withstand damage likely to occur under the conditions of use and shall be securely supported."
  },
  {
    "clause": "8.18.23",
    "title": "Floor or ceiling limitations",
    "description": "A single-wall vent connector shall not pass through either a floor or a ceiling."
  },
  {
    "clause": "8.19.1",
    "title": "Location above clean-out",
    "description": "The entrance of a vent connector into a chimney shall be above the chimney clean-out opening."
  },
  {
    "clause": "8.19.2",
    "title": "Connection to chimney",
    "description": "The vent connector shall not protrude into the chimney and obstruct the chimney flue."
  },
  {
    "clause": "8.19.3",
    "title": "Cleaning sleeve",
    "description": "A sleeve shall be used to facilitate removal of the vent connector for cleaning."
  },
  {
    "clause": "8.19.4",
    "title": "Chimney liner connection",
    "description": "The space between a chimney and chimney liner shall be sealed at the point of entry of a vent connector."
  },
  {
    "clause": "8.20",
    "title": "Size and height of interconnected vent connectors",
    "description": "Two or more vent connectors may be joined through a common vent connector, provided that a) each vent connector has the greatest possible rise consistent with the headroom available and has the required clearances from combustible material; b) the size of each vent connector is in accordance with Clauses 8.18.5 and 8.18.7; and c) in the case of positive pressure appliances, the appliance or common vent system meets the requirements of Clause 8.10.6, as applicable."
  },
  {
    "clause": "8.21.1",
    "title": "Common gas vents",
    "description": "A common gas vent is permissible in multi-storey installations to vent appliances a) certified with a draft hood; or b) certified and marked for use with a Type B vent and located on one or more floor levels, provided that the venting system is installed in accordance with the requirements of Clause 8.21."
  },
  {
    "clause": "8.21.2",
    "title": "Appliance location and combustion air",
    "description": "When a common gas vent is used in accordance with Clause 8.21.1, the gas appliances shall a) be installed in an enclosure having access solely from an unoccupied space such as a hallway, service area, or outdoor balcony; and b) have combustion air supplied to the enclosure by means of grilles or ducts that communicate directly with the outdoors, are sized in accordance with the requirements of Table 8.1 or 8.2, and are installed in accordance with Clause 8.3. Combustion air shall not be taken from inhabited or occupied spaces within the building."
  },
  {
    "clause": "8.21.3",
    "title": "Location exemption for one dwelling unit",
    "description": "The requirements of Clause 8.21.2 shall not apply if all appliances served by a common venting system are located within one dwelling unit."
  },
  {
    "clause": "8.21.4",
    "title": "Return air requirements",
    "description": "When a forced-air furnace is installed in an enclosure in accordance with Clause 8.21.2 no opening shall be located in the furnace return-air system within the enclosure, and means shall be provided on the return-air system to prevent the infiltration of air from inside the enclosure."
  },
  {
    "clause": "8.21.5",
    "title": "Vent size and type",
    "description": "When a common gas vent is used in accordance with Clause 8.21.1, the common gas vent shall be a) of a Type B or Type L vent; b) sized in accordance with the requirements indicated in Tables C.3 and C.4 and illustrated in Figures C.11 and C.12 of Annex C; and c) installed in accordance with the manufacturer's instructions."
  },
  {
    "clause": "8.21.6",
    "title": "Replacement appliances",
    "description": "With approval of the authority having jurisdiction, a common chimney is permissible in multi-storey installations to vent appliances replacing existing appliances, provided that a) new appliances are of the same size (input capacity with similar efficiency range) and venting type (fan-assisted or natural draft) as the original; b) the venting system does not include significant changes; and c) the venting system provides effective venting and shows no signs of condensation or deterioration. Evidence shall be provided to authenticate the characteristics of the replaced appliance to the authority having jurisdiction."
  },
  {
    "clause": "8.22",
    "title": "Dampers and attachments",
    "description": "A device or attachment that might in any way impair either the combustion or safe venting of the combustion products shall be prohibited."
  },
  {
    "clause": "8.23.1",
    "title": "Zero over-fire draft appliances",
    "description": "Except for an incinerator, a dual oven-type combination range, and a direct-vent appliance, an appliance requiring zero over-fire draft for operation shall be installed with a draft hood."
  },
  {
    "clause": "8.23.2",
    "title": "Positive over-fire or induced draft appliances",
    "description": "A draft hood shall not be used on an appliance with either positive over-fire draft or an induced draft."
  },
  {
    "clause": "8.23.3",
    "title": "Appliance supplied draft hood",
    "description": "A draft hood either supplied with or forming part of an appliance shall be installed without alteration."
  },
  {
    "clause": "8.23.4",
    "title": "Approved design",
    "description": "When a draft hood is required and it is not supplied by the appliance manufacturer, it shall be supplied by the installer, and it shall be of an approved design."
  },
  {
    "clause": "8.23.5",
    "title": "Outlet size",
    "description": "The draft-hood outlet shall be of the same size as the appliance flue collar unless otherwise sized in the appliance manufacturer's instructions."
  },
  {
    "clause": "8.23.6",
    "title": "Location to combustion air",
    "description": "A draft hood shall be in the same room as the combustion air opening of the appliance. A draft hood shall not be installed in a false ceiling space, in a room other than the one the appliance serves, or in any manner that could permit a difference in pressure between the draft-hood relief opening and the combustion air supply."
  },
  {
    "clause": "8.23.7",
    "title": "Installation orientation",
    "description": "A draft hood shall be installed in the position for which it was designed with reference to the horizontal and vertical planes, and shall be located so that the relief opening is not obstructed by any part of the appliance or adjacent construction. The appliance and its draft hood shall be located so that the relief opening is accessible for checking vent operation."
  },
  {
    "clause": "8.23.8",
    "title": "Draft regulators",
    "description": "A draft regulator shall not be used as a substitute for a draft hood."
  },
  {
    "clause": "8.24.1",
    "title": "Exclusions",
    "description": "The requirements for a draft-control device in Clauses 8.8 to 8.24 shall not apply either to a direct-vent appliance or to an appliance requiring a special venting system."
  },
  {
    "clause": "8.24.2",
    "title": "Power venters",
    "description": "A power venter may be used in place of a natural-draft vent, provided that means are provided to prevent the flow of gas to the main burner in the event of failure of the power venter. Such a venter shall not be used in conjunction with an incinerator."
  },
  {
    "clause": "8.24.3",
    "title": "Vent connectors",
    "description": "A vent connector that serves an appliance designed for natural-draft venting shall not be connected to any portion of a venting system that is under positive pressure or serves an appliance requiring a special venting system."
  },
  {
    "clause": "8.24.4",
    "title": "Exhaust systems",
    "description": "An exhaust hood or canopy for an industrial appliance may be used in place of a direct flue connection in certain cases, for instance, when the process itself requires fume disposal. The design of the venting system shall conform to the requirements of the authority having jurisdiction."
  },
  {
    "clause": "8.24.5",
    "title": "Venting directly into space",
    "description": "When located in a large and adequately ventilated space, an appliance may be operated by discharging the combustion products directly into the space, subject to the approval of the authority having jurisdiction and provided that the maximum input of the appliance does not exceed 20 Btu/h/ft³ (0.2 kW/m³) of the space in which the appliance is located."
  },
  {
    "clause": "8.24.6",
    "title": "Multiple appliances",
    "description": "A venting system that serves one or more appliances shall provide adequate venting and shall be sized in accordance with approved engineering design."
  },
  {
    "clause": "8.25",
    "title": "Draft regulators",
    "description": "A draft regulator, when used, shall be located so that the relief opening is not obstructed by any part of the appliance or adjacent construction. When used with an incinerator, a draft regulator shall be of the single-acting type. In all other installations, it shall be of the double-acting type."
  },
  {
    "clause": "8.26.1",
    "title": "Integral component",
    "description": "An electrically operated automatic vent damper device shall not be used in a dwelling unit except where the device is provided as an integral component of a certified appliance."
  },
  {
    "clause": "8.26.2",
    "title": "Vent types",
    "description": "A residential appliance certified with an automatically operated vent damper device shall be connected to a) a Type B vent complying with CAN/ULC-S605; b) a Type L vent complying with CAN/ULC-S609; c) a factory-built chimney complying with CAN/ULC-S604, CAN/ULC-S629, or UL 959; or d) either a masonry or a concrete chimney lined with a certified chimney liner."
  },
  {
    "clause": "8.26.3",
    "title": "Thermally actuated vent damper",
    "description": "A thermally actuated automatic vent damper device shall be installed a) in accordance with the manufacturer's instructions; and b) only in the vent connector of an appliance equipped with a draft hood that is connected to i) a certified factory-built chimney, Type B vent, or Type L vent; or ii) a masonry chimney flue that is lined in accordance with Clause 8.12.10."
  },
  {
    "clause": "8.26.4",
    "title": "Appliance installation",
    "description": "An automatic flue damper a) shall not be installed on an appliance within a dwelling unit except when provided as an integral component of a certified appliance; b) shall not be installed on an appliance equipped with a draft hood or a draft regulator; c) when installed on an appliance equipped with a continuous pilot, shall be designed or constructed to provide a fixed minimum opening of 20% of the flue area and shall be interlocked with the burner control system; and d) when installed on an appliance equipped with an intermittent pilot, an interrupted pilot, direct-spark ignition, or hot surface ignition of the main burner, shall be interlocked with the burner control system."
  },
  {
    "clause": "8.27.1",
    "title": "Limitations for use",
    "description": "A manually operated flue damper shall not be used with a) a residential appliance; b) an appliance equipped with a draft-control device; or c) a commercial- or industrial-type appliance, unless the damper is i) provided with a fixed opening; and ii) designed, constructed, and field tested to ensure safe operation at a fixed minimum opening."
  },
  {
    "clause": "8.27.2",
    "title": "Pressure point adjuster",
    "description": "When a baffle or neutral pressure point adjuster is used, it shall a) be located upstream of the draft regulator; and b) have a fixed safe minimum opening."
  },
  {
    "clause": "8.28.1",
    "title": "Installation requirements",
    "description": "When a draft-control device is either part of an appliance or supplied by the appliance manufacturer, it shall be installed in accordance with the appliance manufacturer's installation instructions."
  },
  {
    "clause": "8.28.2",
    "title": "Installation orientation",
    "description": "A draft-control device shall be installed in the position for which it is designed with reference to the horizontal and vertical planes and shall be so located that relief openings are not obstructed."
  },
  {
    "clause": "8.29.1",
    "title": "Failure provisions",
    "description": "When an induced- or forced-draft device is used, provision shall be made to prevent the flow of gas to the burner on failure of the device."
  },
  {
    "clause": "8.29.2",
    "title": "Water heater size limitation",
    "description": "A power venter certified for use as an add-on to a water heater may be used on a water heater that has an input of 50 000 Btu/h (15 kW) or less."
  },
  {
    "clause": "8.30.1",
    "title": "General requirements",
    "description": "An appliance may be vented through an exhaust canopy installed in a location other than a dwelling unit, provided that a) the canopy complies with the requirements of the local building code or, in the absence of such, with the requirements of the National Building Code of Canada; b) the exhaust volume of the canopy is sufficient to provide for capture and removal of grease-laden vapours and products of combustion; c) the appliance has an input not exceeding 400 000 Btu/h (120 kW) and its flue outlet is directly under the canopy; and d) the appliance is interlocked with the exhaust in accordance with Clause 8.30.2, except where it is approved to ANSI Z83.11/CSA 1.8."
  },
  {
    "clause": "8.30.2",
    "title": "Appliance interlocking",
    "description": "An approved appliance not identified in Clause 8.30.1 d) may be installed under a canopy, provided that the appliance is interlocked so that operation is permitted only when exhaust airflow is proven."
  },
  {
    "clause": "8.30.3",
    "title": "Multiple appliance interlocking",
    "description": "Where more than one appliance is installed under the same canopy in accordance with Clause 8.30.2, a single system installed in accordance with Clause 8.30.2 may be used to interlock the appliances."
  },
  {
    "clause": "8.30.4",
    "title": "Booster water heater",
    "description": "Clause 8.30.2 shall not apply to a booster water heater with an input of 50 000 Btu/h (15 kW) or less that supplies water to an automatic dishwasher."
  },
  {
    "clause": "8.31.1",
    "title": "Installation requirements",
    "description": "A heat reclaimer shall not be used with a gas-fired appliance installed in a dwelling unit, in mobile housing, or in a recreational vehicle unless it is a) approved for the application; and b) installed in accordance with the manufacturer's instructions."
  },
  {
    "clause": "8.31.2",
    "title": "Commercial or industrial requirements",
    "description": "A heat reclaimer installed on a commercial or industrial gas-fired appliance shall be a) approved for the application; and b) installed in accordance with the manufacturer's instructions."
  },
  {
    "clause": "8.32.1",
    "title": "Overpressure forces",
    "description": "Combustion exhaust systems for engine-driven appliances shall be designed and constructed to withstand forces caused by the ignition of unburned fuel or shall have provisions to relieve those forces without damaging the exhaust system."
  },
  {
    "clause": "8.32.2",
    "title": "Protection of fabricated venting systems",
    "description": "Unlisted exhaust venting systems shall be deemed to meet the requirements of Clause 8.32.1 provided that a) the unlisted chimney conforms to Clause 8.18.2 and NFPA 211; and b) are constructed of material that is at least equivalent to Schedule 10 stainless steel pipe, fabricated with welded joints, and pressure tested to 50 psig (340 kPa)."
  },
  {
    "clause": "8.32.3",
    "title": "Commercial or industrial requirements",
    "description": "Where over-pressure relief devices that form part of a certified chimney system are used to meet the requirement of Clause 8.32.1 the over-pressure relief device may terminate inside a dedicated service room containing the engine-driven appliance or engine enclosure provided a) they are readily visible for inspection; and b) there is no visual evidence that the relief device is leaking combustion products."
  },
   {
    "clause": "9.1.1",
    "title": "Applicability",
    "description": "Manifold applications shall comply with the requirements of Clause 7.2, and cylinder-filling applications shall comply with the requirements of Clause 9."
  },
  {
    "clause": "9.1.2",
    "title": "Protection",
    "description": "Compressors, cylinders, valves, regulators, gauges, piping, tubing, hose, and other equipment shall be protected against damage."
  },
  {
    "clause": "9.1.3",
    "title": "Installation occupancy",
    "description": "The compressor shall only be installed in industrial occupancies as defined in the National Building Code of Canada, unless otherwise approved."
  },
  {
    "clause": "9.1.4",
    "title": "Exposure",
    "description": "The compressor shall be installed indoors or outdoors in accordance with its certification."
  },
  {
    "clause": "9.1.5",
    "title": "Vibration isolation",
    "description": "Where required, a compressor shall be isolated from vibration at the inlet and outlet by a gas hose."
  },
  {
    "clause": "9.1.6",
    "title": "Component pressure rating",
    "description": "Piping, hose, and fittings utilized in the cylinder manifold shall be rated for a minimum of 1.5 times the maximum operating pressure."
  },
  {
    "clause": "9.1.7",
    "title": "Supply capacity",
    "description": "The gas supplier or distributor shall be notified by the installer prior to installing a compressor to analyze capacity considerations."
  },
  {
    "clause": "9.2.1",
    "title": "Qualification",
    "description": "Refillable cylinders shall be manufactured, tested, inspected, and marked in accordance with the requirements of the Transportation of Dangerous Goods Regulations (TDG Regulations) of Transport Canada."
  },
  {
    "clause": "9.2.2",
    "title": "Maximum capacity",
    "description": "Cylinders used indoors shall have a water capacity not greater than 175 lb (80 kg)."
  },
  {
    "clause": "9.2.3",
    "title": "Marking",
    "description": "In addition to the marking requirements, the cylinder shall be legibly marked \"FOR NATURAL GAS ONLY\". The equivalent French wording is \"GAZ NATUREL SEULEMENT\"."
  },
  {
    "clause": "9.2.4",
    "title": "Requalification",
    "description": "Re-examination and re-marking of a refillable cylinder shall be done in accordance with the TDG Regulations of Transport Canada."
  },
  {
    "clause": "9.2.5",
    "title": "Protection",
    "description": "Cylinders shall be protected as required by the TDG Regulations of Transport Canada."
  },
  {
    "clause": "9.3.1",
    "title": "Visual inspection",
    "description": "Cylinders shall be selected and filled in accordance with the requirements of the TDG Regulations of Transport Canada. Prior to filling, a cylinder shall be given a thorough visual inspection, and it shall be rejected and taken out of service if evidence is found that it has a bad dent, damaged foot ring or protective collar, corroded area, leak, or another condition that indicates a possible weakness that would render it unfit for service."
  },
  {
    "clause": "9.3.2",
    "title": "Maximum pressure",
    "description": "Cylinders used indoors shall not be filled in excess of 300 psig (2100 kPa) at 59 °F (15 °C)."
  },
  {
    "clause": "9.3.3",
    "title": "Filling operations",
    "description": "A cylinder connected for filling shall be located outdoors, unless indoor filling is approved by the authority having jurisdiction, and shall be filled through an approved manifold and an approved connector equipped with a back-check valve at the point of cylinder connection; located not less than 3 ft (0.9 m) from a building opening or air intake; and located not less than 10 ft (3 m) from a mechanical air intake."
  },
  {
    "clause": "9.3.4",
    "title": "Filling manifold",
    "description": "The manifold specified in Clause 9.3.3 a) i) shall be located outdoors, unless indoor filling is approved by the authority having jurisdiction, and shall be connected to the compressor with rigid piping or tubing; and installed in accordance with Clause 9.1.1."
  },
  {
    "clause": "9.3.5",
    "title": "Indoor filling",
    "description": "Where the authority having jurisdiction permits indoor filling, the room in which filling takes place shall be vented to the outdoors by a mechanical ventilation system equipped with a proven airflow interlock to stop the operation of the compressor in the event that the ventilation rate is less than 10 times the flow capacity of the compressor."
  },
  {
    "clause": "9.3.6",
    "title": "Signage",
    "description": "Signs marked \"NO SMOKING\" and \"DÉFENSE DE FUMER\" or signs using symbols shall be prominently displayed in the filling area."
  },
  {
    "clause": "9.4.1",
    "title": "Clearance to fuels",
    "description": "Any cylinder in storage shall be located not less than 20 ft (6 m) from any flammable liquid, oxidizing agent, or combustible gas other than natural gas, or shall be separated in a manner acceptable to the authority having jurisdiction."
  },
  {
    "clause": "9.4.2",
    "title": "Storage cabinet",
    "description": "Cylinders that have been in service and are not connected for use or filling shall be stored outdoors in a storage cabinet in accordance with Clause 9.4.3."
  },
  {
    "clause": "9.4.3",
    "title": "Cabinet design",
    "description": "The storage cabinet shall be supplied with a top cover; be made of noncombustible material and be structurally sound, with no openings greater than 4 in² (25.8 cm²); have at least 2 sides constructed to provide equal ventilation through openings at the top and bottom of the side, providing, as a minimum, the equivalent total opening of 15% open area on each side panel; not restrict the dispersion of any fuel gas leak to ensure it is well ventilated; have its base on a firm level footing in an upright position; and not be located against other objects, or have objects attached, that restrict ventilation."
  },
  {
    "clause": "9.4.4",
    "title": "Clearance to property line",
    "description": "Cylinders stored outdoors shall be located 5 ft (1.5 m) from a property line if the aggregate capacity of expanded gas is up to and including 6000 ft³ (170 000 L); 25 ft (7.5 m) from a property line if the aggregate of expanded gas is more than 6000 ft³ (170 000 L) and up to and including 18 000 ft³ (500 000 L); and 50 ft (15 m) from a property line if the aggregate of expanded gas exceeds 18 000 ft³ (500 000 L). This is evaluated at standard pressure of 14.7 psi absolute (101.3 kPa) and temperature of 59 °F (15 °C)."
  },
  {
    "clause": "9.4.5",
    "title": "Protection",
    "description": "Each side of a cylinder storage area exposed to vehicular traffic shall be protected by barriers, posts, or guardrails."
  },
  {
    "clause": "9.4.6",
    "title": "Cylinder valve",
    "description": "Any cylinder in storage shall have the cylinder valve closed."
  },
  {
    "clause": "9.5.1",
    "title": "Indoor safety",
    "description": "A cylinder may be used indoors to supply natural gas for welding, cutting, and preheating when portability is necessary, provided that a pressure regulator is employed and directly connected to the equipment or cylinder valve, or located on a manifold that is connected to the cylinder valve; the total number of cylinders connected to other industrial gas cylinders does not exceed four, and their aggregate volume of expanded gas to the absolute pressure of 14.696 psi (101.325 kPa) and a temperature of 59 °F (15 °C) does not exceed 1000 scf (28.3 m³). If there is more than one manifold of cylinders, the manifolds may be located in the same area, provided that they are separated by a distance of at least 15 ft (4.5 m); the cylinder, regulating equipment, and manifold are not located where they are subject to damage or to temperatures in excess of 125 °F (50 °C); and the cylinder is equipped with an excess-flow valve that is either integral to the cylinder valve or connected to the cylinder valve outlet. In either case, it shall be installed in such a manner that undue strain beyond the excess-flow valve will not cause breakage between the cylinder and the excess flow valve."
  },
  {
    "clause": "9.5.2",
    "title": "Indoor location",
    "description": "A cylinder in use inside a building shall not be located near an exit, a stairway, or an area normally used or intended for the safe evacuation of people."
  },
  {
    "clause": "9.5.3",
    "title": "Connection location",
    "description": "Connection and disconnection of cylinders shall be done in a well-ventilated area with no source of ignition within 10 ft (3 m) from the point of connection."
  },
{
    "clause": "10.1.1",
    "title": "Vehicle refuelling appliance (VRA) installation",
    "description": "A VRA that was certified to CSA 12.6 shall be installed in accordance with the manufacturer's installation instructions and local requirements, including fire regulations, building codes, and zoning requirements. Note: This clause is for VRAs that were certified to CSA 12.6-M94 and CSA 12.6-2004."
  },
  {
    "clause": "10.1.2",
    "title": "RFA installation",
    "description": "An RFA shall be certified to CSA/ANSI NGV 5.1 and shall be installed in accordance with the manufacturer's installation instructions and local requirements, including fire regulations, building codes, and zoning requirements."
  },
  {
    "clause": "10.1.3",
    "title": "VFA installation",
    "description": "A VFA shall be certified to CSA/ANSI NGV 5.2 and shall be installed in accordance with the manufacturer's installation instructions and local requirements, including fire regulations, building codes, and zoning requirements. Note: For VFAs connected to storage vessels, see CSA B108.1."
  },
  {
    "clause": "10.1.4",
    "title": "RFA or VFA exposure",
    "description": "An RFA or a VFA shall be installed outdoors unless certified and labelled for indoor installation. An indoor installation of an RFA or a VFA shall be in a non-living space."
  },
  {
    "clause": "10.1.5",
    "title": "RFA or VFA support",
    "description": "An RFA or a VFA shall be installed on a firm support to prevent undue stress on the gas piping system and electrical conduits."
  },
  {
    "clause": "10.1.6",
    "title": "Protection",
    "description": "The outdoor or indoor installation of an RFA or a VFA, and associated equipment, shall be protected by approved means against vehicle impact, ice build-up, flooding, and blockage of ventilation, where required."
  },
  {
    "clause": "10.1.7",
    "title": "Indoor fuelling",
    "description": "When a vehicle is fuelled indoors, a gas detector shall: a) be installed within 6 in (150 mm) of the ceiling or highest point indoors above the fuelling area, or be supplied by the RFA or VFA as mounted directly to the RFA or VFA; b) be set to activate at natural gas detection levels at and above one-fifth of the lower limit of flammability of natural gas; c) upon activation, produce an audible and visual alarm; d) be interlocked with a mechanical ventilation system (see Clause 10.1.8); and e) be interlocked to shut off the RFA or the VFA."
  },
  {
    "clause": "10.1.8",
    "title": "Ventilation",
    "description": "The mechanical ventilation system referred to in Clause 10.1.7 d) shall: a) vent the fuelling area to the outdoors at a flow rate of 25 times the flow rate of the VFA; and b) provide for minimum clearances from the discharge as specified in Table 5.3. Alternatively, the mechanical ventilation system may be determined by the RFA or VFA installation instructions."
  },
  {
    "clause": "10.2.1",
    "title": "Vent discharge",
    "description": "The discharge from pressure relief devices, and other vents and vent lines, shall be vented to the outdoors: a) at least 3 ft (0.9 m) away from sources of ignition; b) a minimum of 3 ft (0.9 m) horizontally distant from, and 6 in (150 mm) above, openings or vents into a building or space where gas is likely to accumulate; and c) away from an area occupied by the public, e.g., a sidewalk."
  },
  {
    "clause": "10.2.2",
    "title": "Vent termination",
    "description": "The outdoor vent termination shall be equipped with a means to prevent the entry of water, insects, foreign material, and ice build-up."
  },
  {
    "clause": "10.2.3",
    "title": "Vent pipe sizing",
    "description": "The vent piping and tubing shall be sized so that the capacity of the relief device is not restricted more than is allowed in the manufacturer's instructions."
  },
  {
    "clause": "10.3.1",
    "title": "Requirements",
    "description": "The following requirements shall apply to all gas piping systems required to install an RFA or a VFA and its associated equipment: a) The RFA or the VFA and associated equipment shall be installed in accordance with the manufacturer's instructions. b) The gas supply line to the inlet of the RFA or the VFA shall be installed in accordance with the requirements of Clause 6 of this Code or the authority having jurisdiction. c) Discharge piping or tubing, not connected at the factory, from the outlet of the RFA or the VFA shall be installed in accordance with the requirements of CSA B108.1."
  },
  {
    "clause": "10.3.2",
    "title": "Restrictions",
    "description": "The use of a gas hose in an installation shall be restricted to the following: a) a fuelling hose shall: i) meet CSA/ANSI NGV 4.2/CSA 12.52; ii) be limited to a maximum length of 25 ft (7.6 m); iii) be supported above the floor or ground level or otherwise protected from mechanical damage from abrasion and being driven over; and iv) be equipped with a breakaway quick closing device; and"
  },
  {
    "clause": "10.3.2",
    "title": "Restrictions (continued)",
    "description": "b) a gas hose installed on the gas supply line to an RFA or a VFA to prevent abrasion damage resulting from vibration shall: i) meet CSA 8.1 or CSA 8.3, and ii) be limited to a maximum length of 3 ft (0.9 m)."
  },
  {
    "clause": "10.3.3",
    "title": "Fittings",
    "description": "The number of fittings used in a supply line, discharge line, or gas hose shall be minimized to reduce the possibility of leakage."
  },
  {
    "clause": "10.3.4",
    "title": "Support",
    "description": "The discharge piping or tubing shall be supported so that there is no span greater than 4 ft (1.2 m)."
  },
  {
    "clause": "10.4",
    "title": "Testing of piping, tubing, gas hose, and fittings",
    "description": "The following requirements shall apply to a gas piping system, RFA or VFA associated equipment, and components: a) They shall be tested in accordance with the manufacturer's instructions. b) The supply line to the inlet of an RFA or a VFA shall be tested in accordance with the requirements of Clause 6.22. c) Discharge piping or tubing and gas hose, not connected at the factory, from the outlet of an RFA or a VFA shall be installed in accordance with the test pressure requirement of CSA B108.1."
  },
  {
    "clause": "10.5",
    "title": "Installation of safety equipment, signs, and/or symbols",
    "description": "There shall be a prominently displayed, readily visible sign within 10 ft (3 m) of a point of transfer at an NGV dispensing location: a) with the words \"NO SMOKING — TURN IGNITION OFF DURING VEHICLE REFUELLING\"* in black letters not less than 1/2 in (12 mm) in height on a safety yellow background; or b) with the international symbols for \"NO SMOKING\"† and \"IGNITION OFF\"‡ at least 2 in (50 mm) in diameter, coloured red and black on a white background. * The equivalent French wording is \"DÉFENSE DE FUMER — ÉTEINDRE LE MOTEUR AVANT LE REMPLISSAGE\". † The equivalent French wording is \"DÉFENSE DE FUMER\". ‡ The equivalent French wording is \"ÉTEINDRE LE MOTEUR\"."
  },
  {
    "clause": "10.6",
    "title": "Refuelling of vehicles",
    "description": "A vehicle being refuelled with NGV shall have its engine turned off."
  },
  {
    "clause": "C.1",
    "title": "General",
    "description": "This informative (non-mandatory) Annex has been written in normative (mandatory) language to facilitate adoption where users of the Code or regulatory authorities wish to adopt it formally as additional requirements to this Code.",
    "annex": "C",
    "category": "General"
  },
  {
    "clause": "C.1.1",
    "title": "Vent sizing table development and application",
    "description": "These tables were developed to provide a convenient method of determining vent sizes for venting natural-draft and fan-assisted Category I appliances. Additionally, the tables provide the vent sizes that apply to spillage-susceptible appliances such as natural-draft appliances in either tight structures (as defined in Clause 8.2.1) or structures where the mechanical ventilation is designed for no more than 5 Pa (0.02 in w.c.) depressurization.",
    "annex": "C",
    "category": "Tables"
  },
  {
    "clause": "C.1.2",
    "title": "Depressurization (DP) column application",
    "description": "The values applicable to spillage-susceptible appliances are listed in the DP (depressurization) column and are based upon building depressurization of 0.02 in w.c. (5 Pa). The DP column shall not be used for mechanically ventilated systems that allow more than 0.02 in w.c. (5 Pa) depressurization, nor shall spillage-susceptible appliances be installed in this type of environment.",
    "annex": "C",
    "category": "Tables"
  },
  {
    "clause": "C.1.3",
    "title": "Vent sizing limitations and table coverage",
    "description": "Currently, this Code does not provide vent sizing for Category I fan-assisted appliances and for spillage-susceptible appliances under depressurization. These tables address this deficiency in the Code. Values under the DP column apply only to installations containing draft-hood-equipped appliances or combinations of Category I fan-assisted appliances and draft-hood-equipped appliances. These tables also provide vent sizes for several vented appliances that share a common vent, and vent sizes for tile-lined masonry chimneys. Notes: 1) The Installation Code Committee gratefully acknowledges the research conducted by the Canadian Gas Research Institute (CGRI) and the independent research sponsored by the Gas Research Institute to generate the tables in this Annex. The research was conducted using a computer program, VENT-II, developed by Batelle. Recognition is given to both research organizations for allowing CSA Group to publish the tables in this Annex. 2) For vent-sizing requirements not covered by the tables in this Annex, please refer to the applicable installation codes. 3) Please refer to Clause 3 of this Code for definitions of terms used in this Annex.",
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
    "clause": "C.2.1",
    "title": "Table application scope",
    "description": "All requirements contained in this Annex apply to both Category I draft-hood-equipped and Category I fan-assisted combustion appliances. At no time shall a venting system for a certified Category II, III, or IV appliance be sized with these tables. The alternative sizing methods described in this Code may also be used to size the venting system for a draft-hood-equipped appliance. At this time, alternative sizing methods have not been developed for fan-assisted appliances; therefore, until engineering data is developed to allow alternative sizing methods for Category I fan-assisted appliances, these vent tables shall be used.",
    "annex": "C",
    "category": "General"
  },
  {
    "clause": "C.2.2",
    "title": "Vent table application and limitations",
    "description": "The vent tables included in this Annex apply to vents and chimneys internal to the structure below the roof line. Exterior chimneys or vents not enclosed by the structure or a chase below the roof line can experience continuous condensation, depending on locality. A chimney with one or more sides exposed to the outside of the structure shall be considered to be an exterior chimney. A Type B vent or a certified chimney lining system passing through an unused masonry chimney flue shall not be considered to be exposed to the outdoors. The DP column shall be used to determine the capacity of a venting system within a building constructed in accordance with Clause 8.2.1.",
    "annex": "C",
    "category": "Tables"
  },
  {
    "clause": "C.2.3",
    "title": "Vent connector size reduction requirements",
    "description": "If the vent or vent connector size, determined from the tables, is smaller than the appliance draft-hood outlet or flue collar, the smaller size may be used, provided that a) the total vent height (H) is at least 10 ft (3 m); b) vents or vent connectors for appliance draft-hood outlets or flue collars 12 in (305 mm) in diameter or smaller are not reduced more than one table size [e.g., 12 in (305 mm) to 10 in (254 mm) is a one-size reduction]; c) vents or vent connectors for appliance draft-hood outlets or flue collars above 12 in (305 mm) in diameter are not reduced more than two table sizes [e.g., 24 in (610 mm) to 20 in (508 mm) is a two-size reduction]; d) the maximum capacity listed in the tables for a fan-assisted appliance is reduced by 10% (calculated as 0.90 × maximum capacity); and e) the draft-hood outlet is greater than 4 in (102 mm) in diameter. For example, a 3 in (76 mm) diameter vent or vent connector shall not be connected to a 4 in (102 mm) diameter draft-hood outlet. This provision shall not apply to fan-assisted appliances.",
    "annex": "C",
    "category": "Calculations"
  },
  {
    "clause": "C.2.4",
    "title": "Vent system configuration assumptions",
    "description": "A single-appliance venting configuration with zero lateral lengths is assumed to have no elbows in the vent system in Tables C.1 and C.2. For all other vent configurations of single or multiple appliances, each vent connector shall be assumed to have two 90° turns. For each additional 90° turn or its equivalent*, the maximum capacity of each individual vent connector listed in the venting table should be reduced by 10% (calculated as 0.90 × maximum listed capacity) for a natural draft appliance and 15% for a fan-assisted appliance. Except for manifolded common vents (see Figure C.9), the final turn into the vertical vent shall be counted as one 90° turn for each vent connector. Note: *Two 45° turns are equivalent to one 90° turn.",
    "annex": "C",
    "category": "Calculations"
  },
  {
    "clause": "C.2.5",
    "title": "Common vent connector capacity reduction",
    "description": "If vent connectors are combined prior to entering the common vent, the maximum common vent capacity listed in the common venting tables shall be reduced by 10%, the equivalent of one 90° elbow (0.90 × maximum common vent capacity). See Figure C.9. The horizontal length of the common vent connector manifold (L in Figure C.9) should not exceed 1-1/2 ft (457 mm) for each inch (25.4 mm) of common vent connector manifold diameter.",
    "annex": "C",
    "category": "Calculations"
  },
  {
    "clause": "C.2.6",
    "title": "Offset common vent capacity reduction",
    "description": "If the common vertical vent is offset as shown in Figure C.10, the maximum common vent capacity listed in the common venting tables should be reduced by 20%, the equivalent of two 90° elbows (0.80 × maximum common vent capacity). The horizontal length of the offset shall not exceed 1-1/2 ft (457 mm) for each inch (25.4 mm) of common vent diameter.",
    "annex": "C",
    "category": "Calculations"
  },
  {
    "clause": "C.2.7",
    "title": "High-altitude installation requirements",
    "description": "Use sea-level input rating when determining maximum capacity for high-altitude installation. Use actual input rating for determining minimum capacity for high-altitude installation.",
    "annex": "C",
    "category": "Calculations"
  },
  {
    "clause": "C.2.8",
    "title": "Modulating input rate requirements",
    "description": "For appliances with modulating input rates, the minimum vent or vent connector (FAN Min) capacity (determined from the tables) shall be less than the lowest appliance input rating, and the maximum vent or vent connector (FAN or NAT Max) capacity (determined from the tables) shall be greater than the highest appliance input rating.",
    "annex": "C",
    "category": "Calculations"
  },
  {
    "clause": "C.2.9",
    "title": "Fan-assisted furnace common venting requirements",
    "description": "A fan-assisted furnace may be common-vented into an existing masonry chimney, provided that a) the chimney is currently serving at least one draft-hood-equipped appliance; and b) the vent connectors and chimney are sized in accordance with Tables C.7 and C.8.",
    "annex": "C",
    "category": "General"
  },
  {
    "clause": "C.2.10",
    "title": "Fan-assisted furnace single venting prohibition",
    "description": "Single-appliance venting of a fan-assisted furnace into a tile-lined masonry chimney shall be prohibited. The chimney shall first be lined with either a Type B vent, sized in accordance with Table C.1 or C.2, or a certified lining system.",
    "annex": "C",
    "category": "General"
  },
  {
    "clause": "C.2.11",
    "title": "Corrugated metallic chimney liner requirements",
    "description": "Certified, corrugated metallic chimney liner systems in masonry chimneys shall be sized according to Table C.1 or C.2 for dedicated venting and Table C.3 or C.4 for common venting, with the maximum capacity reduced by 20% (0.80 × maximum capacity) and the minimum capacity as shown in the applicable table. Corrugated metal vent systems installed with bends or offsets require additional reduction of the vent maximum capacity (see Clause C.2.6).",
    "annex": "C",
    "category": "Calculations"
  },
  {
    "clause": "C.2.12",
    "title": "Multiple unit height measurement - single floor",
    "description": "For multiple units of gas-utilization equipment all located on one floor, available total height shall be measured from the highest draft-hood outlet or flue collar up to the level of the cap or terminal. Vent connector rise shall be measured from the draft-hood outlet or flue collar to the level where the vent gas streams come together. (This is not applicable to multi-storey installations.)",
    "annex": "C",
    "category": "Calculations"
  },
  {
    "clause": "C.2.13",
    "title": "Multi-storey installation height measurement",
    "description": "For multi-storey installations, available total height for each segment of the system shall be the vertical distance between the highest draft-hood outlet or flue collar entering that segment and the centreline of the next higher interconnection tee. (See Figure C.11.)",
    "annex": "C",
    "category": "Calculations"
  },
  {
    "clause": "C.2.14",
    "title": "Multi-storey system lowest connector sizing",
    "description": "The size of the lowest vent connector and of the vertical vent leading to the lowest interconnection of a multi-storey system shall be in accordance with Table C.1 or C.2 for available total height up to the lowest interconnection. (See Figure C.12.)",
    "annex": "C",
    "category": "Calculations"
  },
  {
    "clause": "C.2.15",
    "title": "Interpolation and extrapolation limitations",
    "description": "If the desired vent height and vent connector rise and/or lateral are between the table entries, linear interpolation shall be permitted for calculation of the permissible appliance input ratings. Extrapolation beyond the table entries shall not be acceptable.",
    "annex": "C",
    "category": "Calculations"
  },
  {
    "clause": "C.2.16",
    "title": "Vent diameter selection",
    "description": "When the vent table permits more than one diameter of pipe to be used for a vent connector or vent, the smallest permitted diameter shall be preferred.",
    "annex": "C",
    "category": "General"
  },
  {
    "clause": "C.2.16",
    "title": "Single and Multiple Appliance Venting Applications",
    "description": "For Single Appliance Venting Applications: Where the vertical vent has a larger diameter than the vent connector, the vertical vent diameter shall be used to determine the minimum vent capacity and the vent connector diameter shall be used to determine the maximum vent capacity. The flow area of the vertical vent shall not exceed 7 times the flow area of the listed appliance categorized vent area, flue collar area, or draft hood outlet area unless designed with approved engineering methods. For Multiple Appliances Venting Applications: Where 2 or more appliances are connected to a vertical vent or chimney the flow area of the largest section of vertical vent or chimney shall not exceed 7 times the flow area of smallest listed appliance categorized vent area, flue collar area, or draft hood outlet area unless designed with approved engineering methods.",
    "annex": "C",
    "category": "Calculations"
  },
   {
    "clause": "H.1",
    "title": "Purging requirement scope",
    "description": "Purging of piping and tubing systems where a readily accessible burner is not available or where an appliance is not equipped with a continuous pilot shall be undertaken as outlined in Clauses H.2 to H.7.",
    "annex": "H",
    "category": "General"
  },
  {
    "clause": "H.2",
    "title": "Purging procedure applicability",
    "description": "The procedure shall be applicable to the purging of air or inert gas using natural gas from a piping/tubing system downstream of the meter.",
    "annex": "H",
    "category": "General"
  },
  {
    "clause": "H.3",
    "title": "No smoking during purging",
    "description": "No smoking shall be permitted when purging.",
    "annex": "H",
    "category": "Safety"
  },
  {
    "clause": "H.4",
    "title": "Ignition source removal",
    "description": "Prior to commencing the purge, all sources, or potential sources, of ignition shall be removed or shut off.",
    "annex": "H",
    "category": "Safety"
  },
  {
    "clause": "H.5",
    "title": "Purging procedure conditions",
    "description": "The purging procedure shall be used only under the following conditions: a) maximum piping system size is NPS 1; b) maximum tubing size is NTS 3/4; c) maximum piping or tubing system gas pressure is 2 psig (14 kPa); d) maximum gas pressure at purging point is 11 in w.c. (2.74 kPa) or less; and e) the longest run of pipe or tubing in the system is 100 ft (30 m) or less.",
    "annex": "H",
    "category": "General"
  },
  {
    "clause": "H.6",
    "title": "Purging location requirements",
    "description": "Piping and tubing systems not meeting the conditions listed in Clause H.5 shall be purged to the outdoors. Those that do meet these conditions shall be purged in accordance with Clause H.7.",
    "annex": "H",
    "category": "General"
  },
  {
    "clause": "H.7",
    "title": "Purging procedure steps",
    "description": "The purging procedure shall be as follows: a) Use only the approved purging assembly. See Figure H.1. b) Inspect the purging assembly prior to use. Replace worn or damaged hose, and ensure that all joints are tight. c) Ensure that the manual shut-off valve for the appliance is closed. d) Connect the purging assembly to the appliance dirt pocket, where so equipped, or to the appliance piping, as close to the appliance as is practicable. e) Ensure that no sources of ignition are present within the purge area and that the purge area is well ventilated.",
    "annex": "H",
    "category": "Procedures"
  },
  {
    "clause": "H.7.f",
    "title": "Purging time determination",
    "description": "Determine the approximate purging time from Table H.1. Ensure that the purge does not exceed 100 s.",
    "annex": "H",
    "category": "Procedures"
  },
  {
    "clause": "H.7.g",
    "title": "Manual shut-off valve operation",
    "description": "Open the manual shut-off valve for the appliance.",
    "annex": "H",
    "category": "Procedures"
  },
  {
    "clause": "H.7.h",
    "title": "Begin purging process",
    "description": "Begin purging by fully opening the automatic shut-off release purging valve on the purging assembly. Purge in a continuous and uninterrupted manner. Caution: Under no circumstances shall the automatic shut-off release purging valve be fixed in the open position.",
    "annex": "H",
    "category": "Procedures"
  },
  {
    "clause": "H.7.i",
    "title": "Purging termination conditions",
    "description": "Terminate purging when the smell of gas is detected at the purging valve outlet or when the approximate purging time has been reached. Do not exceed the purging time by more than 10 s.",
    "annex": "H",
    "category": "Procedures"
  },
  {
    "clause": "H.7.j",
    "title": "Post-purging valve closure",
    "description": "When purging is terminated, close the manual shut-off valve and disconnect the purging assembly from the piping system.",
    "annex": "H",
    "category": "Procedures"
  },
  {
    "clause": "H.7.k",
    "title": "Post-purging leak testing",
    "description": "Reassemble the appliance piping, open the manual shut-off valve, and soap test the affected joints to ensure that there are no leaks.",
    "annex": "H",
    "category": "Procedures"
  },
  {
    "clause": "H.1.Table",
    "title": "Approximate purging times at 7 in w.c. (1.74 kPa)",
    "description": "Table H.1 - Approximate purging times: NPS 1/2 pipe/tubing: 10 ft (3 m) = 3 s, 20 ft (6 m) = 5 s, 60 ft (18 m) = 15 s, 100 ft (30 m) = 26 s. NPS 1 pipe/tubing: 10 ft (3 m) = 7 s, 20 ft (6 m) = 14 s, 60 ft (18 m) = 43 s, 100 ft (30 m) = 84 s. NTS 1/2 tubing: 10 ft (3 m) = 1 s, 20 ft (6 m) = 2 s, 60 ft (18 m) = 6 s, 100 ft (30 m) = 10 s. NTS 3/4 tubing: 10 ft (3 m) = 3 s, 20 ft (6 m) = 5 s, 60 ft (18 m) = 15 s, 100 ft (30 m) = 26 s.",
    "annex": "H",
    "category": "Tables"
  },
  {
    "clause": "K.2",
    "title": "ANSI Z21.80/CSA 6.22 Line pressure regulators",
    "description": "Standards and requirements for line pressure regulators used with natural gas or propane installations.",
    "annex": "K",
    "category": "General"
  },
  {
    "clause": "K.2.1",
    "title": "Line pressure regulator application and classification",
    "description": "ANSI 221.80/CSA 6.22 applies to line pressure regulators for use with either natural gas or propane. These regulators are used where it is necessary to reduce the delivered pressure after the utility service regulator to the required inlet pressure to the appliance. ANSI 221.80/CSA 6.22 only applies to regulators with an inlet pressure of either 2, 5 or 10 psig (13.8, 34.5, or 68.9 kPa), and for outlet pressures of either 2 psig (13.8 kPa), or 0.5 (3.5 kPa) psig or less, and are organized into Class I or Class II regulators as shown in Table K.1.",
    "annex": "K",
    "category": "General"
  },
  {
    "clause": "K.1.Table",
    "title": "Line Pressure Regulator Class Rating Table",
    "description": "Table K.1 - Line Pressure Regulator Class Rating: Rated inlet pressure 2 psig (13.8 kPa) - Class I maximum outlet pressure 1/2 psig (3.5 kPa), Class II not applicable. Rated inlet pressure 5 psig (34.5 kPa) - Class I maximum outlet pressure 1/2 psig (3.5 kPa), Class II maximum outlet pressure 2 psig (13.8 kPa). Rated inlet pressure 10 psig (68.9 kPa) - Class I maximum outlet pressure 1/2 psig (3.5 kPa), Class II maximum outlet pressure 2 psig (13.8 kPa). Note: Class I regulators may be adjustable to 1/2 psig (3.5 kPa) or less.",
    "annex": "K",
    "category": "Tables"
  },
  {
    "clause": "K.2.2.1",
    "title": "Overpressure protection device types",
    "description": "ANSI Z21.80/CSA 6.22 includes requirements for overpressure protection devices of the following types: a) overpressure shut-off device; b) overpressure relief device (either a regulator with internal relief, or by use of an external relief device); and c) monitoring regulator.",
    "annex": "K",
    "category": "General"
  },
  {
    "clause": "K.2.2.2",
    "title": "Overpressure protection device requirements",
    "description": "ANSI Z21.80/CSA 6.22 only requires a line pressure regulator to be provided with an overpressure protection device under the following conditions: a) The rated inlet pressure to the regulator is greater than 2 psig (13.8 kPa) [i.e., rated to either 5 psig or 10 psig (34.5 or 68.9 kPa)]; b) The outlet pressure is capable of being adjusted to deliver a pressure of 0.5 psig (3.5 kPa) or less; and c) The overpressure protection device is set to limit the downstream pressure to a maximum of 2 psig (13.8 kPa) in the event of a failure of the regulator. If a separate overpressure protection device is used, ANSI 221.80/CSA 6.22 requires that the overprotection pressure device be factory pre-assembled and supplied to the field as a unit. This would apply to overpressure shut-off devices, monitoring regulators (where a separate regulator is used), and a line relief valve.",
    "annex": "K",
    "category": "General"
  },
  {
    "clause": "K.2.2.3",
    "title": "Overpressure protection testing and pressure limits",
    "description": "The testing of the overpressure protection device only determines that, once the protection device has activated, the downstream pressure does not exceed 2 psig (13.8 kPa). This means that for an appliance with an inlet pressure of 14 in w.c. or less, in event of a failure of the upstream line pressure regulator, the appliance could be subjected to pressures of up to 2 psig (14 kPa).",
    "annex": "K",
    "category": "General"
  },
  {
    "clause": "K.2.3",
    "title": "High pressure regulator requirements",
    "description": "When the operating pressure is required to be greater than 2 psig (13.8 kPa), then a high pressure regulator (uncertified) will need to be used, since there is presently no certified regulator available that can regulate the outlet pressure to more than 2 psig.",
    "annex": "K",
    "category": "General"
  },
  {
    "clause": "K.3",
    "title": "Types of overpressure protection devices",
    "description": "Overview of different types of overpressure protection devices used with line pressure regulators.",
    "annex": "K",
    "category": "General"
  },
  {
    "clause": "K.3.1",
    "title": "Monitoring regulators",
    "description": "Monitoring regulators consist of a working regulator and a second regulator which \"monitors\" the downstream pressure of the working regulator. In the event of a failure of the working regulator, the monitoring regulator will then operate to control the downstream pressure and should be set to deliver a safe operating pressure (i.e., in accordance with overpressure setpoint requirements). If a working regulator fails, it is usually because of a failure of the diaphragm, in which case gas will leak into the upper diaphragm chamber and be vented through the bleed vent; the odour should then attract attention to the failed regulator. The monitoring regulator may be constructed either as a) a physically separate regulator, mounted either downstream of the working regulator, or mounted upstream of the working regulator and provided with a regulation sensing line piped downstream of the working regulator; or b) an integrated regulator mounted directly to the working regulator. In either case, the operating principle is the same. In event of a failure of the working regulator, this arrangement will continue to supply pressure to the downstream system, at the pressure to which the monitoring regulator is set.",
    "annex": "K",
    "category": "General"
  },
  {
    "clause": "K.3.2",
    "title": "Overpressure shut-off device (or cut-off device)",
    "description": "An overpressure shut-off device is a special diaphragm valve mounted upstream of the working regulator and provided with an external registration line piped to the downstream side of the working regulator. In the event of a failure of the working regulator, when the downstream pressure rises above setpoint, the shut-off device will close the supply of gas to the system. The pressure setpoint, therefore, must be in accordance with overpressure setpoint requirements.",
    "annex": "K",
    "category": "General"
  },
  {
    "clause": "K.3.3",
    "title": "Regulator with internal relief",
    "description": "A line pressure regulator with internal relief has a pressure relief valve that is built into the diaphragm of the working regulator that senses downstream pressure. On a pressure rise above its setpoint, the internal relief valve opens, causing downstream gas to pass into the upper diaphragm chamber, to be vented to the outdoors through the regulator vent port. The pressure setpoint, therefore, must be in accordance with overpressure setpoint requirements. The regulator will continue to supply gas to the downstream system. Note: Some regulators are offered with partial internal relief, meaning they have limited relieving capacity and might not control the downstream pressure. This Code requires internal relief valves to fully relieve the capacity of the regulator.",
    "annex": "K",
    "category": "General"
  },
  {
    "clause": "K.3.4",
    "title": "Line relief valve",
    "description": "Similar in function to the regulator with internal relief, the line relief valve is mounted on piping network immediately downstream of the pressure regulator. Note: Where a line pressure regulator is certified to ANSI 221.80/CSA 6.22 and a line relief valve is used, the relief valve must be provided with the regulator as a complete set.",
    "annex": "K",
    "category": "General"
  },
  {
    "clause": "K.3.5",
    "title": "Overpressure protection setpoints",
    "description": "Clause 5.3 specifies the requirements for use of overpressure protection devices and for setting of their control setpoints. Figure K.2 illustrates the logic for determining these requirements.",
    "annex": "K",
    "category": "General"
  },
  {
    "clause": "K.4",
    "title": "Multi-stage regulation for natural gas",
    "description": "Where the delivery pressure after the service regulator is either than 2, 5, or 10 psig (13.8, 34.5, or 68.9 kPa) and the appliance inlet pressure is 2 psig (13.8 kPa) or less, then two (or more) stages of line pressure regulators will be required. The first-stage regulator will reduce the service delivery pressure to a pressure of 2, 5, or 10 psig (13.8, 34.5, or 68.39 kPa), and then the second-stage pressure regulator (i.e., uncertified regulator since there is presently no certified regulator available that can regulate the outlet pressure to greater than 2 psig (13.8 kPa). See Figure K.3.",
    "annex": "K",
    "category": "Calculations"
  },
  {
    "clause": "K.5",
    "title": "Leak limiters and ventilated spaces",
    "description": "Line pressure regulators certified to ANSI Z21.80/CSA 6.22 can be provided with a vent limiter (also known informally as a leak-limiting device), which, if there is a small leak in the diaphragm, will limit the leakage rate through the regulator vent connection to a prescribed amount. The Code permits such regulators to be installed inside the building and does not require the regulator to be piped to the outdoors provided the regulator is located in a ventilated space. While high pressure regulators and other uncertified regulators may also be equipped with a vent limiter, this Code does not allow this exemption for such pressure regulators. While the Code provides a definition for a ventilated space, it does not state any performance criteria to demonstrate if the space is suitably ventilated to prevent a hazardous accumulation of gas in the space. However, if such demonstration is required by an authority having jurisdiction, CSA C22.1, rule 18-050, Appendix B, references API RP 505, which states that the concentration of a flammable gas should not exceed 25% of the lower explosion limit (LEL) of a flammable gas for a room to be a \"ventilated room\". This 25% LEL is commonly used in other standards as an upper control limit. Natural gas LEL is 5% by room volume. For a pressure regulator emitting 2.5 CFH natural gas, and for it not to exceed 1.25% by room volume, then the space must have an air change rate of only 200 CFH or 3.33 CFM. This is a very low ventilation rate (it cannot be measured accurately by commercial measuring equipment). For propane, the LEL is 2.1% by room volume. At a release rate of 1 CFH, this has the same ventilation rate for natural gas (i.e., a ventilation rate of 200 CFH or 3.333 CFM). One possible means of meeting this requirement is to provide a mechanical ventilation system that will exhaust 500 ft³ in 1 h (on a continuous or non-continuous basis); this will provide a factor of safety of 2.5:1 to allow for incomplete mixing of the gas in the space. For a continuous ventilation system, 500 CFH is only 8.3 CFM. If the fan only operates 5 min per h, then the required ventilation exhaust rate is 100 CFM. For comparison, a typical residential washroom exhaust fan is 80 to 100 CFM.",
    "annex": "K",
    "category": "Calculations"
  },
 {
    "clause": "M.1",
    "title": "Annex M application scope",
    "description": "This Annex applies to appliances that a) are on display at shows, exhibitions, or other similar events; and b) are designed to be used outdoors or vented to the outdoors.",
    "annex": "M",
    "category": "General"
  },
  {
    "clause": "M.2",
    "title": "Indoor operation conditions",
    "description": "An appliance may be operated and vented indoors if it meets the requirements of this Annex.",
    "annex": "M",
    "category": "General"
  },
  {
    "clause": "M.3",
    "title": "Demonstration purpose only",
    "description": "An appliance shall only be used for the purpose of demonstrating its operation and shall not be used for heating space, water, or any other thing or for any other purpose.",
    "annex": "M",
    "category": "General"
  },
  {
    "clause": "M.4",
    "title": "Warning sign requirements",
    "description": "An appliance certified or approved for outdoor use being operated indoors for the purpose of demonstration shall be clearly marked with a warning that this appliance is for outdoor use only and the sign shall read: WARNING - THE USE OF THIS TYPE OF APPLIANCE IS PROHIBITED FOR INDOOR USE. FOR YOUR SAFETY THE UNIT IN THIS DISPLAY IS CONSTANTLY MONITORED FOR THE PRESENCE OF CARBON MONOXIDE. TO PROTECT YOU AND YOUR FAMILY NEVER USE A (name of the appliance i.e. BBQ, Patio Heater, Fire Pit, etc.) INDOORS, INCLUDING A GARAGE. ATTENTION - L'UTILISATION DE CE TYPE D'APPAREIL EST INTERDITE POUR L'UTILISATION À L'INTÉRIEUR. POUR VOTRE SÉCURITÉ L'APPAREIL DANS CETte EXPOSITION EST SURVEILLÉ CONSTAMMENT POUR LA PRÉSENCE DE MONOXYDE DE CARBONE. POUR PROTÉGER VOUS ET VOTRE FAMILLE, N'UTILISER JAMAIS (name of the appliance i.e. BBQ, Patio Heater, Fire Pit, etc.) À L'INTÉRIEUR, Y COMPRIS UN GARAGE. The sign shall be located immediately adjacent to the appliance and in clear view of the public, and the letters shall be a minimum 1 in (25 mm) high.",
    "annex": "M",
    "category": "Safety"
  },
  {
    "clause": "M.5",
    "title": "Installation and activation requirements",
    "description": "An appliance shall be installed and activated initially by a person holding an appropriate valid certificate under the authority having jurisdiction.",
    "annex": "M",
    "category": "General"
  },
  {
    "clause": "M.6",
    "title": "Knowledgeable operator requirements",
    "description": "A person who has knowledge of the manufacturer's operating instructions for the appliance shall be in constant and immediate control of the operation of the appliance. A copy of the manufacturer's instructions shall be left with the appliance.",
    "annex": "M",
    "category": "General"
  },
  {
    "clause": "M.7",
    "title": "Appliance certification requirement",
    "description": "An appliance shall be certified or approved.",
    "annex": "M",
    "category": "General"
  },
  {
    "clause": "M.8",
    "title": "Carbon monoxide monitoring requirements",
    "description": "The level of carbon monoxide in the vicinity of an appliance shall a) be measured at intervals not exceeding 3 h; b) be measured 4 ft (1.2 m) above the floor and 4 ft (1.2 m) horizontally from the appliance; and c) be recorded with the date and time the measurements were made. The record of levels of carbon monoxide made shall be kept where the appliance is displayed and for the entire period of its display.",
    "annex": "M",
    "category": "Safety"
  },
  {
    "clause": "M.9",
    "title": "Carbon monoxide shutdown requirement",
    "description": "An appliance shall be shut down if the carbon monoxide level determined under Clause M.8 exceeds 25 ppm.",
    "annex": "M",
    "category": "Safety"
  },
  {
    "clause": "M.10",
    "title": "Physical protection requirements",
    "description": "A means shall be provided to physically protect any person from contact with hot surfaces, hot gases, or flames resulting from operation of an appliance.",
    "annex": "M",
    "category": "Safety"
  },
  {
    "clause": "M.11",
    "title": "Fire extinguisher requirements",
    "description": "A certified portable fire extinguisher classified in accordance with ULC Standard CAN/ULC-S508-02 (R2013) \"Standard for the Rating and Fire Testing of Fire Extinguishers\" of not less than 10-B:C rating shall be located at each booth or stall displaying appliances.",
    "annex": "M",
    "category": "Safety"
  } 
];

// Move SearchBar component outside to prevent re-creation on every render
const SearchBar = React.memo(({ 
  query, 
  onQueryChange, 
  onSubmit, 
  onFocus, 
  onBlur, 
  placeholder, 
  isDisabled, 
  suggestions, 
  showSuggestions, 
  onSuggestionClick 
}) => {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={onSubmit}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            value={query}
            onChange={onQueryChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={isDisabled}
            style={{
              width: '100%',
              padding: '1rem 3.5rem 1rem 1.5rem',
              border: '2px solid #e9ecef',
              borderRadius: '12px',
              fontSize: '1rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              opacity: isDisabled ? 0.6 : 1,
              cursor: isDisabled ? 'not-allowed' : 'text',
              backgroundColor: isDisabled ? '#f8f9fa' : 'white',
              color: isDisabled ? '#6c757d' : '#2c3e50'
            }}
          />
          <button
            type="submit"
            disabled={isDisabled}
            style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: isDisabled ? '#bdc3c7' : 'linear-gradient(135deg, #3498db, #2980b9)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            🔍 Search
          </button>
        </div>
      </form>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid #f8f9fa' : 'none',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// Email Modal Component - also moved outside
const EmailModal = React.memo(({ isOpen, onClose, onSubmit, isSubmitting, error }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate email
    const validation = validateEmail(email);
    if (!validation.isValid) {
      setEmailError(validation.errors[0]);
      return;
    }
    
    setEmailError('');
    await onSubmit(email);
  }, [email, onSubmit]);

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
    setEmailError('');
  }, []);

  // Reset email state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setEmailError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
            Start Your Free 7-Day Trial
          </h2>
          <p style={{ color: '#6c757d', margin: 0, lineHeight: '1.5' }}>
            Get instant access to both CSA B149.1-25 and B149.2-25 codes. No credit card required.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="your@company.com"
              required
              disabled={isSubmitting}
              autoComplete="email"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                color: '#333'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
            />
            {(emailError || error) && (
              <p style={{ color: '#e74c3c', fontSize: '0.9rem', margin: '0.5rem 0 0 0' }}>
                {emailError || error}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                flex: '1',
                minWidth: '120px',
                padding: '0.75rem 1.5rem',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#6c757d',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: '2',
                minWidth: '140px',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: isSubmitting ? '#bdc3c7' : '#3498db',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isSubmitting ? 'Starting Trial...' : 'Start Free Trial'}
            </button>
          </div>
        </form>

        <div style={{
          fontSize: '0.8rem',
          color: '#95a5a6',
          textAlign: 'center',
          margin: '1rem 0 0 0',
          lineHeight: '1.4'
        }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            ✅ No credit card required • ✅ Cancel anytime • ✅ Full access during trial
          </p>
        </div>
      </div>
    </div>
  );
});

// Result highlighting component
const HighlightedText = React.memo(({ text, highlight }) => {
  if (!highlight) return text;
  
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return parts.map((part, index) => 
    part.toLowerCase() === highlight.toLowerCase() ? (
      <mark key={index} style={{ backgroundColor: '#fff3cd', padding: '0 2px' }}>
        {part}
      </mark>
    ) : part
  );
});

const App = () => {
  // Search type state
  const [activeSearchType, setActiveSearchType] = useState('b149-1'); // 'b149-1', 'b149-2', 'regulations'
  
  // Search indices
  const [csaSearchIndex, setCsaSearchIndex] = useState(null);
  const [regulationsSearchIndex, setRegulationsSearchIndex] = useState(null);
  
  // Original app state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [accessStatus, setAccessStatus] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Search suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // AI Interpretation state
  const [showAIInterpretation, setShowAIInterpretation] = useState(false);
  const [selectedCodeForAI, setSelectedCodeForAI] = useState(null);

  // Authentication state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDeviceManager, setShowDeviceManager] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize search indices on component mount
  useEffect(() => {
    // Initialize CSA B149.2 search index
    if (csaB149Data?.document) {
      const csaIndex = createCSASearchIndex();
      setCsaSearchIndex(csaIndex);
    }
    
    // Initialize regulations search index
    if (regulationsData && regulationsData.length > 0) {
      const regIndex = createRegulationSearchIndex(regulationsData);
      setRegulationsSearchIndex(regIndex);
    }
  }, []);

  // Replace your testPaymentSuccess function
  const testPaymentSuccess = useCallback(() => {
    paymentHandler.testPaymentSuccess();
  }, []);

  // Debug function for access testing
  const debugAccessStatus = useCallback(() => {
    console.log('=== DEBUG ACCESS STATUS ===');
    console.log('currentUser:', currentUser);
    console.log('activeSearchType:', activeSearchType);
    console.log('accessStatus:', accessStatus);
    console.log('========================');
  }, [currentUser, activeSearchType, accessStatus]);

  // Initialize authentication and check for existing session
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('App: Initializing authentication...');
        
        // Try to restore existing authentication session
        const { default: vercelAuth } = await import('./services/vercelAuth.js');
        const restoredUser = await vercelAuth.init();
        
        if (restoredUser && restoredUser.hasAccess) {
          console.log('App: Restored authenticated user:', restoredUser.email);
          setCurrentUser(restoredUser);
          setAccessStatus({
            hasAccess: true,
            type: 'subscription',
            user: restoredUser
          });
        } else {
          console.log('App: No authenticated session, using trial manager');
          setAccessStatus(trialManager.getAccessStatus());
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        setAccessStatus(trialManager.getAccessStatus());
      }
    };

    initAuth();
    
    // Expose debug function to window for testing (but avoid circular reference)
    if (typeof window !== 'undefined') {
      window.debugAccessStatus = () => {
        console.log('=== DEBUG ACCESS STATUS ===');
        console.log('currentUser:', currentUser);
        console.log('activeSearchType:', activeSearchType);
        console.log('accessStatus:', accessStatus);
        console.log('========================');
      };
    }
  }, [currentUser, activeSearchType, accessStatus]);

  // Update your useEffect (replace the existing one)
  useEffect(() => {
    console.log('App: Initializing...');
    
    // Initialize payment handler first
    paymentHandler.init();
    
    // Get comprehensive access status (includes both trial and subscription)
    const status = trialManager.getAccessStatus();
    console.log('App: Initial access status:', status);
    setAccessStatus(status);
    
    // Listen for storage changes (in case subscription is activated in another tab)
    const handleStorageChange = (event) => {
      console.log('App: Storage change detected:', event);
      const updatedStatus = trialManager.getAccessStatus();
      console.log('App: Updated access status from storage:', updatedStatus);
      setAccessStatus(updatedStatus);
    };
    
    // Listen for payment success events
    const handlePaymentSuccess = (event) => {
      console.log('App: Payment success event received:', event);
      
      // Refresh access status after successful payment
      const updatedStatus = trialManager.getAccessStatus();
      console.log('App: Updated access status after payment:', updatedStatus);
      setAccessStatus(updatedStatus);
      
      // Check if user is already signed in
      if (!currentUser) {
        // Show sign-up modal for post-payment account creation
        console.log('App: Payment successful, showing auth modal for account creation');
        setTimeout(() => {
          setShowAuthModal(true);
        }, 2000); // Delay to let payment success message show
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('paymentSuccess', handlePaymentSuccess);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('paymentSuccess', handlePaymentSuccess);
    };
  }, []);

  // Clear search when switching types
  useEffect(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [activeSearchType]);

  // Built-in search function for B149.1-25
  const searchCodes = useCallback((query) => {
    if (!query || query.trim() === '') return [];
    
    const searchTerm = query.toLowerCase().trim();
    
    return fullCSAData.filter(item => {
      // Check clause number
      if (item.clause && item.clause.toLowerCase().includes(searchTerm)) return true;
      
      // Check title
      if (item.title && item.title.toLowerCase().includes(searchTerm)) return true;
      
      // Check description
      if (item.description && item.description.toLowerCase().includes(searchTerm)) return true;
      
      // Check annex letter
      if (item.annex && item.annex.toLowerCase().includes(searchTerm)) return true;
      
      // Check category
      if (item.category && item.category.toLowerCase().includes(searchTerm)) return true;
      
      return false;
    });
  }, []);

  // Get popular search terms for CSA codes
  const getPopularSearchTerms = useCallback(() => {
    return ['BTU', 'venting', 'clearance', 'CSA', 'accessory', 'appliance', 'gas piping', 'installation', 'safety'];
  }, []);

  // Handle search input change with debounced suggestions
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 1 && (activeSearchType === 'b149-1' || activeSearchType === 'b149-2')) {
      const popularTerms = getPopularSearchTerms();
      const filtered = popularTerms.filter(term => 
        term.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [activeSearchType, getPopularSearchTerms]);

  // Handle search with proper analytics tracking
  const handleSearch = useCallback((searchQuery) => {
    // Handle regulations search (free)
    if (activeSearchType === 'regulations') {
      if (regulationsSearchIndex) {
        const searchResults = searchRegulations(searchQuery, regulationsSearchIndex);
        setResults(searchResults);
        setQuery(searchQuery);
        setShowSuggestions(false);
        trackSearch(searchQuery, searchResults.length);
      }
      return;
    }

    // For both B149.1-25 and B149.2-25, check premium access using the new logic
    const hasAccess = hasAccessToPremiumFeatures();
    console.log('handleSearch: hasAccessToPremiumFeatures returns:', hasAccess);
    console.log('handleSearch: currentUser:', currentUser);
    console.log('handleSearch: currentUser?.hasAccess:', currentUser?.hasAccess);
    
    // If user has access (authenticated with subscription OR trial), perform search
    if (hasAccess) {
      // If it's a trial user (not authenticated), record search
      if (!currentUser) {
        const currentStatus = trialManager.getAccessStatus();
        if (currentStatus.type === 'trial') {
          const success = trialManager.recordSearch(searchQuery);
          if (!success) return; // Daily limit reached
        }
      }
      
      setQuery(searchQuery);
      setShowSuggestions(false);
      
      // Perform the appropriate search based on type
      if (activeSearchType === 'b149-1') {
        // B149.1-25 search
        const searchResults = searchCodes(searchQuery);
        setResults(searchResults);
        trackSearch(searchQuery, searchResults.length);
      } else if (activeSearchType === 'b149-2') {
        // B149.2-25 search
        if (csaSearchIndex) {
          const searchResults = searchCSACode(searchQuery, csaSearchIndex);
          setResults(searchResults);
          trackSearch(searchQuery, searchResults.length);
        }
      }
      
      // Only update trial manager status if user is not authenticated
      if (!currentUser) {
        setAccessStatus(trialManager.getAccessStatus());
      }
      return;
    }
    
    // If authenticated user has no access, don't show trial popup
    if (currentUser && !currentUser.hasAccess) {
      console.log('handleSearch: Authenticated user has no access');
      return;
    }
    
    // Only show trial popup for non-authenticated users
    if (!currentUser) {
      const currentStatus = trialManager.getAccessStatus();
      
      // If no access and trial hasn't been used, show email modal
      if (!currentStatus.hasAccess && currentStatus.type === 'trial' && currentStatus.eligible) {
        setShowEmailModal(true);
        localStorage.setItem('pendingQuery', searchQuery);
        localStorage.setItem('pendingSearchType', activeSearchType);
        return;
      }
    }
    
    // If no access (trial expired), search is blocked by UI
  }, [activeSearchType, csaSearchIndex, regulationsSearchIndex, searchCodes, hasAccessToPremiumFeatures, currentUser]);

  // Handle search type switching
  const handleSearchTypeChange = useCallback((type) => {
    setActiveSearchType(type);
  }, []);

  // Handle email submission
  const handleEmailSubmit = useCallback(async (email) => {
    setEmailSubmitting(true);
    setEmailError('');

    try {
      const result = await trialManager.startTrial(email);
      
      if (result.success) {
        // Track successful trial start
        trackTrialStarted(email);
        trackEmailSubmission(email);
        
        setAccessStatus(result.trialData);
        setShowEmailModal(false);
        
        // Execute pending search if any
        const pendingQuery = localStorage.getItem('pendingQuery');
        const pendingSearchType = localStorage.getItem('pendingSearchType');
        if (pendingQuery) {
          setQuery(pendingQuery);
          if (pendingSearchType) {
            setActiveSearchType(pendingSearchType);
          }
          localStorage.removeItem('pendingQuery');
          localStorage.removeItem('pendingSearchType');
        }
      } else {
        setEmailError(result.errors?.[0] || 'Failed to start trial');
      }
    } catch (error) {
      setEmailError('Something went wrong. Please try again.');
    } finally {
      setEmailSubmitting(false);
    }
  }, []);

  // Handle subscription redirect
  const handleSubscribe = useCallback(() => {
    trackSubscriptionAttempt('access_banner');
window.open('https://buy.stripe.com/8x24gAadDgMceP40tO7ok04','_blank');  }, []);

  // Get search placeholder text
  const getSearchPlaceholder = useCallback(() => {
    switch (activeSearchType) {
      case 'b149-1':
        return 'Search CSA B149.1-25 for clause numbers, titles, or keywords...';
      case 'b149-2':
        return 'Search CSA B149.2-25 for clause numbers, titles, or keywords...';
      case 'regulations':
        return 'Search regulations for free...';
      default:
        return 'Search...';
    }
  }, [activeSearchType]);

  // Get current data source title
  const getDataSourceTitle = useCallback(() => {
    switch (activeSearchType) {
      case 'b149-1':
        return 'CSA B149.1-25';
      case 'b149-2':
        return 'CSA B149.2-25';
      case 'regulations':
        return 'Regulations';
      default:
        return 'Code Compass';
    }
  }, [activeSearchType]);

  // Check if current search type requires premium access
  const requiresPremiumAccess = useCallback(() => {
    return activeSearchType === 'b149-1' || activeSearchType === 'b149-2';
  }, [activeSearchType]);

  // Check if user has access to premium features (requires authentication + subscription)
  const hasAccessToPremiumFeatures = useCallback(() => {
    const isPremiumRequired = requiresPremiumAccess();
    
    // For premium features, prioritize authenticated access
    if (isPremiumRequired) {
      // If user is authenticated and has access, grant access
      if (currentUser?.hasAccess === true) {
        console.log('hasAccessToPremiumFeatures: Authenticated user has access');
        return true;
      }
      
      // If user is authenticated but no access, deny
      if (currentUser && currentUser.hasAccess === false) {
        console.log('hasAccessToPremiumFeatures: Authenticated user has no access');
        return false;
      }
      
      // If no user, fall back to trial manager
      if (!currentUser) {
        console.log('hasAccessToPremiumFeatures: No user, checking trial');
        return trialManager.canAccessPremiumFeatures();
      }
      
      return false;
    }
    
    // For free features (regulations), no authentication required
    return true;
  }, [currentUser, requiresPremiumAccess]);

  // AI Interpretation handlers
  const handleAIInterpretation = useCallback((codeData) => {
    // AI interpretation requires authentication for premium features
    if (requiresPremiumAccess() && !currentUser) {
      // Show sign-in modal instead
      setShowAuthModal(true);
      return;
    }
    
    // If user has access, proceed with AI interpretation
    if (hasAccessToPremiumFeatures()) {
      setSelectedCodeForAI(codeData);
      setShowAIInterpretation(true);
    } else {
      // Show upgrade message - could trigger payment flow
      setShowAuthModal(true);
    }
  }, [requiresPremiumAccess, currentUser, hasAccessToPremiumFeatures]);

  const handleCloseAIInterpretation = useCallback(() => {
    setShowAIInterpretation(false);
    setSelectedCodeForAI(null);
  }, []);

  // Authentication handlers
  const handleAuthSuccess = useCallback(async (authData) => {
    console.log('App: handleAuthSuccess called with:', authData);
    console.log('App: authData.user:', authData.user);
    console.log('App: authData.user.hasAccess:', authData.user?.hasAccess);
    
    // Update current user and access status
    setCurrentUser(authData.user);
    
    // Refresh access status from the authenticated user
    if (authData.user?.hasAccess) {
      const premiumStatus = {
        hasAccess: true,
        type: 'subscription',
        user: authData.user
      };
      console.log('App: Setting premium access status:', premiumStatus);
      setAccessStatus(premiumStatus);
    } else {
      console.log('App: User has no access, falling back to trial manager');
      setAccessStatus(trialManager.getAccessStatus());
    }
    
    // Close auth modal
    setShowAuthModal(false);
    
    // Show success message briefly (optional)
    console.log('Authentication successful:', authData.user?.email || 'unknown user');
    
    // Force a small delay to ensure state updates have propagated
    setTimeout(() => {
      console.log('App: Auth success complete, forcing access check...');
      console.log('App: currentUser after auth:', authData.user);
      console.log('App: currentUser.hasAccess:', authData.user?.hasAccess);
    }, 100);
  }, []);

  const handleDeviceRemoved = useCallback(async (deviceInfo) => {
    // If user removed current device, they'll be signed out automatically
    if (deviceInfo.wasCurrentDevice) {
      setCurrentUser(null);
      setAccessStatus(trialManager.getAccessStatus());
      setShowDeviceManager(false);
    } else {
      // Just refresh the current user to update device list
      try {
        const refreshedUser = await vercelAuth.getCurrentUser();
        if (refreshedUser) {
          setCurrentUser(refreshedUser);
        }
      } catch (error) {
        console.error('Failed to refresh user after device removal:', error);
      }
    }
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  }, [handleSearch]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    const hasAccess = hasAccessToPremiumFeatures();
    if (query.trim() && hasAccess) {
      handleSearch(query.trim());
    }
  }, [query, hasAccessToPremiumFeatures, handleSearch]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    const hasAccess = hasAccessToPremiumFeatures();
    if (hasAccess && query.length > 1 && (activeSearchType === 'b149-1' || activeSearchType === 'b149-2')) {
      setShowSuggestions(true);
    }
  }, [query, hasAccessToPremiumFeatures, activeSearchType]);

  // Handle input blur with longer delay
  const handleInputBlur = useCallback(() => {
    // Use a longer timeout to allow clicking on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  // Search functionality with analytics - updated for all search types
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    // For premium-required searches, check access status
    if (requiresPremiumAccess()) {
      if (!hasAccessToPremiumFeatures()) {
        setResults([]);
        return;
      }
    }

    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      let searchResults = [];

      switch (activeSearchType) {
        case 'b149-1':
          if (trialManager.canAccessPremiumFeatures()) {
            searchResults = searchCodes(query);
          }
          break;
        case 'b149-2':
          if (trialManager.canAccessPremiumFeatures() && csaSearchIndex) {
            searchResults = searchCSACode(query, csaSearchIndex);
          }
          break;
        case 'regulations':
          if (regulationsSearchIndex) {
            searchResults = searchRegulations(query, regulationsSearchIndex);
          }
          break;
      }

      setResults(searchResults);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [query, accessStatus, activeSearchType, csaSearchIndex, regulationsSearchIndex, searchCodes, requiresPremiumAccess, hasAccessToPremiumFeatures]);

  // Memoized values to prevent unnecessary re-renders
  const searchBarProps = useMemo(() => ({
    query,
    onQueryChange: handleInputChange,
    onSubmit: handleSubmit,
    onFocus: handleInputFocus,
    onBlur: handleInputBlur,
    placeholder: getSearchPlaceholder(),
    isDisabled: !hasAccessToPremiumFeatures(),
    suggestions,
    showSuggestions,
    onSuggestionClick: handleSuggestionClick
  }), [
    query, 
    handleInputChange, 
    handleSubmit, 
    handleInputFocus, 
    handleInputBlur, 
    getSearchPlaceholder, 
    hasAccessToPremiumFeatures, 
    suggestions, 
    showSuggestions, 
    handleSuggestionClick,
    currentUser // Add currentUser to force re-render when auth state changes
  ]);

  // Access banner component
  const AccessBanner = useMemo(() => {
    // Only show banner for premium-required searches
    if (!requiresPremiumAccess() || !accessStatus) return null;
    
    // Active subscription
    if (accessStatus.type === 'subscription' && accessStatus.hasAccess) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
          color: 'white',
          padding: '16px 20px',
          textAlign: 'center',
          marginBottom: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(155, 89, 182, 0.3)'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              ✨ Subscription Active - Full Access to B149.1-25 & B149.2-25
            </span>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '4px' }}>
              {accessStatus.user?.subscription?.plan === 'lifetime' ? 
                '🚀 Lifetime Developer Access' : 
                `Expires: ${new Date(accessStatus.expiresAt).toLocaleDateString()}`
              }
            </div>
          </div>
        </div>
      );
    }
    
    // Active trial
    if (accessStatus.type === 'trial' && accessStatus.hasAccess) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #4CAF50, #45a049)',
          color: 'white',
          padding: '16px 20px',
          textAlign: 'center',
          marginBottom: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              🎉 Trial active: {accessStatus.daysRemaining} day{accessStatus.daysRemaining !== 1 ? 's' : ''} remaining
            </span>
            {accessStatus.searchCount > 0 && (
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '4px' }}>
                {accessStatus.searchCount} searches performed across B149.1-25 & B149.2-25
              </div>
            )}
          </div>
          <button
            onClick={handleSubscribe}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Subscribe Now - Save 15%
          </button>
        </div>
      );
    }
    
    // Expired trial/no access
    if (!accessStatus.hasAccess) {
      return (
        <div style={{
          background: 'linear-gradient(135deg, #FF5722, #D84315)',
          color: 'white',
          padding: '16px 20px',
          textAlign: 'center',
          marginBottom: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(255, 87, 34, 0.3)'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              🔔 {accessStatus.type === 'trial' ? 'Trial expired' : 'Premium access required'}
            </span>
          </div>
          <button
            onClick={handleSubscribe}
            style={{
              backgroundColor: 'white',
              color: '#FF5722',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            Upgrade Now - $79/year
          </button>
        </div>
      );
    }
    
    return null;
  }, [accessStatus, handleSubscribe, requiresPremiumAccess]);

  // Search results component
  const SearchResults = useMemo(() => {
    const hasAccess = hasAccessToPremiumFeatures();
    const isPremiumRequired = requiresPremiumAccess();
    
    // Show blocked message if no premium access (only for premium-required searches)
    if (!hasAccess && isPremiumRequired) {
      // If user is not signed in, require sign-in first
      if (!currentUser) {
        return (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '2px solid #3b82f6'
          }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔐</span>
            <h3 style={{ color: '#3b82f6', margin: '0 0 0.5rem 0' }}>Sign In Required</h3>
            <p style={{ color: '#6c757d', margin: '0 0 1rem 0' }}>
              Please sign in to access premium CSA B149.1-25 and B149.2-25 code searches.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '25px',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🔐 Sign In / Sign Up
            </button>
          </div>
        );
      }
      
      // If user is signed in but doesn't have access, show upgrade message
      return (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid #FF5722'
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔒</span>
          <h3 style={{ color: '#FF5722', margin: '0 0 0.5rem 0' }}>Premium Access Required</h3>
          <p style={{ color: '#6c757d', margin: '0 0 1rem 0' }}>
            {accessStatus?.type === 'trial' ? 
              `You performed ${accessStatus.searchCount || 0} searches during your 7-day trial.` :
              'Start your free trial to access CSA B149.1-25 and B149.2-25.'
            }
          </p>
          <button
            onClick={handleSubscribe}
            style={{
              backgroundColor: '#FF5722',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Upgrade Now - $79/year
          </button>
        </div>
      );
    }

    // Show loading state
    if (isLoading) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6c757d'
        }}>
          <div style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '2px solid #e9ecef',
            borderTop: '2px solid #2c3e50',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '1rem' }}>Searching codes...</p>
        </div>
      );
    }

    // Show results
    if (results.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((item, index) => (
            <div key={index} style={{
              backgroundColor: '#2d3748',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              border: '1px solid #4a5568',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}>
                <span style={{
                  backgroundColor: item.annex ? '#9b59b6' : '#3498db',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}>
                  {item.clause || item.section || 'N/A'}
                </span>
                {item.annex && (
                  <span style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}>
                    Annex {item.annex}
                  </span>
                )}
                {item.regulation && (
                  <span style={{
                    backgroundColor: '#e67e22',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}>
                    {item.regulation}
                  </span>
                )}
                {activeSearchType === 'regulations' && (
                  <span style={{
                    backgroundColor: '#27ae60',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '15px',
                    fontSize: '0.7rem',
                    fontWeight: '600'
                  }}>
                    FREE
                  </span>
                )}
                <h3 style={{
                  margin: 0,
                  fontSize: 'clamp(1rem, 3vw, 1.2rem)',
                  color: '#e2e8f0',
                  fontWeight: '600',
                  flex: 1,
                  minWidth: '200px'
                }}>
                  <HighlightedText text={item.title} highlight={query} />
                </h3>
              </div>
              <p style={{
                margin: 0,
                lineHeight: '1.6',
                color: '#a0aec0',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
              }}>
                <HighlightedText text={item.description} highlight={query} />
              </p>
              {item.category && (
                <div style={{
                  marginTop: '0.75rem',
                  fontSize: '0.85rem',
                  color: '#a0aec0',
                  fontStyle: 'italic'
                }}>
                  Category: {item.category}
                </div>
              )}
              {item.document_title && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#718096',
                  fontStyle: 'italic'
                }}>
                  Source: {item.document_title}
                </div>
              )}
              
              {/* AI Interpretation Button */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #4a5568',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => handleAIInterpretation(item)}
                  style={{
                    backgroundColor: '#9b59b6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#8e44ad';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#9b59b6';
                  }}
                >
                  <span>🤖</span>
                  AI Interpretation
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Show no results message
    if (query && !isLoading) {
      return (
        <div style={{
          backgroundColor: '#2d3748',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
          <h3 style={{ color: '#a0aec0', margin: '0 0 0.5rem 0' }}>No results found</h3>
          <p style={{ color: '#a0aec0', margin: 0 }}>
            Try searching for different keywords or clause numbers
          </p>
        </div>
      );
    }

    // Show welcome message
    if (!query) {
      const isRegulations = activeSearchType === 'regulations';
      return (
        <div style={{
          backgroundColor: '#2d3748',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>
            {isRegulations ? '📋' : '🧭'}
          </span>
          <h3 style={{ color: '#e2e8f0', margin: '0 0 0.5rem 0' }}>
            Welcome to Code Compass
          </h3>
          <p style={{ color: '#a0aec0', margin: 0 }}>
            Search {getDataSourceTitle()} codes by clause number, title, or keyword
            {isRegulations && (
              <span style={{ 
                display: 'block', 
                marginTop: '0.5rem',
                color: '#27ae60',
                fontWeight: '600'
              }}>
                ✨ Regulations search is completely free!
              </span>
            )}
          </p>
        </div>
      );
    }

    return null;
  }, [results, isLoading, accessStatus, query, handleSubscribe, activeSearchType, requiresPremiumAccess, getDataSourceTitle, hasAccessToPremiumFeatures, currentUser, setShowAuthModal]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSubmit={handleEmailSubmit}
        isSubmitting={emailSubmitting}
        error={emailError}
      />

      {/* Header */}
      <header style={{
        backgroundColor: '#2d3748',
        color: 'white',
        padding: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🧭</span>
            <h1 style={{
              margin: 0,
              fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
              fontWeight: '600'
            }}>
              Code Compass
            </h1>
            <span style={{ fontSize: '0.9rem', opacity: 0.8, marginLeft: '0.5rem' }}>
              ({getDataSourceTitle()})
            </span>
          </div>
          
          {/* User menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  {currentUser?.email || 'User'}
                </span>
                <button
                  onClick={() => setShowDeviceManager(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  📱 Devices
                </button>
                <button
                  onClick={async () => {
                    const { vercelAuth } = await import('./services/vercelAuth.js');
                    await vercelAuth.signOut();
                    setCurrentUser(null);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  border: 'none',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                🔐 Sign In / Sign Up
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem',
        paddingBottom: '2rem'
      }}>
        {/* Access Banner */}
        {AccessBanner}

        {/* Search Type Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.5rem',
            backgroundColor: '#2d3748',
            padding: '1rem',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            <button
              onClick={() => handleSearchTypeChange('b149-1')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeSearchType === 'b149-1' ? '#3498db' : '#4a5568',
                color: activeSearchType === 'b149-1' ? 'white' : '#e2e8f0',
                position: 'relative'
              }}
            >
              CSA B149.1-25
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: accessStatus?.type === 'subscription' && accessStatus?.hasAccess ? '#27ae60' : '#e74c3c',
                color: 'white',
                fontSize: '0.6rem',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: '700'
              }}>
                {accessStatus?.type === 'subscription' && accessStatus?.hasAccess ? 'ACTIVE' : 'TRIAL'}
              </span>
            </button>
            <button
              onClick={() => handleSearchTypeChange('b149-2')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeSearchType === 'b149-2' ? '#3498db' : '#4a5568',
                color: activeSearchType === 'b149-2' ? 'white' : '#e2e8f0',
                position: 'relative'
              }}
            >
              CSA B149.2-25
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: accessStatus?.type === 'subscription' && accessStatus?.hasAccess ? '#27ae60' : '#e74c3c',
                color: 'white',
                fontSize: '0.6rem',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: '700'
              }}>
                {accessStatus?.type === 'subscription' && accessStatus?.hasAccess ? 'ACTIVE' : 'TRIAL'}
              </span>
            </button>
            <button
              onClick={() => handleSearchTypeChange('regulations')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeSearchType === 'regulations' ? '#3498db' : '#4a5568',
                color: activeSearchType === 'regulations' ? 'white' : '#e2e8f0',
                position: 'relative'
              }}
            >
              Regulations
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#27ae60',
                color: 'white',
                fontSize: '0.6rem',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: '700'
              }}>
                FREE
              </span>
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div style={{
          backgroundColor: '#2d3748',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.1rem',
            color: '#e2e8f0',
            fontWeight: '500'
          }}>
            Search {getDataSourceTitle()} Codes
            {activeSearchType === 'regulations' && (
              <span style={{
                marginLeft: '0.5rem',
                fontSize: '0.8rem',
                color: '#27ae60',
                fontWeight: '600'
              }}>
                (Free Access)
              </span>
            )}
          </h2>
          <SearchBar 
            key={currentUser ? `authenticated-${currentUser.id || currentUser.email}` : 'unauthenticated'} 
            {...searchBarProps} 
          />
          
          {query && (
            <div style={{
              marginTop: '1rem',
              fontSize: '0.9rem',
              color: '#a0aec0'
            }}>
              {isLoading ? (
                <span>🔍 Searching...</span>
              ) : (
                <span>
                  Found {results.length} result{results.length !== 1 ? 's' : ''} 
                  {query && ` for "${query}"`}
                  {activeSearchType === 'regulations' && (
                    <span style={{ color: '#27ae60', fontWeight: '600' }}> (Free)</span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div key={currentUser ? `search-results-auth-${currentUser.id || currentUser.email}` : 'search-results-unauth'}>
          {SearchResults}
        </div>
      </main>

      {/* AI Interpretation Modal */}
      <AIInterpretation
        codeData={selectedCodeForAI}
        isVisible={showAIInterpretation}
        onClose={handleCloseAIInterpretation}
      />

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Device Manager Modal - Temporarily disabled */}
      {false && showDeviceManager && currentUser && (
        <DeviceManager
          user={currentUser}
          isOpen={showDeviceManager}
          onClose={() => setShowDeviceManager(false)}
          onDeviceRemoved={handleDeviceRemoved}
        />
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default App;