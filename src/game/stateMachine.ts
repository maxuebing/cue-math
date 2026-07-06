import type { GameStateName } from './types';

/**
 * 核心状态机（PRD §3.1）
 *
 * 五态：Init → Generate → Wait_Input → Animation → Settle → Generate（循环）
 * 封装合法转换校验与状态变更监听，确保 Core Loop 不会跳态或卡死（AC-01）。
 */

type StateListener = (state: GameStateName) => void;

/** 合法状态转换图 */
const TRANSITIONS: Record<GameStateName, GameStateName[]> = {
  Init: ['Generate'],
  Generate: ['Wait_Input'],
  Wait_Input: ['Animation'],
  Animation: ['Settle'],
  Settle: ['Generate'],
};

export class StateMachine {
  private current: GameStateName = 'Init';

  private readonly listeners = new Set<StateListener>();

  /** 当前状态 */
  get state(): GameStateName {
    return this.current;
  }

  /** 注册状态变更监听器，返回取消订阅函数 */
  on(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** 转换到下一状态；非法转换抛出错误（开发期暴露状态机 bug） */
  transition(next: GameStateName): void {
    const allowed = TRANSITIONS[this.current];
    if (!allowed.includes(next)) {
      throw new Error(`非法状态转换：${this.current} → ${next}`);
    }
    this.current = next;
    this.listeners.forEach((listener) => listener(this.current));
  }

  /** 重置到 Init 状态 */
  reset(): void {
    this.current = 'Init';
    this.listeners.forEach((listener) => listener(this.current));
  }
}
