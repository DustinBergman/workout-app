import { FC, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { migrateTemplates, migrateToUUIDs } from './store/useAppStore';
import { AuthProvider } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import { ModalProvider } from './contexts';
import { ErrorToastProvider } from './contexts/ErrorToastProvider';
import { MainLayout } from './components/layout';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { enqueueErrorToast } from './services/errorToast';

const App: FC = () => {
  // Run migrations once on app startup
  useEffect(() => {
    migrateTemplates();
    migrateToUUIDs();
  }, []);

  // Setup native platform features (iOS/Android)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Set status bar style for dark theme
      StatusBar.setStyle({ style: Style.Dark }).catch((error) => {
        console.error(error);
        enqueueErrorToast(error, 'Unable to configure the device status bar.');
      });

      // Handle deep links for OAuth callbacks
      CapApp.addListener('appUrlOpen', (event) => {
        console.log('Deep link received:', event.url);
        // The URL will be handled by Supabase auth automatically
      });
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        CapApp.removeAllListeners();
      }
    };
  }, []);

  return (
    <ErrorToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <SyncProvider>
            <ModalProvider>
              <MainLayout />
            </ModalProvider>
          </SyncProvider>
        </BrowserRouter>
      </AuthProvider>
    </ErrorToastProvider>
  );
}

export default App;
