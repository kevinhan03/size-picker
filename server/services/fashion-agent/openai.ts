import { AgentError, validateSchema, type objectSchema } from "./contracts";

export async function structuredResponse<T>(
  name: string,
  schema: ReturnType<typeof objectSchema>,
  instructions: string,
  input: unknown,
  signal?: AbortSignal
): Promise<T> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key.startsWith("your_"))
    throw new AgentError("agent_not_configured", 503);
  // Structured output can occasionally end incomplete despite a completed
  // transport response. Retry once only for malformed provider output.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(25000)])
          : AbortSignal.timeout(25000),
        body: JSON.stringify({
          model: process.env.OPENAI_FASHION_AGENT_MODEL || "gpt-4.1-mini",
          store: false,
          max_output_tokens: 2400,
          instructions,
          input: JSON.stringify(input),
          text: { format: { type: "json_schema", name, strict: true, schema } },
        }),
      });
      if (!response.ok)
        throw new AgentError(
          response.status === 429 ? "model_busy" : "model_unavailable",
          response.status === 429 ? 429 : 502
        );
      const data = await response.json();
      if (data.status !== "completed" || !Array.isArray(data.output))
        throw new AgentError("invalid_model_response", 502);
      const parts = data.output.flatMap(
        (item: {
          type?: string;
          content?: Array<{ type: string; text?: string }>;
        }) => (item.type === "message" ? item.content || [] : [])
      );
      if (parts.some((part: { type: string }) => part.type === "refusal"))
        throw new AgentError("model_refused", 422);
      const text = parts
        .filter((part: { type: string }) => part.type === "output_text")
        .map((part: { text?: string }) => part.text || "")
        .join("");
      let value: unknown;
      try {
        value = JSON.parse(text);
      } catch {
        throw new AgentError("invalid_model_response", 502);
      }
      validateSchema(value, schema);
      return value as T;
    } catch (error) {
      if (
        attempt === 0 &&
        error instanceof AgentError &&
        error.code === "invalid_model_response"
      )
        continue;
      throw error;
    }
  }
  throw new AgentError("invalid_model_response", 502);
}
