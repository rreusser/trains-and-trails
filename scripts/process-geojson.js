import computeLength from "@turf/length";
import along from "@turf/along";
import simplify from "@turf/simplify";
import bbox from "@turf/bbox";
import { featureCollection } from "@turf/helpers";

function truncateCoords(feature, digits = 5) {
  const f = Math.pow(10, digits);
  const iter =
    feature.geometry.type === "Point"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
  iter.forEach((coord) => {
    coord[0] = Math.round(coord[0] * f) / f;
    coord[1] = Math.round(coord[1] * f) / f;
    coord.length = Math.min(coord.length, 3);
  });
  return feature;
}

function processGeoJSON(
  route,
  { pixelsPerFootKm = 1000, pixelsPerMetroKm = 500 } = {}
) {
  for (const feature of route.features) {
    feature.geometry = simplify(feature.geometry, {
      tolerance: 0.00002,
      highQuality: true,
    });

    truncateCoords(feature);

    feature.properties.length = {
      mi: computeLength(feature, { units: "miles" }),
      km: computeLength(feature, { units: "kilometers" }),
    };

    feature.properties.bbox = bbox(feature);

    if (feature.properties.mode === "foot") {
      feature.properties.markers = {
        mi: featureCollection(
          [...Array(Math.ceil(feature.properties.length.mi))]
            .map((_, i) => ({
              ...truncateCoords(along(feature, i, { units: "miles" })),
              properties: {
                distance: i,
                units: "miles",
              },
            }))
            .slice(1)
        ),
        km: featureCollection(
          [...Array(Math.ceil(feature.properties.length.km))]
            .map((_, i) => ({
              ...truncateCoords(along(feature, i, { units: "kilometers" })),
              properties: {
                distance: i,
                units: "kilometers",
              },
            }))
            .slice(1)
        ),
      };
    }
  }

  return route;
}

export default processGeoJSON;
