import { defineConfig } from "@playwright/test";

// ビルド済みの dist/ を読み込んだ Chromium で E2E スモークテストを実行する。
// 拡張機能の起動設定（channel / headless / args）は e2e/fixtures.ts の
// launchPersistentContext で行う。事前に `pnpm build` が必要。
export default defineConfig({
  testDir: "./e2e",
  // テストごとに別プロファイルで Chromium を起動するが、マシン負荷を抑えるため直列実行にする
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    trace: "retain-on-failure",
  },
});
