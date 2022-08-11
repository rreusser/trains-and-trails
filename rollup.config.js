// rollup.config.js
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';


const __dirname = dirname(fileURLToPath(import.meta.url));
const credentials = JSON.parse(readFileSync(join(__dirname, 'credentials.json'), 'utf8'));

export default [
  {
    input: 'src/index.js',
    output: 'docs/bundle.js',
    format: 'umd',
    name: 'App',
    babelPresets: [],
    additionalPlugins: [terser()],
  },
].map((bundle) => ({
  input: bundle.input,
  output: {
    file: bundle.output,
    format: bundle.format,
    name: bundle.name,
    sourcemap: true,
  },
  plugins: [
    replace({
      values: {
        'process.env.MAPBOX_ACCESS_TOKEN': `"${credentials.MAPBOX_ACCESS_TOKEN}"`,
        'process.env.BASE_URL': `"${process.env.BASE_URL}"`
      },
      preventAssignment: true
    }),
    nodeResolve({
      browser: true,
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      presets: bundle.babelPresets,
    }),
    json(),
  ].concat(bundle.additionalPlugins),
}));
