import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  LinearProgress,
  Stack,
  Zoom,
  Paper
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  IconX,
  IconInfoCircle,
  IconAlertTriangle,
  IconAlertOctagon,
  IconTools,
  IconConfetti,
  IconRocket,
  IconCheck,
  IconShieldCheck,
  IconBellRinging,
  IconSparkles,
  IconCrown
} from '@tabler/icons-react';
import axios from 'utils/axios';

import useRealtimeRefresh from 'hooks/useRealtimeRefresh';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Zoom ref={ref} {...props} timeout={500} />;
});

const getTypePremiumTheme = (type) => {
  switch (type) {
    case 'ALERT':
      return {
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
        accentColor: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.4)',
        headerTitle: 'SYSTEM ALERT',
        icon: <IconAlertTriangle size={44} color="#ffffff" />
      };
    case 'WARNING':
      return {
        gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        accentColor: '#f97316',
        glowColor: 'rgba(249, 115, 22, 0.4)',
        headerTitle: 'WARNING ATTENTION',
        icon: <IconAlertTriangle size={44} color="#ffffff" />
      };
    case 'CRITICAL':
      return {
        gradient: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
        accentColor: '#ef4444',
        glowColor: 'rgba(239, 68, 68, 0.5)',
        headerTitle: 'CRITICAL ANNOUNCEMENT',
        icon: <IconAlertOctagon size={44} color="#ffffff" />
      };
    case 'MAINTENANCE':
      return {
        gradient: 'linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)',
        accentColor: '#a855f7',
        glowColor: 'rgba(168, 85, 247, 0.4)',
        headerTitle: 'SYSTEM MAINTENANCE',
        icon: <IconTools size={44} color="#ffffff" />
      };
    case 'BUILD_UPDATE':
      return {
        gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
        accentColor: '#10b981',
        glowColor: 'rgba(16, 185, 129, 0.4)',
        headerTitle: 'BUILD RELEASE UPDATE',
        icon: <IconRocket size={44} color="#ffffff" />
      };
    case 'WISHES':
      return {
        gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
        accentColor: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 0.4)',
        headerTitle: 'CELEBRATION & WISHES',
        icon: <IconConfetti size={44} color="#ffffff" />
      };
    case 'INFORMATION':
    default:
      return {
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        accentColor: '#3b82f6',
        glowColor: 'rgba(59, 130, 246, 0.4)',
        headerTitle: 'OFFICIAL INFORMATION',
        icon: <IconInfoCircle size={44} color="#ffffff" />
      };
  }
};

export default function ClientNotificationPopupModal() {
  const theme = useTheme();
  const [activeNotifications, setActiveNotifications] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getDismissedIds = () => {
    try {
      const stored = sessionStorage.getItem('bos_dismissed_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const fetchActiveNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications/active');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const dismissed = getDismissedIds();
        const eligible = response.data.filter((n) => n.isMandatoryAck || !dismissed.includes(n.notificationId));

        if (eligible.length > 0) {
          setActiveNotifications(eligible);
          setCurrentIndex(0);
          setOpen(true);

          const currentNotif = eligible[0];
          if (currentNotif && currentNotif.notificationId) {
            axios.post(`/api/notifications/${currentNotif.notificationId}/view`).catch(() => {});
          }
        } else {
          setActiveNotifications([]);
          setOpen(false);
        }
      } else {
        setActiveNotifications([]);
        setOpen(false);
      }
    } catch (err) {
      console.error('Error fetching active notifications:', err);
    }
  };

  // Realtime push hook
  useRealtimeRefresh(() => {
    fetchActiveNotifications();
  }, 'ClientNotification');

  useEffect(() => {
    fetchActiveNotifications();
    
    // Listen for custom real-time events across windows / components
    const handleNotifEvent = () => fetchActiveNotifications();
    window.addEventListener('bos-client-notification-update', handleNotifEvent);
    
    const interval = setInterval(() => {
      fetchActiveNotifications();
    }, 10000); // 10s fast fallback polling
    
    return () => {
      window.removeEventListener('bos-client-notification-update', handleNotifEvent);
      clearInterval(interval);
    };
  }, []);

  const currentNotif = activeNotifications[currentIndex];

  const handleNext = async () => {
    if (!currentNotif) return;

    setLoading(true);
    try {
      await axios.post(`/api/notifications/${currentNotif.notificationId}/acknowledge`);
    } catch (err) {
      console.error('Error acknowledging notification:', err);
    } finally {
      setLoading(false);
    }

    if (currentIndex + 1 < activeNotifications.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      const nextNotif = activeNotifications[nextIdx];
      if (nextNotif && nextNotif.notificationId) {
        axios.post(`/api/notifications/${nextNotif.notificationId}/view`).catch(() => {});
      }
    } else {
      setOpen(false);
    }
  };

  const handleClose = async () => {
    if (currentNotif) {
      if (currentNotif.isMandatoryAck) {
        return;
      }
      try {
        const dismissed = getDismissedIds();
        if (!dismissed.includes(currentNotif.notificationId)) {
          dismissed.push(currentNotif.notificationId);
          sessionStorage.setItem('bos_dismissed_notifications', JSON.stringify(dismissed));
        }
      } catch (e) {
        console.error('Failed to store dismissed notification state', e);
      }
    }
    setOpen(false);
  };

  if (!currentNotif || !open) return null;

  const typeTheme = getTypePremiumTheme(currentNotif.type);
  const accentGradient = currentNotif.colorHex
    ? `linear-gradient(135deg, ${currentNotif.colorHex} 0%, ${currentNotif.colorHex}dd 100%)`
    : typeTheme.gradient;
  const accentColor = currentNotif.colorHex || typeTheme.accentColor;

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '32px',
          overflow: 'visible',
          backgroundColor: '#ffffff',
          boxShadow: `0 35px 70px -15px ${alpha(accentColor, 0.35)}, 0 0 1px 1px ${alpha(accentColor, 0.15)}`,
          position: 'relative'
        }
      }}
    >
      {/* Floating Overlapping Top Avatar Badge Icon */}
      <Box
        sx={{
          position: 'absolute',
          top: -36,
          left: 'calc(50% - 36px)',
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: accentGradient,
          boxShadow: `0 12px 25px ${typeTheme.glowColor}, 0 0 0 6px #ffffff`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          '&:hover': {
            transform: 'scale(1.1) rotate(6deg)'
          }
        }}
      >
        {React.isValidElement(typeTheme.icon) ? (
          typeTheme.icon
        ) : typeof typeTheme.icon === 'function' || (typeof typeTheme.icon === 'object' && typeTheme.icon?.$$typeof && typeTheme.icon?.render) ? (
          <typeTheme.icon size={44} color="#ffffff" />
        ) : (
          <IconInfoCircle size={44} color="#ffffff" />
        )}
      </Box>

      {/* Header Area */}
      <Box
        sx={{
          pt: 6,
          pb: 2,
          px: 4,
          textAlign: 'center',
          position: 'relative'
        }}
      >
        {!currentNotif.isMandatoryAck && (
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              position: 'absolute',
              right: 20,
              top: 20,
              color: '#94a3b8',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              '&:hover': {
                backgroundColor: '#f1f5f9',
                color: '#1e293b'
              }
            }}
          >
            <IconX size={18} />
          </IconButton>
        )}

        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: 2,
              fontSize: '0.72rem',
              color: accentColor,
              textTransform: 'uppercase'
            }}
          >
            {typeTheme.headerTitle}
          </Typography>

          <Chip
            label={currentNotif.priority}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.65rem',
              height: 20,
              backgroundColor: alpha(accentColor, 0.12),
              color: accentColor,
              borderRadius: '8px'
            }}
          />
        </Stack>

        <Typography
          variant="h3"
          sx={{
            color: '#0f172a',
            fontWeight: 800,
            fontSize: '1.45rem',
            lineHeight: 1.3,
            letterSpacing: '-0.3px'
          }}
        >
          {currentNotif.title}
        </Typography>
      </Box>

      {/* Message Card Container */}
      <DialogContent sx={{ px: 4, py: 1 }}>
        <Box
          sx={{
            backgroundColor: '#f8fafc',
            borderRadius: '24px',
            p: 3.5,
            border: '1px solid #e2e8f0',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)'
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: '#334155',
              fontSize: '1.02rem',
              lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
              fontWeight: 500,
              textAlign: 'center'
            }}
          >
            {currentNotif.message}
          </Typography>
        </Box>

        {activeNotifications.length > 1 && (
          <Box sx={{ mt: 3, px: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                Notification {currentIndex + 1} of {activeNotifications.length}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={((currentIndex + 1) / activeNotifications.length) * 100}
              sx={{
                mt: 1,
                borderRadius: 4,
                height: 6,
                backgroundColor: '#f1f5f9',
                '& .MuiLinearProgress-bar': {
                  background: accentGradient,
                  borderRadius: 4
                }
              }}
            />
          </Box>
        )}
      </DialogContent>

      {/* Action Footer */}
      <DialogActions
        sx={{
          px: 4,
          pb: 4,
          pt: 2,
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        {currentNotif.isMandatoryAck && (
          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ color: '#ef4444' }}>
            <IconShieldCheck size={18} />
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              Mandatory Acknowledgment Required
            </Typography>
          </Stack>
        )}

        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading}
          fullWidth
          startIcon={<IconSparkles size={20} />}
          sx={{
            background: accentGradient,
            color: '#ffffff',
            boxShadow: `0 12px 24px -6px ${alpha(accentColor, 0.45)}`,
            '&:hover': {
              background: accentGradient,
              boxShadow: `0 16px 32px -6px ${alpha(accentColor, 0.6)}`,
              transform: 'translateY(-2px)'
            },
            py: 1.4,
            borderRadius: '18px',
            fontWeight: 800,
            fontSize: '1rem',
            textTransform: 'none',
            letterSpacing: '0.3px',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          {currentIndex + 1 < activeNotifications.length ? 'Acknowledge & Next' : 'Acknowledge & Dismiss'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
