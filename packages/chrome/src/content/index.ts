import { onGitHubNavigation } from './github/navigation';
import { isTabmarkBlobUrl } from './github/url';
import { getRawUrlFromDom, fetchRawMarkdown } from './tabmark/fetchRaw';
import { parseTabmarkMarkdownToGrid } from './tabmark/parseToGrid';
import { renderGridTable } from './tabmark/renderGrid';
import { injectGridButton, removeInjectedButton } from './ui/injectTabs';
import { ensureStylesInjected } from './ui/styles';
import { findFileBoxContainer } from './github/selectors';

const INJECT_MARKER_ATTR = 'data-tabmark-grid-injected';
const TABMARK_GRID_ROOT_ID = 'tabmark-grid-root';
const TABMARK_GRID_PANEL_ID = 'tabmark-grid-panel';
const TABMARK_GRID_STATUS_ID = 'tabmark-grid-status';

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
}

function ensureRootContainer(): HTMLElement {
  ensureStylesInjected();

  const existing = document.getElementById(TABMARK_GRID_ROOT_ID);
  if (existing) return existing;

  // Best-effort insertion: place inside the file's Box when possible, so it
  // feels like an additional view for the file (not a random page widget).
  const fileBox = findFileBoxContainer();
  const parent =
    fileBox?.querySelector<HTMLElement>('.Box-body') ??
    fileBox ??
    document.querySelector<HTMLElement>('#repo-content-pjax-container') ??
    document.querySelector<HTMLElement>('main') ??
    document.body;

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
  parent.appendChild(root);

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
  const panel = root.querySelector<HTMLElement>(`#${TABMARK_GRID_PANEL_ID}`);
  if (!panel) return;

  injectGridButton(() => {
    const isVisible = panel.style.display !== 'none';
    if (isVisible) {
      panel.style.display = 'none';
      return;
    }
    void showGrid(panel);
  });

  markInjected();
}

init();
onGitHubNavigation(() => {
  // When navigating away, we want to allow injection on the next matching page.
  init();
});


