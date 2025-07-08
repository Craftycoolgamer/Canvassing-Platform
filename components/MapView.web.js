import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { STATUS_COLORS } from '../constants/StatusColors';

// Helper to create a colored SVG marker icon
function createColoredIcon(color) {
  return new L.Icon({
    iconUrl: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='48' viewBox='0 0 32 48'><path d='M16 0C7.163 0 0 7.163 0 16c0 11.046 16 32 16 32s16-20.954 16-32C32 7.163 24.837 0 16 0z' fill='${encodeURIComponent(color)}'/><circle cx='16' cy='16' r='7' fill='white'/></svg>` ,
    iconSize: [32, 48],
    iconAnchor: [16, 48],
    popupAnchor: [0, -40],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [13, 41],
  });
}

// Component to handle map animations
function MapAnimator({ mapCenter, animateToPin }) {
  const map = useMap();
  const prevCenterRef = useRef(null);
  
  useEffect(() => {
    if (map && mapCenter && mapCenter.latitude && mapCenter.longitude) {
      const currentCenter = [mapCenter.latitude, mapCenter.longitude];
      const prevCenter = prevCenterRef.current;
      
      // Only animate if we have a previous center and it's different from current
      if (prevCenter && (prevCenter[0] !== currentCenter[0] || prevCenter[1] !== currentCenter[1])) {
        map.flyTo(currentCenter, map.getZoom(), {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
      
      // Update the previous center reference
      prevCenterRef.current = currentCenter;
    }
  }, [map, mapCenter]);

  // Handle pin click animation
  useEffect(() => {
    if (map && animateToPin && animateToPin.latitude && animateToPin.longitude) {
      map.flyTo([animateToPin.latitude, animateToPin.longitude], map.getZoom(), {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [map, animateToPin]);
  
  return null;
}

export default function WebMapViewWrapper({
  markers = [],
  onMapPress = () => {},
  mapCenter = { latitude: 37.78825, longitude: -122.4324 },
  zoom = 15,
  style = { flex: 1 },
  onEdit = () => {},
  onDelete = () => {},
  onMarkerPress = () => {},
}) {
  const [clickedPin, setClickedPin] = useState(null);

  const handleMarkerClick = (markerId) => {
    const marker = markers.find(m => m.id === markerId);
    if (marker) {
      setClickedPin(marker.coordinate);
      // Clear the clicked pin after a short delay to allow for future clicks
      setTimeout(() => setClickedPin(null), 100);
    }
    onMarkerPress(markerId);
  };

  function MapEvents() {
    useMapEvents({
      click(e) {
        onMapPress({
          nativeEvent: {
            coordinate: {
              latitude: e.latlng.lat,
              longitude: e.latlng.lng,
            },
          },
        });
      },
    });
    return null;
  }
  
  return (
    <div style={{ width: '100%', height: '100%', ...style }}>
      <MapContainer
        center={[mapCenter.latitude, mapCenter.longitude]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <MapAnimator mapCenter={mapCenter} animateToPin={clickedPin} />
        {markers.map(marker => (
          <Marker
            key={marker.id}
            position={[marker.coordinate.latitude, marker.coordinate.longitude]}
            icon={createColoredIcon(STATUS_COLORS[marker.status] || 'gray')}
            eventHandlers={{
              click: () => handleMarkerClick(marker.id),
            }}
          />
        ))}
        <MapEvents />
      </MapContainer>
    </div>
  );
} 