import { expect, test } from "./fixtures";

test("拡張機能が読み込まれ、Service Worker が起動して設定画面が表示される", async ({
  serviceWorker,
  optionsPage,
}) => {
  expect(serviceWorker.url()).toMatch(
    /^chrome-extension:\/\/[a-p]{32}\/src\/backend\/background\.js$/,
  );

  await expect(
    optionsPage.getByRole("heading", {
      name: "Reading List Auto Summary 設定",
    }),
  ).toBeVisible();
  await expect(
    optionsPage.getByRole("button", { name: "今すぐ実行" }),
  ).toBeEnabled();
  await expect(
    optionsPage.getByRole("button", { name: "設定を保存" }),
  ).toBeEnabled();
});
