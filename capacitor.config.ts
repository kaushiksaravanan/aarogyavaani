import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.launchforge.starter',
  appName: 'LaunchForge',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
  },
  android: {
    minWebViewVersion: 90,
    usesCleartextTraffic: false,
  },
};

export default config;
