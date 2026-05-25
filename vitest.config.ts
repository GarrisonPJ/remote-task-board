import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["unit-tests/**/*.test.{ts,tsx}"],
    env: {
      DATABASE_URL: "postgresql://localhost:5432/test",
    },
    coverage: {
      provider: "v8",
      include: ["lib/**", "services/**", "schemas/**"],
      reporter: ["text", "text-summary", "lcov"],
      thresholds: {
        lines: 80,
        functions: 70,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
