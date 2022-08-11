import simplify from '@turf/simplify';
import { featureCollection, lineString } from '@turf/helpers';
import length from '@turf/length';
import bbox from '@turf/bbox';
import along from '@turf/along';

const EMPTY_GEOJSON = {
  "type": "FeatureCollection",
  "features": []
};

const metersToFeet = meters => meters * 5280 / 1609;

class Route {
  constructor (geojson) {
    this.geojson = geojson;
    this.simplified = simplify(geojson, {tolerance: 0.0001, highQuality: true});
    this.elevationProfiles = [];

    this.bboxes = {
      all: bbox(geojson),
      foot: bbox(featureCollection(geojson.features.filter(x => x.properties.mode === 'foot')))
    }

    this.computeElevationProfile();
    this._lengthCache = [];
  }

  computeElevationProfile () {
    for (let featureIndex = 0; featureIndex < this.geojson.features.length; featureIndex++) {
      const feature = this.geojson.features[featureIndex];

      if (feature.properties.mode !== 'foot') continue;

      const coords = feature.geometry.coordinates;
      const profile = [{
        distance: 0,
        elevation: metersToFeet(coords[0][2])
      }];

      let distance = 0;
      for (let i = 1; i < coords.length; i++) {
        distance += length(lineString([coords[i - 1], coords[i]]), {units: 'kilometers'});
        profile.push({distance, elevation: metersToFeet(coords[i][2])});
      }
      const els = profile.map(p => p.elevation);
      const els2 = els.slice();

      for (let j = 0; j < 10; j++) {
        for (let i = 1; i < els.length - 1; i++) {
          els2[i] = 0.5 * (els[i - 1] + els[i + 1]);
        }
        [els, els2] = [els2, els];
      }
      for (let i = 1; i < els.length - 1; i++) {
        profile[i].elevation = els[i];
      }
      this.elevationProfiles[featureIndex] = profile;
    }
  }

  getFootFeatureIndex () {
    for (let i = 0; i < this.geojson.features.length; i++) {
      if (this.geojson.features[i].properties.mode === 'foot') return i;
    }
    return -1;
  }

  getElevationProfile() {
    const featureIndex = this.getFootFeatureIndex();
    return this.elevationProfiles[featureIndex];
  }

  featureLength (featureIndex) {
    if (this._lengthCache[featureIndex] === undefined) {
      this._lengthCache[featureIndex] = length(this.geojson.features[featureIndex].geometry);
    }
    return this._lengthCache[featureIndex];
  }

  getBbox ({mode='all'} = {}) {
    return this.bboxes[mode];
  }

  getGeojson () {
    return this.geojson;
  }

  evaluate (position) {
    const featureIndex = Math.min(Math.floor(position), this.geojson.features.length - 1);
    const featureProgress = position - featureIndex;

    const feature = this.geojson.features[featureIndex];

    const pos = along(
      feature.geometry,
      this.featureLength(featureIndex) * featureProgress,
      {units: 'kilometers'}
    );

    return [pos.geometry.coordinates, feature];
  }

  getMileMarkers () {
    if (!this.geojson) return EMPTY_GEOJSON;

    const markers = [];
    for (const feature of this.geojson.features) {
      markers.push(...(feature.properties?.markers?.mi?.features || []));
    }
    return featureCollection(markers);
  }
}

export default Route;
