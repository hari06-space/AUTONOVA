import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// material-ui
import { useTheme, useColorScheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { keyframes } from '@mui/system';

// icons
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LanguageIcon from '@mui/icons-material/Language';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import WifiIcon from '@mui/icons-material/Wifi';
import Wifi1BarIcon from '@mui/icons-material/SignalWifi1Bar';
import Wifi2BarIcon from '@mui/icons-material/SignalWifi2Bar';
import Wifi4BarIcon from '@mui/icons-material/SignalWifi4Bar';

// App version from package.json (injected by Vite define)
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

const breatheGlow = keyframes`
  0% { box-shadow: 0 8px 32px rgba(0, 114, 255, 0.2), 0 0 0 1px rgba(255,255,255,0.1) inset; }
  50% { box-shadow: 0 12px 40px rgba(0, 198, 255, 0.4), 0 0 0 1px rgba(255,255,255,0.2) inset; }
  100% { box-shadow: 0 8px 32px rgba(0, 114, 255, 0.2), 0 0 0 1px rgba(255,255,255,0.1) inset; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

/** Format bits/s into human-readable speed */
function formatSpeed(bps) {
  if (bps === null) return '—';
  if (bps < 1000) return `${Math.round(bps)} bps`;
  if (bps < 1_000_000) return `${(bps / 1000).toFixed(1)} Kbps`;
  return `${(bps / 1_000_000).toFixed(1)} Mbps`;
}

/** Returns a color based on speed (bits/s) */
function speedColor(bps) {
  if (bps === null) return 'rgba(255,255,255,0.4)'; // Fallback color handled dynamically later
  if (bps < 50_000) return '#ff4444';      // < 50 kbps — red (very slow)
  if (bps < 1_000_000) return '#ffaa00';   // < 1 Mbps — amber
  return '#00e676';                         // >= 1 Mbps — green
}

/** Returns appropriate Wifi icon component */
function SpeedIcon({ bps }) {
  const style = { fontSize: '0.9rem' };
  if (bps === null) return <WifiIcon style={{ ...style, opacity: 0.4 }} />;
  if (bps < 50_000) return <Wifi1BarIcon style={style} />;
  if (bps < 1_000_000) return <Wifi2BarIcon style={style} />;
  return <Wifi4BarIcon style={style} />;
}

/**
 * Real-time network speed monitor.
 * Uses PerformanceObserver to passively measure the speed of actual network requests
 * happening in the app. Zero background polling = zero lag on 10kbps connections.
 */
function useNetworkSpeed() {
  const [speed, setSpeed] = useState(null); // bits/sec

  useEffect(() => {
    // Modern way: navigator.connection gives real-time Mbps (supported in Chrome/Edge)
    if (navigator.connection && 'downlink' in navigator.connection) {
      const updateSpeed = () => {
        // downlink is in Mbps, convert to bps
        const bps = navigator.connection.downlink * 1_000_000;
        setSpeed(bps);
      };

      updateSpeed();
      navigator.connection.addEventListener('change', updateSpeed);

      const onOffline = () => setSpeed(0);
      window.addEventListener('offline', onOffline);
      window.addEventListener('online', updateSpeed);

      return () => {
        navigator.connection.removeEventListener('change', updateSpeed);
        window.removeEventListener('offline', onOffline);
        window.removeEventListener('online', updateSpeed);
      };
    }

    // Fallback for Safari/Firefox
    const doInitialPing = async () => {
      try {
        const start = performance.now();
        const res = await fetch(`/?_t=${Date.now()}`, { cache: 'no-store', method: 'HEAD' });
        const elapsed = (performance.now() - start) / 1000;
        if (res.ok && elapsed > 0) {
          setSpeed(Math.round(2400 / elapsed));
        }
      } catch { }
    };
    doInitialPing();

    let recentBits = 0;
    let recentDurationMs = 0;
    let timeoutId = null;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.transferSize > 0 && entry.duration > 0) {
          recentBits += entry.transferSize * 8;
          recentDurationMs += entry.duration;
        }
      }

      if (!timeoutId && recentBits > 0) {
        timeoutId = setTimeout(() => {
          const calculatedBps = Math.round(recentBits / (recentDurationMs / 1000));
          if (calculatedBps > 0 && calculatedBps < 10000000000) {
            setSpeed(calculatedBps);
          }
          recentBits = 0;
          recentDurationMs = 0;
          timeoutId = null;
        }, 1000);
      }
    });

    try {
      observer.observe({ type: 'resource', buffered: true });
    } catch (e) {
      // Ignore unsupported browsers
    }

    const onOffline = () => setSpeed(0);
    const onOnline = () => doInitialPing();
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);

    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return speed;
}

export default function Footer() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const isToggled = isHovered || isClicked;

  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/apps/chat');

  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const computedMode = mode === 'system' ? systemMode : mode;
  const isDark = computedMode === 'dark';

  const hideTimeoutRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const footerRef = useRef(null);

  // Live clock — only triggers a re-render when the displayed second changes.
  const [clockDate, setClockDate] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => {
      setClockDate((prev) => {
        const next = new Date();
        if (
          prev.getSeconds() === next.getSeconds() &&
          prev.getMinutes() === next.getMinutes() &&
          prev.getHours() === next.getHours()
        ) {
          return prev;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const _realNow = new Date();
  const now = {
    toLocaleTimeString: () => clockDate.toLocaleTimeString(),
    toLocaleDateString: (...args) => _realNow.toLocaleDateString(...args),
    getFullYear: () => _realNow.getFullYear(),
    _str: clockDate.toLocaleTimeString()
  };

  // Network speed
  const networkSpeed = useNetworkSpeed();

  const handleDragStart = (e) => {
    if (e.type === 'mousedown' && e.button !== 0) return;
    setIsDragging(true);
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX - dragOffset;
  };

  useEffect(() => {
    const handleDragMove = (e) => {
      if (!isDragging) return;
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      let newOffset = clientX - dragStartX.current;
      if (footerRef.current) {
        const footerWidth = footerRef.current.offsetWidth;
        const maxOffset = (window.innerWidth / 2) - (footerWidth / 2) - 10;
        if (newOffset > maxOffset) newOffset = maxOffset;
        if (newOffset < -maxOffset) newOffset = -maxOffset;
      }
      setDragOffset(newOffset);
    };
    const handleDragEnd = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 200);
  };

  const handleCornerClick = (e) => {
    e?.stopPropagation();
    setIsClicked((prev) => {
      const nextState = !prev;
      if (!nextState) {
        setIsHovered(false);
      }
      return nextState;
    });
  };

  const handleManualHide = (e) => {
    e?.stopPropagation();
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsClicked(false);
    setIsHovered(false);
  };

  const bgGradient = isDark
    ? `linear-gradient(145deg, ${'background.paper'} 0%, ${'background.default'} 100%)`
    : `linear-gradient(145deg, ${'background.paper'} 0%, ${alpha(theme.palette.grey?.[50] || '#f8fafc', 0.85)} 100%)`;
  const borderStyle = `1px solid ${theme.palette.divider}`;
  const dividerStyle = `linear-gradient(to bottom, transparent, ${theme.palette.divider}, transparent)`;

  // Formatted date and time
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const netColor = speedColor(networkSpeed);
  const netLabel = networkSpeed === 0 ? 'Offline' : formatSpeed(networkSpeed);

  return (
    <Box
      className={isToggled ? 'toggled' : ''}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '0px',
        zIndex: 1300,
        pointerEvents: 'none',
        '& .footer-content': {
          transform: `translateX(calc(-50% + ${dragOffset}px)) translateY(120%) scale(0.9)`,
          opacity: 0,
          transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          pointerEvents: 'auto',
        },
        '&.toggled .footer-content': {
          transform: `translateX(calc(-50% + ${dragOffset}px)) translateY(0) scale(1) !important`,
          opacity: 1,
        }
      }}
    >
      {/* 100% Invisible Trigger at Bottom-Left */}
      <Box
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCornerClick}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '36px',
          height: '24px',
          pointerEvents: 'auto',
          cursor: 'default',
          zIndex: 1350,
          opacity: 0,
          background: 'transparent !important',
          backgroundColor: 'transparent !important',
          boxShadow: 'none !important',
          border: 'none !important'
        }}
      />

      <Stack
        ref={footerRef}
        className="footer-content"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        direction="row"
        spacing={2}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: `translateX(calc(-50% + ${dragOffset}px)) translateY(120%) scale(0.9) !important`,
          alignItems: 'center',
          justifyContent: 'center',
          py: 1.2,
          px: 3,
          mb: 0,
          cursor: isDragging ? 'grabbing' : 'grab',
          WebkitUserSelect: 'none', userSelect: 'none',
          background: bgGradient,
          WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)',
          borderRadius: 40,
          animation: `${breatheGlow} 4s ease-in-out infinite`,
          border: borderStyle,
          whiteSpace: 'nowrap',
          gap: 0
        }}
      >
        {/* Brand */}
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ opacity: 0.6, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px' }}>&copy; {now.getFullYear()}</span>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: theme.palette.primary.main }} />
          <span style={{
            color: theme.palette.primary.main,
            fontWeight: 900, letterSpacing: '0.5px', textTransform: 'uppercase'
          }}>
            Autonova System Pvt Ltd
          </span>
        </Typography>

        <span style={{ width: '1px', height: '18px', background: dividerStyle, margin: '0 8px' }} />

        {/* Version */}
        <Tooltip title="Application Version" arrow>
          <Chip
            label={`v${APP_VERSION}`}
            size="small"
            sx={{
              height: 20, fontSize: '0.62rem', fontWeight: 800,
              bgcolor: alpha(theme.palette.success.main, 0.12), color: theme.palette.success.main,
              border: `1px solid ${alpha(theme.palette.success.main, 0.25)}`,
              borderRadius: '4px', letterSpacing: '0.5px', cursor: 'default'
            }}
          />
        </Tooltip>

        <span style={{ width: '1px', height: '18px', background: dividerStyle, margin: '0 8px' }} />

        {/* Platform */}
        <Chip
          label="NextGen Platform"
          size="small"
          sx={{
            height: 20, fontSize: '0.62rem', fontWeight: 800,
            bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main,
            borderRadius: '4px', letterSpacing: '0.5px', textTransform: 'uppercase'
          }}
        />

        <span style={{ width: '1px', height: '18px', background: dividerStyle, margin: '0 8px' }} />

        {/* Date & Time */}
        <Tooltip title="Current Date & Time" arrow>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, cursor: 'default' }}>
            <span style={{ fontSize: '0.68rem', color: 'text.secondary', fontFamily: 'monospace', letterSpacing: '0.3px' }}>
              {dateStr}
            </span>
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: theme.palette.text.disabled }} />
            <span style={{
              fontSize: '0.7rem', color: 'text.primary',
              fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.5px',
              animation: `${pulse} 2s ease-in-out infinite`
            }}>
              {timeStr}
            </span>
          </Box>
        </Tooltip>

        <span style={{ width: '1px', height: '18px', background: dividerStyle, margin: '0 8px' }} />

        {/* Network Speed */}
        <Tooltip title={networkSpeed === 0 ? 'No network connection' : `Network speed: ${formatSpeed(networkSpeed)}\nUpdates every 10 seconds`} arrow>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'default' }}>
            <Box sx={{ color: netColor, display: 'flex', alignItems: 'center' }}>
              <SpeedIcon bps={networkSpeed} />
            </Box>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700,
              color: netColor, fontFamily: 'monospace',
              letterSpacing: '0.3px', minWidth: '52px',
              transition: 'color 0.3s ease'
            }}>
              {netLabel}
            </span>
          </Box>
        </Tooltip>

        <span style={{ width: '1px', height: '18px', background: dividerStyle, margin: '0 8px' }} />

        {/* Social links */}
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" component="a" href="https://autonovasys.com" target="_blank"
            sx={{ color: '#00C6FF', p: 0.5, transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', '&:hover': { transform: 'scale(1.2) translateY(-2px)', background: 'rgba(0, 198, 255, 0.15)', boxShadow: '0 4px 12px rgba(0,198,255,0.2)' } }}>
            <LanguageIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
          <IconButton size="small" component="a" href="#" target="_blank"
            sx={{ color: '#0A66C2', p: 0.5, transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', '&:hover': { transform: 'scale(1.2) translateY(-2px)', background: 'rgba(10, 102, 194, 0.15)', boxShadow: '0 4px 12px rgba(10,102,194,0.2)' } }}>
            <LinkedInIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
          <IconButton size="small" component="a" href="#" target="_blank"
            sx={{ color: '#1DA1F2', p: 0.5, transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', '&:hover': { transform: 'scale(1.2) translateY(-2px)', background: 'rgba(29, 161, 242, 0.15)', boxShadow: '0 4px 12px rgba(29,161,242,0.2)' } }}>
            <TwitterIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
          <IconButton size="small" component="a" href="#" target="_blank"
            sx={{ color: '#1877F2', p: 0.5, transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', '&:hover': { transform: 'scale(1.2) translateY(-2px)', background: 'rgba(24, 119, 242, 0.15)', boxShadow: '0 4px 12px rgba(24,119,242,0.2)' } }}>
            <FacebookIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
          <IconButton size="small" component="a" href="#" target="_blank"
            sx={{ color: '#E1306C', p: 0.5, transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', '&:hover': { transform: 'scale(1.2) translateY(-2px)', background: 'rgba(225, 48, 108, 0.15)', boxShadow: '0 4px 12px rgba(225,48,108,0.2)' } }}>
            <InstagramIcon sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Stack>

        <span style={{ width: '1px', height: '18px', background: dividerStyle, margin: '0 4px 0 8px' }} />

        {/* Hide button */}
        <IconButton
          size="small"
          onClick={handleManualHide}
          sx={{
            p: 0.5,
            color: 'text.secondary',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            '&:hover': { color: theme.palette.primary.main, transform: 'translateY(2px)', background: alpha(theme.palette.primary.main, 0.15) }
          }}
          title="Hide footer"
        >
          <KeyboardArrowDownIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      </Stack>
    </Box>
  );
}
