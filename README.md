# Marvelous Production OS

Fresh Start Mode for Marvelous Videos production tracking.

From the new workflow onward, Marvelous Production OS is the source of truth for newly approved titles from brainstorming meetings. The old Google Sheets are archive/reference only.

## Current Direction

- New approved titles should be added directly into Marvelous Production OS.
- Old Google Sheets should not be edited by this app.
- Old Google Sheets should not receive app edits.
- Google Sheets write-back is disabled by default with `GOOGLE_SHEETS_WRITEBACK_MODE=disabled`.
- The old import tool is optional and read-only from the Google Sheets side.

## Core Fresh Start Workflow

1. Add approved titles after brainstorming.
2. Assign each title to a supervisor.
3. Supervisor adds help doc and writer.
4. Writer submits script.
5. Deepak updates word count, VO, editor, proofreader, clip finder, and production status.
6. Track everything from the dashboard.

## Built Features

- MVP 3 team rollout:
  - User management at `/admin/users`
  - Team directory at `/team`
  - Role dashboards under `/dashboard/*`
  - Daily command center at `/command-center`
  - Blocked, due today, overdue, and activity feeds
  - Copyable report hub at `/reports`
  - CSV exports at `/admin/export`
- Google login through Supabase Auth
- Supabase PostgreSQL schema
- Fresh title creation at `/titles/new`
- Brainstorming batch entry at `/brainstorming`
- Preview before creating batch titles
- Dashboard sections:
  - Approved Today
  - Approved This Week
  - Not Assigned Yet
  - Missing Help Docs
  - Missing Writers
  - Urgent Titles
- Main title table with supervisor/channel filters
- Title detail page with update form
- Supervisor quick actions:
  - Claim title
  - Assign writer through the form
  - Add help doc
  - Set due date
  - Mark help doc ready
  - Mark script in progress
  - Mark script submitted
- Deepak operations fields:
  - Word count
  - VO artist
  - Clip finder
  - Editor
  - Proofreader
  - Production status
- Activity timeline through `activity_log`
- Daily WhatsApp-copyable report
- Optional old sheet archive import at `/admin/import-old-sheets`
- Onboarding page at `/onboarding`

## Not Built Yet

- Chrome extension
- Gmail integration
- WhatsApp automation
- Advanced role-specific login screens
- Automatic Google Sheets write-back

## Tech Stack

- Next.js App Router
- React
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Google OAuth
- Google Sheets API for optional archive import only
- Google Drive API readonly scope for future document/link expansion

## Local Setup

Install dependencies:

```bash
npm install
```

Create environment variables:

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEETS_WRITEBACK_MODE=disabled
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For quick local testing, Supabase variables can be left blank. The app will use `.data/fresh-start-store.json` as a local development store so title creation works immediately. Use Supabase for real team/production usage.

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor.
3. Run these migrations in order:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_mvp2_workflow_fields.sql
supabase/migrations/003_fresh_start_mode.sql
```

4. In Authentication > Providers, enable Google.
5. Add the Google OAuth Client ID and Client Secret.
6. In Supabase Auth URL Configuration, set the local redirect URL:

```text
http://localhost:3000/auth/callback
```

For production:

```text
https://your-domain.com/auth/callback
```

In Google Cloud OAuth settings, the authorized redirect URI should be the Supabase callback URL:

```text
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

## Optional Old Sheet Archive Import

The old sheets are no longer the active source of truth. They can still be imported for reference at:

```text
/admin/import-old-sheets
```

This tool reads:

Title Bank:

```text
Spreadsheet ID: 1V8QJxGK4C9PdCf4FACx0dJyHqn-ZrhCvGrehOJH_5CE
Tab: MV Titles 2025
```

Main Production:

```text
Spreadsheet ID: 1AImX41moogoEbKkX3qNxPVPzvsMZlQgowBMq1cuVmK8
Tabs: MV N, LL, Gamers, Anime, Long Reads
```

Share both Google Sheets with the service account as Viewer for archive import.

Do not give Editor access unless a future version deliberately re-enables write-back.

## Write-Back Policy

Write-back is disabled by default:

```bash
GOOGLE_SHEETS_WRITEBACK_MODE=disabled
```

The UI does not expose a write-back control. The API also rejects write-back while this value is disabled.

## Routes

- `/` dashboard
- `/command-center` Ahtesham morning command screen
- `/onboarding` fresh-start workflow
- `/brainstorming` batch approved title entry
- `/titles/new` create one approved title
- `/titles` all titles table
- `/titles/[id]` title detail and update form
- `/titles/rotting` delayed/stuck titles
- `/supervisors` supervisor overview
- `/supervisors/[name]` supervisor dashboard
- `/operations` Deepak operations queue
- `/blocked` blocked titles
- `/due-today` due today
- `/overdue` overdue titles
- `/activity` app-wide activity feed
- `/team` team directory
- `/admin/users` create and manage users
- `/dashboard/admin` admin dashboard
- `/dashboard/supervisor` supervisor dashboard
- `/dashboard/operations` operations supervisor dashboard
- `/dashboard/writer` writer dashboard
- `/dashboard/editor` editor dashboard
- `/dashboard/proofreader` proofreader dashboard
- `/dashboard/vo` VO manager dashboard
- `/dashboard/viewer` viewer dashboard
- `/reports` report hub
- `/reports/daily` copyable daily report
- `/admin/export` CSV data exports
- `/admin/import-old-sheets` optional archive import

## Creating Users And Roles

Open `/admin/users`.

Seeded users are created automatically if missing:

- Ahtesham, Admin
- Kamran, Supervisor
- Farhan, Supervisor
- Raktim, Supervisor
- Deepak, Operations Supervisor

Supported roles:

- Admin
- Supervisor
- Operations Supervisor
- Writer
- Editor
- Proofreader
- VO Manager
- Viewer

## Daily Team Usage

Supervisors:

1. Open `/dashboard/supervisor` or `/supervisors/[name]`.
2. Review missing writer, missing help doc, due today, overdue, and blocked queues.
3. Open a title detail page.
4. Claim title, assign writer, add help doc, set due date, and move status forward.

Deepak:

1. Open `/operations`.
2. Use quick inline updates for word count, VO, editor, proofreader, and production status.
3. Mark completed only after validation requirements are met.

Ahtesham:

1. Open `/command-center` each morning.
2. Filter by channel, supervisor, priority, status, or age bucket.
3. Review supervisor bottlenecks, missing writers, missing help docs, blocked titles, overdue titles, and Deepak pending work.

Brainstorming:

1. Open `/brainstorming`.
2. Paste one title per line, or use `Title | Channel | Supervisor | Priority | Writer`.
3. Preview the rows.
4. Click `Create Approved Titles`.

Exports:

Open `/admin/export` and download Titles, Production, Activity, or Users CSV.

## Verification

```bash
npm run build
```

## MVP 3.5 Production Deployment

App modes:

```bash
NEXT_PUBLIC_APP_MODE=demo
NEXT_PUBLIC_APP_MODE=local
NEXT_PUBLIC_APP_MODE=production
```

- `demo`: local mock/demo storage for trying the app without Supabase.
- `local`: local development connected to Supabase.
- `production`: hosted team app connected to Supabase. Local/demo writes are disabled.

Production keeps old Google Sheets archive-only:

```bash
GOOGLE_SHEETS_WRITEBACK_MODE=disabled
```

## Required Environment Variables

For production:

```bash
NEXT_PUBLIC_APP_MODE=production
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GOOGLE_SHEETS_WRITEBACK_MODE=disabled
```

Optional:

```bash
CRON_SECRET=your-random-cron-secret
```

Optional, only for old archive import:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

## Exact Supabase Setup Steps

1. Create a new Supabase project.
2. Open SQL Editor.
3. Run migrations in order:
   - `001_initial_schema.sql`
   - `002_mvp2_workflow_fields.sql`
   - `003_fresh_start_mode.sql`
   - `004_mvp3_team_rollout.sql`
   - `005_brainstorming_module.sql`
   - `006_brainstorming_approval_controls.sql`
4. Go to Authentication > Providers.
5. Enable Google provider.
6. Add Google OAuth Client ID and Client Secret.
7. Enable email magic links if you want email login.
8. Go to Authentication > URL Configuration.
9. Add your production site URL:

```text
https://your-vercel-app.vercel.app
```

10. Add redirect URL:

```text
https://your-vercel-app.vercel.app/auth/callback
```

11. Open `/admin/users` after login as Admin.
12. Add real emails for Ahtesham, Kamran, Farhan, Raktim, and Deepak.

Important: users are matched by email against the `users` table. If a logged-in email is not active in `users`, the app shows:

```text
Your account is not approved. Ask Admin to add your email.
```

## Exact Vercel Deployment Steps

1. Push this project to GitHub.
2. Go to Vercel.
3. Create a new project from the GitHub repo.
4. Set framework preset to Next.js.
5. Add production environment variables:
   - `NEXT_PUBLIC_APP_MODE=production`
   - `NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_SHEETS_WRITEBACK_MODE=disabled`
   - `CRON_SECRET` optional, for protecting the daily brainstorming cron endpoint
6. Deploy.
7. Copy the Vercel production URL.
8. Add it to Supabase Auth redirect URLs.
9. Visit `/admin/launch-checklist`.
10. Fix any item marked `Needs Fix`.
11. Test login as Ahtesham.
12. Test login as Kamran/Farhan/Raktim.
13. Share the production URL with the team.

## Automatic Daily Brainstorming Sessions

Vercel runs `/api/cron/brainstorming-session` at `00:00 Asia/Kolkata`, Monday through Saturday. The cron schedule is stored in `vercel.json` as `30 18 * * 0-5`, which is midnight India time after UTC conversion.

The job is safe to run more than once. If a non-archived session already exists for that India date, it returns the existing session instead of creating a duplicate. Sundays are skipped.

Default auto-created sessions use:

- Name: `Brainstorming YYYY-MM-DD`
- Channels: `MV N`, `LL`, `Gamers`, `Anime`, `Long Reads`
- Participants: `Ahtesham`, `Kamran`, `Farhan`, `Raktim`
- Status: `Draft`

Admins can rename a session from Live Review Mode using the `Save Name` control at the top of the session.

## Live Review And Production Workflow Updates

- The Main Title Table supports date filters for today, yesterday, current week, last week, and custom date ranges. These filters work with supervisor, channel, status, priority, and search filters, and the selected filters persist when opening a title and returning.
- Main Title Table date filters now use `Asia/Kolkata`, so age-zero titles created or approved today appear under `Today`.
- Main Title Table rows show expected word count, actual word count, priority, due date, VO, editor, and proofreader. Priority sorting orders `Ultra Urgent`, `Urgent`, `Normal`, then `Low`.
- Live Review Mode supports expected word count, due date, urgency, editable title text, supervisor filtering, and Ahtesham's directives.
- Clicking `Approve` in Live Review Mode saves the visible review fields first, creates the production title immediately, prevents duplicate conversion if the title already has a production record, and creates an in-app supervisor notification.
- Titles put on `Hold` can have a hold-until date. Future-held titles stay out of the active review list until that date, then return with a `Resurfaced From Hold` highlight.
- Production title detail pages show expected word count separately from Deepak's actual word count, show Ahtesham's directives in a dedicated editable section, and allow priority/urgency edits.
- Supervisor approval notifications are visible from `/notifications` and the sidebar/header notification badge. WhatsApp and email notifications remain disabled.

## Production Launch Checklist Page

Open:

```text
/admin/launch-checklist
```

It checks:

- Supabase connected
- Auth configured
- Users seeded
- Demo mode disabled
- Google Sheets write-back disabled
- Production URL configured
- Required env vars present/missing

## Manual Production Test Checklist

1. Log in as Admin.
2. Open `/admin/users`.
3. Add Kamran, Farhan, Raktim, and Deepak with real emails.
4. Log out.
5. Log in as a supervisor.
6. Confirm supervisor can use daily queue.
7. Create a title from `/brainstorming`.
8. Assign supervisor and writer.
9. Update title detail fields.
10. Refresh from another browser/device and confirm latest data appears.
11. Open `/operations` and update Deepak fields.
12. Confirm `/admin/export` downloads CSVs.
13. Confirm `/admin/import-old-sheets` remains archive-only.
14. Confirm write-back endpoint stays disabled.

## Brainstorming Module

The brainstorming workflow is now separate from the production workflow until Ahtesham approves and converts a title.

Routes:

- `/brainstorming` - brainstorming hub and quick metrics.
- `/brainstorming/sessions` - all brainstorming sessions.
- `/brainstorming/sessions/new` - create a meeting session.
- `/brainstorming/submit` - supervisors submit one title idea with pitch, references, and suggested writer.
- `/brainstorming/import` - manually paste numbered WhatsApp lists and preview/edit before saving.
- `/brainstorming/live/[sessionId]` - meeting-friendly review board grouped by supervisor.
- `/brainstorming/approved` - approved and converted ideas.
- `/brainstorming/rejected` - rejected and duplicate ideas with reasons.
- `/brainstorming/rework` - hold, needs better angle, and needs research ideas.
- `/brainstorming/title-bank` - all brainstorming ideas across sessions.

Decision statuses:

- Proposed
- Approved
- Rejected
- Hold
- Needs Better Angle
- Needs Research
- Duplicate
- Converted To Production

Admin workflow:

1. Create a session from `/brainstorming/sessions/new`.
2. Ask supervisors to submit titles or paste WhatsApp lists into `/brainstorming/import`.
3. Open `/brainstorming/live/[sessionId]` during the meeting.
4. Set due date, urgency, expected word count, and Ahtesham's directives as needed.
5. Approve, reject, hold, or mark titles as needing better angle/research.
6. Approved ideas automatically become normal titles in the existing production dashboard.

Supervisor workflow:

1. Open `/brainstorming/submit`.
2. Add title, channel, priority, short pitch, why the title is good, references, and suggested writer.
3. Add discussion notes during the meeting if needed.
4. Rework titles shown under `/brainstorming/rework`.

Data safety:

- Old Google Sheets remain archive/reference only.
- No Google Sheets write-back is added.
- Approved brainstorming titles are copied into the existing `titles` table only when Admin explicitly converts them.
- Converted titles store `source = Brainstorming`, `source_session_id`, and `source_brainstorming_title_id`.

New migration:

```text
supabase/migrations/005_brainstorming_module.sql
supabase/migrations/008_in_app_notifications.sql
```

Run these migrations before using the new brainstorming and notification routes in production.

## Proofreading System

Proofreaders now have a dedicated workflow for reviewing scripts, giving feedback, blocking bad scripts, and chatting with the assigned supervisor inside the title detail page.

Routes:

- `/dashboard/proofreader` - proofreader queue for assigned review work.
- `/titles/[id]` - includes the Proofreading Review panel, chat, image upload, block/fix/recheck actions.
- `/api/proofreading/[titleId]` - internal API for proofreading chat and status actions.

Proofreader users:

- Rubai
- Ashmita
- Mehek
- Mansi

Proofreading statuses:

- Not Assigned
- Not Started
- In Review
- Feedback Given
- Changes Requested
- Blocked By Proofreader
- Fixed By Supervisor
- Ready For Recheck
- Approved By Proofreader

Production safety:

- Proofreaders can use proofreading feedback tools only.
- Proofreaders cannot delete titles.
- Proofreaders cannot edit production fields like supervisor, channel, priority, writer, VO, or editor.
- A title blocked by a proofreader cannot be marked Completed until the proofreading block is resolved.
- Blocking a script creates an in-app notification for the assigned supervisor.
- Supervisor fix responses create an in-app notification for the assigned proofreader.

New migration:

```text
supabase/migrations/010_proofreading_system.sql
```

Run this migration in Supabase before using proofreading in production. It creates:

- `proofreading_reviews`
- `proofreading_threads`
- `proofreading_messages`
- `proofreading_block_cycles`
- Supabase Storage bucket: `proofreading-feedback`
