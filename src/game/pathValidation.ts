import {
  TABLE_W,
  TABLE_H,
  BALL_RADIUS,
  BALL_DIAMETER,
  BALL_COLLISION_CLEARANCE,
  CORNER_POCKET_R,
  MID_POCKET_R,
  RAIL_CENTER_INSET,
} from './constants';
import { computeOneCushionPath, cushionLine } from './diamondSystem';
import { distance, polylineCircleHit, segmentCircleHit } from './geometry';
import type { Cushion, Point, Question, TwoCushionPath } from './types';

/**
 * 题面与路径合法性校验（纯函数，支持多障碍球）
 *
 * 确保每道题：
 * 1. 所有球位置安全（库边内、远离 6 袋口）
 * 2. 所有球互不重叠（球径间距）
 * 3. 直线路径被任一障碍球挡住（无法直击）
 * 4. 4 条候选 1 库路径都被障碍球组合挡住（必须用 2 库）
 * 5. 正确 2 库路径不撞任一障碍球（有解）
 * 6. 撞点 P1/P2 在对应库边上且远离袋口
 */

/** 6 袋口位置（4 角 + 2 中袋） */
export const POCKETS: readonly Point[] = [
  { x: 0, y: 0 },
  { x: TABLE_W, y: 0 },
  { x: 0, y: TABLE_H },
  { x: TABLE_W, y: TABLE_H },
  { x: 0, y: TABLE_H / 2 },
  { x: TABLE_W, y: TABLE_H / 2 },
];

/** 袋口半径（中袋在左右边中点，比角袋大） */
function pocketRadiusAt(p: Point): number {
  const isMid = Math.abs(p.y - TABLE_H / 2) < 1;
  return isMid ? MID_POCKET_R : CORNER_POCKET_R;
}

/** 点是否远离所有袋口（距离 > 袋口半径 + extra） */
export function awayFromPockets(p: Point, extra: number = BALL_RADIUS): boolean {
  for (const pk of POCKETS) {
    if (distance(p, pk) < pocketRadiusAt(pk) + extra) {
      return false;
    }
  }
  return true;
}

/** 球位是否在球桌安全区（库边内 + 远离袋口） */
export function ballPositionValid(p: Point): boolean {
  return (
    p.x > RAIL_CENTER_INSET &&
    p.x < TABLE_W - RAIL_CENTER_INSET &&
    p.y > RAIL_CENTER_INSET &&
    p.y < TABLE_H - RAIL_CENTER_INSET &&
    awayFromPockets(p)
  );
}

/** 母球 / 目标球 / 所有障碍球之间距离均 ≥ 安全间距（两两不重叠） */
export function ballsSeparated(cue: Point, target: Point, obstacles: readonly Point[]): boolean {
  const min = BALL_COLLISION_CLEARANCE * 2;
  if (distance(cue, target) < min) {
    return false;
  }
  for (const o of obstacles) {
    if (distance(cue, o) < min || distance(target, o) < min) {
      return false;
    }
  }
  for (let i = 0; i < obstacles.length; i++) {
    for (let j = i + 1; j < obstacles.length; j++) {
      if (distance(obstacles[i], obstacles[j]) < min) {
        return false;
      }
    }
  }
  return true;
}

/** 母球→目标球直线被任一障碍球挡住 */
export function directPathBlocked(cue: Point, target: Point, obstacles: readonly Point[]): boolean {
  return obstacles.some((o) => segmentCircleHit(cue, target, o, BALL_DIAMETER));
}

/** 单条 1 库路径是否被任一障碍球挡（cue→kick 或 kick→target 段） */
export function oneCushionBlockedByAny(
  cue: Point,
  target: Point,
  obstacles: readonly Point[],
  cushion: Cushion,
): boolean {
  const path = computeOneCushionPath(cue, target, cushion);
  if (!path) {
    return true;
  }
  const [a, kick, b] = path;
  return obstacles.some(
    (o) => segmentCircleHit(a, kick, o, BALL_DIAMETER) || segmentCircleHit(kick, b, o, BALL_DIAMETER),
  );
}

/** 4 条候选 1 库路径是否都被障碍球组合挡住（确保必须 2 库） */
export function allOneCushionBlocked(cue: Point, target: Point, obstacles: readonly Point[]): boolean {
  const cushions: readonly Cushion[] = ['top', 'bottom', 'left', 'right'];
  return cushions.every((c) => oneCushionBlockedByAny(cue, target, obstacles, c));
}

/** 2 库路径是否避开所有障碍球 */
export function twoCushionPathClear(path: TwoCushionPath, obstacles: readonly Point[]): boolean {
  return obstacles.every((o) => !polylineCircleHit(path, o, BALL_DIAMETER));
}

/** 撞点 P1、P2 是否在对应库边（内缩线）上、坐标在球桌范围内、且远离袋口 */
export function kickPointsValid(
  path: TwoCushionPath,
  cushions: [Cushion, Cushion],
): boolean {
  const eps = 1;
  /* P 必须落在库边线上 */
  const onLine = (p: Point, cushion: Cushion): boolean => {
    const line = cushionLine(cushion);
    switch (cushion) {
      case 'top':
      case 'bottom':
        return Math.abs(p.y - line) <= eps;
      case 'left':
      case 'right':
        return Math.abs(p.x - line) <= eps;
    }
  };
  /* 沿库边方向的坐标必须在球桌范围内（内缩），否则撞点落到球桌外 */
  const inRange = (p: Point, cushion: Cushion): boolean => {
    switch (cushion) {
      case 'top':
      case 'bottom':
        return p.x >= RAIL_CENTER_INSET && p.x <= TABLE_W - RAIL_CENTER_INSET;
      case 'left':
      case 'right':
        return p.y >= RAIL_CENTER_INSET && p.y <= TABLE_H - RAIL_CENTER_INSET;
    }
  };
  return (
    onLine(path[1], cushions[0]) &&
    inRange(path[1], cushions[0]) &&
    onLine(path[2], cushions[1]) &&
    inRange(path[2], cushions[1]) &&
    awayFromPockets(path[1]) &&
    awayFromPockets(path[2])
  );
}

/** 综合校验一道题面是否完全合法 */
export function isQuestionValid(q: Question): boolean {
  const { cueBall, targetBall, obstacles, cushions, realPath } = q;
  if (!ballPositionValid(cueBall)) return false;
  if (!ballPositionValid(targetBall)) return false;
  if (!obstacles.every(ballPositionValid)) return false;
  if (!ballsSeparated(cueBall, targetBall, obstacles)) return false;
  if (!directPathBlocked(cueBall, targetBall, obstacles)) return false;
  if (!allOneCushionBlocked(cueBall, targetBall, obstacles)) return false;
  if (!twoCushionPathClear(realPath, obstacles)) return false;
  if (!kickPointsValid(realPath, cushions)) return false;
  return true;
}
