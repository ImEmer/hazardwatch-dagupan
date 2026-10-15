    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      optimizeDeps: {
        exclude: [],
      },
      worker: {
        format: 'es',
        plugins: () => [react()],
      },
      build: {
        assetsDir: 'assets',
        rollupOptions: {
          output: {
            manualChunks: undefined,
          },
        },
      },
      server: {
        watch: {
          usePolling: true,
        },
        proxy: {
          '/api': 'http://localhost:5000',
          '/uploads': 'http://localhost:5000',
        },
      },
    });
