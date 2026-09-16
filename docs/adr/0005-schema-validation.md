# ADR-0005: Schema-First Validation with Ajv + response_json_schema

## Status

Accepted

## Date

2026-09-15

## Context

Gemini's structured output needs to be validated before it reaches the frontend. The validation must be structural (schema-enforced), not prompt-based. Unvalidated or partially-validated model output reaching the frontend is a security and product-correctness failure.

## Decision Drivers

- **Schema-level enforcement is strictly stronger than prompt instruction** — model may deviate from text instructions; JSON Schema is enforced structurally
- **Malformed output must never reach the frontend** — the frontend's contract is "every field present matches the schema exactly"
- **One repair attempt is acceptable** — most `response_json_schema` failures are edge cases, not systematic
- **`evidence_status` must never be a model output field** — it is computed, not generated

## Considered Options

### Option 1: Ajv (JSON Schema Draft-07) on server + response_json_schema on model call (chosen)
- `response_json_schema` constrains structure at the API level
- Ajv validates the parsed response before returning to client
- One repair-retry on failure; hard error on second failure

### Option 2: Zod on server
- **Not chosen**: Zod is excellent but JSON Schema is the native format for `response_json_schema`; maintaining two schema representations is error-prone

### Option 3: No server-side validation, validate on client
- **Rejected**: Malformed model output would reach the client; XSS risk via injected field content

### Option 4: TypeScript-only (no runtime validation)
- **Rejected**: TypeScript types are compile-time only; they do not validate runtime data

## Decision

**Single source of truth: JSON Schema defined in `src/lib/schema.ts`.**

- Schema is exported as a plain JSON object (usable both in `response_json_schema` API call and in Ajv validation)
- Server function validates with Ajv immediately on model response
- On validation failure: one repair pass (re-send errors to Gemini)
- On repeated failure: return safe generic error to client, log request ID only
- Frontend receives only validated, schema-conformant objects

## Schema Design Principles

- `evidence_status` is **absent** from the schema — it is never a model output
- `exact_quote` and `page_hint` are **inline** on each item (no cross-referencing evidence array)
- All required fields are genuinely required; optional fields use `nullable: true`
- Post-validation: strip any fields not in the schema (defense in depth)

## Consequences

### Positive
- Double-layer schema enforcement (API-level + Ajv) closes most failure surface
- Frontend can trust schema conformance — no defensive optional chaining everywhere
- Schema is testable in isolation (schema.test.ts)

### Negative
- Schema must be kept in sync between `response_json_schema` and Ajv validator — mitigated: they reference the same object

### Risks
- `response_json_schema` behavior with nested arrays + optional fields needs early validation against the live API (this is one of the Top-5 risks from the architecture review)

## Related ADRs

- ADR-0003: Dual Pipeline (server validation is part of Pipeline A)
- ADR-0004: Tiered Evidence Matcher (validated schema output feeds into matcher)
