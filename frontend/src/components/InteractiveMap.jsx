import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const CATEGORY_COLORS = {
    'Pothole': '#EF4444',
    'Streetlight': '#F59E0B',
    'Drainage': '#3B82F6',
    'Flooding': '#06B6D4',
    'Waste Disposal': '#10B981',
    'Public Facility': '#8B5CF6',
    'Other': '#6B7280'
};

const InteractiveMap = ({
    reports = [],
    onMapClick,
    selectedLocation,
    height = '500px',
    showClickInstruction = false,
    showSelectedMarker = false
}) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);
    const selectedMarkerRef = useRef(null);
    const selectedLabelRef = useRef(null);
    const markerElementRef = useRef(null);
    const labelElementRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);

    const [lng] = useState(120.3333);
    const [lat] = useState(16.0433);
    const [zoom] = useState(14);

    const reverseGeocode = async (lng, lat) => {
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'HazardWatch-Dagupan'
                    }
                }
            );

            const data = response.data;

            if (data && data.display_name) {
                let address = data.display_name;

                address = address.replace(/, Philippines$/, '');
                address = address.replace(/^Dagupan, /, '');

                return {
                    address,
                    barangay: data.address?.suburb || data.address?.village || data.address?.neighbourhood || data.address?.town || '',
                };
            }

            return { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, barangay: '' };
        } catch (error) {
            return { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, barangay: '' };
        }
    };

    // Initialize map
    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                sources: {
                    osm: {
                        type: 'raster',
                        tiles: [
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                        ],
                        tileSize: 256,
                        attribution: '&copy; OpenStreetMap Contributors'
                    }
                },
                layers: [
                    {
                        id: 'osm',
                        type: 'raster',
                        source: 'osm'
                    }
                ]
            },
            center: [lng, lat],
            zoom: zoom,
            maxBounds: [
                [120.25, 16.00],
                [120.42, 16.10]
            ]
        });

        map.current.addControl(
            new maplibregl.NavigationControl(),
            'top-right'
        );

        const geolocateControl = new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserLocation: true
        });

        // Geolocation is optional; the map remains usable when permission or browser support is unavailable.
        geolocateControl.on('error', () => {});
        map.current.addControl(geolocateControl, 'top-right');

        // Force map to recalculate dimensions once fully loaded
        map.current.on('load', () => {
            map.current.resize();
            setMapReady(true);
        });

        if (onMapClick) {
            map.current.on('click', async (e) => {
                const { lng, lat } = e.lngLat;

                const geocodedLocation = await reverseGeocode(lng, lat);

                onMapClick(
                    {
                        lng,
                        lat
                    },
                    geocodedLocation.address,
                    geocodedLocation.barangay
                );
            });

            map.current.on('mouseenter', () => {
                map.current.getCanvas().style.cursor = 'crosshair';
            });

            map.current.on('mouseleave', () => {
                map.current.getCanvas().style.cursor = '';
            });
        }

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Update report markers
    useEffect(() => {
        if (!map.current) return;

        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        reports.forEach((report) => {
            if (!report.location || !report.location.coordinates) return;

            const [lng, lat] = report.location.coordinates;

            const color =
                CATEGORY_COLORS[report.category] || '#6B7280';

            const el = document.createElement('div');

            el.className = 'flex items-center justify-center';

            el.style.width = '32px';
            el.style.height = '32px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = color;
            el.style.border = '3px solid white';
            el.style.boxShadow =
                '0 4px 6px rgba(0,0,0,0.2)';
            el.style.cursor = 'pointer';

            const popup = new maplibregl.Popup({
                offset: 25,
                closeButton: true
            }).setHTML(`
                <div class="p-2 max-w-xs">
                    <h3 class="font-bold text-gray-800">
                        ${report.title || 'Untitled'}
                    </h3>

                    <p class="text-sm text-gray-600">
                        ${report.category}
                    </p>

                    <p class="text-xs text-gray-500 mt-1">
                        Status:
                        <span class="font-medium">
                            ${report.status || 'Pending'}
                        </span>
                    </p>

                    <p class="text-xs text-gray-400 mt-1">
                        ${new Date(
                            report.createdAt
                        ).toLocaleDateString()}
                    </p>

                    ${
                        report.address
                            ? `
                                <p class="text-xs text-gray-500 mt-1 truncate">
                                    ${report.address}
                                </p>
                            `
                            : ''
                    }
                </div>
            `);

            const marker = new maplibregl.Marker({
                element: el,
                anchor: 'center'
            })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(map.current);

            markersRef.current.push(marker);
        });
    }, [mapReady, reports]);

    // SELECTED LOCATION MARKER
    useEffect(() => {
        if (!map.current) return;

        // Remove selected marker and label when disabled
        if (!selectedLocation || !showSelectedMarker) {
            if (selectedMarkerRef.current) {
                selectedMarkerRef.current.remove();
                selectedMarkerRef.current = null;
                markerElementRef.current = null;
            }

            if (selectedLabelRef.current) {
                selectedLabelRef.current.remove();
                selectedLabelRef.current = null;
                labelElementRef.current = null;
            }

            return;
        }

        const clickedLng = selectedLocation.lng;
        const clickedLat = selectedLocation.lat;

        if (
            clickedLng === undefined ||
            clickedLat === undefined
        ) {
            return;
        }

        if (!selectedMarkerRef.current) {
            // OUTER MAPLIBRE MARKER ELEMENT
            const el = document.createElement('div');

            el.className = 'selected-location-marker';

            el.style.width = '48px';
            el.style.height = '60px';
            el.style.zIndex = '1000';
            el.style.pointerEvents = 'none';
            el.style.display = 'flex';
            el.style.alignItems = 'flex-start';
            el.style.justifyContent = 'center';

            /*
             * INNER VISUAL ELEMENT
             * Only this element gets animation.
             */
            const visual = document.createElement('div');

            visual.style.width = '48px';
            visual.style.height = '60px';
            visual.style.display = 'flex';
            visual.style.alignItems = 'flex-start';
            visual.style.justifyContent = 'center';
            visual.style.pointerEvents = 'none';
            visual.style.animation =
                'pulse-marker 1.5s infinite ease-in-out';

            visual.innerHTML = `
                <svg
                    viewBox="0 0 40 52"
                    width="48"
                    height="60"
                    style="display:block;"
                >
                    <path
                        d="M20 0
                            C8.95 0 0 8.95 0 20
                            C0 31.05 20 52 20 52
                            C20 52 40 31.05 40 20
                            C40 8.95 31.05 0 20 0 Z"
                        fill="#EF4444"
                        stroke="white"
                        stroke-width="3"
                    />

                    <circle
                        cx="20"
                        cy="19"
                        r="9"
                        fill="white"
                        stroke="#EF4444"
                        stroke-width="2.5"
                    />
                </svg>
            `;

            el.appendChild(visual);

            markerElementRef.current = el;

    
            const marker = new maplibregl.Marker({
                element: el,
                anchor: 'bottom'
            })
                .setLngLat([clickedLng, clickedLat])
                .addTo(map.current);

            selectedMarkerRef.current = marker;

            // LOCATION LABEL
            const labelEl = document.createElement('div');

            labelEl.className =
                'flex items-center justify-center';

            labelEl.style.zIndex = '999';
            labelEl.style.backgroundColor =
                'rgba(0,0,0,0.85)';
            labelEl.style.color = 'white';
            labelEl.style.padding = '6px 14px';
            labelEl.style.borderRadius = '6px';
            labelEl.style.fontSize = '12px';
            labelEl.style.fontWeight = '500';
            labelEl.style.border = '1px solid rgba(239, 68, 68, 0.5)';
            labelEl.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
            labelEl.style.backdropFilter = 'blur(4px)';
            labelEl.style.pointerEvents = 'none';
            labelEl.style.whiteSpace = 'nowrap';
            labelEl.style.width = 'max-content';
            labelEl.style.maxWidth = 'none';
            labelEl.style.overflow = 'visible';
            labelEl.style.textOverflow = 'clip';

            labelElementRef.current = labelEl;

            const labelMarker = new maplibregl.Marker({
                element: labelEl,
                anchor: 'center'
            })
                .setLngLat([
                    clickedLng,
                    clickedLat + 0.0008
                ])
                .addTo(map.current);

            selectedLabelRef.current = labelMarker;

            // Add pulse animation only once
            if (!document.getElementById('pulse-marker-style')) {
                const style = document.createElement('style');

                style.id = 'pulse-marker-style';

                style.textContent = `
                    @keyframes pulse-marker {
                        0% {
                            transform: scale(1);
                            filter:
                                drop-shadow(
                                    0 4px 15px
                                    rgba(239, 68, 68, 0.8)
                                )
                                drop-shadow(
                                    0 0 30px
                                    rgba(239, 68, 68, 0.3)
                                );
                        }

                        50% {
                            transform: scale(1.08);
                            filter:
                                drop-shadow(
                                    0 4px 25px
                                    rgba(239, 68, 68, 1)
                                )
                                drop-shadow(
                                    0 0 50px
                                    rgba(239, 68, 68, 0.5)
                                );
                        }

                        100% {
                            transform: scale(1);
                            filter:
                                drop-shadow(
                                    0 4px 15px
                                    rgba(239, 68, 68, 0.8)
                                )
                                drop-shadow(
                                    0 0 30px
                                    rgba(239, 68, 68, 0.3)
                                );
                        }
                    }
                `;

                document.head.appendChild(style);
            }
        } else {
            /*
             * Existing marker:
             * update its geographic position directly.
             */
            selectedMarkerRef.current.setLngLat([
                clickedLng,
                clickedLat
            ]);

            /*
             * Keep label attached to the selected location.
             */
            if (selectedLabelRef.current) {
                selectedLabelRef.current.setLngLat([
                    clickedLng,
                    clickedLat + 0.0008
                ]);
            }
        }

        // Update location label
        const displayAddress =
            selectedLocation.address ||
            `${clickedLat.toFixed(4)}, ${clickedLng.toFixed(4)}`;

        if (labelElementRef.current) {
            labelElementRef.current.textContent =
                displayAddress;
        }

        // Move map to selected location
        map.current.flyTo({
            center: [clickedLng, clickedLat],
            zoom: 16,
            duration: 1000
        });
    }, [selectedLocation, showSelectedMarker]);

    return (
        <div
            className="relative w-full rounded-xl overflow-hidden border border-gray-200 shadow-md"
            style={{ height }}
        >
            <div
                ref={mapContainer}
                className="w-full h-full relative"
            />

            {showClickInstruction && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm text-gray-700 border border-gray-200">
                    Click the map to select the location
                </div>
            )}
        </div>
    );
};

export default InteractiveMap;