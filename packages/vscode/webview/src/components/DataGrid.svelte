<script>
  import Cell from './Cell.svelte';
  import CellEditor from './CellEditor.svelte';
  import HeaderEditor from './HeaderEditor.svelte';
  import ContextMenu from './ContextMenu.svelte';
  import Papa from 'papaparse';

  let { gridData, oncellChange, onaddRow, onaddColumn, ondeleteRow, ondeleteColumn } = $props();

  // Selection state
  let selection = $state(null); // { type: 'cell'|'row'|'column', startRow, startCol, endRow, endCol }
  let clipboardSource = $state(null); // { range, operation: 'cut'|'copy', data }
  let editingCell = $state(null); // { row, col }
  let editingHeader = $state(-1); // -1 = not editing, otherwise column index
  let editingHeaderValue = $state(''); // Temporary value during editing

  // Context menu state
  let contextMenu = $state(null); // { x, y, items, context }
  let ignoreNextBlur = $state(false); // Flag to ignore blur event when clicking context menu

  let tableElement;

  function handleCellChange(rowIndex, colIndex, value) {
    oncellChange?.({
      detail: { rowIndex, colIndex, value },
    });
  }

  function handleInput(rowIndex, colIndex, value) {
    // Update local data only during editing
    gridData.rows[rowIndex][colIndex] = value;
  }

  function stopEditing() {
    if (editingCell) {
      const { row, col } = editingCell;
      const value = gridData.rows[row][col];
      const originalValue = editingCell.originalValue;

      // Only notify parent if value actually changed
      if (value !== originalValue) {
        handleCellChange(row, col, value);
      }

      editingCell = null;
    }
  }

  // Selection functions
  function selectCell(row, col, event) {
    if (event) event.stopPropagation();
    closeContextMenu(); // Close menu when selecting
    selection = {
      type: 'cell',
      startRow: row,
      startCol: col,
      endRow: row,
      endCol: col,
    };
    editingCell = null;
  }

  function selectRow(row, event) {
    if (event) event.stopPropagation();
    closeContextMenu(); // Close menu when selecting
    selection = {
      type: 'row',
      startRow: row,
      startCol: 0,
      endRow: row,
      endCol: gridData.headers.length - 1,
    };
    editingCell = null;
  }

  function selectColumn(col, event) {
    if (event) event.stopPropagation();
    closeContextMenu(); // Close menu when selecting
    selection = {
      type: 'column',
      startRow: 0,
      startCol: col,
      endRow: gridData.rows.length - 1,
      endCol: col,
    };
    editingCell = null;
  }

  function startEditing(row, col) {
    const originalValue = gridData.rows[row][col];
    editingCell = { row, col, originalValue };
    selection = {
      type: 'cell',
      startRow: row,
      startCol: col,
      endRow: row,
      endCol: col,
    };
  }

  function selectAll(event) {
    if (event) event.stopPropagation();
    closeContextMenu();
    selection = {
      type: 'all',
      startRow: 0,
      startCol: 0,
      endRow: gridData.rows.length - 1,
      endCol: gridData.headers.length - 1,
    };
    editingCell = null;
  }

  // Check if cell is selected
  function isCellSelected(row, col) {
    if (!selection) return false;
    // "all" selection type selects all cells
    if (selection.type === 'all') return true;
    return (
      row >= selection.startRow &&
      row <= selection.endRow &&
      col >= selection.startCol &&
      col <= selection.endCol
    );
  }

  function isRowSelected(row) {
    // "all" selection type selects all rows
    if (selection?.type === 'all') return true;
    return selection?.type === 'row' && selection.startRow === row;
  }

  function isColumnSelected(col) {
    // "all" selection type selects all columns
    if (selection?.type === 'all') return true;
    return selection?.type === 'column' && selection.startCol === col;
  }

  function isCellInClipboardSource(row, col) {
    if (!clipboardSource) return false;
    const r = clipboardSource.range;
    return row >= r.startRow && row <= r.endRow && col >= r.startCol && col <= r.endCol;
  }

  // Context menu
  function showContextMenu(event, type, index) {
    event.preventDefault();
    event.stopPropagation();

    // Select the row/column when right-clicking
    if (type === 'row') {
      selectRow(index, null);
    } else if (type === 'column') {
      selectColumn(index, null);
    }

    const items = getContextMenuItems(type, index);
    contextMenu = {
      x: event.clientX,
      y: event.clientY,
      items,
      context: { type, index },
    };
  }

  function getContextMenuItems(type, index) {
    if (type === 'row') {
      return [
        { action: 'cut', label: 'Cut' },
        { action: 'copy', label: 'Copy' },
        { action: 'paste', label: 'Paste', disabled: !clipboardSource },
        { action: 'separator' },
        { action: 'insertAbove', label: 'Insert 1 row above' },
        { action: 'insertBelow', label: 'Insert 1 row below' },
        { action: 'separator' },
        { action: 'deleteRow', label: 'Delete row' },
      ];
    } else if (type === 'column') {
      return [
        { action: 'cut', label: 'Cut' },
        { action: 'copy', label: 'Copy' },
        { action: 'paste', label: 'Paste', disabled: !clipboardSource },
        { action: 'separator' },
        { action: 'insertLeft', label: 'Insert 1 column left' },
        { action: 'insertRight', label: 'Insert 1 column right' },
        { action: 'separator' },
        { action: 'renameColumn', label: 'Rename column' },
        { action: 'separator' },
        { action: 'deleteColumn', label: 'Delete column' },
      ];
    } else if (type === 'edit') {
      return [
        { action: 'cut', label: 'Cut' },
        { action: 'copy', label: 'Copy' },
        { action: 'paste', label: 'Paste' },
      ];
    } else if (type === 'all') {
      // Select all context menu - same as cell
      return [
        { action: 'cut', label: 'Cut' },
        { action: 'copy', label: 'Copy' },
        { action: 'paste', label: 'Paste', disabled: !clipboardSource },
      ];
    } else {
      return [
        { action: 'cut', label: 'Cut' },
        { action: 'copy', label: 'Copy' },
        { action: 'paste', label: 'Paste', disabled: !clipboardSource },
      ];
    }
  }

  async function handleEditAction(action, ctx) {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = ctx.selectionStart;
    const end = ctx.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    if (action === 'cut') {
      await navigator.clipboard.writeText(selectedText);
      const newValue = text.substring(0, start) + text.substring(end);
      handleInput(editingCell.row, editingCell.col, newValue);
      // Restore cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start);
      }, 0);
    } else if (action === 'copy') {
      await navigator.clipboard.writeText(selectedText);
      // Restore selection
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, end);
      }, 0);
    } else if (action === 'paste') {
      try {
        const clipboardText = await navigator.clipboard.readText();
        const newValue = text.substring(0, start) + clipboardText + text.substring(end);
        handleInput(editingCell.row, editingCell.col, newValue);
        // Position cursor after pasted text
        const newCursorPos = start + clipboardText.length;
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
      } catch (err) {
        console.error('Failed to read clipboard:', err);
      }
    }
  }

  function handleContextMenuAction(action) {
    const ctx = contextMenu.context;
    contextMenu = null;

    if (ctx.type === 'edit') {
      handleEditAction(action, ctx.index); // ctx.index contains the edit context object
      return;
    }

    switch (action) {
      case 'cut':
        cut();
        break;
      case 'copy':
        copy();
        break;
      case 'paste':
        paste();
        break;
      case 'insertAbove':
        onaddRow?.(ctx.index - 1);
        break;
      case 'insertBelow':
        onaddRow?.(ctx.index);
        break;
      case 'deleteRow':
        ondeleteRow?.(ctx.index);
        break;
      case 'insertLeft':
        // console.log(
        //   "insertLeft: ctx.index =",
        //   ctx.index,
        //   "calling onaddColumn with",
        //   ctx.index,
        // );
        onaddColumn?.(ctx.index); // Insert before ctx.index
        break;
      case 'insertRight':
        // console.log(
        //   "insertRight: ctx.index =",
        //   ctx.index,
        //   "calling onaddColumn with",
        //   ctx.index + 1,
        // );
        onaddColumn?.(ctx.index + 1); // Insert before ctx.index + 1 (= after ctx.index)
        break;
      case 'deleteColumn':
        ondeleteColumn?.(ctx.index);
        break;
      case 'renameColumn':
        startEditingHeader(ctx.index);
        break;
    }
  }

  function startEditingHeader(colIndex) {
    editingHeader = colIndex;
    editingHeaderValue = gridData.headers[colIndex];
    // Clear selection to prevent paste operations from interfering
    selection = null;
  }

  function finishEditingHeader(colIndex) {
    if (editingHeaderValue && editingHeaderValue !== gridData.headers[colIndex]) {
      // Allow duplicate column names - create new headers array
      const newHeaders = [...gridData.headers];
      newHeaders[colIndex] = editingHeaderValue;

      oncellChange?.({
        detail: {
          type: 'bulkUpdate',
          data: {
            headers: newHeaders,
            rows: gridData.rows.map((r) => [...r]),
          },
        },
      });
    }
    editingHeader = -1;
    editingHeaderValue = '';
  }

  function closeContextMenu() {
    contextMenu = null;
  }

  // Clipboard operations using OS clipboard
  function extractRangeData(range) {
    const data = [];
    for (let r = range.startRow; r <= range.endRow; r++) {
      const row = [];
      for (let c = range.startCol; c <= range.endCol; c++) {
        const cellValue = gridData.rows[r]?.[c] || '';
        // console.log(`Cell [${r},${c}] value:`, JSON.stringify(cellValue));
        row.push(cellValue);
      }
      data.push(row);
    }
    return data;
  }

  // CSV operations using PapaParse
  function dataToCSV(data) {
    return Papa.unparse(data, {
      quotes: true, // Always quote fields for safety
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ',',
      newline: '\n',
    });
  }

  function csvToData(csv) {
    const result = Papa.parse(csv, {
      delimiter: ',',
      newline: '\n',
      skipEmptyLines: false,
      header: false, // Don't treat first row as header
    });
    // console.log("PapaParse result:", result);

    // Normalize line endings: convert CRLF to LF
    const normalizedData = result.data.map((row) =>
      row.map((cell) => cell.replace(/\r\n/g, '\n').replace(/\r/g, '\n')),
    );

    return normalizedData;
  }

  async function cut() {
    if (!selection) return;
    const data = extractRangeData(selection);
    const csv = dataToCSV(data);

    try {
      await navigator.clipboard.writeText(csv);

      // Mark as clipboard source
      clipboardSource = {
        range: { ...selection },
        operation: 'cut',
        data,
      };

      // Do NOT clear cells here. Defer until paste.
    } catch (err) {
      console.error('Failed to cut:', err);
    }
  }

  async function copy() {
    if (!selection) return;
    const data = extractRangeData(selection);
    // console.log("Copy - extracted data:", data);
    // console.log("Copy - selection:", selection);

    const csv = dataToCSV(data);
    // console.log("Copy - CSV output:", csv);

    try {
      await navigator.clipboard.writeText(csv);

      // Mark as clipboard source
      clipboardSource = {
        range: { ...selection },
        operation: 'copy',
        data,
      };
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  async function paste() {
    if (!selection) return;

    try {
      const csv = await navigator.clipboard.readText();
      // console.log("Paste - CSV input:", csv);

      const data = csvToData(csv);
      // console.log("Paste - parsed data:", data);

      // Check if this is a move operation (Cut & Paste)
      // We verify if the clipboard content matches our internal clipboard source
      // to ensure we don't clear data if the user copied something else externally in the meantime.
      if (clipboardSource && clipboardSource.operation === 'cut') {
        const sourceCsv = dataToCSV(clipboardSource.data);
        // Simple check: if the CSVs match (ignoring potential minor formatting diffs if parsed differently,
        // but here we compare raw data if possible, or just assume trust if internal state is fresh).
        // A robust check is comparing the parsed data.
        // Let's assume if clipboardSource exists and we are pasting, we check if the data looks similar.
        // For now, we trust clipboardSource if it exists.
        // Ideally we should check if navigator.clipboard.readText() === sourceCsv, but formatting might differ.

        // Clear source cells
        const range = clipboardSource.range;
        for (let r = range.startRow; r <= range.endRow; r++) {
          for (let c = range.startCol; c <= range.endCol; c++) {
            if (gridData.rows[r]) {
              gridData.rows[r][c] = '';
              // We don't send update yet, we'll send one bulk update at the end
            }
          }
        }
      }

      const targetRow = selection.startRow;
      const targetCol = selection.startCol;

      // Paste data (this will overwrite any cleared cells if ranges overlap)
      for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < data[r].length; c++) {
          const row = targetRow + r;
          const col = targetCol + c;
          if (gridData.rows[row] && col < gridData.headers.length) {
            const pastedValue = data[r][c];
            // console.log(
            //   `Pasting to [${row},${col}]:`,
            //   JSON.stringify(pastedValue),
            // );
            gridData.rows[row][col] = pastedValue;
          }
        }
      }
      gridData.rows = [...gridData.rows];

      // Send single update message for all changes (cleared source + pasted target)
      oncellChange?.({
        detail: {
          type: 'bulkUpdate',
          data: {
            headers: gridData.headers,
            rows: gridData.rows.map((row) => [...row]),
          },
        },
      });

      // Clear clipboard source after paste (for both cut and copy)
      clipboardSource = null;
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  }

  // Click outside to close context menu
  function handleDocumentClick(event) {
    if (contextMenu) {
      // Check if click is outside context menu
      const target = event.target;
      const menuElement = target.closest('.context-menu');
      if (!menuElement) {
        closeContextMenu();
      }
    }
  }

  function handleContextMenuClose() {
    closeContextMenu();
  }

  // Keyboard shortcuts
  function handleKeyDown(event) {
    // If editing cell or header, let the textarea handle events
    if (editingCell || editingHeader !== -1) return;

    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      moveSelection(event.key);
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      copy();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
      cut();
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      paste();
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      if (selection && selection.type === 'cell') {
        // Clear cell content
        const { startRow, startCol, endRow, endCol } = selection;
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            handleCellChange(r, c, '');
          }
        }
      }
    } else if (event.key === 'Enter') {
      // Enter to start editing focused cell
      if (selection && selection.type === 'cell') {
        event.preventDefault();
        startEditing(selection.startRow, selection.startCol);
      }
    } else if (event.key === 'Escape') {
      // Escape to clear clipboard source marker
      if (clipboardSource) {
        clipboardSource = null;
      }
    }
  }

  function moveSelection(key) {
    if (!selection || selection.type !== 'cell') return;

    let { startRow, startCol } = selection;
    let newRow = startRow;
    let newCol = startCol;

    switch (key) {
      case 'ArrowUp':
        newRow--;
        break;
      case 'ArrowDown':
        newRow++;
        break;
      case 'ArrowLeft':
        newCol--;
        break;
      case 'ArrowRight':
        newCol++;
        break;
    }

    // Boundary checks
    if (
      newRow >= 0 &&
      newRow < gridData.rows.length &&
      newCol >= 0 &&
      newCol < gridData.rows[0].length
    ) {
      selectCell(newRow, newCol, null);

      // Scroll into view logic could be added here if needed
      // For now, native scrolling might handle it if focus is managed,
      // but since we don't focus a specific element for selection, we might need manual scrolling.
      ensureCellVisible(newRow, newCol);
    }
  }

  function ensureCellVisible(row, col) {
    // Simple implementation: find the cell element and scroll it into view
    // Since we don't have direct refs to all cells easily, we can use DOM query
    // This is a bit hacky in Svelte but effective for this requirement
    setTimeout(() => {
      const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
      if (cell) {
        cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }, 0);
  }

  function focus(element) {
    element.focus();
  }
</script>

<svelte:document
  onclick={handleDocumentClick}
  onkeydown={handleKeyDown}
  oncontextmenu={(e) => {
    // Close context menu when right-clicking anywhere
    if (contextMenu && !e.target.closest('.context-menu')) {
      closeContextMenu();
    }
  }}
/>

{#if editingCell}
  <!-- Overlay to catch clicks outside the editing cell -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="edit-overlay"
    onmousedown={(e) => {
      // Stop editing on mousedown to avoid conflict with drag selection (which ends with mouseup)
      // Only stop if it's a left click (button 0)
      if (e.button === 0) {
        stopEditing();
      }
    }}
    oncontextmenu={(e) => {
      e.preventDefault();
      stopEditing();
    }}
  ></div>
{/if}

{#if editingHeader !== -1}
  <!-- Overlay to catch clicks outside the editing header -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="edit-overlay"
    onmousedown={(e) => {
      if (e.button === 0) {
        finishEditingHeader(editingHeader);
      }
    }}
    oncontextmenu={(e) => {
      e.preventDefault();
      finishEditingHeader(editingHeader);
    }}
  ></div>
{/if}

<div class="datagrid-wrapper">
  <div class="grid-container">
    <table bind:this={tableElement}>
      <thead>
        <tr>
          <th
            class="corner-cell"
            class:selected={selection?.type === 'all'}
            onclick={selectAll}
            oncontextmenu={(e) => {
              selectAll(e);
              showContextMenu(e, 'all', null);
            }}
          ></th>
          {#each gridData.headers as header, colIndex}
            <th
              class:selected={isColumnSelected(colIndex)}
              onclick={(e) => selectColumn(colIndex, e)}
              oncontextmenu={(e) => showContextMenu(e, 'column', colIndex)}
            >
              {#if editingHeader === colIndex}
                <HeaderEditor
                  value={editingHeaderValue}
                  oninput={(val) => (editingHeaderValue = val)}
                  onstop={() => finishEditingHeader(colIndex)}
                  onshowContextMenu={(e, ctx) => {
                    ignoreNextBlur = true;
                    showEditContextMenu(e, ctx);
                  }}
                />
              {:else}
                <span class="header-text">{header}</span>
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each gridData.rows as row, rowIndex}
          <tr class:selected={isRowSelected(rowIndex)}>
            <td
              class="row-number"
              class:selected={isRowSelected(rowIndex)}
              onclick={(e) => selectRow(rowIndex, e)}
              oncontextmenu={(e) => showContextMenu(e, 'row', rowIndex)}
            >
              {rowIndex + 1}
            </td>
            {#each row as cellValue, colIndex}
              <td
                class="cell"
                class:selected={isCellSelected(rowIndex, colIndex)}
                class:editing={editingCell?.row === rowIndex && editingCell?.col === colIndex}
                class:clipboard-source={isCellInClipboardSource(rowIndex, colIndex)}
                data-vscode-context={JSON.stringify({
                  webviewSection: 'cell',
                  'tabmark.contextType': 'cell',
                  'tabmark.hasClipboard': clipboardSource !== null,
                  rowIndex,
                  colIndex,
                })}
                data-row={rowIndex}
                data-col={colIndex}
                tabindex="-1"
                onclick={(e) => selectCell(rowIndex, colIndex, e)}
                ondblclick={() => startEditing(rowIndex, colIndex)}
                oncontextmenu={(e) => {
                  // Don't show custom menu if clicking inside textarea (editing)
                  // But wait, we WANT to show custom menu for editing now.
                  // The CellEditor handles its own context menu event.
                  // So we just need to handle non-editing cells here.
                  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
                    return;
                  }
                  e.preventDefault();
                  selectCell(rowIndex, colIndex, null);
                  showContextMenu(e, 'cell', { row: rowIndex, col: colIndex });
                }}
              >
                {#if editingCell?.row === rowIndex && editingCell?.col === colIndex}
                  <CellEditor
                    value={cellValue}
                    {rowIndex}
                    {colIndex}
                    {ignoreNextBlur}
                    oninput={(val) => handleInput(rowIndex, colIndex, val)}
                    onstopEditing={stopEditing}
                    onshowContextMenu={(e, ctx) => {
                      e.stopPropagation(); // Stop propagation to prevent cell context menu
                      showContextMenu(e, 'edit', ctx);
                      ignoreNextBlur = true;
                    }}
                    onfocus={() => {
                      if (ignoreNextBlur) ignoreNextBlur = false;
                    }}
                    onclick={closeContextMenu}
                  />
                {:else}
                  <div class="cell-display">{cellValue}</div>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

{#if contextMenu}
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    items={contextMenu.items}
    onselect={handleContextMenuAction}
    onclose={handleContextMenuClose}
  />
{/if}

<style>
  .datagrid-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .grid-container {
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: var(--vscode-editor-background);
    user-select: none;
  }

  table {
    width: max-content;
    min-width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  th,
  td {
    border: 1px solid var(--vscode-panel-border);
    padding: 0;
    position: relative;
  }

  td {
    height: 1px; /* Trick to make child height: 100% work */
  }

  th {
    height: auto;
  }

  th {
    background-color: var(--vscode-editorGroupHeader-tabsBackground);
    color: var(--vscode-foreground);
    font-weight: 600;
    padding: 8px;
    position: sticky;
    top: 0;
    z-index: 10;
    cursor: pointer;
  }

  th.selected {
    background-color: var(--vscode-list-activeSelectionBackground);
    color: var(--vscode-list-activeSelectionForeground);
    font-weight: bold;
  }

  .corner-cell {
    position: sticky;
    left: 0;
    z-index: 15;
    min-width: 50px;
    max-width: 50px;
    cursor: default;
  }

  .header-text {
    display: block;
    white-space: pre-wrap;
  }

  .row-number {
    background-color: var(--vscode-sideBar-background);
    color: var(--vscode-sideBar-foreground);
    text-align: center;
    min-width: 50px;
    max-width: 50px;
    font-weight: normal;
    position: sticky;
    left: 0;
    z-index: 5;
    cursor: pointer;
  }

  .row-number.selected {
    background-color: var(--vscode-list-activeSelectionBackground);
    color: var(--vscode-list-activeSelectionForeground);
    font-weight: bold;
    /* No outline/border to distinguish from cells */
    outline: none;
  }

  tr.selected {
    background-color: var(--vscode-list-inactiveSelectionBackground);
  }

  td {
    min-width: 120px;
    cursor: cell;
    outline: none;
  }

  td.selected {
    background-color: var(--vscode-list-activeSelectionBackground);
    outline: 2px solid var(--vscode-focusBorder);
    outline-offset: -2px;
  }

  td.clipboard-source {
    outline: 2px dashed var(--vscode-editorInfo-foreground);
    outline-offset: -2px;
  }

  .cell-display {
    padding: 8px;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 13px;
    line-height: 1.5;
  }
  .edit-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100;
    background-color: transparent;
  }

  td.editing {
    z-index: 101;
    /* Ensure background is opaque so overlay doesn't show through if it had color */
    background-color: var(--vscode-editor-background);
    outline: none; /* Hide selection outline as we draw our own border */
  }

  /* Draw borders using pseudo-element to sit ON TOP of the textarea */
  td.editing::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    /* 
       1. Inner blue border (2px) - matches selection style
       2. Outer light border (1px) - requested addition
    */
    box-shadow:
      inset 0 0 0 2px var(--vscode-focusBorder),
      0 0 0 1px var(--vscode-list-activeSelectionBackground);
    pointer-events: none;
    z-index: 102;
  }
</style>
