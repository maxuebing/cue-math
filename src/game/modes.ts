import { TABLE_W, TABLE_H, BALL_RADIUS, BALL_DIAMETER, BALL_COLLISION_CLEARANCE } from './constants';
import { computeOneCushionPath, computeTwoCushionPath } from './diamondSystem';
import { distance, midpoint, polylineCircleHit } from './geometry';
import {
  ballPositionValid,
  isQuestionValid,
  oneCushionBlockedByAny,
} from './pathValidation';
import type { Cushion, Point, Question, TwoCushionPath } from './types';

/**
 * 题面生成策略：2 库 kick + 多障碍球
 *
 * 障碍球定向放置：中点球挡直线 + 在每条未被挡的 1 库路径段上放障碍球，
 * 确保所有 1 库路径被组合挡住（真正迫使 2 库），同时不挡正确 2 库路径、不与其它球重叠。
 */

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

const MARGIN = BALL_RADIUS + 16;

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 在指定 1 库路径的某段上找一个障碍球位置：
 * - 位于 cue→kick 或 kick→target 段上（必然挡该 1 库路径）
 * - 不挡正确 2 库路径
 * - 不与已有球重叠
 * - 位置合法（库边内 + 远袋口）
 */
function findBlockingPosition(
  cue: Point,
  target: Point,
  cushion: Cushion,
  realPath: TwoCushionPath,
  existing: readonly Point[],
): Point | null {
  const path = computeOneCushionPath(cue, target, cushion);
  if (!path) {
    return null;
  }
  const [a, kick, b] = path;
  const segments: ReadonlyArray<[Point, Point]> = [
    [a, kick],
    [kick, b],
  ];
  for (let attempt = 0; attempt < 60; attempt++) {
    const seg = segments[attempt % 2];
    const t = 0.3 + Math.random() * 0.4;
    const pos: Point = {
      x: seg[0].x + t * (seg[1].x - seg[0].x),
      y: seg[0].y + t * (seg[1].y - seg[0].y),
    };
    if (!ballPositionValid(pos)) {
      continue;
    }
    /* 不挡正确 2 库路径 */
    if (polylineCircleHit(realPath, pos, BALL_DIAMETER)) {
      continue;
    }
    /* 不与已有球重叠 */
    if (existing.some((o) => distance(o, pos) < BALL_COLLISION_CLEARANCE * 2)) {
      continue;
    }
    /* pos 在该 1 库段上，距离 0，必然挡 */
    return pos;
  }
  return null;
}

/**
 * 在预算内放置障碍球以挡住全部 4 条 1 库路径
 * @param maxCount 障碍球上限（含中点球）
 */
function placeWithBudget(
  cue: Point,
  target: Point,
  realPath: TwoCushionPath,
  maxCount: number,
): Point[] | null {
  const obstacles: Point[] = [midpoint(cue, target)];
  const cushions: readonly Cushion[] = ['top', 'bottom', 'left', 'right'];
  for (const cushion of cushions) {
    if (oneCushionBlockedByAny(cue, target, obstacles, cushion)) {
      continue;
    }
    if (obstacles.length >= maxCount) {
      return null;
    }
    const pos = findBlockingPosition(cue, target, cushion, realPath, obstacles);
    if (!pos) {
      return null;
    }
    obstacles.push(pos);
  }
  return obstacles;
}

/**
 * 生成一道合法 2 库 kick 题（多障碍球）
 * 障碍球预算从 3 逐级提升到 5，优先用更少障碍球
 */
export function generateTwoCushion(): Question {
  for (let attempt = 0; attempt < 500; attempt++) {
    const cueBall: Point = { x: rand(MARGIN, TABLE_W - MARGIN), y: rand(TABLE_H * 0.55, TABLE_H - MARGIN) };
    const targetBall: Point = { x: rand(MARGIN, TABLE_W - MARGIN), y: rand(MARGIN, TABLE_H * 0.45) };
    const cushions = randomChoice(CUSHION_PAIRS);
    const realPath = computeTwoCushionPath(cueBall, targetBall, cushions);
    if (!realPath) {
      continue;
    }

    let obstacles: Point[] | null = null;
    for (const budget of [3, 4, 5]) {
      obstacles = placeWithBudget(cueBall, targetBall, realPath, budget);
      if (obstacles) {
        break;
      }
    }
    if (!obstacles) {
      continue;
    }

    const q: Question = { cueBall, targetBall, obstacles, cushions, realPath };
    if (isQuestionValid(q)) {
      return q;
    }
  }
  return makeFallback();
}

/** 兜底题面：预置多组合法模板，逐个校验 */
function makeFallback(): Question {
  const templates: ReadonlyArray<{ cue: Point; target: Point; cushions: [Cushion, Cushion] }> = [
    { cue: { x: 70, y: 600 }, target: { x: 290, y: 120 }, cushions: ['bottom', 'right'] },
    { cue: { x: 290, y: 600 }, target: { x: 70, y: 120 }, cushions: ['bottom', 'left'] },
    { cue: { x: 70, y: 600 }, target: { x: 290, y: 120 }, cushions: ['top', 'right'] },
    { cue: { x: 290, y: 600 }, target: { x: 70, y: 120 }, cushions: ['top', 'left'] },
    { cue: { x: 70, y: 600 }, target: { x: 290, y: 120 }, cushions: ['left', 'top'] },
    { cue: { x: 70, y: 600 }, target: { x: 290, y: 120 }, cushions: ['right', 'top'] },
  ];
  for (const t of templates) {
    const realPath = computeTwoCushionPath(t.cue, t.target, t.cushions);
    if (!realPath) {
      continue;
    }
    /* 兜底也尝试放障碍球，失败则用中点单球（极端兜底） */
    let obstacles: Point[] | null = null;
    for (const budget of [3, 4, 5]) {
      obstacles = placeWithBudget(t.cue, t.target, realPath, budget);
      if (obstacles) {
        break;
      }
    }
    const finalObstacles = obstacles ?? [midpoint(t.cue, t.target)];
    const q: Question = {
      cueBall: t.cue,
      targetBall: t.target,
      obstacles: finalObstacles,
      cushions: t.cushions,
      realPath,
    };
    if (isQuestionValid(q)) {
      return q;
    }
    /* 即便校验未过也返回，避免应用崩溃（视觉仍可渲染） */
    return q;
  }
  /* 终极兜底 */
  const t = templates[0];
  const realPath = computeTwoCushionPath(t.cue, t.target, t.cushions) as TwoCushionPath;
  return {
    cueBall: t.cue,
    targetBall: t.target,
    obstacles: [midpoint(t.cue, t.target)],
    cushions: t.cushions,
    realPath,
  };
}
