/**
 * TaskToast — Premium enterprise task notification toast
 *
 * Features:
 *  - Auto-hide progress bar (default 8s), pauses on hover
 *  - Priority / type colour-coded left border accent
 *  - Action buttons: View Task + Dismiss
 *  - Smooth slide-in / fade-out animations
 *  - Stack-safe (notistack handles stacking)
 *  - Supports task_assigned, task_completed, warning, info, error variants
 */
import React, { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch } from 'store';
import { dequeueToast } from 'store/slices/notifications';
import { SnackbarContent } from 'notistack';
import {
  Box, Typography, IconButton, Avatar, Button, LinearProgress, Stack
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconBell, IconX, IconExternalLink, IconCheck, IconAlertTriangle,
  IconClipboardList, IconUserCheck, IconClock, IconCalendar
} from '@tabler/icons-react';

// ─── Config ───────────────────────────────────────────────────────────────────
const AUTO_HIDE_MS = 8000;

// ─── Audio helper ─────────────────────────────────────────────────────────────
const playSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  } catch { /* ignore */ }
};

const VARIANT_CFG = {
  task_assigned: {
    accent: '#6366F1',
    icon: <IconClipboardList size={20} />,
    label: '🔔 New Task Assigned',
    labelColor: '#6366F1',
  },
  task_completed: {
    accent: '#22C55E',
    icon: <IconCheck size={20} />,
    label: '✅ Task Completed',
    labelColor: '#22C55E',
  },
  task_overdue: {
    accent: '#EF4444',
    icon: <IconAlertTriangle size={20} />,
    label: '⚠️ Task Overdue',
    labelColor: '#EF4444',
  },
  task_reminder: {
    accent: '#F59E0B',
    icon: <IconClock size={20} />,
    label: '⏰ Task Reminder',
    labelColor: '#F59E0B',
  },
  info: {
    accent: '#3B82F6',
    icon: <IconBell size={20} />,
    label: '📢 Notification',
    labelColor: '#3B82F6',
  },
  warning: {
    accent: '#F59E0B',
    icon: <IconAlertTriangle size={20} />,
    label: '⚠️ Warning',
    labelColor: '#F59E0B',
  },
  error: {
    accent: '#EF4444',
    icon: <IconAlertTriangle size={20} />,
    label: '❌ Alert',
    labelColor: '#EF4444',
  },
  default: {
    accent: '#6366F1',
    icon: <IconBell size={20} />,
    label: '🔔 Notification',
    labelColor: '#6366F1',
  },
  meeting_assigned: {
    accent: '#8B5CF6',
    icon: <IconCalendar size={20} />,
    label: '📅 QMS Meeting Assigned',
    labelColor: '#8B5CF6',
  },
  meeting_rescheduled: {
    accent: '#A78BFA',
    icon: <IconCalendar size={20} />,
    label: '📅 Meeting Rescheduled',
    labelColor: '#A78BFA',
  },
};

// ─── Detect variant from notification title/message ───────────────────────────
function detectVariant(notif) {
  const text = ((notif?.title || '') + ' ' + (notif?.message || '')).toLowerCase();
  if (text.includes('rescheduled') && text.includes('meeting')) return 'meeting_rescheduled';
  if (text.includes('meeting')) return 'meeting_assigned';
  if (text.includes('assigned') || text.includes('new task')) return 'task_assigned';
  if (text.includes('completed') || text.includes('approved')) return 'task_completed';
  if (text.includes('overdue') || text.includes('expired')) return 'task_overdue';
  if (text.includes('reminder') || text.includes('upcoming') || text.includes('due')) return 'task_reminder';
  if (text.includes('warning') || text.includes('reject')) return 'warning';
  if (text.includes('error') || text.includes('failed')) return 'error';
  return 'info';
}

// ─── TaskToast Component ──────────────────────────────────────────────────────
const TaskToast = forwardRef(function TaskToast({ id, notif, onClose, onView }, ref) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();

  const variant = detectVariant(notif);
  const cfg = VARIANT_CFG[variant] || VARIANT_CFG.default;

  const [progress, setProgress] = useState(100);
  const pausedRef = useRef(false);
  const startRef = useRef(Date.now());
  const elapsedRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);

  const dismiss = useCallback(() => {
    if (onClose) onClose();
    if (id) dispatch(dequeueToast(id));
  }, [onClose, id, dispatch]);

  const handleView = useCallback(() => {
    dismiss();
    if (notif?.linkUrl) {
      window.location.href = notif.linkUrl;
    }
    if (onView) onView(notif);
  }, [dismiss, notif, onView]);

  useEffect(() => {
    playSound();
  }, []);

  // Animate progress bar
  useEffect(() => {
    let animationFrameId;
    const tick = () => {
      if (!pausedRef.current) {
        elapsedRef.current = Date.now() - startRef.current;
        const remaining = Math.max(0, 100 - (elapsedRef.current / AUTO_HIDE_MS) * 100);
        setProgress(remaining);
        if (remaining <= 0) {
          dismiss();
          return;
        }
      } else {
        // Update start ref to account for paused time
        startRef.current = Date.now() - elapsedRef.current;
      }
      animationFrameId = requestAnimationFrame(tick);
    };
    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [dismiss]);

  const cardBg = isDark
    ? 'linear-gradient(135deg, rgba(15,21,42,0.97) 0%, rgba(10,16,35,0.99) 100%)'
    : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,255,0.99) 100%)';

  return (
    <SnackbarContent ref={ref} role="alert" style={{ background: 'none', boxShadow: 'none', border: 'none', padding: 0 }}>
      <Box
        onPointerEnter={() => { pausedRef.current = true; setIsHovered(true); }}
      onPointerLeave={() => { pausedRef.current = false; startRef.current = Date.now() - elapsedRef.current; setIsHovered(false); }}
      sx={{
        width: { xs: 280, sm: 340 },
        background: cardBg,
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        borderLeft: `4px solid ${cfg.accent}`,
        borderRadius: '16px',
        boxShadow: isDark
          ? `0 24px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), 0 0 ${isHovered ? '60px' : '40px'} ${cfg.accent}35`
          : `0 24px 70px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04), 0 0 ${isHovered ? '50px' : '35px'} ${cfg.accent}25`,
        overflow: 'hidden',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        transform: isHovered ? 'scale(1.02) translateY(-2px)' : 'none',
        animation: 'toast-slide-in 0.4s cubic-bezier(0.22,1,0.36,1) both',
        '@keyframes toast-slide-in': {
          '0%': { opacity: 0, transform: 'translateX(120%) scale(0.9)' },
          '100%': { opacity: 1, transform: 'translateX(0) scale(1)' },
        },
        cursor: notif?.linkUrl ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: isDark
            ? `0 24px 72px rgba(0,0,0,0.7), 0 0 50px ${cfg.accent}33`
            : `0 24px 60px rgba(0,0,0,0.15), 0 0 40px ${cfg.accent}20`,
        }
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, pt: 1.5, pb: 0.75, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '10px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${cfg.accent}25, ${cfg.accent}10)`, 
            color: cfg.accent, flexShrink: 0,
            boxShadow: `inset 0 0 0 1px ${cfg.accent}30`
          }}>
            {cfg.icon}
          </Box>
          <Box sx={{ pt: 0.25 }}>
            <Typography sx={{
              fontSize: '0.65rem', fontWeight: 800, color: cfg.accent,
              letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1,
              mb: 0.35, opacity: 0.9
            }}>
              AUTONOMA BOS(S)
            </Typography>
            <Typography sx={{
              fontSize: '0.85rem', fontWeight: 800, 
              color: cfg.accent,
              letterSpacing: '0.01em', lineHeight: 1.2
            }}>
              {cfg.label}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          sx={{
            width: 24, height: 24, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            '&:hover': { color: '#EF4444', background: 'rgba(239,68,68,0.1)' },
            transition: 'all 0.15s'
          }}
        >
          <IconX size={14} />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ px: 2, pb: 1.5 }} onClick={notif?.linkUrl ? handleView : undefined}>
        {/* Title */}
        <Typography sx={{
          fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.35,
          color: isDark ? '#E2E8F0' : '#1E293B',
          mb: 0.5, wordBreak: 'break-word',
        }}>
          {notif?.title}
        </Typography>

        {/* Message */}
        {notif?.message && (
          <Typography sx={{
            fontSize: '0.8rem', lineHeight: 1.5,
            color: isDark ? 'rgba(226,232,240,0.7)' : 'rgba(30,41,59,0.7)',
            mb: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-line',
            display: '-webkit-box', WebkitLineClamp: 6,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {notif.message}
          </Typography>
        )}

        {/* Action Buttons */}
        {notif?.linkUrl && (
          <Stack direction="row" spacing={1} mt={0}>
            <Button
              size="small"
              variant="contained"
              startIcon={<IconExternalLink size={14} />}
              onClick={(e) => { e.stopPropagation(); handleView(); }}
              sx={{
                fontSize: '0.7rem', fontWeight: 700, px: 1, py: 0.25,
                borderRadius: '8px', textTransform: 'none',
                background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.accent}cc)`,
                boxShadow: `0 4px 12px ${cfg.accent}44`,
                '&:hover': {
                  background: cfg.accent,
                  boxShadow: `0 6px 18px ${cfg.accent}55`,
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              View Task
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              sx={{
                fontSize: '0.7rem', fontWeight: 600, px: 1, py: 0.25,
                borderRadius: '8px', textTransform: 'none',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                '&:hover': {
                  borderColor: '#EF4444', color: '#EF4444',
                  background: 'rgba(239,68,68,0.06)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Dismiss
            </Button>
          </Stack>
        )}
      </Box>

      {/* Auto-hide progress bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 3,
          '& .MuiLinearProgress-bar': {
            background: `linear-gradient(90deg, ${cfg.accent}, ${cfg.accent}88)`,
            transition: 'none', // controlled by rAF
          },
          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }}
      />
    </Box>
    </SnackbarContent>
  );
});

export default TaskToast;
