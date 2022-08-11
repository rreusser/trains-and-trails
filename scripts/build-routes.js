import glob from 'glob';
import mkdirp from 'mkdirp';
import { readFileSync, writeFileSync } from 'fs';
import processGeoJSON from './process-geojson.js';
import { dirname, join, relative, basename, extname } from 'path';
import simplify from '@turf/simplify';
import { fileURLToPath } from 'url';
import buildPage from './build-page.js';
import { createHash } from 'crypto';
import { featureCollection } from '@turf/helpers';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pagesPath = join(__dirname, '..', 'src', 'pages');
const routeFiles = glob.sync(join(pagesPath, '**', 'route.geojson'));
const buildPath = join(__dirname, '..', 'docs');

function buildRoute (assetPath) {
  const path = relative(pagesPath, assetPath);
  const dir = dirname(path);

  const data = readFileSync(assetPath, 'utf8');

  const route = processGeoJSON(JSON.parse(data.toString()));
  const processedJSON = JSON.stringify(route)

  const hash = createHash('sha256');
  const fingerprint = hash.update(processedJSON).digest('hex').substr(0, 8);

  const outName = `route-${fingerprint}.json`;
  const outPath = join(buildPath, dir, outName);

  mkdirp.sync(dirname(outPath));
  writeFileSync(outPath, processedJSON);

  return {route, path: join(dir, outName)};
}

function truncateCoords(feature, digits=4) {
  const f = Math.pow(10, digits);
  const iter = feature.geometry.type === 'Point' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  iter.forEach(coord => {
    coord[0] = Math.round(coord[0] * f) / f;
    coord[1] = Math.round(coord[1] * f) / f;
    coord.length = 2;
  });
  return feature;
}

function buildRoutes() {
  const all = featureCollection([]);
  const routes = {};
  const paths = {};

  for (let routeFile of routeFiles) {
    const slug = dirname(relative(pagesPath, routeFile));
    const {route, path} = buildRoute(routeFile)
    routes[slug] = route;
    paths[slug] = path;
    all.features.push(route);
  }

  /*
  for (const route of allRoutes) {
    for (const feature of route.features) {
      feature.geometry = simplify(feature.geometry, {
        tolerance: 0.0002,
        highQuality: true
      });
      delete feature.properties.markers;
      truncateCoords(feature, 4);
      all.features.push(feature);
    }
  }
  */

  const json = JSON.stringify(all);
  const hash = createHash('sha256');
  const fingerprint = hash.update(json).digest('hex').substr(0, 8);
  const filename = `routes-${fingerprint}.json`;

  routes.all = all;
  paths.all = filename;

  writeFileSync(join(buildPath, filename), json);

  return {
    routes,
    paths,
  };
}

export default buildRoutes;
