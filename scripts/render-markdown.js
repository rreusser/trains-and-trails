import {unified} from 'unified'
import rehypeRaw from 'rehype-raw'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm';
import remarkRehype, {defaultHandlers} from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import {visit} from 'unist-util-visit'

const PIXELS_PER_MILE = {
  foot: 1000,
  metro: 500
};

export default async function renderMarkdown(md, mdAssets, route) {
  let segmentHeights, cumulativeHeight;
  if (route) {
    segmentHeights = route.features.map(feature => Math.floor(PIXELS_PER_MILE[feature.properties.mode] * feature.properties.length.mi));

    cumulativeHeight = [0];
    for (let i = 0; i < segmentHeights.length; i++) {
      cumulativeHeight[i + 1] = cumulativeHeight[i] + segmentHeights[i];
    }
  }

  let currentFeatureIndex = -1;

  function restructure (node) {
    return (tree, file) => {
      const out = {
        type: 'root',
        children: []
      };

      let segmentIndex = 0;
      let curPos = 0;

      let curContainer;
      let curWrapper;
      function newContainer(splitter) {
        const contentClasses = [];
        const containerClasses = ['articleCard'];
        let wrapper = false;
        let pixelPosition = null;
        let prevMode = null;

        const containerProps = {};

        if (/(introduction|conclusion)/.test(splitter?.properties?.dataBehavior)) {
          contentClasses.push('articleContent', `articleContent--${splitter.properties.dataBehavior}`);
          containerProps.dataRouteMode = 'bound';
        } else if (splitter?.properties?.dataBehavior === 'anchor') {
          contentClasses.push('articleCard_content');
          const featureIndex = parseInt(splitter.properties.dataFeatureIndex);
          const feature = route.features[featureIndex];
          const milePos = parseFloat(splitter.properties.dataMilePosition);

          containerProps.dataRouteMode = 'follow'
          containerProps.dataRouteProgress = Math.min(featureIndex + milePos / feature.properties.length.mi, route.features.length);

          if (!feature.properties.mode) {
            throw new Error(`Missing mode for feature ${featureIndex}`);
          }
          const mode = feature.properties.mode;
          containerClasses.push(`articleCard-${mode}`);

          if (featureIndex > currentFeatureIndex) {
            if (milePos === 0) {
              containerClasses.push('articleCard-start');

              if (curWrapper) {
                const width = 20;
                const radius = 29 / 2;
                curWrapper.children.push({
                  type: 'element',
                  tagName: 'svg',
                  properties: { class: 'articleCard_circleCutoff', width: 20, height: 10 },
                  children: [{
                    type: 'element',
                    tagName: 'path',
                    properties: { d: `M 0 0 L 20 0 L 20 10 A ${radius} ${radius} 0 0 0 0 10 Z`, }
                  }]
                });
              }
            } else {
              out.children.push({
                type: 'element',
                tagName: 'div',
                properties: {
                  class: `articleCard articleCard-start articleCard-${mode}`,
                  dataPosition: cumulativeHeight[featureIndex],
                },
                children: []
              });
            }
            currentFeatureIndex = featureIndex;
          } else if (featureIndex === currentFeatureIndex) {
          } else {
            throw new Error('Feature indices must be strictly increasing');
          }

          pixelPosition = cumulativeHeight[featureIndex] + milePos * PIXELS_PER_MILE[mode];

          wrapper = true;
        }

        curContainer = {
          type: 'element',
          tagName: 'div',
          properties: { class: contentClasses.join(' ') },
          children: []
        }
        let el = curContainer;
        if (wrapper) {
          el = {
            type: 'element',
            tagName: 'div',
            properties: {class: containerClasses.join(' ') },
            children: [curContainer]
          };
          curWrapper = el;
        } else {
          curWrapper = null;
        }
        if (pixelPosition !== null) {
          el.properties.dataPosition = pixelPosition;
        }

        Object.assign(el.properties, containerProps);

        out.children.push(el);
      }

      function splitChildren (node) {
        const children = [];
        let splitter = null;
        for (const c of node.children) {
          if (c.type === 'element' && c.tagName === 'span' && c.properties?.dataBehavior) {
            splitter = c;
          } else {
            children.push(c);
          }
        }
        return {children, splitter};
      }

      for (const child of tree.children) {
        if (child.type === 'text' && child.value.trim() === '') continue;

        switch(child.tagName) {
          case 'p':
          case 'table':
          case 'h2':
            const {children, splitter} = splitChildren(child);

            if (splitter) {
              if (splitter.properties?.dataBehavior === 'anchor') {
                const featureIndex = parseInt(splitter.properties?.dataFeatureIndex);
                const milePosition = parseFloat(splitter.properties?.dataMilePosition);
                const feature = route.features[featureIndex];

                const progress = cumulativeHeight[featureIndex] + segmentHeights[featureIndex] * milePosition / feature.properties.length.mi;
              }
              newContainer(splitter);
            }

            if (children.length) {
              if (!curContainer) newContainer();
              const el = {
                type: 'element',
                tagName: child.tagName,
                properties: {},
                children: children,
                position: child.position
              };

              curContainer.children.push(el);

              if (child.tagName === 'h2' && children.length === 1) {
                curContainer.properties.class = 'articleCard_station';
                //contentClasses.push('articleCard-station');
              }
            }
            break;
          default:
            throw new Error(`Unhandled tag name ${child.tagName}`);
        }
      }

      for (let i = 0; i < out.children.length - 1; i++) {
        const child = out.children[i];
        const next = out.children[i + 1];

        const thispos = child.properties.dataPosition;
        const nextpos = next.properties.dataPosition;

        if (thispos === undefined) continue;

        if (nextpos === undefined) {
          child.properties.style = `min-height:${Math.floor(cumulativeHeight[cumulativeHeight.length - 1] - thispos)}px`;
          child.properties.class = `${child.properties.class} articleCard-terminus`;
          continue;
        }

        child.properties.style = `min-height:${Math.floor(nextpos - thispos)}px`;
      }

      out.children.forEach(c => delete c.properties.dataPosition);

      return out;
    };
  }

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(function insertImageAssets () {
      return (tree, file) => {
        visit(tree, {tagName: 'img'}, (node, position, parent) => {
          const path = mdAssets[node.properties.src];
          if (!path) throw new Error(`Undeclared asset ${node.properties.src}. Be sure to add the asset to the page's frontmatter manifest.`);
          node.properties.src = path;
        });
        return tree;
      };
    })
    .use(restructure)
    .use(rehypeStringify)
    .process(md);

  return String(file);
}
