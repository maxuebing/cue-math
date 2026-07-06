/**
 * 游戏核心类型定义（中式八球 2 库 kick 训练）
 */

/** 二维点（球桌像素坐标，原点位于台呢左上角） */
export interface Point {
  x: number;
  y: number;
}

/** 库边标识（顶 / 底 / 左 / 右） */
export type Cushion = 'top' | 'bottom' | 'left' | 'right';

/** 游戏状态机状态名（PRD §3.1） */
export type GameStateName =
  | 'Init'
  | 'Generate'
  | 'Wait_Input'
  | 'Animation'
  | 'Settle';

/** 训练模式（Phase 1 仅实现 advanced） */
export type Mode = 'novice' | 'advanced' | 'master' | 'time';

/**
 * 2 库 kick 题面
 * 母球需依次撞 cushions[0]、cushions[1] 两条库后击中目标球，
 * 途中障碍球挡住直线与 1 库路径，迫使用 2 库解球。
 */
export interface Question {
  /** 母球坐标 */
  cueBall: Point;
  /** 目标球坐标 */
  targetBall: Point;
  /** 障碍球坐标（不可击打，用于挡路） */
  obstacle: Point;
  /** 指定的两库顺序，如 ['top', 'left'] */
  cushions: [Cushion, Cushion];
  /** 正确路径 [Cue, P1, P2, Target]（镜像展开法计算） */
  realPath: Point[];
}

/** 答题结果 */
export interface AnswerResult {
  /** 是否命中 */
  hit: boolean;
  /** 用户选择的第一库撞点 */
  userPoint: Point;
  /** 正确的第一库撞点 */
  realPoint: Point;
  /** 用户折线（Cue → userPoint） */
  userPath: Point[];
  /** 正确折线（Cue → P1 → P2 → Target） */
  realPath: Point[];
  /** 本题指定的两库顺序 */
  cushions: [Cushion, Cushion];
}
