<script setup lang="ts">
import type { GameReactiveState } from '../composables/useGame';
import { ADVANCED_PASS_COMBO } from '../game/constants';
import { cushionLabel } from '../game/diamondSystem';

/**
 * 控制台：得分 / 连击 / 最高分、2 库任务提示、操作按钮
 */
defineProps<{ state: GameReactiveState }>();
defineEmits<{ next: []; restart: [] }>();
</script>

<template>
  <div class="control-panel">
    <div class="mode-tag">中八 · 2 库 kick 训练</div>

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
        <span class="label">最高分</span>
        <span class="value">{{ state.bestScore }}</span>
      </div>
    </div>

    <div class="task-hint" v-if="state.formula && state.phase === 'Wait_Input'">
      <div class="task-line">
        🎯 绕开<strong>灰色障碍球</strong>，2 库击中目标球
      </div>
      <div class="task-line">
        先撞
        <span class="cushion-tag">{{ cushionLabel(state.formula.cushions[0]) }}</span>
        再撞
        <span class="cushion-tag">{{ cushionLabel(state.formula.cushions[1]) }}</span>
      </div>
      <div class="task-line input-tip">👆 点击金色高亮的库边选撞点</div>
    </div>

    <div
      class="hint hit-hint"
      v-else-if="state.lastResult && state.lastResult.hit && state.phase === 'Settle'"
    >
      ✓ 命中！+10 分
    </div>
    <div
      class="hint miss-hint"
      v-else-if="state.lastResult && !state.lastResult.hit && state.phase === 'Settle'"
    >
      ✗ 未命中，连击清零
    </div>

    <div class="passed-banner" v-if="state.passed">
      🎉 通关！已连续答对 {{ ADVANCED_PASS_COMBO }} 题
    </div>

    <div class="actions">
      <button
        class="btn primary"
        :disabled="state.phase !== 'Settle' || state.passed"
        @click="$emit('next')"
      >
        下一题
      </button>
      <button class="btn ghost" @click="$emit('restart')">
        重新开始
      </button>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e5e2d6;
}

.mode-tag {
  display: inline-block;
  font-size: 11px;
  color: #a8862a;
  font-weight: 600;
  margin-bottom: 8px;
  padding: 3px 9px;
  background: #f5e6b8;
  border-radius: 12px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}

.stat {
  background: #f8f6f0;
  border-radius: 8px;
  padding: 6px 4px;
  text-align: center;
}

.stat .label {
  display: block;
  font-size: 10px;
  color: #4a4a4a;
  margin-bottom: 2px;
}

.stat .value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #0a3f2a;
}

.task-hint {
  background: linear-gradient(135deg, #fef3c7, #f8f6f0);
  border: 1px solid #d4af37;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
}

.task-line {
  font-size: 12.5px;
  color: #1a1a1a;
  line-height: 1.6;
}

.task-line strong {
  color: #b91c1c;
}

.cushion-tag {
  display: inline-block;
  background: #0e5c3a;
  color: #f5e6b8;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  margin: 0 2px;
}

.input-tip {
  color: #a8862a;
  font-size: 12px;
  margin-top: 4px;
}

.hint {
  font-size: 13px;
  padding: 8px 12px;
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
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  margin-bottom: 8px;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 9px 14px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.2s;
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
