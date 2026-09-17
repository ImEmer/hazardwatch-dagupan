import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../../context/ReportContext';
import useAuth from '../../hooks/useAuth';
import useTheme from '../../hooks/useTheme';
import { confirmAction, showError, showSuccess, showWarning } from '../../services/alerts';
import InteractiveMap from '../../components/InteractiveMap';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { HAZARD_CATEGORY_GROUPS } from '../../services/reportOptions';

const withinDagupanBounds = ({ lat, lng }) => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
    return latitude >= 16.02 && latitude <= 16.10 && longitude >= 120.30 && longitude <= 120.40;
};

const SubmitReport = () => {
    const { addReport } = useReports();
    const { isAuthenticated, token } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [selectedBarangay, setSelectedBarangay] = useState('');
    const [form, setForm] = useState({
        category: '',
        customCategory: '',
        description: '',
    });
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const photoInputRef = useRef(null);

    useEffect(() => {
        AOS.init({ duration: 800, easing: 'ease-in-out', once: true });
        AOS.refresh();
    }, []);

    const handleMapClick = (location, address, barangay) => {
        setSelectedLocation({ 
            lng: location.lng, 
            lat: location.lat, 
            address: address 
        });
        setSelectedAddress(address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
        setSelectedBarangay(barangay || '');
        setErrors((prev) => ({ ...prev, location: '' }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value, ...(name === 'category' && value !== 'Other' ? { customCategory: '' } : {}) }));
        if (errors[e.target.name]) {
            setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        const validFiles = files.filter((file) => /^image\/(jpeg|jpg|png|webp)$/.test(file.type) && file.size <= 5 * 1024 * 1024);
        if (validFiles.length !== files.length) setErrors((prev) => ({ ...prev, photo: 'Images must be JPG, PNG, or WebP files no larger than 5MB.' }));
        const available = Math.max(0, 3 - images.length);
        if (files.length > available) showWarning('Maximum 3 images allowed.');
        const nextImages = [...images, ...validFiles.slice(0, available)];
        setImages(nextImages);
        if (validFiles.length === files.length) setErrors((prev) => ({ ...prev, photo: '' }));
        e.target.value = '';
    };

    const resetFormState = () => {
        setForm({ category: '', customCategory: '', description: '' });
        setSelectedLocation(null);
        setSelectedAddress('');
        setSelectedBarangay('');
        setImages([]);
        setErrors({});
        if (photoInputRef.current) photoInputRef.current.value = '';
    };

    const handleRemovePhoto = (index) => {
        setImages((current) => {
            const nextImages = current.filter((_, imageIndex) => imageIndex !== index);
            setErrors((prev) => ({
                ...prev,
                photo: nextImages.length > 0 ? '' : 'Photo evidence is required.',
            }));
            return nextImages;
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.category) newErrors.category = 'Please select a hazard type.';
        if (form.category === 'Other' && !form.customCategory.trim()) newErrors.customCategory = 'Please specify the hazard type.';
        if (form.category === 'Other' && form.customCategory.trim() && (!/^[A-Za-z0-9 ]+$/.test(form.customCategory.trim()) || form.customCategory.trim().length > 60)) newErrors.customCategory = 'Use only letters, numbers, and spaces, up to 60 characters.';
        if (!form.description.trim()) {
            newErrors.description = 'Please describe the hazard.';
        } else if (form.description.trim().length < 10) {
            newErrors.description = 'Description must be at least 10 characters long.';
        }
        if (!images.length) newErrors.photo = 'Photo evidence is required.';
        if (!selectedLocation) newErrors.location = 'Please select a location on the map.';
        else if (!withinDagupanBounds(selectedLocation)) newErrors.location = 'Reports must be submitted within Dagupan City limits.';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            const result = await confirmAction('You need to log in before submitting a report.', 'Login');
            if (result.isConfirmed) {
                navigate('/login', { state: { from: '/submit' } });
            }
            return;
        }

        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const firstError = document.querySelector('.border-red-500');
            if (firstError) firstError.focus();
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        const newReport = {
            category: form.category,
            customCategory: form.category === 'Other' ? form.customCategory.trim() : '',
            description: form.description.trim(),
            location: {
                type: 'Point',
                coordinates: [selectedLocation.lng, selectedLocation.lat]
            },
            address: selectedAddress,
            photoFile: images[0],
            photos: images,
            barangay: selectedBarangay,
        };
        try {
            await addReport(newReport, token);
            await showSuccess('Your hazard report was submitted successfully.');
            resetFormState();
        } catch (error) {
            await showError(error.message || 'Unable to save the report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`min-h-screen px-4 py-8 ${isDark ? 'bg-[#0a0b0f]' : 'bg-slate-50'}`}>
        <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-12">
            {/* LEFT COLUMN - FORM */}
            <div data-aos="fade-up" className={`lg:col-span-2 lg:h-full rounded-xl border p-6 shadow-md ${isDark ? 'border-[#2e303a] bg-[#14151d]' : 'border-gray-200 bg-white shadow-sm'}`}>
                <form onSubmit={handleSubmit} className="space-y-5">
                {/* Hazard Type */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1.5">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Hazard Type <span className="text-red-400">*</span>
                    </span>
                    </label>
                                        {/*
                                              WARNING: DO NOT CHANGE THIS DROPDOWN TO USE a native option-group wrapper.
                                            This dropdown must remain a FLAT LIST. Group headers such as
                                            Road and Traffic or Water and Drainage are not allowed because
                                            they render as bold, non-selectable labels that confuse users.
                                            Add new categories to HAZARD_CATEGORY_GROUPS and keep the
                                              flatMap below; do not add grouped-option wrappers.
                                        */}
                                        <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-[#0a0b0f] border ${errors.category ? 'border-red-500' : 'border-[#2e303a]'} rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none text-white transition appearance-none`}
                    >
                    <option value="">Select hazard type...</option>
                    {HAZARD_CATEGORY_GROUPS
                        .filter((group) => group.label !== 'Other')
                        .flatMap((group) => group.options)
                        .map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    <option value="Other">Other</option>
                    </select>
                    {errors.category && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.category}
                    </p>
                    )}
                    {form.category === 'Other' && (
                    <div className="mt-3">
                        <label htmlFor="customCategory" className="mb-1.5 block text-sm font-medium text-gray-300">Please specify the hazard type <span className="text-red-400">*</span></label>
                        <input id="customCategory" name="customCategory" type="text" maxLength={60} required value={form.customCategory} onChange={handleChange} placeholder="e.g., Fallen billboard, Stray animal, Broken fence" className={`w-full rounded-lg border bg-[#0a0b0f] px-4 py-2.5 text-white outline-none transition focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6] ${errors.customCategory ? 'border-red-500' : 'border-[#2e303a]'}`} />
                        {errors.customCategory && <p className="mt-1 text-xs text-red-400">{errors.customCategory}</p>}
                    </div>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Description <span className="text-red-400">*</span>
                    </span>
                    </label>
                    <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe the hazard in detail..."
                    className={`w-full px-4 py-2.5 bg-[#0a0b0f] border ${errors.description ? 'border-red-500' : 'border-[#2e303a]'} rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none text-white resize-none transition`}
                    />
                    {errors.description && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.description}
                    </p>
                    )}
                </div>

                {/* Photo / Evidence */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Photo / Evidence <span className="text-red-400">*</span>
                    </span>
                    </label>
                    <div className={`border-2 border-dashed ${errors.photo && images.length === 0 ? 'border-red-500' : 'border-[#2e303a]'} rounded-lg p-4 hover:border-[#3b82f6]/50 transition`}>
                    {images.length ? (
                        <div>
                        <div className="flex flex-wrap gap-3">
                        {images.map((image, index) => (
                            <div key={`${image.name}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-lg border border-[#2e303a]">
                                <img src={URL.createObjectURL(image)} alt={`Selected evidence ${index + 1}`} className="h-full w-full object-cover" />
                                <button type="button" onClick={() => handleRemovePhoto(index)} className="absolute right-1 top-1 rounded-full bg-red-500/90 p-1 text-white hover:bg-red-500" aria-label={`Remove image ${index + 1}`}>
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                        </div>
                        {images.length < 3 && <button type="button" onClick={() => photoInputRef.current?.click()} className={`mt-3 rounded-lg border px-3 py-2 text-sm transition ${isDark ? 'border-slate-600 text-slate-300 hover:border-blue-500 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-gray-50'}`}><span className={isDark ? 'text-slate-400' : 'text-gray-600'} aria-hidden="true">+</span> Add More</button>}
                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple ref={photoInputRef} onChange={handlePhotoChange} className="hidden" />
                        </div>
                    ) : (
                        <div className="text-center py-4">
                        <input
                            type="file"
                            id="photo"
                            name="images"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            multiple
                            ref={photoInputRef}
                            onChange={handlePhotoChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="photo"
                            className="cursor-pointer text-gray-400 hover:text-white transition"
                        >
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium">Click to upload photos</span>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (max 5MB)</p>
                        </label>
                        </div>
                    )}
                    </div>
                    {errors.photo && images.length === 0 && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.photo}
                    </p>
                    )}
                </div>

                {/* Submit Button */}
                {errors.location && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.location}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-lg font-semibold text-white transition ${
                    isSubmitting 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-[#3b82f6] hover:bg-[#2563eb] shadow-lg shadow-[#3b82f6]/25 hover:shadow-[#3b82f6]/40'
                    }`}
                >
                    {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Submitting...
                    </span>
                    ) : (
                    'Submit Report'
                    )}
                </button>
                </form>
            </div>

            {/* RIGHT COLUMN - MAP */}
            <div data-aos="fade-left" data-aos-delay="150" className="lg:col-span-3 lg:h-full">
                <div className={`h-full overflow-hidden rounded-xl border ${errors.location ? 'border-red-500' : isDark ? 'border-[#2e303a]' : 'border-gray-200'} flex flex-col ${isDark ? 'bg-[#14151d]' : 'bg-white shadow-sm'}`}>
                <div className={`flex items-center gap-2 border-b p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]/50' : 'border-gray-200 bg-slate-50'}`}>
                    <svg className="w-4 h-4 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Click the map to select the hazard location.
                    </p>
                </div>
                <div className="flex-1 min-h-[400px]">
                    <InteractiveMap
                        reports={[]}
                        onMapClick={handleMapClick}
                        selectedLocation={selectedLocation}
                        height="100%"
                        showClickInstruction={false}
                        showSelectedMarker={true}
                    />
                </div>
                <div className={`flex items-center gap-2 border-t p-3 ${isDark ? 'border-[#2e303a] bg-[#0a0b0f]/50' : 'border-gray-200 bg-slate-50'}`}>
                    {selectedLocation ? (
                    <>
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <span className={`flex-1 truncate text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedAddress}
                        </span>
                        <button
                        type="button"
                        onClick={() => {
                            setSelectedLocation(null);
                            setSelectedAddress('');
                            setSelectedBarangay('');
                        }}
                        className="text-xs text-gray-500 hover:text-red-400 transition"
                        >
                        Clear
                        </button>
                    </>
                    ) : (
                    <>
                        <svg className="w-4 h-4 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.5 7.5l-1.5 4.5L9 12" />
                        </svg>
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No location selected yet.</span>
                    </>
                    )}
                    {selectedLocation && <p className="mt-1 text-xs text-green-400">Location selected.</p>}
                </div>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
};

export default SubmitReport;