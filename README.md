# edmarbarros.com

Personal website for Edmar Barros — built with Astro, hosted on GitHub Pages.

## Development

```bash
pnpm install
pnpm dev
```

Site runs at http://localhost:4321.

## Build

```bash
pnpm build
pnpm preview
```

## Updating the CV

- Web CV source: `src/data/cv.ts`
- PDF source: `/Users/edmar/projects/EdmarBarros_CV/main.tex` (LaTeX).

When you update one, update the other:

1. Edit `src/data/cv.ts` and/or rebuild the LaTeX PDF via `pdflatex` in the CV dir.
2. If PDF was rebuilt: `cp /Users/edmar/projects/EdmarBarros_CV/main.pdf public/cv/EdmarBarros_CV.pdf`
3. Commit both the data-module change and the PDF copy together.

## MCP server

The site content is also available to AI clients over the Model Context Protocol.

- `src/pages/api/` exports posts, projects and the CV as static JSON at build time (start at `/api/index.json`).
- `workers/mcp/` is a stateless Cloudflare Worker at `https://api.edmarbarros.com/mcp`. It reads that JSON from the live site, cached for 5 minutes, so a site deploy updates it without redeploying the worker.
- Tools are read-only: `site_get_profile`, `site_get_cv`, `site_list_posts`, `site_get_post`, `site_list_projects`, `site_get_project`, `site_search`.
- Deploys through `.github/workflows/worker-mcp.yml` when `workers/mcp/**` changes.

Add it to Claude Code:

```bash
claude mcp add --transport http edmarbarros https://api.edmarbarros.com/mcp
```

Develop locally with `pnpm dev` in `workers/mcp` (point `SITE_URL` at `http://localhost:4321` after `pnpm build && pnpm preview` to test unpublished content).

## Structure

See [docs/superpowers/specs/2026-04-17-personal-website-design.md](docs/superpowers/specs/2026-04-17-personal-website-design.md) for the full design.

## License

Code: MIT (see `LICENSE`).
Content (blog posts, CV prose): CC-BY-4.0.
