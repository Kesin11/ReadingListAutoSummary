import { resolve } from "node:path";
import {
  type BrowserContext,
  test as base,
  chromium,
  type Page,
  type Worker,
} from "@playwright/test";
import { installMocks, type MockRecorder } from "./mocks";

const DIST_PATH = resolve(import.meta.dirname, "../dist");

type ExtensionFixtures = {
  context: BrowserContext;
  serviceWorker: Worker;
  extensionId: string;
  mocks: MockRecorder;
  optionsPage: Page;
};

export const test = base.extend<ExtensionFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright のフィクスチャはオブジェクトの分割代入が必須
  context: async ({}, use, testInfo) => {
    // テストごとに新しいプロファイルを使い、Reading List・chrome.storage・日次クォータを共有しない
    const context = await chromium.launchPersistentContext(
      testInfo.outputPath("user-data"),
      {
        // 同梱 Chromium は headless でも拡張機能を読み込める
        // https://playwright.dev/docs/chrome-extensions
        channel: "chromium",
        headless: true,
        args: [
          `--disable-extensions-except=${DIST_PATH}`,
          `--load-extension=${DIST_PATH}`,
        ],
      },
    );
    await use(context);
    await context.close();
  },

  serviceWorker: async ({ context }, use) => {
    const serviceWorker =
      context.serviceWorkers()[0] ??
      (await context.waitForEvent("serviceworker"));
    await use(serviceWorker);
  },

  extensionId: async ({ serviceWorker }, use) => {
    await use(new URL(serviceWorker.url()).host);
  },

  mocks: async ({ context }, use) => {
    await use(await installMocks(context));
  },

  // mocks に依存させ、ページを開く前に必ず外部通信のモックを登録する
  optionsPage: async ({ context, extensionId, mocks: _mocks }, use) => {
    const page = await context.newPage();
    await page.goto(
      `chrome-extension://${extensionId}/src/frontend/options/options.html`,
    );
    await use(page);
  },
});

export { expect } from "@playwright/test";
