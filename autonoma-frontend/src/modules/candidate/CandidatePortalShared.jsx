import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  Tooltip,
  ClickAwayListener
} from '@mui/material';
import {
  IconMoon,
  IconSun,
  IconAlertCircle,
  IconDeviceFloppy
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import useConfig from 'hooks/useConfig';
import { playPortalSound } from 'utils/AudioEngine';

export const staticBgStylesheet = `
  body {
    overflow-x: hidden;
  }
  @media (max-width: 600px) {
    html, body {
      overflow-x: hidden !important;
      overflow-y: auto !important;
      max-width: 100vw !important;
      -webkit-overflow-scrolling: touch !important;
      scroll-behavior: smooth;
    }
    .welcome-card {
      padding: 20px 16px !important;
      border-radius: 18px !important;
      max-width: 100% !important;
      transition: none !important;
    }
    .welcome-card:active, .welcome-card:hover {
      transform: none !important;
    }
    .scan-ring {
      width: 300px !important;
      height: 300px !important;
      margin: -150px 0 0 -150px !important;
      opacity: 0.25 !important;
    }
    .scan-ring.inner {
      width: 220px !important;
      height: 220px !important;
      margin: -110px 0 0 -110px !important;
      opacity: 0.25 !important;
    }
    .blob.b1 {
      width: 280px !important;
      height: 280px !important;
    }
    .blob.b2 {
      width: 260px !important;
      height: 260px !important;
    }
    input, select, textarea {
      font-size: 16px !important;
    }
    .MuiContainer-root {
      padding-left: 12px !important;
      padding-right: 12px !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
    .MuiCardContent-root {
      padding: 16px 12px !important;
    }
    .MuiDialogContent-root {
      padding: 16px 12px !important;
      max-height: calc(100vh - 120px) !important;
      overflow-y: auto !important;
    }
    .MuiMenu-paper, .MuiPopover-paper, .MuiAutocomplete-paper {
      transition: none !important;
      animation: none !important;
      transform: none !important;
    }
    .MuiGrid-root, .MuiBox-root, .MuiCard-root, .MuiPaper-root {
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
    .responsive-table-scroll {
      width: 100% !important;
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
    .blob {
      display: none !important;
    }
    .splash-panel {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    .splash-star, .floating-chip, .scan-ring {
      display: none !important;
    }
    .onboarding-bg {
      animation: none !important;
    }
  }
  @media (min-width: 2560px) {
    .MuiContainer-root {
      max-width: 1800px !important;
    }
  }
  .onboarding-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    background-size: 220% 220%;
    animation: meshShift 18s ease-in-out infinite;
    overflow: hidden;
    transition: background 0.4s ease;
    pointer-events: none;
  }
  .onboarding-bg.theme-light {
    background: linear-gradient(135deg, #eef1f6 0%, #e5eaf3 100%);
  }
  .onboarding-bg.theme-dark {
    background: linear-gradient(135deg, #0d1220 0%, #141b2c 100%);
  }
  @keyframes meshShift {
    0% { background-position: 0% 0%; }
    50% { background-position: 100% 100%; }
    100% { background-position: 0% 0%; }
  }
  #network {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.55;
  }
  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(55px);
    opacity: 0.45;
    will-change: transform;
  }
  .blob.b1 {
    width: 520px;
    height: 520px;
    top: -170px;
    left: -150px;
    background: radial-gradient(circle, rgba(124,140,248,0.35), transparent 70%);
    animation: drift1 20s ease-in-out infinite;
  }
  .blob.b2 {
    width: 460px;
    height: 460px;
    bottom: -170px;
    right: -130px;
    background: radial-gradient(circle, rgba(99,217,196,0.35), transparent 70%);
    animation: drift2 24s ease-in-out infinite;
  }
  .blob.b3 {
    width: 340px;
    height: 340px;
    top: 32%;
    left: 55%;
    background: radial-gradient(circle, rgba(180,170,255,0.25), transparent 70%);
    animation: drift3 27s ease-in-out infinite;
  }
  @keyframes drift1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(90px, 70px) scale(1.15); }
  }
  @keyframes drift2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-80px, -60px) scale(1.1); }
  }
  @keyframes drift3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-60px, 80px) scale(0.9); }
  }
  .floating-chip {
    position: absolute;
    bottom: -60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    box-shadow: 0 10px 24px -12px rgba(20,30,60,0.25);
    opacity: 0;
    animation: chipRise linear infinite;
  }
  .theme-light .floating-chip {
    background: #ffffff;
    border: 1px solid rgba(18,24,31,0.09);
  }
  .theme-dark .floating-chip {
    background: #1b2333;
    border: 1px solid rgba(255,255,255,0.12);
  }
  .floating-chip svg {
    width: 55%;
    height: 55%;
    fill: none;
  }
  .theme-light .floating-chip svg {
    stroke: rgba(90,100,190,0.8);
  }
  .theme-dark .floating-chip svg {
    stroke: rgba(140,155,255,0.8);
  }
  @keyframes chipRise {
    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
    10% { opacity: 0.85; }
    88% { opacity: 0.5; }
    100% { transform: translateY(-115vh) rotate(12deg); opacity: 0; }
  }
  .scan-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 640px;
    height: 640px;
    margin: -320px 0 0 -320px;
    border-radius: 50%;
    animation: rotateSlow 60s linear infinite;
    pointer-events: none;
  }
  .theme-light .scan-ring {
    border: 1px dashed rgba(90,100,190,0.18);
  }
  .theme-dark .scan-ring {
    border: 1px dashed rgba(140,155,255,0.18);
  }
  .scan-ring.inner {
    width: 480px;
    height: 480px;
    margin: -240px 0 0 -240px;
    animation-duration: 44s;
    animation-direction: reverse;
  }
  .theme-light .scan-ring.inner {
    border-color: rgba(90,100,190,0.14);
  }
  .theme-dark .scan-ring.inner {
    border-color: rgba(140,155,255,0.14);
  }
  .pulse-highlight-amber {
    box-shadow: none !important;
    animation: none !important;
  }
  @keyframes rotateSlow {
    to { transform: rotate(360deg); }
  }
  .check-pulse {
    animation: pop .5s ease both;
    transform-origin: center;
    transform-box: fill-box;
  }
  .check-pulse.c1 { animation-delay: 2.5s; }
  .check-pulse.c2 { animation-delay: 2.7s; }
  .check-pulse.c3 { animation-delay: 2.9s; }
  
  .success-pulse {
    animation: pop .6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    transform-origin: center;
    transform-box: fill-box;
  }
  .success-pulse.s1 { animation-delay: .2s; }
  .success-pulse.s2 { animation-delay: .4s; }
  .success-pulse.s3 { animation-delay: .6s; }

  @keyframes pop {
    0% { transform: scale(0); opacity: 0; }
    70% { transform: scale(1.12); opacity: 1; }
    100% { transform: scale(1); }
  }
  .lock-float {
    animation: floaty 4s ease-in-out infinite;
    transform-origin: center;
  }
  @keyframes floaty {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  .brand-mark span {
    width: 4px;
    border-radius: 2px;
    display: inline-block;
    animation: barPulse 2.4s ease-in-out infinite;
  }
  .theme-light .brand-mark span {
    background: #12181f;
  }
  .theme-dark .brand-mark span {
    background: #eef1f5;
  }
  .brand-mark span:nth-child(1) { height: 10px; animation-delay: 0s; }
  .brand-mark span:nth-child(2) { height: 26px; animation-delay: .2s; }
  .brand-mark span:nth-child(3) { height: 16px; animation-delay: .4s; }
  .brand-mark span:nth-child(4) { height: 22px; animation-delay: .6s; }
  @keyframes barPulse {
    0%, 100% { opacity: 0.55; transform: scaleY(0.85); }
    50% { opacity: 1; transform: scaleY(1); }
  }
  .cta-sweep-btn {
    position: relative;
    overflow: hidden;
    transition: transform .25s ease, box-shadow .25s ease;
  }
  .cta-sweep-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -60%;
    width: 40%;
    height: 100%;
    background: linear-gradient(120deg, transparent, rgba(255,255,255,0.55), transparent);
    transform: skewX(-20deg);
    animation: sweep 3.2s ease-in-out infinite;
  }
  @keyframes sweep {
    0% { left: -60%; }
    45% { left: 130%; }
    100% { left: 130%; }
  }
  .splash-container {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: opacity .7s ease, visibility .7s ease;
  }
  .theme-light .splash-container,
  .splash-container.theme-light {
    background: linear-gradient(135deg, #eef1f6, #e5eaf3);
  }
  .theme-dark .splash-container,
  .splash-container.theme-dark {
    background: linear-gradient(135deg, #0d1220, #141b2c);
  }
  .splash-ring {
    position: absolute;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    opacity: 0;
    animation: splashRing 1.8s ease-out .2s forwards;
  }
  .theme-light .splash-ring,
  .splash-container.theme-light .splash-ring {
    border: 1.5px solid rgba(90,100,190,0.35);
  }
  .theme-dark .splash-ring,
  .splash-container.theme-dark .splash-ring {
    border: 1.5px solid rgba(140,155,255,0.35);
  }
  .splash-ring.r2 { animation-delay: .5s; }
  @keyframes splashRing {
    0% { transform: scale(0.4); opacity: 0.8; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  .splash-mark {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 44px;
    margin-bottom: 22px;
  }
  .splash-mark span {
    width: 7px;
    border-radius: 3px;
    background: linear-gradient(180deg, #7c8cf8, #63d9c4);
    transform: scaleY(0);
    transform-origin: bottom;
    animation: growBar .6s cubic-bezier(.2,.8,.2,1) forwards;
  }
  .splash-mark span:nth-child(1) { height: 16px; animation-delay: .15s; }
  .splash-mark span:nth-child(2) { height: 44px; animation-delay: .28s; }
  .splash-mark span:nth-child(3) { height: 26px; animation-delay: .41s; }
  .splash-mark span:nth-child(4) { height: 36px; animation-delay: .54s; }
  @keyframes growBar { to { transform: scaleY(1); } }

  .splash-brand {
    opacity: 0;
    animation: fadeUp .6s .75s ease forwards;
  }
  .splash-greet {
    opacity: 0;
    animation: fadeUp .7s 1.05s ease forwards;
  }
  .splash-sub {
    opacity: 0;
    animation: fadeUp .6s 1.25s ease forwards;
  }
  .welcome-badge {
    opacity: 0;
    animation: fadeUp .6s 1.7s ease forwards;
  }
  @keyframes fadeUp {
    0% { transform: translateY(20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }

  /* Interactive Card Transformations */
  .MuiCard-root, .MuiPaper-root.MuiPaper-rounded {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .MuiCard-root:hover, .MuiPaper-root.MuiPaper-rounded:hover {
    transform: translateY(-4px);
  }
  .theme-dark .MuiCard-root:hover, .theme-dark .MuiPaper-root.MuiPaper-rounded:hover {
    box-shadow: 0 20px 35px -10px rgba(99, 102, 241, 0.15) !important;
    border-color: rgba(99, 102, 241, 0.3) !important;
  }
  .theme-light .MuiCard-root:hover, .theme-light .MuiPaper-root.MuiPaper-rounded:hover {
    box-shadow: 0 20px 35px -10px rgba(99, 102, 241, 0.1) !important;
    border-color: rgba(99, 102, 241, 0.2) !important;
  }

  /* Micro-animations for form inputs */
  .MuiOutlinedInput-root {
    transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease !important;
  }
  .MuiOutlinedInput-root.Mui-focused {
    background-color: rgba(99, 102, 241, 0.02) !important;
    box-shadow: 0 0 12px 2px rgba(99, 102, 241, 0.12) !important;
  }
  .theme-dark .MuiOutlinedInput-root:hover:not(.Mui-focused) .MuiOutlinedInput-notchedOutline {
    border-color: rgba(255, 255, 255, 0.25) !important;
  }
  .theme-light .MuiOutlinedInput-root:hover:not(.Mui-focused) .MuiOutlinedInput-notchedOutline {
    border-color: rgba(0, 0, 0, 0.25) !important;
  }

  /* Dynamic hover scale for interactive elements */
  .MuiButton-root, .MuiIconButton-root {
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease, box-shadow 0.25s ease !important;
  }
  .MuiButton-contained:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 20px rgba(99, 102, 241, 0.25) !important;
  }
  .MuiButton-outlined:hover {
    transform: translateY(-2px);
    background-color: rgba(99, 102, 241, 0.05) !important;
  }
  .MuiButton-root:active, .MuiIconButton-root:active {
    transform: translateY(0) scale(0.97) !important;
  }

  /* Responsive Grid Adjustments & Enhancements */
  @media (max-width: 600px) {
    .MuiCardContent-root {
      padding: 20px !important;
    }
    .MuiGrid-item {
      padding-top: 12px !important;
      padding-left: 12px !important;
    }
  }

  /* Custom glass scrollbar for desktop views */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  .theme-dark ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  .theme-light ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.4);
  }

  /* =====================================================
     BROWSER AUTOFILL OVERRIDE
     Eliminates the blue/white browser-injected autofill
     background on Chrome / Edge / WebKit for all portals.

     Technique: box-shadow inset fill overrides the
     browser's internal autofill background paint, which
     cannot be overridden with background-color alone.
     transition-delay keeps Chrome from flashing the
     yellow/blue tint during animation.
  ===================================================== */

  /* Dark theme autofill */
  .theme-dark input:-webkit-autofill,
  .theme-dark input:-webkit-autofill:hover,
  .theme-dark input:-webkit-autofill:focus,
  .theme-dark input:-webkit-autofill:active,
  .theme-dark textarea:-webkit-autofill,
  .theme-dark textarea:-webkit-autofill:hover,
  .theme-dark textarea:-webkit-autofill:focus,
  .theme-dark textarea:-webkit-autofill:active,
  .theme-dark select:-webkit-autofill,
  .theme-dark select:-webkit-autofill:hover,
  .theme-dark select:-webkit-autofill:focus,
  .theme-dark select:-webkit-autofill:active {
    /* Paint dark theme input background over browser's injection */
    -webkit-box-shadow: 0 0 0 1000px #0f172a inset !important;
    box-shadow: 0 0 0 1000px #0f172a inset !important;
    /* Match existing text color for dark theme */
    -webkit-text-fill-color: #e2e8f0 !important;
    /* Prevent the flash tint during transition */
    transition: background-color 9999s ease-in-out 0s,
                border-color 0.25s ease,
                box-shadow 0.25s ease !important;
    border-radius: inherit;
    caret-color: #e2e8f0;
  }

  /* Light theme autofill */
  .theme-light input:-webkit-autofill,
  .theme-light input:-webkit-autofill:hover,
  .theme-light input:-webkit-autofill:focus,
  .theme-light input:-webkit-autofill:active,
  .theme-light textarea:-webkit-autofill,
  .theme-light textarea:-webkit-autofill:hover,
  .theme-light textarea:-webkit-autofill:focus,
  .theme-light textarea:-webkit-autofill:active,
  .theme-light select:-webkit-autofill,
  .theme-light select:-webkit-autofill:hover,
  .theme-light select:-webkit-autofill:focus,
  .theme-light select:-webkit-autofill:active {
    /* Paint light theme input background over browser's injection */
    -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
    box-shadow: 0 0 0 1000px #ffffff inset !important;
    /* Match existing text color for light theme */
    -webkit-text-fill-color: #1e293b !important;
    /* Prevent the flash tint during transition */
    transition: background-color 9999s ease-in-out 0s,
                border-color 0.25s ease,
                box-shadow 0.25s ease !important;
    border-radius: inherit;
    caret-color: #1e293b;
  }

  /* Keep focus glow when an autofilled field is focused — 
     override the inset shadow with focus + autofill combined */
  .theme-dark .MuiOutlinedInput-root.Mui-focused input:-webkit-autofill,
  .theme-dark .MuiOutlinedInput-root.Mui-focused textarea:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #0f172a inset,
                        0 0 12px 2px rgba(99, 102, 241, 0.12) !important;
    box-shadow: 0 0 0 1000px #0f172a inset,
                0 0 12px 2px rgba(99, 102, 241, 0.12) !important;
  }
  .theme-light .MuiOutlinedInput-root.Mui-focused input:-webkit-autofill,
  .theme-light .MuiOutlinedInput-root.Mui-focused textarea:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #ffffff inset,
                        0 0 12px 2px rgba(99, 102, 241, 0.06) !important;
    box-shadow: 0 0 0 1000px #ffffff inset,
                0 0 12px 2px rgba(99, 102, 241, 0.06) !important;
  }

  /* Hardware Accelerated Zero-Lag Loading Spinner Animations */
  @keyframes smoothSpin {
    0% { transform: rotate(0deg) translateZ(0); }
    100% { transform: rotate(360deg) translateZ(0); }
  }
  @keyframes pulseDot {
    0% { transform: scale(0.7); opacity: 0.5; }
    100% { transform: scale(1.1); opacity: 1; }
  }
  @keyframes pulseText {
    0% { opacity: 0.75; }
    100% { opacity: 1; }
  }
`;

export const SmoothLoadingSpinner = ({ size = 52, color = '#7c8cf8', label = '' }) => {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2.5}>
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Sleek single-ring hardware-accelerated spinner */}
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: `3px solid ${color}25`,
            borderTopColor: color,
            borderRightColor: color,
            animation: 'smoothSpin 0.8s linear infinite',
            willChange: 'transform',
            transform: 'translateZ(0)',
            boxShadow: `0 0 16px ${color}30`
          }}
        />
      </Box>

      {label && (
        <Typography
          variant="subtitle1"
          sx={{
            color: 'inherit',
            fontWeight: 600,
            fontFamily: "'Manrope', sans-serif",
            letterSpacing: '0.3px',
            textAlign: 'center'
          }}
        >
          {label}
        </Typography>
      )}
    </Stack>
  );
};
export const CandidateNetworkBackground = React.memo(({ themeMode }) => {
  const canvasRef = useRef(null);
  const themeModeRef = useRef(themeMode);

  useEffect(() => {
    themeModeRef.current = themeMode;
  }, [themeMode]);

  // Pre-generate stable floating chip styles once with useMemo
  const floatingChipsData = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => ({
      size: 30 + Math.random() * 12,
      left: Math.random() * 100,
      duration: 18 + Math.random() * 12,
      delay: Math.random() * 12
    }));
  }, []);

  useEffect(() => {
    // Only bypass animation if system prefers reduced motion
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;
    let particles = [];
    let animationFrameId;
    let isPageVisible = true;

    const resize = () => {
      if (!canvas) return;
      W = canvas.width = canvas.clientWidth * window.devicePixelRatio;
      H = canvas.height = canvas.clientHeight * window.devicePixelRatio;

      // Particle count optimized for mobile & desktop performance
      const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
      const count = Math.floor((canvas.clientWidth * canvas.clientHeight) / 40000);
      const particleCount = isMobile ? 12 : Math.max(16, Math.min(count, 30));

      if (particles.length === 0) {
        for (let i = 0; i < particleCount; i++) {
          particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - 0.5) * 0.3 * window.devicePixelRatio,
            vy: (Math.random() - 0.5) * 0.3 * window.devicePixelRatio,
            r: (1.8 + Math.random() * 2.2) * window.devicePixelRatio
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const maxDist = 150 * window.devicePixelRatio;
    const maxDistSq = maxDist * maxDist;

    const step = () => {
      if (!isPageVisible) return;
      ctx.clearRect(0, 0, W, H);
      const currentTheme = themeModeRef.current;
      const lineColor = currentTheme === 'light' ? '90,100,190' : '140,155,255';
      const lineWidth = 1.0 * window.devicePixelRatio;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            ctx.strokeStyle = `rgba(${lineColor}, ${0.28 * (1 - dist / maxDist)})`;
            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      const particleFillStyle = `rgba(${lineColor}, 0.8)`;
      for (const p of particles) {
        ctx.fillStyle = particleFillStyle;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(step);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPageVisible = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      } else {
        if (!isPageVisible) {
          isPageVisible = true;
          animationFrameId = requestAnimationFrame(step);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    step();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const chips = [
    'M6 3h9l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 01-1-1z M15 3v5h5 M8 13h8M8 16.5h8M8 9.5h4',
    'M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z M9 12l2 2 4-4',
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
  ];

  // Disable rising chips if reduced motion is preferred
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      <Box className={`onboarding-bg theme-${themeMode}`}>
        <canvas ref={canvasRef} id="network" />
      </Box>
    );
  }

  return (
    <Box className={`onboarding-bg theme-${themeMode}`}>
      <div className="blob b1"></div>
      <div className="blob b2"></div>
      <div className="blob b3"></div>
      <canvas ref={canvasRef} id="network" />
      {floatingChipsData.map((chipStyle, i) => (
        <div
          key={i}
          className="floating-chip"
          style={{
            width: `${chipStyle.size}px`,
            height: `${chipStyle.size}px`,
            left: `${chipStyle.left}%`,
            animationDuration: `${chipStyle.duration}s`,
            animationDelay: `${chipStyle.delay}s`
          }}
        >
          <svg viewBox="0 0 24 24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d={chips[i % chips.length]} />
          </svg>
        </div>
      ))}
    </Box>
  );
});

const splashStyles = `
  /* =============================================
     PREMIUM CANDIDATE PORTAL SPLASH
     Industry-level animation system
  ============================================= */

  .splash-container {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* === Deep cosmos background === */
  .splash-container.theme-dark {
    background: radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.06) 0%, transparent 45%),
                radial-gradient(ellipse at 60% 80%, rgba(139,92,246,0.07) 0%, transparent 40%),
                linear-gradient(180deg, #020408 0%, #060d1a 50%, #040910 100%);
  }
  .splash-container.theme-light {
    background: radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.06) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.04) 0%, transparent 45%),
                linear-gradient(180deg, #f8faff 0%, #eef2ff 50%, #f0fdf4 100%);
  }

  /* === Animated ambient blobs behind panel === */
  .splash-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(70px);
    pointer-events: none;
    animation: blobFloat linear infinite alternate;
  }
  .splash-blob.sb1 {
    width: 500px; height: 500px;
    top: -200px; left: -150px;
    animation-duration: 14s;
  }
  .splash-blob.sb2 {
    width: 400px; height: 400px;
    bottom: -150px; right: -100px;
    animation-duration: 18s;
    animation-delay: -6s;
  }
  .splash-blob.sb3 {
    width: 300px; height: 300px;
    top: 40%; left: 55%;
    animation-duration: 22s;
    animation-delay: -10s;
  }
  .theme-dark .splash-blob.sb1 { background: radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%); }
  .theme-dark .splash-blob.sb2 { background: radial-gradient(circle, rgba(16,185,129,0.2), transparent 70%); }
  .theme-dark .splash-blob.sb3 { background: radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%); }
  .theme-light .splash-blob.sb1 { background: radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%); }
  .theme-light .splash-blob.sb2 { background: radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%); }
  .theme-light .splash-blob.sb3 { background: radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%); }
  @keyframes blobFloat {
    0% { transform: translate(0,0) scale(1); }
    33% { transform: translate(40px, -30px) scale(1.08); }
    66% { transform: translate(-25px, 45px) scale(0.95); }
    100% { transform: translate(20px, 15px) scale(1.04); }
  }

  /* === Floating star particles === */
  .splash-star {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    animation: starTwinkle ease-in-out infinite alternate;
  }
  .theme-dark .splash-star { background: rgba(255,255,255,0.7); }
  .theme-light .splash-star { background: rgba(99,102,241,0.5); }
  @keyframes starTwinkle {
    0% { opacity: 0.1; transform: scale(0.6); }
    100% { opacity: 0.9; transform: scale(1.3); }
  }

  /* === Center glass panel === */
  .splash-panel {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 52px 60px 44px;
    border-radius: 32px;
    max-width: 540px;
    width: 92%;
    text-align: center;
    opacity: 0;
    transform: translateY(32px) scale(0.96);
    animation: panelReveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards;
  }
  .theme-dark .splash-panel {
    background: rgba(8, 14, 28, 0.72);
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow:
      0 0 0 1px rgba(99,102,241,0.08),
      0 32px 64px -16px rgba(0,0,0,0.6),
      inset 0 1px 0 rgba(255,255,255,0.05),
      0 0 80px -20px rgba(99,102,241,0.15);
    backdrop-filter: blur(24px) saturate(180%);
  }
  .theme-light .splash-panel {
    background: rgba(255,255,255,0.82);
    border: 1px solid rgba(99,102,241,0.12);
    box-shadow:
      0 32px 64px -16px rgba(99,102,241,0.12),
      0 8px 24px rgba(0,0,0,0.06),
      inset 0 1px 0 rgba(255,255,255,0.9);
    backdrop-filter: blur(24px) saturate(160%);
  }
  @keyframes panelReveal {
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* === Top accent line on panel === */
  .splash-panel::before {
    content: '';
    position: absolute;
    top: 0; left: 24px; right: 24px;
    height: 1px;
    border-radius: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.6) 30%, rgba(16,185,129,0.6) 70%, transparent);
    animation: accentPulse 3s ease-in-out infinite;
  }
  @keyframes accentPulse {
    0%,100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  /* === Logo orbit system === */
  .splash-logo-system {
    position: relative;
    width: 160px;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
  }

  /* Outer dashed orbit ring */
  .splash-orbit-outer {
    position: absolute;
    inset: -18px;
    border-radius: 50%;
    border: 1px dashed rgba(99,102,241,0.22);
    animation: orbitSpin1 28s linear infinite;
  }
  /* Outer orbit dot */
  .splash-orbit-outer::before {
    content: '';
    position: absolute;
    top: -3px;
    left: 50%;
    width: 6px;
    height: 6px;
    margin-left: -3px;
    border-radius: 50%;
    background: #6366f1;
    box-shadow: 0 0 8px #6366f1, 0 0 16px rgba(99,102,241,0.6);
  }

  /* Mid orbit ring */
  .splash-orbit-mid {
    position: absolute;
    inset: -10px;
    border-radius: 50%;
    border: 1.5px solid transparent;
    background:
      linear-gradient(rgba(8,14,28,0) 0%, rgba(8,14,28,0) 100%) padding-box,
      conic-gradient(from 0deg, #6366f1, #10b981, #60a5fa, #a78bfa, #6366f1) border-box;
    animation: orbitSpin2 3.5s linear infinite;
    opacity: 0.7;
  }

  /* Inner glow ring */
  .splash-orbit-inner {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid transparent;
    background:
      linear-gradient(rgba(8,14,28,0) 0%, rgba(8,14,28,0) 100%) padding-box,
      linear-gradient(45deg, #6366f1 0%, transparent 40%, transparent 60%, #10b981 100%) border-box;
    animation: orbitSpin3 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes orbitSpin1 { to { transform: rotate(360deg); } }
  @keyframes orbitSpin2 { to { transform: rotate(360deg); } }
  @keyframes orbitSpin3 { to { transform: rotate(-360deg); } }

  /* Logo tile */
  .splash-logo-tile {
    width: 110px;
    height: 110px;
    border-radius: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    position: relative;
    overflow: hidden;
    animation: logoBreath 4s ease-in-out infinite;
  }
  .theme-dark .splash-logo-tile {
    background: linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95));
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow:
      0 0 0 4px rgba(99,102,241,0.06),
      0 16px 32px -8px rgba(0,0,0,0.5),
      inset 0 1px 0 rgba(255,255,255,0.08);
  }
  .theme-light .splash-logo-tile {
    background: linear-gradient(145deg, #ffffff, #f8faff);
    border: 1px solid rgba(99,102,241,0.15);
    box-shadow:
      0 0 0 4px rgba(99,102,241,0.04),
      0 16px 32px -8px rgba(99,102,241,0.15);
  }
  /* Shimmer sweep on tile */
  .splash-logo-tile::after {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(100deg, transparent, rgba(255,255,255,0.12), transparent);
    transform: skewX(-15deg);
    animation: tileSweep 3.5s ease-in-out infinite;
  }
  @keyframes tileSweep {
    0% { left: -100%; }
    40% { left: 160%; }
    100% { left: 160%; }
  }
  @keyframes logoBreath {
    0%,100% { transform: scale(1); }
    50% { transform: scale(1.025); }
  }

  /* === Company name & portal title === */
  .splash-company {
    opacity: 0;
    animation: cascadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.55s forwards;
  }
  .splash-portal-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    opacity: 0;
    animation: cascadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.7s forwards;
    margin-top: 6px;
    padding: 3px 12px;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .theme-dark .splash-portal-badge {
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.2);
    color: #a5b4fc;
  }
  .theme-light .splash-portal-badge {
    background: rgba(99,102,241,0.06);
    border: 1px solid rgba(99,102,241,0.15);
    color: #4f46e5;
  }
  .splash-portal-badge-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    animation: dotPulse 1.5s ease-in-out infinite;
  }
  .theme-dark .splash-portal-badge-dot { background: #34d399; box-shadow: 0 0 6px #34d399; }
  .theme-light .splash-portal-badge-dot { background: #10b981; box-shadow: 0 0 6px #10b981; }
  @keyframes dotPulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.7); }
  }

  /* === Greeting text with letter shimmer === */
  .splash-greeting {
    opacity: 0;
    font-weight: 800;
    text-align: center;
    font-size: clamp(1.85rem, 4.5vw, 2.7rem);
    font-family: 'Manrope', 'Inter', sans-serif;
    line-height: 1.15;
    letter-spacing: -0.5px;
    margin: 20px 0 8px;
    background-size: 300% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: cascadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.9s forwards, greetShine 6s linear 0.9s infinite;
  }
  .theme-dark .splash-greeting {
    background-image: linear-gradient(110deg,
      #c7d2fe 0%, #818cf8 20%,
      #34d399 40%, #60a5fa 60%,
      #a78bfa 80%, #c7d2fe 100%);
  }
  .theme-light .splash-greeting {
    background-image: linear-gradient(110deg,
      #4338ca 0%, #4f46e5 20%,
      #0d9488 40%, #0284c7 60%,
      #7c3aed 80%, #4338ca 100%);
  }
  @keyframes greetShine {
    to { background-position: 300% center; }
  }

  /* === Subtext === */
  .splash-subtext {
    opacity: 0;
    animation: cascadeUp 0.7s cubic-bezier(0.16,1,0.3,1) 1.1s forwards;
    font-size: 0.82rem;
    font-weight: 500;
    letter-spacing: 0.3px;
  }

  /* === Animated dots loader === */
  .splash-loader {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 28px;
    opacity: 0;
    animation: cascadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 1.25s forwards;
  }
  .splash-loader-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    animation: loaderBounce 1.2s ease-in-out infinite;
  }
  .splash-loader-dot:nth-child(1) { animation-delay: 0s; }
  .splash-loader-dot:nth-child(2) { animation-delay: 0.15s; }
  .splash-loader-dot:nth-child(3) { animation-delay: 0.3s; }
  .theme-dark .splash-loader-dot { background: linear-gradient(135deg, #6366f1, #10b981); }
  .theme-light .splash-loader-dot { background: linear-gradient(135deg, #4f46e5, #0d9488); }
  @keyframes loaderBounce {
    0%,80%,100% { transform: scale(1) translateY(0); opacity: 0.4; }
    40% { transform: scale(1.4) translateY(-6px); opacity: 1; }
  }

  /* === Progress track === */
  .splash-progress-wrap {
    width: 100%;
    max-width: 220px;
    height: 2px;
    border-radius: 1px;
    margin-top: 16px;
    overflow: hidden;
    position: relative;
    opacity: 0;
    animation: cascadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 1.4s forwards;
  }
  .theme-dark .splash-progress-wrap { background: rgba(255,255,255,0.06); }
  .theme-light .splash-progress-wrap { background: rgba(99,102,241,0.1); }
  .splash-progress-fill {
    position: absolute;
    height: 100%;
    left: -40%;
    width: 40%;
    border-radius: 1px;
    background: linear-gradient(90deg, transparent, #6366f1 40%, #10b981 70%, transparent);
    animation: progressSweep 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  @keyframes progressSweep {
    0% { left: -40%; }
    100% { left: 110%; }
  }

  /* === Common cascade keyframe === */
  @keyframes cascadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* === Fallback brand-mark (when no logo) === */
  .splash-brandmark {
    display: flex;
    align-items: flex-end;
    gap: 5px;
    height: 40px;
  }
  .splash-brandmark span {
    width: 6px;
    border-radius: 3px;
    background: linear-gradient(180deg, #818cf8, #34d399);
    transform: scaleY(0);
    transform-origin: bottom;
    animation: barGrow 0.6s cubic-bezier(0.2,0.8,0.2,1) forwards;
  }
  .splash-brandmark span:nth-child(1) { height: 14px; animation-delay: 0.1s; }
  .splash-brandmark span:nth-child(2) { height: 40px; animation-delay: 0.2s; }
  .splash-brandmark span:nth-child(3) { height: 24px; animation-delay: 0.3s; }
  .splash-brandmark span:nth-child(4) { height: 32px; animation-delay: 0.4s; }
  @keyframes barGrow { to { transform: scaleY(1); } }
`;

/* Stable random seed so chips don't re-randomize on every re-render */
const STAR_DATA = Array.from({ length: 28 }, (_, i) => ({
  size: 1 + (i * 17 % 4),
  top: (i * 37 + 3) % 100,
  left: (i * 53 + 7) % 100,
  dur: 2 + (i * 11 % 4),
  delay: -(i * 1.3 % 5),
}));

export const CandidatePortalSplash = React.memo(({ title = 'Candidate Portal', logoUrl, companyName, greetingName, candidateName, subtext, themeMode }) => {
  const displayGreeting = greetingName || 'Welcome';
  const displaySubtext = subtext || 'Initialising portal...';
  const isDark = themeMode !== 'light';

  return (
    <>
      <style>{splashStyles}</style>
      <div className={`splash-container theme-${themeMode}`}>

        {/* Ambient blobs */}
        <div className="splash-blob sb1" />
        <div className="splash-blob sb2" />
        <div className="splash-blob sb3" />

        {/* Star field */}
        {STAR_DATA.map((s, i) => (
          <div
            key={i}
            className="splash-star"
            style={{
              width: s.size,
              height: s.size,
              top: `${s.top}%`,
              left: `${s.left}%`,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}

        {/* Main glass panel */}
        <div className={`splash-panel theme-${themeMode}`}>

          {/* Logo orbit system */}
          <div className="splash-logo-system">
            <div className="splash-orbit-outer" />
            <div className="splash-orbit-mid" />
            <div className="splash-orbit-inner" />
            <div className={`splash-logo-tile theme-${themeMode}`}>
              {logoUrl ? (
                <Box
                  component="img"
                  src={logoUrl}
                  alt={companyName}
                  sx={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }}
                />
              ) : (
                <div className="splash-brandmark">
                  <span /><span /><span /><span />
                </div>
              )}
            </div>
          </div>

          {/* Company name */}
          <Typography
            className="splash-company"
            sx={{
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: isDark ? '#94a3b8' : '#475569',
              lineHeight: 1.2,
            }}
          >
            {companyName}
          </Typography>

          {/* Portal badge pill */}
          <div className={`splash-portal-badge theme-${themeMode}`}>
            <div className="splash-portal-badge-dot" />
            {title}
          </div>

          {/* Greeting with shimmer */}
          <div className={`splash-greeting theme-${themeMode}`}>
            {displayGreeting}
          </div>

          {/* Subtext */}
          <Typography
            className="splash-subtext"
            sx={{ color: isDark ? '#64748b' : '#64748b', mt: 0.5 }}
          >
            {displaySubtext}
          </Typography>

          {/* Animated dot loader */}
          <div className="splash-loader">
            <div className="splash-loader-dot" />
            <div className="splash-loader-dot" />
            <div className="splash-loader-dot" />
          </div>

          {/* Progress bar */}
          <div className="splash-progress-wrap">
            <div className="splash-progress-fill" />
          </div>

        </div>
      </div>
    </>
  );
});





export const UniquePrevSymbolButton = ({ onClick, disabled, size = 'medium', tooltip = 'Previous Step', sx = {} }) => (
  <Tooltip title={tooltip} arrow placement="top">
    <span>
      <IconButton
        onClick={onClick}
        disabled={disabled}
        sx={{
          width: size === 'small' ? 34 : size === 'large' ? 48 : 40,
          height: size === 'small' ? 34 : size === 'large' ? 48 : 40,
          borderRadius: '12px',
          border: '1.5px solid',
          borderColor: disabled ? 'rgba(148, 163, 184, 0.2)' : 'rgba(99, 102, 241, 0.45)',
          backgroundColor: disabled ? 'transparent' : 'rgba(99, 102, 241, 0.08)',
          color: disabled ? 'rgba(148, 163, 184, 0.35)' : '#6366f1',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: disabled ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.15)',
          '&:hover:not(:disabled)': {
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderColor: '#6366f1',
            transform: 'translateX(-2px)',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
          },
          '&:active:not(:disabled)': {
            transform: 'scale(0.92)'
          },
          ...sx
        }}
      >
        <svg viewBox="0 0 24 24" width={size === 'small' ? 18 : size === 'large' ? 24 : 20} height={size === 'small' ? 18 : size === 'large' ? 24 : 20} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </IconButton>
    </span>
  </Tooltip>
);

export const UniqueNextSymbolButton = ({ onClick, disabled, size = 'medium', tooltip = 'Next Step', sx = {} }) => (
  <Tooltip title={tooltip} arrow placement="top">
    <span>
      <IconButton
        onClick={onClick}
        disabled={disabled}
        sx={{
          width: size === 'small' ? 34 : size === 'large' ? 48 : 40,
          height: size === 'small' ? 34 : size === 'large' ? 48 : 40,
          borderRadius: '12px',
          background: disabled 
            ? 'rgba(148, 163, 184, 0.2)' 
            : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #6366f1 100%)',
          color: disabled ? 'rgba(148, 163, 184, 0.4)' : '#ffffff',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: disabled ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.35)',
          '&:hover:not(:disabled)': {
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #4f46e5 100%)',
            transform: 'translateX(2px)',
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.5)'
          },
          '&:active:not(:disabled)': {
            transform: 'scale(0.92)'
          },
          ...sx
        }}
      >
        <svg viewBox="0 0 24 24" width={size === 'small' ? 18 : size === 'large' ? 24 : 20} height={size === 'small' ? 18 : size === 'large' ? 24 : 20} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </IconButton>
    </span>
  </Tooltip>
);

export const CandidatePortalHeader = React.memo(({
  logoUrl,
  companyName,
  portalTitle,
  candidateName,
  candidateId,
  saveStatus,
  themeMode,
  toggleTheme,
  progressPercent,
  borderCol,
  textPrimaryColor,
  textMutedColor,
  onboardingStarted,
  activeTab,
  totalSteps = 10,
  department = '',
  designation = '',
  progressText = 'Progress',
  stepLabel = '',
  onNextStep,
  onPrevStep,
  canGoNext = true,
  canGoPrev = true
}) => {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 75) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stepLabelVal = stepLabel || `${progressPercent}%`;

  return (
    <>
      <Box
        className="nav-header"
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: themeMode === 'light'
            ? 'linear-gradient(90deg, #ffffff 0%, #f8fafc 100%)'
            : 'linear-gradient(90deg, #10162b 0%, #090d1a 100%)',
          borderBottom: `1px solid ${themeMode === 'light' ? '#e2e8f0' : '#1c2545'}`,
          transition: 'all 0.3s ease'
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 4 }, // 16px on mobile, 32px on desktop (>600px)
            py: 1.75,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: { xs: 2.5, sm: 0 }
          }}
        >
          {/* Row 1: Logo + Company branding */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '14px', alignSelf: 'flex-start' }}>
            {logoUrl ? (
              <Box sx={{
                p: 0.5,
                bgcolor: themeMode === 'light' ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${borderCol}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '38px',
                width: '38px'
              }}>
                <img
                  src={logoUrl}
                  alt={companyName}
                  onError={(e) => { e.target.style.display = 'none'; }}
                  style={{ maxHeight: '28px', maxWidth: '32px', objectFit: 'contain' }}
                />
              </Box>
            ) : (
              <Box className="brand-mark" sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '26px' }}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </Box>
            )}
            <Box sx={{ borderLeft: `1.5px solid ${borderCol}`, pl: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '15px', fontFamily: "'Manrope', sans-serif", color: textPrimaryColor, lineHeight: 1.15 }}>
                {companyName}
              </Typography>
              <Typography variant="caption" sx={{ color: textMutedColor, fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase', fontSize: '10px' }}>
                {portalTitle}
              </Typography>
            </Box>
          </Box>

          {/* Desktop Controls (visible on >600px) */}
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: '16px'
            }}
          >
            {saveStatus && (
              <>
                {saveStatus === 'saving' ? (
                  <Typography variant="caption" sx={{ color: textMutedColor, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Saving draft...
                  </Typography>
                ) : saveStatus === 'saved' ? (
                  <Typography variant="caption" sx={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 500 }}>
                    Draft saved
                  </Typography>
                ) : saveStatus === 'error' ? (
                  <Typography variant="caption" sx={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconAlertCircle size={14} />
                    Save failed
                  </Typography>
                ) : null}
              </>
            )}

            {/* Department and Designation */}
            {(department || designation) && (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                textAlign: 'right',
                borderLeft: `1.5px solid ${borderCol}`,
                pl: 2,
                gap: 0.2
              }}>
                {designation && (
                  <Typography sx={{ color: textPrimaryColor, fontWeight: 700, fontSize: '13px' }}>
                    {designation}
                  </Typography>
                )}
                {department && (
                  <Typography sx={{ color: textMutedColor, fontSize: '11px', fontWeight: 500 }}>
                    {department}
                  </Typography>
                )}
              </Box>
            )}

            {candidateName && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                background: themeMode === 'light'
                  ? 'linear-gradient(135deg, rgba(124, 140, 248, 0.06) 0%, rgba(99, 217, 196, 0.06) 100%)'
                  : 'linear-gradient(135deg, rgba(124, 140, 248, 0.12) 0%, rgba(99, 217, 196, 0.12) 100%)',
                border: `1px solid ${themeMode === 'light' ? 'rgba(124, 140, 248, 0.15)' : 'rgba(99, 217, 196, 0.2)'}`,
                px: 1.8,
                py: 0.65,
                borderRadius: '12px',
                boxShadow: themeMode === 'light' ? '0 4px 12px rgba(124,140,248,0.03)' : '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: '#7c8cf8',
                  color: '#ffffff',
                  boxShadow: '0 2px 6px rgba(124,140,248,0.2)'
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px' }}>
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography sx={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '12px', color: textPrimaryColor, lineHeight: 1.2 }}>
                    {candidateName}
                  </Typography>
                  {candidateId && (
                    <Typography sx={{ fontSize: '10px', color: themeMode === 'light' ? '#4f5e71' : '#a0aec0', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', mt: 0.1 }}>
                      {candidateId.startsWith('(') ? candidateId : (candidateId.toUpperCase().includes('ENROLLED') || candidateId.toUpperCase().includes('ID:') ? candidateId : `Enrolled No: ${candidateId}`)}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* Theme Toggle Button */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                className="icon-btn"
                onClick={toggleTheme}
                sx={{
                  border: `1px solid ${borderCol}`,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  color: textPrimaryColor,
                  bgcolor: themeMode === 'light' ? '#f1f5f9' : '#1c2545',
                  '&:hover': {
                    bgcolor: themeMode === 'light' ? '#e2e8f0' : '#232d55'
                  }
                }}
              >
                {themeMode === 'light' ? (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', stroke: textPrimaryColor }}>
                    <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"></path>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', stroke: textPrimaryColor }}>
                    <circle cx="12" cy="12" r="4.5"></circle>
                    <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"></path>
                  </svg>
                )}
              </IconButton>
            </Stack>
          </Box>

          {/* Mobile Controls (visible on <=600px) */}
          <Box
            sx={{
              display: { xs: 'flex', sm: 'none' },
              flexDirection: 'column',
              gap: 2,
              width: '100%'
            }}
          >
            {/* Row 2: Role / Department (left-aligned, full width) */}
            {(department || designation) && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', width: '100%' }}>
                {designation && (
                  <Typography sx={{ color: textPrimaryColor, fontWeight: 700, fontSize: '13px' }}>
                    {designation}
                  </Typography>
                )}
                {department && (
                  <Typography sx={{ color: textMutedColor, fontSize: '11px', fontWeight: 500 }}>
                    {department}
                  </Typography>
                )}
              </Box>
            )}

            {/* Row 3: Candidate badge (left) + theme/language icons (right) */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1.5, minWidth: 0 }}>
              {candidateName && (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  minWidth: 0,
                  flex: '1 1 auto',
                  overflow: 'hidden',
                  background: themeMode === 'light'
                    ? 'linear-gradient(135deg, rgba(124, 140, 248, 0.06) 0%, rgba(99, 217, 196, 0.06) 100%)'
                    : 'linear-gradient(135deg, rgba(124, 140, 248, 0.12) 0%, rgba(99, 217, 196, 0.12) 100%)',
                  border: `1px solid ${themeMode === 'light' ? 'rgba(124, 140, 248, 0.15)' : 'rgba(99, 217, 196, 0.2)'}`,
                  px: 1.5,
                  py: 0.65,
                  borderRadius: '12px',
                  boxShadow: themeMode === 'light' ? '0 4px 12px rgba(124,140,248,0.03)' : '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: '#7c8cf8',
                    color: '#ffffff',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(124,140,248,0.2)'
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px' }}>
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, overflow: 'hidden' }}>
                    <Typography sx={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: '12px', color: textPrimaryColor, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                      {candidateName}
                    </Typography>
                    {candidateId && (
                      <Typography sx={{ fontSize: '10px', color: themeMode === 'light' ? '#4f5e71' : '#a0aec0', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', mt: 0.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                        {candidateId.startsWith('(') ? candidateId : (candidateId.toUpperCase().includes('ENROLLED') || candidateId.toUpperCase().includes('ID:') ? candidateId : `Enrolled No: ${candidateId}`)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Grouped Icons Container */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
                {saveStatus && (
                  <>
                    {saveStatus === 'saving' ? (
                      <Typography variant="caption" sx={{ color: textMutedColor }}>
                        Saving...
                      </Typography>
                    ) : saveStatus === 'saved' ? (
                      <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 500 }}>
                        Saved
                      </Typography>
                    ) : saveStatus === 'error' ? (
                      <Typography variant="caption" sx={{ color: '#ef4444' }}>
                        Failed
                      </Typography>
                    ) : null}
                  </>
                )}

                <IconButton
                  onClick={toggleTheme}
                  sx={{
                    border: `1px solid ${borderCol}`,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    color: textPrimaryColor,
                    bgcolor: themeMode === 'light' ? '#f1f5f9' : '#1c2545'
                  }}
                >
                  {themeMode === 'light' ? (
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', stroke: textPrimaryColor }}>
                      <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"></path>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', stroke: textPrimaryColor }}>
                      <circle cx="12" cy="12" r="4.5"></circle>
                      <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"></path>
                    </svg>
                  )}
                </IconButton>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Progress bar — separated from header, no label text, sticky at top */}
      {progressPercent !== undefined && progressPercent !== null && (
        <>
          <Box
            className="progress-wrap"
            sx={{
              position: isSticky ? 'fixed' : 'relative',
              top: 0,
              left: 0,
              zIndex: 1000,
              width: '100%',
              bgcolor: themeMode === 'light' ? '#f8fafc' : '#0b1020',
              px: { xs: 2, md: 4 },
              py: 1.5,
              borderBottom: `1px solid ${themeMode === 'light' ? '#e2e8f0' : '#1c2545'}`,
              transition: 'background-color 0.3s ease'
            }}
          >
            <Box
              className="progress-track"
              sx={{
                height: '4px',
                width: '100%',
                bgcolor: themeMode === 'light' ? '#e2e8f0' : '#1c2545',
                borderRadius: '2px',
                overflow: 'hidden'
              }}
            >
              <Box
                className="progress-fill"
                sx={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  borderRadius: '2px',
                  background: 'linear-gradient(90deg, #7c8cf8, #63d9c4)',
                  position: 'relative',
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)',
                    animation: 'sweep 2.2s linear infinite'
                  }
                }}
              />
            </Box>
          </Box>
          {isSticky && <Box sx={{ height: '35px', width: '100%' }} />}
        </>
      )}
    </>
  );
});

export const CANDIDATE_TRANSLATIONS = {
  "Education / Degree": "கல்வி தகுதி / பட்டம்",
  "Board Name": "வாரியத்தின் பெயர்",
  "Qualification Type": "தகுதி வகை",
  "Institution Name": "கல்வி நிறுவனத்தின் பெயர்",
  "Stream / Specification": "பாடப்பிரிவு / விவரம்",
  "Upload experience certificate": "அனுபவ சான்றிதழைப் பதிவேற்றவும்",
  "Upload Certificate / Documents": "சான்றிதழ் / ஆவணங்களைப் பதிவேற்றவும்",
  "Skills": "திறன்கள்",
  "Professional Skills": "தொழில்முறை திறன்கள்",
  "Added Skills": "சேர்க்கப்பட்ட திறன்கள்",
  "Review & Submit": "சரிபார்த்து சமர்ப்பிக்கவும்",
  "1. Experience Details": "1. அனுபவ விவரங்கள்",
  "2. Education Details": "2. கல்வி விவரங்கள்",
  "3. KYC Documents": "3. கேஒய்சி ஆவணங்கள்",
  "4. Skills": "4. திறன்கள்",
  "Aadhar Card Number": "ஆதார் அட்டை எண்",
  "Pan Card Number": "பான் கார்டு எண்",
  "Voter Id Number": "வாக்காளர் அடையாள அட்டை எண்",
  "Passport Number": "கடவுச்சீட்டு எண்",
  "Driving Licence Number": "ஓட்டுநர் உரிம எண்",
  "Ration Card Number": "குடும்ப அட்டை எண்",
  "Document Number": "ஆவண எண்",
  "Aadhar Card": "ஆதார் அட்டை",
  "Pan Card": "பான் கார்டு",
  "Voter Id": "வாக்காளர் அடையாள அட்டை",
  "Passport": "கடவுச்சீட்டு",
  "Driving Licence": "ஓட்டுநர் உரிமம்",
  "Ration Card": "குடும்ப அட்டை",
  "New Document": "புதிய ஆவணம்",
  "Education Type": "கல்வி முறை",
  "Year of Passing": "தேர்ச்சி பெற்ற ஆண்டு",
  "% / Grade": "மதிப்பெண் சதவீதம் / தரம்",
  "Applicant Name": "விண்ணப்பதாரர் பெயர்",
  "Father Name": "தந்தையின் பெயர்",
  "Father's Name": "தந்தையின் பெயர்",
  "Mother Name": "தாயின் பெயர்",
  "Mother's Name": "தாயின் பெயர்",
  "Mobile Number": "கைபேசி எண்",
  "Email ID": "மின்னஞ்சல் முகவரி",
  "Aadhaar Number": "ஆதார் எண்",
  "Gender": "பாலினம்",
  "Religion": "மதம்",
  "Marital Status": "திருமண நிலை",
  "Father's Occupation": "தந்தையின் தொழில்",
  "Mother's Occupation": "தாயின் தொழில்",
  "Siblings and their occupations": "உடன்பிறந்தவர்கள் மற்றும் அவர்களின் தொழில் விவரங்கள்",
  "Company Name": "நிறுவனத்தின் பெயர்",
  "Location": "இடம்",
  "From Date": "துவங்கிய தேதி",
  "To Date": "முடிவடைந்த தேதி",
  "Years of Experience": "அனுபவ ஆண்டுகள்",
  "HR Manager Name": "மனிதவள மேலாளர் பெயர்",
  "HR Manager Email": "மனிதவள மேலாளர் மின்னஞ்சல்",
  "HR Manager Phone": "மனிதவள மேலாளர் தொலைபேசி",
  "Vertical Head Name": "துறைத் தலைவர் பெயர்",
  "Vertical Head Email": "துறைத் தலைவர் மின்னஞ்சல்",
  "Vertical Head Phone": "துறைத் தலைவர் தொலைபேசி",
  "Native Place": "சொந்த ஊர்",
  "Present Address": "தற்போதைய முகவரி",
  "Permanent Address": "நிரந்தர முகவரி",
  "Occupation of Spouse": "கணவர் / மனைவியின் தொழில்",
  "Children Details (count & ages)": "குழந்தைகளின் விவரங்கள் (எண்ணிக்கை / வயது)",
  "Any relatives or friends working in our company?": "உறவினர்கள் அல்லது நண்பர்கள் யாராவது இங்கு வேலை செய்கிறார்களா?",
  "Relatives or Friends Details": "உறவினர் அல்லது நண்பர்களின் விவரங்கள்",
  "Do you own a two wheeler?": "உங்களிடம் இருசக்கர வாகனம் உள்ளதா?",
  "Do you own an Android smartphone?": "உங்களிடம் ஆண்ட்ராய்டு மொபைல் போன் உள்ளதா?",
  "Do you know how to drive a car?": "உங்களுக்கு கார் ஓட்ட தெரியுமா?",
  "Are you willing to travel for work duties?": "வேலைக்காக பயணம் செய்ய விருப்பமா?",
  "Have you completed COVID-19 vaccination (including Booster)?": "பூஸ்டர் டோஸுடன் கோவிட் தடுப்பூசி போடப்பட்டுள்ளதா?",
  "Brief about your positive points / strengths": "உங்களது நேர்மறையான குணங்கள் / பலங்கள் பற்றி சுருக்கமாக கூறவும்",
  "Brief about your negative points / areas of improvement": "உங்களது எதிர்மறையான குணங்கள் / பலவீனங்கள் பற்றி சுருக்கமாக கூறவும்",
  "What are your life goals, and what are you currently doing to achieve them?": "உங்களது வாழ்க்கை லட்சியங்கள் என்ன, அதை அடைய என்ன செய்கிறீர்கள்?",
  "Willing to work in rotational shifts?": "சுழற்சி முறையில் (Rotational Shifts) வேலை செய்ய விருப்பமா?",
  "Do you have prior work experience?": "முன் அனுபவம் உள்ளதா?",
  "Total Experience (Years)": "மொத்த அனுபவ ஆண்டுகள்",
  "Core Department Experience (Years)": "முக்கிய துறை சார்ந்த அனுபவ ஆண்டுகள்",
  "Previous Net Salary (Monthly)": "முந்தைய நிறுவனத்தில் கைக்கு கிடைத்த நிகர சம்பளம்",
  "Previous Gross Salary (Monthly)": "முந்தைய நிறுவனத்தில் பெற்ற மொத்த சம்பளம்",
  "Previous Company Location": "முந்தைய நிறுவனத்தின் இடம்",
  "Previously Worked Shift": "முன்பு வேலை செய்த ஷிப்ட் விவரம்",
  "Notice Period (Days)": "அறிவிப்பு காலம் (நாட்கள்)",
  "Department Employee Count": "முந்தைய துறையில் இருந்த ஊழியர்களின் எண்ணிக்கை",
  "Previous Department & Position": "முந்தைய துறை மற்றும் பதவி விவரங்கள்",
  "Reason for leaving previous job": "முந்தைய வேலையிலிருந்து விலகியதற்கான காரணம்",
  "Expected Net Salary (Take-home)": "எதிர்பார்க்கும் நிகர சம்பளம்",
  "Expected Gross Salary": "எதிர்பார்க்கும் மொத்த சம்பளம்",
  "Do you require PF higher pension?": "பி.எஃப் (PF) உயர் ஓய்வூதியம் தேவையா?",
  "PF Deduction Amount": "பி.எஃப் பிடிக்கப்படும் தொகை",
  "Alternative Department of Interest (If any)": "மாற்றுத் துறையில் பணிபுரிய ஆர்வம் உள்ளதா?",
  "If you made a mistake in your office location, how will you handle it?": "அலுவலகத்தில் தவறு செய்தால் அதை எப்படி கையாளுவீர்கள்?",
  "If your team members have a different opinion than yours, how will you handle it?": "குழுவில் உள்ள கருத்து வேறுபாடுகளை எவ்வாறு கையாள்வீர்கள்?",
  "To make your workplace more productive, what are your improvement ideas and suggestions?": "பணி இடத்தை மேலும் திறம்பட மாற்ற உங்களின் ஆலோசனைகள் என்ன?",
  "Kindly give a self-rating for MS-Office, Outlook & basic computer skills.": "நிலையான அலுவலக பயன்பாடுகளை (MS-Office, Outlook) பயன்படுத்தும் உங்களது திறன் அளவை சுய மதிப்பீடு செய்யவும்",
  "Specify Religion": "மதம் விவரம்",
  "Gender Details": "பாலினம் விவரம்",
  "Department": "துறை",
  "Position / Designation": "பதவி",
  "Interview Date": "நேர்காணல் தேதி",
  "Reference Mode": "குறிப்பு முறை",
  "Reference Details": "குறிப்பு விவரங்கள்",
  "Last Worked Company": "முந்தைய நிறுவனம்",
  "Experience details": "அனுபவம் விவரம்",
  "Passport Photo": "புகைப்படம்",
  "Resume Document": "சுயவிவரக் குறிப்பு",
  "Aadhar Card Scan": "ஆதார் அட்டை நகல்",
  "Previous payslip": "முந்தைய சம்பள சீட்டு",
  "Document Name": "ஆவணத்தின் பெயர்",
  "Activity Details": "செயல்பாட்டு விவரம்"
};

const LOWERCASE_TRANSLATIONS = {};
Object.entries(CANDIDATE_TRANSLATIONS).forEach(([key, value]) => {
  LOWERCASE_TRANSLATIONS[key.toLowerCase()] = value;
});

export const getTamilTranslation = (label) => {
  if (!label) return '';
  const normalized = label
    .replace(/[:*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  return LOWERCASE_TRANSLATIONS[normalized] || '';
};

export const TranslationTooltip = React.memo(({ label, tamilText, customTamil, themeMode }) => {
  const [open, setOpen] = useState(false);
  const tamilLabel = customTamil || tamilText || getTamilTranslation(label);

  if (!tamilLabel) return null;

  const isLight = themeMode === 'light';

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleToggle = (e) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap', flexShrink: 0, ml: '5px' }}>
        <Tooltip
          open={open}
          onOpen={handleOpen}
          onClose={handleClose}
          enterTouchDelay={0}
          leaveTouchDelay={4000}
          title={
            <Typography variant="body2" sx={{ p: 0.5, fontSize: '0.9rem', color: '#ffffff' }}>
              {tamilLabel}
            </Typography>
          }
          arrow
          placement="top"
        >
          <Box
            component="span"
            onClick={handleToggle}
            tabIndex={0}
            role="img"
            aria-label="Tamil translation help"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 17,
              height: 17,
              borderRadius: '50%',
              backgroundColor: isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
              color: isLight ? '#64748b' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
              verticalAlign: 'middle',
              userSelect: 'none',
              outline: 'none',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: isLight ? 'rgba(37, 99, 235, 0.15)' : 'rgba(99, 102, 241, 0.25)',
                color: isLight ? '#2563eb' : '#818cf8',
                transform: 'scale(1.15)'
              },
              '&:focus-visible': {
                outline: '2px solid #2563EB',
                outlineOffset: '1px'
              }
            }}
          >
            ?
          </Box>
        </Tooltip>
      </Box>
    </ClickAwayListener>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Premium Star Rating Component with Glowing Elastic 3D Animation
// ─────────────────────────────────────────────────────────────────────────────
const RATING_TIERS = [
  { value: 1, stringKey: 'POOR', label: 'Poor', color: '#FF3B30', bg: 'rgba(255,59,48,0.12)', border: 'rgba(255,59,48,0.3)', glow: 'rgba(255,59,48,0.5)' },
  { value: 2, stringKey: 'AVERAGE', label: 'Average', color: '#F97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', glow: 'rgba(249,115,22,0.5)' },
  { value: 3, stringKey: 'GOOD', label: 'Good', color: '#EAB308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', glow: 'rgba(234,179,8,0.5)' },
  { value: 4, stringKey: 'VERY GOOD', label: 'Very Good', color: '#2563EB', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.3)', glow: 'rgba(37,99,235,0.5)' },
  { value: 5, stringKey: 'EXCELLENT', label: 'Excellent', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', glow: 'rgba(16,185,129,0.5)' }
];

export const PremiumStarRating = ({
  questionId,
  value,
  onChange,
  themeMode = 'light',
  isError = false,
  readOnly = false
}) => {
  const [hoverVal, setHoverVal] = useState(0);

  const parseVal = (v) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const upper = v.trim().toUpperCase();
      if (upper === 'POOR' || upper === '1') return 1;
      if (upper === 'AVERAGE' || upper === '2') return 2;
      if (upper === 'GOOD' || upper === '3') return 3;
      if (upper === 'VERY GOOD' || upper === '4') return 4;
      if (upper === 'EXCELLENT' || upper === '5') return 5;
    }
    return 0;
  };

  const currentVal = parseVal(value);
  const activeRating = hoverVal || currentVal;
  const activeTier = RATING_TIERS.find(t => t.value === activeRating) || null;

  const handleSelect = (starIndex) => {
    if (readOnly || !onChange) return;
    try {
      playPortalSound('click');
    } catch (e) {}

    const tier = RATING_TIERS.find(t => t.value === starIndex);
    const stringVal = tier ? tier.stringKey : '';

    if (questionId !== undefined && questionId !== null) {
      onChange(questionId, starIndex);
    } else {
      onChange(stringVal, starIndex);
    }
  };

  const textMuted = themeMode === 'light' ? '#64748b' : '#94a3b8';
  const emptyStarColor = themeMode === 'light' ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
      {/* 5-Star Row */}
      <Stack direction="row" spacing={{ xs: 0.75, sm: 1.5 }} alignItems="center" justifyContent="center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating;
          const starTier = RATING_TIERS.find(t => t.value === activeRating);
          const starColor = isFilled && starTier ? starTier.color : emptyStarColor;
          const starGlow = isFilled && starTier ? starTier.glow : 'transparent';

          return (
            <motion.div
              key={star}
              whileHover={{ scale: readOnly ? 1 : 1.28, rotate: readOnly ? 0 : 8 }}
              whileTap={{ scale: readOnly ? 1 : 0.88 }}
              transition={{ type: 'spring', stiffness: 450, damping: 16 }}
              onMouseEnter={() => !readOnly && setHoverVal(star)}
              onMouseLeave={() => !readOnly && setHoverVal(0)}
              onClick={() => handleSelect(star)}
              style={{ cursor: readOnly ? 'default' : 'pointer', padding: '2px' }}
            >
              <svg
                width="38"
                height="38"
                viewBox="0 0 24 24"
                fill={isFilled ? starColor : 'none'}
                stroke={isFilled ? starColor : emptyStarColor}
                strokeWidth={isFilled ? "0.6" : "1.8"}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  width: 'clamp(28px, 8vw, 38px)',
                  height: 'clamp(28px, 8vw, 38px)',
                  filter: isFilled ? `drop-shadow(0 0 10px ${starGlow})` : 'none',
                  transition: 'fill 0.22s ease, stroke 0.22s ease, filter 0.22s ease'
                }}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </motion.div>
          );
        })}
      </Stack>

      {/* Dynamic Rating Badge Label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRating}
          initial={{ opacity: 0, y: 8, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.94 }}
          transition={{ duration: 0.18 }}
        >
          {activeTier ? (
            <Box
              sx={{
                px: 2.5,
                py: 0.75,
                borderRadius: '20px',
                backgroundColor: activeTier.bg,
                border: `1.5px solid ${activeTier.border}`,
                boxShadow: `0 4px 14px ${activeTier.glow.replace('0.5', '0.2')}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: activeTier.color,
                  fontSize: '0.92rem',
                  letterSpacing: '0.3px',
                  textTransform: 'capitalize'
                }}
              >
                {activeTier.label}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: textMuted, fontWeight: 600, fontSize: '0.85rem' }}>
              Select a rating (1 to 5 stars)
            </Typography>
          )}
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};

