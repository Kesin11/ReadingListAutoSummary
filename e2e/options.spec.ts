import { expect, test } from "./fixtures";
import { seedSettings } from "./helpers";
import { MOCK_SLACK_WEBHOOK_URL } from "./mocks";

test.describe("設定画面", () => {
  test("設定を保存すると chrome.storage.local に反映され、再読み込み後も表示される", async ({
    serviceWorker,
    optionsPage,
  }) => {
    await optionsPage.getByLabel("既読化までの日数").fill("14");
    await optionsPage
      .getByLabel("Slack Webhook URL")
      .fill(MOCK_SLACK_WEBHOOK_URL);
    await optionsPage.getByRole("button", { name: "設定を保存" }).click();

    await expect(optionsPage.getByText("設定を保存しました。")).toBeVisible();

    const stored = await serviceWorker.evaluate(() =>
      chrome.storage.local.get(["daysUntilRead", "slackWebhookUrl"]),
    );
    expect(stored).toEqual({
      daysUntilRead: 14,
      slackWebhookUrl: MOCK_SLACK_WEBHOOK_URL,
    });

    await optionsPage.reload();
    await expect(optionsPage.getByLabel("既読化までの日数")).toHaveValue("14");
    await expect(optionsPage.getByLabel("Slack Webhook URL")).toHaveValue(
      MOCK_SLACK_WEBHOOK_URL,
    );
  });

  test("Slack 以外のホストの Webhook URL はエラーになり保存されない", async ({
    serviceWorker,
    optionsPage,
  }) => {
    await seedSettings(serviceWorker);
    await optionsPage.reload();

    await optionsPage
      .getByLabel("Slack Webhook URL")
      .fill("https://hooks.slack.com.evil.example/services/T/B/X");
    await optionsPage.getByRole("button", { name: "設定を保存" }).click();

    await expect(
      optionsPage.getByText(
        "Slack Webhook URLはSlackの正しいURLで入力してください",
      ),
    ).toBeVisible();

    const stored = await serviceWorker.evaluate(() =>
      chrome.storage.local.get("slackWebhookUrl"),
    );
    expect(stored.slackWebhookUrl).toBe(MOCK_SLACK_WEBHOOK_URL);
  });
});
