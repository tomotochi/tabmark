<script>
  import TextEditor from './TextEditor.svelte';

  let { value, oninput, onstop, onshowContextMenu = null } = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="header-editor-wrapper"
  onclick={(e) => e.stopPropagation()}
  onmousedown={(e) => e.stopPropagation()}
  oncontextmenu={(e) => {
    if (onshowContextMenu) {
      e.preventDefault();
      const textarea = e.target.closest('.text-editor-container')?.querySelector('textarea');
      if (textarea) {
        onshowContextMenu(e, {
          selectionStart: textarea.selectionStart,
          selectionEnd: textarea.selectionEnd,
        });
      }
    }
  }}
>
  <TextEditor
    {value}
    {oninput}
    {onstop}
    autofocus={true}
    selectOnFocus={true}
    fontWeight="600"
    showBorder={true}
  />
</div>

<style>
  .header-editor-wrapper {
    width: 100%;
    height: 100%;
  }
</style>
