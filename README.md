# SaaS Chatbot Platform

A multi-tenant Next.js platform for AI chatbots with RAG (Retrieval-Augmented Generation), Qdrant vector search, and a clean, modern UI.

## Highlights

- Multi-tenant admin and client portals
- RAG pipeline with MongoDB + Qdrant
- Default LLM: Gemini (fallback: Together)
- Embeddings provider switchable via env (Gemini, Together, OpenAI)
- Strict Qdrant collection naming convention per tenant and vector dimension
- Optional on-disk file persistence

Companion tool: see public/tenant-tester.html (documented below) to preview tenant-specific chatbot branding and behavior.

## Tech Stack

- Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- MongoDB (data), Qdrant (vectors via `@qdrant/js-client-rest`)
- AI SDK (`ai`, `@ai-sdk/openai`) + custom Gemini REST integration
- Shadcn UI components and Radix Primitives

## Repository Structure

```
app/
   admin/
   api/
      auth/
         login/
         verify/
      chat/
      chat-logs/
      chatbot/
         init/
      tenants/
      upload/
   client/
   demo/
   embed/
components/
   theme-provider.tsx
   ui/  (buttons, inputs, dialogs, table, etc.)
hooks/
lib/
   auth.ts
   file-parser.ts
   mongodb.ts
   rag.ts
   qdrant.ts
   together.ts
   gemini.ts
public/
styles/
```

## Setup

Prerequisites

- Node.js 18+, pnpm
- MongoDB (local/Atlas)
- Qdrant (Cloud or Docker/local)
- API keys as applicable: GEMINI_API_KEY (recommended), TOGETHER_API_KEY (fallback), OPENAI_API_KEY (optional for embeddings)

Install

```bash
pnpm install
```

Environment (.env)

```env
# Core
MONGODB_URI=mongodb://localhost:27017/chatbot_saas
JWT_SECRET=replace_me
EMBED_JWT_SECRET=replace_me
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=change_me

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Uploads
PERSIST_UPLOADS=false
MAX_FILE_SIZE=10485760

# Embeddings provider (gemini | openai | together)
AI_PROVIDER=gemini
# Embedding model settings
# - For Gemini embeddings, set AI_MODEL to a Gemini embedding model (e.g., embedding-001)
# - For Together/OpenAI, you can also set EMBEDDING_MODEL or EMBEDDING_CANDIDATES
#   to guide model selection.
AI_MODEL=
EMBEDDING_MODEL=
EMBEDDING_CANDIDATES=

# Chat LLM (Gemini default)
GEMINI_API_KEY=
AI_CHAT_MODEL=gemini-1.5-flash

# Fallback provider (Together) and optional OpenAI (if you switch)
TOGETHER_API_KEY=
OPENAI_API_KEY=
```

Run

```bash
pnpm dev
```

## Key Behaviors

### 1) Qdrant Collection Naming Convention

Pattern: `tenant_<clientName>_<resourceType>_<dimension>`

- clientName: lowercased, non-alphanumerics → underscore, collapsed underscores
- resourceType: docs | faqs | chats | profiles | ... (normalized like clientName)
- dimension: embedding vector size (e.g., 768, 1024)

Implemented helpers (in `lib/qdrant.ts`):

- `normalizeClientName(name)`
- `normalizeResourceType(type)`
- `buildConventionalCollectionName(clientName, resourceType, dimension)`
- `ensureCollectionByConvention(clientName, resourceType, dimension)`
- `createCollection(clientName, resourceType, dimension)`

Upload/search flows resolve the tenant’s display name from MongoDB and use the convention (resourceType="docs"). Logs show the actual collection name used.

### 2) Embeddings Provider Switching

- Controlled by `AI_PROVIDER` env: `gemini` | `openai` | `together`
- Auto-detects embedding dimension from the chosen provider/model
- Together path tries multiple candidates (configurable via `EMBEDDING_MODEL`, `EMBEDDING_CANDIDATES`) and gracefully handles unavailable models

### 3) LLM Selection (Chat Responses)

- Default: Gemini (`GEMINI_API_KEY`, `AI_CHAT_MODEL`, defaults to `gemini-1.5-flash`)
- Fallback: Together (OpenAI-compatible) when Gemini fails
- Response includes headers `x-llm-provider` and `x-llm-model` for observability

### 4) Uploads

- Files parsed from memory buffer (no path dependency); PDF/TXT supported
- Local file persistence toggle via `PERSIST_UPLOADS`
- Basic deduplication by tenant + filename + size

### 5) How RAG Works (Step-by-step)

1. Upload: A tenant uploads a file via `POST /api/upload`.
   - The API reads the file into memory, parses text (`lib/file-parser.ts`), and splits it into chunks.
   - Each chunk is embedded using the configured provider (`AI_PROVIDER`).
2. Vector Store: Embeddings are upserted to Qdrant with normalized IDs.
   - Collection name follows `tenant_<clientName>_docs_<dimension>` and is created if missing.
   - A MongoDB `documents` record tracks status and the Qdrant point IDs.
3. Chat: On `POST /api/chat`, the user query is embedded (same provider) and searched against the tenant’s collection in Qdrant.
4. Context + LLM: Top matches are concatenated and prefixed to the system prompt.
   - The message is sent to the LLM (Gemini by default; Together on fallback).
5. Response + Logging: The answer is returned and a chat log is written to MongoDB.

Example

Suppose tenant “JK CargoCare” uploads a PDF with company FAQs.

- Chunks are embedded (e.g., 768-dim). Qdrant collection becomes `tenant_jkcargocare_docs_768`.
- A user asks: “What are your delivery timelines?”
- We embed the question and search Qdrant; best-matching chunks about delivery timelines are fetched.
- The chat route builds a system prompt with those chunks as context and asks the LLM.
- The LLM responds using the provided context; the reply is saved to `chat_logs` with `ragUsed: true`.

## API Endpoints (App Router)

- `POST /api/chat` — Chat with optional RAG context

  - Auth: Bearer embed token (see `/api/chatbot/init`)
  - Returns: `{ response, timestamp }` + headers `x-llm-provider`, `x-llm-model`

- `POST /api/upload` — Upload a document for a tenant

  - FormData: `file`, `tenantId`
  - Creates document record, chunks, embeds, and upserts into Qdrant

- `GET /api/chat-logs` — Returns chat logs (per tenant; implementation in repo)

- `POST /api/chatbot/init` — Issues short-lived embed token after domain/tenant validation

- `GET|POST|PUT|DELETE /api/tenants` — Manage tenants

## Data Model (MongoDB)

Tenants

```json
{
   "_id": ObjectId,
   "name": String,
   "email": String,
   "password": String,  // hashed
   "apiToken": String,
   "status": "active" | "suspended",
   "ragEnabled": Boolean,
   "allowedDomains": [String],
   "config": {
      "botName": String,
      "welcomeMessage": String,
      "primaryColor": String,
      "secondaryColor": String,
      "companyName": String
   },
   "createdAt": Date,
   "updatedAt": Date
}
```

Documents

```json
{
   "_id": ObjectId,
   "tenantId": String,
   "filename": String,
   "filePath": String?,
   "size": Number,
   "type": String,
   "status": "processing" | "ready" | "error",
   "uploadedAt": Date,
   "chunkCount": Number,
   "pointIds": [String]
}
```

Chat Logs

```json
{
   "_id": ObjectId,
   "tenantId": String,
   "message": String,
   "response": String,
   "timestamp": Date,
   "ragUsed": Boolean
}
```

## Troubleshooting

- Gemini always falls back to Together

  - Ensure `GEMINI_API_KEY` is set and valid
  - Verify `AI_CHAT_MODEL` is a supported Gemini model (e.g., `gemini-1.5-flash`)
  - Check server logs for: `⚠️ Gemini failed, falling back to Together. Reason: ...`

- Qdrant shows unexpected collection names

  - Naming is now `tenant_<clientName>_<resourceType>_<dimension>`
  - Client name is derived from the tenants collection; ensure the tenant has a proper name

- Upload returns ENOENT or parse errors
  - Files are parsed from in-memory buffer; ensure the uploaded file is valid
  - Increase `MAX_FILE_SIZE` if needed

## Security

- Do not commit real credentials; keep `.env` local
- Rotate API keys as needed
- JWT secrets should be long/strong in production

## License

MIT — see `LICENSE` (or your chosen license).

---

## Tenant Tester (public/tenant-tester.html)

Non-technical explanation

- This page lets you switch between tenants and immediately see how the chatbot changes its name, colors, and welcome message.
- Pick a tenant card or paste a tenant ID. The chatbot bubble appears at the bottom-right; click it and chat.

Technical explanation

- The page loads tenants from `GET /api/tenants`, then calls `POST /api/chatbot/init` with the selected `tenantId` and the current domain.
- The init route returns a short-lived JWT and a config object (botName, colors, welcomeMessage, etc.).
- The page injects `/embed`, which builds the widget UI and uses the JWT to call `POST /api/chat`.
- When you switch tenants, the tester updates a `<meta name="chatbot-tenant-id" content="...">` tag and reloads `/embed` to reflect new branding.

Quick example

1. Open `/tenant-tester.html` in your browser while the dev server runs.
2. Click a tenant named "ACME Corp".
3. The chat button color changes to ACME’s primary/secondary colors. The header shows "ACME Assistant".
4. Type a question; the message is sent to `/api/chat` with the tenant’s JWT. If RAG is enabled, the answer includes the tenant’s document context.

Notes

- For local development, any domain checks allow `localhost`. In production, configure `allowedDomains` per tenant.
- The tester forcibly positions the widget at bottom-right, overriding styles to keep it visible.

## How tenants configure chatbots

Non-technical

- Each customer (tenant) has their own chatbot settings: name, welcome message, and brand colors.
- They can upload PDFs/TXT/CSV with their content. The system reads these files to answer questions (RAG).
- The chatbot will only work on websites you authorize (your domain list), and you’ll get a small script to embed it.

Technical

- Tenants are stored in MongoDB (`tenants` collection). Key fields:
  - `status` (active/suspended), `allowedDomains` (array of domains), and `config` (botName, welcomeMessage, primaryColor, secondaryColor, companyName), plus `ragEnabled`.
- The embed initializes via `POST /api/chatbot/init` with `tenantId` and `domain`. It returns a JWT (2h expiry) with tenantId and config claims. `/app/embed/route.ts` uses that to render a simple chat UI and send messages to `/api/chat`.
- Uploads via `POST /api/upload` parse files and upsert vectors into Qdrant using a per-tenant collection named with the convention `tenant_<clientName>_docs_<dimension>` where `<clientName>` comes from the tenant record, and `<dimension>` is inferred from the embedding model.
- Chats via `POST /api/chat` validate the JWT, optionally fetch top-K relevant chunks with `searchTenantContext`, and call Gemini by default (fallback to Together). Response includes `x-llm-provider`/`x-llm-model` headers.

Branding: color and content

- The embed script styles the launcher, header, and send button using the tenant’s `primaryColor` and `secondaryColor`.
- The header shows `config.botName`. The first message is `config.welcomeMessage`.
- Changing tenant config (name/colors/welcome) will reflect on the next init/script reload.

Embedding on your site (basic)

Add this to your HTML and replace TENANT_ID with your tenant’s ID:

```html
<meta name="chatbot-tenant-id" content="TENANT_ID" />
<script src="/embed" defer></script>
```

The script will request a JWT from your server for the current `window.location.hostname`. Ensure your tenant contains that domain in `allowedDomains` in production.

Supported upload types

- PDF (.pdf), Text (.txt), CSV (.csv). Files are parsed in-memory; size limit is `MAX_FILE_SIZE` (default 10 MB).

Environment tips for embeddings

- Gemini embeddings require: `AI_PROVIDER=gemini` and `AI_MODEL=embedding-001` (or another Gemini embedding model).
- OpenAI/Together embeddings can be guided with `EMBEDDING_MODEL` and/or `EMBEDDING_CANDIDATES`.
