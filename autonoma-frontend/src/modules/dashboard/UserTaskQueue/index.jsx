import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Typography, Stack, useMediaQuery,
  Paper, Button, Chip, LinearProgress, useTheme, Divider,
  Collapse, IconButton, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { styled, alpha, keyframes, useColorScheme } from '@mui/material/styles';
import { Player } from '@lottiefiles/react-lottie-player';
import {
  IconCalendarEvent, IconStatusChange, IconNotes, IconCheckbox,
  IconShieldCheck, IconClipboardList, IconAlertTriangle, IconChecks,
  IconX, IconUserCheck, IconCircleCheck, IconBeach, IconCash, IconClock,
  IconUserSearch, IconFileInvoice, IconEye, IconSearch, IconShoppingCart,
  IconTag, IconTags, IconReport, IconPackage, IconReceipt, IconRepeat,
  IconSend, IconScale, IconRoute, IconCpu, IconForklift, IconBox, IconTruck,
  IconExchange, IconMapPin, IconArchive, IconReportAnalytics, IconRefresh,
  IconLock, IconChevronRight, IconArrowUpRight, IconArrowDownRight,
  IconArrowRight, IconActivity, IconBell, IconLayoutDashboard, IconTrendingUp,
  IconChevronDown, IconChevronUp, IconCheck, IconFlame, IconCopy,
  IconArrowDownBar,
  IconArrowDownCircleFilled
} from '@tabler/icons-react';
import html2canvas from 'html2canvas';
import axios from 'utils/axios';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import useAuth from 'hooks/useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters, setFilterConfig } from 'store/slices/search';
import useMasterDataStore from 'store/useMasterDataStore';
import UnallocatedResourcesCard from '../Default/UnallocatedResourcesCard.jsx';
import usePagePermissions from 'hooks/usePagePermissions';
import { playCelebrationSound } from 'utils/AudioEngine';

// ─── Lottie JSON Imports ───────────────────────────────────────────────────────
import lottieAllTask from 'assets/Gif/all Task.json';
import lottieAudit from 'assets/Gif/audit.json';
import lottieChecklist from 'assets/Gif/checklist.json';
import lottieMeeting from 'assets/Gif/meeting.json';
import lottieTicket from 'assets/Gif/Ticket.json';
import lottieTrophy from 'assets/Gif/Trophy.json';
import lottieAssistant from 'assets/Gif/Assistant.json';
import lottieAssistant1 from 'assets/Gif/Assistant1.json';
import lottieMeeting2 from 'assets/Gif/meeting2.json';
import lottieShield from 'assets/Gif/shield2.json';
import lottieTarget from 'assets/Gif/target2.json';
import lottieMail from 'assets/Gif/mail2.json';
import lottieDoc from 'assets/Gif/document2.json';
import lottiePeople from 'assets/Gif/people2.json';
import lottieTruck from 'assets/Gif/truck2.json';
import lottieChecklist2 from 'assets/Gif/checklist2.json';
import lottieMoney2 from 'assets/Gif/money2.json';
import lottiewelcome from 'assets/Gif/welcome.json';
import lottieLeave from 'assets/Gif/leave.json';
import lottie2SecChecklist from 'assets/Gif/2sec checklist.json';
import lottieBusiness from 'assets/Gif/Business & Management.json';
import lottieDeal from 'assets/Gif/Business Deal Success.json';
import lottieContent from 'assets/Gif/Content Manager.json';
import lottieOcrOnboarding from 'assets/Gif/Ddokgu OCR onboarding.json';
import lottieInterview from 'assets/Gif/Interview (1).json';
import lottieWorkspace from 'assets/Gif/Man and robot with computers sitting together in workplace.json';
import lottieMeetingCopy from 'assets/Gif/Meeting copy.json';
import lottieMyStore from 'assets/Gif/My-Store-animated.json';
import lottieOcrBw from 'assets/Gif/OCR- Black & White.json';
import lottieProgramming from 'assets/Gif/Programming.json';
import lottieProtection from 'assets/Gif/Protection.json';
import lottieRocket from 'assets/Gif/Rocket research.json';
import lottieTime from 'assets/Gif/Time to make business.json';
import lottieReviews from 'assets/Gif/User reviews.json';
import lottieWebsite from 'assets/Gif/Website maintenance, website problems, 404.json';
import lottieCardChecklist from 'assets/Gif/card checklist.json';
import lottieEcommerce from 'assets/Gif/ecommerce.json';
import lottieInterviewLower from 'assets/Gif/interview.json';
import lottiePayroll from 'assets/Gif/payroll.json';
import lottieWebsiteBuild from 'assets/Gif/website building of shopping sale.json';
import lottieUnallocated from 'assets/Gif/unallocated.json';

// ─── Animations ───────────────────────────────────────────────────────────────
const slideUp = keyframes`from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}`;
const floatWave = keyframes`0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}`;
const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;
const shimmer = keyframes`0%{background-position:-600px 0}100%{background-position:600px 0}`;
const pulseDot = keyframes`0%,100%{opacity:.65}50%{opacity:1}`;
const countIn = keyframes`from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}`;
const blobAnim1 = keyframes`0%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-50px) scale(1.2)}66%{transform:translate(-20px,20px) scale(0.9)}100%{transform:translate(0,0) scale(1)}`;
const blobAnim2 = keyframes`0%{transform:translate(0,0) scale(1)}33%{transform:translate(-30px,40px) scale(1.1)}66%{transform:translate(20px,-20px) scale(0.95)}100%{transform:translate(0,0) scale(1)}`;

const flowingBg = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// ─── Premium Enterprise BG Animations ────────────────────────────────────────
// Slow geometric blob drifts — all timings ≥ 28s for 60 FPS smoothness
const blobDrift1 = keyframes`
  0%   { transform: translate(0px, 0px)   scale(1.00); }
  20%  { transform: translate(60px,-40px) scale(1.08); }
  40%  { transform: translate(30px, 80px) scale(0.94); }
  60%  { transform: translate(-50px,40px) scale(1.04); }
  80%  { transform: translate(-20px,-60px) scale(0.98); }
  100% { transform: translate(0px, 0px)   scale(1.00); }
`;
const blobDrift2 = keyframes`
  0%   { transform: translate(0px, 0px)    scale(1.00); }
  25%  { transform: translate(-70px, 50px) scale(1.06); }
  50%  { transform: translate(40px, -80px) scale(0.92); }
  75%  { transform: translate(60px,  30px) scale(1.05); }
  100% { transform: translate(0px,  0px)   scale(1.00); }
`;
const blobDrift3 = keyframes`
  0%   { transform: translate(0px,  0px)   scale(1.00); }
  33%  { transform: translate(50px, 70px)  scale(1.10); }
  66%  { transform: translate(-40px,-50px) scale(0.95); }
  100% { transform: translate(0px,  0px)   scale(1.00); }
`;
const gridMove = keyframes`
  0%   { transform: translate(0, 0); }
  100% { transform: translate(40px, 40px); }
`;
const shimmerLine = keyframes`
  0%   { opacity: 0; transform: translateX(-100%); }
  40%  { opacity: 1; }
  100% { opacity: 0; transform: translateX(200%); }
`;
const particlePulse = keyframes`
  0%,100% { opacity: 0.3; transform: scale(1); }
  50%     { opacity: 0.7; transform: scale(1.6); }
`;
const floatUp = keyframes`
  0%   { transform: translateY(100vh) scale(0); opacity: 0; }
  10%  { opacity: 0.8; transform: translateY(80vh) scale(1); }
  90%  { opacity: 0.8; transform: translateY(20vh) scale(1); }
  100% { transform: translateY(-10vh) scale(0); opacity: 0; }
`;
const orbPulse = keyframes`
  0%,100% { transform: scale(1); opacity: 0.55; }
  50%     { transform: scale(1.12); opacity: 0.8; }
`;

// 🔹 Icon Map 🔹─────────────────────────────────────────────────────────────────
const ICON_MAP = {
  IconCalendarEvent, IconStatusChange, IconNotes, IconCheckbox, IconShieldCheck,
  IconClipboardList, IconAlertTriangle, IconChecks, IconX, IconUserCheck,
  IconCircleCheck, IconBeach, IconCash, IconClock, IconUserSearch, IconFileInvoice,
  IconEye, IconSearch, IconShoppingCart, IconTag, IconTags, IconReport, IconPackage,
  IconReceipt, IconRepeat, IconSend, IconScale, IconRoute, IconCpu, IconForklift,
  IconBox, IconTruck, IconExchange, IconMapPin, IconArchive,
  IconDiscountCheck: IconCircleCheck, IconReportAnalytics
};
const getIcon = (name, size = 18) => { const I = ICON_MAP[name] || IconClipboardList; return <I size={size} />; };

// ─── Module Config ────────────────────────────────────────────────────────────
const MODULE_CFG = {
  'AWAITING ACCESS': { color: '#64748B', grad: 'linear-gradient(135deg,#334155,#64748B,#94A3B8)' },
  'UNALLOCATED RESOURCES': { color: '#0284C7', grad: 'linear-gradient(135deg,#0369A1,#0284C7,#38BDF8)' },
  'MEETING': { color: '#3B82F6', grad: 'linear-gradient(135deg,#1D4ED8,#3B82F6,#60A5FA)' },
  'APPLICANT TRACKING SYSTEM (ATS)': { color: '#8B5CF6', grad: 'linear-gradient(135deg,#5B21B6,#8B5CF6,#A78BFA)' },
  'AUDIT': { color: '#EF4444', grad: 'linear-gradient(135deg,#991B1B,#EF4444,#F87171)' },
  'CHECK LIST': { color: '#14B8A6', grad: 'linear-gradient(135deg,#0F766E,#14B8A6,#5EEAD4)' },
  'INDUCTION': { color: '#06B6D4', grad: 'linear-gradient(135deg,#0E7490,#06B6D4,#67E8F9)' },
  'EMPLOYEE': { color: '#22C55E', grad: 'linear-gradient(135deg,#15803D,#22C55E,#86EFAC)' },
  'QUOTATION': { color: '#F97316', grad: 'linear-gradient(135deg,#C2410C,#F97316,#FED7AA)' },
  'FOLLOW UP': { color: '#FBBF24', grad: 'linear-gradient(135deg,#B45309,#FBBF24,#FDE68A)' },
  'OCR': { color: '#38BDF8', grad: 'linear-gradient(135deg,#0369A1,#38BDF8,#BAE6FD)' },
  'PRICING': { color: '#A78BFA', grad: 'linear-gradient(135deg,#6D28D9,#A78BFA,#DDD6FE)' },
  'PLANNING': { color: '#FB923C', grad: 'linear-gradient(135deg,#C2410C,#FB923C,#FED7AA)' },
  'PURCHASE': { color: '#84CC16', grad: 'linear-gradient(135deg,#3F6212,#84CC16,#D9F99D)' },
  'PRODUCTION': { color: '#F43F5E', grad: 'linear-gradient(135deg,#9F1239,#F43F5E,#FECDD3)' },
  'STORE': { color: '#94A3B8', grad: 'linear-gradient(135deg,#334155,#94A3B8,#E2E8F0)' },
  'QUALITY': { color: '#34D399', grad: 'linear-gradient(135deg,#065F46,#34D399,#A7F3D0)' },
};
const getMC = (type) => MODULE_CFG[type] || { color: '#6366F1', grad: 'linear-gradient(135deg,#3730A3,#6366F1,#C7D2FE)' };

const getGroupIcon = (type, size = 24) => {
  const t = (type || '').toLowerCase();
  if (t.includes('store')) return <IconBox size={size} strokeWidth={2} />;
  if (t.includes('meeting')) return <IconCalendarEvent size={size} strokeWidth={2} />;
  if (t.includes('ats') || t.includes('applicant')) return <IconUserSearch size={size} strokeWidth={2} />;
  if (t.includes('check list') || t.includes('checklist')) return <IconChecks size={size} strokeWidth={2} />;
  if (t.includes('ocr')) return <IconCpu size={size} strokeWidth={2} />;
  if (t.includes('purchase')) return <IconShoppingCart size={size} strokeWidth={2} />;
  if (t.includes('audit')) return <IconShieldCheck size={size} strokeWidth={2} />;
  if (t.includes('employee')) return <IconUserCheck size={size} strokeWidth={2} />;
  if (t.includes('follow up') || t.includes('followup')) return <IconRepeat size={size} strokeWidth={2} />;
  if (t.includes('quality')) return <IconShieldCheck size={size} strokeWidth={2} />;
  return <IconLayoutDashboard size={size} strokeWidth={2} />;
};

// ─── Lottie animation mapping ─────────────────────────────────────────────────
const getLottieData = (displayName) => {
  const n = (displayName || '').toLowerCase();

  if (n.includes('unallocated')) return lottieUnallocated;

  // Meeting Module
  if (n.includes('attendance')) return lottieMeeting2;
  if (n.includes('status')) return lottieTicket;
  if (n.includes('verify mom')) return lottieShield;
  if (n.includes('close mom')) return lottieTrophy;
  if (n.includes('mom')) return lottieContent;

  // ATS Module
  if (n.includes('call letter')) return lottieMail;
  if (n.includes('interview schedule')) return lottieAssistant;
  if (n.includes('interview process')) return lottieWorkspace;
  if (n.includes('offer letter')) return lottiewelcome;
  if (n.includes('verification')) return lottieChecklist;

  // Audit / NCR / Checklist
  if (n.includes('acknowledgement')) return lottiePeople;
  if (n.includes('checklist') && n.includes('master verify')) return lottieShield;
  if (n.includes('checklist') && n.includes('reject')) return lottieLeave;
  if (n.includes('checklist') && n.includes('assign')) return lottiePeople;
  if (n.includes('checklist') && n.includes('close')) return lottieChecklist;
  if (n.includes('checklist') && n.includes('verify')) return lottieAudit;
  if (n.includes('ncr') && n.includes('close')) return lottieTrophy;
  if (n.includes('ncr')) return lottieTicket;
  if (n.includes('checklist')) return lottieChecklist2;
  if (n.includes('audit')) return lottieAudit;

  // Induction & Follow up
  if (n.includes('induction')) return lottiewelcome;
  if (n.includes('followup setup')) return lottieAssistant1;
  if (n.includes('followup process')) return lottieMeeting2;
  if (n.includes('follow')) return lottiePeople;

  // Others
  if (n.includes('leave')) return lottieLeave;
  if (n.includes('loan')) return lottieMoney2;
  if (n.includes('payroll')) return lottieMoney2;
  if (n.includes('employee')) return lottiePeople;
  if (n.includes('quotation')) return lottieDoc;
  if (n.includes('ocr')) return lottieAssistant1;
  if (n.includes('production')) return lottieTruck;
  if (n.includes('store')) return lottieAllTask;
  if (n.includes('quality')) return lottieTrophy;
  if (n.includes('purchase')) return lottieAllTask;
  if (n.includes('planning')) return lottieMeeting;
  if (n.includes('delivery')) return lottieTruck;

  // Fallback hash to avoid same default image everywhere
  const FALLBACK = [
    lottie2SecChecklist, lottieBusiness, lottieDeal, lottieContent, lottieOcrOnboarding, lottieInterview,
    lottieWorkspace, lottieMeetingCopy, lottieMyStore, lottieOcrBw, lottieProgramming, lottieProtection,
    lottieRocket, lottieTime, lottieReviews, lottieWebsite, lottieCardChecklist, lottieEcommerce,
    lottieInterviewLower, lottiePayroll, lottieWebsiteBuild
  ];
  let h = 5381; for (let i = 0; i < n.length; i++) h = ((h << 5) + h) + n.charCodeAt(i);
  return FALLBACK[Math.abs(h) % FALLBACK.length];
};

// ─── Group-level lottie map — one unique image per module type ────────────────
// Keyed by exact module type strings from the backend.
// Each module MUST have a different lottie to prevent visual duplication.
const GROUP_LOTTIE_MAP = {
  'AWAITING ACCESS': lottieProtection,
  'UNALLOCATED RESOURCES': lottiePeople,
  'MEETING': lottieMeetingCopy,
  'APPLICANT TRACKING SYSTEM (ATS)': lottieInterviewLower,
  'AUDIT': lottieAudit,
  'CHECK LIST': lottieChecklist2,
  'INDUCTION': lottiewelcome,
  'EMPLOYEE': lottiePeople,
  "EMPLOYEE'S": lottiePeople,
  'QUOTATION': lottieDoc,
  'FOLLOW UP': lottieAssistant1,
  'OCR': lottieOcrOnboarding,
  'PRICING': lottieDeal,
  'PLANNING': lottieMeeting,
  'PURCHASE': lottieAllTask,
  'PRODUCTION': lottieTruck,
  'STORE': lottieMyStore,
  'QUALITY': lottieTrophy,
};
// Each entry in FALLBACK_GROUP is used for unknown types — picked by hash so unknown
// modules don't collide with each other.
const FALLBACK_GROUP = [
  lottieBusiness, lottieRocket, lottieWebsite, lottieEcommerce,
  lottieProtection, lottieTime, lottieReviews, lottieWebsiteBuild,
  lottieCardChecklist, lottiePayroll, lottieOcrBw, lottieProgramming,
];
const getGroupLottie = (type) => {
  const key = (type || '').toUpperCase().trim();
  if (GROUP_LOTTIE_MAP[key]) return GROUP_LOTTIE_MAP[key];
  // Deterministic hash fallback — same type always gets the same image
  let h = 5381; for (let i = 0; i < key.length; i++) h = ((h << 5) + h) + key.charCodeAt(i);
  return FALLBACK_GROUP[Math.abs(h) % FALLBACK_GROUP.length];
};


// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS = {
  info: { bg: 'rgba(59,130,246,.22)', txt: '#93C5FD', dot: '#3B82F6' },
  warning: { bg: 'rgba(251,191,36,.22)', txt: '#FCD34D', dot: '#FBBF24' },
  danger: { bg: 'rgba(239,68,68,.22)', txt: '#FCA5A5', dot: '#EF4444', pulse: true },
  success: { bg: 'rgba(34,197,94,.22)', txt: '#86EFAC', dot: '#22C55E' },
  default: { bg: 'rgba(148,163,184,.18)', txt: '#CBD5E1', dot: '#94A3B8' },
};
const getSS = (s) => STATUS[s] || STATUS.default;

// Updated By: Nutech
// Updated At: 2026-09-04
// Optimized: two-tier capture — small cards at scale=0.75 + imageTimeout=0 for max speed;
// large "Copy All" container at scale=1 with full DOM freeze.
const captureElementWithFullHeight = async (element, scale = 1, isSmall = false) => {
  if (!element) return null;

  const elementWidth = element.offsetWidth || element.scrollWidth || 1200;
  const elementHeight = element.offsetHeight || element.scrollHeight;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
    document.body.classList.contains('dark') ||
    element.closest?.('[data-theme="dark"]');
  const bg = isDark ? '#0f172a' : '#ffffff';

  try {
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor: bg,
      logging: false,
      useCORS: false,
      allowTaint: true,
      imageTimeout: isSmall ? 0 : 3000,
      width: elementWidth,
      height: elementHeight,
      scrollX: 0,
      scrollY: 0,
      ignoreElements: (el) =>
        el.getAttribute?.('data-html2canvas-ignore') === 'true' ||
        el.dataset?.html2canvasIgnore === 'true',
      onclone: (clonedDoc, clonedEl) => {
        clonedEl.style.cssText += ';transform:none;animation:none;transition:none;position:relative;top:0;left:0;margin:0;padding:16px;box-sizing:border-box;';
        clonedEl.style.width = `${elementWidth}px`;

        // Single querySelectorAll pass: freeze sticky + animations
        const allCloned = clonedEl.querySelectorAll('*');
        const len = allCloned.length;
        for (let i = 0; i < len; i++) {
          const s = allCloned[i].style;
          if (s.position === 'sticky' || s.position === 'fixed') {
            s.position = 'static';
            s.top = 'auto';
          }
          s.animation = 'none';
          s.transition = 'none';
        }
      }
    });
    return canvas;
  } catch (e) {
    console.error('html2canvas capture error:', e);
    return null;
  }
};

// ─── Trend ────────────────────────────────────────────────────────────────────
const strHash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i); return Math.abs(h); };
const getTrend = (name) => { const h = strHash(name || 'x'); return { val: (h % 22) + 1, dir: h % 3 }; };

// ─── Donut SVG Progress ────────────────────────────────────────────────────────
function DonutProgress({ pct = 0, color = '#3B82F6', size = 72, label = 'Done' }) {
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const computedMode = mode === 'system' ? systemMode : mode;
  const isDark = computedMode === 'dark' || theme.palette.mode === 'dark';
  const r = size / 2 - 9;
  const circ = 2 * Math.PI * r;
  const safePct = Number.isNaN(pct) ? 0 : pct;
  const offset = circ - (Math.min(100, safePct) / 100) * circ;
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)"} strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: safePct >= 100 ? '0.85rem' : '1.05rem', fontWeight: 900, color: 'text.primary', lineHeight: 1 }}>{safePct}%</Typography>
        <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.04em', mt: .2 }}>
          {label.toUpperCase()}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Mini Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data = [], color = '#3B82F6', width = 180, height = 44 }) {
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const computedMode = mode === 'system' ? systemMode : mode;
  const isDark = computedMode === 'dark' || theme.palette.mode === 'dark';
  if (data.length < 2) return null;
  const max = Math.max(...data, 1), min = Math.min(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / rng) * (height - 8) - 4}`).join(' ');
  const area = `0,${height} ${pts} ${width},${height}`;
  const gId = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / rng) * (height - 8) - 4}
        r="4.5" fill={color} stroke={isDark ? "#141929" : "#ffffff"} strokeWidth="2"
      />
    </svg>
  );
}

// ─── Premium Enterprise PageWrap ─────────────────────────────────────────────
const PageWrap = styled(Box)(({ theme }) => {
  return {
    boxSizing: 'border-box',
    minHeight: '100%',
    background: 'transparent',
    padding: '20px 24px 28px',
    position: 'relative',
  };
});

const TopBanner = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(99,102,241,.12) 0%, rgba(139,92,246,.08) 100%)',
  border: '1px solid rgba(99,102,241,.18)',
  borderRadius: 24, // Matched screenshot (fully rounded)
  padding: '13px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 12,
  marginBottom: 24,
  position: 'sticky',
  top: 20,
  zIndex: 110,
  backdropFilter: 'blur(16px)',
  animation: `${fadeIn} .5s ease both`,
  '[data-theme="dark"] &': {
    background: 'linear-gradient(135deg, rgba(20,25,45,.95) 0%, rgba(12,18,40,.95) 100%)', // Match card deep dark
    border: '1px solid rgba(255,255,255,.05)',
    boxShadow: '0 8px 30px rgba(0,0,0,.2)'
  }
}));

const SectionGroup = styled(Box)(({ theme, col = '#6366F1' }) => {
  return {
    borderRadius: 24,
    padding: '8px 12px 12px',
    marginBottom: '5px',
    background: `linear-gradient(270deg, ${alpha(col, 0.08)} 0%, rgba(255,255,255,0.75) 50%, ${alpha(col, 0.08)} 100%)`,
    border: `1px solid ${alpha(col, 0.2)}`,
    boxShadow: `0 8px 32px rgba(0,0,0,0.02)`,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: `0 12px 40px rgba(0,0,0,0.06)`,
    },
    '[data-theme="dark"] &': {
      background: `linear-gradient(270deg, ${alpha(col, 0.15)} 0%, rgba(20,25,45, 0.7) 50%, ${alpha(col, 0.15)} 100%)`,
      border: `1px solid ${alpha(col, 0.25)}`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.2)`,
    },
    '[data-theme="dark"] &:hover': {
      boxShadow: `0 12px 40px rgba(0,0,0,0.3)`,
    }
  };
});

const StandardSlider = styled(Box)(({ theme }) => ({
  position: 'relative',
  '& .slick-slide': {
    padding: '0 8px',
    transition: 'all 0.4s ease',
  },
  '& .slick-list': {
    padding: '10px 0 !important',
    margin: '0 -8px'
  },
  '& .slick-dots': {
    bottom: '-25px',
  },
  '& .slick-dots li': {
    margin: '0 4px',
    width: 'auto'
  },
  '& .slick-dots li button': {
    width: 20,
    height: 6,
    padding: 0,
    borderRadius: 6,
    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
  },
  '& .slick-dots li button:before': {
    display: 'none',
  },
  '& .slick-dots li.slick-active button': {
    width: 36,
    background: theme.palette.primary.main,
    boxShadow: `0 0 10px ${alpha(theme.palette.primary.main, 0.5)}`
  },
  '& .slick-prev, & .slick-next': {
    width: 36,
    height: 36,
    background: theme.palette.mode === 'dark' ? 'rgba(20,25,45, 0.9)' : '#fff',
    borderRadius: '50%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 2,
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
    transition: 'all 0.2s',
    '&:hover': {
      background: theme.palette.mode === 'dark' ? 'rgba(30,40,70, 1)' : '#f8f9fa',
      transform: 'translateY(-50%) scale(1.1)',
    }
  },
  '& .slick-prev': { left: -18 },
  '& .slick-next': { right: -18 },
  '& .slick-prev:before, & .slick-next:before': {
    color: theme.palette.mode === 'dark' ? '#fff' : '#333',
    fontSize: '20px',
    opacity: 1
  }
}));

const SectionHeader = styled(Box)(({ theme, col = '#6366F1' }) => {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    paddingBottom: '8px',
    marginBottom: '1px',
    borderBottom: `1px dashed ${alpha(col, 0.2)}`,
    '[data-theme="dark"] &': {
      borderBottom: `1px dashed ${alpha(col, 0.3)}`,
    }
  };
});

const WCard = styled(Paper, {
  shouldForwardProp: p => !['col', 'cidx', 'permitted'].includes(p)
})(({ theme, col = '#6366F1', cidx = 0, permitted = true }) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    background: isDark
      ? `linear-gradient(160deg, ${alpha(col, .12)} 0%, rgba(15,21,42,.97) 40%)`
      : `linear-gradient(160deg, ${alpha(col, .05)} 0%, ${theme.palette.background.paper} 40%)`,
    border: `1px solid ${alpha(col, isDark ? .18 : .25)}`,
    borderRadius: 20,
    boxSizing: 'border-box',
    padding: '16px 16px 14px 18px',
    height: '270px', // Uniform strict height for all cards
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    opacity: permitted ? 1 : 0.6,
    // Stagger the floating animation delay significantly to create a distinct wave effect
    animationDelay: `${cidx * 55}ms, calc(${cidx * 400}ms + .6s)`,
    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    backdropFilter: 'blur(20px)',
    boxShadow: isDark
      ? `0 10px 40px rgba(0,0,0,.3), inset 0 1px 0 ${alpha(col, .1)}`
      : `0 10px 40px rgba(13,38,76,.04), inset 0 1px 0 rgba(255,255,255,.6)`,
    '&:hover': permitted ? {
      animationPlayState: 'running, paused', // Keep entrance animation running, pause floating on hover to stabilize
      transform: 'translateY(-12px) scale(1.02)',
      border: `1px solid ${alpha(col, 0.9)}`,
      boxShadow: `0 15px 45px ${alpha(col, 0.25)}, 0 0 35px 5px ${alpha(col, 0.15)}, inset 0 0 25px 2px ${alpha(col, 0.1)}`,
    } : {},
    '[data-theme="dark"] &': {
      background: 'linear-gradient(135deg, rgba(63, 68, 87, 0.95) 0%, rgba(12,18,40,.95) 100%)',
      border: `1px solid ${alpha(col, .18)}`,
      boxShadow: '0 4px 20px rgba(0,0,0,.4)',
      '&:hover': permitted ? {
        border: `1px solid ${alpha(col, 1)}`,
        boxShadow: `0 15px 50px ${alpha(col, 0.4)}, 0 0 40px 10px ${alpha(col, 0.3)}, inset 0 0 30px 5px ${alpha(col, 0.2)}`,
      } : {}
    }
  };
});

const KpiNum = styled(Typography)(({ theme }) => ({
  fontWeight: 900,
  fontSize: '2.5rem',
  lineHeight: 1,
  color: 'text.primary',
  animation: `${countIn} .55s cubic-bezier(.22,1,.36,1) both`,
  letterSpacing: '-0.025em',
}));

const MRow = styled(Box)(({ theme }) => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '6px 9px', borderRadius: 9, cursor: 'pointer',
  transition: 'background .18s',
  '& .arr': { opacity: 0, transform: 'translateX(-3px)', transition: 'all .18s' },
  '&:hover': { background: 'rgba(0,0,0,.04)', '& .arr': { opacity: 1, transform: 'translateX(0)' } },
  '[data-theme="dark"] &': {
    '&:hover': { background: 'rgba(255,255,255,.05)' }
  }
}));

const VBadge = styled(Box)(({ bg, col, ispulse }) => ({
  padding: '3px 12px', borderRadius: 12, fontSize: '.77rem', fontWeight: 800,
  backgroundColor: bg, color: col, minWidth: 32, textAlign: 'center',
  animation: ispulse === 'true' ? `${pulseDot} 2s infinite` : 'none',
}));

const ShimCard = styled(Box)(({ theme }) => ({
  borderRadius: 20, height: 248,
  background: 'linear-gradient(90deg, rgba(240,244,248,.9) 25%, rgba(255,255,255,.9) 50%, rgba(240,244,248,.9) 75%)',
  backgroundSize: '600px 100%',
  animation: `${shimmer} 1.6s linear infinite`,
  '[data-theme="dark"] &': {
    background: 'linear-gradient(90deg, rgba(20,25,45,.9) 25%, rgba(26,34,62,.9) 50%, rgba(20,25,45,.9) 75%)',
  }
}));

const BottomStrip = styled(Box)(({ theme }) => {
  return {
    position: 'sticky',
    bottom: 0,
    zIndex: 100,
    background: 'linear-gradient(135deg, rgba(255,255,255,.95) 0%, rgba(248,250,252,.98) 100%)',
    border: '1px solid rgba(0,0,0,.08)',
    borderRadius: 20,
    padding: '0px 24px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 -4px 20px rgba(0,0,0,.06)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
    animation: `${fadeIn} .7s ease both`,
    '[data-theme="dark"] &': {
      background: 'linear-gradient(135deg, rgba(20,25,45,.95) 0%, rgba(12,18,40,.98) 100%)',
      border: '1px solid rgba(255,255,255,.07)',
      boxShadow: '0 -4px 30px rgba(0,0,0,.5)',
    }
  };
});

export default function UserTaskQueue() {
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const computedMode = mode === 'system' ? systemMode : mode;
  const isSysDark = computedMode === 'dark' || theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.search.filters) || {};
  const curPath = (typeof window !== 'undefined' ? window.location.pathname : '').replace(/\/$/, '').toLowerCase();

  const taskScope = filters.taskScope || 'Mine';
  const memberId = filters.memberId || '';
  const { user } = useAuth();

  const employeesForPerm = useMasterDataStore(state => state.data?.employees) || [];
  const isViewingSpecificUser = memberId && memberId !== 'All';
  const selectedEmpForPerm = isViewingSpecificUser ? employeesForPerm.find(e => String(e.id) === String(memberId) || String(e.userId) === String(memberId)) : null;
  const targetUserId = isViewingSpecificUser ? (selectedEmpForPerm?.userId || 'WAITING') : null;

  const empMasterPerm = usePagePermissions('M2210'); // Employee Master
  const meetingSchedulePerm = usePagePermissions('QM1310'); // Meeting Schedule
  const unallocatedReportPerm = usePagePermissions('QMS2001', targetUserId); // Unallocated Resource Report

  const [unallocatedBreakdown, setUnallocatedBreakdown] = useState(() => {
    try {
      const raw = sessionStorage.getItem('unallocated_breakdown_cache');
      if (raw) return JSON.parse(raw);
    } catch (e) { }
    return { total: 0, meeting: 0, checklist: 0, audit: 0, userAccess: 0 };
  });

  useEffect(() => {
    if (unallocatedReportPerm?.dashboard) {
      axios.get('/api/qms/meeting-schedules/unallocated-resources')
        .then(res => {
          const list = res.data || [];
          try {
            sessionStorage.setItem('unallocated_resources_full_cache', JSON.stringify(list));
          } catch (e) { }
          const total = list.length;
          const meeting = list.filter(r => r.awaitingAssignment && r.awaitingAssignment.includes('Meeting')).length;
          const checklist = list.filter(r => r.awaitingAssignment && (r.awaitingAssignment.includes('CheckList') || r.awaitingAssignment.includes('Checklist'))).length;
          const audit = list.filter(r => r.awaitingAssignment && r.awaitingAssignment.includes('Audit')).length;
          const userAccess = list.filter(r => r.awaitingAssignment && r.awaitingAssignment.includes('User Access')).length;
          const nextVal = { total, meeting, checklist, audit, userAccess };
          setUnallocatedBreakdown(prev => {
            if (JSON.stringify(prev) === JSON.stringify(nextVal)) return prev;
            try {
              sessionStorage.setItem('unallocated_breakdown_cache', JSON.stringify(nextVal));
            } catch (e) { }
            return nextVal;
          });
        })
        .catch(err => console.error('Error fetching unallocated breakdown:', err));
    }
  }, [user, unallocatedReportPerm, memberId]);

  useEffect(() => {
    dispatch(setFilterConfig({
      path: curPath,
      config: [
        {
          id: 'taskScope',
          label: 'Scope',
          type: 'select',
          defaultValue: 'Mine',
          isStarred: true,
          options: [
            { value: 'Mine', label: 'Mine' },
            { value: 'Team', label: 'Team' },
            { value: 'Company', label: 'Company' }
          ]
        }
      ]
    }));
  }, [dispatch, curPath]);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isLg = useMediaQuery(theme.breakpoints.up('lg'));
  const isMd = useMediaQuery(theme.breakpoints.up('md'));
  const isSm = useMediaQuery(theme.breakpoints.up('sm'));
  const currentCols = isLg ? 6 : isMd ? 3 : isSm ? 2 : 1;

  const initialCacheKey = `dash_widgets_${taskScope}_${memberId || 'all'}`;

  const [widgets, setWidgets] = useState(() => {
    try {
      const cached = sessionStorage.getItem(initialCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return [];
  });

  const [loading, setLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem(initialCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch (e) { }
    return true;
  });

  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (type) => {
    setExpandedSections(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const expandAll = () => {
    const all = {};
    Object.keys(grouped).forEach(k => { all[k] = true; });
    setExpandedSections(all);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const [showAllGroups, setShowAllGroups] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isReverseScroll, setIsReverseScroll] = useState(false);

  const [copyingId, setCopyingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // ─── Clipboard Copy (Visual Screenshot) ──────────────────────────────────────
  // Updated By: Nutech
  // Updated At: 2026-09-04
  // Individual cards → scale=0.75 + imageTimeout=0 + PNG-only clipboard (fastest).
  // Copy All → scale=1 (large container, full quality).
  const handleCopyElement = (elementId, cardTitle, cardData) => {
    const el = document.getElementById(elementId);
    if (!el) return;

    // ── Fallback plain-text (used only if canvas fails) ──────────────────────
    let plainText = cardTitle || '';
    if (cardData) {
      if (cardData.type === 'WIDGET_CARD') {
        const w = cardData.widget;
        const title = w.displayName || cardTitle || 'Module Card';
        const moduleName = cardData.moduleName || '';
        const totalVal = w.metrics?.[0]?.value || 0;
        const overdueVal = w.metrics?.find(m => m.label?.toLowerCase().includes('overdue'))?.value || 0;
        const pendingVal = w.metrics?.find(m => m.label?.toLowerCase().includes('pending'))?.value || 0;
        plainText = `📌 ${title}\nModule: ${moduleName}\nTotal Tasks: ${totalVal}\nOverdue: ${overdueVal}\nPending: ${pendingVal}`;
      } else if (cardData.type === 'COLLAPSED_MODULE' || cardData.type === 'MODULE_SECTION') {
        const moduleName = cardData.moduleName || cardTitle || '';
        const total = cardData.total || 0;
        const overdue = cardData.overdue || 0;
        const pending = cardData.pending || 0;
        plainText = `📊 ${moduleName}\nTotal Tasks: ${total}\nOverdue: ${overdue}\nPending: ${pending}`;
      }
    }
    if (!plainText) plainText = el.innerText || el.textContent || cardTitle || '';

    const isLargeCapture = elementId === 'all-modules-grid-container';
    // Small card: scale=0.75 renders ~44% fewer pixels → significantly faster.
    // Copy All: scale=1 for full-grid quality.
    const captureScale = isLargeCapture ? 1 : 0.75;

    setCopyingId(elementId);
    setCopiedId(null);

    captureElementWithFullHeight(el, captureScale, !isLargeCapture)
      .then((canvas) => {
        if (!canvas) { setCopyingId(null); return; }

        // Skip toDataURL (not needed for clipboard) — go straight to toBlob.
        // PNG-only clipboard: no text/html blob needed → faster ClipboardItem write.
        canvas.toBlob((imageBlob) => {
          if (!imageBlob) { setCopyingId(null); return; }

          try {
            const textBlob = new Blob([plainText.trim()], { type: 'text/plain' });
            navigator.clipboard.write([new ClipboardItem({
              'image/png': imageBlob,
              'text/plain': textBlob,
            })])
              .then(() => {
                setCopyingId(null);
                setCopiedId(elementId);
                setTimeout(() => setCopiedId(null), 2500);
              })
              .catch((err) => {
                console.warn('Clipboard write failed:', err);
                navigator.clipboard?.writeText(plainText);
                setCopyingId(null);
                setCopiedId(elementId);
                setTimeout(() => setCopiedId(null), 2500);
              });
          } catch (err) {
            console.warn('ClipboardItem error:', err);
            navigator.clipboard?.writeText(plainText);
            setCopyingId(null);
            setCopiedId(elementId);
            setTimeout(() => setCopiedId(null), 2500);
          }
        }, 'image/png');
      })
      .catch((e) => {
        console.error('Capture failed:', e);
        setCopyingId(null);
      });
  };

  // ─── Greeting ────────────────────────────────────────────────────────────────
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  const employees = useMasterDataStore(state => state.data.employees) || [];

  let displayUserName = user?.name ? user.name.toUpperCase() : 'USER';
  if (memberId && memberId !== 'All') {
    const selectedEmp = employees.find(e => e.id === memberId || e.userId === memberId);
    if (selectedEmp) {
      displayUserName = selectedEmp.employeeName ? selectedEmp.employeeName.toUpperCase() : displayUserName;
    }
  }

  // ─── Fetch ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let sse = null, isMounted = true, retry = null;
    const cacheKey = `dash_widgets_${taskScope}_${memberId || 'all'}`;

    // Instant Cache Load (0ms delay when navigating back)
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWidgets(parsed);
          setLoading(false);
          setError(null);
        }
      }
    } catch (e) { }

    const updateWidgetsIfChanged = (newWidgets) => {
      if (!Array.isArray(newWidgets)) return;
      setWidgets(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newWidgets)) {
          return prev; // Zero changes — keep exact memory reference, skip re-render!
        }
        return newWidgets;
      });
    };

    const fetchData = async (attempt = 0) => {
      if (attempt === 0 && !sessionStorage.getItem(cacheKey)) {
        setError(null);
        setLoading(true);
      }
      try {
        const res = await axios.get('/api/dashboard/operational/widgets', {
          params: { taskScope, memberId }
        });
        if (!isMounted) return;
        if (res?.data?.widgets) {
          updateWidgetsIfChanged(res.data.widgets);
          setError(null);
          setLoading(false);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(res.data.widgets));
          } catch (e) { }
          setupSSE();
        } else throw new Error('Invalid API response');
      } catch (e) {
        if (!isMounted) return;
        if (attempt < 2) {
          retry = setTimeout(() => isMounted && fetchData(attempt + 1), Math.pow(2, attempt) * 1500);
        } else {
          setError(e.message || 'Failed to load');
          setLoading(false);
        }
      }
    };

    let sseTimeout = null;
    const setupSSE = () => {
      if (!isMounted) return;
      const token = sessionStorage.getItem('serviceToken');
      const base = import.meta.env.VITE_API_URL || window.location.origin;
      if (sse) {
        sse.close();
      }
      sse = new EventSource(`${base}/api/dashboard/operational/widgets/stream?token=${token}&taskScope=${taskScope}&memberId=${memberId}`);
      sse.onmessage = (ev) => {
        if (!isMounted) return;
        try {
          const d = JSON.parse(ev.data);
          if (d.type === 'CLEAR') return;
          if (d.type === 'WIDGETS') {
            setWidgets(prev => {
              const m = new Map(prev.map(w => [w.reportSubType, w]));
              d.widgets.forEach(w => m.set(w.reportSubType, w));
              const merged = Array.from(m.values());
              if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
              return merged;
            });
            setError(null); setLoading(false);
          } else if (d?.widgets) {
            updateWidgetsIfChanged(d.widgets);
            setError(null);
            setLoading(false);
          }
        } catch (e) { console.error('SSE parse error', e); }
      };
      sse.onerror = () => {
        if (!isMounted) return;
        sse.close();
        if (sseTimeout) clearTimeout(sseTimeout);
        sseTimeout = setTimeout(() => {
          if (isMounted) {
            setupSSE();
          }
        }, 10000); // 10 seconds reconnect delay to prevent 429 connection storms
      };
    };

    fetchData();
    return () => {
      isMounted = false;
      sse?.close();
      if (retry) clearTimeout(retry);
      if (sseTimeout) clearTimeout(sseTimeout);
    };
  }, [retryTrigger, taskScope, memberId]);

  // ─── Grouped widgets ─────────────────────────────────────────────────────────
  const grouped = widgets.reduce((a, w) => {
    // Hide MEETING MOM widget as requested
    if ((w.displayName || '').toUpperCase() === 'MEETING MOM') return a;

    if (!w.permitted) {
      return a;
    }

    const m0 = w.metrics && w.metrics[0];
    const totalVal = m0 ? parseInt(m0.value, 10) : 0;

    // Hide widget if count is 0, unless userLevel is 5
    if (user?.userLevel !== 5 && (totalVal === 0 || isNaN(totalVal))) return a;

    let t = w.reportType || 'OTHER';
    if (t === 'CHECKLIST') t = 'CHECK LIST';
    if (!a[t]) a[t] = [];
    a[t].push(w);
    return a;
  }, {});

  // Add Unallocated Resources widget manually as its own standalone module card
  if (unallocatedReportPerm?.dashboard && unallocatedBreakdown.total > 0) {
    if (!grouped['UNALLOCATED RESOURCES']) grouped['UNALLOCATED RESOURCES'] = [];
    grouped['UNALLOCATED RESOURCES'].push({
      displayName: 'UNALLOCATED RESOURCES',
      reportType: 'UNALLOCATED RESOURCES',
      reportSubType: 'UNALLOCATED',
      iconName: 'IconUsers',
      modulePath: '/reports/unallocated-resource',
      permitted: true,
      metrics: [
        { label: 'Total', value: unallocatedBreakdown.total, status: 'info', navigateUrl: '/reports/unallocated-resource' },
        { label: 'Meeting', value: unallocatedBreakdown.meeting, status: 'info', navigateUrl: '/reports/unallocated-resource?awaitingAssignment=Meeting' },
        { label: 'Checklist', value: unallocatedBreakdown.checklist, status: 'info', navigateUrl: '/reports/unallocated-resource?awaitingAssignment=CheckList' },
        { label: 'Audit', value: unallocatedBreakdown.audit, status: 'info', navigateUrl: '/reports/unallocated-resource?awaitingAssignment=Audit' },
        { label: 'Awaiting Access', value: unallocatedBreakdown.userAccess, status: 'info', navigateUrl: '/reports/unallocated-resource?awaitingAssignment=User Access' }
      ]
    });
  }

  // ─── Aggregate KPIs ───────────────────────────────────────────────────────────
  const totalPending = widgets.reduce((s, w) => {
    if (!w.metrics || !w.permitted) return s;
    return s + w.metrics.reduce((ms, m) => {
      if (m.status === 'warning' || m.status === 'danger' || m.status === 'default') {
        const v = parseInt(m.value, 10); return ms + (isNaN(v) ? 0 : v);
      }
      return ms;
    }, 0);
  }, 0);

  const totalAll = widgets.reduce((s, w) => {
    if (!w.metrics || !w.permitted) return s;
    const m0 = w.metrics[0]; if (!m0) return s;
    const v = parseInt(m0.value, 10); return s + (isNaN(v) ? 0 : v);
  }, 0);

  const totalCompleted = widgets.reduce((s, w) => {
    if (!w.metrics || !w.permitted) return s;
    return s + w.metrics.reduce((ms, m) => {
      if (m.status === 'success') {
        const v = parseInt(m.value, 10); return ms + (isNaN(v) ? 0 : v);
      }
      return ms;
    }, 0);
  }, 0);

  // ─── Priority List Processing ──────────────────────────────────────────────────
  const { overdueList, pendingList } = React.useMemo(() => {
    const overdue = [];
    const pending = [];

    widgets.forEach(w => {
      if (!w.permitted || !w.metrics) return;
      w.metrics.forEach(m => {
        const val = parseInt(m.value, 10);
        if (isNaN(val) || val <= 0) return; // Only show actionable items > 0

        const item = {
          widgetName: w.displayName,
          module: w.reportType || 'OTHER',
          label: m.label,
          count: val,
          navigateUrl: m.navigateUrl || w.navigateUrl,
          iconName: w.iconName,
          status: m.status
        };

        if (m.status === 'danger') {
          item.weight = 100;
          overdue.push(item);
        } else if (m.status === 'warning') {
          item.weight = 70;
          pending.push(item);
        }
      });
    });

    overdue.sort((a, b) => b.count - a.count);
    pending.sort((a, b) => b.count - a.count);

    return { overdueList: overdue, pendingList: pending };
  }, [widgets]);

  // navigate helper
  const handleModulePathNavigate = (modulePath) => {
    if (!modulePath) return;
    try {
      const u = new URL(modulePath, window.location.origin);
      const params = {};
      u.searchParams.forEach((v, k) => { params[k] = v; });
      if (taskScope) {
        params['taskType'] = taskScope;
        params['taskScope'] = taskScope;
        u.searchParams.set('taskType', taskScope);
        u.searchParams.set('taskScope', taskScope);
      }
      if (memberId) {
        params['memberId'] = memberId;
        u.searchParams.set('memberId', memberId);
      }
      if (Object.keys(params).length) {
        dispatch(setFilters(params));
      }
      navigate(u.pathname + u.search, { state: { fromDashboard: true, taskScope, taskType: taskScope, memberId } });
    } catch (e) {
      if (memberId || taskScope) {
        dispatch(setFilters({ memberId, taskScope, taskType: taskScope }));
      }
      navigate(modulePath, { state: { fromDashboard: true, taskScope, taskType: taskScope, memberId } });
    }
  };

  const goMetric = (metric) => {
    if (!metric.navigateUrl) return;
    try {
      const u = new URL(metric.navigateUrl, window.location.origin);
      const params = {};
      u.searchParams.forEach((v, k) => { params[k] = v; });
      if (taskScope) {
        params['taskType'] = taskScope;
        params['taskScope'] = taskScope;
      }
      if (memberId) {
        params['memberId'] = memberId;
      }
      if (Object.keys(params).length) {
        if (u.pathname.includes('/qms/audit/ncr')) params['ncrStatus'] = params.status;
        if (u.pathname === '/qms/checklist/close-renewal' || u.pathname === '/qms/checklist/renewal-verify')
          if (params.statuses) params['statuses'] = params.statuses.split(',');
        dispatch(setFilters(params));
      }

      const targetUrl = new URL(metric.navigateUrl, window.location.origin);
      if (taskScope) {
        targetUrl.searchParams.set('taskType', taskScope);
        targetUrl.searchParams.set('taskScope', taskScope);
      }
      if (memberId) {
        targetUrl.searchParams.set('memberId', memberId);
      }
      navigate(targetUrl.pathname + targetUrl.search, { state: { fromDashboard: true, taskScope, taskType: taskScope, memberId } });
      return;
    } catch (e) { }
    navigate(metric.navigateUrl, { state: { fromDashboard: true, taskScope, taskType: taskScope, memberId } });
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <PageWrap data-theme={isSysDark ? 'dark' : 'light'}>
      <Box sx={{ height: 56, borderRadius: 2, bgcolor: 'rgba(255,255,255,.04)', mb: 2.5, animation: `${shimmer} 1.5s linear infinite`, backgroundSize: '600px 100%' }} />
      {[1, 2].map(s => (
        <Box key={s} sx={{ mb: 3 }}>
          <Box sx={{ height: 46, borderRadius: 2, bgcolor: 'rgba(255,255,255,.04)', mb: 1.5, animation: `${shimmer} 1.5s linear infinite`, backgroundSize: '600px 100%' }} />
          <Grid container spacing={2} justifyContent="center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} xl={3} key={i}><ShimCard /></Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </PageWrap>
  );

  // ─── Error ───────────────────────────────────────────────────────────────────
  if (error) return (
    <PageWrap data-theme={isSysDark ? 'dark' : 'light'}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', gap: 3 }}>
        <Box sx={{ width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(239,68,68,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconAlertTriangle size={44} color="#EF4444" />
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 900, color: '#EF4444', mb: 1 }}>Dashboard Unavailable</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.5)', maxWidth: 400 }}>
            Could not load your operational data. Please check connection and retry.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<IconRefresh size={18} />}
          onClick={() => setRetryTrigger(p => p + 1)}
          sx={{ px: 4, py: 1.5, borderRadius: 3, fontWeight: 700, background: 'linear-gradient(135deg,#B91C1C,#EF4444)', boxShadow: '0 8px 24px rgba(239,68,68,.3)' }}>
          Retry Dashboard
        </Button>
      </Box>
    </PageWrap>
  );

  // ─── Empty Task Queue Celebration Component ──────────────────────────────────
  function EmptyTaskQueueContent({ isSysDark, user }) {
    useEffect(() => {
      // Play celebration sound once automatically when empty screen loads
      playCelebrationSound();
    }, []);

    // Determine time-aware greeting
    const getGreeting = () => {
      const hour = new Date().getHours();
      const name = user?.name || user?.username || 'Team';
      if (hour >= 5 && hour < 12) return { text: `Good Morning, ${name}! ☀️`, sub: "You're starting the day with a clean slate!" };
      if (hour >= 12 && hour < 17) return { text: `Good Afternoon, ${name}! 🌤️`, sub: "All tasks cleared. Outstanding performance today!" };
      if (hour >= 17 && hour < 21) return { text: `Good Evening, ${name}! 🌆`, sub: "Great job finishing up your operational task queue!" };
      return { text: `Awesome Effort, ${name}! 🌙`, sub: "Everything is verified and up to date." };
    };

    const greeting = getGreeting();

    return (
      <PageWrap data-theme={isSysDark ? 'dark' : 'light'}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justify: 'center',
          minHeight: '65vh',
          gap: 2,
          textAlign: 'center',
          px: 0,
          py: 0
        }}>
          {/* Centered Celebration GIF Animation */}
          <Box sx={{
            p: 1.5,
            borderRadius: '50%',
            bgcolor: isSysDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center'
          }}>
            <Player
              autoplay
              loop
              src={lottieDeal}
              style={{ height: '250px', width: '250px' }}
            />
          </Box>

          {/* Centered Greeting & All Clear Message */}
          <Box sx={{ maxWidth: 500 }}>
            <Chip
              icon={<IconFlame size={14} color="#F59E0B" />}
              label="100% Task Completion Reached"
              size="small"
              sx={{
                bgcolor: alpha('#F59E0B', 0.12),
                color: '#F59E0B',
                fontWeight: 700,
                borderRadius: 2,
                mb: 1.5
              }}
            />

            <Typography variant="h2" sx={{
              fontWeight: 900,
              fontSize: { xs: '1.8rem', sm: '2.4rem' },
              background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #EF4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
              mb: 0.8
            }}>
              {greeting.text}
            </Typography>

            <Typography variant="h3" sx={{
              fontWeight: 800,
              color: 'text.primary',
              mb: 0.8
            }}>
              All Clear! 🎉
            </Typography>

            <Typography sx={{
              color: isSysDark ? 'rgba(255,255,255,.6)' : 'rgba(15,23,42,.6)',
              fontSize: '1.02rem',
              fontWeight: 500
            }}>
              {greeting.sub}
            </Typography>
          </Box>
        </Box>
      </PageWrap>
    );
  }

  // ─── Empty ───────────────────────────────────────────────────────────────────
  if (!Object.keys(grouped).length) return (
    <EmptyTaskQueueContent isSysDark={isSysDark} user={user} />
  );

  // ─── Sparkline data ───────────────────────────────────────────────────────────
  const sparkData = [42, 55, 47, 63, 58, 72, 68, 75, 65, 80, 74, 82].map(
    v => Math.round(v + (strHash(user?.name || 'u') % 12) - 6)
  );

  // --- MAIN RENDER ---
  return (
    <PageWrap data-theme={isSysDark ? 'dark' : 'light'}>
      <Box id="all-modules-grid-container">
        {/* Dashboard Header */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 110,
        mb: 1, pb: 1, pt: 2, mt: -2,
        background: isSysDark ? 'rgba(11, 15, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        mx: -3, px: 3,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`
      }}>

        {(() => {
          const totalTasksAll = Object.values(grouped).reduce((s, wl) => s + wl.reduce((ss, w) => {
            if (!w.metrics || !w.permitted) return ss;
            const m0 = w.metrics[0]; if (!m0) return ss;
            const v = parseInt(m0.value, 10); return ss + (isNaN(v) ? 0 : v);
          }, 0), 0);

          const pendingTasksAll = totalPending;
          const completedTasksAll = totalTasksAll >= pendingTasksAll ? totalTasksAll - pendingTasksAll : 0;

          const overdueTasksAll = Object.values(grouped).reduce((s, wl) => s + wl.reduce((ss, w) => {
            if (!w.metrics || !w.permitted) return ss;
            return ss + w.metrics.reduce((ms, m) => {
              if (m.status === 'danger') { const v = parseInt(m.value, 10); return ms + (isNaN(v) ? 0 : v); }
              return ms;
            }, 0);
          }, 0), 0);

          const todayActivity = Object.values(grouped).reduce((s, wl) => s + wl.reduce((ss, w) => {
            if (!w.metrics || !w.permitted) return ss;
            return ss + w.metrics.reduce((ms, m) => {
              const v = parseInt(m.value, 10); return ms + (isNaN(v) ? 0 : v);
            }, 0);
          }, 0), 0);

          const pendingPct = totalTasksAll > 0 ? ((pendingTasksAll / totalTasksAll) * 100).toFixed(1) : 0;
          const completedPct = totalTasksAll > 0 ? ((completedTasksAll / totalTasksAll) * 100).toFixed(1) : 0;

          return (
            <Box sx={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2
            }}>

              {/* Left: Greeting Card */}
              {/* Left: Greeting Card */}
              <Box sx={{
                color: 'text.primary', borderRadius: '4px', p: 1.5, px: 2,
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                minWidth: '260px', height: '56px', position: 'relative', overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                bgcolor: isSysDark ? '#0B0F19' : '#ffffff'
              }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 1 }}>
                  {greeting}, <span style={{ fontSize: '1rem', color: '#fc00ff' }}>{displayUserName}</span> <span style={{ fontSize: '1rem' }}>👋</span>
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5, opacity: 0.7 }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 600 }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
                  <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'currentColor' }} />
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 600 }}>Unified Dashboard</Typography>
                </Stack>
              </Box>

              {/* Middle: Metric Strip */}
              <Box sx={{
                flex: 1, bgcolor: isSysDark ? '#0B0F19' : '#ffffff', borderRadius: '4px',
                display: 'flex', alignItems: 'stretch', height: '56px',
                overflow: 'hidden', boxShadow: isSysDark ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
                border: isSysDark ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                {/* Block 1 */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, p: 1.5, position: 'relative', borderRight: isSysDark ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: 'rgba(59,130,246,0.15)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    <IconCalendarEvent size={16} strokeWidth={2.5} />
                  </Box>
                  <Box sx={{ zIndex: 1 }}>
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: isSysDark ? 'rgba(255,255,255,0.5)' : theme.palette.text.secondary, textTransform: 'uppercase', mb: 0.2 }}>Total Tasks</Typography>
                    <Stack direction="row" alignItems="baseline" spacing={0.8}>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: isSysDark ? '#fff' : theme.palette.text.primary, lineHeight: 1 }}>{totalTasksAll || 0}</Typography>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: isSysDark ? 'rgba(255,255,255,0.4)' : theme.palette.text.secondary }}>All Modules</Typography>
                    </Stack>
                  </Box>
                  <svg style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '24px', opacity: 0.15 }} viewBox="0 0 100 24" preserveAspectRatio="none">
                    <path d="M0 24 L0 12 Q10 4, 20 12 T40 12 T60 20 T80 12 T100 4 L100 24 Z" fill="#3B82F6" />
                  </svg>
                </Stack>

                {/* Block 2 */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, p: 1.5, position: 'relative', borderRight: isSysDark ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: 'rgba(139,92,246,0.15)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    <IconClock size={16} strokeWidth={2.5} />
                  </Box>
                  <Box sx={{ zIndex: 1 }}>
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: isSysDark ? 'rgba(255,255,255,0.5)' : theme.palette.text.secondary, textTransform: 'uppercase', mb: 0.2 }}>Pending Tasks</Typography>
                    <Stack direction="row" alignItems="baseline" spacing={0.8}>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: isSysDark ? '#fff' : theme.palette.text.primary, lineHeight: 1 }}>{pendingTasksAll || 0}</Typography>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: isSysDark ? 'rgba(255,255,255,0.4)' : theme.palette.text.secondary }}>{pendingPct}% of Total</Typography>
                    </Stack>
                  </Box>
                  <svg style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '24px', opacity: 0.15 }} viewBox="0 0 100 24" preserveAspectRatio="none">
                    <path d="M0 24 L0 20 Q15 12, 30 16 T60 8 T80 20 T100 4 L100 24 Z" fill="#8B5CF6" />
                  </svg>
                </Stack>

                {/* Block 3 */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, p: 1.5, position: 'relative', borderRight: isSysDark ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: 'rgba(16,185,129,0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    <IconCheck size={16} strokeWidth={3} />
                  </Box>
                  <Box sx={{ zIndex: 1 }}>
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: isSysDark ? 'rgba(255,255,255,0.5)' : theme.palette.text.secondary, textTransform: 'uppercase', mb: 0.2 }}>Completed Tasks</Typography>
                    <Stack direction="row" alignItems="baseline" spacing={0.8}>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: isSysDark ? '#fff' : theme.palette.text.primary, lineHeight: 1 }}>{completedTasksAll || 0}</Typography>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: isSysDark ? 'rgba(255,255,255,0.4)' : theme.palette.text.secondary }}>{completedPct}% of Total</Typography>
                    </Stack>
                  </Box>
                  <svg style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '24px', opacity: 0.15 }} viewBox="0 0 100 24" preserveAspectRatio="none">
                    <path d="M0 24 L0 16 Q20 4, 40 12 T70 20 T90 8 T100 12 L100 24 Z" fill="#10B981" />
                  </svg>
                </Stack>

                {/* Block 4 */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, p: 1.5, position: 'relative', borderRight: isSysDark ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: 'rgba(245,158,11,0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    <IconAlertTriangle size={16} strokeWidth={2.5} />
                  </Box>
                  <Box sx={{ zIndex: 1 }}>
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: isSysDark ? 'rgba(255,255,255,0.5)' : theme.palette.text.secondary, textTransform: 'uppercase', mb: 0.2 }}>Overdue Tasks</Typography>
                    <Stack direction="row" alignItems="baseline" spacing={0.8}>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: isSysDark ? '#fff' : theme.palette.text.primary, lineHeight: 1 }}>{overdueTasksAll ?? 0}</Typography>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: isSysDark ? 'rgba(255,255,255,0.4)' : theme.palette.text.secondary }}>Needs Attention</Typography>
                    </Stack>
                  </Box>
                  <svg style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '24px', opacity: 0.15 }} viewBox="0 0 100 24" preserveAspectRatio="none">
                    <path d="M0 24 L0 8 Q15 20, 30 16 T60 8 T80 20 T100 12 L100 24 Z" fill="#F59E0B" />
                  </svg>
                </Stack>

                {/* Block 5 */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, p: 1.5, position: 'relative' }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '6px', bgcolor: 'rgba(6,182,212,0.15)', color: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                    <IconActivity size={16} strokeWidth={2.5} />
                  </Box>
                  <Box sx={{ zIndex: 1 }}>
                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 800, color: isSysDark ? 'rgba(255,255,255,0.5)' : theme.palette.text.secondary, textTransform: 'uppercase', mb: 0.2 }}>Today's Activity</Typography>
                    <Stack direction="row" alignItems="baseline" spacing={0.8}>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 900, color: isSysDark ? '#fff' : theme.palette.text.primary, lineHeight: 1 }}>{todayActivity}</Typography>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: isSysDark ? 'rgba(255,255,255,0.4)' : theme.palette.text.secondary }}>New Updates</Typography>
                    </Stack>
                  </Box>
                  <svg style={{ position: 'absolute', bottom: 0, right: 0, width: '100%', height: '24px', opacity: 0.15 }} viewBox="0 0 100 24" preserveAspectRatio="none">
                    <path d="M0 24 L0 8 Q10 16, 25 8 T50 20 T75 4 T100 16 L100 24 Z" fill="#06B6D4" />
                  </svg>
                </Stack>
              </Box>

              {/* Right: Global Actions */}
              <Stack data-html2canvas-ignore="true" direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  startIcon={copyingId === 'all-modules-grid-container' ? <CircularProgress size={14} color="inherit" /> : copiedId === 'all-modules-grid-container' ? <IconCheck size={16} color="#10b981" /> : <IconCopy size={16} />}
                  onClick={() => {
                    if (!showAllGroups) setShowAllGroups(true);
                    setTimeout(() => {
                      handleCopyElement('all-modules-grid-container', 'All Dashboard Module Cards');
                    }, 100);
                  }}
                  sx={{
                    fontWeight: 700,
                    color: copiedId === 'all-modules-grid-container' ? '#10b981' : 'text.primary',
                    bgcolor: copiedId === 'all-modules-grid-container' ? alpha('#10b981', 0.1) : (isSysDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)'),
                    borderRadius: 20, px: 2, py: 1, fontSize: '.75rem',
                    '&:hover': { bgcolor: isSysDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)' }
                  }}
                >
                  {copyingId === 'all-modules-grid-container' ? 'Copying...' : copiedId === 'all-modules-grid-container' ? 'Copied!' : 'Copy All'}
                </Button>
                <Button size="small"
                  startIcon={Object.keys(grouped).length > 0 && Object.keys(grouped).every(key => expandedSections[key]) ? <IconArrowUpRight size={16} /> : <IconArrowDownRight size={16} />}
                  onClick={() => {
                    const allKeys = Object.keys(grouped);
                    const allExpanded = allKeys.length > 0 && allKeys.every(key => expandedSections[key]);
                    setExpandedSections(allKeys.reduce((acc, key) => ({ ...acc, [key]: !allExpanded }), {}));
                  }}
                  sx={{ fontWeight: 700, color: 'text.primary', bgcolor: isSysDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)', borderRadius: 20, px: 2, py: 1, fontSize: '.75rem', '&:hover': { bgcolor: isSysDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)' } }}>
                  {Object.keys(grouped).length > 0 && Object.keys(grouped).every(key => expandedSections[key]) ? 'Collapse All' : 'Expand All'}
                </Button>
              </Stack>

            </Box>
          );
        })()}
      </Box>

      {/* 🚀 My Priority Work (Action Center) 🚀 - Temporarily disabled */}
      {false /* (overdueList.length > 0 || pendingList.length > 0) */ && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'stretch' }}>
          {/* Fixed Left Section */}
          <Box sx={{ minWidth: 160, flexShrink: 0 }}>

            <Stack spacing={0.5}>
              {overdueList.length > 0 && (
                <Typography component="span" sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#EF4444', animation: `${pulseDot} 2s infinite` }} />
                  Overdue ({overdueList.reduce((s, i) => s + i.count, 0)})
                </Typography>
              )}
              {pendingList.length > 0 && (
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconClock size={12} strokeWidth={2.5} />
                  Pending ({pendingList.reduce((s, i) => s + i.count, 0)})
                </Typography>
              )}
            </Stack>

          </Box>

          {/* Scrolling Right Section */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <StandardSlider>
              <Slider {...{
                dots: false,
                infinite: true,
                slidesToShow: isLg ? 4 : isMd ? 3 : isSm ? 2 : 1,
                slidesToScroll: 1,
                autoplay: true,
                speed: 4000,
                autoplaySpeed: 0,
                cssEase: "linear",
                arrows: false,
                pauseOnHover: true,
                rtl: isReverseScroll
              }}>
                {[...overdueList.map(i => ({ ...i, type: 'OVERDUE' })), ...pendingList.map(i => ({ ...i, type: 'PENDING' }))].map((item, idx) => {
                  const isOverdue = item.type === 'OVERDUE';
                  const col = isOverdue ? '#EF4444' : '#F59E0B';
                  const bg = isOverdue ? (isSysDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)') : (isSysDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)');

                  return (
                    <Box key={`pw-${idx}`} sx={{ p: 1 }} dir="ltr">
                      <Box onClick={() => goMetric(item)} sx={{
                        p: 1.5, borderRadius: 3, bgcolor: isSysDark ? 'rgba(0,0,0,0.2)' : '#fff', cursor: 'pointer',
                        border: `1px solid ${alpha(col, 0.15)}`, transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 1.5, height: '100%',
                        boxShadow: `0 4px 15px ${alpha(col, 0.05)}`,
                        '&:hover': { bgcolor: bg, borderColor: alpha(col, 0.3), transform: 'translateY(-2px)' }
                      }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(col, 0.1), color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {getIcon(item.iconName, 20)}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.widgetName}</Typography>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase' }}>{item.module}</Typography>
                        </Box>
                        <Box sx={{ px: 1.5, py: 0.5, borderRadius: '12px', bgcolor: isOverdue ? col : alpha(col, 0.15), color: isOverdue ? '#fff' : col, fontWeight: 800, fontSize: '0.85rem', border: isOverdue ? 'none' : `1px solid ${alpha(col, 0.2)}`, flexShrink: 0 }}>
                          {item.count}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Slider>
            </StandardSlider>
          </Box>
        </Box>
      )}

      {/* 🚀 Module Sections (Priority 3) 🚀 */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>

        <Divider sx={{ flex: 1, ml: 2, borderColor: alpha(theme.palette.divider, 0.1) }} />
      </Box>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)'
        },
        gap: 2,
        alignItems: 'stretch',
        overflowX: 'hidden'
      }}>



        {(() => {
          const getGroupTotal = (type) => grouped[type].reduce((s, w) => {
            if (!w.metrics || !w.permitted) return s;
            const m0 = w.metrics[0]; if (!m0) return s;
            const v = parseInt(m0.value, 10); return s + (isNaN(v) ? 0 : v);
          }, 0);
          const sortedKeys = Object.keys(grouped).sort((a, b) => getGroupTotal(b) - getGroupTotal(a));
          const visibleKeys = showAllGroups ? sortedKeys : sortedKeys.slice(0, currentCols * 2);

          return visibleKeys.map((type, sIdx) => {
            const mc = getMC(type);
            const wlist = grouped[type];
            const groupLottie = getGroupLottie(type);
            const secTotal = wlist.reduce((s, w) => {
              if (!w.metrics || !w.permitted) return s;
              const m0 = w.metrics[0]; if (!m0) return s;
              const v = parseInt(m0.value, 10); return s + (isNaN(v) ? 0 : v);
            }, 0);
            let secOverdue = 0, secPending = 0, secClosed = 0, secPend = 0;
            wlist.forEach(w => {
              if (w.metrics && w.permitted) {
                w.metrics.forEach(m => {
                  const v = parseInt(m.value, 10) || 0;
                  if (m.status === 'danger') { secOverdue += v; secPend += v; }
                  else if (m.status === 'warning') { secPending += v; secPend += v; }
                  else if (m.status === 'success') secClosed += v;
                });
              }
            });

            const colSpan = !expandedSections[type] ? 1 : Math.min(wlist.length, currentCols);

            return (
              <Box key={type} sx={{
                order: -secTotal,
                gridColumn: {
                  xs: 'span 1',
                  sm: `span ${Math.min(colSpan, 2)}`,
                  md: `span ${Math.min(colSpan, 3)}`,
                  lg: `span ${colSpan}`
                },
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box'
              }}>
                {!expandedSections[type] ? (
                  <WCard
                    id={`collapsed-module-card-${type.replace(/[^a-zA-Z0-9]/g, '')}`}
                    col={mc.color} cidx={0} permitted={true} elevation={0}
                    sx={{
                      height: 140, display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer', overflow: 'hidden', borderRadius: '20px',
                      background: theme.palette.mode === 'dark' ? `linear-gradient(135deg, ${alpha(mc.color, 0.2)} 0%, rgba(0,0,0,0) 100%)` : `linear-gradient(135deg, ${alpha(mc.color, 0.1)} 0%, #ffffff 100%)`,
                      border: `1px solid ${alpha(mc.color, 0.2)}`,
                      boxShadow: `0 8px 32px ${alpha(mc.color, 0.1)}`,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: `0 12px 40px ${alpha(mc.color, 0.2)}`,
                        border: `1px solid ${alpha(mc.color, 0.4)}`,
                      }
                    }}
                    onClick={() => toggleSection(type)}
                  >
                    {/* Top Right Copy Button for Collapsed Module Card */}
                    <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                      <IconButton
                        data-html2canvas-ignore="true"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyElement(
                            `collapsed-module-card-${type.replace(/[^a-zA-Z0-9]/g, '')}`,
                            type,
                            { type: 'COLLAPSED_MODULE', moduleName: type, total: secTotal, overdue: secOverdue, pending: secPending }
                          );
                        }}
                        sx={{
                          color: copiedId === `collapsed-module-card-${type.replace(/[^a-zA-Z0-9]/g, '')}` ? '#10b981' : 'text.secondary',
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                          backdropFilter: 'blur(4px)',
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)'
                          }
                        }}
                      >
                        {copyingId === `collapsed-module-card-${type.replace(/[^a-zA-Z0-9]/g, '')}` ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : copiedId === `collapsed-module-card-${type.replace(/[^a-zA-Z0-9]/g, '')}` ? (
                          <IconCheck size={16} color="#10b981" />
                        ) : (
                          <IconCopy size={16} />
                        )}
                      </IconButton>
                    </Box>

                    {/* Abstract Decor Circles */}
                    <Box sx={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(mc.color, 0.2)} 0%, transparent 70%)`, zIndex: 0 }} />
                    <Box sx={{ position: 'absolute', bottom: -30, right: 30, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(mc.color, 0.15)} 0%, transparent 70%)`, zIndex: 0 }} />

                    {/* Lottie Container */}
                    <Box sx={{
                      position: 'absolute', top: '50%', right: -15, transform: 'translateY(-50%)',
                      width: 140, height: 140,
                      zIndex: 1, pointerEvents: 'none',
                      opacity: 0.95, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
                      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '.MuiPaper-root:hover &': { transform: 'translateY(-50%) scale(1.15) rotate(-3deg)' }
                    }}>
                      <Player autoplay loop src={groupLottie} style={{ width: '100%', height: '100%' }} background="transparent" />
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5, zIndex: 2, position: 'relative' }}>
                      {/* Content Container */}
                      <Stack direction="row" alignItems="center" spacing={2.5} sx={{ height: '100%', mt: 0.5 }}>
                        {/* Icon Box */}
                        <Box sx={{
                          width: 60, height: 60, borderRadius: '16px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: mc.grad, color: '#fff',
                          boxShadow: `0 6px 16px ${alpha(mc.color, 0.4)}`,
                          transition: 'transform 0.3s',
                          flexShrink: 0,
                          '.MuiPaper-root:hover &': { transform: 'scale(1.05) rotate(5deg)' }
                        }}>
                          {getGroupIcon(type, 32)}
                        </Box>

                        {/* Title and Number Column */}
                        <Stack direction="column" spacing={0.3} sx={{ maxWidth: '60%' }}>
                          <Typography sx={{
                            fontWeight: 900, fontSize: '0.9rem', textTransform: 'uppercase',
                            color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary,
                            lineHeight: 1.2, letterSpacing: '0.03em', wordBreak: 'break-word',
                            textShadow: theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.5)' : 'none'
                          }}>
                            {type}
                          </Typography>
                          <Typography sx={{
                            fontWeight: 900, fontSize: '1.5rem', lineHeight: 1,
                            color: mc.color,
                            filter: `drop-shadow(0 2px 4px ${alpha(mc.color, 0.3)})`
                          }}>
                            {secTotal}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '2px 6px', mt: 0.5, alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: theme.palette.mode === 'dark' ? '#F87171' : '#EF4444' }}>
                              {secOverdue} <span style={{ fontWeight: 600, opacity: 0.8 }}>Overdue</span>
                            </Typography>
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: theme.palette.mode === 'dark' ? '#FBBF24' : '#F59E0B' }}>
                              {secPending} <span style={{ fontWeight: 600, opacity: 0.8 }}>Pending</span>
                            </Typography>

                          </Box>
                        </Stack>
                      </Stack>


                    </Box>
                  </WCard>
                ) : (
                  <SectionGroup id={`module-section-${type.replace(/[^a-zA-Z0-9]/g, '')}`} col={mc.color} sx={{ height: '100%', mb: 0, display: 'flex', flexDirection: 'column' }}>
                    {/* Section Header */}
                    <SectionHeader col={mc.color} onClick={() => toggleSection(type)} sx={{ cursor: 'pointer', py: 1, px: 1.5, minHeight: 48, flexShrink: 0 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" sx={{ width: '100%' }}>
                        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                          <Box sx={{
                            width: 32, height: 32, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: mc.grad, boxShadow: `0 2px 8px ${alpha(mc.color, .4)}`,
                            color: '#fff'
                          }}>
                            {getGroupIcon(type, 18)}
                          </Box>
                          <Stack direction="column" spacing={0} sx={{ mr: { xs: 0, sm: 2 } }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.03em', textTransform: 'uppercase', color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary, lineHeight: 1.1 }}>
                              {type}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={`${wlist.length} Widgets`} size="small"
                              sx={{ height: 20, fontSize: '.65rem', fontWeight: 700, bgcolor: alpha(mc.color, .12), color: mc.color, border: `1px solid ${alpha(mc.color, .2)}`, borderRadius: '4px' }} />
                            <Chip label={`${secTotal} Total Tasks`} size="small"
                              sx={{ height: 20, fontSize: '.65rem', fontWeight: 700, bgcolor: alpha(mc.color, .12), color: mc.color, border: `1px solid ${alpha(mc.color, .2)}`, borderRadius: '4px' }} />
                            {secPend > 0 && (
                              <Chip label={`${secPend} Pending`} size="small"
                                sx={{ height: 20, fontSize: '.65rem', fontWeight: 700, bgcolor: 'rgba(239,68,68,.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,.3)', borderRadius: '4px' }} />
                            )}
                          </Stack>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <IconButton data-html2canvas-ignore="true" size="small" onClick={(e) => { e.stopPropagation(); handleCopyElement(`module-section-${type.replace(/[^a-zA-Z0-9]/g, '')}`, type, { type: 'MODULE_SECTION', moduleName: type, total: secTotal, pending: secPend }); }} sx={{ color: copiedId === `module-section-${type.replace(/[^a-zA-Z0-9]/g, '')}` ? '#10b981' : 'text.secondary' }}>
                            {copyingId === `module-section-${type.replace(/[^a-zA-Z0-9]/g, '')}` ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : copiedId === `module-section-${type.replace(/[^a-zA-Z0-9]/g, '')}` ? (
                              <IconCheck size={18} color="#10b981" />
                            ) : (
                              <IconCopy size={18} />
                            )}
                          </IconButton>
                          <IconButton data-html2canvas-ignore="true" size="small" sx={{ color: 'text.secondary' }}>
                            {expandedSections[type] ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                          </IconButton>
                        </Stack>
                      </Stack>
                    </SectionHeader>

                    {/* Widget Cards */}
                    <Collapse in={expandedSections[type]} timeout="auto" unmountOnExit>
                      <Box sx={{ pt: 1.5 }}>
                        {(() => {
                          const renderedWidgets = wlist.map((widget, cidx) => {
                            const BADGE_COLORS = [
                              'linear-gradient(135deg, #1D4ED8, #3B82F6, #60A5FA)', // Blue
                              'linear-gradient(135deg, #5B21B6, #8B5CF6, #A78BFA)', // Purple
                              'linear-gradient(135deg, #047857, #10B981, #34D399)', // Green
                              'linear-gradient(135deg, #B45309, #F59E0B, #FBBF24)', // Orange
                              'linear-gradient(135deg, #9F1239, #F43F5E, #FB7185)', // Pink
                              'linear-gradient(135deg, #0369A1, #0EA5E9, #7DD3FC)', // Cyan
                            ];
                            const badgeGrad = BADGE_COLORS[cidx % BADGE_COLORS.length];
                            const isPermitted = widget.permitted;
                            const metrics = widget.metrics || [];
                            const m0 = metrics[0];
                            const rest = metrics.slice(1);
                            const lottieData = getLottieData(widget.displayName);

                            // Completion donut
                            let donutPct = 0;
                            let showDonut = false;
                            const totalVal = m0 ? parseInt(m0.value, 10) : 0;
                            const restSum = rest.reduce((s, m) => s + (parseInt(m.value, 10) || 0), 0);

                            const sSum = metrics.filter(m => m.status === 'success').reduce((s, m) => s + (parseInt(m.value, 10) || 0), 0);
                            const tSum = metrics.reduce((s, m) => s + (parseInt(m.value, 10) || 0), 0);
                            donutPct = tSum > 0 ? Math.min(100, Math.round((sSum / tSum) * 100)) : 0;
                            showDonut = donutPct > 0 || metrics.some(m => m.status === 'success');
                            if (widget.reportType === 'MEETING' || widget.reportType === 'AUDIT' || widget.reportSubType === 'ACKNOWLEDGEMENT' || widget.displayName?.trim().toUpperCase() === 'CALL LETTER') showDonut = false;

                            // Pending progress
                            const pendSum = metrics.filter(m => m.status === 'warning' || m.status === 'danger').reduce((s, m) => s + (parseInt(m.value, 10) || 0), 0);
                            const tSum2 = metrics.reduce((s, m) => s + (parseInt(m.value, 10) || 0), 0);
                            const progPct = tSum2 > 0 ? Math.min(100, Math.round(((tSum2 - pendSum) / tSum2) * 100)) : 0;

                            let progLabel = '';
                            const dn = widget.displayName.toLowerCase();
                            if (dn.includes('acknowledgement')) progLabel = '';
                            else if (dn.includes('verify')) progLabel = 'Verification Progress';
                            else if (dn.includes('close')) progLabel = 'Action Progress';
                            else if (dn.includes('mom')) progLabel = 'Completion Rate';

                            // Trend
                            const { val: tVal, dir: tDir } = getTrend(widget.displayName || '');

                            return (
                              <Box key={cidx} sx={{ display: 'flex', flexDirection: 'column', mx: 'auto', width: '100%', maxWidth: '320px', height: '100%' }}>
                                <WCard id={`widget-card-${type.replace(/[^a-zA-Z0-9]/g, '')}-${cidx}`} col={mc.color} cidx={sIdx * 12 + cidx} permitted={isPermitted} elevation={0} sx={{ flex: 1 }}>

                                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1 }}>

                                    {/* 1. Header: Icon Badge + Label */}
                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, zIndex: 1, position: 'relative' }}>
                                      <Stack direction="row" alignItems="center" spacing={1.2} sx={{ cursor: 'pointer', '&:hover': { opacity: 0.8 }, maxWidth: '80%' }} onClick={() => widget.modulePath && handleModulePathNavigate(widget.modulePath)}>
                                        <Box sx={{
                                          width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          background: isPermitted ? badgeGrad : 'rgba(255,255,255,.05)',
                                          boxShadow: isPermitted ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                                        }}>
                                          {isPermitted ? getIcon(widget.iconName, 17) : <IconLock size={16} color="rgba(255,255,255,.3)" />}
                                        </Box>
                                        <Typography sx={{ fontWeight: 800, fontSize: '.88rem', letterSpacing: '.03em', textTransform: 'uppercase', color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {widget.displayName}
                                        </Typography>
                                      </Stack>
                                      <IconButton data-html2canvas-ignore="true" size="small" onClick={(e) => { e.stopPropagation(); handleCopyElement(`widget-card-${type.replace(/[^a-zA-Z0-9]/g, '')}-${cidx}`, widget.displayName, { type: 'WIDGET_CARD', moduleName: type, widget }); }} sx={{ color: copiedId === `widget-card-${type.replace(/[^a-zA-Z0-9]/g, '')}-${cidx}` ? '#10b981' : 'text.secondary' }}>
                                        {copyingId === `widget-card-${type.replace(/[^a-zA-Z0-9]/g, '')}-${cidx}` ? (
                                          <CircularProgress size={14} color="inherit" />
                                        ) : copiedId === `widget-card-${type.replace(/[^a-zA-Z0-9]/g, '')}-${cidx}` ? (
                                          <IconCheck size={16} color="#10b981" />
                                        ) : (
                                          <IconCopy size={16} />
                                        )}
                                      </IconButton>
                                    </Stack>

                                    {/* Absolute Lottie Animation safely positioned away from text */}
                                    <Box sx={{
                                      position: 'absolute', top: 10, right: 0,
                                      width: 100, height: 100,
                                      zIndex: 0, pointerEvents: 'none',
                                    }}>
                                      <Player autoplay loop src={lottieData} style={{ width: '100%', height: '100%' }} background="transparent" />
                                    </Box>

                                    {!isPermitted ? (
                                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pb: 2, gap: 1 }}>
                                        <IconLock size={30} color="rgba(255,255,255,.2)" strokeWidth={1.5} />
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>Access Restricted</Typography>
                                      </Box>
                                    ) : widget.reportSubType === 'ERROR' ? (
                                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pb: 2, gap: 1 }}>
                                        <IconAlertTriangle size={28} color="#EF4444" strokeWidth={1.5} />
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.4)', fontWeight: 600 }}>Failed to load data</Typography>
                                      </Box>
                                    ) : (
                                      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

                                        {/* 2. Main Value */}
                                        <Box sx={{ position: 'relative', mb: 1.5, minHeight: 50, zIndex: 1 }}>
                                          <Box sx={{ pr: '90px', cursor: 'pointer', '&:hover': { opacity: 0.8 } }} onClick={() => { if (m0?.navigateUrl) { goMetric(m0); } else if (widget.modulePath) { handleModulePathNavigate(widget.modulePath); } }}>
                                            <Typography sx={{ fontSize: '2.1rem', fontWeight: 900, color: 'text.primary', lineHeight: 1, letterSpacing: '-0.02em' }}>
                                              {m0 ? m0.value : '—'}
                                            </Typography>
                                            <Typography sx={{ fontSize: '.75rem', fontWeight: 600, color: 'text.secondary', mt: 0.8 }}>
                                              {m0 ? (type === 'APPLICANT TRACKING SYSTEM (ATS)' ? 'Total' : m0.label) : ''}
                                            </Typography>
                                          </Box>
                                        </Box>

                                        {/* Divider 1 */}
                                        <Divider sx={{ mb: 1.5, borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />

                                        {/* 3. Sub-Metrics & Donut */}
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ flex: 1, minHeight: 0, zIndex: 1 }}>
                                          {rest.length > 0 && (
                                            <Stack spacing={0.8} sx={{ minWidth: 0, flex: 1, mr: showDonut ? 1 : 0 }}>
                                              {rest.filter(m => {
                                                // Temporarily hide 'Closed' metric for 'CLOSE MOM' widget as requested
                                                if (widget.displayName?.trim().toUpperCase() === 'CLOSE MOM' && m.label?.trim().toUpperCase() === 'CLOSED') return false;
                                                return user?.userLevel === 5 || parseInt(m.value, 10) !== 0 || widget.reportType === 'UNALLOCATED RESOURCES' || widget.reportSubType === 'ACKNOWLEDGEMENT';
                                              }).map((metric, mi) => {
                                                const ss = getSS(metric.status);
                                                return (
                                                  <Stack key={mi} direction="row" alignItems="center" justifyContent="space-between" onClick={() => goMetric(metric)} sx={{ cursor: metric.navigateUrl ? 'pointer' : 'default', '&:hover': { opacity: 0.8 } }}>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: ss.dot, flexShrink: 0, animation: ss.pulse ? `${pulseDot} 2s infinite` : 'none' }} />
                                                      <Typography sx={{ fontSize: '.75rem', fontWeight: 600, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {metric.label}
                                                      </Typography>
                                                    </Stack>
                                                    <Box sx={{ px: 1.2, py: 0.2, borderRadius: 2, bgcolor: ss.bg, color: ss.txt, fontSize: '.75rem', fontWeight: 800 }}>
                                                      {metric.value}
                                                    </Box>
                                                  </Stack>
                                                );
                                              })}
                                            </Stack>
                                          )}

                                          {showDonut && (
                                            <Box sx={{ flexShrink: 0 }}>
                                              <DonutProgress pct={donutPct} color={mc.color} size={64} label={widget.displayName.toLowerCase().includes('attendance') ? 'PRESENT' : 'DONE'} />
                                            </Box>
                                          )}
                                        </Stack>

                                        {/* 4. Footer (Trend or Progress) */}
                                        {progLabel ? (
                                          <Box sx={{ mt: 'auto', pt: 1.5 }}>
                                            <Stack direction="row" justifyContent="space-between" sx={{ mb: .55 }}>
                                              <Typography sx={{ fontSize: '.65rem', fontWeight: 700, color: 'text.secondary' }}>
                                                {progLabel}
                                              </Typography>
                                              <Typography sx={{ fontSize: '.65rem', fontWeight: 800, color: 'text.primary' }}>
                                                {progPct}%
                                              </Typography>
                                            </Stack>
                                            <LinearProgress variant="determinate" value={progPct}
                                              sx={{
                                                height: 4, borderRadius: 4,
                                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)',
                                                '& .MuiLinearProgress-bar': {
                                                  borderRadius: 4,
                                                  background: badgeGrad
                                                }
                                              }} />
                                          </Box>
                                        ) : (
                                          <Box sx={{ mt: 'auto', pt: 1.2 }}>
                                            <Divider sx={{ mb: 1, borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }} />
                                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                              <Typography sx={{ fontSize: '.65rem', fontWeight: 600, color: 'text.secondary' }}>
                                                vs Yesterday
                                              </Typography>
                                              <Stack direction="row" alignItems="center" spacing={0.4}>
                                                {tDir === 0 && <IconArrowUpRight size={13} color="#22C55E" />}
                                                {tDir === 1 && <IconArrowDownRight size={13} color="#EF4444" />}
                                                {tDir === 2 && <IconArrowRight size={13} color="#94A3B8" />}
                                                <Typography sx={{ fontSize: '.7rem', fontWeight: 800, color: tDir === 0 ? '#22C55E' : tDir === 1 ? '#EF4444' : '#94A3B8' }}>
                                                  {tDir === 2 ? '→' : `${tDir === 0 ? '+' : '-'}${tVal}%`}
                                                </Typography>
                                              </Stack>
                                            </Stack>
                                          </Box>
                                        )}
                                      </Box>
                                    )}
                                  </Box>
                                </WCard>
                              </Box>
                            );
                          });

                          return (
                            <Box sx={{
                              display: 'grid',
                              gridTemplateColumns: `repeat(${colSpan}, minmax(0, 1fr))`,
                              gap: 2,
                              alignItems: 'stretch'
                            }}>
                              {renderedWidgets}
                            </Box>
                          );
                        })()}
                      </Box>
                    </Collapse>
                  </SectionGroup>
                )}
              </Box>
            );
          });
        })()}
      </Box>

      {Object.keys(grouped).length > currentCols * 2 && (
        <Box data-html2canvas-ignore="true" sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 1 }}>
          <Button
            onClick={() => {
              const nextState = !showAllGroups;
              setShowAllGroups(nextState);
              if (nextState) {
                setTimeout(() => window.scrollBy({ top: 300, behavior: 'smooth' }), 100);
              }
            }}
            variant="outlined"
            endIcon={showAllGroups ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            sx={{ borderRadius: 20, px: 3, fontWeight: 700, borderColor: theme.palette.divider, color: 'text.primary' }}
          >
            {showAllGroups ? 'View Less' : 'View More Modules'}
          </Button>
        </Box>
      )}

      </Box>
    </PageWrap>
  );
}
