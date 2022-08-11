import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';

function Overlay ({active}) {
  return html`<div
    className="overlay ${active ? 'overlay-isActive' : ''}"
  />`;
}

export default Overlay;
