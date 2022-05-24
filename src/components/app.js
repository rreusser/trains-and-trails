import MbxMap from './map.js';
import { html } from 'htm/preact';
import Article from './article.js';
import Overlay from './overlay.js';
import { useState, useEffect } from 'preact/hooks';
import mapContext from '../data/map-context.js';

const pageCache = new Map();
function getPage (path) {
  if (pageCache.has(path)) return Promise.resolve(pageCache.get(path));
  return fetch(path)
    .then(response => {
      if (!response.ok) throw new Error('404d!');
      return response.json();
    })
    .then(page => {
      pageCache.set(path, page);
      return page;
    });
}

function App (props) {
  const [path, setPath] = useState(props.page.metadata.path);
  const [page, setPage] = useState(props.page);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    history.pushState({page, path}, '', path);
    function onChange (event) {
      setPath(event.state.path);
      setPage(event.state.page);
    }
    window.addEventListener('popstate', onChange);
  }, []);

  useEffect(() => {
    if (path === page.metadata.path) return;
    if (fetching) return;

    const pagePath = `${path}/index.json`.replace(/\/\//g, '/');
    setFetching(true);
    history.pushState({path: pagePath, page: null}, '', path);
    getPage(pagePath)
      .then(page => {
        setPage(page);
        history.replaceState({path, page}, '', path);
      })
      .then(
        () => setFetching(false),
        () => setFetching(false)
      );
  });

  return html`
    <${MbxMap} initialBounds=${page.metadata.bounds} isHome=${page.metadata.path === '/'}/>
    <${Article} key=${page.metadata.path} page=${page} setPath=${setPath}/>
    <${Overlay} active=${fetching}/>
  `
}

export default App;
