# Contextualis — Technical Risks Register

*Updated: 2026-09-15 | Status: Post-Technical-Spike*

---

## Risk 1: Fuzzy-Match Threshold Requires Empirical Tuning ⚠️ HIGH

**Description:** The Tier-4 fuzzy similarity threshold (`fuzzyMinSimilarity = 0.85`) and margin (`fuzzyMinMargin = 0.10`) were chosen conservatively but not yet validated against real-world contract PDFs.

**Why it matters:** A threshold too loose → false "verified_approximate" labels on wrong quotes. A threshold too strict → more honest "unverified" labels (safer failure direction but still suboptimal).

**Current mitigation:** All thresholds are in `DEFAULT_MATCHER_CONFIG` in `evidenceMatcher.ts` — they are configurable without code changes.

**Required action before production:** Test against 10–15 real commercial leases, employment contracts, and NDAs. Log similarity scores for each match. Adjust thresholds based on empirical data.

**Owner:** TBD | **Target:** Before full product build

---

## Risk 2: PDF.js Text-Layer Reliability ⚠️ HIGH

**Description:** Some PDFs (Word exports, scanned-then-OCR'd, certain print-to-PDF workflows) have unusual text-layer structures that may confuse the normalization pipeline. Line-break artifacts and word-split patterns vary widely.

**Why it matters:** If text extraction differs from Gemini's visual reading, exact quotes won't be found in the text layer even when they visually exist in the document.

**Current mitigation:** Tiered matching handles most normalization artifacts; scanned-page detection provides honest "unverified_scanned" fallback; Tier-3 flexible-whitespace regex handles most line-wrap artifacts.

**Required action:** Test extraction against real-world PDFs of each type before committing to the highlight UI. Add additional normalization rules as needed.

**Owner:** TBD | **Target:** Before full product build

---

## Risk 3: `response_json_schema` Edge Cases in Gemini API ⚠️ HIGH

**Description:** The behavior of `response_json_schema` with nested arrays of objects with optional fields (our schema) has not been validated against the live Gemini API.

**Why it matters:** Unexpected behavior (e.g., model refusing optional null fields, or array items getting wrong shapes) would break schema validation and trigger the repair loop.

**Current mitigation:** Ajv validation + one repair retry + hard error fallback. Mock mode allows development without API dependency.

**Required action:** Validate the actual API behavior with the live `GEMINI_API_KEY` as early as possible. Check that optional fields (`page_hint`, `exact_quote` on `key_facts`) work as expected.

**Owner:** TBD | **Target:** Day 1 of full product build

---

## Risk 4: Gemini Latency Under Production Load ⚠️ MEDIUM

**Description:** Actual Gemini latency for a full lease-length PDF (30–60 pages) under the Interactions API is unknown. If latency > 20 seconds, the staged-loading-state UI needs different design investment.

**Why it matters:** The live demo has a 3-minute target. A 25-second analysis phase requires careful UX management to not feel broken.

**Current mitigation:** Staged loading states ("Reading document" → "Prioritizing for context" → "Verifying evidence") mask latency perception. The background context-prefetch substitutes for server-side caching.

**Required action:** Run at least 5 test analyses with a real 30-page contract PDF and measure latency distribution. Adjust UX copy and loading animation if P95 > 20s.

**Owner:** TBD | **Target:** Day 1 with live credentials

---

## Risk 5: Background Context-Prefetch Reliability ⚠️ MEDIUM

**Description:** The "instant context switch" demo moment depends on the background prefetch completing before a judge would plausibly switch context (~60 seconds after first analysis).

**Why it matters:** If the prefetch is still in-flight when the judge clicks "switch context", the demo loses its most impressive moment.

**Current mitigation:** Not yet implemented (will be added in full product build). A visible "switching context..." loading state is the honest fallback.

**Required action:** Implement and test the prefetch under realistic network conditions. Ensure the fallback loading state is polished enough to stand alone.

**Owner:** TBD | **Target:** During full product build

---

## Risk 6: Repository Size Creep ⚠️ MEDIUM

**Description:** The 10 MB repo size limit is hard — a single large demo PDF or committed build artifact exceeds it.

**Current mitigation:** `.gitignore` excludes `dist/`, `coverage/`, `tests/fixtures/*.pdf`, and `graphify-out/`. PDF.js worker is self-hosted from the npm package, not committed.

**Required action:** Run `git ls-files | xargs ls -la | sort -k5 -nr | head -20` before each submission to verify no large files are committed.

**Owner:** All | **Target:** Before each submission attempt

---

## Risk 7: Prompt Injection via Document Content ⚠️ MEDIUM (mitigated)

**Description:** A maliciously crafted PDF could contain text that attempts to override the system prompt or exfiltrate the schema.

**Current mitigation (layers):**
1. Document content is always in the `inlineData` part, never concatenated into the system instruction
2. `response_json_schema` constrains output structure regardless of "instruction" content in the PDF
3. Post-validation injection artifact scan before returning to client
4. Schema `additionalProperties: false` prevents injected fields passing through
5. No `dangerouslySetInnerHTML` — injected content in string fields is escaped by React

**Required action:** Run prompt-injection fixture tests (`npm test tests/promptInjection.test.ts`) before each submission. Consider adding more synthetic adversarial PDFs to the fixture set.

**Owner:** All | **Target:** Before each submission attempt

---

## Resolved Risks

| Risk | Resolution |
|---|---|
| evidence_status generated by model | Resolved in §0: computed by matcher, never in schema |
| Cross-referencing evidence array | Resolved in §0: exact_quote + page_hint inline on each item |
| Context caching dependency | Resolved in §0: background prefetch strategy replaces assumed caching |
