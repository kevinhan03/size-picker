const AUTH_MESSAGES = {
  ko: {
    fallback: "오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    invalidCredentials: "이메일 또는 비밀번호가 올바르지 않습니다.",
    emailNotConfirmed: "이메일 인증이 아직 완료되지 않았습니다. 메일함에서 인증을 먼저 진행해 주세요.",
    alreadyRegistered: "이미 가입된 이메일입니다. 로그인으로 이용해 주세요.",
    signupDisabled: "현재 회원가입이 일시적으로 제한되어 있습니다.",
    weakPassword: "비밀번호가 너무 짧거나 안전하지 않습니다. 더 긴 비밀번호를 입력해 주세요.",
    rateLimit: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
    network: "네트워크 연결을 확인한 뒤 다시 시도해 주세요.",
    registrationRequired: "회원가입을 완료한 뒤 이용해 주세요.",
    authRequired: "로그인이 필요합니다. 다시 로그인해 주세요.",
  },
  en: {
    fallback: "Something went wrong. Please try again shortly.",
    invalidCredentials: "Your email or password is incorrect.",
    emailNotConfirmed: "Your email hasn't been verified yet. Please check your inbox to verify it first.",
    alreadyRegistered: "This email is already registered. Please log in instead.",
    signupDisabled: "Sign-ups are temporarily restricted right now.",
    weakPassword: "Your password is too short or not secure enough. Please use a longer password.",
    rateLimit: "Too many requests. Please try again shortly.",
    network: "Please check your network connection and try again.",
    registrationRequired: "Please complete sign-up before continuing.",
    authRequired: "You need to log in. Please log in again.",
  },
} as const;

function getAuthMessages() {
  const isEnglish = typeof document !== "undefined" && document.documentElement.lang === "en";
  return isEnglish ? AUTH_MESSAGES.en : AUTH_MESSAGES.ko;
}

export const getAuthErrorMessage = (
  error: unknown,
  fallback?: string
): string => {
  const messages = getAuthMessages();
  const resolvedFallback = fallback ?? messages.fallback;
  const message = error instanceof Error ? error.message : String(error || "");
  const normalized = message.toLowerCase();

  if (!normalized) return resolvedFallback;
  if (normalized.includes("invalid login credentials")) {
    return messages.invalidCredentials;
  }
  if (normalized.includes("email not confirmed")) {
    return messages.emailNotConfirmed;
  }
  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return messages.alreadyRegistered;
  }
  if (normalized.includes("signup is disabled")) {
    return messages.signupDisabled;
  }
  if (normalized.includes("password should be") || normalized.includes("weak password")) {
    return messages.weakPassword;
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return messages.rateLimit;
  }
  if (normalized.includes("network") || normalized.includes("fetch failed")) {
    return messages.network;
  }
  if (normalized.includes("registered account required")) {
    return messages.registrationRequired;
  }
  if (normalized.includes("authentication is required") || normalized.includes("auth token")) {
    return messages.authRequired;
  }

  return resolvedFallback;
};
