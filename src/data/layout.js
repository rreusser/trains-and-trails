import computeLength from '@turf/length';
import along from '@turf/along';
import bbox from '@turf/bbox';
import { featureCollection } from '@turf/helpers';


function truncateCoords(feature, digits=6) {
  const f = Math.pow(10, digits);
  feature.geometry.coordinates = feature.geometry.coordinates.map(coord => [
    Math.round(coord[0] * f) / f,
    Math.round(coord[1] * f) / f,
  ]);
}

function computeLayout (route, {
  pixelsPerFootKm=1000,
  pixelsPerMetroKm=500
} = {}) {
  for (const feature of route.features) {
    truncateCoords(feature);

    feature.properties.length = {
      mi: computeLength(feature, {units: 'miles'}),
      km: computeLength(feature, {units: 'kilometers'}),
    };

    feature.properties.bbox = bbox(feature);

    feature.properties.markers = {
      mi: featureCollection([...Array(Math.floor(feature.properties.length.mi))].map((_, i) => ({
        ...truncateCoords(along(feature, i, {units: 'miles'})),
        properties: {
          distance: i,
          units: 'miles'
        }
      })).slice(1)),
      km: featureCollection([...Array(Math.floor(feature.properties.length.km))].map((_, i) => ({
        ...truncateCoords(along(feature, i, {units: 'kilometers'})),
        properties: {
          distance: i,
          units: 'kilometers'
        }
      })).slice(1)),
    };

    feature.properties.markers.mi
  };

  route.properties = {
    ...route.properties,
    bbox: bbox(route)
  };

  return route;
}

export default computeLayout;
