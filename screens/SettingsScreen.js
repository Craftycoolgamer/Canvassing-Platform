import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useAppContext } from '../context/AppContext';

export default function SettingsScreen() {
  const { companies, addCompany, deleteCompany, businesses, selectedCompany, setSelectedCompany } = useAppContext();
  const [newCompany, setNewCompany] = useState('');

  const canDelete = (companyId) => businesses.every(b => b.companyId !== companyId);

  return (
    <View style={{ flex: 1, alignItems: 'center', paddingTop: 24 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Manage Companies</Text>
      {/* Company selection UI */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
        {companies.map(c => (
          <TouchableOpacity
            key={c.id}
            style={{
              backgroundColor: c.id === selectedCompany ? '#007bff' : '#e0e0e0',
              padding: 8,
              borderRadius: 6,
              marginHorizontal: 4,
            }}
            onPress={() => setSelectedCompany(c.id)}
          >
            <Text style={{ color: c.id === selectedCompany ? '#fff' : '#333' }}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, width: 180, marginRight: 8 }}
          value={newCompany}
          onChangeText={setNewCompany}
          placeholder="New company name"
        />
        <TouchableOpacity
          style={{ backgroundColor: '#28a745', borderRadius: 6, padding: 10 }}
          onPress={() => {
            if (newCompany.trim()) {
              addCompany(newCompany.trim());
              setNewCompany('');
            }
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={companies}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 16 }}>{item.name}</Text>
            <TouchableOpacity
              style={{ marginLeft: 12, backgroundColor: canDelete(item.id) ? '#dc3545' : '#ccc', borderRadius: 6, padding: 8 }}
              disabled={!canDelete(item.id)}
              onPress={() => {
                Alert.alert('Delete Company', 'Are you sure? Only empty companies can be deleted.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteCompany(item.id) },
                ]);
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        style={{ width: 300 }}
      />
      <Text style={{ color: '#888', marginTop: 16, fontSize: 12 }}>
        Only companies with no businesses can be deleted.
      </Text>
    </View>
  );
} 