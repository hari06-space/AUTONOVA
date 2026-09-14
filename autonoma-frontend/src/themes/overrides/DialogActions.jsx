// ==============================|| OVERRIDES - DIALOG ACTIONS ||============================== //

export default function DialogActions(theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: theme.breakpoints.up('sm') ? (theme.breakpoints.up('md') ? '24px' : '20px') : '12px',
          borderTop: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: isDark ? '#161b22' : theme.palette.background.paper
        }
      }
    }
  };
}
