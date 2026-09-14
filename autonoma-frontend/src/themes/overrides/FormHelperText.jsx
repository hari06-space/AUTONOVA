// ==============================|| OVERRIDES - FORM HELPER TEXT ||============================== //

export default function FormHelperText() {
  return {
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent !important',
          background: 'none !important',
          boxShadow: 'none !important',
          marginTop: '4px',
          marginLeft: '0px !important',
          marginRight: '0px !important',
          padding: '0px !important'
        }
      }
    }
  };
}
