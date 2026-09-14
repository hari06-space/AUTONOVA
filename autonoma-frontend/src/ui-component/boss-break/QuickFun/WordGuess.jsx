import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconRotateClockwise,
  IconBackspace,
  IconBulb,
  IconTrophy
} from '@tabler/icons-react';
import soundHelper from '../soundHelper';

const WORDS_LIST = [
  'FOCUS', 'RELAX', 'SMART', 'BREAK', 'FRESH',
  'SMILE', 'LOGIC', 'HAPPY', 'BUILD', 'PLANT',
  'PEACE', 'GREAT', 'DREAM', 'SHINE', 'LIGHT',
  'WATER', 'POWER', 'SUPER', 'BRAIN', 'CLEAN',
  'LEARN', 'CLOUD', 'THINK', 'SOLVE', 'MUSIC',
  'QUICK', 'SWIFT', 'VIGOR', 'CHEER', 'BLISS',
  'SPEED', 'ALERT', 'GRACE', 'HONOR', 'PRIDE',
  'BLOOM', 'SPARK', 'DRIVE', 'FORCE', 'YOUTH'
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

const getRandomWord = () => WORDS_LIST[Math.floor(Math.random() * WORDS_LIST.length)];

export default function WordGuess({ isMuted }) {
  const theme = useTheme();
  const [targetWord, setTargetWord] = useState(getRandomWord);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState('PLAYING'); // 'PLAYING', 'WON', 'LOST'
  const [hintShown, setHintShown] = useState(false);
  const [streak, setStreak] = useState(() => {
    try {
      return parseInt(localStorage.getItem('boss_break_word_streak') || '0', 10);
    } catch (e) {
      return 0;
    }
  });

  const handleKeyPress = useCallback(
    (key) => {
      if (gameStatus !== 'PLAYING') return;

      const upperKey = key.toUpperCase();

      if (upperKey === 'ENTER') {
        if (currentGuess.length !== WORD_LENGTH) {
          soundHelper.playFailTone(isMuted);
          return;
        }

        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);
        setCurrentGuess('');

        if (currentGuess === targetWord) {
          setGameStatus('WON');
          soundHelper.playCompletionChime(isMuted);
          const newStreak = streak + 1;
          setStreak(newStreak);
          try {
            localStorage.setItem('boss_break_word_streak', newStreak.toString());
          } catch (e) {}
        } else if (newGuesses.length >= MAX_ATTEMPTS) {
          setGameStatus('LOST');
          soundHelper.playFailTone(isMuted);
          setStreak(0);
          try {
            localStorage.setItem('boss_break_word_streak', '0');
          } catch (e) {}
        } else {
          soundHelper.playPopTone(isMuted);
        }
      } else if (upperKey === 'BACKSPACE') {
        setCurrentGuess((prev) => prev.slice(0, -1));
        soundHelper.playTone(350, 0.05, isMuted);
      } else if (/^[A-Z]$/.test(upperKey) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => prev + upperKey);
        soundHelper.playTone(450, 0.05, isMuted);
      }
    },
    [currentGuess, gameStatus, guesses, targetWord, streak, isMuted]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACKSPACE');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);

  const handleRestart = () => {
    setTargetWord(getRandomWord());
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('PLAYING');
    setHintShown(false);
    soundHelper.playTone(523, 0.1, isMuted);
  };

  const getKeyStatus = (key) => {
    let status = 'DEFAULT';
    guesses.forEach((guess) => {
      guess.split('').forEach((letter, idx) => {
        if (letter === key) {
          if (targetWord[idx] === key) {
            status = 'CORRECT';
          } else if (targetWord.includes(key) && status !== 'CORRECT') {
            status = 'PRESENT';
          } else if (status === 'DEFAULT') {
            status = 'ABSENT';
          }
        }
      });
    });
    return status;
  };

  const getLetterStyle = (letter, idx, isSubmitted) => {
    if (!isSubmitted) {
      return {
        bgcolor: letter ? (theme.palette.mode === 'dark' ? '#1f2937' : '#ffffff') : 'transparent',
        borderColor: letter ? theme.palette.primary.main : theme.palette.divider,
        color: 'text.primary',
        transform: letter ? 'scale(1.05)' : 'scale(1)'
      };
    }

    if (targetWord[idx] === letter) {
      return {
        bgcolor: '#10b981',
        borderColor: '#10b981',
        color: '#ffffff',
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
      };
    }
    if (targetWord.includes(letter)) {
      return {
        bgcolor: '#f59e0b',
        borderColor: '#f59e0b',
        color: '#ffffff',
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
      };
    }
    return {
      bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#cbd5e1',
      borderColor: theme.palette.mode === 'dark' ? '#4b5563' : '#94a3b8',
      color: theme.palette.mode === 'dark' ? '#9ca3af' : '#475569'
    };
  };

  return (
    <Box sx={{ maxWidth: 360, mx: 'auto', textAlign: 'center' }}>
      {/* Top Header Controls */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Chip
          icon={<IconTrophy size={15} color="#eab308" />}
          label={`Streak: ${streak}`}
          size="small"
          sx={{ fontWeight: 700, bgcolor: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04' }}
        />

        <Stack direction="row" spacing={0.5}>
          <Tooltip title={hintShown ? `First letter is "${targetWord[0]}"` : 'Show Hint'} arrow>
            <IconButton
              size="small"
              onClick={() => setHintShown(true)}
              disabled={hintShown || gameStatus !== 'PLAYING'}
              sx={{ bgcolor: 'action.hover', borderRadius: '8px', color: hintShown ? '#eab308' : 'text.secondary' }}
            >
              <IconBulb size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="New Word" arrow>
            <IconButton size="small" onClick={handleRestart} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
              <IconRotateClockwise size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* 6 Rows Grid */}
      <Stack spacing={0.8} sx={{ mb: 2 }}>
        {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIdx) => {
          const isCurrentRow = rowIdx === guesses.length;
          const isSubmitted = rowIdx < guesses.length;
          const rowGuess = isSubmitted ? guesses[rowIdx] : isCurrentRow ? currentGuess : '';

          return (
            <Stack key={rowIdx} direction="row" spacing={0.8} justifyContent="center">
              {Array.from({ length: WORD_LENGTH }).map((_, colIdx) => {
                const letter = rowGuess[colIdx] || '';
                const style = getLetterStyle(letter, colIdx, isSubmitted);

                return (
                  <Box
                    key={colIdx}
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: '8px',
                      border: '2px solid',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      textTransform: 'uppercase',
                      transition: 'all 0.15s ease',
                      userSelect: 'none',
                      ...style
                    }}
                  >
                    {letter}
                  </Box>
                );
              })}
            </Stack>
          );
        })}
      </Stack>

      {/* Game Result Banner */}
      {gameStatus !== 'PLAYING' && (
        <Box
          sx={{
            mb: 1.5,
            p: 1,
            borderRadius: '10px',
            bgcolor: gameStatus === 'WON' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${gameStatus === 'WON' ? '#10b981' : '#ef4444'}`
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: gameStatus === 'WON' ? '#059669' : '#dc2626' }}>
            {gameStatus === 'WON' ? '🎉 Brilliant! You guessed it!' : `Word was: ${targetWord}`}
          </Typography>
          <Button
            size="small"
            variant="contained"
            onClick={handleRestart}
            sx={{ mt: 0.5, borderRadius: '8px', textTransform: 'none', fontWeight: 700, py: 0.2 }}
          >
            Next Word
          </Button>
        </Box>
      )}

      {/* Virtual On-Screen Keyboard */}
      <Box sx={{ userSelect: 'none' }}>
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <Stack key={rIdx} direction="row" spacing={0.4} justifyContent="center" sx={{ mb: 0.5 }}>
            {row.map((key) => {
              const status = getKeyStatus(key);
              const isSpecial = key === 'ENTER' || key === 'BACKSPACE';

              let keyBg = theme.palette.mode === 'dark' ? '#1f2937' : '#e2e8f0';
              let keyColor = 'text.primary';

              if (status === 'CORRECT') {
                keyBg = '#10b981';
                keyColor = '#ffffff';
              } else if (status === 'PRESENT') {
                keyBg = '#f59e0b';
                keyColor = '#ffffff';
              } else if (status === 'ABSENT') {
                keyBg = theme.palette.mode === 'dark' ? '#374151' : '#94a3b8';
                keyColor = theme.palette.mode === 'dark' ? '#6b7280' : '#ffffff';
              }

              return (
                <Button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  sx={{
                    minWidth: isSpecial ? 48 : 28,
                    height: 38,
                    p: 0,
                    fontSize: isSpecial ? '0.65rem' : '0.85rem',
                    fontWeight: 700,
                    bgcolor: keyBg,
                    color: keyColor,
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    '&:hover': {
                      bgcolor: keyBg,
                      filter: 'brightness(0.92)'
                    }
                  }}
                >
                  {key === 'BACKSPACE' ? <IconBackspace size={16} /> : key}
                </Button>
              );
            })}
          </Stack>
        ))}
      </Box>
    </Box>
  );
}
