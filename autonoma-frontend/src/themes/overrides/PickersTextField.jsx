// ==============================|| OVERRIDES - PICKERS TEXT FIELD ||============================== //

export default function PickersTextField(theme, borderRadius, outlinedFilled) {
  return {
    MuiPickersTextField: {
      styleOverrides: {
        root: {
          borderRadius: `${borderRadius}px`,
          background: 'transparent !important',
          '& .MuiPickersOutlinedInput-root': {
            borderRadius: `${borderRadius}px`,
            background: outlinedFilled ? theme.vars.palette.grey[50] : 'transparent'
          },
          '& .MuiFormHelperText-root': {
            background: 'transparent !important',
            backgroundColor: 'transparent !important',
            boxShadow: 'none !important'
          },
          '& .MuiPickersInputBase-sectionsContainer': {
            fontWeight: 500
          },

          ...theme.applyStyles('dark', {
            background: 'transparent !important',
            '& .MuiPickersOutlinedInput-root': {
              background: outlinedFilled ? theme.vars.palette.dark[800] : 'transparent'
            }
          })
        }
      }
    }
  };
}
