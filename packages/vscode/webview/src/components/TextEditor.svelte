<script>
  let {
    value,
    oninput,
    onstop,
    onkeydown = null,
    autofocus = false,
    selectOnFocus = false,
    fontWeight = 'normal',
    minHeight = '36px',
    showBorder = false,
    placeholder = '',
  } = $props();

  let textarea;

  function focus(element) {
    if (autofocus) {
      element.focus();
      if (selectOnFocus) {
        element.select();
      }
    }
  }

  function handleKeydown(e) {
    // Call custom handler first
    if (onkeydown) {
      onkeydown(e);
      if (e.defaultPrevented) return;
    }

    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      onstop();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onstop();
    } else if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
      // Multi-line support
      e.preventDefault();
      e.stopPropagation();
      const target = e.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = target.value.substring(0, start) + '\n' + target.value.substring(end);
      oninput(newValue);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 1;
      });
    }
    // Arrow keys and other navigation keys are allowed to work normally
  }

  function handleInput(e) {
    oninput(e.target.value);
  }
</script>

<div class="text-editor-container">
  <!-- Ghost element for auto-sizing -->
  <div class="ghost-text" style:font-weight={fontWeight} style:min-height={minHeight}>
    {value + '\u200b'}
  </div>

  <textarea
    bind:this={textarea}
    use:focus
    {value}
    {placeholder}
    class:with-border={showBorder}
    style:font-weight={fontWeight}
    oninput={handleInput}
    onkeydown={handleKeydown}
  ></textarea>
</div>

<style>
  .text-editor-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100%;
  }

  .ghost-text {
    visibility: hidden;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    padding: 8px;
    font-family: var(--vscode-font-family);
    font-size: 13px;
    line-height: 1.5;
    box-sizing: border-box;
  }

  textarea {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    margin: 0;
    padding: 8px;
    border: none;
    outline: none;
    background-color: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-family: var(--vscode-font-family);
    font-size: 13px;
    line-height: 1.5;
    resize: none;
    overflow: hidden;
  }

  textarea.with-border {
    border: 1px solid var(--vscode-focusBorder);
  }

  textarea::selection {
    background-color: var(--vscode-editor-selectionBackground);
    color: var(--vscode-editor-selectionForeground);
  }
</style>
