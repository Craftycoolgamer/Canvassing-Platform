import React, { useState, useRef, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Platform, ScrollView, Modal, StyleSheet, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppContext } from '../context/AppContext';
import { STATUS_COLORS } from '../constants/StatusColors';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { getPhoneError, getEmailError, formatPhoneNumber } from '../utils/validation';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

// Helper to check if a value is non-empty (string, array, etc.)
function hasValue(val) {
  if (Array.isArray(val)) return val.length > 0;
  return val !== undefined && val !== null && String(val).trim() !== '';
}

// Shared component to display business history
function BusinessActivity({ history, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState('visit');
  const [notes, setNotes] = useState('');
  const [user, setUser] = useState('');

  const handleSave = () => {
    if (!notes.trim()) return;
    onAdd({
      date: new Date().toISOString(),
      type,
      notes,
      user,
    });
    setAdding(false);
    setType('visit');
    setNotes('');
    setUser('');
  };

  return (
    <View style={styles.activityContainer}>
      <Text style={styles.sectionTitle}>Activity</Text>
      {onAdd && !adding && (
        <TouchableOpacity onPress={() => setAdding(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={16} color="#fff" />
          <Text style={styles.addButtonText}>Add Activity Entry</Text>
        </TouchableOpacity>
      )}
      {adding && (
        <View style={styles.addForm}>
          <Text style={styles.formLabel}>Type:</Text>
          <TextInput 
            value={type} 
            onChangeText={setType} 
            placeholder="Type (e.g. visit, call, email)" 
            style={styles.formInput} 
          />
          <Text style={styles.formLabel}>Notes:</Text>
          <TextInput 
            value={notes} 
            onChangeText={setNotes} 
            placeholder="Notes" 
            multiline 
            style={[styles.formInput, styles.textArea]} 
          />
          <Text style={styles.formLabel}>User:</Text>
          <TextInput 
            value={user} 
            onChangeText={setUser} 
            placeholder="User (optional)" 
            style={styles.formInput} 
          />
          <View style={styles.formButtons}>
            <TouchableOpacity onPress={handleSave} style={[styles.formButton, styles.saveButton]}>
              <Text style={styles.formButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAdding(false)} style={[styles.formButton, styles.cancelButton]}>
              <Text style={styles.formButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {(!history || history.length === 0) && (
        <Text style={styles.emptyText}>No activity yet.</Text>
      )}
      {history && history.slice().reverse().map((entry, idx) => (
        <View key={idx} style={styles.activityEntry}>
          <Text style={styles.activityTitle}>
            {entry.type || 'Interaction'} - {new Date(entry.date).toLocaleString()}
          </Text>
          <Text style={styles.activityNotes}>{entry.notes}</Text>
          {entry.user && (
            <Text style={styles.activityUser}>By: {entry.user}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// NotesSection component for multiple notes
function NotesSection({ notes, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);

  const handleSave = () => {
    if (!noteText.trim()) return;
    // Add timestamp to new notes
    const newNote = {
      text: noteText.trim(),
      timestamp: new Date().toISOString()
    };
    onAdd(newNote);
    setNoteText('');
    setAdding(false);
  };

  // Handle note click to toggle timestamp display
  const handleNoteClick = (index) => {
    if (selectedNoteIndex === index) {
      setSelectedNoteIndex(null); // Hide timestamp if already showing
    } else {
      setSelectedNoteIndex(index); // Show timestamp
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'No timestamp available';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get note text from either string or object format
  const getNoteText = (note) => {
    if (typeof note === 'string') return note;
    return note.text || '';
  };

  // Get note timestamp if available
  const getNoteTimestamp = (note) => {
    if (typeof note === 'object' && note.timestamp) return note.timestamp;
    return null;
  };

  return (
    <View style={styles.notesContainer}>
      <Text style={styles.sectionTitle}>Notes</Text>
      {notes && notes.length > 0 ? (
        notes.slice().reverse().map((note, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={[
              styles.noteCard,
              selectedNoteIndex === idx && styles.selectedNoteCard
            ]}
            onPress={() => handleNoteClick(idx)}
          >
            <Text style={styles.noteText}>{getNoteText(note)}</Text>
            {selectedNoteIndex === idx && getNoteTimestamp(note) && (
              <Text style={styles.noteTimestamp}>
                Added: {formatTimestamp(getNoteTimestamp(note))}
              </Text>
            )}
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>No notes yet.</Text>
      )}
      {onAdd && !adding && (
        <TouchableOpacity onPress={() => setAdding(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={16} color="#fff" />
          <Text style={styles.addButtonText}>Add Note</Text>
        </TouchableOpacity>
      )}
      {adding && (
        <View style={styles.addForm}>
          <TextInput 
            value={noteText} 
            onChangeText={setNoteText} 
            placeholder="New note" 
            multiline 
            style={[styles.formInput, styles.textArea]} 
          />
          <View style={styles.formButtons}>
            <TouchableOpacity onPress={handleSave} style={[styles.formButton, styles.saveButton]}>
              <Text style={styles.formButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAdding(false)} style={[styles.formButton, styles.cancelButton]}>
              <Text style={styles.formButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function BusinessListScreen() {
  const { businesses, companies, selectedCompany, deleteBusiness, setBusinesses } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollViewRef = useRef(null);
  
  // Calculate optimal number of cards per row and width
  const calculateCardLayout = () => {
    const cardMinWidth = 400;
    const gap = 16;
    const containerPadding = 40; // 20px on each side
    const availableWidth = screenWidth - containerPadding;
    
    // If available width is less than minimum width, use full width
    if (availableWidth < cardMinWidth) {
      return { cardsPerRow: 1, cardWidth: '100%' };
    }
    
    const cardsPerRow = Math.floor(availableWidth / (cardMinWidth + gap));
    const calculatedCardsPerRow = Math.max(1, cardsPerRow);
    
    // Calculate the actual card width to fill available space
    const totalGaps = calculatedCardsPerRow - 1;
    const totalGapWidth = totalGaps * gap;
    const cardWidth = Platform.OS === 'web' 
      ? `calc((100% - ${totalGapWidth}px) / ${calculatedCardsPerRow})`
      : `${(100 - totalGaps * 2)}%`;
    
    return { cardsPerRow: calculatedCardsPerRow, cardWidth };
  };

  const { cardsPerRow, cardWidth } = calculateCardLayout();
  
  // Dynamic business card style
  const dynamicBusinessCardStyle = {
    ...styles.businessCard,
    width: cardWidth,
  };
  
  // Function to scroll to a specific business
  const scrollToBusiness = (businessId) => {
    const businessIndex = filteredBusinesses.findIndex(b => b.id === businessId);
    if (businessIndex !== -1 && scrollViewRef.current) {
      // Calculate scroll position based on card index
      // Each card is approximately 300px tall + 16px margin bottom
      const cardHeight = 316; // 300 + 16
      const headerHeight = 120; // Approximate header height
      const scrollPosition = (businessIndex * cardHeight) + headerHeight;
      
      scrollViewRef.current.scrollTo({
        y: scrollPosition,
        animated: true,
      });
    }
  };
  
  // Filter businesses by company and search query
  const filteredBusinesses = useMemo(() => {
    const companyFiltered = businesses.filter(b => b.companyId === selectedCompany);
    
    if (!searchQuery.trim()) {
      return companyFiltered;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return companyFiltered.filter(business => {
      // Search in multiple fields
      return (
        business.name?.toLowerCase().includes(query) ||
        business.address?.toLowerCase().includes(query) ||
        business.contactName?.toLowerCase().includes(query) ||
        business.contactPhone?.toLowerCase().includes(query) ||
        business.contactEmail?.toLowerCase().includes(query) ||
        business.status?.toLowerCase().includes(query) ||
        business.canvassedBy?.toLowerCase().includes(query) ||
        business.visitOutcome?.toLowerCase().includes(query) ||
        business.notes?.toLowerCase().includes(query) ||
        business.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    });
  }, [businesses, selectedCompany, searchQuery]);
  
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
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
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
        setEditNotes(Array.isArray(b.notes) 
          ? b.notes.map(note => typeof note === 'string' ? note : note.text).join('\n') 
          : (b.notes || ''));
        // Scroll to the business after a short delay to ensure rendering
        setTimeout(() => {
          scrollToBusiness(b.id);
        }, 200);
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
    setEditNotes(Array.isArray(b.notes) 
      ? b.notes.map(note => typeof note === 'string' ? note : note.text).join('\n') 
      : (b.notes || ''));
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
    setPhoneError('');
    setEmailError('');
  };

  const clearSearch = () => {
    setSearchQuery('');
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
    
    // Validate phone number
    const phoneErrorMsg = getPhoneError(editContactPhone);
    if (phoneErrorMsg) {
      Alert.alert('Invalid Phone Number', phoneErrorMsg);
      return;
    }
    
    // Validate email
    const emailErrorMsg = getEmailError(editContactEmail);
    if (emailErrorMsg) {
      Alert.alert('Invalid Email', emailErrorMsg);
      return;
    }
    
    const newTags = editTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    // When saving, convert editNotes to an array of note objects (split by newlines, filter empty)
    const notesArray = editNotes
      ? editNotes.split('\n').map(n => n.trim()).filter(n => n.length > 0).map(text => ({
          text,
          timestamp: new Date().toISOString()
        }))
      : [];
    // Find the old business for comparison
    const oldBusiness = businesses.find(b => b.id === editingId);
    const changes = [];
    function changeMsg(field, oldVal, newVal) {
      const oldEmpty = !oldVal || String(oldVal).trim() === '';
      const newEmpty = !newVal || String(newVal).trim() === '';
      if (oldEmpty && !newEmpty) return `added ${field} '${newVal}'`;
      if (!oldEmpty && newEmpty) return `removed ${field} '${oldVal}'`;
      if (!oldEmpty && !newEmpty && oldVal !== newVal) return `changed ${field} from '${oldVal}' to '${newVal}'`;
      return null;
    }
    if (oldBusiness) {
      const nameMsg = changeMsg('name', oldBusiness.name, editName); if (nameMsg) changes.push(nameMsg);
      const statusMsg = changeMsg('status', oldBusiness.status, editStatus); if (statusMsg) changes.push(statusMsg);
      const addressMsg = changeMsg('address', oldBusiness.address, editAddress); if (addressMsg) changes.push(addressMsg);
      const contactNameMsg = changeMsg('contact name', oldBusiness.contactName, editContactName); if (contactNameMsg) changes.push(contactNameMsg);
      const contactPhoneMsg = changeMsg('contact phone', oldBusiness.contactPhone, editContactPhone); if (contactPhoneMsg) changes.push(contactPhoneMsg);
      const contactEmailMsg = changeMsg('contact email', oldBusiness.contactEmail, editContactEmail); if (contactEmailMsg) changes.push(contactEmailMsg);
      const lastContactedMsg = changeMsg('last contacted', oldBusiness.lastContacted, editLastContacted); if (lastContactedMsg) changes.push(lastContactedMsg);
      const canvassedByMsg = changeMsg('canvassed by', oldBusiness.canvassedBy, editCanvassedBy); if (canvassedByMsg) changes.push(canvassedByMsg);
      const visitOutcomeMsg = changeMsg('visit outcome', oldBusiness.visitOutcome, editVisitOutcome); if (visitOutcomeMsg) changes.push(visitOutcomeMsg);
      if (oldBusiness.notes !== notesArray) {
        if ((!oldBusiness.notes || oldBusiness.notes.length === 0) && notesArray.length > 0) changes.push(`added notes`);
        else if (oldBusiness.notes && oldBusiness.notes.length > 0 && notesArray.length === 0) changes.push(`removed notes`);
        else if (oldBusiness.notes && notesArray.length > 0) changes.push(`changed notes`);
      }
      if (JSON.stringify(oldBusiness.tags) !== JSON.stringify(newTags)) {
        if ((!oldBusiness.tags || oldBusiness.tags.length === 0) && newTags.length > 0) changes.push('added tags');
        else if (oldBusiness.tags && oldBusiness.tags.length > 0 && newTags.length === 0) changes.push('removed tags');
        else changes.push('changed tags');
      }
    }
    let newHistory = oldBusiness && oldBusiness.history ? [...oldBusiness.history] : [];
    if (changes.length > 0) {
      newHistory = [
        ...newHistory,
        {
          type: 'edit',
          date: new Date().toISOString(),
          notes: changes.join(', '),
        },
      ];
    }
    setBusinesses(prev => prev.map(b => b.id === editingId ? { 
      ...b, 
      name: editName, 
      status: editStatus, 
      address: editAddress, 
      contactName: editContactName, 
      contactPhone: editContactPhone, 
      contactEmail: editContactEmail, 
      lastContacted: editLastContacted, 
      canvassedBy: editCanvassedBy, 
      visitOutcome: editVisitOutcome, 
      tags: newTags, 
      notes: notesArray,
      lastModified: new Date().toISOString(),
      history: newHistory,
    } : b));
    cancelEdit();
  };

  // When a business is selected
  const handleSelectBusiness = (business) => {
    setSelectedBusiness(business);
    if (Platform.OS === 'web') {
      // Sidebar will show
    } else {
      setModalVisible(true);
    }
  };

  const handleShowActivity = (business) => {
    setSelectedBusiness(business);
    if (Platform.OS === 'web') {
      // Sidebar will show
    } else {
      setModalVisible(true);
    }
  };

  const handleAddActivity = (entry) => {
    if (!selectedBusiness) return;
    setBusinesses(prev => prev.map(b => b.id === selectedBusiness.id ? {
      ...b,
      history: [...(b.history || []), entry],
      lastModified: new Date().toISOString(),
    } : b));
    // Update selectedBusiness in state to reflect new history
    setSelectedBusiness(prev => prev ? { ...prev, history: [...(prev.history || []), entry] } : prev);
  };

  const handleAddNote = (note) => {
    if (!selectedBusiness) return;
    setBusinesses(prev => prev.map(b => b.id === selectedBusiness.id ? {
      ...b,
      notes: [...(b.notes || []), note],
      lastModified: new Date().toISOString(),
    } : b));
    setSelectedBusiness(prev => prev ? { ...prev, notes: [...(prev.notes || []), note] } : prev);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Businesses for {company?.name}</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#6c757d" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search businesses..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          {searchQuery.length > 0 && (
            <Text style={styles.searchResults}>
              Found {filteredBusinesses.length} business{filteredBusinesses.length !== 1 ? 'es' : ''}
            </Text>
          )}
        </View>
      </View>
      
      {filteredBusinesses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business" size={48} color="#6c757d" />
          <Text style={styles.emptyStateText}>No businesses for this company.</Text>
        </View>
      ) : (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.businessList}
          contentContainerStyle={styles.businessListContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.businessGrid}>
            {filteredBusinesses.map(b => (
              <View 
                key={b.id} 
                style={dynamicBusinessCardStyle}
              >
              {editingId === b.id ? (
                <View style={styles.editForm}>
                  <TextInput
                    style={styles.formInput}
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
                      style={styles.selectInput}
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="pending">Pending</option>
                    </select>
                  ) : (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={editStatus}
                        onValueChange={setEditStatus}
                        style={styles.picker}
                      >
                        <Picker.Item label="Open" value="open" color={STATUS_COLORS.open} />
                        <Picker.Item label="Closed" value="closed" color={STATUS_COLORS.closed} />
                        <Picker.Item label="Pending" value="pending" color={STATUS_COLORS.pending} />
                      </Picker>
                    </View>
                  )}
                  <TextInput
                    style={styles.formInput}
                    value={editAddress}
                    onChangeText={setEditAddress}
                    placeholder="Address"
                  />
                  <TextInput
                    style={styles.formInput}
                    value={editContactName}
                    onChangeText={setEditContactName}
                    placeholder="Contact Name"
                  />
                  <TextInput
                    style={[styles.formInput, phoneError && styles.errorInput]}
                    value={editContactPhone}
                    onChangeText={(text) => {
                      setEditContactPhone(text);
                      setPhoneError(getPhoneError(text));
                    }}
                    placeholder="Contact Phone (e.g., (123) 456-7890)"
                    keyboardType="phone-pad"
                  />
                  {phoneError ? (
                    <Text style={styles.errorText}>{phoneError}</Text>
                  ) : null}
                  <TextInput
                    style={[styles.formInput, emailError && styles.errorInput]}
                    value={editContactEmail}
                    onChangeText={(text) => {
                      setEditContactEmail(text);
                      setEmailError(getEmailError(text));
                    }}
                    placeholder="Contact Email"
                    keyboardType="email-address"
                  />
                  {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                  ) : null}
                  <TextInput
                    style={styles.formInput}
                    value={editLastContacted}
                    onChangeText={setEditLastContacted}
                    placeholder="Last Contacted (YYYY-MM-DD)"
                  />
                  <TextInput
                    style={styles.formInput}
                    value={editCanvassedBy}
                    onChangeText={setEditCanvassedBy}
                    placeholder="Canvassed By"
                  />
                  <TextInput
                    style={styles.formInput}
                    value={editVisitOutcome}
                    onChangeText={setEditVisitOutcome}
                    placeholder="Visit Outcome"
                  />
                  <TextInput
                    style={styles.formInput}
                    value={editTags}
                    onChangeText={setEditTags}
                    placeholder="Tags (comma separated)"
                  />
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    value={editNotes}
                    onChangeText={setEditNotes}
                    placeholder="Notes"
                    multiline
                  />
                  <View style={styles.formButtons}>
                    <TouchableOpacity onPress={saveEdit} style={[styles.formButton, styles.saveButton]}>
                      <Text style={styles.formButtonText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={cancelEdit} style={[styles.formButton, styles.cancelButton]}>
                      <Text style={styles.formButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.businessInfo}>
                  <View style={styles.businessHeader}>
                    <Text style={styles.businessName}>{b.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[b.status] }]}>
                      <Text style={styles.statusText}>{b.status}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.coordinatesText}>
                    {b.latlng.latitude.toFixed(5)}, {b.latlng.longitude.toFixed(5)}
                  </Text>
                  
                  {hasValue(b.address) && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={16} color="#6c757d" />
                      <Text style={styles.detailText}>{b.address}</Text>
                    </View>
                  )}
                  
                  {(hasValue(b.contactName) || hasValue(b.contactPhone)) && (
                    <View style={styles.detailRow}>
                      <Ionicons name="person" size={16} color="#6c757d" />
                      <Text style={styles.detailText}>
                        {b.contactName}
                        {hasValue(b.contactPhone) ? ` (${formatPhoneNumber(b.contactPhone)})` : ''}
                      </Text>
                    </View>
                  )}
                  
                  {hasValue(b.contactEmail) && (
                    <View style={styles.detailRow}>
                      <Ionicons name="mail" size={16} color="#6c757d" />
                      <Text style={styles.detailText}>{b.contactEmail}</Text>
                    </View>
                  )}
                  
                  {hasValue(b.lastContacted) && (
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={16} color="#6c757d" />
                      <Text style={styles.detailText}>Last Contacted: {b.lastContacted}</Text>
                    </View>
                  )}
                  
                  {hasValue(b.canvassedBy) && (
                    <View style={styles.detailRow}>
                      <Ionicons name="person-circle" size={16} color="#6c757d" />
                      <Text style={styles.detailText}>Canvassed By: {b.canvassedBy}</Text>
                    </View>
                  )}
                  
                  {hasValue(b.visitOutcome) && (
                    <View style={styles.detailRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#6c757d" />
                      <Text style={styles.detailText}>Outcome: {b.visitOutcome}</Text>
                    </View>
                  )}
                  
                  {hasValue(b.tags) && (
                    <View style={styles.detailRow}>
                      <Ionicons name="pricetag" size={16} color="#6c757d" />
                      <Text style={styles.detailText}>Tags: {b.tags.join(', ')}</Text>
                    </View>
                  )}
                  
                  {hasValue(b.notes) && Array.isArray(b.notes) && b.notes.length > 0 && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text" size={16} color="#6c757d" />
                      <Text style={styles.detailText}>
                        Notes: {b.notes.map(note => typeof note === 'string' ? note : note.text).join('; ')}
                      </Text>
                    </View>
                  )}
                  
                  {hasValue(b.notes) && !Array.isArray(b.notes) && (
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text" size={16} color="#6c757d" />
                      <Text style={styles.detailText}>Notes: {b.notes}</Text>
                    </View>
                  )}
                  
                  {b.lastModified && (
                    <Text style={styles.modifiedText}>
                      Modified: {new Date(b.lastModified).toLocaleString()}
                    </Text>
                  )}
                </View>
              )}
              
              {editingId !== b.id && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editActionButton]}
                    onPress={() => startEdit(b)}
                  >
                    <Ionicons name="create" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.viewActionButton]}
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        // For web, use the enhanced navigation with timeout
                        navigation.setParams({}); // Clear any existing params first
                        setTimeout(() => {
                          navigation.navigate('Map', { 
                            selectBusinessId: b.id, 
                            centerMapTo: b.latlng,
                            forceZoom: 18, // Force specific zoom level
                            _t: Date.now() // Add timestamp to ensure params are seen as new
                          });
                        }, 0);
                      } else {
                        // For native, use simple navigation
                        navigation.navigate('Map', { 
                          selectBusinessId: b.id, 
                          centerMapTo: b.latlng
                        });
                      }
                    }}
                  >
                    <Ionicons name="map" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.activityActionButton]}
                    onPress={() => handleShowActivity(b)}
                  >
                    <Ionicons name="list" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Activity & Notes</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteActionButton]}
                    onPress={() => {
                      Alert.alert('Delete Business', 'Are you sure you want to delete this business?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteBusiness(b.id) },
                      ]);
                    }}
                  >
                    <Ionicons name="trash" size={16} color="#fff" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
          </View>
        </ScrollView>
      )}
      
      {/* Sidebar for web */}
      {Platform.OS === 'web' && selectedBusiness && (
        <View style={styles.webSidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>{selectedBusiness.name}</Text>
            <TouchableOpacity onPress={() => setSelectedBusiness(null)} style={styles.sidebarCloseButton}>
              <Ionicons name="close" size={24} color="#6c757d" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sidebarAddress}>{selectedBusiness.address}</Text>
          <NotesSection notes={selectedBusiness.notes || []} onAdd={handleAddNote} />
          <BusinessActivity history={selectedBusiness.history} onAdd={handleAddActivity} />
        </View>
      )}
      
      {/* Modal for mobile */}
      {Platform.OS !== 'web' && (
        <Modal 
          visible={modalVisible} 
          animationType="slide" 
          transparent={false}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            {selectedBusiness && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedBusiness.name}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                    <Ionicons name="close" size={24} color="#6c757d" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalAddress}>{selectedBusiness.address || 'No address'}</Text>
                <ScrollView style={styles.modalContent}>
                  <NotesSection notes={selectedBusiness.notes || []} onAdd={handleAddNote} />
                  <BusinessActivity history={selectedBusiness.history} onAdd={handleAddActivity} />
                </ScrollView>
              </>
            )}
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 20,
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    width: Platform.OS === 'web' ? 400 : '100%',
    alignSelf: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  clearButton: {
    padding: 4,
  },
  searchResults: {
    marginTop: 8,
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  businessList: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  businessListContent: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
  },
  businessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    height: 'fit-content',
    minWidth: 400,
    maxWidth: 600,
    width: '100%',
    ...(Platform.OS === 'web' && {
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
    }),
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
    lineHeight: 22,
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'capitalize',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 4,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    lineHeight: 18,
  },
  modifiedText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 12,
    fontStyle: 'italic',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    flexWrap: 'wrap',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    marginVertical: 2,
    flex: 1,
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  editActionButton: {
    backgroundColor: '#007bff',
  },
  viewActionButton: {
    backgroundColor: '#6c63ff',
  },
  activityActionButton: {
    backgroundColor: '#ffa500',
  },
  deleteActionButton: {
    backgroundColor: '#dc3545',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
    marginLeft: 4,
  },
  editForm: {
    marginBottom: 16,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  errorInput: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '100%',
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    width: '100%',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  formButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Activity and Notes styles
  activityContainer: {
    padding: 16,
  },
  notesContainer: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 12,
    color: '#2c3e50',
  },
  addButton: {
    marginBottom: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  addForm: {
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  formLabel: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#2c3e50',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyText: {
    color: '#6c757d',
    margin: 8,
    fontStyle: 'italic',
  },
  activityEntry: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
    paddingBottom: 8,
  },
  activityTitle: {
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  activityNotes: {
    color: '#495057',
    marginBottom: 4,
  },
  activityUser: {
    color: '#6c757d',
    fontSize: 12,
  },
  noteCard: {
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f8f9fa',
  },
  selectedNoteCard: {
    borderLeftColor: '#007bff',
  },
  noteText: {
    color: '#2c3e50',
    lineHeight: 20,
  },
  noteTimestamp: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Web sidebar styles
  webSidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100%',
    width: 350,
    backgroundColor: '#fafafa',
    borderLeftWidth: 1,
    borderColor: '#e9ecef',
    padding: 16,
    paddingBottom: 40, // Extra padding to prevent cutoff
    zIndex: 100,
    marginTop: 60,
    overflow: 'auto',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  sidebarCloseButton: {
    padding: 4,
  },
  sidebarAddress: {
    color: '#6c757d',
    marginBottom: 16,
    fontSize: 14,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalAddress: {
    color: '#6c757d',
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  modalContent: {
    flex: 1,
  },
}); 