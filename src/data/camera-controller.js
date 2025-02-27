/*import vec3length from "gl-vec3/length.js";
import vec3normalize from "gl-vec3/normalize.js";
import vec3cross from "gl-vec3/cross.js";
import vec2normalize from "gl-vec2/normalize.js";
import vec2dot from "gl-vec2/dot.js";
import { point } from "@turf/helpers";
import distance from "@turf/distance";

class CameraController {
  constructor(map) {
    window.camcont = this;
    this.map = map;
    this.raf = null;
    this.currentLookAt = mapboxgl.MercatorCoordinate.fromLngLat(
      map.transform.center
    );
    this.previousLookAt = this.currentLookAt;
    this.previousLookAtTime = NaN;
    this.targetLookAt = this.currentLookAt;
    this.targetDistance = 1000000; // m
    this.targetPitch = 5;
    this.targetBearing = 0;
    this.targetCenter = this.center = mapboxgl.MercatorCoordinate.fromLngLat(
      map.transform.center
    );
    this.targetCenter = null;
    this.dirty = true;
    this.previousTime = NaN;
    this.accumError = [0, 0, 0];
    const globalStrength = 0.0;
    this.Kp_pan = 2.5 * globalStrength;
    this.Ki_pan = 1.5 * globalStrength;
    this.Kd_pan = 150 * globalStrength;
    this.Kp_pitch = 5 * globalStrength;
    this.Kp_dist = 1 * globalStrength;
    this.Kp_bearing = 0 * globalStrength;
    this.followStrength = 0;
  }

  setTargetDistance(value) {
    this.targetDistance = value;
  }

  setTargetPitch(value) {
    this.targetPitch = value;
  }

  setTargetBearing(value) {
    this.targetBearing = value;
  }

  setTargetCenter(center) {
    this.targetCenter = mapboxgl.MercatorCoordinate.fromLngLat(center);
  }

  isClear() {
    return this.targetCenter === null;
  }

  clear() {
    this.targetCenter = null;
  }

  setKi(value) {
    this.Ki = value;
  }

  setPanPID(P = 1, I = 0, D = 0) {
    this.Kp_pan = P;
    this.Ki_pan = I;
    this.Kd_pan = D;
  }

  setPitchP(P = 1) {
    this.Kp_pitch = P;
  }

  setDistP(P = 1) {
    this.Kp_dist = P;
  }

  setBearingP(P = 1) {
    this.Kp_bearing = P;
  }

  setFollowStrength(value) {
    this.followStrength = value;
  }

  fitBounds(bounds) {
    bounds = bounds.flat();
    const lonCen = 0.5 * (bounds[2] + bounds[0]);
    const latCen = 0.5 * (bounds[3] + bounds[1]);
    const dLon = 0.5 * (bounds[2] - bounds[0]);
    const dLat = 0.5 * (bounds[3] - bounds[1]);
    const lonDist = distance(
      point([lonCen, latCen]),
      point([lonCen - dLon, latCen]),
      { units: "meters" }
    );
    const latDist = distance(
      point([lonCen, latCen]),
      point([lonCen, latCen - dLat]),
      { units: "meters" }
    );
    const tanFov = Math.tan((this.map.transform.fov * Math.PI) / 180);
    const ar = window.innerWidth / window.innerHeight;
    const latCameraDist = (2 * latDist) / tanFov;
    const lonCameraDist = (2 * lonDist) / tanFov / ar;

    this.targetDistance = Math.max(latCameraDist, lonCameraDist) * 1.5;
    this.setTargetBearing(0);
    this.setTargetPitch(5);
    this.setTargetCenter([lonCen, latCen]);
  }

  tick(t) {
    if (this.isClear()) {
      throw new Error("invalid camera controller state: no target set");
    }
    const dt = isNaN(this.previousTime)
      ? 0
      : Math.min(t / 1000 - this.previousTime, 32 / 1000);
    this.previousTime = t / 1000;
    const cam = this.map.getFreeCameraOptions();

    const mLookAt = new mapboxgl.MercatorCoordinate(
      this.currentLookAt.x,
      this.currentLookAt.y,
      this.currentLookAt.z
    );

    const mLookTarget = this.targetCenter;
    const mCamera = cam.position;
    const toMeters = 1 / mLookTarget.meterInMercatorCoordinateUnits();
    const mPanErr = [
      mLookTarget.x - mLookAt.x,
      mLookTarget.y - mLookAt.y,
      mLookTarget.z - mLookAt.z,
    ];
    const mdist = vec3length(mPanErr);
    const targetErrorMeters = mdist * toMeters;

    this.accumError[0] += mPanErr[0] * dt;
    this.accumError[1] += mPanErr[1] * dt;
    this.accumError[2] += mPanErr[2] * dt;

    const sky = [0, 0, 1];
    const vcam = [
      mLookTarget.x - mCamera.x,
      mLookTarget.y - mCamera.y,
      mLookTarget.z - mCamera.z,
    ];
    const e0cam = vec3normalize([], vcam);
    const e1cam = vec3normalize([], vec3cross([], e0cam, sky));
    const e2cam = vec3cross([], e1cam, e0cam); // already normalized

    const camDist = vec3length(vcam) * toMeters;
    const camDistForce = 1.0 - camDist / this.targetDistance;

    this.camDist = camDist;
    this.camDistForce = camDistForce;

    const camPitch = Math.acos(-vcam[2] / vec3length(vcam));
    const pitchForce = this.targetPitch * (Math.PI / 180) - camPitch;

    const bearingTarget = [
      Math.cos(this.targetBearing * (Math.PI / 180)),
      Math.sin(this.targetBearing * (Math.PI / 180)),
    ];
    const curBearing = vec2normalize([], [e0cam[0], e0cam[1]]);

    const b = vec2dot(bearingTarget, curBearing) * Math.sin(camPitch);
    const bearingForce = [-b * curBearing[1], b * curBearing[0]];

    const lx = mLookAt.x;
    const ly = mLookAt.y;
    const lz = mLookAt.z;
    if (
      targetErrorMeters > 0.001 ||
      Math.abs(camDistForce) > 0.00001 ||
      Math.abs(pitchForce) > 0.00001 ||
      Math.abs(b) > 1e-6
    ) {
      const distp = this.Kp_dist * (camDist / toMeters);
      const pitchp = this.Kp_pitch * (camDist / toMeters);
      const bearingp = this.Kp_bearing * (camDist / toMeters);
      const pani = this.Ki_pan;
      const panp = this.Kp_pan;
      const pand = this.Kd_pan;

      let dlookdt = [0, 0, 0];
      if (!isNaN(this.previousLookAtTime) && t > this.previousLookAtTime) {
        let dt = t - this.previousLookAtTime;
        dlookdt[0] = (mLookAt.x - this.previousLookAt.x) / dt;
        dlookdt[1] = (mLookAt.y - this.previousLookAt.y) / dt;
        dlookdt[2] = (mLookAt.z - this.previousLookAt.z) / dt;
      }

      let e = this.accumError;
      const panx = (mPanErr[0] * panp + e[0] * pani + dlookdt[0] * pand) * dt;
      const pany = (mPanErr[1] * panp + e[1] * pani + dlookdt[1] * pand) * dt;
      const panz = (mPanErr[2] * panp + e[2] * pani + dlookdt[2] * pand) * dt;
      mLookAt.x += panx;
      mLookAt.y += pany;
      mLookAt.z += panz;

      mCamera.x += panx * (1 - this.followStrength);
      mCamera.y += pany * (1 - this.followStrength);
      mCamera.z += panz * (1 - this.followStrength);

      mCamera.x -= e2cam[0] * pitchForce * pitchp * dt;
      mCamera.y -= e2cam[1] * pitchForce * pitchp * dt;
      mCamera.z -= e2cam[2] * pitchForce * pitchp * dt;

      mCamera.x += bearingForce[0] * bearingp * dt;
      mCamera.y += bearingForce[1] * bearingp * dt;

      vec3normalize(vcam, vcam);
      mCamera.x -= vcam[0] * camDistForce * distp * dt;
      mCamera.y -= vcam[1] * camDistForce * distp * dt;
      mCamera.z -= vcam[2] * camDistForce * distp * dt;

      cam.lookAtPoint(this.currentLookAt.toLngLat());
      this.currentLookAt = mLookAt;
      this.map.setFreeCameraOptions(cam);
    }

    if (isNaN(this.previousLookAtTime) || t > this.previousLookAtTime) {
      this.previousLookAt = new mapboxgl.MercatorCoordinate(lx, ly, lz);
      this.previousLookAtTime = t;
    }
  }
}

export default CameraController;

*/
