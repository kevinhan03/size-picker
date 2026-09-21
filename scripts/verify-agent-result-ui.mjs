// Local-only browser regression: mocked auth and API responses, no production writes.
// Run: node --env-file=.env.local scripts/verify-agent-result-ui.mjs
import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = "http://localhost:3000";
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const user = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "ui-fixture@example.invalid",
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
  };
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const jwt = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: expires })).toString("base64url")}.fixture`;
  const storageKey = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
  await context.addCookies([
    {
      name: storageKey,
      value: `base64-${Buffer.from(JSON.stringify({ access_token: jwt, refresh_token: "fixture", expires_at: expires, expires_in: 3600, token_type: "bearer", user })).toString("base64url")}`,
      url: base,
    },
  ]);
  const product = {
    id: "123",
    brand: "DIGBOX SAMPLE",
    name: "코튼 카고 팬츠",
    image: "/images/default-product.svg",
    url: "",
    category: "Bottom",
    reasons: ["저장한 상품과 스타일 인상이 비슷해요."],
    tasteScore: 82,
    relationship: "new",
  };
  const conversation = {
    id: user.id,
    title: "UI 테스트",
    updated_at: new Date().toISOString(),
    messages: [
      {
        id: "answer-feedback",
        role: "assistant",
        text: "요청하신 상품을 찾아봤어요.",
        products: [product],
        notes: [],
        presentation: { kind: "recommend", title: "이번 요청에 맞는 발견" },
      },
    ],
  };
  let saved = [];
  let failNext = false;
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    let data = {};
    if (url.pathname === "/api/auth/session")
      data = { user, username: "ui_fixture", needsUsername: false };
    else if (url.pathname === "/api/collections/bootstrap")
      data = {
        closet: { products: [] },
        digbox: { products: [] },
        profiles: [],
      };
    else if (url.pathname === "/api/fashion-agent")
      data = url.searchParams.has("conversationId")
        ? conversation
        : { conversations: [conversation] };
    else if (url.pathname === "/api/fashion-agent/feedback") {
      if (route.request().method() === "POST") {
        await new Promise((resolve) => setTimeout(resolve, 350));
        if (failNext) {
          failNext = false;
          return route.fulfill({
            status: 503,
            json: { ok: false, error: "feedback_unavailable" },
          });
        }
        const body = route.request().postDataJSON();
        saved = [
          {
            assistant_message_id: body.assistantMessageId,
            product_id: body.productId,
            sentiment: body.sentiment,
            reason: body.reason,
          },
        ];
      } else data = saved;
    }
    return route.fulfill({ json: { ok: true, data } });
  });
  // Ensure the fake session never reaches a real auth endpoint.
  await page.route("**/auth/v1/**", (route) => route.fulfill({ json: user }));
  await page.goto(`${base}/fashion-agent`);
  await page.getByLabel("이전 대화 선택").selectOption(conversation.id);
  await page.getByRole("button", { name: "좋아요", exact: true }).click();
  await page.getByText("의견 저장 중…", { exact: true }).waitFor();
  await page.getByText("의견을 저장했어요.", { exact: true }).waitFor();
  assert.equal(saved[0].sentiment, "positive");
  await page.reload();
  await page.getByLabel("이전 대화 선택").selectOption(conversation.id);
  await page.getByText("의견을 저장했어요.", { exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "좋아요", exact: true })
      .getAttribute("aria-pressed"),
    "true"
  );
  await page.getByRole("button", { name: "별로예요", exact: true }).click();
  assert.equal(
    saved[0].sentiment,
    "positive",
    "Opening reasons must not submit an arbitrary negative reason"
  );
  failNext = true;
  await page
    .getByRole("button", { name: "너무 평범해요", exact: true })
    .click();
  await page
    .getByText("저장하지 못했어요. 다시 눌러 주세요.", { exact: true })
    .waitFor();
  assert.equal(saved[0].sentiment, "positive");
  await page
    .getByRole("button", { name: "너무 평범해요", exact: true })
    .click();
  await page.getByText("저장됨 · 너무 평범해요", { exact: true }).waitFor();
  assert.equal(saved[0].reason, "too_plain");
  await page.screenshot({
    path: "/tmp/digbox-feedback-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    ),
    false
  );
  await page.screenshot({
    path: "/tmp/digbox-feedback-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(pageErrors, []);
  console.log(
    "PASS: feedback pending/success/failure/retry/restoration; reason selection; mobile layout; no page errors."
  );
} finally {
  await browser.close();
}
