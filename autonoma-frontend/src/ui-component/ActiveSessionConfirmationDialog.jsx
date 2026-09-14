import React from 'react';
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
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Zoom from '@mui/material/Zoom';

// third party
import { motion, AnimatePresence } from 'framer-motion';

// assets
import {
  IconAlertTriangle,
  IconDevices,
  IconClock,
  IconActivity,
  IconArrowRight,
  IconX,
  IconShieldLock,
  IconWifi,
  IconSparkles,
  IconUser,
  IconFingerprint
} from '@tabler/icons-react';

/**
 * Organization: Nutech
 * Owner: Nutech
 * Created At: 2026-09-03
 * Description: High-energy, colorful, animated confirmation dialog for Single Active Session takeover displaying full network IP, MAC ID, and account credentials.
 */
const ActiveSessionConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  sessionInfo,
  isLoading
}) => {
  const theme = useTheme();

  const formatDateTime = (dateVal) => {
    if (!dateVal) return 'Just now';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return String(dateVal);
    }
  };

  const deviceName = sessionInfo?.deviceName || sessionInfo?.system || 'Chrome on Windows 10/11';
  const networkIp = sessionInfo?.networkIp || (sessionInfo?.ipAddress && sessionInfo.ipAddress.includes('|') ? sessionInfo.ipAddress.split('|')[0].trim() : (sessionInfo?.ipAddress || '127.0.0.1'));
  const systemIp = sessionInfo?.systemIp || (sessionInfo?.ipAddress && sessionInfo.ipAddress.includes('|') ? sessionInfo.ipAddress.split('|')[1].trim() : (localStorage.getItem('boss_system_ip') || '192.168.1.28'));
  const userId = sessionInfo?.userEmail || sessionInfo?.userId || sessionStorage.getItem('userName') || 'Current User Account';
  const deviceId = sessionInfo?.deviceId || localStorage.getItem('boss_device_identifier') || 'BOS-DEV-WORKSTATION';
  const loginTime = formatDateTime(sessionInfo?.loginTime);
  const lastActivity = formatDateTime(sessionInfo?.lastActivity);

  const isLevel5User = sessionInfo?.userLevel >= 5;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      TransitionComponent={Zoom}
      transitionDuration={350}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { scale: 0.9, opacity: 0, y: 20 },
        animate: { scale: 1, opacity: 1, y: 0 },
        exit: { scale: 0.9, opacity: 0, y: 20 },
        transition: { type: 'spring', damping: 22, stiffness: 300 },
        sx: {
          borderRadius: '24px',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8faff 50%, #f1f5fd 100%)',
          border: '2px solid transparent',
          backgroundImage: 'linear-gradient(145deg, #ffffff 0%, #f8faff 100%), linear-gradient(135deg, #FF6B6B 0%, #FFA07A 25%, #6366F1 75%, #3B82F6 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: '0 25px 60px -12px rgba(99, 102, 241, 0.35), 0 0 40px rgba(255, 107, 107, 0.2)',
          p: 1.5,
          overflow: 'hidden',
          position: 'relative'
        }
      }}
    >
      {/* Top Colorful Ambient Glow */}
      <Box
        sx={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 107, 0.25) 0%, rgba(255, 160, 122, 0) 70%)',
          filter: 'blur(20px)',
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0) 70%)',
          filter: 'blur(20px)',
          pointerEvents: 'none'
        }}
      />

      {/* Header Section */}
      <DialogTitle sx={{ pb: 1, pt: 1.5 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Animated Glowing Icon Container */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              rotate: [0, -3, 3, 0]
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: 'easeInOut'
            }}
          >
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                boxShadow: '0 8px 20px rgba(255, 107, 107, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <IconAlertTriangle size={30} stroke={2.2} />
            </Box>
          </motion.div>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  fontSize: '1.28rem',
                  letterSpacing: '-0.3px',
                  background: 'linear-gradient(135deg, #1E293B 0%, #3B82F6 50%, #6366F1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                Active Session Detected
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                icon={<IconShieldLock size={13} color="#fff" />}
                label={isLevel5User ? 'Multi-Session Authorized' : 'Single Session Policy Enforced'}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  bgcolor: isLevel5User ? '#10B981' : '#6366F1',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                  '& .MuiChip-icon': { ml: 0.5 }
                }}
              />
            </Stack>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 1.5, px: 2 }}>
        {/* Notice Card */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(254, 243, 199, 0.8) 0%, rgba(254, 215, 170, 0.7) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.12)'
          }}
        >
          <Typography variant="body2" sx={{ color: isLevel5User ? '#1E3A8A' : '#78350F', fontWeight: 600, fontSize: '0.83rem', lineHeight: 1.45 }}>
            {isLevel5User
              ? '👑 Level 5 Super Admin Access: Active session detected on another workstation. Clicking Continue Login will connect this device while preserving your previous active sessions.'
              : '⚠️ Your account is currently active on another device. Logging in here will immediately disconnect that session.'}
          </Typography>
        </Box>

        {/* Existing Session Details Card */}
        <Paper
          elevation={0}
          component={motion.div}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          sx={{
            p: 2,
            borderRadius: '18px',
            background: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(99, 102, 241, 0.05)',
            position: 'relative',
            mb: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                fontSize: '0.82rem',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: 0.8
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  bgcolor: 'rgba(59, 130, 246, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB'
                }}
              >
                <IconDevices size={15} />
              </Box>
              Active Workstation Session
            </Typography>
            <Chip
              label="CONNECTED NOW"
              size="small"
              sx={{
                height: 18,
                fontSize: '0.62rem',
                fontWeight: 900,
                letterSpacing: '0.04em',
                bgcolor: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #86EFAC'
              }}
            />
          </Box>

          <Stack spacing={1.2}>
            {/* Account Credentials Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconUser size={13} color="#2563EB" /> Account:
              </Typography>
              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 800, fontSize: '0.82rem' }}>
                {userId}
              </Typography>
            </Box>

            {/* Device / OS Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem' }}>
                Device / OS:
              </Typography>
              <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 800, fontSize: '0.82rem' }}>
                {deviceName}
              </Typography>
            </Box>

            {/* Network IP Row */}
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

            {/* System Local IP Row */}
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

            {/* MAC / Device Token Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                <IconFingerprint size={13} color="#D97706" /> MAC / Device ID:
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
                    bgcolor: '#FEF3C7',
                    color: '#92400E',
                    border: '1px solid #FDE68A',
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

            <Box sx={{ height: 1, bgcolor: '#F1F5F9' }} />

            {/* Login Time Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconClock size={13} color="#059669" /> Login Time:
              </Typography>
              <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700, fontSize: '0.76rem' }}>
                {loginTime}
              </Typography>
            </Box>

            {/* Last Activity Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconActivity size={13} color="#8B5CF6" /> Last Seen:
              </Typography>
              <Typography variant="caption" sx={{ color: '#6D28D9', fontWeight: 700, fontSize: '0.76rem' }}>
                {lastActivity}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Action Confirmation Banner */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          sx={{
            p: 1.3,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
            border: '1px dashed rgba(99, 102, 241, 0.35)',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <IconSparkles size={18} color="#6366F1" style={{ flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: '#312E81', fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.35 }}>
            {isLevel5User
              ? 'Connect this device as an additional active session?'
              : 'Switch active session to this device now?'}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0.5, gap: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          size="medium"
          onClick={onClose}
          disabled={isLoading}
          startIcon={<IconX size={17} />}
          sx={{
            borderRadius: '12px',
            borderColor: '#CBD5E1',
            color: '#64748B',
            fontWeight: 700,
            py: 1,
            '&:hover': {
              borderColor: '#94A3B8',
              bgcolor: '#F8FAFC'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          fullWidth
          variant="contained"
          size="medium"
          onClick={onConfirm}
          disabled={isLoading}
          endIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <IconArrowRight size={17} />}
          sx={{
            borderRadius: '12px',
            py: 1,
            fontWeight: 800,
            background: isLevel5User
              ? 'linear-gradient(135deg, #10B981 0%, #059669 50%, #3B82F6 100%)'
              : 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #6366F1 100%)',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
            '&:hover': {
              background: isLevel5User
                ? 'linear-gradient(135deg, #059669 0%, #047857 50%, #2563EB 100%)'
                : 'linear-gradient(135deg, #EF4444 0%, #FF6B6B 50%, #4F46E5 100%)',
              boxShadow: '0 12px 25px rgba(99, 102, 241, 0.5)'
            }
          }}
        >
          {isLoading ? 'Connecting…' : (isLevel5User ? 'Add Active Session' : 'Continue Login')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ActiveSessionConfirmationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  sessionInfo: PropTypes.object,
  isLoading: PropTypes.bool
};

export default ActiveSessionConfirmationDialog;
