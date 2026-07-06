import { Tween, Easing } from '@tweenjs/tween.js';
import type { Point } from './types';

/**
 * Tween 动画引擎（PRD §3.3：母球沿折线序列匀速 / 线性减速平移）
 *
 * 基于 @tweenjs/tween.js：用单个 Tween 驱动 0→1 的进度，
 * 在 onUpdate 中按进度把当前位置插值到对应折线段上。
 * 驱动方式：外部（TableApp 的 PixiJS ticker）每帧调用 handle.update(time)。
 */

/** 动画控制句柄 */
export interface PathAnimationHandle {
  /** 启动动画 */
  start: () => void;
  /** 每帧由外部 ticker 调用，传入当前时间（毫秒） */
  update: (time: number) => void;
  /** 终止并清理动画 */
  stop: () => void;
}

/** 折线段 */
interface Segment {
  from: Point;
  to: Point;
  len: number;
  /** 该段起点在整条路径中的累计长度 */
  startLen: number;
}

/**
 * 沿折线移动的 tween 动画
 *
 * @param path        折线端点序列（至少 2 个点）
 * @param speed       移动速度（像素 / 秒）
 * @param onUpdate    每帧位置回调
 * @param onComplete  动画完成回调
 * @param easing      缓动函数，默认匀速 Linear.None
 */
export function tweenAlongPath(
  path: Point[],
  speed: number,
  onUpdate: (pos: Point) => void,
  onComplete?: () => void,
  easing: (k: number) => number = Easing.Linear.None,
): PathAnimationHandle {
  /* 计算各段长度与总长度 */
  const segments: Segment[] = [];
  let totalLen = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];
    const len = Math.hypot(to.x - from.x, to.y - from.y);
    segments.push({ from, to, len, startLen: totalLen });
    totalLen += len;
  }

  /* 零长度路径：直接完成，避免除零 */
  if (totalLen === 0 || speed <= 0) {
    return {
      start: () => onComplete?.(),
      update: () => {},
      stop: () => {},
    };
  }

  const durationMs = (totalLen / speed) * 1000;
  const state = { progress: 0 };

  const tween = new Tween(state)
    .to({ progress: 1 }, durationMs)
    .easing(easing)
    .onUpdate(() => {
      const dist = state.progress * totalLen;
      let seg = segments[segments.length - 1];
      for (const s of segments) {
        if (dist <= s.startLen + s.len) {
          seg = s;
          break;
        }
      }
      const segT = seg.len > 0 ? (dist - seg.startLen) / seg.len : 0;
      onUpdate({
        x: seg.from.x + (seg.to.x - seg.from.x) * segT,
        y: seg.from.y + (seg.to.y - seg.from.y) * segT,
      });
    })
    .onComplete(() => onComplete?.());

  return {
    start: () => tween.start(),
    update: (time: number) => tween.update(time),
    stop: () => tween.stop(),
  };
}
