import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconRotateClockwise, IconTrophy, IconRobot, IconUser } from '@tabler/icons-react';
import soundHelper from '../soundHelper';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6]             // diagonals
];

export default function TicTacToe({ isMuted }) {
  const theme = useTheme();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState('pve'); // 'pve' = vs Computer, 'pvp' = 2 Players
  const [score, setScore] = useState({ x: 0, o: 0, ties: 0 });

  const checkWinner = (squares) => {
    for (let i = 0; i < WINNING_COMBOS.length; i++) {
      const [a, b, c] = WINNING_COMBOS[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    if (squares.every((square) => square !== null)) {
      return { winner: 'Tie', line: [] };
    }
    return null;
  };

  const result = checkWinner(board);

  // Simple smart AI move
  const getBestMove = (currentBoard) => {
    // 1. Check if AI ('O') can win in the next move
    for (let i = 0; i < currentBoard.length; i++) {
      if (!currentBoard[i]) {
        const copy = [...currentBoard];
        copy[i] = 'O';
        const res = checkWinner(copy);
        if (res && res.winner === 'O') return i;
      }
    }
    // 2. Check if Player ('X') can win and block them
    for (let i = 0; i < currentBoard.length; i++) {
      if (!currentBoard[i]) {
        const copy = [...currentBoard];
        copy[i] = 'X';
        const res = checkWinner(copy);
        if (res && res.winner === 'X') return i;
      }
    }
    // 3. Take center if available
    if (!currentBoard[4]) return 4;
    // 4. Take corners if available
    const corners = [0, 2, 6, 8].filter((idx) => !currentBoard[idx]);
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }
    // 5. Take any remaining square
    const available = currentBoard.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null);
    return available[Math.floor(Math.random() * available.length)];
  };

  // Trigger computer move in PvE mode
  useEffect(() => {
    if (gameMode === 'pve' && !isXNext && !result) {
      const timer = setTimeout(() => {
        const move = getBestMove(board);
        if (move !== undefined && move !== null) {
          handleSquareClick(move, 'O');
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameMode, result, board]);

  const handleSquareClick = (index, forcePlayer = null) => {
    if (board[index] || result) return;

    const currentPlayer = forcePlayer || (isXNext ? 'X' : 'O');
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    soundHelper.playTone(currentPlayer === 'X' ? 440 : 554, 0.1, isMuted);

    const matchResult = checkWinner(newBoard);
    if (matchResult) {
      if (matchResult.winner === 'X') {
        setScore((prev) => ({ ...prev, x: prev.x + 1 }));
        soundHelper.playCompletionChime(isMuted);
      } else if (matchResult.winner === 'O') {
        setScore((prev) => ({ ...prev, o: prev.o + 1 }));
      } else if (matchResult.winner === 'Tie') {
        setScore((prev) => ({ ...prev, ties: prev.ties + 1 }));
      }
    } else {
      setIsXNext(!isXNext);
    }
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
  };

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setGameMode(newMode);
      setBoard(Array(9).fill(null));
      setIsXNext(true);
      setScore({ x: 0, o: 0, ties: 0 });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {/* Mode Selector & Status */}
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: '100%', maxWidth: 360 }}>
        <ToggleButtonGroup
          value={gameMode}
          exclusive
          onChange={handleModeChange}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              px: 1.5,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px'
            }
          }}
        >
          <ToggleButton value="pve">
            <IconRobot size={16} style={{ marginRight: 4 }} /> vs AI
          </ToggleButton>
          <ToggleButton value="pvp">
            <IconUser size={16} style={{ marginRight: 4 }} /> 2 Players
          </ToggleButton>
        </ToggleButtonGroup>

        <Button
          variant="outlined"
          size="small"
          startIcon={<IconRotateClockwise size={16} />}
          onClick={handleReset}
          sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.75rem' }}
        >
          Restart
        </Button>
      </Stack>

      {/* Score Board */}
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%',
          maxWidth: 360,
          p: 1.2,
          borderRadius: '12px',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {gameMode === 'pve' ? 'You (X)' : 'Player 1 (X)'}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
            {score.x}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Ties
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.secondary' }}>
            {score.ties}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {gameMode === 'pve' ? 'Computer (O)' : 'Player 2 (O)'}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.secondary.main }}>
            {score.o}
          </Typography>
        </Box>
      </Paper>

      {/* Status banner */}
      <Box sx={{ height: 28, display: 'flex', alignItems: 'center' }}>
        {result ? (
          <Chip
            icon={<IconTrophy size={16} />}
            label={
              result.winner === 'Tie'
                ? "It's a Draw! Well played."
                : result.winner === 'X'
                ? `${gameMode === 'pve' ? 'You won!' : 'Player 1 (X) won!'} 🎉`
                : `${gameMode === 'pve' ? 'Computer won!' : 'Player 2 (O) won!'} 🚀`
            }
            color={result.winner === 'X' ? 'primary' : result.winner === 'O' ? 'secondary' : 'default'}
            sx={{ fontWeight: 700, fontSize: '0.85rem' }}
          />
        ) : (
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Current Turn: {' '}
            <Box
              component="span"
              sx={{
                fontWeight: 800,
                color: isXNext ? theme.palette.primary.main : theme.palette.secondary.main
              }}
            >
              {isXNext ? (gameMode === 'pve' ? 'Your Turn (X)' : 'Player 1 (X)') : (gameMode === 'pve' ? 'Computer Thinking...' : 'Player 2 (O)')}
            </Box>
          </Typography>
        )}
      </Box>

      {/* 3x3 Grid Board */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1.5,
          width: '100%',
          maxWidth: 320,
          aspectRatio: '1/1',
          p: 1.5,
          borderRadius: '16px',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f1f5f9',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        {board.map((cell, index) => {
          const isWinningCell = result && result.line && result.line.includes(index);
          return (
            <Button
              key={index}
              variant="outlined"
              onClick={() => handleSquareClick(index)}
              disabled={Boolean(cell) || Boolean(result) || (gameMode === 'pve' && !isXNext)}
              sx={{
                borderRadius: '12px',
                fontSize: '2rem',
                fontWeight: 900,
                p: 0,
                color: cell === 'X' ? theme.palette.primary.main : theme.palette.secondary.main,
                bgcolor: isWinningCell
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(33, 150, 243, 0.25)'
                    : '#e3f2fd'
                  : theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.05)'
                  : '#ffffff',
                borderColor: isWinningCell ? theme.palette.primary.main : theme.palette.divider,
                borderWidth: isWinningCell ? 2 : 1,
                boxShadow: isWinningCell ? `0 0 14px ${theme.palette.primary.main}50` : 'none',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#f8fafc',
                  transform: cell || result ? 'none' : 'scale(1.04)'
                },
                '&.Mui-disabled': {
                  color: cell === 'X' ? theme.palette.primary.main : cell === 'O' ? theme.palette.secondary.main : 'inherit',
                  borderColor: isWinningCell ? theme.palette.primary.main : theme.palette.divider
                }
              }}
            >
              {cell}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}
