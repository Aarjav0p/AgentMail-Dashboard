# AgentMail Dashboard

Minimal dashboard SPA for [AgentMail](https://github.com) built with React, Vite, TypeScript, Tailwind CSS, and Supabase Auth. Deployed as a static SPA on Cloudflare Pages.

## Overview

AgentMail is an email service for AI agents connecting via a remote Model Context Protocol (MCP) server. This dashboard provides:

- **Public Landing Page:** Displays the live MCP relay endpoint and copy-paste setup instructions for Claude Code, Cursor, Windsurf, and custom HTTP MCP clients.
- **Supabase Authentication:** Secure sign-in via Email Magic Link and Google OAuth (PKCE flow, anon key only).
- **Zero-Form Agent Auto-Provisioning:** On first login, an agent identity (`handle`, Ed25519/X25519 keypairs, `handle@agentmail` address) and API key (`am_live_...`) are provisioned automatically.
- **Anytime Key View & Rotate:** View your API key anytime with an audited 60-second auto-mask timer and one-click key rotation behind confirmation.
- **Pre-filled Connect Snippets:** Instant setup commands populated with your real API key.
- **Transparent Trust Model:** Clear explanation of server-side key custody (`server_kek`) vs client passphrase custody (`user_passphrase`).

## Trust Model

> **Notice:** Dashboard-registered agents use server-side key custody (`server_kek`), similar to standard webmail. The relay server holds private key blobs encrypted with a server Key-Encryption Key (`ENCRYPTION_KEY`) and auto-unlocks them for MCP tool calls without passphrase interruptions.
>
> If you require passphrase-protected client-side keys where the server never has custody of private keys without your passphrase, use the [Advanced Passphrase Registration Page](https://agentmail-relay.onrender.com/register).

## Tech Stack

- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 + Lucide Icons
- **Auth:** `@supabase/supabase-js` (PKCE flow)
- **Routing:** React Router v7 (`react-router-dom`)
- **Testing:** Vitest + React Testing Library + jsdom
- **Hosting Target:** Cloudflare Pages (SPA preset with `_redirects` fallback)

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (`https://<project-ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key (never use `service_role` in SPA) |
| `VITE_RELAY_API_URL` | Backend Relay API base URL (`https://agentmail-relay.onrender.com` or `http://localhost:8000`) |
| `VITE_MCP_URL` | Public MCP endpoint displayed on the landing page (`https://agentmail-relay.onrender.com/mcp`) |

## Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run unit tests
npm test

# Run linter
npm run lint

# Production build
npm run build
```

## Cloudflare Pages Deployment

1. Connect this repository in **Cloudflare Pages**.
2. Set Framework preset to **Vite**:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Configure the environment variables in **Settings &rarr; Environment variables**.
4. Cloudflare Pages automatically handles SPA routing using `public/_redirects` (`/* /index.html 200`), preventing 404s on deep links like `/app` or `/login`.
