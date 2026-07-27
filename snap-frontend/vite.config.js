import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Acta Inteligente',
        short_name: 'Acta IA',
        description: 'Diligenciamiento de actas de inspección previa con IA',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        // TODO: reemplazar por íconos PNG de marca (192x192 y 512x512) antes de distribuir el piloto.
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      // El app shell se cachea para que la app siempre abra aunque no haya señal;
      // los datos de la inspección viven en IndexedDB (ver Fase 4), no aquí.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
});
