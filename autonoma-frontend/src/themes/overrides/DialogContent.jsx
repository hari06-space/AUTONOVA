// ==============================|| OVERRIDES - DIALOG CONTENT ||============================== //

export default function DialogContent(theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: theme.breakpoints.up('sm') ? (theme.breakpoints.up('md') ? '32px' : '24px') : '12px',
          backgroundColor: isDark ? '#161b22' : theme.palette.background.paper,
          overflowX: 'hidden',
          overflowY: 'auto',
          flexGrow: 1,
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { width: 6, height: 6 },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.grey[300],
            borderRadius: 10,
            '&:hover': { backgroundColor: theme.palette.grey[400] }
          }
        }
      }
    }
  };
}
