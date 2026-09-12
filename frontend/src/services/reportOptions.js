export const REPORT_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Closed'];

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

export const HAZARD_CATEGORY_GROUPS = [
  { label: 'Most reported', options: HAZARD_CATEGORIES.slice(0, 9) },
  { label: 'Road and Traffic', options: ['Broken Traffic Light', 'Fallen Tree', 'Missing Road Sign', 'Traffic Obstruction'] },
  { label: 'Water and Drainage', options: ['Broken Water Pipe', 'Contaminated Water', 'Water Leak'] },
  { label: 'Waste and Sanitation', options: ['Clogged Canal (Waste)', 'Overflowing Trash Bin', 'Public Toilet Issue'] },
  { label: 'Public Safety', options: ['Damaged Bridge', 'Damaged Sidewalk', 'Public Safety Hazard'] },
  { label: 'Fire and Emergency', options: ['Blocked Fire Exit', 'Fire Hazard', 'Gas Leak', 'Smoke Report'] },
  { label: 'Environmental', options: ['Air Pollution', 'Deforestation', 'Noise Pollution', 'Oil Spill'] },
  { label: 'Other', options: ['Animal Related', 'Other', 'Vandalism'] },
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
  Pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  'In Progress': 'bg-violet-500/10 text-violet-300 border-violet-500/30',
  Resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Closed: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

export const STATUS_BADGES_LIGHT = {
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'In Progress': 'bg-violet-50 text-violet-700 border-violet-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Closed: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const STATUS_CHART_COLORS = {
  Pending: '#f59e0b',
  'In Progress': '#8b5cf6',
  Resolved: '#22c55e',
  Closed: '#6b7280',
};
