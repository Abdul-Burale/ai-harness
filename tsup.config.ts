import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    cli: "src/cli/index.ts",
  },
  format: ["esm"],
  platform: "node",
  target: "node20",
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  outDir: "dist",
  outExtension: () => ({ js: ".mjs" }),
});
