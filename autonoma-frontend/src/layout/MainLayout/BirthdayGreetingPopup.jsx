import React, { useState, useEffect, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import { IconX, IconCake, IconGift, IconBalloon, IconSparkles, IconVolume, IconVolumeOff } from '@tabler/icons-react';
import axios from 'utils/axios';
import { getPhotoUrl } from 'ui-component/bos/BOSUtils';

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getColorFromText = (text) => {
  if (!text) return '#ff4081';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
    '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#FF9800',
    '#FF5722', '#F44336'
  ];
  return colors[Math.abs(hash) % colors.length];
};

export default function BirthdayGreetingPopup() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [empData, setEmpData] = useState(null);
  const [floatingBalloons, setFloatingBalloons] = useState([]);
  const [closing, setClosing] = useState(false);
  const [wishes, setWishes] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  // Play/Stop birthday music when popup opens/closes
  useEffect(() => {
    if (open) {
      const audio = new Audio('/happy-birthday.mp3');
      audio.loop = true;
      audio.volume = 1.0;
      audio.muted = isMuted;
      audioRef.current = audio;

      const playAudio = () => {
        audio.play().catch((err) => {
          console.log('Autoplay blocked, waiting for user interaction:', err);
        });
      };

      playAudio();

      // Fallback: try playing on any user interaction in the window if browser blocks autoplay
      const handleUserInteraction = () => {
        if (audioRef.current && audioRef.current.paused && !audioRef.current.muted) {
          audioRef.current.play().catch((err) => console.log('Interacted play failed:', err));
        }
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('keydown', handleUserInteraction);
      };

      window.addEventListener('click', handleUserInteraction);
      window.addEventListener('keydown', handleUserInteraction);

      return () => {
        audio.pause();
        audioRef.current = null;
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('keydown', handleUserInteraction);
      };
    }
  }, [open]);

  const toggleMute = () => {
    if (audioRef.current) {
      if (audioRef.current.muted) {
        audioRef.current.muted = false;
        audioRef.current.play().catch(err => console.log(err));
        setIsMuted(false);
      } else {
        audioRef.current.muted = true;
        setIsMuted(true);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  // Check on mount if we should show the popup
  useEffect(() => {
    axios.get('/api/master/hr/employees/birthdays/check-today-popup')
      .then((response) => {
        if (response.data && response.data.showPopup) {
          setEmpData(response.data);
          setOpen(true);
          triggerFloatingBalloons();
        }
      })
      .catch((err) => {
        console.error('Failed to check birthday popup:', err);
      });
  }, []);

  // Fetch colleague wishes when popup is open
  useEffect(() => {
    if (open) {
      axios.get('/api/master/hr/employees/birthdays/my-wishes')
        .then((response) => {
          setWishes(response.data || []);
        })
        .catch((err) => {
          console.error('Failed to fetch birthday wishes:', err);
        });
    }
  }, [open]);

  const triggerFloatingBalloons = () => {
    const list = [];
    const colors = ['#FF4081', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
    const emojis = ['🎈', '🎉', '🎁', '🎂', '✨'];
    
    // Spawn 25 particles floating all over the screen
    for (let i = 0; i < 25; i++) {
      list.push({
        id: Math.random(),
        left: Math.random() * 90 + 5,
        delay: Math.random() * 1.5,
        duration: Math.random() * 3 + 2.5,
        scale: Math.random() * 0.9 + 0.7,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    setFloatingBalloons(list);
  };

  const handleClose = () => {
    if (closing) return;
    setClosing(true);

    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Call API to mark as shown
    axios.post('/api/master/hr/employees/birthdays/mark-popup-shown')
      .then(() => {
        setTimeout(() => {
          setOpen(false);
          setClosing(false);
        }, 300);
      })
      .catch((err) => {
        console.error('Failed to mark birthday popup as shown:', err);
        setOpen(false);
        setClosing(false);
      });
  };

  const handleThankYou = () => {
    if (closing) return;
    setClosing(true);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Call API to send thank-you notifications first
    axios.post('/api/master/hr/employees/birthdays/send-thank-you')
      .then(() => {
        // Then mark the popup as shown
        return axios.post('/api/master/hr/employees/birthdays/mark-popup-shown');
      })
      .then(() => {
        setTimeout(() => {
          setOpen(false);
          setClosing(false);
        }, 300);
      })
      .catch((err) => {
        console.error('Failed to complete thank you action:', err);
        // Fallback: still close the popup even on error
        setOpen(false);
        setClosing(false);
      });
  };

  if (!open || !empData) return null;

  const keyframes = `
    @keyframes popupFloatUp {
      0% { transform: translateY(100vh); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(-120vh) translateX(30px); opacity: 0; }
    }
    @keyframes modalPulse {
      0% { transform: scale(0.95); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes bgGlow {
      0%, 100% { filter: drop-shadow(0 0 15px rgba(255, 193, 7, 0.4)); }
      50% { filter: drop-shadow(0 0 30px rgba(255, 87, 34, 0.7)); }
    }
    @keyframes sparkleRotate {
      0% { transform: rotate(0deg) scale(0.8); opacity: 0.5; }
      50% { transform: rotate(180deg) scale(1.2); opacity: 1; }
      100% { transform: rotate(360deg) scale(0.8); opacity: 0.5; }
    }
  `;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(9, 5, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1400
          }
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: '24px',
          overflow: 'visible',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #1c0e35 0%, #0d061c 60%, #06030c 100%)'
            : 'linear-gradient(135deg, #fff3f5 0%, #fffbfd 60%, #f4f6ff 100%)',
          border: '2px solid',
          borderColor: theme.palette.mode === 'dark' ? '#ff9800' : '#e91e63',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 25px 60px rgba(255, 152, 0, 0.3)'
            : '0 25px 60px rgba(233, 30, 99, 0.25)',
          animation: 'modalPulse 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          position: 'relative',
          p: 1.5,
          zIndex: 1500
        }
      }}
    >
      <style>{keyframes}</style>

      {/* Volume toggle button */}
      <IconButton
        onClick={toggleMute}
        sx={{
          position: 'absolute',
          top: 16,
          right: 56,
          color: theme.palette.text.secondary,
          '&:hover': {
            color: theme.palette.mode === 'dark' ? '#ff9800' : '#e91e63',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(233, 30, 99, 0.1)'
          },
          zIndex: 10
        }}
      >
        {isMuted ? <IconVolumeOff size={22} stroke={2.5} /> : <IconVolume size={22} stroke={2.5} />}
      </IconButton>

      {/* Close button top right */}
      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: theme.palette.text.secondary,
          '&:hover': {
            color: theme.palette.error.main,
            bgcolor: 'rgba(244, 67, 54, 0.1)'
          },
          zIndex: 10
        }}
      >
        <IconX size={22} stroke={2.5} />
      </IconButton>

      {/* Decorative Floating Sparkles */}
      <Box sx={{ position: 'absolute', top: '10%', left: '8%', animation: 'sparkleRotate 6s infinite', color: '#ffc107', zIndex: 1 }}><IconSparkles size={24} /></Box>
      <Box sx={{ position: 'absolute', top: '20%', right: '10%', animation: 'sparkleRotate 8s infinite 1s', color: '#e91e63', zIndex: 1 }}><IconSparkles size={20} /></Box>
      <Box sx={{ position: 'absolute', bottom: '15%', left: '12%', animation: 'sparkleRotate 7s infinite 2s', color: '#2196f3', zIndex: 1 }}><IconSparkles size={22} /></Box>

      {/* Main Container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          py: 3,
          px: 2,
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Large Celebration Icons */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <Box sx={{ fontSize: '2.5rem', animation: 'sparkleRotate 4s infinite' }}>🎈</Box>
          <Box sx={{ fontSize: '3.5rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' }}>🎂</Box>
          <Box sx={{ fontSize: '2.5rem', animation: 'sparkleRotate 5s infinite 0.5s' }}>🎁</Box>
        </Box>

        {/* Employee Profile Photo */}
        <Box sx={{ position: 'relative', mb: 2, animation: 'bgGlow 4s infinite alternate' }}>
          {empData.photoPath ? (
            <Avatar
              src={getPhotoUrl(empData.photoPath)}
              alt={empData.employeeName}
              sx={{
                width: 100,
                height: 100,
                borderRadius: '24px',
                border: '4px solid',
                borderColor: theme.palette.mode === 'dark' ? '#ff9800' : '#e91e63',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 100,
                height: 100,
                borderRadius: '24px',
                border: '4px solid',
                borderColor: theme.palette.mode === 'dark' ? '#ff9800' : '#e91e63',
                fontSize: '2.2rem',
                fontWeight: 900,
                bgcolor: getColorFromText(empData.employeeName),
                color: '#fff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}
            >
              {getInitials(empData.employeeName)}
            </Avatar>
          )}
          <Box
            sx={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              bgcolor: theme.palette.mode === 'dark' ? '#ff9800' : '#e91e63',
              color: '#fff',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
            }}
          >
            🎉
          </Box>
        </Box>

        {/* Greeting Heading */}
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '1.6rem', sm: '2rem' },
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(45deg, #ffb74d 30%, #ff4081 90%)'
              : 'linear-gradient(45deg, #e91e63 30%, #ff5722 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1.5,
            px: 2
          }}
        >
          🎉 Happy Birthday, {empData.employeeName}!
        </Typography>

        {/* Greeting Message */}
        <Box sx={{ maxWidth: '420px', mb: 2.5, px: 2 }}>
          <Typography
            variant="body1"
            sx={{
              fontSize: '1rem',
              lineHeight: 1.5,
              fontWeight: 500,
              color: theme.palette.text.primary
            }}
          >
            Wishing you happiness, good health, success, and another wonderful year ahead!
          </Typography>
        </Box>

        {/* Colleagues' Birthday Wishes Container (Creative Comment Box) */}
        <Box
          sx={{
            width: '100%',
            maxWidth: '460px',
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(233,30,99,0.03)',
            borderRadius: '18px',
            border: '1px dashed',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(233,30,99,0.2)',
            p: 2,
            mb: 3,
            textAlign: 'left'
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              fontSize: '0.82rem',
              color: theme.palette.mode === 'dark' ? '#ffb74d' : '#e91e63',
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            💌 WISHES FROM YOUR TEAM ({wishes.length})
          </Typography>

          <Box
            sx={{
              maxHeight: '160px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              pr: 0.5,
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(0,0,0,0.1)',
                borderRadius: '4px'
              }
            }}
          >
            {wishes.length === 0 ? (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                Wishes from your colleagues will appear here as they arrive! ✨
              </Typography>
            ) : (
              wishes.map((wish) => (
                <Box
                  key={wish.id}
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start',
                    p: 1.2,
                    borderRadius: '12px',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#ffffff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                  }}
                >
                  {wish.senderPhotoPath ? (
                    <Avatar src={getPhotoUrl(wish.senderPhotoPath)} sx={{ width: 32, height: 32, borderRadius: '8px' }} />
                  ) : (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        bgcolor: getColorFromText(wish.senderName),
                        color: '#fff'
                      }}
                    >
                      {getInitials(wish.senderName)}
                    </Avatar>
                  )}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem', color: theme.palette.text.primary }}>
                        {wish.senderName}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.68rem', color: theme.palette.text.secondary }}>
                        {wish.senderDesignation || 'Colleague'}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.78rem',
                        color: theme.palette.text.primary,
                        mt: 0.5,
                        lineHeight: 1.4,
                        fontWeight: 500
                      }}
                    >
                      {wish.message}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', width: '100%', px: 4 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleThankYou}
            startIcon={<span>🎁</span>}
            sx={{
              borderRadius: '16px',
              px: 4,
              py: 1.5,
              fontWeight: 800,
              fontSize: '1rem',
              textTransform: 'none',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #ab47bc 0%, #7b1fa2 100%)'
                : 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)',
              boxShadow: '0 8px 20px rgba(233,30,99,0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 24px rgba(233,30,99,0.45)'
              },
              transition: 'all 0.2s'
            }}
          >
            Thank You
          </Button>
          <Button
            variant="outlined"
            onClick={handleClose}
            sx={{
              borderRadius: '16px',
              px: 3,
              py: 1.5,
              fontWeight: 700,
              fontSize: '1rem',
              textTransform: 'none',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
              color: theme.palette.text.secondary,
              '&:hover': {
                borderColor: theme.palette.text.primary,
                bgcolor: 'rgba(0,0,0,0.02)'
              }
            }}
          >
            Close
          </Button>
        </Box>
      </Box>

      {/* Screen-wide Floating Balloons Container */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 99999,
          overflow: 'hidden'
        }}
      >
        {floatingBalloons.map((eff) => (
          <Box
            key={eff.id}
            sx={{
              position: 'absolute',
              bottom: '-50px',
              left: `${eff.left}%`,
              animation: `popupFloatUp ${eff.duration}s forwards ease-out`,
              animationDelay: `${eff.delay}s`,
              fontSize: `${eff.scale * 3}rem`,
              userSelect: 'none'
            }}
          >
            {eff.emoji}
          </Box>
        ))}
      </Box>
    </Dialog>
  );
}
