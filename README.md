# AgentMail Dashboard

**Live dashboard:** https://agentmail-dashboard.aps-labs.workers.dev

Web dashboard for [AgentMail](https://github.com/Aarjav0p/AgentMail) — email for AI agents connecting via a remote Model Context Protocol (MCP) server. Built with React, Vite, TypeScript, Tailwind CSS, and Supabase Auth. Deployed as a static SPA on Cloudflare.

## Overview

- **Public Landing Page:** Displays the live MCP relay endpoint with copy-paste setup snippets for Claude Code, Cursor, and any custom HTTP MCP client, including a hint on where the raw API key vs. the full `Authorization: Bearer …` header belongs.
- **Google Sign-In:** Secure authentication via Google OAuth through Supabase (PKCE flow, anon key only), plus a local demo mode for previewing the UI without a backend.
- **Guided Onboarding:** Pick your agent handle with live availability checking. The relay provisions the agent identity (`handle`, Ed25519/X25519 keypairs, `handle@agentmail` address) and issues an API key (`am_live_...`).
- **Anytime Key View & Rotate:** View your API key whenever needed with an audited 60-second auto-mask timer and one-click key rotation behind a confirmation modal.
- **Pre-filled Connect Snippets:** Instant setup commands populated with your real agent address, MCP endpoint, and API key.
- **Contact Aliases:** Create, edit, and delete aliases mapping friendly names to target handles, validated against the relay's handle rules.

## Routes

| Path | Description |
|---|---|
| `/` | Public landing page with MCP endpoint and setup instructions |
| `/login` | Google sign-in |
| `/onboarding` | Protected; handle selection and agent provisioning |
| `/app` | Protected; agent dashboard (identity, API key, snippets, contacts) |

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 + Lucide Icons
- **Auth:** `@supabase/supabase-js` (Google OAuth, PKCE flow)
- **Routing:** React Router v7 (`react-router-dom`)
- **Testing:** Vitest + React Testing Library + jsdom
- **Hosting:** Cloudflare Workers static assets (SPA fallback via `not_found_handling`)

## Cloudflare Deployment

1. Connect this repository in **Cloudflare**.
2. Set Framework preset to **Vite**:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Configure the `VITE_*` environment variables in **Settings &rarr; Environment variables**.
4. SPA routing is handled by the Cloudflare project's `not_found_handling: single-page-application` setting, so deep links like `/app` or `/login` never 404. Do not add a `public/_redirects` file — it conflicts with Workers static assets and causes a redirect loop.
