import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ttstock.app',
  appName: 'TT Next App',
  webDir: 'out', // dossier statique exporté
  server: {
    androidScheme: 'https'
  }
};

export default config;
