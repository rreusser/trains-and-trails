import { featureCollection, lineString } from '@turf/helpers';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join, relative, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const path_12thToOrinda = JSON.parse(readFileSync(join(__dirname, 'beaut/12th-to-orinda.geojson')));
const path_berkeleyTo12th = JSON.parse(readFileSync(join(__dirname, 'beaut/berkeley-to-12th.geojson')));
const path_deLaveaga = JSON.parse(readFileSync(join(__dirname, 'beaut/orinda-to-berkeley.geojson')));

// Reverse the path
path_12thToOrinda.features[0].geometry.coordinates[0].reverse();

writeFileSync(join(__dirname, 'processed/12th-to-orinda-processed.geojson'), JSON.stringify(path_12thToOrinda));



// Reverse the first feature
path_berkeleyTo12th.features.reverse();

// Reverse the second
//path_berkeleyTo12th.features[1].geometry.coordinates[0].reverse();

// Concatenate
path_berkeleyTo12th.features[0].geometry.coordinates[0].push(
  ...path_berkeleyTo12th.features[1].geometry.coordinates[0]
);
path_berkeleyTo12th.features.length = 1;

writeFileSync(join(__dirname, 'processed/berkeley-to-12th.geojson'), JSON.stringify(path_berkeleyTo12th));



writeFileSync(join(__dirname, 'processed/de-laveaga.geojson'), JSON.stringify(path_deLaveaga));



const combined = featureCollection([
  path_12thToOrinda.features[0],
  path_deLaveaga.features[0],
  path_berkeleyTo12th.features[0]
]);

combined.features[0].properties = {
  mode: 'metro'
}

combined.features[1].properties = {
  mode: 'foot'
}

combined.features[2].properties = {
  mode: 'metro'
}

for (const feature of combined.features) {
  feature.geometry.type = 'LineString'
  feature.geometry.coordinates = feature.geometry.coordinates[0];
  for (const coord of feature.geometry.coordinates) {
    coord.length = 2;
  }
}

writeFileSync(join(__dirname, 'processed/combined.geojson'), JSON.stringify(combined, null, 2));
