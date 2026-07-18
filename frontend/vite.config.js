// vite.config.js
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
      injectRegister: 'auto',
      // Enable PWA features on localhost dev server
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Freakasutra Intimacy Guide',
        short_name: 'Freakasutra',
        description: 'Gamified intimacy card decks with secure cloud-sync backup.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'https://placehold.co/192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://placehold.co/512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});