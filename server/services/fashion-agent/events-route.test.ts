import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  origin: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
}));
vi.mock("../../auth/request-user", () => ({
  getRegisteredRequestUser: mocks.user,
  hasValidMutationOrigin: mocks.origin,
}));
vi.mock("../../lib/supabase.js", () => ({ supabase: { from: mocks.from } }));
import { POST } from "../../../app/api/fashion-agent/events/route";

const requestId = "11111111-1111-4111-8111-111111111111";
const conversationId = "22222222-2222-4222-8222-222222222222";
const body = {
  conversationId,
  assistantMessageId: `${requestId}:assistant`,
  productId: "123",
  eventType: "click",
};
const request = (value = body) =>
  new Request("http://localhost/api/fashion-agent/events", {
    method: "POST",
    body: JSON.stringify(value),
  });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ id: "owner" });
  mocks.origin.mockReturnValue(true);
  const chain = {
    select: mocks.select,
    eq: mocks.eq,
    maybeSingle: mocks.maybeSingle,
    insert: mocks.insert,
  };
  mocks.from.mockReturnValue(chain);
  mocks.select.mockReturnValue(chain);
  mocks.eq.mockReturnValue(chain);
  mocks.maybeSingle.mockResolvedValue({
    data: {
      id: requestId,
      status: "completed",
      response: {
        messages: [{ id: body.assistantMessageId, products: [{ id: "123" }] }],
      },
      execution: { version: "test-v1" },
    },
    error: null,
  });
  mocks.insert.mockResolvedValue({ error: null });
});

describe("agent card events", () => {
  it("records a displayed product once and verifies ownership", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: 123,
        rank: 1,
        algorithm_version: "test-v1",
      })
    );
    mocks.insert.mockResolvedValueOnce({ error: { code: "23505" } });
    const duplicate = await POST(request());
    expect((await duplicate.json()).data.recorded).toBe(false);
  });
  it("rejects a product absent from the owned response", async () => {
    expect((await POST(request({ ...body, productId: "456" }))).status).toBe(
      400
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("rejects unauthenticated and cross-origin requests", async () => {
    mocks.user.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    mocks.origin.mockReturnValue(false);
    expect((await POST(request())).status).toBe(403);
  });
});
