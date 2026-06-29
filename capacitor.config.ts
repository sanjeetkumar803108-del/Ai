import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sanjeet.formmitra',
  appName: 'form mitra ai',
  webDir: 'dist',
  server: {
    url: 'https://ai-one-rust-97.vercel.app',
    cleartext: true,
    androidScheme: 'https',
    hostname: 'ai-one-rust-97.vercel.app'
  }
};

export default config;