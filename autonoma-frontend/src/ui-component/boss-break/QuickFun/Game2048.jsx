import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconRotateClockwise,
  IconTrophy,
  IconArrowUp,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowBackUp
} from '@tabler/icons-react';
import soundHelper from '../soundHelper';

const SIZE = 4;

const TILE_COLORS = {
  2: { bg: '#eee4da', text: '#776e65' },
  4: { bg: '#ede0c8', text: '#776e65' },
  8: { bg: '#f2b179', text: '#f9f6f2' },
  16: { bg: '#f59563', text: '#f9f6f2' },
  32: { bg: '#f67c5f', text: '#f9f6f2' },
  64: { bg: '#f65e3b', text: '#f9f6f2' },
  128: { bg: '#edcf72', text: '#f9f6f2', shadow: '0 0 10px #edcf72' },
  256: { bg: '#edcc61', text: '#f9f6f2', shadow: '0 0 12px #edcc61' },
  512: { bg: '#edc850', text: '#f9f6f2', shadow: '0 0 15px #edc850' },
  1024: { bg: '#edc53f', text: '#f9f6f2', shadow: '0 0 18px #edc53f' },
  2048: { bg: '#edc22e', text: '#f9f6f2', shadow: '0 0 22px #edc22e' }
};

const getEmptyBoard = () => Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));

const addRandomTile = (board) => {
  const emptyCells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) emptyCells.push({ r, c });
    }
  }
  if (emptyCells.length === 0) return board;

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newBoard = board.map((row) => [...row]);
  newBoard[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
};

const initBoard = () => {
  let b = getEmptyBoard();
  b = addRandomTile(b);
  b = addRandomTile(b);
  return b;
};

export default function Game2048({ isMuted }) {
  const theme = useTheme();
  const [board, setBoard] = useState(initBoard);
  const [prevBoard, setPrevBoard] = useState(null);
  const [prevScore, setPrevScore] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('boss_break_2048_best') || '0', 10);
    } catch (e) {
      return 0;
    }
  });
  const [won, setWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const checkGameOver = (currentBoard) => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (currentBoard[r][c] === 0) return false;
        if (c + 1 < SIZE && currentBoard[r][c] === currentBoard[r][c + 1]) return false;
        if (r + 1 < SIZE && currentBoard[r][c] === currentBoard[r + 1][c]) return false;
      }
    }
    return true;
  };

  const move = useCallback(
    (direction) => {
      if (gameOver) return;

      let hasChanged = false;
      let gainedScore = 0;
      const newBoard = board.map((row) => [...row]);

      const slideAndMerge = (row) => {
        let arr = row.filter((val) => val !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
          if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            gainedScore += arr[i];
            if (arr[i] === 2048 && !won) {
              setWon(true);
              soundHelper.playCompletionChime(isMuted);
            }
            arr.splice(i + 1, 1);
          }
        }
        while (arr.length < SIZE) {
          arr.push(0);
        }
        return arr;
      };

      if (direction === 'LEFT') {
        for (let r = 0; r < SIZE; r++) {
          const original = [...newBoard[r]];
          newBoard[r] = slideAndMerge(newBoard[r]);
          if (original.some((val, idx) => val !== newBoard[r][idx])) hasChanged = true;
        }
      } else if (direction === 'RIGHT') {
        for (let r = 0; r < SIZE; r++) {
          const original = [...newBoard[r]];
          const reversed = [...newBoard[r]].reverse();
          const merged = slideAndMerge(reversed).reverse();
          newBoard[r] = merged;
          if (original.some((val, idx) => val !== newBoard[r][idx])) hasChanged = true;
        }
      } else if (direction === 'UP') {
        for (let c = 0; c < SIZE; c++) {
          const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
          const merged = slideAndMerge(col);
          for (let r = 0; r < SIZE; r++) {
            if (newBoard[r][c] !== merged[r]) hasChanged = true;
            newBoard[r][c] = merged[r];
          }
        }
      } else if (direction === 'DOWN') {
        for (let c = 0; c < SIZE; c++) {
          const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
          const merged = slideAndMerge(col).reverse();
          for (let r = 0; r < SIZE; r++) {
            if (newBoard[r][c] !== merged[r]) hasChanged = true;
            newBoard[r][c] = merged[r];
          }
        }
      }

      if (hasChanged) {
        setPrevBoard(board);
        setPrevScore(score);

        const updatedBoard = addRandomTile(newBoard);
        setBoard(updatedBoard);
        const newScore = score + gainedScore;
        setScore(newScore);

        if (newScore > bestScore) {
          setBestScore(newScore);
          try {
            localStorage.setItem('boss_break_2048_best', newScore.toString());
          } catch (e) {}
        }

        soundHelper.playPopTone(isMuted);

        if (checkGameOver(updatedBoard)) {
          setGameOver(true);
          soundHelper.playFailTone(isMuted);
        }
      }
    },
    [board, score, bestScore, gameOver, won, isMuted]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        move('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        move('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        move('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        move('RIGHT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const handleRestart = () => {
    setBoard(initBoard());
    setPrevBoard(null);
    setScore(0);
    setWon(false);
    setGameOver(false);
    soundHelper.playTone(523, 0.1, isMuted);
  };

  const handleUndo = () => {
    if (prevBoard) {
      setBoard(prevBoard);
      setScore(prevScore);
      setPrevBoard(null);
      setGameOver(false);
      soundHelper.playTone(400, 0.1, isMuted);
    }
  };

  return (
    <Box sx={{ maxWidth: 360, mx: 'auto', textAlign: 'center' }}>
      {/* Top Scores & Action Bar */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1}>
          <Paper
            elevation={0}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: '10px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#bbada0',
              color: '#ffffff'
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.85 }}>
              Score
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              {score}
            </Typography>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: '10px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#bbada0',
              color: '#ffffff'
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.85 }}>
              Best
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              {bestScore}
            </Typography>
          </Paper>
        </Stack>

        <Stack direction="row" spacing={0.5}>
          {prevBoard && (
            <Tooltip title="Undo Move" arrow>
              <IconButton size="small" onClick={handleUndo} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
                <IconArrowBackUp size={18} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Restart Game" arrow>
            <IconButton size="small" onClick={handleRestart} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
              <IconRotateClockwise size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* 2048 Grid Board */}
      <Box
        sx={{
          position: 'relative',
          bgcolor: theme.palette.mode === 'dark' ? '#1f2937' : '#bbada0',
          p: 1,
          borderRadius: '14px',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          aspectRatio: '1 / 1',
          userSelect: 'none',
          touchAction: 'none'
        }}
      >
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const tileStyle = TILE_COLORS[cell] || (cell > 2048 ? { bg: '#3c3a32', text: '#f9f6f2' } : { bg: theme.palette.mode === 'dark' ? '#374151' : '#cdc1b4', text: 'transparent' });
            return (
              <Box
                key={`${rIdx}-${cIdx}`}
                sx={{
                  bgcolor: tileStyle.bg,
                  color: tileStyle.text,
                  boxShadow: tileStyle.shadow || 'none',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: cell >= 1024 ? '1.1rem' : cell >= 128 ? '1.25rem' : '1.5rem',
                  transition: 'all 0.1s ease',
                  transform: cell !== 0 ? 'scale(1)' : 'scale(0.95)'
                }}
              >
                {cell !== 0 ? cell : ''}
              </Box>
            );
          })
        )}

        {/* Overlay when Game Over or Won */}
        {(gameOver || won) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '14px',
              bgcolor: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              p: 2
            }}
          >
            <Typography variant="h3" sx={{ color: won ? '#fbbf24' : '#f87171', fontWeight: 900, mb: 1 }}>
              {won ? '🎉 2048 Winner!' : 'Game Over!'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', mb: 2 }}>
              {won ? `Amazing focus! Final Score: ${score}` : `Nice try! Score: ${score}`}
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleRestart}
              startIcon={<IconRotateClockwise size={16} />}
              sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none', px: 2.5 }}
            >
              Play Again
            </Button>
          </Box>
        )}
      </Box>

      {/* On-screen Directional Controls for Mobile / Click */}
      <Box sx={{ mt: 1.5 }}>
        <Stack spacing={0.5} alignItems="center">
          <IconButton size="small" onClick={() => move('UP')} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
            <IconArrowUp size={18} />
          </IconButton>
          <Stack direction="row" spacing={3}>
            <IconButton size="small" onClick={() => move('LEFT')} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
              <IconArrowLeft size={18} />
            </IconButton>
            <IconButton size="small" onClick={() => move('DOWN')} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
              <IconArrowDown size={18} />
            </IconButton>
            <IconButton size="small" onClick={() => move('RIGHT')} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
              <IconArrowRight size={18} />
            </IconButton>
          </Stack>
        </Stack>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
          Use Arrow keys, WASD, or tap arrow buttons
        </Typography>
      </Box>
    </Box>
  );
}
