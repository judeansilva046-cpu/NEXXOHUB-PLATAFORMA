import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'lib/validations/{clinic,company,employee}.ts',
        'lib/{finance,utils}.ts',
        'components/ui/{button,card,input}.tsx',
      ],
      exclude: [
        'node_modules/',
        'vitest.setup.ts',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/dist/**',
        '.next/**',
        '.netlify/**',
        'coverage/**',
        'output/**',
        'tmp/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules', 'dist', '.idea', '.git', '.cache', '.next'],
  },
  resolve: {
    alias: {
      '@': projectRoot,
    },
  },
});
