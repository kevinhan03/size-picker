export const getAuthErrorMessage = (
  error: unknown,
  fallback = "오류가 발생했습니다. 잠시 후 다시 시도해 주세요."
): string => {
  const message = error instanceof Error ? error.message : String(error || "");
  const normalized = message.toLowerCase();

  if (!normalized) return fallback;
  if (normalized.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
  if (normalized.includes("email not confirmed")) {
    return "이메일 인증이 아직 완료되지 않았습니다. 메일함에서 인증을 먼저 진행해 주세요.";
  }
  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "이미 가입된 이메일입니다. 로그인으로 이용해 주세요.";
  }
  if (normalized.includes("signup is disabled")) {
    return "현재 회원가입이 일시적으로 제한되어 있습니다.";
  }
  if (normalized.includes("password should be") || normalized.includes("weak password")) {
    return "비밀번호가 너무 짧거나 안전하지 않습니다. 더 긴 비밀번호를 입력해 주세요.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (normalized.includes("network") || normalized.includes("fetch failed")) {
    return "네트워크 연결을 확인한 뒤 다시 시도해 주세요.";
  }
  if (normalized.includes("registered account required")) {
    return "회원가입을 완료한 뒤 이용해 주세요.";
  }
  if (normalized.includes("authentication is required") || normalized.includes("auth token")) {
    return "로그인이 필요합니다. 다시 로그인해 주세요.";
  }

  return fallback;
};
