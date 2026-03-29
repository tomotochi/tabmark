import { debugLog } from '../utils/logger';
/**
 * Returns the first matching element that is actually visible (not hidden by GitHub's SPA cache).
 */
function queryVisible<T extends HTMLElement>(selectors: string[]): T | null {
  for (const selector of selectors) {
    const elements = document.querySelectorAll<T>(selector);
    for (const el of Array.from(elements)) {
      if (el.getBoundingClientRect().height > 0 || el.getBoundingClientRect().width > 0) {
        debugLog('queryVisible(): matched', selector, el.className);
        return el;
      }
    }
  }
  debugLog('queryVisible(): NO MATCH for any of', selectors);
  return null;
}

/**
 * Returns the first matching element regardless of current layout visibility.
 * Use for DOM injection targets where the element may be temporarily 0px
 * during GitHub's large-file / re-render states.
 */
function queryAny<T extends HTMLElement>(selectors: string[]): T | null {
  for (const selector of selectors) {
    const elements = document.querySelectorAll<T>(selector);
    for (const el of Array.from(elements)) {
      if (el.isConnected) return el;
    }
  }
  return null;
}

export function findRawButton(): HTMLElement | null {
  // GitHub blob pages typically have an element with id="raw-url" or testid.
  // It can be an <a> or a <button> depending on the view context.
  const direct = queryVisible<HTMLElement>([
    '#raw-url', '[data-testid="raw-button"]', '[data-testid="raw-url"]'
  ]) ?? queryAny<HTMLElement>([
    '#raw-url', '[data-testid="raw-button"]', '[data-testid="raw-url"]'
  ]);
  if (direct) return direct;

  const header = queryVisible<HTMLElement>([
    '[data-testid="file-header"]',
    '.Box-header'
  ]) ?? queryAny<HTMLElement>([
    '[data-testid="file-header"]',
    '.Box-header'
  ]);

  const findByText = (root: ParentNode | Document): HTMLElement | null =>
    Array.from(root.querySelectorAll<HTMLElement>('a, button')).find((el) => {
      const label = el.textContent?.trim();
      const aria = el.getAttribute('aria-label')?.trim();
      const title = el.getAttribute('title')?.trim();
      const tooltip = el.getAttribute('data-tooltip')?.trim();
      const hasRawLabel = [label, aria, title, tooltip].includes('Raw');
      if (!hasRawLabel) return false;
      return el instanceof HTMLAnchorElement ? el.href.includes('/raw/') : true;
    }) ?? null;

  if (header) {
    const fromHeader = findByText(header);
    if (fromHeader) return fromHeader;
  }

  return findByText(document);
}

export function findFileBoxContainer(): HTMLElement | null {
  const raw = findRawButton();
  if (!raw) return null;
  return raw.closest<HTMLElement>('.Box');
}

export function findFileHeaderActionsContainer(): HTMLElement | null {
  // Prefer known actions containers in the file header.
  const direct = queryVisible<HTMLElement>([
    '#repos-sticky-header div[class*="BlobViewHeader-module__Box_3"]',
    '#repos-sticky-header div[class*="BlobViewHeader"] > div[class*="BlobViewHeader"] > div:last-child',
    '[data-testid="file-header-actions"]',
    '.file-header-actions',
    '.Box-header .BtnGroup',
    '.Box-header [role="group"]'
  ]) ?? queryAny<HTMLElement>([
    '#repos-sticky-header div[class*="BlobViewHeader-module__Box_3"]',
    '#repos-sticky-header div[class*="BlobViewHeader"] > div[class*="BlobViewHeader"] > div:last-child',
    '[data-testid="file-header-actions"]',
    '.file-header-actions',
    '.Box-header .BtnGroup',
    '.Box-header [role="group"]'
  ]);

  if (direct) return direct;

  // Best-effort: walk up from the Raw link and locate a nearby container.
  const raw = findRawButton();
  return (
    raw?.closest<HTMLElement>('[data-testid="file-header-actions"]') ??
    raw?.closest<HTMLElement>('.file-header-actions') ??
    raw?.closest<HTMLElement>('.d-flex') ??
    raw?.parentElement ??
    null
  );
}

export function findFileModeTabsContainer(): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[role="tablist"], .tabnav-tabs, .UnderlineNav, nav',
    )
  );

  const hasTab = (root: ParentNode, label: string): boolean =>
    Array.from(root.querySelectorAll<HTMLElement>('a, button, span')).some(
      (el) => el.textContent?.trim() === label,
    );

  for (const candidate of candidates) {
    if (hasTab(candidate, 'Preview') && hasTab(candidate, 'Code')) {
      return candidate;
    }
  }

  return null;
}


export function findFileContentContainer(): HTMLElement | null {
  // 1. Markdown blob content element — most precise; confirmed on target page.
  //    We want to swap only the rendered markdown, not the surrounding layout.
  const byBlob =
    queryVisible<HTMLElement>([
    'div[class*="BlobContent-module__markdownBlob"]',
    'div[class*="BlobViewContent-module__blobContentWrapper"]'
    ]) ?? queryAny<HTMLElement>([
      'div[class*="BlobContent-module__markdownBlob"]',
      'div[class*="BlobViewContent-module__blobContentWrapper"]'
    ]);
  if (byBlob) return byBlob;

  // 2. Stable test-id selectors (version-agnostic)
  const byTestId =
    queryVisible<HTMLElement>([
    '[data-testid="blob-content"]',
    '[data-testid="file-view-content"]',
    '[data-testid="file-blob"]'
    ]) ?? queryAny<HTMLElement>([
      '[data-testid="blob-content"]',
      '[data-testid="file-view-content"]',
      '[data-testid="file-blob"]'
    ]);
  if (byTestId) return byTestId;

  // 3. Broad layout fallback (GitHub React UI). Avoid hard-coding hashed class names
  //    and instead match on the semantic part of the layout class.
  const byLayout =
    queryVisible<HTMLElement>([
      'div[class*="PageLayout-ContentWrapper"]',
      'main div[class*="Layout-main"]'
    ]) ?? queryAny<HTMLElement>([
      'div[class*="PageLayout-ContentWrapper"]',
      'main div[class*="Layout-main"]'
    ]);
  if (byLayout) {
    debugLog('findFileContentContainer(): using layout wrapper fallback.');
    return byLayout;
  }

  // 4. react-app semantic elements
  const bySemantics =
    queryVisible<HTMLElement>(['react-app article', 'react-app section']) ??
    queryAny<HTMLElement>(['react-app article', 'react-app section']);
  if (bySemantics) {
    debugLog('findFileContentContainer(): using react-app semantic element.');
    return bySemantics;
  }

  // 5. Legacy Primer CSS class
  const byLegacy =
    queryVisible<HTMLElement>(['.blob-wrapper']) ??
    queryAny<HTMLElement>(['.blob-wrapper']);
  if (byLegacy) {
    debugLog('findFileContentContainer(): using legacy .blob-wrapper.');
    return byLegacy;
  }

  // 6. Walk up from the Raw anchor — last resort
  const fileBox = findFileBoxContainer();
  if (!fileBox) {
    debugLog('findFileContentContainer(): no fileBox found from Raw button.');
    return null;
  }
  const boxBody = fileBox.querySelector<HTMLElement>('.Box-body') ?? null;
  if (boxBody) {
    debugLog('findFileContentContainer(): using .Box-body fallback from fileBox.');
  } else {
    debugLog('findFileContentContainer(): fileBox present but .Box-body not found.');
  }
  return boxBody;
}
