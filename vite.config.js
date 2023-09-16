import { rmSync } from 'node:fs';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import pkg from './package.json';
// https://vitejs.dev/config/
// @ts-ignore
export default defineConfig(function (_a) {
    var command = _a.command;
    rmSync('dist-electron', { recursive: true, force: true });
    var isServe = command === 'serve';
    var isBuild = command === 'build';
    var sourcemap = isServe || !!process.env.VSCODE_DEBUG;
    return {
        plugins: [
            vue({}),
            electron([
                {
                    // Main-Process entry file of the Electron App.
                    entry: 'electron/main/index.ts',
                    onstart: function (options) {
                        if (process.env.VSCODE_DEBUG) {
                            console.log(/* For `.vscode/.debug.script.mjs` */ '[startup] Electron App');
                        }
                        else {
                            options.startup();
                        }
                    },
                    vite: {
                        build: {
                            sourcemap: sourcemap,
                            minify: isBuild,
                            outDir: 'dist-electron/main',
                            rollupOptions: {
                                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                            },
                        },
                    },
                },
                {
                    entry: 'electron/preload/index.ts',
                    onstart: function (options) {
                        // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
                        // instead of restarting the entire Electron App.
                        options.reload();
                    },
                    vite: {
                        build: {
                            sourcemap: sourcemap ? 'inline' : undefined,
                            minify: isBuild,
                            outDir: 'dist-electron/preload',
                            rollupOptions: {
                                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                            },
                        },
                    },
                }
            ]),
            // Use Node.js API in the Renderer-process
            renderer(),
        ],
        server: {
            host: "127.0.0.1",
            port: 50023
        },
        clearScreen: false,
    };
});
