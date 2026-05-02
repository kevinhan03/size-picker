export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

export const normalizeUsername = (value: unknown): string =>
  String(value ?? "").trim();

export const validateUsername = (value: unknown): string | null => {
  const username = normalizeUsername(value);
  if (!username) return "유저네임을 입력해 주세요.";
  if (!USERNAME_PATTERN.test(username)) {
    return "유저네임은 영문, 숫자, 밑줄(_)만 사용해 3-20자로 입력해 주세요.";
  }
  return null;
};
