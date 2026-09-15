import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default defineConfig(({ mode }) => {
  // depending on your application, base can also be "/"
  const env = loadEnv(mode, process.cwd(), '');
  const API_URL = env.VITE_APP_BASE_NAME || '/';
  const BACKEND_URL = process.env.VITE_BACKEND_URL || env.VITE_BACKEND_URL || 'http://127.0.0.1:8081';
  return {
    server: {
      port: 3001,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      clearScreen: false,
      watch: {
        usePolling: true,
        interval: 100,
        ignored: ['**/node_modules/**', '**/.git/**']
      },
      hmr: {
        overlay: false
      },
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              if (err.code !== 'ECONNRESET' && err.code !== 'ECONNABORTED') {
                console.warn('[Vite Proxy API]', err.message);
              }
            });
          }
        },
        '/ws': {
          target: BACKEND_URL,
          ws: true,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              const msg = err?.message || '';
              if (
                err.code !== 'ECONNRESET' &&
                err.code !== 'ECONNABORTED' &&
                err.code !== 'EPIPE' &&
                !msg.includes('This socket has been ended by the other party') &&
                !msg.includes('socket has been ended')
              ) {
                console.warn('[Vite Proxy WS]', msg);
              }
            });
          }
        }
      },
      warmup: {
        clientFiles: [
          './src/ui-component/bos/BOSDataTable.jsx',
          './src/ui-component/bos/BOSTableToolbar.jsx',
          './src/layout/MainLayout/index.jsx',
          './src/layout/MainLayout/Header/index.jsx',
          './src/layout/MainLayout/Sidebar/index.jsx'
        ]
      }
    },
    build: {
      chunkSizeWarningLimit: 1000,
      sourcemap: false,
      cssCodeSplit: true,
      // Inline files smaller than 4 KB directly into the bundle (saves extra HTTP round-trips)
      assetsInlineLimit: 4096,
      // Target modern browsers — smaller, faster output than the default 'modules'
      target: 'esnext',
      // esbuild is the fastest minifier (already the Vite default, made explicit)
      minify: 'esbuild',
      esbuild: {
        drop: ['console', 'debugger'],
        pure: ['console.log', 'console.info', 'console.debug', 'console.warn']
      },
      rollupOptions: {
        output: {
          /**
           * Manual chunk splitting strategy
           * ─────────────────────────────────
           * Goal: keep the *initial* JS that must be downloaded before anything
           * renders as small as possible (~200-300 KB) so even a 10 kbps user
           * sees the login screen within a few seconds.
           *
           * Heavy libraries are split into separate chunks that are only
           * downloaded when the relevant feature is first visited.
           */
          /* manualChunks removed to fix Rollup ESM-CommonJS interop with React 19 */
        }
      }
    },
    // Drop verbose console calls in dev builds too (keeps console.error/warn)
    esbuild: {
      ...(mode !== 'production' && {
        pure: ['console.log', 'console.info', 'console.debug']
      })
    },
    preview: {
      port: 3001,
      strictPort: true,
      open: false,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              if (err.code !== 'ECONNRESET' && err.code !== 'ECONNABORTED') {
                console.warn('[Vite Preview Proxy API]', err.message);
              }
            });
          }
        },
        '/ws': {
          target: BACKEND_URL,
          ws: true,
          changeOrigin: true,
          secure: false
        }
      }
    },
    define: {
      global: 'window',
      // Inject app version from package.json — used in Footer.jsx
      __APP_VERSION__: JSON.stringify(pkg.version)
    },
    resolve: {
      alias: {
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        App: path.resolve(__dirname, 'src/App'),
        store: path.resolve(__dirname, 'src/store'),
        serviceWorker: path.resolve(__dirname, 'src/serviceWorker'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        assets: path.resolve(__dirname, 'src/assets'),
        'ui-component': path.resolve(__dirname, 'src/ui-component'),
        'hooks': path.resolve(__dirname, 'src/hooks'),
        'views': path.resolve(__dirname, 'src/views'),
        'layout': path.resolve(__dirname, 'src/layout'),
        'utils': path.resolve(__dirname, 'src/utils'),
        'contexts': path.resolve(__dirname, 'src/contexts'),
        'menu-items': path.resolve(__dirname, 'src/menu-items'),
        'themes': path.resolve(__dirname, 'src/themes'),
        'config': path.resolve(__dirname, 'src/config'),
        'routes': path.resolve(__dirname, 'src/routes'),
        'metrics': path.resolve(__dirname, 'src/metrics'),
        'autonoma-common': path.resolve(__dirname, 'autonoma-common'),
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
        stream: path.resolve(__dirname, 'src/utils/stream-mock.js')
      }
    },
    base: API_URL,
    plugins: [react(), jsconfigPaths()],
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/material/styles',
        '@mui/icons-material',
        '@tabler/icons-react',
        '@emotion/react',
        '@emotion/styled',
        'formik',
        'yup',
        'axios',
        'react-redux',
        '@reduxjs/toolkit'
      ]
    }
  };
});
