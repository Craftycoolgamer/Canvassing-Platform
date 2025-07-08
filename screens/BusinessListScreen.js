import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppContext } from '../context/AppContext';
import { STATUS_COLORS } from '../constants/StatusColors';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';

// Helper to check if a value is non-empty (string, array, etc.)
function hasValue(val) {
  if (Array.isArray(val)) return val.length > 0;
  return val !== undefined && val !== null && String(val).trim() !== '';
}

export default function BusinessListScreen() {
  const { businesses, companies, selectedCompany, deleteBusiness, setBusinesses } = useAppContext();
  const filteredBusinesses = businesses.filter(b => b.companyId === selectedCompany);
  const company = companies.find(c => c.id === selectedCompany);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState('open');
  const [editAddress, setEditAddress] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editLastContacted, setEditLastContacted] = useState('');
  const [editCanvassedBy, setEditCanvassedBy] = useState('');
  const [editVisitOutcome, setEditVisitOutcome] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const route = useRoute();
  const navigation = useNavigation();
  const statusSelectRef = useRef();

  React.useEffect(() => {
    if (route.params && route.params.editBusinessId) {
      const b = filteredBusinesses.find(bz => bz.id === route.params.editBusinessId);
      if (b) {
        setEditingId(b.id);
        setEditName(b.name);
        setEditStatus(b.status);
        setEditAddress(b.address);
        setEditContactName(b.contactName);
        setEditContactPhone(b.contactPhone);
        setEditContactEmail(b.contactEmail);
        setEditLastContacted(b.lastContacted);
        setEditCanvassedBy(b.canvassedBy);
        setEditVisitOutcome(b.visitOutcome);
        setEditTags(b.tags ? b.tags.join(', ') : '');
        setEditNotes(b.notes);
        // Clear the param so cancelEdit works as expected
        if (route.name && route.params.editBusinessId) {
          const nav = navigation || (typeof useNavigation === 'function' ? useNavigation() : null);
          if (nav && nav.setParams) nav.setParams({ editBusinessId: undefined });
        }
      }
    }
  }, [route.params, filteredBusinesses]);

  useFocusEffect(
    React.useCallback(() => {
      // On focus: do nothing. On blur: reset edit state.
      return () => {
        setEditingId(null);
        setEditName('');
        setEditStatus('open');
        setEditAddress('');
        setEditContactName('');
        setEditContactPhone('');
        setEditContactEmail('');
        setEditLastContacted('');
        setEditCanvassedBy('');
        setEditVisitOutcome('');
        setEditTags('');
        setEditNotes('');
      };
    }, [])
  );

  const startEdit = (b) => {
    setEditingId(b.id);
    setEditName(b.name);
    setEditStatus(b.status);
    setEditAddress(b.address);
    setEditContactName(b.contactName);
    setEditContactPhone(b.contactPhone);
    setEditContactEmail(b.contactEmail);
    setEditLastContacted(b.lastContacted);
    setEditCanvassedBy(b.canvassedBy);
    setEditVisitOutcome(b.visitOutcome);
    setEditTags(b.tags ? b.tags.join(', ') : '');
    setEditNotes(b.notes);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditStatus('open');
    setEditAddress('');
    setEditContactName('');
    setEditContactPhone('');
    setEditContactEmail('');
    setEditLastContacted('');
    setEditCanvassedBy('');
    setEditVisitOutcome('');
    setEditTags('');
    setEditNotes('');
  };
  const saveEdit = () => {
    if (!editName.trim()) {
      Alert.alert('Missing Name', 'Business name is required.');
      return;
    }
    if (!editStatus.trim()) {
      Alert.alert('Missing Status', 'Business status is required.');
      return;
    }
    const newTags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    setBusinesses(prev => prev.map(b => b.id === editingId ? { ...b, name: editName, status: editStatus, address: editAddress, contactName: editContactName, contactPhone: editContactPhone, contactEmail: editContactEmail, lastContacted: editLastContacted, canvassedBy: editCanvassedBy, visitOutcome: editVisitOutcome, tags: newTags, notes: editNotes } : b));
    cancelEdit();
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 24 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Businesses for {company?.name}</Text>
      {filteredBusinesses.length === 0 ? (
        <Text>No businesses for this company.</Text>
      ) : (
        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingBottom: 32 }}>
          {filteredBusinesses.map(b => (
            <View key={b.id} style={{ marginBottom: 10, padding: 10, backgroundColor: '#f8f8f8', borderRadius: 8, width: 300, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              {editingId === b.id ? (
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 4, marginBottom: 4 }}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Business name"
                  />
                  {/* Status dropdown for web, Picker for native */}
                  {Platform.OS === 'web' ? (
                    <select
                      ref={statusSelectRef}
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 6, marginBottom: 4, width: '100%' }}
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="pending">Pending</option>
                    </select>
                  ) : (
                    <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 4, overflow: 'hidden' }}>
                      <Picker
                        selectedValue={editStatus}
                        onValueChange={setEditStatus}
                        style={{ width: '100%' }}
                      >
                        <Picker.Item label="Open" value="open" color={STATUS_COLORS.open} />
                        <Picker.Item label="Closed" value="closed" color={STATUS_COLORS.closed} />
                        <Picker.Item label="Pending" value="pending" color={STATUS_COLORS.pending} />
                      </Picker>
                    </View>
                  )}
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 4, marginBottom: 4 }}
                    value={editAddress}
                    onChangeText={setEditAddress}
                    placeholder="Address"
                  />
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 4, marginBottom: 4 }}
                    value={editContactName}
                    onChangeText={setEditContactName}
                    placeholder="Contact Name"
                  />
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 4, marginBottom: 4 }}
                    value={editContactPhone}
                    onChangeText={setEditContactPhone}
                    placeholder="Contact Phone"
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 4, marginBottom: 4 }}
                    value={editContactEmail}
                    onChangeText={setEditContactEmail}
                    placeholder="Contact Email"
                    keyboardType="email-address"
                  />
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 4, marginBottom: 4 }}
                    value={editLastContacted}
                    onChangeText={setEditLastContacted}
                    placeholder="Last Contacted (YYYY-MM-DD)"
                  />
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 4, marginBottom: 4 }}
                    value={editCanvassedBy}
                    onChangeText={setEditCanvassedBy}
                    placeholder="Canvassed By"
                  />
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 4, marginBottom: 4 }}
                    value={editVisitOutcome}
                    onChangeText={setEditVisitOutcome}
                    placeholder="Visit Outcome"
                  />
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 4, marginBottom: 4 }}
                    value={editTags}
                    onChangeText={setEditTags}
                    placeholder="Tags (comma separated)"
                  />
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 4, marginBottom: 4, minHeight: 40 }}
                    value={editNotes}
                    onChangeText={setEditNotes}
                    placeholder="Notes"
                    multiline
                  />
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={saveEdit} style={{ backgroundColor: '#28a745', borderRadius: 6, padding: 8, marginRight: 8 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={cancelEdit} style={{ backgroundColor: '#6c757d', borderRadius: 6, padding: 8 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold' }}>{b.name}</Text>
                  <Text>Status: <Text style={{ color: STATUS_COLORS[b.status] }}>{b.status}</Text></Text>
                  <Text>Lat: {b.latlng.latitude.toFixed(5)}, Lng: {b.latlng.longitude.toFixed(5)}</Text>
                  {hasValue(b.address) && (
                    <Text>Address: {b.address}</Text>
                  )}
                  {(hasValue(b.contactName) || hasValue(b.contactPhone)) && (
                    <Text>Contact: {b.contactName}{hasValue(b.contactPhone) ? ` (${b.contactPhone})` : ''}</Text>
                  )}
                  {hasValue(b.contactEmail) && (
                    <Text>Email: {b.contactEmail}</Text>
                  )}
                  {hasValue(b.lastContacted) && (
                    <Text>Last Contacted: {b.lastContacted}</Text>
                  )}
                  {hasValue(b.canvassedBy) && (
                    <Text>Canvassed By: {b.canvassedBy}</Text>
                  )}
                  {hasValue(b.visitOutcome) && (
                    <Text>Outcome: {b.visitOutcome}</Text>
                  )}
                  {hasValue(b.tags) && (
                    <Text>Tags: {b.tags.join(', ')}</Text>
                  )}
                  {hasValue(b.notes) && (
                    <Text>Notes: {b.notes}</Text>
                  )}
                  <View style={{ flexDirection: 'row', marginTop: 6 }}>
                    <TouchableOpacity
                      style={{ marginRight: 8, backgroundColor: '#007bff', borderRadius: 6, padding: 8 }}
                      onPress={() => startEdit(b)}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ marginRight: 8, backgroundColor: '#6c63ff', borderRadius: 6, padding: 8 }}
                      onPress={() => navigation.navigate('Map', { selectBusinessId: b.id, centerMapTo: b.latlng })}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: '#dc3545', borderRadius: 6, padding: 8 }}
                      onPress={() => {
                        Alert.alert('Delete Business', 'Are you sure you want to delete this business?', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteBusiness(b.id) },
                        ]);
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
} 