export const TABMARK_STYLE_ELEMENT_ID = 'tabmark-grid-style';

export function ensureStylesInjected(): void {
  if (document.getElementById(TABMARK_STYLE_ELEMENT_ID)) return;

  const style = document.createElement('style');
  style.id = TABMARK_STYLE_ELEMENT_ID;
  style.textContent = `
    .tabmark-grid-root {
      margin-top: 12px;
    }

    .tabmark-grid-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
    }

    .tabmark-grid-button {
      cursor: pointer;
    }

    .tabmark-grid-panel {
      border: 1px solid var(--borderColor-default, #d0d7de);
      border-radius: 6px;
      overflow: auto;
      max-height: 70vh;
      background: var(--bgColor-default, #ffffff);
    }

    .tabmark-grid-table {
      border-collapse: collapse;
      width: 100%;
      font-size: 12px;
    }

    .tabmark-grid-table th,
    .tabmark-grid-table td {
      border: 1px solid var(--borderColor-default, #d0d7de);
      padding: 6px 8px;
      vertical-align: top;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .tabmark-grid-table th {
      position: sticky;
      top: 0;
      background: var(--bgColor-muted, #f6f8fa);
      z-index: 2;
      text-align: left;
    }

    .tabmark-grid-table .tabmark-grid-row-header {
      position: sticky;
      left: 0;
      background: var(--bgColor-muted, #f6f8fa);
      z-index: 1;
      width: 1%;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .tabmark-grid-table .tabmark-grid-corner {
      position: sticky;
      top: 0;
      left: 0;
      z-index: 3;
      background: var(--bgColor-muted, #f6f8fa);
    }

    .tabmark-grid-status {
      padding: 10px 12px;
      font-size: 12px;
      color: var(--fgColor-muted, #57606a);
    }

    .tabmark-grid-error {
      padding: 10px 12px;
      font-size: 12px;
      color: var(--fgColor-danger, #cf222e);
      white-space: pre-wrap;
    }
  `.trim();

  document.head.appendChild(style);
}


