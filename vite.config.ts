import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'figma:asset/bd0ba0dde8ea2ed297622509a224c3d91edb164b.png': path.resolve(
        __dirname,
        './src/assets/bd0ba0dde8ea2ed297622509a224c3d91edb164b.png',
      ),
      '@': path.resolve(__dirname, './src'),
      src: path.resolve(__dirname, './src'),
      core: path.resolve(__dirname, './src/core'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/analytics'],
          'ui-vendor': ['motion/react', 'lucide-react'],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
