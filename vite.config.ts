import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Changed from "::" to true for better compatibility
    port: 8080,
    strictPort: true,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; media-src 'self' https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://sdvakfhmoaoucmhbhwvy.supabase.co wss://sdvakfhmoaoucmhbhwvy.supabase.co https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; worker-src 'self' blob:;"
    },
    fs: {
      strict: true,
      deny: ['.env', '.env.*', '*.{pem,crt,key}', 'supabase/*']
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    port: 8080,
    strictPort: true,
    host: true,
    fs: {
      strict: true,
      deny: ['.env', '.env.*', '*.{pem,crt,key}', 'supabase/*']
    }
  },
}));