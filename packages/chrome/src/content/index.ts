import { onGitHubNavigation } from './github/navigation';
import { isTabmarkBlobUrl } from './github/url';
import { getRawUrlFromDom, fetchRawMarkdown } from './tabmark/fetchRaw';
import { parseTabmarkMarkdownToGrid } from './tabmark/parseToGrid';
import { renderGridTable } from './tabmark/renderGrid';
import {
  injectGridButton,
  removeInjectedButton,
  TABMARK_GRID_BUTTON_ID,
} from './ui/injectTabs';
import { ensureStylesInjected } from './ui/styles';
import { findFileContentContainer, findFlexRowContainer } from './github/selectors';

const INJECT_MARKER_ATTR = 'data-tabmark-grid-injected';
const TABMARK_GRID_ROOT_ID = 'tabmark-grid-root';
const TABMARK_GRID_PANEL_ID = 'tabmark-grid-panel';
const TABMARK_GRID_STATUS_ID = 'tabmark-grid-status';
const TABMARK_GRID_ORIGINAL_ID = 'tabmark-grid-original';
const TABMARK_WRAPPED_ATTR = 'data-tabmark-grid-wrapped';
const GRID_LAYOUT_ACTIVE_ATTR = 'data-tabmark-grid-layout-active';
let pendingInjectObserver: MutationObserver | null = null;

function shouldRunOnThisPage(): boolean {
  try {
    return isTabmarkBlobUrl(new URL(location.href));
  } catch {
    return false;
  }
}

function alreadyInjected(): boolean {
  return document.documentElement.hasAttribute(INJECT_MARKER_ATTR);
}

function markInjected(): void {
  document.documentElement.setAttribute(INJECT_MARKER_ATTR, 'true');
}

function clearInjected(): void {
  document.documentElement.removeAttribute(INJECT_MARKER_ATTR);
}

function removeInjectedUi(): void {
  removeInjectedButton();
  // Scope cleanup to the current active page content so we don't accidentally
  // break GitHub's cached pages in the DOM.
  const contentHost = findFileContentContainer();
  if (contentHost) {
    contentHost.querySelector('.tabmark-grid-root')?.remove();
    const original = contentHost.querySelector<HTMLElement>('.tabmark-grid-original');
    if (original) {
      while (original.firstChild) {
        contentHost.insertBefore(original.firstChild, original);
      }
      original.remove();
    }
    // ALWAYS remove the attribute, even if `original` was destroyed by GitHub React
    contentHost.removeAttribute(TABMARK_WRAPPED_ATTR);
  }
  // Clean up layout override attribute
  document.documentElement.removeAttribute(GRID_LAYOUT_ACTIVE_ATTR);
  if (pendingInjectObserver) {
    pendingInjectObserver.disconnect();
    pendingInjectObserver = null;
  }
}

function ensureRootContainer(): HTMLElement | null {
  ensureStylesInjected();

  const existing = document.getElementById(TABMARK_GRID_ROOT_ID);
  if (existing) return existing;

  // Prefer replacing the main file content area (Preview/Code) with our panel.
  const contentHost = findFileContentContainer();
  if (!contentHost) return null;

  if (contentHost && !contentHost.hasAttribute(TABMARK_WRAPPED_ATTR)) {
    const original = document.createElement('div');
    original.id = TABMARK_GRID_ORIGINAL_ID;
    original.className = 'tabmark-grid-original';
    while (contentHost.firstChild) {
      original.appendChild(contentHost.firstChild);
    }
    contentHost.appendChild(original);
    contentHost.setAttribute(TABMARK_WRAPPED_ATTR, 'true');
  }

  const root = document.createElement('div');
  root.id = TABMARK_GRID_ROOT_ID;
  root.className = 'tabmark-grid-root';

  const panel = document.createElement('div');
  panel.id = TABMARK_GRID_PANEL_ID;
  panel.className = 'tabmark-grid-panel';
  panel.style.display = 'none';

  const status = document.createElement('div');
  status.id = TABMARK_GRID_STATUS_ID;
  status.className = 'tabmark-grid-status';
  status.textContent = 'Grid is hidden.';

  panel.appendChild(status);
  root.appendChild(panel);
  contentHost.appendChild(root);

  return root;
}

async function showGrid(panel: HTMLElement): Promise<void> {
  panel.style.display = 'block';

  // Compute the exact remaining viewport height from the panel's actual top position.
  // This is more reliable than CSS calc() because it accounts for all surrounding
  // layout elements (sticky header, breadcrumbs, tab bar, etc.).
  const top = panel.getBoundingClientRect().top;
  panel.style.setProperty('height', `${Math.max(200, window.innerHeight - top)}px`, 'important');
  panel.style.setProperty('overflow', 'scroll', 'important');
  panel.style.setProperty('max-height', 'none', 'important');

  const status = panel.querySelector<HTMLElement>(`#${TABMARK_GRID_STATUS_ID}`);
  if (status) {
    status.className = 'tabmark-grid-status';
    status.textContent = 'Loading...';
  }

  try {
    const rawUrl = getRawUrlFromDom();
    const markdown = await fetchRawMarkdown(rawUrl);
    const view = parseTabmarkMarkdownToGrid(markdown);

    panel.replaceChildren(renderGridTable(view));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const errorEl = document.createElement('div');
    errorEl.className = 'tabmark-grid-error';
    errorEl.textContent = message;
    panel.replaceChildren(errorEl);
  }
}

function init(): void {
  // Reset marker on every init attempt. We re-add it only if we actually inject.
  clearInjected();
  removeInjectedUi();

  if (!shouldRunOnThisPage()) return;
  if (alreadyInjected()) return;

  const root = ensureRootContainer();
  if (!root) return;
  const panel = root.querySelector<HTMLElement>(`#${TABMARK_GRID_PANEL_ID}`);
  if (!panel) return;

  const button = injectGridButton(() => {
    const isVisible = panel.style.display !== 'none';
    const contentHost = findFileContentContainer();
    const original = contentHost?.querySelector<HTMLElement>('.tabmark-grid-original');
    const gridButton = document.getElementById(TABMARK_GRID_BUTTON_ID);
    const flexRow = findFlexRowContainer();
    if (isVisible) {
      panel.style.display = 'none';
      panel.style.removeProperty('height');
      panel.style.removeProperty('overflow');
      panel.style.removeProperty('max-height');
      if (original) original.style.display = '';
      if (gridButton) {
        gridButton.classList.remove('tabmark-grid-tab--active');
      }
      document.documentElement.removeAttribute(GRID_LAYOUT_ACTIVE_ATTR);
      return;
    }
    if (original) original.style.display = 'none';
    if (gridButton) {
      gridButton.classList.add('tabmark-grid-tab--active');
    }
    document.documentElement.setAttribute(GRID_LAYOUT_ACTIVE_ATTR, 'true');
    void showGrid(panel);
  });

  if (button) {
    markInjected();
    // Watch for GitHub layout re-renders (e.g. Outline pane auto-closing) that
    // may destroy the injected button, and re-inject it if that happens.
    // NOTE: We observe document.documentElement instead of #repos-sticky-header
    // because GitHub may replace the entire sticky header element, which would
    // cause an observer attached to the old element to never fire.
    if (!pendingInjectObserver) {
      const observerSetupHref = location.href;
      pendingInjectObserver = new MutationObserver(() => {
        if (!document.getElementById(TABMARK_GRID_BUTTON_ID)) {
          // If the URL has changed, this is a SPA navigation — let onGitHubNavigation
          // (which runs after its 200ms debounce) handle cleanup and re-injection
          // against the fully-loaded new DOM. Re-injecting here against a partially
          // updated DOM causes wrapping of the wrong element and broken toggle state.
          if (location.href !== observerSetupHref) return;
          pendingInjectObserver?.disconnect();
          pendingInjectObserver = null;
          init();
        }
      });
      pendingInjectObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
    return;
  }

  // If the Raw button isn't in the DOM yet, wait for it and retry once.
  if (!pendingInjectObserver) {
    pendingInjectObserver = new MutationObserver(() => {
      const retryButton = injectGridButton(() => {
        const isVisible = panel.style.display !== 'none';
        const original = document.getElementById(TABMARK_GRID_ORIGINAL_ID);
        const gridButton = document.getElementById(TABMARK_GRID_BUTTON_ID);
        if (isVisible) {
          panel.style.display = 'none';
          if (original) original.style.display = '';
          if (gridButton) {
            gridButton.classList.remove('tabmark-grid-tab--active');
          }
          return;
        }
        if (original) original.style.display = 'none';
        if (gridButton) {
          gridButton.classList.add('tabmark-grid-tab--active');
        }
        void showGrid(panel);
      });
      if (retryButton) {
        markInjected();
        pendingInjectObserver?.disconnect();
        pendingInjectObserver = null;
      }
    });
    pendingInjectObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
}

init();
onGitHubNavigation(() => {
  // When navigating away, we want to allow injection on the next matching page.
  init();
});
