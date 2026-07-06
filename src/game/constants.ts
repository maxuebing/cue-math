/**
 * 游戏常量：中式八球桌（竖向）尺寸、袋口、颗星、配色、动画、通关条件、难度
 *
 * 竖向布局：短边为宽（左右库间距），长边为高（上下库间距），2:1 比例。
 * 颗星训练：母球 2 库 kick（绕障碍球击目标球）。
 */

/** 球桌可玩区域宽（短边，像素） */
export const TABLE_W = 360;

/** 球桌可玩区域高（长边，像素） */
export const TABLE_H = 720;

/** 库边视觉宽度（像素） */
export const RAIL_WIDTH = 24;

/** 角袋半径（像素） */
export const CORNER_POCKET_R = 22;

/** 中袋半径（像素，中八中袋略大） */
export const MID_POCKET_R = 26;

/** 球半径（像素） */
export const BALL_RADIUS = 14;

/** 球直径 */
export const BALL_DIAMETER = BALL_RADIUS * 2;

/** 球-球 / 球-路径最小安全间距（球径 + 余量），用于题面合法性判断 */
export const BALL_COLLISION_CLEARANCE = BALL_DIAMETER + 2;

/** 球心可达边界相对库边线的内缩量（= 球半径，使球体贴库而非压入库边） */
export const RAIL_CENTER_INSET = BALL_RADIUS;

/** 每条库边的颗星点数量（中八标准 6 颗） */
export const DIAMONDS_PER_SIDE = 6;

/** 默认命中容差（normal 难度，像素） */
export const HIT_TOLERANCE_PX = 18;

/**
 * 难度分级：值为第一库撞点的命中容差（像素），越大越易命中
 */
export const DIFFICULTY = {
  /** 简单：容差大，适合新手 */
  easy: 28,
  /** 进阶：默认 */
  normal: HIT_TOLERANCE_PX,
  /** 大师：容差小，要求精准 */
  hard: 12,
} as const;

/** 难度名 */
export type Difficulty = keyof typeof DIFFICULTY;

/**
 * 中式八球配色（蓝色比赛台呢 + 6 袋口 + 金色颗星）
 * 全部为 0xRRGGBB 数字，供 PixiJS Graphics 使用
 */
export const COLORS = {
  /** 台呢主色（蓝） */
  cloth: 0x1a5fb4,
  /** 台呢深色（边缘渐暗） */
  clothDeep: 0x14438a,
  /** 库边木色 */
  rail: 0x4a2c1a,
  /** 库边高光 */
  railEdge: 0x6b3d22,
  /** 颗星刻度点（浅金） */
  diamond: 0xf5e6b8,
  /** 袋口（黑） */
  pocket: 0x0a0a0a,
  /** 母球（白） */
  cueBall: 0xffffff,
  /** 目标球（黄/橙） */
  targetBall: 0xf59e0b,
  /** 障碍球（灰，不可击打） */
  obstacle: 0x6b7280,
  /** 正确轨迹（绿） */
  trackCorrect: 0x22c55e,
  /** 错误路线（红） */
  trackWrong: 0xef4444,
  /** 当前撞库边高亮（金） */
  cushionHighlight: 0xd4af37,
  /** 命中波纹（金） */
  ripple: 0xfde68a,
  /** 用户错误撞点标记（红） */
  userMark: 0xef4444,
} as const;

/** 母球沿轨迹移动速度（像素 / 秒） */
export const ANIM_SPEED = 620;

/** 进阶模式通关连击数（PRD §3.2） */
export const ADVANCED_PASS_COMBO = 15;

/** Local Storage 键名 */
export const LS_KEY_BEST_SCORE = 'cuemath.bestScore';

/** 用户设置持久化 key（音效 / 震动 / 难度） */
export const LS_KEY_SETTINGS = 'cuemath.settings.v1';
