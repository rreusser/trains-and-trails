import { readFileSync, writeFileSync } from 'fs';
import { dirname, join, relative, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import buildPage from './build-page.js';
import { createHash } from 'crypto';
import bbox from '@turf/bbox';
import mkdirp from 'mkdirp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesPath = join(__dirname, '..', 'src', 'pages');
const buildPath = join(__dirname, '..', 'docs', 'trains-and-trails');

export default function buildAssets(metadata) {
  const assets = metadata.assets;
  const path = join(pagesPath, metadata.path);

  if (assets) for (const [label, inPath] of Object.entries(assets)) {
    const assetPath = join(path, inPath);
    const data = readFileSync(assetPath);
    const hash = createHash('sha256');
    const fingerprint = hash.update(data).digest('hex').substr(0, 8);

    const dir = join(buildPath, metadata.path);
    const ext = extname(inPath);
    const base = basename(inPath, ext);
    const outName = `${base}-${fingerprint}${ext}`;
    const outPath = join(dir, outName);

    if (ext === '.geojson') {
      const route = JSON.parse(data.toString());
      const bounds = bbox(route);
      metadata.bounds = bounds;
    }

    console.log(` - ${label}: ${outName}`);

    assets[label] = join(metadata.path, outName);

    mkdirp.sync(dirname(outPath));
    writeFileSync(outPath, data);
  }
}
