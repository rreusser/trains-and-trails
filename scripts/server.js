const budo = require('budo');
const brfs = require('brfs');
const babelify = require('babelify');
const envify = require('envify');
const credentials = require('../credentials.json');

budo.cli(['src/index.js'], {
  host: 'localhost',
  live: true,
  open: true,
  dir: [
    'src',
    'node_modules/mapbox-gl/dist'
  ],
  browserify: {
    transform: [
      [envify, credentials],
      brfs,
      babelify,
    ]
  }
})
