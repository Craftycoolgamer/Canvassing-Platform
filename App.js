import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MapScreen from './screens/MapScreen';
import BusinessListScreen from './screens/BusinessListScreen';
import SettingsScreen from './screens/SettingsScreen';
import { useAppContext } from './context/AppContext.js';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

function CompanyHeaderRight() {
  const { companies, selectedCompany } = useAppContext();
  const company = companies.find(c => c.id === selectedCompany);
  return (
    <View style={{ marginRight: 16 }}>
      <Text style={{ fontWeight: 'bold', color: '#007bff' }}>{company ? company.name : ''}</Text>
    </View>
  );
}

function AppWithHeader() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerRight: () => <CompanyHeaderRight />,
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
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Business List" component={BusinessListScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default AppWithHeader; 