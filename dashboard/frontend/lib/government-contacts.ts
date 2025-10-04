// Government agency contact information organized by issue type
// This data should eventually be stored in Supabase and managed by city admins

export type IssueCategory = 
  | 'roads_infrastructure'
  | 'utilities_power'
  | 'utilities_water'
  | 'utilities_gas'
  | 'public_safety'
  | 'sanitation'
  | 'parks_recreation'
  | 'traffic_signals'
  | 'street_lighting'
  | 'building_safety'
  | 'environmental';

export type AgencyContact = {
  id: string;
  name: string;
  category: IssueCategory;
  jurisdiction: string; // City, County, State, Federal, Private
  responsibilities: string[];
  
  // Contact Information
  phone: string;
  phoneHours: string;
  emergencyPhone?: string;
  email: string;
  website: string;
  onlineReportingUrl?: string;
  
  // Response Info
  averageResponseTime: string;
  serviceArea: string;
  
  // When to contact
  issueTypes: string[];
};

// Template data - Replace with actual city-specific contacts
export const governmentContacts: AgencyContact[] = [
  // ROADS & INFRASTRUCTURE
  {
    id: 'dpw-roads',
    name: 'Department of Public Works - Roads Division',
    category: 'roads_infrastructure',
    jurisdiction: 'Municipal',
    responsibilities: ['Road maintenance', 'Pothole repair', 'Sidewalk repair', 'Street resurfacing'],
    phone: '311 or (415) 701-2311',
    phoneHours: '24/7',
    email: 'dpw.roads@sfgov.org',
    website: 'https://www.sf.gov/departments/public-works',
    onlineReportingUrl: 'https://sf311.org/report-pothole',
    averageResponseTime: '2-5 business days',
    serviceArea: 'San Francisco City Limits',
    issueTypes: ['Pothole', 'Crack in road', 'Damaged sidewalk', 'Broken curb', 'Road debris'],
  },
  
  // POWER UTILITIES
  {
    id: 'pge-power',
    name: 'Pacific Gas & Electric (PG&E) - Power',
    category: 'utilities_power',
    jurisdiction: 'Private Utility',
    responsibilities: ['Power outages', 'Downed power lines', 'Electrical hazards', 'Street light repair'],
    phone: '1-800-743-5000',
    phoneHours: '24/7',
    emergencyPhone: '911 (for downed lines)',
    email: 'customersupport@pge.com',
    website: 'https://www.pge.com',
    onlineReportingUrl: 'https://www.pge.com/outages',
    averageResponseTime: 'Emergency: Immediate | Routine: 24-48 hours',
    serviceArea: 'Northern & Central California',
    issueTypes: ['Power outage', 'Downed power line', 'Electrical hazard', 'Flickering lights', 'Street light out'],
  },
  
  // WATER UTILITIES
  {
    id: 'sfpuc-water',
    name: 'SF Public Utilities Commission - Water Division',
    category: 'utilities_water',
    jurisdiction: 'Municipal',
    responsibilities: ['Water main breaks', 'Water quality', 'Sewer issues', 'Fire hydrants'],
    phone: '(415) 551-3000',
    phoneHours: '24/7 Emergency Hotline',
    emergencyPhone: '(415) 551-3000',
    email: 'wateremergency@sfwater.org',
    website: 'https://www.sfpuc.org',
    onlineReportingUrl: 'https://sf.gov/report-water-emergency',
    averageResponseTime: 'Emergency: 1-2 hours | Routine: 1-3 days',
    serviceArea: 'San Francisco City Limits',
    issueTypes: ['Water main break', 'Leaking fire hydrant', 'Sewer overflow', 'Water quality concern', 'Flooding'],
  },
  
  // GAS UTILITIES
  {
    id: 'pge-gas',
    name: 'Pacific Gas & Electric (PG&E) - Gas',
    category: 'utilities_gas',
    jurisdiction: 'Private Utility',
    responsibilities: ['Gas leaks', 'Gas odor', 'Damaged gas lines'],
    phone: '1-800-743-5000',
    phoneHours: '24/7',
    emergencyPhone: '911 (for gas leaks)',
    email: 'customersupport@pge.com',
    website: 'https://www.pge.com/gas-safety',
    onlineReportingUrl: 'https://www.pge.com/report-gas-odor',
    averageResponseTime: 'Emergency: Immediate response',
    serviceArea: 'Northern & Central California',
    issueTypes: ['Gas leak', 'Gas odor', 'Damaged gas meter', 'Gas line struck'],
  },
  
  // PUBLIC SAFETY - FIRE
  {
    id: 'sffd',
    name: 'San Francisco Fire Department - Non-Emergency',
    category: 'public_safety',
    jurisdiction: 'Municipal',
    responsibilities: ['Fire hazards', 'Building safety', 'Hazmat concerns'],
    phone: '(415) 558-3200',
    phoneHours: '24/7',
    emergencyPhone: '911 (for active fires/hazards)',
    email: 'fire.prevention@sfgov.org',
    website: 'https://sf-fire.org',
    onlineReportingUrl: 'https://sf.gov/report-fire-hazard',
    averageResponseTime: 'Emergency: Immediate | Inspection: 3-5 days',
    serviceArea: 'San Francisco City Limits',
    issueTypes: ['Fire hazard', 'Blocked fire hydrant', 'Hazardous materials', 'Building fire safety'],
  },
  
  // PUBLIC SAFETY - POLICE
  {
    id: 'sfpd',
    name: 'San Francisco Police Department - Non-Emergency',
    category: 'public_safety',
    jurisdiction: 'Municipal',
    responsibilities: ['Traffic hazards', 'Abandoned vehicles', 'Public safety concerns'],
    phone: '(415) 553-0123',
    phoneHours: '24/7',
    emergencyPhone: '911 (for emergencies)',
    email: 'sfpd.online.reports@sfgov.org',
    website: 'https://www.sanfranciscopolice.org',
    onlineReportingUrl: 'https://sf.gov/report-non-emergency',
    averageResponseTime: 'Varies by priority',
    serviceArea: 'San Francisco City Limits',
    issueTypes: ['Abandoned vehicle', 'Traffic hazard', 'Graffiti (vandalism)', 'Illegal dumping'],
  },
  
  // SANITATION
  {
    id: 'recology',
    name: 'Recology - Waste Management',
    category: 'sanitation',
    jurisdiction: 'Private Contractor',
    responsibilities: ['Waste collection', 'Recycling', 'Missed pickups', 'Illegal dumping'],
    phone: '(415) 330-1300',
    phoneHours: 'Mon-Fri 7AM-4PM',
    email: 'customerservice@recology.com',
    website: 'https://www.recology.com/recology-san-francisco',
    onlineReportingUrl: 'https://www.recology.com/report-issue',
    averageResponseTime: '1-2 business days',
    serviceArea: 'San Francisco City Limits',
    issueTypes: ['Missed garbage pickup', 'Overflowing trash can', 'Illegal dumping', 'Bulky item pickup'],
  },
  
  // PARKS & RECREATION
  {
    id: 'rec-park',
    name: 'Recreation and Parks Department',
    category: 'parks_recreation',
    jurisdiction: 'Municipal',
    responsibilities: ['Park maintenance', 'Playground safety', 'Tree maintenance', 'Graffiti removal'],
    phone: '(415) 831-2700',
    phoneHours: 'Mon-Fri 8AM-5PM',
    email: 'recpark.info@sfgov.org',
    website: 'https://sfrecpark.org',
    onlineReportingUrl: 'https://sf311.org/report-park-issue',
    averageResponseTime: '3-7 business days',
    serviceArea: 'San Francisco Parks',
    issueTypes: ['Damaged playground equipment', 'Fallen tree', 'Graffiti in park', 'Park lighting out', 'Broken bench'],
  },
  
  // TRAFFIC SIGNALS
  {
    id: 'sfmta-signals',
    name: 'SF Municipal Transportation Agency - Signals',
    category: 'traffic_signals',
    jurisdiction: 'Municipal',
    responsibilities: ['Traffic signal repair', 'Pedestrian signals', 'Street signs', 'Parking meters'],
    phone: '311 or (415) 701-2311',
    phoneHours: '24/7',
    email: 'trafficsignals@sfmta.com',
    website: 'https://www.sfmta.com',
    onlineReportingUrl: 'https://sf311.org/report-traffic-signal',
    averageResponseTime: 'Emergency: 2-4 hours | Routine: 2-3 days',
    serviceArea: 'San Francisco City Limits',
    issueTypes: ['Traffic light out', 'Pedestrian signal broken', 'Missing street sign', 'Faded crosswalk', 'Broken parking meter'],
  },
  
  // STREET LIGHTING
  {
    id: 'pge-streetlights',
    name: 'PG&E / Public Works - Street Lighting',
    category: 'street_lighting',
    jurisdiction: 'Mixed (PG&E owned, City maintained)',
    responsibilities: ['Street light outages', 'Damaged light poles', 'Flickering street lights'],
    phone: '1-800-743-5000 (PG&E) or 311',
    phoneHours: '24/7',
    email: 'streetlights@pge.com',
    website: 'https://www.pge.com/streetlights',
    onlineReportingUrl: 'https://www.pge.com/report-streetlight',
    averageResponseTime: '3-5 business days',
    serviceArea: 'San Francisco City Limits',
    issueTypes: ['Street light out', 'Flickering street light', 'Damaged light pole', 'Light on during day'],
  },
  
  // BUILDING SAFETY
  {
    id: 'dbi',
    name: 'Department of Building Inspection',
    category: 'building_safety',
    jurisdiction: 'Municipal',
    responsibilities: ['Building code violations', 'Unsafe buildings', 'Unpermitted construction'],
    phone: '(415) 558-6088',
    phoneHours: 'Mon-Fri 8AM-5PM',
    emergencyPhone: '(415) 575-6863 (after hours)',
    email: 'dbiweb@sfgov.org',
    website: 'https://sfdbi.org',
    onlineReportingUrl: 'https://sf.gov/report-building-violation',
    averageResponseTime: 'Emergency: 24 hours | Routine: 5-10 days',
    serviceArea: 'San Francisco City Limits',
    issueTypes: ['Unsafe building', 'Code violation', 'Unpermitted construction', 'Structural damage'],
  },
  
  // ENVIRONMENTAL
  {
    id: 'environment',
    name: 'Department of Environment',
    category: 'environmental',
    jurisdiction: 'Municipal',
    responsibilities: ['Environmental hazards', 'Air quality', 'Hazardous waste', 'Pollution'],
    phone: '(415) 355-3700',
    phoneHours: 'Mon-Fri 8AM-5PM',
    email: 'sfenvironment@sfgov.org',
    website: 'https://sfenvironment.org',
    onlineReportingUrl: 'https://sf.gov/report-environmental-concern',
    averageResponseTime: '3-7 business days',
    serviceArea: 'San Francisco City Limits',
    issueTypes: ['Hazardous waste', 'Pollution', 'Air quality concern', 'Oil spill', 'Chemical odor'],
  },
];

// Helper function to find responsible agency by issue type
export function findAgencyByIssueType(issueType: string): AgencyContact | null {
  const normalizedIssue = issueType.toLowerCase();
  return governmentContacts.find(agency => 
    agency.issueTypes.some(type => type.toLowerCase().includes(normalizedIssue))
  ) || null;
}

// Get agencies by category
export function getAgenciesByCategory(category: IssueCategory): AgencyContact[] {
  return governmentContacts.filter(agency => agency.category === category);
}

// Get all unique categories
export function getAllCategories(): IssueCategory[] {
  return Array.from(new Set(governmentContacts.map(a => a.category)));
}

