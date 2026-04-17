# Personal Website Design — edmarbarros.com

**Date:** 2026-04-17
**Author:** Edmar Barros (with Claude via brainstorming skill)
**Repo:** `github.com/edmarbarros/edmarbarros.github.io`
**Status:** Design approved, ready for implementation planning

## 1. Goal

Ship a personal website hosted on GitHub Pages at `edmarbarros.com` that presents:

- A web-native CV (plus downloadable PDF matching the existing LaTeX CV).
- A "Projects" area covering Work projects (deeper writeups of roles in the CV) and Side Projects (personal work, seeded empty).
- A blog section for occasional technical writing, seeded with one post.
- A Contact page with links and a working form (email delivery via Cloudflare Worker + Resend).
- Bilingual content (English and Portuguese), with a language switcher.
- Minimal, editorial visual style; light default with dark-mode toggle.

Primary audience: technical peers, hiring managers, potential collaborators.

## 2. Non-goals (v1)

Explicitly out of scope:

- Analytics of any kind.
- Site search, tag pages for blog, archives, comments.
- Newsletter signup or RSS-to-email.
- Per-post auto-generated OG images.
- Multiple themes beyond light/dark.
- Auto-generation of the PDF CV from site data (keep the existing LaTeX workflow).
- E2E browser tests, visual regression, Lighthouse-in-CI.

These can be added later without restructuring.

## 3. Architecture

- **Framework:** Astro (latest stable major) with `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/tailwind`.
- **Language:** TypeScript throughout; `astro check` enforced in CI.
- **Styling:** Tailwind CSS + a small `theme.css` for light/dark CSS variables. System preference respected on first visit; user choice persisted in `localStorage`.
- **Content:** Astro Content Collections with Zod schemas for `projects` and `posts`. Singleton MDX/Astro pages for Home, CV, Contact.
- **i18n:** Astro's built-in i18n routing. Default locale `en` at `/`; secondary locale `pt` at `/pt/`. All pages mirrored; language switcher preserves current path.
- **Hosting:** GitHub Pages, built and deployed via GitHub Actions.
- **Domain:** `edmarbarros.com` (apex) + `www.edmarbarros.com` redirect. DNS managed on Cloudflare (see §9).
- **Contact backend:** Cloudflare Worker at `api.edmarbarros.com/contact`. Free-tier across Workers, KV, Turnstile, Resend. Expected cost: $0/month.
- **Package manager:** `pnpm`.
- **Node:** version 20 LTS, pinned in `.nvmrc` and `package.json#engines`.

## 4. Site structure & routes

```
/                           Home (EN)
/cv                         CV (EN)
/projects                   Projects index — Work + Side sections
/projects/work/<slug>       Single work-project page
/projects/side/<slug>       Single side-project page
/blog                       Blog index (EN posts)
/blog/<slug>                Single blog post
/contact                    Contact page

/pt/                        Same tree under Portuguese locale
/pt/cv, /pt/projects, /pt/projects/work/<slug>, …
/pt/blog, /pt/blog/<slug>
/pt/contact

/rss.xml                    RSS for EN blog
/pt/rss.xml                 RSS for PT blog
/sitemap-index.xml          Auto-generated
/404                        Custom 404, i18n-aware
```

**Shared layout:**

- **Header:** name wordmark (left), nav `[Home · CV · Projects · Blog · Contact]`, language switcher `EN / PT`, theme toggle (right).
- **Footer:** short bio line, email, GitHub, LinkedIn, © year, "Built with Astro" link.

## 5. Content model

### Collections (`src/content/config.ts`)

```ts
// Projects — unified collection with kind discriminator.
// Locale is derived from directory path (en/ or pt/) — not duplicated in frontmatter.
projects: z.object({
  title: z.string(),
  kind: z.enum(['work', 'side']),
  company: z.string().optional(),        // work only
  role: z.string().optional(),           // work only
  period: z.string(),                    // e.g. "May 2024 – Present"
  summary: z.string(),                   // 1–2 lines for index cards
  stack: z.array(z.string()),            // tech tags
  link: z.string().url().optional(),
  repo: z.string().url().optional(),     // side projects
  featured: z.boolean().default(false),
  order: z.number().default(0),
})

// Blog posts — locale also derived from directory path.
posts: z.object({
  title: z.string(),
  publishedAt: z.date(),
  updatedAt: z.date().optional(),
  summary: z.string(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
})
```

Queries filter by locale using `id` prefix, e.g.
`await getCollection('projects', ({ id }) => id.startsWith('en/'))`.
Slug for routing comes from file name; `kind` and locale come from the path segments.

### Files on disk

```
src/content/projects/
  en/work/vendoo.mdx
  en/work/paerpay.mdx
  en/work/emb.mdx
  en/work/citruslabs.mdx
  en/side/                  (empty for v1)
  pt/work/vendoo.mdx
  pt/work/paerpay.mdx
  pt/work/emb.mdx
  pt/work/citruslabs.mdx
  pt/side/
src/content/posts/
  en/hello-world.mdx        (seed post)
  pt/ola-mundo.mdx          (seed post, PT)
```

### Singleton pages

```
src/pages/index.astro
src/pages/cv.astro
src/pages/contact.astro
src/pages/404.astro
src/pages/pt/index.astro
src/pages/pt/cv.astro
src/pages/pt/contact.astro
```

### CV data (`src/data/cv.ts`)

One typed module, source of truth for the web CV. Shape:

- `identity`: name, title, location, email, socials.
- `summary`: `{ en, pt }`.
- `experience[]`: company, role, period, location, url, bullets `{ en[], pt[] }`, stack.
- `education[]`: institution, degree, period, location, notes.
- `skills`: grouped (`programming`, `cloud`, `databases`, `cicd`).
- `languages[]`: language, level, comment.
- `interests`: `{ en, pt }`.

`CvPage.astro` component takes `lang` prop and renders the full page. Both `cv.astro` and `pt/cv.astro` render `<CvPage lang="en|pt" />`. PDF download button links to `/cv/EdmarBarros_CV.pdf` in both locales.

Source PDF lives at `/Users/edmar/projects/EdmarBarros_CV/main.pdf` (LaTeX source in same dir). When updated, copy into site at `public/cv/EdmarBarros_CV.pdf` and commit. Update process documented in the site README.

## 6. Visual system

**Typography (self-hosted via `@fontsource-variable/*`):**

- Body: **Inter** (variable).
- Headings: **Fraunces** (variable serif).
- Mono: **JetBrains Mono** — code blocks, tag chips.
- Base size: fluid via `clamp()`, ~18px mobile → ~19px desktop. Line height 1.7 for prose.

**Palette (CSS variables):**

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#fafaf7` | `#121212` |
| `--text` | `#1a1a1a` | `#ececec` |
| `--muted` | `#6b6b6b` | `#8a8a8a` |
| `--border` | `#e8e6df` | `#2a2a2a` |
| `--accent` | `#b4472e` | `#e06c4e` |

One accent applied sparingly (links, focus ring, active nav, tag outline, theme-toggle highlight). No gradients, no drop shadows.

**Layout:**

- Prose max-width ~680px; grids (Projects index, CV experience rows) max ~960px.
- Single column on mobile, no sidebars anywhere.
- Generous vertical rhythm; elements breathe.

**Motion:** 150ms color-transition on theme toggle. No other animations.

**Components (first pass):**

- `SiteHeader.astro`, `SiteFooter.astro`
- `ThemeToggle.astro` — inline `<script>` in `<head>` sets class pre-hydration to avoid FOUC.
- `LanguageSwitch.astro` — maps current path across locales.
- `ProjectCard.astro`, `PostCard.astro`, `Tag.astro`
- `Prose.astro` — typography wrapper for MDX body content.
- `CvPage.astro` — renders `cv.ts` data.

**Favicon & logo:** derived from user-provided EMB monogram (blue on white, bordered). During implementation: trace raster to SVG if a vector isn't available; produce `favicon.svg` + `apple-touch-icon.png`. User to confirm path to source logo file at start of implementation.

**Photo:** `picture.png` from `/Users/edmar/projects/EdmarBarros_CV/`, small circular crop on Home and CV header.

## 7. CV page structure

Rendered from `src/data/cv.ts` via `CvPage.astro`:

```
[Name + Title]
[Location · Email · LinkedIn · GitHub]
[Download PDF]      ← links /cv/EdmarBarros_CV.pdf

[Summary paragraph, localized]

Experience
  Vendoo · Staff Backend Engineer · May 2024 – Present
    • bullet
    • bullet
    Stack: chips…
  Vendoo · Senior Backend Engineer & Tech Lead · Jun 2023 – Apr 2024
  Paerpay · Senior Backend Engineer · Jul 2022 – May 2023
  EMB Software Engineering · Senior Backend Engineer & Architect · Sep 2021 – Apr 2022
  Citruslabs · Senior Backend Engineer · Jan 2019 – Sep 2021

Education
  MSc Software Engineering · Coimbra University · 2013–
  BSc Computer Science · Coimbra University · 2009–2014

Technical skills
  Programming: Python · TypeScript · Java · PHP · C
  Cloud & Data: GCP · AWS · BigQuery · Kafka · Elasticsearch · Docker · Kubernetes · Terraform
  Databases: PostgreSQL · MySQL · MongoDB · Redis · Firestore
  CI/CD: GitHub Actions · CircleCI · Jenkins

Languages
  Portuguese (Native) · English (Professional) · Spanish & French (Basic)

Interests
  IoT, Arduino, home brewing
```

Localized prose fields (`summary`, bullets, interests) are `{ en, pt }` objects inside `cv.ts`. Structural data (dates, company names, stack) is not duplicated across locales.

## 8. Projects pages

### Index (`/projects`, `/pt/projects`)

Two headed sections: **Work** (populated from 4 seeded MDX files), **Side Projects** (empty placeholder in v1: "Coming soon — I'll post side projects here."). Within Work: ordered by `order` descending (most recent first). `featured: true` can pin to top in future.

### Single project page

```
[Title]           Vendoo — Staff Backend Engineer
[Meta row]        May 2024 – Present · Remote · vendoo.co ↗
[Stack chips]     Kafka · TypeScript · NodeJS · GCP · BigQuery · ES

## Problem            (H2 convention — not schema-enforced)
## What I built
## Outcomes
## Lessons

[← Back to Projects]
```

The 4 H2s are a soft convention authors follow in MDX body. Seed files created from CV facts (company, period, stack, bullet summaries in "What I built" / "Outcomes"), leaving "Problem" and "Lessons" as `<!-- TODO -->` for the author to fill in over time.

## 9. Deployment & custom domain

### GitHub Pages

Settings → Pages → Source: **GitHub Actions**.

`.github/workflows/deploy.yml`:

- Triggers: push to `main`, `workflow_dispatch`.
- Jobs:
  1. `build`: checkout → setup Node 20 + pnpm → install → `astro check` → `astro build`.
  2. `deploy`: `actions/deploy-pages@v4`.

`.github/workflows/worker.yml`:

- Triggers: push to `main` touching `workers/**`.
- Runs `wrangler deploy` using `CLOUDFLARE_API_TOKEN` repo secret.

### Custom domain — Cloudflare path (recommended)

1. Add `edmarbarros.com` as a Cloudflare zone (free plan). Update registrar nameservers to Cloudflare's assigned pair.
2. DNS records on Cloudflare (all **DNS-only / grey cloud** for GitHub Pages targets; GH Pages terminates its own TLS and proxying interferes):
   - `A  edmarbarros.com  185.199.108.153` (and `.109.153`, `.110.153`, `.111.153`)
   - `AAAA edmarbarros.com  2606:50c0:8000::153` (and `8001::`, `8002::`, `8003::`)
   - `CNAME www  edmarbarros.github.io.`
3. Commit `public/CNAME` containing `edmarbarros.com`. Astro copies it to build output.
4. GitHub Pages settings: custom domain `edmarbarros.com`, Enforce HTTPS.
5. Create Worker route: `api.edmarbarros.com/*` → contact Worker. Add `api` CNAME record (orange / proxied) to placeholder; Worker route takes precedence.

Propagation: DNS ~5–30 min typical; GitHub HTTPS cert minutes to 24 h.

**Rollback:** every deploy is an artifact on GitHub Pages; reverting a commit on `main` triggers a fresh deploy of the previous state.

## 10. Contact form & Cloudflare Worker

### Frontend (`/contact`, `/pt/contact`)

Page body:

- Short invitation paragraph (localized).
- Direct email link: `me@edmarbarros.com`.
- Social links: GitHub, LinkedIn.
- Form fields:
  - `name` (required)
  - `email` (required, validated)
  - `message` (required, 10–5000 chars)
  - `website` (honeypot, hidden via CSS + `tabindex="-1"`)
  - Hidden `ts` timestamp injected on page load
  - Turnstile widget
  - Submit button

Client-side script (plain `<script>` in the `.astro` page, no framework): intercepts `submit`, POSTs JSON to Worker, toggles inline success/error message. If JS disabled, falls back to a `mailto:` link prominently shown.

### Worker (`workers/contact/`)

- **Endpoint:** `POST https://api.edmarbarros.com/contact`
- **Stack:** TypeScript, deployed via `wrangler`. `wrangler.toml` committed.
- **Validation (Zod):**
  - `name`: string, 1–200 chars.
  - `email`: valid email, ≤254 chars.
  - `message`: string, 10–5000 chars.
  - `website` honeypot must be empty.
  - `ts` must be >2 s and <30 min old.
  - Turnstile token must verify against secret.
- **CORS:** `Access-Control-Allow-Origin: https://edmarbarros.com`. Preflight (`OPTIONS`) handler included.
- **Rate limiting:** Workers KV namespace `CONTACT_LIMITS`. Key: client IP (from `cf-connecting-ip`). Counter TTL 1 h. Limit: 5 submissions / IP / hour → 429 beyond.
- **Delivery:** Resend API call from verified sender on `edmarbarros.com` to `me@edmarbarros.com`. Plain-text body with submitter's name, email (as Reply-To), message, timestamp, and client IP.
- **Secrets** (`wrangler secret put`):
  - `RESEND_API_KEY`
  - `TURNSTILE_SECRET`
- **Response:** `204 No Content` on success; `4xx` JSON `{ error: string }` on validation failure; `429` on rate-limit; `500` on Resend error.

### Secrets & accounts (manual one-time setup)

- Cloudflare account + API token scoped to Workers deploy → GitHub repo secret `CLOUDFLARE_API_TOKEN`.
- Resend account + verified `edmarbarros.com` domain → Worker secret `RESEND_API_KEY`.
- Turnstile site + secret key → site key committed (public), secret as Worker secret `TURNSTILE_SECRET`.

### Fallback

If Worker is unreachable or returns error, UI shows: "Send failed — email me@edmarbarros.com directly." Direct email link is always visible above the form, so nothing is blocked.

## 11. Testing & validation

Scope is proportional to a static personal site + small Worker.

**Build-time (CI):**

- `astro check` — TS + `.astro` typecheck, fails build on errors.
- `astro build` — implicitly validates all Zod-typed content collections; malformed frontmatter breaks the build.
- `lychee-action` — internal + external link check on PRs.

**Lint / format:**

- Prettier + `prettier-plugin-astro`.
- ESLint with `eslint-plugin-astro` (light config).

**Worker:**

- `vitest` unit tests for: Zod validation (happy path + each failure mode), honeypot rejection, timestamp-bounds rejection, Turnstile failure path (mocked), rate-limit counter behavior (mocked KV), CORS header shape.
- Local iteration: `wrangler dev` + `pnpm dev`.

**Pre-deploy smoke (manual, one time):**

- Visit pre-CNAME `https://edmarbarros.github.io`, click through all pages in both languages, submit form against staging Worker.

## 12. File & directory structure (target)

```
/
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       └── worker.yml
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-04-17-personal-website-design.md  ← this file
├── public/
│   ├── CNAME                          ← "edmarbarros.com"
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── robots.txt
│   ├── cv/
│   │   └── EdmarBarros_CV.pdf
│   └── images/
│       └── edmar.jpg                  ← from EdmarBarros_CV/picture.png
├── src/
│   ├── components/
│   │   ├── SiteHeader.astro
│   │   ├── SiteFooter.astro
│   │   ├── ThemeToggle.astro
│   │   ├── LanguageSwitch.astro
│   │   ├── ProjectCard.astro
│   │   ├── PostCard.astro
│   │   ├── Tag.astro
│   │   ├── Prose.astro
│   │   └── CvPage.astro
│   ├── content/
│   │   ├── config.ts                  ← Zod schemas
│   │   ├── projects/
│   │   │   ├── en/work/*.mdx
│   │   │   ├── en/side/
│   │   │   ├── pt/work/*.mdx
│   │   │   └── pt/side/
│   │   └── posts/
│   │       ├── en/hello-world.mdx
│   │       └── pt/ola-mundo.mdx
│   ├── data/
│   │   └── cv.ts
│   ├── i18n/
│   │   ├── en.json
│   │   └── pt.json                    ← UI strings (nav labels, buttons)
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── cv.astro
│   │   ├── contact.astro
│   │   ├── 404.astro
│   │   ├── projects/
│   │   │   ├── index.astro
│   │   │   ├── work/[slug].astro
│   │   │   └── side/[slug].astro
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── rss.xml.ts
│   │   └── pt/
│   │       ├── index.astro
│   │       ├── cv.astro
│   │       ├── contact.astro
│   │       ├── projects/
│   │       │   ├── index.astro
│   │       │   ├── work/[slug].astro
│   │       │   └── side/[slug].astro
│   │       ├── blog/
│   │       │   ├── index.astro
│   │       │   └── [slug].astro
│   │       └── rss.xml.ts
│   └── styles/
│       └── theme.css
├── workers/
│   └── contact/
│       ├── src/
│       │   ├── index.ts
│       │   ├── validate.ts
│       │   ├── rate-limit.ts
│       │   └── send.ts
│       ├── test/
│       │   └── contact.test.ts
│       ├── wrangler.toml
│       └── package.json
├── astro.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── pnpm-lock.yaml
├── .nvmrc
├── .prettierrc
├── .eslintrc.cjs
├── .gitignore
├── LICENSE               ← MIT for code
├── LICENSE-content       ← CC-BY-4.0 for blog/prose
└── README.md
```

## 13. Milestones (implementation-phase order)

1. Scaffold Astro + Tailwind + pnpm; Node 20; base layout and typography.
2. Light/dark theming with pre-hydration no-flash script.
3. i18n routing + nav/header/footer + language switcher.
4. Content collections + Zod config; CV data module; CV page with PDF link.
5. Projects index + single-project template; seed 4 work projects (both locales).
6. Blog index + single-post template + RSS; seed one post per locale.
7. Home page + Contact page (links + static form skeleton).
8. Cloudflare Worker for contact form: validation, rate limit, Turnstile, Resend.
9. GitHub Actions deploy workflow + Worker deploy workflow.
10. Custom domain / DNS on Cloudflare, `CNAME`, HTTPS.
11. Final smoke test (all pages, both languages, form submission), then announce.

## 14. Open items to confirm at start of implementation

- Path to the EMB logo source file (for favicon/logo generation).
- Exact registrar for `edmarbarros.com` and whether nameservers can be moved to Cloudflare (if no, fall back to registrar-DNS path documented in §9).
- Resend verified-sender email address format (e.g., `hello@edmarbarros.com`).

## 15. Cost summary

Expected monthly cost: **$0**.

| Service | Tier | Headroom at v1 traffic |
|---|---|---|
| GitHub Pages | Free (public repo) | Unlimited for static |
| GitHub Actions | Free (public repo) | Unlimited for public repos |
| Cloudflare DNS | Free | Unlimited |
| Cloudflare Workers | Free | 100k requests/day |
| Cloudflare Workers KV | Free | 100k reads, 1k writes/day |
| Cloudflare Turnstile | Free | Unlimited |
| Resend | Free | 3,000 emails/month, 100/day |

Ongoing: only `edmarbarros.com` registrar renewal (~$10–15 / year, already paid by user).
