import { reactive, shallowRef } from 'vue';
import { StateMachine } from '../game/stateMachine';
import { generateTwoCushion } from '../game/modes';
import { isHit } from '../game/diamondSystem';
import { HIT_TOLERANCE_PX, ADVANCED_PASS_COMBO } from '../game/constants';
import { getBestScore, saveBestScore } from '../storage/localStorage';
import type { TableApp } from '../game/TableApp';
import type { AnswerResult, Cushion, GameStateName, Point, Question } from '../game/types';

/** 暴露给视图的响应式游戏状态 */
export interface GameReactiveState {
  /** 当前状态机阶段 */
  phase: GameStateName;
  /** 当前得分 */
  score: number;
  /** 当前连击数 */
  combo: number;
  /** 历史最高分 */
  bestScore: number;
  /** 最近一次答题结果 */
  lastResult: AnswerResult | null;
  /** 当前题指定的两库顺序 */
  formula: { cushions: [Cushion, Cushion] } | null;
  /** 是否已通关 */
  passed: boolean;
}

/** 单题命中得分 */
const SCORE_PER_HIT = 10;

/**
 * 游戏主控 composable
 *
 * 桥接"响应式状态 / 状态机 / TableApp 渲染层 / Local Storage"。
 * 训练模式：2 库 kick（绕障碍球击目标球）。
 */
export function useGame() {
  const state = reactive<GameReactiveState>({
    phase: 'Init',
    score: 0,
    combo: 0,
    bestScore: getBestScore(),
    lastResult: null,
    formula: null,
    passed: false,
  });

  const sm = new StateMachine();
  const tableRef = shallowRef<TableApp | null>(null);
  let currentQuestion: Question | null = null;

  sm.on((s) => {
    state.phase = s;
  });

  /** 注入 TableApp 实例并绑定库边点击回调 */
  function setTable(table: TableApp): void {
    tableRef.value = table;
    table.setOnPick(handlePick);
  }

  /** 开始新一局 */
  function start(): void {
    sm.reset();
    state.score = 0;
    state.combo = 0;
    state.passed = false;
    state.lastResult = null;
    next();
  }

  /** 生成下一题（→ Generate → Wait_Input） */
  function next(): void {
    sm.transition('Generate');
    currentQuestion = generateTwoCushion();
    state.formula = { cushions: currentQuestion.cushions };
    state.lastResult = null;

    const t = tableRef.value;
    if (t) {
      t.renderQuestion(currentQuestion);
      t.enableInput(true);
    }
    sm.transition('Wait_Input');
  }

  /** 库边点击处理：Wait_Input → Animation */
  function handlePick(userPoint: Point): void {
    if (sm.state !== 'Wait_Input' || !currentQuestion) {
      return;
    }
    const t = tableRef.value;
    if (!t) {
      return;
    }
    t.enableInput(false);
    sm.transition('Animation');

    const q = currentQuestion;
    const realPoint = q.realPath[1];
    const hit = isHit(userPoint, realPoint, HIT_TOLERANCE_PX);
    const userPath: Point[] = [q.cueBall, userPoint];

    state.lastResult = {
      hit,
      userPoint,
      realPoint,
      userPath,
      realPath: q.realPath,
      cushions: q.cushions,
    };

    if (hit) {
      state.score += SCORE_PER_HIT;
      state.combo += 1;
      t.playCorrect(q.realPath, settle);
    } else {
      state.combo = 0;
      t.playWrong(userPath, q.realPath, settle);
    }
  }

  /** 结算：Animation → Settle */
  function settle(): void {
    if (sm.state !== 'Animation') {
      return;
    }
    sm.transition('Settle');
    if (saveBestScore(state.score)) {
      state.bestScore = state.score;
    }
    if (state.combo >= ADVANCED_PASS_COMBO) {
      state.passed = true;
    }
  }

  /** 进入下一题：Settle → Generate → Wait_Input */
  function gotoNext(): void {
    if (sm.state !== 'Settle') {
      return;
    }
    next();
  }

  return {
    state,
    setTable,
    start,
    gotoNext,
  };
}
