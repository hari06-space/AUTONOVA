import PropTypes from 'prop-types';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme, alpha, useColorScheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import Drawer from '@mui/material/Drawer';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import Grow from '@mui/material/Grow';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Chip from '@mui/material/Chip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Badge from '@mui/material/Badge';

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconAdjustmentsHorizontal,
  IconLayoutGrid,
  IconUsers,
  IconTarget,
  IconClipboardList,
  IconRobot,
  IconTruck,
  IconBuildingBank,
  IconCompass,
  IconTools,
  IconCertificate,
  IconChartBar,
  IconApps,
  IconSearch,
  IconSparkles,
  IconBolt,
  IconX,
  IconArrowRight,
  IconFolders,
  IconFlame,
  IconAtom2,
  IconStar,
  IconLayersLinked,
  IconRadar,
  IconExternalLink,
  IconCpu,
  IconBookmark
} from '@tabler/icons-react';

import { MODULE_ICONS } from '../SpeedDialConfigModal';

// Vibrant HSL tailored palettes for all ERP modules
const DEFAULT_MODULE_CONFIG = {
  master: { color: '#3b82f6', secondary: '#60a5fa', icon: IconLayoutGrid, tag: 'CORE' },
  hra: { color: '#f97316', secondary: '#fb923c', icon: IconUsers, tag: 'PEOPLE' },
  sales: { color: '#10b981', secondary: '#34d399', icon: IconTarget, tag: 'GROWTH' },
  planning: { color: '#6366f1', secondary: '#818cf8', icon: IconClipboardList, tag: 'PLAN' },
  production: { color: '#8b5cf6', secondary: '#a78bfa', icon: IconRobot, tag: 'OPS' },
  stores: { color: '#d97706', secondary: '#f59e0b', icon: IconTruck, tag: 'LOGISTICS' },
  finance: { color: '#eab308', secondary: '#fde047', icon: IconBuildingBank, tag: 'ACCOUNTS' },
  design: { color: '#a855f7', secondary: '#c084fc', icon: IconCompass, tag: 'R&D' },
  maintenance: { color: '#22c55e', secondary: '#4ade80', icon: IconTools, tag: 'MAINT' },
  qms: { color: '#ec4899', secondary: '#f472b6', icon: IconCertificate, tag: 'QUALITY' },
  reports: { color: '#14b8a6', secondary: '#2dd4bf', icon: IconChartBar, tag: 'BI' },
  dashboard: { color: '#0ea5e9', secondary: '#38bdf8', icon: IconLayoutGrid, tag: 'HUB' },
  support: { color: '#ef4444', secondary: '#f87171', icon: IconTools, tag: 'HELP' },
  purchase: { color: '#f59e0b', secondary: '#fbbf24', icon: IconTruck, tag: 'PROCURE' },
  quality: { color: '#84cc16', secondary: '#a3e635', icon: IconCertificate, tag: 'QA' },
  npd: { color: '#06b6d4', secondary: '#22d3ee', icon: IconCompass, tag: 'INNOVATION' },
  crm: { color: '#e879f9', secondary: '#f0abfc', icon: IconTarget, tag: 'CRM' },
  hr: { color: '#fb923c', secondary: '#fdba74', icon: IconUsers, tag: 'HR' },
  asset: { color: '#a78bfa', secondary: '#c4b5fd', icon: IconTools, tag: 'ASSETS' },
  'sales & marketing': { color: '#10b981', secondary: '#34d399', icon: IconTarget, tag: 'GROWTH' },
  'planning & production': { color: '#6366f1', secondary: '#818cf8', icon: IconClipboardList, tag: 'PLAN' },
  'stores & logistics': { color: '#d97706', secondary: '#f59e0b', icon: IconTruck, tag: 'LOGISTICS' },
  'finance & accounts': { color: '#eab308', secondary: '#fde047', icon: IconBuildingBank, tag: 'ACCOUNTS' },
  'design & development': { color: '#a855f7', secondary: '#c084fc', icon: IconCompass, tag: 'R&D' },
  'employee self': { color: '#38bdf8', secondary: '#7dd3fc', icon: IconUsers, tag: 'ESS' },
  'client management': { color: '#f43f5e', secondary: '#fb7185', icon: IconTarget, tag: 'CLIENTS' }
};

const AUTO_COLOR_PALETTE = [
  '#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ec4899',
  '#eab308', '#14b8a6', '#a855f7', '#22c55e', '#ef4444',
  '#06b6d4', '#d97706', '#f59e0b', '#6366f1', '#84cc16',
  '#0ea5e9', '#e879f9', '#fb923c', '#a78bfa', '#38bdf8'
];

const getModuleConfig = (group, modulePrefs, index = 0) => {
  const pref = modulePrefs[group?.id] || {};
  const key = group?.id?.toLowerCase();
  const titleKey = group?.title?.toLowerCase();
  const defaultByKey = DEFAULT_MODULE_CONFIG[key] || DEFAULT_MODULE_CONFIG[titleKey];
  const color = pref.color || defaultByKey?.color || AUTO_COLOR_PALETTE[index % AUTO_COLOR_PALETTE.length];
  const secondary = defaultByKey?.secondary || alpha(color, 0.7);
  const icon = (pref.icon && MODULE_ICONS[pref.icon]) || group?.icon || defaultByKey?.icon || IconLayoutGrid;
  const tag = defaultByKey?.tag || 'MODULE';
  return { color, secondary, icon, tag };
};

// Flatten leaves
const getLeafItems = (nodes) => {
  const leaves = [];
  const walk = (items) => {
    if (!items) return;
    for (const item of items) {
      if (item.type === 'item' && item.url) {
        leaves.push(item);
      }
      if (item.children) {
        walk(item.children);
      }
    }
  };
  walk(nodes);
  return leaves;
};

// ==============================|| QUANTUM COMMAND DECK ||============================== //

export default function QuantumRibbon({
  groups = [],
  speedDialPreferences = {},
  modulePrefs = {},
  expandedGroupId,
  setExpandedGroupId,
  handleEditClick,
  prevPageItem,
  nextPageItem,
  ribbonOpen = true,
  onCollapse,
  altMode = false,
  altActiveGroupId = null,
  altChildItems = [],
  dismissAlt
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, systemMode } = useColorScheme();
  const computedMode = mode === 'system' ? systemMode : mode;
  const isDark = computedMode === 'dark' || theme.palette.mode === 'dark';

  // Mouse spotlight coordinates
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const dockRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!dockRef.current) return;
    const rect = dockRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  // Hover & Cascading Flyout Menu state
  const [hoverMenu, setHoverMenu] = useState(null); // { anchorEl, group, groupColor }
  const [level1Item, setLevel1Item] = useState(null);
  const [level1AnchorEl, setLevel1AnchorEl] = useState(null);
  const [level2Item, setLevel2Item] = useState(null);
  const [level2AnchorEl, setLevel2AnchorEl] = useState(null);
  const hoverTimeoutRef = useRef(null);

  // Spotlight in-ribbon fast search state
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState('');
  const spotlightAnchorRef = useRef(null);
  const spotlightInputRef = useRef(null);

  // Pinned favorite pages state
  const [pinnedPages, setPinnedPages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('quantum_pinned_pages') || '[]');
    } catch {
      return [];
    }
  });

  const togglePinPage = (page) => {
    setPinnedPages((prev) => {
      const exists = prev.some((p) => p.url === page.url);
      const updated = exists ? prev.filter((p) => p.url !== page.url) : [...prev, page];
      localStorage.setItem('quantum_pinned_pages', JSON.stringify(updated));
      return updated;
    });
  };

  // Build flattened all pages for global spotlight search
  const allErpPages = useMemo(() => {
    const all = [];
    groups.forEach((g) => {
      const leaves = getLeafItems(g.children || []);
      leaves.forEach((l) => {
        all.push({
          ...l,
          moduleTitle: g.title,
          moduleId: g.id,
          moduleColor: getModuleConfig(g, modulePrefs).color
        });
      });
    });
    return all;
  }, [groups, modulePrefs]);

  // Spotlight filtered results
  const spotlightResults = useMemo(() => {
    if (!spotlightQuery.trim()) return allErpPages.slice(0, 8);
    const q = spotlightQuery.toLowerCase().trim();
    return allErpPages
      .filter((p) =>
        p.title.toLowerCase().includes(q) ||
        (p.pageCode && p.pageCode.toLowerCase().includes(q)) ||
        p.moduleTitle.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [allErpPages, spotlightQuery]);

  // Hotkey listener for Spotlight search (Ctrl+K or /)
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey && (e.key === 'k' || e.key === 'K')) || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName))) {
        e.preventDefault();
        setSpotlightOpen(true);
        setTimeout(() => {
          spotlightInputRef.current?.focus();
        }, 100);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Detect active module group
  const activeGroupId = useMemo(() => {
    if (expandedGroupId) return expandedGroupId;
    for (const g of groups) {
      if (g.children?.some((c) => (c.url && location.pathname.startsWith(c.url)) || c.children?.some((sc) => sc.url && location.pathname.startsWith(sc.url)))) {
        return g.id;
      }
    }
    return groups[0]?.id || '';
  }, [groups, expandedGroupId, location.pathname]);

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || groups[0];
  }, [groups, activeGroupId]);

  const activeGroupIndex = useMemo(() => {
    return groups.findIndex((g) => g.id === activeGroupId);
  }, [groups, activeGroupId]);

  const activeGroupConfig = useMemo(() => {
    return getModuleConfig(activeGroup || {}, modulePrefs, activeGroupIndex >= 0 ? activeGroupIndex : 0);
  }, [activeGroup, modulePrefs, activeGroupIndex]);

  // Current active page title for live breadcrumb
  const currentPageInfo = useMemo(() => {
    const activePage = allErpPages.find((p) => p.url && location.pathname.startsWith(p.url));
    return activePage || null;
  }, [allErpPages, location.pathname]);

  // Level 1 KeyTips reserved keys
  const level1Keys = useMemo(() => {
    return new Set(groups.map((g) => g._keyTip).filter(Boolean));
  }, [groups]);

  function assignKeyTips(items, reservedKeys = new Set()) {
    const used = new Set(reservedKeys);
    return items.map((item) => {
      const title = (item.title || '').toUpperCase().replace(/[^A-Z]/g, '');
      let key = null;
      if (item._keyTip && !used.has(item._keyTip)) {
        key = item._keyTip;
      } else {
        for (const ch of title) {
          if (!used.has(ch)) {
            key = ch;
            break;
          }
        }
        if (!key) {
          for (let i = 65; i <= 90; i++) {
            const ch = String.fromCharCode(i);
            if (!used.has(ch)) {
              key = ch;
              break;
            }
          }
        }
      }
      if (key) used.add(key);
      return { ...item, _keyTip: key };
    });
  }

  // Active Speed Dial leaf items
  const activeSubItems = useMemo(() => {
    if (!activeGroup || !activeGroup.children) return [];

    const leafItems = getLeafItems(activeGroup.children);
    const prefIds = speedDialPreferences[activeGroup.id];

    let items = [];
    if (prefIds && prefIds.length > 0) {
      const speedDialItems = leafItems
        .filter((item) => prefIds.includes(item.id))
        .sort((a, b) => prefIds.indexOf(a.id) - prefIds.indexOf(b.id));
      if (speedDialItems.length > 0) items = speedDialItems.slice(0, 8);
    }

    if (items.length === 0) {
      items = leafItems.slice(0, 6);
    }

    return assignKeyTips(items, level1Keys);
  }, [activeGroup, speedDialPreferences, level1Keys]);

  // Cascading Flyout Menu Handlers
  const handleMouseEnterGroup = (e, group, groupColor) => {
    if (!group.children || group.children.length === 0) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoverMenu({
      anchorEl: e.currentTarget,
      group,
      groupColor: groupColor || theme.palette.primary.main
    });
    setLevel1Item(null);
    setLevel1AnchorEl(null);
    setLevel2Item(null);
    setLevel2AnchorEl(null);
  };

  const handleKeepOpen = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleMouseLeaveAll = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverMenu(null);
      setLevel1Item(null);
      setLevel1AnchorEl(null);
      setLevel2Item(null);
      setLevel2AnchorEl(null);
    }, 180);
  };

  const handleGroupSelect = (group) => {
    setExpandedGroupId(group.id);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // ── CSS KEYFRAMES & FUTURISTIC CYBER ANIMATIONS ──
  // ═════════════════════════════════════════════════════════════════════════
  const animationStyles = {
    '@keyframes quantumHoloPop': {
      '0%': { opacity: 0, transform: 'scale(0.92) translateY(-10px)', filter: 'blur(6px)' },
      '100%': { opacity: 1, transform: 'scale(1) translateY(0)', filter: 'blur(0)' }
    },
    '@keyframes scanLineSweep': {
      '0%': { transform: 'translateY(-100%)' },
      '100%': { transform: 'translateY(400%)' }
    },
    '@keyframes laserFlow': {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(200%)' }
    },
    '@keyframes coreSpin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    },
    '@keyframes coreCounterSpin': {
      '0%': { transform: 'rotate(360deg)' },
      '100%': { transform: 'rotate(0deg)' }
    },
    '@keyframes hologramPulse': {
      '0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))' },
      '50%': { transform: 'scale(1.06)', filter: 'drop-shadow(0 0 20px rgba(236, 72, 153, 0.8))' }
    },
    '@keyframes floatLevitate': {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%': { transform: 'translateY(-3px)' }
    },
    '@keyframes radarSweep': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    },
    '@keyframes activeGlowTrail': {
      '0%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' }
    },
    '@keyframes orbitBorderSpin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    }
  };

  const activeColor = activeGroupConfig.color;
  const activeSecondary = activeGroupConfig.secondary;

  // ═════════════════════════════════════════════════════════════════════════
  // ── COLLAPSED / MINIMALIST QUANTUM DOCK VIEW ──
  // ═════════════════════════════════════════════════════════════════════════
  if (!ribbonOpen) {
    return (
      <Box
        ref={dockRef}
        onMouseMove={handleMouseMove}
        sx={{
          width: '100%',
          px: 1.5,
          py: 0.6,
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          userSelect: 'none',
          background: isDark
            ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.92) 100%)'
            : `linear-gradient(135deg, ${alpha(activeColor, 0.08)} 0%, #ffffff 50%, ${alpha(activeSecondary, 0.06)} 100%)`,
          backdropFilter: 'blur(28px)',
          borderBottom: `2px solid ${isDark ? alpha(activeColor, 0.45) : alpha(activeColor, 0.35)}`,
          boxShadow: isDark
            ? `0 12px 36px rgba(0,0,0,0.6), 0 0 25px ${alpha(activeColor, 0.2)}`
            : `0 8px 28px rgba(0,0,0,0.06), 0 0 20px ${alpha(activeColor, 0.14)}`,
          position: 'relative',
          overflow: 'hidden',
          ...animationStyles
        }}
      >
        {/* ── 360-DEGREE ROTATING QUANTUM ORBITAL BORDER BEAM (COLLAPSED DOCK) ── */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            padding: '2px',
            pointerEvents: 'none',
            zIndex: 10,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-200%',
              left: '-100%',
              width: '300%',
              height: '500%',
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 250deg, ${alpha(activeColor, 0.4)} 290deg, ${activeColor} 320deg, #ec4899 345deg, #38bdf8 355deg, transparent 360deg)`,
              animation: 'orbitBorderSpin 5s linear infinite'
            }
          }}
        />

        {/* QUANTUM CORE MINI EMBLEM */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.2,
            py: 0.35,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${activeColor} 0%, ${activeSecondary} 100%)`,
            color: '#fff',
            boxShadow: `0 4px 16px ${alpha(activeColor, 0.5)}`,
            flexShrink: 0
          }}
        >
          <IconAtom2 size={18} stroke={2.5} style={{ animation: 'coreSpin 6s linear infinite' }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {activeGroup?.title}
          </Typography>
        </Box>

        {/* SLIM STREAM */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 0.6,
            minWidth: 0,
            py: 0.2,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' }
          }}
        >
          {groups.map((group, index) => {
            const isActive = group.id === activeGroupId;
            const { color: groupColor, icon: IconComponent } = getModuleConfig(group, modulePrefs, index);

            return (
              <Tooltip key={group.id} title={group.title} placement="bottom" arrow>
                <ButtonBase
                  onClick={() => handleGroupSelect(group)}
                  onMouseEnter={(e) => handleMouseEnterGroup(e, group, groupColor)}
                  onMouseLeave={handleMouseLeaveAll}
                  sx={{
                    px: 1.1,
                    height: 38,
                    borderRadius: '11px',
                    flex: '0 1 auto',
                    maxWidth: 160,
                    minWidth: 70,
                    position: 'relative',
                    background: isActive
                      ? `linear-gradient(135deg, ${groupColor} 0%, ${alpha(groupColor, 0.88)} 100%)`
                      : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff'),
                    color: isActive ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.6,
                    border: isActive
                      ? `1.5px solid ${alpha(groupColor, 0.9)}`
                      : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                    boxShadow: isActive
                      ? `0 6px 20px ${alpha(groupColor, 0.5)}, inset 0 1px 1px rgba(255,255,255,0.4)`
                      : '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isActive ? 'translateY(-1px) scale(1.02)' : 'none',
                    '&:hover': {
                      background: isActive
                        ? `linear-gradient(135deg, ${groupColor} 0%, ${alpha(groupColor, 0.95)} 100%)`
                        : alpha(groupColor, isDark ? 0.16 : 0.08),
                      borderColor: groupColor,
                      color: isActive ? '#ffffff' : groupColor,
                      transform: 'translateY(-2px) scale(1.03)',
                      boxShadow: `0 8px 22px ${alpha(groupColor, 0.4)}`
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '7px',
                      bgcolor: isActive ? 'rgba(255,255,255,0.25)' : alpha(groupColor, 0.14),
                      color: isActive ? '#ffffff' : groupColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <IconComponent size={14} stroke={2.2} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: isActive ? 850 : 650,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minWidth: 0
                    }}
                  >
                    {group.title}
                  </Typography>
                </ButtonBase>
              </Tooltip>
            );
          })}
        </Box>

        {/* EXPAND BUTTON */}
        {onCollapse && (
          <Tooltip title="Expand Quantum Deck" placement="left" arrow>
            <IconButton
              onClick={onCollapse}
              sx={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
                color: isDark ? '#94a3b8' : '#64748b',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.25s',
                '&:hover': {
                  bgcolor: activeColor,
                  color: '#ffffff',
                  borderColor: activeColor,
                  transform: 'scale(1.1)',
                  boxShadow: `0 6px 18px ${alpha(activeColor, 0.5)}`
                }
              }}
            >
              <IconChevronDown size={18} stroke={2.8} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ── EXPANDED REVOLUTIONARY QUANTUM COMMAND DECK ──
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <Box
      ref={dockRef}
      onMouseMove={handleMouseMove}
      sx={{
        width: '100%',
        px: 1,
        py: 0.4,
        position: 'relative',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 1.2,
        ...animationStyles
      }}
    >
      {/* ── ATMOSPHERIC AURA HALO BEHIND CHASSIS ── */}
      <Box
        sx={{
          position: 'absolute',
          top: -15,
          left: '5%',
          right: '5%',
          height: 140,
          background: `radial-gradient(ellipse at 50% 0%, ${alpha(activeColor, isDark ? 0.4 : 0.25)} 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
          transition: 'background 0.5s ease',
          animation: 'hologramPulse 5s ease-in-out infinite'
        }}
      />

      {/* ── MAIN ADVANCED QUANTUM CHASSIS ── */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          position: 'relative',
          zIndex: 1,
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff',
          border: `1.8px solid ${isDark ? alpha(activeColor, 0.4) : alpha(activeColor, 0.3)}`,
          borderRadius: '20px',
          boxShadow: isDark
            ? `0 20px 50px rgba(0,0,0,0.8), 0 0 35px ${alpha(activeColor, 0.3)}`
            : `0 12px 40px rgba(0,0,0,0.1), 0 0 25px ${alpha(activeColor, 0.18)}`,
          backdropFilter: 'blur(32px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* ── 360-DEGREE ROTATING QUANTUM ORBITAL BORDER BEAM (TRACES ENTIRE CHASSIS PERIMETER) ── */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '20px',
            padding: '2px',
            pointerEvents: 'none',
            zIndex: 10,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-200%',
              left: '-100%',
              width: '300%',
              height: '500%',
              background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 250deg, ${alpha(activeColor, 0.4)} 290deg, ${activeColor} 320deg, #ec4899 345deg, #38bdf8 355deg, transparent 360deg)`,
              animation: 'orbitBorderSpin 5s linear infinite'
            }
          }}
        />

        {/* ── TIER 1: THE QUANTUM MODULE STREAM & ACTION FLANKS ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.75,
            width: '100%',
            px: 1.25,
            py: 0.45,
            background: isDark
              ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.65) 100%)'
              : 'linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(241, 245, 249, 0.88) 100%)',
            borderBottom: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`
          }}
        >
          {/* ── LEFT FLANK: COMPACT QUANTUM REACTOR EMBLEM ── */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              pr: 1,
              borderRight: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
              flexShrink: 0
            }}
          >
            {/* 3D ROTATING REACTOR ICON */}
            <Tooltip title={`Explore All ${activeGroup?.title} Applications (${getLeafItems(activeGroup?.children || []).length} Apps)`} arrow placement="bottom">
              <ButtonBase
                onClick={() => {
                  setDrawerSelectedSection(null);
                  setCyberDrawerOpen(true);
                }}
                sx={{
                  position: 'relative',
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  background: `linear-gradient(135deg, ${activeColor} 0%, ${activeSecondary} 100%)`,
                  boxShadow: `0 4px 14px ${alpha(activeColor, 0.5)}, inset 0 1px 2px rgba(255,255,255,0.5)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  animation: 'floatLevitate 3s ease-in-out infinite',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.1) rotate(5deg)',
                    boxShadow: `0 6px 20px ${alpha(activeColor, 0.7)}`
                  }
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: -3,
                    borderRadius: '13px',
                    border: `1.5px dashed ${alpha(activeColor, 0.8)}`,
                    animation: 'coreSpin 8s linear infinite',
                    pointerEvents: 'none'
                  }}
                />
                <activeGroupConfig.icon size={17} stroke={2.5} />
              </ButtonBase>
            </Tooltip>

            {/* MODULE METRICS */}
            <ButtonBase
              onClick={() => {
                setDrawerSelectedSection(null);
                setCyberDrawerOpen(true);
              }}
              sx={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left', borderRadius: '6px', p: 0.3 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <Typography
                  sx={{
                    fontSize: '0.76rem',
                    fontWeight: 950,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    background: `linear-gradient(135deg, ${activeColor} 0%, ${activeSecondary} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {activeGroup?.title}
                </Typography>
                <Chip
                  label={activeGroupConfig.tag}
                  size="small"
                  sx={{
                    height: 14,
                    fontSize: '0.48rem',
                    fontWeight: 900,
                    bgcolor: alpha(activeColor, 0.16),
                    color: activeColor,
                    borderRadius: '3px',
                    px: 0.3
                  }}
                />
              </Box>
            </ButtonBase>
          </Box>

          {/* ── CENTER: AUTO-FIT 3D CRYSTAL MODULE PODS ── */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 0.6,
              flex: 1,
              minWidth: 0,
              px: 0.5,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
            {groups.map((group, index) => {
              const isActive = group.id === activeGroupId;
              const { color: groupColor, icon: IconComponent } = getModuleConfig(group, modulePrefs, index);
              const leafCount = getLeafItems(group.children || []).length;

              return (
                <Tooltip key={group.id} title={`${group.title} (${leafCount} Apps)`} arrow placement="bottom">
                  <ButtonBase
                    onClick={() => handleGroupSelect(group)}
                    onMouseEnter={(e) => handleMouseEnterGroup(e, group, groupColor)}
                    onMouseLeave={handleMouseLeaveAll}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.6,
                      px: 1.1,
                      py: 0.4,
                      height: 36,
                      borderRadius: '10px',
                      position: 'relative',
                      flex: '0 1 auto',
                      maxWidth: 160,
                      minWidth: 70,
                      background: isActive
                        ? `linear-gradient(135deg, ${groupColor} 0%, ${alpha(groupColor, 0.88)} 100%)`
                        : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff'),
                      color: isActive ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                      border: isActive
                        ? `1.5px solid ${alpha(groupColor, 0.95)}`
                        : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                      boxShadow: isActive
                        ? `0 6px 18px ${alpha(groupColor, 0.45)}, inset 0 1px 2px rgba(255,255,255,0.5)`
                        : '0 1px 3px rgba(0,0,0,0.02)',
                      transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isActive ? 'translateY(-1px) scale(1.02)' : 'none',
                      '&:hover': {
                        background: isActive
                          ? `linear-gradient(135deg, ${groupColor} 0%, ${alpha(groupColor, 0.95)} 100%)`
                          : alpha(groupColor, isDark ? 0.18 : 0.1),
                        borderColor: groupColor,
                        color: isActive ? '#ffffff' : groupColor,
                        transform: 'translateY(-1.5px) scale(1.03)',
                        boxShadow: `0 8px 20px ${alpha(groupColor, 0.35)}`,
                        '& .pod-icon': {
                          transform: 'scale(1.15) rotate(4deg)'
                        }
                      }
                    }}
                  >
                    {/* 3D ICON POD */}
                    <Box
                      className="pod-icon"
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '6px',
                        background: (altMode && group._keyTip)
                          ? (group.id === altActiveGroupId ? '#2563eb' : '#0f172a')
                          : (isActive
                            ? 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.12) 100%)'
                            : alpha(groupColor, 0.16)),
                        color: (altMode && group._keyTip) ? '#fbbf24' : (isActive ? '#ffffff' : groupColor),
                        border: (altMode && group._keyTip)
                          ? '1.5px solid #f59e0b'
                          : (isActive ? '1px solid rgba(255,255,255,0.5)' : `1px solid ${alpha(groupColor, 0.3)}`),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                        transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {altMode && group._keyTip ? (
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 950, color: '#fbbf24', lineHeight: 1 }}>
                          {group._keyTip}
                        </Typography>
                      ) : (
                        IconComponent && <IconComponent size={13} stroke={2.4} />
                      )}
                    </Box>

                    {/* MODULE TITLE */}
                    <Typography
                      sx={{
                        fontSize: '0.64rem',
                        fontWeight: isActive ? 900 : 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.01em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0
                      }}
                    >
                      {group.title}
                    </Typography>

                    {/* ACTIVE LIVE PULSE BEAM */}
                    {isActive && (
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          bgcolor: '#ffffff',
                          boxShadow: '0 0 8px #ffffff',
                          animation: 'hologramPulse 1.8s ease-in-out infinite',
                          flexShrink: 0
                        }}
                      />
                    )}

                    {/* MINI BADGE */}
                    {!isActive && leafCount > 0 && (
                      <Box
                        sx={{
                          px: 0.4,
                          py: 0.1,
                          borderRadius: '4px',
                          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                          color: 'text.secondary',
                          fontSize: '0.55rem',
                          fontWeight: 850,
                          lineHeight: 1,
                          flexShrink: 0
                        }}
                      >
                        {leafCount}
                      </Box>
                    )}
                  </ButtonBase>
                </Tooltip>
              );
            })}
          </Box>
        </Box>

        {/* ── TIER 2: WORKFLOW RADAR & 3D SPEED DIAL TILES ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.2,
            width: '100%',
            px: 1.5,
            py: 0.5,
            background: isDark
              ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.5) 0%, rgba(10, 15, 30, 0.8) 100%)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.98) 100%)'
          }}
        >
          {/* ── CENTER: 3D SPEED DIAL GLASS TILES ── */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.8,
              flex: 1,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
            {activeSubItems.map((sub) => {
              const SubIcon = sub.icon || IconApps;
              const isSubActive = sub.url && location.pathname.startsWith(sub.url);
              const isPinned = pinnedPages.some((p) => p.url === sub.url);

              return (
                <ButtonBase
                  key={sub.id}
                  component={sub.url ? Link : 'div'}
                  to={sub.url || '#'}
                  onClick={() => sub.url && navigate(sub.url)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                    px: 1.2,
                    py: 0.4,
                    height: 34,
                    borderRadius: '10px',
                    bgcolor: isSubActive
                      ? (isDark ? alpha(activeColor, 0.3) : alpha(activeColor, 0.15))
                      : (isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'),
                    border: `1.6px solid ${isSubActive ? alpha(activeColor, 0.8) : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0')}`,
                    boxShadow: isSubActive
                      ? `0 6px 18px ${alpha(activeColor, 0.35)}, inset 0 0 14px ${alpha(activeColor, 0.18)}`
                      : '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.24s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isSubActive ? 'translateY(-1px)' : 'none',
                    '&:hover': {
                      bgcolor: isSubActive
                        ? alpha(activeColor, isDark ? 0.38 : 0.22)
                        : (isDark ? 'rgba(255,255,255,0.09)' : '#ffffff'),
                      borderColor: activeColor,
                      boxShadow: `0 8px 22px ${alpha(activeColor, 0.35)}`,
                      transform: 'translateY(-2.5px) scale(1.04)',
                      '& .tile-icon': {
                        transform: 'scale(1.18)'
                      }
                    }
                  }}
                >
                  {/* ICON / KEYTIP */}
                  <Box
                    className="tile-icon"
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '7px',
                      background: (altMode && sub._keyTip)
                        ? '#0f172a'
                        : (isSubActive
                          ? `linear-gradient(135deg, ${activeColor} 0%, ${activeSecondary} 100%)`
                          : alpha(activeColor, 0.18)),
                      color: (altMode && sub._keyTip) ? '#fbbf24' : (isSubActive ? '#ffffff' : activeColor),
                      border: (altMode && sub._keyTip) ? '1.5px solid #f59e0b' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'transform 0.2s ease',
                      boxShadow: isSubActive ? `0 3px 8px ${alpha(activeColor, 0.5)}` : 'none'
                    }}
                  >
                    {altMode && sub._keyTip ? (
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 950, color: '#fbbf24', lineHeight: 1 }}>
                        {sub._keyTip}
                      </Typography>
                    ) : (
                      <SubIcon size={14} stroke={2.3} />
                    )}
                  </Box>

                  {/* TITLE */}
                  <Typography
                    sx={{
                      fontSize: '0.74rem',
                      fontWeight: isSubActive ? 900 : 700,
                      color: isSubActive ? activeColor : (isDark ? '#e2e8f0' : '#334155'),
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.01em'
                    }}
                  >
                    {sub.title}
                  </Typography>

                  {/* PAGE CODE */}
                  {sub.pageCode && (
                    <Typography
                      sx={{
                        fontSize: '0.62rem',
                        fontWeight: 900,
                        px: 0.6,
                        py: 0.2,
                        borderRadius: '5px',
                        bgcolor: alpha(activeColor, 0.16),
                        color: activeColor,
                        lineHeight: 1
                      }}
                    >
                      {sub.pageCode}
                    </Typography>
                  )}
                </ButtonBase>
              );
            })}
          </Box>

          {/* ── RIGHT ACTION: ALL APPS & CONFIGURE GEAR ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexShrink: 0 }}>
            {activeGroup && (
              <Tooltip title="Customize Quantum Speed Rail" arrow placement="top">
                <ButtonBase
                  onClick={() => handleEditClick(activeGroup)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.6,
                    px: 1.2,
                    py: 0.45,
                    height: 34,
                    borderRadius: '10px',
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
                    color: isDark ? '#e2e8f0' : '#475569',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      bgcolor: alpha(activeColor, 0.16),
                      borderColor: activeColor,
                      color: activeColor,
                      transform: 'translateY(-1.5px)',
                      boxShadow: `0 6px 16px ${alpha(activeColor, 0.3)}`,
                      '& .spin-gear': {
                        animation: 'coreSpin 2s linear infinite'
                      }
                    }
                  }}
                >
                  <IconAdjustmentsHorizontal size={16} className="spin-gear" />
                </ButtonBase>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>

      {/* ── FAR RIGHT ORBITAL CONTROLLERS (Prev / Next & Collapse) ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, flexShrink: 0, zIndex: 2 }}>
        {/* PREV PAGE */}
        <Tooltip title={prevPageItem ? `Prev: ${prevPageItem.title}` : 'No Prev Page'} placement="left" arrow>
          <span>
            <IconButton
              disabled={!prevPageItem}
              onClick={() => prevPageItem && navigate(prevPageItem.url)}
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                color: '#ffffff',
                boxShadow: '0 6px 16px rgba(236, 72, 153, 0.5)',
                transition: 'all 0.22s ease',
                '&:hover': {
                  transform: 'scale(1.18) translateY(-1px)',
                  boxShadow: '0 8px 24px rgba(236, 72, 153, 0.75)'
                },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled', boxShadow: 'none' }
              }}
            >
              <IconChevronLeft size={17} stroke={3} />
            </IconButton>
          </span>
        </Tooltip>

        {/* NEXT PAGE */}
        <Tooltip title={nextPageItem ? `Next: ${nextPageItem.title}` : 'No Next Page'} placement="left" arrow>
          <span>
            <IconButton
              disabled={!nextPageItem}
              onClick={() => nextPageItem && navigate(nextPageItem.url)}
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                boxShadow: '0 6px 16px rgba(245, 158, 11, 0.5)',
                transition: 'all 0.22s ease',
                '&:hover': {
                  transform: 'scale(1.18) translateY(-1px)',
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.75)'
                },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled', boxShadow: 'none' }
              }}
            >
              <IconChevronRight size={17} stroke={3} />
            </IconButton>
          </span>
        </Tooltip>

        {/* COLLAPSE RIBBON */}
        {onCollapse && (
          <Tooltip title="Collapse Quantum Deck" placement="left" arrow>
            <IconButton
              onClick={onCollapse}
              sx={{
                width: 30,
                height: 30,
                borderRadius: '10px',
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
                color: isDark ? '#94a3b8' : '#64748b',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                transition: 'all 0.22s ease',
                '&:hover': {
                  bgcolor: activeColor,
                  color: '#ffffff',
                  borderColor: activeColor,
                  transform: 'scale(1.12)',
                  boxShadow: `0 6px 18px ${alpha(activeColor, 0.5)}`
                }
              }}
            >
              <IconChevronUp size={17} stroke={2.8} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ═════════════════════════════════════════════════════════════════════════
          ── QUANTUM CYBER CASCADING MULTI-LEVEL POPUP MENU (LEVEL 1 / 2 / 3) ──
          ═════════════════════════════════════════════════════════════════════════ */}
      {/* COLUMN 1: PRIMARY MODULE SECTIONS */}
      {hoverMenu && hoverMenu.group?.children?.length > 0 && (
        <Popper
          open={Boolean(hoverMenu)}
          anchorEl={hoverMenu.anchorEl}
          placement="bottom-start"
          transition
          style={{ zIndex: 1400 }}
          modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        >
          {({ TransitionProps }) => (
            <Grow
              {...TransitionProps}
              timeout={180}
              style={{ transformOrigin: 'top left' }}
            >
              <Paper
                elevation={0}
                onMouseEnter={handleKeepOpen}
                onMouseLeave={handleMouseLeaveAll}
                sx={{
                  width: 250,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(13, 19, 33, 0.96)' : 'rgba(255, 255, 255, 0.97)',
                  border: `1.5px solid ${isDark ? alpha(hoverMenu.groupColor, 0.4) : alpha(hoverMenu.groupColor, 0.28)}`,
                  backdropFilter: 'blur(28px)',
                  boxShadow: isDark
                    ? `0 20px 50px rgba(0,0,0,0.8), 0 0 25px ${alpha(hoverMenu.groupColor, 0.2)}`
                    : `0 16px 45px rgba(0,0,0,0.12), 0 0 15px ${alpha(hoverMenu.groupColor, 0.12)}`,
                  overflow: 'hidden'
                }}
              >
                {/* GRADIENT HEADER */}
                <Box
                  sx={{
                    px: 1.6,
                    py: 1.1,
                    background: `linear-gradient(135deg, ${hoverMenu.groupColor}30 0%, ${hoverMenu.groupColor}0c 100%)`,
                    borderBottom: `1.5px solid ${hoverMenu.groupColor}30`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.1
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '8px',
                      bgcolor: hoverMenu.groupColor,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 12px ${alpha(hoverMenu.groupColor, 0.45)}`,
                      flexShrink: 0
                    }}
                  >
                    <IconFolders size={15} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 950, color: isDark ? '#f8fafc' : '#0f172a', letterSpacing: '0.02em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {hoverMenu.group.title}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 650 }}>
                      {getLeafItems(hoverMenu.group.children).length} actions available
                    </Typography>
                  </Box>
                </Box>

                {/* SECTIONS LIST */}
                <Box
                  sx={{
                    p: 0.75,
                    maxHeight: 'calc(100vh - 170px)',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
                      borderRadius: '4px'
                    }
                  }}
                >
                  {hoverMenu.group.children.map((item) => {
                    const ItemIcon = item.icon || IconApps;
                    const hasChildren = item.children && item.children.length > 0;
                    const isSelected = level1Item?.id === item.id;
                    const accentColor = hoverMenu.groupColor || '#38bdf8';

                    return (
                      <ButtonBase
                        key={item.id}
                        component={!hasChildren && item.url ? Link : 'div'}
                        to={!hasChildren && item.url ? item.url : '#'}
                        onMouseEnter={(e) => {
                          handleKeepOpen();
                          setLevel1Item(item);
                          setLevel1AnchorEl(e.currentTarget);
                          setLevel2Item(null);
                          setLevel2AnchorEl(null);
                        }}
                        onClick={() => {
                          if (!hasChildren && item.url) {
                            navigate(item.url);
                            setHoverMenu(null);
                          }
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          px: 1,
                          py: 0.65,
                          mb: 0.3,
                          borderRadius: '9px',
                          bgcolor: isSelected ? alpha(accentColor, 0.18) : 'transparent',
                          borderLeft: isSelected ? `3.5px solid ${accentColor}` : '3.5px solid transparent',
                          boxShadow: isSelected ? `0 3px 10px ${alpha(accentColor, 0.2)}` : 'none',
                          transition: 'all 0.18s ease',
                          '&:hover': {
                            bgcolor: alpha(accentColor, 0.14),
                            transform: 'translateX(2px)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                          <Box
                            sx={{
                              width: 26,
                              height: 26,
                              borderRadius: '7px',
                              bgcolor: isSelected ? accentColor : alpha(accentColor, 0.14),
                              color: isSelected ? '#ffffff' : accentColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.18s ease'
                            }}
                          >
                            <ItemIcon size={14} />
                          </Box>
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: isSelected ? 850 : 650,
                              color: isSelected ? accentColor : (isDark ? '#e2e8f0' : '#1e293b'),
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {item.title}
                          </Typography>
                        </Box>
                        {item.pageCode && !hasChildren && (
                          <Chip
                            label={item.pageCode}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.58rem',
                              fontWeight: 900,
                              bgcolor: alpha(accentColor, 0.14),
                              color: accentColor,
                              flexShrink: 0,
                              ml: 0.5
                            }}
                          />
                        )}
                        {hasChildren && (
                          <IconChevronRight
                            size={14}
                            style={{
                              color: isSelected ? accentColor : '#94a3b8',
                              flexShrink: 0,
                              transform: isSelected ? 'translateX(2px)' : 'none',
                              transition: 'all 0.18s ease'
                            }}
                          />
                        )}
                      </ButtonBase>
                    );
                  })}
                </Box>
              </Paper>
            </Grow>
          )}
        </Popper>
      )}

      {/* COLUMN 2: SUB-PAGES */}
      {hoverMenu && level1Item && level1Item.children?.length > 0 && level1AnchorEl && (
        <Popper
          open={Boolean(level1Item)}
          anchorEl={level1AnchorEl}
          placement="right-start"
          transition
          style={{ zIndex: 1410 }}
          modifiers={[{ name: 'offset', options: { offset: [-4, 6] } }]}
        >
          {({ TransitionProps }) => (
            <Grow
              {...TransitionProps}
              timeout={180}
              style={{ transformOrigin: 'top left' }}
            >
              <Paper
                elevation={0}
                onMouseEnter={handleKeepOpen}
                onMouseLeave={handleMouseLeaveAll}
                sx={{
                  width: 240,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(13, 19, 33, 0.96)' : 'rgba(255, 255, 255, 0.97)',
                  border: `1.5px solid ${isDark ? alpha(hoverMenu.groupColor, 0.4) : alpha(hoverMenu.groupColor, 0.28)}`,
                  backdropFilter: 'blur(28px)',
                  boxShadow: isDark
                    ? `0 20px 50px rgba(0,0,0,0.8), 0 0 25px ${alpha(hoverMenu.groupColor, 0.2)}`
                    : `0 16px 45px rgba(0,0,0,0.12), 0 0 15px ${alpha(hoverMenu.groupColor, 0.12)}`,
                  overflow: 'hidden'
                }}
              >
                {/* SUB-SECTION LIST */}
                <Box
                  sx={{
                    p: 0.75,
                    maxHeight: 'calc(100vh - 170px)',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
                      borderRadius: '4px'
                    }
                  }}
                >
                  {level1Item.children.map((child) => {
                    const ChildIcon = child.icon || IconApps;
                    const hasChildren = child.children && child.children.length > 0;
                    const isSelected = level2Item?.id === child.id;
                    const accentColor = hoverMenu.groupColor || '#38bdf8';

                    return (
                      <ButtonBase
                        key={child.id}
                        component={!hasChildren && child.url ? Link : 'div'}
                        to={!hasChildren && child.url ? child.url : '#'}
                        onMouseEnter={(e) => {
                          handleKeepOpen();
                          setLevel2Item(child);
                          setLevel2AnchorEl(e.currentTarget);
                        }}
                        onClick={() => {
                          if (!hasChildren && child.url) {
                            navigate(child.url);
                            setHoverMenu(null);
                            setLevel1Item(null);
                          }
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          px: 1,
                          py: 0.6,
                          mb: 0.3,
                          borderRadius: '9px',
                          bgcolor: isSelected ? alpha(accentColor, 0.18) : 'transparent',
                          borderLeft: isSelected ? `3.5px solid ${accentColor}` : '3.5px solid transparent',
                          boxShadow: isSelected ? `0 3px 10px ${alpha(accentColor, 0.2)}` : 'none',
                          transition: 'all 0.18s ease',
                          '&:hover': {
                            bgcolor: alpha(accentColor, 0.14),
                            transform: 'translateX(2px)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '6px',
                              bgcolor: isSelected ? accentColor : alpha(accentColor, 0.12),
                              color: isSelected ? '#ffffff' : accentColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <ChildIcon size={13} />
                          </Box>
                          <Typography
                            sx={{
                              fontSize: '0.73rem',
                              fontWeight: isSelected ? 850 : 650,
                              color: isSelected ? accentColor : (isDark ? '#e2e8f0' : '#1e293b'),
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {child.title}
                          </Typography>
                        </Box>
                        {child.pageCode && (
                          <Chip
                            label={child.pageCode}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.58rem',
                              fontWeight: 900,
                              bgcolor: alpha(accentColor, 0.14),
                              color: accentColor,
                              flexShrink: 0,
                              ml: 0.5
                            }}
                          />
                        )}
                        {hasChildren && (
                          <IconChevronRight
                            size={13}
                            style={{
                              color: isSelected ? accentColor : '#94a3b8',
                              flexShrink: 0,
                              marginLeft: 4,
                              transform: isSelected ? 'translateX(2px)' : 'none',
                              transition: 'all 0.18s ease'
                            }}
                          />
                        )}
                      </ButtonBase>
                    );
                  })}
                </Box>
              </Paper>
            </Grow>
          )}
        </Popper>
      )}

      {/* COLUMN 3: LEAF ACTIONS */}
      {hoverMenu && level2Item && level2Item.children?.length > 0 && level2AnchorEl && (
        <Popper
          open={Boolean(level2Item)}
          anchorEl={level2AnchorEl}
          placement="right-start"
          transition
          style={{ zIndex: 1420 }}
          modifiers={[{ name: 'offset', options: { offset: [-4, 6] } }]}
        >
          {({ TransitionProps }) => (
            <Grow
              {...TransitionProps}
              timeout={180}
              style={{ transformOrigin: 'top left' }}
            >
              <Paper
                elevation={0}
                onMouseEnter={handleKeepOpen}
                onMouseLeave={handleMouseLeaveAll}
                sx={{
                  width: 230,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(13, 19, 33, 0.96)' : 'rgba(255, 255, 255, 0.97)',
                  border: `1.5px solid ${isDark ? alpha(hoverMenu.groupColor, 0.4) : alpha(hoverMenu.groupColor, 0.28)}`,
                  backdropFilter: 'blur(28px)',
                  boxShadow: isDark
                    ? `0 20px 50px rgba(0,0,0,0.8), 0 0 25px ${alpha(hoverMenu.groupColor, 0.2)}`
                    : `0 16px 45px rgba(0,0,0,0.12), 0 0 15px ${alpha(hoverMenu.groupColor, 0.12)}`,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    p: 0.75,
                    maxHeight: 'calc(100vh - 170px)',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
                      borderRadius: '4px'
                    }
                  }}
                >
                  {level2Item.children.map((subChild) => {
                    const SubChildIcon = subChild.icon || IconApps;
                    const accentColor = hoverMenu.groupColor || '#38bdf8';

                    return (
                      <ButtonBase
                        key={subChild.id}
                        component={subChild.url ? Link : 'div'}
                        to={subChild.url || '#'}
                        onClick={() => {
                          if (subChild.url) {
                            navigate(subChild.url);
                            setHoverMenu(null);
                            setLevel1Item(null);
                            setLevel2Item(null);
                          }
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          width: '100%',
                          px: 1,
                          py: 0.55,
                          mb: 0.25,
                          borderRadius: '8px',
                          transition: 'all 0.18s ease',
                          '&:hover': {
                            bgcolor: alpha(accentColor, 0.14),
                            transform: 'translateX(2px)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                          <Box
                            sx={{
                              width: 22,
                              height: 22,
                              borderRadius: '5px',
                              bgcolor: alpha(accentColor, 0.12),
                              color: accentColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <SubChildIcon size={12} />
                          </Box>
                          <Typography
                            sx={{
                              fontSize: '0.71rem',
                              fontWeight: 650,
                              color: isDark ? '#e2e8f0' : '#1e293b',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {subChild.title}
                          </Typography>
                        </Box>
                        {subChild.pageCode && (
                          <Chip
                            label={subChild.pageCode}
                            size="small"
                            sx={{
                              height: 17,
                              fontSize: '0.55rem',
                              fontWeight: 900,
                              bgcolor: alpha(accentColor, 0.14),
                              color: accentColor,
                              flexShrink: 0,
                              ml: 0.5
                            }}
                          />
                        )}
                      </ButtonBase>
                    );
                  })}
                </Box>
              </Paper>
            </Grow>
          )}
        </Popper>
      )}
    </Box>
  );
}

QuantumRibbon.propTypes = {
  groups: PropTypes.array,
  speedDialPreferences: PropTypes.object,
  modulePrefs: PropTypes.object,
  expandedGroupId: PropTypes.string,
  setExpandedGroupId: PropTypes.func,
  handleEditClick: PropTypes.func,
  prevPageItem: PropTypes.object,
  nextPageItem: PropTypes.object,
  ribbonOpen: PropTypes.bool,
  onCollapse: PropTypes.func,
  altMode: PropTypes.bool,
  altActiveGroupId: PropTypes.string,
  altChildItems: PropTypes.array,
  dismissAlt: PropTypes.func
};
