# TELW IELTS private admin on manuvikraman.com

The homepage footer's five-click Manu Vikraman entry now opens `/ielts/admin/` on manuvikraman.com. Trainer email verification, the Reading dashboard, confidential collection upload and sign-out all stay on that domain. ClarionPrep's admin is unchanged.

The same-domain portal uses a dedicated `__Secure-telw_ielts_admin` cookie and the new `IELTS_ADMIN_SERVICE` binding to the existing isolated IELTS preview Worker. Only that admin cookie is translated for the upstream service. ClarionPrep and learner cookies are not forwarded. The upstream IELTS service still verifies the trainer identity and owns the existing D1 data. No credentials or private banks are committed here.

The service binding is additive in wrangler.jsonc. Other bindings, variables and compatibility options are unchanged. This does not promote the IELTS preview data or learner diagnostic to production. Independent question review and the complete production rollout remain pending.

Validation: 11 standalone portal tests cover domain/route isolation, same-origin writes, trainer-only code requests, bounded bodies, cookie isolation, same-domain dashboard/import links, locked redirects, logout and unavailable-service handling. A private local integration run exercised the actual IELTS auth and D1-shaped storage: trainer verification, all ten real sets (8 new + 2 retained), 400 questions in the dashboard, and session revocation. Live Cloudflare verification is required after the approved deployment.
