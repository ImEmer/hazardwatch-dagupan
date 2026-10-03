const toAddressPart = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
};

const formatBarangayLabel = (value) => {
    const name = toAddressPart(value).replace(/^barangay\s+/i, '').replace(/\s+/g, ' ');
    return name ? `Barangay ${name}` : '';
};

export const formatNominatimAddress = (address = {}, polygonBarangay = '') => {
    const barangay = toAddressPart(polygonBarangay);
    const street = [address.house_number, address.road].map(toAddressPart).filter(Boolean).join(' ');
    const city = toAddressPart(address.city || address.town || address.municipality || 'Dagupan City');
    const state = toAddressPart(address.state || 'Pangasinan');
    const postcode = toAddressPart(address.postcode);

    return [street, formatBarangayLabel(barangay), city, state, postcode].filter(Boolean).join(', ');
};