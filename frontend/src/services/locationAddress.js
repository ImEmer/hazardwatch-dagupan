const toAddressPart = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
};

const normalizeBarangay = (value) => toAddressPart(value)
    .replace(/^barangay\s+/i, '')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();

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