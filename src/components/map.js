import { h, Component, render } from 'preact';

mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN;

class MbxMap extends Component {
  createMap (element) {
    this.map = new mapboxgl.Map({
      container: element,
      style: 'mapbox://styles/rsreusser/ckt5f72080l7r18quyld7h4si/draft'
    });
  }

  render () {
    return h('div', {
      className: 'mbxmap',
      ref: this.createMap.bind(this)
    });
  }
}

export default MbxMap;

