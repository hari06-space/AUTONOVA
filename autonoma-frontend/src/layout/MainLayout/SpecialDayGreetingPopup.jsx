import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import { IconX, IconSparkles } from '@tabler/icons-react';
import axios from 'utils/axios';
import useAuth from 'hooks/useAuth';
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

const renderBadgeIcon = (icon) => {
  if (icon === '🇮🇳') {
    return (
      <svg width="72" height="48" viewBox="0 0 90 60" style={{ borderRadius: '6px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
        <rect width="90" height="20" fill="#FF9933" />
        <rect y="20" width="90" height="20" fill="#FFFFFF" />
        <rect y="40" width="90" height="20" fill="#128807" />
        <circle cx="45" cy="30" r="8" fill="none" stroke="#000080" strokeWidth="1.2" />
        <circle cx="45" cy="30" r="1.5" fill="#000080" />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          return (
            <line
              key={i}
              x1="45"
              y1="30"
              x2={45 + 8 * Math.cos((angle * Math.PI) / 180)}
              y2={30 + 8 * Math.sin((angle * Math.PI) / 180)}
              stroke="#000080"
              strokeWidth="0.6"
            />
          );
        })}
      </svg>
    );
  }
  return icon;
};

const getHolidayTheme = (holidayName = '', holidayType = '', mode = 'light') => {
  const name = holidayName.toUpperCase();
  const type = holidayType.toUpperCase();

  // 1. PONGAL / SANKRANTI / HARVEST
  if (name.includes('PONGAL') || name.includes('SANKRANTI') || name.includes('BHOGI') || name.includes('KANUMA')) {
    return {
      emojis: ['🌾', '🍯', '☀️', '🐂', '🔥', '🪔'],
      colors: ['#FF9800', '#FF5722', '#FFC107', '#E64A19', '#F57C00'],
      borderColor: mode === 'dark' ? '#ff9800' : '#e64a19',
      shadowColor: mode === 'dark' ? 'rgba(255, 152, 0, 0.4)' : 'rgba(230, 74, 25, 0.25)',
      gradientBg: mode === 'dark'
        ? 'linear-gradient(135deg, #3e1b00 0%, #1c0b00 60%, #0c0500 100%)'
        : 'linear-gradient(135deg, #fff8e1 0%, #fffde7 60%, #fff3e0 100%)',
      headingGradient: mode === 'dark'
        ? 'linear-gradient(45deg, #ffb74d 30%, #ff5722 90%)'
        : 'linear-gradient(45deg, #e64a19 30%, #f57c00 90%)',
      badge: '🌾',
      btnColor: 'linear-gradient(45deg, #e64a19 0%, #ff9800 100%)',
      hoverBtnColor: 'linear-gradient(45deg, #bf360c 0%, #e64a19 100%)'
    };
  }

  // 2. DIWALI / DEEPAVALI
  if (name.includes('DIWALI') || name.includes('DEEPAVALI')) {
    return {
      emojis: ['🪔', '🎇', '✨', '🥮', '💥', '🕯️'],
      colors: ['#FFD700', '#FF8C00', '#FF3300', '#FF00FF', '#FFFF00'],
      borderColor: mode === 'dark' ? '#ffd700' : '#ff8c00',
      shadowColor: mode === 'dark' ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 140, 0, 0.25)',
      gradientBg: mode === 'dark'
        ? 'linear-gradient(135deg, #2b1d00 0%, #140e00 60%, #070500 100%)'
        : 'linear-gradient(135deg, #fffdf0 0%, #fffae0 60%, #fff8e1 100%)',
      headingGradient: mode === 'dark'
        ? 'linear-gradient(45deg, #ffd700 30%, #ff3300 90%)'
        : 'linear-gradient(45deg, #d4af37 30%, #e65100 90%)',
      badge: '🪔',
      btnColor: 'linear-gradient(45deg, #e65100 0%, #ffd700 100%)',
      hoverBtnColor: 'linear-gradient(45deg, #b23c00 0%, #d4af37 100%)'
    };
  }

  // 3. CHRISTMAS / XMAS
  if (name.includes('CHRISTMAS') || name.includes('XMAS')) {
    return {
      emojis: ['🎄', '🎅', '🎁', '❄️', '🔔', '🦌'],
      colors: ['#D32F2F', '#388E3C', '#FBC02D', '#1976D2', '#FFFFFF'],
      borderColor: mode === 'dark' ? '#388e3c' : '#d32f2f',
      shadowColor: mode === 'dark' ? 'rgba(56, 142, 60, 0.4)' : 'rgba(211, 47, 47, 0.25)',
      gradientBg: mode === 'dark'
        ? 'linear-gradient(135deg, #091f11 0%, #030c06 60%, #010502 100%)'
        : 'linear-gradient(135deg, #ffebee 0%, #f1f8e9 60%, #e8f5e9 100%)',
      headingGradient: mode === 'dark'
        ? 'linear-gradient(45deg, #81c784 30%, #e57373 90%)'
        : 'linear-gradient(45deg, #c62828 30%, #2e7d32 90%)',
      badge: '🎄',
      btnColor: 'linear-gradient(45deg, #c62828 0%, #2e7d32 100%)',
      hoverBtnColor: 'linear-gradient(45deg, #8e0000 0%, #1b5e20 100%)'
    };
  }

  // 4. NEW YEAR
  if (name.includes('NEW YEAR') || name.includes('NEWYEAR')) {
    return {
      emojis: ['🎉', '🥂', '🎆', '✨', '🕛', '🥳'],
      colors: ['#FFD700', '#FF1493', '#00FFFF', '#7FFF00', '#D8BFD8'],
      borderColor: mode === 'dark' ? '#ffd700' : '#8e24aa',
      shadowColor: mode === 'dark' ? 'rgba(255, 215, 0, 0.4)' : 'rgba(142, 36, 170, 0.25)',
      gradientBg: mode === 'dark'
        ? 'linear-gradient(135deg, #110e20 0%, #070510 60%, #020105 100%)'
        : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 60%, #fae8ff 100%)',
      headingGradient: mode === 'dark'
        ? 'linear-gradient(45deg, #ffd700 30%, #e040fb 90%)'
        : 'linear-gradient(45deg, #6a1b9a 30%, #ab47bc 90%)',
      badge: '🥂',
      btnColor: 'linear-gradient(45deg, #6a1b9a 0%, #ffd700 100%)',
      hoverBtnColor: 'linear-gradient(45deg, #4a148c 0%, #d4af37 100%)'
    };
  }

  // 5. INDEPENDENCE / REPUBLIC DAY
  if (name.includes('INDEPENDENCE') || name.includes('REPUBLIC') || name.includes('FREEDOM')) {
    return {
      emojis: ['🏵️', '🎖️', '🦁', '🧡', '🤍', '💚'],
      colors: ['#FF9933', '#FFFFFF', '#128807', '#000088'],
      borderColor: mode === 'dark' ? '#ff9933' : '#128807',
      shadowColor: mode === 'dark' ? 'rgba(255, 153, 51, 0.4)' : 'rgba(18, 136, 7, 0.25)',
      gradientBg: mode === 'dark'
        ? 'linear-gradient(135deg, #2e1600 0%, #0d1a08 60%, #030802 100%)'
        : 'linear-gradient(135deg, #fff3e0 0%, #ffffff 60%, #e8f5e9 100%)',
      headingGradient: mode === 'dark'
        ? 'linear-gradient(45deg, #ffb74d 30%, #81c784 90%)'
        : 'linear-gradient(45deg, #e65100 30%, #2e7d32 90%)',
      badge: '🇮🇳',
      btnColor: 'linear-gradient(45deg, #e65100 0%, #2e7d32 100%)',
      hoverBtnColor: 'linear-gradient(45deg, #b23c00 0%, #1b5e20 100%)'
    };
  }

  // 6. RAMZAN / EID / MILAD
  if (name.includes('RAMZAN') || name.includes('EID') || name.includes('MEELAD') || name.includes('MILAD')) {
    return {
      emojis: ['🌙', '🕌', '✨', '🤝', '⭐', '🍲'],
      colors: ['#4CAF50', '#FFD700', '#009688', '#8BC34A', '#CDDC39'],
      borderColor: mode === 'dark' ? '#4caf50' : '#009688',
      shadowColor: mode === 'dark' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(0, 150, 136, 0.25)',
      gradientBg: mode === 'dark'
        ? 'linear-gradient(135deg, #051a0b 0%, #020d05 60%, #010502 100%)'
        : 'linear-gradient(135deg, #e8f5e9 0%, #e0f2f1 60%, #f1f8e9 100%)',
      headingGradient: mode === 'dark'
        ? 'linear-gradient(45deg, #a5d6a7 30%, #ffe082 90%)'
        : 'linear-gradient(45deg, #2e7d32 30%, #00796b 90%)',
      badge: '🌙',
      btnColor: 'linear-gradient(45deg, #2e7d32 0%, #00796b 100%)',
      hoverBtnColor: 'linear-gradient(45deg, #1b5e20 0%, #004d40 100%)'
    };
  }

  // 7. FESTIVAL GENERICS
  if (type.includes('FESTIVAL')) {
    return {
      emojis: ['🎉', '🎈', '🌟', '🎊', '✨', '🍬'],
      colors: ['#FF4081', '#FF9800', '#FFEB3B', '#4CAF50', '#2196F3'],
      borderColor: mode === 'dark' ? '#ff4081' : '#e91e63',
      shadowColor: mode === 'dark' ? 'rgba(255, 64, 129, 0.4)' : 'rgba(233, 30, 99, 0.25)',
      gradientBg: mode === 'dark'
        ? 'linear-gradient(135deg, #280a1c 0%, #10051a 60%, #05010a 100%)'
        : 'linear-gradient(135deg, #fff0f5 0%, #faf0e6 60%, #f5f5ff 100%)',
      headingGradient: mode === 'dark'
        ? 'linear-gradient(45deg, #ff4081 30%, #ffb74d 90%)'
        : 'linear-gradient(45deg, #e91e63 30%, #ff9800 90%)',
      badge: '🎉',
      btnColor: 'linear-gradient(45deg, #e91e63 0%, #ff9800 100%)',
      hoverBtnColor: 'linear-gradient(45deg, #c2185b 0%, #e64a19 100%)'
    };
  }

  // 8. GENERAL HOLIDAYS
  return {
    emojis: ['🏖️', '🌴', '✈️', '🕶️', '🥥', '✨'],
    colors: ['#2196F3', '#00BCD4', '#4CAF50', '#FFEB3B', '#9E9E9E'],
    borderColor: mode === 'dark' ? '#00bcd4' : '#0288d1',
    shadowColor: mode === 'dark' ? 'rgba(0, 188, 212, 0.4)' : 'rgba(2, 136, 209, 0.25)',
    gradientBg: mode === 'dark'
      ? 'linear-gradient(135deg, #07233b 0%, #031220 60%, #01070e 100%)'
      : 'linear-gradient(135deg, #e1f5fe 0%, #e0f7fa 60%, #e8f5e9 100%)',
    headingGradient: mode === 'dark'
      ? 'linear-gradient(45deg, #4fc3f7 30%, #81c784 90%)'
      : 'linear-gradient(45deg, #0288d1 30%, #2e7d32 90%)',
    badge: '🏖️',
    btnColor: 'linear-gradient(45deg, #0288d1 0%, #2e7d32 100%)',
    hoverBtnColor: 'linear-gradient(45deg, #01579b 0%, #1b5e20 100%)'
  };
};

export default function SpecialDayGreetingPopup() {
  const theme = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [popupType, setPopupType] = useState(null); // 'ANNIVERSARY' or 'HOLIDAY'
  const [data, setData] = useState(null);
  const [floatingParticles, setFloatingParticles] = useState([]);
  const [closing, setClosing] = useState(false);

  // Check on mount if we should show the popup
  useEffect(() => {
    axios.get('/api/master/hr/employees/birthdays/check-special-days')
      .then((response) => {
        if (!response.data) return;

        const resData = response.data;
        const todayStr = new Date().toISOString().split('T')[0];

        // 1. Check Work Anniversary (Welcome or Yearly)
        if (resData.showWorkAnniversaryPopup) {
          const shownKey = `work_anniv_shown_${resData.empCode}_${todayStr}`;
          if (!localStorage.getItem(shownKey)) {
            setData(resData);
            setPopupType('WORK_ANNIVERSARY');
            setOpen(true);
            triggerFloatingParticles('WORK_ANNIVERSARY');
            return; // Show work anniversary first
          }
        }

        // 2. Check Marriage Anniversary
        if (resData.showAnniversaryPopup) {
          const shownKey = `anniversary_shown_${resData.empCode}_${todayStr}`;
          if (!localStorage.getItem(shownKey)) {
            setData(resData);
            setPopupType('ANNIVERSARY');
            setOpen(true);
            triggerFloatingParticles('ANNIVERSARY');
            return; // Show marriage anniversary next
          }
        }

        // 3. Check Holiday
        if (resData.showHolidayPopup) {
          const shownKey = `holiday_shown_${resData.empCode}_${resData.holidayName}_${todayStr}`;
          if (!localStorage.getItem(shownKey)) {
            setData(resData);
            setPopupType('HOLIDAY');
            setOpen(true);
            triggerFloatingParticles('HOLIDAY', resData.holidayName, resData.holidayType);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to check special days popup:', err);
      });
  }, []);

  const triggerFloatingParticles = (type, holidayName = '', holidayType = '') => {
    const list = [];
    let emojis = ['💖', '💕', '🥂', '💑', '✨', '💍'];
    let colors = ['#FF2E93', '#FF8A00', '#FF007A', '#FFB7B7', '#D100D1'];

    if (type === 'WORK_ANNIVERSARY') {
      emojis = ['🎉', '💼', '🚀', '🌟', '🏆', '🎊'];
      colors = ['#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0'];
    } else if (type === 'HOLIDAY') {
      const hTheme = getHolidayTheme(holidayName, holidayType, theme.palette.mode);
      emojis = hTheme.emojis;
      colors = hTheme.colors;
    }
    
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
    setFloatingParticles(list);
  };

  const handleClose = () => {
    if (closing) return;
    setClosing(true);

    const todayStr = new Date().toISOString().split('T')[0];

    // Mark current popup as shown in localStorage when closed
    if (popupType === 'WORK_ANNIVERSARY' && data) {
      const shownKey = `work_anniv_shown_${data.empCode}_${todayStr}`;
      localStorage.setItem(shownKey, 'true');
    } else if (popupType === 'ANNIVERSARY' && data) {
      const shownKey = `anniversary_shown_${data.empCode}_${todayStr}`;
      localStorage.setItem(shownKey, 'true');
    } else if (popupType === 'HOLIDAY' && data) {
      const shownKey = `holiday_shown_${data.empCode}_${data.holidayName}_${todayStr}`;
      localStorage.setItem(shownKey, 'true');
    }

    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      
      // After closing work anniversary, check marriage anniversary then holiday
      if (popupType === 'WORK_ANNIVERSARY' && data) {
        if (data.showAnniversaryPopup) {
          const shownKey = `anniversary_shown_${data.empCode}_${todayStr}`;
          if (!localStorage.getItem(shownKey)) {
            setPopupType('ANNIVERSARY');
            setOpen(true);
            triggerFloatingParticles('ANNIVERSARY');
            return;
          }
        }
        if (data.showHolidayPopup) {
          const shownKey = `holiday_shown_${data.empCode}_${data.holidayName}_${todayStr}`;
          if (!localStorage.getItem(shownKey)) {
            setPopupType('HOLIDAY');
            setOpen(true);
            triggerFloatingParticles('HOLIDAY', data.holidayName, data.holidayType);
          }
        }
      }
      
      // After closing anniversary, check if we also have a holiday popup to show
      if (popupType === 'ANNIVERSARY' && data && data.showHolidayPopup) {
        const shownKey = `holiday_shown_${data.empCode}_${data.holidayName}_${todayStr}`;
        if (!localStorage.getItem(shownKey)) {
          setPopupType('HOLIDAY');
          setOpen(true);
          triggerFloatingParticles('HOLIDAY', data.holidayName, data.holidayType);
        }
      }
    }, 300);
  };

  if (!open || !data) return null;

  const keyframes = `
    @keyframes particleFloatUp {
      0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(-120vh) rotate(360deg) translateX(30px); opacity: 0; }
    }
    @keyframes modalPulseIn {
      0% { transform: scale(0.95); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes bgGlowEffect {
      0%, 100% { filter: drop-shadow(0 0 15px rgba(233, 30, 99, 0.4)); }
      50% { filter: drop-shadow(0 0 30px rgba(156, 39, 176, 0.7)); }
    }
    @keyframes rotateSparkle {
      0% { transform: rotate(0deg) scale(0.8); opacity: 0.5; }
      50% { transform: rotate(180deg) scale(1.2); opacity: 1; }
      100% { transform: rotate(360deg) scale(0.8); opacity: 0.5; }
    }
  `;

  const isAnniversary = popupType === 'ANNIVERSARY';
  const isWorkAnniversary = popupType === 'WORK_ANNIVERSARY';
  const currentCompany = user?.companyName || sessionStorage.getItem('companyName') || 'Autonoma';

  // Theme Config
  let dialogBorderColor = '';
  let dialogShadow = '';
  let gradientBg = '';
  let headingGradient = '';
  let badgeIcon = '🎉';
  let bannerEmojis = ['🎈', '🌟', '🏖️'];
  let btnBg = '';
  let btnHoverBg = '';

  if (isWorkAnniversary) {
    dialogBorderColor = theme.palette.mode === 'dark' ? '#ff9800' : '#ffc107';
    dialogShadow = theme.palette.mode === 'dark' ? '0 25px 60px rgba(255, 152, 0, 0.35)' : '0 25px 60px rgba(255, 193, 7, 0.25)';
    gradientBg = theme.palette.mode === 'dark' 
      ? 'linear-gradient(135deg, #1f1406 0%, #0d0a03 60%, #050401 100%)' 
      : 'linear-gradient(135deg, #fffde7 0%, #fffae6 60%, #fff8e1 100%)';
    headingGradient = theme.palette.mode === 'dark'
      ? 'linear-gradient(45deg, #ffc107 30%, #ff5722 90%)'
      : 'linear-gradient(45deg, #ff9800 30%, #ff5722 90%)';
    badgeIcon = '💼';
    bannerEmojis = ['🎉', '🚀', '🌟'];
    btnBg = 'linear-gradient(45deg, #ff9800 0%, #ff5722 100%)';
    btnHoverBg = 'linear-gradient(45deg, #e65100 0%, #ff3d00 100%)';
  } else if (isAnniversary) {
    dialogBorderColor = theme.palette.mode === 'dark' ? '#ff4081' : '#e91e63';
    dialogShadow = theme.palette.mode === 'dark' ? '0 25px 60px rgba(255, 64, 129, 0.35)' : '0 25px 60px rgba(233, 30, 99, 0.25)';
    gradientBg = theme.palette.mode === 'dark' 
      ? 'linear-gradient(135deg, #2b0c1b 0%, #0d061c 60%, #06030c 100%)' 
      : 'linear-gradient(135deg, #fff0f5 0%, #fffbfc 60%, #fef5ff 100%)';
    headingGradient = theme.palette.mode === 'dark'
      ? 'linear-gradient(45deg, #ff4081 30%, #ff80ab 90%)'
      : 'linear-gradient(45deg, #e91e63 30%, #f50057 90%)';
    badgeIcon = '💑';
    bannerEmojis = ['💖', '🥂', '💍'];
    btnBg = 'linear-gradient(45deg, #e91e63 0%, #ff4081 100%)';
    btnHoverBg = 'linear-gradient(45deg, #c2185b 0%, #f50057 100%)';
  } else {
    const hTheme = getHolidayTheme(data.holidayName, data.holidayType, theme.palette.mode);
    dialogBorderColor = hTheme.borderColor;
    dialogShadow = hTheme.shadowColor;
    gradientBg = hTheme.gradientBg;
    headingGradient = hTheme.headingGradient;
    badgeIcon = hTheme.badge;
    bannerEmojis = [hTheme.emojis[0] || '🎉', hTheme.emojis[1] || '🌟', hTheme.emojis[2] || '🏖️'];
    btnBg = hTheme.btnColor;
    btnHoverBg = hTheme.hoverBtnColor;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
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
          background: gradientBg,
          border: '2px solid',
          borderColor: dialogBorderColor,
          boxShadow: dialogShadow,
          animation: 'modalPulseIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
          position: 'relative',
          p: 1.5,
          zIndex: 1500
        }
      }}
    >
      <style>{keyframes}</style>

      {/* Floating Particles background animation */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          pointerEvents: 'none',
          borderRadius: '24px',
          zIndex: 0
        }}
      >
        {floatingParticles.map((p) => (
          <Box
            key={p.id}
            sx={{
              position: 'absolute',
              left: `${p.left}%`,
              bottom: '-50px',
              fontSize: `${20 * p.scale}px`,
              opacity: 0,
              color: p.color,
              animation: `particleFloatUp ${p.duration}s cubic-bezier(0.25, 0.1, 0.25, 1) ${p.delay}s infinite`
            }}
          >
            {p.emoji}
          </Box>
        ))}
      </Box>

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
      <Box sx={{ position: 'absolute', top: '10%', left: '8%', animation: 'rotateSparkle 6s infinite', color: isAnniversary ? '#ff4081' : '#4caf50', zIndex: 1 }}><IconSparkles size={24} /></Box>
      <Box sx={{ position: 'absolute', top: '20%', right: '10%', animation: 'rotateSparkle 8s infinite 1s', color: isAnniversary ? '#9c27b0' : '#00bcd4', zIndex: 1 }}><IconSparkles size={20} /></Box>
      <Box sx={{ position: 'absolute', bottom: '15%', left: '12%', animation: 'rotateSparkle 7s infinite 2s', color: isAnniversary ? '#e91e63' : '#ff9800', zIndex: 1 }}><IconSparkles size={22} /></Box>

      {/* Main Container */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          py: 4,
          px: 3,
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Large Celebration Icons */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          <Box sx={{ fontSize: '2.5rem', animation: 'rotateSparkle 4s infinite' }}>{bannerEmojis[0]}</Box>
          <Box sx={{ fontSize: '3.5rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' }}>{bannerEmojis[1]}</Box>
          <Box sx={{ fontSize: '2.5rem', animation: 'rotateSparkle 5s infinite 0.5s' }}>{bannerEmojis[2]}</Box>
        </Box>

        {/* Employee Profile Photo (Anniversary Only) or Holiday Icon (Holidays) */}
        <Box sx={{ position: 'relative', mb: 3, animation: 'bgGlowEffect 4s infinite alternate' }}>
          {(isAnniversary || isWorkAnniversary) ? (
            data.photoPath ? (
              <Avatar
                src={getPhotoUrl(data.photoPath)}
                alt={data.employeeName}
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '24px',
                  border: '4px solid',
                  borderColor: dialogBorderColor,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '24px',
                  border: '4px solid',
                  borderColor: dialogBorderColor,
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  bgcolor: getColorFromText(data.employeeName),
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                }}
              >
                {getInitials(data.employeeName)}
              </Avatar>
            )
          ) : (
            // Beautiful Holiday Badge Icon instead of Employee Photo!
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '24px',
                border: '4px solid',
                borderColor: dialogBorderColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4.5rem',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                position: 'relative'
              }}
            >
              {renderBadgeIcon(badgeIcon)}
            </Box>
          )}

          {(isAnniversary || isWorkAnniversary) && (
            <Box
              sx={{
                position: 'absolute',
                bottom: -6,
                right: -6,
                bgcolor: dialogBorderColor,
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
              {isWorkAnniversary ? '💼' : '💑'}
            </Box>
          )}
        </Box>

        {/* Greeting Heading */}
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '1.6rem', sm: '2rem' },
            background: headingGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            px: 2
          }}
        >
          {isWorkAnniversary ? (
            data.yearsOfWork > 0 ? `Happy Work Anniversary, ${data.employeeName}! 🎊` : `Welcome to ${currentCompany}, ${data.employeeName}! 🎉`
          ) : isAnniversary ? (
            `Happy Marriage Anniversary, ${data.employeeName}! 💖`
          ) : (
            data.isAdvancedWish ? `Advanced Happy ${data.holidayName}! 🎉` : `Happy ${data.holidayName}! 🎉`
          )}
        </Typography>

        {/* Greeting Message */}
        <Box sx={{ maxWidth: '440px', mb: 4, px: 2 }}>
          <Typography
            variant="body1"
            sx={{
              fontSize: '1.1rem',
              lineHeight: 1.6,
              fontWeight: 500,
              color: theme.palette.text.primary
            }}
          >
            {isWorkAnniversary ? (
              data.yearsOfWork > 0 ? (
                `Congratulations on completing ${data.yearsOfWork} ${data.yearsOfWork === 1 ? 'year' : 'years'} with ${currentCompany}! Your hard work and dedication mean the world to us. Wishing you continued success! 🚀`
              ) : (
                `We are thrilled to have you join ${currentCompany}! Wishing you a wonderful and successful journey with us. Welcome aboard! 🌟`
              )
            ) : isAnniversary ? (
              data.yearsOfMarriage > 0 ? (
                `Wishing you and your partner a beautiful celebration of your ${data.yearsOfMarriage} years of marriage! May your bond grow stronger with each passing year, and may your life be filled with love and laughter. 🥂`
              ) : (
                `Wishing you and your partner a beautiful marriage anniversary celebration! May your bond grow stronger with each passing year, and may your life be filled with love and laughter. 🥂`
              )
            ) : (
              `Wishing you a wonderful and relaxing holiday ahead! Enjoy your time off with family and friends. Warm wishes from all of us at ${currentCompany}! 🏖️`
            )}
          </Typography>
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          onClick={handleClose}
          sx={{
            background: btnBg,
            color: '#fff',
            px: 4,
            py: 1.2,
            fontSize: '1rem',
            fontWeight: 800,
            borderRadius: '12px',
            boxShadow: `0 6px 20px ${dialogBorderColor}66`,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
              background: btnHoverBg
            }
          }}
        >
          {isWorkAnniversary ? 'Thank You! 🎊' : isAnniversary ? 'Thank You! ❤️' : 'Thank You! 🎉'}
        </Button>
      </Box>
    </Dialog>
  );
}
