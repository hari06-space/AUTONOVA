import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  Chip,
  Paper,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconRotateClockwise, IconTrophy, IconArrowUp, IconArrowDown, IconCheck } from '@tabler/icons-react';
import soundHelper from '../soundHelper';

const generateSecretNumber = () => Math.floor(Math.random() * 100) + 1;

export default function GuessNumber({ isMuted }) {
  const theme = useTheme();
  const [targetNumber, setTargetNumber] = useState(generateSecretNumber);
  const [guessInput, setGuessInput] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isWon, setIsWon] = useState(false);

  const handleGuess = (e) => {
    if (e) e.preventDefault();
    const num = parseInt(guessInput, 10);

    if (isNaN(num) || num < 1 || num > 100) {
      setFeedback({ type: 'error', text: 'Please enter a valid number between 1 and 100.' });
      return;
    }

    const diff = Math.abs(num - targetNumber);
    let proximity = '';
    if (diff === 0) proximity = '🎯 Exact match!';
    else if (diff <= 3) proximity = '🔥 Burning Hot! Super close!';
    else if (diff <= 10) proximity = '♨️ Warm! Getting closer.';
    else if (diff <= 25) proximity = '⛅ Lukewarm.';
    else proximity = '❄️ Cold. Far off.';

    const newAttempt = {
      guess: num,
      direction: num < targetNumber ? 'higher' : num > targetNumber ? 'lower' : 'correct',
      proximity
    };

    setAttempts((prev) => [newAttempt, ...prev]);
    setGuessInput('');

    if (num === targetNumber) {
      setIsWon(true);
      setFeedback({ type: 'success', text: `🎉 Correct! The number was ${targetNumber}! You found it in ${attempts.length + 1} attempts!` });
      soundHelper.playCompletionChime(isMuted);
    } else {
      const hint = num < targetNumber ? 'Go Higher ⬆️' : 'Go Lower ⬇️';
      setFeedback({
        type: 'info',
        text: `${hint} (${proximity})`
      });
      soundHelper.playTone(num < targetNumber ? 380 : 480, 0.1, isMuted);
    }
  };

  const handleRestart = () => {
    setTargetNumber(generateSecretNumber());
    setGuessInput('');
    setAttempts([]);
    setFeedback(null);
    setIsWon(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {/* Header & Restart */}
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: '100%', maxWidth: 360 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Attempts: <Box component="span" sx={{ fontWeight: 800, color: 'text.primary' }}>{attempts.length}</Box>
        </Typography>

        <Button
          variant="outlined"
          size="small"
          startIcon={<IconRotateClockwise size={16} />}
          onClick={handleRestart}
          sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.75rem' }}
        >
          New Number
        </Button>
      </Stack>

      {/* Target prompt */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 360,
          p: 1.5,
          textAlign: 'center',
          borderRadius: '12px',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
          I'm thinking of a number between <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 800 }}>1 and 100</Box>.
        </Typography>
      </Paper>

      {/* Guess Input Form */}
      {!isWon ? (
        <Box
          component="form"
          onSubmit={handleGuess}
          sx={{ display: 'flex', gap: 1, width: '100%', maxWidth: 360 }}
        >
          <TextField
            size="small"
            type="number"
            placeholder="Enter 1 - 100"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            disabled={isWon}
            autoFocus
            slotProps={{
              input: {
                min: 1,
                max: 100,
                sx: { borderRadius: '10px' }
              }
            }}
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            disabled={isWon || !guessInput}
            sx={{
              borderRadius: '10px',
              px: 3,
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: theme.palette.primary.main
            }}
          >
            Guess
          </Button>
        </Box>
      ) : (
        <Button
          variant="contained"
          color="success"
          startIcon={<IconTrophy size={18} />}
          onClick={handleRestart}
          sx={{ borderRadius: '10px', py: 1, px: 3, fontWeight: 700, textTransform: 'none' }}
        >
          Play Again!
        </Button>
      )}

      {/* Feedback banner */}
      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{
            width: '100%',
            maxWidth: 360,
            borderRadius: '10px',
            '& .MuiAlert-message': { fontWeight: 600, fontSize: '0.85rem' }
          }}
        >
          {feedback.text}
        </Alert>
      )}

      {/* Attempts History */}
      {attempts.length > 0 && (
        <Box sx={{ width: '100%', maxWidth: 360, mt: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>
            Previous Guesses:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, maxHeight: 90, overflowY: 'auto' }}>
            {attempts.map((att, idx) => (
              <Chip
                key={idx}
                size="small"
                variant="outlined"
                icon={
                  att.direction === 'higher' ? (
                    <IconArrowUp size={14} color={theme.palette.primary.main} />
                  ) : att.direction === 'lower' ? (
                    <IconArrowDown size={14} color={theme.palette.secondary.main} />
                  ) : (
                    <IconCheck size={14} color={theme.palette.success.main} />
                  )
                }
                label={`${att.guess} (${att.direction === 'higher' ? 'Higher' : att.direction === 'lower' ? 'Lower' : 'Correct'})`}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  borderColor: att.direction === 'correct' ? theme.palette.success.main : theme.palette.divider
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
