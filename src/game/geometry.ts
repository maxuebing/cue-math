import type { Point } from './types';

/**
 * 纯几何工具集（无 PixiJS 依赖，便于校验与单测）
 * 所有函数基于二维欧氏几何，坐标单位为像素。
 */

/** 两点欧氏距离 */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** 点 p 在线段 a→b 上的投影比例 t（0=起点，1=终点；超出 [0,1] 表示投影落在线段外） */
export function pointProjection(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return 0;
  }
  return ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
}

/** 点 p 到线段 a→b 的最近点（线段上） */
export function closestPointOnSegment(p: Point, a: Point, b: Point): Point {
  const t = pointProjection(p, a, b);
  const tc = Math.max(0, Math.min(1, t));
  return { x: a.x + tc * (b.x - a.x), y: a.y + tc * (b.y - a.y) };
}

/** 点 p 到线段 a→b 的最短距离 */
export function segmentPointDistance(p: Point, a: Point, b: Point): number {
  return distance(p, closestPointOnSegment(p, a, b));
}

/** 线段 a1→a2 与圆（圆心 c、半径 r）是否相交（含相切） */
export function segmentCircleHit(a1: Point, a2: Point, c: Point, r: number): boolean {
  return segmentPointDistance(c, a1, a2) <= r;
}

/** 折线（多点序列）与圆是否相交（任一段相交即 true） */
export function polylineCircleHit(poly: readonly Point[], c: Point, r: number): boolean {
  for (let i = 0; i < poly.length - 1; i++) {
    if (segmentCircleHit(poly[i], poly[i + 1], c, r)) {
      return true;
    }
  }
  return false;
}

/** 折线总长度 */
export function polylineLength(poly: readonly Point[]): number {
  let total = 0;
  for (let i = 0; i < poly.length - 1; i++) {
    total += distance(poly[i], poly[i + 1]);
  }
  return total;
}

/** 将点 clamp 到矩形 [minX, maxX] × [minY, maxY] */
export function clampPoint(
  p: Point,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Point {
  return {
    x: Math.max(minX, Math.min(maxX, p.x)),
    y: Math.max(minY, Math.min(maxY, p.y)),
  };
}

/** 两点中点 */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
