import { defineConfig, searchForWorkspaceRoot } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: '127.0.0.1', port: 5173, strictPort: true,
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), path.resolve(process.cwd(), '../../shared/content')] },
  },
})
