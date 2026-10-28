import { defineConfig } from "vite";
import reactTailwind from "@tailwindcss/vite";
export default defineConfig({
  base: "/",
  plugins: [reactTailwind()],
  build: { sourcemap: true },
});
