import glob from 'glob';
import { fileURLToPath } from 'url';
import { dirname, join, relative, basename, extname } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import simplify from '@turf/simplify';
import { featureCollection } from '@turf/helpers';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pagesPath = join(__dirname, '..', 'src', 'pages');

const markdownFiles = glob.sync(join(pagesPath, '**', '*.md'));

const routeFiles = [];

for (const md of markdownFiles) {
  const route = join(dirname(md), 'route.geojson');
  if (existsSync(route)) routeFiles.push(route);
}

const features = [];
for (const routeFile of routeFiles) {
  if (relative(pagesPath, routeFile) === 'route.geojson') continue;
  const route = JSON.parse(readFileSync(routeFile, 'utf8'));
  for (const feature of route.features) {
    features.push(
      simplify(feature, {tolerance: 0.0001, highQuality: true})
    );
  }
}

const outPath = join(pagesPath, 'route.geojson');
const outJSON = featureCollection(features);

writeFileSync(outPath, JSON.stringify(outJSON));


