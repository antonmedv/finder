import typescript from 'rollup-plugin-typescript2'; 
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    input: './src/index.ts',
    output: [
        { file: './dist/index.js', format: 'cjs' },
        { file: './dist/index.umd.js', format: 'umd', name: 'finder' },
        { file: './dist/index.module.js', format: 'es' },
    ],
    plugins: [
        resolve(),
        typescript({ clean: true }),
        commonjs({ namedExports: { cssesc: ['cssesc'] } })],
}