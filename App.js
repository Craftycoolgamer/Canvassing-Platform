import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapScreen from './screens/MapScreen';
import BusinessListScreen from './screens/BusinessListScreen';
import SettingsScreen from './screens/SettingsScreen';
import { useAppContext } from './context/AppContext.js';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

function CompanyHeaderRight() {
  const { companies, selectedCompany } = useAppContext();
  const company = companies.find(c => c.id === selectedCompany);
  const colors = company ? { 
    background: company.color, 
    text: '#2c3e50' 
  } : { 
    background: '#f8f9fa', 
    text: '#6c757d' 
  };
  
  return (
    <View style={[styles.companyBadge, { backgroundColor: colors.background }]}>
      <Text style={[styles.companyText, { color: colors.text }]}>
        {company ? company.name : 'Select Company'}
      </Text>
    </View>
  );
}

function AppWithHeader() {
  const { companies, selectedCompany } = useAppContext();
  const company = companies.find(c => c.id === selectedCompany);
  const colors = company ? { 
    background: company.color, 
    text: '#2c3e50' 
  } : { 
    background: '#f8f9fa', 
    text: '#6c757d' 
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerRight: () => <CompanyHeaderRight />,
          headerStyle: {
            backgroundColor: colors.background,
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
            borderBottomWidth: 0,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: 'rgba(0,0,0,0.1)',
            borderTopWidth: 1,
            elevation: 8,
            shadowOpacity: 0.1,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: -2 },
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: 'rgba(108, 117, 125, 0.6)',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginTop: 4,
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Map') {
              iconName = focused ? 'map' : 'map-outline';
            } else if (route.name === 'Business List') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen 
          name="Map" 
          component={MapScreen}
          options={{
            title: 'Map View',
          }}
        />
        <Tab.Screen 
          name="Business List" 
          component={BusinessListScreen}
          options={{
            title: 'Businesses',
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            title: 'Settings',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  companyBadge: {
    marginRight: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  companyText: {
    fontWeight: '600',
    fontSize: 14,
  },
});

export default AppWithHeader; 