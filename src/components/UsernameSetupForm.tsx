"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { checkUsernameAvailability, fetchUsernameSuggestions } from "../api/username";
import { captureEvent } from "../utils/analytics";
import { validateUsername } from "../utils/username";

type Props = {
  initialUsername?: string;
  submitLabel: string;
  onSubmit: (username: string) => Promise<void>;
  onSuggestionSelected?: () => void;
  onUsernameChange?: (username: string) => void;
  analyticsSource?: string;
  showSuggestions?: boolean;
};

type Availability = "idle" | "checking" | "available" | "unavailable";

export function UsernameSetupForm({ initialUsername = "", submitLabel, onSubmit, onSuggestionSelected, onUsernameChange, analyticsSource = "username_settings", showSuggestions = true }: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability>("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputId = useId();
  const didCheckRef = useRef("");

  useEffect(() => setUsername(initialUsername), [initialUsername]);
  useEffect(() => { onUsernameChange?.(username); }, [onUsernameChange, username]);

  useEffect(() => {
    let active = true;
    if (!showSuggestions) {
      setSuggestions([]);
      return () => { active = false; };
    }
    void fetchUsernameSuggestions()
      .then((values) => { if (active) setSuggestions(values); })
      .catch(() => { if (active) setSuggestions([]); });
    return () => { active = false; };
  }, [showSuggestions]);

  useEffect(() => {
    let active = true;
    const validationError = validateUsername(username);
    if (validationError) {
      setAvailability("idle");
      setMessage(username ? validationError : "");
      return () => { active = false; };
    }
    setAvailability("checking");
    setMessage("사용 가능 여부를 확인하고 있어요.");
    const timer = window.setTimeout(() => {
      void checkUsernameAvailability(username)
        .then(({ available, reason }) => {
          if (!active) return;
          if (didCheckRef.current !== username) {
            didCheckRef.current = username;
            captureEvent("username_availability_checked", { available });
          }
          setAvailability(available ? "available" : "unavailable");
          setMessage(available ? "사용할 수 있는 사용자 이름이에요." : reason || "이미 사용 중인 사용자 이름이에요.");
        })
        .catch((error: unknown) => {
          if (!active) return;
          setAvailability("unavailable");
          setMessage(error instanceof Error ? error.message : "사용 가능 여부를 확인하지 못했어요. 다시 시도해 주세요.");
        });
    }, 350);
    return () => { active = false; window.clearTimeout(timer); };
  }, [username]);

  const chooseSuggestion = (value: string) => {
    setUsername(value);
    captureEvent("username_suggestion_selected", { source: analyticsSource });
    onSuggestionSelected?.();
  };

  const submit = async () => {
    if (availability !== "available" || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(username.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-black text-gray-200">사용자 이름</label>
      <div className="relative mt-2">
        <input
          id={inputId}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") void submit(); }}
          autoComplete="username"
          autoFocus
          maxLength={20}
          placeholder="예: digbox_user"
          className="h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 pr-11 text-sm font-bold text-white outline-none transition-[border-color,box-shadow] placeholder:text-gray-600 focus-visible:border-orange-400/70 focus-visible:ring-2 focus-visible:ring-orange-400/35"
          aria-describedby={`${inputId}-hint ${inputId}-status`}
          aria-invalid={availability === "unavailable"}
        />
        {availability === "checking" && <LoaderCircle className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-500 motion-reduce:animate-none" />}
        {availability === "available" && <Check className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />}
      </div>
      <p id={`${inputId}-hint`} className="mt-2 text-xs font-semibold leading-relaxed text-gray-500">영문, 숫자, 밑줄(_), 마침표(.)로 3~20자</p>
      <p id={`${inputId}-status`} aria-live="polite" className={`mt-1.5 min-h-5 text-xs font-semibold ${availability === "available" ? "text-emerald-300" : availability === "unavailable" ? "text-red-300" : "text-gray-500"}`}>{message}</p>

      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-black text-gray-400">추천 사용자 이름</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => chooseSuggestion(suggestion)} className={`rounded-full border px-3 py-2 text-xs font-bold transition-[transform,border-color,background-color] active:scale-[0.97] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 ${username === suggestion ? "border-orange-400/60 bg-orange-500/15 text-orange-200" : "border-white/10 bg-white/[0.035] text-gray-300 hover:border-white/25 hover:text-white"}`}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <button type="button" onClick={() => void submit()} disabled={availability !== "available" || isSubmitting} className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-black text-black transition-[transform,background-color,opacity] hover:bg-orange-400 active:scale-[0.985] motion-reduce:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171719] disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400">
        {isSubmitting ? "저장하고 있어요…" : submitLabel}
      </button>
    </div>
  );
}
