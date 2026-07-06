<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { TableApp } from '../game/TableApp';

/**
 * 球桌画布容器组件
 * 负责挂载 / 销毁 TableApp，并通过 ready 事件把实例交给上层绑定交互
 */
const emit = defineEmits<{
  ready: [table: TableApp];
}>();

const containerRef = ref<HTMLDivElement | null>(null);
let table: TableApp | null = null;

onMounted(async () => {
  if (!containerRef.value) {
    return;
  }
  table = new TableApp();
  await table.mount(containerRef.value);
  emit('ready', table);
});

onBeforeUnmount(() => {
  table?.destroy();
  table = null;
});
</script>

<template>
  <div ref="containerRef" class="pool-table"></div>
</template>

<style scoped>
.pool-table {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
