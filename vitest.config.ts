import path from 'path';
import { defineConfig } from 'vitest/config';

// Standalone Vitest config (kept separate from vite.config.ts so the test
// runner doesn't pull in the Tailwind/React build plugins it doesn't need).
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // jsdom gives us `document`, `Blob`, anchor elements, etc. for the
    // browser-only persistence/file helpers.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/store/**', 'src/services/**', 'src/utils/**', 'src/three/ModelParser.ts'],
      reporter: ['text', 'html'],
    },
  },
});
