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
    raw?.closest<HTMLElement>('[class*="prc-ButtonGroup-ButtonGroup"]') ??
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
      '[role="tablist"], .tabnav-tabs, .UnderlineNav, nav, ul[aria-label="File view"]',
    ),
  );

  const hasTab = (root: ParentNode, label: string): boolean =>
    Array.from(root.querySelectorAll<HTMLElement>('a, button, span, div')).some(
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
  const hardCoded = document.querySelector<HTMLElement>(
    '#repo-content-pjax-container > react-app > div > div > div.prc-PageLayout-PageLayoutRoot--KH-d > div > div > div.prc-PageLayout-ContentWrapper-gR9eG > div > div > div:nth-child(3) > div.Box-sc-62in7e-0.hGzGyY > div > div.Box-sc-62in7e-0.dIDnLY > section > div',
  );
  if (hardCoded) return hardCoded;

  const reactContentWrapper = document.querySelector<HTMLElement>(
    '[class*="BlobViewContent-module__blobContentWrapper"]',
  );
  if (reactContentWrapper) return reactContentWrapper;

  const fileBox = findFileBoxContainer();
  if (!fileBox) return null;

  return (
    fileBox.querySelector<HTMLElement>('.Box-body') ??
    fileBox.querySelector<HTMLElement>('[data-testid="file-view-content"]') ??
    null
  );
}
