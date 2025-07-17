import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal, Pressable, Alert, StyleSheet, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { STATUS_COLORS } from '../constants/StatusColors';
import MapView from '../components/MapView';
import { formatPhoneNumber } from '../utils/validation';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

// Helper to check if a value is non-empty (string, array, etc.)
function hasValue(val) {
  if (Array.isArray(val)) return val.length > 0;
  return val !== undefined && val !== null && String(val).trim() !== '';
}

// Helper: Calculate distance between two lat/lng points (Haversine formula, in meters)
function getDistance(lat1, lng1, lat2, lng2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Cluster businesses by proximity based on zoom
function clusterBusinesses(businesses, zoom) {
  // The higher the zoom, the smaller the cluster radius
  // At zoom 18+, show all pins individually
  if (zoom >= 18) {
    return businesses.map(b => ({ businesses: [b], latlng: b.latlng, status: b.status }));
  }
  // Cluster radius in meters (tweak as needed)
  const clusterRadius = 1000 / Math.pow(2, zoom - 10); // e.g. ~1000m at zoom 10, ~250m at zoom 12
  const clusters = [];
  const used = new Set();
  for (let i = 0; i < businesses.length; i++) {
    if (used.has(businesses[i].id)) continue;
    const group = [businesses[i]];
    used.add(businesses[i].id);
    for (let j = i + 1; j < businesses.length; j++) {
      if (used.has(businesses[j].id)) continue;
      const d = getDistance(
        businesses[i].latlng.latitude,
        businesses[i].latlng.longitude,
        businesses[j].latlng.latitude,
        businesses[j].latlng.longitude
      );
      if (d < clusterRadius) {
        group.push(businesses[j]);
        used.add(businesses[j].id);
      }
    }
    // Calculate cluster center
    const avgLat = group.reduce((sum, b) => sum + b.latlng.latitude, 0) / group.length;
    const avgLng = group.reduce((sum, b) => sum + b.latlng.longitude, 0) / group.length;
    // Find the most common status in the group
    const statusCounts = {};
    group.forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
          });
      const mostCommonStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0][0];
      clusters.push({ businesses: group, latlng: { latitude: avgLat, longitude: avgLng }, status: mostCommonStatus });
  }
  return clusters;
}

export default function MapScreen() {
  const { companies, selectedCompany, setSelectedCompany, businesses, setBusinesses } = useAppContext();
  const [addingPin, setAddingPin] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const [editBusinessId, setEditBusinessId] = useState(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [mapCenter, setMapCenter] = useState({ latitude: 37.78825, longitude: -122.4324 });
  const [mapZoom, setMapZoom] = useState(17);
  const [clusteringZoom, setClusteringZoom] = useState(17); // Separate zoom for clustering
  const [mapKey, setMapKey] = useState(0);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [flyToPin, setFlyToPin] = useState(null);

  // Handle zoom changes from MapView (for clustering only)
  const handleZoomChange = (newZoom) => {
    // Only update clustering zoom, don't interfere with map centering
    setClusteringZoom(newZoom);
  };

  // Handle cluster click - zoom to fit all pins in cluster
  const handleClusterClick = (clusterId) => {
    const cluster = clusters.find(c => c.id === clusterId || `cluster-${c.businesses.map(b => b.id).join('-')}` === clusterId);
    if (cluster && cluster.businesses.length > 1) {
      // Calculate bounds to fit all pins in the cluster
      const lats = cluster.businesses.map(b => b.latlng.latitude);
      const lngs = cluster.businesses.map(b => b.latlng.longitude);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      // Add padding to the bounds (10% on each side)
      const latPadding = (maxLat - minLat) * 0.1;
      const lngPadding = (maxLng - minLng) * 0.1;
      
      // Find the center of the densest area (where most pins are)
      // Group pins by proximity and find the largest group
      const pinGroups = [];
      const usedPins = new Set();
      
      for (let i = 0; i < cluster.businesses.length; i++) {
        if (usedPins.has(i)) continue;
        
        const group = [cluster.businesses[i]];
        usedPins.add(i);
        
        for (let j = i + 1; j < cluster.businesses.length; j++) {
          if (usedPins.has(j)) continue;
          
          const distance = getDistance(
            cluster.businesses[i].latlng.latitude,
            cluster.businesses[i].latlng.longitude,
            cluster.businesses[j].latlng.latitude,
            cluster.businesses[j].latlng.longitude
          );
          
          // If pins are within 100 meters, consider them in the same group
          if (distance < 100) {
            group.push(cluster.businesses[j]);
            usedPins.add(j);
          }
        }
        
        pinGroups.push(group);
      }
      
      // Find the largest group (densest area)
      const largestGroup = pinGroups.reduce((largest, group) => 
        group.length > largest.length ? group : largest
      );
      
      // Calculate center of the densest area
      const centerLat = largestGroup.reduce((sum, b) => sum + b.latlng.latitude, 0) / largestGroup.length;
      const centerLng = largestGroup.reduce((sum, b) => sum + b.latlng.longitude, 0) / largestGroup.length;
      
      // Calculate appropriate zoom level based on the bounds
      const latDelta = (maxLat - minLat) + (latPadding * 2);
      const lngDelta = (maxLng - minLng) + (lngPadding * 2);
      
      // Use a more reliable zoom calculation
      // For web maps, we can use a simpler approach
      const maxDelta = Math.max(latDelta, lngDelta);
      let targetZoom;
      
      if (maxDelta > 0.1) targetZoom = 10;      // Very spread out
      else if (maxDelta > 0.05) targetZoom = 12; // Spread out
      else if (maxDelta > 0.02) targetZoom = 14; // Medium spread
      else if (maxDelta > 0.01) targetZoom = 16; // Close together
      else targetZoom = 18;                       // Very close
      
      targetZoom = Math.min(18, targetZoom);
      
      // Set the map to show all pins in the cluster
      setMapCenter({ latitude: centerLat, longitude: centerLng });
      setMapZoom(targetZoom);
    }
  };

  // Get user's current location on first load
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        setIsLoadingLocation(true);
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationPermission(true);
          
          // Get current position
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
            maximumAge: 10000, // 10 seconds
            timeout: 15000, // 15 seconds
          });
          
          // Update map center to user's location
          setMapCenter({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setMapZoom(15); // Zoom to city level
        } else {
          console.log('Location permission denied');
        }
      } catch (error) {
        console.log('Error getting location:', error);
        // Keep default location if geolocation fails
      } finally {
        setIsLoadingLocation(false);
      }
    };

    getCurrentLocation();
  }, []);

  // Handle selectBusinessId and centerMapTo param from navigation
  React.useEffect(() => {
    if (route.params && route.params.selectBusinessId) {
      setSelectedBusinessId(route.params.selectBusinessId);
      // If centerMapTo is provided, animate to it (no zoom)
      if (route.params.centerMapTo && route.params.centerMapTo.latitude && route.params.centerMapTo.longitude) {
        setFlyToPin({ ...route.params.centerMapTo });
        if (route.params.forceZoom) {
          setMapZoom(route.params.forceZoom);
        } else {
          setMapZoom(18);
        }
      }
      if (navigation && navigation.setParams) {
        navigation.setParams({ selectBusinessId: undefined, centerMapTo: undefined, forceZoom: undefined });
      }
    }
  }, [route.params]);

  const filteredBusinesses = businesses.filter(b => b.companyId === selectedCompany);
  const selectedCompanyObj = companies.find(c => c.id === selectedCompany);
  const selectedBusiness = filteredBusinesses.find(b => b.id === selectedBusinessId);

  // New: handlePinAdded for new pins
  const handlePinAdded = (coord) => {
    const newBusiness = {
      id: Math.random().toString(36).slice(2, 10),
      companyId: selectedCompany,
      name: `Business ${businesses.length + 1}`,
      status: 'open',
      latlng: coord,
      address: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
      lastContacted: '',
      canvassedBy: '',
      visitOutcome: '',
      tags: [],
      lastModified: new Date().toISOString(),
    };
    if (!newBusiness.name.trim() || !newBusiness.status.trim()) {
      Alert.alert('Missing Info', 'Business name and status are required.');
      return;
    }
    setBusinesses(prev => [...prev, newBusiness]);
    // Do not setFlyToPin here
  };

  const handleMapPress = (e) => {
    const coord = e.nativeEvent.coordinate;
    // Do not setFlyToPin here; let MapView call onPinAdded
    // handlePinAdded(coord); // Not called here
  };

  const handleEdit = (businessId) => {
    setEditBusinessId(businessId);
    navigation.navigate('Business List', { editBusinessId: businessId });
    setSelectedBusinessId(null);
  };

  const handleDelete = (businessId) => {
    setBusinesses(prev => prev.filter(b => b.id !== businessId));
    setSelectedBusinessId(null);
  };

  const clusters = clusterBusinesses(filteredBusinesses, clusteringZoom);

  return (
    <View style={styles.container}>
              <MapView
          markers={clusters.map(cluster => {
            if (cluster.businesses.length === 1) {
              const b = cluster.businesses[0];
              // Find the company for this business
              const company = companies.find(c => c.id === b.companyId);
              return {
                id: b.id,
                coordinate: b.latlng,
                status: b.status,
                title: b.name,
                description: b.status,
                isCluster: false,
                // Use business customPinIcon if present, else fallback to company customPinIcon
                customPinIcon: b.customPinIcon || (company && company.customPinIcon) || null,
              };
            } else {
              return {
                id: 'cluster-' + cluster.businesses.map(b => b.id).join('-'),
                coordinate: cluster.latlng,
                status: cluster.status, // Use the most common status for the cluster
                title: `${cluster.businesses.length} businesses`,
                description: '',
                isCluster: true,
                count: cluster.businesses.length,
              };
            }
          })}
          onMapPress={handleMapPress}
          zoom={mapZoom}
          style={styles.map}
          onEdit={handleEdit}
          onDelete={handleDelete}
          flyToPin={flyToPin}
          onPinAdded={handlePinAdded}
          onMarkerPress={id => {
            // Check if it's a cluster marker
            if (id.startsWith('cluster-')) {
              const cluster = clusters.find(c => c.id === id || `cluster-${c.businesses.map(b => b.id).join('-')}` === id);
              if (cluster) {
                // Zoom in by 2 levels, capped at 18
                const targetZoom = Math.min(mapZoom + 2, 18);
                setFlyToPin({ latitude: cluster.latlng.latitude, longitude: cluster.latlng.longitude, zoom: targetZoom });
              }
              handleClusterClick(id);
            } else {
              setSelectedBusinessId(id);
              const business = filteredBusinesses.find(b => b.id === id);
              if (business) setFlyToPin({ ...business.latlng, zoom: 18 });
            }
          }}
          onZoomChange={handleZoomChange}
        />
      
      {/* Loading indicator */}
      {isLoadingLocation && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Ionicons name="location" size={24} color="#007bff" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        </View>
      )}

      {/* Custom Modal for marker details (native only) */}
      {Platform.OS !== 'web' && (
        <Modal
          visible={!!selectedBusiness}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setSelectedBusinessId(null);
            setEditBusinessId(null);
          }}
        >
          <Pressable style={styles.modalOverlay} onPress={() => {
            setSelectedBusinessId(null);
            setEditBusinessId(null);
          }}>
            <View style={styles.modalContent}>
              {selectedBusiness && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedBusiness.name}</Text>
                    <TouchableOpacity 
                      onPress={() => {
                        setSelectedBusinessId(null);
                        setEditBusinessId(null);
                      }}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="#6c757d" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[selectedBusiness.status] }]}>
                      <Text style={styles.statusText}>{selectedBusiness.status}</Text>
                    </View>
                  </View>

                  <View style={styles.detailsContainer}>
                    <Text style={styles.coordinatesText}>
                      {selectedBusiness.latlng.latitude.toFixed(5)}, {selectedBusiness.latlng.longitude.toFixed(5)}
                    </Text>
                    
                    {hasValue(selectedBusiness.address) && (
                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={16} color="#6c757d" />
                        <Text style={styles.detailText}>{selectedBusiness.address}</Text>
                      </View>
                    )}
                    
                    {(hasValue(selectedBusiness.contactName) || hasValue(selectedBusiness.contactPhone)) && (
                      <View style={styles.detailRow}>
                        <Ionicons name="person" size={16} color="#6c757d" />
                        <Text style={styles.detailText}>
                          {selectedBusiness.contactName}
                          {hasValue(selectedBusiness.contactPhone) ? ` (${formatPhoneNumber(selectedBusiness.contactPhone)})` : ''}
                        </Text>
                      </View>
                    )}
                    
                    {hasValue(selectedBusiness.contactEmail) && (
                      <View style={styles.detailRow}>
                        <Ionicons name="mail" size={16} color="#6c757d" />
                        <Text style={styles.detailText}>{selectedBusiness.contactEmail}</Text>
                      </View>
                    )}
                    
                    {hasValue(selectedBusiness.lastContacted) && (
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar" size={16} color="#6c757d" />
                        <Text style={styles.detailText}>Last Contacted: {selectedBusiness.lastContacted}</Text>
                      </View>
                    )}
                    
                    {hasValue(selectedBusiness.canvassedBy) && (
                      <View style={styles.detailRow}>
                        <Ionicons name="person-circle" size={16} color="#6c757d" />
                        <Text style={styles.detailText}>Canvassed By: {selectedBusiness.canvassedBy}</Text>
                      </View>
                    )}
                    
                    {hasValue(selectedBusiness.visitOutcome) && (
                      <View style={styles.detailRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#6c757d" />
                        <Text style={styles.detailText}>Outcome: {selectedBusiness.visitOutcome}</Text>
                      </View>
                    )}
                    
                    {hasValue(selectedBusiness.tags) && (
                      <View style={styles.detailRow}>
                        <Ionicons name="pricetag" size={16} color="#6c757d" />
                        <Text style={styles.detailText}>Tags: {selectedBusiness.tags.join(', ')}</Text>
                      </View>
                    )}
                    
                    {hasValue(selectedBusiness.notes) && (
                      <View style={styles.detailRow}>
                        <Ionicons name="document-text" size={16} color="#6c757d" />
                        <Text style={styles.detailText}>Notes: {selectedBusiness.notes}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      onPress={() => handleEdit(selectedBusiness.id)} 
                      style={[styles.actionButton, styles.editButton]}
                    >
                      <Ionicons name="create" size={16} color="#fff" />
                      <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleDelete(selectedBusiness.id)} 
                      style={[styles.actionButton, styles.deleteButton]}
                    >
                      <Ionicons name="trash" size={16} color="#fff" />
                      <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </Pressable>
        </Modal>
      )}
      
      {/* Side panel for marker details (web only) */}
      {Platform.OS === 'web' && selectedBusiness && (
        <View style={styles.webOverlay}>
          <div
            style={styles.webOverlayDiv}
            onClick={() => {
              setSelectedBusinessId(null);
              setEditBusinessId(null);
            }}
          />
          <View style={styles.webSidePanel}>
            <View style={styles.webHeader}>
              <Text style={styles.webTitle}>{selectedBusiness.name}</Text>
              <TouchableOpacity onPress={() => {
                setSelectedBusinessId(null);
                setEditBusinessId(null);
              }} style={styles.webCloseButton}>
                <Ionicons name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.webStatusContainer}>
              <View style={[styles.webStatusBadge, { backgroundColor: STATUS_COLORS[selectedBusiness.status] }]}>
                <Text style={styles.webStatusText}>{selectedBusiness.status}</Text>
              </View>
            </View>
            
            <Text style={styles.webCoordinates}>
              {selectedBusiness.latlng.latitude.toFixed(5)}, {selectedBusiness.latlng.longitude.toFixed(5)}
            </Text>
            
            {hasValue(selectedBusiness.address) && (
              <View style={styles.webDetailRow}>
                <Ionicons name="location" size={16} color="#6c757d" />
                <Text style={styles.webDetailText}>Address: {selectedBusiness.address}</Text>
              </View>
            )}
            
            {(hasValue(selectedBusiness.contactName) || hasValue(selectedBusiness.contactPhone)) && (
              <View style={styles.webDetailRow}>
                <Ionicons name="person" size={16} color="#6c757d" />
                <Text style={styles.webDetailText}>
                  Contact: {selectedBusiness.contactName}
                  {hasValue(selectedBusiness.contactPhone) ? ` (${formatPhoneNumber(selectedBusiness.contactPhone)})` : ''}
                </Text>
              </View>
            )}
            
            {hasValue(selectedBusiness.contactEmail) && (
              <View style={styles.webDetailRow}>
                <Ionicons name="mail" size={16} color="#6c757d" />
                <Text style={styles.webDetailText}>Email: {selectedBusiness.contactEmail}</Text>
              </View>
            )}
            
            {hasValue(selectedBusiness.lastContacted) && (
              <View style={styles.webDetailRow}>
                <Ionicons name="calendar" size={16} color="#6c757d" />
                <Text style={styles.webDetailText}>Last Contacted: {selectedBusiness.lastContacted}</Text>
              </View>
            )}
            
            {hasValue(selectedBusiness.canvassedBy) && (
              <View style={styles.webDetailRow}>
                <Ionicons name="person-circle" size={16} color="#6c757d" />
                <Text style={styles.webDetailText}>Canvassed By: {selectedBusiness.canvassedBy}</Text>
              </View>
            )}
            
            {hasValue(selectedBusiness.visitOutcome) && (
              <View style={styles.webDetailRow}>
                <Ionicons name="checkmark-circle" size={16} color="#6c757d" />
                <Text style={styles.webDetailText}>Outcome: {selectedBusiness.visitOutcome}</Text>
              </View>
            )}
            
            {hasValue(selectedBusiness.tags) && (
              <View style={styles.webDetailRow}>
                <Ionicons name="pricetag" size={16} color="#6c757d" />
                <Text style={styles.webDetailText}>Tags: {selectedBusiness.tags.join(', ')}</Text>
              </View>
            )}
            
            {hasValue(selectedBusiness.notes) && (
              <View style={styles.webDetailRow}>
                <Ionicons name="document-text" size={16} color="#6c757d" />
                <Text style={styles.webDetailText}>Notes: {selectedBusiness.notes}</Text>
              </View>
            )}
            
            <View style={styles.webActionButtons}>
              <TouchableOpacity 
                onPress={() => handleEdit(selectedBusiness.id)} 
                style={[styles.webActionButton, styles.webEditButton]}
              >
                <Ionicons name="create" size={16} color="#fff" />
                <Text style={styles.webButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDelete(selectedBusiness.id)} 
                style={[styles.webActionButton, styles.webDeleteButton]}
              >
                <Ionicons name="trash" size={16} color="#fff" />
                <Text style={styles.webButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          {Platform.OS === 'web' ? 'Click' : 'Long-press'} to add a business pin for {selectedCompanyObj?.name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 500,
  },
  instructionText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  // Web-specific styles
  webOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
  },
  webOverlayDiv: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
  },
  webSidePanel: {
    position: 'fixed',
    top: 64,
    right: 0,
    height: 'calc(100% - 64px)',
    width: 380,
    backgroundColor: '#fff',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
    zIndex: 1001,
    padding: 24,
    paddingBottom: 50, // Extra padding at bottom to prevent cutoff
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  webHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  webTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  webCloseButton: {
    padding: 4,
  },
  webStatusContainer: {
    marginBottom: 16,
  },
  webStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  webStatusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  webCoordinates: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 16,
    fontFamily: 'Menlo, monospace',
  },
  webDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  webDetailText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  webActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 20,
    paddingBottom: 16, // Extra padding to ensure buttons are visible
  },
  webActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  webEditButton: {
    backgroundColor: '#007bff',
  },
  webDeleteButton: {
    backgroundColor: '#dc3545',
  },
  webButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
}); 