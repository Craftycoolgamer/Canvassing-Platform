import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { PendingApprovalScreen } from './src/screens/PendingApprovalScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, refreshAuth, user, logout } = useAuth();

  const handleAuthSuccess = async () => {
    console.log('Auth success callback triggered');
    // Force a refresh of the auth state
    await refreshAuth();
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  console.log('AppContent render - isAuthenticated:', isAuthenticated, 'user:', user);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {isAuthenticated ? (
        user && !user.isApproved && user.role !== 'Admin' ? (
          <PendingApprovalScreen onLogout={handleLogout} />
        ) : (
          <AppNavigator />
        )
      ) : (
        <AuthNavigator onAuthSuccess={handleAuthSuccess} />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});
