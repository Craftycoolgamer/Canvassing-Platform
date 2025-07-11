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

export default function MapScreen() {
  const { companies, selectedCompany, setSelectedCompany, businesses, setBusinesses } = useAppContext();
  const [addingPin, setAddingPin] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const [editBusinessId, setEditBusinessId] = useState(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [mapCenter, setMapCenter] = useState({ latitude: 37.78825, longitude: -122.4324 });
  const [mapZoom, setMapZoom] = useState(17);
  const [mapKey, setMapKey] = useState(0);
  const [locationPermission, setLocationPermission] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

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
      // If centerMapTo is provided, update mapCenter and zoom in
      if (route.params.centerMapTo && route.params.centerMapTo.latitude && route.params.centerMapTo.longitude) {
        // Update map center and zoom without forcing a re-render of the entire map
        setMapCenter(route.params.centerMapTo);
        
        // Use forceZoom if provided, otherwise default to 18
        if (route.params.forceZoom) {
          setMapZoom(route.params.forceZoom);
        } else {
          setMapZoom(18); // Default zoom level when navigating to a specific business
        }
        
        // We no longer need to force a complete re-render with the key
        // as we want to animate from the current position
      }
      // Clear the params so it doesn't keep re-triggering
      if (navigation && navigation.setParams) {
        navigation.setParams({ selectBusinessId: undefined, centerMapTo: undefined, forceZoom: undefined });
      }
    }
  }, [route.params]);

  const filteredBusinesses = businesses.filter(b => b.companyId === selectedCompany);
  const selectedCompanyObj = companies.find(c => c.id === selectedCompany);
  const selectedBusiness = filteredBusinesses.find(b => b.id === selectedBusinessId);

  const handleMapPress = (e) => {
    const coord = e.nativeEvent.coordinate;
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
    setMapCenter(coord); // Center map on new pin
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

  return (
    <View style={styles.container}>
      <MapView
        markers={filteredBusinesses.map(b => ({
          id: b.id,
          coordinate: b.latlng,
          status: b.status,
          title: b.name,
          description: b.status,
        }))}
        onMapPress={handleMapPress}
        mapCenter={mapCenter}
        zoom={mapZoom}
        style={styles.map}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkerPress={id => setSelectedBusinessId(id)}
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