import MbxMap from './map.js';
import { html } from 'htm/preact';
import Article from './article.js';
import Overlay from './overlay.js';
import { useState, useEffect, useContext } from 'preact/hooks';
import pageControllerContext from '../data/page-controller-context.js';

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
  const pageController = useContext(pageControllerContext);

  useEffect(() => {
    const pagePath = `${page.baseURL}${path}`.replace(/\/\//g, '/');
    history.pushState({page, path}, '', pagePath);
    function onChange (event) {
      setPath(event.state.path);
      setPage(event.state.page);
      pageController.stop();
    }
    window.addEventListener('popstate', onChange);
  }, []);
  
  useEffect(() => {
    if (path === page.metadata.path) return;
    if (fetching) return;

    const pagePath = `${page.baseURL}${path}`.replace(/\/\//g, '/');
    const contentPath = window.manifest[pagePath];
    setFetching(true);
    history.pushState({path: pagePath, page: null}, '', pagePath);
    getPage(contentPath)
      .then(page => {
        console.log('got page', page);
        setPage(page);
        history.replaceState({path, page}, '', pagePath);
      })
      .then(
        () => setFetching(false),
        () => setFetching(false)
      );
  });

  function navigate(...args) {
    setPath(...args);
    window.scrollTo(0,0);
  }

  return html`
    <${MbxMap} initialBounds=${page.metadata.bounds} isHome=${page.metadata.path === '/'}/>
    <div class="left-spacer"/>
    <${Article} key=${page.metadata.path || '/'} page=${page} setPath=${navigate}/>
    <div class="right-spacer"/>
  `
}

export default App;
