/**
 * Centralized Application Alert System
 * Displays a premium toast notification using the Redux snackbar slice.
 * Decoupled from static store imports to guarantee zero circular dependencies.
 */

/**
 * Display a premium application alert toast.
 * @param {string} message - The message content.
 * @param {string} severity - The severity level ('error', 'warning', 'info', 'success').
 * @param {string} variant - The visual variant ('alert', 'filled', etc.).
 */
export const showAppAlert = (message, severity = 'error', variant = 'alert') => {
  // Dynamically load store to avoid any circular dependency loading orders
  import('store')
    .then(({ dispatch }) => {
      import('store/slices/snackbar')
        .then(({ openSnackbar }) => {
          try {
            dispatch(
              openSnackbar({
                open: true,
                message: message,
                variant: variant,
                severity: severity,
                anchorOrigin: { vertical: 'bottom', horizontal: 'right' }
              })
            );
          } catch (e) {
            console.warn('Failed to dispatch snackbar alert:', e);
          }
        })
        .catch((err) => console.warn('Failed to load snackbar slice:', err));
    })
    .catch((err) => console.warn('Failed to load store dynamically:', err));
};
