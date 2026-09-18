# DealSafe AI — Deployment & Launch Guide

Plain-English contract risk checker for freelancers and agencies. Same build pattern
as your other DCC products: plain HTML + Vercel serverless functions, no framework,
no database. Billing runs on PayPal Subscriptions (recurring), not one-time buttons.

## 1. What's in this project
- `index.html` — landing page + contract checker UI + PayPal subscribe button
- `api/analyze.js` — serverless function that sends contract text to the Anthropic API
- `api/verify-subscription.js` — serverless function that checks PayPal subscription status
- `package.json` — tells Vercel this is a Node project

## 2. Set up PayPal Subscriptions (do this first)
1. Log into your PayPal Developer Dashboard: https://developer.paypal.com/dashboard/
2. Under **Apps & Credentials**, create (or reuse) a REST API app to get your
   **Client ID** and **Secret**.
3. Go to **Products** → create a product (e.g. "DealSafe AI Subscription").
4. Under that product, create a **Billing Plan**:
   - Price: $29/mo (or whatever tier you choose)
   - Billing cycle: monthly, infinite
   - Copy the generated **Plan ID** (starts with `P-...`)
5. Keep your Client ID, Secret, and Plan ID — you'll need them below.

## 3. Environment variables (set in Vercel, not in code)
In your Vercel project settings → Environment Variables, add:
| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | your Anthropic API key (use a new one for billing clarity, same as your other products) |
| `PAYPAL_CLIENT_ID` | from step 2 |
| `PAYPAL_CLIENT_SECRET` | from step 2 |
| `PAYPAL_ENV` | `sandbox` while testing, `live` (or leave unset) for production |

## 4. Wire up the frontend
In `index.html`, replace the two placeholders:
- `YOUR_PAYPAL_CLIENT_ID` in the PayPal SDK `<script>` tag → your real PayPal Client ID
- `YOUR_PAYPAL_PLAN_ID` in the JS → your real Plan ID from step 2

These two are safe to hardcode in the frontend (they're public identifiers, not secrets).

## 5. Push to GitHub and deploy
```bash
cd dealsafe-ai
git init
git add .
git commit -m "Initial DealSafe AI build"
git remote add origin https://github.com/digitalconsultantcreations-cmyk/dealsafe-ai.git
git push -u origin main
```
Then in Vercel: **New Project → Import** the `dealsafe-ai` repo → it auto-detects the
`api/` functions → add the env vars from step 3 → Deploy.

## 6. Test before going live
1. Set `PAYPAL_ENV=sandbox` and use PayPal sandbox Client ID/Secret/Plan ID.
2. Paste a sample contract, confirm the free check returns a risk breakdown.
3. Trigger the paywall (use the free check), subscribe with a sandbox PayPal buyer account.
4. Confirm `verify-subscription` returns `active: true` and unlocks unlimited checks.
5. Switch env vars to your live PayPal credentials and redeploy.

## 7. Seven-day launch roadmap
- **Day 1:** Set up PayPal product/plan (sandbox first), get Anthropic API key, deploy to Vercel with sandbox credentials.
- **Day 2:** Full sandbox test of the entire flow (free check → paywall → subscribe → unlocked). Fix any bugs.
- **Day 3:** Switch to live PayPal credentials, do one real subscription test with your own card, then cancel it to confirm the flow works end to end.
- **Day 4:** Add DealSafe AI to your DCC hub site (`digital-consultant-creations.vercel.app`) alongside your other products, same "systems console" design theme.
- **Day 5:** Write 3-5 short pieces of content (LinkedIn/X/Reddit r/freelance, r/agency) showing a real "risky clause" example DealSafe caught — this is your strongest hook.
- **Day 6:** Post in freelancer/agency communities (Indie Hackers, relevant subreddits, freelance Facebook groups) with a link + free-check offer. List on Product Hunt (same as you did with ProvenStack).
- **Day 7:** Monitor first sign-ups, respond to any support questions, note common contract types users paste in (use this to refine the prompt in `api/analyze.js` over the following week).

## Notes
- This app is legal-adjacent, not legal advice — the footer disclaimer in `index.html`
  should stay visible; don't remove it.
- If you want a higher-value tier later, the natural next feature is the **Proposal
  Generator** (the "send safe terms out" half discussed earlier) — same tech pattern,
  new tab in the same app.
