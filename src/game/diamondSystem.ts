import { TABLE_W, TABLE_H, RAIL_CENTER_INSET } from './constants';
import type { Cushion, OneCushionPath, Point, TwoCushionPath } from './types';

/**
 * 颗星公式核心算法：镜像法（反射定律）几何展开
 *
 * 基于"球心可达边界"（库边内缩 RAIL_CENTER_INSET = 球半径），
 * 使母球贴库时球体视觉贴合而非压入库边。
 * 2 库 kick：Target 关于第二库镜像 → 再关于第一库镜像 → 与母球连线交第一库得 P1，
 * P1 到 Target-关于-第二库-镜像 交第二库得 P2。
 */

/** 球心可达边界（库边内缩） */
const MIN_X = RAIL_CENTER_INSET;
const MAX_X = TABLE_W - RAIL_CENTER_INSET;
const MIN_Y = RAIL_CENTER_INSET;
const MAX_Y = TABLE_H - RAIL_CENTER_INSET;

const CUSHION_LABEL: Record<Cushion, string> = {
  top: '顶库',
  bottom: '底库',
  left: '左库',
  right: '右库',
};

/** 返回库边中文名（供 UI 展示） */
export function cushionLabel(c: Cushion): string {
  return CUSHION_LABEL[c];
}

/** 某库边的球心可达坐标值（顶/底返回 y，左/右返回 x） */
export function cushionLine(cushion: Cushion): number {
  switch (cushion) {
    case 'top':
      return MIN_Y;
    case 'bottom':
      return MAX_Y;
    case 'left':
      return MIN_X;
    case 'right':
      return MAX_X;
  }
}

/** 点关于某库边（内缩线）的镜像 */
export function mirrorPoint(p: Point, cushion: Cushion): Point {
  switch (cushion) {
    case 'top':
      return { x: p.x, y: 2 * MIN_Y - p.y };
    case 'bottom':
      return { x: p.x, y: 2 * MAX_Y - p.y };
    case 'left':
      return { x: 2 * MIN_X - p.x, y: p.y };
    case 'right':
      return { x: 2 * MAX_X - p.x, y: p.y };
  }
}

/**
 * 线段 from→to 与某库边（内缩线）的交点
 * @returns 交点；线段与库边平行（无交点）返回 null
 */
export function intersectCushion(from: Point, to: Point, cushion: Cushion): Point | null {
  switch (cushion) {
    case 'top': {
      const denom = to.y - from.y;
      if (Math.abs(denom) < 1e-9) {
        return null;
      }
      const t = (MIN_Y - from.y) / denom;
      return { x: from.x + t * (to.x - from.x), y: MIN_Y };
    }
    case 'bottom': {
      const denom = to.y - from.y;
      if (Math.abs(denom) < 1e-9) {
        return null;
      }
      const t = (MAX_Y - from.y) / denom;
      return { x: from.x + t * (to.x - from.x), y: MAX_Y };
    }
    case 'left': {
      const denom = to.x - from.x;
      if (Math.abs(denom) < 1e-9) {
        return null;
      }
      const t = (MIN_X - from.x) / denom;
      return { x: MIN_X, y: from.y + t * (to.y - from.y) };
    }
    case 'right': {
      const denom = to.x - from.x;
      if (Math.abs(denom) < 1e-9) {
        return null;
      }
      const t = (MAX_X - from.x) / denom;
      return { x: MAX_X, y: from.y + t * (to.y - from.y) };
    }
  }
}

/**
 * 2 库镜像展开：计算母球经 cushions[0] → cushions[1] 两库击目标的完整路径
 * @returns [Cue, P1, P2, Target]；任一撞点不可解（平行）返回 null
 */
export function computeTwoCushionPath(
  cue: Point,
  target: Point,
  cushions: [Cushion, Cushion],
): TwoCushionPath | null {
  const [c1, c2] = cushions;
  const t1 = mirrorPoint(target, c2);
  const t2 = mirrorPoint(t1, c1);
  const p1 = intersectCushion(cue, t2, c1);
  if (!p1) {
    return null;
  }
  const p2 = intersectCushion(p1, t1, c2);
  if (!p2) {
    return null;
  }
  return [cue, p1, p2, target];
}

/**
 * 1 库路径：cue 经 cushion 一库击 target
 * @returns [cue, kick, target]；平行无解返回 null
 */
export function computeOneCushionPath(
  cue: Point,
  target: Point,
  cushion: Cushion,
): OneCushionPath | null {
  const mirrored = mirrorPoint(target, cushion);
  const kick = intersectCushion(cue, mirrored, cushion);
  if (!kick) {
    return null;
  }
  return [cue, kick, target];
}

/** 命中判定：用户第一库点击点与正确点击点的欧氏距离 ≤ 容差 */
export function isHit(user: Point, real: Point, tolerance: number): boolean {
  return Math.hypot(user.x - real.x, user.y - real.y) <= tolerance;
}
