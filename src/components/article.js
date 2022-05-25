import { html } from 'htm/preact';
import { useRef, useEffect, useContext } from 'preact/hooks';
import mapContext from '../data/map-context.js';


const EXTERNAL_URL_REGEX = /^http/;
let initialLoad = true;

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

    window.scrollTo(0,0);
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
    return () => contentContainer.current.removeEventListener('click', navigate);
  });

  return html`
    <div class="article_container ${isFront ? 'is-front' : ''}">
      <div class="article_header">
        ${isHome ? '' : html`<a href="" onClick=${event => navigate(event, '')}>← Back</a>`}
        <h1>${page.metadata.title}</h1>
        <div class="article_date">${page.metadata.date}</div>
      </div>
      <div class="article_body" ref=${contentContainer} dangerouslySetInnerHTML=${{__html: page.articleHTML}}/>
    </div>`;
}

export default Article;
