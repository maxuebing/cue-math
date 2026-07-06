import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Vite 构建配置
 * 面向移动端 H5，base 路径默认，开发服务器开放局域网访问便于真机调试
 */
export default defineConfig({
  plugins: [vue()],
  /* 部署在子路径（如 /cue/）时用相对 base，资源解析为 ./assets/... */
  base: './',
  server: {
    host: true,
    port: 5173,
  },
});
