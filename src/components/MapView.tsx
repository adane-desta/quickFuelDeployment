import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station } from '../../types';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapViewProps {
  stations: Station[];
  userLocation: { lat: number; lng: number } | null;
  onReserve: (station: Station) => void;
}

export function MapView({ stations, userLocation, onReserve }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current && userLocation) {
      const map = L.map('map').setView([userLocation.lat, userLocation.lng], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
    }
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [userLocation]);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: L.divIcon({
        className: 'custom-user-marker',
        html: '<div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>',
        iconSize: [16, 16],
        popupAnchor: [0, -8],
      }),
    }).addTo(mapRef.current);
    userMarker.bindPopup('Your location');
    markersRef.current.push(userMarker);

    stations.forEach(station => {
      const hasFuel = station.availableFuels && station.availableFuels.length > 0;
      const popupContent = `
        <div class="p-2 min-w-[220px]">
          <h3 class="font-bold text-gray-900">${station?.name}</h3>
          <p class="text-sm text-gray-600">${station.address || 'Address not available'}</p>
          <p class="text-sm text-gray-600 mt-1">Distance: ${station.distance ? station.distance.toFixed(1) : '?'} km</p>
          <p class="text-sm text-gray-600">Travel time: ~${station.travelTime || '?'} min</p>
          <div class="flex flex-wrap gap-1 mt-2">
            ${station.availableFuels?.map(fuel => `<span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">${fuel}</span>`).join('') || '<span class="text-xs text-gray-500">No fuel available</span>'}
          </div>
          <button class="mt-3 w-full bg-blue-600 text-white py-1 rounded-md text-sm ${!hasFuel ? 'opacity-50 cursor-not-allowed' : ''}" data-station-id="${station.id}" ${!hasFuel ? 'disabled' : ''}>Reserve Fuel</button>
        </div>
      `;
      const marker = L.marker([station.latitude, station.longitude]).addTo(mapRef.current!);
      marker.bindPopup(popupContent);
      // Use popupopen event to attach click handler
      marker.on('popupopen', () => {
        // Wait a moment for the popup DOM to be fully rendered
        setTimeout(() => {
          const popupNode = marker.getPopup()?.getElement();
          if (popupNode && hasFuel) {
            const btn = popupNode.querySelector('button');
            if (btn) {
              btn.onclick = () => onReserve(station);
            }
          }
        }, 50);
      });
      markersRef.current.push(marker);
    });

    if (stations.length > 0) {
      const bounds = L.latLngBounds([userLocation.lat, userLocation.lng]);
      stations.forEach(s => bounds.extend([s.latitude, s.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stations, userLocation, onReserve]);

  return <div id="map" className="w-full h-full relative z-0" />;
}