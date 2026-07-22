import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // proxy /api -> Azure Functions local (func start :7071)
      "/api": "http://localhost:7071",
    },
  },
});
