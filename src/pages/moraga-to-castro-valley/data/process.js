import { featureCollection, lineString } from '@turf/helpers';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join, relative, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const path_12thToLafayette = JSON.parse(readFileSync(join(__dirname, 'input/12th-to-lafayette.geojson')));
const path_lafayetteToMoraga = JSON.parse(readFileSync(join(__dirname, 'input/lafayette-to-moraga.geojson')));
const path_moragaToCastro = JSON.parse(readFileSync(join(__dirname, 'input/moraga-to-castro-valley.geojson')));
const path_castroToMerritt = JSON.parse(readFileSync(join(__dirname, 'input/castro-valley-to-merritt.geojson')));

// Reverse the path
console.log(path_12thToLafayette.features);
path_12thToLafayette.features[0].geometry.coordinates.reverse();

writeFileSync(join(__dirname, 'processed/12th-to-lafayette.geojson'), JSON.stringify(path_12thToLafayette));

// Truncate bus route
for (const coordinate of path_lafayetteToMoraga.features[0].geometry.coordinates) {
  coordinate.length = 2;
}

writeFileSync(join(__dirname, 'processed/lafayette-to-moraga.geojson'), JSON.stringify(path_lafayetteToMoraga));


// Reorganize the bart line
path_castroToMerritt.features.reverse();
path_castroToMerritt.features[1].geometry.coordinates.reverse();
path_castroToMerritt.features[0].geometry.coordinates.push(...path_castroToMerritt.features[1].geometry.coordinates);
path_castroToMerritt.features.length = 1;

writeFileSync(join(__dirname, 'processed/castro-valley-to-merritt.geojson'), JSON.stringify(path_castroToMerritt));

const combined = featureCollection([
  path_12thToLafayette.features[0],
  path_lafayetteToMoraga.features[0],
  path_moragaToCastro.features[0],
  path_castroToMerritt.features[0]
]);

combined.features[0].properties = {
  mode: 'metro'
}

combined.features[1].properties = {
  mode: 'metro'
}

combined.features[2].properties = {
  mode: 'foot'
}

combined.features[3].properties = {
  mode: 'metro'
}

/*for (const feature of combined.features) {
  feature.geometry.type = 'LineString'
  feature.geometry.coordinates = feature.geometry.coordinates[0];
  for (const coord of feature.geometry.coordinates) {
    coord.length = 2;
  }
}*/

writeFileSync(join(__dirname, '../route.geojson'), JSON.stringify(combined, null, 2));
