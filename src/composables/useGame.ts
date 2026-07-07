import { reactive, shallowRef, watch } from 'vue';
import { StateMachine } from '../game/stateMachine';
import { generateQuestion } from '../game/modes';
import { isHit } from '../game/diamondSystem';
import { distance } from '../game/geometry';
import { MODE_RULES, type ModeRule } from '../game/modeRules';
import { getBestScore, saveBestScore } from '../storage/localStorage';
import { loadSettings, saveSettings, type UserSettings } from '../storage/settingsStorage';
import { recordAttempt, recordSession } from '../storage/gameStatsStorage';
import { useFeedback } from './useFeedback';
import { useCountdown } from './useCountdown';
import type { TableApp } from '../game/TableApp';
import type {
  AnswerResult,
  Cushion,
  GameEndReason,
  GameStateName,
  Mode,
  Point,
  Question,
} from '../game/types';

/** 暴露给视图的响应式游戏状态 */
export interface GameReactiveState {
  /** 当前状态机阶段 */
  phase: GameStateName;
  /** 当前训练模式 */
  mode: Mode;
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
  /** 游戏结束原因（通关/超时/错满） */
  gameEndReason: GameEndReason | null;
  /** 当前局错误数（大师模式用） */
  mistakes: number;
  /** 限时模式剩余时间 ms */
  timeRemainingMs: number;
  /** 当前题开始时间戳 */
  attemptStartedAt: number;
}

/** 单题命中得分 */
const SCORE_PER_HIT = 10;

/** 当前局累计统计 */
interface SessionStats {
  total: number;
  hits: number;
  maxCombo: number;
}

/**
 * 游戏主控 composable
 *
 * 支持四种训练模式：新手（固定母球）/ 进阶（随机）/ 大师（错3次结束）/ 限时（60s±时间）。
 */
export function useGame() {
  const settings = reactive<UserSettings>(loadSettings());
  const feedback = useFeedback(settings);
  const countdown = useCountdown();

  watch(settings, (s) => saveSettings({ ...s }), { deep: true });

  const state = reactive<GameReactiveState>({
    phase: 'Init',
    mode: settings.mode,
    score: 0,
    combo: 0,
    bestScore: getBestScore(),
    lastResult: null,
    formula: null,
    passed: false,
    gameEndReason: null,
    mistakes: 0,
    timeRemainingMs: 0,
    attemptStartedAt: 0,
  });

  /* 倒计时同步到 state，归零触发超时结束 */
  watch(
    () => countdown.remainingMs.value,
    (ms) => {
      state.timeRemainingMs = ms;
      if (countdown.running.value && ms <= 0) {
        endGame('timeup');
      }
    },
  );

  const sm = new StateMachine();
  const tableRef = shallowRef<TableApp | null>(null);
  let currentQuestion: Question | null = null;
  let sessionStats: SessionStats = { total: 0, hits: 0, maxCombo: 0 };

  function rule(): ModeRule {
    return MODE_RULES[state.mode];
  }

  sm.on((s) => {
    state.phase = s;
  });

  /** 注入 TableApp 实例 */
  function setTable(table: TableApp): void {
    tableRef.value = table;
    table.setOnPick(handlePick);
  }

  /** 开始新一局（可切换模式） */
  function start(mode?: Mode): void {
    if (mode) {
      settings.mode = mode;
      state.mode = mode;
    }
    /* 记录上一局摘要 */
    if (sessionStats.total > 0) {
      recordSession({
        ts: Date.now(),
        score: state.score,
        maxCombo: sessionStats.maxCombo,
        total: sessionStats.total,
        hits: sessionStats.hits,
        mode: state.mode,
      });
    }
    sessionStats = { total: 0, hits: 0, maxCombo: 0 };

    sm.reset();
    state.score = 0;
    state.combo = 0;
    state.passed = false;
    state.gameEndReason = null;
    state.mistakes = 0;
    state.lastResult = null;

    /* 限时模式启动倒计时 */
    countdown.stop();
    const r = rule();
    if (r.timeLimitMs > 0) {
      countdown.start(r.timeLimitMs);
    } else {
      state.timeRemainingMs = 0;
    }

    next();
  }

  /** 生成下一题 */
  function next(): void {
    if (state.gameEndReason) {
      return;
    }
    sm.transition('Generate');
    currentQuestion = generateQuestion(state.mode);
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

  /** 重做一道错题 */
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

  /** 库边点击处理 */
  function handlePick(userPoint: Point): void {
    if (sm.state !== 'Wait_Input' || !currentQuestion || state.gameEndReason) {
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
    const hit = isHit(userPoint, realPoint, rule().tolerance);
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

    const r = rule();
    if (hit) {
      state.score += SCORE_PER_HIT;
      state.combo += 1;
      feedback.trigger('hit');
      if (r.hitAddMs > 0 && countdown.running.value) {
        countdown.add(r.hitAddMs);
      }
      t.playCorrect(q.realPath, settle);
    } else {
      state.combo = 0;
      state.mistakes += 1;
      feedback.trigger('miss');
      if (r.missSubMs > 0 && countdown.running.value) {
        countdown.add(-r.missSubMs);
      }
      t.playWrong(userPath, q.realPath, settle);
    }
  }

  /** 结算 */
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
        mode: state.mode,
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

    /* 结束条件判定 */
    const r = rule();
    if (r.passCombo > 0 && state.combo >= r.passCombo) {
      endGame('pass');
    } else if (r.maxMistakes > 0 && state.mistakes >= r.maxMistakes) {
      endGame('mistakesup');
    }
  }

  /** 结束本局 */
  function endGame(reason: GameEndReason): void {
    if (state.gameEndReason) {
      return;
    }
    state.gameEndReason = reason;
    state.passed = reason === 'pass';
    countdown.stop();
    feedback.trigger(reason === 'pass' ? 'pass' : 'miss');
    const t = tableRef.value;
    if (t) {
      t.enableInput(false);
    }
  }

  /** 进入下一题 */
  function gotoNext(): void {
    if (sm.state !== 'Settle' || state.gameEndReason) {
      return;
    }
    next();
  }

  /** 切换模式（仅在选择界面，不立即开始） */
  function setMode(m: Mode): void {
    settings.mode = m;
    state.mode = m;
  }

  return {
    state,
    settings,
    setTable,
    start,
    gotoNext,
    setMode,
    redoMistake,
    unlockAudio: feedback.unlock,
  };
}
