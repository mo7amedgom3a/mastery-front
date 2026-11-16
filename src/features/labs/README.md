# Practice Labs (المختبرات العملية)

Review of the labs feature, the catalog and Mastery Academy fields it touches, the gaps, and a
recommended feature roadmap. Written against the code in this folder and a local catalog API
snapshot (13 Nov 2026).

This is a product and engineering audit, not user documentation. It answers three questions:

1. What do the labs cover today, and which fields do they actually use?
2. What do the catalog and the Academy expose that the labs do not use yet?
3. Which scenarios, gamification and learning-by-doing features should come next, and in what order?

---

## 1. Executive summary

- **12 live labs across 4 of the 13 catalog fields**, plus 3 "coming soon" placeholders for three
  more fields. Sales and customer service carries 9 of the 12 labs; marketing, HR and management
  carry one each.
- The labs are a **polished, deterministic simulation engine** (dialogue graphs, seeded ad-market and
  market simulators, contract redlining, CRM, observer rubrics). They now run through an
  **endpoint-shaped mock API + service layer**; the mock persists to `localStorage`, so there is
  still no real backend, LMS write-back, certificate, rewards points or cross-device history.
- The catalog exposes **7 product types and 452 items** (courses 266, diplomas 64, packages 15,
  bundles 5, consultations 92, live diplomas 5, subscriptions 5). Labs recommend **courses and
  diplomas only**, by **title-keyword match inside one category**.
- Most of the catalog's richest fields are unused by labs: `skills`, `tags`, `learning_outcomes`,
  `readme`/`sections`, `units`/`lessons`, `bundle_members`, `package_members`, `consultation`
  slots, `live_diploma` seats/schedule/cohorts, `access_duration_days`, `cpd_eligible`.
- Gamification stops at **XP + 14 badges + a radar** in one browser. There are no levels, streaks,
  leaderboards, seasons, shareable proof, CPD hours or points.
- The Academy's own machinery is not connected: **365-day entitlements, CPD certificates, the
  rewards ledger, the planner, insights, 92 consultation products and 5 live cohorts** all exist
  beside the labs, not inside them.
- The strongest next moves are: **persist attempts server-side**, **link each lab to products and
  skills**, **replace mock consultation/expert data with the real catalog**, and **ship three field
  packs** (finance close, HSE inspection, governance boardroom) before investing in AI personas.
- Recommendation priority: foundation (persistence + links) → field coverage and capstones →
  gamification tied to the rewards ledger and certificates → AI/voice, cohorts, B2B and community.

---

## 2. Method and sources

**Labs code**

- `src/app/labs/page.tsx`, `src/app/labs/[slug]/page.tsx`, `src/app/labs/layout.tsx`
- `src/features/labs/model/` — `catalog.ts` (registry), `types.ts`, `dialogue.ts`, `ad-market.ts`,
  `market-sim.ts`, `scoring.ts`, `progress-store.ts`, `recommendations.ts`,
  `use-lab-recommendations.ts`, `demo-progress.ts`
- `src/features/labs/content/` — per-lab scenarios, quizzes, rubrics (`marketing.ts`, `sales.ts`,
  `hr.ts`, `support.ts`, `ceo.ts`, `objections/`, `deals/`, `sales-failure/`)
- `src/features/labs/components/` — hub, shell, scorecard, CRM, documents, campaigns, dashboards
- `scripts/test-labs.ts` (`npm run test:labs`), `e2e/student-dashboard.spec.ts`

**Product catalog**

- `docs/mastery-b2c-product-handbook.html` (vision, personas, features, journeys)
- `docs/mastery-b2c-catalog-migration.md` (B2C as source of truth; fields and phases)
- `newwebsitebackend/app/modules/catalog/presentation/schemas.py` and
  `newwebsitebackend/app/modules/catalog/domain/models.py` (public product contract)
- `src/lib/api/catalog.ts`, `src/lib/api/browse.ts` (storefront types)
- Live snapshot: `GET /api/v1/catalog/product-types`, `/categories`, `/onboarding-options`,
  `/products/{slug}`

**Mastery Academy**

- `docs/mastery-b2c-product-handbook.html` (9-stage spine, personas, business rules)
- `docs/mastery-feature.txt` (AI-agent and learning-by-doing vision, pricing, sales blueprint)
- `design_system/mastery-academy-design-kit/README.md` (brand/voice context)
- `src/lib/api/lms.ts`, `insights.ts`, `certificates.ts`, `consultations.ts`, `planner.ts`
- `src/features/student-dashboard/`, `student-insights/`, `student-planner/`,
  `student-profile/`, `certificates/`, `consultations/`
- Backend module READMEs: `newwebsitebackend/app/modules/{rewards,community,certificates}/README.md`

Counts below are from the local catalog API on 13 Nov 2026. They are a snapshot, not a promise:
production counts drift as content is published.

---

## 3. What the feature is today

### 3.1 Runtime

- Public, **`noindex, nofollow`** (`src/app/labs/layout.tsx`); no account required.
- `dynamicParams = false` and `generateStaticParams()` mean every lab page is **statically
  generated at build time**. Adding or renaming a lab requires a code change and a deploy.
- All lab logic runs **client-side**. Every lab now goes through the labs API/service layer
  (`src/features/labs/api`): the default `mock` transport runs an endpoint-shaped server in the
  browser and persists to `localStorage["ma-labs-api-v1"]`. The old Zustand store
  (`localStorage["ma-labs"]`) is imported once and kept as an offline fallback. The only remaining
  direct catalog call is the recommendation fallback (`useLabRecommendations`).
- Each attempt stores: slug, session id, lab version, timestamp, overall, readiness, dimensions
  (key, label, score, skill, weight, praise, tip), XP, new badges, category (legacy id + name),
  minutes, highlights, pre/post quiz results, badge signals, attempt number and source
  (`lab`/`demo`/`imported`).

### 3.2 The lab catalogue

| # | Lab | Field | Learner role | Core mechanic | Phases | Min | Level |
|---|---|---|---|---|---|---|---|
| 1 | `marketing-ads` | Marketing (27) | Digital marketer, نخلة roastery | Seeded 7-day ad-market simulator: audience, creative, platforms, daily budget, bidding, fatigue, competitor days | 4 | 15 | متوسط |
| 2 | `objections-six-types` | Sales (3) | Sales rep, نبض clinic systems | Classify six objection types, choose the right bridge, convert to a commitment | 4 | 15 | متوسط |
| 3 | `objections-competitor-ruler` | Sales (3) | Account manager, ميزان cloud accounting | "Ruler" method against a competitor-satisfied buyer; no bashing, no discount-first | 4 | 14 | متقدّم |
| 4 | `sales-failure-week` | Sales (3) | Field sales rep, نقاء air quality | Week planner + funnel maths + question bank + cold call + follow-up; survive 10 causes of failure | 5 | 18 | متقدّم |
| 5 | `sales-discovery-call` | Sales (3) | Account manager, مسار fleet software | Branching discovery call with meters, facts, CRM logging, follow-up email | 4 | 12 | متقدّم |
| 6 | `hr-conflict-mediation` | HR (5) | HR business partner, نما tech | Two private sessions, one joint session, written resolution plan under policy | 4 | 12 | متوسط |
| 7 | `support-angry-customer` | Sales/CS (3) | Tier-2 support agent, بيتك appliances | Ticket triage, live chat with tension meter, compensation within authority, documentation | 3 | 10 | متوسط |
| 8 | `deal-recovery-real-estate` | Sales (3) | Sales director, دار المسكن | Root-cause picker, recovery call, contract redline, CRM update | 4 | 14 | متقدّم |
| 9 | `deal-recovery-medical` | Sales (3) | Government accounts, ميدكس | Same recovery topology, medical-device compliance constraints | 4 | 14 | متقدّم |
| 10 | `deal-recovery-food` | Sales (3) | Retail account manager, تمور الواحة | Same recovery topology, category-manager economics | 4 | 14 | متوسط |
| 11 | `deal-recovery-restaurants` | Sales (3) | Restaurant accounts, حصاد الخير | Same recovery topology, supply/quality/price conflict | 4 | 14 | متوسط |
| 12 | `ceo-competitor-response` | Management (20) | CEO, سلة الحي grocery delivery | Seeded 4-quarter market simulator: six levers, quarterly events, board meeting | 3 | 15 | متقدّم |

Three placeholders exist in `comingSoonLabs`: Governance (35) boardroom, HSE (33) site inspection,
Finance (29) quarterly close.

**Scoring dimensions per lab**

| Lab | Dimensions → skill |
|---|---|
| Marketing | target (execution), efficiency (analysis), audience (analysis), creative (communication), adaptation (decision), discipline (execution) |
| Sales call | discovery (analysis), objection (persuasion), rapport (empathy), closing (persuasion), CRM (execution), email (communication), talk ratio (communication) |
| Sales failure | plan (execution), funnel (analysis), questions (analysis), rejection (empathy), GPS (persuasion), follow-up (execution) |
| Objections (six types) | classify (analysis), bridge (persuasion), convert (persuasion), trust (empathy), questions (communication), CRM (execution) |
| Competitor ruler | hidden objection (empathy), ruler steps (analysis), amplify (persuasion), benefit barrier (persuasion), close (execution), discipline (decision) |
| HR | empathy, neutrality (communication), policy (decision), de-escalation (empathy), resolution (decision) |
| Support | de-escalation (empathy), empathy (communication), policy (decision), first-contact resolution (execution), cost (analysis), documentation (execution), CSAT (empathy) |
| Deals | diagnosis (analysis), recovery call (persuasion), fit (empathy), commercial discipline (decision), CRM (execution), talk ratio (communication) |
| CEO | share (strategy), cash (decision), NPS (analysis), morale (empathy), consistency (strategy), diagnosis (analysis), board (communication) |

### 3.3 Shared engines

| Engine | File | What it gives the author |
|---|---|---|
| Dialogue graph | `model/dialogue.ts` | Nodes, personas, three meters (trust, patience, tension), hidden tags, fact reveals, guards/breakpoints, transcript with simulated timestamps, talk ratio, `success / neutral / fail` outcomes |
| Ad market | `model/ad-market.ts` | Deterministic seeded campaign: CPM × bid × audience pressure × fatigue × competitor event; impressions, likes, clicks, frequency, spend |
| Market sim | `model/market-sim.ts` | 4 quarters, 12M SAR/quarter, 6 levers, scripted events, board trust, runway, NPS, morale |
| Documents | `components/documents/doc-types.ts` | Multi-page PDF-style business documents, redlinable clauses with acceptance/margin/value effects, forms that fill live |
| CRM | `components/crm/` | Pipeline stages, probabilities, values, activity timeline, next-step validation |
| Scoring | `model/scoring.ts` | Weighted dimensions → overall, readiness bands, strengths/tips, quiz scoring and behaviour style |
| Recommendations | `model/recommendations.ts` | Pin featured courses, then rank by title keywords; de-prioritise closed cohorts |

This is the most valuable asset in the feature: **content is data, engines are reusable**. A new
field pack can reuse an engine instead of inventing a new interaction model.

### 3.4 Scoring and gamification

- **Overall** = weighted average of dimensions (0–100).
- **Readiness**: ≥80 متميّز, ≥60 جاهز, otherwise مبتدئ.
- **XP** = `50 + overall × 2 + new badges × 50` (`scoring.ts`).
- **14 badges**: first lab, budget sniper, deal closer, peacemaker, share defender, cool head,
  deal saver, fair terms, objection reader, ruler master, rejection proof, funnel master,
  excellence (≥85), all-rounder (all labs).
- **Skill profile**: best attempt per lab, averaged per skill axis (7 axes).
- **Debrief**: radar, dimension bars, strengths, tips, timestamped highlights, pre/post quiz delta,
  behaviour style, new badges, confetti, next-lab suggestion, catalog recommendations.
- **Demo seed**: `POST /me/labs/demo` writes five labelled attempts (`source: "demo"`) to the mock API.

What is missing: levels, streaks, leaderboards, seasons, challenges, shareable cards, points,
certificates, CPD hours, team/cohort comparisons, and any server-side verification.

### 3.5 Recommendations

`useLabRecommendations`:

1. Maps `categoryLegacyId` to `legacy-category-{id}`.
2. Fetches all course + diploma cards in that category.
3. Pins `featuredCourseSlugs` (course-129, course-258 for the sales labs).
4. Ranks the rest by substring hits of `courseKeywords` in the **title**.
5. Returns 3 courses + 2 diplomas; degrades to an error panel when the API fails.

Limitations: no package/bundle/consultation/live/subscription suggestions; no use of `skills`,
`tags`, `learning_outcomes`, `short_description`, price, level or duration; keyword order is
hand-tuned per lab; closed cohorts are detected by a regex on the title (`انتهى التسجيل`).

### 3.6 Where labs appear

- `/labs` hub: live labs grouped by field, XP/completed/badges/attempt tiles, skill radar, badge
  grid, coming-soon cards.
- `/labs/[slug]`: briefing → phases → debrief.
- Student dashboard: `LabsSkillPanel` (radar + badges) and `LabsDashboardSection` (stats + three
  suggested labs), plus dashboard search entries for labs and the skill panel anchor.
- Insights: `LabsInsightsSection` — practice summary, behaviour map, timeline, dimension heatmap,
  observer observations, and a growth path. The growth path's **consultations and experts are mock
  data** (`student-insights/model/growth-mocks.ts`) even though the catalog has 92 consultation
  products and an expert API.
- Product recommendations from a lab are tracked with `surface: "lab-recommendations"`.

### 3.7 Tests

- `npm run test:labs` → **33 checks pass**. Covers the ad simulator determinism and targets, every
  dialogue graph's structure/termination, score bounds and best-path scores, CRM validation,
  redline economics, funnel maths, insights aggregation, growth mocks, recommendation pinning and
  catalog registration.
- E2E coverage is thin: the student dashboard test checks that search links to a lab and that the
  empty-state CTA points to `/labs`. **No end-to-end test walks a lab's phases, records an attempt,
  or checks the debrief.**
- No automated accessibility checks for sliders, drag/drop or dense dashboards.

---

## 4. The catalog and Academy fields

### 4.1 Product types (catalog snapshot)

| Type | Count | Commercial shape | Fields exposed by the public API |
|---|---|---|---|
| `course` | 266 | One LMS course; default access 365 days | `units[].lessons[]`, `lesson_count`, `duration_seconds`, `instructor_*`, `readme`/`sections`, `skills`, `tags`, `learning_outcomes`, `price`, `cpd_eligible`, `access_duration_days`, `media`, `intro_video_id` |
| `diploma` | 64 | Multi-course program | Same as course, plus program resources/categories |
| `package` | 15 | Fixed bundle of B2C courses (`package_items`) | `package_members[].required`, member `units`, `sections`, `readme`, `price`, `lesson_count` |
| `bundle` | 5 | Curated cross-type pack | `bundle_members[]` (course/diploma/consultation), `learning_outcomes`, `skills`, `tags`, `access_duration_days` |
| `consultation` | 92 | 1:1 expert session | `consultation.duration_minutes`, `expert_key`, `consultant_bio`, `available_slot_count`, `next_slot_at` |
| `live_diploma` | 5 | Cohort-based live program | `seat_capacity`, `seats_available`, `starts_at`, `schedule`, `session_count`, `cohorts`, `duration_hours`, `learning_outcomes`, `tags`, `marketing`, `readme` |
| `subscription` | 5 | Annual/monthly plan, Choose-X | Plan catalog (`product_type = subscription`), entitlements, selections |

### 4.2 Fields (top-level categories)

| Field | `legacy_category_id` | Catalog items* | Live labs | Coming soon |
|---|---|---:|---:|---|
| التسويق المتكامل | 27 | 120 | 1 | — |
| الادارة والأعمال | 20 | 86 | 1 | — |
| المبيعات وخدمة العملاء | 3 | 76 | 9 | — |
| الموارد البشرية والتدريب | 5 | 40 | 1 | — |
| المالية والمحاسبة | 29 | 33 | 0 | 1 |
| الذكاء الاصطناعي وتكنلوجيا المعلومات | 21 | 32 | 0 | — |
| الفاعلية الشخصية | 4 | 22 | 0 | — |
| قطاع التأمين | 30 | 15 | 0 | — |
| الصحة والسلامة المهنية | 33 | 15 | 0 | 1 |
| الميديا والتصميم | 6 | 15 | 0 | — |
| العلاقات العامة والإعلام | 32 | 14 | 0 | — |
| القطاع المصرفي | 34 | 12 | 0 | — |
| الحوكمة | 35 | 9 | 0 | 1 |

\* Sum exceeds the 452 distinct products because a product can sit in more than one category.

### 4.3 Field inventory by resource

| Resource | Fields it defines | Used by labs today? |
|---|---|---|
| `LabDefinition` | `slug`, `categoryLegacyId`, `categoryName`, `title`, `tagline`, `role`, `scenario`, `targets`, `constraints`, `skills`, `difficulty`, `minutes`, `color`, `phases`, `courseKeywords`, `featuredCourseSlugs` | This **is** the lab schema |
| `Attempt` | `slug`, `at`, `overall`, `readiness`, `dimensions`, `xp`, `badges`, `categoryLegacyId`, `categoryName`, `minutes`, `highlights`, `pre`, `post`, `signals`, `attemptNo` | Stored locally only |
| `Scorecard` | `overall`, `readiness`, `dimensions[]`, `highlights[]`, `strengths[]`, `tips[]`, `verdict` | Yes |
| Catalog card | `product_id`, `slug`, `product_type`, `title`, `short_description`, `image`, `price`, `category`, `instructor_name/avatar/key`, `lesson_count`, `duration_seconds`, `updated_at` | Card UI uses title, image, instructor, duration, price and description; ranking uses title and type only |
| `ProductResponse` | `product_id`, `slug`, `product_type`, `status`, `title`, `short_description`, `access_duration_days`, `cpd_eligible`, `category_id(s)`, `price`, `resource_id` | No |
| `ProductDetailResponse` | `readme`, `sections`, `units`/`lessons`, `learning_outcomes`, `skills`, `tags`, `fields`, `instructors`, `media`, `bundle_members`, `package_members`, `consultation`, `live_diploma`, `intro_video_id` | No |
| `ConsultationInfoResponse` | `duration_minutes`, `expert_key`, `consultant_name/avatar/bio`, `available_slot_count`, `next_slot_at` | Mocked in insights |
| `LiveDiplomaView` | `seats_available`, `starts_at`, `timezone_name`, `session_count`, `schedule`, `cohorts`, `duration_hours`, `learning_outcomes`, `tags` | No |
| Academy profile | goal, domain, level, target skills, onboarding state (`onboarding-store.ts`, `prefill.ts`) | No |
| LMS course | `progress_percent`, `status`, `expires_at`, `days_left`, quiz flags, `product_slug`, `entitlement_id`, `last_activity_at` | No |
| Planner item | `kind` (note/todo/study), `starts_at`, `is_done`, `product`, `reminder_minutes_before` | No |
| Certificate | `training_hours`, `cpd`, `cpd_hours`, `cpd_ref`, `status`, `verify_url`; settings have `auto_issue`, `completion_threshold_pct`, `cpd_enabled`, `physical_enabled` | No |
| Rewards ledger | `reward_points_accounts.points_balance`, `reward_points_transactions` (`txn_type`, `points`, `related_order_id`) | No |
| Community | `community_spaces(product_id, space_type)`, `community_memberships(entitlement_id)` | No |

### 4.4 What is actually populated (spot check)

- `course-129` (التعامل مع اعتراضات العملاء): 8 units, 51 lessons, 9,424s, README 1,721 chars,
  3 sections, cover image, instructor — but `learning_outcomes: []`, `skills: []`,
  `tags: ["consultation"]`, `price: null`.
- `course-258` (فشل المبيعات): 1 unit, 11 lessons, 1,555s, README 903 chars — `skills: []`,
  `learning_outcomes: []`, `tags: ["management", "sales"]`.
- `package-5` (مدير مشتريات محترف معتمد): 4 member courses with units and prices, 4 sections,
  README 2,284 chars, 8 tags naming the fields (`finance`, `procurement`, `supply-chain`,
  `warehouse`), but `skills: []` at package level and no units of its own.
- `digital-marketing-ai-bundle`: 365-day access, 3 skills, 3 outcomes, members across diploma,
  course and consultation — the richest cross-type object in the sample.
- `live-ai-workshop`: seats, schedule, cohorts, duration hours, outcomes and tags — but `skills: []`.
- A consultation sample: 45 minutes, expert key, bio, 0 available slots — no skills/tags.
- Onboarding options expose **44 skills and 28 tags**, so the taxonomy exists; coverage on products
  is uneven.

Implication: labs cannot rely on product skills/tags yet. Either enrich the catalog or let labs
declare skill/tag links directly, then backfill products from lab usage.

---

## 5. Coverage analysis

### 5.1 Field coverage

- **Covered (4/13)**: Marketing, Sales & CS, HR, Management — 12 labs.
- **Placeholder (3/13)**: Finance, HSE, Governance — 3 coming-soon cards, no content.
- **Untouched (6/13)**: AI & IT, Personal effectiveness, Insurance, Media & design, PR & media,
  Banking — 110 catalog items with no practice scenario.
- Sales & CS is over-weighted (9 of 12 labs) because four deal-recovery sectors share one topology;
  the count overstates diversity of mechanics.

### 5.2 Product-type coverage

| Type | Count | What labs do with it | What is left on the table |
|---|---:|---|---|
| `course` | 266 | Recommend 3 per lab by title keyword | Unit/lesson-level practice, prerequisites, completion rules, certificate link |
| `diploma` | 64 | Recommend 2 per lab | Capstone spanning the diploma, readiness proof, CPD |
| `package` | 15 | Nothing | Package-level practice track, required-member capstone, "what you will practise" on the package page |
| `bundle` | 5 | Nothing | Mixed course + diploma + consultation bundle → bundled lab seat and debrief |
| `consultation` | 92 | Mock cards in insights | Real expert debrief of an attempt, pre-consultation diagnostic, expert-authored scenario |
| `live_diploma` | 5 | Nothing | Cohort lab, live leaderboard, facilitator-run simulation, seat-based access |
| `subscription` | 5 | Nothing | Subscriber lab library, monthly challenge, team seats and manager reporting |

### 5.3 Catalog field usage by labs

| Field | Consumed? | Today | Opportunity |
|---|---|---|---|
| `product_type` | Partly | Filters courses/diplomas | Route each type to its own lab format (course → drill, consultation → debrief, live → cohort) |
| `category` | Yes | `legacy_category_id` groups labs and recommendations | Category as the field spine; watch legacy-id drift |
| `title` | Yes | Keyword ranking and pinned slugs | Use title + `short_description` + README embeddings |
| `skills` / `skill_id` | No | — | Match lab axes to catalog skills; prerequisite and gap analysis |
| `tags` | No | — | Field/topic routing, search, related labs |
| `learning_outcomes` | No | — | Generate targets/constraints; certificate claims |
| `readme` / `sections` | No | — | Briefing source, "learn before you start", citation of course content |
| `units` / `lessons` | No | — | Chapter-level mini-labs, time estimates, resume points |
| `duration_seconds` / `lesson_count` | Cards only | Product cards | Practice-path time budgeting |
| `price` / `compare_at` | Cards only | Product cards | Offer "practice included" bundles, upgrade paths |
| `access_duration_days` | No | — | Lab access tied to entitlement expiry; extension reminders |
| `cpd_eligible` | No | — | CPD-bearing practice, certificate add-on |
| `instructors` / `expertise_json` | No | — | Expert-authored labs, debrief booking, credibility |
| `bundle_members` / `package_members` | No | — | Capstones, bundle-level practice paths |
| `consultation` | Mock only | `growth-mocks.ts` | Real slots and expert keys in the growth path |
| `live_diploma` cohorts | No | — | Cohort competition and live workshops |
| `media` / `intro_video_id` | No | — | Contextual clips inside a phase, evidence upload |

### 5.4 Academy surface coverage

| Academy surface | Status | Labs connection |
|---|---|---|
| LMS courses/quizzes/progress | Live API | None; no lab is launched from or written back to a lesson |
| Insights (activity, skills, planner) | Live | Reads labs locally; no server merge |
| Planner | Live | No lab sessions, retakes or reminders |
| Certificates + CPD | Live | No practical requirement or CPD contribution |
| Consultations | 92 products, live booking | Mock recommendations only |
| Live diplomas/cohorts | 5 products | No cohort lab or leaderboard |
| Rewards points | Schema only (`rewards` module) | XP never reaches the ledger |
| Community | Schema only (`community` module) | No debrief spaces |
| Subscriptions | Products/pages exist; handbook still lists as not started | No subscriber-specific labs |
| Referrals/Tolt | Referrals live; Tolt not built | No shareable proof or referral hook |

---

## 6. Findings

**F1 — Field coverage is narrow and lopsided.** Four fields have labs; six have nothing. Sales &
CS has 9 of 12 labs, four of which share the deal-recovery topology. The catalog's largest fields
after sales — marketing (120 items) and management (86) — have one lab each.

**F2 — Recommendations ignore five of seven product types.** A learner who finishes a sales lab is
never shown the 92 consultations, 15 packages, 5 bundles, 5 live cohorts or 5 subscriptions that
could continue the journey. Only courses and diplomas appear, and only from the same category.

**F3 — Matching is brittle and opaque.** Ranking is substring matching against a hand-ordered
keyword list on the title. It ignores skills, tags, outcomes, descriptions and price. Three labs pin
`course-129` and `course-258`; if those products are renamed, the pin silently falls back without
any signal.

**F4 — Progress is device-bound and invisible to the business.** The mock API is server-shaped but
persists in one browser's `localStorage`. There is no real account merge, no cross-device history,
no admin UI, no export and no recovery after clearing site data. The contract, migration and demo
source labels are ready for the backend, but the data still leaves with the browser.

**F5 — The Academy's learning record is not connected.** Labs neither read the learner's onboarding
target skills nor write completion back to the LMS. A lab cannot be a prerequisite, a lesson
activity, a capstone or a certificate requirement. `progress_percent`, `expires_at` and
`entitlement_id` are never consulted, so an expired learner can still practise and a fresh learner
gets no guided sequence.

**F6 — Gamification is shallow relative to the Academy's own rules.** XP and badges do not touch
the rewards ledger (10 points per $1; 1,000 points = $10), CPD hours, certificates, streaks or the
planner. There are no levels, leaderboards, seasons, challenges or shareable proof. The strongest
motivator for a career switcher — a verified portfolio — does not exist.

**F7 — Assessment is deterministic and memorisable.** Dialogue outcomes depend on fixed choices;
only the ad and market simulators use a seed. The mock adds version pinning, sequence/idempotency
checks and server-side score recomputation, but there is still no variant generation, rubric
version history, attempt replay, anti-cheat or a real server-authoritative runtime. A learner can
memorise the best path and score 100 on the second attempt without practising the skill.

**F8 — Authoring is code-only.** Twelve labs are hardcoded TypeScript; adding a lab means editing
`catalog.ts`, writing content and scoring, adding a runner switch, a component tree and tests, then
deploying. There is no CMS, no preview, no locale other than Arabic, no SME review workflow and no
lab version history. This is the main cost driver for covering nine more fields.

**F9 — AI and social are absent by design.** Personas are scripted and text-only. There is no free
text, voice, dialect variation, multi-agent stakeholder, multiplayer role-play or expert-led
session — all of which the product vision in `docs/mastery-feature.txt` describes as the
differentiator. The scripted engine is a good fallback and a good rubric anchor, not the end state.

**F10 — The growth path uses mock consultations and experts.** The insights page recommends
consultation services and experts from `growth-mocks.ts`, labelled as demo data, while the catalog
already exposes 92 consultation products with `expert_key`, duration and slot counts. This is the
cheapest high-credibility fix in the feature.

**F11 — Analytics cannot answer product questions.** The mock now records sessions, ordered actions,
attempts and admin analytics endpoints, but there is no warehouse/funnel instrumentation
(view → start → phase → complete → retry → product click) and no admin screen to read it. Insights
still run over the learner's own attempts.

**F12 — Some gamification may misfit senior personas.** The Academy serves executives (Abdulaziz)
and managers as well as early-career learners (Salma, Ali). Leaderboards and streak pressure are
motivating for the latter and can feel juvenile to the former; gamification needs segmentation and
opt-outs.

---

## 7. Recommendations

Recommendations are grouped by theme. Each anchors to catalog products/fields and states the
smallest useful version.

### 7.1 Content and scenarios

**R1 — Ship "field packs" for the six uncovered fields and finish the three placeholders.**
Reuse existing engines; do not build a new engine per field.

| Field                         | Scenario idea                                                                          | Engine                                        | Catalog fields used                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Finance (29)                  | Quarterly close with reconciliation gaps; budget-variance review; expense-fraud triage | Document + spreadsheet-style table + dialogue | `finance/accounting`, `finance/financial-management`, `data/excel`, `data/kpi` skills; finance courses/packages |
| Governance (35)               | Boardroom compliance breach; conflict-of-interest disclosure                           | Document redline + board dialogue             | Governance courses (9); `readme`/`sections`; certificate settings                                               |
| HSE (33)                      | Site inspection; near-miss escalation; evacuation decision                             | Checklist + map/risk board + dialogue         | HSE courses (15); `learning_outcomes`; CPD                                                                      |
| AI & IT (21)                  | AI adoption brief; incident response; prompt-to-prototype review                       | Simulator + document + dialogue               | `technology/ai`, `programming/*`, `data/analysis`; AI courses (32)                                              |
| PR & media (32)               | Crisis statement in 30 minutes; hostile interview                                      | Dialogue (journalist persona) + document      | PR courses (14); `communication/presentation`, `communication/business-writing`                                 |
| Banking (34) / Insurance (30) | Credit decision under pressure; disputed claim negotiation                             | Case file + dialogue + policy check           | Banking (12) / insurance (15) courses; `finance/*` skills                                                       |
| Personal effectiveness (4)    | Priority triage; difficult conversation; energy/workload plan                          | Planner board + dialogue                      | Personal-effectiveness courses (22); `business/leadership`                                                      |
| Media & design (6)            | Creative brief critique; campaign asset review                                         | Document + rubric                             | Media/design courses (15); `marketing/*` skills                                                                 |

**R2 — Add a "practice" entry point on every product page.** A 3–5 minute teaser lab tied to the
product's `skills`/`tags`, with the full lab unlocked after purchase or subscription. Fields:
`product_type`, `skills`, `tags`, `learning_outcomes`, `readme`. This converts the lab from a
standalone demo into a pre-purchase evaluation tool (the "evaluation" stage of the 9-stage spine).

**R3 — Make lab content data, not code.** Define a versioned `LabDefinition` JSON (briefing,
phases, engine config, rubric, recommendations, locale) and render it with the existing engines.
This is the prerequisite for R1 at scale and for R11 (AI-assisted authoring).

**R4 — Add retry variants.** For dialogues, vary persona mood, hidden facts, one objection and the
opening line per attempt; for simulators, vary seed and one market event. Keep the rubric fixed
and versioned. This directly addresses memorisation (F7) without new content.

### 7.2 Learning integration and pathways

**R5 — Persist attempts server-side and merge anonymous progress on login.** New tables/endpoints
in §8. The local store stays as offline cache; the server becomes the source of truth. This unlocks
every item below and fixes F4/F5/F11.

**R6 — Practice paths: course → lab → retake → assessment → certificate.** For a course or diploma,
define a path: prep lab (before), chapter drills (during), capstone (after), retake until readiness
≥75. Fields: `units`/`lessons` (chapter mapping), `duration_seconds` (time budget),
`access_duration_days` (window), `cpd_eligible`/certificate settings (CPD and practical
distinction).

**R7 — Capstones for diplomas, packages and bundles.** A diploma capstone spans its courses; a
package capstone requires all `required` `package_members`; a bundle capstone can include a
consultation debrief (`bundle_members` already mixes course, diploma and consultation). Show
"what you will practise" on the product page from the capstone's skills.

**R8 — Replace mock consultations with the real catalog.** Use `consultation.duration_minutes`,
`expert_key`, `available_slot_count`, `next_slot_at` to recommend a 30/45/60-minute debrief after a
weak attempt, and offer a "lab + debrief" bundle. This is a small change with high credibility
(F10) and a direct revenue path.

**R9 — Put labs inside the LMS lesson flow.** Launch a lab from a lesson, return the attempt to the
LMS, and gate completion on a passing attempt. Fields: `lms_course_id`, `entitlement_id`,
`progress_percent`, `product_slug`. This is what makes "learning by doing" part of the product
rather than a side page.

**R10 — Use the planner and insights for spaced practice.** After a weak attempt, create a planner
item (`kind: "study"`) for a retake, with a reminder. Use `activity.current_streak` and
`longest_streak` to award practice streaks, and `insights.skills[].priority/coverage` to choose
the next lab. Fields: planner items, activity summary, skill coverage.

### 7.3 Gamification

**R11 — Gamification 2.0, tied to the Academy's rules, with guardrails.**

| Mechanic | Design | Data |
|---|---|---|
| Levels | 5 levels per field (مبتدئ → متمكّن) from best attempt + coverage | attempt dimensions, lab skills |
| Streaks | Weekly practice streak (distinct from learning streak, then merge) | planner, activity summary |
| Leaderboards | Per field and per cohort, opt-in, top 10 + personal rank; no executive leaderboard by default | server attempts, cohort membership |
| Seasons/challenges | Monthly field challenge (e.g., "close the quarter") with a badge and CPD hours | lab definitions, cohorts |
| Shareable card | Signed image/URL with lab, score, top skill, verification code | attempt + HMAC |
| Points | **Do not** map XP 1:1 to cash points. Use a separate "practice XP" for levels/badges; if points are awarded, cap them (e.g., 100/lab, 300/week) and separate the ledger type | `reward_points_transactions.txn_type` |
| Certificate | "Practical distinction" endorsement or CPD hours for verified lab completion | certificate settings (`cpd_enabled`, `cpd_hours`, `completion_threshold_pct`) |
| Portfolio | Export verified attempts as a skill portfolio with rubric, date and reviewer | attempts, highlights, badges |

The points decision matters: the Academy rule is 10 points per $1 and 1,000 points = $10. A lab
worth ~150–350 XP would be worth $1.50–$3.50 if converted 1:1, which is far too generous relative
to a $200 course (2,000 points = $20). Keep practice XP non-monetary, or cap and ring-fence it.

**R12 — Segment gamification by persona.** Career switchers and early-career learners get
leaderboards, streaks and challenges; executives get a private readiness score, benchmark against
role expectations and a debrief booking, with leaderboards opt-in only.

### 7.4 Platform, authoring and scale

**R13 — Authoring studio (admin).** CRUD for lab definitions, rubric editor, preview, publish/
unpublish, locale, version history, SME review, and "generate draft from a product README".
Reuse the existing Studio patterns. Permissions: `admin:labs:*`. This is the only way to reach
13 fields without a code deploy per lab (F8).

**R14 — Analytics and experimentation.** Instrument: `lab_viewed`, `lab_started`,
`phase_completed`, `lab_completed`, `lab_retried`, `recommendation_clicked`, `product_clicked`,
`consultation_clicked`, `share_clicked`. Add A/B variants for briefing, difficulty and
recommendation logic. Report by field, product, cohort and persona.

**R15 — B2B and cohort labs.** Company subscriptions and live cohorts can buy seats: assign a lab
to a team, see completion/readiness by member, compare before/after, export a manager report.
Fields: company subscription seats, `live_diploma.cohorts`, `community_spaces.product_id`.
This is also a hiring/assessment product (with consent and anti-cheat).

**R16 — Community debriefs.** Product-scoped or cohort-scoped spaces where learners post a
scorecard and discuss; experts can answer. Fields: `community_spaces(product_id, space_type)`,
`community_memberships(entitlement_id)`. Start read-only (share card + thread) to limit moderation
cost.

**R17 — Hybrid AI personas.** Keep the deterministic engine for structure and scoring; add an LLM
actor for free-text/voice within guardrails, and a separate observer that scores against the fixed
rubric. Route simple turns to a small model, complex negotiation to a larger one; cache scenario
prompts. Add Gulf/Egyptian/Levantine dialect variants. Do this **after** R5 and R4 so attempts and
rubrics are versioned and replayable.

---

## 8. Proposed data model and API

Minimum server model (SQL Server, `b2c` schema), designed to keep the current engines:

| Table | Purpose | Key columns |
|---|---|---|
| `b2c.lab_definitions` | Published lab content | `lab_id`, `slug`, `field_category_id`, `product_ids_json`, `skill_ids_json`, `tag_ids_json`, `title`, `tagline`, `role`, `scenario`, `targets_json`, `constraints_json`, `difficulty`, `minutes`, `phases_json`, `engine`, `status`, `locale`, `version`, `published_at` |
| `b2c.lab_versions` | Immutable rubric/content versions | `lab_version_id`, `lab_id`, `version`, `content_json`, `rubric_json`, `published_at` |
| `b2c.lab_attempts` | One run | `attempt_id`, `customer_id` (nullable), `anonymous_id`, `lab_id`, `lab_version_id`, `seed`, `started_at`, `completed_at`, `duration_seconds`, `overall`, `readiness`, `xp`, `source_surface`, `device_json` |
| `b2c.lab_attempt_dimensions` | Scored axes | `attempt_id`, `key`, `label`, `score`, `weight`, `skill`, `praise`, `tip` |
| `b2c.lab_attempt_events` | Phase/telemetry events | `attempt_id`, `phase`, `at`, `payload_json` |
| `b2c.lab_badges` | Earned badges | `customer_id`, `badge`, `attempt_id`, `earned_at` |
| `b2c.lab_assignments` | Cohort/team assignment | `assignment_id`, `lab_id`, `cohort_id`/`company_id`, `due_at`, `required` |
| `b2c.lab_product_links` | Lab ↔ product relation | `lab_id`, `product_id`, `relation` (`prep`, `capstone`, `debrief`) |

APIs:

- `GET /api/v1/labs`, `GET /api/v1/labs/{slug}` — public catalogue (cards, not full content).
- `POST /api/v1/labs/{slug}/attempts` — start; returns attempt id, version, seed, signed token.
- `PATCH /api/v1/me/labs/attempts/{id}` — complete; server validates the replay/score and stores it.
- `GET /api/v1/me/labs`, `/me/labs/insights`, `/me/labs/portfolio` — history and aggregates.
- `GET/POST/PATCH /api/v1/admin/labs` — authoring, publish, versions (permissioned).
- `POST /api/v1/admin/labs/{id}/assignments` — cohort/team assignment.

Integrity: the deterministic engines are small enough to replay server-side from the seed and the
recorded choices; do that for scored attempts rather than trusting the client. Sign the attempt
token, rate-limit completion, version the rubric, and keep an immutable event log.

Privacy: attempts are behavioural data. Capture consent for analytics and AI training separately,
define retention (e.g., 24 months), support export/delete, and never send raw transcripts to a
third-party model without a DPA and PII scrubbing.

---

## 9. Roadmap

| Horizon | Deliverable | Why now | Effort | Impact |
|---|---|---|---|---|
| **Now (0–6 weeks)** | Server attempts + anonymous merge (R5) | Unblocks everything; fixes lost progress | M | High |
| Now | Product links + real consultation recommendations (R2, R8) | Cheap, visible, revenue-linked; kills mock data | S | High |
| Now | Lab event instrumentation + funnel dashboard (R14) | You cannot prioritise without activation/drop-off data | S | Medium |
| Now | Two field packs: Finance close, HSE inspection (R1) | Fills two of three placeholders with existing engines | M | High |
| **Next (6–12 weeks)** | Governance boardroom + 3 more field packs (R1) | Completes 10/13 fields | M | High |
| Next | Practice paths and LMS write-back (R6, R9) | Turns labs into the learning model, not a side demo | L | High |
| Next | Capstones for diploma/package/bundle (R7) | Uses existing `package_members`/`bundle_members` | M | High |
| Next | Authoring studio v1 (R13) | Removes code-deploy cost per lab | L | High |
| Next | Gamification v1: levels, streaks, opt-in leaderboards (R11, R12) | Retention, without cash-point risk | M | Medium |
| Next | Certificate practical distinction + CPD (R11) | Differentiator vs video libraries | M | High |
| **Later (3–6 months)** | Hybrid AI personas, free text, voice, dialects (R17) | The vision's differentiator; needs R4/R5 first | L | High |
| Later | Cohort/live labs and B2B team labs (R15) | Higher ACV, manager reporting | L | High |
| Later | Community debriefs (R16) | Retention and social proof | M | Medium |
| Later | Verified portfolio export (R11) | Replaces static certificates with proof of doing | M | Medium |

Sequencing rule: **do not start AI personas before attempts are server-side and rubrics are
versioned**. Otherwise there is no fair, replayable record to evaluate against.

---

## 10. Success metrics

| Layer | Metric | Target shape |
|---|---|---|
| Activation | % of new signed-in learners completing 1 lab within 7 days | Baseline → +10 pts |
| Practice depth | Labs per active learner per month; minutes per lab | 2+ labs; 12–18 min |
| Learning gain | Pre/post quiz delta; readiness ≥75 rate | ≥15 pts; ≥50% |
| Conversion | Lab completion → course/diploma/package purchase; lab → consultation | Measure per field |
| Retention | 30/90-day return; weekly practice streak | +5 pts |
| Content | Completion rate per lab; drop-off phase; attempts to readiness | Identify bottom 3 labs |
| Trust | Share cards clicked; certificate verify views; complaints | Monitor |
| Business | Incremental revenue per lab cohort; B2B seats; bundle attach | Per quarter |

Guardrails: refund rate, support tickets, time-to-first-value, AI cost per attempt (target < $0.10
for text, < $0.50 for voice), and p95 latency (< 2s per turn).

---

## 11. Risks and guardrails

- **Points arbitrage** — never convert practice XP to cash points 1:1; cap, ring-fence and audit.
- **AI cost and latency** — hierarchical routing, prompt caching, deterministic fallback; cap free
  runs per month (the vision's "credits" model).
- **Assessment fairness** — versioned rubrics, server replay, human review for high-stakes
  certificates, appeals path.
- **Content cost** — reuse engines, author from READMEs, SME review, start with 3–5 strong labs per
  field rather than 20 shallow ones.
- **Safety** — simulated finance/medical/legal advice needs explicit "training simulation"
  disclaimers and no real client data.
- **Privacy** — behavioural telemetry and transcripts need consent, retention and deletion.
- **Persona fit** — leaderboards opt-in; executive experience defaults to private benchmarking.
- **Localisation** — Arabic first, but English is needed for multinational employers; dialect
  variants need native review.
- **Legacy-id drift** — labs key on `legacy_category_id`; add a startup/test check that every lab
  category exists, or move to B2C category UUIDs.

---

## 12. Open questions

1. Are labs a free acquisition surface, a paid product, or a subscription/bundle inclusion?
2. Which segment is the beachhead: B2C skill upgraders (Salma), career switchers (Ali), executives
   (Abdulaziz), or B2B teams?
3. Should a practical lab score gate certificate issuance, or only add a "distinction" mark?
4. Do labs award CPD hours, and if so, what is the verified-hour formula?
5. Should XP ever become reward points? If yes, what cap and which ledger type?
6. Build or buy the AI persona layer? Which provider, data residency and dialect coverage?
7. Who authors and signs off field content — internal SMEs, contracted experts, or both?
8. Is English (or a second locale) required in the next 12 months for enterprise deals?
9. What is the retention period and consent model for attempt transcripts and voice?
10. Does the business want a hiring/assessment product from the same engine, or keep labs purely
    for learning?

---

## 13. Adding a lab today (current checklist)

1. Add a `LabDefinition` to `model/catalog.ts` (slug, category, copy, targets, constraints, skills,
   difficulty, minutes, colour, phases, keywords, featured slugs).
2. Add the slug to `LabSlug` in `model/types.ts` and any union types.
3. Write the scenario/content under `content/<lab>/` (dialogue graph or simulator config, quizzes,
   rubric, signals, badges).
4. Build the runner component under `components/<lab>/` and register it in
   `components/lab-page.tsx`.
5. Add the engine/scoring tests to `scripts/test-labs.ts`; keep bounds and best-path assertions.
6. Confirm the category exists (`legacy-category-{id}`) and the featured slugs are published.
7. Run `npm run test:labs` and `npm run check`; a lab page is statically generated, so a build is
   needed to see a new slug.

This checklist is the argument for R13: each new field pack repeats steps 1–7 in code.

---

## 14. Mock API and service layer (implemented)

The feature now has a backend-shaped data boundary while the real module is designed.

### 14.1 Layers

| Layer | Files | Responsibility |
| --- | --- | --- |
| Contract | `api/contract.ts` | DTOs, `LabAction` union, admin/generation/analytics shapes, snake_case + ISO timestamps |
| Endpoints | `api/endpoints.ts` | Path builders and operation names matching the planned FastAPI routes |
| Transport | `api/client.ts` | `mock` (default) or `live` via `NEXT_PUBLIC_LABS_API_MODE`; mock is dynamically imported |
| Mock server | `api/mock/server.ts` | Method/path router, requirements, sessions, actions, completion, admin CRUD/publish/analytics |
| Mock state | `api/mock/db.ts`, `storage.ts` | Typed tables, localStorage/memory adapters, pruning, schema version |
| Seed/fixtures | `api/mock/seed.ts` | 12 legacy labs + finance/HSE/governance schema labs + recommendation cards |
| Scoring | `api/mock/scoring.ts` | Existing pure scorers for legacy labs; rubric evaluation for schema labs |
| Validation | `api/mock/validate.ts` | Pathway edges, refs, reachability, required scoring/locales |
| Migration | `api/mock/migrate.ts` | One-time import of `localStorage["ma-labs"]` attempts/badges |
| Services | `api/services/*.ts` | Typed calls + React Query keys for labs, sessions, attempts and admin |
| Hooks | `api/hooks/*.ts` | `useLabSession`, `useLabsSnapshot`, reset/demo mutations |

### 14.2 Endpoints implemented by the mock

Public/customer: `GET /labs`, `GET /labs/{slug}` (and `?preview=1`), `GET /labs/{slug}/recommendations`,
`POST /labs/{slug}/sessions`, `GET /me/labs/sessions/{id}`,
`POST /me/labs/sessions/{id}/actions|complete|abandon`, `GET /me/labs/attempts[/{id}]`,
`GET /me/labs/insights`, `GET /me/labs/portfolio`, `POST /me/labs/demo`, `DELETE /me/labs/attempts`.

Admin: `GET/POST /admin/labs`, `GET/PATCH/DELETE /admin/labs/{id}`, `GET/PUT /admin/labs/{id}/draft`,
`POST .../validate|publish|unpublish|archive|duplicate|preview`, `GET .../versions[/{v}]`,
`POST .../versions/{v}/restore`, `GET .../analytics|attempts`, attempt `flag|reset|override-score`,
assignments, release, generation `generate|{job}|apply`, overview/templates/fields, assets,
export/import.

The full future list (with scopes and tables) is in
`newwebsitebackend/app/modules/labs/README.md`; the admin design is in
`mastery-admin-public/docs/labs-admin.md`.

### 14.3 Session and action protocol

- `POST /labs/{slug}/sessions` pins the published version, evaluates requirements and returns
  `{ session_id, lab_version, state, seed, requirements }`.
- Actions are discriminated: `phase.enter`, `quiz.submit`, `dialogue.choose`, `form.submit`,
  `simulator.step`, `document.redline`, `crm.update`, `commitment.set`.
- Every action carries `seq` and `client_action_id`; stale sequences return `409`, replays are
  idempotent.
- Completion sends the legacy run snapshot (or schema answers); the mock recomputes the scorecard,
  signals, XP and badges with the same rules as the UI. If the API is unavailable, the existing
  local scorer is the fallback and the attempt is marked `unsynced`.
- All 12 runners now start a session and emit their phase/decision actions. The bespoke engines
  still own local UI state; the server is the record of what happened.

### 14.4 Schema runtime slice

Three admin-style fixtures (`finance-quarter-close`, `hse-site-inspection`, `governance-boardroom`)
are defined as data (fields + pathway + personas + requirements + rubric). `SchemaLab` renders
them generically (brief, form, choice/dialogue, end) and posts the same action protocol. They are
reachable at `/labs/preview/{slug}` (mock only) and `/preview/lab` (admin `postMessage` preview).
The 12 shipped labs stay on their bespoke runners with `engine: "legacy"`.

### 14.5 Persistence and migration

- Mock DB key: `ma-labs-api-v1`; schema version 1; tables for labs, versions, sessions, attempts,
  events, badges, assignments, generation jobs, assets and audit.
- One-time migration from `ma-labs` preserves attempts, XP and badges; the old key is untouched.
- Attempts are capped at 500, sessions at 200, events at 500/session; oldest are pruned.
- `POST /me/labs/demo` seeds labelled demo attempts; `source` keeps them out of business analytics.
- Storage quota/private-mode failures fall back to memory for the page; labs keep working.

### 14.6 Tests

- `npm run test:labs` — 33 engine checks (unchanged).
- `npm run test:labs:api` — 11 mock/contract checks: catalogue/preview, requirements, schema
  completion, legacy scorer completion, idempotency/sequence, legacy stage ids, admin
  create/duplicate/publish/version/analytics, generation, migration and reset.

### 14.7 Limitations

- The mock is still a browser demo: no real auth, no cross-device sync, no server-side anti-cheat.
- Legacy lab scoring still runs the existing client engines; only schema labs are fully
  server-scored.
- Admin endpoints exist only in the mock; there is no admin UI yet.
- The live transport is wired but points at endpoints that do not exist until the backend module
  ships.
- AI generation is a deterministic template in the mock; no model is called.

---

## 15. Company journey labs «نقطة» (added 15 Nov 2026)

Six bespoke, scripted labs follow one fictional Riyadh SaaS, «نقطة» (cap table: two Saudi
founders + an Egyptian investor at 30%). Shared data: `content/nuqta/company.ts`; regulatory
sources and the training disclaimer: `content/nuqta/sources.ts` (rendered by
`components/workspace/sources-panel.tsx` on every briefing and debrief). The `/labs` hub shows
them in order in `components/workspace/journey-strip.tsx`.

| # | Slug | Field | Mechanic | Engine | Badge |
|---|---|---|---|---|---|
| 1 | `startup-company-registration` | الادارة والأعمال (20) | Legal form → articles redline → government-portal run with prerequisites/rejections → returned-CR dialogue | `model/portal-flow.ts` | `founder` |
| 2 | `governance-first-board` | الحوكمة (35) | Board design → delegation-of-authority matrix → conflict of interest → board meeting → minutes redline | dialogue + redline | `governance-guardian` |
| 3 | `cfo-forecast-runway` | المالية والمحاسبة (29) | Actuals diagnosis → 18-month driver model (base/downside/upside) → funding choice → investor Q&A | `model/forecast-sim.ts` | `runway-keeper` |
| 4 | `finance-quarter-close` | المالية والمحاسبة (29) | Close calendar → bank rec workbench → adjusting entries → VAT return (reverse charge, blocked inputs) → variance analysis → CFO/auditor review | `model/close-engine.ts` | `clean-close` |
| 5 | `crisis-data-leak` | الادارة والأعمال (20) | Six rounds over 72 simulated hours, event feed, decision cards, 5 stakeholder meters, PDPL 72h notice → press-statement redline | `model/crisis-clock.ts` | `crisis-commander` |
| 6 | `audit-escape-room` | المالية والمحاسبة (29) | 45 simulated minutes, five locks opened by computed codes (materiality, fake vendor, cut-off, related party, manual JE), hints cost time → acquisition memo | `model/escape-locks.ts` | `escape-artist` |

Shared UI in `components/workspace/`: `portal-window`, `event-feed`, `countdown`,
`checklist-board`, `redline-editor` (generic version of the deals redline step), `sources-panel`,
`journey-strip`.

Notes:

- The finance and governance "coming soon" cards are gone; HSE stays.
- The old schema fixture that used the `finance-quarter-close` slug is now `finance-accrual-review`;
  `governance-boardroom` (draft fixture) is unchanged. `api/mock/db.ts` tops up older saved mock
  DBs with newly shipped labs and lets a legacy lab take back its slug from a schema fixture.
- Regulatory facts were checked on 15 Nov 2026 against public (mostly law-firm/consultancy)
  summaries; fees, GOSI rates and e-invoicing waves are indicative. Re-check before external demos.
- Tests: `npm run test:labs` (46 checks, incl. best/worst paths for all six) and
  `npm run test:labs:api` (13 checks, incl. a journey completion and the DB top-up).

## Appendix A — Snapshot (13 Nov 2026)

| Item | Count |
|---|---:|
| Live labs | 12 |
| Coming-soon labs | 3 |
| Fields (top-level categories) | 13 |
| Fields with live labs | 4 |
| Catalog items | 452 |
| Courses / diplomas / packages / bundles | 266 / 64 / 15 / 5 |
| Consultations / live diplomas / subscriptions | 92 / 5 / 5 |
| Skills / tags in onboarding options | 44 / 28 |
| Lab badges | 14 |
| Lab skill axes | 7 |
| Lab engine checks passing | 33 |

## Appendix B — Related documents

- Product vision, personas, journeys: `docs/mastery-b2c-product-handbook.html`
- Catalog migration and fields: `docs/mastery-b2c-catalog-migration.md`
- AI-agent and learning-by-doing vision: `docs/mastery-feature.txt`
- Brand and voice: `design_system/mastery-academy-design-kit/README.md`
- Quiz/attempt reporting: `src/features/student-insights/model/lab-insights.ts`
- Recommendations: `src/features/labs/model/recommendations.ts`
- Lab catalogue: `src/features/labs/model/catalog.ts`
- Certificate rules: `newwebsitebackend/app/modules/certificates/README.md`
- Rewards ledger (schema only): `newwebsitebackend/app/modules/rewards/README.md`
- Community schema (schema only): `newwebsitebackend/app/modules/community/README.md`
