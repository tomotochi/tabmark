<script>
  import { onMount } from 'svelte';
  import DataGrid from './components/DataGrid.svelte';

  let gridData = $state({ headers: [], rows: [] });
  let showGuide = $state(false);
  let validationErrors = $state([]);
  const vscode = acquireVsCodeApi();

  onMount(() => {
    // console.log("App mounted (Svelte 5)");

    window.addEventListener('message', (event) => {
      const message = event.data;
      // console.log("Received message:", message);

      if (message.type === 'update') {
        // console.log("Updating grid data:", message.data);
        showGuide = false;
        gridData = message.data;
      } else if (message.type === 'showGuide') {
        showGuide = true;
        validationErrors = message.errors || [];
      }
    });

    // console.log("Sending ready message");
    vscode.postMessage({ type: 'ready' });
  });

  function openWithOtherEditor() {
    vscode.postMessage({ type: 'openWithOtherEditor' });
  }

  function initializeGrid() {
    vscode.postMessage({ type: 'initializeGrid' });
  }

  function importCSV() {
    vscode.postMessage({ type: 'triggerImportCSV' });
  }

  function handleCellChange(event) {
    if (event.detail.type === 'bulkUpdate') {
      // console.log("Handling bulk update:", event.detail.data);
      gridData = event.detail.data;
      vscode.postMessage({
        type: 'update',
        data: JSON.parse(JSON.stringify(gridData)),
      });
      return;
    }

    const { rowIndex, colIndex, value } = event.detail;

    gridData.rows[rowIndex][colIndex] = value;

    vscode.postMessage({
      type: 'cellChange',
      data: {
        rowIndex,
        colIndex,
        value,
      },
    });
  }

  function addRow(afterIndex) {
    const newRow = new Array(gridData.headers.length).fill('');
    // Insert after the specified index
    gridData.rows = [
      ...gridData.rows.slice(0, afterIndex + 1),
      newRow,
      ...gridData.rows.slice(afterIndex + 1),
    ];

    vscode.postMessage({
      type: 'addRow',
      data: {
        headers: [...gridData.headers],
        rows: gridData.rows.map((row) => [...row]),
      },
    });
  }

  function addColumn(beforeIndex) {
    // console.log("addColumn called with beforeIndex:", beforeIndex);
    // console.log("Current headers:", gridData.headers);

    const newHeader = `Column ${gridData.headers.length + 1}`;
    // Insert before the specified index
    gridData.headers = [
      ...gridData.headers.slice(0, beforeIndex),
      newHeader,
      ...gridData.headers.slice(beforeIndex),
    ];

    // console.log("New headers:", gridData.headers);

    gridData.rows = gridData.rows.map((row) => [
      ...row.slice(0, beforeIndex),
      '',
      ...row.slice(beforeIndex),
    ]);

    vscode.postMessage({
      type: 'addColumn',
      data: {
        headers: [...gridData.headers],
        rows: gridData.rows.map((row) => [...row]),
      },
    });
  }

  function deleteRow(rowIndex) {
    gridData.rows = [...gridData.rows.slice(0, rowIndex), ...gridData.rows.slice(rowIndex + 1)];

    vscode.postMessage({
      type: 'update',
      data: {
        headers: [...gridData.headers],
        rows: gridData.rows.map((row) => [...row]),
      },
    });
  }

  function deleteColumn(colIndex) {
    gridData.headers = [
      ...gridData.headers.slice(0, colIndex),
      ...gridData.headers.slice(colIndex + 1),
    ];
    gridData.rows = gridData.rows.map((row) => [
      ...row.slice(0, colIndex),
      ...row.slice(colIndex + 1),
    ]);

    vscode.postMessage({
      type: 'update',
      data: {
        headers: [...gridData.headers],
        rows: gridData.rows.map((row) => [...row]),
      },
    });
  }
</script>

<main>
  {#if showGuide}
    <div class="guide-screen">
      <div class="guide-content">
        <h1>Invalid Tabmark Structure</h1>
        <p>This file doesn't have a valid Tabmark structure.</p>

        {#if validationErrors.length > 0}
          <div class="errors">
            <h2>Issues found:</h2>
            <ul>
              {#each validationErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <div class="actions">
          <button class="secondary-button" onclick={openWithOtherEditor}> Open With... </button>
          <button class="primary-button" onclick={initializeGrid}> Initialize 1×1 Grid </button>
          <button class="secondary-button" onclick={importCSV}> Import from CSV </button>
        </div>
      </div>
    </div>
  {:else}
    <DataGrid
      {gridData}
      oncellChange={handleCellChange}
      onaddRow={addRow}
      onaddColumn={addColumn}
      ondeleteRow={deleteRow}
      ondeleteColumn={deleteColumn}
    />
  {/if}
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden; /* Prevent body scrollbar */
  }

  main {
    padding: 0;
    margin: 0;
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    background-color: var(--vscode-editor-background);
    height: 100vh;
    width: 100%; /* Use 100% instead of 100vw to avoid scrollbar issues */
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .guide-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    padding: 2rem;
  }

  .guide-content {
    max-width: 600px;
    text-align: center;
  }

  .guide-content h1 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--vscode-foreground);
  }

  .guide-content p {
    font-size: 1rem;
    margin-bottom: 1.5rem;
    color: var(--vscode-descriptionForeground);
  }

  .errors {
    background-color: var(--vscode-inputValidation-errorBackground);
    border: 1px solid var(--vscode-inputValidation-errorBorder);
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 2rem;
    text-align: left;
  }

  .errors h2 {
    font-size: 1rem;
    margin: 0 0 0.5rem 0;
    color: var(--vscode-errorForeground);
  }

  .errors ul {
    margin: 0;
    padding-left: 1.5rem;
    color: var(--vscode-errorForeground);
  }

  .errors li {
    margin: 0.25rem 0;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: var(--vscode-font-family);
    transition: opacity 0.2s;
  }

  button:hover {
    opacity: 0.8;
  }

  .primary-button {
    background-color: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }

  .primary-button:hover {
    background-color: var(--vscode-button-hoverBackground);
  }

  .secondary-button {
    background-color: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
  }

  .secondary-button:hover {
    background-color: var(--vscode-button-secondaryHoverBackground);
  }
</style>
