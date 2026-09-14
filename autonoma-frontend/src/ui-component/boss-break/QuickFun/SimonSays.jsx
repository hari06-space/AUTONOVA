import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconRotateClockwise,
  IconTrophy,
  IconBrain,
  IconPlayerPlay
} from '@tabler/icons-react';
import soundHelper from '../soundHelper';

const PADS = [
  { id: 0, color: '#10b981', lightColor: '#6ee7b7', freq: 440, name: 'Green' },
  { id: 1, color: '#ef4444', lightColor: '#fca5a5', freq: 554, name: 'Red' },
  { id: 2, color: '#f59e0b', lightColor: '#fde68a', freq: 659, name: 'Yellow' },
  { id: 3, color: '#3b82f6', lightColor: '#93c5fd', freq: 880, name: 'Blue' }
];

export default function SimonSays({ isMuted }) {
  const theme = useTheme();
  const [sequence, setSequence] = useState([]);
  const [userStep, setUserStep] = useState(0);
  const [activePad, setActivePad] = useState(null);
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [gameStatus, setGameStatus] = useState('IDLE'); // 'IDLE', 'PLAYING', 'GAMEOVER'
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('boss_break_simon_best') || '0', 10);
    } catch (e) {
      return 0;
    }
  });

  const flashPad = (padId, duration = 300) => {
    const pad = PADS[padId];
    setActivePad(padId);
    soundHelper.playTone(pad.freq, duration / 1000, isMuted);
    setTimeout(() => {
      setActivePad(null);
    }, duration);
  };

  const playSequence = (seq) => {
    setIsPlayingSeq(true);
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < seq.length) {
        flashPad(seq[idx], 320);
        idx++;
      } else {
        clearInterval(interval);
        setIsPlayingSeq(false);
        setUserStep(0);
      }
    }, 550);
  };

  const startNextRound = (currentSeq) => {
    const nextPad = Math.floor(Math.random() * 4);
    const newSeq = [...currentSeq, nextPad];
    setSequence(newSeq);
    setTimeout(() => {
      playSequence(newSeq);
    }, 600);
  };

  const handleStartGame = () => {
    setGameStatus('PLAYING');
    setScore(0);
    setUserStep(0);
    soundHelper.playTone(523, 0.1, isMuted);
    startNextRound([]);
  };

  const handlePadClick = (padId) => {
    if (isPlayingSeq || gameStatus !== 'PLAYING') return;

    flashPad(padId, 200);

    if (padId === sequence[userStep]) {
      if (userStep + 1 === sequence.length) {
        // Completed this round!
        const nextScore = sequence.length;
        setScore(nextScore);
        if (nextScore > bestScore) {
          setBestScore(nextScore);
          try {
            localStorage.setItem('boss_break_simon_best', nextScore.toString());
          } catch (e) {}
        }
        soundHelper.playSuccessTone(isMuted);
        startNextRound(sequence);
      } else {
        setUserStep((prev) => prev + 1);
      }
    } else {
      // Game Over
      setGameStatus('GAMEOVER');
      soundHelper.playFailTone(isMuted);
    }
  };

  return (
    <Box sx={{ maxWidth: 360, mx: 'auto', textAlign: 'center' }}>
      {/* Top Scores & Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1}>
          <Paper
            elevation={0}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: '10px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#ede9fe',
              border: '1px solid #ddd6fe'
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'text.secondary' }}>
              Level
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#7c3aed', lineHeight: 1.1 }}>
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

        <Tooltip title="Restart" arrow>
          <IconButton size="small" onClick={handleStartGame} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
            <IconRotateClockwise size={18} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* 4 Colored Circular Pads */}
      <Box
        sx={{
          position: 'relative',
          bgcolor: theme.palette.mode === 'dark' ? '#1e1b4b' : '#312e81',
          p: 2,
          borderRadius: '50%',
          boxShadow: '0 12px 30px rgba(49, 46, 129, 0.4)',
          width: 260,
          height: 260,
          mx: 'auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1.5,
          userSelect: 'none'
        }}
      >
        {PADS.map((pad) => {
          const isFlashed = activePad === pad.id;
          return (
            <Box
              key={pad.id}
              onClick={() => handlePadClick(pad.id)}
              sx={{
                bgcolor: isFlashed ? pad.lightColor : pad.color,
                borderRadius:
                  pad.id === 0 ? '100% 12px 12px 12px'
                  : pad.id === 1 ? '12px 100% 12px 12px'
                  : pad.id === 2 ? '12px 12px 12px 100%'
                  : '12px 12px 100% 12px',
                cursor: gameStatus === 'PLAYING' && !isPlayingSeq ? 'pointer' : 'default',
                boxShadow: isFlashed ? `0 0 20px ${pad.color}` : 'none',
                filter: isFlashed ? 'brightness(1.3)' : 'brightness(0.95)',
                transition: 'all 0.1s ease',
                transform: isFlashed ? 'scale(1.04)' : 'scale(1)',
                '&:active': {
                  transform: 'scale(0.96)'
                }
              }}
            />
          );
        })}

        {/* Center Circular Status Controller */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 84,
            height: 84,
            borderRadius: '50%',
            bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#1e1b4b',
            border: '4px solid #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            zIndex: 5
          }}
        >
          {gameStatus === 'IDLE' ? (
            <Button
              size="small"
              onClick={handleStartGame}
              sx={{
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '0.75rem',
                textTransform: 'none',
                minWidth: 'auto',
                p: 1
              }}
            >
              START
            </Button>
          ) : gameStatus === 'GAMEOVER' ? (
            <Button
              size="small"
              onClick={handleStartGame}
              sx={{
                color: '#f87171',
                fontWeight: 900,
                fontSize: '0.7rem',
                textTransform: 'none',
                minWidth: 'auto',
                p: 0.5
              }}
            >
              RETRY
            </Button>
          ) : (
            <Typography variant="caption" sx={{ color: isPlayingSeq ? '#fbbf24' : '#34d399', fontWeight: 800, fontSize: '0.75rem' }}>
              {isPlayingSeq ? 'LISTEN' : 'YOUR TURN'}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Footer Instructions */}
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 2, fontSize: '0.75rem' }}>
        {gameStatus === 'PLAYING'
          ? isPlayingSeq
            ? '🎧 Watch & listen to the color pattern...'
            : `👉 Repeat ${sequence.length} note sequence!`
          : 'Train working memory & auditory focus with musical color sequences!'}
      </Typography>
    </Box>
  );
}
