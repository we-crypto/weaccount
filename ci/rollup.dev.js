import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import sourceMaps from 'rollup-plugin-sourcemaps';

import pkg from '../package.json';
import svrOpts from './serve-dev';

const extensions = ['.js', '.jsx', '.ts', '.tsx'];

export default {
  input: 'src/index.ts',
  output: [
    {
      file: `./example/${pkg.main}`,
      format: 'umd',
      name: 'Weaccount',
      sourcemap: true,
    },
    {
      file: `./example/${pkg.module}`,
      format: 'es',
      name: 'Weaccount',
      sourcemap: true,
    },
  ],
  external: ['@wecrpto/nacl'],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      useTsconfigDeclarationDir: true,
      rollupCommonJSResolveHack: true,
      clean: true,
    }),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      extensions,
    }),
    sourceMaps(),
    serve(
      Object.assign(svrOpts, {
        contentBase: ['./example'],
      }),
    ),
    livereload({
      watch: ['./example'],
      exts: ['html', 'js', 'css'],
    }),
  ],
};
