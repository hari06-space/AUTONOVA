import PropTypes from 'prop-types';

// material-ui
import { useColorScheme, useTheme } from '@mui/material/styles';
import CardMedia from '@mui/material/CardMedia';
import Box from '@mui/material/Box';

// project imports
import { ThemeMode } from 'config';

// assets
import AuthPattern from 'assets/images/auth/auth-pattern.svg';
import AuthPatternDark from 'assets/images/auth/auth-pattern-dark.svg';

// ===========================|| BACKGROUND GRID PATTERN 1 ||=========================== //

export default function BackgroundPattern1({ children }) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();

  return (
    <Box
      component="span"
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.paper',
        position: 'absolute',
        overflow: 'hidden',
        m: '0 0 0 auto',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.9,
        ...theme.applyStyles('dark', { opacity: 0.85 })
      }}
    >
      {children}

      <CardMedia
        component="img"
        sx={{ zIndex: -1, position: 'absolute', bottom: 0, right: 0, width: 1, backgroundRepeat: 'repeat', height: '100vh' }}
        src={colorScheme === ThemeMode.DARK ? AuthPatternDark : AuthPattern}
        alt="pattern1"
      />
    </Box>
  );
}

BackgroundPattern1.propTypes = { children: PropTypes.node };
