import { registerRootComponent } from 'expo';
import App from './App';
import { AppProvider } from './context/AppContext';
import React from 'react';

function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

registerRootComponent(Root);
