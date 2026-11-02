import type { Worker } from "@playwright/test";
import type { Settings } from "../src/common/chrome_storage";
import {
  MOCK_LLM_ENDPOINT,
  MOCK_LLM_MODEL,
  MOCK_SLACK_WEBHOOK_URL,
} from "./mocks";

export const DAY_MS = 24 * 60 * 60 * 1000;

/** モックの LLM と Slack を使う設定 */
export const MOCK_SETTINGS: Settings = {
  daysUntilRead: 30,
  daysUntilDelete: 60,
  maxEntriesPerDay: 3,
  llmEndpoints: [
    {
      id: "e2e-endpoint",
      name: "Mock LLM",
      endpoint: MOCK_LLM_ENDPOINT,
      apiKey: "dummy-api-key",
    },
  ],
  llmModels: [
    { id: "e2e-model", endpointId: "e2e-endpoint", modelName: MOCK_LLM_MODEL },
  ],
  selectedLlmEndpointId: "e2e-endpoint",
  selectedLlmModelId: "e2e-model",
  slackWebhookUrl: MOCK_SLACK_WEBHOOK_URL,
};

/** chrome.storage.local に設定を直接書き込む */
export async function seedSettings(
  serviceWorker: Worker,
  settings: Settings = MOCK_SETTINGS,
): Promise<void> {
  await serviceWorker.evaluate(async (value) => {
    await chrome.storage.local.set(value);
  }, settings);
}

export async function addReadingListEntry(
  serviceWorker: Worker,
  entry: chrome.readingList.AddEntryOptions,
): Promise<void> {
  await serviceWorker.evaluate(async (value) => {
    await chrome.readingList.addEntry(value);
  }, entry);
}

export async function getReadingListEntries(
  serviceWorker: Worker,
): Promise<chrome.readingList.ReadingListEntry[]> {
  return serviceWorker.evaluate(() => chrome.readingList.query({}));
}

/**
 * Service Worker 内の Date.now を指定日数だけ未来にずらす。
 * chrome.readingList.addEntry() では creationTime を指定できないため、
 * 「登録から〇日経過したエントリ」はこの方法で再現する。
 * Service Worker が再起動すると元に戻るため、処理を実行する直前に呼ぶこと。
 */
export async function advanceServiceWorkerClock(
  serviceWorker: Worker,
  days: number,
): Promise<void> {
  await serviceWorker.evaluate((offsetMs) => {
    const originalNow = Date.now.bind(Date);
    Date.now = () => originalNow() + offsetMs;
  }, days * DAY_MS);
}
