class Raf {
  constructor (onframe) {
    this.onframe = onframe;
    this.raf = null;
    this.tPrev = null;
  }

  start () {
    const onframe = (t) => {
      const dt = this.tPrev === null ? 0 : t - this.tPrev;
      this.tPrev = t;

      this.onframe(t, dt);

      this.raf = requestAnimationFrame(onframe);
    }
    this.raf = requestAnimationFrame(onframe);
  }

  stop () {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
      this.tPrev = null;
    }
  }
}

export default Raf;
