import bbox from '@turf/bbox';
import length from '@turf/length';
import along from '@turf/along';
import { point } from '@turf/helpers';
import CameraController from '../../lib/mapbox-gl-third-person-camera.js';
import Route from './route.js';

if (typeof window !== "undefined" && typeof window.mapboxgl !== "undefined") {
  mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN;
}

const HOME_FADE_TEXT_LAYERS = [
  'natural-line-label',
  'natural-point-label',
  'water-line-label',
  'water-point-label',
  'poi-label',
  'transit-label',
  'settlement-subdivision-label',
  'settlement-minor-label',
  'settlement-major-label',
  'state-label',
  'country-label',
];

const EMPTY_GEOJSON = {
  "type": "FeatureCollection",
  "features": []
};

const MARKER = point([0, 0]);

class MapController {
  constructor (container, bounds, padding, onload) {
    this.map = window.map = new mapboxgl.Map({
      container,
      //style: 'mapbox://styles/rreusser/cl3jof9o3000g14le3tzu1ih9/draft',
      style: 'mapbox://styles/rsreusser/ckt5f72080l7r18quyld7h4si',
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
      logoPosition: 'top-right',
      fitBoundsOptions: {padding}
    });

    map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');

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

          this.map.addSource('mapbox-dem-2', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 256,
            'maxzoom': 14
          });

          this.map.getSource('mapbox://mapbox.satellite').maxzoom = 15

          this.map.addLayer({
            id: 'hillshade',
            source: 'mapbox-dem-2',
            type: 'hillshade',
            paint: {
              'hillshade-exaggeration': 1,
              'hillshade-highlight-color': 'rgba(255,230,210,0.3)',
              'hillshade-shadow-color': 'rgba(0,10,20,1)',
              'hillshade-illumination-anchor': 'map',
              'hillshade-illumination-direction': 180,
            }
          }, 'ferry');

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
            id: 'routeline-bg',
            source: 'route',
            type: 'line',
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': ['case',
                ['==', ['get', 'mode'], 'bus'], '#592556',
                ['==', ['get', 'mode'], 'metro'], '#23388f',
                ['==', ['get', 'mode'], 'foot'], '#1c381b',
                'black'
              ],
              'line-width': 7,
            }
          }, 'ferry-aerialway-label');

          this.map.addLayer({
            id: 'routeline-nonfoot',
            source: 'route',
            type: 'line',
            filter: ['!=', ['get', 'mode'], 'foot'],
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': ['case',
                ['==', ['get', 'mode'], 'bus'], '#ba45b6',
                ['==', ['get', 'mode'], 'metro'], '#3388ff',
                ['==', ['get', 'mode'], 'foot'], '#5cb83b',
                'black'
              ],
              'line-width': 4
            }
          }, 'ferry-aerialway-label');

          this.map.addLayer({
            id: 'routeline-foot',
            source: 'route',
            type: 'line',
            filter: ['==', ['get', 'mode'], 'foot'],
            layout: {
              'line-cap': 'round',
              'line-join': 'round'
            },
            paint: {
              'line-color': ['case',
                ['==', ['get', 'mode'], 'bus'], '#ba45b6',
                ['==', ['get', 'mode'], 'metro'], '#3388ff',
                ['==', ['get', 'mode'], 'foot'], '#5cb83b',
                'black'
              ],
              'line-width': 4
            }
          }, 'ferry-aerialway-label');

          this.map.addLayer({
            id: 'marker',
            source: 'marker-point',
            type: 'circle',
            paint: {
              'circle-opacity': 1,
              'circle-color': 'white',
              'circle-pitch-alignment': 'map',
              'circle-radius': 7,
              'circle-stroke-width': 3,
              'circle-stroke-color': '#5cb83b',
            }
          }, 'ferry-aerialway-label');

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
              'text-field': '{distance}',
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-offset': [0, -1.2],
            },
            paint: {
              'text-opacity': 0.0,
              'icon-opacity': 0.0,
              'text-color': 'white',
              'text-halo-color': 'rgba(0,0,0,0.7)',
              'text-halo-width': 0.75,
              'text-halo-blur': 0.5,
            }
          }, 'ferry-aerialway-label');

          onload && onload();
      });
    });
  }

  setMarkerColor (color) {
    this.map.setPaintProperty('marker', 'circle-stroke-color', color);
  }

  setMileMarkerOpacity (opacity) {
    this.map.setPaintProperty('mile-markers', 'text-opacity', opacity);
    this.map.setPaintProperty('mile-markers', 'icon-opacity', opacity);
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

  setSimplifiedMode (isSimplified) {
    this.map.setLayoutProperty('mile-markers', 'visibility', isSimplified ? 'none' : 'visible');

    for (const layer of HOME_FADE_TEXT_LAYERS) {
      this.map.setPaintProperty(layer, 'text-opacity', isSimplified ? 0 : 1);
      this.map.setPaintProperty(layer, 'icon-opacity', isSimplified ? 0 : 1);
    }
  }
}

export default MapController;
