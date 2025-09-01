import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when user is typing in form inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Exception: Allow some shortcuts even in inputs (like Ctrl+Enter)
        const isAllowedInInput = shortcuts.some(shortcut => {
          const matches = 
            event.key.toLowerCase() === shortcut.key.toLowerCase() &&
            !!event.ctrlKey === !!shortcut.ctrl &&
            !!event.metaKey === !!shortcut.meta &&
            !!event.shiftKey === !!shortcut.shift &&
            !!event.altKey === !!shortcut.alt;
          
          return matches && (shortcut.key === 'Enter' || shortcut.key === 'Escape');
        });

        if (!isAllowedInInput) return;
      }

      for (const shortcut of shortcuts) {
        const matches = 
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrl &&
          !!event.metaKey === !!shortcut.meta &&
          !!event.shiftKey === !!shortcut.shift &&
          !!event.altKey === !!shortcut.alt;

        if (matches) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

// Common keyboard shortcuts for the app
export const createAppShortcuts = (actions: {
  analyze?: () => void;
  editProfile?: () => void;
  expandChat?: () => void;
  showHelp?: () => void;
  clearForm?: () => void;
}): KeyboardShortcut[] => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.analyze) {
    shortcuts.push({
      key: 'Enter',
      ctrl: true,
      action: actions.analyze,
      description: 'Analyze job match (Ctrl+Enter)'
    });
  }

  if (actions.editProfile) {
    shortcuts.push({
      key: 'e',
      ctrl: true,
      action: actions.editProfile,
      description: 'Edit profile (Ctrl+E)'
    });
  }

  if (actions.expandChat) {
    shortcuts.push({
      key: 'c',
      ctrl: true,
      action: actions.expandChat,
      description: 'Toggle chat (Ctrl+C)'
    });
  }

  if (actions.showHelp) {
    shortcuts.push({
      key: '?',
      shift: true,
      action: actions.showHelp,
      description: 'Show help (Shift+?)'
    });
  }

  if (actions.clearForm) {
    shortcuts.push({
      key: 'Escape',
      action: actions.clearForm,
      description: 'Clear current form (Escape)'
    });
  }

  return shortcuts;
};

// Hook for displaying keyboard shortcuts help
export const useShortcutHelp = () => {
  const getShortcutDisplay = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.meta) parts.push('Cmd');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    
    parts.push(shortcut.key === ' ' ? 'Space' : shortcut.key);
    
    return parts.join('+');
  };

  return { getShortcutDisplay };
};
