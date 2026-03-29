import { ensureStylesInjected } from './styles';
import {
  findFileHeaderActionsContainer,
  findFileModeTabsContainer,
} from '../github/selectors';

export const TABMARK_GRID_BUTTON_ID = 'tabmark-grid-button';
const TABMARK_GRID_ICON_URL = 'assets/tabmark-icon.svg';
let iconSvgCache: Promise<string | null> | null = null;

function loadGridIconSvg(): Promise<string | null> {
  if (!iconSvgCache) {
    iconSvgCache = fetch(chrome.runtime.getURL(TABMARK_GRID_ICON_URL))
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => {
        if (!text) return null;
        return text.replace(/^\s*<\?xml[^>]*\?>\s*/i, '');
      })
      .catch(() => null);
  }
  return iconSvgCache;
}

function injectGridIcon(target: HTMLElement): void {
  const icon = document.createElement('span');
  icon.className = 'tabmark-grid-icon';
  icon.setAttribute('aria-hidden', 'true');
  target.insertBefore(icon, target.firstChild);
  void loadGridIconSvg().then((svg) => {
    if (!svg) return;
    icon.innerHTML = svg;
  });
}

export function removeInjectedButton(): void {
  document.getElementById(TABMARK_GRID_BUTTON_ID)?.remove();
}

export function injectGridButton(onClick: () => void): HTMLElement | null {
  ensureStylesInjected();
  removeInjectedButton();

  const actions = findFileHeaderActionsContainer();
  if (actions) {
    const btn = document.createElement('button');
    btn.id = TABMARK_GRID_BUTTON_ID;
    btn.type = 'button';
    btn.className = 'btn btn-sm tabmark-grid-button';
    btn.setAttribute('aria-current', 'false');
    btn.textContent = 'Grid';
    injectGridIcon(btn);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      onClick();
    });
    actions.insertBefore(btn, actions.firstChild);
    return btn;
  }

  const tabs = findFileModeTabsContainer();
  if (tabs) {
    const btn = document.createElement('a');
    btn.id = TABMARK_GRID_BUTTON_ID;
    btn.href = '#';
    btn.className = 'tabmark-grid-tab';
    btn.setAttribute('role', 'tab');
    btn.textContent = 'Grid';
    injectGridIcon(btn);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      onClick();
    });

    const codeTab = Array.from(tabs.querySelectorAll<HTMLElement>('a, button'))
      .find((el) => el.textContent?.trim() === 'Code');
    if (codeTab) {
      tabs.insertBefore(btn, codeTab);
    } else {
      tabs.appendChild(btn);
    }
    return btn;
  }

  return null;
}
