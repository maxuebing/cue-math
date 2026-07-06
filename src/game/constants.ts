/**
 * 游戏常量：中式八球桌（竖向）尺寸、袋口、颗星、配色、动画、通关条件
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
export const CORNER_POCKET_R = 16;

/** 中袋半径（像素，中八中袋略大） */
export const MID_POCKET_R = 18;

/** 球半径（像素） */
export const BALL_RADIUS = 9;

/** 每条库边的颗星点数量（中八标准 6 颗） */
export const DIAMONDS_PER_SIDE = 6;

/** 命中容差：用户第一库点击点与正确点的距离阈值（像素） */
export const HIT_TOLERANCE_PX = 18;

/** 障碍球与路径的安全距离（像素），用于题面合法性判断 */
export const OBSTACLE_CLEARANCE = BALL_RADIUS * 2 + 2;

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
} as const;

/** 母球沿轨迹移动速度（像素 / 秒） */
export const ANIM_SPEED = 620;

/** 进阶模式通关连击数（PRD §3.2） */
export const ADVANCED_PASS_COMBO = 15;

/** Local Storage 键名 */
export const LS_KEY_BEST_SCORE = 'cuemath.bestScore';
