export const DAGUPAN_BARANGAYS = [
  'Bacayao Norte', 'Bacayao Sur', 'Banaoang', 'Barangay I', 'Barangay II', 'Barangay III', 'Barangay IV',
  'Bolosan', 'Bonuan Binloc', 'Bonuan Boquig', 'Bonuan Gueset', 'Calmay', 'Carael', 'Caranglaan',
  'Herrero', 'Herrero-Perez', 'Lasip Chico', 'Lasip Grande', 'Lomboy', 'Lucao', 'Malued', 'Mamalingling',
  'Mangin', 'Mayombo', 'Pantal', 'Pogo Chico', 'Pogo Grande', 'Salapingao', 'San Fabian', 'Sapanglang',
  'Tambac', 'Tapuac', 'Tebeng', 'Tondaligan'
];

export const DAGUPAN_BOUNDS = { minLat: 16.02, maxLat: 16.10, minLng: 120.30, maxLng: 120.40 };

export const isDagupanBarangay = (value) => DAGUPAN_BARANGAYS.includes(String(value || '').trim());

export const isDagupanLocation = ({ lat, lng }) => {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  return latitude >= DAGUPAN_BOUNDS.minLat && latitude <= DAGUPAN_BOUNDS.maxLat && longitude >= DAGUPAN_BOUNDS.minLng && longitude <= DAGUPAN_BOUNDS.maxLng;
};
