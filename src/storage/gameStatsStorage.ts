import type { Difficulty } from '../game/constants';
import type { Point, Question } from '../game/types';
import { heatmapKey } from '../game/questionClassifier';

/**
 * 复盘数据持久化（cuemath.stats.v1）
 *
 * 存储：
 * - mistakes：最近 200 条错题详情（FIFO，含完整题面用于"重做"）
 * - heatmap：16 桶聚合（母球象限 × 第一库）{ total, errors }
 * - sessions：最近 20 局摘要（得分曲线）
 *
 * 容量受控，避免 localStorage 溢出。
 */

/** 单次答题记录（用于聚合，不存完整题面） */
export interface AttemptRecord {
  /** 时间戳 */
  ts: number;
  /** 是否命中 */
  hit: boolean;
  /** 误差距离 px */
  errorDistance: number;
  /** 本题耗时 ms */
  durationMs: number;
  /** 难度 */
  difficulty: Difficulty;
}

/** 错题记录（含完整题面，供"重做此题"重建） */
export interface MistakeRecord {
  ts: number;
  errorDistance: number;
  question: Question;
  /** 用户当时的撞点 */
  userPoint: Point;
}

/** 单局摘要 */
export interface SessionSummary {
  ts: number;
  score: number;
  maxCombo: number;
  total: number;
  hits: number;
  difficulty: Difficulty;
}

/** 热力图桶聚合值 */
export interface HeatmapBucket {
  total: number;
  errors: number;
}

interface StatsStore {
  mistakes: MistakeRecord[];
  heatmap: Record<string, HeatmapBucket>;
  sessions: SessionSummary[];
}

const LS_KEY = 'cuemath.stats.v1';
const MAX_MISTAKES = 200;
const MAX_SESSIONS = 20;

const EMPTY: StatsStore = { mistakes: [], heatmap: {}, sessions: [] };

/** 读取全部统计（异常返回空） */
export function loadStats(): StatsStore {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) {
      return { ...EMPTY, heatmap: {}, mistakes: [], sessions: [] };
    }
    const parsed = JSON.parse(raw) as Partial<StatsStore>;
    return {
      mistakes: parsed.mistakes ?? [],
      heatmap: parsed.heatmap ?? {},
      sessions: parsed.sessions ?? [],
    };
  } catch {
    return { ...EMPTY, heatmap: {}, mistakes: [], sessions: [] };
  }
}

/** 写入全部统计 */
export function saveStats(s: StatsStore): void {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* 配额满或隐私模式，忽略 */
  }
}

/**
 * 记录一次答题：热力图聚合 + 错题入库（仅错误）
 */
export function recordAttempt(rec: AttemptRecord, question: Question, userPoint: Point): void {
  const s = loadStats();
  const key = heatmapKey(question.cueBall, question.cushions[0]);
  const bucket = s.heatmap[key] ?? { total: 0, errors: 0 };
  bucket.total += 1;
  if (!rec.hit) {
    bucket.errors += 1;
    s.mistakes.unshift({
      ts: rec.ts,
      errorDistance: rec.errorDistance,
      question,
      userPoint,
    });
    if (s.mistakes.length > MAX_MISTAKES) {
      s.mistakes.length = MAX_MISTAKES;
    }
  }
  s.heatmap[key] = bucket;
  saveStats(s);
}

/** 记录一局摘要（置于数组头，超限裁剪） */
export function recordSession(summary: SessionSummary): void {
  const s = loadStats();
  s.sessions.unshift(summary);
  if (s.sessions.length > MAX_SESSIONS) {
    s.sessions.length = MAX_SESSIONS;
  }
  saveStats(s);
}

/** 清空全部统计 */
export function clearStats(): void {
  saveStats({ mistakes: [], heatmap: {}, sessions: [] });
}
