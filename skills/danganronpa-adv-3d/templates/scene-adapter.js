/**
 * Scene adapter skeleton.
 *
 * This file defines the interface only. It contains no geometry and is
 * not a model. Replace the throw with the project's scene builder once
 * the scene brief and asset list are approved.
 */

import * as THREE from 'three';

/**
 * @param {object} context
 * @param {THREE.WebGLRenderer} context.renderer
 * @param {object} context.materials shared material library
 * @param {object} context.kit shared modular kit
 * @returns {SceneAdapter}
 */
export function createScene(context) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x17120f);

  // TODO: build room shell, kit modules, furniture and props from the brief.
  // Keep static geometry batched and dynamic objects separate.

  return {
    id: 'scene.example',
    title: '示例场景',
    mode: 'hybrid', // walk | fixed | hybrid
    scene,
    cameraAnchors: [
      // { id: 'anchor.1', position: [0, 1.65, 0], yaw: 0, pitch: 0, fov: 60 },
    ],
    interactiveMeshes: [],
    interactiveById: new Map(),
    collision: null, // required for walk/hybrid
    start: { x: 0, z: 0, yaw: 0, pitch: 0 },
    eyeHeight: 1.8,
    playerRadius: 0.3,
    update() {},
    toggleInteractive() {
      return null;
    },
    getInteractiveState() {
      return [];
    },
    dispose() {},
  };
}

/**
 * @typedef {object} SceneAdapter
 * @property {string} id
 * @property {string} title
 * @property {'walk'|'fixed'|'hybrid'} mode
 * @property {THREE.Scene} scene
 * @property {object[]} cameraAnchors
 * @property {THREE.Object3D[]} interactiveMeshes
 * @property {Map<string, object>} interactiveById
 * @property {object|null} collision
 * @property {{x:number,z:number,yaw:number,pitch:number}} start
 * @property {number} [eyeHeight]
 * @property {number} [playerRadius]
 * @property {(dt:number, elapsed:number)=>void} update
 * @property {(id:string)=>object|null} toggleInteractive
 * @property {()=>object[]} getInteractiveState
 * @property {()=>void} [dispose]
 */
