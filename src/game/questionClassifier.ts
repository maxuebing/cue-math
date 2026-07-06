import { TABLE_W, TABLE_H } from './constants';
import type { Cushion, Point } from './types';

/**
 * 题目分桶工具（用于盲区热力图统计）
 *
 * 维度：母球区域（4 区）× 第一库（4 库）= 16 桶。
 * 每桶统计总答题数与错误数，错误率高的即"算力盲区"。
 */

/** 母球所在象限 */
export type CueZone = 'TL' | 'TR' | 'BL' | 'BR';

/** 库边缩写 */
export type CushionAbbr = 'T' | 'B' | 'L' | 'R';

/** 母球象限标签 */
export const CUE_ZONE_LABELS: Record<CueZone, string> = {
  TL: '左上',
  TR: '右上',
  BL: '左下',
  BR: '右下',
};

/** 库边缩写标签 */
export const CUSHION_ABBR_LABELS: Record<CushionAbbr, string> = {
  T: '顶',
  B: '底',
  L: '左',
  R: '右',
};

export const CUE_ZONES: readonly CueZone[] = ['TL', 'TR', 'BL', 'BR'];
export const CUSHION_ABBRS: readonly CushionAbbr[] = ['T', 'B', 'L', 'R'];

/** 根据母球坐标判断象限 */
export function classifyCueZone(cue: Point): CueZone {
  const left = cue.x < TABLE_W / 2;
  const top = cue.y < TABLE_H / 2;
  if (top && left) return 'TL';
  if (top && !left) return 'TR';
  if (!top && left) return 'BL';
  return 'BR';
}

/** 库边转缩写 */
export function classifyCushion(c: Cushion): CushionAbbr {
  switch (c) {
    case 'top':
      return 'T';
    case 'bottom':
      return 'B';
    case 'left':
      return 'L';
    case 'right':
      return 'R';
  }
}

/** 生成热力图桶 key：`母球象限:第一库缩写`，如 `BL:T` */
export function heatmapKey(cue: Point, firstCushion: Cushion): string {
  return `${classifyCueZone(cue)}:${classifyCushion(firstCushion)}`;
}
