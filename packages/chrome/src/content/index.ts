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
import { findFileContentContainer } from './github/selectors';

const INJECT_MARKER_ATTR = 'data-tabmark-grid-injected';
const TABMARK_GRID_ROOT_ID = 'tabmark-grid-root';
const TABMARK_GRID_PANEL_ID = 'tabmark-grid-panel';
const TABMARK_GRID_STATUS_ID = 'tabmark-grid-status';
const TABMARK_WRAPPED_ATTR = 'data-tabmark-grid-wrapped';
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
  document.getElementById(TABMARK_GRID_ROOT_ID)?.remove();
  const contentHost = findFileContentContainer();
  if (contentHost) {
    contentHost.style.display = '';
    contentHost.removeAttribute(TABMARK_WRAPPED_ATTR);
  }
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
  if (!contentHost || !contentHost.parentNode) return null;

  if (!contentHost.hasAttribute(TABMARK_WRAPPED_ATTR)) {
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

  // Insert the root sibling to contentHost
  contentHost.parentNode.insertBefore(root, contentHost.nextSibling);

  return root;
}

async function showGrid(panel: HTMLElement): Promise<void> {
  panel.style.display = 'block';

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
    const gridButton = document.getElementById(TABMARK_GRID_BUTTON_ID);
    if (isVisible) {
      panel.style.display = 'none';
      if (contentHost) contentHost.style.display = '';
      if (gridButton) {
        gridButton.classList.remove('tabmark-grid-tab--active');
      }
      return;
    }
    if (contentHost) contentHost.style.display = 'none';
    if (gridButton) {
      gridButton.classList.add('tabmark-grid-tab--active');
    }
    void showGrid(panel);
  });

  if (button) {
    markInjected();
    return;
  }

  // If the Raw button isn't in the DOM yet, wait for it and retry once.
  if (!pendingInjectObserver) {
    pendingInjectObserver = new MutationObserver(() => {
      const retryButton = injectGridButton(() => {
        const isVisible = panel.style.display !== 'none';
        const contentHost = findFileContentContainer();
        const gridButton = document.getElementById(TABMARK_GRID_BUTTON_ID);
        if (isVisible) {
          panel.style.display = 'none';
          if (contentHost) contentHost.style.display = '';
          if (gridButton) {
            gridButton.classList.remove('tabmark-grid-tab--active');
          }
          return;
        }
        if (contentHost) contentHost.style.display = 'none';
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
