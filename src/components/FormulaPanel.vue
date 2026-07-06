<script setup lang="ts">
import type { AnswerResult, Cushion } from '../game/types';
import { cushionLabel } from '../game/diamondSystem';

/**
 * 公式解析面板：镜像法 2 库路径 + 误差距离 + 用户/正确撞点对比
 */
defineProps<{
  formula: { cushions: [Cushion, Cushion] } | null;
  result: AnswerResult | null;
}>();
</script>

<template>
  <div class="formula-panel" v-if="formula">
    <div class="panel-title">镜像法 · 2 库解球</div>

    <div class="formula-row" v-if="result">
      <span>母球</span>
      <span class="arrow">→</span>
      <span class="cushion">{{ cushionLabel(formula.cushions[0]) }}</span>
      <span class="arrow">→</span>
      <span class="cushion">{{ cushionLabel(formula.cushions[1]) }}</span>
      <span class="arrow">→</span>
      <span>目标球</span>
    </div>
    <div class="formula-row pending" v-else>
      <span>自行判断撞哪两条库（2 库解球，答题后显示正确路径）</span>
    </div>

    <div class="result-row" v-if="result" :class="result.hit ? 'hit' : 'miss'">
      <span class="err">误差 {{ result.errorDistance }}px</span>
      <span class="pts">
        你 ({{ Math.round(result.userPoint.x) }},{{ Math.round(result.userPoint.y) }})
      </span>
      <span class="pts">
        正 ({{ Math.round(result.realPoint.x) }},{{ Math.round(result.realPoint.y) }})
      </span>
      <span class="badge">{{ result.hit ? '✓ 命中' : '✗ 错误' }}</span>
    </div>
    <div class="result-row pending" v-else>
      <span>障碍球挡住直线与 1 库路径，必须 2 库解球</span>
    </div>
  </div>
</template>

<style scoped>
.formula-panel {
  background: #0a3f2a;
  border-radius: 12px;
  padding: 10px 12px;
  color: #f5e6b8;
  border: 1px solid #d4af37;
}

.panel-title {
  font-size: 11px;
  letter-spacing: 1px;
  color: #d4af37;
  margin-bottom: 6px;
}

.formula-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px;
  font-size: 12.5px;
}

.formula-row .arrow {
  color: #d4af37;
}

.formula-row .cushion {
  background: rgba(212, 175, 55, 0.2);
  color: #f5e6b8;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 11px;
}

.result-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(212, 175, 55, 0.3);
  font-size: 11px;
  font-family: "SF Mono", Consolas, monospace;
}

.result-row .err {
  font-weight: 700;
}

.result-row.hit {
  color: #86efac;
}

.result-row.miss {
  color: #fca5a5;
}

.result-row.pending {
  color: #f5e6b8;
  font-family: inherit;
  font-size: 11px;
  opacity: 0.85;
}

.result-row .badge {
  margin-left: auto;
  font-weight: 700;
  font-family: inherit;
}
</style>
