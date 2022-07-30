import glob from 'glob';
import mkdirp from 'mkdirp';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join, relative, basename, extname } from 'path';
import simplify from '@turf/simplify';
import bbox from '@turf/bbox';
import { fileURLToPath } from 'url';
import buildPage from './build-page.js';
import { createHash } from 'crypto';
import { featureCollection } from '@turf/helpers';
import buildRoutes from './build-routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pagesPath = join(__dirname, '..', 'src', 'pages');
const mdFiles = glob.sync(join(pagesPath, '**', '*.md'));
const buildPath = join(__dirname, '..', 'docs');

mkdirp.sync(buildPath);

function normalizePath(path) {
  return `${path}/`.replace(/\.\//, '');
}

function copy (from, to) {
  writeFileSync(join(buildPath, to), readFileSync(join(__dirname, from)));
}
copy(join('..', 'node_modules', 'mapbox-gl', 'dist', 'mapbox-gl.js'), 'mapbox-gl.js');
copy(join('..', 'node_modules', 'mapbox-gl', 'dist', 'mapbox-gl.css'), 'mapbox-gl.css');
copy(join('..', 'node_modules', 'd3', 'dist', 'd3.min.js'), 'd3.min.js');
copy(join('..', 'src', 'styles.css'), 'styles.css');

const allRoutes = buildRoutes();

// Build a page manifest to json representations get cache-busted correctly
const siteManifest = {};
for (const mdFile of mdFiles) {
  const hash = createHash('sha256').update(readFileSync(mdFile)).digest('hex').substr(0, 8);
  const relMdPath = relative(pagesPath, mdFile);
  let relDir = dirname(relMdPath);
  relDir = relDir === '.' ? '/' : '/' + relDir + '/';
  const baseMdName = basename(mdFile, extname(mdFile));
  siteManifest[relDir] = `${relDir}${baseMdName}-${hash}.json`;
}

async function processPage(mdPath) {
  const relMdPath = relative(pagesPath, mdPath);
  console.log(`Build page ${relMdPath}`);
  const relDir = dirname(relMdPath);
  const outDir = join(buildPath, relDir);
  const baseMdName = basename(mdPath, extname(mdPath));
  const url = normalizePath(relDir);
  const htmlOutputPath = join(outDir, baseMdName + '.html');
  const mdContent = readFileSync(mdPath, 'utf8');

  const slug = relDir;

  const thisroute = allRoutes.routes[slug];
  const thisroutefile = allRoutes.paths[slug];
  const {html, page} = await buildPage(mdContent, url, siteManifest, thisroute, thisroutefile);

  mkdirp.sync(outDir);
  writeFileSync(htmlOutputPath, html);
  const pageJSON = JSON.stringify(page);
  const pageHash = createHash('sha256').update(mdContent).digest('hex').substr(0, 8);

  const pageDataFilename = `${baseMdName}-${pageHash}.json`
  const jsonOutputPath = join(outDir, pageDataFilename);

  writeFileSync(jsonOutputPath, pageJSON);
}


const pages = [];
for (const mdFile of mdFiles) {
  console.log(`Processing ${mdFile}...`);
  await processPage(mdFile);
}
