import type { BrowserContext } from "@playwright/test";

// 外部サービスのダミーホスト（RFC 2606 で予約された実在しない .test ドメイン）
export const MOCK_LLM_ENDPOINT = "https://llm.example.test/v1";
export const MOCK_LLM_MODEL = "mock-model";
export const MOCK_ARTICLE_URL = "https://article.example.test/posts/1";
export const MOCK_ARTICLE_TITLE = "Mock Article";
// 設定のバリデーションが hooks.slack.com のみ許可するため実際の形式の URL を使い、route で横取りする
export const MOCK_SLACK_WEBHOOK_URL =
  "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXX";
export const MOCK_SUMMARY =
  "モック要約の1段落目です。\n\nモック要約の2段落目です。";

const MOCK_ARTICLE_HTML = `<!doctype html>
<html lang="ja">
<head><title>${MOCK_ARTICLE_TITLE}</title></head>
<body>
  <article>
    <h1>${MOCK_ARTICLE_TITLE}</h1>
    ${"<p>これは本文抽出のためのモック記事の段落です。readability が本文として判定できるだけの十分な長さの文章を用意しています。</p>".repeat(20)}
  </article>
</body>
</html>`;

type ArticleResponse = { status: number; body: string };

export interface MockRecorder {
  /** LLM の chat completions へ送られたリクエストボディ */
  readonly llmRequests: unknown[];
  /** Slack Webhook へ投稿されたメッセージの text */
  readonly slackMessages: string[];
  /** 記事ページへのレスポンスを差し替える（本文抽出の失敗ケース用） */
  setArticleResponse(response: ArticleResponse): void;
}

/**
 * 拡張機能（Service Worker を含む）が発行する外部への HTTP(S) リクエストを
 * すべて context.route() で横取りする。モック対象外のホストへの通信は abort して、
 * 実在の外部サービスへアクセスしないことを保証する。
 */
export async function installMocks(
  context: BrowserContext,
): Promise<MockRecorder> {
  const llmRequests: unknown[] = [];
  const slackMessages: string[] = [];
  let articleResponse: ArticleResponse = {
    status: 200,
    body: MOCK_ARTICLE_HTML,
  };

  // route は後から登録したものが優先されるため、catch-all を最初に登録する
  await context.route("**/*", async (route) => {
    const { protocol } = new URL(route.request().url());
    if (protocol === "http:" || protocol === "https:") {
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });

  await context.route(
    `${MOCK_LLM_ENDPOINT}/chat/completions`,
    async (route) => {
      llmRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "chatcmpl-mock",
          object: "chat.completion",
          created: 0,
          model: MOCK_LLM_MODEL,
          choices: [
            {
              index: 0,
              finish_reason: "stop",
              message: { role: "assistant", content: MOCK_SUMMARY },
            },
          ],
        }),
      });
    },
  );

  await context.route(
    `${new URL(MOCK_ARTICLE_URL).origin}/**`,
    async (route) => {
      await route.fulfill({
        status: articleResponse.status,
        contentType: "text/html; charset=utf-8",
        body: articleResponse.body,
      });
    },
  );

  await context.route("https://hooks.slack.com/**", async (route) => {
    const payload: { text: string } = route.request().postDataJSON();
    slackMessages.push(payload.text);
    await route.fulfill({ status: 200, contentType: "text/plain", body: "ok" });
  });

  return {
    llmRequests,
    slackMessages,
    setArticleResponse(response) {
      articleResponse = response;
    },
  };
}
