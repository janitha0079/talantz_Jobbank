# Claude Code Prompt — Talantz Inside-Pages Visual Upgrade

> **How to use this file:** Open the `talentai-backend` repo in Claude Code (or your agent of
> choice), make sure this handoff package (`design_handoff_inside_pages/`) is reachable, and paste
> everything between the rules below as your first message. It is written to be pasted verbatim.
> Adjust only the two PATH lines at the top of the prompt if your local layout differs.

---

## ✂️ ----------  PASTE FROM HERE  ----------

You are upgrading the **logged-in / inside pages** of the Talantz (TalentAI.lk) app so they match
the polish of the marketing landing page. This is a **presentation-layer-only** task: re-skin the
existing screens to the new design, reusing all current data fetching, auth, and routing. **Do not
change any data wiring, API contracts, Prisma queries, or the database.**

### Where things live
- **Repo (edit here):** `talentai-backend/` — Next.js 14 App Router + TypeScript + Prisma + NextAuth.
- **Design spec (read, don't edit):** `design_handoff_inside_pages/README.md` — the authoritative,
  screen-by-screen build spec. Follow it precisely; it is more detailed than this prompt.
- **Visual reference (read, don't port):** `design_handoff_inside_pages/prototype/*.jsx` — HTML/React
  mockups showing the intended look & motion. They use a hash router and hard-coded Sri-Lankan
  sample data **purely to be navigable**. Recreate the *look*; ignore the router and the sample data.
- **Logo assets:** `design_handoff_inside_pages/assets/talantz-logo.png` and `talantz-mark.png`.

### Ground rules (read before you touch anything)
1. **Read `design_handoff_inside_pages/README.md` end-to-end first.** It contains the exact CSS,
   component specs, per-screen layouts, status→step maps, and token names. This prompt is a summary;
   the README wins on any detail.
2. **Reuse the existing design system.** `src/app/globals.css` already defines every color, font,
   radius, and most utility classes (`.btn*`, `.badge-*`, `.card`, `.reveal`, `.container`, all
   `--*` tokens). Use the existing CSS variables — never hard-code a hex where a token exists.
3. **Touch only the presentation layer.** Keep every server component's data fetching, every
   `fetch('/api/...')` call, NextAuth session usage, `searchParams` form wiring, and the apply POST
   exactly as they are. If a screen renders `matchScore`, keep reading it from
   `computeJobMatch()` / the existing match service — don't invent or stub data in production paths.
4. **Don't port the prototype's `AppNav`, footer, sample data, or hash router.** The app already has
   `src/components/navigation/SiteHeader.tsx` and file-based routing. The only nav change is swapping
   in the new logo image.
5. **Verify after each screen.** Run the dev server, log in, and confirm real data still flows and
   the page builds with no type errors before moving to the next screen.

### Real data shapes you must bind to (already in the repo)
- **Job match** comes from `src/lib/matching.ts` → `computeJobMatch(job, seeker): MatchResult`:
  ```ts
  type MatchResult = {
    score: number
    breakdown: { skills; experience; title; location; education; profileCompleteness } // all numbers
    strengths: string[]
    gaps: string[]
    summary: string
    skillsMatched: string[]
    skillsMissing: string[]
  }
  ```
  Map breakdown keys to the README's bar labels (Skills, Experience, Title fit, Location, Education,
  Profile). Render the AI-match block **only when a match result exists**.
- **Jobs listing** (`src/app/jobs/page.tsx`) already builds `where` from
  `searchParams.q / jobType / workMode / location` and queries with `db.job.findMany`. Keep the GET
  form fields and names; just restyle the inputs as `.search-field` and the rows as scored cards.
- **Applications** (`src/app/(seeker)/applications/page.tsx`) uses `fetch('/api/applications?status=…')`.
  Keep it; apply the README's status→step + badge map for the stage track.
- **Profile** (`src/components/profile/ProfileScreen.tsx`) already calls the profile API. Bind name,
  headline, location, skills, experience, education, certifications, and completeness % from it.
- **Employer** (`src/app/(employer)/employer/page.tsx`) has real subscription/plan + applicant data.
  Reuse it; sort the AI-ranked applicants by score desc.

### Order of work (do these in sequence, verifying between each)
1. **Foundation.** Append the new utility classes from README "Step 1" to `src/app/globals.css`
   (badge tones, `.btn-sm`, `.app-wrap`/`.app-narrow`, `.page-hero`, `.search-field`, `.field`,
   `.chip`, `.av`, `.bar-track`/`.bar-fill`, `.row-link`, `.skill`, the ≤940px responsive collapse).
   Keep the repo's existing `.btn-ghost` and `.card-hover` — do **not** overwrite them with the
   prototype's versions. Drop the two PNGs into `public/` and swap the logo in `SiteHeader.tsx`
   (render ~30px tall on the dark header; use the mark for compact spots/favicon).
2. **Shared UI primitives** in `src/components/ui/` (typed, `'use client'` where they use hooks),
   ported from `prototype/shared.jsx` per README "Step 2": `ScoreRing` (animated count-up gauge),
   `BreakdownBar`, `Check`, `CoLogo`, `PageHero`, `Mesh`, and a `useReveal()` hook. All motion must
   respect `prefers-reduced-motion` (jump to final state).
3. **Re-skin screens in this order**, matching each README section exactly:
   Jobs listing → Job detail (the AI-match block is the centerpiece) → Applications tracker →
   Candidate profile → Employer dashboard.

### Definition of done
- All five screens visually match the README specs and prototype references.
- Scroll-reveal, count-ups, bar grows, and the score ring animate on mount and are gated for reduced
  motion; cards lift on hover, rows slide, buttons use existing `.btn*` transitions.
- `.detail-grid` and `.stats4` collapse correctly at ≤940px.
- `npm run build` (or `next build`) passes with no new type errors, and every screen still renders
  **real** data end-to-end after login. No API, schema, or auth changes were made.

Start by reading `design_handoff_inside_pages/README.md` in full, then confirm your plan and the
exact list of files you'll touch before writing code.

## ✂️ ----------  PASTE TO HERE  ----------

---

### Notes for the human
- The prototype's sample data is **Sri-Lankan demo content** (Dialog Axiata, 99x, WSO2, "Kavindi
  Rajapaksa", etc.) used only to make the static mock navigable. It is not real app data — make sure
  the agent doesn't seed or hard-code it.
- If you have the **original vector (SVG) logo**, hand that to the agent instead of the keyed-out
  PNGs for crisper rendering.
- The full visual spec, the exact CSS to append, and every per-screen layout already live in
  `README.md` in this same folder — this prompt just orients the agent toward it.
