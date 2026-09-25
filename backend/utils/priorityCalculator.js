const PRIORITY_RULES = [
  { level: 'Urgent', keywords: ['fire', 'gas leak', 'smoke', 'electrical', 'fallen electrical', 'flooding', 'fallen tree', 'blocked fire exit', 'public safety', 'traffic obstruction', 'accident', 'collapse', 'hazard', 'road damage'] },
  { level: 'High', keywords: ['damaged road', 'broken streetlight', 'clogged drainage', 'flood', 'waste disposal', 'damaged public facility', 'noise pollution', 'water leak', 'oil spill', 'broken water pipe'] },
  { level: 'Medium', keywords: ['pothole', 'damaged sidewalk', 'vandalism', 'road sign', 'traffic light', 'drainage', 'trash', 'blocked', 'water', 'electricity'] },
];

export const calculatePriority = (category = '', description = '') => {
  const text = `${category || ''} ${description || ''}`.toLowerCase();
  if (!text.trim()) return 'Low';

  for (const rule of PRIORITY_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.level;
    }
  }

  return 'Low';
};
