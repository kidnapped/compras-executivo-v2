import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint'

export default defineConfig({
    root: 'react',
    publicDir: 'react/public',
    build: {
        outDir: 'react/dist',
        emptyOutDir: true,
    },
    server: {
        port: 8000
    },
    plugins: [
        react(),
        eslint({
            include: ['react/**/*.{js,jsx,ts,tsx}'], // lint apenas arquivos React
            exclude: ['node_modules', 'dist', 'build']
        })
    ]
})
