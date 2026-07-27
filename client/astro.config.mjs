/*
 *  ------------------------------------------------------------  *
 *  -----  astro.config.mjs  --  /client/astro.config.mjs  -----  *
 *  ------------------------------------------------------------  *
 */
// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    vite: {
        server: {
            proxy: {
                // En desarrollo, redirige las llamadas a la API del servidor Express
                '/api': 'http://localhost:3001',
            },
        },
    },
});
