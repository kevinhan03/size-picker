import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  authorized: vi.fn(),
  origin: vi.fn(),
  from: vi.fn(),
}));
vi.mock("../../auth/admin-session.js", () => ({
  getAdminTokenFromCookieHeader: () => "token",
  verifyAdminSessionToken: mocks.authorized,
}));
vi.mock("../../auth/request-user", () => ({
  hasValidMutationOrigin: mocks.origin,
}));
vi.mock("../../lib/supabase.js", () => ({
  supabase: { from: mocks.from },
}));
import { GET, PUT } from "../../../app/api/admin/agent/route";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.authorized.mockReturnValue(false);
  mocks.origin.mockReturnValue(true);
});
it("rejects log access and reviews without an admin session", async () => {
  expect(
    (await GET(new Request("http://localhost/api/admin/agent"))).status
  ).toBe(401);
  expect(
    (
      await PUT(
        new Request("http://localhost/api/admin/agent", { method: "PUT" })
      )
    ).status
  ).toBe(401);
  expect(mocks.from).not.toHaveBeenCalled();
});
it("rejects cross-origin reviews before touching data", async () => {
  mocks.authorized.mockReturnValue(true);
  mocks.origin.mockReturnValue(false);
  expect(
    (
      await PUT(
        new Request("http://localhost/api/admin/agent", { method: "PUT" })
      )
    ).status
  ).toBe(403);
  expect(mocks.from).not.toHaveBeenCalled();
});
it("rejects invalid review scores", async () => {
  mocks.authorized.mockReturnValue(true);
  expect(
    (
      await PUT(
        new Request("http://localhost/api/admin/agent", {
          method: "PUT",
          body: JSON.stringify({
            id: "00000000-0000-4000-8000-000000000001",
            taste: 9,
            explanation: 3,
            conditions: 3,
            issue: "none",
            note: "",
          }),
        })
      )
    ).status
  ).toBe(400);
  expect(mocks.from).not.toHaveBeenCalled();
});
it("rejects invalid blind comparison scores", async () => {
  mocks.authorized.mockReturnValue(true);
  expect(
    (
      await PUT(
        new Request("http://localhost/api/admin/agent", {
          method: "PUT",
          body: JSON.stringify({
            action: "comparison_review",
            id: "00000000-0000-4000-8000-000000000001",
            preferredOption: "a",
            tasteA: 8,
            tasteB: 3,
          }),
        })
      )
    ).status
  ).toBe(400);
  expect(mocks.from).not.toHaveBeenCalled();
});
