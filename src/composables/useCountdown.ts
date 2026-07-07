import { ref } from 'vue';

/**
 * 倒计时 composable（限时模式用）
 *
 * 基于 Date.now 校准，避免 setInterval 累积偏差；add() 支持答对加时/答错扣时。
 */

export function useCountdown() {
  /** 剩余毫秒 */
  const remainingMs = ref(0);
  /** 是否运行中 */
  const running = ref(false);

  let endAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function tick(): void {
    if (!running.value) {
      return;
    }
    remainingMs.value = Math.max(0, endAt - Date.now());
    if (remainingMs.value <= 0) {
      running.value = false;
      remainingMs.value = 0;
      return;
    }
    timer = setTimeout(tick, 200);
  }

  /** 启动倒计时 */
  function start(ms: number): void {
    stop();
    endAt = Date.now() + ms;
    remainingMs.value = ms;
    running.value = true;
    tick();
  }

  /** 增减时间（正数加时，负数扣时） */
  function add(deltaMs: number): void {
    endAt += deltaMs;
    /* 立即反映 */
    remainingMs.value = Math.max(0, endAt - Date.now());
  }

  /** 停止 */
  function stop(): void {
    running.value = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return { remainingMs, running, start, add, stop };
}
