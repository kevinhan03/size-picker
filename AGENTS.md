# AGENTS Rules

- Frontend must never contain API keys.
- Gemini must be called only on the server side.
- Size-table JSON extraction must use structured output (JSON Schema) only.
- Frontend must not parse model output by slicing text between `{` and `}`.
- On Windows, prefer English-only project paths such as `C:\dev\project`.
- Keep existing behavior unless a change is required for safety or architecture.
