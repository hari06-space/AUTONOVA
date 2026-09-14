import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  IconButton,
  Chip,
  LinearProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconRotateClockwise,
  IconTrophy,
  IconBolt,
  IconFlame,
  IconPlayerPlay
} from '@tabler/icons-react';
import soundHelper from '../soundHelper';

const GAME_DURATION = 20; // 20 seconds
const TARGET_EMOJIS = ['🎯', '⚡', '🌟', '💎', '🔥', '🚀'];

export default function SpeedTap({ isMuted }) {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [activeCell, setActiveCell] = useState(null);
  const [activeEmoji, setActiveEmoji] = useState('🎯');
  const [bestScore, setBestScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('boss_break_speed_best') || '0', 10);
    } catch (e) {
      return 0;
    }
  });

  const timerRef = useRef(null);
  const targetTimerRef = useRef(null);

  const spawnTarget = () => {
    const nextCell = Math.floor(Math.random() * 9);
    const nextEmoji = TARGET_EMOJIS[Math.floor(Math.random() * TARGET_EMOJIS.length)];
    setActiveCell(nextCell);
    setActiveEmoji(nextEmoji);
  };

  const startGame = () => {
    setIsPlaying(true);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    spawnTarget();
    soundHelper.playTone(523, 0.1, isMuted);
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsPlaying(false);
            setActiveCell(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [isPlaying]);

  // Handle game end sound and high score
  useEffect(() => {
    if (!isPlaying && timeLeft === 0) {
      if (score > bestScore) {
        setBestScore(score);
        try {
          localStorage.setItem('boss_break_speed_best', score.toString());
        } catch (e) {}
        soundHelper.playCompletionChime(isMuted);
      } else {
        soundHelper.playSuccessTone(isMuted);
      }
    }
  }, [isPlaying, timeLeft, score, bestScore, isMuted]);

  // Periodic target jumper if untouched
  useEffect(() => {
    if (isPlaying && activeCell !== null) {
      targetTimerRef.current = setTimeout(() => {
        setCombo(0); // Combo breaks if too slow
        spawnTarget();
      }, 950);

      return () => clearTimeout(targetTimerRef.current);
    }
  }, [isPlaying, activeCell]);

  const handleCellClick = (index) => {
    if (!isPlaying) return;

    if (index === activeCell) {
      clearTimeout(targetTimerRef.current);
      const newCombo = combo + 1;
      const points = 10 * (1 + Math.floor(newCombo / 5));
      const newScore = score + points;

      setScore(newScore);
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      soundHelper.playTone(440 + Math.min(newCombo * 40, 600), 0.08, isMuted);
      spawnTarget();
    } else {
      setCombo(0);
      soundHelper.playFailTone(isMuted);
    }
  };

  return (
    <Box sx={{ maxWidth: 360, mx: 'auto', textAlign: 'center' }}>
      {/* Top Header & Scores */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1}>
          <Paper
            elevation={0}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: '10px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#fef2f2',
              border: `1px solid ${theme.palette.error.light}`
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'text.secondary' }}>
              Score
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#e11d48', lineHeight: 1.1 }}>
              {score}
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: '10px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#fefce8',
              border: '1px solid #fde047'
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'text.secondary' }}>
              Best
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ca8a04', lineHeight: 1.1 }}>
              {bestScore}
            </Typography>
          </Paper>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {combo > 2 && (
            <Chip
              icon={<IconFlame size={14} color="#f97316" />}
              label={`${combo}x Combo!`}
              size="small"
              sx={{ bgcolor: 'rgba(249, 115, 22, 0.15)', color: '#ea580c', fontWeight: 800 }}
            />
          )}

          {isPlaying && (
            <Chip
              icon={<IconBolt size={14} color="#e11d48" />}
              label={`${timeLeft}s`}
              size="small"
              sx={{ bgcolor: 'rgba(225, 29, 72, 0.12)', color: '#e11d48', fontWeight: 800 }}
            />
          )}
        </Stack>
      </Stack>

      {/* Progress Bar for Time Left */}
      {isPlaying && (
        <LinearProgress
          variant="determinate"
          value={(timeLeft / GAME_DURATION) * 100}
          sx={{
            height: 6,
            borderRadius: 3,
            mb: 2,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              bgcolor: timeLeft < 6 ? '#ef4444' : '#e11d48',
              borderRadius: 3
            }
          }}
        />
      )}

      {/* 3x3 Reflex Board */}
      <Box
        sx={{
          position: 'relative',
          bgcolor: theme.palette.mode === 'dark' ? '#1f2937' : '#f8fafc',
          p: 1.5,
          borderRadius: '16px',
          border: `1px solid ${theme.palette.divider}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1.5,
          aspectRatio: '1 / 1',
          userSelect: 'none'
        }}
      >
        {Array.from({ length: 9 }).map((_, idx) => {
          const isTarget = idx === activeCell;
          return (
            <Box
              key={idx}
              onClick={() => handleCellClick(idx)}
              sx={{
                bgcolor: isTarget
                  ? (theme.palette.mode === 'dark' ? '#374151' : '#fee2e2')
                  : (theme.palette.mode === 'dark' ? '#111827' : '#ffffff'),
                border: `2px solid ${isTarget ? '#e11d48' : theme.palette.divider}`,
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                cursor: isPlaying ? 'pointer' : 'default',
                transition: 'all 0.12s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isTarget ? '0 0 16px rgba(225, 29, 72, 0.45)' : 'none',
                transform: isTarget ? 'scale(1.05)' : 'scale(1)',
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              {isTarget ? activeEmoji : ''}
            </Box>
          );
        })}

        {/* Start / Game Over Overlay */}
        {!isPlaying && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '16px',
              bgcolor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              p: 2
            }}
          >
            <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 900, mb: 0.5 }}>
              {timeLeft === 0 ? '⏰ Time Up!' : '⚡ Reflex Tap'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mb: 2, fontSize: '0.8rem' }}>
              {timeLeft === 0
                ? `Final Score: ${score} | Max Combo: ${maxCombo}x`
                : 'Tap popping targets before they move! 20s test.'}
            </Typography>
            <Button
              variant="contained"
              size="medium"
              onClick={startGame}
              startIcon={timeLeft === 0 ? <IconRotateClockwise size={18} /> : <IconPlayerPlay size={18} />}
              sx={{
                bgcolor: '#e11d48',
                '&:hover': { bgcolor: '#be123c' },
                borderRadius: '12px',
                fontWeight: 800,
                textTransform: 'none',
                px: 3,
                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)'
              }}
            >
              {timeLeft === 0 ? 'Try Again' : 'Start Tap Test'}
            </Button>
          </Box>
        )}
      </Box>

      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1.5, fontSize: '0.75rem' }}>
        Sharpen your reflexes • Fast consecutive taps multiply your score!
      </Typography>
    </Box>
  );
}
