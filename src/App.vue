<script setup lang="ts">
import PoolTable from './components/PoolTable.vue';
import ControlPanel from './components/ControlPanel.vue';
import FormulaPanel from './components/FormulaPanel.vue';
import { useGame } from './composables/useGame';
import type { TableApp } from './game/TableApp';
import type { Difficulty } from './game/constants';

/**
 * 应用根组件
 * 竖屏 70 / 30 布局：上半屏球桌画布，下半屏控制台（PRD §4.1）
 * 首次 pointerdown 解锁音频上下文（移动端自动播放限制）
 */
const { state, settings, setTable, start, gotoNext, setDifficulty, unlockAudio } = useGame();

function handleReady(table: TableApp): void {
  setTable(table);
  start();
}
</script>

<template>
  <div class="app" @pointerdown="unlockAudio">
    <div class="table-area">
      <PoolTable @ready="handleReady" />
    </div>
    <div class="panel-area">
      <ControlPanel
        :state="state"
        :settings="settings"
        @next="gotoNext"
        @restart="start"
        @set-difficulty="(d: Difficulty) => setDifficulty(d)"
        @toggle-sound="(on: boolean) => (settings.sound = on)"
        @toggle-vibrate="(on: boolean) => (settings.vibrate = on)"
      />
      <FormulaPanel :formula="state.formula" :result="state.lastResult" />
    </div>
  </div>
</template>
