import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

/**
 * Vite 构建配置
 * 面向移动端 H5，base 路径默认，开发服务器开放局域网访问便于真机调试
 */
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
  },
});
