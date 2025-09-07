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
  - `script.js` - Core functionality for parsing, formatting, and exporting asset data
  - `style.css` - Styling with responsive design and CIS Controls color scheme
- **Asset parsing logic** in `script.js`:
  - Detects multiple formats (Windows winget/wmic, Linux dpkg/rpm, macOS brew)
  - Uses regex patterns to extract software names and versions
  - Handles various edge cases and formatting inconsistencies
- **Export functionality** supports CSV and JSON formats with proper escaping

## Code Conventions

- **JavaScript**: Vanilla JS (no frameworks), use `const`/`let`, semicolons required, double quotes for strings
- **Indentation**: 2 spaces across all files
- **Security**: Always escape HTML content using the `escapeHtml()` function
- **File paths**: Keep all paths relative for GitHub Pages compatibility
- **No external dependencies** - Everything runs client-side without network calls

## Testing Approach

Manual testing only:
1. Load sample data using the Windows/Linux/macOS buttons
2. Click "整形して表示" to process and verify table rendering
3. Test CSV/JSON export functionality
4. Verify responsive layout on different screen sizes

## Deployment

Deployed automatically via GitHub Pages from the main branch. The `.nojekyll` file ensures proper serving of all files.