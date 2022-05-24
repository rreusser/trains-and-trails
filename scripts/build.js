import glob from 'glob';
import mkdirp from 'mkdirp';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join, relative, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import buildPage from './build-page.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const pagesPath = join(__dirname, '..', 'src', 'pages');
const mdFiles = glob.sync(join(pagesPath, '**', '*.md'));
const buildPath = join(__dirname, '..', 'docs');

mkdirp.sync(buildPath);

function normalizePath(path) {
  return `/${path}/`.replace(/\.\//, '');
}

async function processPage(mdPath) {
  const relMdPath = relative(pagesPath, mdPath);
  console.log(`Build page ${relMdPath}`);
  const relDir = dirname(relMdPath);
  const outDir = join(buildPath, relDir);
  const baseMdName = basename(mdPath, extname(mdPath));
  const url = normalizePath(relDir);
  const htmlOutputPath = join(outDir, baseMdName + '.html');
  const jsonOutputPath = join(outDir, baseMdName + '.json');
  const mdContent = readFileSync(mdPath, 'utf8');
  const {html, page} = await buildPage(mdContent, url);

  mkdirp.sync(outDir);
  writeFileSync(htmlOutputPath, html);
  writeFileSync(jsonOutputPath, JSON.stringify(page));
}

for (const mdFile of mdFiles) {
  await processPage(mdFile);
}
