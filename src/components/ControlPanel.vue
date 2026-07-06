<script setup lang="ts">
import type { GameReactiveState } from '../composables/useGame';
import type { UserSettings } from '../storage/settingsStorage';
import { ADVANCED_PASS_COMBO, type Difficulty } from '../game/constants';

/**
 * 控制台：得分 / 连击 / 最高分、难度选择、音效/震动开关、任务提示、操作按钮
 */
defineProps<{
  state: GameReactiveState;
  settings: UserSettings;
}>();

const emit = defineEmits<{
  next: [];
  restart: [];
  'set-difficulty': [d: Difficulty];
  'toggle-sound': [on: boolean];
  'toggle-vibrate': [on: boolean];
}>();

const DIFFICULTIES: ReadonlyArray<{ key: Difficulty; label: string }> = [
  { key: 'easy', label: '简单' },
  { key: 'normal', label: '进阶' },
  { key: 'hard', label: '大师' },
];
</script>

<template>
  <div class="control-panel">
    <div class="top-row">
      <span class="mode-tag">中八 · 2 库 kick</span>
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
      <div class="stat">
        <span class="label">最高</span>
        <span class="value">{{ state.bestScore }}</span>
      </div>
    </div>

    <div class="seg">
      <button
        v-for="d in DIFFICULTIES"
        :key="d.key"
        :class="['seg-btn', { active: settings.difficulty === d.key }]"
        @click="emit('set-difficulty', d.key)"
      >
        {{ d.label }}
      </button>
    </div>

    <div class="task-hint" v-if="state.formula && state.phase === 'Wait_Input'">
      <div class="task-line">
        🎯 绕开<strong>灰色障碍球</strong>，2 库击中目标球
      </div>
      <div class="task-line input-tip">👆 点击任意库边选第一库撞点（自行判断撞哪条库）</div>
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
      ✗ 未命中，连击清零（误差 {{ state.lastResult.errorDistance }}px）
    </div>

    <div class="passed-banner" v-if="state.passed">
      🎉 通关！已连续答对 {{ ADVANCED_PASS_COMBO }} 题
    </div>

    <div class="actions">
      <button
        class="btn primary"
        :disabled="state.phase !== 'Settle' || state.passed"
        @click="emit('next')"
      >
        下一题
      </button>
      <button class="btn ghost" @click="emit('restart')">
        重新开始
      </button>
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
  font-weight: 600;
  padding: 3px 9px;
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

.seg {
  display: flex;
  background: #f8f6f0;
  border-radius: 8px;
  padding: 2px;
  margin-bottom: 8px;
}

.seg-btn {
  flex: 1;
  padding: 5px 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #4a4a4a;
  cursor: pointer;
  font-family: inherit;
}

.seg-btn.active {
  background: #0e5c3a;
  color: #ffffff;
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

.cushion-tag {
  display: inline-block;
  background: #0e5c3a;
  color: #f5e6b8;
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  margin: 0 2px;
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

.passed-banner {
  background: linear-gradient(135deg, #d4af37, #a8862a);
  color: #ffffff;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
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
