import computeLength from '@turf/length';
import along from '@turf/along';
import bbox from '@turf/bbox';
import { featureCollection } from '@turf/helpers';


function truncateCoords(feature, digits=6) {
  const f = Math.pow(10, digits);
  const iter = feature.geometry.type === 'Point' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  iter.forEach(coord => {
    coord[0] = Math.round(coord[0] * f) / f;
    coord[1] = Math.round(coord[1] * f) / f;
  });
  return feature;
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
