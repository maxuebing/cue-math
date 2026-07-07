<script setup lang="ts">
import type { GameReactiveState } from '../composables/useGame';
import type { UserSettings } from '../storage/settingsStorage';
import { MODE_ORDER, MODE_RULES } from '../game/modeRules';
import type { Mode } from '../game/types';

/**
 * 控制台：模式选择 + 得分/连击/倒计时/生命 + 任务提示 + GameOver + 操作按钮
 */
const props = defineProps<{
  state: GameReactiveState;
  settings: UserSettings;
}>();

const emit = defineEmits<{
  next: [];
  restart: [];
  'set-mode': [m: Mode];
  'toggle-sound': [on: boolean];
  'toggle-vibrate': [on: boolean];
}>();

function rule() {
  return MODE_RULES[props.state.mode];
}

function fmtTime(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}
</script>

<template>
  <div class="control-panel">
    <div class="top-row">
      <span class="mode-tag">{{ rule().name }}模式</span>
      <div class="toggles">
        <label class="toggle" title="音效">
          <input
            type="checkbox"
            :checked="settings.sound"
            @change="emit('toggle-sound', ($event.target as HTMLInputElement).checked)"
          />
          <span>🔊</span>
        </label>
        <label class="toggle" title="震动">
          <input
            type="checkbox"
            :checked="settings.vibrate"
            @change="emit('toggle-vibrate', ($event.target as HTMLInputElement).checked)"
          />
          <span>📳</span>
        </label>
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <span class="label">得分</span>
        <span class="value">{{ state.score }}</span>
      </div>
      <div class="stat">
        <span class="label">连击</span>
        <span class="value">{{ state.combo }}</span>
      </div>
      <div class="stat" v-if="rule().timeLimitMs > 0">
        <span class="label">剩余</span>
        <span class="value time" :class="{ urgent: state.timeRemainingMs < 10000 }">
          {{ fmtTime(state.timeRemainingMs) }}
        </span>
      </div>
      <div class="stat" v-else>
        <span class="label">最高</span>
        <span class="value">{{ state.bestScore }}</span>
      </div>
      <div class="stat" v-if="rule().maxMistakes > 0">
        <span class="label">生命</span>
        <span class="value">{{ rule().maxMistakes - state.mistakes }}</span>
      </div>
    </div>

    <div class="mode-grid">
      <button
        v-for="m in MODE_ORDER"
        :key="m"
        :class="['mode-btn', { active: settings.mode === m }]"
        @click="emit('set-mode', m)"
      >
        <div class="mode-name">{{ MODE_RULES[m].name }}</div>
      </button>
    </div>
    <div class="mode-desc">{{ rule().desc }}</div>

    <div class="game-over-banner" v-if="state.gameEndReason">
      <template v-if="state.gameEndReason === 'pass'">🎉 通关！得分 {{ state.score }}</template>
      <template v-else-if="state.gameEndReason === 'timeup'">⏱ 时间到 · 得分 {{ state.score }}</template>
      <template v-else>✗ 错题上限 · 得分 {{ state.score }}</template>
    </div>
    <div class="task-hint" v-else-if="state.formula && state.phase === 'Wait_Input'">
      <div class="task-line">🎯 绕开<strong>灰色障碍球</strong>，2 库击中目标球</div>
      <div class="task-line input-tip">👆 点击任意库边选第一库撞点</div>
    </div>
    <div
      class="hint hit-hint"
      v-else-if="state.lastResult && state.lastResult.hit && state.phase === 'Settle'"
    >
      ✓ 命中！+10 分（误差 {{ state.lastResult.errorDistance }}px）
    </div>
    <div
      class="hint miss-hint"
      v-else-if="state.lastResult && !state.lastResult.hit && state.phase === 'Settle'"
    >
      ✗ 未命中（误差 {{ state.lastResult.errorDistance }}px）
    </div>

    <div class="actions">
      <button v-if="state.gameEndReason" class="btn primary" @click="emit('restart')">
        再来一局
      </button>
      <button
        v-else
        class="btn primary"
        :disabled="state.phase !== 'Settle'"
        @click="emit('next')"
      >
        下一题
      </button>
      <button class="btn ghost" @click="emit('restart')">重新开始</button>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 10px;
  border: 1px solid #e5e2d6;
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.mode-tag {
  font-size: 11px;
  color: #a8862a;
  font-weight: 700;
  padding: 3px 10px;
  background: #f5e6b8;
  border-radius: 12px;
}

.toggles {
  display: flex;
  gap: 8px;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  font-size: 14px;
}

.toggle input {
  width: 14px;
  height: 14px;
  accent-color: #0e5c3a;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}

.stat {
  background: #f8f6f0;
  border-radius: 8px;
  padding: 5px 4px;
  text-align: center;
}

.stat .label {
  display: block;
  font-size: 10px;
  color: #4a4a4a;
}

.stat .value {
  display: block;
  font-size: 17px;
  font-weight: 700;
  color: #0a3f2a;
}

.stat .value.time.urgent {
  color: #b91c1c;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}

.mode-btn {
  padding: 5px 2px;
  border: 1px solid #e5e2d6;
  background: #f8f6f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #4a4a4a;
  cursor: pointer;
  font-family: inherit;
}

.mode-btn.active {
  background: #0e5c3a;
  color: #ffffff;
  border-color: #0e5c3a;
}

.mode-name {
  font-size: 12px;
}

.mode-desc {
  font-size: 10px;
  color: #6b6b6b;
  text-align: center;
  margin-bottom: 8px;
  line-height: 1.4;
}

.task-hint {
  background: linear-gradient(135deg, #fef3c7, #f8f6f0);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 8px;
}

.task-line {
  font-size: 12px;
  color: #1a1a1a;
  line-height: 1.5;
}

.task-line strong {
  color: #b91c1c;
}

.input-tip {
  color: #a8862a;
  font-size: 11px;
  margin-top: 3px;
}

.hint {
  font-size: 12.5px;
  padding: 7px 10px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.hit-hint {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
}

.miss-hint {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.game-over-banner {
  background: linear-gradient(135deg, #d4af37, #a8862a);
  color: #ffffff;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 8px;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn.primary {
  background: #0e5c3a;
  color: #ffffff;
}

.btn.ghost {
  background: transparent;
  color: #4a4a4a;
  border: 1px solid #e5e2d6;
}
</style>
