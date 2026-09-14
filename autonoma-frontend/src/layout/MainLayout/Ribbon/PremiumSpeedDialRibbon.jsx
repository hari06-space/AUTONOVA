import PropTypes from 'prop-types';
import { useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme, alpha, useColorScheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Tooltip from '@mui/material/Tooltip';
import Popper from '@mui/material/Popper';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';

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
  IconApps
} from '@tabler/icons-react';

import { MODULE_ICONS } from '../SpeedDialConfigModal';

const DEFAULT_MODULE_CONFIG = {
  // Core ERP Modules
  master: { color: '#3b82f6', icon: IconLayoutGrid },
  hra: { color: '#f97316', icon: IconUsers },
  sales: { color: '#10b981', icon: IconTarget },
  planning: { color: '#6366f1', icon: IconClipboardList },
  production: { color: '#8b5cf6', icon: IconRobot },
  stores: { color: '#d97706', icon: IconTruck },
  finance: { color: '#eab308', icon: IconBuildingBank },
  design: { color: '#a855f7', icon: IconCompass },
  maintenance: { color: '#22c55e', icon: IconTools },
  qms: { color: '#ec4899', icon: IconCertificate },
  reports: { color: '#14b8a6', icon: IconChartBar },
  // Extended modules
  dashboard: { color: '#0ea5e9', icon: IconLayoutGrid },
  support: { color: '#ef4444', icon: IconTools },
  purchase: { color: '#f59e0b', icon: IconTruck },
  quality: { color: '#84cc16', icon: IconCertificate },
  npd: { color: '#06b6d4', icon: IconCompass },
  crm: { color: '#e879f9', icon: IconTarget },
  hr: { color: '#fb923c', icon: IconUsers },
  asset: { color: '#a78bfa', icon: IconTools },
  'sales & marketing': { color: '#10b981', icon: IconTarget },
  'planning & production': { color: '#6366f1', icon: IconClipboardList },
  'stores & logistics': { color: '#d97706', icon: IconTruck },
  'finance & accounts': { color: '#eab308', icon: IconBuildingBank },
  'design & development': { color: '#a855f7', icon: IconCompass },
  'employee self': { color: '#38bdf8', icon: IconUsers },
  'client management': { color: '#f43f5e', icon: IconTarget },
};

// Auto-assign distinct colors by index for completely unknown modules
const AUTO_COLOR_PALETTE = [
  '#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#ec4899',
  '#eab308', '#14b8a6', '#a855f7', '#22c55e', '#ef4444',
  '#06b6d4', '#d97706', '#f59e0b', '#6366f1', '#84cc16',
  '#0ea5e9', '#e879f9', '#fb923c', '#a78bfa', '#38bdf8'
];

const getModuleConfig = (group, modulePrefs, index) => {
  const pref = modulePrefs[group.id] || {};
  // Try exact ID match first
  const key = group.id?.toLowerCase();
  const titleKey = group.title?.toLowerCase();
  const defaultByKey = DEFAULT_MODULE_CONFIG[key] || DEFAULT_MODULE_CONFIG[titleKey];
  const color = pref.color || defaultByKey?.color || AUTO_COLOR_PALETTE[index % AUTO_COLOR_PALETTE.length];
  const icon = (pref.icon && MODULE_ICONS[pref.icon]) || group.icon || defaultByKey?.icon || IconLayoutGrid;
  return { color, icon };
};

// Helper to recursively get all leaf page items under a group
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

export default function PremiumSpeedDialRibbon({
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
  altChildItems = []
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const { mode, systemMode } = useColorScheme();
  const computedMode = mode === 'system' ? systemMode : mode;
  const isDark = computedMode === 'dark' || theme.palette.mode === 'dark';

  // Cascading Flyout Sub-Drawer State (Image 2 Multi-Column Design)
  const [hoverMenu, setHoverMenu] = useState(null); // { anchorEl, group, groupColor }
  const [level1Item, setLevel1Item] = useState(null);
  const [level1AnchorEl, setLevel1AnchorEl] = useState(null);
  const [level2Item, setLevel2Item] = useState(null);
  const [level2AnchorEl, setLevel2AnchorEl] = useState(null);

  const hoverTimeoutRef = useRef(null);

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
    setLevel2Item(null);
  };

  const handleMouseLeaveAll = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverMenu(null);
      setLevel1Item(null);
      setLevel2Item(null);
    }, 250);
  };

  const handleKeepOpen = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  // Detect active group based on route or user selection
  const activeGroupId = useMemo(() => {
    if (expandedGroupId) return expandedGroupId;
    for (const g of groups) {
      if (g.children?.some((c) => (c.url && location.pathname.startsWith(c.url)) || c.children?.some(sc => sc.url && location.pathname.startsWith(sc.url)))) {
        return g.id;
      }
    }
    return groups[0]?.id || '';
  }, [groups, expandedGroupId, location.pathname]);

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || groups[0];
  }, [groups, activeGroupId]);

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

  const level1Keys = useMemo(() => {
    return new Set(groups.map((g) => g._keyTip).filter(Boolean));
  }, [groups]);

  // Determine active group leaf page items for Speed Dial (configured or default leaf pages)
  const activeSubItems = useMemo(() => {
    if (!activeGroup || !activeGroup.children) return [];

    const leafItems = getLeafItems(activeGroup.children);
    const prefIds = speedDialPreferences[activeGroup.id];

    let items = [];
    if (prefIds && prefIds.length > 0) {
      const speedDialItems = leafItems
        .filter((item) => prefIds.includes(item.id))
        .sort((a, b) => prefIds.indexOf(a.id) - prefIds.indexOf(b.id));
      if (speedDialItems.length > 0) items = speedDialItems.slice(0, 6);
    }

    if (items.length === 0) {
      items = leafItems.slice(0, 5);
    }

    return assignKeyTips(items, level1Keys);
  }, [activeGroup, speedDialPreferences, level1Keys]);

  const handleGroupSelect = (group) => {
    setExpandedGroupId(group.id);
  };

  // -- COLLAPSED MODE VIEW -- (premium icon-only module switcher)
  if (!ribbonOpen) {
    return (
      <Box
        sx={{
          width: '100%',
          px: 1.5,
          py: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          userSelect: 'none'
        }}
      >
        {/* PREMIUM ICON-ONLY MODULE STRIP */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            px: 0.75,
            py: 0.5
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
                    width: 46,
                    height: 46,
                    borderRadius: '12px',
                    flexShrink: 0,
                    position: 'relative',
                    background: isActive
                      ? `linear-gradient(135deg, ${groupColor} 0%, ${alpha(groupColor, 0.7)} 100%)`
                      : isDark
                        ? `linear-gradient(135deg, ${alpha(groupColor, 0.18)} 0%, ${alpha(groupColor, 0.08)} 100%)`
                        : `linear-gradient(135deg, ${alpha(groupColor, 0.12)} 0%, ${alpha(groupColor, 0.05)} 100%)`,
                    color: isActive ? '#fff' : groupColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isActive
                      ? `1.5px solid ${alpha(groupColor, 0.6)}`
                      : `1.5px solid ${alpha(groupColor, isDark ? 0.25 : 0.18)}`,
                    boxShadow: isActive
                      ? `0 4px 14px ${alpha(groupColor, 0.45)}, 0 0 0 3px ${alpha(groupColor, 0.12)}`
                      : 'none',
                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${groupColor} 0%, ${alpha(groupColor, 0.75)} 100%)`,
                      color: '#fff',
                      boxShadow: `0 4px 14px ${alpha(groupColor, 0.4)}`,
                      transform: 'translateY(-1px)',
                      '& .module-icon': {
                        transform: 'scale(1.12)'
                      }
                    }
                  }}
                >
                  {/* Alt KeyTip Badge - Small, sleek & beautiful top-right badge inside button */}
                  {altMode && group._keyTip && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 3,
                        right: 3,
                        minWidth: 15,
                        height: 15,
                        px: 0.4,
                        borderRadius: '4px',
                        bgcolor: group.id === altActiveGroupId ? '#2563eb' : '#0f172a',
                        color: '#fbbf24',
                        fontSize: '9px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                        border: '1px solid #fbbf24',
                        pointerEvents: 'none',
                        lineHeight: 1
                      }}
                    >
                      {group._keyTip}
                    </Box>
                  )}
                  {IconComponent && <IconComponent size={22} stroke={isActive ? 2.2 : 1.8} />}
                </ButtonBase>
              </Tooltip>
            );
          })}
        </Box>

        {/* EXPAND RIBBON BUTTON */}
        {onCollapse && (
          <Tooltip title="Expand Ribbon" placement="left">
            <IconButton
              onClick={onCollapse}
              sx={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                flexShrink: 0,
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
                color: isDark ? '#94a3b8' : '#64748b',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                transition: 'all 0.18s ease',
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : '#f1f5f9', color: isDark ? '#f8fafc' : '#0f172a' }
              }}
            >
              <IconChevronDown size={15} stroke={2.5} />
            </IconButton>
          </Tooltip>
        )}

        {/* CASCADING FLYOUT in collapsed mode */}
        {hoverMenu && hoverMenu.group?.children?.length > 0 && (
          <Popper open={Boolean(hoverMenu)} anchorEl={hoverMenu.anchorEl} placement="bottom-start" style={{ zIndex: 1400 }} modifiers={[{ name: 'offset', options: { offset: [0, 6] } }]}>
            <Paper elevation={0} onMouseEnter={handleKeepOpen} onMouseLeave={handleMouseLeaveAll}
              sx={{ width: 250, borderRadius: '14px', bgcolor: isDark ? 'rgba(15,23,42,0.98)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, boxShadow: '0 16px 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              <Box sx={{ px: 1.5, py: 0.9, background: `linear-gradient(135deg, ${hoverMenu.groupColor}22 0%, transparent 100%)`, borderBottom: `1px solid ${hoverMenu.groupColor}20` }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: hoverMenu.groupColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{hoverMenu.group.title}</Typography>
              </Box>
              <Box sx={{ p: 0.75, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
                {hoverMenu.group.children.map((item) => {
                  const ItemIcon = item.icon || IconApps;
                  const hasChildren = item.children && item.children.length > 0;
                  const ac = hoverMenu.groupColor;
                  return (
                    <ButtonBase key={item.id} component={!hasChildren && item.url ? Link : 'div'} to={!hasChildren && item.url ? item.url : '#'}
                      onMouseEnter={(e) => { handleKeepOpen(); setLevel1Item(item); setLevel1AnchorEl(e.currentTarget); setLevel2Item(null); }}
                      onClick={() => { if (!hasChildren && item.url) { navigate(item.url); setHoverMenu(null); } }}
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', px: 1, py: 0.6, mb: 0.15, borderRadius: '8px', transition: 'all 0.15s', '&:hover': { bgcolor: alpha(ac, 0.1) } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 26, height: 26, borderRadius: '7px', bgcolor: alpha(ac, 0.1), color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ItemIcon size={14} /></Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>{item.title}</Typography>
                      </Box>
                      {hasChildren ? (
                        <IconChevronRight size={13} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                      ) : item.pageCode ? (
                        <Typography
                          sx={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            px: 0.75,
                            py: 0.3,
                            borderRadius: '5px',
                            bgcolor: alpha(ac, 0.12),
                            color: ac,
                            flexShrink: 0,
                            letterSpacing: '0.02em'
                          }}
                        >
                          {item.pageCode}
                        </Typography>
                      ) : null}
                    </ButtonBase>
                  );
                })}
              </Box>
            </Paper>
          </Popper>
        )}

        {/* LEVEL 2 FLYOUT in collapsed mode */}
        {hoverMenu && level1Item && level1Item.children?.length > 0 && level1AnchorEl && (
          <Popper open={Boolean(level1Item)} anchorEl={level1AnchorEl} placement="right-start" style={{ zIndex: 1410 }} modifiers={[{ name: 'offset', options: { offset: [-4, 6] } }]}>
            <Paper elevation={0} onMouseEnter={handleKeepOpen} onMouseLeave={handleMouseLeaveAll}
              sx={{ width: 270, borderRadius: '14px', bgcolor: isDark ? 'rgba(15,23,42,0.98)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, boxShadow: '0 16px 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              <Box sx={{ p: 0.75, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
                {level1Item.children.map((child) => {
                  const ChildIcon = child.icon || IconApps;
                  const hasChildren2 = child.children && child.children.length > 0;
                  const ac = hoverMenu.groupColor;
                  return (
                    <ButtonBase key={child.id} component={!hasChildren2 && child.url ? Link : 'div'} to={!hasChildren2 && child.url ? child.url : '#'}
                      onMouseEnter={(e) => { handleKeepOpen(); setLevel2Item(child); setLevel2AnchorEl(e.currentTarget); }}
                      onClick={() => { if (!hasChildren2 && child.url) { navigate(child.url); setHoverMenu(null); setLevel1Item(null); } }}
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', px: 1, py: 0.6, mb: 0.15, borderRadius: '8px', transition: 'all 0.15s', '&:hover': { bgcolor: alpha(ac, 0.1) } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 26, height: 26, borderRadius: '7px', bgcolor: alpha(ac, 0.1), color: ac, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChildIcon size={14} /></Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>{child.title}</Typography>
                      </Box>
                      {hasChildren2 ? (
                        <IconChevronRight size={13} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                      ) : child.pageCode ? (
                        <Typography
                          sx={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            px: 0.75,
                            py: 0.3,
                            borderRadius: '5px',
                            bgcolor: alpha(ac, 0.12),
                            color: ac,
                            flexShrink: 0,
                            letterSpacing: '0.02em'
                          }}
                        >
                          {child.pageCode}
                        </Typography>
                      ) : null}
                    </ButtonBase>
                  );
                })}
              </Box>
            </Paper>
          </Popper>
        )}

        {/* LEVEL 3 FLYOUT in collapsed mode */}
        {hoverMenu && level2Item && level2Item.children?.length > 0 && level2AnchorEl && (
          <Popper open={Boolean(level2Item)} anchorEl={level2AnchorEl} placement="right-start" style={{ zIndex: 1420 }} modifiers={[{ name: 'offset', options: { offset: [-4, 6] } }]}>
            <Paper elevation={0} onMouseEnter={handleKeepOpen} onMouseLeave={handleMouseLeaveAll}
              sx={{ width: 300, borderRadius: '14px', bgcolor: isDark ? 'rgba(15,23,42,0.98)' : '#ffffff', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, boxShadow: '0 16px 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              <Box sx={{ p: 0.75, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
                {level2Item.children.map((leaf) => {
                  const LeafIcon = leaf.icon || IconApps;
                  const isLeafActive = leaf.url && location.pathname.startsWith(leaf.url);
                  const ac = hoverMenu.groupColor;
                  return (
                    <ButtonBase key={leaf.id} component={leaf.url ? Link : 'div'} to={leaf.url || '#'}
                      onClick={() => { if (leaf.url) { navigate(leaf.url); setHoverMenu(null); setLevel1Item(null); setLevel2Item(null); } }}
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', px: 1, py: 0.55, mb: 0.15, borderRadius: '8px', bgcolor: isLeafActive ? alpha(ac, 0.12) : 'transparent', transition: 'all 0.15s', '&:hover': { bgcolor: alpha(ac, 0.1) } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 24, height: 24, borderRadius: '6px', bgcolor: isLeafActive ? ac : alpha(ac, 0.1), color: isLeafActive ? '#fff' : ac, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LeafIcon size={13} /></Box>
                        <Typography sx={{ fontSize: '0.73rem', fontWeight: isLeafActive ? 700 : 600, color: isLeafActive ? ac : (isDark ? '#e2e8f0' : '#1e293b') }}>{leaf.title}</Typography>
                      </Box>
                      {leaf.pageCode && (
                        <Typography
                          sx={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            px: 0.75,
                            py: 0.3,
                            borderRadius: '5px',
                            bgcolor: alpha(ac, 0.12),
                            color: ac,
                            flexShrink: 0,
                            letterSpacing: '0.02em'
                          }}
                        >
                          {leaf.pageCode}
                        </Typography>
                      )}
                    </ButtonBase>
                  );
                })}
              </Box>
            </Paper>
          </Popper>
        )}
      </Box>
    );
  }

  // ── EXPANDED MODE VIEW ──
  return (
    <Box
      sx={{
        width: '100%',
        px: 0.5,
        py: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        userSelect: 'none'
      }}
    >
      {/* ── MAIN CONTAINER CARD ── */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.95)' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
          borderRadius: '14px',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}
      >
        {/* ── TOP TIER: ALL PRIMARY MODULE ICONS & TITLES (LIGHT PRIMARY BG) ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 0.75,
            width: '100%',
            px: 1.25,
            py: 0.6,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            bgcolor: isDark
              ? alpha(theme.palette.primary.main, 0.12)
              : alpha(theme.palette.primary.main, 0.04),
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : alpha(theme.palette.primary.main, 0.1)}`
          }}
        >
          {groups.map((group, index) => {
            const isActive = group.id === activeGroupId;
            const { color: groupColor, icon: IconComponent } = getModuleConfig(group, modulePrefs, index);

            return (
              <ButtonBase
                key={group.id}
                onClick={() => handleGroupSelect(group)}
                onMouseEnter={(e) => handleMouseEnterGroup(e, group, groupColor)}
                onMouseLeave={handleMouseLeaveAll}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  minWidth: 72,
                  maxWidth: 90,
                  py: 0.35,
                  px: 0.75,
                  borderRadius: '10px',
                  position: 'relative',
                  background: isActive
                    ? `linear-gradient(135deg, ${groupColor} 0%, ${alpha(groupColor, 0.85)} 100%)`
                    : (isDark ? alpha(groupColor, 0.15) : alpha(groupColor, 0.08)),
                  border: `1.5px solid ${isActive ? groupColor : alpha(groupColor, 0.25)}`,
                  boxShadow: isActive
                    ? `0 4px 12px ${alpha(groupColor, 0.45)}`
                    : `0 2px 5px ${alpha(groupColor, 0.1)}`,
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: isActive
                      ? `linear-gradient(135deg, ${groupColor} 0%, ${alpha(groupColor, 0.9)} 100%)`
                      : (isDark ? alpha(groupColor, 0.22) : alpha(groupColor, 0.14)),
                    border: `1.5px solid ${alpha(groupColor, 0.5)}`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 10px ${alpha(groupColor, 0.25)}`
                  }
                }}
              >
                {/* COLORED ICON BOX */}
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '7px',
                    background: (altMode && group._keyTip)
                      ? (group.id === altActiveGroupId ? '#2563eb' : '#0f172a')
                      : (isActive
                        ? 'rgba(255, 255, 255, 0.22)'
                        : `linear-gradient(135deg, ${alpha(groupColor, 0.2)} 0%, ${alpha(groupColor, 0.1)} 100%)`),
                    color: (altMode && group._keyTip) ? '#fbbf24' : (isActive ? '#ffffff' : groupColor),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    border: (altMode && group._keyTip)
                      ? '1.5px solid #f59e0b'
                      : (isActive ? '1px solid rgba(255, 255, 255, 0.3)' : `1px solid ${alpha(groupColor, 0.3)}`),
                    boxShadow: (altMode && group._keyTip) ? '0 2px 8px rgba(0,0,0,0.5)' : 'none'
                  }}
                >
                  {altMode && group._keyTip ? (
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                      {group._keyTip}
                    </Typography>
                  ) : (
                    IconComponent && <IconComponent size={16} stroke={isActive ? 2.2 : 1.9} />
                  )}
                </Box>

                {/* MODULE TITLE */}
                <Typography
                  sx={{
                    fontSize: '0.58rem',
                    fontWeight: isActive ? 800 : 700,
                    color: isActive ? '#ffffff' : (isDark ? groupColor : alpha(groupColor, 0.95)),
                    mt: 0.25,
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%',
                    lineHeight: 1.1
                  }}
                  title={group.title}
                >
                  {group.title}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>

        {/* ── BOTTOM TIER: SUBMENU SPEED-DIAL PILL CARDS (LIGHT SECONDARY BG) ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 0.75,
            width: '100%',
            px: 1.25,
            py: 0.5,
            bgcolor: isDark
              ? alpha(theme.palette.secondary.main, 0.12)
              : alpha(theme.palette.secondary.main, 0.04)
          }}
        >
          {/* SPEED DIAL PAGE PILLS LIST */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              flex: 1,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' }
            }}
          >
            {/* ACTIVE MODULE HIGHLIGHT BADGE */}
            {activeGroup && (() => {
              const activeGroupIndex = groups.findIndex((g) => g.id === activeGroup?.id);
              const { color: activeGroupColor, icon: ActiveGroupIcon } = getModuleConfig(activeGroup, modulePrefs, activeGroupIndex >= 0 ? activeGroupIndex : 0);
              return (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.6,
                    px: 1.2,
                    py: 0.25,
                    height: 28,
                    borderRadius: '6px',
                    background: `linear-gradient(135deg, ${activeGroupColor} 0%, ${alpha(activeGroupColor, 0.85)} 100%)`,
                    color: '#ffffff',
                    boxShadow: `0 2px 8px ${alpha(activeGroupColor, 0.4)}`,
                    flexShrink: 0,
                    mr: 0.25
                  }}
                >
                  <ActiveGroupIcon size={13} stroke={2.5} />
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {activeGroup.title}
                  </Typography>
                </Box>
              );
            })()}

            {activeSubItems.map((sub) => {
              const SubIcon = sub.icon || IconApps;
              const isSubActive = sub.url && location.pathname.startsWith(sub.url);
              const activeGroupIndex = groups.findIndex((g) => g.id === activeGroup?.id);
              const { color: activeGroupColor } = getModuleConfig(activeGroup || {}, modulePrefs, activeGroupIndex >= 0 ? activeGroupIndex : 0);

              return (
                <ButtonBase
                  key={sub.id}
                  component={sub.url ? Link : 'div'}
                  to={sub.url || '#'}
                  onClick={() => sub.url && navigate(sub.url)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1,
                    py: 0.25,
                    height: 28,
                    borderRadius: '6px',
                    bgcolor: isSubActive
                      ? (isDark ? alpha(activeGroupColor, 0.25) : alpha(activeGroupColor, 0.12))
                      : (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
                    border: `1px solid ${isSubActive ? alpha(activeGroupColor, 0.45) : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0')}`,
                    boxShadow: isSubActive ? `0 2px 6px ${alpha(activeGroupColor, 0.15)}` : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: isSubActive
                        ? alpha(activeGroupColor, isDark ? 0.3 : 0.16)
                        : (isDark ? 'rgba(255,255,255,0.07)' : '#ffffff'),
                      boxShadow: `0 3px 10px ${alpha(activeGroupColor, 0.15)}`,
                      borderColor: activeGroupColor,
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '5px',
                      background: (altMode && sub._keyTip)
                        ? '#0f172a'
                        : (isSubActive
                          ? `linear-gradient(135deg, ${activeGroupColor} 0%, ${alpha(activeGroupColor, 0.8)} 100%)`
                          : alpha(activeGroupColor, 0.12)),
                      color: (altMode && sub._keyTip) ? '#fbbf24' : (isSubActive ? '#ffffff' : activeGroupColor),
                      border: (altMode && sub._keyTip) ? '1px solid #f59e0b' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: (altMode && sub._keyTip) ? '0 2px 6px rgba(0,0,0,0.5)' : (isSubActive ? `0 1px 4px ${alpha(activeGroupColor, 0.35)}` : 'none')
                    }}
                  >
                    {altMode && sub._keyTip ? (
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                        {sub._keyTip}
                      </Typography>
                    ) : (
                      <SubIcon size={12} stroke={2} />
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: isSubActive ? 700 : 600,
                      color: isSubActive
                        ? activeGroupColor
                        : (isDark ? '#cbd5e1' : '#334155'),
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.01em'
                    }}
                  >
                    {sub.title}
                  </Typography>
                </ButtonBase>
              );
            })}
          </Box>

          {/* RIGHT ACTION: CUSTOMIZE BUTTON */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            {activeGroup && (
              <Tooltip title="Configure Speed Dial Items" arrow placement="top">
                <ButtonBase
                  onClick={() => handleEditClick(activeGroup)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                    color: isDark ? '#e2e8f0' : '#475569',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(activeGroup?.color || '#3b82f6', 0.1),
                      borderColor: activeGroup?.color || 'primary.main',
                      color: activeGroup?.color || 'primary.main',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  <IconAdjustmentsHorizontal size={14} />
                </ButtonBase>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>

      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ FAR RIGHT SIDE ACTION CONTROLS (Pink Prev, Yellow Next, White Collapse) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, flexShrink: 0 }}>
        {/* PREV PAGE - PINK CIRCULAR BUTTON */}
        <Tooltip title={prevPageItem ? `Prev: ${prevPageItem.title}` : 'No Prev Page'} placement="left">
          <span>
            <IconButton
              disabled={!prevPageItem}
              onClick={() => prevPageItem && navigate(prevPageItem.url)}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: '#e91e63',
                color: '#ffffff',
                boxShadow: '0 2px 6px rgba(233, 30, 99, 0.4)',
                '&:hover': { bgcolor: '#c2185b' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
              }}
            >
              <IconChevronLeft size={16} stroke={3} />
            </IconButton>
          </span>
        </Tooltip>

        {/* NEXT PAGE - YELLOW CIRCULAR BUTTON */}
        <Tooltip title={nextPageItem ? `Next: ${nextPageItem.title}` : 'No Next Page'} placement="left">
          <span>
            <IconButton
              disabled={!nextPageItem}
              onClick={() => nextPageItem && navigate(nextPageItem.url)}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: '#f59e0b',
                color: '#ffffff',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)',
                '&:hover': { bgcolor: '#d97706' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
              }}
            >
              <IconChevronRight size={16} stroke={3} />
            </IconButton>
          </span>
        </Tooltip>

        {/* COLLAPSE RIBBON - WHITE SQUARE BUTTON */}
        {onCollapse && (
          <Tooltip title="Collapse Ribbon" placement="left">
            <IconButton
              onClick={onCollapse}
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                '&:hover': { bgcolor: '#f8fafc', color: '#0f172a' }
              }}
            >
              <IconChevronUp size={16} stroke={2} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ CASCADING PREMIUM FLYOUT DRAWER ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ */}

      {/* COLUMN 1: MODULE GROUPS */}
      {hoverMenu && hoverMenu.group?.children?.length > 0 && (
        <Popper
          open={Boolean(hoverMenu)}
          anchorEl={hoverMenu.anchorEl}
          placement="bottom-start"
          style={{ zIndex: 1400 }}
          modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        >
          <Paper
            elevation={0}
            onMouseEnter={handleKeepOpen}
            onMouseLeave={handleMouseLeaveAll}
            sx={{
              width: 250,
              borderRadius: '14px',
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.98)' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark
                ? '0 16px 40px rgba(0,0,0,0.6)'
                : '0 16px 40px rgba(0,0,0,0.12)',
              overflow: 'hidden'
            }}
          >
            {/* GRADIENT HEADER */}
            <Box
              sx={{
                px: 1.5,
                py: 1,
                background: `linear-gradient(135deg, ${hoverMenu.groupColor}22 0%, ${hoverMenu.groupColor}08 100%)`,
                borderBottom: `1px solid ${hoverMenu.groupColor}22`,
                display: 'flex',
                alignItems: 'center',
                gap: 1.25
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '6px',
                  bgcolor: hoverMenu.groupColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 3px 8px ${alpha(hoverMenu.groupColor, 0.35)}`
                }}
              >
                <IconLayoutGrid size={13} color="#fff" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', letterSpacing: '0.01em' }}>
                  {hoverMenu.group.title}
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>
                  {hoverMenu.group.children.length} modules
                </Typography>
              </Box>
            </Box>

            {/* MODULE LIST */}
            <Box sx={{ p: 0.75, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {hoverMenu.group.children.map((item) => {
                const ItemIcon = item.icon || IconApps;
                const hasChildren = item.children && item.children.length > 0;
                const isSelected = level1Item?.id === item.id;
                const accentColor = hoverMenu.groupColor || '#e91e63';

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
                      py: 0.6,
                      mb: 0.15,
                      borderRadius: '8px',
                      bgcolor: isSelected ? alpha(accentColor, 0.12) : 'transparent',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: alpha(accentColor, 0.1),
                        transform: 'translateX(2px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: '7px',
                          bgcolor: isSelected ? accentColor : alpha(accentColor, 0.1),
                          color: isSelected ? '#fff' : accentColor,
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
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? accentColor : (isDark ? '#e2e8f0' : '#1e293b'),
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {item.title}
                      </Typography>
                    </Box>
                    {hasChildren ? (
                      <IconChevronRight
                        size={13}
                        style={{
                          color: isSelected ? accentColor : (isDark ? '#94a3b8' : '#94a3b8'),
                          flexShrink: 0
                        }}
                      />
                    ) : item.pageCode ? (
                      <Typography
                        sx={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          px: 0.75,
                          py: 0.3,
                          borderRadius: '5px',
                          bgcolor: alpha(accentColor, 0.12),
                          color: accentColor,
                          flexShrink: 0,
                          letterSpacing: '0.02em'
                        }}
                      >
                        {item.pageCode}
                      </Typography>
                    ) : null}
                  </ButtonBase>
                );
              })}
            </Box>
          </Paper>
        </Popper>
      )}

      {/* COLUMN 2: SUB-PAGES */}
      {hoverMenu && level1Item && level1Item.children?.length > 0 && level1AnchorEl && (
        <Popper
          open={Boolean(level1Item)}
          anchorEl={level1AnchorEl}
          placement="right-start"
          style={{ zIndex: 1410 }}
          modifiers={[{ name: 'offset', options: { offset: [-4, 6] } }]}
        >
          <Paper
            elevation={0}
            onMouseEnter={handleKeepOpen}
            onMouseLeave={handleMouseLeaveAll}
            sx={{
              width: 240,
              borderRadius: '14px',
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.98)' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark
                ? '0 16px 40px rgba(0,0,0,0.6)'
                : '0 16px 40px rgba(0,0,0,0.12)',
              overflow: 'hidden'
            }}
          >
            {/* SECTION LIST */}
            <Box sx={{ p: 0.75, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {level1Item.children.map((child) => {
                const ChildIcon = child.icon || IconApps;
                const hasChildren = child.children && child.children.length > 0;
                const isSelected = level2Item?.id === child.id;
                const accentColor = hoverMenu.groupColor || '#e91e63';

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
                      mb: 0.15,
                      borderRadius: '8px',
                      bgcolor: isSelected ? alpha(accentColor, 0.12) : 'transparent',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: alpha(accentColor, 0.1),
                        transform: 'translateX(2px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: '7px',
                          bgcolor: isSelected ? accentColor : alpha(accentColor, 0.1),
                          color: isSelected ? '#fff' : accentColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <ChildIcon size={14} />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: isSelected ? 700 : 600,
                          color: isSelected ? accentColor : (isDark ? '#e2e8f0' : '#1e293b'),
                          letterSpacing: '-0.01em'
                        }}
                      >
                        {child.title}
                      </Typography>
                    </Box>
                    {hasChildren ? (
                      <IconChevronRight size={13} style={{ color: isDark ? '#64748b' : '#94a3b8', flexShrink: 0 }} />
                    ) : child.pageCode ? (
                      <Typography
                        sx={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          px: 0.75,
                          py: 0.3,
                          borderRadius: '5px',
                          bgcolor: alpha(accentColor, 0.12),
                          color: accentColor,
                          flexShrink: 0,
                          letterSpacing: '0.02em'
                        }}
                      >
                        {child.pageCode}
                      </Typography>
                    ) : null}
                  </ButtonBase>
                );
              })}
            </Box>
          </Paper>
        </Popper>
      )}

      {/* COLUMN 3: LEAF PAGES */}
      {hoverMenu && level2Item && level2Item.children?.length > 0 && level2AnchorEl && (
        <Popper
          open={Boolean(level2Item)}
          anchorEl={level2AnchorEl}
          placement="right-start"
          style={{ zIndex: 1420 }}
          modifiers={[{ name: 'offset', options: { offset: [-4, 6] } }]}
        >
          <Paper
            elevation={0}
            onMouseEnter={handleKeepOpen}
            onMouseLeave={handleMouseLeaveAll}
            sx={{
              width: 290,
              borderRadius: '14px',
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.98)' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark
                ? '0 16px 40px rgba(0,0,0,0.6)'
                : '0 16px 40px rgba(0,0,0,0.12)',
              overflow: 'hidden'
            }}
          >
            {/* PAGES LIST */}
            <Box sx={{ p: 0.75, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', scrollbarWidth: 'thin' }}>
              {level2Item.children.map((leaf) => {
                const LeafIcon = leaf.icon || IconApps;
                const isLeafActive = leaf.url && location.pathname.startsWith(leaf.url);
                const accentColor = hoverMenu.groupColor || '#e91e63';

                return (
                  <ButtonBase
                    key={leaf.id}
                    component={leaf.url ? Link : 'div'}
                    to={leaf.url || '#'}
                    onClick={() => {
                      if (leaf.url) {
                        navigate(leaf.url);
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
                      mb: 0.15,
                      borderRadius: '8px',
                      bgcolor: isLeafActive ? alpha(accentColor, 0.12) : 'transparent',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: alpha(accentColor, 0.1),
                        transform: 'translateX(2px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '6px',
                          bgcolor: isLeafActive ? accentColor : alpha(accentColor, 0.1),
                          color: isLeafActive ? '#fff' : accentColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <LeafIcon size={13} />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '0.73rem',
                          fontWeight: isLeafActive ? 700 : 600,
                          color: isLeafActive ? accentColor : (isDark ? '#e2e8f0' : '#1e293b'),
                          letterSpacing: '-0.01em',
                          textAlign: 'left'
                        }}
                      >
                        {leaf.title}
                      </Typography>
                    </Box>
                    {leaf.pageCode && (
                      <Typography
                        sx={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          px: 0.75,
                          py: 0.3,
                          borderRadius: '5px',
                          bgcolor: alpha(accentColor, 0.12),
                          color: accentColor,
                          flexShrink: 0,
                          letterSpacing: '0.02em'
                        }}
                      >
                        {leaf.pageCode}
                      </Typography>
                    )}
                  </ButtonBase>
                );
              })}
            </Box>
          </Paper>
        </Popper>
      )}
    </Box>
  );
}

PremiumSpeedDialRibbon.propTypes = {
  groups: PropTypes.array,
  speedDialPreferences: PropTypes.object,
  modulePrefs: PropTypes.object,
  expandedGroupId: PropTypes.string,
  setExpandedGroupId: PropTypes.func,
  handleEditClick: PropTypes.func,
  prevPageItem: PropTypes.object,
  nextPageItem: PropTypes.object,
  ribbonOpen: PropTypes.bool,
  onCollapse: PropTypes.func
};

