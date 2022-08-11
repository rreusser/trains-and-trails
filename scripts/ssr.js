import render from 'preact-render-to-string';
import { h } from 'preact';
import App from '../src/components/app.js';

export default function (page) {
  return render(h(App, {page}));
}
