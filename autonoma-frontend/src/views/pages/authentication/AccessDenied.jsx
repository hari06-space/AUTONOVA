import { Box, Card, Typography, Button, Stack, useTheme, alpha } from '@mui/material';
import { IconShieldLock, IconLogout } from '@tabler/icons-react';
import useAuth from 'hooks/useAuth';

export default function AccessDenied() {
  const theme = useTheme();
  const { logout } = useAuth();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: '#0a0e17',
        p: 3,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Background blobs for premium theme aesthetic */}
      <Box
        sx={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.error.main, 0.2)} 0%, rgba(0,0,0,0) 70%)`,
          top: '20%',
          left: '20%',
          zIndex: 1,
          filter: 'blur(40px)'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, rgba(0,0,0,0) 70%)`,
          bottom: '20%',
          right: '20%',
          zIndex: 1,
          filter: 'blur(50px)'
        }}
      />

      <Card
        sx={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 500,
          width: '100%',
          p: { xs: 4, md: 5 },
          textAlign: 'center',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
          bgcolor: 'rgba(15, 20, 30, 0.85)',
          WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: 'error.main'
          }
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            p: 2.5,
            borderRadius: '50%',
            background: 'rgba(244, 67, 54, 0.08)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            mb: 3.5,
            position: 'relative',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.4)' },
              '70%': { transform: 'scale(1.03)', boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)' },
              '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' }
            }
          }}
        >
          <IconShieldLock
            size={56}
            color="#f44336"
            stroke={1.5}
          />
        </Box>

        <Typography
          variant="h2"
          sx={{
            fontWeight: 850,
            fontSize: '1.8rem',
            color: '#fff',
            mb: 1.5,
            lineHeight: 1.2
          }}
        >
          Access Denied
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255, 255, 255, 0.65)',
            fontSize: '0.92rem',
            mb: 4.5,
            lineHeight: 1.6
          }}
        >
          Only authorized HR and Admin users are permitted to access this module. Please login with correct role credentials.
        </Typography>

        <Button
          variant="contained"
          color="error"
          fullWidth
          startIcon={<IconLogout size={18} />}
          onClick={logout}
          sx={{
            height: 48,
            borderRadius: '12px',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.95rem'
          }}
        >
          Logout & Return to Login
        </Button>
      </Card>
    </Box>
  );
}
