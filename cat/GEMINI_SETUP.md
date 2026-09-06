# Gemini runtime setup for clarion-cat

Runtime environment variables required by the CAT Worker:

- `GEMINI_MODEL` — plain text variable containing the exact Gemini model identifier used by Clarion.
- `GEMINI_API_KEY` — secret containing the Gemini API key. Never commit this value to GitHub.

The Worker falls back to its curated local bank when either variable is missing or Gemini generation fails validation.
