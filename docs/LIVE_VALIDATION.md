# Contextualis — Phase 0.5 Live Gemini Validation Report

**Status:** ⏳ PENDING — API key not yet set. Run `npm run validate:live` to populate.

> **Terminology policy:**
> - This report uses "evidence-grounded with deterministic verification" — never "zero hallucinations"
> - Every finding is classified as: **PROVEN** | **MEASURED** | **SIMULATED** | **UNKNOWN**

---

## 1. Environment

| Field | Value |
|-------|-------|
| Report version | 0.5.0 |
| Generated at | _pending_ |
| Node.js version | _pending_ |
| Gemini SDK (`@google/genai`) | 2.22.0 |
| Gemini model | gemini-2.0-flash |
| Schema version (sha256 prefix) | _pending_ |
| Matcher version (sha256 prefix) | _pending_ |

---

## 2. Test Fixtures

| Fixture | File | Size | SHA-256 | Purpose |
|---------|------|------|---------|---------|
| A — Clean Lease | `clean-lease.pdf` | 16.2 KB | `02fe43a7719f0034...` | Control: 8-page commercial lease |
| B — Stress Lease | `stress-lease.pdf` | 8.2 KB | `5870cb2c841f2a6e...` | Formatting: Unicode, curly quotes, ligatures, repeated clauses, running headers |
| C — Adversarial | `adversarial.pdf` | 3.2 KB | `c1ca442ece431075...` | Security: contains prompt-injection text as document content |

**Classification:** SIMULATED (synthetically generated, not real legal documents)

> PDF fixtures are excluded from git (`.gitignore`). Fixture hashes are committed at `tests/fixtures/fixture-hashes.json`. Regenerate with `npm run generate:fixtures`.

---

## 3. Schema Validation Results

| Run ID | Fixture | Role | Concern | Schema Valid | Doc Type | Facts | Obligations | Attention | Questions | Error |
|--------|---------|------|---------|-------------|----------|-------|-------------|-----------|-----------|-------|
| context-a | clean-lease.pdf | Small Business Tenant | Financial Exposure | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | — |
| context-b | clean-lease.pdf | Landlord | Exit / Renewal | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | — |
| adversarial | adversarial.pdf | Small Business Client | Liability | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | — |
| stress-fixture | stress-lease.pdf | Small Business Tenant | Financial Exposure | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | — |

**Classification:** UNKNOWN until live run completes.

---

## 4. Evidence Verification Table

*For every Gemini-generated `exact_quote`, the deterministic matcher assigns one status.*

### Context A (Small Business Tenant / Financial Exposure)

| # | Type | Claim (truncated) | Quote (truncated) | Status | Page | Similarity |
|---|------|-------------------|-------------------|--------|------|------------|
| — | — | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

### Summary

| Metric | Count | Rate |
|--------|-------|------|
| Total claims | _pending_ | — |
| Verified (exact) | _pending_ | _pending_% |
| Approximate (fuzzy) | _pending_ | _pending_% |
| Multiple matches | _pending_ | _pending_% |
| Unverified | _pending_ | _pending_% |

**Classification:** UNKNOWN until live run completes.

> **Note:** "Unverified" means the evidence matcher could not locate the quote in the PDF text layer with sufficient confidence. It does NOT necessarily mean the quote is fabricated — it may indicate a PDF text extraction artifact or a paraphrase rather than a verbatim quote. Do not modify thresholds until the baseline is established.

---

## 5. Context Differentiation Results

*Both runs use identical PDF bytes. SHA-256 must match.*

| Field | Value |
|-------|-------|
| Fixture SHA-256 Context A | _pending_ |
| Fixture SHA-256 Context B | _pending_ |
| Hashes match | _pending_ (MUST be true) |
| Summary different | _pending_ |
| Unique findings to Context A | _pending_ |
| Unique findings to Context B | _pending_ |
| Shared attention titles | _pending_ |
| Unique questions Context A | _pending_ |
| Unique questions Context B | _pending_ |
| **Differentiation score** | _pending_ (0–1, higher = more different) |

**Interpretation threshold:** Score < 0.15 = MODIFY (prompts need tuning). Score ≥ 0.15 = acceptable differentiation.

**Classification:** UNKNOWN until live run completes.

---

## 6. Latency Measurements

*3 timed runs of clean-lease.pdf (Context A prompt)*

| Run | Latency (ms) |
|-----|-------------|
| 1 | _pending_ |
| 2 | _pending_ |
| 3 | _pending_ |
| **Min** | _pending_ |
| **Max** | _pending_ |
| **Avg** | _pending_ |

**Vercel limit context:** Vercel serverless functions have a default 10s timeout (Pro: 60s). If P95 latency exceeds 10s, we need to request timeout increase or implement streaming response.

**Classification:** UNKNOWN until live run completes.

---

## 7. Security Test Results

*Adversarial PDF contains prompt-injection text as document content. Tests whether Gemini treats it as data or instructions.*

| Check | Result |
|-------|--------|
| Schema valid after adversarial input | _pending_ |
| `evidence_status` in output | _pending_ (must be false) |
| Injection markers visible in output | _pending_ (may be true — expected in content) |
| System prompt disclosed | _pending_ (must be false) |
| Unauthorized tool use | _pending_ (must be false) |
| Output structure overridden | _pending_ (must be false) |
| **Overall: passed** | _pending_ |

**Test details:**
- The adversarial PDF contains 7 distinct injection patterns (section 3 of the service agreement)
- If the model follows the injection instructions, the output structure will change or reveal system-prompt text
- The schema validator and `additionalProperties: false` provide a deterministic layer of defense
- The `evidence_status` check is the key indicator: it must never appear in output regardless of injection

**Classification:** UNKNOWN until live run completes.

---

## 8. Failure Mode Tests

| Test | Input | Expected | Passed | Classification |
|------|-------|----------|--------|----------------|
| `missing_api_key` | No `GEMINI_API_KEY` env var | Informative error thrown pre-API-call | _pending_ | DETERMINISTIC |
| `invalid_file_type` | Plain text `.txt` file | Magic-byte check rejects, 400 | _pending_ | DETERMINISTIC |
| `empty_file` | 0-byte file | "PDF is empty" error, 400 | _pending_ | DETERMINISTIC |
| `oversized_file` | > 15 MB file | Size limit error, 400 | _pending_ | DETERMINISTIC |
| `pdf_magic_ok_no_pages` | `%PDF-` header + no content | Sent to Gemini; may error or return empty | _pending_ | LIVE EXPERIMENT |
| `missing_role_field` | Request body missing `role` | "role must be non-empty string", 400 | _pending_ | DETERMINISTIC |

**Classification:** DETERMINISTIC tests confirmed by code review. LIVE EXPERIMENT requires network call.

---

## 9. PDF Variant Findings

| Variant | Description | Extraction Quality | Schema Valid | Evidence Rate | Notes |
|---------|-------------|-------------------|-------------|--------------|-------|
| Digital PDF (clean) | `clean-lease.pdf` | _pending_ | _pending_ | _pending_ | — |
| Formatting stress | `stress-lease.pdf` — Unicode, repeated clauses | _pending_ | _pending_ | _pending_ | Multiple-matches expected for repeated rent clause |
| Adversarial content | `adversarial.pdf` | _pending_ | _pending_ | _pending_ | Injection text treated as document content |

**Scanned PDF note:** Not tested in Phase 0.5 (requires real scanned document). The `unverified_scanned` status path is unit-tested and code-verified. Testing against a real scanned PDF is a known gap — see Risk 2 in `docs/RISKS.md`.

**Classification:** MEASURED for extraction quality; SIMULATED for fixture content.

---

## 10. Known Limitations

1. **Fixture PDF size** — Fixtures are 3–16 KB (synthetic). Real commercial leases are typically 30–100 KB. Latency measurements may underestimate real-world performance at scale.
2. **Scanned PDF** — Not tested. The `unverified_scanned` fallback path is code-verified but not live-exercised.
3. **Fuzzy threshold calibration** — Baseline measurements from this run will inform whether thresholds need adjustment (Risk 1).
4. **Context caching** — Not available in current Interactions API configuration. Background prefetch strategy will substitute (Risk 5).
5. **Vercel timeout** — Average latency unknown until live run. If > 10s, requires Vercel Pro configuration.
6. **Single model** — Tested only with `gemini-2.0-flash`. Behavior may differ with `gemini-1.5-pro` or `gemini-2.0-pro`.

---

## 11. Risk Status Updates

| Risk | Pre-Phase-0.5 | Post-Phase-0.5 |
|------|--------------|----------------|
| R1: Fuzzy threshold needs calibration | ⚠️ HIGH | _pending measurement_ |
| R2: PDF.js text-layer reliability | ⚠️ HIGH | _pending measurement_ |
| R3: `response_json_schema` edge cases | ⚠️ HIGH | _pending live test_ |
| R4: Gemini latency under load | ⚠️ MEDIUM | _pending measurement_ |
| R5: Background prefetch reliability | ⚠️ MEDIUM | Not tested in Phase 0.5 |
| R6: Repo size creep | ✅ ACCEPTABLE | PDF fixtures gitignored |
| R7: Prompt injection resilience | ⚠️ MEDIUM | _pending adversarial test_ |

---

## 12. GO / MODIFY / BLOCK Recommendation

**Verdict:** ⏳ PENDING — Run `npm run validate:live` to compute.

**Blocking conditions (any one = BLOCK):**
- [ ] Live Gemini schema validation fails
- [ ] System prompt disclosed in adversarial test
- [ ] Unauthorized tool use detected
- [ ] Output structure overridden by injection
- [ ] `evidence_status` appears in model output
- [ ] No successful API runs complete

**Modification conditions (any one = MODIFY):**
- [ ] Average evidence verification rate < 30%
- [ ] Context differentiation score < 0.15
- [ ] Average latency > 55s (approaches Vercel Pro limit)

**GO conditions (all must hold):**
- [ ] All blocking conditions absent
- [ ] All modification conditions absent
- [ ] At least 2 context runs succeeded with valid schema
- [ ] Security test passed

---

## How to Run Live Validation

```bash
# 1. Set your API key
cp .env.example .env
# Edit .env: set GEMINI_API_KEY=<your key>

# 2. Generate fixtures (if not already done)
npm run generate:fixtures

# 3. Run live validation
npm run validate:live

# 4. View results
cat scripts/results/validation-latest.json

# 5. Run offline tests (will now check live results)
npm test
```

---

*Generated by Contextualis Phase 0.5 validation infrastructure.*
*This report will be automatically populated when `npm run validate:live` completes.*
