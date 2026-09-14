import PropTypes from 'prop-types';
import { cloneElement, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useTheme, alpha, useColorScheme, lighten } from '@mui/material/styles';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import AppBar from '@mui/material/AppBar';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Popper from '@mui/material/Popper';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';

import { Link } from 'react-router-dom';

import MenuList from './MenuList';
import { filterMenuByPermissions } from 'utils/menuUtils';
import NavCollapse from './MenuList/NavCollapse';
import NavItem from './MenuList/NavItem';
import menuItem from 'menu-items';
import useConfig from 'hooks/useConfig';
import { RibbonLayout } from 'config';
import { useRibbon } from 'contexts/RibbonContext';
import SpeedDialConfigModal, { MODULE_ICONS } from './SpeedDialConfigModal';
import QuantumRibbon from './Ribbon/QuantumRibbon';
import PremiumSpeedDialRibbon from './Ribbon/PremiumSpeedDialRibbon';
import OutlookRibbon from './Ribbon/OutlookRibbon';
import { useSelector } from 'store';
import useAuth from 'hooks/useAuth';
import axios from 'utils/axios';

import { IconChevronDown, IconChevronUp, IconChevronLeft, IconChevronRight, IconSettings } from '@tabler/icons-react';

import { useGroupColors } from 'hooks/useGroupColors';

// ==============================|| RIBBON CHILD ITEM ||============================== //
const getModuleShape = (title) => {
  const t = (title || '');
  let hash = 0;
  for (let i = 0; i < t.length; i++) {
    hash += t.charCodeAt(i);
  }
  // Shuffle between Octagon and Folded Corner
  if (hash % 2 === 0) {
    return 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'; // Octagon
  } else {
    return 'polygon(25% 0%, 100% 0%, 100% 75%, 75% 100%, 0% 100%, 0% 25%)'; // Folded Corner
  }
};

function RibbonChildItem({ item, onClose, isGroup, colors: customColors, onClick, isExpanded, isKeyTipActive, keyTip, parentTitle, isNone }) {
  const shapePath = getModuleShape(parentTitle || item.title);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const timeoutRef = useRef(null);
  const permMap = useSelector((state) => state.permissions?.map) || {};
  const showPageCode = Boolean(item.pageCode);
  const open = Boolean(anchorEl);
  const Icon = item.icon;
  const hasChildren = item.children?.length > 0;

  useEffect(() => {
    setAnchorEl(null);
  }, [location.pathname]);

  const defaultColors = {
    main: theme.palette.primary.main,
    light: theme.palette.primary.light,
    lighter: theme.palette.primary.lighter
  };
  const colors = customColors || defaultColors;

  const handleMouseEnter = (e) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (hasChildren && !anchorEl) {
      setAnchorEl(e.currentTarget);
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setAnchorEl(null);
    }, 200); // 200ms delay to allow crossing the gap
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (!hasChildren && item.url) {
      navigate(item.url);
    }
  };

  const innerContent = (
    <>
      <Box sx={{ position: 'relative' }}>
        {isKeyTipActive && keyTip && !isGroup && (
          <Box
            sx={{
              position: 'absolute',
              top: -6,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: '#222',
              color: '#fff',
              px: 0.6,
              py: 0.1,
              borderRadius: '2px',
              fontSize: '10px',
              fontWeight: 800,
              zIndex: 100,
              boxShadow: '1px 1px 4px rgba(0,0,0,0.5)',
              border: '1px solid #555',
              pointerEvents: 'none',
              letterSpacing: '0.05em'
            }}
          >
            {keyTip}
          </Box>
        )}
        <Box
          className="child-icon"
          sx={{
            mb: !isGroup ? 0.5 : 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: !isGroup ? 24 : 'auto',
            height: !isGroup ? 24 : 'auto',
            borderRadius: !isGroup ? '25%' : 0,
            background: !isGroup ? `linear-gradient(135deg, ${colors.light} 0%, ${colors.main} 100%)` : 'none',
            lineHeight: 0,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            color: '#fff'
          }}
        >
          {Icon && <Icon stroke={isGroup ? 1.5 : 2} size={isGroup ? '22px' : '15px'} />}
        </Box>
      </Box>
      {!isGroup && (
        <Typography
          sx={{
            fontSize: '0.55rem',
            lineHeight: 1.1,
            textAlign: 'center',
            maxWidth: 52,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'normal',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            color: 'inherit'
          }}
          title={item.title}
        >
          {item.title}
        </Typography>
      )}
    </>
  );

  const buttonBaseContent = (
    <ButtonBase
      {...(!hasChildren && item.url ? { component: Link, to: item.url } : { onClick: handleClick })}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isGroup ? 'center' : 'flex-start', // Use flex-start so text flows naturally down
        px: 0.25,
        pt: isGroup ? 0 : 0.5,
        pb: isGroup ? 0 : 0.25,
        minWidth: isGroup ? 36 : 46,
        maxWidth: isGroup ? 36 : 52,
        width: isGroup ? 36 : 'auto',
        height: isGroup ? 36 : 46,
        borderRadius: isGroup ? '10px' : '6px',
        clipPath: 'none',
        color: open || (isGroup && isExpanded)
          ? (isGroup ? '#fff' : colors.main)
          : isGroup
            ? '#fff'
            : 'text.secondary',
        background: isGroup
          ? `linear-gradient(135deg, ${colors.light} 0%, ${colors.main} 100%)`
          : 'transparent',
        border: 'none',
        boxShadow: isGroup ? `0 2px 6px ${alpha(colors.main, 0.2)}` : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&::after': !isGroup ? {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(circle at center, ${alpha(colors.main, 0.15)} 0%, transparent 70%)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none'
        } : {},
        '&:hover': {
          background: isGroup
            ? `linear-gradient(135deg, ${colors.light} 0%, ${colors.main} 100%)`
            : alpha(colors.main, 0.04),
          borderColor: isGroup ? 'transparent' : alpha(colors.main, 0.15),
          color: isGroup ? '#fff' : colors.main,
          transform: isGroup ? 'none' : 'translateY(-2px)',
          boxShadow: isGroup
            ? 'none'
            : `0 4px 12px -4px ${alpha(colors.main, 0.2)}`,
          '&::after': !isGroup ? {
            opacity: 1
          } : {},
          '& .child-icon': {
            transform: isGroup ? 'none' : 'scale(1.1)',
            color: '#fff',
            filter: !isGroup ? `drop-shadow(0px 4px 8px ${alpha(colors.main, 0.4)})` : 'none'
          }
        }
      }}
    >
      {innerContent}
    </ButtonBase>
  );

  return (
    <Box onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} sx={{ height: '100%' }}>
      {showPageCode ? (
        <Tooltip
          title={<span>{item.title} ({item.pageCode})</span>}
          placement="top"
          disableInteractive
          disableHoverListener={true}
          arrow
          slotProps={{
            popper: {
              sx: {
                zIndex: 2500
              }
            }
          }}
        >
          {buttonBaseContent}
        </Tooltip>
      ) : (
        buttonBaseContent
      )}

      {hasChildren && (
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-start"
          sx={{ zIndex: 2001 }}
          onMouseEnter={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
          }}
          onMouseLeave={handleMouseLeave}
          modifiers={[
            {
              name: 'offset',
              options: {
                offset: [0, 8]
              }
            }
          ]}
        >
          <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
            <Paper
              sx={{
                boxShadow: theme.shadows[8],
                py: 0.5,
                minWidth: 190,
                maxHeight: 'calc(100vh - 140px)',
                overflowY: 'auto',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none'
                },
                backgroundImage: 'none',
                position: 'relative',
                overflow: 'visible',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -12, // Bridges the 8px offset gap perfectly
                  left: 0,
                  right: 0,
                  height: 12,
                  bgcolor: 'transparent',
                  zIndex: 1
                }
              }}
            >
              <List dense disablePadding>
                {item.children.map((menu) => {
                  switch (menu.type) {
                    case 'collapse':
                      return <NavCollapse key={menu.id} menu={menu} level={1} />;
                    case 'item':
                      return <NavItem key={menu.id} item={menu} level={1} />;
                    default:
                      return (
                        <Typography key={menu.id} variant="h6" color="error" align="center">
                          Menu Items Error
                        </Typography>
                      );
                  }
                })}
              </List>
            </Paper>
          </ClickAwayListener>
        </Popper>
      )}
    </Box>
  );
}

// ==============================|| KEYTIP UTILITIES ||============================== //

/**
 * Assigns unique single-letter keytips to an array of items (modules or children).
 * Tries first letter of each word, then falls back to any unused letter in the title.
 */
function assignKeyTips(items, reservedKeys = new Set()) {
  const used = new Set(reservedKeys);
  return items.map(item => {
    const title = (item.title || '').toUpperCase().replace(/[^A-Z]/g, '');
    let key = null;
    if (item._keyTip && !used.has(item._keyTip)) {
      key = item._keyTip;
    } else {
      // Try each character in the title
      for (const ch of title) {
        if (!used.has(ch)) {
          key = ch;
          break;
        }
      }
      // Fallback: try A-Z
      if (!key) {
        for (let i = 65; i <= 90; i++) {
          const ch = String.fromCharCode(i);
          if (!used.has(ch)) { key = ch; break; }
        }
      }
    }
    if (key) used.add(key);
    return { ...item, _keyTip: key };
  });
}

// ==============================|| RIBBON GROUP SECTION ||============================== //

function RibbonGroupSection({ group, onClose, speedDialIds, onEditClick, altMode, keyTip, isKeyTipActive, isFirst, isLast, zIndex, expandedGroupId, setExpandedGroupId, customColorOverride }) {
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const isDark = (mode === 'system' ? systemMode : mode) === 'dark';
  const bgPaper = isDark ? theme.palette.dark.dark : '#ffffff';
  const getGroupColors = useGroupColors();
  const { state: { menuCardStyle } } = useConfig();
  const isNone = menuCardStyle === 'none';
  const isChevron = menuCardStyle === 'chevron';
  const isJigsaw = menuCardStyle === 'jigsaw';
  const isRounded = menuCardStyle === 'rounded';
  const isParallelogram = menuCardStyle === 'parallelogram';
  const isCircle = menuCardStyle === 'circle';
  const isSquare = menuCardStyle === 'square';
  const isBubble = menuCardStyle === 'bubble';
  const isTicket = menuCardStyle === 'ticket';
  const isLeaf = menuCardStyle === 'leaf';
  const isShapeClipped = isChevron || isParallelogram || isTicket || isLeaf;

  const children = group.children || [];
  const defaultColors = getGroupColors(group.title);
  const colors = customColorOverride || defaultColors;
  const location = useLocation();

  const getAllLeafItems = (items) => {
    let result = [];
    items.forEach(item => {
      if (item.type === 'item') {
        result.push(item);
      } else if (item.children) {
        result = result.concat(getAllLeafItems(item.children));
      }
    });
    return result;
  };

  const allLeafItems = getAllLeafItems(children);

  const hasActiveChild = allLeafItems.some(child => child.url && location.pathname === child.url);

  const isExpanded = expandedGroupId === null ? hasActiveChild : expandedGroupId === group.id;

  useEffect(() => {
    if (hasActiveChild) {
      setExpandedGroupId(group.id);
    }
  }, [location.pathname, hasActiveChild, setExpandedGroupId, group.id]);

  const handleGroupClick = () => {
    if (children.length > 0) {
      setExpandedGroupId(isExpanded ? 'none' : group.id);
    }
  };

  let displayedChildren = speedDialIds && speedDialIds.length > 0
    ? speedDialIds.map(id => allLeafItems.find(c => c.id === id)).filter(Boolean)
    : [];

  if (displayedChildren.length === 0) {
    displayedChildren = allLeafItems.slice(0, 5);
  }

  const activeChild = allLeafItems.find(child => child.url && location.pathname === child.url);
  if (activeChild && !displayedChildren.some(c => c.id === activeChild.id)) {
    displayedChildren = [...displayedChildren, activeChild];
  }

  const displayedChildrenWithKeyTips = useMemo(() => {
    if (!isKeyTipActive) return displayedChildren;
    return assignKeyTips(displayedChildren);
  }, [displayedChildren, isKeyTipActive]);

  const getClipPath = () => {
    if (isChevron) {
      if (isFirst && isLast) return 'none';
      if (isFirst) return 'polygon(0% 0%, calc(100% - 16px) 0%, 100% 50%, calc(100% - 16px) 100%, 0% 100%)';
      if (isLast) return 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 16px 50%)';
      return 'polygon(0% 0%, calc(100% - 16px) 0%, 100% 50%, calc(100% - 16px) 100%, 0% 100%, 16px 50%)';
    }
    if (isParallelogram) {
      if (isFirst && isLast) return 'none';
      if (isFirst) return 'polygon(0% 0%, 100% 0%, calc(100% - 16px) 100%, 0% 100%)';
      if (isLast) return 'polygon(16px 0%, 100% 0%, 100% 100%, 0% 100%)';
      return 'polygon(16px 0%, 100% 0%, calc(100% - 16px) 100%, 0% 100%)';
    }
    if (isTicket) {
      return 'polygon(0% 0%, 100% 0%, 100% calc(50% - 10px), calc(100% - 10px) 50%, 100% calc(50% + 10px), 100% 100%, 0% 100%, 0% calc(50% + 10px), 10px 50%, 0% calc(50% - 10px))';
    }
    if (isLeaf) {
      return 'polygon(24px 0%, 100% 0%, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0% 100%, 0% 24px)';
    }
    return 'none';
  };

  const isOverlap = isChevron || isParallelogram;

  return (
    <Box
      sx={{
        height: 'calc(100% - 20px)',
        mt: 1.5,
        mb: 1,
        ml: isOverlap ? (isFirst ? 0 : '-6px') : 0, // uniform diagonal gap between chevrons/ribbons
        position: 'relative',
        zIndex: zIndex,
        flex: isExpanded ? '0 0 auto' : '0 1 120px',
        maxWidth: isExpanded ? 'none' : (isNone ? 100 : 120),
        minWidth: isExpanded ? 'auto' : 0,
        filter: isShapeClipped ? `drop-shadow(0px 0px 1px ${alpha(colors.main, 0.8)}) drop-shadow(0px 4px 6px ${alpha(colors.main, 0.2)})` : 'none', // 1px sharp shadow acts as a border
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          filter: isShapeClipped
            ? `drop-shadow(0px 0px ${isDark ? '6px' : '1.5px'} ${isDark ? alpha(colors.light, 0.8) : colors.main}) drop-shadow(0px 6px 12px ${alpha(colors.main, isDark ? 0.6 : 0.35)})`
            : 'none',
          '& .edit-speed-dial-btn': {
            opacity: 1,
            visibility: 'visible'
          },
          '& .chevron-card': {
            backgroundImage: isNone
              ? `linear-gradient(to bottom, ${alpha(colors.main, 0.25)} 0%, ${bgPaper} 100%)`
              : (isShapeClipped
                ? `linear-gradient(to right, ${alpha(colors.main, 0.25)} 0%, ${bgPaper} 100%)`
                : `linear-gradient(135deg, ${alpha(colors.light, 0.6)} 0%, ${alpha(colors.main, 0.25)} 100%)`),
            borderColor: isNone ? alpha(colors.main, 0.5) : undefined,
            boxShadow: isNone
              ? `0 4px 12px ${alpha(colors.main, 0.15)}`
              : (isShapeClipped
                ? undefined
                : `0 6px 16px ${alpha(colors.main, isDark ? 0.4 : 0.2)}, 0 0 ${isDark ? '10px' : '0px'} ${alpha(colors.light, isDark ? 0.6 : 0)}`),
          }
        }
      }}
    >
      <Box
        className="chevron-card"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          pl: isNone ? 0.5 : (isOverlap ? (isFirst ? 0.75 : 1.8) : 0.75),
          pr: isNone ? 0.5 : (isOverlap ? (isLast ? 0.75 : 1.8) : 1),
          py: 0.5,
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          minWidth: isExpanded ? 'auto' : 0,
          maxWidth: isExpanded ? 'none' : (isNone ? 100 : 120),
          borderRadius: isNone ? '10px' : (isShapeClipped ? 0 : (isCircle ? '50px' : isSquare ? '0px' : isBubble ? '24px 24px 24px 4px' : isRounded ? '24px' : '5px')),
          border: isNone ? `1.5px solid ${alpha(colors.main, 0.35)}` : (isShapeClipped ? 'none' : (isCircle || isSquare || isRounded || isBubble ? `2px solid ${alpha(colors.main, 0.25)}` : `3px solid ${alpha(colors.main, 0.25)}`)),
          backgroundColor: isNone ? undefined : (isDark ? 'rgba(30, 41, 59, 0.7)' : alpha(colors.main, 0.08)),
          backgroundImage: isNone
            ? `linear-gradient(to bottom, ${alpha(colors.main, 0.22)} 0%, ${isDark ? 'rgba(30,41,59,0.8)' : '#f8faff'} 100%)`
            : (isShapeClipped
              ? `linear-gradient(to right, ${alpha(colors.main, 0.25)} 0%, ${isDark ? 'rgba(30,41,59,0.8)' : '#f8faff'} 100%)`
              : `linear-gradient(135deg, ${alpha(colors.light || colors.main, 0.45)} 0%, ${alpha(colors.main, 0.18)} 100%)`),
          boxShadow: isNone
            ? `inset 0 0 20px ${alpha(colors.main, 0.08)}, 0 2px 8px ${alpha(colors.main, 0.1)}`
            : (isShapeClipped ? 'none' : `0 4px 12px ${alpha(colors.main, 0.15)}`),
          clipPath: getClipPath(),
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(isJigsaw && {
            '&::after': {
              content: '""',
              position: 'absolute',
              right: '-14px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '18px',
              height: '32px',
              backgroundColor: bgPaper,
              borderTopRightRadius: '8px',
              borderBottomRightRadius: '8px',
              boxShadow: `4px 0 8px ${alpha(colors.main, 0.15)}`,
              zIndex: 1,
              transition: 'all 0.3s ease'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              right: '-11px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '15px',
              height: '26px',
              backgroundColor: alpha(colors.main, 0.15),
              borderTopRightRadius: '6px',
              borderBottomRightRadius: '6px',
              zIndex: 2,
              transition: 'all 0.3s ease'
            }
          })
        }}
      >
        {/* KeyTip Badge — shown in Alt mode */}
        {altMode && keyTip && (
          <Box
            sx={{
              position: 'absolute',
              top: 3,
              right: 3,
              minWidth: 16,
              height: 16,
              px: 0.4,
              borderRadius: '4px',
              bgcolor: isKeyTipActive ? '#2563eb' : '#0f172a',
              color: '#fbbf24',
              fontSize: '9px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 100,
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              border: '1px solid #fbbf24',
              pointerEvents: 'none',
              lineHeight: 1
            }}
          >
            {keyTip}
          </Box>
        )}

        {/* Edit Speed Dial Button */}
        {allLeafItems.length > 0 && (
          <Tooltip title="Customize Speed Dial" placement="top" arrow>
            <IconButton
              className="edit-speed-dial-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEditClick({ ...group, allLeafItems });
              }}
              size="small"
              sx={{
                position: 'absolute',
                top: isChevron ? '50%' : 4,
                right: isChevron ? 6 : 4,
                transform: isChevron ? 'translateY(-50%) scale(0.8)' : 'scale(0.8)',
                bgcolor: alpha(colors.main, 0.8),
                color: '#fff',
                borderRadius: '50%',
                width: 24,
                height: 24,
                opacity: 0,
                visibility: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 10,
                padding: 0,
                boxShadow: `0 2px 8px ${alpha(colors.main, 0.4)}`,
                '&:hover': {
                  opacity: 1,
                  transform: isChevron ? 'translateY(-50%) scale(1.1)' : 'scale(1.1)',
                  bgcolor: colors.main,
                  boxShadow: `0 4px 12px ${alpha(colors.main, 0.6)}`,
                  '& .settings-icon': {
                    animation: 'spin 2s linear infinite'
                  }
                },
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }}
            >
              <IconSettings className="settings-icon" size="14px" />
            </IconButton>
          </Tooltip>
        )}

        {/* Top part: Main module icon + Children icons */}
        <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 0.5, width: '100%' }}>
          {/* Always show the main module icon as a functional button */}
          <RibbonChildItem
            item={group}
            onClose={onClose}
            isGroup={true}
            colors={colors}
            onClick={handleGroupClick}
            isExpanded={isExpanded}
          />

          {/* Show children if any with premium horizontal slide/fade transition */}
          {children.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                maxWidth: isExpanded ? '800px' : '0px',
                opacity: isExpanded ? 1 : 0,
                transition: 'max-width 0.4s ease-out, opacity 0.4s ease-out',
                whiteSpace: 'nowrap'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                {displayedChildrenWithKeyTips.map((child, index) => (
                  <Box
                    key={child.id}
                    sx={{
                      opacity: 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <RibbonChildItem item={child} onClose={onClose} isGroup={false} colors={colors} isKeyTipActive={isKeyTipActive} keyTip={child._keyTip} parentTitle={group.title} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Bottom part: Clean, centered Outlook-style category title */}
        <Box
          onClick={handleGroupClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 0.5,
            gap: 0.5,
            width: '100%',
            px: 0.5,
            cursor: children.length > 0 ? 'pointer' : 'default',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': children.length > 0 ? {
              opacity: 0.8
            } : {}
          }}
        >
          <Typography
            variant="caption"
            sx={{
              textAlign: 'center',
              color: isDark ? colors.light : colors.main,
              fontSize: 'clamp(0.52rem, 0.65vw, 0.62rem)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              whiteSpace: 'normal',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.1
            }}
          >
            {group.title}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ==============================|| ELEVATION SCROLL ||============================== //

function ElevationScroll({ children, window }) {
  const theme = useTheme();
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 0, target: window });
  theme.shadows[4] = theme.vars.customShadows.z1;
  return cloneElement(children, { elevation: trigger ? 4 : 0 });
}

// ==============================|| HORIZONTAL BAR ||============================== //

export default function HorizontalBar() {
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const computedMode = mode === 'system' ? systemMode : mode;
  const isSysDark = computedMode === 'dark' || theme.palette.mode === 'dark';
  const getGroupColors = useGroupColors();
  const {
    state: { container, ribbonLayout }
  } = useConfig();
  const { pathname } = useLocation();
  const { ribbonOpen, setRibbonOpen } = useRibbon();
  const { user } = useAuth();
  const userId = user?.id || user?.userId;

  const permStatus = useSelector((state) => state.permissions.status);
  const permMap = useSelector((state) => state.permissions.map);

  const groups = useMemo(() => {
    if (permStatus !== 'loaded') return [];
    return filterMenuByPermissions([...menuItem.items], permMap, user?.userLevel || 0, user);
  }, [permStatus, permMap, user?.userLevel, user]);

  const [expandedGroupId, setExpandedGroupId] = useState(null);

  // Build keytip map once from groups
  const groupsWithKeyTips = useMemo(() => assignKeyTips(groups), [groups]);

  const activeGroupId = useMemo(() => {
    if (expandedGroupId) return expandedGroupId;
    for (const g of groupsWithKeyTips) {
      if (g.children?.some((c) => (c.url && pathname.startsWith(c.url)) || c.children?.some(sc => sc.url && pathname.startsWith(sc.url)))) {
        return g.id;
      }
    }
    return groupsWithKeyTips[0]?.id || '';
  }, [groupsWithKeyTips, expandedGroupId, pathname]);

  // Page Navigation logic based on flattened and authenticated groups
  const leafItemsForNav = useMemo(() => {
    let flatList = [];
    const flatten = (items) => {
      items.forEach(item => {
        if (item.type === 'item' && item.url) {
          let hasRead = true;
          if (item.pageCode && user?.userLevel === 0 && permStatus === 'loaded') {
            const perm = permMap[item.pageCode];
            hasRead = perm && (perm.readAcs === 1 || perm.read === 1 || perm.read === true);
          }
          if (hasRead) {
            flatList.push(item);
          }
        }
        if (item.children) flatten(item.children);
      });
    };
    flatten(groups);
    return flatList;
  }, [groups, permMap, permStatus, user?.userLevel]);

  const currentNavIndex = useMemo(() => {
    let idx = leafItemsForNav.findIndex(item => item.url === pathname);
    if (idx === -1) {
      idx = leafItemsForNav.findIndex(item => pathname.startsWith(item.url + '/'));
    }
    return idx;
  }, [leafItemsForNav, pathname]);

  const prevPageItem = currentNavIndex > 0 ? leafItemsForNav[currentNavIndex - 1] : null;
  const nextPageItem = currentNavIndex > -1 && currentNavIndex < leafItemsForNav.length - 1 ? leafItemsForNav[currentNavIndex + 1] : null;

  // Speed Dial Customization State
  const [speedDialPreferences, setSpeedDialPreferences] = useState({});
  const [modulePrefs, setModulePrefs] = useState({});
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configModuleGroup, setConfigModuleGroup] = useState(null);

  useEffect(() => {
    if (userId) {
      const fetchPrefs = async () => {
        try {
          const response = await axios.get('/api/user-speed-dials');
          if (response.data && Array.isArray(response.data)) {
            const prefs = {};
            const modPrefs = {};
            response.data.forEach(item => {
              try {
                prefs[item.moduleGroupId] = JSON.parse(item.speedDialIds).filter(id => id !== ''); // Remove blank placeholder item
              } catch (e) {
                // Ignore parsing errors for individual items
              }
              if (item.moduleColor || item.moduleIcon) {
                modPrefs[item.moduleGroupId] = { color: item.moduleColor, icon: item.moduleIcon };
              }
            });
            setSpeedDialPreferences(prefs);

            // Merge with localPrefs, prioritizing API
            const localPrefs = JSON.parse(localStorage.getItem(`module-prefs-${userId}`)) || {};
            setModulePrefs({ ...localPrefs, ...modPrefs });
          }
        } catch (error) {
          console.error('Failed to fetch speed dial preferences', error);
          // Fallback to localStorage if API fails
          const savedPrefs = localStorage.getItem(`speedDialPreferences_${userId}`);
          if (savedPrefs) {
            try {
              setSpeedDialPreferences(JSON.parse(savedPrefs));
            } catch (e) {
              setSpeedDialPreferences({});
            }
          }
          const localPrefs = JSON.parse(localStorage.getItem(`module-prefs-${userId}`)) || {};
          setModulePrefs(localPrefs);
        }
      };
      fetchPrefs();

    }
  }, [userId]);

  const handleEditClick = (group) => {
    setConfigModuleGroup(group);
    setConfigModalOpen(true);
  };

  const handleSaveSpeedDial = async (groupId, selectedIds, customColor, customIcon) => {
    if (!userId) return;
    const newPrefs = { ...speedDialPreferences, [groupId]: selectedIds };
    setSpeedDialPreferences(newPrefs);
    localStorage.setItem(`speedDialPreferences_${userId}`, JSON.stringify(newPrefs));

    if (customColor !== undefined || customIcon !== undefined) {
      const newModulePrefs = { ...modulePrefs, [groupId]: { ...modulePrefs[groupId], color: customColor, icon: customIcon } };
      setModulePrefs(newModulePrefs);
      localStorage.setItem(`module-prefs-${userId}`, JSON.stringify(newModulePrefs));
    }

    try {
      await axios.post('/api/user-speed-dials/save', {
        moduleGroupId: groupId,
        speedDialIds: JSON.stringify(selectedIds),
        moduleColor: customColor,
        moduleIcon: customIcon
      });
    } catch (error) {
      console.error('Failed to save speed dial preferences to server', error);
    }
  };

  // Close ribbon on route change (removed as per user request to keep it expanded)
  // useEffect(() => { setRibbonOpen(false); }, [pathname]);

  const COMPACT_H = 62;
  const RIBBON_H = 110;

  const compactScrollRef = useRef(null);
  const ribbonScrollRef = useRef(null);

  // Overflow detection for scroll arrows
  const [ribbonOverflow, setRibbonOverflow] = useState({ canLeft: false, canRight: false });
  const [compactOverflow, setCompactOverflow] = useState({ canLeft: false, canRight: false });

  // ── KeyTips (Alt mode) ──────────────────────────────────────────────
  const [altMode, setAltMode] = useState(false);
  const [altActiveGroupId, setAltActiveGroupId] = useState(null); // group.id of the active keytip level
  const navigate = useNavigate();

  // Helper: get all direct-child items (collapse + item) with keytips for a group
  const getChildrenWithKeyTips = useCallback((groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    return assignKeyTips(group.children || []);
  }, [groups]);

  // Helper: flatten all leaf items and their sub-items with keytips
  const getLeafItemsWithKeyTips = useCallback((children) => {
    const allLeaf = [];
    const walk = (items) => {
      items.forEach(item => {
        if (item.type === 'item') allLeaf.push(item);
        else if (item.children) walk(item.children);
      });
    };
    walk(children);
    return assignKeyTips(allLeaf);
  }, []);

  const [altChildItems, setAltChildItems] = useState([]); // items shown in the keytip submenu panel
  const [altPanelAnchor, setAltPanelAnchor] = useState(null); // DOM element of the active module badge
  const groupRefs = useRef({});

  const dismissAlt = useCallback(() => {
    setAltMode(false);
    setAltActiveGroupId(null);
    setAltChildItems([]);
    setAltPanelAnchor(null);
  }, []);

  const level1Keys = useMemo(() => {
    return new Set(groupsWithKeyTips.map((g) => g._keyTip).filter(Boolean));
  }, [groupsWithKeyTips]);

  const openGroupKeyTipMenu = useCallback((groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const children = group.children || [];
    // Show top-level children of this group with keytips excluding Level 1 reserved keys
    const topChildren = assignKeyTips(children, level1Keys);
    setAltActiveGroupId(groupId);
    setAltChildItems(topChildren);
    setAltPanelAnchor(groupRefs.current[groupId] || null);
  }, [groups, level1Keys]);

  const currentSpeedDialItems = useMemo(() => {
    const activeGrp = groupsWithKeyTips.find((g) => g.id === (expandedGroupId || activeGroupId)) || groupsWithKeyTips[0];
    if (!activeGrp || !activeGrp.children) return [];

    const leafItems = [];
    const walk = (nodes) => {
      if (!nodes) return;
      nodes.forEach((n) => {
        if (n.type === 'item' && n.url) leafItems.push(n);
        if (n.children) walk(n.children);
      });
    };
    walk(activeGrp.children);

    const prefIds = speedDialPreferences[activeGrp.id];
    let items = [];
    if (prefIds && prefIds.length > 0) {
      items = leafItems
        .filter((item) => prefIds.includes(item.id))
        .sort((a, b) => prefIds.indexOf(a.id) - prefIds.indexOf(b.id))
        .slice(0, 6);
    }
    if (items.length === 0) {
      items = leafItems.slice(0, 5);
    }
    return assignKeyTips(items, level1Keys);
  }, [groupsWithKeyTips, expandedGroupId, activeGroupId, speedDialPreferences, level1Keys]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Alt') {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Alt') {
        e.preventDefault();
        setAltMode(prev => {
          if (prev) {
            // toggle off
            setAltActiveGroupId(null);
            setAltChildItems([]);
            setAltPanelAnchor(null);
          }
          return !prev;
        });
        return;
      }
      if (e.key === 'Escape') {
        dismissAlt();
        return;
      }
    };

    const handleKeyDown2 = (e) => {
      if (!altMode) return;
      if (e.key === 'Alt' || e.key === 'Escape') return;
      // Skip if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      const pressed = e.key.toUpperCase();

      // 1. Level 1: match a module keytip
      const moduleMatch = groupsWithKeyTips.find((g) => g._keyTip === pressed);
      if (moduleMatch) {
        e.preventDefault();
        setExpandedGroupId(moduleMatch.id);
        openGroupKeyTipMenu(moduleMatch.id);
        return;
      }

      // 2. Level 2: match a speed dial or child keytip
      const candidateItems = altChildItems.length > 0 ? altChildItems : currentSpeedDialItems;
      const itemMatch = candidateItems.find((c) => c._keyTip === pressed);

      if (itemMatch) {
        e.preventDefault();
        if (itemMatch.url) {
          navigate(itemMatch.url);
          dismissAlt();
        } else if (itemMatch.children) {
          const subChildren = assignKeyTips(itemMatch.children, level1Keys);
          setAltChildItems(subChildren);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown2);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleKeyDown2);
    };
  }, [altMode, altActiveGroupId, altChildItems, currentSpeedDialItems, level1Keys, groupsWithKeyTips, dismissAlt, navigate, openGroupKeyTipMenu, setExpandedGroupId]);

  const checkOverflow = useCallback((ref, setter) => {
    if (!ref.current) return;
    const el = ref.current;
    setter({
      canLeft: el.scrollLeft > 1,
      canRight: el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    });
  }, []);

  const checkAllOverflow = useCallback(() => {
    checkOverflow(ribbonScrollRef, setRibbonOverflow);
    checkOverflow(compactScrollRef, setCompactOverflow);
  }, [checkOverflow]);

  useEffect(() => {
    const ribbonEl = ribbonScrollRef.current;
    const compactEl = compactScrollRef.current;

    const onRibbonScroll = () => checkOverflow(ribbonScrollRef, setRibbonOverflow);
    const onCompactScroll = () => checkOverflow(compactScrollRef, setCompactOverflow);

    if (ribbonEl) {
      ribbonEl.addEventListener('scroll', onRibbonScroll, { passive: true });
      onRibbonScroll();
    }
    if (compactEl) {
      compactEl.addEventListener('scroll', onCompactScroll, { passive: true });
      onCompactScroll();
    }

    window.addEventListener('resize', checkAllOverflow);

    // Use ResizeObserver to detect content size changes (module expand/collapse)
    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkAllOverflow();
      });
      if (ribbonEl) {
        resizeObserver.observe(ribbonEl);
        // Also observe the inner content container if it exists
        const ribbonInner = ribbonEl.firstElementChild;
        if (ribbonInner) resizeObserver.observe(ribbonInner);
      }
      if (compactEl) {
        resizeObserver.observe(compactEl);
        const compactInner = compactEl.firstElementChild;
        if (compactInner) resizeObserver.observe(compactInner);
      }
    }

    return () => {
      if (ribbonEl) ribbonEl.removeEventListener('scroll', onRibbonScroll);
      if (compactEl) compactEl.removeEventListener('scroll', onCompactScroll);
      window.removeEventListener('resize', checkAllOverflow);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [ribbonOpen, checkOverflow, checkAllOverflow]);

  // Re-check overflow after ribbon open/close transition ends
  useEffect(() => {
    const timer = setTimeout(checkAllOverflow, 500);
    return () => clearTimeout(timer);
  }, [ribbonOpen, checkAllOverflow]);

  const handleScroll = (ref, amount) => {
    if (ref.current) {
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const activeRibbonLayout = ribbonLayout || RibbonLayout.CLASSIC;
  const isQuantumLayout = activeRibbonLayout === RibbonLayout.QUANTUM || activeRibbonLayout === 'quantum';
  const isSpeedDialLayout = activeRibbonLayout === RibbonLayout.SPEED_DIAL || activeRibbonLayout === 'speed_dial' || activeRibbonLayout === 'Premium';
  const isOutlookLayout = activeRibbonLayout === RibbonLayout.OUTLOOK || activeRibbonLayout === 'outlook';
  const isClassicLayout = activeRibbonLayout === RibbonLayout.CLASSIC || activeRibbonLayout === 'classic' || activeRibbonLayout === 'default' || (!isQuantumLayout && !isSpeedDialLayout && !isOutlookLayout);

  return (
    <>
      <ElevationScroll>
        <AppBar
          sx={(theme) => ({
            top: 64,
            background: (isSpeedDialLayout || isQuantumLayout)
              ? 'transparent'
              : (isSysDark
                ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(30, 41, 59, 0.92) 100%)'
                : 'linear-gradient(180deg, #f8faff 0%, #eef5ff 100%)'),
            WebkitBackdropFilter: (isSpeedDialLayout || isQuantumLayout) ? 'none' : 'blur(16px)',
            backdropFilter: (isSpeedDialLayout || isQuantumLayout) ? 'none' : 'blur(16px)',
            width: '100%',
            height: isClassicLayout
              ? (ribbonOpen ? RIBBON_H : COMPACT_H)
              : (isQuantumLayout
                ? (ribbonOpen ? 118 : 64)
                : (isSpeedDialLayout ? (ribbonOpen ? 112 : 64) : 78)),
            transition: theme.transitions.create(['height', 'background-color'], {
              easing: theme.transitions.easing.easeInOut,
              duration: theme.transitions.duration.shorter
            }),
            borderTop: (isSpeedDialLayout || isQuantumLayout) ? 'none' : (isSysDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(229, 231, 235, 0.5)'),
            borderBottom: (isSpeedDialLayout || isQuantumLayout) ? 'none' : (isSysDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #dbeafe'),
            boxShadow: (isSpeedDialLayout || isQuantumLayout) ? 'none' : (isSysDark ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(37, 99, 235, 0.08)'),
            zIndex: 1098,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          })}
        >
          {isQuantumLayout && (
            <QuantumRibbon
              groups={groupsWithKeyTips}
              speedDialPreferences={speedDialPreferences}
              modulePrefs={modulePrefs}
              expandedGroupId={expandedGroupId}
              setExpandedGroupId={setExpandedGroupId}
              handleEditClick={handleEditClick}
              prevPageItem={prevPageItem}
              nextPageItem={nextPageItem}
              ribbonOpen={ribbonOpen}
              onCollapse={() => setRibbonOpen(!ribbonOpen)}
              altMode={altMode}
              altActiveGroupId={altActiveGroupId}
              altChildItems={altChildItems}
              dismissAlt={dismissAlt}
            />
          )}

          {isSpeedDialLayout && (
            <PremiumSpeedDialRibbon
              groups={groupsWithKeyTips}
              speedDialPreferences={speedDialPreferences}
              modulePrefs={modulePrefs}
              expandedGroupId={expandedGroupId}
              setExpandedGroupId={setExpandedGroupId}
              handleEditClick={handleEditClick}
              prevPageItem={prevPageItem}
              nextPageItem={nextPageItem}
              ribbonOpen={ribbonOpen}
              onCollapse={() => setRibbonOpen(!ribbonOpen)}
              altMode={altMode}
              altActiveGroupId={altActiveGroupId}
              altChildItems={altChildItems}
              dismissAlt={dismissAlt}
            />
          )}

          {isOutlookLayout && (
            <OutlookRibbon
              groups={groupsWithKeyTips}
              speedDialPreferences={speedDialPreferences}
              modulePrefs={modulePrefs}
              expandedGroupId={expandedGroupId}
              setExpandedGroupId={setExpandedGroupId}
              handleEditClick={handleEditClick}
              prevPageItem={prevPageItem}
              nextPageItem={nextPageItem}
              altMode={altMode}
              altActiveGroupId={altActiveGroupId}
              altChildItems={altChildItems}
              dismissAlt={dismissAlt}
            />
          )}

          {isClassicLayout && (
            <>
              {/* ── Compact icon row — hidden when ribbon is open ── */}
              {!ribbonOpen && (
            <Box sx={{ width: '100%', px: 2, display: 'flex', flex: 'none', position: 'relative' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {compactOverflow.canLeft && (
                  <IconButton
                    onClick={() => handleScroll(compactScrollRef, -300)}
                    size="small"
                    sx={{ mr: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <IconChevronLeft size="16px" />
                  </IconButton>
                )}

                <Box
                  ref={compactScrollRef}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: COMPACT_H,
                    overflowX: 'auto',
                    flex: 1,
                    '&::-webkit-scrollbar': { display: 'none' },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MenuList
                      speedDialPreferences={speedDialPreferences}
                      altMode={altMode}
                      groupsWithKeyTips={groupsWithKeyTips}
                    />
                  </Box>
                </Box>

                {compactOverflow.canRight && (
                  <IconButton
                    onClick={() => handleScroll(compactScrollRef, 300)}
                    size="small"
                    sx={{ mx: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <IconChevronRight size="16px" />
                  </IconButton>
                )}

                {/* Compact Mode Page Navigation */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1, mr: 1, borderLeft: '1px solid', borderColor: 'divider', pl: 1 }}>
                  {prevPageItem && (
                    <Tooltip title={`Previous: ${prevPageItem.title}`} placement="bottom">
                      <Button
                        size="small"
                        onClick={() => navigate(prevPageItem.url)}
                        sx={{ minWidth: 0, px: 1, height: 28, borderRadius: 1, border: '1px solid', borderColor: 'secondary.main', bgcolor: 'secondary.main', color: '#fff', textTransform: 'none', '&:hover': { bgcolor: 'secondary.dark', borderColor: 'secondary.dark' } }}
                      >
                        Prev
                      </Button>
                    </Tooltip>
                  )}
                  {nextPageItem && (
                    <Tooltip title={`Next: ${nextPageItem.title}`} placement="bottom">
                      <Button
                        size="small"
                        onClick={() => navigate(nextPageItem.url)}
                        sx={{ minWidth: 0, px: 1, height: 28, borderRadius: 1, border: '1px solid', borderColor: 'primary.main', bgcolor: 'primary.main', color: '#fff', textTransform: 'none', '&:hover': { bgcolor: 'primary.dark' } }}
                      >
                        Next
                      </Button>
                    </Tooltip>
                  )}
                </Box>

                {/* Toggle — expand */}
                <Tooltip title="Expand Menu" placement="bottom" arrow>
                  <IconButton
                    onClick={() => setRibbonOpen(true)}
                    size="small"
                    sx={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      color: 'text.secondary',
                      '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'primary.lighter' }
                    }}
                  >
                    <IconChevronDown size="16px" stroke={2} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}

          {/* ── Ribbon row — shown when expanded, replaces icon bar ── */}
          {ribbonOpen && (
            <Box sx={{ width: '100%', px: 2, display: 'flex', flex: 1, position: 'relative' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: RIBBON_H, width: '100%' }}>
                {ribbonOverflow.canLeft && (
                  <IconButton
                    onClick={() => handleScroll(ribbonScrollRef, -400)}
                    size="small"
                    sx={{
                      mr: 1,
                      width: 20,
                      height: 80,
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: 'rgba(255,255,255,0.2)',
                      bgcolor: 'rgba(255, 255, 255, 0.6)',
                      WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)',
                      color: 'primary.main',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: '#fff',
                        borderColor: 'primary.main',
                        transform: 'scaleY(1.05)',
                        boxShadow: '0 6px 16px rgba(30, 136, 229, 0.3)'
                      }
                    }}
                  >
                    <IconChevronLeft size="28px" stroke={3} style={{ marginLeft: '-2px' }} />
                  </IconButton>
                )}

                <Box
                  ref={ribbonScrollRef}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    flex: 1,
                    scrollBehavior: 'smooth',
                    '&::-webkit-scrollbar': { display: 'none' },
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none'
                  }}
                >
                  {/* All groups as puzzle pieces */}
                  <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0, height: '100%', width: '100%', pl: 1 }}>
                    {groupsWithKeyTips.map((group, index) => {
                      const pref = modulePrefs[group.id] || {};
                      const customGroup = { ...group };
                      if (pref.icon && MODULE_ICONS[pref.icon]) {
                        customGroup.icon = MODULE_ICONS[pref.icon];
                      }

                      let customColorOverride = null;
                      if (pref.color) {
                        const getLighter = (hex) => alpha(hex, isSysDark ? 0.18 : 0.08);
                        let lightColor = pref.color;
                        try {
                          lightColor = lighten(pref.color, 0.35); // 35% lighter for the gradient
                        } catch (e) {
                          // fallback if lighten fails (e.g. invalid color string)
                        }
                        customColorOverride = { main: pref.color, light: lightColor, lighter: getLighter(pref.color) };
                      }

                      return (
                        <Box key={group.id} ref={el => { groupRefs.current[group.id] = el; }} sx={{ display: 'contents' }}>
                          <RibbonGroupSection
                            group={customGroup}
                            onClose={() => setRibbonOpen(false)}
                            speedDialIds={speedDialPreferences[group.id]}
                            onEditClick={handleEditClick}
                            altMode={altMode}
                            keyTip={group._keyTip}
                            isKeyTipActive={altActiveGroupId === group.id}
                            isFirst={index === 0}
                            isLast={index === groupsWithKeyTips.length - 1}
                            zIndex={groupsWithKeyTips.length - index}
                            expandedGroupId={expandedGroupId}
                            setExpandedGroupId={setExpandedGroupId}
                            customColorOverride={customColorOverride}
                          />
                        </Box>
                      );
                    })}

                  </Box>
                </Box>

                {ribbonOverflow.canRight && (
                  <IconButton
                    onClick={() => handleScroll(ribbonScrollRef, 400)}
                    size="small"
                    sx={{
                      ml: 1,
                      width: 20,
                      height: 80,
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: 'rgba(255,255,255,0.2)',
                      bgcolor: 'rgba(255, 255, 255, 0.6)',
                      WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)',
                      color: 'primary.main',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: '#fff',
                        borderColor: 'primary.main',
                        transform: 'scaleY(1.05)',
                        boxShadow: '0 6px 16px rgba(30, 136, 229, 0.3)'
                      }
                    }}
                  >
                    <IconChevronRight size="28px" stroke={3} style={{ marginRight: '-2px' }} />
                  </IconButton>
                )}

                {/* Expanded Ribbon Page Navigation & Collapse (Stacked Vertically) */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1, mr: 0.5, borderLeft: '1px solid', borderColor: 'divider', pl: 1, height: '100%', justifyContent: 'center' }}>
                  {/* Prev Page */}
                  <Tooltip title={prevPageItem ? `Previous: ${prevPageItem.title}` : "No Previous Page"} placement="left">
                    <span>
                      <IconButton
                        disabled={!prevPageItem}
                        size="small"
                        onClick={() => prevPageItem && navigate(prevPageItem.url)}
                        sx={{
                          width: 28, height: 28, borderRadius: '6px',
                          border: '1px solid', borderColor: prevPageItem ? 'secondary.main' : 'divider',
                          bgcolor: prevPageItem ? 'secondary.main' : 'action.disabledBackground',
                          color: prevPageItem ? '#fff' : 'action.disabled',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: 'secondary.dark', borderColor: 'secondary.dark' }
                        }}
                      >
                        <IconChevronLeft size="16px" />
                      </IconButton>
                    </span>
                  </Tooltip>

                  {/* Next Page */}
                  <Tooltip title={nextPageItem ? `Next: ${nextPageItem.title}` : "No Next Page"} placement="left">
                    <span>
                      <IconButton
                        disabled={!nextPageItem}
                        size="small"
                        onClick={() => nextPageItem && navigate(nextPageItem.url)}
                        sx={{
                          width: 28, height: 28, borderRadius: '6px',
                          border: '1px solid', borderColor: nextPageItem ? 'primary.main' : 'divider',
                          bgcolor: nextPageItem ? 'primary.main' : 'action.disabledBackground',
                          color: nextPageItem ? '#fff' : 'action.disabled',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: 'primary.dark', borderColor: 'primary.dark' }
                        }}
                      >
                        <IconChevronRight size="16px" />
                      </IconButton>
                    </span>
                  </Tooltip>

                  {/* Collapse Menu */}
                  <Tooltip title="Collapse Menu" placement="left">
                    <IconButton
                      onClick={() => setRibbonOpen(false)}
                      size="small"
                      sx={{
                        width: 28, height: 28, borderRadius: '6px',
                        border: '1px solid', borderColor: 'divider',
                        bgcolor: 'background.paper', color: 'text.secondary',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: 'primary.lighter', color: 'primary.main', borderColor: 'primary.main' }
                      }}
                    >
                      <IconChevronUp size="16px" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          )}
          </>
          )}
          {/* KeyTip submenu panel */}
          {altActiveGroupId && altChildItems.length > 0 && (
            <Box
              sx={{
                position: 'fixed',
                top: 130,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 3000,
                bgcolor: '#1a1a2e',
                border: '1.5px solid #3a3a6e',
                borderRadius: '10px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                p: 1.5,
                minWidth: 320,
                maxWidth: '80vw',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.75
              }}
            >
              <Typography variant="caption" sx={{ width: '100%', color: '#aaa', mb: 0.5, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {groups.find(g => g.id === altActiveGroupId)?.title} — Press key to navigate | Esc to dismiss
              </Typography>
              {altChildItems.map(child => (
                <Box
                  key={child.id}
                  onClick={() => {
                    if (child.type === 'item' && child.url) {
                      navigate(child.url);
                      dismissAlt();
                    } else if (child.children) {
                      setAltChildItems(assignKeyTips(child.children));
                    }
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1,
                    py: 0.5,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.25)' }
                  }}
                >
                  <Box sx={{
                    minWidth: 22, height: 22,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: '#1565c0',
                    borderRadius: '4px',
                    fontSize: '11px', fontWeight: 900, color: '#fff',
                    flexShrink: 0
                  }}>
                    {child._keyTip || '?'}
                  </Box>
                  <Typography sx={{ color: '#e0e0e0', fontSize: '0.78rem', fontWeight: 500 }}>
                    {child.title}
                  </Typography>
                  {child.children && (
                    <Typography sx={{ color: '#888', fontSize: '0.65rem', ml: 'auto' }}>▶</Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </AppBar>
      </ElevationScroll>

      {/* Speed Dial Config Modal — outside ElevationScroll so cloneElement isn't broken */}
      <SpeedDialConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        moduleGroup={configModuleGroup}
        currentSpeedDialIds={configModuleGroup ? (speedDialPreferences[configModuleGroup.id] || []) : []}
        onSave={handleSaveSpeedDial}
        initialColor={configModuleGroup ? modulePrefs[configModuleGroup.id]?.color : ''}
        initialIcon={configModuleGroup ? modulePrefs[configModuleGroup.id]?.icon : ''}
      />
    </>
  );
}

ElevationScroll.propTypes = { children: PropTypes.node, window: PropTypes.any };
RibbonChildItem.propTypes = {
  item: PropTypes.object,
  onClose: PropTypes.func,
  isGroup: PropTypes.bool,
  colors: PropTypes.object,
  onClick: PropTypes.func,
  isExpanded: PropTypes.bool
};
RibbonGroupSection.propTypes = { group: PropTypes.object, onClose: PropTypes.func };
