import budo from 'budo';
import brfs from 'brfs';
import babelify from 'babelify';
import envify from 'envify';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const credentials = JSON.parse(readFileSync(join(__dirname, '..', 'credentials.json')));

budo.cli([
  //`src/index.js:${join(process.env.BASE_URL, 'fuckitbundle.js')}`
], {
  host: 'localhost',
  live: true,
  open: false,
  watchGlob: 'docs/*.{html,css,js,md,json}',
  dir: [
    'src',
    'docs',
    'node_modules/mapbox-gl/dist'
  ],
  /*browserify: {
    transform: [
      [babelify, {presets: ['@babel/preset-env']}],
      [envify, credentials],
      brfs,
    ]
  }*/
})
