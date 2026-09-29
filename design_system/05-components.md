# 05 · Components

All classes live in `components.css`. They are plain HTML/CSS (no framework), use tokens only, and work in RTL/LTR and both themes. Port them 1:1 to React/Vue/etc. by keeping the class names.

Shared rules: `border-radius: 0`, no shadows, 1px borders, 150ms colour transitions, 2px purple `:focus-visible` ring, touch targets ≥ 44px.

---

## Button / CTA — `.ma-btn`

### Variants
| Class | Look (light) | Look (dark) | Use |
|---|---|---|---|
| `.ma-btn--primary` | coral fill, ink text | same | THE main action. Max one per view |
| `.ma-btn--secondary` | ink fill, white text | white fill, ink text | Strong second action ("Resume", "Browse courses") |
| `.ma-btn--outline` | transparent, 1px ink border | 1px white border | Neutral alternative ("Log in", "View all") |
| `.ma-btn--ghost` | text only, coral underline on hover | same | Low-emphasis inline action ("View syllabus") |
| `.ma-btn--on-color` | ink fill, white text (fixed) | same | CTA placed on a coral/colour field |

### Sizes
| Class | Height | Padding | Font |
|---|---|---|---|
| `.ma-btn--sm` | 36px | 8 / 16 | 14/20 |
| (default) | 48px | 12 / 24 | 16/24 |
| `.ma-btn--lg` | 56px | 16 / 32 | 18/24 |
| `.ma-btn--block` | full width | — | — |
| `.ma-btn--icon` | 48×48 square, needs `aria-label` | — | — |

### States
| State | Primary | Secondary | Outline | Ghost | On-colour |
|---|---|---|---|---|---|
| Default | coral / ink | text / surface | border line-strong | text | ink / white |
| Hover | → ink (text) fill, surface text | → coral fill, ink text | → text fill, surface text | 3px coral underline | → white fill, ink text |
| Pressed (`:active`) | coral + 1px text-colour border | text fill + coral border | back to transparent | 3px text-colour underline | ink + white border |
| Focus (`:focus-visible`) | 2px `--focus` ring, 2px offset — all variants |||||
| Disabled (`:disabled`, `aria-disabled`) | transparent, muted text, `--line` border — all variants |||||
| Loading (`.is-loading` + `aria-busy="true"`) | label hidden, width kept, rotating square in the label colour |||||

`.is-hover`, `.is-active`, `.is-focus` exist only to document states statically.

### Markup
```html
<button class="ma-btn ma-btn--primary" type="button">Enrol now</button>
<a class="ma-btn ma-btn--secondary" href="/courses">Browse courses</a>
<button class="ma-btn ma-btn--outline ma-btn--sm" type="button">Log in</button>

<!-- with icon; .ma-icon-dir flips in RTL -->
<a class="ma-btn ma-btn--primary ma-btn--lg" href="/start">
  ابدأ التعلّم الآن <svg class="ma-icon-dir" aria-hidden="true"><use href="#i-arrow"/></svg>
</a>

<!-- icon-only -->
<button class="ma-btn ma-btn--outline ma-btn--icon" type="button" aria-label="Search">
  <svg aria-hidden="true"><use href="#i-search"/></svg>
</button>

<!-- loading -->
<button class="ma-btn ma-btn--primary is-loading" aria-busy="true" type="submit">Create account</button>
```

### CTA patterns
| Pattern | Composition |
|---|---|
| Hero pair | primary `--lg` + outline `--lg`, primary first in reading order |
| Nav | ghost `--sm` "Log in" + primary `--sm` "Start free" |
| Card | whole card is the link; no button inside, or one outline `--sm` |
| Coral CTA band | headline + `--on-color --lg`; optional ghost in ink |
| Sticky enrol (mobile) | bottom bar, primary `--block` |
| Forms | primary submit, `--block` on mobile; cancel = ghost |

### CTA copy
- Verb + outcome, 1–3 words: "Enrol now", "Start free", "Resume lesson", "ابدأ مجانًا", "تابع الدرس", "أنشئ حسابك".
- Never "Click here", "Submit", "OK", or questions.
- Pair the primary with a reassurance line where it helps: "7 أيام مجانًا · بدون بطاقة دفع".

### Don't
Rounded corners · shadows/gradients · white text on coral · coral button on coral field · two primaries side by side · icon-only without label.

---

## Link — `.ma-link`
Text colour, 2px coral underline (4px offset); 4px on hover.
```html
<a class="ma-link" href="/cpd">certificate requirements</a>
```

## Navigation — `.ma-nav`
```html
<nav class="ma-nav"><div class="ma-container ma-nav__inner">
  <svg class="ma-logo" width="160" height="18" role="img" aria-label="Mastery Academy"><use href="#ma-logo"/></svg>
  <ul class="ma-nav__links">
    <li><a href="/courses" aria-current="page">الدورات</a></li>
    <li><a href="/diplomas">الدبلومات</a></li>
  </ul>
  <div class="ma-nav__actions">
    <a class="ma-btn ma-btn--ghost ma-btn--sm" href="/login">تسجيل الدخول</a>
    <a class="ma-btn ma-btn--primary ma-btn--sm" href="/signup">ابدأ مجانًا</a>
  </div>
</div></nav>
```
Sticky, surface background, 1px bottom `--line`. Current link: `aria-current="page"` → text colour + 3px coral underline. Links hide < 900px (add a menu button), ghost login hides < 600px.

## Section header — `.ma-sechead`
The brand-guide header: 1px `--line-strong` rule → running header (caption, muted; start = "Section / 01", end = brand) → title (bold, 32px) → 54×3px coral rule → optional lead.
```html
<header class="ma-sechead">
  <div class="ma-sechead__run"><span>الدورات / ٠٢</span><span>ماستري أكاديمي</span></div>
  <h2 class="ma-sechead__title">ما يتابعه المتعلمون هذا الأسبوع</h2>
  <p class="ma-sechead__lead">دروس قصيرة من مدربين يقودون في الميدان.</p>
</header>
```

## Tag — `.ma-tag`
Flat square label. Modifiers: `--coral --yellow --purple --sky --pink --teal --lilac --green --cream --ink --outline`. Ink text on all colours, white on ink. Latin: uppercase +0.04em; Arabic: no transform.
```html
<span class="ma-tag ma-tag--yellow">التسويق</span>
<span class="ma-tag ma-tag--outline">50 hours</span>
```
Assign one colour per course track and keep it everywhere (card media, tag, poster).

## Form fields — `.ma-field`
```html
<div class="ma-field">
  <label class="ma-label" for="email">البريد الإلكتروني</label>
  <input class="ma-input" id="email" type="email">
  <span class="ma-help">سنرسل رابط التفعيل إلى هذا البريد.</span>
</div>
<div class="ma-field is-error">…<input class="ma-input" aria-invalid="true" aria-describedby="email-h">
  <span class="ma-help" id="email-h">أدخل بريدًا كاملًا، مثل sara@company.com</span></div>
<label class="ma-check"><input type="checkbox" checked> أرسل لي شهادة CPD</label>
<select class="ma-select">…</select>
```
48px tall, 1px `--line-strong` border, surface fill, square. Focus: 2px purple outline. Error: pink edge + written message (what's wrong + how to fix). Checkbox: square that fills coral with an ink dot.

## Course card — `.ma-card`
```html
<a class="ma-card" href="/courses/leadership-diploma">
  <div class="ma-card__media" style="background:var(--coral)"><span class="ma-tag ma-tag--cream">القيادة</span></div>
  <div class="ma-card__body">
    <h3 class="ma-card__title">دبلوم القيادة الإدارية</h3>
    <div class="ma-card__meta">
      <span><svg aria-hidden="true"><use href="#i-clock"/></svg>50 ساعة</span>
      <span><svg aria-hidden="true"><use href="#i-book"/></svg>32 درسًا</span>
    </div>
  </div>
  <div class="ma-card__foot">
    <div class="ma-person"><span class="ma-avatar">ث</span>
      <div><div class="ma-person__name">ثابت حجازي</div><div class="ma-person__role">مدرب معتمد</div></div></div>
    <span class="ma-tag ma-tag--ink">دبلوم</span>
  </div>
</a>
```
1px `--line` border → `--line-strong` on hover. Media 16:10: a track colour field or a photo (`--radius-soft` allowed on the photo only). Whole card is one link.

## Avatar / person — `.ma-avatar`, `.ma-person`
40px circle (`--radius-full`), brand-colour fill, ink initial. Name 14px medium + role 12px muted.

## Progress — `.ma-progress`
```html
<div class="ma-progress">
  <div class="ma-progress__row"><span>الوحدة 3 من 5</span><span>64%</span></div>
  <div class="ma-progress__track" role="progressbar" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100" aria-label="Course progress">
    <div class="ma-progress__bar" style="width:64%"></div></div>
</div>
```
8px flat track (`--line`), coral bar, number always printed (tabular).

## Alert — `.ma-alert`
Modifiers `--success --warning --danger --info`. Solid fill, ink text, 20px filled icon, bold title + one sentence. `role="status"` (info/success) or `role="alert"` (danger).
```html
<div class="ma-alert ma-alert--danger" role="alert">
  <svg aria-hidden="true"><use href="#i-alert"/></svg>
  <div><p class="ma-alert__title">فشل الدفع</p><p class="ma-alert__text">تم رفض البطاقة. حدّث البطاقة وحاول مرة أخرى.</p></div>
</div>
```

## Tabs — `.ma-tabs`
Text tabs over a 1px `--line`; selected = text colour + 3px coral underline. Use `role="tablist"`/`role="tab"`/`aria-selected`. Scrolls horizontally on phones.

## Poster — `.ma-poster`
Campaign unit: one solid brand colour, the mark, one short headline, optional kicker. Modifiers per colour; `--ink` makes text white and the mark coral. Latin event titles add `.ma-poster__title--latin` (condensed caps).
```html
<div class="ma-poster ma-poster--coral" dir="rtl">
  <div class="ma-poster__top">
    <svg class="ma-logo" width="56" height="24" style="color:var(--ink);--logo-mark:var(--ink)"><use href="#ma-mark"/></svg>
    <span>ماستري أكاديمي</span></div>
  <h3 class="ma-poster__title">لنبدأ التعلم اليوم.</h3>
</div>
```
Use for promos, banners, social tiles, app splash, empty states. One headline, max one supporting line.

## Footer — `.ma-footer`
Always ink in both themes, white text, coral mark, links at 72% white. Columns via a simple grid.

## Logo — `.ma-logo`
See `01-brand.md`. `<svg class="ma-logo"><use href="#ma-logo"/></svg>`; `color` sets the wordmark, `--logo-mark` sets the mark (default coral).

---

## Adding a new component
1. Compose from existing tokens and parts first.
2. Square corners, 1px rules, no shadow, role tokens only.
3. Logical properties for RTL.
4. Define default, hover, focus, active, disabled (and loading/error if relevant).
5. Check both themes and 360px width.
6. Name it `.ma-<name>` with `--modifier` and `__part`.
