# Project TODOs

A concise, actionable backlog based on a quick codebase review. Grouped by priority. Check off as you go.

## P0 – Reliability and security

- Chat embed token hardening

  - Verify domain/audience in `/api/chat` against the token’s `domain` claim (not just signature).
  - Add `iss` and `aud` to token in `/api/chatbot/init` and validate in `/api/chat`.
  - Consider short refresh or silent re-init for tokens near expiry.

- Rate limiting and abuse protection

  - Add simple per-IP and per-tenant rate limiting to `/api/chat` and `/api/upload`.
  - Size-guard prompt/context length; truncate/search limit to safe thresholds.

- RAG toggle source of truth

  - Unify `ragEnabled`: currently returned from `tenant.config.ragEnabled` in `/api/chatbot/init` but read from top-level `tenant.ragEnabled` in `/api/chat` (defaulting true). Pick one location (recommend top-level) and fix both code paths + README.

- Upload validation

  - Enforce MIME-type allowlist (pdf, txt, csv) in `/api/upload`; reject unknown types early.
  - Clarify CSV support in docs (README currently said PDF/TXT only).

- Tenant delete cleanup
  - On `DELETE /api/tenants`, also purge Qdrant collections for that tenant via `deleteCollectionsByTenant` to avoid orphan vector stores.

## P1 – DX and observability

- Logging/metrics

  - Standardize logs with levels and request IDs; redact PII/keys.
  - Add basic counters (requests, failed requests, RAG hits) and latency histograms.

- Configuration consistency

  - Embeddings: `qdrant.ts` expects `AI_PROVIDER` and, for Gemini, `AI_MODEL` (e.g., `embedding-001`). README uses `EMBEDDING_MODEL`/`EMBEDDING_CANDIDATES`. Reconcile/normalize env names and document clearly.
  - Expose effective embedding dimension in logs and in a debug header on `/api/upload`.

- Streaming responses (optional)
  - Add streaming/SSE for `/api/chat` for better UX. Fall back to non-streaming.

## P2 – Product polish

- Admin flows

  - Add simple UI to manage tenant config (bot name, colors, welcome message, allowed domains, RAG toggle) under `app/admin`.
  - Add tenant search, status (active/suspended), and simple suspension toggle.

- Embed package option

  - Provide an NPM package (or versioned static JS) for the embed script instead of inline string in `/app/embed/route.ts`.
  - Add a small init API that supports `data-` attributes for configuration.

- Theming/branding
  - Allow uploading an avatar/logo for the bot; show in header and chat bubbles.
  - Add dark-mode detection and contrast checks for primary/secondary colors.

## P3 – Testing and CI

- Unit tests

  - `lib/qdrant.ts`: `normalizeClientName`, `buildConventionalCollectionName`, collection deletion filters.
  - `lib/file-parser.ts`: TXT/PDF/CSV paths, chunker edge cases.
  - `app/api/chat/route.ts`: token validation branches, RAG on/off, fallback provider.

- Integration tests

  - Upload → embed → search → chat happy path with an ephemeral tenant (mock Qdrant if needed).

- CI
  - Add lint/typecheck/test GitHub Actions.

## P4 – Developer tooling

- Dev containers / Docker Compose

  - Compose for MongoDB + Qdrant + Next dev.
  - Seed script for demo tenants and example documents.

- Scripts
  - Add `pnpm seed` to create a few sample tenants with `allowedDomains` including `localhost`.
  - Add `pnpm purge:tenant <id>` using `deleteCollectionsByTenant` and DB cleanup.

## Content and docs

- README improvements (partially addressed in this PR)
  - Document `public/tenant-tester.html`, embed usage, and non-technical vs technical setup.
  - Clarify supported file types: pdf, txt, csv.
  - Explain environment variables for embeddings (Gemini needs `AI_MODEL=embedding-001`).

## Nice-to-have

- Conversation memory (short-term) with windowed message context per tenant.
- Optional moderation or guardrails before sending to LLMs.
- Per-tenant prompt templates and tools (FAQs mode vs. docs mode).
