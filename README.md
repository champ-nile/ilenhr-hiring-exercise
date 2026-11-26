# ilenHR · Leave requests build exercise

A working starter for a small HR workflow. Complete the leave-request lifecycle and explain your decisions and AI workflow. There are **no deliberately introduced bugs** and no hidden test suite.

**Timebox:** approximately three hours of implementation. Agree on a submission deadline with your interviewer. Stop at the timebox; document unfinished work rather than spending an unbounded amount of time. A 30-minute walkthrough follows the submission.

## Start here

Requires **Node.js 24 LTS** and npm. The database uses the built-in `node:sqlite` module; its experimental warning on some Node 24 releases is expected. No cloud accounts, API keys, or paid services are needed.

```sh
nvm use
npm ci
npm run db:seed
npm run dev
```

Open **http://localhost:3000**. The default identity is Aydan. Her sample draft should appear. Try editing it, creating a draft, refreshing, and switching identities. The People page lists the reporting relationships. The exercise brief is also available at `/exercise`.

The database is created at `data/ilenhr.sqlite` on first use. `npm run db:seed` is safe to rerun: it seeds an empty employee table and otherwise preserves your data. Optionally set `DATABASE_PATH` to a different local path in `.env.local`. The seed script does not load `.env.local`; pass `DATABASE_PATH` in its environment if overriding it. Never point this app at production data. All fixture names are fictional and email addresses use the reserved `example.test` domain.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local Next.js app, bound to loopback |
| `npm run db:seed` | Initialize schema and seed if empty |
| `npm run typecheck` | TypeScript checks |
| `npm test` | Starter tests: ownership, input validation, repeatable seeding, persistence |
| `npm run build` | Production build |
| `npm start` | Serve the production build locally |
| `npm run check` | Typecheck, tests, build |

## What already works

- Next.js App Router, React, TypeScript, HTTP route handlers, SQLite.
- Five employees across Engineering and Design, with two managers.
- Employee directory and demo identity switcher using an HTTP-only cookie.
- Owner-only creation, listing, and editing of persistent leave **drafts**.
- Basic input checks: known leave type, real calendar-date format when supplied, note length.
- Responsive workspace and draft editor, with loading, error, empty, and save states.

Draft dates may be missing or temporarily out of order; they are unfinished plans. Draft updates currently replace the saved fields without revision checking. Submission-time date validation and concurrent **lifecycle** actions are candidate requirements below. The starter models only drafts: no request statuses, transitions, history, approval endpoints, or simulated successful approval buttons exist yet. Design those parts yourself.

## Your task

Build a flow where employees submit leave requests and their assigned manager reviews them. Stay on Next.js, TypeScript, and SQLite; change the schema, API, UI, and folder structure as needed. Schema initialization is currently in `src/server/store.ts`; document a migration/reset approach if your schema changes. Do not silently discard data on application startup.

### 1. Submission and validation

- Only the owner can submit their own draft. Submission requires a supported leave type and valid start/end dates, with start on or before end. Same-day requests are allowed. Past dates are allowed for this exercise.
- Treat dates as **inclusive calendar dates**, not timestamps. Two requests that share any date overlap. A request ending June 10 and another starting June 11 do not overlap.
- Prevent overlapping **pending or approved** requests for the same employee, including concurrent submissions. Drafts, rejected requests, and withdrawn requests do not block dates. Different employees may request the same dates.
- A person with no assigned manager cannot submit. Explain this in the UI. Do not invent self-approval or a fallback manager.
- Submitted leave type, dates, and note are immutable. The employee can create another draft if their plans change.

### 2. Manager review

- Show the assigned manager an inbox of their employees’ pending requests.
- Only the assigned manager may approve or reject a pending request. Managers cannot review their own requests or another manager’s team.
- Enforce identity, ownership, and permissions in the **backend** using the supplied demo actor. Hiding a button alone is insufficient. Do not trust an actor ID sent in a mutation payload.
- Employees see only their own requests. Managers may view submitted requests assigned to them and those requests’ history, including after a decision. Managers cannot read their employees’ private drafts.

### 3. Withdrawal and terminal states

- Only the owner can withdraw a pending request.
- Only `pending` can transition to `approved`, `rejected`, or `withdrawn`. Those three states are terminal for this exercise.
- Repeated or conflicting actions must not create another transition/history entry. A clearly reported conflict or an idempotent response is acceptable if documented.

### 4. Reliable history and persistence

- Record submission and each subsequent successful transition, including request ID, previous/next state, actor, and timestamp. Draft autosave history is out of scope.
- Persist the state change and its history together. A failure must not leave one written without the other.
- If two actions race (for example approval and withdrawal), only one valid transition succeeds. Prevent concurrent overlapping submissions as well.
- State and history survive app restarts. Display history to authorized viewers.
- Managers and owners should receive useful UI feedback for validation, authorization, and stale-action errors.

## Keep the scope small

Do not build leave balances, payroll, holidays, partial days, attachments, notifications, email, real authentication, deployment, or a mobile app. Do not add paid AI dependencies to the product. You may use AI agents to do the implementation.

The identity switcher **deliberately permits impersonation** to evaluate permissions locally. This is not a production authentication system. Authorization should still be correct for the currently selected actor. The app binds to `127.0.0.1`; do not expose it publicly as an HR system.

## Where to look

| Path | Responsibility |
| --- | --- |
| `src/server/store.ts` | Schema, fixtures, SQLite access, draft ownership |
| `src/server/http.ts` | Demo identity, JSON/errors, same-origin write check |
| `src/app/api/` | Workspace read, identity switch, draft mutations |
| `src/components/workspace.tsx` | Main UI and draft editor |
| `src/lib/types.ts` | Shared starter types |
| `src/app/exercise/page.tsx` | In-app task brief; keep in sync with this README if you change the brief |
| `src/server/store.test.ts` | Passing starter tests; add your own requirement coverage |

Current API:

| Method and path | Behavior |
| --- | --- |
| `GET /api/workspace` | Current actor, directory, actor’s own drafts |
| `POST /api/demo-actor` | `{ "employeeId": "murad" }`, sets the local demo identity cookie |
| `POST /api/drafts` | Create a draft for the selected actor |
| `PATCH /api/drafts/:id` | Update a draft owned by the selected actor |

Draft payload: `{ "leaveType": "Annual leave", "startDate": null, "endDate": null, "note": "Planning a break" }`. Dates, when supplied, are `YYYY-MM-DD`. Errors are JSON `{ "error": "..." }`. New lifecycle API design is your choice.

## Evidence checklist

Use targeted automated tests and/or reproducible requests and UI evidence. Cover the important invariants, not just screenshots of the happy path:

- Valid same-day submission; missing, impossible, and reversed dates.
- Overlapping ranges, shared boundary day, adjacent ranges, and different employees.
- Rejected/withdrawn requests releasing dates; approved requests still blocking them.
- Wrong employee, wrong manager, self-review, and private-draft access through direct backend requests.
- Competing approve/reject/withdraw actions resulting in one transition.
- Concurrent overlapping submissions resulting in one accepted active request.
- State/history consistency on failure and persistence across reopening/restart.

Do not invent passing results. Explain what you did not verify and why.

## Submission

1. Create your **own private copy** of the starter and preserve `main` as the starter baseline. If template creation is available, use it; otherwise clone and push into a new private repository. Do not submit a public fork or open a PR against the interviewer’s starter.
2. Create a feature branch and open a pull request against your own `main`. Keep your working commit history.
3. Complete `DECISIONS.md`: choices, reasons, alternatives, scope calls, questions, and AI workflow.
4. Put AI session transcripts in `transcripts/`, in order. Redact credentials and unrelated private data; explain redactions.
5. Include requirement evidence and known limitations in your PR. Use `.github/pull_request_template.md`.
6. Share repository and PR links with your interviewer and grant them access using the GitHub account they provide. Do not publish your submission or transcripts.

We review evidence and decisions first, then data modeling and code. Clear, small, explainable work matters more than extra features. In the walkthrough, explain one request end-to-end, one architectural tradeoff, and how you checked or corrected your AI agent’s output. There is no injected-bug round.
