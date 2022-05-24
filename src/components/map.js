import { html } from 'htm/preact';
import { useRef, useState, useEffect, useContext } from 'preact/hooks';
import mapContext from '../data/map-context.js';

export default function MapView (props) {
  const map = useContext(mapContext);
  const mapEl = useRef(null);

  useEffect(() => {
    map.initialize(mapEl.current, props.initialBounds, !props.isHome);
  }, []);

  return html`<div ref=${mapEl} class="mbxmap"/>`
}
