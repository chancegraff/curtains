/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'bin/**/*.test.ts', 'e2e/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/**/*.ts'
      ],
      exclude: [
        'node_modules',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/test-*.ts'
      ]
    }
  }
})
