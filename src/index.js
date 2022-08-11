import App from './components/app.js';
import { render, h } from 'preact';

render(
  h(App, {page: window.page}),
  document.getElementById('root')
);
