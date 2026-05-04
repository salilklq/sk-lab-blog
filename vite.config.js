import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "./",
  build: {
    assetsDir: "assets",
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        test: resolve(root, "articles/test.html")
      }
    }
  }
});
