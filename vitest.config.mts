import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Bez ovog aliasa domenski moduli koji koriste `@/` import ne mogu imati test.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
