<script setup lang="ts">
import { ref } from 'vue';
import PoolTable from './components/PoolTable.vue';
import ControlPanel from './components/ControlPanel.vue';
import FormulaPanel from './components/FormulaPanel.vue';
import HeatmapPanel from './components/HeatmapPanel.vue';
import ScoreCurve from './components/ScoreCurve.vue';
import ReviewPanel from './components/ReviewPanel.vue';
import { useGame } from './composables/useGame';
import type { TableApp } from './game/TableApp';
import type { Mode, Question } from './game/types';

/**
 * 应用根组件
 * 底部 Tab 切换：训练（球桌 + 控制台）/ 复盘（热力图 + 曲线 + 错题本）
 */
const { state, settings, setTable, start, gotoNext, redoMistake, unlockAudio } = useGame();
const tab = ref<'train' | 'review'>('train');

function handleReady(table: TableApp): void {
  setTable(table);
  start();
}

/** 重做错题：注入题面并切回训练 Tab */
function handleRedo(q: Question): void {
  redoMistake(q);
  tab.value = 'train';
}
</script>

<template>
  <div class="app" @pointerdown="unlockAudio">
    <div class="train-view" v-show="tab === 'train'">
      <div class="table-area">
        <PoolTable @ready="handleReady" />
      </div>
      <div class="panel-area">
        <ControlPanel
          :state="state"
          :settings="settings"
          @next="gotoNext"
          @restart="start"
          @set-mode="(m: Mode) => start(m)"
          @toggle-sound="(on: boolean) => (settings.sound = on)"
          @toggle-vibrate="(on: boolean) => (settings.vibrate = on)"
        />
        <FormulaPanel :formula="state.formula" :result="state.lastResult" />
      </div>
    </div>

    <div class="review-view" v-if="tab === 'review'">
      <HeatmapPanel />
      <ScoreCurve />
      <ReviewPanel @redo="handleRedo" />
    </div>

    <nav class="tab-bar">
      <button :class="['tab-btn', { active: tab === 'train' }]" @click="tab = 'train'">🎯 训练</button>
      <button :class="['tab-btn', { active: tab === 'review' }]" @click="tab = 'review'">📊 复盘</button>
    </nav>
  </div>
</template>
