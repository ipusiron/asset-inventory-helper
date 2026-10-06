# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Running the Application Locally:**
- Python: `python -m http.server 8000` (then visit http://localhost:8000/)
- Node.js: `npx serve .` (if Node.js is available)
- Direct: Open `index.html` directly in your browser

**No build or installation required** - this is a static site deployed via GitHub Pages.

## High-Level Architecture

This is a **static web application** for asset inventory management:

- **Frontend-only application** - All processing happens in the browser with no backend
- **Single-page application** structure:
  - `index.html` - Main HTML structure with tabs for instructions and usage tips
  - `script.js` - Input lifecycle, safe DOM rendering, and downloads
  - `inventory-core.js` - DOM-free parsing and CSV/JSON generation, CommonJS/classic-script compatible
  - `inventory-messages.js` - Dynamic UI messages, separate from parsing logic
  - `style.css` - Styling with responsive design and CIS Controls color scheme
- **Asset parsing logic** in `inventory-core.js`:
  - Auto/manual selection: two-column text, header-bearing winget, dpkg, Homebrew
  - Ambiguous lines are held with source and reason
  - dpkg non-installed/error states are excluded; brew multiple versions become separate records
  - Duplicate records are retained; CSV/JSON input and default rpm output are unsupported
- **Export functionality** uses parsed records, not table text. CSV has BOM/CRLF and formula mitigation; JSON keeps parsed values
- **Size limits**: 500,000 UTF-16 code units, 10,000 physical lines, 5,000 records, 10 MiB per generated Blob
- Exceeding any parse limit disables all exports; never silently export partial results

## Code Conventions

- **JavaScript**: Vanilla JS (no frameworks), use `const`/`let`, semicolons required, double quotes for strings
- **Indentation**: 2 spaces across all files
- **Security**: Render input as textContent; no input in HTML, URLs, or persistent storage
- **File paths**: Keep all paths relative for GitHub Pages compatibility
- **No external dependencies** - Everything runs client-side without network calls
- **Commits**: Use Conventional Commits (`feat:`, `fix:`, `docs:`)

## Testing Approach

Run `npm test` with Node.js 22+ (no install step). Core and document/HTML tests use Node built-ins.
Also perform browser checks over HTTP and file://:
1. Load sample data using the Windows/Linux/macOS buttons
2. Click "整形して表示" to process and verify table rendering
3. Test CSV/JSON export functionality
4. Verify responsive layout on different screen sizes

## Deployment

Deployed automatically via GitHub Pages from the main branch. The `.nojekyll` file ensures proper serving of all files.
