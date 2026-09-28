import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The Mapbox map library is one large file (about 1.7 MB) that can't be
    // split. It only downloads on pages that show a map, so don't warn about it.
    chunkSizeWarningLimit: 1800,
  },
})
