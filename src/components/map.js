import { html } from 'htm/preact';
import { useRef, useState, useEffect, useContext } from 'preact/hooks';
import pageControllerContext from '../data/page-controller-context.js';

export default function MapView (props) {
  const pageController = useContext(pageControllerContext);
  const mapEl = useRef(null);

  useEffect(() => {
    pageController.initializeMap(mapEl.current, props.initialBounds);//, !props.isHome);
  }, []);

  return html`<div ref=${mapEl} class="mbxmap"/>`
}
