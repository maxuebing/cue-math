import { LS_KEY_SETTINGS } from '../game/constants';
import type { Mode } from '../game/types';

/**
 * 用户设置持久化（cuemath.settings.v1）
 * 音效 / 震动 / 训练模式。
 */

export interface UserSettings {
  /** 音效开关 */
  sound: boolean;
  /** 震动开关 */
  vibrate: boolean;
  /** 训练模式 */
  mode: Mode;
}

const DEFAULTS: UserSettings = {
  sound: true,
  vibrate: true,
  mode: 'advanced',
};

/** 读取设置，缺失/异常返回默认值 */
export function loadSettings(): UserSettings {
  try {
    const raw = window.localStorage.getItem(LS_KEY_SETTINGS);
    if (!raw) {
      return { ...DEFAULTS };
    }
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

/** 写入设置 */
export function saveSettings(s: UserSettings): void {
  try {
    window.localStorage.setItem(LS_KEY_SETTINGS, JSON.stringify(s));
  } catch {
    /* 隐私模式或配额满，忽略 */
  }
}
