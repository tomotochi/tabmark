<script>
  let { value, rowIndex, colIndex, onchange } = $props();

  function handleInput(event) {
    onchange(rowIndex, colIndex, event.target.value);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && (event.ctrlKey || event.shiftKey)) {
      event.preventDefault();
      const target = event.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      target.value = val.substring(0, start) + '\n' + val.substring(end);
      target.selectionStart = target.selectionEnd = start + 1;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
</script>

<textarea {value} oninput={handleInput} onkeydown={handleKeyDown} placeholder="Enter text..."
></textarea>

<style>
  textarea {
    width: 100%;
    min-height: 60px;
    padding: 8px;
    border: none;
    background-color: transparent;
    color: var(--vscode-editor-foreground);
    font-family: var(--vscode-font-family);
    font-size: 13px;
    resize: vertical;
    outline: none;
  }

  textarea:focus {
    background-color: var(--vscode-input-background);
    outline: 1px solid var(--vscode-focusBorder);
  }
</style>
