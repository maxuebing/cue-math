import {
  TABLE_W,
  TABLE_H,
  BALL_RADIUS,
  CORNER_POCKET_R,
} from './constants';
import { computeTwoCushionPath, midpoint } from './diamondSystem';
import type { Cushion, Point, Question } from './types';

/**
 * 题面生成策略（PRD §3.2）
 * 生成 2 库 kick 场景：母球、目标球、障碍球、指定两库顺序、镜像法正确路径。
 */

/** 球距库边 / 袋口的最小安全边距 */
const MARGIN = BALL_RADIUS + 10;

/** 6 个袋口位置（4 角 + 2 中袋），用于路径合法性校验 */
const POCKETS: readonly Point[] = [
  { x: 0, y: 0 },
  { x: TABLE_W, y: 0 },
  { x: 0, y: TABLE_H },
  { x: TABLE_W, y: TABLE_H },
  { x: 0, y: TABLE_H / 2 },
  { x: TABLE_W, y: TABLE_H / 2 },
];

/** 合法的相邻两库组合（不能撞同一条库，需绕障碍） */
const CUSHION_PAIRS: readonly [Cushion, Cushion][] = [
  ['top', 'left'],
  ['top', 'right'],
  ['bottom', 'left'],
  ['bottom', 'right'],
  ['left', 'top'],
  ['left', 'bottom'],
  ['right', 'top'],
  ['right', 'bottom'],
];

/** 闭区间随机浮点数 */
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** 从只读数组随机取一个元素 */
function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 在指定矩形范围内生成一个球位 */
function randomPoint(minX: number, maxX: number, minY: number, maxY: number): Point {
  return { x: rand(minX, maxX), y: rand(minY, maxY) };
}

/**
 * 校验 2 库路径合法：P1、P2 必须落在对应库边的合理范围内（不超出球桌、远离袋口）
 */
function isPathValid(path: Point[]): boolean {
  const p1 = path[1];
  const p2 = path[2];
  const eps = 0.5;
  const onEdge = (pt: Point): boolean =>
    pt.x >= -eps &&
    pt.x <= TABLE_W + eps &&
    pt.y >= -eps &&
    pt.y <= TABLE_H + eps;
  if (!onEdge(p1) || !onEdge(p2)) {
    return false;
  }
  /* 撞点必须紧贴库边（在四条边之一上） */
  const onBorder = (pt: Point): boolean => {
    const nearX = Math.abs(pt.x) <= eps || Math.abs(pt.x - TABLE_W) <= eps;
    const nearY = Math.abs(pt.y) <= eps || Math.abs(pt.y - TABLE_H) <= eps;
    return nearX || nearY;
  };
  if (!onBorder(p1) || !onBorder(p2)) {
    return false;
  }
  /* 撞点远离 6 个袋口 */
  for (const pk of POCKETS) {
    const d1 = Math.hypot(p1.x - pk.x, p1.y - pk.y);
    const d2 = Math.hypot(p2.x - pk.x, p2.y - pk.y);
    if (d1 < CORNER_POCKET_R + BALL_RADIUS || d2 < CORNER_POCKET_R + BALL_RADIUS) {
      return false;
    }
  }
  return true;
}

/**
 * 校验障碍球确实挡住母球→目标球的直线路径
 * 障碍球到 Cue-Target 直线的距离 < 球径之和即视为挡路
 */
function obstacleBlocksDirect(cue: Point, target: Point, obstacle: Point): boolean {
  const dx = target.x - cue.x;
  const dy = target.y - cue.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) {
    return false;
  }
  /* obstacle 在 Cue→Target 直线上的投影比例 t */
  const t = ((obstacle.x - cue.x) * dx + (obstacle.y - cue.y) * dy) / (len * len);
  if (t < 0.15 || t > 0.85) {
    return false;
  }
  const projX = cue.x + t * dx;
  const projY = cue.y + t * dy;
  return Math.hypot(obstacle.x - projX, obstacle.y - projY) < BALL_RADIUS * 3;
}

/**
 * 生成一道 2 库 kick 题（进阶模式：随机母球 / 目标球 / 障碍球 / 两库顺序）
 */
export function generateTwoCushion(): Question {
  for (let attempt = 0; attempt < 200; attempt++) {
    /* 母球在下半区，目标球在上半区，保证有解球空间 */
    const cueBall = randomPoint(MARGIN, TABLE_W - MARGIN, TABLE_H * 0.52, TABLE_H - MARGIN);
    const targetBall = randomPoint(MARGIN, TABLE_W - MARGIN, MARGIN, TABLE_H * 0.48);
    const cushions = randomChoice(CUSHION_PAIRS);
    const realPath = computeTwoCushionPath(cueBall, targetBall, cushions);
    if (!isPathValid(realPath)) {
      continue;
    }
    /* 障碍球放在 Cue-Target 直线附近，使其挡住直击路径 */
    const base = midpoint(cueBall, targetBall);
    const obstacle = { x: base.x + rand(-12, 12), y: base.y + rand(-12, 12) };
    if (!obstacleBlocksDirect(cueBall, targetBall, obstacle)) {
      continue;
    }
    return { cueBall, targetBall, obstacle, cushions, realPath };
  }
  /* 兜底：确定合法的固定题面 */
  return makeFallback();
}

/** 兜底题面（确定合法） */
function makeFallback(): Question {
  const cueBall: Point = { x: 80, y: TABLE_H * 0.7 };
  const targetBall: Point = { x: TABLE_W - 80, y: TABLE_H * 0.3 };
  const cushions: [Cushion, Cushion] = ['bottom', 'right'];
  const obstacle = midpoint(cueBall, targetBall);
  return {
    cueBall,
    targetBall,
    obstacle,
    cushions,
    realPath: computeTwoCushionPath(cueBall, targetBall, cushions),
  };
}
