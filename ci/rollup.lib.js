import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import {terser} from 'rollup-plugin-terser';
import sourceMaps from 'rollup-plugin-sourcemaps';
import replacer from '@rollup/plugin-replace';

import pkg from '../package.json';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];
const libraryname = 'Weaccount';

const copyright = '2020-' + new Date().getFullYear();
const banner = `
/*!\n
 * weaccount v${pkg.version} \n
 * (c) ${copyright} by ${pkg.author}. All rights reserved.\n
 * this package used third lib :crypto-js,scrypt-js & buffer \n
 */
`;
// const input = 'src/index.ts';
export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: libraryname,
      sourcemap: true,
      banner: banner,
    },
    {
      file: pkg.module,
      format: 'es',
      name: libraryname,
      banner,
    },
  ],
  external: ['@wecrpto/nacl'],
  plugins: [
    replacer({
      preventAssignment: true,
      __WEACC_VERSION__: () => pkg.version,
    }),
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
    sourceMaps(),
    terser(),
  ],
};
