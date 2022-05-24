import handlebars from 'handlebars';
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join, relative, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import ssr from './ssr.js';
import renderMarkdown from './render-markdown.js';
import matter from 'gray-matter';
import buildAssets from './build-assets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = handlebars.compile(readFileSync(join(__dirname, '..', 'src', 'views', 'layout.html'), 'utf8'));

export default async function (md, path) {
  const {content: mdInput, data: metadata} = matter(md);
  const renderedMarkdown = await renderMarkdown(mdInput);
  const windowTitle = metadata.title ? `${metadata.title} - Trains and Trails` : 'Trains and Trails';
  metadata.path = path;

  buildAssets(metadata);

  const page = {
    articleHTML: renderedMarkdown,
    metadata
  };

  const html = template({
    content: ssr(page),
    title: windowTitle,
    page: JSON.stringify(page)
  });

  return { html, page };
}
