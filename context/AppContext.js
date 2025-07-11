import React, { createContext, useContext, useState } from 'react';

const STATUS_COLORS = {
  open: 'green',
  closed: 'red',
  pending: 'orange',
};

const initialCompanies = [
  { id: '1', name: 'Company A', color: '#e3f2fd' },
  { id: '2', name: 'Company B', color: '#f3e5f5' },
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

  return (
    <AppContext.Provider value={{
      companies, setCompanies, addCompany, deleteCompany,
      businesses, setBusinesses, addBusiness, deleteBusiness,
      selectedCompany, setSelectedCompany,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
} 