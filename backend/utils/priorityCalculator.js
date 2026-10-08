const URGENT_KEYWORDS = [
  'fire', 'sunog', 'apoy', 'trapped', 'nakulong', 'naipit',
  'collapse', 'gumuho', 'guho', 'electrocuted', 'nakuryente',
  'died', 'patay', 'dead', 'unconscious', 'walang malay',
  'landslide', 'pagguho', 'explosion', 'pagsabog',
  'live wire', 'buhay na kable', 'drowning', 'nalunod',
  'naaksidente',
];

const HIGH_KEYWORDS = [
  'injured', 'nasugatan', 'accident', 'aksidente',
  'blocked', 'nakabara', 'hazardous', 'mapanganib',
  'deep', 'malalim', 'big', 'malaki', 'severe',
  'burst', 'pumutok', 'leaking', 'tumutulo',
];

const LOW_KEYWORDS = ['minor', 'maliit', 'small', 'cosmetic', 'surface'];

const CATEGORY_PRIORITIES = {
  fire: 'Urgent',
  flood: 'High',
  infrastructure: 'High',
  pothole: 'High',
  road: 'High',
  traffic: 'High',
  'public safety': 'High',
  electrical: 'High',
  waste: 'Medium',
  sanitation: 'Medium',
  environmental: 'Medium',
  vandalism: 'Low',
  noise: 'Low',
};

const PRIORITY_RANK = { Low: 0, Medium: 1, High: 2, Urgent: 3 };
const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Urgent'];

const containsKeyword = (text, keywords) =>
  keywords.some((keyword) => text.includes(keyword));

export const computePriority = ({
  category = '',
  customCategory = '',
  description = '',
  title = '',
} = {}) => {
  const resolvedCategory = String(customCategory || category || '').trim().toLowerCase();
  const text = `${description || ''} ${title || ''}`.toLowerCase();

  if (resolvedCategory === 'fire') return 'Urgent';

  let priority = 'Medium';
  if (resolvedCategory.includes('infrastructure') && resolvedCategory.includes('collapse')) {
    priority = 'Urgent';
  } else {
    const categoryMatch = Object.keys(CATEGORY_PRIORITIES)
      .find((name) => resolvedCategory.includes(name));
    if (categoryMatch) priority = CATEGORY_PRIORITIES[categoryMatch];
  }

  if (containsKeyword(text, URGENT_KEYWORDS)) return 'Urgent';

  if (containsKeyword(text, HIGH_KEYWORDS)) {
    priority = PRIORITY_RANK[priority] < PRIORITY_RANK.High ? 'High' : priority;
  }

  if (text.includes('banta')) {
    priority = PRIORITY_LEVELS[Math.min(PRIORITY_RANK[priority] + 1, PRIORITY_RANK.High)];
  }

  if (containsKeyword(text, LOW_KEYWORDS) && PRIORITY_RANK[priority] >= PRIORITY_RANK.Medium) {
    priority = PRIORITY_LEVELS[PRIORITY_RANK[priority] - 1];
  }

  return priority;
};

export const calculatePriority = (category = '', description = '') => {
  if (category && typeof category === 'object') return computePriority(category);
  return computePriority({ category, description });
};
