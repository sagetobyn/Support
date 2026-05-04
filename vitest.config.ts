import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
  resolve: {
    alias: {
      "@": srcPath,
      "@/": `${srcPath}/`
    }
  }
});
