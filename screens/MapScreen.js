import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal, Pressable, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { STATUS_COLORS } from '../constants/StatusColors';
import MapView from '../components/MapView';

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

  // Handle selectBusinessId and centerMapTo param from navigation
  React.useEffect(() => {
    if (route.params && route.params.selectBusinessId) {
      setSelectedBusinessId(route.params.selectBusinessId);
      // If centerMapTo is provided, update mapCenter
      if (route.params.centerMapTo && route.params.centerMapTo.latitude && route.params.centerMapTo.longitude) {
        setMapCenter(route.params.centerMapTo);
      }
      // Clear the params so it doesn't keep re-triggering
      if (navigation && navigation.setParams) {
        navigation.setParams({ selectBusinessId: undefined, centerMapTo: undefined });
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
    <View style={{ flex: 1 }}>
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
        zoom={15}
        style={{ flex: 1 }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkerPress={id => setSelectedBusinessId(id)}
      />
      {/* Custom Modal for marker details (native only) */}
      {Platform.OS !== 'web' && (
        <Modal
          visible={!!selectedBusiness}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedBusinessId(null)}
        >
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setSelectedBusinessId(null)}>
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, minHeight: 180 }}>
              {selectedBusiness && (
                <>
                  <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{selectedBusiness.name}</Text>
                  <Text style={{ marginTop: 8 }}>Status: <Text style={{ color: STATUS_COLORS[selectedBusiness.status] }}>{selectedBusiness.status}</Text></Text>
                  <Text style={{ marginTop: 8, color: '#888' }}>Lat: {selectedBusiness.latlng.latitude.toFixed(5)}, Lng: {selectedBusiness.latlng.longitude.toFixed(5)}</Text>
                  {hasValue(selectedBusiness.address) && (
                    <Text style={{ marginTop: 8 }}>Address: {selectedBusiness.address}</Text>
                  )}
                  {(hasValue(selectedBusiness.contactName) || hasValue(selectedBusiness.contactPhone)) && (
                    <Text style={{ marginTop: 8 }}>Contact: {selectedBusiness.contactName}{hasValue(selectedBusiness.contactPhone) ? ` (${selectedBusiness.contactPhone})` : ''}</Text>
                  )}
                  {hasValue(selectedBusiness.contactEmail) && (
                    <Text style={{ marginTop: 8 }}>Email: {selectedBusiness.contactEmail}</Text>
                  )}
                  {hasValue(selectedBusiness.lastContacted) && (
                    <Text style={{ marginTop: 8 }}>Last Contacted: {selectedBusiness.lastContacted}</Text>
                  )}
                  {hasValue(selectedBusiness.canvassedBy) && (
                    <Text style={{ marginTop: 8 }}>Canvassed By: {selectedBusiness.canvassedBy}</Text>
                  )}
                  {hasValue(selectedBusiness.visitOutcome) && (
                    <Text style={{ marginTop: 8 }}>Outcome: {selectedBusiness.visitOutcome}</Text>
                  )}
                  {hasValue(selectedBusiness.tags) && (
                    <Text style={{ marginTop: 8 }}>Tags: {selectedBusiness.tags.join(', ')}</Text>
                  )}
                  {hasValue(selectedBusiness.notes) && (
                    <Text style={{ marginTop: 8 }}>Notes: {selectedBusiness.notes}</Text>
                  )}
                  <View style={{ flexDirection: 'row', marginTop: 20 }}>
                    <TouchableOpacity onPress={() => handleEdit(selectedBusiness.id)} style={{ backgroundColor: '#007bff', borderRadius: 6, padding: 10, marginRight: 12 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(selectedBusiness.id)} style={{ backgroundColor: '#dc3545', borderRadius: 6, padding: 10 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedBusinessId(null)} style={{ marginTop: 18, alignSelf: 'flex-end' }}>
                    <Text style={{ color: '#007bff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Pressable>
        </Modal>
      )}
      {/* Side panel for marker details (web only) */}
      {Platform.OS === 'web' && selectedBusiness && (
        <View style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
          {/* Overlay */}
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.08)' }}
            onClick={() => setSelectedBusinessId(null)}
          />
          {/* Side panel */}
          <View
            style={{ position: 'fixed', top: 64, right: 0, height: 'calc(100% - 64px)', width: 340, backgroundColor: '#fff', boxShadow: '-2px 0 12px rgba(0,0,0,0.15)', zIndex: 1001, padding: 28, display: 'flex', flexDirection: 'column' }}
            onStartShouldSetResponder={() => true}
            onClick={e => e.stopPropagation()}
          >
            <TouchableOpacity onPress={() => setSelectedBusinessId(null)} style={{ position: 'absolute', top: 12, right: 16 }}>
              <Text style={{ fontSize: 22, color: '#007bff' }}>×</Text>
            </TouchableOpacity>
            <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 12 }}>{selectedBusiness.name}</Text>
            <Text style={{ marginBottom: 8 }}>Status: <Text style={{ color: STATUS_COLORS[selectedBusiness.status] }}>{selectedBusiness.status}</Text></Text>
            <Text style={{ color: '#888', marginBottom: 16 }}>Lat: {selectedBusiness.latlng.latitude.toFixed(5)}, Lng: {selectedBusiness.latlng.longitude.toFixed(5)}</Text>
            {hasValue(selectedBusiness.address) && (
              <Text style={{ marginBottom: 8 }}>Address: {selectedBusiness.address}</Text>
            )}
            {(hasValue(selectedBusiness.contactName) || hasValue(selectedBusiness.contactPhone)) && (
              <Text style={{ marginBottom: 8 }}>Contact: {selectedBusiness.contactName}{hasValue(selectedBusiness.contactPhone) ? ` (${selectedBusiness.contactPhone})` : ''}</Text>
            )}
            {hasValue(selectedBusiness.contactEmail) && (
              <Text style={{ marginBottom: 8 }}>Email: {selectedBusiness.contactEmail}</Text>
            )}
            {hasValue(selectedBusiness.lastContacted) && (
              <Text style={{ marginBottom: 8 }}>Last Contacted: {selectedBusiness.lastContacted}</Text>
            )}
            {hasValue(selectedBusiness.canvassedBy) && (
              <Text style={{ marginBottom: 8 }}>Canvassed By: {selectedBusiness.canvassedBy}</Text>
            )}
            {hasValue(selectedBusiness.visitOutcome) && (
              <Text style={{ marginBottom: 8 }}>Outcome: {selectedBusiness.visitOutcome}</Text>
            )}
            {hasValue(selectedBusiness.tags) && (
              <Text style={{ marginBottom: 8 }}>Tags: {selectedBusiness.tags.join(', ')}</Text>
            )}
            {hasValue(selectedBusiness.notes) && (
              <Text style={{ marginBottom: 8 }}>Notes: {selectedBusiness.notes}</Text>
            )}
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <TouchableOpacity onPress={() => handleEdit(selectedBusiness.id)} style={{ backgroundColor: '#007bff', borderRadius: 6, padding: 10, marginRight: 12 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(selectedBusiness.id)} style={{ backgroundColor: '#dc3545', borderRadius: 6, padding: 10 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      <Text style={{ textAlign: 'center', margin: 8, color: '#888' }}>
        Long-press (native) or click (web) to add a business pin for {selectedCompanyObj?.name}
      </Text>
    </View>
  );
} 