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

// Helper to create a cluster icon
function createClusterIcon(color, count) {
  return L.divIcon({
    html: `<div style="
      background: ${color};
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-size: 18px;
      font-weight: bold;
      color: #fff;">
      ${count}
    </div>`,
    className: '',
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
}

// Helper to create a custom SVG icon from base64, with dynamic color replacement
function createCustomSvgIcon(svgBase64, color) {
  let svgXml = atob(svgBase64);

  // Replace fill attributes (single or double quotes)
  svgXml = svgXml.replace(/fill=(["'])(#[A-Fa-f0-9]{3,6}|[a-zA-Z]+)\1/gi, `fill="${color}"`);

  // Replace fill in style attributes (e.g., style="fill:#000;")
  svgXml = svgXml.replace(/fill:\s*(#[A-Fa-f0-9]{3,6}|[a-zA-Z]+);?/gi, `fill:${color};`);

  // Replace fill in <style> tags (CSS)
  svgXml = svgXml.replace(/fill:\s*(#[A-Fa-f0-9]{3,6}|[a-zA-Z]+)\s*;/gi, `fill:${color};`);

  // Replace any remaining black fills (just in case)
  svgXml = svgXml.replace(/fill=(["'])(#000|#000000|black)\1/gi, `fill="${color}"`);

  // If there is no fill attribute at all, add one to the first <path>, <circle>, or <rect>
  if (!/fill=/.test(svgXml)) {
    svgXml = svgXml.replace(/<(path|circle|rect)(\s|>)/i, `<$1 fill="${color}"$2`);
  }

  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svgXml)}`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

// Simple component to handle map view changes
function MapController({ flyToPin }) {
  const map = useMap();

  // Animate to pin when flyToPin changes
  useEffect(() => {
    if (map && flyToPin && flyToPin.latitude && flyToPin.longitude) {
      map.flyTo(
        [flyToPin.latitude, flyToPin.longitude],
        flyToPin.zoom !== undefined ? flyToPin.zoom : map.getZoom(),
        {
          duration: 1.5,
          easeLinearity: 0.25,
        }
      );
    }
  }, [map, flyToPin]);

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
  onZoomChange = () => {},
  flyToPin = null,
  onPinAdded = () => {},
}) {
  // Remove clickedPin state
  // const [clickedPin, setClickedPin] = useState(null);
  
  const handleMarkerClick = (markerId) => {
    // Remove setClickedPin logic
    onMarkerPress(markerId);
  };

  function MapEvents() {
    const map = useMap();
    
    useMapEvents({
      click(e) {
        // Immediately animate to the new pin location from the current map view
        map.flyTo([e.latlng.lat, e.latlng.lng], map.getZoom(), {
          duration: 1.5,
          easeLinearity: 0.25,
        });
        // After starting the animation, call onPinAdded to update state
        if (onPinAdded) {
          onPinAdded({ latitude: e.latlng.lat, longitude: e.latlng.lng });
        }
        // Call onMapPress for legacy
        onMapPress({
          nativeEvent: {
            coordinate: {
              latitude: e.latlng.lat,
              longitude: e.latlng.lng,
            },
          },
        });
      },
      zoomend() {
        // Only update clustering zoom, don't interfere with map behavior
        if (onZoomChange) {
          onZoomChange(map.getZoom());
        }
      },
    });
    return null;
  }
  
  const iconKey = markers.map(m => m.customPinIcon ? m.customPinIcon.slice(0, 8) : '').join(',');

  // Store the initial center in a ref so it doesn't change on re-renders
  const initialCenterRef = useRef([mapCenter.latitude, mapCenter.longitude]);
  const [mapMounted, setMapMounted] = useState(false);
  useEffect(() => {
    setMapMounted(true);
  }, []);

  // Add: Patch Leaflet attribution link to open in new tab
  useEffect(() => {
    // Wait for the map and attribution control to be rendered
    const interval = setInterval(() => {
      const attribution = document.querySelector('.leaflet-control-attribution');
      if (attribution) {
        const links = attribution.querySelectorAll('a');
        links.forEach(link => {
          if (link.href && link.href.includes('leafletjs.com')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener');
          }
        });
        clearInterval(interval);
      }
    }, 300);
    // Clean up
    return () => clearInterval(interval);
  }, []);

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
        {...(!mapMounted && { center: initialCenterRef.current })}
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
          attribution= ' <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> '
          maxZoom={19}
          minZoom={3}
        />
        <MapController flyToPin={flyToPin} />
        {markers.map(marker => (
          marker.isCluster ? (
            <Marker
              key={marker.id}
              position={[marker.coordinate.latitude, marker.coordinate.longitude]}
              icon={createClusterIcon(STATUS_COLORS[marker.status] || '#6c757d', marker.count)}
              eventHandlers={{
                click: () => handleMarkerClick(marker.id),
              }}
            />
          ) : (
            <Marker
              key={marker.id + (marker.customPinIcon ? marker.customPinIcon.slice(0, 8) : '')}
              position={[marker.coordinate.latitude, marker.coordinate.longitude]}
              icon={
                marker.customPinIcon
                  ? createCustomSvgIcon(marker.customPinIcon, STATUS_COLORS[marker.status] || '#6c757d')
                  : createColoredIcon(STATUS_COLORS[marker.status] || '#6c757d')
              }
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
          )
        ))}
        <MapEvents />
      </MapContainer>
    </div>
  );
} 