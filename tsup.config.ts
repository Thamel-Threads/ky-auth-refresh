import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: false,
  minify: true,
  external: ['ky'],
  treeshake: true,
  target: 'es2022',
  outDir: 'dist',
  esbuildOptions(options) {
    options.minifyIdentifiers = true;
    options.minifySyntax = true;
    options.minifyWhitespace = true;
    options.drop = ['console', 'debugger'];
  },
})
