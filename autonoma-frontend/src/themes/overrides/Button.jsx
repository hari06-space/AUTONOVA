// ==============================|| OVERRIDES - BUTTON ||============================== //

export default function Button(theme) {
  return {
    MuiButton: {
      styleOverrides: {
        containedSuccess: {
          backgroundColor: '#03b854',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#029644'
          }
        }
      }
    }
  };
}
