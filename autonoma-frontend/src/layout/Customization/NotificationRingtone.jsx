// Organization: AUTONOVA
// Updated By: hari06-space
// Updated At: 2026-09-04
// Description: Ultra-premium Audio Studio with quick sound presets, grouped categories, and interactive tone preview.

import React, { useState } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  Stack,
  Typography,
  ListSubheader,
  IconButton,
  Divider,
  Box,
  Button,
  Chip,
  Tooltip
} from '@mui/material';
import { useColorScheme, useTheme } from '@mui/material/styles';

// project imports
import useConfig from 'hooks/useConfig';
import { RINGTONE_OPTIONS, playSynthesizedSound } from 'utils/AudioEngine';

// assets
import {
  IconPlayerPlay,
  IconVolume,
  IconVolumeOff,
  IconBellPlus,
  IconCircleCheck,
  IconShieldCheck,
  IconCircleX,
  IconClock,
  IconAlertCircle,
  IconDroplet,
  IconBell,
  IconAlertTriangle,
  IconCalendarEvent,
  IconSparkles,
  IconBriefcase,
  IconCheck
} from '@tabler/icons-react';

const EVENT_GROUPS = [
  {
    name: 'Workflow & Tasks',
    icon: IconBriefcase,
    color: '#6366f1',
    events: [
      { key: 'newTask', label: 'New Task Assigned', icon: IconBellPlus, color: '#3b82f6', defaultTone: 'task_alert' },
      { key: 'taskCompleted', label: 'Task Completed', icon: IconCircleCheck, color: '#10b981', defaultTone: 'success_signal' },
      { key: 'approvalRequired', label: 'Approval Required', icon: IconShieldCheck, color: '#f59e0b', defaultTone: 'approval_bell' },
      { key: 'taskRejected', label: 'Task Rejected', icon: IconCircleX, color: '#ef4444', defaultTone: 'action_required' }
    ]
  },
  {
    name: 'Reminders & Deadlines',
    icon: IconClock,
    color: '#f97316',
    events: [
      { key: 'deadlineReminder', label: 'Deadline Reminder', icon: IconClock, color: '#f97316', defaultTone: 'reminder_tone' },
      { key: 'overdueTask', label: 'Overdue Task Alert', icon: IconAlertCircle, color: '#dc2626', defaultTone: 'deadline_alarm' },
      { key: 'meetingReminder', label: 'Meeting Reminder', icon: IconCalendarEvent, color: '#8b5cf6', defaultTone: 'gentle_bell' }
    ]
  },
  {
    name: 'System Notifications',
    icon: IconBell,
    color: '#14b8a6',
    events: [
      { key: 'successMessage', label: 'Success Message', icon: IconDroplet, color: '#10b981', defaultTone: 'pop' },
      { key: 'generalNotification', label: 'General Notification', icon: IconBell, color: '#06b6d4', defaultTone: 'nova_ping' },
      { key: 'errorNotification', label: 'Error Notification', icon: IconAlertTriangle, color: '#ef4444', defaultTone: 'warning_echo' }
    ]
  }
];

// Curated sound presets
const SOUND_PRESETS = [
  {
    id: 'erp_pro',
    label: 'ERP Standard',
    desc: 'Professional enterprise tones',
    mapping: {
      newTask: 'task_alert',
      taskCompleted: 'success_signal',
      approvalRequired: 'approval_bell',
      taskRejected: 'action_required',
      deadlineReminder: 'reminder_tone',
      overdueTask: 'deadline_alarm',
      meetingReminder: 'gentle_bell',
      successMessage: 'pop',
      generalNotification: 'nova_ping',
      errorNotification: 'warning_echo'
    }
  },
  {
    id: 'modern_clean',
    label: 'Modern Clean',
    desc: 'Subtle water drops and pings',
    mapping: {
      newTask: 'nova_ping',
      taskCompleted: 'digital_bloom',
      approvalRequired: 'aero_chime',
      taskRejected: 'neon_click',
      deadlineReminder: 'crystal_tap',
      overdueTask: 'echo_drop',
      meetingReminder: 'pulse_pop',
      successMessage: 'water_drops',
      generalNotification: 'soft_spark',
      errorNotification: 'critical_pulse'
    }
  },
  {
    id: 'futuristic',
    label: 'Quantum Tech',
    desc: 'Sci-fi synthesizers & cosmic waves',
    mapping: {
      newTask: 'quantum_ping',
      taskCompleted: 'orbit_echo',
      approvalRequired: 'aurora_signal',
      taskRejected: 'cyber_pulse',
      deadlineReminder: 'galaxy_drop',
      overdueTask: 'prism_wave',
      meetingReminder: 'infinity_chime',
      successMessage: 'stellar_pop',
      generalNotification: 'quantum_ping',
      errorNotification: 'emergency_ping'
    }
  },
  {
    id: 'soft_calm',
    label: 'Soft & Gentle',
    desc: 'Relaxing bells and gentle chimes',
    mapping: {
      newTask: 'gentle_bell',
      taskCompleted: 'calm_drop',
      approvalRequired: 'melody_tap',
      taskRejected: 'soft_bubble',
      deadlineReminder: 'peace_chime',
      overdueTask: 'morning_spark',
      meetingReminder: 'harp',
      successMessage: 'flute',
      generalNotification: 'gentle',
      errorNotification: 'ding'
    }
  }
];

// Group ringtones by category
const groupedRingtones = RINGTONE_OPTIONS.reduce((acc, curr) => {
  if (!acc[curr.group]) acc[curr.group] = [];
  acc[curr.group].push(curr);
  return acc;
}, {});

export default function NotificationRingtonePage() {
  const theme = useTheme();
  const { colorScheme, mode } = useColorScheme();
  const isDark = colorScheme === 'dark' || mode === 'dark' || theme.palette.mode === 'dark';
  const { state: { notificationMapping }, setField } = useConfig();

  const [playingKey, setPlayingKey] = useState(null);

  let mapping = {};
  try {
    mapping = typeof notificationMapping === 'string'
      ? JSON.parse(notificationMapping)
      : (notificationMapping || {});
  } catch {
    mapping = {};
  }

  const allKeys = EVENT_GROUPS.flatMap((g) => g.events.map((e) => e.key));
  const isAllMuted = allKeys.every((k) => mapping[k] === 'silent');

  const handleMappingChange = (eventKey, value) => {
    const next = { ...mapping, [eventKey]: value };
    setField('notificationMapping', JSON.stringify(next));
    if (value !== 'silent') {
      setPlayingKey(eventKey);
      playSynthesizedSound(value);
      setTimeout(() => setPlayingKey(null), 700);
    }
  };

  const handlePreview = (eventKey, tone) => {
    const soundToPlay = tone || mapping[eventKey];
    if (soundToPlay && soundToPlay !== 'silent') {
      setPlayingKey(eventKey);
      playSynthesizedSound(soundToPlay);
      setTimeout(() => setPlayingKey(null), 700);
    }
  };

  const handleToggleMuteAll = () => {
    const next = { ...mapping };
    const target = isAllMuted ? 'nova_ping' : 'silent';
    allKeys.forEach((k) => { next[k] = target; });
    setField('notificationMapping', JSON.stringify(next));
  };

  const handleApplyPreset = (preset) => {
    setField('notificationMapping', JSON.stringify(preset.mapping));
    // Play preview tone
    playSynthesizedSound(preset.mapping.newTask || 'nova_ping');
  };

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      {/* ── Master Status Banner ─────────────────────────────────── */}
      <Box
        sx={{
          p: 2,
          borderRadius: 2.5,
          background: isAllMuted
            ? (isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2')
            : (isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5'),
          border: '1.5px solid',
          borderColor: isAllMuted ? 'error.light' : 'success.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.25s'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: isAllMuted ? 'error.main' : 'success.main',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isAllMuted ? '0 4px 12px rgba(239,68,68,0.3)' : '0 4px 12px rgba(16,185,129,0.3)'
            }}
          >
            {isAllMuted ? <IconVolumeOff size={18} strokeWidth={2.5} /> : <IconVolume size={18} strokeWidth={2.5} />}
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={800} color={isAllMuted ? 'error.main' : 'success.dark'}>
              {isAllMuted ? 'All Notification Sounds Muted' : 'Audio Feedback Enabled'}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
              {isAllMuted ? 'System runs in silent mode' : 'Real-time sound on user events'}
            </Typography>
          </Box>
        </Stack>

        <Button
          size="small"
          variant={isAllMuted ? 'contained' : 'outlined'}
          color={isAllMuted ? 'success' : 'error'}
          onClick={handleToggleMuteAll}
          sx={{
            borderRadius: 2,
            fontSize: '0.72rem',
            fontWeight: 800,
            px: 1.5,
            py: 0.4
          }}
        >
          {isAllMuted ? 'Unmute All' : 'Mute All'}
        </Button>
      </Box>

      {/* ── Instant Sound Presets ───────────────────────────────── */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={0.75} mb={1}>
          <IconSparkles size={14} color={theme.palette.primary.main} />
          <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Instant Tone Presets
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1
          }}
        >
          {SOUND_PRESETS.map((preset) => (
            <Tooltip key={preset.id} title={preset.desc} placement="top" arrow>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleApplyPreset(preset)}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 2,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.lighter',
                    color: 'primary.main'
                  }
                }}
              >
                {preset.label}
              </Button>
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* ── Grouped Event Rows ───────────────────────────────────── */}
      {EVENT_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        return (
          <Box
            key={group.name}
            sx={{
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
              overflow: 'hidden'
            }}
          >
            {/* Category Header */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                px: 2,
                py: 1,
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <GroupIcon size={14} color={group.color} strokeWidth={2.5} />
              <Typography variant="caption" fontWeight={800} sx={{ letterSpacing: '0.04em', textTransform: 'uppercase', color: 'text.secondary' }}>
                {group.name}
              </Typography>
            </Stack>

            {/* Event Items */}
            {group.events.map((evt, idx) => {
              const EventIcon = evt.icon;
              const currentTone = mapping[evt.key] || evt.defaultTone;
              const isMuted = currentTone === 'silent';
              const isPlaying = playingKey === evt.key;

              return (
                <Box key={evt.key}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      p: 1.25,
                      px: 2,
                      opacity: isMuted ? 0.6 : 1,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        opacity: 1
                      }
                    }}
                  >
                    {/* Event Icon Badge */}
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.75,
                        bgcolor: isMuted ? 'action.disabledBackground' : `${evt.color}18`,
                        color: isMuted ? 'text.disabled' : evt.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <EventIcon size={15} strokeWidth={2.2} />
                    </Box>

                    {/* Event Title */}
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        fontSize: '0.8rem',
                        fontWeight: isMuted ? 500 : 700,
                        color: isMuted ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {evt.label}
                    </Typography>

                    {/* Tone Select Dropdown */}
                    <FormControl size="small" sx={{ width: 135 }}>
                      <Select
                        value={currentTone}
                        onChange={(e) => handleMappingChange(evt.key, e.target.value)}
                        displayEmpty
                        sx={{
                          borderRadius: 1.75,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          height: 32,
                          bgcolor: 'background.paper',
                          '.MuiSelect-select': { py: 0.5, px: 1.25 },
                          '.MuiOutlinedInput-notchedOutline': {
                            borderColor: isMuted ? 'divider' : 'primary.light'
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 320,
                              borderRadius: 2,
                              mt: 0.5,
                              boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                            }
                          }
                        }}
                      >
                        <MenuItem value="silent" sx={{ fontWeight: 700, color: 'error.main', fontSize: '0.8rem' }}>
                          🔕 Silent (Muted)
                        </MenuItem>
                        {Object.keys(groupedRingtones).map((grp) => [
                          <ListSubheader
                            key={grp}
                            disableSticky
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              textTransform: 'uppercase',
                              lineHeight: '26px',
                              color: 'primary.main',
                              bgcolor: 'background.paper',
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              mt: 0.5
                            }}
                          >
                            {grp}
                          </ListSubheader>,
                          ...groupedRingtones[grp]
                            .filter((opt) => opt.value !== 'silent')
                            .map((option) => (
                              <MenuItem key={option.value} value={option.value} sx={{ ml: 1, fontSize: '0.8rem', py: 0.6 }}>
                                {option.label}
                              </MenuItem>
                            ))
                        ])}
                      </Select>
                    </FormControl>

                    {/* Play Preview Button */}
                    <Tooltip title={isMuted ? 'Unmute to preview' : 'Play tone'}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(evt.key, currentTone)}
                          disabled={isMuted}
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: isPlaying ? 'primary.main' : 'divider',
                            bgcolor: isPlaying ? 'primary.main' : 'background.paper',
                            color: isPlaying ? '#fff' : (isMuted ? 'text.disabled' : 'primary.main'),
                            boxShadow: isPlaying ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: 'primary.lighter',
                              borderColor: 'primary.main'
                            }
                          }}
                        >
                          <IconPlayerPlay size={14} strokeWidth={2.5} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                  {idx < group.events.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Stack>
  );
}
