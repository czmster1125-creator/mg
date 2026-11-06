import { defineConfig } from 'vite';
export default defineConfig({build:{chunkSizeWarningLimit:700,rollupOptions:{output:{manualChunks:(id)=>id.includes('/node_modules/three/')?'three':undefined}}},server:{host:'0.0.0.0'}});
