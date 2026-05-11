import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["unit-tests/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://localhost:5432/test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
