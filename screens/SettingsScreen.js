import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ScrollView, StyleSheet } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

const COLOR_OPTIONS = [
  '#e3f2fd', '#f3e5f5', '#e8f5e8', '#fff3e0', '#fce4ec', 
  '#f1f8e9', '#e0f2f1', '#fafafa', '#f5f5f5', '#eeeeee'
];

export default function SettingsScreen() {
  const { companies, addCompany, deleteCompany, businesses, selectedCompany, setSelectedCompany } = useAppContext();
  const [newCompany, setNewCompany] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const canDelete = (companyId) => businesses.every(b => b.companyId !== companyId);

  const handleAddCompany = () => {
    if (newCompany.trim()) {
      addCompany(newCompany.trim(), selectedColor);
      setNewCompany('');
      setSelectedColor(COLOR_OPTIONS[0]);
      setShowColorPicker(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Manage Companies</Text>
        
        {/* Company selection UI */}
        <View style={styles.companySelector}>
          <Text style={styles.sectionTitle}>Select Company</Text>
          <View style={styles.companyGrid}>
            {companies.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.companyCard,
                  c.id === selectedCompany && styles.selectedCompanyCard
                ]}
                onPress={() => setSelectedCompany(c.id)}
              >
                <View style={[styles.colorIndicator, { backgroundColor: c.color }]} />
                <Text style={[
                  styles.companyName,
                  c.id === selectedCompany && styles.selectedCompanyName
                ]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add new company section */}
        <View style={styles.addSection}>
          <Text style={styles.sectionTitle}>Add New Company</Text>
          
          <View style={styles.addForm}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.companyInput}
                value={newCompany}
                onChangeText={setNewCompany}
                placeholder="New company name"
                placeholderTextColor="#6c757d"
              />
              <TouchableOpacity
                style={[styles.colorButton, { backgroundColor: selectedColor }]}
                onPress={() => setShowColorPicker(!showColorPicker)}
              >
                <Ionicons name="color-palette" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Color picker */}
            {showColorPicker && (
              <View style={styles.colorPicker}>
                <Text style={styles.colorPickerTitle}>Choose Color</Text>
                <View style={styles.colorGrid}>
                  {COLOR_OPTIONS.map((color, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColorOption
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.addButton, !newCompany.trim() && styles.disabledButton]}
              onPress={handleAddCompany}
              disabled={!newCompany.trim()}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Company</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Company list */}
        <View style={styles.companyList}>
          <Text style={styles.sectionTitle}>Existing Companies</Text>
          <FlatList
            data={companies}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.companyListItem}>
                <View style={styles.companyInfo}>
                  <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                  <Text style={styles.companyName}>{item.name}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    !canDelete(item.id) && styles.disabledDeleteButton
                  ]}
                  disabled={!canDelete(item.id)}
                  onPress={() => {
                    Alert.alert(
                      'Delete Company', 
                      'Are you sure? Only empty companies can be deleted.', 
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete', 
                          style: 'destructive', 
                          onPress: () => deleteCompany(item.id) 
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="trash" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.footer}>
          <Ionicons name="information-circle" size={16} color="#6c757d" />
          <Text style={styles.footerText}>
            Only companies with no businesses can be deleted.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: '700',
    fontSize: 24,
    color: '#2c3e50',
    marginBottom: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 16,
  },
  companySelector: {
    marginBottom: 32,
  },
  companyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  companyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCompanyCard: {
    borderColor: '#007bff',
    backgroundColor: '#f8f9ff',
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  selectedCompanyName: {
    color: '#007bff',
  },
  addSection: {
    marginBottom: 32,
  },
  addForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  companyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2c3e50',
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  colorPicker: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  colorPickerTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#007bff',
    borderWidth: 3,
  },
  addButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  companyList: {
    marginBottom: 24,
  },
  companyListItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    padding: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledDeleteButton: {
    backgroundColor: '#6c757d',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  footerText: {
    color: '#6c757d',
    fontSize: 12,
    textAlign: 'center',
    flex: 1,
  },
}); 