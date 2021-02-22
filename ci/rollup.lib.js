import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import {terser} from 'rollup-plugin-terser';

import pkg from '../package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const libraryname = 'Weaccount';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: libraryname,
    },
    {
      file: pkg.module,
      format: 'es',
      name: libraryname,
    },
  ],
  // external:[''],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      rollupCommonJSResolveHack: true,
      clean: true,
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      extensions,
    }),
    terser(),
  ],
};
