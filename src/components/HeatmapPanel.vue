<script setup lang="ts">
import { computed } from 'vue';
import { useReviewStats, type HeatmapCell } from '../composables/useReviewStats';
import {
  CUE_ZONE_LABELS,
  CUSHION_ABBR_LABELS,
  CUSHION_ABBRS,
} from '../game/questionClassifier';

/**
 * 盲区热力图：4 行（母球象限）× 4 列（第一库）
 * 错误率越高色越深，无答题为浅灰
 */
const { heatmapMatrix, refresh } = useReviewStats();
const matrix = computed(() => heatmapMatrix());

/** 根据错误率生成背景色（浅金 → 深绿） */
function cellColor(cell: HeatmapCell): string {
  if (cell.total === 0) {
    return '#f1efe6';
  }
  const lightness = 78 - cell.rate * 48;
  return `hsl(140, 55%, ${lightness}%)`;
}
</script>

<template>
  <div class="heatmap-panel">
    <div class="panel-title">
      <span>🎯 盲区热力图（母球象限 × 第一库）</span>
      <button class="refresh-btn" @click="refresh">↻</button>
    </div>
    <div class="grid">
      <div class="cell corner"></div>
      <div v-for="c in CUSHION_ABBRS" :key="c" class="cell head">
        {{ CUSHION_ABBR_LABELS[c] }}库
      </div>
      <template v-for="row in matrix" :key="row[0].zone">
        <div class="cell head">{{ CUE_ZONE_LABELS[row[0].zone] }}</div>
        <div
          v-for="cell in row"
          :key="cell.cushion"
          class="cell data"
          :style="{ background: cellColor(cell) }"
          :title="`母球${CUE_ZONE_LABELS[cell.zone]} / 第一库${CUSHION_ABBR_LABELS[cell.cushion]}：错 ${cell.errors}/${cell.total}（${Math.round(cell.rate * 100)}%）`"
        >
          <span class="num">{{ cell.errors }}/{{ cell.total }}</span>
        </div>
      </template>
    </div>
    <div class="legend">
      <span>低错误率</span>
      <span class="gradient"></span>
      <span>高错误率（盲区）</span>
    </div>
  </div>
</template>

<style scoped>
.heatmap-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e5e2d6;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #0a3f2a;
  margin-bottom: 8px;
}

.refresh-btn {
  background: transparent;
  border: 1px solid #e5e2d6;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  color: #4a4a4a;
}

.grid {
  display: grid;
  grid-template-columns: 48px repeat(4, 1fr);
  gap: 3px;
}

.cell {
  padding: 8px 2px;
  text-align: center;
  border-radius: 4px;
  font-size: 11px;
}

.cell.corner {
  background: transparent;
}

.cell.head {
  background: #0e5c3a;
  color: #f5e6b8;
  font-weight: 700;
  font-size: 10px;
}

.cell.data {
  color: #1a1a1a;
  font-weight: 600;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.legend {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 10px;
  color: #6b6b6b;
}

.gradient {
  flex: 1;
  max-width: 120px;
  height: 10px;
  background: linear-gradient(90deg, hsl(140, 55%, 78%), hsl(140, 55%, 30%));
  border-radius: 5px;
}
</style>
