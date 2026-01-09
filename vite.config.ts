import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

import { builtinModules } from 'node:module';
import { fileURLToPath, URL } from 'node:url';

const codemirrorExternals = [
    '@codemirror/autocomplete',
    '@codemirror/closebrackets',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/comment',
    '@codemirror/fold',
    '@codemirror/gutter',
    '@codemirror/highlight',
    '@codemirror/history',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/matchbrackets',
    '@codemirror/panel',
    '@codemirror/rangeset',
    '@codemirror/rectangular-selection',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/stream-parser',
    '@codemirror/text',
    '@codemirror/tooltip',
    '@codemirror/view',
];

const nodeBuiltins = [
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
];

export default defineConfig(({ mode }) => {
    const prod = mode === 'production';

    return {
        plugins: [vue(), vueJsx()],
        logLevel: 'info',

        // We won't actually use the dev server, but to avoid accidental use leading to HMR:
        // server.hmr can explicitly disable the HMR connection.
        server: {
            hmr: false,
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify(prod ? 'production' : 'development'),
        },

        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },

        build: {
            // Entry
            lib: {
                entry: 'src/main.ts',
                formats: ['cjs'],
            },

            // Output to the project root directory (generates ./main.js and ./styles.css)
            outDir: '.',
            emptyOutDir: false,
            copyPublicDir: false,

            target: 'es2022',

            // dev: inline sourcemap; prod: do not output sourcemap
            sourcemap: prod ? false : 'inline',

            // dev: no minification; prod: minify JS
            minify: prod ? 'oxc' : false,

            // Do not minify CSS in any mode
            cssMinify: false,

            // Bundle into a single CSS file
            cssCodeSplit: false,

            // Enable watch in dev mode (regenerate main.js / styles.css on file changes)
            watch: prod ? null : {},

            rolldownOptions: {
                external: [
                    'obsidian',
                    'electron',
                    ...codemirrorExternals,
                    ...nodeBuiltins,
                ],
                treeshake: true,
                output: {
                    format: 'cjs',
                    exports: 'named',

                    // Generate only one main.js (no extra chunks)
                    inlineDynamicImports: true,

                    entryFileNames: 'main.js',

                    // Fix CSS output name to styles.css; other assets default to original names output to the root directory
                    assetFileNames: (assetInfo) => {
                        if (assetInfo.name?.endsWith('.css')) return 'styles.css';
                        return '[name][extname]';
                    },
                },
            },
        },
    };
});
