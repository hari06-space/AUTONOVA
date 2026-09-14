import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6C63FF',
      light: '#8B83FF',
      dark: '#4A42CC',
    },
    secondary: {
      main: '#00D9A6',
      light: '#33E1B8',
      dark: '#00AD85',
    },
    background: {
      default: '#0A0E1A',
      paper: '#121829',
    },
    error: {
      main: '#FF5C6C',
    },
    warning: {
      main: '#FFB347',
    },
    success: {
      main: '#00D9A6',
    },
    text: {
      primary: '#E8EAED',
      secondary: '#9AA0B0',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(108, 99, 255, 0.12)',
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9rem',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6C63FF 0%, #8B83FF 100%)',
          boxShadow: '0 4px 20px rgba(108, 99, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5A52E0 0%, #7A73EE 100%)',
            boxShadow: '0 6px 28px rgba(108, 99, 255, 0.45)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: 'rgba(108, 99, 255, 0.08)',
            fontWeight: 700,
            color: '#9AA0B0',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
