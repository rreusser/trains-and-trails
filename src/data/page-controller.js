import MapController from "./map-controller.js";
import Raf from "../util/raf.js";
import Smoother from "../util/smoother.js";
import Route from "./route.js";
import ElevationPlot from "./elevation-plot.js";

const MODE_COLORS = {
  bus: "#ba45b6",
  foot: "#5cb83b",
  metro: "#3388ff",
};

class PageController {
  constructor() {
    if (typeof window !== "undefined") {
      window.pageController = this;
    }
    this.map = null;

    this._onload = [];
    this.loaded = false;

    this.route = null;
    this.followProgress = new Smoother(150);
    this.dirty = false;
    this.needsPaddingUpdate = true;
    this.featureMode = null;

    this.followTimer = new Raf(this.step.bind(this));
  }

  initializeMap(container, bounds, callback) {
    this.elevationPlot = new ElevationPlot();

    this.map = new MapController(
      container,
      bounds,
      this.computeGlobalPadding(),
      () => {
        this.loaded = true;
        while (this._onload.length) {
          this._onload.pop()(this.map);
        }
      }
    );
  }

  ready() {
    if (this.loaded) return Promise.resolve(this.map);
    return new Promise((resolve) => {
      this._onload.push(resolve);
    });
  }

  setRoute(geojson, bounds, isInitialLoad) {
    this.dirty = true;
    this.route = new Route(geojson);
    this.ready().then(() => {
      this.map.setRouteData(this.route.getGeojson());
      this.map.setMileMarkers(this.route.getMileMarkers());
      this.map.map.fitBounds(this.route.getBbox({ mode: "foot" }), {
        duration: isInitialLoad ? 0 : 2000,
      });
      this.elevationPlot.setProfile(this.route.getElevationProfile());
    });
  }

  clearRoute() {
    this.route = null;
    this.followProgress.clear();
    this.map.setMileMarkers(null);
    this.ready().then(() => {
      this.map.setRouteData(null);
    });
  }

  stop() {
    this.followTimer.stop();
  }

  step(t, dt) {
    this.followProgress.tick(dt);
    const [progress, changed] = this.followProgress.getValue();

    if (changed || this.dirty) {
      this.dirty = false;
      switch (this.mode) {
        case "follow":
          if (this.route) {
            this.applyFollowProgress(progress, this.followProgress.target);

            this.map.camera.tick(t);
          }
          break;
      }
    }
  }

  setFeatureMode(mode) {
    if (!mode) {
      document.body.removeAttribute("data-feature-mode");
    }

    if (mode === this.featureMode) return;

    this.map.setMarkerColor(MODE_COLORS[mode || "metro"]);

    if (mode) {
      document.body.setAttribute("data-feature-mode", mode);
    }

    switch (mode) {
      case "foot":
        this.map.setMileMarkerOpacity(1);
        break;
      default:
        this.map.setMileMarkerOpacity(0);
    }
    this.featureMode = mode;
  }

  applyFollowProgress(progress, targetProgress, forcePosition) {
    if (!this.route) return;
    const [uneasedPosition] = this.route.evaluate(targetProgress);
    const [easedPosition, feature] = this.route.evaluate(progress);

    this.applyGlobalPadding();
    this.map.setTerrain(feature.properties.mode === "foot" ? 1.3 : 0, true);

    this.map.camera.targetCenter = uneasedPosition;
    this.map.camera.targetPitch = 40;

    this.setFeatureMode(feature.properties.mode);
    if (feature.properties.mode === "foot") {
      this.map.camera.targetDistance = 4500;
    } else if (feature.properties.mode === "bus") {
      this.map.camera.targetDistance = 11000;
    } else {
      this.map.camera.targetDistance = 16000;
    }

    this.map.setMarkerPosition(easedPosition);

    if (feature.properties.mode === "foot") {
      this.elevationPlot.setProgress(progress % 1);
    }
  }

  computeGlobalPadding() {
    const isHero = !this.mode || this.mode === "bound";
    const padding = { top: 60, right: 60, bottom: 60, left: 60 };

    if (isHero) {
      padding.bottom = window.innerHeight * 0.3 + 60;
    } else {
      padding.left = Math.max(60, Math.min(520 + 60, window.innerWidth - 520));
    }
    return padding;
  }

  applyGlobalPadding() {
    if (!this.needsPaddingUpdate) return;
    this.needsPaddingUpdate = false;
    this.map.setGlobalPadding(this.computeGlobalPadding());
  }

  // A pseudo-state-machine, but without cleanly defined transitions :shrug:
  setProgress(mode, progress) {
    const isModeChange = mode !== this.mode;
    this.mode = mode;
    if (isModeChange) {
      this.needsPaddingUpdate = true;
    }
    switch (this.mode) {
      case "bound":
        this.setFeatureMode(null);
        this.applyGlobalPadding();
        this.map.setTerrain(null);
        this.map.camera.clear();
        this.followProgress.clear();
        if (isModeChange) {
          this.followTimer.stop();
          this.map.setMarkerPosition(null);
          if (this.route) {
            this.map.map.fitBounds(this.route.getBbox({ mode: "foot" }), {
              duration: 1000,
            });
            this.map.map.once("idle", () => this.map.map.easeTo({ pitch: 0 }));
          }
        }
        break;
      case "follow":
        if (isModeChange) {
          this.followTimer.start();
        }

        this.followProgress.setTarget(progress);

        break;
      default:
        throw new Error(`invalid route mode: ${mode}`);
    }
  }

  setSimplifiedMode(isSimplified) {
    this.map.setSimplifiedMode(isSimplified);
  }
}

export default PageController;
