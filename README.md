# Size Picker (Vite + Express Proxy)

## Why this structure

- Frontend never stores Gemini API key.
- Frontend calls only `/api/*`.
- Express server holds `GEMINI_API_KEY` in server `.env`.
- Size-table extraction uses Gemini structured output (JSON Schema).

## Windows path recommendation

To avoid crashes in toolchains under Korean/non-ASCII paths, keep the project in an English path:

- Recommended: `C:\dev\size-picker`
- Avoid: Desktop or user paths with Korean folder names

## Setup

1. Install dependencies
```bash
npm install
```

2. Create server `.env`
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8787
```

3. Run web + server together
```bash
npm run dev
```

## Dev scripts

- `npm run dev:web`: Vite HTTPS dev server (via `scripts/dev-proxy.ps1`)
- `npm run dev:server`: Express API server (`server/index.js`)
- `npm run dev:server:only`: server only
- `npm run dev`: run web + server together with `concurrently`

## Health check

Check if backend is running:

- `http://localhost:8787/health`
- Expected response:
```json
{
  "ok": true,
  "port": 8787,
  "ts": "2026-02-14T00:00:00.000Z"
}
```

## API endpoints

- `POST /api/size-table`
  - Input: `{ "imageBase64": "...", "mimeType": "image/png" }`
  - Output: `{ "ok": true, "data": { "headers": [], "rows": [[]] } }`
- `POST /api/remove-bg`
  - Input: `{ "imageBase64": "...", "mimeType": "image/png" }`
  - Output: `{ "ok": true, "data": { "imageBase64": "..." } }`
  - On failure: returns `ok: false` and original image in `data.imageBase64`

## HTTPS (frontend)

This project already enables HTTPS in Vite using `@vitejs/plugin-basic-ssl`.

Optional mkcert method:

1. Generate `localhost.pem`, `localhost-key.pem`
2. Load them in `vite.config.ts` via `server.https`
3. Cert files are git-ignored:
   - `localhost.pem`
   - `localhost-key.pem`
