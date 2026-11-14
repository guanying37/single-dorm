import * as THREE from 'three';
import { START, MOVE, HALL } from './config.js';
import { clamp, damp, easeInOutCubic } from './utils.js';

/* ------------------------------------------------------------------ *
 * First-person walker.
 *
 * Eye height is locked to 1.80 m. WASD moves on the floor plane, Shift
 * runs, and a deliberately small vertical bob (1.2 cm) plus a 0.15°
 * roll give weight without ever changing the authored eye line. There
 * is no player mesh: this is a disembodied camera for an ADV scene.
 * ------------------------------------------------------------------ */

export class FirstPersonControls {
  constructor(camera, collision) {
    this.camera = camera;
    this.collision = collision;

    this.position = new THREE.Vector3(START.x, 0, START.z);
    this.velocity = new THREE.Vector3();
    this.yaw = START.yaw;
    this.pitch = START.pitch;
    this.homeYaw = START.yaw;
    this.homePitch = START.pitch;

    this.eyeHeight = HALL.eyeHeight;
    this.radius = HALL.playerRadius;
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
    this.applyCamera(0);
  }

  attach(target = window) {
    this.onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const code = event.code;
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        this.keys.add('Shift');
        return;
      }
      if (code === 'KeyW' || code === 'KeyA' || code === 'KeyS' || code === 'KeyD') {
        this.keys.add(code);
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
  }

  detach(target = window) {
    target.removeEventListener('keydown', this.onKeyDown);
    target.removeEventListener('keyup', this.onKeyUp);
    target.removeEventListener('blur', this.onBlur);
  }

  setFrozen(value) {
    this.frozen = Boolean(value);
  }

  look(deltaX, deltaY, sensitivity = MOVE.lookSensitivity) {
    if (this.frozen || !this.enabled) return;
    this.recenterState = null;
    this.yaw -= deltaX * sensitivity;
    this.pitch = clamp(this.pitch - deltaY * sensitivity, -MOVE.pitchLimit, MOVE.pitchLimit);
    this.applyCamera(0);
  }

  recenter() {
    const twoPi = Math.PI * 2;
    let deltaYaw = this.homeYaw - this.yaw;
    deltaYaw = ((deltaYaw + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
    const deltaPitch = this.homePitch - this.pitch;
    if (Math.abs(deltaYaw) < 0.001 && Math.abs(deltaPitch) < 0.001) {
      this.yaw = this.homeYaw;
      this.pitch = this.homePitch;
      this.applyCamera(0);
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

  setView({ x, z, yaw, pitch }) {
    if (typeof x === 'number') this.position.x = x;
    if (typeof z === 'number') this.position.z = z;
    if (typeof yaw === 'number') this.yaw = yaw;
    if (typeof pitch === 'number') this.pitch = clamp(pitch, -MOVE.pitchLimit, MOVE.pitchLimit);
    this.velocity.set(0, 0, 0);
    this.recenterState = null;
    this.collision.resolve(this.position, this.radius);
    this.applyCamera(0);
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
    const maxSpeed = running ? MOVE.runSpeed : MOVE.walkSpeed;

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

    const factor = 1 - Math.exp(-MOVE.acceleration * dt);
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
      const steps = Math.max(1, Math.ceil(distance / 0.075));
      const stepX = deltaX / steps;
      const stepZ = deltaZ / steps;
      for (let i = 0; i < steps; i += 1) {
        this.position.x += stepX;
        this.position.z += stepZ;
        this.collision.resolve(this.position, this.radius);
      }
    }

    const moving = speed > 0.15;
    const normalized = Math.min(2.0, speed / MOVE.walkSpeed);
    const targetAmount = moving ? MOVE.bobHeight * normalized : 0;
    this.bobAmount = damp(this.bobAmount, targetAmount, 10, dt);
    if (moving) this.bobPhase += dt * (MOVE.bobFrequency + speed * 1.15);
    this.bobOffset = Math.sin(this.bobPhase * 2) * this.bobAmount;
    const rollTarget = moving ? Math.sin(this.bobPhase) * MOVE.bobRoll * normalized : 0;
    this.roll = damp(this.roll, rollTarget, 8, dt);
    const lateralTarget = moving ? Math.cos(this.bobPhase) * this.bobAmount * 0.5 : 0;
    this.lateral = damp(this.lateral, lateralTarget, 12, dt);

    this.applyCamera(dt);
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
