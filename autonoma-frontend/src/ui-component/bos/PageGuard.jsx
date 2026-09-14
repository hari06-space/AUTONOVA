import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Stack,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import {
  IconShieldLock,
  IconArrowLeft,
  IconHome,
  IconLockOpen,
  IconRefresh
} from '@tabler/icons-react';
import usePagePermissions from 'hooks/usePagePermissions';
import { DASHBOARD_PATH } from 'config';

const PageGuard = ({ pageCode, children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const perms = usePagePermissions(pageCode);

  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');
  const isPublicInduction = window.location.pathname.replace(/\/$/, '') === '/hra/ats/induction-trainee' && token;

  if (isPublicInduction) {
    return children;
  }

  // 1. Loading State - Minimalist branded transition loader
  if (perms.loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 145px)',
          minHeight: 400,
          bgcolor: isDark ? 'background.default' : '#f8fafc',
          borderRadius: '12px',
          p: 4
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              size={64}
              thickness={4}
              sx={{
                color: theme.palette.primary.main,
                '& .MuiCircularProgress-circle': { strokeLinecap: 'round' }
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconLockOpen size={24} color={theme.palette.primary.main} style={{ opacity: 0.6 }} />
            </Box>
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              letterSpacing: '0.02em'
            }}
          >
            Verifying Access...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Securing environment session credentials
          </Typography>
        </Stack>
      </Box>
    );
  }

  // 2. Unauthorized State - Exquisite glassmorphic 403 Console
  if (!perms.enabled || !perms.read) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100vh - 145px)',
          minHeight: 480,
          bgcolor: isDark ? 'background.default' : '#f8fafc',
          borderRadius: '12px',
          p: 3,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Subtle, premium glowing accent blobs in the background */}
        <Box
          sx={{
            position: 'absolute',
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.error.main, 0.15)} 0%, rgba(0,0,0,0) 70%)`,
            top: '20%',
            left: '30%',
            zIndex: 1,
            filter: 'blur(30px)'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.12)} 0%, rgba(0,0,0,0) 70%)`,
            bottom: '20%',
            right: '25%',
            zIndex: 1,
            filter: 'blur(40px)'
          }}
        />

        {/* The Glassmorphic Content Card */}
        <Card
          sx={{
            position: 'relative',
            zIndex: 2,
            maxWidth: 500,
            width: '100%',
            p: { xs: 4, md: 5 },
            textAlign: 'center',
            borderRadius: '20px',
            border: '1px solid',
            borderColor: isDark ? alpha('#fff', 0.08) : alpha(theme.palette.divider, 0.6),
            boxShadow: isDark
              ? '0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05)'
              : '0 16px 40px rgba(103, 58, 183, 0.05)',
            bgcolor: isDark ? alpha('#0f172a', 0.65) : alpha('#ffffff', 0.75),
            WebkitBackdropFilter: 'blur(16px)', backdropFilter: 'blur(16px)',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              borderColor: alpha(theme.palette.error.main, 0.25),
              boxShadow: isDark
                ? '0 20px 50px rgba(244, 67, 54, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                : '0 20px 50px rgba(244, 67, 54, 0.06)'
            }
          }}
        >
          {/* Animated Glowing Shield Lock */}
          <Box
            sx={{
              display: 'inline-flex',
              p: 2.5,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(
                theme.palette.error.main,
                0.02
              )} 100%)`,
              border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
              mb: 3.5,
              position: 'relative',
              boxShadow: `0 8px 24px ${alpha(theme.palette.error.main, 0.05)}`,
              animation: 'floatPadlock 4s ease-in-out infinite',
              '@keyframes floatPadlock': {
                '0%, 100%': { transform: 'translateY(0px) scale(1)' },
                '50%': { transform: 'translateY(-8px) scale(1.03)' }
              }
            }}
          >
            <IconShieldLock
              size={56}
              color={theme.palette.error.main}
              stroke={1.5}
              style={{
                filter: `drop-shadow(0 0 12px ${alpha(theme.palette.error.main, 0.4)})`
              }}
            />
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 850,
              fontSize: { xs: '1.6rem', md: '1.8rem' },
              color: 'text.primary',
              mb: 1.5,
              lineHeight: 1.2
            }}
          >
            Restricted Entry
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: '0.92rem',
              mb: 3.5,
              px: { xs: 0, sm: 2 },
              lineHeight: 1.6
            }}
          >
            Your current security credentials do not authorize access to this module. Please contact your system administrator to elevate your privileges.
          </Typography>

          {/* Page Details Tag */}
          <Box
            sx={{
              py: 1,
              px: 2,
              borderRadius: '8px',
              bgcolor: isDark ? alpha(theme.palette.error.main, 0.06) : alpha(theme.palette.error.main, 0.03),
              border: `1px dashed ${alpha(theme.palette.error.main, 0.2)}`,
              mb: 4.5,
              display: 'inline-block'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.palette.error.main
                }}
              >
                Console Guard:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  color: 'text.primary'
                }}
              >
                {pageCode}
              </Typography>
            </Stack>
          </Box>

          {/* Interactive Navigation Actions */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
          >
            <Button
              variant="outlined"
              color="primary"
              startIcon={<IconRefresh size={18} />}
              onClick={() => window.location.reload()}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                height: 44,
                borderRadius: '10px',
                fontWeight: 700,
                textTransform: 'none',
                px: 3
              }}
            >
              Refresh Permissions
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconArrowLeft size={18} />}
              onClick={() => navigate(-1)}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                height: 44,
                borderRadius: '10px',
                borderColor: isDark ? alpha('#fff', 0.2) : theme.palette.divider,
                color: 'text.primary',
                fontWeight: 700,
                textTransform: 'none',
                px: 3,
                '&:hover': {
                  bordercolor: 'text.primary',
                  bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.02)
                }
              }}
            >
              Go Back
            </Button>
            <Button
              variant="contained"
              startIcon={<IconHome size={18} />}
              onClick={() => navigate(DASHBOARD_PATH)}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                height: 44,
                borderRadius: '10px',
                bgcolor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 700,
                textTransform: 'none',
                px: 3.5,
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Console Home
            </Button>
          </Stack>
        </Card>
      </Box>
    );
  }

  // 3. Authorized State - render children view
  return children;
};

PageGuard.propTypes = {
  pageCode: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

export default PageGuard;
