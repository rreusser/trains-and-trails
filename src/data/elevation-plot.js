const kmToMiles = (km) => km / 1.609;
//const milesToKm = mi => mi * 1.609;

class ElevationPlot {
  constructor() {
    const el = document.createElement("div");
    el.setAttribute("id", "elevation-plot");
    document.body.appendChild(el);

    const marker = (this.marker = document.createElement("div"));
    marker.classList.add("elevation-marker");
    el.appendChild(marker);

    this.margin = { top: 5, right: 15, bottom: 17, left: 40 };

    this.svg = d3.select(el).append("svg");
    this.container = this.svg.append("g");

    this.container.append("g").attr("class", "x-axis axis");
    this.container.append("g").attr("class", "y-axis axis");
    this.container.append("g").attr("class", "grid x-grid");
    this.container.append("g").attr("class", "grid y-grid");
    this.container.append("path").attr("class", "elevation-fill");
    this.container.append("path").attr("class", "elevation");

    this.data = null;

    window.addEventListener("resize", () => this.draw());
  }

  getIndex(dist) {
    if (!this.data) return -1;
    let lo = 0;
    let hi = this.data.length - 1;
    let middle;
    while (lo <= hi) {
      middle = Math.floor((lo + hi) / 2);
      if (this.data[middle].distance === dist) {
        return middle;
      } else if (this.data[middle].distance < dist) {
        lo = middle + 1;
      } else {
        hi = middle - 1;
      }
    }
    return middle;
  }

  setProgress(progress) {
    if (!this.data || !this.x || !this.y) return;
    if (arguments.length) this._progress = progress;
    const dist = this.data[this.data.length - 1].distance;
    const index = this.getIndex(dist * this._progress);
    const elevation = this.data[index].elevation;
    window.elplot = this;

    const x = this.x(kmToMiles(dist * this._progress)) + this.margin.left;
    const y = this.y(elevation) + this.margin.top;
    this.marker.style.transform = `translate(${x}px,${y}px)`;
  }

  draw() {
    if (!this.data) return;

    this.width = Math.min(
      520 - this.margin.left - this.margin.right,
      Math.max(
        Math.min(window.innerWidth, 540),
        window.innerWidth - 520 - this.margin.left - this.margin.right
      )
    );
    this.width = Math.min(
      this.width,
      window.innerWidth - this.margin.left - this.margin.right
    );
    this.height = window.innerWidth <= 640 ? 60 : 100;

    this.svg
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.container.attr(
      "transform",
      "translate(" + this.margin.left + "," + this.margin.top + ")"
    );

    const x = (this.x = d3
      .scaleLinear()
      .domain([0, kmToMiles(this.data[this.data.length - 1].distance)])
      .range([0, this.width]));

    const y = (this.y = d3
      .scaleLinear()
      .domain([this.minElevation, this.maxElevation])
      .range([this.height, 0]));

    const xAxis = d3.axisBottom(x).ticks(10);
    const yAxis = d3.axisLeft(y).ticks(5);

    this.container
      .select(".x-axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(xAxis);
    this.container.select(".y-axis").call(yAxis);

    //const xGrid = xAxis.tickSize(-this.height).tickFormat("");
    const yGrid = yAxis.tickSize(-this.width).tickFormat("");

    /*this.container
      .select(".x-grid")
      .attr("transform", "translate(0," + this.height + ")")
      .call(xGrid);*/

    this.container.select(".y-grid").call(yGrid);

    this.container
      .select(".elevation")
      .datum(this.data)
      .attr("fill", "none")
      .attr("stroke", "#5cb83b")
      .attr("stroke-width", 3)
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return kmToMiles(x(d.distance));
          })
          .y(function (d) {
            return y(d.elevation);
          })
      );

    const fillData = this.data.slice();
    const rhs = { ...fillData[fillData.length - 1] };
    const lhs = { ...fillData[0] };
    rhs.elevation = y.invert(this.height);
    lhs.elevation = y.invert(this.height);
    fillData.push(rhs, lhs);

    this.container
      .select(".elevation-fill")
      .datum(fillData)
      .attr("fill", "#31814126")
      .attr("stroke", "none")
      .attr(
        "d",
        d3
          .line()
          .x(function (d) {
            return kmToMiles(x(d.distance));
          })
          .y(function (d) {
            return y(d.elevation);
          })
      );
  }

  setProfile(profile) {
    if (profile) this.data = profile;
    if (!profile) return;

    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < this.data.length; i++) {
      min = Math.min(min, this.data[i].elevation);
      max = Math.max(max, this.data[i].elevation);
    }
    //const avg = (max + min) * 0.5;
    const rad = (max - min) * 0.5;
    min -= rad * 0.1;
    max += rad * 0.1;
    this.minElevation = min;
    this.maxElevation = max;

    this.draw();
  }
}

export default ElevationPlot;
