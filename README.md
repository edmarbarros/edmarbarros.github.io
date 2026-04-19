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

## Structure

See [docs/superpowers/specs/2026-04-17-personal-website-design.md](docs/superpowers/specs/2026-04-17-personal-website-design.md) for the full design.

## License

Code: MIT (see `LICENSE`).
Content (blog posts, CV prose): CC-BY-4.0.
