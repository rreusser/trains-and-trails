import test from 'tape';
import computeLayout from '../src/data/layout.js';

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const route = JSON.parse(readFileSync(join(__dirname, '../src/pages/de-laveaga/route.geojson'), 'utf8'));

test('route layout', function (t) {
  const r = computeLayout(route);

  console.log(r);

  t.end();
});
