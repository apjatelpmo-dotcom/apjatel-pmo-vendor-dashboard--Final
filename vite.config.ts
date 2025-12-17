
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Pastikan API Key terinject dengan benar
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
      // Define process.env kosong untuk library lain yang mungkin mengeceknya, 
      // tapi jangan menimpa properti spesifik yang kita set di atas.
      // Vite menghandle replacement string secara literal.
      'process.env': {} 
    }
  }
})
