import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Single-file build: dist/index.html carries all JS/CSS inline, so it opens by double-click.
// Images stay as files in dist/creatives (relative paths), so keep that folder next to index.html.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  build: { assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
})
