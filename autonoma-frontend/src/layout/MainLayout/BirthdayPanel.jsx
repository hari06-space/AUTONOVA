import React, { useState, useEffect, useRef } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { IconX, IconCake, IconGift, IconBalloon, IconSparkles, IconSend } from '@tabler/icons-react';
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

// Web Audio API Birthday Music Synthesizer (Music Box style)
const playBirthdayMelody = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  
  const ctx = new AudioContext();
  const notes = [
    { note: 'C4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 1 }, { note: 'C4', dur: 1 }, { note: 'F4', dur: 1 }, { note: 'E4', dur: 2 },
    { note: 'C4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 1 }, { note: 'C4', dur: 1 }, { note: 'G4', dur: 1 }, { note: 'F4', dur: 2 },
    { note: 'C4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'C5', dur: 1 }, { note: 'A4', dur: 1 }, { note: 'F4', dur: 1 }, { note: 'E4', dur: 1 }, { note: 'D4', dur: 2 },
    { note: 'A#4', dur: 0.5 }, { note: 'A#4', dur: 0.5 }, { note: 'A4', dur: 1 }, { note: 'F4', dur: 1 }, { note: 'G4', dur: 1 }, { note: 'F4', dur: 2 }
  ];
  
  const freqs = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'A#4': 466.16, 'C5': 523.25
  };
  
  let time = ctx.currentTime + 0.1;
  
  notes.forEach(item => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle'; // Sweet music-box style sound
    osc.frequency.setValueAtTime(freqs[item.note], time);
    
    // Volume envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(1.0, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + item.dur * 0.45 - 0.02);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + item.dur * 0.45);
    
    time += item.dur * 0.48; // Tempo control
  });
  
  return {
    stop: () => {
      try {
        ctx.close();
      } catch (e) {}
    }
  };
};

export default function BirthdayPanel({ open, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [loading, setLoading] = useState(false);
  const [birthdays, setBirthdays] = useState([]);
  const [error, setError] = useState(null);
  const [floatingEffects, setFloatingEffects] = useState([]);

  // Wishes state
  const [wishRecipientId, setWishRecipientId] = useState(null);
  const [wishMessage, setWishMessage] = useState('');
  const [sendingWishId, setSendingWishId] = useState(null);
  const [wishedEmployeeIds, setWishedEmployeeIds] = useState(new Set());

  const audioRef = useRef(null);

  // Determine width based on screen size
  const panelWidth = isMobile ? '100vw' : isTablet ? 380 : 420;

  const presets = [
    "🎂 Happy Birthday! Have an amazing day!",
    "🎉 Wishing you success, joy and good health!",
    "🎁 Hope your year ahead is wonderful!"
  ];

  // Trigger floating balloon/confetti animation
  const triggerBalloons = (count = 12) => {
    const newEffects = [];
    const colors = ['#FF4081', '#FFEB3B', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
    const emojis = ['🎈', '🎉', '🎁', '🎂', '✨'];

    for (let i = 0; i < count; i++) {
      newEffects.push({
        id: Math.random(),
        left: Math.random() * 80 + 10,
        delay: Math.random() * 0.6,
        duration: Math.random() * 2 + 2,
        scale: Math.random() * 0.7 + 0.6,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    setFloatingEffects((prev) => [...prev, ...newEffects]);

    // Clear animations after completion
    setTimeout(() => {
      setFloatingEffects((prev) => prev.filter((eff) => !newEffects.includes(eff)));
    }, 4000);
  };

  // Play/Stop Music and Fetch data
  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      
      // Start Birthday Music Box
      try {
        audioRef.current = playBirthdayMelody();
      } catch (err) {
        console.warn('AudioContext blocked or failed:', err);
      }

      axios.get('/api/master/hr/employees/birthdays/upcoming')
        .then((response) => {
          setBirthdays(response.data || []);
          setLoading(false);
          // Auto celebration upon opening
          setTimeout(() => triggerBalloons(15), 300);
        })
        .catch((err) => {
          console.error('Failed to load upcoming birthdays:', err);
          setError('Failed to load birthdays. Please try again.');
          setLoading(false);
        });
    } else {
      // Stop Birthday Music Box
      if (audioRef.current) {
        audioRef.current.stop();
        audioRef.current = null;
      }
      setWishRecipientId(null);
      setWishMessage('');
    }
  }, [open]);

  // Support ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Handle sending wish
  const handleSendWish = (empId) => {
    if (!wishMessage.trim()) return;
    setSendingWishId(empId);

    axios.post('/api/master/hr/employees/birthdays/send-wish', {
      recipientEmployeeId: empId,
      message: wishMessage
    })
      .then(() => {
        setWishedEmployeeIds((prev) => {
          const next = new Set(prev);
          next.add(empId);
          return next;
        });
        setWishRecipientId(null);
        setWishMessage('');
        setSendingWishId(null);
        triggerBalloons(20);
      })
      .catch((err) => {
        console.error('Failed to send wish:', err);
        alert(err.response?.data?.message || 'Failed to send wish. Please try again.');
        setSendingWishId(null);
      });
  };

  // Get days remaining string and styling
  const getBirthdayBadgeInfo = (birthDateStr) => {
    if (!birthDateStr) return { text: '', daysLeft: 999 };
    const bDate = new Date(birthDateStr);
    const today = new Date();
    const bDay = bDate.getDate();
    const tDay = today.getDate();
    const diff = bDay - tDay;

    if (diff === 0) {
      return { text: '🎉 Today', daysLeft: 0 };
    } else if (diff === 1) {
      return { text: '🎂 Tomorrow', daysLeft: 1 };
    } else {
      return { text: `🎈 In ${diff} Days`, daysLeft: diff };
    }
  };

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  const todayBirthdays = birthdays.filter((emp) => getBirthdayBadgeInfo(emp.birthDate).daysLeft === 0);
  const upcomingBirthdays = birthdays.filter((emp) => getBirthdayBadgeInfo(emp.birthDate).daysLeft > 0);

  const animationsStyles = `
    @keyframes floatUp {
      0% { transform: translateY(100vh) translateY(0) scale(1); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(-120vh) translateX(40px) scale(0.8); opacity: 0; }
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.2; transform: scale(0.8); }
      50% { opacity: 0.8; transform: scale(1.2); }
    }
    @keyframes cardGlow {
      0%, 100% { box-shadow: 0 0 10px rgba(255, 179, 0, 0.4); border-color: rgba(255, 179, 0, 0.6); }
      50% { box-shadow: 0 0 20px rgba(255, 179, 0, 0.8); border-color: rgba(255, 179, 0, 1); }
    }
  `;

  const renderCard = (emp) => {
    const badge = getBirthdayBadgeInfo(emp.birthDate);
    const isToday = badge.daysLeft === 0;
    const isWishExpanded = wishRecipientId === emp.id;
    const hasAlreadyWished = wishedEmployeeIds.has(emp.id);

    const formattedDate = emp.birthDate ? new Date(emp.birthDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }) : '';

    return (
      <Card
        key={emp.id}
        sx={{
          borderRadius: '16px',
          overflow: 'visible',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          border: '1px solid',
          ...(isToday
            ? {
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #3c2005 0%, #1c0e01 100%)'
                  : 'linear-gradient(135deg, #fffde7 0%, #fff9c4 100%)',
                borderColor: '#ffc107',
                animation: 'cardGlow 3s infinite',
                boxShadow: '0 8px 30px rgba(255, 193, 7, 0.25)'
              }
            : {
                background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#ffffff',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 12px 24px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.2)'
                    : '0 12px 24px rgba(135,145,170,0.15)',
                  borderColor: theme.palette.secondary.main
                }
              })
        }}
      >
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          {isToday && (
            <Box
              sx={{
                position: 'absolute',
                top: -12,
                right: 16,
                background: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
                color: '#fff',
                px: 1.5,
                py: 0.5,
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 900,
                boxShadow: '0 4px 10px rgba(255,152,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                zIndex: 3
              }}
            >
              🎉 Happy Birthday!
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ position: 'relative' }}>
              {emp.photoPath ? (
                <Avatar
                  src={getPhotoUrl(emp.photoPath)}
                  alt={emp.employeeName}
                  sx={{
                    width: 68,
                    height: 68,
                    borderRadius: '14px',
                    border: '2px solid',
                    borderColor: isToday ? '#ffc107' : theme.palette.secondary.light
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 68,
                    height: 68,
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    bgcolor: getColorFromText(emp.employeeName),
                    color: '#fff',
                    border: '2px solid',
                    borderColor: isToday ? '#ffc107' : theme.palette.secondary.light
                  }}
                >
                  {getInitials(emp.employeeName)}
                </Avatar>
              )}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -6,
                  right: -6,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  bgcolor: isToday ? '#ff9800' : theme.palette.secondary.main,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  fontSize: '10px'
                }}
              >
                <IconCake size={13} stroke={2.5} />
              </Box>
            </Box>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  color: theme.palette.text.primary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  mb: 0.4
                }}
              >
                {emp.employeeName}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 555, fontSize: '0.75rem', mb: 0.2 }}>
                Code: {emp.empCode}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 555, fontSize: '0.75rem', mb: 0.2 }}>
                {emp.designationName || 'Staff'} • {emp.departmentName || 'HR'}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: '0.78rem', mt: 0.6 }}>
                📅 Birthday: {formattedDate}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 2,
              pt: 1.5,
              borderTop: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)'
            }}
          >
            <Box
              sx={{
                px: 1.5,
                py: 0.6,
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 800,
                ...(isToday
                  ? { bgcolor: '#ff5722', color: '#fff', boxShadow: '0 4px 10px rgba(255,87,34,0.3)' }
                  : badge.daysLeft === 1
                  ? { bgcolor: 'rgba(33, 150, 243, 0.12)', color: theme.palette.primary.main }
                  : { bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: theme.palette.text.secondary })
              }}
            >
              {badge.text}
            </Box>

            {!hasAlreadyWished ? (
              <Button
                size="small"
                variant={isToday ? "contained" : "outlined"}
                color="secondary"
                onClick={() => {
                  if (isWishExpanded) {
                    setWishRecipientId(null);
                  } else {
                    setWishRecipientId(emp.id);
                    setWishMessage(presets[0]);
                  }
                }}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 1.8,
                  py: 0.5,
                  boxShadow: isToday ? '0 4px 12px rgba(156,39,176,0.3)' : 'none'
                }}
                startIcon={<IconGift size={14} />}
              >
                {isWishExpanded ? 'Cancel' : 'Send Wishes'}
              </Button>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#81c784' : '#2e7d32',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  pr: 1
                }}
              >
                ❤️ Wished
              </Typography>
            )}
          </Box>

          <Collapse in={isWishExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, pt: 1.8, borderTop: '1px dashed rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.text.secondary }}>
                CHOOSE A QUICK GREETING:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {presets.map((preset, index) => (
                  <Chip
                    key={index}
                    label={preset.substring(0, 26) + '...'}
                    onClick={() => setWishMessage(preset)}
                    color={wishMessage === preset ? "secondary" : "default"}
                    variant={wishMessage === preset ? "filled" : "outlined"}
                    size="small"
                    sx={{ borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600 }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Type custom message..."
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 555
                    }
                  }}
                />
                <IconButton
                  color="secondary"
                  disabled={sendingWishId === emp.id || !wishMessage.trim()}
                  onClick={() => handleSendWish(emp.id)}
                  sx={{
                    bgcolor: theme.palette.secondary.main,
                    color: '#fff',
                    borderRadius: '10px',
                    '&:hover': { bgcolor: theme.palette.secondary.dark },
                    '&.Mui-disabled': { bgcolor: 'rgba(0,0,0,0.06)' }
                  }}
                >
                  {sendingWishId === emp.id ? <CircularProgress size={18} color="inherit" /> : <IconSend size={18} />}
                </IconButton>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: false
      }}
      PaperProps={{
        sx: {
          width: panelWidth,
          maxWidth: '100%',
          overflow: 'hidden',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #130b24 0%, #0d0918 50%, #080a15 100%)'
            : 'linear-gradient(135deg, #fff0f3 0%, #fbf5f7 50%, #f0f4ff 100%)',
          borderLeft: theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '-20px 0 50px rgba(0,0,0,0.15)'
        }
      }}
    >
      <style>{animationsStyles}</style>

      {/* Decorative Sparkles & Background Shapes */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <Box sx={{ position: 'absolute', top: '10%', left: '15%', animation: 'twinkle 3s infinite', color: '#ffeb3b', opacity: 0.6 }}><IconSparkles size={16} /></Box>
        <Box sx={{ position: 'absolute', top: '40%', right: '12%', animation: 'twinkle 4s infinite 1s', color: '#ff4081', opacity: 0.6 }}><IconSparkles size={20} /></Box>
        <Box sx={{ position: 'absolute', bottom: '25%', left: '8%', animation: 'twinkle 3.5s infinite 1.5s', color: '#00bcd4', opacity: 0.5 }}><IconSparkles size={18} /></Box>
        <Box sx={{ position: 'absolute', bottom: '8%', right: '20%', animation: 'twinkle 5s infinite 0.5s', color: '#ffc107', opacity: 0.7 }}><IconSparkles size={22} /></Box>

        <Box sx={{ position: 'absolute', top: '15%', right: '-40px', fontSize: '80px', opacity: 0.04, transform: 'rotate(15deg)' }}>🎈</Box>
        <Box sx={{ position: 'absolute', bottom: '15%', left: '-30px', fontSize: '100px', opacity: 0.03, transform: 'rotate(-25deg)' }}>🎁</Box>
        <Box sx={{ position: 'absolute', top: '60%', left: '50%', fontSize: '120px', opacity: 0.02, transform: 'translate(-50%, -50%)' }}>🎂</Box>
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2.5,
          borderBottom: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
          background: theme.palette.mode === 'dark' ? 'rgba(19, 11, 36, 0.4)' : 'rgba(255, 240, 243, 0.4)',
          backdropFilter: 'blur(10px)',
          zIndex: 2,
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.mode === 'dark' ? '#f48fb1' : '#d81b60', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              🎂 Upcoming Birthdays
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 700, mt: 0.2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {currentMonthName} Birthdays
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.error.main, bgcolor: 'rgba(244, 67, 54, 0.08)' } }}>
          <IconX size={20} stroke={2.5} />
        </IconButton>
      </Box>

      {/* Panel Scrollable Content */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: 3,
          py: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          zIndex: 1,
          position: 'relative',
          pb: 10
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, py: 8, gap: 2 }}>
            <CircularProgress color="secondary" />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
              Loading upcoming birthdays...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, py: 8, textAlign: 'center' }}>
            <Typography variant="h5" color="error" sx={{ fontWeight: 700, mb: 1 }}>
              Oops!
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {error}
            </Typography>
          </Box>
        ) : birthdays.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, py: 8, textAlign: 'center', gap: 2 }}>
            <Box sx={{ fontSize: '70px' }}>🎈</Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 750, mb: 0.5, color: theme.palette.text.primary }}>
                No Upcoming Birthdays
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, maxWidth: 280, mx: 'auto' }}>
                There are no more upcoming birthdays for the rest of this month.
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Today's Section */}
            {todayBirthdays.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    color: '#ff9800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    fontSize: '0.92rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderBottom: '2px solid rgba(255, 152, 0, 0.25)',
                    pb: 0.8
                  }}
                >
                  🎉 Today's Celebrations ({todayBirthdays.length})
                </Typography>
                {todayBirthdays.map((emp) => renderCard(emp))}
              </Box>
            )}

            {/* Upcoming Section */}
            {upcomingBirthdays.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette.secondary.main,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    fontSize: '0.92rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderBottom: `2px solid ${theme.palette.secondary.light}`,
                    pb: 0.8,
                    mt: todayBirthdays.length > 0 ? 1 : 0
                  }}
                >
                  📅 Upcoming Birthdays ({upcomingBirthdays.length})
                </Typography>
                {upcomingBirthdays.map((emp) => renderCard(emp))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Floating Effects Area */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 9999 }}>
        {floatingEffects.map((eff) => (
          <Box
            key={eff.id}
            sx={{
              position: 'absolute',
              bottom: '-50px',
              left: `${eff.left}%`,
              animation: `floatUp ${eff.duration}s forwards ease-out`,
              animationDelay: `${eff.delay}s`,
              fontSize: `${eff.scale * 2.5}rem`,
              userSelect: 'none'
            }}
          >
            {eff.emoji}
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
