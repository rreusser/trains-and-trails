import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join, relative, basename, extname } from 'path';
import computeLayout from '../src/data/layout.js';
import { featureCollection } from '@turf/helpers';
import { fileURLToPath } from 'url';
import buildPage from './build-page.js';
import { createHash } from 'crypto';
import bbox from '@turf/bbox';
import mkdirp from 'mkdirp';
import im from 'imagemagick';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesPath = join(__dirname, '..', 'src', 'pages');
const buildPath = join(__dirname, '..', 'docs');

async function resize (path, outputPath, shape) {
  return await new Promise((resolve, reject) => {
    im.convert([
      path,
      '-resize', shape,
      '-quality', 70,
      outputPath
    ], function (err, stdout) {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
}

export default async function buildAssets(metadata) {
  const assets = metadata.assets;
  const mdAssets = {};
  const path = join(pagesPath, metadata.path);

  if (assets) for (const [label, inPath] of Object.entries(assets)) {
    console.log('  -', inPath);
    const assetPath = join(path, inPath);
    const data = readFileSync(assetPath);
    const hash = createHash('sha256');
    const fingerprint = hash.update(data).digest('hex').substr(0, 8);

    const dir = join(buildPath, metadata.path);
    const ext = extname(inPath);
    const base = basename(inPath, ext);

    switch(ext.toLowerCase()) {
      case '.geojson':
        const route = computeLayout(JSON.parse(data.toString()));

        const outName = `${base}-${fingerprint}${ext}`;
        const outPath = join(dir, outName);
        assets[label] = join(metadata.path, outName);

        mkdirp.sync(dirname(outPath));
        writeFileSync(outPath, data);

        break;
      case '.jpg':
      case '.jpeg':
      case '.png':
        const sizes = [
          ['sm', '640x'],
          ['md', '1280x'],
          ['lg', '2560x']
        ];

        assets[label] = {};
        for (const [suf, size] of sizes) {
          const outName = `${base}-${suf}-${fingerprint}.jpg`;
          const outPath = join(dir, outName);
          mdAssets[`${base}-${suf}.jpg`] = join(metadata.path, outName);
          mkdirp.sync(dirname(outPath));
          if (!existsSync(outPath)) {
            await resize(assetPath, outPath, size);
          }
          assets[label][suf] = outName;
        }

        break;
    }
  }
  return mdAssets;
}
