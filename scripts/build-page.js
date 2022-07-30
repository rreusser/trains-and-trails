import handlebars from 'handlebars';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join, relative, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import ssr from './ssr.js';
import renderMarkdown from './render-markdown.js';
import matter from 'gray-matter';
import buildAssets from './build-assets.js';
import bbox from '@turf/bbox';
import { featureCollection } from '@turf/helpers';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = handlebars.compile(readFileSync(join(__dirname, '..', 'src', 'views', 'layout.html'), 'utf8'));

export default async function (md, path, siteManifest, route, routeFile) {
  const {content: mdInput, data: metadata} = matter(md);

  metadata.path = path;
  metadata.routeurl = routeFile;
  if (route) {
    metadata.bounds = bbox(featureCollection(route.features.filter(f => f.properties.mode === 'foot')));
  }
  const {mdAssets, assets} = await buildAssets(metadata);

  const renderedMarkdown = await renderMarkdown(mdInput, mdAssets, route);
  const windowTitle = metadata.title === 'Trains and Trails' ? metadata.title : `${metadata.title} - Trains and Trails`;

  const page = {
    articleHTML: renderedMarkdown,
    metadata,
    baseURL: process.env.BASE_URL || ''
  };

  const html = template({
    baseUrl: process.env.BASE_URL,
    content: ssr(page),
    title: windowTitle,
    page: JSON.stringify(page),
    manifest: JSON.stringify(siteManifest),
  });

  return { html, page };
}
