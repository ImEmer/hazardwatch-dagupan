export const REPORT_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Closed'];

export const STATUS_COLORS = {
  Pending: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    border: 'border-yellow-500',
    hex: '#eab308',
    pill: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  },
  'In Progress': {
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    border: 'border-blue-500',
    hex: '#3b82f6',
    pill: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  },
  Resolved: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    border: 'border-green-500',
    hex: '#10b981',
    pill: 'bg-green-500/10 text-green-500 border-green-500/30',
  },
  Closed: {
    bg: 'bg-gray-500',
    text: 'text-gray-500',
    border: 'border-gray-500',
    hex: '#6b7280',
    pill: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
  },
};

export const PRIORITY_COLORS = {
  Urgent: { hex: '#ef4444', pill: 'bg-red-500/10 text-red-500 border-red-500/30' },
  High: { hex: '#f97316', pill: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
  Medium: { hex: '#eab308', pill: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  Low: { hex: '#6b7280', pill: 'bg-gray-500/10 text-gray-500 border-gray-500/30' },
};

export const DAGUPAN_BARANGAYS = [
  'Bacayao Norte', 'Bacayao Sur', 'Banaoang', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV',
  'Bolosan', 'Bonuan Binloc', 'Bonuan Boquig', 'Bonuan Gueset', 'Calmay', 'Carael', 'Caranglaan',
  'Herrero', 'Herrero-Perez', 'Lasip Chico', 'Lasip Grande', 'Lomboy', 'Lucao', 'Malued', 'Mamalingling',
  'Mangin', 'Mayombo', 'Pantal', 'Poblacion Oeste', 'Pogo Chico', 'Pogo Grande', 'Salapingao', 'San Fabian', 'Sapanglang',
  'Tambac', 'Tapuac', 'Tebeng', 'Tondaligan',
].sort((left, right) => left.localeCompare(right));

export const DAGUPAN_BARANGAY_COORDINATES = {
  'Barangay I': [120.3340, 16.0430],
  'Barangay II': [120.3350, 16.0420],
  'Barangay III': [120.3360, 16.0410],
  'Barangay IV': [120.3370, 16.0400],
  'Bacayao Norte': [120.3480, 16.0380],
  'Bacayao Sur': [120.3450, 16.0350],
  Banaoang: [120.3550, 16.0450],
  Bolosan: [120.3470, 16.0460],
  'Bonuan Binloc': [120.3180, 16.0580],
  'Bonuan Boquig': [120.3220, 16.0610],
  'Bonuan Gueset': [120.3200, 16.0630],
  Calmay: [120.3250, 16.0400],
  Carael: [120.3150, 16.0500],
  Caranglaan: [120.3450, 16.0380],
  Herrero: [120.3400, 16.0450],
  'Herrero-Perez': [120.3400, 16.0450],
  'Lasip Chico': [120.3300, 16.0380],
  'Lasip Grande': [120.3320, 16.0360],
  Lomboy: [120.3380, 16.0330],
  Lucao: [120.3400, 16.0380],
  Malued: [120.3420, 16.0560],
  Mamalingling: [120.3520, 16.0480],
  Mangin: [120.3320, 16.0350],
  Mayombo: [120.3380, 16.0500],
  Pantal: [120.3450, 16.0450],
  'Poblacion Oeste': [120.3350, 16.0430],
  'Pogo Chico': [120.3330, 16.0380],
  'Pogo Grande': [120.3350, 16.0400],
  Pugaro: [120.3130, 16.0470],
  Salapingao: [120.3530, 16.0520],
  'San Fabian': [120.3260, 16.0580],
  Sapanglang: [120.3500, 16.0430],
  Tambac: [120.3350, 16.0600],
  Tapuac: [120.3280, 16.0330],
  Tebeng: [120.3500, 16.0300],
  Tondaligan: [120.3150, 16.0380],
};

export const HAZARD_CATEGORIES = [
  'Pothole', 'Broken Streetlight', 'Clogged Drainage', 'Flooding', 'Waste Disposal',
  'Damaged Public Facility', 'Fallen Electrical Wire', 'Damaged Road', 'Illegal Dumping',
  'Air Pollution', 'Animal Related', 'Blocked Fire Exit', 'Broken Traffic Light',
  'Broken Water Pipe', 'Clogged Canal (Waste)', 'Contaminated Water', 'Damaged Bridge',
  'Damaged Sidewalk', 'Deforestation', 'Fallen Tree', 'Fire Hazard', 'Gas Leak',
  'Missing Road Sign', 'Noise Pollution', 'Oil Spill', 'Other', 'Overflowing Trash Bin',
  'Public Safety Hazard', 'Public Toilet Issue', 'Smoke Report', 'Traffic Obstruction',
  'Vandalism', 'Water Leak',
];

// HAZARD_CATEGORY_GROUPS is a grouping helper only. It must never be rendered
// directly with a native option-group wrapper; SubmitReport.jsx flattens it into plain options.
export const HAZARD_CATEGORY_GROUPS = [
  { label: 'Road and Traffic', options: ['Pothole', 'Damaged Road', 'Broken Streetlight', 'Broken Traffic Light', 'Fallen Tree', 'Missing Road Sign', 'Traffic Obstruction'] },
  { label: 'Water and Drainage', options: ['Flooding', 'Clogged Drainage', 'Broken Water Pipe', 'Contaminated Water', 'Water Leak', 'Clogged Canal (Waste)'] },
  { label: 'Waste and Sanitation', options: ['Waste Disposal', 'Illegal Dumping', 'Overflowing Trash Bin', 'Public Toilet Issue'] },
  { label: 'Public Safety', options: ['Damaged Public Facility', 'Fallen Electrical Wire', 'Damaged Bridge', 'Damaged Sidewalk', 'Public Safety Hazard', 'Vandalism', 'Animal Related'] },
  { label: 'Fire and Emergency', options: ['Blocked Fire Exit', 'Fire Hazard', 'Gas Leak', 'Smoke Report'] },
  { label: 'Environmental', options: ['Air Pollution', 'Deforestation', 'Noise Pollution', 'Oil Spill'] },
];

export const HAZARD_CATEGORY_COLORS = {
  Pothole: '#3b82f6', 'Damaged Road': '#3b82f6', 'Broken Streetlight': '#3b82f6',
  'Traffic Obstruction': '#3b82f6', 'Fallen Tree': '#3b82f6', 'Missing Road Sign': '#3b82f6',
  'Clogged Drainage': '#06b6d4', Flooding: '#06b6d4', 'Water Leak': '#06b6d4',
  'Broken Water Pipe': '#06b6d4', 'Contaminated Water': '#06b6d4',
  'Waste Disposal': '#10b981', 'Illegal Dumping': '#10b981', 'Overflowing Trash Bin': '#10b981',
  'Clogged Canal (Waste)': '#10b981', 'Public Toilet Issue': '#10b981',
  'Fallen Electrical Wire': '#ef4444', 'Broken Traffic Light': '#ef4444',
  'Damaged Public Facility': '#ef4444', 'Damaged Bridge': '#ef4444', 'Damaged Sidewalk': '#ef4444',
  'Public Safety Hazard': '#ef4444', 'Fire Hazard': '#f97316', 'Smoke Report': '#f97316',
  'Gas Leak': '#f97316', 'Blocked Fire Exit': '#f97316', 'Air Pollution': '#84cc16',
  'Noise Pollution': '#84cc16', Deforestation: '#84cc16', 'Oil Spill': '#84cc16',
  'Animal Related': '#6b7280', Vandalism: '#6b7280', Other: '#6b7280',
  Streetlight: '#3b82f6', Drainage: '#06b6d4', 'Public Facility': '#ef4444',
};

export const STATUS_BADGES = {
  Pending: STATUS_COLORS.Pending.pill,
  'In Progress': STATUS_COLORS['In Progress'].pill,
  Resolved: STATUS_COLORS.Resolved.pill,
  Closed: STATUS_COLORS.Closed.pill,
};

export const STATUS_BADGES_LIGHT = {
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Closed: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const STATUS_CHART_COLORS = {
  Pending: STATUS_COLORS.Pending.hex,
  'In Progress': STATUS_COLORS['In Progress'].hex,
  Resolved: STATUS_COLORS.Resolved.hex,
  Closed: STATUS_COLORS.Closed.hex,
};
