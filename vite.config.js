import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(resolve('./package.json'), 'utf-8'));

export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify(pkg.version)
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  plugins: [
    {
      name: 'inject-version-into-sw',
      generateBundle() {
        const swPath = resolve('./dist/sw.js');
        if (existsSync(swPath)) {
          let swContent = readFileSync(swPath, 'utf-8');
          swContent = swContent.replace(
            /__APP_VERSION__/g,
            pkg.version
          );
          writeFileSync(swPath, swContent);
        }
      }
    }
  ]
});
