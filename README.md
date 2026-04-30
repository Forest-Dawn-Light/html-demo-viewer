# HTML Demo Viewer

A **Vite-based HTML Demo Viewer** — a VitePress-like experience for HTML prototypes instead of Markdown docs.

## Features

- 📂 **Auto-discovery** — scans `demos/**/*.html` and builds a manifest automatically
- 🗂 **Grouped navigation** — left sidebar organises demos by group with current-page highlighting
- 🔍 **Search** — filter by title, path, tags, or description
- 🖼 **iframe preview** — full-page preview of each demo in the main area
- 🔗 **Deep-linking** — share any demo via `?page=demos/path/to/file.html`
- ⚙️ **Metadata sidecar** — optional `.meta.json` next to each HTML controls label, group, order, tags, etc.
- 📱 **Mobile-friendly** — collapsible sidebar on small screens

## Quick Start

```bash
npm install
npm run dev          # generate manifest + start dev server
```

Open [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Generate manifest then start the Vite dev server |
| `npm run build` | Generate manifest then build for production (`dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run generate:manifest` | Re-scan `demos/` and update `src/viewer/generated-pages.js` |

## Adding Demos

1. Drop an `.html` file anywhere inside `demos/`:

   ```
   demos/
     my-feature/
       overview.html
   ```

2. Optionally add a sidecar `.meta.json`:

   ```json
   {
     "id": "my-feature-overview",
     "label": "Feature Overview",
     "group": "My Feature",
     "order": 1,
     "tags": ["ui", "prototype"],
     "description": "High-level overview of the new feature",
     "entry": false,
     "hidden": false
   }
   ```

3. Run `npm run generate:manifest` (or restart `npm run dev`) — the sidebar updates automatically.

## Project Structure

```
html-demo-viewer/
├── index.html                     # Vite entry — the viewer shell
├── vite.config.js                 # Vite config + demos copy plugin
├── package.json
│
├── scripts/
│   └── generate-manifest.mjs      # Scans demos/ → src/viewer/generated-pages.js
│
├── src/viewer/
│   ├── main.js                    # Viewer application logic
│   ├── viewer.css                 # Viewer styles
│   ├── manifest-loader.js         # Helpers that consume the generated manifest
│   └── generated-pages.js         # ⚙ Auto-generated — do not edit manually
│
└── demos/
    ├── getting-started/
    │   ├── index.html
    │   └── index.meta.json
    └── examples/
        ├── dashboard.html
        ├── dashboard.meta.json
        ├── form.html
        └── form.meta.json
```

## Meta JSON Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier (defaults to slug of file path) |
| `label` | string | Display name in the sidebar (defaults to filename) |
| `group` | string | Group heading (defaults to first directory segment) |
| `order` | number | Sort order within the group (defaults to 999) |
| `tags` | string[] | Searchable tags |
| `description` | string | Shown as tooltip; searchable |
| `entry` | boolean | If `true`, opened by default when no `?page=` is set |
| `hidden` | boolean | If `true`, excluded from the manifest entirely |
| `thumbnail` | string | Reserved for future thumbnail support |
