import { featureCollection, lineString } from '@turf/helpers';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join, relative, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import simplify from '@turf/simplify';

const __dirname = dirname(fileURLToPath(import.meta.url));

const concordTo12th = JSON.parse(readFileSync(join(__dirname, 'concord-to-12th.geojson')));

// Reverse the path
//concordTo12th.features[0].geometry.coordinates.reverse();
//concordTo12th.features[0] = simplify(concordTo12th.features[0])


writeFileSync(join(__dirname, '12th-to-concord.geojson'), JSON.stringify(concordTo12th, null, 2));
