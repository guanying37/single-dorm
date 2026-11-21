/* ------------------------------------------------------------------ *
 * 学生平板 —— 全局门禁状态。
 *
 * 场景不再各自写“平板尚未接入”。所有需要学生平板的门/铁栅栏/检测机
 * 通过这个模块读取同一个状态；状态持久化在 localStorage，默认已解锁
 * （按剧情设定：玩家现在持有并通过验证的学生平板）。
 *
 * 不依赖 DOM / Three.js，可在任何场景或宿主页面中导入。
 * ------------------------------------------------------------------ */

const STORAGE_KEY = 'dsh.studentTablet.unlocked';
const listeners = new Set();

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true; // 默认已解锁
    return raw === '1';
  } catch {
    return true;
  }
}

let unlocked = typeof window === 'undefined' ? true : readStored();

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, unlocked ? '1' : '0');
  } catch {
    // 隐私模式 / file:// 下忽略。
  }
}

function emit() {
  for (const listener of listeners) {
    try {
      listener(unlocked);
    } catch (error) {
      console.warn('tablet listener failed:', error);
    }
  }
}

export function isTabletUnlocked() {
  return unlocked;
}

export function setTabletUnlocked(value) {
  const next = Boolean(value);
  if (next === unlocked) return unlocked;
  unlocked = next;
  persist();
  emit();
  return unlocked;
}

export function unlockTablet() {
  return setTabletUnlocked(true);
}

export function lockTablet() {
  return setTabletUnlocked(false);
}

export function subscribeTablet(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTabletInfo() {
  return {
    unlocked,
    label: unlocked ? '学生平板 · 已解锁' : '学生平板 · 未解锁',
    shortLabel: unlocked ? '平板已解锁' : '平板未解锁',
  };
}

/** 统一的门禁提示。 */
export function tabletDeniedMessage(label = '门') {
  return `${label} · 需刷学生平板`;
}

/** 给宿主页面的调试 API。 */
export function installTabletApi(target = window) {
  if (!target) return null;
  const api = {
    get unlocked() {
      return isTabletUnlocked();
    },
    isUnlocked: isTabletUnlocked,
    unlock: unlockTablet,
    lock: lockTablet,
    set: setTabletUnlocked,
    info: getTabletInfo,
    subscribe: subscribeTablet,
  };
  target.tablet = api;
  return api;
}
