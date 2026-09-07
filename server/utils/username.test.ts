import { describe, expect, it } from "vitest";
import { validateUsername } from "./username.js";

describe("server username validation", () => {
  it("rejects public route names reserved by the application", () => {
    expect(validateUsername("settings")).toBe("사용할 수 없는 사용자 이름이에요.");
    expect(validateUsername("sizes")).toBe("사용할 수 없는 사용자 이름이에요.");
    expect(validateUsername("Admin", "en")).toBe("This username is not available.");
  });

  it("accepts a non-reserved profile username", () => {
    expect(validateUsername("seonwoo")).toBeNull();
  });
});
