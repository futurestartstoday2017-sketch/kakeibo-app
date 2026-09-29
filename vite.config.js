import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 開発時は /api へのリクエストをバックエンド（Express）に転送する
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
