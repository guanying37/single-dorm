import * as THREE from 'three';
import { CEILING, CLOCK_WALL, CLOCK } from './config.js';
import {
  StaticBuilder,
  boxGeometry,
  cylinderGeometry,
  sphereGeometry,
  torusGeometry,
  trs,
  rodGeometry,
} from './utils.js';

/* ------------------------------------------------------------------ *
 * 灯具与设备：5 盏水晶吊灯、2 台老式黄光吊扇（同座挂监控）、4 台嵌入式
 * 中央空调、2 台端部监控、东墙圆形十二等分挂钟。
 *
 * 吊灯与空调全部静态合批；吊扇转子、监控头、钟针是动态小组。
 * ------------------------------------------------------------------ */

/* --- 水晶吊灯 ------------------------------------------------------ */

function buildChandelier(builder, chandelier) {
  const base = trs(chandelier.x, chandelier.y, chandelier.z);
  const add = (key, geometry, local) => builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(base, local));

  add('brass', cylinderGeometry(0.13, 0.15, 0.045, 20), trs(0, -0.022, 0));
  add('brass', cylinderGeometry(0.014, 0.014, 0.34, 8), trs(0, -0.21, 0));
  add('brass', sphereGeometry(0.075, 16, 12), trs(0, -0.39, 0));
  add('brassDark', cylinderGeometry(0.032, 0.05, 0.3, 14), trs(0, -0.55, 0));
  add('brass', cylinderGeometry(0.09, 0.03, 0.05, 16), trs(0, -0.72, 0));
  add('brassDark', sphereGeometry(0.045, 14, 10), trs(0, -0.76, 0));

  const tiers = [
    { radius: 0.6, y: -0.62, arms: 6, offset: 0 },
    { radius: 0.38, y: -0.82, arms: 6, offset: Math.PI / 6 },
  ];

  const crystalGeom = new THREE.OctahedronGeometry(0.02, 0);
  const crystalSmall = new THREE.OctahedronGeometry(0.014, 0);

  for (const tier of tiers) {
    add('brass', torusGeometry(tier.radius, 0.009, 6, 48), trs(0, tier.y, 0, 0, 1, 1, 1, Math.PI / 2));
    for (let i = 0; i < tier.arms; i += 1) {
      const angle = (i / tier.arms) * Math.PI * 2 + tier.offset;
      const x = Math.cos(angle) * tier.radius;
      const z = Math.sin(angle) * tier.radius;
      add('brass', rodGeometry([0, tier.y + 0.22, 0], [x * 0.55, tier.y + 0.07, z * 0.55], 0.008, 6), trs());
      add('brass', rodGeometry([x * 0.55, tier.y + 0.07, z * 0.55], [x, tier.y, z], 0.008, 6), trs());
      add('brassDark', cylinderGeometry(0.035, 0.045, 0.035, 10), trs(x, tier.y + 0.025, z));
      add('acWhite', cylinderGeometry(0.021, 0.026, 0.085, 10), trs(x, tier.y + 0.085, z));
      add('bulbWarmWhite', sphereGeometry(0.024, 10, 8), trs(x, tier.y + 0.145, z, 0, 1, 1.5, 1));
      for (let k = 0; k < 2; k += 1) {
        const offset = (k - 0.5) * 0.09;
        add(
          'crystal',
          crystalGeom,
          trs(
            x + Math.cos(angle + Math.PI / 2) * offset,
            tier.y - 0.065 - k * 0.02,
            z + Math.sin(angle + Math.PI / 2) * offset,
            0,
            1,
            2.1,
            1,
          ),
          { cast: false },
        );
      }
    }
  }

  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    const r = 0.47;
    add('crystal', crystalSmall, trs(Math.cos(angle) * r, -0.9, Math.sin(angle) * r, 0, 1, 2.6, 1), { cast: false });
    add('crystal', crystalSmall, trs(Math.cos(angle) * r, -0.95, Math.sin(angle) * r, 0, 1, 2.1, 1), { cast: false });
  }
  add('crystal', new THREE.OctahedronGeometry(0.045, 0), trs(0, -0.86, 0, 0, 1, 2.2, 1), { cast: false });
}

/* --- 嵌入式中央空调 ------------------------------------------------ */

function buildAcUnit(builder, ac) {
  const base = trs(ac.x, 3.6, ac.z);
  const add = (key, geometry, local) => builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(base, local));

  add('acWhite', boxGeometry(0.95, 0.05, 0.95), trs(0, -0.025, 0));
  add('acWhite', boxGeometry(0.99, 0.02, 0.99), trs(0, -0.005, 0));
  add('acGrille', boxGeometry(0.78, 0.012, 0.78), trs(0, -0.056, 0));
  add('acWhite', boxGeometry(0.4, 0.014, 0.4), trs(0, -0.062, 0));
  for (const side of [-1, 1]) {
    for (const sx of [-1, 1]) {
      add('matBlack', boxGeometry(0.16, 0.012, 0.012), trs(sx * 0.28, -0.062, side * 0.4));
      add('matBlack', boxGeometry(0.012, 0.012, 0.16), trs(sx * 0.4, -0.062, side * 0.28));
    }
  }
  for (let i = -3; i <= 3; i += 1) {
    add('acGrille', boxGeometry(0.34, 0.006, 0.012), trs(0, -0.068, i * 0.05));
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      add('acGrille', sphereGeometry(0.012, 8, 6), trs(sx * 0.44, -0.052, sz * 0.44));
    }
  }
}

/* --- 球机监控头 ---------------------------------------------------- */

/* 监控头不转动，直接并进静态批次：省下每台 3 个 draw call。 */
function buildCameraHead(builder, matrix) {
  const add = (key, geometry, local) => builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(matrix, local), { cast: false });
  add('cameraShell', cylinderGeometry(0.085, 0.085, 0.022, 16), trs(0, 0.011, 0));
  add('cameraShell', cylinderGeometry(0.088, 0.092, 0.03, 16), trs(0, -0.005, 0));
  const shellTop = new THREE.SphereGeometry(0.088, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
  add('cameraShell', shellTop, trs(0, -0.02, 0));
  const shellBottom = new THREE.SphereGeometry(0.086, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  add('dome', shellBottom, trs(0, -0.02, 0));
  add('matBlack', cylinderGeometry(0.03, 0.03, 0.008, 12), trs(0.03, -0.088, 0.05, 0, 1, 1, 1, 0.35));
  add('ledRed', sphereGeometry(0.008, 8, 6), trs(0.052, -0.03, 0.055));
}

/* --- 吊扇 ---------------------------------------------------------- */

function buildFan(builder, materials, root, fan) {
  const plateY = 3.58;
  const base = trs(fan.x, plateY, fan.z);
  const add = (key, geometry, local) => builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(base, local));

  add('brassDark', cylinderGeometry(0.2, 0.22, 0.04, 22), trs(0, 0, 0));
  add('brass', cylinderGeometry(0.022, 0.022, 0.42, 10), trs(0, -0.23, 0));
  add('brassDark', cylinderGeometry(0.06, 0.075, 0.05, 14), trs(0, -0.45, 0));

  // 扇叶转子（动态）：电机、5 片木叶、黄光玻璃灯罩。
  const rotor = new THREE.Group();
  rotor.name = `${fan.id}-rotor`;
  rotor.position.set(fan.x, plateY - 0.5, fan.z);
  const rotorBuilder = new StaticBuilder();
  rotorBuilder.add('fanBrass', cylinderGeometry(0.11, 0.12, 0.14, 20), trs(0, 0, 0));
  rotorBuilder.add('fanBrass', cylinderGeometry(0.13, 0.13, 0.03, 20), trs(0, 0.06, 0));
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    rotorBuilder.add('fanBlade', boxGeometry(0.62, 0.018, 0.15), trs(Math.cos(angle) * 0.36, -0.01, Math.sin(angle) * 0.36, -angle, 1, 1, 1, 0, 0.12));
    rotorBuilder.add('fanBrass', boxGeometry(0.18, 0.03, 0.05), trs(Math.cos(angle) * 0.14, 0.02, Math.sin(angle) * 0.14, -angle));
  }
  rotorBuilder.add('fanBrass', cylinderGeometry(0.12, 0.08, 0.05, 18), trs(0, -0.1, 0));
  rotorBuilder.add('bulbFanWarm', sphereGeometry(0.095, 16, 12), trs(0, -0.19, 0, 0, 1, 0.85, 1));
  rotorBuilder.add('fanBrass', torusGeometry(0.1, 0.008, 5, 24), trs(0, -0.11, 0, 0, 1, 1, 1, Math.PI / 2));
  rotorBuilder.flush(rotor, materials, `${fan.id}-rotor-meshes`);
  root.add(rotor);

  // 同座监控：短臂 + 球机，挂在吊扇底座旁（静态）。
  add('brassDark', boxGeometry(0.05, 0.05, 0.26), trs(0, -0.02, -0.24));
  add('brassDark', boxGeometry(0.05, 0.12, 0.05), trs(0, -0.1, -0.36));
  buildCameraHead(builder, trs(fan.x, plateY - 0.18, fan.z - 0.36));

  return { rotor };
}

/* --- 端部天花监控 -------------------------------------------------- */

function buildCeilingCamera(builder, camera) {
  const base = trs(camera.x, camera.y, camera.z);
  const add = (key, geometry, local) => builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(base, local));
  add('cameraShell', cylinderGeometry(0.1, 0.11, 0.03, 16), trs(0, 0, 0));
  add('matBlack', cylinderGeometry(0.035, 0.04, 0.1, 10), trs(0, -0.06, 0));

  buildCameraHead(builder, trs(camera.x, camera.y - 0.11, camera.z, camera.x < 0 ? Math.PI * 0.8 : -Math.PI * 0.8, 0.9, 0.9, 0.9));
}

/* --- 圆形挂钟 ------------------------------------------------------ */

function buildClock(builder, materials, root) {
  const base = trs(CLOCK_WALL.x - 0.02, CLOCK_WALL.y, CLOCK_WALL.z, -Math.PI / 2);
  const add = (key, geometry, local) => builder.add(key, geometry, new THREE.Matrix4().multiplyMatrices(base, local));
  const r = CLOCK_WALL.radius;

  add('walnutDark', cylinderGeometry(r + 0.035, r + 0.045, 0.09, 48), trs(0, 0, -0.045, 0, 1, 1, 1, Math.PI / 2));
  add('brass', torusGeometry(r + 0.012, 0.02, 8, 64), trs(0, 0, 0.004));
  add('brassDark', cylinderGeometry(r + 0.025, r + 0.025, 0.016, 48), trs(0, 0, -0.006, 0, 1, 1, 1, Math.PI / 2));
  add('clockFace', cylinderGeometry(r, r, 0.012, 56), trs(0, 0, 0.006, 0, 1, 1, 1, Math.PI / 2));
  add('clockInk', torusGeometry(r * 0.93, 0.004, 4, 64), trs(0, 0, 0.013));

  // 12 等分：放射状黄铜嵌线 + 12 个刻度点。
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    const long = i % 3 === 0;
    const inner = r * (long ? 0.56 : 0.72);
    const outer = r * 0.9;
    const mid = (inner + outer) / 2;
    add(
      'brassDark',
      boxGeometry(long ? 0.022 : 0.012, outer - inner, 0.008),
      trs(Math.cos(angle) * mid, Math.sin(angle) * mid, 0.014, 0, 1, 1, 1, 0, angle - Math.PI / 2),
    );
    add('brass', sphereGeometry(long ? 0.014 : 0.009, 10, 8), trs(Math.cos(angle) * r * 0.94, Math.sin(angle) * r * 0.94, 0.016, 0, 1, 1, 0.55));
  }
  add('brassDark', cylinderGeometry(0.032, 0.032, 0.02, 14), trs(0, 0, 0.022, 0, 1, 1, 1, Math.PI / 2));

  const clockGroup = new THREE.Group();
  clockGroup.position.set(CLOCK_WALL.x - 0.02, CLOCK_WALL.y, CLOCK_WALL.z);
  clockGroup.rotation.y = -Math.PI / 2;
  clockGroup.name = 'wall-clock';

  const makeHand = (length, width, depth, material, z, name) => {
    const pivot = new THREE.Group();
    pivot.name = name;
    const mesh = new THREE.Mesh(boxGeometry(width, length, depth), material);
    mesh.position.y = length / 2;
    mesh.castShadow = false;
    pivot.add(mesh);
    pivot.position.z = z;
    clockGroup.add(pivot);
    return pivot;
  };

  const hourHand = makeHand(r * 0.52, 0.03, 0.012, materials.clockInk, 0.032, 'hand-hour');
  const minuteHand = makeHand(r * 0.78, 0.022, 0.012, materials.clockInk, 0.044, 'hand-minute');
  const secondHand = makeHand(r * 0.86, 0.008, 0.008, materials.cardRed, 0.056, 'hand-second');
  const hub = new THREE.Mesh(sphereGeometry(0.026, 12, 10), materials.brass);
  hub.position.z = 0.064;
  hub.castShadow = false;
  clockGroup.add(hub);
  root.add(clockGroup);

  let time = { hour: CLOCK.hour, minute: CLOCK.minute, second: CLOCK.second };

  const setTime = (hour, minute, second = 0) => {
    const h = ((hour % 12) + 12) % 12;
    const m = Math.max(0, Math.min(59.999, minute));
    const s = Math.max(0, Math.min(59.999, second));
    secondHand.rotation.z = -(s / 60) * Math.PI * 2;
    minuteHand.rotation.z = -((m + s / 60) / 60) * Math.PI * 2;
    hourHand.rotation.z = -((h + m / 60) / 12) * Math.PI * 2;
    time = { hour: h, minute: m, second: s };
  };

  setTime(CLOCK.hour, CLOCK.minute, CLOCK.second);

  return { group: clockGroup, setTime, getTime: () => ({ ...time }), hands: { hourHand, minuteHand, secondHand } };
}

/* --- 组装 ---------------------------------------------------------- */

export function buildDecor(builder, materials, root) {
  for (const chandelier of CEILING.chandeliers) buildChandelier(builder, chandelier);
  for (const ac of CEILING.acs) buildAcUnit(builder, ac);

  const fans = [];
  for (const fan of CEILING.fans) fans.push(buildFan(builder, materials, root, fan));

  for (const camera of CEILING.cameras) {
    if (camera.kind === 'ceiling') buildCeilingCamera(builder, camera);
  }

  const clock = buildClock(builder, materials, root);

  return { fans, clock };
}
