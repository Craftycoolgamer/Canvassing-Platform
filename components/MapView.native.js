import React from 'react';
import MapView, { Marker, Callout } from 'react-native-maps';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { STATUS_COLORS } from '../constants/StatusColors';

export default function NativeMapViewWrapper({
  markers = [],
  onMapPress = () => {},
  mapCenter = { latitude: 37.78825, longitude: -122.4324 },
  zoom = 15,
  style = { flex: 1 },
  onEdit = () => {},
  onDelete = () => {},
  onMarkerPress = () => {},
  onZoomChange = () => {},
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
        marker.isCluster ? (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            tracksViewChanges={false}
            onPress={() => onMarkerPress(marker.id)}
          >
            <View style={{
              backgroundColor: STATUS_COLORS[marker.status] || 'gray',
              borderRadius: 24,
              width: 48,
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 3,
              borderColor: '#fff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{marker.count}</Text>
            </View>
          </Marker>
        ) : (
          <Marker
            key={marker.id + marker.status + marker.title}
            coordinate={marker.coordinate}
            pinColor={STATUS_COLORS[marker.status] || 'gray'}
            onPress={() => onMarkerPress(marker.id)}
          />
        )
      ))}
    </MapView>
  );
} 