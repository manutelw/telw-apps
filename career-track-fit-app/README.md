# Career Track Fit — Placement Readiness Diagnostic

Standalone static web app for second-year students entering placement season.

## Purpose
Students choose the career track they are targeting, complete a common core diagnostic, then complete a track-family module. The app returns a weighted readiness score, capability profile, strengths, development gaps, and a training prescription.

## Assessment design
The common core measures eight transferable capabilities:
- verbal reasoning
- numerical reasoning
- data interpretation
- structured problem solving
- critical thinking
- judgement and prioritisation
- communication clarity
- learning agility / adaptability

The current data file maps the combined career-track rows in the supplied FIIB workbook into 20 student-facing track choices. Track modules are grouped into six role families and each track applies its own capability weights.

## Important limitation
This is a pilot developmental diagnostic, not a validated psychometric or aptitude instrument, and it must not be used as the sole basis for excluding a student from a career track or placement opportunity.

## Run
Open `index.html` in any modern browser. No build step, backend, external API, Ascent dependency, Supabase project, or third-party service is required.

## Files
- `index.html` — shell
- `styles.css` — interface
- `data.js` — 20 tracks, common-core questions, family modules, training prescriptions
- `app.js` — test flow, scoring, results
