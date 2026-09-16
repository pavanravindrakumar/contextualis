# ADR-0003: Dual Pipeline — AI Analysis + Client-Side Evidence Verification

## Status

Accepted

## Date

2026-09-15

## Context

We need to: (a) send a PDF to Gemini for contextual analysis, and (b) verify that AI-generated quotes actually exist in the document. These two concerns have conflicting requirements — analysis benefits from Gemini's vision-based document understanding; verification requires deterministic, programmable text access.

## Decision Drivers

- **Privacy** — verification must not send document text to a server
- **Determinism** — evidence verification must be reproducible and auditable, not probabilistic
- **Separation of concerns** — AI analysis and deterministic verification are fundamentally different operations
- **No hallucination amplification** — Gemini should not self-verify its own quotes

## Considered Options

### Option 1: Dual independent pipelines (chosen)
- Pipeline A: PDF bytes → Gemini (server) → structured JSON
- Pipeline B: Same PDF → PDF.js text extraction (client) → deterministic matcher
- Pipelines share no data flow; only the `exact_quote` string from Pipeline A's output feeds into Pipeline B as a search query

### Option 2: Single pipeline — Gemini does everything including verification
- **Rejected**: Model cannot reliably self-verify its own outputs; this is precisely the failure mode we exist to prevent

### Option 3: Server-side text extraction + server-side matching
- **Rejected**: Sends document text to a server (privacy violation per ADR-0002); text extraction and AI analysis would race/duplicate work

### Option 4: OCR service for text extraction
- **Rejected**: Additional dependency, latency, cost, and privacy concern; PDF.js covers native text-layer PDFs well

## Decision

**Two independent pipelines that must not be conflated.**

Pipeline A (server): raw PDF base64 → Gemini document input → validated JSON  
Pipeline B (client-only): PDF.js text extraction → normalization → reverse index → tiered matcher → evidence status + bounding boxes

The `exact_quote` field from Pipeline A's JSON output is the only data that flows into Pipeline B. `evidence_status` is computed by Pipeline B, never by Gemini.

## Consequences

### Positive
- Document text never leaves the browser after upload (verification is client-only)
- Evidence verification is deterministic and auditable
- AI analysis uses Gemini's native vision-based PDF understanding (best available)
- Pipelines can be developed and tested independently

### Negative
- Scanned PDFs (no text layer) will have limited evidence verification capability — mitigated by honest `unverified: scanned page` state
- PDF.js extraction may differ from Gemini's visual reading in edge cases — this is expected and handled by Tier 3/4 fuzzy matching

### Risks
- PDF.js worker bundle size — mitigated by self-hosting the worker file pinned to a specific version

## Related ADRs

- ADR-0001: Frontend Stack (PDF.js requires browser environment)
- ADR-0002: No Database (stateless model)
- ADR-0004: Tiered Evidence Matcher (Pipeline B implementation)
