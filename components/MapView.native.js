// MapView.native.js
// react-native-leaflet-view implementation for OSM map in React Native
import React, { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, View, Linking } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { LeafletView } from 'react-native-leaflet-view';
import { STATUS_COLORS } from '../constants/StatusColors';

const DEFAULT_LOCATION = { latitude: 37.78825, longitude: -122.4324 };

export default function NativeMapViewWrapper({
  markers = [],
  onMapPress = () => {},
  mapCenter = DEFAULT_LOCATION,
  zoom = 15,
  style = { flex: 1 },
  onEdit = () => {},
  onDelete = () => {},
  onMarkerPress = () => {},
  onZoomChange = () => {},
}) {
  const [webViewContent, setWebViewContent] = useState(null);

  // Load the leaflet.html asset as required by react-native-leaflet-view
  useEffect(() => {
    let isMounted = true;
    const loadHtml = async () => {
      try {
        const path = require('../assets/leaflet.html');
        const asset = Asset.fromModule(path);
        await asset.downloadAsync();
        const htmlContent = await FileSystem.readAsStringAsync(asset.localUri);
        if (isMounted) setWebViewContent(htmlContent);
      } catch (error) {
        Alert.alert('Error loading HTML', JSON.stringify(error));
      }
    };
    loadHtml();
    return () => { isMounted = false; };
  }, []);

  // Convert markers to LeafletView format, using custom icon if provided
  let leafletMarkers = [];
  try {
    leafletMarkers = markers.map(marker => {
      // Defensive: skip if missing required fields
      if (!marker || !marker.id || !marker.coordinate || typeof marker.coordinate.latitude !== 'number' || typeof marker.coordinate.longitude !== 'number') {
        console.warn('Skipping invalid marker:', marker);
        return null;
      }
      let iconHtml = '';
      if (marker.icon) {
        // If icon is a base64 SVG or image, render as <img>
        if (marker.icon.startsWith('data:image/svg+xml;base64,') || marker.icon.startsWith('data:image/png;base64,') || marker.icon.startsWith('data:image/jpeg;base64,')) {
          iconHtml = `<img src='${marker.icon}' style='width:24px;height:24px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.2);background:#fff;' />`;
        } else {
          // Otherwise, treat as emoji or HTML string
          iconHtml = `<div style='font-size:24px;line-height:24px;'>${marker.icon}</div>`;
        }
      } else if (marker.isCluster) {
        iconHtml = `<div style='background:
        ${STATUS_COLORS[marker.status] || 'gray'};
        border-radius:24px;width:48px;height:48px;
        display:flex;align-items:center;
        justify-content:center;border:3px solid #fff;
        box-shadow:0 2px 4px rgba(0,0,0,0.2);'>
        <span style='color:#fff;font-weight:bold;font-size:18px;'>${marker.count}</span>
        </div>`;
    } else {
        iconHtml = `<div style='background:${STATUS_COLORS[marker.status] || 'gray'};border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.2);'></div>`;
      }
      return {
        id: marker.id,
        position: {
          lat: marker.coordinate.latitude,
          lng: marker.coordinate.longitude,
        },
        icon: iconHtml,
        size: marker.isCluster ? [48, 48] : [24, 24],
        title: marker.title || '',
      };
    }).filter(Boolean);
  } catch (err) {
    console.error('Error mapping markers for LeafletView:', err);
    leafletMarkers = [];
  }

  // OSM tile layer
  const mapLayers = [
    {
      baseLayerName: 'OpenStreetMap',
      baseLayerIsChecked: true,
      layerType: 'TileLayer',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: ' <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ',
    },
  ];

  // Enhanced event handler to support both default and custom events
  const handleMessage = useCallback((event) => {
    // Defensive: parse event if string
    let evt = event;
    if (typeof event === 'string') {
      try { evt = JSON.parse(event); } catch (e) { return; }
    }
    
    // Ignore move events to reduce console noise
    if (evt.event === 'onMoveStart' || evt.event === 'onMoveEnd') {
      return;
    }
    
    // Marker click: support both default and custom payloads
    if (evt.event === 'onMapMarkerClicked') {
      const markerId = (evt.payload && (evt.payload.id || evt.payload.mapMarkerID));
      if (markerId) {
        onMarkerPress(markerId);
      }
    }
    // Map click/long-press: support both default and custom payloads
    else if (evt.event === 'onMapClicked') {
      let lat, lng;
      if (evt.payload) {
        if (evt.payload.coords && Array.isArray(evt.payload.coords)) {
          lat = evt.payload.coords[0];
          lng = evt.payload.coords[1];
        } else if (evt.payload.touchLatLng) {
          lat = evt.payload.touchLatLng.lat;
          lng = evt.payload.touchLatLng.lng;
        }
      }
      if (lat && lng) {
        onMapPress({
          nativeEvent: {
            coordinate: {
              latitude: lat,
              longitude: lng,
            },
          },
        });
      }
    }
    // Attribution link click
    else if (evt.event === 'onAttributionClicked') {
      const { href, text } = evt.payload || {};
      Alert.alert(
        'OpenStreetMap Attribution',
        `This map uses data from ${text || 'OpenStreetMap'}. What would you like to do?`,
        [
          { text: 'Stay in App', style: 'cancel' },
          { 
            text: 'Open in Browser', 
            onPress: async () => {
              try {
                if (href) {
                  await Linking.openURL(href);
                }
              } catch (error) {
                console.error('Error opening URL:', error);
                Alert.alert('Error', 'Could not open the link in browser.');
              }
            }
          }
        ]
      );
    }
    // Zoom change (if supported)
    else if (evt.event === 'onZoomLevelsChange') {
      if (evt.zoom) {
        onZoomChange(evt.zoom);
      }
    }
  }, [onMapPress, onMarkerPress, onZoomChange]);

  // Suppress console logs for move events at React Native level
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      const message = args.join(' ');
      if (message.includes('received') && (message.includes('onMoveStart') || message.includes('onMoveEnd'))) {
        return; // Suppress move event logs
      }
      originalConsoleLog.apply(console, args);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  if (!webViewContent) {
    // Show a loading indicator while the HTML is loading
    return (
      <View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, style]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={style}>
      <LeafletView
        source={{ html: webViewContent }}
        mapCenterPosition={{
          lat: mapCenter.latitude,
          lng: mapCenter.longitude,
        }}
        zoom={zoom}
        mapLayers={mapLayers}
        mapMarkers={leafletMarkers}
        onMessageReceived={handleMessage}
        zoomControl={true}
        attributionControl={true}
        style={{ flex: 1 }}
        // Disable move event logging by not handling them
        onMapMoveStart={() => {}}
        onMapMoveEnd={() => {}}
        // Try to disable move events entirely
        onMapMove={() => {}}
        injectedJavaScript={`
          // --- Custom JS for marker and map events (robust version) ---
          function attachMarkerHandlers() {
            map.eachLayer(function(layer) {
              if (layer instanceof L.Marker) {
                layer.off('click');
                layer.on('click', function(e) {
                  // Try to get marker id from options.id, then options.title
                  var markerId = layer.options.id || layer.options.title || undefined;
                  if (markerId) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      event: 'onMapMarkerClicked',
                      payload: { id: markerId }
                    }));
                  }
                });
                // Prevent long-press on marker from triggering map long-press
                layer.on('mousedown', function(e) { if (e.originalEvent) e.originalEvent._onMarker = true; });
                layer.on('touchstart', function(e) { if (e.originalEvent) e.originalEvent._onMarker = true; });
              }
            });
          }
          // Attach marker handlers after map loads and after each marker update
          setTimeout(attachMarkerHandlers, 500);
          map.on('layeradd', attachMarkerHandlers);
          map.on('layerremove', attachMarkerHandlers);

          // --- Long-press detection for map (not markers) ---
          let pressTimer;
          function handleMapMouseDown(e) {
            // Only trigger if not on a marker
            if (e.originalEvent && e.originalEvent._onMarker) return;
            pressTimer = setTimeout(() => {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                event: 'onMapClicked',
                payload: { coords: [e.latlng.lat, e.latlng.lng], type: 'long' }
              }));
            }, 600);
          }
          function handleMapMouseUp(e) {
            clearTimeout(pressTimer);
          }
          map.on('mousedown', handleMapMouseDown);
          map.on('mouseup', handleMapMouseUp);
          map.on('mouseout', handleMapMouseUp);
          map.on('touchstart', handleMapMouseDown);
          map.on('touchend', handleMapMouseUp);

          // --- Attribution link interception ---
          function interceptAttributionLinks() {
            // Find attribution control and modify its links
            setTimeout(function() {
              var attributionControl = document.querySelector('.leaflet-control-attribution');
              if (attributionControl) {
                var links = attributionControl.querySelectorAll('a');
                links.forEach(function(link) {
                  link.addEventListener('click', function(e) {
                    e.preventDefault();
                    // Send message to React Native to handle the attribution click
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      event: 'onAttributionClicked',
                      payload: { 
                        href: link.href,
                        text: link.textContent || link.innerText
                      }
                    }));
                  });
                });
              }
            }, 1000); // Wait for attribution control to be rendered
          }
          
          // Call interception function after map loads
          map.whenReady(function() {
            interceptAttributionLinks();
          });
          
          // Also try to intercept when attribution control is added
          var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(function(node) {
                  if (node.classList && node.classList.contains('leaflet-control-attribution')) {
                    interceptAttributionLinks();
                  }
                });
              }
            });
          });
          
          // Start observing the document body for changes
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
        `}
      />
            </View>
  );
} 