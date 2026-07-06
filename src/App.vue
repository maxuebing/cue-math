<script setup lang="ts">
import PoolTable from './components/PoolTable.vue';
import ControlPanel from './components/ControlPanel.vue';
import FormulaPanel from './components/FormulaPanel.vue';
import { useGame } from './composables/useGame';
import type { TableApp } from './game/TableApp';

/**
 * 应用根组件
 * 竖屏 60 / 40 布局：上半屏球桌画布，下半屏控制台（PRD §4.1）
 */
const { state, setTable, start, gotoNext } = useGame();

/** 画布就绪：注入 TableApp 并开始首局 */
function handleReady(table: TableApp): void {
  setTable(table);
  start();
}
</script>

<template>
  <div class="app">
    <div class="table-area">
      <PoolTable @ready="handleReady" />
    </div>
    <div class="panel-area">
      <ControlPanel :state="state" @next="gotoNext" @restart="start" />
      <FormulaPanel :formula="state.formula" :result="state.lastResult" />
    </div>
  </div>
</template>
