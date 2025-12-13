import { onMounted, onUnmounted } from 'vue';

export function useKeyboardShortcuts(shortcuts) {
  const handleKeydown = (event) => {
    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;

    // Build shortcut string (e.g., "ctrl+n", "ctrl+shift+p")
    let shortcut = '';
    if (ctrl) shortcut += 'ctrl+';
    if (shift) shortcut += 'shift+';
    if (alt) shortcut += 'alt+';
    shortcut += key;

    // Check if shortcut exists and execute
    if (shortcuts[shortcut]) {
      event.preventDefault();
      shortcuts[shortcut]();
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
  });

  return {
    handleKeydown
  };
}
