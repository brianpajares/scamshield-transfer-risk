# ScamShield Architecture

ScamShield separates model intelligence from operational state.

- The app layer owns UX, orchestration, quota checks and report generation.
- The risk engine is deterministic. The same normalized input with the same model version returns the same score.
- Optional AI extraction can add canonical features from message text, but it cannot change weights, thresholds or the final score directly.
- Google Drive is intended as the source of truth for model artifacts: manifest, feature dictionary, weights, thresholds, patterns, recommendations and localization.
- Supabase is intended for auth, RLS-protected assessments, usage counters, settings, future products and entitlements.

This repository includes a local seed model so the MVP runs without secrets. Production should replace the seed loader with a validated `DriveModelLoader` that supports manifest hashes, schema validation, regression tests, cache TTL and `LAST_KNOWN_GOOD` rollback.
