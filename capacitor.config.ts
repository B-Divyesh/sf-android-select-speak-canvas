import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.sociobot.tapreadcanvas',
  appName: 'TapRead Canvas',
  webDir: 'dist',
  backgroundColor: '#F2E7CE',
  android: {
    allowMixedContent: false,
    backgroundColor: '#F2E7CE',
  },
};

export default config;
