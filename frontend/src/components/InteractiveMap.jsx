import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { HAZARD_CATEGORY_COLORS, STATUS_COLORS, STREET_BARANGAY_MAP } from '../services/reportOptions';

const CATEGORY_COLORS = {
    ...HAZARD_CATEGORY_COLORS,
};

const STATUS_MARKER_COLORS = { Pending: '#eab308', 'In Progress': '#3b82f6', Resolved: '#10b981' };

const clusterStatusColor = (properties) => {
    const pending = Number(properties.pending_count || 0);
    const inProgress = Number(properties.in_progress_count || 0);
    const resolved = Number(properties.resolved_count || 0);
    if (pending >= inProgress && pending >= resolved) return STATUS_MARKER_COLORS.Pending;
    if (inProgress >= resolved) return STATUS_MARKER_COLORS['In Progress'];
    return STATUS_MARKER_COLORS.Resolved;
};

const createDangerIcon = (color, count, size) => {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 48 48');
    icon.setAttribute('width', String(size));
    icon.setAttribute('height', String(size));
    icon.setAttribute('aria-hidden', 'true');
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    triangle.setAttribute('d', 'M24 3 46 44H2L24 3Z');
    triangle.setAttribute('fill', color);
    triangle.setAttribute('stroke', '#ffffff');
    triangle.setAttribute('stroke-width', '2');
    triangle.setAttribute('stroke-linejoin', 'round');
    icon.appendChild(triangle);
    if (count) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', '24');
        label.setAttribute('y', '32');
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-family', 'Arial, sans-serif');
        label.setAttribute('font-size', count.length > 3 ? '12' : '15');
        label.setAttribute('font-weight', '700');
        label.setAttribute('fill', '#ffffff');
        label.textContent = count;
        icon.appendChild(label);
    } else {
        const mark = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        mark.setAttribute('d', 'M24 15v10m0 5v.1');
        mark.setAttribute('stroke', '#ffffff');
        mark.setAttribute('stroke-width', '3');
        mark.setAttribute('stroke-linecap', 'round');
        icon.appendChild(mark);
    }
    return icon;
};

const createClusterMarkerElement = (markerStyle, color, count) => {
    const size = Math.min(64, Math.max(42, 32 + String(count).length * 8));
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `${count} reports in cluster`);
    button.title = `${count} reports`;
    button.style.width = `${size}px`;
    button.style.height = `${size}px`;
    button.style.padding = '0';
    button.style.border = '0';
    button.style.background = 'transparent';
    button.style.cursor = 'pointer';
    button.style.display = 'grid';
    button.style.placeItems = 'center';
    button.style.filter = 'drop-shadow(0 2px 4px rgba(15,23,42,.45))';

    if (markerStyle === 'danger') {
        button.appendChild(createDangerIcon(color, String(count), size));
        return button;
    }

    const shape = document.createElement('span');
    shape.style.width = markerStyle === 'pin' ? `${Math.round(size * 0.76)}px` : `${size}px`;
    shape.style.height = markerStyle === 'pin' ? `${Math.round(size * 0.76)}px` : `${size}px`;
    shape.style.display = 'grid';
    shape.style.placeItems = 'center';
    shape.style.backgroundColor = color;
    shape.style.border = '2px solid #ffffff';
    shape.style.borderRadius = markerStyle === 'pin' ? '50% 50% 50% 0' : '50%';
    shape.style.transform = markerStyle === 'pin' ? 'translateY(-2px) rotate(-45deg)' : '';
    const label = document.createElement('span');
    label.textContent = String(count);
    label.style.color = '#ffffff';
    label.style.font = `700 ${String(count).length > 3 ? 10 : 13}px Arial, sans-serif`;
    label.style.lineHeight = '1';
    label.style.textShadow = '0 1px 2px rgba(15,23,42,.8)';
    label.style.transform = markerStyle === 'pin' ? 'rotate(45deg)' : '';
    shape.appendChild(label);
    button.appendChild(shape);
    return button;
};

const createReportPopupContent = (report) => {
    const content = document.createElement('div');
    content.className = 'p-2 max-w-xs';

    const appendText = (tag, className, value) => {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = value;
        content.appendChild(element);
    };

    const category = typeof report.category === 'string' ? report.category : report.category?.name;
    appendText('h3', 'font-bold text-gray-800', category || 'Uncategorized');
    appendText('p', 'text-sm font-semibold text-gray-700 mt-1', report.title || 'Hazard report');
    if (report.description) appendText('p', 'text-xs text-gray-600 mt-2 whitespace-pre-wrap break-words', report.description);
    appendText('p', 'text-xs text-gray-500 mt-2', `Status: ${report.status || 'Pending'}`);
    if (report.priority) appendText('p', 'text-xs text-gray-500 mt-1', `Priority: ${report.priority}`);
    if (report.createdAt) appendText('p', 'text-xs text-gray-400 mt-1', new Date(report.createdAt).toLocaleDateString());
    const coordinates = report.location?.coordinates || report.coordinates;
    const coordinateText = Array.isArray(coordinates) && coordinates.length === 2
        ? `${Number(coordinates[1]).toFixed(5)}, ${Number(coordinates[0]).toFixed(5)}`
        : '';
    const location = report.locationText || report.address || report.barangay || coordinateText || 'Location unavailable';
    appendText('p', 'text-xs text-gray-500 mt-1 break-words', `Location: ${location}`);

    return content;
};

const createRasterStyle = (mapStyle) => {
    const tiles = mapStyle === 'satellite'
        ? ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}']
        : mapStyle === 'terrain'
            ? ['https://tile.opentopomap.org/{z}/{x}/{y}.png']
            : ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'];
    const attribution = mapStyle === 'satellite'
        ? 'Tiles &copy; Esri'
        : mapStyle === 'terrain'
            ? 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
            : '&copy; OpenStreetMap Contributors';
    return {
        version: 8,
        sources: { osm: { type: 'raster', tiles, tileSize: 256, attribution } },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    };
};


const InteractiveMap = ({
    reports = [],
    onMapClick,
    selectedLocation,
    height = '500px',
    colorBy = 'category',
    showClickInstruction = false,
    showSelectedMarker = false,
    showHeatmap = false,
    flyTo = null,
    onBoundsChange,
    onReportSelect,
    mapPreferences = {},
    defaultCenter = [120.3333, 16.0433],
}) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);
    const selectedMarkerRef = useRef(null);
    const selectedLabelRef = useRef(null);
    const markerElementRef = useRef(null);
    const labelElementRef = useRef(null);
    const appliedMapStyleRef = useRef(mapPreferences.mapStyle || 'streets');
    const reportSelectCallbackRef = useRef(onReportSelect);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        reportSelectCallbackRef.current = onReportSelect;
    }, [onReportSelect]);

    const [lng] = useState(defaultCenter[0]);
    const [lat] = useState(defaultCenter[1]);
    const [zoom] = useState(mapPreferences.defaultZoom || 13);

    const reverseGeocode = async (lng, lat) => {
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );

            const data = response.data;

            if (data && data.display_name) {
                let address = data.display_name;

                address = address.replace(/, Philippines$/, '');
                address = address.replace(/^Dagupan, /, '');

                const normalizedAddress = address.toLowerCase();
                const mappedStreet = Object.entries(STREET_BARANGAY_MAP).find(([street]) => normalizedAddress.includes(street));
                const detectedBarangay = mappedStreet?.[1]
                    || data.address?.suburb || data.address?.village || data.address?.neighbourhood || data.address?.town || '';
                return {
                    address: detectedBarangay ? `${detectedBarangay}, Dagupan City, Pangasinan` : address,
                    barangay: detectedBarangay,
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
            style: createRasterStyle(mapPreferences.mapStyle || 'streets'),
            center: [lng, lat],
            zoom: zoom,
            minZoom: 1,
            maxZoom: 18,
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

    useEffect(() => {
        if (!map.current || !mapReady) return;
        const nextStyle = mapPreferences.mapStyle || 'streets';
        if (appliedMapStyleRef.current === nextStyle) return;
        appliedMapStyleRef.current = nextStyle;
        setMapReady(false);
        const markReady = () => setMapReady(true);
        map.current.once('style.load', markReady);
        map.current.setStyle(createRasterStyle(nextStyle));
    }, [mapReady, mapPreferences.mapStyle]);

    useEffect(() => {
        if (!map.current || !mapReady || !flyTo?.center) return;
        map.current.flyTo({
            center: flyTo.center,
            zoom: flyTo.zoom || 15,
            duration: 1500,
            essential: true
        });
    }, [flyTo, mapReady]);

    useEffect(() => {
        if (!map.current || !mapReady || !mapPreferences.defaultZoom) return;
        const targetZoom = Math.min(18, Math.max(1, Number(mapPreferences.defaultZoom) || 13));
        if (map.current.getZoom() !== targetZoom) map.current.easeTo({ zoom: targetZoom, duration: 350 });
    }, [mapReady, mapPreferences.defaultZoom]);

    useEffect(() => {
        if (!map.current || !mapReady || !onBoundsChange) return;
        const reportBounds = () => onBoundsChange(map.current.getBounds());
        map.current.on('moveend', reportBounds);
        reportBounds();
        return () => map.current?.off('moveend', reportBounds);
    }, [mapReady, onBoundsChange]);

    // Rebuild visible cluster/report markers after MapLibre finishes loading the current view.
    useEffect(() => {
        if (!map.current || !mapReady) return undefined;

        const sourceId = 'reports-clustered';
        const sourceLayerId = 'reports-cluster-source-loader';
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
        if (map.current.getLayer(sourceLayerId)) map.current.removeLayer(sourceLayerId);
        if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);
        if (showHeatmap) return undefined;

        const markerStyle = ['pin', 'circle', 'danger'].includes(mapPreferences.markerStyle)
            ? mapPreferences.markerStyle
            : 'circle';

        const features = reports.flatMap((report) => {
            const coordinates = report.location?.coordinates;
            if (!Array.isArray(coordinates) || coordinates.length !== 2) return [];
            let [longitude, latitude] = coordinates.map(Number);
            if (Math.abs(longitude) <= 90 && Math.abs(latitude) > 90) [longitude, latitude] = [latitude, longitude];
            if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return [];
            return [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [longitude, latitude] },
                properties: {
                    id: String(report._id || report.id || ''),
                    status: report.status || 'Pending',
                    priority: report.priority || '',
                    category: report.category || 'Hazard',
                    title: report.title || 'Hazard report',
                    description: report.description || '',
                    address: report.address || '',
                    barangay: report.barangay || '',
                    locationText: report.address || report.barangay || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
                    createdAt: report.createdAt || '',
                },
            }];
        });

        map.current.addSource(sourceId, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 48,
            clusterProperties: {
                pending_count: ['+', ['case', ['==', ['get', 'status'], 'Pending'], 1, 0]],
                in_progress_count: ['+', ['case', ['==', ['get', 'status'], 'In Progress'], 1, 0]],
                resolved_count: ['+', ['case', ['==', ['get', 'status'], 'Resolved'], 1, 0]],
            },
        });
        map.current.addLayer({
            id: sourceLayerId,
            type: 'circle',
            source: sourceId,
            paint: { 'circle-radius': 1, 'circle-opacity': 0 },
        });
        const renderVisibleMarkers = () => {
            if (!map.current?.getSource(sourceId) || !map.current.isSourceLoaded(sourceId)) return;
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];
            const source = map.current.getSource(sourceId);
            const seen = new Set();
            const sourceFeatures = map.current.querySourceFeatures(sourceId);

            sourceFeatures.forEach((feature) => {
                const properties = feature.properties || {};
                const isCluster = Number(properties.point_count) > 0;
                const key = isCluster ? `cluster:${properties.cluster_id}` : `report:${properties.id}`;
                if (seen.has(key)) return;
                seen.add(key);
                const coordinates = feature.geometry?.coordinates;
                if (!Array.isArray(coordinates) || coordinates.length < 2) return;
                const [longitude, latitude] = coordinates;
                const markerColor = isCluster
                    ? clusterStatusColor(properties)
                    : STATUS_MARKER_COLORS[properties.status] || '#6b7280';
                const element = isCluster
                    ? createClusterMarkerElement(markerStyle, markerColor, properties.point_count)
                    : document.createElement('button');

                if (!isCluster) {
                    element.type = 'button';
                    element.setAttribute('aria-label', `${properties.status || 'Pending'} hazard: ${properties.title || 'Report'}`);
                    element.title = properties.title || 'Hazard report';
                    element.style.width = '20px';
                    element.style.height = '20px';
                    element.style.padding = '0';
                    element.style.border = '0';
                    element.style.background = 'transparent';
                    element.style.cursor = 'pointer';
                    element.style.display = 'grid';
                    element.style.placeItems = 'center';
                    element.style.filter = 'drop-shadow(0 2px 3px rgba(15,23,42,.4))';

                    if (markerStyle === 'danger') {
                        element.appendChild(createDangerIcon(markerColor, '', 26));
                    } else {
                        const visual = document.createElement('span');
                        visual.style.width = markerStyle === 'pin' ? '16px' : '20px';
                        visual.style.height = markerStyle === 'pin' ? '16px' : '20px';
                        visual.style.borderRadius = markerStyle === 'pin' ? '50% 50% 50% 0' : '50%';
                        visual.style.transform = markerStyle === 'pin' ? 'translateY(-2px) rotate(-45deg)' : '';
                        visual.style.backgroundColor = markerColor;
                        visual.style.border = '2px solid #ffffff';
                        element.appendChild(visual);
                    }
                    element.addEventListener('click', () => reportSelectCallbackRef.current?.({
                        _id: properties.id,
                        title: properties.title,
                        category: properties.category,
                        description: properties.description,
                        status: properties.status,
                        priority: properties.priority,
                        address: properties.address,
                        barangay: properties.barangay,
                        locationText: properties.locationText,
                        createdAt: properties.createdAt,
                        coordinates: [longitude, latitude],
                    }));
                } else {
                    element.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        source.getClusterExpansionZoom(properties.cluster_id, (error, expansionZoom) => {
                            if (!error && map.current) map.current.easeTo({ center: [longitude, latitude], zoom: expansionZoom });
                        });
                    });
                }

                const marker = new maplibregl.Marker({ element, anchor: 'center' })
                    .setLngLat([longitude, latitude]);
                if (!isCluster) marker.setPopup(new maplibregl.Popup({ offset: 12, closeButton: true }).setDOMContent(createReportPopupContent(properties)));
                marker.addTo(map.current);
                markersRef.current.push(marker);
            });
        };

        map.current.on('idle', renderVisibleMarkers);
        renderVisibleMarkers();
        return () => {
            map.current?.off('idle', renderVisibleMarkers);
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];
            if (map.current?.getLayer(sourceLayerId)) map.current.removeLayer(sourceLayerId);
            if (map.current?.getSource(sourceId)) map.current.removeSource(sourceId);
        };
    }, [mapReady, mapPreferences.markerStyle, reports, showHeatmap]);

    useEffect(() => {
        if (!map.current || !mapReady) return;
        const features = reports.filter((report) => Array.isArray(report.location?.coordinates) && report.location.coordinates.length === 2 && report.location.coordinates.every((value) => typeof value === 'number' && !Number.isNaN(value))).map((report) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: report.location.coordinates }, properties: { weight: { Urgent: 1, High: 0.75, Medium: 0.5, Low: 0.25 }[report.priority] || 0.5 } }));
        const data = { type: 'FeatureCollection', features };
        if (!map.current.getSource('reports-heat')) map.current.addSource('reports-heat', { type: 'geojson', data });
        else map.current.getSource('reports-heat').setData(data);
        if (!map.current.getLayer('reports-heatmap')) map.current.addLayer({ id: 'reports-heatmap', type: 'heatmap', source: 'reports-heat', layout: { visibility: showHeatmap ? 'visible' : 'none' }, paint: { 'heatmap-weight': ['get', 'weight'], 'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 14, 2.5], 'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 14, 32], 'heatmap-opacity': 0.85, 'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', 0.2, '#3b82f6', 0.5, '#22c55e', 0.75, '#f59e0b', 1, '#ef4444'] } });
        else map.current.setLayoutProperty('reports-heatmap', 'visibility', showHeatmap ? 'visible' : 'none');
    }, [mapReady, reports, showHeatmap]);

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