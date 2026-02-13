import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', '**/examples/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'examples/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'test-exports.js',
        'vitest.config.ts',
      ],
      all: true,
      lines: 90,
      functions: 90,
      branches: 85,
      statements: 90,
    },
  },
});
