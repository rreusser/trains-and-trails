import bbox from '@turf/bbox';

if (typeof window !== "undefined" && typeof window.mapboxgl !== "undefined") {
  mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN;
}

const NO_HIDE_LAYERS = ['background', 'satellite', 'sf-bart', 'sf-muni'];
const FADE_LAYERS = ['sf-bart', 'sf-muni'];

const EMPTY_GEOJSON = {
  "type": "FeatureCollection",
  "features": []
};

function currentPadding () {
  return true || window.innerWidth < 1200 ? {
    bottom: window.innerHeight * 0.45,
    left: window.innerWidth * 0.1,
    right: window.innerWidth * 0.1,
    top: 50,
  } : {
    left: window.innerWidth * 0.1,
    right: window.innerWidth * 0.1,
    top: window.innerHeight * 0.1,
    bottom: window.innerHeight * 0.1,
  };
}

class MbxMap {
  constructor () {
    this._onload = [];
  }

  initialize (element, bounds) {
    this.map = window.map = new mapboxgl.Map({
      container: element,
      style: 'mapbox://styles/rreusser/cl3jof9o3000g14le3tzu1ih9/draft',
      scrollZoom: false,
      boxZoom: false,
      dragRotate: false,
      dragPan: false,
      keyboard: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      interactive: false,
      bounds,
      fitBoundsOptions: { padding: currentPadding() },
      showPadding: true,
    });

    this.map.on('load', () => {
      this.map.addSource('route', {
        type: 'geojson',
        data: EMPTY_GEOJSON,
      });

      this.map.addLayer({
        id: 'routeline',
        source: 'route',
        type: 'line',
        paint: {
          'line-color': ['case',
            ['==', ['get', 'mode'], 'metro'], '#3388ff',
            ['==', ['get', 'mode'], 'foot'], '#5cb83b',
            'black'
          ],
          'line-width': 4
        }
      });
      while (this._onload.length) {
        this._onload.pop()(this.map)
      }
      this.loaded = true;
    });
  }

  ready () {
    if (this.loaded) return Promise.resolve(this.map);
    return new Promise(resolve => {
      this._onload.push(resolve);
    });
  }

  clearRoute (bounds) {
    if (bounds) this.map.fitBounds(bounds, {
      padding: currentPadding()
    });
    this.map.getSource('route').setData(EMPTY_GEOJSON);

    for (const layer of Object.keys(this.map.style._layers)) {
      if (~NO_HIDE_LAYERS.indexOf(layer)) continue;
      map.setLayoutProperty(layer, 'visibility', 'none');
    }

    for (const layer of FADE_LAYERS) {
      map.setPaintProperty(layer, 'line-opacity', 1.0);
    }
  }

  setRoute (geojson, bounds, immediate, usePadding) {
    for (const layer of Object.keys(this.map.style._layers)) {
      if (~NO_HIDE_LAYERS.indexOf(layer)) continue;
      map.setLayoutProperty(layer, 'visibility', 'visible');
    }

    this.map.getSource('route').setData(geojson);
    this.map.fitBounds(bounds, {
      padding: currentPadding()
    });

    for (const layer of FADE_LAYERS) {
      map.setPaintProperty(layer, 'line-opacity', 0.2);
    }
  }
}

export default MbxMap;
