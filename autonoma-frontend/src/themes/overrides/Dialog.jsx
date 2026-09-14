// ==============================|| OVERRIDES - DIALOG ||============================== //

export default function Dialog() {
  return {
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '20px',
          padding: '0px 0 12px 0',
          overflow: 'hidden'
        }
      }
    }
  };
}
