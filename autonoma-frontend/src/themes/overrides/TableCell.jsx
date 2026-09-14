// project imports
import { withAlpha } from 'utils/colorUtils';

// ==============================|| OVERRIDES - TABLE CELL ||============================== //

export default function TableCell(theme) {
  return {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: theme.vars.palette.grey[200],

          '&.MuiTableCell-head': {
            fontSize: '0.8rem',
            color: '#ffffff',
            backgroundColor: theme.vars.palette.primary.main,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: 'none',
            whiteSpace: 'nowrap'
          },

          ...theme.applyStyles('dark', {
            borderColor: withAlpha(theme.vars.palette.text.primary, 0.15),

            '&.MuiTableCell-head': {
              color: theme.vars.palette.grey[600]
            }
          })
        }
      }
    }
  };
}
