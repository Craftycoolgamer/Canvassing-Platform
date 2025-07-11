import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { STATUS_COLORS } from '../constants/StatusColors';

// Helper to create a colored SVG marker icon with modern design
function createColoredIcon(color) {
  const svgContent = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='48' viewBox='0 0 32 48'>
    <defs>
      <filter id='shadow' x='-50%' y='-50%' width='200%' height='200%'>
        <feDropShadow dx='0' dy='2' stdDeviation='2' flood-color='rgba(0,0,0,0.3)'/>
      </filter>
    </defs>
    <path d='M16 0C7.2 0 0 7.2 0 16c0 9.6 16 32 16 32s16-22.4 16-32C32 7.2 24.8 0 16 0z' fill='${color}' filter='url(#shadow)'/>
    <circle cx='16' cy='16' r='6' fill='white' opacity='0.9'/>
    <circle cx='16' cy='16' r='3' fill='${color}'/>
  </svg>`;
  
  const shadowContent = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='16' viewBox='0 0 32 16'>
    <ellipse cx='16' cy='8' rx='12' ry='6' fill='rgba(0,0,0,0.2)'/>
  </svg>`;
  
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgContent)}`,
    iconSize: [32, 48],
    iconAnchor: [16, 48], // Center horizontally, bottom vertically
    popupAnchor: [0, -48], // Popup appears above the pin
    shadowUrl: `data:image/svg+xml;base64,${btoa(shadowContent)}`,
    shadowSize: [32, 16],
    shadowAnchor: [16, 8],
  });
}

// Simple component to handle map view changes
function MapController({ center, zoom, clickedPin }) {
  const map = useMap();
  const isInitialMount = useRef(true);
  
  // Handle initial mount separately to set the starting position without animation
  useEffect(() => {
    if (isInitialMount.current && map && center && center.latitude && center.longitude) {
      // On initial mount, set view immediately without animation
      map.setView([center.latitude, center.longitude], zoom);
      isInitialMount.current = false;
    }
  }, [map]);
  
  // Handle center and zoom changes after initial mount
  useEffect(() => {
    if (!isInitialMount.current && map && center && center.latitude && center.longitude) {
      // Use flyTo with a smooth animation from current position
      map.flyTo([center.latitude, center.longitude], zoom, {
        duration: 1.5, // Duration in seconds
        easeLinearity: 0.25 // Lower value for smoother acceleration/deceleration
      });
    }
  }, [map, center, zoom]);
  
  // Handle pin clicks
  useEffect(() => {
    if (map && clickedPin && clickedPin.latitude && clickedPin.longitude) {
      // Use flyTo with a smooth animation from current position
      map.flyTo([clickedPin.latitude, clickedPin.longitude], 18, {
        duration: 1.5, // Duration in seconds
        easeLinearity: 0.25 // Lower value for smoother acceleration/deceleration
      });
    }
  }, [map, clickedPin]);
  
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
    <div style={{ 
      width: '100%', 
      height: '100%', 
      ...style,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <MapContainer
        center={[mapCenter.latitude, mapCenter.longitude]}
        zoom={zoom}
        style={{ 
          width: '100%', 
          height: '100%',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
        keyboard={true}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
          maxZoom={19}
          minZoom={3}
        />
        <MapController center={mapCenter} zoom={zoom} clickedPin={clickedPin} />
        {markers.map(marker => (
          <Marker
            key={marker.id}
            position={[marker.coordinate.latitude, marker.coordinate.longitude]}
            icon={createColoredIcon(STATUS_COLORS[marker.status] || '#6c757d')}
            eventHandlers={{
              click: () => handleMarkerClick(marker.id),
            }}
          >
            <Popup
              className="custom-popup"
              style={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                padding: '0',
                margin: '0',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}
            >
              <div style={{
                padding: '12px 16px',
                minWidth: '200px',
                backgroundColor: '#fff',
                borderRadius: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    margin: '0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    {marker.title}
                  </h3>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#fff',
                    backgroundColor: STATUS_COLORS[marker.status] || '#6c757d',
                    textTransform: 'capitalize'
                  }}>
                    {marker.status}
                  </span>
                </div>
                <p style={{
                  margin: '0',
                  fontSize: '14px',
                  color: '#6c757d',
                  fontFamily: 'Menlo, Monaco, monospace'
                }}>
                  {marker.coordinate.latitude.toFixed(5)}, {marker.coordinate.longitude.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
        <MapEvents />
      </MapContainer>
    </div>
  );
} 