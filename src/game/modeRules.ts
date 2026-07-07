import type { Mode } from './types';

/**
 * 训练模式规则定义
 *
 * 每个模式整合：母球策略 + 命中容差 + 限时 + 错题上限 + 通关条件。
 * 取代之前的独立难度（DIFFICULTY），让"模式"成为单一玩法入口。
 */

export interface ModeRule {
  /** 模式 key */
  key: Mode;
  /** 中文名 */
  name: string;
  /** 说明（UI 展示） */
  desc: string;
  /** 母球位置策略：fixed=固定 / random=随机 */
  cueStrategy: 'fixed' | 'random';
  /** 命中容差（像素） */
  tolerance: number;
  /** 限时（ms），0=无限 */
  timeLimitMs: number;
  /** 答对加时（ms），限时模式用 */
  hitAddMs: number;
  /** 答错扣时（ms） */
  missSubMs: number;
  /** 最大错误次数，0=无限 */
  maxMistakes: number;
  /** 通关所需连击数，0=不按通关判定 */
  passCombo: number;
}

export const MODE_RULES: Record<Mode, ModeRule> = {
  novice: {
    key: 'novice',
    name: '新手',
    desc: '母球固定 · 大容差 · 连续答对 10 题通关',
    cueStrategy: 'fixed',
    tolerance: 34,
    timeLimitMs: 0,
    hitAddMs: 0,
    missSubMs: 0,
    maxMistakes: 0,
    passCombo: 10,
  },
  advanced: {
    key: 'advanced',
    name: '进阶',
    desc: '母球随机 · 标准容差 · 连续答对 15 题通关',
    cueStrategy: 'random',
    tolerance: 20,
    timeLimitMs: 0,
    hitAddMs: 0,
    missSubMs: 0,
    maxMistakes: 0,
    passCombo: 15,
  },
  master: {
    key: 'master',
    name: '大师',
    desc: '小容差 · 错 3 次即结束',
    cueStrategy: 'random',
    tolerance: 14,
    timeLimitMs: 0,
    hitAddMs: 0,
    missSubMs: 0,
    maxMistakes: 3,
    passCombo: 0,
  },
  time: {
    key: 'time',
    name: '限时',
    desc: '60 秒 · 答对 +2s · 答错 -5s',
    cueStrategy: 'random',
    tolerance: 20,
    timeLimitMs: 60_000,
    hitAddMs: 2_000,
    missSubMs: 5_000,
    maxMistakes: 0,
    passCombo: 0,
  },
};

/** 模式展示顺序 */
export const MODE_ORDER: readonly Mode[] = ['novice', 'advanced', 'master', 'time'];
