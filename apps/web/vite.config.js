import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [
        react(),
    ],
    resolve: {
        alias: {
            '@mafia/shared': path.resolve(__dirname, '../../packages/shared'),
        },
    },
    server: {
        port: 5173,
        host: true
    },
    build: {
        sourcemap: false, // Prevent leaking source code structure
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
    }
});
