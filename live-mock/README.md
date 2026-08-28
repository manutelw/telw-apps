# Live AI Mock Interview — independent app boundary

This folder is intentionally separate from `ascent/` and `ascent-play/`.

## Boundary
- `ascent-play/` remains the bare free Google Play build.
- The Live AI Mock Interview frontend lives only in `live-mock/`.
- New Live Mock backend endpoints use `live-mock-*` Supabase Edge Function names.
- Do not add Razorpay, Live Mock purchase flows, or OpenAI Realtime interview code to `ascent-play/`.
- Existing ASCENT learner identity and Live Mock entitlement tables are reused for now; this is a data dependency only, not a frontend/release dependency.

## Independent backend endpoints
- `live-mock-commerce`
- `live-mock-paid-gateway`
- `live-mock-openai-session`
- `live-mock-evaluate`
- `live-mock-feedback-audio`

The legacy `ascent/live-mock-*` pages and `ascent-*live*` Edge Functions are left untouched during the split so the current ASCENT web deployment is not broken while the independent app is verified.
