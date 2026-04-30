import './viewer.css';
import { loadManifest, findEntryPage, searchPages } from './manifest-loader.js';

const { groups, pages, pageMap } = loadManifest();

// ── State ────────────────────────────────────────────────────────────────────

let currentPage = null;

// ── DOM refs (populated in renderApp) ────────────────────────────────────────

let navEl, searchEl, iframeEl, titleEl, pathEl, emptyStateEl, sidebarEl;

// ── Bootstrap ────────────────────────────────────────────────────────────────

function init() {
  renderApp();
  bindEvents();

  // Honour ?page= query parameter on initial load
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get('page');

  if (pageParam && pageMap[pageParam]) {
    navigateTo(pageMap[pageParam], { pushState: false });
  } else {
    const entry = findEntryPage(pages);
    if (entry) navigateTo(entry, { pushState: false });
  }
}

// ── Render ───────────────────────────────────────────────────────────────────

function renderApp() {
  document.getElementById('app').innerHTML = `
    <div class="viewer-layout">
      <aside id="sidebar" class="viewer-sidebar">
        <div class="sidebar-header">
          <button id="btn-menu-close" class="btn-menu-close" title="Close menu" aria-label="Close menu">✕</button>
          <span class="sidebar-logo">⚡ DemoViewer</span>
        </div>
        <div class="sidebar-search">
          <input id="search-input" type="text" placeholder="Search demos…" autocomplete="off" aria-label="Search demos" />
        </div>
        <nav id="sidebar-nav" class="sidebar-nav" aria-label="Demo pages"></nav>
      </aside>

      <div class="viewer-main">
        <div class="viewer-toolbar">
          <div class="toolbar-left">
            <button id="btn-menu-open" class="btn-icon btn-menu-open" title="Open menu" aria-label="Open menu">☰</button>
            <button id="btn-back"    class="btn-icon" title="Back"    aria-label="Back">←</button>
            <button id="btn-forward" class="btn-icon" title="Forward" aria-label="Forward">→</button>
            <button id="btn-reload"  class="btn-icon" title="Reload"  aria-label="Reload">⟳</button>
          </div>
          <div class="toolbar-info">
            <span id="toolbar-title" class="toolbar-title">—</span>
            <span id="toolbar-path"  class="toolbar-path"></span>
          </div>
          <div class="toolbar-right">
            <button id="btn-open" class="btn-icon" title="Open in new tab"  aria-label="Open in new tab">⧉</button>
            <button id="btn-copy" class="btn-icon" title="Copy share link"  aria-label="Copy share link">🔗</button>
          </div>
        </div>

        <div class="viewer-content">
          <div id="empty-state" class="empty-state${pages.length > 0 ? ' hidden' : ''}">
            <div class="empty-icon">📭</div>
            <p>No demos found. Add HTML files to the <code>demos/</code> folder and run
               <code>npm run generate:manifest</code>.</p>
          </div>
          <iframe
            id="preview-iframe"
            src="about:blank"
            title="Demo preview"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </div>
  `;

  sidebarEl   = document.getElementById('sidebar');
  navEl       = document.getElementById('sidebar-nav');
  searchEl    = document.getElementById('search-input');
  iframeEl    = document.getElementById('preview-iframe');
  titleEl     = document.getElementById('toolbar-title');
  pathEl      = document.getElementById('toolbar-path');
  emptyStateEl = document.getElementById('empty-state');

  renderNav(pages);
}

function renderNav(filteredPages) {
  if (filteredPages.length === 0) {
    navEl.innerHTML = '<div class="nav-empty">No results found.</div>';
    return;
  }

  // Index filtered pages by group
  const grouped = new Map();
  for (const page of filteredPages) {
    if (!grouped.has(page.group)) grouped.set(page.group, []);
    grouped.get(page.group).push(page);
  }

  let html = '';

  // Render groups in manifest order; orphan groups (not in manifest) go last
  const renderedGroups = new Set();

  for (const group of groups) {
    const groupPages = grouped.get(group.id);
    if (!groupPages) continue;
    renderedGroups.add(group.id);
    html += renderGroup(group.label, groupPages);
  }

  for (const [groupId, groupPages] of grouped) {
    if (renderedGroups.has(groupId)) continue;
    html += renderGroup(groupId, groupPages);
  }

  navEl.innerHTML = html;
}

function renderGroup(label, groupPages) {
  let html = `<div class="nav-group">`;
  html += `<div class="nav-group-title">${escHtml(label)}</div>`;
  for (const page of groupPages) {
    const active = currentPage?.path === page.path ? ' active' : '';
    html += `
      <a class="nav-item${active}"
         data-path="${escHtml(page.path)}"
         href="?page=${encodeURIComponent(page.path)}"
         title="${escHtml(page.description || page.label)}">
        ${escHtml(page.label)}
      </a>`;
  }
  html += `</div>`;
  return html;
}

// ── Navigation ────────────────────────────────────────────────────────────────

function navigateTo(page, { pushState = true } = {}) {
  currentPage = page;

  iframeEl.src = `/${page.path}`;
  titleEl.textContent = page.label;
  pathEl.textContent = page.path;
  document.title = `${page.label} — Demo Viewer`;

  if (pushState) {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.path);
    history.pushState({ path: page.path }, page.label, url.toString());
  }

  // Update active state in nav without full re-render
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.path === page.path);
  });

  // Close mobile sidebar after selecting a page
  sidebarEl.classList.remove('open');
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindEvents() {
  // Search
  searchEl.addEventListener('input', () => {
    const filtered = searchPages(pages, searchEl.value.trim());
    renderNav(filtered);
  });

  // Nav link clicks
  navEl.addEventListener('click', (e) => {
    const item = e.target.closest('.nav-item');
    if (!item) return;
    e.preventDefault();
    const page = pageMap[item.dataset.path];
    if (page) navigateTo(page);
  });

  // Toolbar: back / forward / reload
  document.getElementById('btn-back').addEventListener('click', () => history.back());
  document.getElementById('btn-forward').addEventListener('click', () => history.forward());
  document.getElementById('btn-reload').addEventListener('click', () => {
    if (iframeEl.contentWindow) {
      try {
        iframeEl.contentWindow.location.reload();
      } catch {
        if (currentPage) iframeEl.src = `/${currentPage.path}`;
      }
    }
  });

  // Toolbar: open in new tab
  document.getElementById('btn-open').addEventListener('click', () => {
    if (currentPage) window.open(`/${currentPage.path}`, '_blank', 'noopener');
  });

  // Toolbar: copy share link
  document.getElementById('btn-copy').addEventListener('click', () => {
    if (!currentPage) return;
    const url = new URL(window.location.href);
    url.searchParams.set('page', currentPage.path);
    navigator.clipboard.writeText(url.toString()).then(
      () => showToast('Link copied!'),
      () => prompt('Copy this link:', url.toString()),
    );
  });

  // Mobile sidebar toggle
  document.getElementById('btn-menu-open').addEventListener('click', () => {
    sidebarEl.classList.add('open');
  });
  document.getElementById('btn-menu-close').addEventListener('click', () => {
    sidebarEl.classList.remove('open');
  });

  // Browser back / forward buttons
  window.addEventListener('popstate', (e) => {
    const path = e.state?.path;
    if (path && pageMap[path]) navigateTo(pageMap[path], { pushState: false });
  });
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function showToast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Start ─────────────────────────────────────────────────────────────────────

init();
