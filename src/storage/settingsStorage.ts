import { LS_KEY_SETTINGS, type Difficulty } from '../game/constants';

/**
 * 用户设置持久化（cuemath.settings.v1）
 * 音效 / 震动 / 难度开关，带容错读取与版本化 key。
 */

export interface UserSettings {
  /** 音效开关 */
  sound: boolean;
  /** 震动开关 */
  vibrate: boolean;
  /** 难度（影响命中容差） */
  difficulty: Difficulty;
}

const DEFAULTS: UserSettings = {
  sound: true,
  vibrate: true,
  difficulty: 'normal',
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
