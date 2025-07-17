import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const STATUS_COLORS = {
  open: 'green',
  closed: 'red',
  pending: 'orange',
};

const initialCompanies = [
  { id: '1', name: 'Company A', color: '#e3f2fd', customPinIcon: null },
  { id: '2', name: 'Company B', color: '#f3e5f5', customPinIcon: null },
];
const initialBusinesses = [
  { id: 'b1', companyId: '1', name: 'Business 1', status: 'open', latlng: { latitude: 37.78825, longitude: -122.4324 },
    address: '123 Address St', contactName: 'Bob Smith', contactPhone: '1234567890', contactEmail: '', notes: [],
    lastContacted: '', canvassedBy: '', visitOutcome: '', tags: [], lastModified: new Date().toISOString(),
    history: [] },
  { id: 'b2', companyId: '1', name: 'Business 2', status: 'closed', latlng: { latitude: 37.78925, longitude: -122.4334 },
    address: '456 Address St', contactName: 'John Doe', contactPhone: '1234567890', contactEmail: '', notes: [],
    lastContacted: '', canvassedBy: '', visitOutcome: '', tags: [], lastModified: new Date().toISOString(),
    history: [] },
  { id: 'b3', companyId: '2', name: 'Business 3', status: 'pending', latlng: { latitude: 37.79025, longitude: -122.4344 },
    address: '789 Address St', contactName: 'Test Name', contactPhone: '1234567890', contactEmail: '', notes: ['Test Notes'],
    lastContacted: '', canvassedBy: '', visitOutcome: '', tags: [], lastModified: new Date().toISOString(),
    history: [] },
];

const ICONS_DIR = FileSystem.documentDirectory + 'company_icons/';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [selectedCompany, setSelectedCompany] = useState(initialCompanies[0].id);

  const addCompany = (name, color = '#f5f5f5') => {
    const id = Math.random().toString(36).slice(2, 10);
    setCompanies(prev => [...prev, { id, name, color }]);
  };
  const deleteCompany = (id) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
    setBusinesses(prev => prev.filter(b => b.companyId !== id));
    if (selectedCompany === id && companies.length > 1) {
      setSelectedCompany(companies.find(c => c.id !== id)?.id || '');
    }
  };
  const addBusiness = (business) => {
    setBusinesses(prev => [...prev, {
      address: '', contactName: '', contactPhone: '', contactEmail: '', notes: [], lastContacted: '', canvassedBy: '', 
      visitOutcome: '', tags: [], lastModified: new Date().toISOString(), history: [],
      ...business
    }]);
  };
  const deleteBusiness = (id) => {
    setBusinesses(prev => prev.filter(b => b.id !== id));
  };

  // Load custom icons from local storage on mount
  useEffect(() => {
    (async () => {
      try {
        const dirInfo = await FileSystem.getInfoAsync(ICONS_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(ICONS_DIR, { intermediates: true });
        }
        // Load icons for each company
        const updatedCompanies = await Promise.all(companies.map(async (company) => {
          const iconPath = ICONS_DIR + company.id + '.svg';
          const iconInfo = await FileSystem.getInfoAsync(iconPath);
          if (iconInfo.exists) {
            const base64 = await FileSystem.readAsStringAsync(iconPath, { encoding: FileSystem.EncodingType.Base64 });
            return { ...company, customPinIcon: base64 };
          }
          return { ...company, customPinIcon: null };
        }));
        setCompanies(updatedCompanies);
      } catch (e) {
        // fail silently
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set or update a company's custom SVG icon (base64 string)
  const setCompanyIcon = async (companyId, base64Svg) => {
    const iconPath = ICONS_DIR + companyId + '.svg';
    try {
      if (Platform.OS === 'web') {
        // On web, just update state (optionally persist to localStorage)
        console.log('setCompanyIcon (web) called for', companyId, 'with base64Svg:', base64Svg ? base64Svg.slice(0, 100) + '...' : null);
        setCompanies(prev => {
          const updated = prev.map(c => c.id === companyId ? { ...c, customPinIcon: base64Svg } : c);
          console.log('setCompanies (web) new value:', updated);
          // Optionally persist to localStorage here
          return updated;
        });
        return;
      }
      // Native: persist to FileSystem
      if (base64Svg) {
        await FileSystem.writeAsStringAsync(iconPath, base64Svg, { encoding: FileSystem.EncodingType.Base64 });
      } else {
        await FileSystem.deleteAsync(iconPath, { idempotent: true });
      }
      console.log('setCompanyIcon (native) called for', companyId, 'with base64Svg:', base64Svg ? base64Svg.slice(0, 100) + '...' : null);
      setCompanies(prev => {
        const updated = prev.map(c => c.id === companyId ? { ...c, customPinIcon: base64Svg } : c);
        console.log('setCompanies (native) new value:', updated);
        return updated;
      });
    } catch (e) {
      console.log('setCompanyIcon error:', e);
    }
  };

  return (
    <AppContext.Provider value={{
      companies, setCompanies, addCompany, deleteCompany,
      businesses, setBusinesses, addBusiness, deleteBusiness,
      selectedCompany, setSelectedCompany,
      setCompanyIcon, // <-- expose setter
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
} 