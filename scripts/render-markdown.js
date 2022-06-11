import {unified} from 'unified'
import rehypeRaw from 'rehype-raw'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm';
import remarkRehype, {defaultHandlers} from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import {visit} from 'unist-util-visit'

export default async function renderMarkdown(md, mdAssets) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(function insertImageAssets () {
      return (tree, file) => {
        visit(tree, {tagName: 'img'}, (node, position, parent) => {
          const path = mdAssets[node.properties.src];
          node.properties.src = path;
        });
        return tree;
      };
    })
    .use(rehypeStringify)
    .process(md);

  return String(file);
}
