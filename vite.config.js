import { defineConfig } from 'vite';

export default defineConfig({
  // Build configuration for embeddable library
  build: {
    lib: {
      entry: 'src/MassSpringViz.js',
      name: 'MassSpringViz',
      fileName: 'mass-spring-embed',
      formats: ['umd', 'es']
    },
    rollupOptions: {
      output: {
        // Ensure globals is an empty object for self-contained bundle
        globals: {}
      }
    },
    // Source maps for debugging
    sourcemap: true,
    // Target modern browsers
    target: 'es2015',
    // Minify for production
    minify: 'terser'
  },

  // Test configuration with Vitest
  test: {
    // Test environment (jsdom for DOM tests, node for pure JS)
    environment: 'node',

    // Include test files
    include: ['tests/**/*.test.js'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js']
    },

    // Global test timeout
    testTimeout: 10000,

    // Show detailed output
    reporters: ['verbose']
  }
});
