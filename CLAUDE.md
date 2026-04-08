# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this project?

**my-own** — 個人の情報を一元管理する統合Webアプリケーション。Slackの自分宛DMからメモとリンクを自動収集し、タスク・メモ・リンクを相互に紐付けて管理する。現在Phase 1〜2（基盤+Slack同期+閲覧UI）が進行中。

## Commands

```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run db:generate  # Generate Drizzle migration files from schema changes
npm run db:migrate   # Apply migrations to Neon database
npm run db:studio    # Open Drizzle Studio (DB browser)
```

## Architecture

- **Next.js 15 (App Router)** with React 19, TypeScript, Tailwind CSS v4
- **Neon Serverless Postgres** via `@neondatabase/serverless` + Drizzle ORM
- **Auth**: NextAuth.js with GitHub OAuth (not yet fully wired)
- **Hosting**: Vercel (Cron for periodic Slack sync)

### Key directories

- `db/schema.ts` — Single source of truth for all Drizzle table definitions (projects, notes, links, syncStates, noteLinks)
- `lib/db.ts` — Drizzle client instance (neon-http driver)
- `lib/slack.ts` — Slack API wrapper (auth, DM listing, message fetching with pagination)
- `lib/slack-sync.ts` — Core sync logic: fetches self-DM messages, classifies as Note or Link by URL presence, upserts to DB with dedup via `slack_ts`
- `app/api/dev/slack/` — Dev API routes for sync and self-DM testing
- `app/notes/`, `app/links/` — List pages (server components reading directly from DB)

### Data flow

Slack self-DM → `lib/slack.ts` (fetch) → `lib/slack-sync.ts` (classify & insert) → Neon DB. Cursor management via `sync_states` table (`slack_last_ts` key). Backfill supported via `backfillDays` option.

### Authorization model

Pre-auth phase: `APP_USER_ID` env var used as `user_id` for all rows. All tables have `user_id` column for future per-user filtering.

## Environment

Copy `.env.example` to `.env.local`. Required vars: `DATABASE_URL`, `SLACK_USER_TOKEN` (or `SLACK_BOT_TOKEN`), `APP_USER_ID`. See `.env.example` for full list.

## Spec

Full requirements in `docs/OVERVIEW.md`. Includes entity definitions, Slack sync rules, and phased development plan (Phase 1–5).
