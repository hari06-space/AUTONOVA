import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Button,
  Stack,
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconArrowLeft,
  IconGridDots,
  IconBrain,
  IconTarget,
  IconGridPattern,
  IconAbc,
  IconBolt,
  IconDeviceGamepad2,
  IconMusic,
  IconChevronRight
} from '@tabler/icons-react';
import TicTacToe from './TicTacToe';
import MemoryMatch from './MemoryMatch';
import GuessNumber from './GuessNumber';
import Game2048 from './Game2048';
import WordGuess from './WordGuess';
import SpeedTap from './SpeedTap';
import SnakeGame from './SnakeGame';
import SimonSays from './SimonSays';

const GAMES = [
  {
    id: 'tictactoe',
    title: 'Tic-Tac-Toe',
    desc: 'Casual 3×3 game vs Smart AI or 2 Players',
    icon: IconGridDots,
    color: '#0288d1',
    bg: 'rgba(2, 136, 209, 0.08)',
    tag: 'Classic'
  },
  {
    id: 'game2048',
    title: '2048 Puzzle',
    desc: 'Slide and merge tiles to reach 2048',
    icon: IconGridPattern,
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.08)',
    tag: 'Trending'
  },
  {
    id: 'wordguess',
    title: 'Word Guess',
    desc: 'Guess the hidden 5-letter mind word (Wordle)',
    icon: IconAbc,
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.08)',
    tag: 'Vocabulary'
  },
  {
    id: 'speedtap',
    title: 'Reflex Speed Tap',
    desc: 'Test your reaction speed & combos in 20s',
    icon: IconBolt,
    color: '#e11d48',
    bg: 'rgba(225, 29, 72, 0.08)',
    tag: 'Fast'
  },
  {
    id: 'snake',
    title: 'Retro Snake',
    desc: 'Classic arcade snake with apples & boost',
    icon: IconDeviceGamepad2,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    tag: 'Arcade'
  },
  {
    id: 'simon',
    title: 'Simon Says',
    desc: 'Musical 4-color memory pattern sequence',
    icon: IconMusic,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.08)',
    tag: 'Memory'
  },
  {
    id: 'memory',
    title: 'Memory Match',
    desc: 'Flip and find 6 matching pairs',
    icon: IconBrain,
    color: '#7b1fa2',
    bg: 'rgba(123, 31, 162, 0.08)',
    tag: 'Brain'
  },
  {
    id: 'guess',
    title: 'Guess the Number',
    desc: 'Binary search the secret number (1–100)',
    icon: IconTarget,
    color: '#2e7d32',
    bg: 'rgba(46, 125, 50, 0.08)',
    tag: 'Logic'
  }
];

export default function QuickFunHub({ isMuted }) {
  const theme = useTheme();
  const [selectedGame, setSelectedGame] = useState(null);

  const renderGameContent = () => {
    switch (selectedGame) {
      case 'tictactoe':
        return <TicTacToe isMuted={isMuted} />;
      case 'memory':
        return <MemoryMatch isMuted={isMuted} />;
      case 'guess':
        return <GuessNumber isMuted={isMuted} />;
      case 'game2048':
        return <Game2048 isMuted={isMuted} />;
      case 'wordguess':
        return <WordGuess isMuted={isMuted} />;
      case 'speedtap':
        return <SpeedTap isMuted={isMuted} />;
      case 'snake':
        return <SnakeGame isMuted={isMuted} />;
      case 'simon':
        return <SimonSays isMuted={isMuted} />;
      default:
        return null;
    }
  };

  if (selectedGame) {
    const currentGame = GAMES.find((g) => g.id === selectedGame);
    return (
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Button
            size="small"
            startIcon={<IconArrowLeft size={16} />}
            onClick={() => setSelectedGame(null)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
          >
            All Mini-Games
          </Button>
          {currentGame && (
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: currentGame.color }}>
              {currentGame.title}
            </Typography>
          )}
        </Stack>
        {renderGameContent()}
      </Box>
    );
  }

  return (
    <Box sx={{ py: 0.5 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, textAlign: 'center', fontSize: '0.8rem' }}>
        Select a refreshing mini-game to de-stress and sharpen your focus.
      </Typography>

      <Grid container spacing={1.5}>
        {GAMES.map((game) => {
          const IconComp = game.icon;
          return (
            <Grid item xs={12} sm={6} key={game.id}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: '14px',
                  borderColor: theme.palette.divider,
                  height: '100%',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: game.color,
                    boxShadow: `0 6px 18px ${game.color}25`,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardActionArea onClick={() => setSelectedGame(game.id)} sx={{ p: 1.2, height: '100%' }}>
                  <CardContent sx={{ p: 0.5, '&:last-child': { pb: 0.5 } }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: game.bg,
                          color: game.color,
                          flexShrink: 0
                        }}
                      >
                        <IconComp size={24} stroke={1.8} />
                      </Box>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 0.2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                            {game.title}
                          </Typography>
                          {game.tag && (
                            <Chip
                              label={game.tag}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                bgcolor: game.bg,
                                color: game.color,
                                border: `1px solid ${game.color}30`
                              }}
                            />
                          )}
                        </Stack>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: '0.72rem'
                          }}
                        >
                          {game.desc}
                        </Typography>
                      </Box>
                      <IconChevronRight size={16} color={theme.palette.text.secondary} />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
