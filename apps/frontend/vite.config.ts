import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: "../../", // lê o .env da raiz do monorepo
  server: { port: 5173 },
});