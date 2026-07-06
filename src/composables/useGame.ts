import { reactive, shallowRef, watch } from 'vue';
import { StateMachine } from '../game/stateMachine';
import { generateTwoCushion } from '../game/modes';
import { isHit } from '../game/diamondSystem';
import { distance } from '../game/geometry';
import { ADVANCED_PASS_COMBO, DIFFICULTY, type Difficulty } from '../game/constants';
import { getBestScore, saveBestScore } from '../storage/localStorage';
import { loadSettings, saveSettings, type UserSettings } from '../storage/settingsStorage';
import { recordAttempt, recordSession } from '../storage/gameStatsStorage';
import { useFeedback } from './useFeedback';
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
  /** 当前题开始时间戳（用于复盘耗时统计） */
  attemptStartedAt: number;
}

/** 单题命中得分 */
const SCORE_PER_HIT = 10;

/** 当前局累计统计（用于 session 摘要） */
interface SessionStats {
  total: number;
  hits: number;
  maxCombo: number;
}

/**
 * 游戏主控 composable
 *
 * 桥接"响应式状态 / 状态机 / TableApp 渲染层 / 反馈 / Local Storage"。
 * 训练模式：2 库 kick（绕障碍球击目标球）。
 */
export function useGame() {
  const settings = reactive<UserSettings>(loadSettings());
  const feedback = useFeedback(settings);

  watch(settings, (s) => saveSettings({ ...s }), { deep: true });

  const state = reactive<GameReactiveState>({
    phase: 'Init',
    score: 0,
    combo: 0,
    bestScore: getBestScore(),
    lastResult: null,
    formula: null,
    passed: false,
    attemptStartedAt: 0,
  });

  const sm = new StateMachine();
  const tableRef = shallowRef<TableApp | null>(null);
  let currentQuestion: Question | null = null;
  let sessionStats: SessionStats = { total: 0, hits: 0, maxCombo: 0 };

  sm.on((s) => {
    state.phase = s;
  });

  /** 注入 TableApp 实例并绑定库边点击回调 */
  function setTable(table: TableApp): void {
    tableRef.value = table;
    table.setOnPick(handlePick);
  }

  /** 开始新一局：若上一局有答题数据，先记录 session 摘要 */
  function start(): void {
    if (sessionStats.total > 0) {
      recordSession({
        ts: Date.now(),
        score: state.score,
        maxCombo: sessionStats.maxCombo,
        total: sessionStats.total,
        hits: sessionStats.hits,
        difficulty: settings.difficulty,
      });
    }
    sessionStats = { total: 0, hits: 0, maxCombo: 0 };
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
    state.attemptStartedAt = Date.now();

    const t = tableRef.value;
    if (t) {
      t.renderQuestion(currentQuestion);
      t.enableInput(true);
    }
    sm.transition('Wait_Input');
  }

  /** 重做一道错题（从复盘页触发，直接用历史题面） */
  function redoMistake(q: Question): void {
    sm.reset();
    sm.transition('Generate');
    currentQuestion = q;
    state.formula = { cushions: q.cushions };
    state.lastResult = null;
    state.attemptStartedAt = Date.now();
    const t = tableRef.value;
    if (t) {
      t.renderQuestion(q);
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
    const tolerance = DIFFICULTY[settings.difficulty];
    const hit = isHit(userPoint, realPoint, tolerance);
    const userPath: Point[] = [q.cueBall, userPoint];

    state.lastResult = {
      hit,
      userPoint,
      realPoint,
      userPath,
      realPath: q.realPath,
      cushions: q.cushions,
      errorDistance: Math.round(distance(userPoint, realPoint)),
    };

    if (hit) {
      state.score += SCORE_PER_HIT;
      state.combo += 1;
      feedback.trigger('hit');
      t.playCorrect(q.realPath, settle);
    } else {
      state.combo = 0;
      feedback.trigger('miss');
      t.playWrong(userPath, q.realPath, settle);
    }
  }

  /** 结算：Animation → Settle，记录答题与 session 累计 */
  function settle(): void {
    if (sm.state !== 'Animation' || !currentQuestion || !state.lastResult) {
      return;
    }
    sm.transition('Settle');

    const q = currentQuestion;
    const result = state.lastResult;
    recordAttempt(
      {
        ts: Date.now(),
        hit: result.hit,
        errorDistance: result.errorDistance,
        durationMs: Date.now() - state.attemptStartedAt,
        difficulty: settings.difficulty,
      },
      q,
      result.userPoint,
    );
    sessionStats.total += 1;
    if (result.hit) {
      sessionStats.hits += 1;
    }
    sessionStats.maxCombo = Math.max(sessionStats.maxCombo, state.combo);

    if (saveBestScore(state.score)) {
      state.bestScore = state.score;
    }
    if (state.combo >= ADVANCED_PASS_COMBO && !state.passed) {
      state.passed = true;
      feedback.trigger('pass');
    }
  }

  /** 进入下一题：Settle → Generate → Wait_Input */
  function gotoNext(): void {
    if (sm.state !== 'Settle') {
      return;
    }
    next();
  }

  /** 切换难度（影响命中容差） */
  function setDifficulty(d: Difficulty): void {
    settings.difficulty = d;
  }

  return {
    state,
    settings,
    setTable,
    start,
    gotoNext,
    setDifficulty,
    redoMistake,
    unlockAudio: feedback.unlock,
  };
}
