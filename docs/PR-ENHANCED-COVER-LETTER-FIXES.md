Title: Phase 1 QA Fixes — Credit Handling, Prompt Limits, Rotation, Threshold

Summary
- Prevent double credit consumption by centralizing the credit check in `GeminiService` and skipping in generators.
- Increase AI payload limits to avoid truncating few-shot examples/JSON instruction.
- Enable retry example rotation across attempts for more diversity.
- Align quality acceptance threshold with README (0.75).

Changes
- src/services/geminiService.ts
  - Perform a single `checkAndConsumeLimit('generate_cover_letter')` before generation.
  - Call `enhancedCoverLetterService.generateCoverLetter(contactInfo, { skipCreditCheck: true })`.
  - On fallback, also pass `{ skipCreditCheck: true }`.

- src/services/ai/enhancedCoverLetterService.ts
  - Add optional `options?: { skipCreditCheck?: boolean }` to `generateCoverLetter`.
  - Respect `skipCreditCheck` to avoid duplicate credit checks.
  - Replace example selection logic with deterministic rotation over a larger pool (top 9) across attempts.

- src/services/ai/coverLetterService.ts
  - Add optional `options?: { skipCreditCheck?: boolean }` to `generateCoverLetter`.
  - Respect `skipCreditCheck` to avoid duplicate credit checks.

- src/services/ai/aiProxyClient.ts
  - Raise char caps from 4k to 16k for both history parts and current message.

- src/services/ai/coverLetterQuality.ts
  - Set `QUALITY_THRESHOLDS.overall` to `0.75` to match README.

Notes & Rationale
- Credit handling: Previously both enhanced and fallback services consumed credits, potentially double-charging on fallback. Orchestration-level check ensures exactly one charge per user request.
- Prompt limits: 4k char trim could cut off examples and the JSON instruction; 16k provides headroom while still guarding payload size.
- Rotation: Fetching a pool of up to 9 matches and slicing per attempt ensures different combinations are tried without additional complexity.
- Threshold: README documented 75%; code now matches docs to avoid confusion.

Backward Compatibility
- Existing call sites that don’t pass `skipCreditCheck` keep current behavior (they will still consume credits once).
- Public method signatures are backward-compatible (new optional param only).

Testing
- Manual sanity: searched for all call sites of `generateCoverLetter(` to ensure updated usage in orchestrator and fallback.
- Verified selector rotation logic for attempts 1..3 across larger pool.
- Confirmed analytics events unchanged and still triggered.

Follow-ups (Optional)
- Harden `api/ai/proxy.ts` to validate server-side user identity instead of trusting `x-user-id` header.
- Emit quality metrics to analytics for observability.
- Wire tone preference from UI into example selection.

