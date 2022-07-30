import bbox from '@turf/bbox';
import length from '@turf/length';
import along from '@turf/along';
import { point } from '@turf/helpers';
import CameraController from './camera-controller.js';
import Route from './route.js';

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

class MapController {
  constructor (container, bounds, padding, onload) {
    this.map = window.map = new mapboxgl.Map({
      container,
      style: { version: 8, layers: [], sources: {} },
      //style; 'mapbox://styles/rreusser/cl3jof9o3000g14le3tzu1ih9/draft',
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
      fitBoundsOptions: {padding}
    });

    //map.showPadding = true;

    this.camera = window.camera = new CameraController(this.map);

    this.map.on('load', () => {
      map.loadImage(
        'pin.png',
        (error, image) => {
          if (error) throw error;
          map.addImage('pin', image);
          this.map.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
          });

          this.map.addSource('route', {
            type: 'geojson',
            data: EMPTY_GEOJSON,
          });

          this.map.addSource('mile-markers', {
            type: 'geojson',
            data: EMPTY_GEOJSON,
          });

          this.map.addSource('marker-point', {
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
            source: 'marker-point',
            type: 'circle',
            paint: {
              'circle-opacity': 1,
              'circle-color': 'red',
              'circle-pitch-alignment': 'map',
              'circle-radius': 8,
            }
          });

          this.map.addLayer({
            id: 'mile-markers',
            source: 'mile-markers',
            type: 'symbol',
            layout: {
              'icon-image': 'pin',
              'icon-offset': [0, -22],
              'icon-size': 0.4,
              'icon-text-fit': 'width',
              'icon-text-fit-padding': [0, 28, 0, 28],
              'text-field': '{mile}',
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-offset': [0, -1.2],
            },
            paint: {
              'text-color': 'white',
              'text-halo-color': 'rgba(0,0,0,0.7)',
              'text-halo-width': 0.75,
              'text-halo-blur': 0.5,
            }
          });

          onload && onload();
      });
    });
  }

  setMileMarkers (geojson) {
    this.map.getSource('mile-markers').setData(geojson || EMPTY_GEOJSON);
  }

  setGlobalPadding (padding) {
    this.map.easeTo({padding, duration: 0});
  }

  setRouteData (geojson) {
    this.map.getSource('route').setData(geojson || EMPTY_GEOJSON);
  }

  setCenter (position) {
    this.map.setCenter(position);
  }

  setMarkerPosition (position) {
    const markerLayer = map.getLayer('marker');
    if (!markerLayer) return;

    const markerSource = map.getSource('marker-point');
    if (!markerSource) return

    if (!position) {
      this.map.setPaintProperty('marker', 'circle-opacity', 0);
    }
    this.map.setPaintProperty('marker', 'circle-opacity', 1);
    markerSource.setData(position ? point(position) : EMPTY_GEOJSON);
  }

  setTerrain (exaggeration, forceTerrain) {
    const curTerrain = this.map.getTerrain();

    if (exaggeration || forceTerrain) {
      if (!curTerrain) {
        this.map.setTerrain({source: "mapbox-dem", exaggeration});
      } else if (exaggeration !== curTerrain.exaggeration) {
        this.map.setTerrain({
          source: "mapbox-dem",
          exaggeration,
          "exaggeration-transition": {duration: 1000}
        });
      }
    } else if (curTerrain) {
      this.map.setTerrain(null);
    }
  }
}

export default MapController;
