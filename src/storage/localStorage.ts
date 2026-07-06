import { LS_KEY_BEST_SCORE } from '../game/constants';

/**
 * Local Storage 持久化（PRD §3.3 / §6.1）
 * Phase 1 仅持久化"最高分"；错题矩阵属 Phase 2，暂不实现。
 * 隐私模式下 localStorage 访问可能抛错，统一 try/catch 容错。
 */

/** 读取最高分（无记录或异常返回 0） */
export function getBestScore(): number {
  try {
    const raw = window.localStorage.getItem(LS_KEY_BEST_SCORE);
    if (raw === null) {
      return 0;
    }
    const score = Number.parseInt(raw, 10);
    return Number.isFinite(score) ? score : 0;
  } catch {
    return 0;
  }
}

/**
 * 写入最高分：仅当新分严格大于历史最高时写入
 * @returns 是否刷新了最高分
 */
export function saveBestScore(score: number): boolean {
  try {
    const current = getBestScore();
    if (score > current) {
      window.localStorage.setItem(LS_KEY_BEST_SCORE, String(score));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
