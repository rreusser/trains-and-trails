(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
    ? define(factory)
    : ((global =
        typeof globalThis !== "undefined" ? globalThis : global || self),
      (global.MapboxThirdPersonCamera = factory()));
})(this, function () {
  "use strict";

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false,
    });
    return Constructor;
  }

  var length_1$1 = length$1;
  /**
   * Calculates the length of a vec3
   *
   * @param {vec3} a vector to calculate length of
   * @returns {Number} length of a
   */

  function length$1(a) {
    var x = a[0],
      y = a[1],
      z = a[2];
    return Math.sqrt(x * x + y * y + z * z);
  }

  var normalize_1$1 = normalize$1;
  /**
   * Normalize a vec3
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a vector to normalize
   * @returns {vec3} out
   */

  function normalize$1(out, a) {
    var x = a[0],
      y = a[1],
      z = a[2];
    var len = x * x + y * y + z * z;

    if (len > 0) {
      //TODO: evaluate use of glm_invsqrt here?
      len = 1 / Math.sqrt(len);
      out[0] = a[0] * len;
      out[1] = a[1] * len;
      out[2] = a[2] * len;
    }

    return out;
  }

  var cross_1 = cross;
  /**
   * Computes the cross product of two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {vec3} a the first operand
   * @param {vec3} b the second operand
   * @returns {vec3} out
   */

  function cross(out, a, b) {
    var ax = a[0],
      ay = a[1],
      az = a[2],
      bx = b[0],
      by = b[1],
      bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }

  var normalize_1 = normalize;
  /**
   * Normalize a vec2
   *
   * @param {vec2} out the receiving vector
   * @param {vec2} a vector to normalize
   * @returns {vec2} out
   */

  function normalize(out, a) {
    var x = a[0],
      y = a[1];
    var len = x * x + y * y;

    if (len > 0) {
      //TODO: evaluate use of glm_invsqrt here?
      len = 1 / Math.sqrt(len);
      out[0] = a[0] * len;
      out[1] = a[1] * len;
    }

    return out;
  }

  var length_1 = length;
  /**
   * Calculates the length of a vec2
   *
   * @param {vec2} a vector to calculate length of
   * @returns {Number} length of a
   */

  function length(a) {
    var x = a[0],
      y = a[1];
    return Math.sqrt(x * x + y * y);
  }

  var dot_1 = dot;
  /**
   * Calculates the dot product of two vec2's
   *
   * @param {vec2} a the first operand
   * @param {vec2} b the second operand
   * @returns {Number} dot product of a and b
   */

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }

  var CameraController = /*#__PURE__*/ (function () {
    function CameraController(map) {
      var _ref =
          arguments.length > 1 && arguments[1] !== undefined
            ? arguments[1]
            : {},
        _ref$distance = _ref.distance,
        distance = _ref$distance === void 0 ? 10000 : _ref$distance,
        _ref$pitch = _ref.pitch,
        pitch = _ref$pitch === void 0 ? 45 : _ref$pitch,
        _ref$bearing = _ref.bearing,
        bearing = _ref$bearing === void 0 ? 0 : _ref$bearing;

      _classCallCheck(this, CameraController);

      this.map = map;
      this.MercatorCoordinate =
        this.map.getFreeCameraOptions().position.constructor;
      this._distanceTarget = distance;
      this._pitchTarget = pitch;
      this._bearingTarget = bearing;
      this._centerTarget = this.center = this.MercatorCoordinate.fromLngLat(
        map.transform.center
      );
      this._centerTarget = null;
      this._center = this._previousCenter = null; //= this.MercatorCoordinate.fromLngLat(map.transform.center);

      this._previousTime = NaN;
      this._previousLookAtTime = NaN;
      this._errorIntegral = [0, 0, 0];
      const globalStrength = 1.0;
      this.Kp_pan = 2.5 * globalStrength;
      this.Ki_pan = 1.5 * globalStrength;
      this.Kd_pan = 150 * globalStrength;
      this.Kp_pitch = 5 * globalStrength;
      this.Kp_dist = 2 * globalStrength;
      this.Kp_bearing = 0 * globalStrength;
      this._follow = 1 * globalStrength;
      this._hadTerrain = false;
    }

    _createClass(CameraController, [
      {
        key: "_cloneCoord",
        value: function _cloneCoord(coord) {
          return new this.MercatorCoordinate(coord.x, coord.y, coord.z);
        },
      },
      {
        key: "targetDistance",
        get: function get() {
          return this._distanceTarget;
        },
        set: function set(value) {
          this._distanceTarget = value;
        },
      },
      {
        key: "targetPitch",
        get: function get() {
          return this._pitchTarget;
        },
        set: function set(value) {
          this._pitchTarget = value;
        },
      },
      {
        key: "targetBearing",
        get: function get() {
          return this._bearingTarget;
        },
        set: function set(value) {
          this._bearingTarget = value;
        },
      },
      {
        key: "targetCenter",
        get: function get() {
          return this._centerTarget;
        },
        set: function set(center) {
          var elevation = this.map.queryTerrainElevation(center) || 0;
          this._centerTarget = this.MercatorCoordinate.fromLngLat(
            center,
            elevation
          );
        },
      },
      {
        key: "clear",
        value: function clear() {
          this._center = null;
        },
      },
      {
        key: "setPanPID",
        value: function setPanPID() {
          var P =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : 2.5;
          var I =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : 1.5;
          var D =
            arguments.length > 2 && arguments[2] !== undefined
              ? arguments[2]
              : 150;
          this.Kp_pan = P;
          this.Ki_pan = I;
          this.Kd_pan = D;
        },
      },
      {
        key: "setPitchP",
        value: function setPitchP() {
          var P =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : 2;
          this.Kp_pitch = P;
        },
      },
      {
        key: "setDistP",
        value: function setDistP() {
          var P =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : 2;
          this.Kp_dist = P;
        },
      },
      {
        key: "setBearingP",
        value: function setBearingP() {
          var P =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : 0;
          this.Kp_bearing = P;
        },
      },
      {
        key: "follow",
        get: function get() {
          return this._follow;
        },
        set: function set(value) {
          this._follow = Math.max(0, Math.min(1, value));
        },
      },
      {
        key: "tick",
        value: function tick(t) {
          if (!this._centerTarget) {
            throw new Error("invalid camera controller state: no target set");
          }

          var toMeters =
            1 / this._centerTarget.meterInMercatorCoordinateUnits();

          var cam = this.map.getFreeCameraOptions();
          var hasTerrain = !!this.map.getTerrain(); // If there's no current position,

          if (this._center === null) {
            this._center = this._cloneCoord(this._centerTarget);
            this._previousCenter = this._cloneCoord(this._centerTarget);
            this._previousLookAtTime = t;
            var dist = this._distanceTarget / toMeters;
            var elevation =
              this.map.queryTerrainElevation(this._centerTarget.toLngLat()) ||
              0;
            if (elevation !== null) this._centerTarget.z = elevation / toMeters;
            var theta = (this._bearingTarget * Math.PI) / 180;
            var phi = (this._pitchTarget * Math.PI) / 180;
            cam.position.x =
              this._center.x + Math.sin(phi) * Math.sin(theta) * dist;
            cam.position.y =
              this._center.y + Math.sin(phi) * Math.cos(theta) * dist;
            cam.position.z =
              this._center.z + Math.cos(phi) * dist + elevation / toMeters;
            cam.lookAtPoint(this._center.toLngLat());
            this.map.setFreeCameraOptions(cam);
            this._hadTerrain = hasTerrain;
            return;
          }

          var dt = isNaN(this._previousTime)
            ? 0
            : Math.min(t - this._previousTime, 32) / 1000;
          this._previousTime = t; // Compensate for terrain being added/removed

          if (hasTerrain && !this._hadTerrain) {
            var el = this.map.queryTerrainElevation(
              this._centerTarget.toLngLat()
            );

            if (el !== null) {
              this._centerTarget.z += el / toMeters;
              this._hadTerrain = hasTerrain;
            }
          } else if (!hasTerrain && this._hadTerrain) {
            this._centerTarget.z = 0;
            this._hadTerrain = hasTerrain;
          } // Overwrite this. We can't look at a point that's not on the ground. But otherwise proceed as normal.

          this._center.z = this._centerTarget.z;
          var mPanErr = [
            this._centerTarget.x - this._center.x,
            this._centerTarget.y - this._center.y,
            this._centerTarget.z - this._center.z,
          ]; // Use only the first two coordinates!

          var targetErrorMeters = length_1(mPanErr) * toMeters;
          this._errorIntegral[0] += mPanErr[0] * dt;
          this._errorIntegral[1] += mPanErr[1] * dt;
          this._errorIntegral[2] += mPanErr[2] * dt;
          var sky = [0, 0, 1];
          var vcam = [
            this._centerTarget.x - cam.position.x,
            this._centerTarget.y - cam.position.y,
            this._centerTarget.z - cam.position.z,
          ];
          var e0cam = normalize_1$1([], vcam);
          var e1cam = normalize_1$1([], cross_1([], e0cam, sky));
          var e2cam = cross_1([], e1cam, e0cam); // already normalized

          var camDist = length_1$1(vcam) * toMeters;
          var camDistForce = 1.0 - camDist / this._distanceTarget;
          var camPitch = Math.acos(-vcam[2] / length_1$1(vcam));
          var pitchForce = this._pitchTarget * (Math.PI / 180) - camPitch;
          var bearingTarget = [
            Math.cos(this._bearingTarget * (Math.PI / 180)),
            Math.sin(this._bearingTarget * (Math.PI / 180)),
          ];
          var curBearing = normalize_1([], [e0cam[0], e0cam[1]]);
          var b = dot_1(bearingTarget, curBearing) * Math.sin(camPitch);
          var bearingForce = [-b * curBearing[1], b * curBearing[0]]; // Store this for later

          var lx = this._center.x;
          var ly = this._center.y;
          var lz = this._center.z;
          var pani = this.Ki_pan;
          var panp = this.Kp_pan;
          var pand = this.Kd_pan;
          var distp = this.Kp_dist * (camDist / toMeters);
          var pitchp = this.Kp_pitch * (camDist / toMeters);
          var bearingp = this.Kp_bearing * (camDist / toMeters);

          if (
            targetErrorMeters * panp > this._distanceTarget / 1000 ||
            Math.abs(camDistForce) * distp > 1e-8 ||
            Math.abs(pitchForce) * pitchp > 1e-8 ||
            length_1(bearingForce) * bearingp > 1e-8
          ) {
            var dlookdt = [0, 0, 0];

            if (
              this._previousCenter &&
              !isNaN(this._previousLookAtTime) &&
              t > this._previousLookAtTime
            ) {
              var _dt = t - this._previousLookAtTime;

              dlookdt[0] = (this._center.x - this._previousCenter.x) / _dt;
              dlookdt[1] = (this._center.y - this._previousCenter.y) / _dt;
              dlookdt[2] = (this._center.z - this._previousCenter.z) / _dt;
            } // Compute PID pan force

            var panx =
              (mPanErr[0] * panp +
                this._errorIntegral[0] * pani +
                dlookdt[0] * pand) *
              dt;
            var pany =
              (mPanErr[1] * panp +
                this._errorIntegral[1] * pani +
                dlookdt[1] * pand) *
              dt;
            var panz =
              (mPanErr[2] * panp +
                this._errorIntegral[2] * pani +
                dlookdt[2] * pand) *
              dt; // Mutate the look-at point in-place

            this._center.x += panx;
            this._center.y += pany;
            this._center.z += panz; // Pan the camera together with lookAt, only when *not* follow mode, which instead
            // prefers to let the camera trail behind rather than pulling it together with the
            // lookAt point.

            cam.position.x += panx * (1 - this._follow);
            cam.position.y += pany * (1 - this._follow);
            cam.position.z += panz * (1 - this._follow); // Pitch the camera

            cam.position.x -= e2cam[0] * pitchForce * pitchp * dt;
            cam.position.y -= e2cam[1] * pitchForce * pitchp * dt;
            cam.position.z -= e2cam[2] * pitchForce * pitchp * dt; // Adjust the bearing

            cam.position.x += bearingForce[0] * bearingp * dt;
            cam.position.y += bearingForce[1] * bearingp * dt; // Adjust the camera distance

            normalize_1$1(vcam, vcam);
            cam.position.x -= vcam[0] * camDistForce * distp * dt;
            cam.position.y -= vcam[1] * camDistForce * distp * dt;
            cam.position.z -= vcam[2] * camDistForce * distp * dt;
            cam.lookAtPoint(this._center.toLngLat());
            this.map.setFreeCameraOptions(cam);
          }

          this._previousCenter = new this.MercatorCoordinate(lx, ly, lz);
          this._previousLookAtTime = t;
        },
        /*
      fitBounds(bounds) {
        bounds = bounds.flat();
        const lonCen = 0.5 * (bounds[2] + bounds[0])
        const latCen = 0.5 * (bounds[3] + bounds[1])
        const dLon = 0.5 * (bounds[2] - bounds[0])
        const dLat = 0.5 * (bounds[3] - bounds[1])
        const lonDist = distance(point([lonCen, latCen]), point([lonCen - dLon, latCen]), {units: 'meters'});
        const latDist = distance(point([lonCen, latCen]), point([lonCen, latCen - dLat]), {units: 'meters'});
        const tanFov = Math.tan(this.map.transform.fov * Math.PI / 180);
        const ar = window.innerWidth / window.innerHeight;
        const latCameraDist = 2 * latDist / tanFov;
        const lonCameraDist = 2 * lonDist / tanFov / ar;
         this._distanceTarget = Math.max(latCameraDist, lonCameraDist) * 1.5;
        this.setTargetBearing(0);
        this.setTargetPitch(5);
        this.setTargetCenter([lonCen, latCen]);
      }
      */
      },
    ]);

    return CameraController;
  })();

  return CameraController;
});
//# sourceMappingURL=mapbox-gl-third-person-camera.js.map
