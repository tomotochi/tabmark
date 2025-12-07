<script>
  import { onMount } from 'svelte';
  import DataGrid from './components/DataGrid.svelte';

  let gridData = $state({ headers: [], rows: [] });
  const vscode = acquireVsCodeApi();

  onMount(() => {
    // console.log("App mounted (Svelte 5)");

    window.addEventListener('message', (event) => {
      const message = event.data;
      // console.log("Received message:", message);

      if (message.type === 'update') {
        // console.log("Updating grid data:", message.data);
        gridData = message.data;
      }
    });

    // console.log("Sending ready message");
    vscode.postMessage({ type: 'ready' });
  });

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
  <DataGrid
    {gridData}
    oncellChange={handleCellChange}
    onaddRow={addRow}
    onaddColumn={addColumn}
    ondeleteRow={deleteRow}
    ondeleteColumn={deleteColumn}
  />
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
</style>
