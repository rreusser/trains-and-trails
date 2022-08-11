import { html } from 'htm/preact';
import { useRef, useEffect, useContext } from 'preact/hooks';


const EXTERNAL_URL_REGEX = /^http/;
let initialLoad = true;

function Ratings () {
  return html`<div class="ratings">
    Ratings!
  </div>`
}

export default Ratings;
