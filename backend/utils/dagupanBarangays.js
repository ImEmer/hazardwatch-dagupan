export const DAGUPAN_BARANGAYS = [
  'Bacayao Norte', 'Bacayao Sur', 'Banaoang', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV',
  'Bolosan', 'Bonuan Binloc', 'Bonuan Boquig', 'Bonuan Gueset', 'Calmay', 'Carael', 'Caranglaan',
  'Herrero', 'Herrero-Perez', 'Lasip Chico', 'Lasip Grande', 'Lomboy', 'Lucao', 'Malued', 'Mamalingling',
  'Mangin', 'Mayombo', 'Pantal', 'Pogo Chico', 'Pogo Grande', 'Salapingao', 'San Fabian', 'Sapanglang',
  'Tambac', 'Tapuac', 'Tebeng', 'Tondaligan'
];

export const DAGUPAN_BOUNDS = { minLat: 15.98, maxLat: 16.15, minLng: 120.25, maxLng: 120.45 };

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

  const match = Object.entries(BARANGAY_BOUNDS).find(([, bounds]) => (
    latitude >= bounds.minLat && latitude <= bounds.maxLat && longitude >= bounds.minLng && longitude <= bounds.maxLng
  ));

  return match ? match[0] : '';
};

export const isDagupanLocation = ({ lat, lng }) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return latitude >= DAGUPAN_BOUNDS.minLat && latitude <= DAGUPAN_BOUNDS.maxLat && longitude >= DAGUPAN_BOUNDS.minLng && longitude <= DAGUPAN_BOUNDS.maxLng;
};
