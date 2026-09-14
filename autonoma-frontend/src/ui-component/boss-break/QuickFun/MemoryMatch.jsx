import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Chip,
  Paper,
  Fade
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconRotateClockwise, IconTrophy } from '@tabler/icons-react';
import soundHelper from '../soundHelper';

const CARD_SYMBOLS = ['☕', '🚀', '💻', '🎯', '🌟', '🌿'];

const generateShuffledCards = () => {
  const deck = [...CARD_SYMBOLS, ...CARD_SYMBOLS].map((symbol, index) => ({
    id: index,
    symbol,
    isFlipped: false,
    isMatched: false
  }));

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export default function MemoryMatch({ isMuted }) {
  const theme = useTheme();
  const [cards, setCards] = useState(generateShuffledCards);
  const [flippedCards, setFlippedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const isGameComplete = matchedPairs === CARD_SYMBOLS.length;

  const handleCardClick = (clickedCard) => {
    if (isLocked || clickedCard.isFlipped || clickedCard.isMatched) return;

    soundHelper.playTone(520, 0.08, isMuted);

    // Flip the clicked card
    const updatedCards = cards.map((c) =>
      c.id === clickedCard.id ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);

    const newFlipped = [...flippedCards, clickedCard];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      setIsLocked(true);

      const [first, second] = newFlipped;
      if (first.symbol === second.symbol) {
        // Match found!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.symbol === first.symbol ? { ...c, isMatched: true } : c
            )
          );
          setFlippedCards([]);
          setMatchedPairs((prev) => {
            const next = prev + 1;
            if (next === CARD_SYMBOLS.length) {
              soundHelper.playCompletionChime(isMuted);
            } else {
              soundHelper.playTone(660, 0.15, isMuted);
            }
            return next;
          });
          setIsLocked(false);
        }, 300);
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === first.id || c.id === second.id
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
          setIsLocked(false);
        }, 800);
      }
    }
  };

  const handleRestart = () => {
    setCards(generateShuffledCards());
    setFlippedCards([]);
    setMoves(0);
    setMatchedPairs(0);
    setIsLocked(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {/* Top Header: Moves, Pairs & Restart */}
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: '100%', maxWidth: 360 }}>
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            gap: 2,
            px: 2,
            py: 0.8,
            borderRadius: '10px',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Moves: <Box component="span" sx={{ fontWeight: 800, color: 'text.primary' }}>{moves}</Box>
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Matched: <Box component="span" sx={{ fontWeight: 800, color: theme.palette.success.main }}>{matchedPairs} / {CARD_SYMBOLS.length}</Box>
          </Typography>
        </Paper>

        <Button
          variant="outlined"
          size="small"
          startIcon={<IconRotateClockwise size={16} />}
          onClick={handleRestart}
          sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.75rem' }}
        >
          Restart
        </Button>
      </Stack>

      {/* Completion Banner */}
      {isGameComplete && (
        <Fade in={isGameComplete}>
          <Chip
            icon={<IconTrophy size={16} />}
            label={`Brilliant! Completed in ${moves} moves! 🎉`}
            color="success"
            sx={{ fontWeight: 700, fontSize: '0.85rem', px: 1 }}
          />
        </Fade>
      )}

      {/* 4x3 Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1.2,
          width: '100%',
          maxWidth: 360,
          p: 1.5,
          borderRadius: '16px',
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f1f5f9',
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        {cards.map((card) => {
          const isRevealed = card.isFlipped || card.isMatched;
          return (
            <Paper
              key={card.id}
              onClick={() => handleCardClick(card)}
              elevation={0}
              sx={{
                height: 68,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                cursor: isRevealed || isLocked ? 'default' : 'pointer',
                userSelect: 'none',
                fontSize: isRevealed ? '1.75rem' : '1.2rem',
                fontWeight: 700,
                color: isRevealed ? 'inherit' : theme.palette.primary.main,
                bgcolor: card.isMatched
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(46, 125, 50, 0.25)'
                    : '#e8f5e9'
                  : isRevealed
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(33, 150, 243, 0.25)'
                    : '#e3f2fd'
                  : theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.08)'
                  : '#ffffff',
                border: `1px solid ${
                  card.isMatched
                    ? theme.palette.success.main
                    : isRevealed
                    ? theme.palette.primary.main
                    : theme.palette.divider
                }`,
                boxShadow: isRevealed && !card.isMatched
                  ? `0 4px 12px ${theme.palette.primary.main}35`
                  : 'none',
                transform: isRevealed ? 'rotateY(0deg)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: isRevealed || isLocked ? 'none' : 'translateY(-2px)',
                  boxShadow: isRevealed || isLocked ? 'none' : theme.shadows[3]
                }
              }}
            >
              {isRevealed ? card.symbol : '❓'}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
