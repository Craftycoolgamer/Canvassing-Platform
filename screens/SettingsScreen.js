import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ScrollView, StyleSheet, Platform, Image, Modal as RNModal } from 'react-native';
import { useAppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Svg, { SvgXml } from 'react-native-svg';
import { decode as base64Decode } from 'base-64';
import * as FileSystem from 'expo-file-system';
import { encode as base64Encode } from 'base-64';
import * as DocumentPicker from 'expo-document-picker';

const COLOR_OPTIONS = [
  '#e3f2fd', '#f3e5f5', '#e8f5e8', '#fff3e0', '#fce4ec', 
  '#f1f8e9', '#e0f2f1', '#fafafa', '#f5f5f5', '#eeeeee'
];

export default function SettingsScreen() {
  const { companies, addCompany, deleteCompany, businesses, selectedCompany, setSelectedCompany, setCompanyIcon } = useAppContext();
  const fileInputRefs = useRef({}); // For web file inputs
  const [newCompany, setNewCompany] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ visible: false, company: null });

  const canDelete = (companyId) => businesses.every(b => b.companyId !== companyId);

  const handleAddCompany = () => {
    if (newCompany.trim()) {
      addCompany(newCompany.trim(), selectedColor);
      setNewCompany('');
      setSelectedColor(COLOR_OPTIONS[0]);
      setShowColorPicker(false);
    }
  };

  // SVG upload handler
  const handleUploadSvg = async (companyId) => {
    console.log('Upload button pressed for company:', companyId);
    if (Platform.OS === 'web') {
      // Trigger the hidden file input
      if (fileInputRefs.current[companyId]) {
        fileInputRefs.current[companyId].value = '';
        fileInputRefs.current[companyId].click();
      }
      return;
    }
    try {
      let result = await DocumentPicker.getDocumentAsync({
        type: 'image/svg+xml',
        copyToCacheDirectory: true,
      });
      console.log('DocumentPicker result:', result);
      if (result.assets && result.assets[0] && result.assets[0].uri) {
        const asset = result.assets[0];
        console.log('DocumentPicker success, uri:', asset.uri);
        const svgText = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
        const base64 = base64Encode(svgText);
        console.log('Uploading SVG for company:', companyId);
        console.log('SVG base64:', base64.slice(0, 100) + '...');
        await setCompanyIcon(companyId, base64);
      } else {
        console.log('DocumentPicker not success or no uri');
      }
    } catch (e) {
      console.log('SVG upload error:', e);
      Alert.alert('Error', 'Failed to upload SVG icon.');
    }
  };

  // Web file input change handler
  const handleFileInputChange = async (e, companyId) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      alert('Please select an SVG file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const svgText = event.target.result;
      const base64 = btoa(unescape(encodeURIComponent(svgText)));
      console.log('Uploading SVG for company:', companyId);
      console.log('SVG base64:', base64.slice(0, 100) + '...');
      await setCompanyIcon(companyId, base64);
    };
    reader.readAsText(file);
  };

  // New: clear icon handler
  const handleClearIcon = async (companyId) => {
    await setCompanyIcon(companyId, null);
    setDeleteModal({ visible: false, company: null });
  };

  // New: delete company handler
  const handleDeleteCompany = (companyId) => {
    deleteCompany(companyId);
    setDeleteModal({ visible: false, company: null });
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
            extraData={companies}
            renderItem={({ item }) => (
              <View style={styles.companyListItem}>
                <View style={styles.companyInfo}>
                  <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                  <Text style={styles.companyName}>{item.name}</Text>
                </View>
                {/* SVG Icon Preview and Upload */}
                <View style={styles.iconUploadContainer}>
                  <View style={styles.iconPreviewWrapper}>
                    {item.customPinIcon ? (
                      (() => {
                        try {
                          // console.log('item.customPinIcon:', item.customPinIcon.slice(0, 100) + '...');
                          const xml = base64Decode(item.customPinIcon);
                          // console.log('Decoded SVG XML in render:', xml.slice(0, 100) + '...');
                          return (
                            <SvgXml
                              xml={xml}
                              width={36}
                              height={36}
                              style={styles.iconPreview}
                              preserveAspectRatio="xMidYMid meet"
                            />
                          );
                        } catch (e) {
                          console.log('SVG render error:', e);
                          return <Ionicons name="alert-circle" size={32} color="#f00" style={styles.iconPreview} />;
                        }
                      })()
                    ) : (
                      <Ionicons name="location" size={32} color="#888" style={styles.iconPreview} />
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => handleUploadSvg(item.id)}
                  >
                    <Ionicons name="cloud-upload" size={18} color="#fff" />
                    {Platform.OS === 'web' ? <Text style={styles.uploadButtonText}>Change Icon</Text> : null}
                  </TouchableOpacity>
                  {/* Hidden file input for web */}
                  {Platform.OS === 'web' && (
                    <input
                      type="file"
                      accept=".svg,image/svg+xml"
                      style={{ display: 'none' }}
                      ref={el => (fileInputRefs.current[item.id] = el)}
                      onChange={e => handleFileInputChange(e, item.id)}
                    />
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    !canDelete(item.id) && !item.customPinIcon && styles.disabledDeleteButton
                  ]}
                  disabled={!canDelete(item.id) && !item.customPinIcon}
                  onPress={() => setDeleteModal({ visible: true, company: item })}
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
        {/* Delete Modal */}
        <RNModal
          visible={deleteModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setDeleteModal({ visible: false, company: null })}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: 28,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 12,
              elevation: 8,
            }}>
              <View style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#ffeaea',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}>
                <Ionicons name="alert" size={32} color="#dc3545" />
              </View>
              <Text style={{ fontWeight: '700', fontSize: 20, marginBottom: 10, textAlign: 'center', color: '#2c3e50' }}>
                {deleteModal.company ? `Delete options for "${deleteModal.company.name}"` : 'Delete options'}
              </Text>
              <Text style={{ color: '#6c757d', fontSize: 15, marginBottom: 18, textAlign: 'center' }}>
                {deleteModal.company && deleteModal.company.customPinIcon && canDelete(deleteModal.company.id)
                  ? 'You can delete the icon or the company.'
                  : deleteModal.company && deleteModal.company.customPinIcon
                  ? 'You can delete the icon.'
                  : deleteModal.company && canDelete(deleteModal.company.id)
                  ? 'You can delete the company.'
                  : 'Cannot delete company with businesses.'}
              </Text>
              {deleteModal.company && deleteModal.company.customPinIcon && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#fff0f0',
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 18,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#f5c2c7',
                    width: 220,
                    justifyContent: 'center',
                  }}
                  onPress={() => handleClearIcon(deleteModal.company.id)}
                >
                  <Ionicons name="close-circle" size={20} color="#dc3545" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#dc3545', fontWeight: '600', fontSize: 16 }}>Delete Icon</Text>
                </TouchableOpacity>
              )}
              {deleteModal.company && canDelete(deleteModal.company.id) && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#dc3545',
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 18,
                    marginBottom: 10,
                    width: 220,
                    justifyContent: 'center',
                    shadowColor: '#dc3545',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  onPress={() => handleDeleteCompany(deleteModal.company.id)}
                >
                  <Ionicons name="trash" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Delete Company</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={{
                  backgroundColor: '#f1f3f5',
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 18,
                  marginTop: 2,
                  width: 220,
                  justifyContent: 'center',
                }}
                onPress={() => setDeleteModal({ visible: false, company: null })}
              >
                <Ionicons name="close" size={20} color="#6c757d" style={{ marginRight: 8 }} />
                <Text style={{ color: '#6c757d', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </RNModal>
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
    marginRight: 8,
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
    width: 40,
    height: 40,
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
  iconUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  iconPreviewWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 8,
  },
  iconPreview: {
    width: 36,
    height: 36,
    aspectRatio: 1,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    height: 40,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
}); 