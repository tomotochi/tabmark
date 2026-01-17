export type NavigationHandler = () => void;

/**
 * GitHub is a SPA-like site (Turbo). This helper re-runs initialization on
 * navigation without relying on any single event being present.
 */
export function onGitHubNavigation(handler: NavigationHandler): () => void {
  let disposed = false;
  let lastHref = location.href;
  let debounceId: number | null = null;

  const runIfChanged = () => {
    if (disposed) return;
    if (location.href === lastHref) return;
    lastHref = location.href;
    handler();
  };

  const onTurbo = () => runIfChanged();
  const onPjax = () => runIfChanged();
  const onPopstate = () => runIfChanged();

  document.addEventListener('turbo:load', onTurbo as EventListener);
  document.addEventListener('pjax:end', onPjax as EventListener);
  window.addEventListener('popstate', onPopstate);

  const observer = new MutationObserver(() => {
    if (debounceId !== null) {
      window.clearTimeout(debounceId);
    }
    debounceId = window.setTimeout(() => {
      debounceId = null;
      runIfChanged();
    }, 200);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  return () => {
    disposed = true;
    document.removeEventListener('turbo:load', onTurbo as EventListener);
    document.removeEventListener('pjax:end', onPjax as EventListener);
    window.removeEventListener('popstate', onPopstate);
    if (debounceId !== null) {
      window.clearTimeout(debounceId);
    }
    observer.disconnect();
  };
}


