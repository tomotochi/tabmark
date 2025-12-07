<script>
  import { onMount } from 'svelte';

  let { x, y, items, onselect, onclose } = $props();

  let menuElement;
  let adjustedX = $state(0);
  let adjustedY = $state(0);

  function handleItemClick(action, event) {
    event.stopPropagation();
    onselect?.(action);
  }

  function handleClickOutside(event) {
    event.stopPropagation();
  }

  function calculatePosition(element, targetX, targetY) {
    const rect = element.getBoundingClientRect();
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;

    let newX = targetX;
    let newY = targetY;

    // Adjust horizontal position: if menu goes off right edge, show it to the left of cursor
    if (targetX + rect.width > winWidth) {
      newX = targetX - rect.width;
    }

    // Adjust vertical position: if menu goes off bottom edge, show it above cursor
    if (targetY + rect.height > winHeight) {
      newY = targetY - rect.height;
    }

    // Ensure it doesn't go off-screen to the left or top
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;

    return { x: newX, y: newY };
  }

  $effect(() => {
    if (menuElement) {
      const { x: newX, y: newY } = calculatePosition(menuElement, x, y);
      adjustedX = newX;
      adjustedY = newY;
    }
  });
</script>

<div
  bind:this={menuElement}
  class="context-menu"
  style="left: {adjustedX}px; top: {adjustedY}px"
  onclick={handleClickOutside}
  onkeydown={(e) => e.key === 'Escape' && onclose?.()}
  oncontextmenu={(e) => e.preventDefault()}
  role="menu"
  tabindex="-1"
>
  {#each items as item}
    {#if item.action === 'separator'}
      <div class="separator"></div>
    {:else}
      <button
        class="menu-item"
        disabled={item.disabled}
        onclick={(e) => handleItemClick(item.action, e)}
      >
        {item.label}
      </button>
    {/if}
  {/each}
</div>

<style>
  .context-menu {
    position: fixed;
    background-color: var(--vscode-menu-background);
    border: 1px solid var(--vscode-menu-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    padding: 4px 0;
    min-width: 200px;
    z-index: 1000;
    font-size: 13px;
  }

  .menu-item {
    display: block;
    width: 100%;
    padding: 6px 12px;
    border: none;
    background: none;
    color: var(--vscode-menu-foreground);
    text-align: left;
    cursor: pointer;
    font-family: var(--vscode-font-family);
    font-size: 13px;
  }

  .menu-item:hover:not(:disabled) {
    background-color: var(--vscode-menu-selectionBackground);
    color: var(--vscode-menu-selectionForeground);
  }

  .menu-item:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .separator {
    height: 1px;
    background-color: var(--vscode-menu-separatorBackground);
    margin: 4px 0;
  }
</style>
