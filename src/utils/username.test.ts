import { describe, expect, it } from "vitest";
import {
  normalizeUsername,
  USERNAME_PATTERN,
  validateUsername,
} from "./username";

describe("normalizeUsername", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeUsername("  kevin_han  ")).toBe("kevin_han");
  });

  it("coerces non-string values to a string", () => {
    expect(normalizeUsername(12345)).toBe("12345");
  });

  it("returns an empty string for null or undefined", () => {
    expect(normalizeUsername(null)).toBe("");
    expect(normalizeUsername(undefined)).toBe("");
  });
});

describe("USERNAME_PATTERN", () => {
  it.each(["abc", "kevin_han", "user.name", "a1_.20chars_long_ok"])(
    "accepts %s",
    (value) => {
      expect(USERNAME_PATTERN.test(value)).toBe(true);
    }
  );

  it.each([
    ["ab", "shorter than 3 characters"],
    ["a".repeat(21), "longer than 20 characters"],
    ["kevin han", "contains a space"],
    ["kevin@han", "contains an disallowed symbol"],
    ["한글닉네임", "contains non-ASCII characters"],
  ])("rejects %s (%s)", (value) => {
    expect(USERNAME_PATTERN.test(value)).toBe(false);
  });
});

describe("validateUsername", () => {
  // document is undefined under the Node test environment, so validateUsername
  // always takes its Korean-message branch here; the English branch needs jsdom.
  it("requires a non-empty username", () => {
    expect(validateUsername("")).toBe("사용자 이름을 입력해 주세요.");
    expect(validateUsername("   ")).toBe("사용자 이름을 입력해 주세요.");
  });

  it("rejects a username that fails the pattern", () => {
    expect(validateUsername("ab")).toBe(
      "사용자 이름은 영문, 숫자, 밑줄(_), 마침표(.)만 사용해 3-20자로 입력해 주세요."
    );
  });

  it("accepts a valid username", () => {
    expect(validateUsername("kevin_han")).toBeNull();
  });
});
