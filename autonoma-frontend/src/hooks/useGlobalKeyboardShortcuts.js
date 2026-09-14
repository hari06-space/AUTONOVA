import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHORTCUT_KEYS } from './useKeyboardShortcuts';

// ==============================|| GLOBAL KEYBOARD SHORTCUTS HOOK ||============================== //

/**
 * Global Keyboard Shortcuts hook for BOS Portal.
 * Handles Space + Key combinations by searching the DOM for matching elements
 * or triggering standard global actions (Home, Fullscreen, etc.).
 */
export default function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    let spacePressed = false;
    let spacePressedTime = 0;
    let spaceTimeout = null;
    let shiftPressedTime = 0;
    let lastLPressTime = 0;
    let lastCPressTime = 0;

    const clickIfVisibleAndActive = (el) => {
      if (!el) return false;
      const isDisabled =
        el.disabled ||
        el.getAttribute('aria-disabled') === 'true' ||
        el.classList.contains('Mui-disabled');

      if (isDisabled) return false;

      const isVisible =
        el.offsetWidth > 0 ||
        el.offsetHeight > 0 ||
        el.getClientRects().length > 0;

      if (!isVisible) return false;

      el.click();
      return true;
    };

    const findCandidatesByText = (texts) => {
      const selector = 'button, a, [role="button"], .MuiButton-root, .MuiIconButton-root, .MuiListItemButton-root, [onclick]';
      const modals = Array.from(document.querySelectorAll('.MuiDialog-root, .MuiDrawer-root, .MuiModal-root'));
      const activeModal = modals.filter(m => {
        const style = window.getComputedStyle(m);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }).pop();

      const container = activeModal || document;
      const elements = Array.from(container.querySelectorAll(selector));
      return elements.filter((el) => {
        const elText = el.textContent.trim().toLowerCase();
        return texts.some((t) => {
          if (t === 'new' || t === 'add' || t === 'save') {
            return (
              elText === t ||
              elText === `+ ${t}` ||
              elText === `${t} +` ||
              elText.startsWith(`${t} `) ||
              elText.endsWith(` ${t}`) ||
              elText === `+${t}`
            );
          }
          if (t === 'verify') {
            return elText.includes('verify') && !elText.includes('verification');
          }
          return elText.includes(t);
        });
      });
    };

    const triggerAction = (type) => {
      if (type === 'aura-ai') {
        window.dispatchEvent(new CustomEvent('toggle-aura'));
        return;
      }

      if (type === 'home') {
        navigate('/dashboard/user-task-queue');
        return;
      }

      if (type === 'fullscreen') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
        return;
      }

      // Check standard selectors/shortcuts first
      let selector = `[data-shortcut="${type}"]`;
      if (type === 'notification') {
        selector = `[data-shortcut="notification"], [data-shortcut="notifications"]`;
      } else if (type === 'filter') {
        selector = `[data-shortcut="filter"], [data-shortcut="global-filter"]`;
      } else if (type === 'verification' || type === 'verify') {
        selector = `[data-shortcut="verification"], [data-shortcut="verify"]`;
      }

      const modals = Array.from(document.querySelectorAll('.MuiDialog-root, .MuiDrawer-root, .MuiModal-root'));
      const activeModal = modals.filter(m => {
        const style = window.getComputedStyle(m);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }).pop();

      let elements = [];
      if (activeModal) {
        elements = Array.from(activeModal.querySelectorAll(selector));
      } else {
        elements = Array.from(document.querySelectorAll(selector));
      }

      for (const el of elements) {
        if (clickIfVisibleAndActive(el)) return;
      }

      // Fallbacks
      if (type === 'new') {
        const candidates = findCandidatesByText(['new', 'add', 'create', '+ new', '+ add']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'save') {
        const candidates = findCandidatesByText(['save', 'submit', 'update', 'confirm', 'save changes']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'amendment') {
        const candidates = findCandidatesByText(['amendment', 'amend']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'export') {
        const candidates = findCandidatesByText(['export', 'download', 'excel', 'csv']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'assign') {
        const candidates = findCandidatesByText(['assign']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'verify' || type === 'verification' || type === 'evaluate') {
        let selector = `[data-shortcut="verification"], [data-shortcut="verify"], [data-shortcut="evaluate"]`;
        const modals = Array.from(document.querySelectorAll('.MuiDialog-root, .MuiDrawer-root, .MuiModal-root'));
        const activeModal = modals.filter(m => {
          const style = window.getComputedStyle(m);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }).pop();

        let elements = [];
        if (activeModal) {
          elements = Array.from(activeModal.querySelectorAll(selector));
        } else {
          elements = Array.from(document.querySelectorAll(selector));
        }

        for (const el of elements) {
          if (clickIfVisibleAndActive(el)) return;
        }

        const candidates = findCandidatesByText(['verification', 'verify', 'verified', 'evaluate', 'accept', 'approve', 'final resolution']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'offer') {
        const candidates = findCandidatesByText(['offer']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'call_letter') {
        const candidates = findCandidatesByText(['call letter', 'send call letter']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'cancel_selection') {
        let selector = `[data-shortcut="cancel_selection"]`;
        const modals = Array.from(document.querySelectorAll('.MuiDialog-root, .MuiDrawer-root, .MuiModal-root'));
        const activeModal = modals.filter(m => {
          const style = window.getComputedStyle(m);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }).pop();

        let elements = [];
        if (activeModal) {
          elements = Array.from(activeModal.querySelectorAll(selector));
        }
        if (elements.length === 0) {
          elements = Array.from(document.querySelectorAll(selector));
        }

        for (const el of elements) {
          if (clickIfVisibleAndActive(el)) return;
        }

        const candidates = findCandidatesByText(['cancel']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'logout') {
        const logoutBtn = document.querySelector('[aria-label="logout"]') || document.querySelector('[aria-label="log out"]');
        if (clickIfVisibleAndActive(logoutBtn)) return;

        const candidates = findCandidatesByText(['logout', 'log out']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'settings') {
        const settingsBtn = document.querySelector('[aria-label="live-customize"]');
        if (clickIfVisibleAndActive(settingsBtn)) return;
      } else if (type === 'template' || type === 'template_designer') {
        const candidates = findCandidatesByText(['template designer', 'template', 'designer']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'back') {
        const candidates = findCandidatesByText(['back', 'return', 'go back']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'clear' || type === 'cancel_selection') {
        const candidates = findCandidatesByText(['clear', 'reset', 'clear form', 'reset form', 'cancel']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'reject') {
        const candidates = findCandidatesByText(['reject', 'disapprove']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'close') {
        const closeBtn = document.querySelector('[aria-label="close"]') || document.querySelector('[aria-label="Close"]');
        if (clickIfVisibleAndActive(closeBtn)) return;

        const candidates = findCandidatesByText(['close', 'cancel']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      } else if (type === 'send_rejection_mail') {
        const candidates = findCandidatesByText(['send rejection mail', 'send rejection', 'rejection mail']);
        for (const el of candidates) {
          if (clickIfVisibleAndActive(el)) return;
        }
      }
    };

    const handleKeyDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      
      const isTextInput =
        tag === 'textarea' ||
        e.target.isContentEditable ||
        e.target.closest('[contenteditable="true"]') ||
        e.target.getAttribute('role') === 'textbox' ||
        (tag === 'input' && 
          (!e.target.type || ['text', 'email', 'password', 'search', 'number', 'tel', 'url'].includes(e.target.type.toLowerCase()))
        );

      const isInput =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        e.target.isContentEditable ||
        e.target.closest('[contenteditable="true"]') ||
        e.target.getAttribute('role') === 'textbox' ||
        e.target.getAttribute('role') === 'combobox' ||
        e.target.getAttribute('role') === 'listbox' ||
        e.target.getAttribute('role') === 'option' ||
        e.target.closest('.MuiPopover-root') ||
        e.target.closest('.MuiMenu-root');

      if (isTextInput) {
        spacePressed = false;
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        if (spaceTimeout) {
          clearTimeout(spaceTimeout);
          spaceTimeout = null;
        }
        if (!spacePressed) {
          spacePressed = true;
          spacePressedTime = Date.now();
        }
        if (!isInput) {
          e.preventDefault();
        }
        return;
      }

      if (e.key === 'Shift') {
        shiftPressedTime = Date.now();
      }

      if (!spacePressed) return;

      const key = e.key ? e.key.toLowerCase() : '';
      const isShift = e.shiftKey || (Date.now() - shiftPressedTime < 500);
      const isCtrl = e.ctrlKey || e.metaKey;

      let shortcutType = null;

      if (!shortcutType) {
        if (isCtrl && !isShift) {
          if (key === 'a') {
            shortcutType = 'aura-ai';
          } else if (key === 'f') {
            shortcutType = 'fullscreen';
          }
        } else if (isShift && !isCtrl) {
          if (key === 'n') {
            shortcutType = 'notification';
          } else if (key === 's') {
            shortcutType = 'settings';
          } else if (key === 'o') {
            shortcutType = 'offer';
          }
        } else if (!isShift && !isCtrl) {
          if (key === SHORTCUT_KEYS.NEW?.key) {
            shortcutType = 'new';
          } else if (key === SHORTCUT_KEYS.SAVE?.key) {
            shortcutType = 'save';
          } else if (key === SHORTCUT_KEYS.CALL_LETTER?.key) {
            shortcutType = 'call_letter';
          } else if (key === SHORTCUT_KEYS.CANCEL_SELECTION?.key) {
            shortcutType = 'cancel_selection';
          } else if (key === SHORTCUT_KEYS.ASSIGN?.key) {
            shortcutType = 'assign';
          } else if (key === 'v') {
            shortcutType = 'verification';
          } else if (key === SHORTCUT_KEYS.OFFER?.key) {
            shortcutType = 'offer';
          } else if (key === SHORTCUT_KEYS.REJECT?.key) {
            shortcutType = 'reject';
          } else if (key === SHORTCUT_KEYS.AMEND?.key) {
            shortcutType = 'amendment';
          } else if (key === SHORTCUT_KEYS.EXPORT?.key) {
            shortcutType = 'export';
          } else if (key === SHORTCUT_KEYS.SEND_REJECTION_MAIL?.key) {
            shortcutType = 'send_rejection_mail';
          } else if (key === 'h') {
            shortcutType = 'home';
          } else if (key === 'f') {
            shortcutType = 'filter';
          } else if (key === 'b') {
            shortcutType = 'back';
          } else if (key === 't') {
            shortcutType = 'template';
          } else if (key === 'c') {
            shortcutType = 'clear';
          }
        }
      }

      if (shortcutType) {
        spacePressed = false;
        if (spaceTimeout) {
          clearTimeout(spaceTimeout);
          spaceTimeout = null;
        }
        e.preventDefault();
        e.stopPropagation();
        triggerAction(shortcutType);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        if (spaceTimeout) clearTimeout(spaceTimeout);
        spaceTimeout = setTimeout(() => {
          spacePressed = false;
        }, 1200);
      }
    };

    const handleBlur = () => {
      spacePressed = false;
      if (spaceTimeout) {
        clearTimeout(spaceTimeout);
        spaceTimeout = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleBlur);

    return () => {
      if (spaceTimeout) clearTimeout(spaceTimeout);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleBlur);
    };
  }, [navigate]);
}
