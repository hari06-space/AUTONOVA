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
import IconButton from '@mui/material/IconButton';

import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronRight as IconChevronRightSmall,
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
  IconFolder,
  IconCircleDot
} from '@tabler/icons-react';

import { MODULE_ICONS } from '../SpeedDialConfigModal';

const DEFAULT_MODULE_CONFIG = {
  master: { color: '#2563eb', icon: IconLayoutGrid },
  hra: { color: '#ea580c', icon: IconUsers },
  sales: { color: '#059669', icon: IconTarget },
  planning: { color: '#4f46e5', icon: IconClipboardList },
  production: { color: '#7c3aed', icon: IconRobot },
  stores: { color: '#d97706', icon: IconTruck },
  finance: { color: '#ca8a04', icon: IconBuildingBank },
  design: { color: '#9333ea', icon: IconCompass },
  maintenance: { color: '#16a34a', icon: IconTools },
  qms: { color: '#db2777', icon: IconCertificate },
  reports: { color: '#0d9488', icon: IconChartBar },
  dashboard: { color: '#0284c7', icon: IconLayoutGrid },
  support: { color: '#dc2626', icon: IconTools },
  purchase: { color: '#d97706', icon: IconTruck },
  quality: { color: '#65a30d', icon: IconCertificate },
  npd: { color: '#0891b2', icon: IconCompass },
  crm: { color: '#c026d3', icon: IconTarget },
  hr: { color: '#f97316', icon: IconUsers },
  asset: { color: '#8b5cf6', icon: IconTools },
  'sales & marketing': { color: '#059669', icon: IconTarget },
  'planning & production': { color: '#4f46e5', icon: IconClipboardList },
  'stores & logistics': { color: '#d97706', icon: IconTruck },
  'finance & accounts': { color: '#ca8a04', icon: IconBuildingBank },
  'design & development': { color: '#9333ea', icon: IconCompass },
  'employee self': { color: '#0284c7', icon: IconUsers },
  'client management': { color: '#e11d48', icon: IconTarget },
};

const getModuleConfig = (group, modulePrefs) => {
  const pref = modulePrefs[group?.id] || {};
  const key = group?.id?.toLowerCase();
  const titleKey = group?.title?.toLowerCase();
  const defaultByKey = DEFAULT_MODULE_CONFIG[key] || DEFAULT_MODULE_CONFIG[titleKey];
  const color = pref.color || defaultByKey?.color || '#2563eb';
  const icon = (pref.icon && MODULE_ICONS[pref.icon]) || group?.icon || defaultByKey?.icon || IconLayoutGrid;
  return { color, icon };
};

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

const getSectionGroups = (section) => {
  if (!section || !section.children || section.children.length === 0) {
    return [];
  }

  const hasSubCategories = section.children.some((c) => c.children && c.children.length > 0);

  if (hasSubCategories) {
    const groups = [];
    for (const child of section.children) {
      const pages = getLeafItems([child]);
      if (pages.length > 0) {
        groups.push({
          id: child.id,
          title: child.title,
          icon: child.icon,
          pages
        });
      }
    }
    return groups;
  } else {
    const pages = section.children.filter((c) => c.type === 'item' && c.url);
    return pages.length > 0 ? [{ id: section.id, title: section.title, pages }] : [];
  }
};

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

export default function OutlookRibbon({
  groups = [],
  speedDialPreferences = {},
  modulePrefs = {},
  expandedGroupId,
  setExpandedGroupId,
  handleEditClick,
  prevPageItem,
  nextPageItem,
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

  // Mega Command Hub Popper State
  const [hoverMenu, setHoverMenu] = useState(null); // { anchorEl, group, groupColor }
  const [activeSection, setActiveSection] = useState(null);

  const hoverTimeoutRef = useRef(null);

  const handleMouseEnterGroup = (e, group, groupColor) => {
    setExpandedGroupId(group.id);
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

    // Start with NO right drawer on initial module tab hover
    setActiveSection(null);
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
      setActiveSection(null);
    }, 200);
  };

  const activeGroupId = useMemo(() => {
    if (expandedGroupId) return expandedGroupId;
    for (const g of groups) {
      if (g.children?.some((c) => c.url && location.pathname.startsWith(c.url))) {
        return g.id;
      }
    }
    return groups[0]?.id || '';
  }, [groups, expandedGroupId, location.pathname]);

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || groups[0];
  }, [groups, activeGroupId]);

  const level1Keys = useMemo(() => {
    return new Set(groups.map((g) => g._keyTip).filter(Boolean));
  }, [groups]);

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

  const activeModuleConfig = getModuleConfig(activeGroup || {}, modulePrefs);

  // Submodule Section Groups Breakdown
  const sectionGroups = useMemo(() => {
    return activeSection ? getSectionGroups(activeSection) : [];
  }, [activeSection]);

  const totalPagesCount = useMemo(() => {
    return sectionGroups.reduce((acc, g) => acc + g.pages.length, 0);
  }, [sectionGroups]);

  // Check if right drawer is needed (activeSection has sub-pages)
  const hasRightDrawer = Boolean(activeSection && activeSection.children && activeSection.children.length > 0);

  // Dynamic Width: 260px if no right drawer, else 640px-940px depending on page count
  const paperWidth = !hasRightDrawer
    ? 260
    : totalPagesCount > 15
    ? 940
    : totalPagesCount > 8
    ? 780
    : 640;

  // Check if current hovered module is in the right half of the screen
  const groupIndex = groups.findIndex((g) => g.id === hoverMenu?.group?.id);
  const isRightCorner = groupIndex !== -1 && groupIndex >= Math.floor(groups.length / 2);

  return (
    <Box
      sx={{
        width: '100%',
        height: 78,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? '#0f172a' : '#ffffff',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        px: 1.25,
        userSelect: 'none',
        overflow: altMode ? 'visible' : 'hidden'
      }}
    >
      {/* TIER 1: STRICT AUTO-FIT ALL MODULES ROW */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 42,
          width: '100%',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`,
          overflow: altMode ? 'visible' : 'hidden'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            width: '100%',
            gap: 0.25,
            overflow: altMode ? 'visible' : 'hidden'
          }}
        >
          {groups.map((group) => {
            const isActive = group.id === activeGroupId;
            const isKeyTipActive = group.id === altActiveGroupId;
            const { color: groupColor, icon: IconComp } = getModuleConfig(group, modulePrefs);

            return (
              <ButtonBase
                key={group.id}
                onClick={() => {
                  setExpandedGroupId(group.id);
                  setHoverMenu(null);
                }}
                onMouseEnter={(e) => handleMouseEnterGroup(e, group, groupColor)}
                onMouseLeave={handleMouseLeaveAll}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.4,
                  flex: '1 1 0px',
                  minWidth: 0,
                  maxWidth: 120,
                  px: 0.6,
                  height: 34,
                  borderRadius: '6px',
                  position: 'relative',
                  bgcolor: isActive
                    ? alpha(groupColor, isDark ? 0.2 : 0.1)
                    : 'transparent',
                  color: isActive
                    ? groupColor
                    : (isDark ? '#cbd5e1' : '#475569'),
                  borderBottom: isActive
                    ? `3px solid ${groupColor}`
                    : '3px solid transparent',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    color: groupColor
                  }
                }}
              >
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '4px',
                    bgcolor: (altMode && group._keyTip)
                      ? (isKeyTipActive ? '#2563eb' : '#0f172a')
                      : (isActive ? groupColor : alpha(groupColor, 0.12)),
                    color: (altMode && group._keyTip)
                      ? '#fbbf24'
                      : (isActive ? '#ffffff' : groupColor),
                    border: (altMode && group._keyTip)
                      ? '1px solid #f59e0b'
                      : 'none',
                    boxShadow: (altMode && group._keyTip)
                      ? '0 2px 6px rgba(0,0,0,0.5)'
                      : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {altMode && group._keyTip ? (
                    <Typography
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 900,
                        color: '#fbbf24',
                        lineHeight: 1
                      }}
                    >
                      {group._keyTip}
                    </Typography>
                  ) : (
                    IconComp && <IconComp size={11} stroke={2} />
                  )}
                </Box>
                <Typography
                  sx={{
                    fontSize: '0.61rem',
                    fontWeight: isActive ? 800 : 700,
                    letterSpacing: '0.01em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {group.title}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>

        {/* RIGHT PREV/NEXT ARROWS */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 0.75, flexShrink: 0 }}>
          {prevPageItem && (
            <Tooltip title={`Prev: ${prevPageItem.title}`} placement="bottom">
              <IconButton
                size="small"
                onClick={() => navigate(prevPageItem.url)}
                sx={{ width: 22, height: 22, bgcolor: 'action.hover', color: 'text.primary' }}
              >
                <IconChevronLeft size={13} />
              </IconButton>
            </Tooltip>
          )}
          {nextPageItem && (
            <Tooltip title={`Next: ${nextPageItem.title}`} placement="bottom">
              <IconButton
                size="small"
                onClick={() => navigate(nextPageItem.url)}
                sx={{ width: 22, height: 22, bgcolor: 'action.hover', color: 'text.primary' }}
              >
                <IconChevronRight size={13} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* TIER 2: ADVANCED SPEED DIAL QUICK COMMAND BAR */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 36,
          width: '100%',
          gap: 1
        }}
      >
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
          {/* Active Module Tag */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1,
              py: 0.25,
              height: 24,
              borderRadius: '6px',
              bgcolor: alpha(activeModuleConfig.color, 0.12),
              color: activeModuleConfig.color,
              border: `1px solid ${alpha(activeModuleConfig.color, 0.3)}`,
              flexShrink: 0
            }}
          >
            <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {activeGroup?.title}
            </Typography>
          </Box>

          <Typography sx={{ fontSize: '0.7rem', color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>|</Typography>

          {/* Quick Page Links */}
          {activeSubItems.map((sub) => {
            const isSubActive = sub.url && location.pathname.startsWith(sub.url);
            const SubIcon = sub.icon || IconApps;

            return (
              <ButtonBase
                key={sub.id}
                component={sub.url ? Link : 'div'}
                to={sub.url || '#'}
                onClick={() => sub.url && navigate(sub.url)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  px: 1,
                  py: 0.25,
                  height: 25,
                  borderRadius: '6px',
                  bgcolor: isSubActive
                    ? alpha(activeModuleConfig.color, 0.14)
                    : (isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
                  border: `1px solid ${isSubActive ? alpha(activeModuleConfig.color, 0.4) : (isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0')}`,
                  color: isSubActive
                    ? activeModuleConfig.color
                    : (isDark ? '#cbd5e1' : '#475569'),
                  fontWeight: isSubActive ? 700 : 500,
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                  position: 'relative',
                  '&:hover': {
                    bgcolor: alpha(activeModuleConfig.color, 0.1),
                    borderColor: activeModuleConfig.color,
                    color: activeModuleConfig.color,
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: '5px',
                    bgcolor: (altMode && sub._keyTip)
                      ? (isSubActive ? '#2563eb' : '#0f172a')
                      : (isSubActive ? activeModuleConfig.color : alpha(activeModuleConfig.color, 0.12)),
                    color: (altMode && sub._keyTip)
                      ? '#fbbf24'
                      : (isSubActive ? '#ffffff' : activeModuleConfig.color),
                    border: (altMode && sub._keyTip) ? '1px solid #f59e0b' : 'none',
                    boxShadow: (altMode && sub._keyTip) ? '0 2px 6px rgba(0,0,0,0.5)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {altMode && sub._keyTip ? (
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>
                      {sub._keyTip}
                    </Typography>
                  ) : (
                    <SubIcon size={12} />
                  )}
                </Box>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 'inherit', whiteSpace: 'nowrap' }}>
                  {sub.title}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>

        {/* CONFIGURE BUTTON */}
        {activeGroup && (
          <Tooltip title="Configure Speed Dial Items" arrow placement="left">
            <IconButton
              size="small"
              onClick={() => handleEditClick(activeGroup)}
              sx={{
                width: 24,
                height: 24,
                borderRadius: '5px',
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                color: isDark ? '#94a3b8' : '#64748b',
                flexShrink: 0,
                '&:hover': { bgcolor: alpha(activeModuleConfig.color, 0.1), color: activeModuleConfig.color }
              }}
            >
              <IconAdjustmentsHorizontal size={13} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* 👑 BOS(S) SMART MEGA COMMAND HUB (DYNAMIC DRAWER: OPENS LEFT/RIGHT DEPENDING ON CORNER) */}
      {hoverMenu && hoverMenu.group?.children?.length > 0 && (
        <Popper
          open={Boolean(hoverMenu)}
          anchorEl={hoverMenu.anchorEl}
          placement={isRightCorner ? 'bottom-end' : 'bottom-start'}
          style={{ zIndex: 1400 }}
          modifiers={[{ name: 'offset', options: { offset: [0, 4] } }]}
        >
          <Paper
            elevation={0}
            onMouseEnter={handleKeepOpen}
            onMouseLeave={handleMouseLeaveAll}
            sx={{
              width: paperWidth,
              minHeight: 300,
              maxHeight: 'calc(100vh - 110px)',
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(15, 23, 42, 0.98)' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark
                ? '0 24px 60px rgba(0,0,0,0.85)'
                : '0 24px 60px rgba(0,0,0,0.18)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: isRightCorner ? 'row-reverse' : 'row',
              overflow: 'hidden',
              transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {/* MODULE ITEMS LIST COLUMN */}
            <Box
              sx={{
                width: hasRightDrawer ? 210 : '100%',
                flexShrink: 0,
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#f8fafc',
                borderRight: (hasRightDrawer && !isRightCorner) ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` : 'none',
                borderLeft: (hasRightDrawer && isRightCorner) ? `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` : 'none',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* GRADIENT HEADER BANNER */}
              <Box
                sx={{
                  px: 1.75,
                  py: 1.2,
                  background: `linear-gradient(135deg, ${hoverMenu.groupColor}25 0%, ${hoverMenu.groupColor}05 100%)`,
                  borderBottom: `1px solid ${hoverMenu.groupColor}22`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '6px',
                    bgcolor: hoverMenu.groupColor,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 2px 8px ${alpha(hoverMenu.groupColor, 0.4)}`
                  }}
                >
                  <IconFolder size={14} />
                </Box>
                <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: hoverMenu.groupColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {hoverMenu.group.title}
                </Typography>
              </Box>

              {/* MODULE ITEMS LIST */}
              <Box
                sx={{
                  p: 0.75,
                  flex: 1,
                  overflowY: 'auto',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' }
                }}
              >
                {hoverMenu.group.children.map((item) => {
                  const ItemIcon = item.icon || IconApps;
                  const hasChildren = item.children && item.children.length > 0;
                  const isSelected = hasChildren && activeSection?.id === item.id;
                  const isPageActive = item.url && location.pathname.startsWith(item.url);
                  const accentColor = hoverMenu.groupColor;
                  const subPageCount = hasChildren ? getLeafItems([item]).length : 0;

                  return (
                    <ButtonBase
                      key={item.id}
                      component={!hasChildren && item.url ? Link : 'div'}
                      to={!hasChildren && item.url ? item.url : '#'}
                      onMouseEnter={() => {
                        if (hasChildren) {
                          setActiveSection(item);
                        } else {
                          setActiveSection(null);
                        }
                      }}
                      onClick={() => {
                        if (!hasChildren && item.url) {
                          navigate(item.url);
                          setHoverMenu(null);
                          setActiveSection(null);
                        } else if (hasChildren) {
                          setActiveSection(item);
                        }
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        px: 1.25,
                        py: 0.65,
                        mb: 0.25,
                        borderRadius: '8px',
                        position: 'relative',
                        bgcolor: isSelected
                          ? alpha(accentColor, 0.14)
                          : isPageActive
                          ? alpha(accentColor, 0.1)
                          : 'transparent',
                        color: isSelected || isPageActive
                          ? accentColor
                          : (isDark ? '#cbd5e1' : '#334155'),
                        borderLeft: (!isRightCorner && isSelected) ? `3.5px solid ${accentColor}` : '3.5px solid transparent',
                        borderRight: (isRightCorner && isSelected) ? `3.5px solid ${accentColor}` : '3.5px solid transparent',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: alpha(accentColor, 0.08)
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: '5px',
                            bgcolor: isSelected || isPageActive ? accentColor : alpha(accentColor, 0.1),
                            color: isSelected || isPageActive ? '#ffffff' : accentColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <ItemIcon size={12} />
                        </Box>
                        <Typography
                          sx={{
                            fontSize: '0.74rem',
                            fontWeight: isSelected || isPageActive ? 800 : 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {item.title}
                        </Typography>
                      </Box>

                      {hasChildren ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                          <Typography sx={{ fontSize: '0.6rem', color: isSelected ? accentColor : 'text.secondary', opacity: 0.8, fontWeight: 700 }}>
                            {subPageCount}
                          </Typography>
                          <IconChevronRightSmall size={13} style={{ color: isSelected ? accentColor : (isDark ? '#64748b' : '#94a3b8'), transform: isRightCorner ? 'rotate(180deg)' : 'none' }} />
                        </Box>
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
            </Box>

            {/* PAGES DRAWER COLUMN (OPENS LEFT OR RIGHT DEPENDING ON IS_RIGHT_CORNER) */}
            {hasRightDrawer && (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: isDark ? '#0f172a' : '#ffffff'
                }}
              >
                {/* RIGHT HEADER BANNER */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.2,
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {activeSection.title}
                  </Typography>
                  <Box
                    sx={{
                      px: 0.9,
                      py: 0.2,
                      borderRadius: '12px',
                      bgcolor: alpha(hoverMenu.groupColor, 0.1),
                      color: hoverMenu.groupColor,
                      fontSize: '0.62rem',
                      fontWeight: 800
                    }}
                  >
                    {totalPagesCount} Pages Available
                  </Box>
                </Box>

                {/* CATEGORIZED SUB-SECTIONS BODY */}
                <Box
                  sx={{
                    p: 1.5,
                    flex: 1,
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5
                  }}
                >
                  {sectionGroups.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>No pages available under this section.</Typography>
                    </Box>
                  ) : (
                    sectionGroups.map((secGroup) => {
                      const GroupIcon = secGroup.icon || IconCircleDot;
                      const accentColor = hoverMenu.groupColor;

                      return (
                        <Box key={secGroup.id || secGroup.title} sx={{ width: '100%' }}>
                          {/* SUB-MODULE HEADER */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.75,
                              mb: 0.75,
                              pb: 0.3,
                              borderBottom: `1px solid ${alpha(accentColor, 0.15)}`
                            }}
                          >
                            <GroupIcon size={13} style={{ color: accentColor }} />
                            <Typography
                              sx={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                color: accentColor,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                              }}
                            >
                              {secGroup.title}
                            </Typography>
                            <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', fontWeight: 600 }}>
                              ({secGroup.pages.length})
                            </Typography>
                          </Box>

                          {/* LEFT-ALIGNED GRID OF PAGES */}
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                              gap: 0.6,
                              justifyItems: 'start'
                            }}
                          >
                            {secGroup.pages.map((page) => {
                              const PageIcon = page.icon || IconCircleDot;
                              const isPageActive = page.url && location.pathname.startsWith(page.url);

                              return (
                                <ButtonBase
                                  key={page.id}
                                  component={page.url ? Link : 'div'}
                                  to={page.url || '#'}
                                  onClick={() => {
                                    if (page.url) {
                                      navigate(page.url);
                                      setHoverMenu(null);
                                      setActiveSection(null);
                                    }
                                  }}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    textAlign: 'left',
                                    width: '100%',
                                    gap: 0.75,
                                    px: 0.9,
                                    py: 0.5,
                                    borderRadius: '6px',
                                    border: `1px solid ${isPageActive ? alpha(accentColor, 0.4) : (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9')}`,
                                    bgcolor: isPageActive
                                      ? alpha(accentColor, 0.12)
                                      : (isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc'),
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                      bgcolor: alpha(accentColor, 0.08),
                                      borderColor: accentColor,
                                      transform: 'translateX(2px)'
                                    }
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '5px',
                                      bgcolor: isPageActive ? accentColor : alpha(accentColor, 0.12),
                                      color: isPageActive ? '#ffffff' : accentColor,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0
                                    }}
                                  >
                                    <PageIcon size={11} />
                                  </Box>
                                  <Typography
                                    sx={{
                                      fontSize: '0.71rem',
                                      fontWeight: isPageActive ? 800 : 600,
                                      color: isPageActive ? accentColor : (isDark ? '#e2e8f0' : '#1e293b'),
                                      lineHeight: 1.2,
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis'
                                    }}
                                  >
                                    {page.title}
                                  </Typography>
                                  {page.pageCode && (
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
                                        letterSpacing: '0.02em',
                                        ml: 'auto'
                                      }}
                                    >
                                      {page.pageCode}
                                    </Typography>
                                  )}
                                </ButtonBase>
                              );
                            })}
                          </Box>
                        </Box>
                      );
                    })
                  )}
                </Box>
              </Box>
            )}
          </Paper>
        </Popper>
      )}
    </Box>
  );
}

OutlookRibbon.propTypes = {
  groups: PropTypes.array,
  speedDialPreferences: PropTypes.object,
  modulePrefs: PropTypes.object,
  expandedGroupId: PropTypes.string,
  setExpandedGroupId: PropTypes.func,
  handleEditClick: PropTypes.func,
  prevPageItem: PropTypes.object,
  nextPageItem: PropTypes.object,
  altMode: PropTypes.bool,
  altActiveGroupId: PropTypes.string,
  altChildItems: PropTypes.array
};
