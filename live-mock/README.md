# Live AI Mock Interview — independent app boundary

This folder is intentionally separate from `ascent/` and `ascent-play/`.

## Boundary
- `ascent-play/` remains the bare free Google Play build.
- The Live AI Mock Interview frontend lives only in `live-mock/`.
- Live Mock backend endpoints use `live-mock-*` Supabase Edge Function names.
- Do not add Razorpay, Live Mock purchase flows, or OpenAI Realtime interview code to `ascent-play/`.
- The independent app uses its own browser session key: `live_mock_student_session`.
- Interview questions come from the dedicated `live_mock_questions` table; they no longer depend on ASCENT assignments or the ASCENT PI task bank.
- Existing learner identity records may be reused for sign-in, but Live Mock interview logic, question selection, payment gateway, evaluation and speech remain separate from the Play build.

## Independent backend endpoints
- `live-mock-commerce`
- `live-mock-paid-gateway`
- `live-mock-openai-session`
- `live-mock-evaluate`
- `live-mock-feedback-audio`

The legacy `ascent/live-mock-*` files are retained only as an unlinked rollback copy until the independent app is verified. They must not be linked from the learner UI or included in the Google Play core.
