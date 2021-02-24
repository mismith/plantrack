import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  optimizeDeps: { include: ['firebase/app', 'firebase/auth', 'firebase/database'] },
  plugins: [vue()],
})
