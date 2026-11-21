import * as THREE from 'three';
import { CURTAIN } from './config.js';
import { boxGeometry, cylinderGeometry, trs } from './geometry.js';
import { curtainPanelGeometry } from './geometry.js';

/* ------------------------------------------------------------------ *
 * Pale-blue privacy curtains.
 *
 * Five ceiling tracks run across the bed bays. Each track carries two
 * pleated panels; closed, they meet in the middle; opened, both gather
 * against the west wall. The panels are the only soft goods in the room
 * and are deliberately non-colliding: they can be brushed through rather
 * than trapping the player between a bed and a closed curtain.
 * ------------------------------------------------------------------ */

export function buildCurtains(builder, materials, root) {
  const x0 = CURTAIN.trackX0;
  const x1 = CURTAIN.trackX1;
  const length = x1 - x0;
  const centerX = (x0 + x1) / 2;
  const panelWidth = (length - 0.02) / 2;
  const halfPanel = panelWidth / 2;

  // Shared pleated geometry; each panel mesh animates position and scale.
  const panelGeometry = curtainPanelGeometry(panelWidth, CURTAIN.panelHeight, 7, 0.04, 40, 12);
  const curtains = [];

  CURTAIN.dividersZ.forEach((z, index) => {
    // Track, ceiling drops and a wall-end bracket.
    builder.add('curtainTrack', boxGeometry(length + 0.06, 0.028, 0.06), trs(centerX, CURTAIN.trackY + 0.02, z));
    builder.add('curtainTrack', boxGeometry(length + 0.02, 0.018, 0.1), trs(centerX, CURTAIN.trackY - 0.005, z));
    for (const x of [x0 + 0.05, centerX, x1 - 0.05]) {
      builder.add('aluminum', cylinderGeometry(0.009, 0.009, 0.34, 8), trs(x, CURTAIN.trackY + 0.19, z));
    }
    builder.add('aluminum', boxGeometry(0.05, 0.12, 0.1), trs(x0 + 0.01, CURTAIN.trackY + 0.02, z));
    // A tiny end stop on the aisle side.
    builder.add('aluminum', boxGeometry(0.035, 0.05, 0.07), trs(x1 - 0.01, CURTAIN.trackY + 0.02, z));

    const panels = [];
    for (let side = 0; side < 2; side += 1) {
      const mesh = new THREE.Mesh(panelGeometry, materials.curtain);
      mesh.name = `curtain-${index}-${side}`;
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      mesh.position.set(centerX + (side === 0 ? -halfPanel / 2 : halfPanel / 2), CURTAIN.bottomY + CURTAIN.panelHeight / 2, z + (side === 0 ? -0.018 : 0.018));
      root.add(mesh);
      panels.push({
        mesh,
        closedX: centerX + (side === 0 ? -halfPanel / 2 : halfPanel / 2),
        closedZ: z + (side === 0 ? -0.018 : 0.018),
        openX: x1 - 0.22 - side * 0.015,
        openZ: z + (side === 0 ? 0.02 : 0.055),
      });
    }
    curtains.push({
      id: `curtain.${index + 1}`,
      label: '隔帘',
      z,
      panels,
      open: true,
      target: 1,
    });
  });

  // Apply the authored initial state without a visible tween.
  for (const curtain of curtains) {
    for (const panel of curtain.panels) {
      const open = Boolean(curtain.open);
      panel.mesh.position.x = open ? panel.openX : panel.closedX;
      panel.mesh.position.z = open ? panel.openZ : panel.closedZ;
      panel.mesh.scale.x = open ? 0.5 : 1;
    }
  }

  return curtains;
}
