import { ensureStylesInjected } from './styles';
import { findFileHeaderActionsContainer } from '../github/selectors';

export const TABMARK_GRID_BUTTON_ID = 'tabmark-grid-button';

export function removeInjectedButton(): void {
  document.getElementById(TABMARK_GRID_BUTTON_ID)?.remove();
}

export function injectGridButton(onClick: () => void): HTMLButtonElement | null {
  ensureStylesInjected();
  removeInjectedButton();

  const actions = findFileHeaderActionsContainer();
  if (!actions) return null;

  const btn = document.createElement('button');
  btn.id = TABMARK_GRID_BUTTON_ID;
  btn.type = 'button';
  btn.className = 'btn btn-sm tabmark-grid-button';
  btn.textContent = 'Grid';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    onClick();
  });

  actions.appendChild(btn);
  return btn;
}


