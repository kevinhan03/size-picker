import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  origin: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("../../auth/request-user", () => ({
  getRegisteredRequestUser: mocks.user,
  hasValidMutationOrigin: mocks.origin,
}));
vi.mock("../../lib/supabase.js", () => ({
  assertSupabaseConfig: vi.fn(),
  supabase: { rpc: mocks.rpc },
}));
import { DELETE } from "../../../app/api/fashion-agent/route";

const conversation = "11111111-1111-4111-8111-111111111111";
const request = (id = conversation) =>
  new Request(`http://localhost/api/fashion-agent?conversationId=${id}`, {
    method: "DELETE",
  });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ id: "owner" });
  mocks.origin.mockReturnValue(true);
  mocks.rpc.mockResolvedValue({ data: true, error: null });
});

describe("conversation deletion route", () => {
  it("asks the owner-scoped database function to delete", async () => {
    expect((await DELETE(request())).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("fashion_agent_delete", {
      actor: "owner",
      conversation,
    });
  });
  it("rejects unknown, busy, and malformed conversations", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: false, error: null });
    expect((await DELETE(request())).status).toBe(404);
    mocks.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "conversation_busy" },
    });
    expect((await DELETE(request())).status).toBe(409);
    expect((await DELETE(request("invalid"))).status).toBe(400);
  });
  it("requires authentication and a valid origin", async () => {
    mocks.user.mockResolvedValue(null);
    expect((await DELETE(request())).status).toBe(401);
    mocks.origin.mockReturnValue(false);
    expect((await DELETE(request())).status).toBe(403);
  });
});
