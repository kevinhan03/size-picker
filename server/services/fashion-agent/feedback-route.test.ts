import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  from: vi.fn(),
  origin: vi.fn(),
  upsert: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  select: vi.fn(),
}));
vi.mock("../../auth/request-user", () => ({
  getRegisteredRequestUser: mocks.user,
  hasValidMutationOrigin: mocks.origin,
}));
vi.mock("../../lib/supabase.js", () => ({
  assertSupabaseConfig: vi.fn(),
  supabase: { from: mocks.from },
}));
import { GET, POST } from "../../../app/api/fashion-agent/feedback/route";
const body = {
  conversationId: "11111111-1111-4111-8111-111111111111",
  assistantMessageId: "message",
  productId: "123",
  sentiment: "positive",
  reason: null,
};
const request = (value = body) =>
  new Request("http://localhost/api/fashion-agent/feedback", {
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
    upsert: mocks.upsert,
  };
  mocks.from.mockReturnValue(chain);
  mocks.select.mockReturnValue(chain);
  mocks.eq.mockReturnValue(chain);
  mocks.maybeSingle.mockResolvedValue({
    data: {
      messages: [
        { id: "message", role: "assistant", products: [{ id: "123" }] },
      ],
    },
    error: null,
  });
  mocks.upsert.mockResolvedValue({ error: null });
});
describe("product feedback API", () => {
  it("accepts numeric product IDs and persists feedback for the owned conversation", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ product_id: 123, user_id: "owner" }),
      expect.anything()
    );
  });
  it("rejects invalid IDs and products absent from the answer", async () => {
    expect((await POST(request({ ...body, productId: "abc" }))).status).toBe(
      400
    );
    expect((await POST(request({ ...body, productId: "456" }))).status).toBe(
      400
    );
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("scopes restored feedback to the authenticated user and conversation", async () => {
    mocks.eq
      .mockReturnValueOnce({ eq: mocks.eq })
      .mockResolvedValueOnce({ data: [], error: null });
    expect(
      (
        await GET(
          new Request(
            `http://localhost/api/fashion-agent/feedback?conversationId=${body.conversationId}`
          )
        )
      ).status
    ).toBe(200);
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(mocks.eq).toHaveBeenCalledWith(
      "conversation_id",
      body.conversationId
    );
  });
  it("does not allow anonymous feedback reads", async () => {
    mocks.user.mockResolvedValue(null);
    expect(
      (
        await GET(
          new Request(
            `http://localhost/api/fashion-agent/feedback?conversationId=${body.conversationId}`
          )
        )
      ).status
    ).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
