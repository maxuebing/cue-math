import { reactive } from 'vue';
import {
  loadStats,
  type HeatmapBucket,
  type MistakeRecord,
  type SessionSummary,
} from '../storage/gameStatsStorage';
import { CUE_ZONES, CUSHION_ABBRS, type CushionAbbr, type CueZone } from '../game/questionClassifier';

/**
 * 复盘数据聚合 composable
 *
 * 从 gameStatsStorage 读取 mistakes / heatmap / sessions，
 * 提供 4×4 热力图矩阵与得分曲线聚合视图。
 */

/** 热力图单元格 */
export interface HeatmapCell {
  zone: CueZone;
  cushion: CushionAbbr;
  total: number;
  errors: number;
  /** 错误率 0~1 */
  rate: number;
}

export function useReviewStats() {
  const stats = reactive<{
    mistakes: MistakeRecord[];
    sessions: SessionSummary[];
    heatmap: Record<string, HeatmapBucket>;
  }>({
    mistakes: [],
    sessions: [],
    heatmap: {},
  });

  /** 重新从 localStorage 读取 */
  function refresh(): void {
    const s = loadStats();
    stats.mistakes = s.mistakes;
    stats.sessions = s.sessions;
    stats.heatmap = s.heatmap;
  }

  /** 4 行（母球象限）× 4 列（第一库）热力图矩阵 */
  function heatmapMatrix(): HeatmapCell[][] {
    const matrix: HeatmapCell[][] = [];
    for (const zone of CUE_ZONES) {
      const row: HeatmapCell[] = [];
      for (const cushion of CUSHION_ABBRS) {
        const key = `${zone}:${cushion}`;
        const b = stats.heatmap[key] ?? { total: 0, errors: 0 };
        row.push({
          zone,
          cushion,
          total: b.total,
          errors: b.errors,
          rate: b.total > 0 ? b.errors / b.total : 0,
        });
      }
      matrix.push(row);
    }
    return matrix;
  }

  /** 得分曲线：最近 N 局按时间正序（sessions 存储为最新在前，反转得到正序） */
  function scoreCurve(): SessionSummary[] {
    return [...stats.sessions].reverse();
  }

  refresh();
  return { stats, refresh, heatmapMatrix, scoreCurve };
}
