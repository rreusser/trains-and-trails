import lerp from './lerp.js';

class Smoother {
  constructor (timescale) {
    this.tol = 1e-10;
    this.value = null;
    this.target = null;
    this.time = null;
    this.timescale = timescale;
    this.changedc = false;
  }

  setTarget (value) {
    this.target = value;
    this.changed = true;
    if (this.value === null) {
      this.value = this.target;
    }
  }

  tick (dt) {
    const oldValue = this.value;
    const decay = Math.exp(-dt * Math.LN2 / this.timescale);
    this.value = lerp(this.target, this.value, decay);
    this.changed = Math.abs(oldValue - this.value) > this.tol;

  }

  getValue () {
    if (this.value === null) {
      throw new Error('invalid read of uninitialized smoother');
    }
    return [this.value, this.changed];
  }

  clear () {
    this.value = null;
    this.target = null;
    this.time = null;
    this.changed = true;
  }
}

export default Smoother;
