import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Stack,
  Tooltip,
  Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconX,
  IconCoffee,
  IconHeart,
  IconGridDots,
  IconVolume,
  IconVolumeOff
} from '@tabler/icons-react';

import { useBossBreak } from 'contexts/BossBreakContext';
import BreakTimer from './BreakTimer';
import BreathingExercise from './BreathingExercise';
import QuickFunHub from './QuickFun';

const NEUTRAL_QUOTES = [
  "Take a breath. You've got this.",
  "Pause. Refresh. Continue.",
  "One step at a time.",
  "Ready when you are. 🚀",
  "A short reset can help you stay sharp."
];

export default function BossBreakModal() {
  const theme = useTheme();
  const { isOpen: contextIsOpen, activeTab: contextActiveTab, closeBossBreak, setActiveTab } = useBossBreak();
  const [localOpen, setLocalOpen] = useState(false);
  const [localTab, setLocalTab] = useState('timer');

  const isOpen = Boolean(contextIsOpen || localOpen);
  const activeTab = contextActiveTab || localTab;

  useEffect(() => {
    const handleOpenEvent = (e) => {
      const tab = e.detail?.tab || 'timer';
      setLocalTab(tab);
      if (setActiveTab) setActiveTab(tab);
      setLocalOpen(true);
    };
    const handleCloseEvent = () => {
      setLocalOpen(false);
    };
    window.addEventListener('open-boss-break', handleOpenEvent);
    window.addEventListener('close-boss-break', handleCloseEvent);
    return () => {
      window.removeEventListener('open-boss-break', handleOpenEvent);
      window.removeEventListener('close-boss-break', handleCloseEvent);
    };
  }, [setActiveTab]);

  const handleClose = () => {
    setLocalOpen(false);
    closeBossBreak();
  };

  // Audio mute state (default to muted as per requirement)
  const [isMuted, setIsMuted] = useState(true);

  // Friday / End of day greeting logic
  const headerGreeting = useMemo(() => {
    const now = new Date();
    const isFriday = now.getDay() === 5;
    const hour = now.getHours();

    if (isFriday) {
      return {
        highlight: '🎉 Happy Friday!',
        message: 'Nice work this week. Take a moment to reset before you wrap up.'
      };
    } else if (hour >= 17) {
      return {
        highlight: '🌅 Good Evening!',
        message: 'Nice work today! Take a moment to reset before you wrap up.'
      };
    } else {
      const quote = NEUTRAL_QUOTES[Math.floor(Math.random() * NEUTRAL_QUOTES.length)];
      return {
        highlight: 'Mind Refresh',
        message: quote
      };
    }
  }, [isOpen]);

  const handleTabChange = (event, newValue) => {
    setLocalTab(newValue);
    if (setActiveTab) setActiveTab(newValue);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth={activeTab === 'quickfun' ? 'sm' : 'xs'}
      fullWidth
      scroll="body"
      sx={{
        zIndex: 99999,
        '& .MuiDialog-paper': {
          zIndex: 100000,
          maxWidth: activeTab === 'quickfun' ? '540px !important' : '440px !important',
          transition: 'max-width 0.25s ease'
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: '20px',
          p: { xs: 1, sm: 1.5 },
          bgcolor: theme.palette.mode === 'dark' ? '#111928' : '#ffffff',
          boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: 1.5,
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
              color: '#ffffff',
              boxShadow: `0 4px 12px ${theme.palette.warning.main}40`
            }}
          >
            <IconCoffee size={20} stroke={2} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
              BOSS Break
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              Mind Refresh & Wellness
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          {/* Mute / Unmute Toggle */}
          <Tooltip title={isMuted ? 'Unmute Audio Chimes' : 'Mute Audio Chimes'} arrow>
            <IconButton
              size="small"
              onClick={() => setIsMuted(!isMuted)}
              sx={{
                color: isMuted ? 'text.secondary' : theme.palette.primary.main,
                bgcolor: isMuted ? 'transparent' : 'rgba(33, 150, 243, 0.1)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.06)' }
              }}
            >
              {isMuted ? <IconVolumeOff size={18} /> : <IconVolume size={18} />}
            </IconButton>
          </Tooltip>

          {/* Close Modal Button */}
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.06)', color: 'text.primary' }
            }}
          >
            <IconX size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Greeting Banner */}
      <Box sx={{ px: 1.5, mb: 1.5 }}>
        <Paper
          elevation={0}
          sx={{
            p: 1.2,
            px: 2,
            borderRadius: '12px',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc',
            border: `1px solid ${theme.palette.divider}`,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem' }}>
            <Box component="span" sx={{ fontWeight: 800, color: theme.palette.primary.main, mr: 0.5 }}>
              {headerGreeting.highlight}
            </Box>
            {headerGreeting.message}
          </Typography>
        </Paper>
      </Box>

      {/* Navigation Tabs */}
      <Box sx={{ px: 1.5, mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: 40,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
            borderRadius: '12px',
            p: 0.5,
            '& .MuiTabs-indicator': {
              display: 'none'
            },
            '& .MuiTab-root': {
              minHeight: 36,
              py: 0.5,
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '9px',
              color: 'text.secondary',
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                bgcolor: theme.palette.mode === 'dark' ? theme.palette.primary.main : '#ffffff',
                color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.primary.main,
                boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 2px 8px rgba(0,0,0,0.08)'
              }
            }
          }}
        >
          <Tab
            value="timer"
            label="Take a Break"
            icon={<IconCoffee size={16} style={{ marginBottom: 0 }} />}
            iconPosition="start"
          />
          <Tab
            value="relax"
            label="60s Relax"
            icon={<IconHeart size={16} style={{ marginBottom: 0 }} />}
            iconPosition="start"
          />
          <Tab
            value="games"
            label="Quick Fun"
            icon={<IconGridDots size={16} style={{ marginBottom: 0 }} />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Dialog Body */}
      <DialogContent sx={{ p: 1.5, pt: 0 }}>
        {activeTab === 'timer' && <BreakTimer isMuted={isMuted} onClose={handleClose} />}
        {activeTab === 'relax' && <BreathingExercise isMuted={isMuted} onClose={handleClose} />}
        {activeTab === 'games' && <QuickFunHub isMuted={isMuted} />}
      </DialogContent>
    </Dialog>
  );
}
