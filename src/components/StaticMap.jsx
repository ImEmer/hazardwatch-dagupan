    import React, { useEffect, useRef } from 'react';
    import * as maplibregl from 'maplibre-gl';
    import 'maplibre-gl/dist/maplibre-gl.css';

    const StaticMap = () => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const phaseTimeout = useRef(null);
    const step = useRef(0);
    const markerRefs = useRef([]);
    const isFirstRun = useRef(true);

    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
            version: 8,
            sources: {
            'osm': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
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
        center: [120.3333, 16.0433],
        zoom: 13,
        interactive: false,
        scrollZoom: false,
        dragPan: false,
        dragRotate: false,
        keyboard: false,
        doubleClickZoom: false,
        touchZoomRotate: false,
        touchPitch: false,
        attributionControl: false
        });

        // ========== CREATE LOCATION MARKERS ONLY ==========
        map.current.on('load', () => {
        const locations = [
            { lng: 120.3333, lat: 16.0433, label: 'City Plaza' },
            { lng: 120.3280, lat: 16.0550, label: 'Bonuan' },
            { lng: 120.3450, lat: 16.0380, label: 'Lucao' }
        ];

        locations.forEach((loc) => {
            // VISIBLE RED PIN MARKER
            const el = document.createElement('div');
            el.className = 'flex items-center justify-center';
            el.style.position = 'relative';
            el.style.width = '24px';
            el.style.height = '32px';
            el.style.zIndex = '999';
            el.style.opacity = '1';
            el.style.transition = 'opacity 800ms ease-in-out';
            
            el.innerHTML = `
            <svg viewBox="0 0 40 52" width="24" height="32" style="filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 30px rgba(239, 68, 68, 0.4)); animation: pulse-red-pin 1.5s infinite ease-in-out;">
                <path d="M20 0 C8.95 0 0 8.95 0 20 C0 31.05 20 52 20 52 C20 52 40 31.05 40 20 C40 8.95 31.05 0 20 0 Z" 
                    fill="#EF4444" stroke="white" stroke-width="2.5"/>
                <circle cx="20" cy="19" r="8" fill="white" stroke="#EF4444" stroke-width="2"/>
            </svg>
            `;

            const marker = new maplibregl.Marker({ element: el })
            .setLngLat([loc.lng, loc.lat])
            .addTo(map.current);
            markerRefs.current.push(marker);

            // LABEL
            const labelEl = document.createElement('div');
            labelEl.className = 'text-white font-semibold text-center';
            labelEl.style.textShadow = '0 0 20px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.9)';
            labelEl.style.background = 'rgba(0,0,0,0.7)';
            labelEl.style.padding = '2px 10px';
            labelEl.style.borderRadius = '4px';
            labelEl.style.marginTop = '1px';
            labelEl.style.fontSize = '11px';
            labelEl.style.letterSpacing = '0.3px';
            labelEl.style.border = '1px solid rgba(239, 68, 68, 0.4)';
            labelEl.style.backdropFilter = 'blur(4px)';
            labelEl.style.opacity = '1';
            labelEl.style.transition = 'opacity 800ms ease-in-out';
            labelEl.textContent = loc.label;

            const labelMarker = new maplibregl.Marker({ element: labelEl })
            .setLngLat([loc.lng, loc.lat - 0.008])
            .addTo(map.current);
            markerRefs.current.push(labelMarker);
        });

        // ========== ANIMATION WITH ZOOM AND ROTATION ==========
        const destinations = [
            [120.3333, 16.0433],
            [120.3280, 16.0550],
            [120.3450, 16.0380],
            [120.3380, 16.0500],
            [120.3333, 16.0433]
        ];

        let currentBearing = 0;

        // Always show location markers
        const showLocationMarkers = () => {
            markerRefs.current.forEach((marker) => {
            const el = marker.getElement();
            if (el) el.style.opacity = '1';
            });
        };

        // ========== PHASE 1: MAP MOVEMENT ==========
        const runPhase1 = () => {
            showLocationMarkers();

            const targetBearing = (step.current * 8) % 30 - 15;
            currentBearing = targetBearing;

            const target = destinations[step.current % destinations.length];
            map.current.flyTo({
            center: target,
            bearing: targetBearing,
            duration: 4000,
            essential: true
            });

            step.current++;

            if (phaseTimeout.current) clearTimeout(phaseTimeout.current);
            phaseTimeout.current = setTimeout(() => {
            runPhase2();
            }, 4500);
        };

        // ========== PHASE 2: ZOOM IN + ROTATE ==========
        const runPhase2 = () => {
            const zoomTarget = 14.5;
            const bearingTarget = currentBearing + 18;

            map.current.easeTo({
            zoom: zoomTarget,
            bearing: bearingTarget,
            duration: 3000,
            essential: true
            });

            currentBearing = bearingTarget;

            if (phaseTimeout.current) clearTimeout(phaseTimeout.current);
            phaseTimeout.current = setTimeout(() => {
            runPhase3();
            }, 4000);
        };

        // ========== PHASE 3: ZOOM OUT + ROTATE BACK ==========
        const runPhase3 = () => {
            const bearingTarget = currentBearing - 18;

            map.current.easeTo({
            zoom: 13,
            bearing: bearingTarget,
            duration: 3000,
            essential: true
            });

            currentBearing = bearingTarget;

            if (phaseTimeout.current) clearTimeout(phaseTimeout.current);
            phaseTimeout.current = setTimeout(() => {
            runPhase1();
            }, 4000);
        };

        // ========== START ANIMATION IMMEDIATELY ==========
        if (isFirstRun.current) {
            isFirstRun.current = false;
            setTimeout(() => {
            runPhase1();
            }, 100);
        }
        });

        return () => {
        if (phaseTimeout.current) {
            clearTimeout(phaseTimeout.current);
        }
        if (map.current) {
            map.current.remove();
            map.current = null;
        }
        };
    }, []);

    // Pulse animation for markers
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
        @keyframes pulse-red-pin {
            0% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 30px rgba(239, 68, 68, 0.4)); }
            50% { transform: scale(1.1); filter: drop-shadow(0 0 20px rgba(239, 68, 68, 1)) drop-shadow(0 0 50px rgba(239, 68, 68, 0.6)); }
            100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 30px rgba(239, 68, 68, 0.4)); }
        }
        `;
        document.head.appendChild(style);
        return () => {
        document.head.removeChild(style);
        };
    }, []);

    return (
        <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ 
            minHeight: '100vh',
            pointerEvents: 'none',
            backgroundColor: '#0a0b0f',
            filter: 'brightness(0.4) saturate(0.3) contrast(1.2)'
        }}
        />
    );
    };

    export default StaticMap;