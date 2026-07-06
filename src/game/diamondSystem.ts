import { TABLE_W, TABLE_H } from './constants';
import type { Cushion, Point } from './types';

/**
 * 颗星公式核心算法：镜像法（反射定律）几何展开
 *
 * 原理：母球经多库反弹击目标球，等价于母球直线射向"目标球逐次镜像各库"得到的虚像。
 * 2 库 kick：Target 关于第二库镜像 → 再关于第一库镜像 → 与母球连线交第一库得 P1，
 * P1 到 Target-关于-第二库-镜像 交第二库得 P2。
 */

/** 库边中文名（供 UI 展示） */
const CUSHION_LABEL: Record<Cushion, string> = {
  top: '顶库',
  bottom: '底库',
  left: '左库',
  right: '右库',
};

/** 返回库边中文名 */
export function cushionLabel(c: Cushion): string {
  return CUSHION_LABEL[c];
}

/**
 * 点关于某条库边的镜像
 * @param p       原始点
 * @param cushion 库边
 */
export function mirrorPoint(p: Point, cushion: Cushion): Point {
  switch (cushion) {
    case 'top':
      return { x: p.x, y: -p.y };
    case 'bottom':
      return { x: p.x, y: 2 * TABLE_H - p.y };
    case 'left':
      return { x: -p.x, y: p.y };
    case 'right':
      return { x: 2 * TABLE_W - p.x, y: p.y };
  }
}

/**
 * 线段 from→to 与某条库边的交点（假设不平行）
 * @param from    线段起点
 * @param to      线段终点
 * @param cushion 库边
 */
export function intersectCushion(from: Point, to: Point, cushion: Cushion): Point {
  switch (cushion) {
    case 'top': {
      const denom = to.y - from.y;
      const t = Math.abs(denom) < 1e-9 ? 0 : (0 - from.y) / denom;
      return { x: from.x + t * (to.x - from.x), y: 0 };
    }
    case 'bottom': {
      const denom = to.y - from.y;
      const t = Math.abs(denom) < 1e-9 ? 0 : (TABLE_H - from.y) / denom;
      return { x: from.x + t * (to.x - from.x), y: TABLE_H };
    }
    case 'left': {
      const denom = to.x - from.x;
      const t = Math.abs(denom) < 1e-9 ? 0 : (0 - from.x) / denom;
      return { x: 0, y: from.y + t * (to.y - from.y) };
    }
    case 'right': {
      const denom = to.x - from.x;
      const t = Math.abs(denom) < 1e-9 ? 0 : (TABLE_W - from.x) / denom;
      return { x: TABLE_W, y: from.y + t * (to.y - from.y) };
    }
  }
}

/**
 * 2 库镜像展开：计算母球经 cushions[0] → cushions[1] 两库击目标的完整路径
 * @returns [Cue, P1, P2, Target]
 */
export function computeTwoCushionPath(
  cue: Point,
  target: Point,
  cushions: [Cushion, Cushion],
): Point[] {
  const [c1, c2] = cushions;
  /* Target 关于第二库镜像得 T1，T1 关于第一库镜像得 T2 */
  const t1 = mirrorPoint(target, c2);
  const t2 = mirrorPoint(t1, c1);
  /* Cue→T2 与第一库交点 = P1；P1→T1 与第二库交点 = P2 */
  const p1 = intersectCushion(cue, t2, c1);
  const p2 = intersectCushion(p1, t1, c2);
  return [cue, p1, p2, target];
}

/**
 * 命中判定：用户第一库点击点与正确点击点的欧氏距离 ≤ 容差
 */
export function isHit(user: Point, real: Point, tolerance: number): boolean {
  return Math.hypot(user.x - real.x, user.y - real.y) <= tolerance;
}

/** 两点中点 */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** 两点欧氏距离 */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
