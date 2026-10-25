import { defineConfig, searchForWorkspaceRoot } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  build: {
    // Keep the application entry small without delaying a first-party page.
    // Vite 8 uses Rolldown's code splitting for stable vendor cache groups;
    // all application pages remain available from the initial app module.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
              priority: 20,
            },
            {
              name: 'data-vendor',
              test: /node_modules[\\/]dexie(?:-react-hooks)?[\\/]/,
              priority: 15,
            },
            {
              name: 'icons-vendor',
              test: /node_modules[\\/]@phosphor-icons[\\/]react[\\/]/,
              priority: 10,
            },
            {
              name: 'fsrs-vendor',
              test: /node_modules[\\/]ts-fsrs[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  server: {
    host: '127.0.0.1', port: 5173, strictPort: true,
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), path.resolve(process.cwd(), '../../shared/content')] },
  },
})
