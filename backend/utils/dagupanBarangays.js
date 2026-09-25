export const DAGUPAN_BARANGAYS = [
  'Bacayao Norte', 'Bacayao Sur', 'Banaoang', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV',
  'Bolosan', 'Bonuan Binloc', 'Bonuan Boquig', 'Bonuan Gueset', 'Calmay', 'Carael', 'Caranglaan',
  'Herrero', 'Herrero-Perez', 'Lasip Chico', 'Lasip Grande', 'Lomboy', 'Lucao', 'Malued', 'Mamalingling',
  'Mangin', 'Mayombo', 'Pantal', 'Poblacion Oeste', 'Pogo Chico', 'Pogo Grande', 'Salapingao', 'San Fabian', 'Sapanglang',
  'Tambac', 'Tapuac', 'Tebeng', 'Tondaligan'
];

export const DAGUPAN_BOUNDS = { minLat: 15.98, maxLat: 16.15, minLng: 120.25, maxLng: 120.45 };

const BARANGAY_CENTERS = {
  'Barangay I': [120.3340, 16.0430], 'Barangay II': [120.3350, 16.0420], 'Barangay III': [120.3360, 16.0410], 'Barangay IV': [120.3370, 16.0400],
  'Bacayao Norte': [120.3480, 16.0380], 'Bacayao Sur': [120.3450, 16.0350], Banaoang: [120.3550, 16.0450], Bolosan: [120.3470, 16.0460],
  'Bonuan Binloc': [120.3180, 16.0580], 'Bonuan Boquig': [120.3220, 16.0610], 'Bonuan Gueset': [120.3200, 16.0630], Calmay: [120.3250, 16.0400],
  Carael: [120.3150, 16.0500], Caranglaan: [120.3450, 16.0380], Herrero: [120.3400, 16.0450], 'Herrero-Perez': [120.3400, 16.0450],
  'Lasip Chico': [120.3300, 16.0380], 'Lasip Grande': [120.3320, 16.0360], Lomboy: [120.3380, 16.0330], Lucao: [120.3400, 16.0380],
  Malued: [120.3420, 16.0560], Mamalingling: [120.3520, 16.0480], Mangin: [120.3320, 16.0350], Mayombo: [120.3380, 16.0500],
  Pantal: [120.3450, 16.0450], 'Poblacion Oeste': [120.3350, 16.0430], 'Pogo Chico': [120.3330, 16.0380], 'Pogo Grande': [120.3350, 16.0400],
  Salapingao: [120.3530, 16.0520], 'San Fabian': [120.3260, 16.0580], Sapanglang: [120.3500, 16.0430], Tambac: [120.3350, 16.0600],
  Tapuac: [120.3280, 16.0330], Tebeng: [120.3500, 16.0300], Tondaligan: [120.3150, 16.0380],
};

const BARANGAY_BOUNDS = {
  Pantal: { minLat: 16.02, maxLat: 16.08, minLng: 120.32, maxLng: 120.39 },
  'Bonuan Gueset': { minLat: 16.04, maxLat: 16.12, minLng: 120.30, maxLng: 120.39 },
  'Bonuan Boquig': { minLat: 16.02, maxLat: 16.08, minLng: 120.28, maxLng: 120.35 },
  'Bonuan Binloc': { minLat: 16.05, maxLat: 16.11, minLng: 120.35, maxLng: 120.42 },
  'Barangay I': { minLat: 16.04, maxLat: 16.07, minLng: 120.34, maxLng: 120.38 },
  'Barangay II': { minLat: 16.04, maxLat: 16.07, minLng: 120.33, maxLng: 120.37 },
  'Barangay III': { minLat: 16.04, maxLat: 16.07, minLng: 120.32, maxLng: 120.36 },
  'Barangay IV': { minLat: 16.04, maxLat: 16.07, minLng: 120.31, maxLng: 120.35 },
  'San Fabian': { minLat: 16.03, maxLat: 16.09, minLng: 120.25, maxLng: 120.31 },
  'Bacayao Norte': { minLat: 16.06, maxLat: 16.15, minLng: 120.28, maxLng: 120.36 },
  'Bacayao Sur': { minLat: 16.04, maxLat: 16.11, minLng: 120.30, maxLng: 120.38 },
  Malued: { minLat: 16.00, maxLat: 16.07, minLng: 120.25, maxLng: 120.34 },
  'Tondaligan': { minLat: 16.03, maxLat: 16.09, minLng: 120.35, maxLng: 120.45 },
  'Tapuac': { minLat: 16.03, maxLat: 16.08, minLng: 120.33, maxLng: 120.42 },
  'Salapingao': { minLat: 16.01, maxLat: 16.08, minLng: 120.28, maxLng: 120.35 },
  'Banaoang': { minLat: 16.03, maxLat: 16.11, minLng: 120.26, maxLng: 120.35 },
  'Calmay': { minLat: 15.99, maxLat: 16.08, minLng: 120.29, maxLng: 120.37 },
  'Lomboy': { minLat: 16.01, maxLat: 16.07, minLng: 120.30, maxLng: 120.40 },
  'Lasip Chico': { minLat: 16.02, maxLat: 16.08, minLng: 120.30, maxLng: 120.37 },
  'Lasip Grande': { minLat: 16.01, maxLat: 16.08, minLng: 120.32, maxLng: 120.39 },
  'Mangin': { minLat: 16.04, maxLat: 16.08, minLng: 120.31, maxLng: 120.37 },
  'Mamangling': { minLat: 16.04, maxLat: 16.09, minLng: 120.30, maxLng: 120.37 },
  'Mamalingling': { minLat: 16.04, maxLat: 16.09, minLng: 120.30, maxLng: 120.37 },
  'Pogo Chico': { minLat: 16.01, maxLat: 16.06, minLng: 120.28, maxLng: 120.34 },
  'Pogo Grande': { minLat: 16.02, maxLat: 16.08, minLng: 120.29, maxLng: 120.35 },
  'Sapanglang': { minLat: 16.02, maxLat: 16.08, minLng: 120.31, maxLng: 120.38 },
  'Carael': { minLat: 16.01, maxLat: 16.07, minLng: 120.35, maxLng: 120.42 },
  'Tambac': { minLat: 16.04, maxLat: 16.12, minLng: 120.31, maxLng: 120.39 },
  'Caranglaan': { minLat: 16.03, maxLat: 16.08, minLng: 120.33, maxLng: 120.40 },
  'Bolosan': { minLat: 16.03, maxLat: 16.09, minLng: 120.30, maxLng: 120.36 },
  'Lucao': { minLat: 16.03, maxLat: 16.10, minLng: 120.31, maxLng: 120.40 },
  'Mayombo': { minLat: 16.00, maxLat: 16.07, minLng: 120.29, maxLng: 120.36 },
  'Herrero': { minLat: 16.00, maxLat: 16.06, minLng: 120.27, maxLng: 120.35 },
  'Herrero-Perez': { minLat: 16.00, maxLat: 16.06, minLng: 120.27, maxLng: 120.35 },
  'Tebeng': { minLat: 16.01, maxLat: 16.07, minLng: 120.28, maxLng: 120.36 }
};

export const isDagupanBarangay = (value) => DAGUPAN_BARANGAYS.includes(String(value || '').trim());

export const detectBarangayByLocation = ({ lat, lng }) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return '';

  let nearest = '';
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const [barangay, [centerLng, centerLat]] of Object.entries(BARANGAY_CENTERS)) {
    const distance = ((longitude - centerLng) * Math.cos(latitude * Math.PI / 180)) ** 2 + (latitude - centerLat) ** 2;
    if (distance < nearestDistance) {
      nearest = barangay;
      nearestDistance = distance;
    }
  }
  return nearest;
};

export const isDagupanLocation = ({ lat, lng }) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return latitude >= DAGUPAN_BOUNDS.minLat && latitude <= DAGUPAN_BOUNDS.maxLat && longitude >= DAGUPAN_BOUNDS.minLng && longitude <= DAGUPAN_BOUNDS.maxLng;
};
