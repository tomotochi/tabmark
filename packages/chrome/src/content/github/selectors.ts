export function findRawUrlAnchor(): HTMLAnchorElement | null {
  // GitHub blob pages typically have an anchor with id="raw-url".
  const direct = document.querySelector<HTMLAnchorElement>(
    'a#raw-url, a[data-testid="raw-button"], a[data-testid="raw-url"]',
  );
  if (direct) return direct;

  const header =
    document.querySelector<HTMLElement>('[data-testid="file-header"]') ??
    document.querySelector<HTMLElement>('.Box-header');

  const findByText = (root: ParentNode | Document): HTMLAnchorElement | null =>
    Array.from(root.querySelectorAll<HTMLAnchorElement>('a')).find((anchor) => {
      const label = anchor.textContent?.trim();
      if (label !== 'Raw') return false;
      return anchor.href.includes('/raw/');
    }) ?? null;

  if (header) {
    const fromHeader = findByText(header);
    if (fromHeader) return fromHeader;
  }

  return findByText(document);
}

export function findFileBoxContainer(): HTMLElement | null {
  const raw = findRawUrlAnchor();
  if (!raw) return null;
  return raw.closest<HTMLElement>('.Box');
}

export function findFileHeaderActionsContainer(): HTMLElement | null {
  // Prefer known actions containers in the file header.
  const direct =
    document.querySelector<HTMLElement>(
      '#repos-sticky-header div[class*="BlobViewHeader-module__Box_3"]',
    ) ??
    document.querySelector<HTMLElement>('[data-testid="file-header-actions"]') ??
    document.querySelector<HTMLElement>('.file-header-actions') ??
    document.querySelector<HTMLElement>('.Box-header .BtnGroup') ??
    document.querySelector<HTMLElement>('.Box-header [role="group"]');

  if (direct) return direct;

  // Best-effort: walk up from the Raw link and locate a nearby container.
  const raw = findRawUrlAnchor();
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
    ),
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
  // 1. Stable test-id selectors (preferred, version-agnostic)
  const byTestId =
    document.querySelector<HTMLElement>('[data-testid="blob-content"]') ??
    document.querySelector<HTMLElement>('[data-testid="file-view-content"]') ??
    document.querySelector<HTMLElement>('[data-testid="file-blob"]');
  if (byTestId) return byTestId;

  // 2. Current GitHub React UI layout class (prc-* prefix)
  const byPrc = document.querySelector<HTMLElement>(
    'div.prc-PageLayout-ContentWrapper-gR9eG',
  );
  if (byPrc) return byPrc;

  // 3. react-app semantic elements
  const bySemantics =
    document.querySelector<HTMLElement>('react-app article') ??
    document.querySelector<HTMLElement>('react-app section');
  if (bySemantics) return bySemantics;

  // 4. Legacy Primer CSS class
  const byLegacy = document.querySelector<HTMLElement>('.blob-wrapper');
  if (byLegacy) return byLegacy;

  // 5. Walk up from the Raw anchor — last resort
  const fileBox = findFileBoxContainer();
  if (!fileBox) return null;
  return (
    fileBox.querySelector<HTMLElement>('.Box-body') ??
    null
  );
}
