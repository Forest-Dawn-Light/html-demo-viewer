import { prototypeGroups, prototypePages, prototypePageMap } from './generated-pages.js';

/** Return the full manifest: groups, pages, and a path-keyed page map. */
export function loadManifest() {
  return {
    groups: prototypeGroups,
    pages: prototypePages,
    pageMap: prototypePageMap,
  };
}

/** Return the first page flagged as entry, or the first page overall. */
export function findEntryPage(pages) {
  return pages.find((p) => p.entry) ?? pages[0] ?? null;
}

/**
 * Filter pages by a free-text query.
 * Matches against label, path, description, and tags.
 */
export function searchPages(pages, query) {
  if (!query) return pages;
  const q = query.toLowerCase();
  return pages.filter(
    (p) =>
      p.label.toLowerCase().includes(q) ||
      p.path.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.tags.some((t) => t.toLowerCase().includes(q)),
  );
}
