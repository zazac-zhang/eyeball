import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  base: (() => {
    if (!process.env.GITHUB_ACTIONS) return '/';
    const repo = process.env.GITHUB_REPOSITORY ?? '';
    const name = repo.split('/')[1] ?? '';
    return `/${name}/`;
  })(),
  plugins: [react(), tailwindcss()],
});
