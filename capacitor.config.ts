import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dustin.lift',
  appName: 'Lift',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  server: {
    // Allow navigation to Supabase URLs for OAuth
    allowNavigation: ['*.supabase.co'],
  },
};

export default config;
