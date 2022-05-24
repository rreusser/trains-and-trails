// rollup.config.js
//import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';

export default [
  {
    input: 'src/index.js',
    output: 'dist/index.js',
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
    nodeResolve({
      browser: true,
    }),
    //commonjs(),
    babel({
      babelHelpers: 'bundled',
      presets: bundle.babelPresets,
    }),
    json(),
  ].concat(bundle.additionalPlugins),
}));
