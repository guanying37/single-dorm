import * as THREE from 'three';

/**
 * Self-contained first-person walker for a static ADV interior.
 *
 * - fixed eye height (default 1.80 m)
 * - WASD + Shift, acceleration/damping
 * - speed-scaled vertical bob, lateral sway and roll
 * - look limits, right-click freeze handled by the host
 * - recenter tween
 *
 * The host owns pointer lock/fullscreen and calls look()/update().
 */

export const DEFAULT_MOVE = Object.freeze({
  walkSpeed: 2.6,
  runSpeed: 6.2,
  acceleration: 14.0,
  lookSensitivity: 0.0028,
  pointerSensitivity: 0.00215,
  pitchLimit: Math.PI / 2 - 0.12,
  bobHeight: 0.014,
  bobRoll: 0.0025,
  bobFrequency: 6.4,
  bobSpeedGain: 1.15,
  bobLateral: 0.5,
  stepLength: 0.075,
});

export const DEFAULT_START = Object.freeze({
  x: 0,
  z: 0,
  yaw: 0,
  pitch: 0,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function damp(current, target, lambda, dt) {
  return target + (current - target) * Math.exp(-lambda * dt);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class FirstPersonControls {
  constructor(camera, collision, options = {}) {
    this.camera = camera;
    this.collision = collision;

    this.start = { ...DEFAULT_START, ...(options.start || {}) };
    this.move = { ...DEFAULT_MOVE, ...(options.move || {}) };
    this.eyeHeight = options.eyeHeight ?? 1.8;
    this.radius = options.radius ?? 0.3;

    this.position = new THREE.Vector3(this.start.x, 0, this.start.z);
    this.velocity = new THREE.Vector3();
    this.yaw = this.start.yaw;
    this.pitch = this.start.pitch;
    this.homeYaw = this.start.yaw;
    this.homePitch = this.start.pitch;

    this.frozen = false;
    this.enabled = true;
    this.keys = new Set();

    this.bobPhase = 0;
    this.bobAmount = 0;
    this.bobOffset = 0;
    this.lateral = 0;
    this.roll = 0;
    this.recenterState = null;
    this.lastSpeed = 0;

    this.camera.rotation.order = 'YXZ';
    this.applyCamera();
  }

  attach(target = window) {
    this.onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        this.keys.add('Shift');
        return;
      }
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        this.keys.add(event.code);
      }
    };
    this.onKeyUp = (event) => {
      if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        this.keys.delete('Shift');
        return;
      }
      this.keys.delete(event.code);
    };
    this.onBlur = () => this.keys.clear();
    target.addEventListener('keydown', this.onKeyDown);
    target.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('blur', this.onBlur);
    this._target = target;
  }

  detach() {
    const target = this._target;
    if (!target) return;
    target.removeEventListener('keydown', this.onKeyDown);
    target.removeEventListener('keyup', this.onKeyUp);
    target.removeEventListener('blur', this.onBlur);
    this._target = null;
  }

  setFrozen(value) {
    this.frozen = Boolean(value);
  }

  look(deltaX, deltaY, sensitivity = this.move.lookSensitivity) {
    if (this.frozen || !this.enabled) return;
    this.recenterState = null;
    this.yaw -= deltaX * sensitivity;
    this.pitch = clamp(this.pitch - deltaY * sensitivity, -this.move.pitchLimit, this.move.pitchLimit);
    this.applyCamera();
  }

  recenter() {
    const twoPi = Math.PI * 2;
    let deltaYaw = this.homeYaw - this.yaw;
    deltaYaw = ((deltaYaw + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
    const deltaPitch = this.homePitch - this.pitch;
    if (Math.abs(deltaYaw) < 0.001 && Math.abs(deltaPitch) < 0.001) {
      this.yaw = this.homeYaw;
      this.pitch = this.homePitch;
      this.recenterState = null;
      this.applyCamera();
      return false;
    }
    this.recenterState = {
      elapsed: 0,
      duration: 0.6,
      startYaw: this.yaw,
      startPitch: this.pitch,
      deltaYaw,
      deltaPitch,
    };
    return true;
  }

  setView({ x, z, yaw, pitch } = {}) {
    if (typeof x === 'number') this.position.x = x;
    if (typeof z === 'number') this.position.z = z;
    if (typeof yaw === 'number') this.yaw = yaw;
    if (typeof pitch === 'number') {
      this.pitch = clamp(pitch, -this.move.pitchLimit, this.move.pitchLimit);
    }
    this.velocity.set(0, 0, 0);
    this.recenterState = null;
    if (this.collision) this.collision.resolve(this.position, this.radius);
    this.applyCamera();
  }

  getView() {
    return {
      x: this.position.x,
      z: this.position.z,
      y: this.eyeHeight + this.bobOffset,
      yaw: this.yaw,
      pitch: this.pitch,
      frozen: this.frozen,
    };
  }

  getSpeed() {
    return this.velocity.length();
  }

  update(dt) {
    if (dt <= 0) return;
    this.updateRecenter(dt);

    const forwardInput = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0);
    const rightInput = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0);
    const running = this.keys.has('Shift');
    const maxSpeed = running ? this.move.runSpeed : this.move.walkSpeed;

    let desiredX = 0;
    let desiredZ = 0;
    if (this.enabled && (forwardInput !== 0 || rightInput !== 0)) {
      const length = Math.hypot(forwardInput, rightInput);
      const f = forwardInput / length;
      const r = rightInput / length;
      const forwardX = -Math.sin(this.yaw);
      const forwardZ = -Math.cos(this.yaw);
      const rightX = Math.cos(this.yaw);
      const rightZ = -Math.sin(this.yaw);
      desiredX = (forwardX * f + rightX * r) * maxSpeed;
      desiredZ = (forwardZ * f + rightZ * r) * maxSpeed;
    }

    const factor = 1 - Math.exp(-this.move.acceleration * dt);
    this.velocity.x += (desiredX - this.velocity.x) * factor;
    this.velocity.z += (desiredZ - this.velocity.z) * factor;
    if (Math.abs(this.velocity.x) < 0.001) this.velocity.x = 0;
    if (Math.abs(this.velocity.z) < 0.001) this.velocity.z = 0;

    const speed = this.velocity.length();
    this.lastSpeed = speed;

    if (speed > 0.0005) {
      const deltaX = this.velocity.x * dt;
      const deltaZ = this.velocity.z * dt;
      const distance = Math.hypot(deltaX, deltaZ);
      const steps = Math.max(1, Math.ceil(distance / this.move.stepLength));
      const stepX = deltaX / steps;
      const stepZ = deltaZ / steps;
      for (let i = 0; i < steps; i += 1) {
        this.position.x += stepX;
        this.position.z += stepZ;
        if (this.collision) this.collision.resolve(this.position, this.radius);
      }
    }

    const moving = speed > 0.15;
    const normalized = Math.min(2.0, speed / this.move.walkSpeed);
    const targetAmount = moving ? this.move.bobHeight * normalized : 0;
    this.bobAmount = damp(this.bobAmount, targetAmount, 10, dt);
    if (moving) this.bobPhase += dt * (this.move.bobFrequency + speed * this.move.bobSpeedGain);
    this.bobOffset = Math.sin(this.bobPhase * 2) * this.bobAmount;
    const rollTarget = moving ? Math.sin(this.bobPhase) * this.move.bobRoll * normalized : 0;
    this.roll = damp(this.roll, rollTarget, 8, dt);
    const lateralTarget = moving ? Math.cos(this.bobPhase) * this.bobAmount * this.move.bobLateral : 0;
    this.lateral = damp(this.lateral, lateralTarget, 12, dt);

    this.applyCamera();
  }

  updateRecenter(dt) {
    const state = this.recenterState;
    if (!state) return;
    state.elapsed = Math.min(state.duration, state.elapsed + dt);
    const t = state.elapsed / state.duration;
    const eased = easeInOutCubic(t);
    this.yaw = state.startYaw + state.deltaYaw * eased;
    this.pitch = state.startPitch + state.deltaPitch * eased;
    if (t >= 1) {
      this.yaw = this.homeYaw;
      this.pitch = this.homePitch;
      this.recenterState = null;
    }
    this.applyCamera();
  }

  applyCamera() {
    const eye = this.eyeHeight + this.bobOffset;
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);
    this.camera.position.set(
      this.position.x + rightX * this.lateral,
      eye,
      this.position.z + rightZ * this.lateral,
    );
    this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
  }
}
