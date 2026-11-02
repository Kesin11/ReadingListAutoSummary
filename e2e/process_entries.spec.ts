import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import {
  addReadingListEntry,
  advanceServiceWorkerClock,
  getReadingListEntries,
  MOCK_SETTINGS,
  seedSettings,
} from "./helpers";
import {
  MOCK_ARTICLE_TITLE,
  MOCK_ARTICLE_URL,
  MOCK_LLM_MODEL,
  MOCK_SUMMARY,
} from "./mocks";

async function runManually(optionsPage: Page): Promise<void> {
  await optionsPage.getByRole("button", { name: "今すぐ実行" }).click();
  await expect(optionsPage.getByText("実行が完了しました")).toBeVisible({
    timeout: 30_000,
  });
}

test.describe("リーディングリストの自動処理（今すぐ実行）", () => {
  test("期限を過ぎた未読エントリを要約して Slack に投稿し、既読にする", async ({
    serviceWorker,
    mocks,
    optionsPage,
  }) => {
    await seedSettings(serviceWorker);
    await addReadingListEntry(serviceWorker, {
      title: MOCK_ARTICLE_TITLE,
      url: MOCK_ARTICLE_URL,
      hasBeenRead: false,
    });
    await advanceServiceWorkerClock(
      serviceWorker,
      MOCK_SETTINGS.daysUntilRead + 1,
    );

    await runManually(optionsPage);

    expect(mocks.llmRequests).toHaveLength(1);
    expect(mocks.llmRequests[0]).toMatchObject({ model: MOCK_LLM_MODEL });
    expect(mocks.slackMessages).toEqual([
      `*${MOCK_ARTICLE_TITLE}*\n${MOCK_ARTICLE_URL}\n\n_${MOCK_LLM_MODEL}による要約_\n\n${MOCK_SUMMARY}`,
    ]);

    const entries = await getReadingListEntries(serviceWorker);
    expect(entries).toEqual([
      expect.objectContaining({ url: MOCK_ARTICLE_URL, hasBeenRead: true }),
    ]);
  });

  test("期限前の未読エントリは処理しない", async ({
    serviceWorker,
    mocks,
    optionsPage,
  }) => {
    await seedSettings(serviceWorker);
    await addReadingListEntry(serviceWorker, {
      title: MOCK_ARTICLE_TITLE,
      url: MOCK_ARTICLE_URL,
      hasBeenRead: false,
    });

    await runManually(optionsPage);

    expect(mocks.llmRequests).toHaveLength(0);
    expect(mocks.slackMessages).toHaveLength(0);
    const entries = await getReadingListEntries(serviceWorker);
    expect(entries).toEqual([
      expect.objectContaining({ url: MOCK_ARTICLE_URL, hasBeenRead: false }),
    ]);
  });

  test("本文抽出に失敗した場合は LLM を呼ばずに Slack へエラーを通知する", async ({
    serviceWorker,
    mocks,
    optionsPage,
  }) => {
    mocks.setArticleResponse({ status: 404, body: "Not Found" });
    await seedSettings(serviceWorker);
    await addReadingListEntry(serviceWorker, {
      title: MOCK_ARTICLE_TITLE,
      url: MOCK_ARTICLE_URL,
      hasBeenRead: false,
    });
    await advanceServiceWorkerClock(
      serviceWorker,
      MOCK_SETTINGS.daysUntilRead + 1,
    );

    await runManually(optionsPage);

    expect(mocks.llmRequests).toHaveLength(0);
    expect(mocks.slackMessages).toHaveLength(1);
    expect(mocks.slackMessages[0]).toContain(`*${MOCK_ARTICLE_TITLE}*`);
    expect(mocks.slackMessages[0]).toContain("本文抽出失敗");
  });

  test("削除までの日数を過ぎた既読エントリを削除する", async ({
    serviceWorker,
    mocks,
    optionsPage,
  }) => {
    await seedSettings(serviceWorker);
    await addReadingListEntry(serviceWorker, {
      title: MOCK_ARTICLE_TITLE,
      url: MOCK_ARTICLE_URL,
      hasBeenRead: true,
    });
    await advanceServiceWorkerClock(
      serviceWorker,
      MOCK_SETTINGS.daysUntilDelete + 1,
    );

    await runManually(optionsPage);

    expect(await getReadingListEntries(serviceWorker)).toEqual([]);
    expect(mocks.llmRequests).toHaveLength(0);
    expect(mocks.slackMessages).toHaveLength(0);
  });
});
