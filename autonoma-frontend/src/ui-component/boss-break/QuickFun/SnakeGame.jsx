import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  IconArrowUp,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconPlayerPlay,
  IconPlayerPause
} from '@tabler/icons-react';
import soundHelper from '../soundHelper';

const GRID_SIZE = 15;
const INITIAL_SNAKE = [
  { x: 7, y: 7 },
  { x: 7, y: 8 },
  { x: 7, y: 9 }
];
const INITIAL_DIRECTION = { x: 0, y: -1 }; // UP

const getRandomFood = (snake) => {
  let newFood;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    if (!snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)) {
      break;
    }
  }
  return newFood;
};

export default function SnakeGame({ isMuted }) {
  const theme = useTheme();
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState(() => getRandomFood(INITIAL_SNAKE));
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('boss_break_snake_best') || '0', 10);
    } catch (e) {
      return 0;
    }
  });

  const nextDirectionRef = useRef(INITIAL_DIRECTION);
  const gameLoopRef = useRef(null);

  const handleRestart = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    nextDirectionRef.current = INITIAL_DIRECTION;
    setFood(getRandomFood(INITIAL_SNAKE));
    setIsGameOver(false);
    setIsPaused(false);
    setScore(0);
    soundHelper.playTone(523, 0.1, isMuted);
  };

  const changeDirection = useCallback(
    (newDir) => {
      // Prevent reversing into self
      if (
        (newDir.x !== 0 && newDir.x === -direction.x) ||
        (newDir.y !== 0 && newDir.y === -direction.y)
      ) {
        return;
      }
      nextDirectionRef.current = newDir;
      soundHelper.playTone(600, 0.03, isMuted);
    },
    [direction, isMuted]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        changeDirection({ x: 0, y: -1 });
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        changeDirection({ x: 0, y: 1 });
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        changeDirection({ x: -1, y: 0 });
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        changeDirection({ x: 1, y: 0 });
      } else if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection]);

  // Main game tick loop
  useEffect(() => {
    if (isGameOver || isPaused) return;

    const speed = Math.max(110 - Math.floor(score / 5) * 5, 65);

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        const curDir = nextDirectionRef.current;
        setDirection(curDir);

        const head = { ...prevSnake[0] };
        head.x += curDir.x;
        head.y += curDir.y;

        // Check Wall Collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setIsGameOver(true);
          soundHelper.playFailTone(isMuted);
          return prevSnake;
        }

        // Check Self Collision
        if (prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          setIsGameOver(true);
          soundHelper.playFailTone(isMuted);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check Food Eaten
        if (head.x === food.x && head.y === food.y) {
          const newScore = score + 10;
          setScore(newScore);
          if (newScore > bestScore) {
            setBestScore(newScore);
            try {
              localStorage.setItem('boss_break_snake_best', newScore.toString());
            } catch (e) {}
          }
          soundHelper.playPopTone(isMuted);
          setFood(getRandomFood(newSnake));
        } else {
          newSnake.pop(); // Remove tail
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(gameLoopRef.current);
  }, [isGameOver, isPaused, food, score, bestScore, isMuted]);

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
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#ecfdf5',
              border: '1px solid #a7f3d0'
            }}
          >
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: 'text.secondary' }}>
              Score
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
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

        <Stack direction="row" spacing={0.5}>
          <Tooltip title={isPaused ? 'Resume' : 'Pause'} arrow>
            <IconButton size="small" onClick={() => setIsPaused(!isPaused)} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
              {isPaused ? <IconPlayerPlay size={18} /> : <IconPlayerPause size={18} />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Restart" arrow>
            <IconButton size="small" onClick={handleRestart} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
              <IconRotateClockwise size={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Snake Grid Board */}
      <Box
        sx={{
          position: 'relative',
          bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#1e293b',
          p: 0.8,
          borderRadius: '16px',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gap: '2px',
          aspectRatio: '1 / 1',
          userSelect: 'none'
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
          const x = idx % GRID_SIZE;
          const y = Math.floor(idx / GRID_SIZE);

          const isHead = snake[0]?.x === x && snake[0]?.y === y;
          const isBody = snake.slice(1).some((seg) => seg.x === x && seg.y === y);
          const isFood = food.x === x && food.y === y;

          let cellBg = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)';
          let borderRadius = '3px';
          let boxShadow = 'none';

          if (isHead) {
            cellBg = '#10b981';
            borderRadius = '6px';
            boxShadow = '0 0 8px #10b981';
          } else if (isBody) {
            cellBg = '#34d399';
            borderRadius = '4px';
          } else if (isFood) {
            cellBg = '#ef4444';
            borderRadius = '50%';
            boxShadow = '0 0 10px #ef4444';
          }

          return (
            <Box
              key={idx}
              sx={{
                bgcolor: cellBg,
                borderRadius,
                boxShadow,
                transition: 'background-color 0.05s ease'
              }}
            />
          );
        })}

        {/* Game Over / Pause Overlay */}
        {(isGameOver || isPaused) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '16px',
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
            <Typography variant="h3" sx={{ color: isGameOver ? '#f87171' : '#38bdf8', fontWeight: 900, mb: 1 }}>
              {isGameOver ? '💀 Game Over!' : '⏸ Paused'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ffffff', mb: 2 }}>
              {isGameOver ? `Final Score: ${score}` : 'Press play to continue'}
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={isGameOver ? handleRestart : () => setIsPaused(false)}
              startIcon={isGameOver ? <IconRotateClockwise size={16} /> : <IconPlayerPlay size={16} />}
              sx={{
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
                borderRadius: '10px',
                fontWeight: 700,
                textTransform: 'none',
                px: 2.5
              }}
            >
              {isGameOver ? 'Play Again' : 'Resume'}
            </Button>
          </Box>
        )}
      </Box>

      {/* On-screen Directional D-Pad Controls */}
      <Box sx={{ mt: 1.5 }}>
        <Stack spacing={0.5} alignItems="center">
          <IconButton size="small" onClick={() => changeDirection({ x: 0, y: -1 })} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
            <IconArrowUp size={18} />
          </IconButton>
          <Stack direction="row" spacing={3}>
            <IconButton size="small" onClick={() => changeDirection({ x: -1, y: 0 })} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
              <IconArrowLeft size={18} />
            </IconButton>
            <IconButton size="small" onClick={() => changeDirection({ x: 0, y: 1 })} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
              <IconArrowDown size={18} />
            </IconButton>
            <IconButton size="small" onClick={() => changeDirection({ x: 1, y: 0 })} sx={{ bgcolor: 'action.hover', borderRadius: '8px' }}>
              <IconArrowRight size={18} />
            </IconButton>
          </Stack>
        </Stack>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
          Arrow keys, WASD, or tap arrow buttons
        </Typography>
      </Box>
    </Box>
  );
}
