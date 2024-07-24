import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replaceImportsWithVars from 'rollup-plugin-replace-imports-with-vars';
import json from '@rollup/plugin-json';
import pkg from './package.json';
import copy from 'rollup-plugin-copy';
import babel from 'rollup-plugin-babel';
import replace from '@rollup/plugin-replace';

const { exec } = require('child_process');

const extensions = ['.js', '.jsx'];

const globals = {
  react: 'craftercms.libs.React',
  '@emotion/css': 'craftercms.libs.EmotionCSS',
  '@emotion/css/create-instance': 'craftercms.libs.createEmotion',
  'react-dom': 'craftercms.libs.ReactDOM',
  'react-intl': 'craftercms.libs.ReactIntl',
  '@mui/material': 'craftercms.libs.MaterialUI',
  '@craftercms/studio-ui': 'craftercms.libs.StudioUI',
  '@mui/material/utils': 'craftercms.libs.MaterialUI',
  'rxjs': 'craftercms.libs.rxjs',
}

function cleanName(name) {
  if (name.includes('/')) {
    const i = name.lastIndexOf('/');
    return name.substr(i + 1);
  }
  return name;
}

function commitMessage(tpl, file) {
  const now = new Date();
  const date = `${now.getFullYear()}.${now.getDate()}.${now.getDay()}`;
  const time = `${now.getHours()}:${now.getMinutes()}`;
  return tpl.replace('{file}', file).replace('{date}', date).replace('{time}', time);
}

function rollupPluginCommit() {
  const target = '../static-assets/plugins/org/craftercms/plugin/bulkedit/sidebar/bulkedit/index.js';
  const message = 'Updates to {file} @ {date} {time}';
  return {
    name: 'rollup-plugin-commit',
    writeBundle() {
      if (target) {
        const callback = (op) => (error, stdout, stderr) => (error)
            ? console.error(stderr || `Failed to ${op} "${target}" \n ${error.cmd}. ${stdout ? ('\n' + stdout) : ''}`)
            : console.log(stdout || `Git ${op} successful for "${target}".`);
        exec(
          `git add ${target} ${
            '&&'
          } git commit ${target} -m "${commitMessage(message, cleanName(target))}"`,
          callback('add/commit')
        );
      }
    }
  };
}

export default {
  input: pkg.source,
  output: [
    {
      file: pkg.module,
      format: 'es',
      globals,
    }
  ],
  external: Object.keys(globals),
  plugins: [
    babel({
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-env', { modules: false }],
        '@babel/preset-react',
      ],
      plugins: [
        'babel-plugin-transform-react-remove-prop-types',
        '@babel/plugin-proposal-nullish-coalescing-operator',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-transform-runtime',
      ],
      runtimeHelpers: true
    }),
    json(),
    replace({
      preventAssignment: true,
      'process.env.NODE_ENV': JSON.stringify('production'),
      'import * as': 'import',
    }),
    replaceImportsWithVars({ varType: 'var', replacementLookup: globals }),
    resolve({
      extensions,
      jsnext: true,
      browser: true
    }),
    commonjs(),
    copy({
      targets: [{ src: 'dist/*', dest: '../static-assets/plugins/org/craftercms/plugin/bulkedit/sidebar/bulkedit/' }],
      hook: 'writeBundle'
    }),
    // rollupPluginCommit()
  ]
}
