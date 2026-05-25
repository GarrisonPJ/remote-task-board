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
    coverage: {
      provider: "v8",
      include: ["lib/**", "services/**", "schemas/**"],
      reporter: ["text", "text-summary", "lcov"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
