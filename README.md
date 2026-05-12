# Kuroscan

**Kuroscan** is a Telegram-first operator for **Solana devnet** that provisions sponsored-style **system accounts**, tracks them in **Supabase**, surfaces **Kora** fee-payer config, and **reclaims only lamports above the rent-exempt minimum** so accounts are not accidentally bricked.

Badges: ![demo](https://img.shields.io/badge/demo-devnet-blue) ![grammy](https://img.shields.io/badge/bot-grammy-blue) ![solana](https://img.shields.io/badge/chain-Solana-%238C0EEB) ![telegram](https://img.shields.io/badge/platform-Telegram-%2385DAF4)

## Why this exists

- **Telegram UX**: no browser dashboard — fast, low-friction commands for builders.
- **Rent-aware reclaim**: sweeps **excess** SOL back to your sponsor pubkey; keeps enough lamports for rent exemption (see `src/services/getReclaimables.ts`).
- **Kora visibility**: HTTP routes expose live `fee_payers` from your Kora node (`/` and `/api/v1/config`).
- **Automation (optional)**: background scheduler can batch-reclaim when total reclaimable SOL crosses a threshold (`src/cron/autoReclaim.ts`).

## Architecture (high level)

```text
Telegram (Grammy) ──► Express (health + Kora proxy)
        │
        ├──► Solana devnet RPC (@solana/web3.js Connection + @solana/kit RPC)
        ├──► Kora client (@solana/kora) — sponsor / fee payer discovery
        └──► Supabase — `sponsored_accounts` (pubkey, bs58 secret, status, sponsor_pubkey)
```

## Prerequisites

- **Node.js** 22+
- **Telegram** bot token from [@BotFather](https://t.me/botfather)
- **Supabase** project with a `sponsored_accounts` table compatible with the inserts in `src/utils/db.ts` (at minimum: `public_key`, `secret_key`, `status`, `sponsor_pubkey` recommended)
- **Solana devnet** RPC URL (Helius or public devnet)
- **Kora** RPC URL and operator key material as required by your deployment

## Environment variables

Copy `.env.example` to `.env` and fill in values (no spaces around `=`).

| Variable | Required | Purpose |
|----------|----------|---------|
| `BOT_TOKEN` | yes | Telegram bot token |
| `KORA_RPC_URL` | yes | Kora node HTTP RPC for `getConfig()` |
| `KORA_PRIVATE_KEY` | yes | JSON array byte secret for the operator keypair used to create system accounts |
| `KORA_SPONSOR_PUBLIC_KEY` | yes | Destination pubkey for reclaims; stored per row in Supabase |
| `SOLANA_DEVNET_RPC` or `HELIUS_DEVNET_RPC` | one of | Devnet HTTP RPC for reads and txs |
| `NODE_PUBLIC_SUPABASE_URL` | yes | Supabase URL |
| `NODE_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | yes | Supabase anon key (server-side only in this repo — treat as secret in production) |
| `PORT` | no | HTTP port (default `4070`) |
| `ADMIN_IDS` | no | Comma-separated Telegram user IDs for auto-reclaim DMs |
| `ENABLE_AUTO_RECLAIM` | no | Set to `true` to start the periodic auto-reclaim worker |
| `SOLANA_MAINNET_RPC` | no | Reserved; not required for the current devnet bot |

## Quick start

```shell
git clone https://github.com/Mofe-Bankole/kuroscan
cd kuroscan
npm install
cp .env.example .env
# edit .env — see table above
npm start
```

`npm start` runs **`prestart` → `tsc` → `node dist/server.js`**, so the project is compiled before launch.

For a one-shot dev run:

```shell
npm run dev
```

## HTTP API (for demos / monitoring)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Liveness + `fee_payers` from Kora (503 if Kora unreachable) |
| GET | `/api/v1/config` | Full Kora `getConfig()` payload |

## Telegram commands

| Command | Args | Description |
|---------|------|-------------|
| `/start` | — | Short intro |
| `/help` | — | Command list |
| `/about` | — | Hackathon-oriented product blurb |
| `/stats` | — | Supabase row counts by `status` + Kora fee payers |
| `/list` | — | Up to 25 tracked `public_key` rows (no private keys) |
| `/verify` | `<pubkey>` | Rent-aware reclaim pre-check |
| `/fetch` | `<pubkey>` | Balance + owner + Solscan link |
| `/create` | `[n]` | Same as `/zombie` (README compatibility) |
| `/zombie` | `[n]` | Create 1 or `n` (1–10) devnet system accounts |
| `/reclaim` | — | Sweep reclaimable excess from all DB-tracked accounts |

**Natural language** (case-sensitive phrases):

- `Create a Zombie Account` — creates one account (same pipeline as `/zombie`).
- `Reclaim all owed rent` — same as `/reclaim`.

## Security notes (read before mainnet)

- This codebase stores **raw private keys in Supabase** for reclaim signing — acceptable for **hackathon / devnet** demos; **do not** reuse that pattern on mainnet without HSM/KMS, encryption, and strict access control.
- Keep `.env` out of git; rotate any token that was ever committed.

## Suggested demo script (judges)

1. Call `GET /` and show `fee_payers` from Kora.
2. In Telegram: `/verify <some_devnet_system_pubkey>` and explain rent-aware output.
3. `/zombie` then `/list` — show the new pubkey tracked in Supabase.
4. `/reclaim` — show signatures and “skipped” rows when nothing is reclaimable.

## Licence

ISC (see `package.json`).
