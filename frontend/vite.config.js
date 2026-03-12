import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    publicDir: '../public',
    build: {
        outDir: 'dist',
        // aws-sdk v2 is intentionally bundled for the contact form SES integration;
        // suppress the >500 kB chunk warning rather than code-split a leaf route.
        chunkSizeWarningLimit: 4000,
        rollupOptions: {
            onwarn(warning, warn) {
                // aws-sdk v2 imports Node.js built-ins (util, url, etc.) that Vite
                // externalises for browser builds. This is expected behaviour and
                // the app polyfills what it needs via the `global: 'globalThis'`
                // define above. Suppress the noisy resolve warnings from aws-sdk.
                if (
                    warning.code === 'PLUGIN_WARNING' &&
                    warning.plugin === 'vite:resolve' &&
                    warning.message.includes('aws-sdk')
                ) {
                    return;
                }
                warn(warning);
            },
        },
    },
    define: {
        global: 'globalThis',
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            }
        }
    }
});
