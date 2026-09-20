# Live Validation History & API Quota Reports

## Incident: 2026-09-16
- **Classification**: `QUOTA_EXCEEDED` (HTTP 429)
- **Model**: `gemini-3.8-flash`
- **Quota / Rate-Limit Condition**: 20 requests per minute (RPM) free tier limitation observed.
- **Retry-After Provided**: Yes. The API response included string matches such as `"Please retry in 16.17s"`.
- **Outcome**: The validation run correctly blocked because 0 successful interactions completed. No retries were executed by the architecture, protecting against retry storms.
- **Resolution**: Implemented `validate:smoke` which isolates Context A, Context B, and differentiation, while avoiding unnecessary latency, stress, and security hits. Validation stops on the very first 429 without making subsequent requests.
