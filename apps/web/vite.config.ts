import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// `base: './'` keeps every asset URL relative, so the build works under any subpath
// (GitHub Pages project site, a portfolio folder, a plain static server). Routing uses
// hash history, so a reload on an inner route never needs server-side rewrites.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Named vendor chunks: cacheable across releases and readable in the bundle report.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules[/](react|react-dom|scheduler)[/]/.test(id)) return 'vendor-react';
          if (id.includes('@tanstack')) return 'vendor-tanstack';
          if (id.includes('zod')) return 'vendor-zod';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    testTimeout: 30_000,
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
