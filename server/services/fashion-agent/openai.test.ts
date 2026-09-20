import { afterEach, describe, expect, it, vi } from "vitest";
import { structuredResponse } from "./openai";
import { objectSchema } from "./contracts";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const schema = objectSchema({ text: { type: "string", maxLength: 100 } });
describe("OpenAI Responses boundary", () => {
  it("sends only server-side credentials and validates strict structured output", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-server-secret");
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [{ type: "output_text", text: '{"text":"ok"}' }],
          },
        ],
      })
    );
    vi.stubGlobal("fetch", fetcher);
    expect(
      await structuredResponse("example", schema, "rules", { message: "hi" })
    ).toEqual({ text: "ok" });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(init.headers.Authorization).toBe("Bearer test-server-secret");
    const body = JSON.parse(init.body);
    expect(body.store).toBe(false);
    expect(body.text.format.strict).toBe(true);
  });
  it.each([
    { status: "incomplete", output: [] },
    {
      status: "completed",
      output: [{ type: "message", content: [{ type: "refusal" }] }],
    },
    {
      status: "completed",
      output: [
        {
          type: "message",
          content: [
            { type: "output_text", text: 'prefix {"text":"not JSON"}' },
          ],
        },
      ],
    },
    {
      status: "completed",
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: '{"text":12}' }],
        },
      ],
    },
  ])("rejects unsafe or incomplete provider output", async (payload) => {
    vi.stubEnv("OPENAI_API_KEY", "test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(payload)));
    await expect(
      structuredResponse("example", schema, "rules", {})
    ).rejects.toThrow();
  });
  it("does not leak provider errors or call an unconfigured provider", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(
      structuredResponse("example", schema, "rules", {})
    ).rejects.toThrow("agent_not_configured");
    expect(fetcher).not.toHaveBeenCalled();
    vi.stubEnv("OPENAI_API_KEY", "test");
    fetcher.mockResolvedValue(
      new Response("secret provider details", { status: 500 })
    );
    await expect(
      structuredResponse("example", schema, "rules", {})
    ).rejects.toThrow("model_unavailable");
  });
});
