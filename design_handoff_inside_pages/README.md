# Handoff: Talantz Inside Pages — Visual Enhancement

## Overview
This package upgrades the **logged-in / inside pages** of the TalentAI (Talantz) app so they match the polish of the marketing landing page: deep-space gradient hero bands, an animated AI‑match score ring + factor breakdown, scroll‑reveal motion, gold accents, and elevated cards. It covers five screens — **Jobs listing, Job detail, Candidate profile, Applications tracker, and Employer dashboard** — plus a new image logo.

The good news: the prototype was built **on top of your existing design system**. `src/app/globals.css` already defines every color, font, radius, and most utility classes the prototype uses. Integration is therefore mostly: (a) add a handful of new utility classes, (b) re-skin the JSX in each page, (c) keep all existing data fetching/auth untouched.

## About the Design Files
The files in `prototype/` are **design references created in HTML/React-via-Babel** — they show the intended look and behavior. They are **not** production code to paste directly. Your task is to **recreate these designs inside the existing Next.js 14 (App Router) + TypeScript codebase**, reusing its established patterns (server components, Prisma queries, NextAuth session, `SiteHeader`, the `globals.css` token system). Keep all existing data wiring; only the presentation layer changes.

The prototype uses a tiny client-side hash router and hard-coded sample data (Sri Lankan companies/roles) purely so the static mock is navigable. **Do not port the router or the sample data** — the real pages already have routing (Next.js file-based) and real data.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, and interactions are final and should be recreated faithfully. All tokens map to existing CSS variables in `globals.css`, so use those variables rather than raw hex where one exists.

---

## Codebase Mapping (prototype → repo)

| Prototype file (`prototype/`) | Implements | Target file in repo |
|---|---|---|
| `page-jobs.jsx` | Jobs listing: hero search band + AI‑scored result rows | `src/app/jobs/page.tsx` |
| `page-job.jsx` | Job detail: header, **AI match** block, sections, sidebar | `src/app/jobs/[slug]/page.tsx` |
| `page-profile.jsx` | Candidate profile: identity hero, skills, experience timeline, AI coach | `src/components/profile/ProfileScreen.tsx` (rendered by `src/app/(seeker)/profile/page.tsx`) |
| `page-applications.jsx` | Applications tracker: stage track per card, filters | `src/app/(seeker)/applications/page.tsx` |
| `page-employer.jsx` | Employer dashboard: hero, stat cards, AI‑ranked applicants, pipeline chart, roles | `src/app/(employer)/employer/page.tsx` |
| `shared.jsx` | Reusable primitives (see "Shared Components" below) | new `src/components/ui/*.tsx` |
| `talantz-app.css` | All styles | merge the **new classes** into `src/app/globals.css` |
| `assets/talantz-logo.png` | Mark + wordmark lockup (transparent) | `public/talantz-logo.png` |
| `assets/talantz-mark.png` | Monogram mark only (transparent) | `public/talantz-mark.png` |

> The prototype nav (`AppNav`) and footer are **not** a target — your app already uses `src/components/navigation/SiteHeader.tsx`. Only adopt the **logo image** change there (see Assets).

---

## Step 1 — Add the new utility classes to `globals.css`

These classes are used by the prototype and are **not yet** in `globals.css`. Append them. (Everything else — `.btn*`, `.badge-royal/green/amber/coral/gold/surface`, `.card`, `.reveal`, `.animate-in`, `.container`, all `--*` tokens — already exists and should be reused as-is.)

> ⚠️ Note: the prototype defines a `.btn-ghost` with a **white background** and a `.card-hover` that lifts cards. Your `globals.css` already has `.btn-ghost` (transparent) and `.card-hover`. Keep your existing ones; where the prototype shows a white outline button, use your `.btn-ghost` or a `.card`-style button.

```css
/* ── New badge tones ─────────────────────────────────────── */
.badge-violet { background: #F2ECFF; color: #7C3AED; }
.badge-sky    { background: #E2F3FE; color: #0369A1; }
.badge-cyan   { background: #DFFAFB; color: #0891B2; }

/* small button */
.btn-sm { padding: 9px 18px; font-size: 13.5px; border-radius: 10px; }

/* page-level wrappers (slightly narrower than .container) */
.app-wrap   { max-width: 1180px; margin: 0 auto; padding: 0 28px; }
.app-narrow { max-width: 920px;  margin: 0 auto; padding: 0 28px; }

/* dark page-hero band (top of each inside page) */
.page-hero { position: relative; overflow: hidden;
  background: radial-gradient(120% 130% at 78% -10%, var(--space-2) 0%, var(--space-1) 46%, var(--space-0) 100%);
  color: #fff; }

/* search field shown on the dark hero */
.search-field { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,.16);
  background: rgba(255,255,255,.96); color: var(--ink); font-family: var(--ff); font-size: 14.5px; font-weight: 500;
  outline: none; transition: box-shadow .2s, border-color .2s; }
.search-field::placeholder { color: var(--ink-muted); }
.search-field:focus { border-color: var(--gold); box-shadow: 0 0 0 4px rgba(245,184,0,.25); }
select.search-field { cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237580A0' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 14px center; padding-right: 34px; }

/* light form field (inside white cards) */
.field { width: 100%; padding: 12px 14px; border-radius: 11px; border: 1.5px solid rgba(27,61,224,.14);
  background: var(--surface); color: var(--ink); font-family: var(--ff); font-size: 14px; outline: none;
  transition: box-shadow .2s, border-color .2s, background .2s; }
.field:focus { border-color: var(--royal); background: #fff; box-shadow: 0 0 0 4px rgba(27,61,224,.12); }

/* filter chips */
.chip { padding: 8px 15px; border-radius: 999px; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all .18s; background: #fff; color: var(--ink-soft); border: 1.5px solid rgba(27,61,224,.12); }
.chip:hover { border-color: rgba(27,61,224,.35); color: var(--royal); }
.chip.on { background: var(--royal); color: #fff; border-color: var(--royal); box-shadow: 0 6px 18px rgba(27,61,224,.3); }

/* avatar circle */
.av { border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; color: #fff; font-weight: 800;
  background: linear-gradient(135deg,#1B3DE0,#4F6EFF); }

/* score / progress bars */
.bar-track { height: 8px; border-radius: 999px; background: rgba(27,61,224,.1); overflow: hidden; }
.bar-fill  { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--royal), var(--electric));
  transition: width 1.3s cubic-bezier(.22,.68,0,1); }
.bar-fill.gold { background: linear-gradient(90deg,#F5B800,#FFD34D); }

/* list row hover (applicant / job rows) */
.row-link { transition: transform .18s, box-shadow .18s, border-color .18s; }
.row-link:hover { transform: translateX(4px); border-color: rgba(27,61,224,.28) !important;
  box-shadow: 0 10px 26px rgba(27,61,224,.1); }

/* skill / tag pill */
.skill { padding: 7px 13px; border-radius: 10px; font-size: 13px; font-weight: 600;
  background: var(--royal-pale); color: var(--royal); }
.skill.muted { background: #EEF0F7; color: var(--ink-soft); }
.skill.have  { background: #E7F8EF; color: #15803D; }
.skill.miss  { background: #FFF3D6; color: #B4790B; }

/* responsive collapse for the two-column detail layouts */
@media (max-width: 940px) {
  .detail-grid { grid-template-columns: 1fr !important; }
  .detail-grid > div:last-child { position: static !important; }
  .stats4 { grid-template-columns: repeat(2,1fr) !important; }
}
```

---

## Step 2 — Create shared components (`src/components/ui/`)

Port these from `shared.jsx` as typed client components (`'use client'` where they use hooks). Specs:

### `<ScoreRing score size label dark />` — animated circular gauge
- SVG, two stacked `<circle>`: a track and a gold gradient progress arc rotated `-90deg`.
- Progress arc: `stroke-dasharray = 2πr`, `stroke-dashoffset = circ * (1 - value/100)`; `stroke-linecap: round`; drop-shadow `0 0 6px rgba(245,184,0,.5)`.
- Gradient stops: `#F5B800 → #FFD34D`.
- Center: big number (`fontSize ≈ size*0.3`, weight 800) + small label (`fontSize 9.5`, letter-spacing `.12em`, weight 700).
- Count-up: animate `0 → score` over **1300ms**, ease `1 - (1-p)^3`, start after ~220ms. Respect `prefers-reduced-motion` (jump to final).
- Track stroke: dark mode `rgba(255,255,255,.14)`, light `rgba(27,61,224,.12)`. Default `size=132, stroke=11`.

### `<BreakdownBar label value delay />` — horizontal factor bar
- Row: label (13px, weight 600, `--ink-soft`) left; value `n%` (13px, weight 800) right.
- Bar uses `.bar-track` + `.bar-fill`; animate width from 0 → value after mount (`useGrow`, ~1.3s).
- Fill color by value: `≥80 → #15803D`, `≥60 → var(--royal)`, else `#B4790B` (gradient `color → color+'aa'`).

### `<Check color size />` — check icon
- 16×16 SVG: filled circle at 15% opacity + check path stroke `#15803D` (or passed color), `stroke-width 1.7`, round caps.

### `<Mesh soft />` — animated blobs for dark bands
- Two blurred radial-gradient circles using `@keyframes drift1/drift2` (already in `globals.css`) + a faint masked grid overlay. `soft` lowers gold blob opacity.

### `<PageHero eyebrow>{children}</PageHero>` — dark hero band wrapper
- `.page-hero` + `<Mesh/>` + `.app-wrap` content; optional gold "eyebrow" pill (`background rgba(245,184,0,.13)`, color `--gold-soft`, 1px gold border, pulsing 6px dot).

### `<CoLogo company size radius />` — company logo tile
- Rounded square, `linear-gradient(140deg, color, color+'cc')`, white initial (weight 800, `fontSize ≈ size*0.42`), soft shadow `0 6px 16px color+'3a'`. Map company → brand color (or fall back to `--royal`).

### `useReveal()` hook + `.reveal` / `.in`
- `IntersectionObserver` (threshold `0.12`, `rootMargin '0px 0px -6% 0px'`) that adds `.in` to `.reveal:not(.in)`. `.reveal`/`.in` and the `data-d="1..4"` stagger delays already exist in `globals.css`. Re-run on route change.

---

## Screens

### 1. Jobs listing — `src/app/jobs/page.tsx`
- **Hero band** (`.page-hero`): eyebrow "For people looking for work"; H1 `clamp(2rem,3.6vw,3.1rem)`, weight 800, with the word **"fits"** in `var(--ff-serif)` italic, color `--gold-soft`; subline "{N} active roles · scored against your profile in real time."
- **Search row**: text input (`flex 1 1 300px`) + two `select.search-field` (type, mode) + `.btn-gold` Search. These map to the existing `searchParams` GET form — keep the real `name="q" / jobType / workMode / location` fields and `method="GET"`.
- **Result count + sort chips** ("Best match", "Featured") on `--surface` below the band.
- **Job rows** (replace current `JobCard`): `.card.card-hover`, padding `20px 22px`; layout = `<CoLogo 48>` + info column + right **match cell** (hidden < 940px). Info: title 17px/700; company line (name + `✓` if verified + `· location`) 13.5px `--ink-muted`; badge row = type (`.badge-royal`), mode (`.badge-surface`), salary (`.badge-green`), `posted` pushed right. Featured rows get `border-color: rgba(245,184,0,.45)` + a `★ Featured` `.badge-gold`.
- **Match cell**: pill (`padding 10px 16px`, radius 14) tinted by score — `≥85` green `#E7F8EF/#15803D`, `≥70` `--royal-pale/--royal`, else grey; big `n%` (22px/800) over a tiny "MATCH" label.
- **Data**: the score comes from your AI match service. If a list-level score isn't available yet, compute/stub it or hide the match cell — don't block the layout on it.

### 2. Job detail — `src/app/jobs/[slug]/page.tsx`
- Thin dark breadcrumb band (`.page-hero`, `18px` pad) with "← Back to jobs".
- **Two-column** `.detail-grid` `1fr 320px`, gap 26, `align-items:start`; sidebar is `position:sticky; top:82`.
- **Header card**: `<CoLogo 60>`, H1 in `--ff-serif` `clamp(1.6rem,3vw,2.2rem)`, company link (`--royal`/700) + `✓`, badge row (type/mode/salary/`Closes {date}`), then **Apply** (`.btn-royal`). Apply opens an inline panel (`.field` textarea + submit/cancel) → on submit show the green "Application submitted" state with `<Check/>`. Keep the **real** apply POST to `/api/applications`.
- **AI MATCH block** (the centerpiece — currently a flat card): make it a card with **no padding** wrapping (a) a dark gradient header `radial-gradient(120% 130% at 85% 0%, #15309f, #06103f)` containing `<ScoreRing score={matchScore.score}/>` + an eyebrow "Your AI match" + the `summary` text; and (b) a white body with a 2-col grid of `<BreakdownBar>` for each `matchScore.breakdown` key (Skills, Experience, Title fit, Location, Education, Profile), then a 2-col **Strengths** (green, `<Check>` bullets) / **To improve** (amber, `!` bullets) grid from `matchScore.strengths` / `matchScore.gaps`. Only render when `matchScore` exists.
- **About / What you'll do / What we're looking for**: `.card` padding 28; section titles `--ff-serif` 1.4rem; responsibility & requirement items use `<Check color="--royal">` bullets. (Your existing markdown renderer can stay for `description`.)
- **Skills card**: "REQUIRED" → `.skill` pills; "NICE TO HAVE" → `.skill.muted` pills (from `skillsRequired` / `skillsPreferred`).
- **Sidebar**: company card (`<CoLogo 44>`, name+✓, industry, about, hq/size) + "Job details" `<dl>` (type, mode, location, experience, education, salary, applicants, posted) + a small gradient "polish my profile" CTA card.

### 3. Candidate profile — `src/components/profile/ProfileScreen.tsx`
- **Identity hero** (`.page-hero`, `34px 0 56px`): left = 84px `.av` initial + name (H1 `clamp(1.8rem,3.4vw,2.6rem)`/800) + headline (`--gold-soft`/600) + meta line (location · experience · email); right = `<ScoreRing score={profileStrength} size=120 label="PROFILE"/>`.
- **`.detail-grid` `1fr 300px`**. Main column cards: **About** (with "Edit" `.chip`), **Skills** (`.skill` pills + a dashed "+ Add skill"), **Experience** timeline (vertical gradient line, dots — newest dot gold, rest royal — role/period/company·loc + `<Check>` bullets), **Education + Certifications** (2-col `.card`s, certs use gold `<Check>`).
- **Sidebar**: dark gradient **AI profile coach** card (`linear-gradient(160deg,#06103f,#13288f)`) with a gold `.bar-fill` strength bar + a checklist of completion wins (done = struck-through, gold check; pending = hollow circle) + a "browse matched jobs" CTA card.
- **Data**: wire name, headline, location, skills[], experience[], education[], certifications[], and the profile-completeness % from the real profile API the screen already calls.

### 4. Applications tracker — `src/app/(seeker)/applications/page.tsx`
- **Hero** (`.page-hero`): H1 "Track every **application**" (serif italic word, gold); subline "{total} applications · {active} still active"; right = two glass stat tiles (Interviews, Shortlists).
- **Filter chips**: Active / Closed / All (`.chip.on`).
- **Application card** (`.card`, `18px 22px`): `<CoLogo 46>` + job title (links to detail) + company·location·applied date; right = status `.badge` + "{n}% match". Below, a **5-step stage track** (Applied → Screening → Shortlist → Interview → Offer): row of dots + connectors; dots up to the current step filled `--royal` (current one gets a `0 0 0 4px rgba(27,61,224,.18)` ring); labels 9.5px. Hide the track for terminal states (rejected/withdrawn).
- **Status → step / badge map** (use this for the dots and pill tone):
  `applied → 1, badge-royal` · `screening → 2, badge-violet` · `shortlisted → 3, badge-sky` · `interview → 4, badge-cyan` · `assessment → 4, badge-violet` · `offer → 5, badge-green` · `hired → 6, badge-green` · `rejected → 0, badge-coral` · `withdrawn → 0, badge-surface`.
- Keep the real `fetch('/api/applications?status=…')` data flow.

### 5. Employer dashboard — `src/app/(employer)/employer/page.tsx`
- **Hero** (`.page-hero` + `<Mesh/>`, `34px 0 64px`): 2-col. Left = "Verified employer" eyebrow, company name H1, blurb, `+ Post a new role` (`.btn-gold`) + `View public job page` (`.btn-glass`). Right = glassy **Current plan** card (`rgba(255,255,255,.07)`, blur) listing plan features with gold `<Check>`. (Reuse the real `planMeta`/subscription data.)
- **Stat cards** overlap the hero: 4-col `.stats4`, `margin-top:-36px`; each `.card` has a tinted 40px swatch, big number (30px/800, tinted) + label. Map to: Active roles, Total applicants, Shortlisted, Avg. time to shortlist.
- **Two-column** `.detail-grid` `1.5fr 1fr`:
  - **AI-ranked applicants** card: section eyebrow + role title; rows = rank number, `.av`, name + "role · Ny · location" + tiny skill `.badge-surface` chips, a status `.badge`, and a right **FIT %** (20px/800, tinted by score). Row #1 highlighted gold (`linear-gradient(120deg,#FFFBEB,#FEF3D0)`, gold border). Use `.row-link` hover. Sort applicants by AI score desc.
  - Right column: **Pipeline chart** card — vertical bars per stage (Applied/Screening/Shortlist/Interview/Offer/Hired), heights normalized to the peak, the active/"shortlist" bar gold, others royal gradient; count label above each bar; animate height on mount. Then **Your roles** card — compact rows (title, type·mode, status `.badge` [active=green, paused=amber, draft=surface], "{n} appl.").

---

## Interactions & Behavior
- **Scroll reveal**: wrap major blocks in `.reveal` (+ `data-d="1..4"` for stagger) and toggle `.in` via `useReveal()`. Re-observe on navigation.
- **Count-ups / bar grows / ring**: animate on mount; all gated for `prefers-reduced-motion`.
- **Hover**: cards lift (`.card-hover`), rows slide (`.row-link`), buttons use the existing `.btn*` transitions.
- **Apply flow** (job detail): toggle inline panel → POST → success state. **Filters** (jobs, applications): re-query, don't client-fake in production.
- **Responsive**: `.detail-grid` and `.stats4` collapse at ≤940px (rules above); `.hide-mob` hides the jobs match cell and nav extras.

## State Management
Keep your current model. Net-new client state is only UI-local: jobs (`q`, `type`, `mode`, `sort`), job detail (`panel`, `applied`, `cover`), applications (`filter`), profile (animated values). Everything data-bearing stays in the existing server components / API calls.

## Design Tokens
**All already in `src/app/globals.css`** — reuse, don't redefine:
- Brand: `--royal #1B3DE0`, `--royal-dark #0F27A8`, `--royal-deep #091875`, `--royal-pale #EEF1FD`, `--electric #4F6EFF`, `--gold #F5B800`, `--gold-soft #FFD34D`.
- Ink: `--ink #07080F`, `--ink-soft #2E3345`, `--ink-muted #7580A0`. Surface: `--surface #F6F7FE`, `--card #FFFFFF`, `--border`, `--border-md`.
- Space band: `--space-0 #05091f`, `--space-1 #0a1146`, `--space-2 #122a9e`.
- Type: `--ff 'Outfit'`, `--ff-serif 'Cormorant Garamond'`. Radius: `--r-sm 8 / --r-md 12 / --r-lg 16 / --r-xl 20`.
- Inline hex used by the prototype that has **no** token: greens `#15803D / #E7F8EF`, amber `#B4790B / #FEF3D6 / #FFF3D6`, violet `#7C3AED / #F2ECFF`, sky `#0369A1 / #E2F3FE`, cyan `#0891B2 / #DFFAFB`. (Captured in the new badge classes above.)

## Assets
- `assets/talantz-logo.png` — mark + "Talantz" wordmark, **transparent** background, ~295×62. Put in `public/`, use for the logo in `SiteHeader.tsx` (render ~30px tall on the dark header).
- `assets/talantz-mark.png` — monogram only, transparent, square ~74×74. Use for compact spots / favicon.
- Both were derived from the user-supplied `Tanantz.png` by keying out the navy background. If you have the original **vector** logo, prefer that (SVG) for crispness.
- Fonts (Outfit, Cormorant Garamond) are already imported at the top of `globals.css`.

## Files (in this bundle)
- `prototype/Talantz App.html` — entry; loads the scripts below.
- `prototype/shared.jsx` — palette, `useReveal`, `useGrow`, `Mesh`, `PageHero`, `ScoreRing`, `Check`, `CoLogo`, sample data + status maps. **Port the components; ignore the sample data.**
- `prototype/page-jobs.jsx` · `page-job.jsx` · `page-profile.jsx` · `page-applications.jsx` · `page-employer.jsx` — one per screen above.
- `prototype/main.jsx` — hash router (reference only; Next.js handles routing).
- `prototype/talantz-app.css` — full stylesheet; only the **new** classes (Step 1) need merging into `globals.css`.
- `assets/talantz-logo.png`, `assets/talantz-mark.png` — logo images.

## Suggested order of work
1. Merge Step 1 CSS into `globals.css`; drop the two PNGs into `public/`; swap the logo in `SiteHeader.tsx`.
2. Build `src/components/ui/` primitives (Step 2) — start with `ScoreRing`, `BreakdownBar`, `Check`, `CoLogo`, `PageHero`, `Mesh`, `useReveal`.
3. Re-skin pages in this order: Jobs listing → Job detail (AI match) → Applications → Profile → Employer. Verify data still flows after each.
