/**
 * NotificationSection — Premium Enterprise BOS Notification Center
 *
 * Features:
 *  - Real-time STOMP WebSocket push via useNotifications hook
 *  - Premium glassmorphism notification bell + dropdown panel
 *  - Category tabs: All | Tasks | Chats | System
 *  - Per-notification: mark-read, dismiss, navigate
 *  - "Time ago" format with live refresh
 *  - Animated unread badge (pulsing ring)
 *  - Premium TaskToast popups (bottom-right stack)
 *  - Windows Desktop Notifications
 *  - Empty state illustration
 *  - View All dialog
 */
import { useEffect, useRef, useState, useMemo, useCallback, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, IconButton, Avatar, Badge, Button, Chip, Divider,
  Stack, Paper, Popper, ClickAwayListener, Dialog, DialogContent,
  DialogTitle, Tooltip, useMediaQuery, alpha
} from '@mui/material';
import { useTheme, styled, keyframes } from '@mui/material/styles';
import { useSnackbar, closeSnackbar } from 'notistack';

import axiosServices from 'utils/axios';
import useAuth from 'hooks/useAuth';
import useConfig from 'hooks/useConfig';
import useNotifications from 'hooks/useNotifications';
import { useDispatch, useSelector } from 'store';
import {
  markRead as markReadAction,
  markAllRead as markAllReadAction,
  selectNotifications,
  selectUnreadCount,
  selectToastQueue,
  dequeueToast,
  clearToastQueue,
} from 'store/slices/notifications';
import { getUserImageUrl } from 'utils/upload-helper';
import MainCard from 'ui-component/cards/MainCard';
import Transitions from 'ui-component/extended/Transitions';
import TaskToast from 'ui-component/notifications/TaskToast';

import {
  IconBell, IconX, IconCheck, IconChecks, IconMessage2,
  IconClipboardList, IconSettings, IconExternalLink, IconRefresh,
  IconBellOff, IconClock,
} from '@tabler/icons-react';

// ─── Keyframes ────────────────────────────────────────────────────────────────
const bellShake = keyframes`
  0%,100% { transform: rotate(0deg); }
  15%      { transform: rotate(12deg); }
  30%      { transform: rotate(-10deg); }
  45%      { transform: rotate(8deg); }
  60%      { transform: rotate(-6deg); }
  75%      { transform: rotate(4deg); }
`;
const ringPulse = keyframes`
  0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
  50%     { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
`;

// ─── Time-ago formatter ───────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = Date.now();
  const diff = Math.floor((now - date.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ─── Desktop notification helper (Disabled / Commented out) ─────────────────
const showDesktopNotif = (title, body, icon, onClick) => {
  // Chrome desktop notifications commented out as requested
  /*
  if (!('Notification' in window)) return;
  const fire = () => {
    try {
      const n = new Notification(title, { body, icon: icon || '/favicon.ico' });
      if (onClick) n.onclick = () => { window.focus(); onClick(); };
    } catch { }
  };
  if (Notification.permission === 'granted') fire();
  else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(p => { if (p === 'granted') fire(); }).catch(() => { });
  }
  */
  return;
};

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

// ─── Category config ──────────────────────────────────────────────────────────
const TABS = [
  { value: 'all', label: 'All', icon: <IconBell size={14} /> },
  { value: 'unread', label: 'Unread', icon: <IconClock size={14} /> },
  { value: 'read', label: 'Read', icon: <IconChecks size={14} /> },
  { value: 'tasks', label: 'Tasks', icon: <IconClipboardList size={14} /> },
];

// ─── Detect notification category ────────────────────────────────────────────
function getCategory(notif) {
  const text = ((notif?.title || '') + ' ' + (notif?.message || '')).toLowerCase();
  if (text.includes('task') || text.includes('assigned') || text.includes('audit') ||
    text.includes('checklist') || text.includes('meeting') || text.includes('ncr')) return 'tasks';
  if (notif?.isChat) return 'chats';
  return 'system';
}

// ─── Single Notification Row ──────────────────────────────────────────────────
function NotifRow({ notif, onRead, onNavigate, isDark }) {
  const theme = useTheme();
  const isUnread = !notif.isRead;

  const accent = isUnread ? '#6366F1' : (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)');
  const avatarBg = isUnread
    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
    : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)');

  return (
    <Box
      onClick={() => onNavigate(notif)}
      sx={{
        display: 'flex', gap: 1.5, px: 2, py: 1.5, cursor: 'pointer',
        borderLeft: `3px solid ${isUnread ? '#6366F1' : 'transparent'}`,
        background: isUnread
          ? (isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.03)')
          : 'transparent',
        transition: 'all 0.15s ease',
        position: 'relative',
        '&:hover': {
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)',
        },
      }}
    >
      {/* Avatar */}
      <Avatar
        src={notif.imgName
          ? (notif.imgName.includes('/') ? notif.imgName : getUserImageUrl(notif.imgName))
          : undefined}
        variant="rounded"
        sx={{
          width: 38, height: 38, flexShrink: 0, background: avatarBg,
          color: isUnread ? '#fff' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'),
          fontSize: '0.85rem', fontWeight: 700, borderRadius: '10px',
          border: `1px solid ${isUnread ? 'rgba(99,102,241,0.3)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')}`,
        }}
      >
        {!notif.imgName && (notif.isChat ? <IconMessage2 size={18} /> : <IconBell size={18} />)}
      </Avatar>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Typography sx={{
            fontSize: '0.8rem', fontWeight: isUnread ? 700 : 500,
            color: isDark ? (isUnread ? '#F1F5F9' : 'rgba(241,245,249,0.65)') : (isUnread ? '#0F172A' : 'rgba(15,23,42,0.6)'),
            lineHeight: 1.35, flex: 1,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {notif.title}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
            <Typography sx={{ fontSize: '0.65rem', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)', whiteSpace: 'nowrap' }}>
              {timeAgo(notif.createdAt)}
            </Typography>
            {isUnread && (
              <Tooltip title="Mark as read" arrow placement="top">
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
                  sx={{ width: 20, height: 20, color: '#6366F1', '&:hover': { background: 'rgba(99,102,241,0.1)' } }}
                >
                  <IconCheck size={12} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Box>
        {notif.message && (
          <Typography sx={{
            fontSize: '0.72rem', mt: 0.35, lineHeight: 1.4,
            color: isDark ? 'rgba(241,245,249,0.4)' : 'rgba(15,23,42,0.45)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {notif.message}
          </Typography>
        )}
      </Box>

      {/* Unread dot */}
      {isUnread && (
        <Box sx={{
          position: 'absolute', top: 18, right: 10,
          width: 7, height: 7, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          boxShadow: '0 0 6px rgba(99,102,241,0.6)',
        }} />
      )}
    </Box>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ isDark }) {
  return (
    <Box sx={{ py: 5, px: 3, textAlign: 'center' }}>
      <Box sx={{
        width: 80, height: 80, borderRadius: '24px', mx: 'auto', mb: 2,
        background: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid', borderColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)',
      }}>
        <IconBellOff size={36} color={isDark ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.45)'} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? 'rgba(241,245,249,0.7)' : 'rgba(15,23,42,0.6)', mb: 0.5 }}>
        All caught up!
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: isDark ? 'rgba(241,245,249,0.35)' : 'rgba(15,23,42,0.35)' }}>
        No notifications to show here.
      </Typography>
    </Box>
  );
}

// ─── Toast renderer — listens to Redux toastQueue ────────────────────────────
function ToastRenderer() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toastQueue = useSelector(selectToastQueue);
  const shownRef = useRef(new Set());

  useEffect(() => {
    if (toastQueue.length === 0) return;

    console.log('[ToastRenderer] Processing toastQueue:', toastQueue);

    toastQueue.forEach((notif) => {
      const toastId = notif._toastId;
      if (shownRef.current.has(toastId)) return;
      shownRef.current.add(toastId);

      console.log('[ToastRenderer] Enqueuing snackbar popup for:', notif.title);

      showDesktopNotif(
        notif.title || 'New Notification',
        notif.message || '',
        '/favicon.ico',
        () => { if (notif.linkUrl) navigate(notif.linkUrl, { state: { fromNotification: true } }); }
      );

      enqueueSnackbar(notif.message || '', {
        key: toastId,
        persist: true,
        preventDuplicate: true,
        anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
        content: (key) => (
          <TaskToast
            id={toastId}
            notif={notif}
            onClose={() => {
              closeSnackbar(key);
              dispatch(dequeueToast(toastId));
            }}
            onView={() => {
              closeSnackbar(key);
            }}
          />
        )
      });
    });

    // Clear queue so we don't process these items again in the next state change
    dispatch(clearToastQueue());
  }, [toastQueue, enqueueSnackbar, closeSnackbar, dispatch, navigate]);

  return null;
}

// ─── Main NotificationSection ─────────────────────────────────────────────────
export default function NotificationSection() {
  const theme = useTheme();
  const { state: configState } = useConfig();
  const allowNotifications = configState.allowNotifications ?? true;
  const isDark = theme.palette.mode === 'dark';
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const [open, setOpen] = useState(false);
  const [viewAllOpen, setViewAllOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const [isShaking, setIsShaking] = useState(false);
  const anchorRef = useRef(null);
  const prevUnreadRef = useRef(0);

  // Use the centralized hook
  const { notifications, unreadCount, markRead, markAllRead, refresh, isConnected } = useNotifications();

  // Shake bell when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setIsShaking(true);
      const t = setTimeout(() => setIsShaking(false), 800);
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // Also fetch chat channels (keep existing behaviour)
  const [channels, setChannels] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchChannels = async () => {
      const token = sessionStorage.getItem('serviceToken');
      if (!token) return;
      try {
        const res = await axiosServices.get('/api/chat/channels');
        setChannels(res.data || []);
      } catch { /* ignore */ }
    };
    fetchChannels();
    const iv = setInterval(fetchChannels, 1200000);
    return () => clearInterval(iv);
  }, []);

  // ─── Upcoming Meeting Reminder Logic ───
  const notifiedMeetings = useRef(new Set());

  useEffect(() => {
    if (!allowNotifications) return;

    // Prune entries from previous days to prevent unbounded Set growth
    const pruneOldEntries = () => {
      const todayPrefix = new Date().toDateString();
      notifiedMeetings.current.forEach((key) => {
        // keys are in format "<id>-5m" or "<id>-30s" — date is not encoded,
        // so we keep a "day stamp" to know when to flush the whole Set
        if (notifiedMeetings.current._day && notifiedMeetings.current._day !== todayPrefix) {
          notifiedMeetings.current.clear();
        }
      });
      notifiedMeetings.current._day = todayPrefix;
    };

    const checkMeetings = async () => {
      // Skip API call when tab is hidden — saves network + memory
      if (document.visibilityState === 'hidden') return;

      pruneOldEntries();

      try {
        const res = await axiosServices.get('/api/qms/meetings/today');
        const meetings = Array.isArray(res.data) ? res.data : [];
        const now = new Date();

        meetings.forEach(m => {
          if (!m.startTime) return;
          const [h, min] = m.startTime.split(':').map(Number);
          const meetingTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min);
          const diffMs = meetingTime.getTime() - now.getTime();

          // 5 minutes before (trigger if within 5m to 4m45s)
          if (diffMs > 0 && diffMs <= 5 * 60 * 1000 && diffMs > 4.75 * 60 * 1000) {
            const notifKey = `${m.id}-5m`;
            if (!notifiedMeetings.current.has(notifKey)) {
              notifiedMeetings.current.add(notifKey);
              showDesktopNotif(
                `Upcoming Meeting in 5 minutes!`,
                `${m.meetingType?.meetingTypeName || 'Meeting'} - ${m.subject || m.agenda || 'No Subject'}`,
                '/favicon.ico',
                () => { window.focus(); navigate('/apps/calendar'); }
              );
              playSound();
            }
          }

          // 30 seconds before (trigger if within 30s to 15s)
          if (diffMs > 0 && diffMs <= 30 * 1000 && diffMs > 15 * 1000) {
            const notifKey = `${m.id}-30s`;
            if (!notifiedMeetings.current.has(notifKey)) {
              notifiedMeetings.current.add(notifKey);
              showDesktopNotif(
                `Meeting starts in 30 seconds!`,
                `${m.meetingType?.meetingTypeName || 'Meeting'} - ${m.subject || m.agenda || 'No Subject'}`,
                '/favicon.ico',
                () => { window.focus(); navigate('/apps/calendar'); }
              );
              playSound();
            }
          }
        });
      } catch (e) {
        // ignore errors silently in background
      }
    };

    // ── Visibility-aware polling ──────────────────────────────────────────────
    // - Runs every 60 seconds (was 15 s — reduces CPU + network by 75 %)
    // - Pauses automatically when tab is hidden (visibilityState === 'hidden')
    // - Fires an immediate check the moment the user switches back to this tab
    checkMeetings();
    const iv = setInterval(checkMeetings, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkMeetings(); // immediate refresh on tab focus
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [allowNotifications, navigate]);


  // Toggle
  const handleToggle = () => {
    setOpen(p => !p);
    // Commented out as requested:
    // if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    //   Notification.requestPermission().catch(() => { });
    // }
  };
  const handleClose = (e) => {
    if (anchorRef.current?.contains(e.target)) return;
    setOpen(false);
  };

  // Handle notification click
  const handleNotifClick = async (notif) => {
    setOpen(false);
    if (!notif.isRead) await markRead(notif.id);
    if (notif.isChat && notif.channelId) {
      navigate('/apps/chat', { state: { openChannelId: notif.channelId, fromNotification: true } });
      return;
    }
    if (notif.linkUrl) {
      navigate(notif.linkUrl, { state: { fromNotification: true } });
    }
  };

  // Mixed: app notifications + chat channels
  const allItems = useMemo(() => {
    if (!allowNotifications) return [];
    const arr = [...(notifications || []).map(n => ({ ...n, isChat: false }))];
    (channels || []).forEach(c => {
      const currentUserId = user?.userId || user?.id || 'bos';
      const isOwn = c.lastMessageSender === currentUserId || c.lastMessageSender === user?.name;
      const hasMsg = c.lastMessage && c.lastMessage !== 'No messages yet';
      if ((hasMsg && !isOwn) || c.unreadCount > 0) {
        arr.push({
          id: `chat-${c.id}`, channelId: c.id,
          title: c.channelName || c.lastMessageSender || 'Chat Message',
          message: c.lastMessage || 'Sent a message',
          createdAt: c.lastMessageTime || new Date().toISOString(),
          isRead: !c.unreadCount, isChat: true,
          imgName: c.imgName ? getUserImageUrl(c.imgName) : undefined,
        });
      }
    });
    arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return arr.slice(0, 60);
  }, [notifications, channels, user, allowNotifications]);

  const totalUnread = useMemo(() => allItems.filter(n => !n.isRead).length, [allItems]);

  const filtered = useMemo(() => {
    if (tab === 'unread') return allItems.filter(n => !n.isRead);
    if (tab === 'read') return allItems.filter(n => n.isRead);
    if (tab === 'tasks') return allItems.filter(n => getCategory(n) === 'tasks');
    return allItems;
  }, [allItems, tab]);

  // Panel styles
  const panelBg = isDark
    ? 'linear-gradient(160deg, rgba(10,16,36,0.98) 0%, rgba(7,12,28,0.99) 100%)'
    : 'linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(248,250,255,0.99) 100%)';

  return (
    <>
      {/* Toast queue renderer (global, renders nothing visible itself) */}
      <ToastRenderer />

      {/* Bell Button */}
      <Box sx={{ ml: { xs: 0.5, sm: 1, md: 2 }, display: { xs: 'none', md: 'block' } }}>
        <Tooltip title="Notifications (Space + Shift + N)" placement="bottom" arrow>
          <Box
            ref={anchorRef}
            onClick={handleToggle}
            data-shortcut="notification"
            aria-controls={open ? 'notif-panel' : undefined}
            aria-haspopup="true"
            sx={{
              width: 40, height: 40, borderRadius: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
              border: 'none',
              color: '#ffffff',
              boxShadow: `0 4px 14px ${theme.palette.warning.main}45`,
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.warning.dark}, ${theme.palette.warning.main})`,
                transform: 'translateY(-1px)',
                boxShadow: `0 6px 20px ${theme.palette.warning.main}60`,
              },
              animation: isShaking ? `${bellShake} 0.8s cubic-bezier(0.36,0.07,0.19,0.97)` : 'none',
            }}
          >
            <Badge
              badgeContent={totalUnread}
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  color: '#fff', fontSize: '0.65rem', fontWeight: 800,
                  minWidth: 18, height: 18, borderRadius: '9px', border: '2px solid',
                  borderColor: isDark ? '#070C1C' : '#fff',
                  animation: totalUnread > 0 ? `${ringPulse} 2s ease-in-out infinite` : 'none',
                }
              }}
            >
              <IconBell size={20} strokeWidth={1.8} color="#ffffff" />
            </Badge>
          </Box>
        </Tooltip>
      </Box>

      {/* Notification Panel Popper */}
      <Popper
        id="notif-panel"
        placement={downMD ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        modifiers={[{ name: 'offset', options: { offset: [0, 14] } }]}
        sx={{ zIndex: 1200 }}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Transitions position="top-right" in={open} {...TransitionProps}>
              <Paper
                elevation={0}
                sx={{
                  width: { xs: 320, sm: 400 },
                  background: panelBg,
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  borderRadius: '18px',
                  boxShadow: isDark
                    ? '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)'
                    : '0 32px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                }}
              >
                {/* Panel Header */}
                <Box sx={{
                  px: 2.5, pt: 2, pb: 1.5,
                  borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(99,102,241,0.08), transparent)'
                    : 'linear-gradient(135deg, rgba(99,102,241,0.04), transparent)',
                }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{
                        width: 34, height: 34, borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                      }}>
                        <IconBell size={18} color="#fff" />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: isDark ? '#F1F5F9' : '#0F172A' }}>
                          Notifications
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: isDark ? 'rgba(241,245,249,0.4)' : 'rgba(15,23,42,0.4)' }}>
                          {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'} •{' '}
                          <Box component="span" sx={{ color: isConnected ? '#22C55E' : '#EF4444' }}>
                            ● {isConnected ? 'Live' : 'Offline'}
                          </Box>
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Refresh" arrow>
                        <IconButton size="small" onClick={refresh}
                          sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', '&:hover': { color: '#6366F1' } }}>
                          <IconRefresh size={16} />
                        </IconButton>
                      </Tooltip>
                      {totalUnread > 0 && (
                        <Tooltip title="Mark all as read" arrow>
                          <IconButton size="small" onClick={markAllRead}
                            sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', '&:hover': { color: '#22C55E' } }}>
                            <IconChecks size={16} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>

                  {/* Tabs */}
                  <Stack direction="row" spacing={0.5}>
                    {TABS.map(t => (
                      <Box
                        key={t.value}
                        onClick={() => setTab(t.value)}
                        sx={{
                          px: 1.25, py: 0.5, borderRadius: '8px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 0.5,
                          fontSize: '0.7rem', fontWeight: tab === t.value ? 700 : 500,
                          color: tab === t.value
                            ? '#6366F1'
                            : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)'),
                          background: tab === t.value
                            ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)')
                            : 'transparent',
                          border: '1px solid',
                          borderColor: tab === t.value
                            ? 'rgba(99,102,241,0.3)'
                            : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.07)',
                            color: '#6366F1',
                          },
                        }}
                      >
                        {t.icon}
                        {t.label}
                        {t.value === 'unread' && totalUnread > 0 && (
                          <Box sx={{
                            ml: 0.25, px: 0.7, py: 0.1, borderRadius: '6px', fontSize: '0.6rem',
                            fontWeight: 800, background: '#EF4444', color: '#fff', lineHeight: 1.5,
                          }}>
                            {totalUnread}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {/* Notification List */}
                <Box sx={{
                  maxHeight: 380,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  '&::-webkit-scrollbar': { width: 4 },
                  '&::-webkit-scrollbar-thumb': {
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderRadius: 4,
                  },
                }}>
                  {filtered.length === 0 ? (
                    <EmptyState isDark={isDark} />
                  ) : (
                    filtered.slice(0, 8).map((notif, i) => (
                      <Box key={notif.id}>
                        <NotifRow
                          notif={notif}
                          onRead={markRead}
                          onNavigate={handleNotifClick}
                          isDark={isDark}
                        />
                        {i < Math.min(filtered.length, 8) - 1 && (
                          <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                        )}
                      </Box>
                    ))
                  )}
                </Box>

                {/* Footer */}
                <Box sx={{
                  px: 2.5, py: 1.5,
                  borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  display: 'flex', justifyContent: 'center',
                }}>
                  <Button
                    size="small"
                    endIcon={<IconExternalLink size={14} />}
                    onClick={() => { setOpen(false); setViewAllOpen(true); }}
                    sx={{
                      fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
                      color: '#6366F1', borderRadius: '8px', px: 2, py: 0.75,
                      '&:hover': { background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.06)' },
                    }}
                  >
                    View All Notifications
                  </Button>
                </Box>
              </Paper>
            </Transitions>
          </ClickAwayListener>
        )}
      </Popper>

      {/* View All Dialog */}
      <Dialog
        open={viewAllOpen}
        onClose={() => setViewAllOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '18px',
            maxHeight: '80vh',
            background: panelBg,
            backdropFilter: 'blur(24px)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            boxShadow: isDark
              ? '0 32px 80px rgba(0,0,0,0.7)'
              : '0 32px 80px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          pb: 1, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconBell size={18} color="#fff" />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>All Notifications</Typography>
              <Typography sx={{ fontSize: '0.68rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                {allItems.length} total · {totalUnread} unread
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {totalUnread > 0 && (
              <Tooltip title="Mark all as read" arrow>
                <IconButton size="small" onClick={markAllRead}
                  sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', '&:hover': { color: '#22C55E' } }}>
                  <IconChecks size={18} />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={() => setViewAllOpen(false)} size="small"
              sx={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', '&:hover': { color: '#EF4444' } }}>
              <IconX size={18} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {allItems.length === 0 ? (
            <EmptyState isDark={isDark} />
          ) : (
            allItems.map((notif, i) => (
              <Box key={notif.id}>
                <NotifRow
                  notif={notif}
                  onRead={markRead}
                  onNavigate={(n) => { setViewAllOpen(false); handleNotifClick(n); }}
                  isDark={isDark}
                />
                {i < allItems.length - 1 && (
                  <Divider sx={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
                )}
              </Box>
            ))
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
