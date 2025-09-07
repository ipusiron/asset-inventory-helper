# Repository Guidelines

## Project Structure & Module Organization
- Root contains `index.html`, `style.css`, `script.js`, and `assets/`.
- `assets/` holds images and static files (e.g., `assets/screenshot.png`).
- Site is static and deployed via GitHub Pages (`.nojekyll`). No build system.

## Build, Test, and Development Commands
- Run locally by opening `index.html` in a browser, or start a simple server:
  - Python: `python -m http.server 8000` then visit `http://localhost:8000/`.
  - Node (if available): `npx serve .`.
- No install step; keep paths relative for Pages compatibility.

## Coding Style & Naming Conventions
- Languages: HTML, CSS, Vanilla JS.
- Indentation: 2 spaces; keep lines short and readable.
- Filenames: `index.html`, `style.css`, `script.js`; assets under `assets/`.
- JavaScript: use `const`/`let`, end statements with semicolons, prefer double quotes to match existing code, avoid global leaks.
- Security: escape user-rendered content (use `escapeHtml`), avoid remote scripts.

## Testing Guidelines
- No automated tests. Perform manual checks:
  - Load samples (Windows/Linux/macOS buttons) → “整形して表示”.
  - Verify table rendering and CSV/JSON export downloads.
  - Smoke-test in Chrome and Edge; confirm layout on narrow screens (viewport set).
- Keep changes minimal; verify GitHub Pages renders after merges.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat:`, `fix:`, `docs:`). Example: `feat: add macOS sample loader`.
- Scope small, focused PRs with:
  - Clear description of change and rationale.
  - Linked issue (if any) and before/after screenshots for UI.
  - Notes on manual test steps performed.

## Security & Configuration Tips
- This tool processes pasted text entirely in-browser; do not add tracking or network calls.
- Keep all links and assets relative for Pages (`/`-absolute paths may break).
- When parsing inputs, prefer defensive checks and non-greedy regex.

## Agent-Specific Instructions
- Match existing style (2-space indent, filenames, double quotes in JS).
- Do not introduce frameworks/build steps; this is a static site.
- Limit changes to the minimal surface; document any user-facing behavior updates in PRs.
