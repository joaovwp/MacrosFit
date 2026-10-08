import { defineConfig } from 'vite';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  plugins: [
    {
      name: 'copy-root-files',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        
        // Copiar manifest.json
        copyFileSync(resolve(__dirname, 'manifest.json'), resolve(distDir, 'manifest.json'));
        
        // Copiar sw.js
        copyFileSync(resolve(__dirname, 'sw.js'), resolve(distDir, 'sw.js'));
        
        // Copiar styles.css
        copyFileSync(resolve(__dirname, 'styles.css'), resolve(distDir, 'styles.css'));
      }
    }
  ]
});
