import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // OPTIMIZACIONES SOLO PARA PRODUCCIÓN
  build: {
    cssCodeSplit: true,              // ✅ Activar splitting de CSS
    minify: 'esbuild',               // ✅ Minificar con esbuild
    sourcemap: false,                 // ✅ Sin source maps en prod

    // Code splitting inteligente
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            return 'vendor'
          }

          // Separar librerías grandes en chunks propios
          if (id.includes('framer-motion')) {
            return 'animations'
          }
          if (id.includes('lucide-react')) {
            return 'icons'
          }
          if (id.includes('axios')) {
            return 'http'
          }
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'entries/[name]-[hash].js'
      }
    },

    // Límite de chunk size APROPIADO para producción
    chunkSizeWarningLimit: 1000,  // ✅ 1000KB (no 600)
  },

  esbuild: {
    target: 'es2015',              // ✅ Target ES2015 para máxima compatibilidad
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },

  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg', '**/*.webp']
})