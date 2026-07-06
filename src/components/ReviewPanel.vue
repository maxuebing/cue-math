<script setup lang="ts">
import { computed } from 'vue';
import { useReviewStats } from '../composables/useReviewStats';
import { cushionLabel } from '../game/diamondSystem';
import type { Question } from '../game/types';

/**
 * 错题本：列出最近错题，支持"重做此题"
 */
const emit = defineEmits<{ redo: [question: Question] }>();

const { stats, refresh } = useReviewStats();
const mistakes = computed(() => stats.mistakes.slice(0, 50));

/** 格式化时间 */
function fmtTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
</script>

<template>
  <div class="review-panel">
    <div class="panel-title">
      <span>📝 错题本（共 {{ stats.mistakes.length }} 题，最近 50）</span>
      <button class="refresh-btn" @click="refresh">↻</button>
    </div>
    <div v-if="mistakes.length === 0" class="empty">暂无错题，开始训练吧</div>
    <div v-else class="list">
      <div v-for="(m, i) in mistakes" :key="i" class="item">
        <div class="item-info">
          <span class="time">{{ fmtTime(m.ts) }}</span>
          <span class="err">误差 {{ m.errorDistance }}px</span>
          <span class="cushions">
            {{ cushionLabel(m.question.cushions[0]) }} → {{ cushionLabel(m.question.cushions[1]) }}
          </span>
        </div>
        <button class="redo-btn" @click="emit('redo', m.question)">重做</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-panel {
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

.empty {
  font-size: 11px;
  color: #8a8a8a;
  text-align: center;
  padding: 16px 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f6f0;
  border-radius: 8px;
  padding: 6px 10px;
}

.item-info {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 11px;
  color: #4a4a4a;
  flex-wrap: wrap;
}

.item-info .time {
  color: #8a8a8a;
}

.item-info .err {
  color: #b91c1c;
  font-weight: 600;
}

.item-info .cushions {
  color: #0a3f2a;
  font-weight: 600;
}

.redo-btn {
  background: #0e5c3a;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}
</style>
