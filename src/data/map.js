import bbox from '@turf/bbox';
import length from '@turf/length';
import along from '@turf/along';
import { point } from '@turf/helpers';
import CameraController from './camera-controller.js';

if (typeof window !== "undefined" && typeof window.mapboxgl !== "undefined") {
  mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN;
}

const NO_HIDE_LAYERS = ['background', 'satellite', 'sf-bart', 'sf-muni'];
const FADE_LAYERS = ['sf-bart', 'sf-muni'];

const EMPTY_GEOJSON = {
  "type": "FeatureCollection",
  "features": []
};

const MARKER = point([0, 0]);

class MbxMap {
  constructor () {
    this._onload = [];
    this.behavior = null;
    this.mode = 'bound';
    this.controller = null;
    this.followProgress = 0;
    this.followProgressTarget = 0;
    this.followRaf = null;
  }

  stop () {
    if (this.followRaf) cancelAnimationFrame(this.followRaf);
    this.controller.stop();
    this.setTerrain(null);
    this.followProgress = 0;
    this.followProgressTarget = 0;
    this.map.setPitch(0);
    this.mode = 'bound';
    this.setGlobalPadding();
    if (map.getLayer('marker')) this.map.setPaintProperty('marker', 'circle-opacity', 0);
  }

  computeGlobalPadding () {
    const isFeature = this.mode === 'bound';
    const padding = { top: 60, right: 60, bottom: 60, left: 60 };

    if (isFeature) {
      padding.bottom += window.innerHeight * 0.3;
    } else {
      padding.left = Math.max(60, Math.min(520, window.innerWidth - 520));
    }
    return padding;
  }

  startRaf () {
    if (!this.followRaf) {
      let tPrev = null;
      const raf = (t) => {
        const dt = tPrev === null ? 0 : t - tPrev;
        this.stepFollow(t, dt);
        tPrev = t;
        this.followRaf = requestAnimationFrame(raf);
      }
      this.followRaf = requestAnimationFrame(raf);
    }
  }

  stopRaf () {
    if (this.followRaf) cancelAnimationFrame(this.followRaf);
    this.followRaf = null;
  }

  setGlobalPadding () {
    const padding = this.computeGlobalPadding();
    this.map.easeTo({padding, duration: 0});
  }

  setDisplayMode (mode) {
    const change = this.mode !== mode;
    this.mode = mode;
    if (change) {
      this.setGlobalPadding();
      if (mode === 'follow') {
        this.startRaf();
        this.controller.start();
      } else {
        this.stopRaf();
        this.controller.stop();
      }
    }
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
      pitch: 0,
      bounds,
      fitBoundsOptions: {padding: {top: 60, right: 60, bottom: 60, left: 60}}
    });
    this.controller = window.controller = new CameraController(this.map);

    this.map.on('resize', this.setGlobalPadding.bind(this));

    this.map.on('load', () => {
      this.setGlobalPadding({duration: 0});

      this.map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });

      //this.map.setTerrain({"source": "mapbox-dem"});

      this.map.addSource('route', {
        type: 'geojson',
        data: EMPTY_GEOJSON,
      });

      this.map.addSource('point', {
        type: 'geojson',
        data: MARKER
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

      this.map.addLayer({
        id: 'marker',
        source: 'point',
        type: 'circle',
        paint: {
          'circle-opacity': 1,
          'circle-color': 'red',
          'circle-pitch-alignment': 'map',
          'circle-radius': 8,
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

  setFollow (progress) {
    this.followProgressTarget = progress;

    if (!this.route) return;

    if (map.getLayer('marker')) this.map.setPaintProperty('marker', 'circle-opacity', 1);

    this.controller.setTargetPitch(40);
    
    this.setDisplayMode('follow');
  }

  setBound (bounds, forceUpdate) {
    const needsChange = forceUpdate || this.mode !== 'bound';
    this.setDisplayMode('bound');

    if (needsChange) {
      this.ready().then(() => this.map.setTerrain(null));

      this.map.fitBounds(bounds, {duration: 1000});

      if (map.getLayer('marker')) this.map.setPaintProperty('marker', 'circle-opacity', 0);
      this.followProgress = 0;
      this.followProgressTarget = 0;

      // Have to sequence this
      this.map.once('idle', () => this.map.easeTo({pitch: 0}));
    }
  }

  stepFollow (t, dt) {
    if (!this.route || !this.route.features) return;

    const step = Math.exp(-dt / 500.0);
    const followDelta = (step - 1) * this.followProgress + (1 - step) * this.followProgressTarget;

    if (Math.abs(followDelta) < 1e-5) return;

    this.followProgress += followDelta;

    const featureIndex = Math.min(Math.floor(this.followProgress), this.route.features.length - 1);
    const featureProgress = this.followProgress - featureIndex;

    const feature = this.route.features[featureIndex];
    this.setTerrain(feature.properties.mode === 'foot' ? 1 : 0, true);


    if (feature.properties.mode === 'foot') {
      this.controller.setTargetDistance(5000);
    } else {
      this.controller.setTargetDistance(10000);
    }

    const pos = along(
      feature.geometry,
      this.featureLength[featureIndex] * featureProgress,
      {units: 'kilometers'}
    );

    this.map.getSource('point').setData(pos);
    this.controller.setCenter(pos.geometry.coordinates);
  }

  setTerrain (exaggeration, forceTerrain) {
    const curTerrain = this.map.getTerrain();

    if (exaggeration || forceTerrain) {
      if (!curTerrain) {
        this.map.setTerrain({
          source: "mapbox-dem",
          exaggeration,
          "exaggeration-transition": {duration: 1000}
        });
      } else if (exaggeration !== curTerrain.exaggeration) {
        this.map.setTerrain({
          source: "mapbox-dem",
          exaggeration,
          "exaggeration-transition": {duration: 1000}
        });
      }
    } else {
      this.map.setTerrain(null);
    }
  }

  clearRoute (bounds) {
    if (bounds) {
      this.controller.fitBounds(bounds);
    }

    this.map.getSource('route').setData(EMPTY_GEOJSON);

    /*for (const layer of Object.keys(this.map.style._layers)) {
      if (~NO_HIDE_LAYERS.indexOf(layer)) continue;
      map.setLayoutProperty(layer, 'visibility', 'none');
    }*/
    this.route = null;
    for (const layer of FADE_LAYERS) {
      map.setPaintProperty(layer, 'line-opacity', 1.0);
    }
  }

  setRoute (geojson, bounds, immediate, usePadding) {
    /*for (const layer of Object.keys(this.map.style._layers)) {
      if (~NO_HIDE_LAYERS.indexOf(layer)) continue;
      map.setLayoutProperty(layer, 'visibility', 'visible');
    }*/
    this.route = geojson;
    this.featureLength = this.route.features.map(f => length(f.geometry, {units: 'kilometers'}));
    this.map.getSource('route').setData(geojson);
    //this.map.fitBounds(bounds);
    this.controller.fitBounds(bounds);
    this.setTerrain(0);

    //this.setDisplayMode('bound');

    for (const layer of FADE_LAYERS) {
      map.setPaintProperty(layer, 'line-opacity', 0.2);
    }
  }
}

export default MbxMap;
