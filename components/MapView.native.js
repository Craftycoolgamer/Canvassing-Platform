import React from 'react';
import MapView, { Marker, Callout } from 'react-native-maps';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';

const STATUS_COLORS = {
  open: 'green',
  closed: 'red',
  pending: 'orange',
};

export default function NativeMapViewWrapper({
  markers = [],
  onMapPress = () => {},
  mapCenter = { latitude: 37.78825, longitude: -122.4324 },
  zoom = 15,
  style = { flex: 1 },
  onEdit = () => {},
  onDelete = () => {},
  onMarkerPress = () => {},
}) {
  const mapRef = React.useRef();
  const [region, setRegion] = React.useState({
    latitude: mapCenter.latitude,
    longitude: mapCenter.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  React.useEffect(() => {
    if (mapRef.current && mapCenter && mapCenter.latitude && mapCenter.longitude) {
      mapRef.current.animateToRegion({
        latitude: mapCenter.latitude,
        longitude: mapCenter.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    } else {
      setRegion({
        latitude: mapCenter.latitude,
        longitude: mapCenter.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [mapCenter]);

  return (
    <MapView
      ref={mapRef}
      style={style}
      region={region}
      onLongPress={e => onMapPress(e)}
    >
      {markers.map(marker => (
        <Marker
          key={marker.id + marker.status + marker.title}
          coordinate={marker.coordinate}
          pinColor={STATUS_COLORS[marker.status] || 'gray'}
          onPress={() => onMarkerPress(marker.id)}
        />
      ))}
    </MapView>
  );
} 