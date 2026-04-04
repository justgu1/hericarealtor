import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

const isDev = process.env.APP_ENV !== 'production';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: isDev, // só faz hot reload no dev
        }),
        react(),
    ],
    server: {
        host: '0.0.0.0',         // expõe para a rede / container
        port: 5173,
        strictPort: true,
        watch: {
            usePolling: true,    // útil dentro do Docker
        },
        hmr: isDev
            ? {
                  host: process.env.VITE_HOST || 'localhost', // hostname que o navegador acessa
                  protocol: 'ws',
                  port: 5173,
              }
            : false,
        cors: true,
    },
});