import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// TODO(DEPLOYMENT): Add environment-specific config (API base URL, SSO issuer, storage bucket)
// via import.meta.env once the hosting target and secrets management are decided.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  build: {
    rolldownOptions: {
      output: {
        // Third-party code changes rarely; keep it in its own long-cached chunk.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom)[\\/]/, priority: 3 },
            { name: 'ui-kit', test: /node_modules[\\/](@radix-ui|radix-ui|sonner|lucide-react|@floating-ui)[\\/]/, priority: 2 },
            { name: 'vendor', test: /node_modules/, priority: 1 },
          ],
        },
      },
    },
  },
})
