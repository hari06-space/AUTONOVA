/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-03
 * Description: Ultra-animated, high-energy session revocation dialog with security lock graphics, credential details, network IP, MAC ID, animated 5-second countdown progress bar, and automatic logout when account is logged in from another system.
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

// material-ui
import { useTheme, alpha } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Paper from '@mui/material/Paper';
import Zoom from '@mui/material/Zoom';

// third party
import { motion } from 'framer-motion';

// assets
import {
  IconShieldLock,
  IconLogout,
  IconClock,
  IconAlertOctagon,
  IconDevicesOff,
  IconUser,
  IconWifi,
  IconFingerprint,
  IconDevices
} from '@tabler/icons-react';

const SessionRevokedDialog = ({
  open,
  onLogout,
  reason,
  message,
  revokedDetails
}) => {
  const theme = useTheme();
  const COUNTDOWN_SECONDS = 5;
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeLeft(COUNTDOWN_SECONDS);
      
      const startTime = Date.now();
      const endTime = startTime + COUNTDOWN_SECONDS * 1000;

      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          if (typeof onLogout === 'function') {
            onLogout();
          }
        }
      }, 200);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [open, onLogout]);

  if (!open) return null;

  const displayTitle = reason === 'ADMIN_FORCE_LOGOUT'
    ? 'Admin Session Termination'
    : 'Concurrent Session Terminated';

  const displayMessage = message || (
    reason === 'ADMIN_FORCE_LOGOUT'
      ? 'Your session was terminated by an administrator.'
      : 'Your account was logged in from another device/system (Sys 1). To protect your account security, your current session on this machine has been revoked.'
  );

  const networkIp = revokedDetails?.networkIp || (revokedDetails?.ipAddress && revokedDetails.ipAddress.includes('|') ? revokedDetails.ipAddress.split('|')[0].trim() : (revokedDetails?.ipAddress || '127.0.0.1'));
  const systemIp = revokedDetails?.systemIp || (revokedDetails?.ipAddress && revokedDetails.ipAddress.includes('|') ? revokedDetails.ipAddress.split('|')[1].trim() : (localStorage.getItem('boss_system_ip') || '192.168.1.28'));
  const userId = revokedDetails?.userEmail || revokedDetails?.userId || sessionStorage.getItem('userName') || 'User Account';
  const deviceName = revokedDetails?.deviceName || 'Chrome on Windows 10/11';
  const deviceId = revokedDetails?.deviceId || localStorage.getItem('boss_device_identifier') || 'BOS-DEV-WORKSTATION';

  const progressPercent = (timeLeft / COUNTDOWN_SECONDS) * 100;

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      TransitionComponent={Zoom}
      transitionDuration={350}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { scale: 0.85, opacity: 0, y: 30 },
        animate: { scale: 1, opacity: 1, y: 0 },
        exit: { scale: 0.85, opacity: 0, y: 30 },
        transition: { type: 'spring', damping: 20, stiffness: 280 },
        sx: {
          borderRadius: '24px',
          background: 'linear-gradient(145deg, #ffffff 0%, #fff5f5 50%, #fef2f2 100%)',
          border: '2px solid transparent',
          backgroundImage: 'linear-gradient(145deg, #ffffff 0%, #fff5f5 100%), linear-gradient(135deg, #ef4444 0%, #f97316 40%, #6366f1 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: '0 25px 60px -12px rgba(239, 68, 68, 0.4), 0 0 40px rgba(249, 115, 22, 0.25)',
          p: 1.5,
          overflow: 'hidden',
          position: 'relative'
        }
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(15, 23, 42, 0.75)'
        }
      }}
    >
      {/* Top Warning Glow Header */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.25) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }}
      />

      <DialogTitle sx={{ p: 2, textAlign: 'center', pb: 1 }}>
        <Stack direction="column" alignItems="center" spacing={1.5}>
          {/* Animated Security Lock Badge with Pulse Rings */}
          <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', my: 1 }}>
            {/* Outer Pulsing Aura Ring */}
            <Box
              sx={{
                position: 'absolute',
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0) 70%)',
                animation: 'ripplePulse 2s infinite ease-out',
                '@keyframes ripplePulse': {
                  '0%': { transform: 'scale(0.8)', opacity: 1 },
                  '100%': { transform: 'scale(1.4)', opacity: 0 }
                }
              }}
            />

            {/* Rotating Dashed Security Ring */}
            <Box
              sx={{
                position: 'absolute',
                width: 88,
                height: 88,
                borderRadius: '50%',
                border: `2px dashed ${alpha('#ef4444', 0.5)}`,
                animation: 'spinRing 12s linear infinite',
                '@keyframes spinRing': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            />

            {/* Central Security Shield Glass Icon Badge */}
            <Box
              component={motion.div}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}
            >
              <IconShieldLock size={38} color="#ffffff" stroke={1.8} />
            </Box>

            {/* Top Right Device Disconnect Badge */}
            <Box
              sx={{
                position: 'absolute',
                top: -4,
                right: -6,
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: '#ffffff',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3
              }}
            >
              <IconDevicesOff size={18} color="#dc2626" />
            </Box>
          </Box>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}
          >
            {displayTitle}
          </Typography>

          <Chip
            icon={<IconAlertOctagon size={16} color="#ef4444" />}
            label="Single Active Session Policy Enforced"
            size="small"
            sx={{
              bgcolor: alpha('#ef4444', 0.1),
              color: '#dc2626',
              fontWeight: 700,
              fontSize: '0.725rem',
              border: `1px solid ${alpha('#ef4444', 0.3)}`
            }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2, pt: 1, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 2, lineHeight: 1.5 }}>
          {displayMessage}
        </Typography>

        {/* Credentials & Workstation Details Card */}
        <Paper
          elevation={0}
          sx={{
            p: 1.8,
            mb: 2,
            borderRadius: '16px',
            bgcolor: '#ffffff',
            border: `1px solid ${alpha('#ef4444', 0.2)}`,
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.06)',
            textAlign: 'left'
          }}
        >
          <Stack spacing={1.2}>
            {/* Account Credentials */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconUser size={13} color="#2563EB" /> Account:
              </Typography>
              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 800, fontSize: '0.82rem' }}>
                {userId}
              </Typography>
            </Box>

            {/* Workstation / Device */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconDevices size={13} color="#D97706" /> Connected Device:
              </Typography>
              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 800, fontSize: '0.82rem' }}>
                {deviceName}
              </Typography>
            </Box>

            {/* Network IP */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconWifi size={13} color="#6366F1" /> Network IP:
              </Typography>
              <Chip
                label={networkIp}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  bgcolor: '#F1F5F9',
                  color: '#334155'
                }}
              />
            </Box>

            {/* System Local IP */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconWifi size={13} color="#059669" /> System IP:
              </Typography>
              <Chip
                label={systemIp}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  bgcolor: '#ECFDF5',
                  color: '#047857',
                  border: '1px solid #A7F3D0'
                }}
              />
            </Box>

            {/* MAC / Device Identifier */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                <IconFingerprint size={13} color="#DC2626" /> MAC / Device ID:
              </Typography>
              <Tooltip title={`Full Device ID / MAC: ${deviceId}`} arrow placement="top">
                <Chip
                  label={deviceId}
                  size="small"
                  sx={{
                    height: 'auto',
                    maxWidth: 220,
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    bgcolor: '#FEF2F2',
                    color: '#991B1B',
                    border: '1px solid #FCA5A5',
                    wordBreak: 'break-all',
                    '& .MuiChip-label': {
                      whiteSpace: 'normal',
                      px: 1,
                      py: 0.4
                    }
                  }}
                />
              </Tooltip>
            </Box>
          </Stack>
        </Paper>

        {/* Animated Countdown Section */}
        <Box
          component={motion.div}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          sx={{
            bgcolor: alpha('#ef4444', 0.06),
            borderRadius: '16px',
            p: 2,
            border: `1.5px dashed ${alpha('#ef4444', 0.3)}`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1.5 }}>
            <IconClock size={20} color="#dc2626" />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#dc2626' }}>
              Auto Logging Out In
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 900,
                color: '#dc2626',
                minWidth: '32px',
                display: 'inline-block',
                fontFamily: 'monospace'
              }}
            >
              {timeLeft}s
            </Typography>
          </Stack>

          {/* Animated Smooth Progress Bar Draining Down */}
          <Box sx={{ width: '100%', position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={progressPercent}
              sx={{
                height: 10,
                borderRadius: 5,
                bgcolor: alpha('#ef4444', 0.15),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
                  transition: 'transform 0.2s linear'
                }
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1, justifyContent: 'center' }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={onLogout}
          startIcon={<IconLogout size={20} />}
          sx={{
            py: 1.4,
            borderRadius: '14px',
            fontWeight: 800,
            fontSize: '0.95rem',
            textTransform: 'none',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.5)',
            '&:hover': {
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              boxShadow: '0 14px 28px -5px rgba(220, 38, 38, 0.6)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          Logout Immediately
        </Button>
      </DialogActions>
    </Dialog>
  );
};

SessionRevokedDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
  reason: PropTypes.string,
  message: PropTypes.string,
  revokedDetails: PropTypes.object
};

export default SessionRevokedDialog;
