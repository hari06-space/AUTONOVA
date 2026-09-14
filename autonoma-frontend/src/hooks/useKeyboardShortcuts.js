import { useEffect, useRef } from 'react';

// ==============================|| KEYBOARD SHORTCUTS HOOK - BOS SOP #4 ||============================== //

/**
 * Reusable hook for keyboard shortcut support (BOS SOP Rule #4).
 *
 * @param {Object} shortcuts - Map of shortcut strings to handler functions
 * @param {boolean} enabled - Whether shortcuts are active (default: true)
 */
export default function useKeyboardShortcuts(shortcuts = {}, enabled = true, elementRef = null) {
  // Use a ref so the event listener always reads the latest handlers
  // without needing to be re-registered on every render.
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const isSpaceDownRef = useRef(false);
  const lastLTimeRef = useRef(0);
  const lastCTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!enabledRef.current) return;

      // Don't trigger shortcuts when typing in inputs (unless it's Escape)
      const tag = e.target?.tagName?.toLowerCase();
      const isInput =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        e.target?.isContentEditable ||
        e.target?.closest?.('[contenteditable="true"]') ||
        e.target?.getAttribute?.('role') === 'textbox' ||
        e.target?.getAttribute?.('role') === 'combobox' ||
        e.target?.getAttribute?.('role') === 'listbox' ||
        e.target?.getAttribute?.('role') === 'option' ||
        e.target?.closest?.('.MuiPopover-root') ||
        e.target?.closest?.('.MuiMenu-root');

      const isSpace = e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space';

      if (isSpace && !isInput) {
        isSpaceDownRef.current = true;
        e.preventDefault();
      }

      const parts = [];
      if (isSpaceDownRef.current) parts.push('space');
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');

      const key = e.key ? e.key.toLowerCase() : '';
      if (key && !isSpace && !['control', 'meta', 'shift', 'alt'].includes(key)) {
        parts.push(key === 'enter' ? 'enter' : key === 'escape' ? 'escape' : key);
      }

      const combo = parts.join('+');

      // Block the old modifier combinations that were replaced by global Space+Key shortcuts
      const blockedCombos = new Set([
        'ctrl+n', 'alt+n',
        'alt+s',
        'alt+e',
        'ctrl+d', 'alt+d',
        'ctrl+a', 'alt+a',
        'ctrl+f', 'alt+f'
      ]);

      if (blockedCombos.has(combo.toLowerCase())) {
        return;
      }

      const currentShortcuts = shortcutsRef.current;

      // Allow Escape even in inputs
      if (combo === 'escape' && currentShortcuts['escape']) {
        const visibleModals = Array.from(document.querySelectorAll('.MuiDialog-root, .MuiModal-root'))
          .filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          });

        if (visibleModals.length > 0) {
          const topmostModal = visibleModals[visibleModals.length - 1];

          if (elementRef?.current) {
            const myModal = elementRef.current.closest('.MuiDialog-root, .MuiModal-root');
            if (myModal && myModal !== topmostModal) {
              // Ignore Escape event if my dialog is NOT the topmost active/visible dialog
              return;
            }
          } else {
            // Page-level hook: Ignore Escape if any active modal/dialog is visible
            return;
          }
        }

        e.preventDefault();
        currentShortcuts['escape']();
        return;
      }

      // Allow ctrl/meta combos even in inputs
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey || isSpaceDownRef.current;
      if (isInput && !hasModifier) return;

      let handler = currentShortcuts[combo] || currentShortcuts[combo.toLowerCase()];

      // Fallback matching for Space+Key combinations
      if (key && isSpaceDownRef.current) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 't') {
          handler = currentShortcuts['t'] || currentShortcuts['space+t'] || currentShortcuts['template'] || currentShortcuts['template_designer'];
        } else if (lowerKey === 'b') {
          handler = currentShortcuts['b'] || currentShortcuts['space+b'] || currentShortcuts['back'];
        } else if (lowerKey === 'c') {
          handler = currentShortcuts['c'] || currentShortcuts['space+c'] || currentShortcuts['clear'] || currentShortcuts['reset'] || currentShortcuts['cancel'] || currentShortcuts['cancel_selection'] || currentShortcuts['close'];
        } else if (lowerKey === 's') {
          handler = currentShortcuts['s'] || currentShortcuts['space+s'] || currentShortcuts['save'] || currentShortcuts['submit'];
        } else if (lowerKey === 'l') {
          handler = currentShortcuts['l'] || currentShortcuts['space+l'] || currentShortcuts['call_letter'];
        } else if (lowerKey === 'a') {
          handler = currentShortcuts['a'] || currentShortcuts['space+a'] || currentShortcuts['assign'] || currentShortcuts['amend'];
        } else if (lowerKey === 'v') {
          handler = currentShortcuts['v'] || currentShortcuts['space+v'] || currentShortcuts['verification'] || currentShortcuts['evaluate'] || currentShortcuts['verify'];
        } else if (!handler) {
          if (lowerKey === 'n') {
            handler = currentShortcuts['n'] || currentShortcuts['space+n'] || currentShortcuts['new'];
          } else if (lowerKey === 'o') {
            handler = currentShortcuts['o'] || currentShortcuts['space+o'] || currentShortcuts['offer'];
          }
        }
      }

      if (handler && !isSpace) {
        e.preventDefault();
        e.stopPropagation();
        handler();
      }
    };

    const handleKeyUp = (e) => {
      const isSpace = e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space';
      if (isSpace) {
        isSpaceDownRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, []);
}

export const SHORTCUT_KEYS = {
  NEW: { key: 'n', label: 'Space + N' },
  SAVE: { key: 's', label: 'Space + S' },
  TEMPLATE: { key: 't', label: 'Space + T' },
  CLEAR: { key: 'c', label: 'Space + C' },
  BACK: { key: 'b', label: 'Space + B' },
  AMEND: { key: 'a', label: 'Space + A' },
  EXPORT: { key: 'e', label: 'Space + E' },
  ASSIGN: { key: 'a', label: 'Space + A' },
  EVALUATE: { key: 'v', label: 'Space + V' },
  OFFER: { key: 'o', label: 'Space + O' },
  CANCEL_SELECTION: { key: 'c', label: 'Space + C' },
  CALL_LETTER: { key: 'l', label: 'Space + L' },
  REJECT: { key: 'r', label: 'Space + R' },
  VERIFY: { key: 'v', label: 'Space + V' },
  VERIFICATION: { key: 'v', label: 'Space + V' },
  CLOSE: { key: 'c', label: 'Esc' },
  SEND_REJECTION_MAIL: { key: 'm', label: 'Space + M' }
};

/**
 * Helper to generate tooltip text with shortcut hint dynamically.
 * @param {string} label - Button label (e.g., "Save", "Reject", "Verify")
 * @param {string} shortcut - Custom shortcut key override
 * @returns {string} Formatted tooltip string
 */
export function shortcutTooltip(label, shortcut) {
  if (shortcut) {
    return `${label} (${shortcut})`;
  }
  const cleanLabel = label ? String(label).toLowerCase().trim() : '';

  if (cleanLabel.includes('template')) {
    return `${label} (${SHORTCUT_KEYS.TEMPLATE.label})`;
  }
  if (cleanLabel.includes('clear') || cleanLabel === 'reset' || cleanLabel.includes('clear form')) {
    return `${label} (${SHORTCUT_KEYS.CLEAR.label})`;
  }
  if (cleanLabel === 'back' || cleanLabel.includes('go back') || cleanLabel.includes('return')) {
    return `${label} (${SHORTCUT_KEYS.BACK.label})`;
  }
  if (cleanLabel.includes('new') || cleanLabel.includes('create') || cleanLabel === 'add') {
    return `${label} (${SHORTCUT_KEYS.NEW.label})`;
  }
  if (cleanLabel.includes('save') || cleanLabel === 'submit') {
    return `${label} (${SHORTCUT_KEYS.SAVE.label})`;
  }
  if (cleanLabel.includes('amend')) {
    return `${label} (${SHORTCUT_KEYS.AMEND.label})`;
  }
  if (cleanLabel.includes('export') || cleanLabel.includes('download')) {
    return `${label} (${SHORTCUT_KEYS.EXPORT.label})`;
  }
  if (cleanLabel.includes('assign')) {
    return `${label} (${SHORTCUT_KEYS.ASSIGN.label})`;
  }
  if (cleanLabel.includes('evaluate') || cleanLabel.includes('final resolution')) {
    return `${label} (${SHORTCUT_KEYS.EVALUATE.label})`;
  }
  if (cleanLabel.includes('offer')) {
    return `${label} (${SHORTCUT_KEYS.OFFER.label})`;
  }
  if (cleanLabel.includes('send rejection mail') || cleanLabel.includes('rejection mail')) {
    return `${label} (${SHORTCUT_KEYS.SEND_REJECTION_MAIL.label})`;
  }
  if (cleanLabel.includes('call letter') || cleanLabel.includes('send call')) {
    return `${label} (${SHORTCUT_KEYS.CALL_LETTER.label})`;
  }
  if (cleanLabel.includes('reject') || cleanLabel.includes('disapprove')) {
    return `${label} (${SHORTCUT_KEYS.REJECT.label})`;
  }
  if (cleanLabel.includes('verification')) {
    return `${label} (${SHORTCUT_KEYS.VERIFICATION.label})`;
  }
  if (cleanLabel.includes('verify') || cleanLabel.includes('verified') || cleanLabel.includes('accept')) {
    return `${label} (${SHORTCUT_KEYS.VERIFY.label})`;
  }
  if (cleanLabel.includes('cancel_selection') || cleanLabel === 'cancel' || cleanLabel.includes('cancel selection')) {
    return `${label} (${SHORTCUT_KEYS.CANCEL_SELECTION.label})`;
  }
  if (cleanLabel.includes('close')) {
    return `${label} (${SHORTCUT_KEYS.CLOSE.label})`;
  }

  return label;
}
