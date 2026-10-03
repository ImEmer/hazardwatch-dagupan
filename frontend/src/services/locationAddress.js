const toAddressPart = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
};

const normalizeBarangay = (value) => toAddressPart(value)
    .replace(/^barangay\s+/i, '')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();

export const resolveAddressBarangay = ({ address = {}, polygonBarangay = '', lat, lng }) => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    const isDagupanCoordinate = Number.isFinite(latitude)
        && Number.isFinite(longitude)
        && latitude >= 15.98 && latitude <= 16.15
        && longitude >= 120.25 && longitude <= 120.45;
    const road = toAddressPart(address.road);
    if (isDagupanCoordinate && /\barellano\s+(?:street|st\.?)\b/i.test(road)) return 'Pantal';
    return toAddressPart(polygonBarangay);
};

const formatBarangayLabel = (value) => {
    const name = toAddressPart(value).replace(/^barangay\s+/i, '').replace(/\s+/g, ' ');
    return name ? `Barangay ${name}` : '';
};

export const formatNominatimAddress = (address = {}, polygonBarangay = '') => {
    const nominatimBarangay = [address.village, address.suburb, address.quarter, address.neighbourhood]
        .map(toAddressPart)
        .find(Boolean) || '';
    const canonicalBarangay = toAddressPart(polygonBarangay);
    const barangay = canonicalBarangay
        ? (normalizeBarangay(nominatimBarangay) === normalizeBarangay(canonicalBarangay) ? nominatimBarangay : canonicalBarangay)
        : nominatimBarangay;
    const street = [address.house_number, address.road].map(toAddressPart).filter(Boolean).join(' ');
    const city = toAddressPart(address.city || address.town || address.municipality || 'Dagupan City');
    const state = toAddressPart(address.state || 'Pangasinan');
    const postcode = toAddressPart(address.postcode);

    return [street, formatBarangayLabel(barangay), city, state, postcode].filter(Boolean).join(', ');
};