import { html } from 'htm/preact';
import { useRef, useEffect, useContext } from 'preact/hooks';
import mapContext from '../data/map-context.js';
import Ratings from './ratings.js';
import quadInOut from 'eases/quad-in-out.js';

const EXTERNAL_URL_REGEX = /^http/;
let initialLoad = true;

function lerp (a, b, x) { return x * b + (1.0 - x) * a; }

function Article ({page, setPath}) {
  const contentContainer = useRef(null);
  const map = useContext(mapContext);

  const isHome = page.metadata.path === '';
  const isFront = page.metadata.isFront;

  useEffect(async () => {
    await map.ready();

    const routePath = page.metadata.assets?.route;
    if (routePath) {
      fetch(routePath)
        .then(response => {
          if (!response.ok) throw new Error('404');
          return response.json();
        })
        .then(data => {
          map.setRoute(data, page.metadata.bounds, initialLoad);
        });
    } else {
      map.clearRoute(initialLoad ? null : page.metadata.bounds);
    }

    initialLoad = false;
  }, []);


  function navigate (event) {
    if (event.target.tagName !== 'A') return;
    let href = event.target.getAttribute('href')
    if (EXTERNAL_URL_REGEX.test(href)) return;

    if (!href.endsWith('/')) href += '/';
    if (href === '/') href = '';

    event.stopPropagation();
    event.preventDefault();

    setPath(href);
  }

  useEffect(() => {
    if (!contentContainer.current) return;
    contentContainer.current.addEventListener('click', navigate);
    const {current: el} = contentContainer;
    const controllers = el.querySelectorAll('[data-mbx-behavior]');

    function setPosition ({from, to, position}, forceUpdate=false) {
      //if (!from) return;
      const fromProgress = from ? parseFloat(from.getAttribute('data-mbx-progress')) : 0;
      const toProgress = to ? parseFloat(to.getAttribute('data-mbx-progress')) : fromProgress;
      const behavior = from ? from.getAttribute('data-mbx-behavior') : 'bound';
      switch(behavior) {
        case 'bound':
          map.setBound(page?.metadata?.bounds, forceUpdate);
          break;
        case 'follow':
          map.setFollow(lerp(fromProgress, toProgress, position));
          break;
        default:
          console.warn('Unknown behavior:', behavior);
      }
    }

    function computePosition (event, forceUpdate=false) {
      const offset = window.innerHeight * 3 / 4;
      const stops = [];
      for (const c of controllers) stops.push(c.getBoundingClientRect().y - offset);
      let i;
      for (i = 0; i < stops.length - 1 && stops[i] < 0; i++);
      i = Math.max(i - 1, 0);
      const from = controllers[Math.max(0, i)];
      const to = controllers[Math.min(i + 1, controllers.length - 1)];
      let position = Math.max(0, Math.min(1, -stops[i] / (stops[i + 1] - stops[i])));
      position = Math.floor(position) + quadInOut(position);
      setPosition({from, to, position}, forceUpdate);
    }
    const onResize = event => computePosition(event, true);

    window.addEventListener('scroll', computePosition);
    window.addEventListener('resize', onResize);
    onResize(null, true);

    return () => {
      contentContainer.current.removeEventListener('click', navigate);
      window.removeEventListener('scroll', computePosition);
      window.removeEventListener('resize', onResize);
    }
  }, []);

  return html`
    <div class="article_container ${isFront ? 'is-front' : ''}">
      <div class="article_header">
        ${isHome ? '' : html`<a href="" onClick=${event => navigate(event, '')}>← Back</a>`}
        <h1>${page.metadata.title}</h1>
        <div class="article_date">${page.metadata.date}</div>
      </div>
      <div class="article_body">
        ${page.metadata.ratings ? html`<${Ratings}/>` : null}
        <div ref=${contentContainer} dangerouslySetInnerHTML=${{__html: page.articleHTML}}/>
      </div>
    </div>`;
}

export default Article;
