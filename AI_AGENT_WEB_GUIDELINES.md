# Web UI Agent Instructions

Use this as `AGENTS.md` content or as a directly loaded agent instruction file.

## Priority

1. Build a usable screen for non-engineers.
2. Prefer completeness of required behavior over extra features.
3. Keep implementation simple.
4. Verify visual quality in a browser, not only in code.

## Product Rules

- Use TypeScript.
- Keep dependencies minimal.
- Prefer a simple frontend-only structure.
- Do not add backend, auth, or DB unless explicitly required.
- Keep processing in the browser when possible.
- Update results immediately when settings change.

## UI Language Rules

- All visible UI text must be Japanese.
- Do not mix English into Japanese unless unavoidable.
- Do not expose developer terms in UI.
- Do not expose implementation details in UI.
- Do not use repo name or package name as the visible product name unless explicitly requested.
- Use short labels when meaning remains clear.

## Copy Rules

- Prefer the shortest clear label.
- Remove unnecessary half-width spaces in Japanese text.
- Avoid long helper text.
- Avoid stacked explanatory text when one line is enough.

Examples:

- `全画像クリア` -> `クリア`
- `連結結果プレビュー` -> `プレビュー`
- `画像と設定` -> `設定`
- `ドラッグ & ドロップ` -> `ドラッグ&ドロップ`
- `1 枚` -> `1枚`

## Visual Direction

Target: a screen that can be mistaken for a Notion settings or utility surface.

- Quiet, dense, restrained.
- Flat layout.
- High information clarity.
- No demo-app feel.

## Forbidden Visual Patterns

- Gradients.
- Decorative hero backgrounds.
- Large rounded cards wrapping whole sections.
- Strong shadows.
- Oversized buttons or inputs.
- Large empty vertical space.
- Bright marketing-like color treatment.

## Required Visual Patterns

- Thin separators or subtle boundaries.
- Flat surfaces.
- Tight but readable spacing.
- Balanced label and control sizing.
- Clear settings/result split.
- Pages that do not become unnecessarily tall.

## Layout Rules

- On desktop, place settings and preview side by side.
- Separate major areas with spacing or a thin divider, not oversized cards.
- Keep header copy short.
- Keep upload and list actions close to each other.
- Empty states must visually group icon and text.
- Reduce vertical waste aggressively without making the UI cramped.

## Settings UI Rules

- Default to one-line setting rows.
- Place label on the left and control on the right.
- Remove row dividers unless they clearly improve readability.
- If a control is self-explanatory, omit redundant section text.
- Prefer toggles over checkboxes for binary settings.
- Match row height, font size, input height, and toggle size.
- Do not let the control side visually overpower the label side.

## List UI Rules

- Support reordering.
- Prefer drag and drop.
- If needed, also provide up/down buttons.
- Put item index on the far left.
- Stack up/down arrows vertically around the index area.
- Use icons where meaning remains obvious.
- Standardize icon set across the screen.

## Icon Rules

- Use Feather icons: `https://feathericons.com/`
- If an action is understandable with an icon, prefer icon-first treatment.
- Do not remove text from primary actions when discoverability would suffer.

## Typography Rules

- Use `M PLUS 1`.
- Use weight intentionally.
- Display/title: 700-800
- Section headings: 700
- Labels/buttons: 600
- Body: 500
- Secondary text: 400-500
- Do not let labels become too small.
- Do not let inputs look much larger than their row labels.

## Interaction Rules

- Make the main action path obvious immediately after upload.
- Keep settings changes reflected in the preview without extra confirmation.
- Keep destructive actions visible but quiet.
- Support minimum viable mobile responsiveness.

## Implementation Rules

- Respect existing files and patterns.
- Avoid unnecessary abstractions.
- Avoid over-engineering state.
- Do not add dependencies for minor UI polish that can be done with CSS.

## Search Discoverability Rules

- If the page is meant to be publicly discoverable, add minimum search metadata.
- Do not rely on publish alone. Prepare the page so search engines can understand it.
- Keep search-oriented copy aligned with actual user intent.

## Search Metadata Rules

- Set a descriptive `<title>` using likely search terms.
- Set a concise `<meta name="description">`.
- Add `<link rel="canonical">` using the final public URL.
- Add `<meta name="robots" content="index,follow">` unless indexing should be blocked.
- Add Open Graph metadata.
- Add Twitter card metadata.
- Add structured data when the page represents a tool or app.
- Keep all public URLs consistent across canonical, OG, Twitter, structured data, sitemap, and robots.

## Search Copy Rules

- Prefer titles that match what users search for.
- Include core use cases in title or description.
- Do not use vague product-only titles when search intent is functional.

Examples:

- `画像連結ツール`
- `画像連結ツール | 複数画像を1枚にまとめて保存`
- `複数の画像を横並び・縦並びで連結し、1枚の画像として保存`

## Public SEO Files

- Add `public/robots.txt`
- Add `public/sitemap.xml`
- Add a share image for OG and Twitter cards
- If using a subpath deployment such as GitHub Pages project pages, make metadata URLs match the public subpath

## Public Deployment Rules

- If deploying to GitHub Pages project pages, build with the correct base path.
- If the site has a stable public URL, use it in canonical and sitemap.
- After deployment, verify the public URL directly.
- If search traffic matters, recommend adding the site to Google Search Console after publish.

## GitHub Repository Visibility Rules

- If the project is hosted on GitHub, make the repository page link to the public site.
- Set the repository `About` section `Website` to the public URL.
- Set the repository `Description` to a short functional summary.
- Add repository topics that match the tool category and stack.
- Prefer repository metadata that helps both discovery and direct navigation from the repo page.

Examples:

- Website: public deployment URL
- Description: `複数画像を1枚に連結して保存できるWebツール`
- Topics: `image-tool`, `image-merge`, `github-pages`, `react`, `typescript`, `vite`

## Mandatory Browser Verification

When changing layout or styling, do not stop at code review. Open the page and inspect it.

Use `agent-browser`.

Default flow:

```bash
agent-browser open http://127.0.0.1:4173
agent-browser snapshot -i
agent-browser screenshot ./page.png
agent-browser close
```

Use additional commands as needed:

```bash
agent-browser click @e2
agent-browser fill @e3 "text"
agent-browser wait 1000
agent-browser get text @e1
```

## Mandatory Visual Checks

- Is the screen too card-like?
- Are sections wrapped by large rounded boxes?
- Is there unnecessary empty vertical space?
- Are heading and description spaced correctly?
- Do empty-state icon and text read as one group?
- Are row labels smaller than they should be?
- Are inputs or toggles too large relative to labels?
- Does any control look visually broken?
- Does the page still feel like a generic sample app rather than a Notion-like tool?

## Completion Rules

After implementation:

- Run `lint` if available.
- Run `build` if available.
- Run `test` if available.
- Verify the screen in a browser.
- If the page is public, verify title and metadata in built output.
- If the page uses a subpath deployment, verify the built output under that subpath.
- If the project is on GitHub, verify that the repository page links to the public site.

## Final Report Rules

Final report must be brief and include only:

- what was built or changed
- how to run it
- what was verified
- any remaining issue

Do not write a long changelog.
Do not explain obvious implementation details unless asked.
