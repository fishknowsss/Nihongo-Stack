import { defineConfig } from 'mygo-cli'

export default defineConfig({
  name: 'Nihongo Stack',
  identifier: 'com.nihongostack.desktop',
  version: '0.7.0',
  icon: 'assets/app-icon-v0.7.png',
  devUrl: 'http://127.0.0.1:5173',
  devCommand: 'npm run dev',
  buildCommand: 'npm run build',
  frontendDist: 'dist',
  out: 'build/mygo',
  macos: {
    signingIdentity: '-',
  },
})
