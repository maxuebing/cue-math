<script setup lang="ts">
import { computed } from 'vue';
import { useReviewStats } from '../composables/useReviewStats';

/**
 * 得分曲线：最近 N 局的得分折线（SVG）
 */
const { scoreCurve } = useReviewStats();
const sessions = computed(() => scoreCurve());

const W = 280;
const H = 80;
const PAD = 10;

const points = computed<string>(() => {
  const s = sessions.value;
  if (s.length === 0) {
    return '';
  }
  const max = Math.max(...s.map((x) => x.score), 10);
  const stepX = s.length > 1 ? (W - 2 * PAD) / (s.length - 1) : 0;
  return s
    .map((x, i) => {
      const px = PAD + i * stepX;
      const py = H - PAD - (x.score / max) * (H - 2 * PAD);
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(' ');
});

const maxScore = computed(() => Math.max(...sessions.value.map((x) => x.score), 10));
</script>

<template>
  <div class="score-curve-panel">
    <div class="panel-title">
      <span>📈 得分曲线（最近 {{ sessions.length }} 局 · 最高 {{ maxScore }}）</span>
    </div>
    <svg v-if="sessions.length > 0" :viewBox="`0 0 ${W} ${H}`" class="curve" preserveAspectRatio="xMidYMid meet">
      <polyline :points="points" fill="none" stroke="#0e5c3a" stroke-width="2" stroke-linejoin="round" />
      <circle
        v-for="(s, i) in sessions"
        :key="i"
        :cx="PAD + (sessions.length > 1 ? i * ((W - 2 * PAD) / (sessions.length - 1)) : 0)"
        :cy="H - PAD - (s.score / maxScore) * (H - 2 * PAD)"
        r="2.5"
        fill="#d4af37"
      />
    </svg>
    <div v-else class="empty">暂无对局记录，完成一局后这里会显示得分趋势</div>
  </div>
</template>

<style scoped>
.score-curve-panel {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e5e2d6;
}

.panel-title {
  font-size: 12px;
  font-weight: 700;
  color: #0a3f2a;
  margin-bottom: 6px;
}

.curve {
  width: 100%;
  height: 80px;
  display: block;
}

.empty {
  font-size: 11px;
  color: #8a8a8a;
  text-align: center;
  padding: 20px 0;
}
</style>
