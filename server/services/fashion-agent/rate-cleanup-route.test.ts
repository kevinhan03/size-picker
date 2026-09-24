import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  delete: vi.fn(),
  lt: vi.fn(),
}));
vi.mock("../../lib/supabase.js", () => ({ supabase: { from: mocks.from } }));
import { GET } from "../../../app/api/cron/fashion-agent-rate-events/route";
const originalSecret = process.env.CRON_SECRET;
afterAll(() => {
  if (originalSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalSecret;
});

beforeEach(() => {
  vi.resetAllMocks();
  process.env.CRON_SECRET = "test-secret";
  mocks.from.mockReturnValue({ delete: mocks.delete });
  mocks.delete.mockReturnValue({ lt: mocks.lt });
  mocks.lt.mockResolvedValue({ error: null });
});

describe("agent rate ledger cleanup", () => {
  it("requires the cron secret", async () => {
    expect(
      (
        await GET(
          new Request("http://localhost/api/cron/fashion-agent-rate-events")
        )
      ).status
    ).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("removes only entries older than the rate window", async () => {
    const request = new Request(
      "http://localhost/api/cron/fashion-agent-rate-events",
      { headers: { authorization: "Bearer test-secret" } }
    );
    expect((await GET(request)).status).toBe(200);
    expect(mocks.from).toHaveBeenCalledWith("fashion_agent_rate_events");
    expect(mocks.lt).toHaveBeenCalledWith("created_at", expect.any(String));
  });
});
