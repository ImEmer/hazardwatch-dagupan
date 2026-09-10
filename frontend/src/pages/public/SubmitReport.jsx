import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../../context/ReportContext';
import useAuth from '../../hooks/useAuth';
import { showError, showSuccess, showWarning } from '../../services/alerts';
import InteractiveMap from '../../components/InteractiveMap';
import AOS from 'aos';
import 'aos/dist/aos.css';

const SubmitReport = () => {
    const { addReport } = useReports();
    const { isAuthenticated, token } = useAuth();
    const navigate = useNavigate();
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [selectedBarangay, setSelectedBarangay] = useState('');
    const [form, setForm] = useState({
        category: '',
        description: '',
    });
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
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
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) {
            setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setErrors((prev) => ({ ...prev, photo: '' }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetFormState = () => {
        setForm({ category: '', description: '' });
        setSelectedLocation(null);
        setSelectedAddress('');
        setSelectedBarangay('');
        setPhoto(null);
        setPhotoPreview(null);
        setErrors({});
        if (photoInputRef.current) photoInputRef.current.value = '';
    };

    const handleRemovePhoto = () => {
        setPhoto(null);
        setPhotoPreview(null);
        setErrors((prev) => ({ ...prev, photo: 'Photo evidence is required.' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!form.category) newErrors.category = 'Please select a hazard type.';
        if (!form.description.trim()) {
            newErrors.description = 'Please describe the hazard.';
        } else if (form.description.trim().length < 10) {
            newErrors.description = 'Description must be at least 10 characters long.';
        }
        if (!photo) newErrors.photo = 'Photo evidence is required.';
        if (!selectedLocation) newErrors.location = 'Please select a location on the map.';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            const result = await showWarning('You need to log in before submitting a report.');
            if (result?.isConfirmed) {
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
            description: form.description.trim(),
            location: {
                type: 'Point',
                coordinates: [selectedLocation.lng, selectedLocation.lat]
            },
            address: selectedAddress,
            photoFile: photo,
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
        <div className="min-h-screen bg-[#0a0b0f] py-8 px-4">
        <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-12">
            {/* LEFT COLUMN - FORM */}
            <div data-aos="fade-up" className="lg:col-span-2 bg-[#14151d] border border-[#2e303a] rounded-xl shadow-md p-6">
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
                    <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-[#0a0b0f] border ${errors.category ? 'border-red-500' : 'border-[#2e303a]'} rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none text-white transition appearance-none`}
                    >
                    <option value="">Select hazard type...</option>
                    <option value="Pothole">Pothole</option>
                    <option value="Streetlight">Broken Streetlight</option>
                    <option value="Drainage">Clogged Drainage</option>
                    <option value="Flooding">Flooding</option>
                    <option value="Waste Disposal">Waste Disposal</option>
                    <option value="Public Facility">Damaged Public Facility</option>
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
                    <div className={`border-2 border-dashed ${errors.photo ? 'border-red-500' : 'border-[#2e303a]'} rounded-lg p-4 hover:border-[#3b82f6]/50 transition`}>
                    {photoPreview ? (
                        <div className="relative">
                        <img 
                            src={photoPreview} 
                            alt="Preview" 
                            className="max-h-48 rounded-lg mx-auto object-contain"
                        />
                        <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-1.5 hover:bg-red-500 transition shadow-lg"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                        <input
                            type="file"
                            id="photo"
                            name="photo"
                            accept="image/*"
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
                            <span className="text-sm font-medium">Click to upload photo</span>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (max 5MB)</p>
                        </label>
                        </div>
                    )}
                    </div>
                    {errors.photo && (
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
            <div data-aos="fade-left" data-aos-delay="150" className="lg:col-span-3">
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                    Location <span className="text-red-400">*</span>
                </label>
                <div className={`bg-[#14151d] border ${errors.location ? 'border-red-500' : 'border-[#2e303a]'} rounded-xl overflow-hidden h-full`}>
                <div className="p-3 border-b border-[#2e303a] bg-[#0a0b0f]/50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-sm text-gray-400">
                    Click the map to select the hazard location.
                    </p>
                </div>
                <InteractiveMap 
                    reports={[]} 
                    onMapClick={handleMapClick} 
                    selectedLocation={selectedLocation} 
                    height="520px" 
                    showClickInstruction={false}
                    showSelectedMarker={true}
                />
                <div className="p-3 border-t border-[#2e303a] bg-[#0a0b0f]/50 flex items-center gap-2">
                    {selectedLocation ? (
                    <>
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <span className="text-sm text-white font-medium flex-1 truncate">
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
                        <span className="text-sm text-gray-400">No location selected yet.</span>
                    </>
                    )}
                </div>
                {selectedLocation && <p className="mt-1 text-xs text-green-400">Location selected.</p>}
                </div>
            </div>
            </div>
        </div>
        </div>
    );
};

export default SubmitReport;