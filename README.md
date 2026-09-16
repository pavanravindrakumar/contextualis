# Contextualis

**AI for Legal Assistance & Access** — PromptWars: Virtual (Exclusive Edition)

A context-aware legal document navigator that shows you what matters *to you*, why it matters, and where your document proves it.

---

## What It Does

Upload a legal PDF, declare your role and concern, and Contextualis:

1. Analyzes the document using Gemini (native PDF vision, not OCR)
2. Returns a structured, schema-validated result prioritized for your context
3. Verifies every AI-generated claim against the actual document text (client-side, deterministic)
4. Shows you exactly where in the PDF each finding is sourced — or honestly labels it "unverified"
5. Provides guided actions (Explain, Why does this matter?, Simplify, etc.)
6. Generates questions to prepare for a qualified legal professional

**This is not an AI lawyer. It provides informational analysis only.**

---

## Quick Start

### Prerequisites

- Node.js 22+
- A Gemini API key (see [Google AI Studio](https://aistudio.google.com))

### Setup

```bash
git clone https://github.com/your-username/contextualis.git
cd contextualis
npm install
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here
npm run dev
```

The app runs at `http://localhost:5173`. Without an API key, it runs in mock mode automatically.

---

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full design.

**Key design decisions:**
- **No database** — all state is ephemeral. Legal documents never leave your session.
- **Dual pipeline** — Gemini analysis (server) and evidence verification (client-side PDF.js) are fully independent
- **evidence_status is computed, not generated** — the model never self-certifies its own quotes
- **Honest uncertainty** — unverified claims are shown, labelled, and never treated as verified

---

## Development

```bash
npm run test          # run all tests
npm run typecheck     # TypeScript type checking
npm run lint          # lint src, tests, api
npm run build         # production build
```

---

## Repository Structure

```
contextualis/
├── src/
│   ├── lib/
│   │   ├── evidenceMatcher.ts   ← tiered evidence matching engine (most critical)
│   │   ├── pdfText.ts           ← PDF.js extraction + reverse index
│   │   ├── schema.ts            ← Gemini output schema + Ajv validator
│   │   └── api.ts               ← client-side fetch wrapper
│   └── components/spike/        ← technical validation harness (not production UI)
├── api/
│   └── analyze.ts               ← Vercel serverless function (Pipeline A)
├── tests/
│   ├── evidenceMatcher.test.ts
│   ├── schema.test.ts
│   └── promptInjection.test.ts
└── docs/
    ├── ARCHITECTURE.md
    └── adr/                     ← Architecture Decision Records
```

---

## Security

- API key never in client bundle, never in logs, never in repo
- No `dangerouslySetInnerHTML` — all model text through React's default escaping
- PDF content never sent to server after analysis (verification is client-side only)
- Prompt injection: document content is always data, never instructions
- All model output schema-validated before reaching the frontend

---

## Legal Disclaimer

This tool provides informational analysis only. It does not constitute legal advice. Always consult a qualified legal professional before making decisions based on legal documents.
