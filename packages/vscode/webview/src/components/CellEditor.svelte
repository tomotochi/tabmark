<script>
  import TextEditor from './TextEditor.svelte';

  let {
    value,
    rowIndex,
    colIndex,
    oninput,
    onstopEditing,
    onshowContextMenu,
    onfocus,
    onclick,
    ignoreNextBlur = false,
  } = $props();

  function handleKeydown(e) {
    // Cell-specific keyboard handling can go here if needed
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="cell-editor-wrapper"
  onclick={(e) => {
    e.stopPropagation();
    onclick?.();
  }}
  oncontextmenu={(e) => {
    e.preventDefault();
    const textarea = e.target.closest('.text-editor-container')?.querySelector('textarea');
    if (textarea) {
      onshowContextMenu(e, {
        row: rowIndex,
        col: colIndex,
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd,
      });
    }
  }}
>
  <TextEditor
    {value}
    {oninput}
    onstop={onstopEditing}
    onkeydown={handleKeydown}
    autofocus={true}
    selectOnFocus={false}
  />
</div>

<style>
  .cell-editor-wrapper {
    width: 100%;
    height: 100%;
  }
</style>
