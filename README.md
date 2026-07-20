# Gujarat University Placement Portal — Backend

Express + TypeScript + Prisma + PostgreSQL. Serves the React frontend, whose
behaviour spec lives in `placementportalfrontend/docs/system-flow.md` — that
document is the source of truth for this schema.

## Running it

```bash
npm install
cp .env.example .env     # fill in DATABASE_URL and the two JWT secrets
npm run prisma:migrate   # creates the schema in `placementportal`
npm run dev              # http://localhost:4000/api/v1
```

Check it came up: `curl http://localhost:4000/api/v1/health` — it round-trips
to Postgres, so a 200 means the database is genuinely reachable.

| Script | What it does |
|---|---|
| `npm run dev` | tsx watch on `src/server.ts` |
| `npm run build` / `npm start` | compile to `dist/`, run with plain node |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma:migrate` | create + apply a migration |
| `npm run prisma:studio` | browse the data |
| `npm run db:reset` | drop, recreate, re-migrate |

## Layout

```
prisma/schema.prisma       73 models — the whole domain
prisma/migrations/         init migration, hand-extended (see below)
src/config/env.ts          zod-validated env; bad config fails at boot
src/lib/prisma.ts          client singleton over the pg driver adapter
src/lib/tokens.ts          JWT sign/verify, access + refresh
src/lib/http-error.ts      ApiError — the only errors clients see detail from
src/middleware/            auth guards, scope helpers, error envelope
src/modules/               the domain, one folder per area
src/routes/index.ts        /health; module routers mount here
src/generated/prisma/      generated client — build output, gitignored
```

`config/`, `lib/` and `middleware/` are layer-shaped because they're
infrastructure with no domain meaning. Everything else lives in `modules/`.

### Module convention

**Modules are organised by domain, not by persona.** The internship lifecycle
alone crosses four personas (student → recruiter → coordinator → faculty); a
`student/` + `recruiter/` + `coordinator/` split would scatter one stage
machine across four folders and let the rules drift — the same failure the
schema consolidations exist to prevent. Persona is an *authorization* concern,
handled by `requireRole` and the scope helpers, and declared in each module's
route table.

Every module is four files with the same names:

```
modules/platform/
  department.routes.ts      route table + role guards — who may call what
  department.controller.ts  zod parse, call service, pick a status code
  department.service.ts     the domain; no req/res, throws ApiError
  department.schema.ts      zod request shapes + inferred types
```

`modules/platform/department.*` is complete and working — **copy it as the
template**. It exercises the whole stack: public reads, admin-only writes,
zod validation, conflict handling, and a delete that refuses rather than
orphan a roster.

Two rules worth keeping:

- **Services never see HTTP.** No `req`, no `res`, no status codes. They throw
  `ApiError`; the controller and error middleware turn that into a response.
  This is what lets the cross-row invariants (an application with an offer
  must sit in `OFFER`/`JOINED`) live in exactly one enforceable place.
- **Express 5 forwards async rejections** to the error middleware by itself.
  No `try/catch`, no `asyncHandler` wrapper.

Reports are the deliberate exception: `modules/reports/` should query Prisma
directly rather than composing other modules' services. Aggregate reporting is
a genuinely different access pattern.

## Schema decisions

The doc's "open questions for the backend" section asked for four of these
explicitly; the rest follow from it.

**Three job lists became one.** Public `Jobs`, the recruiter's `RecJobs` and
Admin's `Openings` are one `job_posting` owned by a company. `status`
(`DRAFT → PENDING_APPROVAL → PUBLISHED → CLOSED`) carries the admin approval
queue, and `source` records which console created it. No hand-syncing.

**Two candidate views became one.** A posting's scored applicant list and the
recruiter's flat evaluation board are both views over `application` — one row
per student × posting, uniquely constrained. Round marks hang off it as
`application_round`. This is why the doc's "internship stage sync" and
"candidate stage matches offers" checks stop being reconciliation problems:
there's only one row to be right.

**Internships stayed separate.** `internship_posting` / `internship` are not
folded into `job_posting`. They carry a genuinely different lifecycle
(approval → mentor → report → evaluation) and the doc's own ER model keeps
them apart. `internship` doubles as the applicant list *and* the student's
tracker — the same record both personas read.

**Notifications are an outbox.** Actions append to `outbox_event` in their own
transaction; a dispatcher fans events out into `notification` rows. The doc
flagged a dozen unrelated writers reaching into one inbox as a smell — this is
the fix it suggested.

**Skills are a registry, not strings.** `skill` + `student_skill` +
`job_posting_skill` means the 45%-weighted skills-overlap term of the match
score is a join. `skill.name` is `citext`, so "React" and "react" are one row.

**The visibility fence lives on `user`.** `role` plus a nullable
`department_id` / `company_id` is how a coordinator sees only their department
and a recruiter only their company. `src/middleware/authenticate.ts` exposes
`departmentScope()` / `companyScope()` / `currentStudentId()` — the last one
is what replaces the frontend's hardcoded Aarav Shah.

### The 9 integrity checks, as real constraints

The doc's data-integrity page lists 9 invariants. 112 foreign keys cover six
of them outright. The init migration hand-adds CHECK constraints for two more:

- `company_scope_department_consistent` (and the same on `job_posting`,
  `internship_posting`, `drive`) — `DEPARTMENT_ONLY` must name a department,
  `UNIVERSITY_WIDE` must not.
- `user_role_scope_consistent` — a `RECRUITER` must have a company and no
  department; a `COORDINATOR`/`FACULTY` the reverse; an `ADMIN` neither.

Two remain in the application layer because a CHECK can't see across rows:

- an `application` with an `offer` must sit in `OFFER`/`JOINED`
- `mentee_record.faculty_user_id` must point at a user whose role is `FACULTY`

Both want either a trigger or a service-layer guard. Worth deciding before the
endpoints get written.

> The init migration is hand-edited on top of what Prisma generated (the
> `citext` extension, the CHECK constraints). Regenerating it from scratch
> would drop those.

## Authentication

`modules/auth/` is built. Two ways in — local password and federated
(LinkedIn, Outlook) — both landing on the same account model.

### Endpoints

```
POST /auth/login                     email + password -> { user, accessToken, refreshToken }
POST /auth/register/student          public student form; creates PENDING account
POST /auth/register/recruiter        three-way branch; creates company + PENDING account
POST /auth/refresh                   rotate refresh token -> new pair
POST /auth/logout                    revoke one refresh token
GET  /auth/me                        current user (auth)
POST /auth/logout-everywhere         revoke all this user's sessions (auth)

GET  /auth/oauth/providers                which providers are configured
GET  /auth/oauth/:provider/start          begin sign-in (browser redirect)
GET  /auth/oauth/:provider/callback       provider returns here -> SPA redirect
POST /auth/oauth/complete/student         finish an OAuth-bootstrapped student signup
POST /auth/oauth/complete/recruiter       finish an OAuth-bootstrapped recruiter signup
GET  /auth/oauth/:provider/link/start     link a 2nd provider (auth)
GET  /auth/oauth/:provider/link/callback  (auth)
```

### Decisions worth knowing

- **OAuth is authentication, not registration.** A LinkedIn/Outlook login
  gives a name and email — not an enrolment number or a company. A first-time
  provider user gets a signed 30-minute *registration ticket* and the callback
  redirects to the SPA to collect the rest; `complete/*` turns the ticket into
  a real (PENDING) account. This is also forced by the schema — a `RECRUITER`
  row cannot exist without a `company_id`.
- **Identities key on the provider's `sub`, never on email.** Outlook sign-in
  accepts *any* Microsoft account, so a provider-reported address proves
  nothing. Auto-linking by email would be an account-takeover path. Linking a
  second provider therefore requires an already-authenticated session.
- **New accounts are `PENDING` and get no tokens.** That's the department /
  Placement-Cell approval gate from the doc. Only `ACTIVE` accounts can log in.
- **Refresh tokens are rotated and stored hashed.** Replaying an
  already-rotated token means it leaked, so the whole session family is
  revoked. `refresh_session` holds a SHA-256, never the token.
- **The access token carries `studentId`** (and role, department, company).
  That's what replaces the frontend's hardcoded Aarav Shah — `currentStudentId`
  reads it straight off the token.
- **Providers are optional.** With no client id set, a provider reports
  `configured:false` and its `/start` returns a clear error; the server still
  boots. See `.env.example` for where to register the redirect URIs.

## Platform module

`modules/platform/` holds the registries everything else depends on —
departments, programs, sectors, and the admin user registry. All four follow
the department template exactly.

```
GET/POST/PATCH/DELETE /departments   (see Module convention above)
GET/POST/PATCH/DELETE /programs      ?departmentId= filters; (departmentId, code) unique
GET/POST/PATCH/DELETE /sectors       flat lookup list
GET/POST/PATCH        /users         ADMIN-only; see below
PATCH /users/:id/status              ADMIN-only; approve/suspend/reactivate
DELETE /users/:id                    ADMIN-only; guarded, see below
```

`departments`, `programs` and `sectors` are publicly readable — the
registration forms need them before an account exists — and admin-only to
write.

`users` is the doc's "Users & roles" module, so unlike the others it has no
public surface at all. Two things worth knowing:

- **It cannot create a STUDENT or RECRUITER.** Those roles need a nested
  student/company record that the `user_role_scope_consistent` CHECK
  constraint requires — that's what `/auth/register/*` is for. This endpoint
  only creates staff (`COORDINATOR` / `FACULTY` / `ADMIN`), and they land
  `ACTIVE` immediately rather than `PENDING` — the same "admin vouches for
  someone they already know" shortcut the doc describes for recruiters.
  Creating a `COORDINATOR` with `assignAsCoordinator: true` also sets
  `department.coordinatorUserId` in the same transaction.
- **Deleting a user is guarded, not just permitted.** `user → student` cascades
  in the schema, so deleting a student with any application/internship/
  document history would silently destroy it; the service refuses and points
  at suspending instead. The same applies to a faculty member with mentee
  records, a coordinator who is a department's assigned coordinator, and
  anyone with raised support tickets (cascades there too). A user with no such
  history deletes cleanly.

## Not built yet

`auth` and all of `platform/` (department, program, sector, user) are done.
`routes/index.ts` lists the rest as comments in rough dependency order.

## Known open questions

- **Documents have no storage.** `document.file_url` is a string; nothing
  writes files anywhere. Needs a decision: local disk, S3, or the frontend
  keeps generating documents client-side from records (which the doc says it
  can, for everything except emailing signed copies).
- **`npm audit` reports 3 moderate advisories**, all inside `@prisma/dev`, a
  dev-only transitive dep of the Prisma CLI. Nothing in the runtime path;
  fixing needs a Prisma major downgrade.
- **`readiness_score` / `cv_score` / `profile_completeness` are denormalised**
  onto `student` for list filtering, with history in the `*_snapshot` tables.
  Whatever recomputes them has to keep both in step.
