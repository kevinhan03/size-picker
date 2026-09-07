export const USERNAME_PATTERN = /^[A-Za-z0-9_.]{3,20}$/;

export const RESERVED_PROFILE_USERNAMES = new Set([
  "admin",
  "api",
  "auth",
  "closet",
  "dig-match",
  "grid",
  "login",
  "mypage",
  "onboarding",
  "outfit-explorer",
  "outfits",
  "privacy",
  "product",
  "saved",
  "settings",
  "sizes",
  "taste",
  "taste-graph",
  "terms",
  "u",
]);

export const normalizeUsername = (value: unknown): string =>
  String(value ?? "").trim();

const USERNAME_VALIDATION_MESSAGES = {
  ko: {
    required: "사용자 이름을 입력해 주세요.",
    invalid: "사용자 이름은 영문, 숫자, 밑줄(_), 마침표(.)만 사용해 3-20자로 입력해 주세요.",
    reserved: "사용할 수 없는 사용자 이름이에요.",
  },
  en: {
    required: "Please enter a username.",
    invalid: "Usernames must be 3-20 characters using only letters, numbers, underscores (_), and periods (.).",
    reserved: "This username is not available.",
  },
} as const;

export const validateUsername = (value: unknown): string | null => {
  const isEnglish = typeof document !== "undefined" && document.documentElement.lang === "en";
  const messages = isEnglish ? USERNAME_VALIDATION_MESSAGES.en : USERNAME_VALIDATION_MESSAGES.ko;
  const username = normalizeUsername(value);
  if (!username) return messages.required;
  if (!USERNAME_PATTERN.test(username)) {
    return messages.invalid;
  }
  if (RESERVED_PROFILE_USERNAMES.has(username.toLowerCase())) {
    return messages.reserved;
  }
  return null;
};
