/**
 * 音效与震动反馈层
 *
 * 音效用 Web Audio API 合成（零音频资源，规避体积与版权）。
 * 震动用 navigator.vibrate（iOS Safari 支持有限，做能力检测）。
 * 移动端自动播放限制：首次用户手势调用 unlock() 解锁 AudioContext。
 */

export type SoundName = 'hit' | 'miss' | 'pass' | 'shot';

/** 反馈开关（由调用方持有响应式状态并传入） */
export interface FeedbackOptions {
  sound: boolean;
  vibrate: boolean;
}

let audioCtx: AudioContext | null = null;

/** 获取/创建 AudioContext，并在 suspended 时尝试 resume */
function ensureAudio(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) {
    return null;
  }
  if (!audioCtx) {
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** 合成一个短促音 */
function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

/** 各事件音效（频率序列） */
function playSound(ctx: AudioContext, name: SoundName): void {
  switch (name) {
    case 'hit':
      playTone(ctx, 880, 0.12, 'triangle');
      window.setTimeout(() => playTone(ctx, 1320, 0.1, 'triangle'), 60);
      break;
    case 'miss':
      playTone(ctx, 220, 0.18, 'sawtooth', 0.12);
      break;
    case 'pass':
      playTone(ctx, 660, 0.1, 'triangle');
      window.setTimeout(() => playTone(ctx, 880, 0.1, 'triangle'), 80);
      window.setTimeout(() => playTone(ctx, 1320, 0.2, 'triangle'), 160);
      break;
    case 'shot':
      playTone(ctx, 440, 0.05, 'square', 0.08);
      break;
  }
}

/** 震动模式 */
const VIBRATE_PATTERNS: Record<SoundName, number | number[]> = {
  hit: 30,
  miss: [40, 30, 40],
  pass: [30, 40, 30, 40, 60],
  shot: 15,
};

/**
 * 创建反馈控制器
 * @param options 响应式开关对象（sound / vibrate），调用方持有状态
 */
export function useFeedback(options: FeedbackOptions): {
  /** 在首次用户手势中调用，解锁 AudioContext */
  unlock: () => void;
  /** 触发某事件反馈（按当前开关决定是否发声/震动） */
  trigger: (name: SoundName) => void;
} {
  function unlock(): void {
    ensureAudio();
  }

  function trigger(name: SoundName): void {
    if (options.sound) {
      const ctx = ensureAudio();
      if (ctx) {
        playSound(ctx, name);
      }
    }
    if (options.vibrate && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(VIBRATE_PATTERNS[name]);
    }
  }

  return { unlock, trigger };
}
