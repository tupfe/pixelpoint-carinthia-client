<!-- .github/copilot-instructions.md -->
# Copilot / Agent instructions — Carinthia Client

Purpose: help an AI coding agent be productive immediately in this Nuxt 3 TypeScript client.

- Project type: Nuxt 3 single-repo client (root-level `nuxt.config.ts`, `app.vue`, `pages/`).
- Language: TypeScript with `strict: true` (see `nuxt.config.ts`).
- Key runtime: server API endpoints live in `server/api/` and are Nitro server routes.

Quick commands

- Start dev server: `npm run dev` (uses `nuxt dev`).
- Build: `npm run build` (uses `nuxt build`).
- Preview built app: `npm run preview` (uses `nuxt preview`).
- Debug configuration: `.vscode/launch.json` exists and points the debugger to `http://localhost:8080` — verify the dev server port when launching.

Important files and patterns (examples)

- `nuxt.config.ts` — development flags and runtime config. Notable keys:
  - `devtools.enabled: true` (devtools available in dev).
  - `runtimeConfig`: private token `NUXT_CARINTHIA_TOKEN` and public keys `carinthiaBaseUrl` and `carinthiaDefaultEndpoint`.

- `server/api/carinthia.ts` — single server-side proxy for Carinthia API.
  - It reads `useRuntimeConfig()` to access `carinthiaToken` and `public` values.
  - Supports GET (query: `?endpoint=...`) and POST (body: `{ endpoint?, filter? }`).
  - It constructs the external URL from `public.carinthiaBaseUrl` and forwards the token in a POST body to the external service.
  - Use this route for all external Carinthia calls to keep the token server-side.

- `pages/index.vue` and `app.vue` — simple SFC layout; pages use `<NuxtPage />`.

How to implement new functionality (concrete guidance)

- Adding a new data fetch from Carinthia:
  - Add UI code in `pages/` or `components/` that calls your own client helper which POSTs to `/api/carinthia`.
  - Example POST payload: `{ endpoint: 'my-endpoint', filter: { /* Carinthia filters */ } }`.
  - The server handler will forward the token; do not use `carinthiaToken` directly in client code.

- Server-side changes:
  - Keep sensitive keys in runtime env vars (NUXT_CARINTHIA_TOKEN). Change defaults in `nuxt.config.ts` only when necessary.

Example client request (conceptual):

```js
// client-side: call the local server proxy
await $fetch('/api/carinthia', {
  method: 'POST',
  body: { endpoint: 'my-endpoint', filter: { q: 'search' } }
});
```

Repository conventions and pitfalls

- Strict TypeScript is enabled: prefer typed payloads and return types when editing server/api files.
- All external network access should be proxied through `server/api/*` routes to avoid leaking the token.
- The project currently has minimal UI scaffolding — keep changes small and localized (add pages/components, keep global app layout in `app.vue`).

Notes for the agent when editing or creating files

- Reference `nuxt.config.ts` when introducing new runtime config keys; place secrets only in the private runtime config (top-level `runtimeConfig`).
- When updating API proxy logic, preserve the error handling pattern used in `server/api/carinthia.ts` (console.error then `createError(...)`).
- Confirm dev server port before updating `.vscode/launch.json` — it currently targets `http://localhost:8080`.

If anything looks missing or incorrect (env names, expected endpoints, or preferred ports), ask the human developer to confirm before making changes.

-- End of instructions
