# Contextualis — Architecture

## System Overview

**Shape:** Static SPA + one stateless serverless function + Gemini. No database, no auth, no microservices.

```
User Browser
  ├─ PDF upload (File API, stays local)
  ├─ POST /api/analyze  →  Serverless function  →  Gemini Interactions API
  │    Response: validated structured JSON
  └─ Client-side PDF.js pipeline (extraction, normalization, evidence matching, highlighting)
```

## Two Independent Pipelines

### Pipeline A — AI Analysis (server-side)
```
PDF bytes (base64) + role + concern
  → /api/analyze
  → Gemini Interactions API (native document input, response_json_schema)
  → Ajv schema validation
  → repair-retry once on failure
  → return validated JSON
```

### Pipeline B — Evidence Verification (client-side only)
```
Local PDF (File object, never re-uploaded)
  → PDF.js getTextContent() per page
  → normalize() (NFKC, quotes, whitespace, ligatures, header/footer strip)
  → reverse index: char-offset → TextItem → page → bounding box
  → tiered evidence matcher (exact → fuzzy → unverified)
  → visual highlight overlay
```

Pipeline B **never sends document content to a server**. This is a deliberate privacy property.

## Key Technical Decisions

See `docs/adr/` for full ADRs.

| Decision | Choice | Key Reason |
|---|---|---|
| Frontend stack | Vite + React + TypeScript | Ecosystem, type safety, fast HMR |
| No database | Stateless ephemeral | Privacy, zero infra, hackathon scope |
| PDF understanding | Gemini native document input | No OCR step, vision-based up to 1000 pages |
| Schema enforcement | response_json_schema + Ajv | Structural guarantee stronger than prompt instruction |
| evidence_status | Computed client-side | Model cannot reliably self-verify its own quotes |
| PDF rendering/extraction | PDF.js (pinned, self-hosted worker) | Programmatic text access + geometry for highlighting |

## Repository Structure

```
contextualis/
├── README.md
├── .env.example
├── .gitignore
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vercel.json
├── public/
│   └── pdf.worker.min.mjs    (self-hosted PDF.js worker)
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── lib/
│   │   ├── evidenceMatcher.ts   (tiered matching engine)
│   │   ├── pdfText.ts           (extraction + normalization + reverse index)
│   │   ├── schema.ts            (JSON Schema + Ajv validator)
│   │   └── api.ts               (client-side API caller)
│   ├── hooks/
│   └── components/
│       └── spike/               (spike harness, not production UI)
├── api/
│   └── analyze.ts               (Vercel serverless function)
├── tests/
│   ├── evidenceMatcher.test.ts
│   ├── schema.test.ts
│   ├── pdfText.test.ts
│   └── promptInjection.test.ts
└── docs/
    ├── ARCHITECTURE.md           (this file)
    ├── DEMO_SCRIPT.md
    ├── RISKS.md
    └── adr/
        ├── README.md
        ├── 0001-frontend-stack.md
        ├── 0002-no-database.md
        ├── 0003-dual-pipeline.md
        ├── 0004-tiered-evidence-matcher.md
        └── 0005-schema-validation.md
```

## Security Model

See `docs/adr/` and inline comments in `api/analyze.ts`.

| Threat | Mitigation |
|---|---|
| Prompt injection in PDF | Document input isolated from instruction segment; content treated as data |
| XSS | No `dangerouslySetInnerHTML`; all model text via default React escaping |
| API key exposure | Key lives only in serverless env var, never in client bundle |
| Malicious file | Magic-byte validation, size cap, page-count cap before Gemini call |
| Information leakage | Log metadata only (size, pages, latency, status) — never document text or model output |
| Session persistence | Stateless: no DB, no previous_interaction_id reuse, nothing persisted |
