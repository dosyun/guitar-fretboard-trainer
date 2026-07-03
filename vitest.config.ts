import { defineConfig } from 'vitest/config';

// テストは純関数ロジック中心（jsdom不要）。UI検証は Playwright 側で行う。
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
