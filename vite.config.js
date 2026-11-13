import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    // during `npm run dev`, send /api requests to the Express server in api/
    proxy: {
      "/api": "http://localhost:4200",
    },
  },
});
