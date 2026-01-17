export function findRawUrlAnchor(): HTMLAnchorElement | null {
  // GitHub blob pages typically have an anchor with id="raw-url".
  return document.querySelector<HTMLAnchorElement>('a#raw-url');
}

export function findFileBoxContainer(): HTMLElement | null {
  const raw = findRawUrlAnchor();
  if (!raw) return null;
  return raw.closest<HTMLElement>('.Box');
}

export function findFileHeaderActionsContainer(): HTMLElement | null {
  // Best-effort: walk up from the Raw link and locate a nearby container to
  // append our button without fighting GitHub's layout too much.
  const raw = findRawUrlAnchor();
  if (!raw) return null;

  // Prefer a button group / actions container.
  return (
    raw.closest<HTMLElement>('[data-testid="file-header-actions"]') ??
    raw.closest<HTMLElement>('.file-header-actions') ??
    raw.closest<HTMLElement>('.d-flex') ??
    raw.parentElement
  );
}


