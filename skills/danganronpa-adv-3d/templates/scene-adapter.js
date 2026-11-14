/**
 * Scene adapter skeleton.
 *
 * Interface only. No geometry, no model. Fixed camera and moving camera are
 * separate configuration blocks; a scene may enable one or both.
 */

import * as THREE from 'three';

export function createScene(context) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x17120f);

  // TODO: build room shell, kit modules, furniture and props from the brief.
  // Fixed shots and moving collision are separate deliverables.

  return {
    id: 'scene.example',
    title: '示例场景',
    scene,

    cameraModes: {
      fixed: {
        enabled: true,
        anchors: [
          // { id: 'shot.1', position: [0, 1.65, 0], target: [0, 1.0, 0], fov: 60, use: '' },
        ],
      },
      moving: {
        enabled: true,
        start: { x: 0, z: 0, yaw: 0, pitch: 0 },
        collision: null, // CollisionWorld; required when moving.enabled
        eyeHeight: 1.8,
        playerRadius: 0.3,
      },
    },

    interactiveMeshes: [],
    interactiveById: new Map(),
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
 * @property {THREE.Scene} scene
 * @property {{fixed: object, moving: object}} cameraModes
 * @property {THREE.Object3D[]} interactiveMeshes
 * @property {Map<string, object>} interactiveById
 * @property {(dt:number, elapsed:number)=>void} update
 * @property {(id:string)=>object|null} toggleInteractive
 * @property {()=>object[]} getInteractiveState
 * @property {()=>void} [dispose]
 */
