import { registerRootComponent } from 'expo';
import App from './App';
import { AppProvider } from './context/AppContext';
import React from 'react';

// Suppress console logs for move events at the very beginning
if (typeof console !== 'undefined') {
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('received') && (message.includes('onMoveStart') || 
      message.includes('onMoveEnd') || message.includes('onZoomStart') ||
      message.includes('onZoomEnd') || message.includes('onMove') ||
      message.includes('onZoom') || message.includes('onDragStart') ||
      message.includes('onDragEnd') || message.includes('onDrag') ||
      message.includes('onZoom') || message.includes('onDragStart') ||
      message.includes('mapMarkers')
    )) {
      return; // Suppress move event logs
    }
    return;
    originalConsoleLog.apply(console, args);
  };
}

function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

registerRootComponent(Root);
