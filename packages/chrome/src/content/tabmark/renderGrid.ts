import type { TabmarkGridViewData } from './parseToGrid';

export function renderGridTable(view: TabmarkGridViewData): HTMLTableElement {
  const table = document.createElement('table');
  table.className = 'tabmark-grid-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');

  const corner = document.createElement('th');
  corner.className = 'tabmark-grid-corner';
  corner.textContent = '';
  headRow.appendChild(corner);

  for (const header of view.headers) {
    const th = document.createElement('th');
    th.textContent = header;
    headRow.appendChild(th);
  }

  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (let r = 0; r < view.rows.length; r++) {
    const tr = document.createElement('tr');

    const rowHeader = document.createElement('td');
    rowHeader.className = 'tabmark-grid-row-header';
    rowHeader.textContent = view.rowIds[r] ?? String(r + 1);
    tr.appendChild(rowHeader);

    const row = view.rows[r] ?? [];
    for (let c = 0; c < view.headers.length; c++) {
      const td = document.createElement('td');
      td.textContent = row[c] ?? '';
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);
  return table;
}


