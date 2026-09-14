import PropTypes from 'prop-types';
import React, { Fragment, useEffect, useState } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';

// third party
import { FormattedMessage } from 'react-intl';

// project imports
import NavCollapse from '../NavCollapse';
import NavItem from '../NavItem';

import { MenuOrientation } from 'config';
import useConfig from 'hooks/useConfig';
import Transitions from 'ui-component/extended/Transitions';
import { useGetMenuMaster } from 'api/menu';
import { useGroupColors } from 'hooks/useGroupColors';
import { alpha } from '@mui/material/styles';

// assets
import { IconChevronDown, IconChevronRight, IconMinusVertical } from '@tabler/icons-react';

// ==============================|| SIDEBAR MENU LIST GROUP ||============================== //

export default function NavGroup({ item, lastItem, remItems, lastItemId, selectedID, setSelectedID, speedDialPreferences, altMode, groupsWithKeyTips }) {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const {
    state: { menuOrientation, borderRadius }
  } = useConfig();
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downMD;

  const getGroupColors = useGroupColors();
  const colors = getGroupColors(item?.title);

  const [anchorEl, setAnchorEl] = useState(null);
  const [currentItem, setCurrentItem] = useState(item);
  const openMini = Boolean(anchorEl);

  const keyTipObj = groupsWithKeyTips?.find(g => g.id === currentItem.id);
  const keyTipChar = keyTipObj ? keyTipObj._keyTip : null;

  const isSelected = selectedID === currentItem.id;

  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (selectedID === currentItem.id) {
      setIsExpanded(true);
    }
  }, [selectedID, currentItem.id]);

  useEffect(() => {
    if (lastItem) {
      if (item.id === lastItemId) {
        const localItem = { ...item };
        const elements = remItems.map((ele) => ele.elements);
        localItem.children = elements.flat(1);
        setCurrentItem(localItem);
      } else {
        setCurrentItem(item);
      }
    }
  }, [item, lastItem, menuOrientation, remItems, lastItemId]);

  const checkOpenForParent = (child, id) => {
    child.forEach((ele) => {
      if (ele.children?.length) {
        checkOpenForParent(ele.children, currentItem.id);
      }
      if (ele?.url && !!matchPath({ path: ele?.link ? ele.link : ele.url, end: true }, pathname)) {
        setSelectedID(id);
      }
    });
  };

  const checkSelectedOnload = (data) => {
    const childrens = data.children ? data.children : [];
    childrens.forEach((itemCheck) => {
      if (itemCheck?.children?.length) {
        checkOpenForParent(itemCheck.children, currentItem.id);
      }
      if (itemCheck?.url && !!matchPath({ path: itemCheck?.link ? itemCheck.link : itemCheck.url, end: true }, pathname)) {
        setSelectedID(currentItem.id);
      }
    });

    if (data?.url && !!matchPath({ path: data?.link ? data.link : data.url, end: true }, pathname)) {
      setSelectedID(currentItem.id);
    }
  };

  // keep selected-menu on page load and use for horizontal menu close on change routes
  useEffect(() => {
    checkSelectedOnload(currentItem);
    if (openMini) setAnchorEl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentItem]);

  const handleClick = (event) => {
    if (!openMini) {
      setAnchorEl(event?.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const renderIcon = (iconProp, props = {}) => {
    if (!iconProp) return null;
    if (React.isValidElement(iconProp)) return iconProp;
    if (typeof iconProp === 'function' || (typeof iconProp === 'object' && iconProp?.$$typeof)) {
      const Component = iconProp;
      return <Component {...props} />;
    }
    return null;
  };

  const itemIcon = renderIcon(currentItem?.icon, { stroke: 1.5, size: '20px' });

  // menu list collapse & items
  const items = currentItem.children?.map((menu) => {
    switch (menu?.type) {
      case 'collapse':
        return <NavCollapse key={menu.id} menu={menu} level={1} parentId={currentItem.id} />;
      case 'item':
        return <NavItem key={menu.id} item={menu} level={1} />;
      default:
        return (
          <Typography key={menu?.id} variant="h6" align="center" sx={{ color: 'error.main' }}>
            Menu Items Error
          </Typography>
        );
    }
  });

  const moreItems = remItems.map((itemRem, i) => (
    <Fragment key={i}>
      {itemRem.url ? (
        <NavItem item={itemRem} level={1} />
      ) : (
        itemRem.title ? (
          <Typography variant="caption" sx={{ pl: 2 }}>
            {itemRem.title} {itemRem.url}
          </Typography>
        ) : null
      )}
      {itemRem?.elements?.map((menu) => {
        switch (menu?.type) {
          case 'collapse':
            return <NavCollapse key={menu.id} menu={menu} level={1} parentId={currentItem.id} />;
          case 'item':
            return <NavItem key={menu.id} item={menu} level={1} />;
          default:
            return (
              <Typography key={menu.id} variant="h6" align="center" sx={{ color: 'error.main' }}>
                Menu Items Error
              </Typography>
            );
        }
      })}
    </Fragment>
  ));

  const popperId = openMini ? `group-pop-${item.id}` : undefined;

  return (
    <>
      {!isHorizontal ? (
        <>
          <List
            disablePadding={!drawerOpen}
            subheader={
              currentItem.title &&
              drawerOpen && (
                <Box
                  onClick={() => setIsExpanded(!isExpanded)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: 0.75,
                    marginTop: 1.25,
                    borderRadius: `${borderRadius}px`,
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'text.heading',
                        textTransform: 'capitalize'
                      }}
                    >
                      <FormattedMessage id={currentItem.title} />
                    </Typography>
                    {currentItem.caption && (
                      <Typography
                        gutterBottom
                        component="span"
                        sx={{
                          display: 'block',
                          fontSize: '0.6875rem',
                          fontWeight: 500,
                          color: 'text.secondary',
                          textTransform: 'capitalize',
                          lineHeight: 1.66
                        }}
                      >
                        <FormattedMessage id={currentItem.caption} />
                      </Typography>
                    )}
                  </Box>
                  {isExpanded ? (
                    <IconChevronDown size="16px" style={{ color: 'text.secondary' }} />
                  ) : (
                    <IconChevronRight size="16px" style={{ color: 'text.secondary' }} />
                  )}
                </Box>
              )
            }
          >
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              {items}
            </Collapse>
          </List>

          {/* group divider */}
          {drawerOpen && (
            <Divider sx={{ mt: 0.25, mb: 1.25 }} />
          )}
        </>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', mr: currentItem.id !== lastItemId ? 1 : 0 }}>
          {/* Main Circular Card */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              p: 0.5,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={handleClick}
            onMouseLeave={handleClose}
            onClick={(e) => {
              handleClick(e);
              setSelectedID(isSelected ? '' : currentItem.id);
            }}
            aria-describedby={popperId}
            className={anchorEl ? 'Mui-selected' : ''}
          >
            {/* Module Main Icon */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 42, position: 'relative' }}>
              <Avatar
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: '10px',
                  bgcolor: colors.main,
                  color: '#fff',
                  boxShadow: `0 4px 10px ${alpha(colors.main, 0.4)}`,
                  transition: 'all 0.3s ease',
                  ...(isSelected || openMini ? {
                    transform: 'scale(1.1)',
                    boxShadow: `0 6px 14px ${alpha(colors.main, 0.6)}`
                  } : {}),
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: `0 6px 14px ${alpha(colors.main, 0.6)}`
                  }
                }}
              >
                {itemIcon}
              </Avatar>

              {/* Alt Key Tip Badge */}
              {altMode && keyTipChar && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    backgroundColor: 'warning.main',
                    color: 'warning.contrastText',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    px: 0.5,
                    borderRadius: '4px',
                    zIndex: 10,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    border: '1px solid #fff'
                  }}
                >
                  {keyTipChar}
                </Box>
              )}
            </Box>

            {/* Expanded sub-items inline */}
            {currentItem.children && isSelected && (() => {
              const getLeafItems = (nodes) => {
                let leaves = [];
                const walk = (n) => {
                  if (!n) return;
                  n.forEach((node) => {
                    if (node.type === 'item' && node.url && node.icon) {
                      leaves.push(node);
                    } else if (node.children) {
                      walk(node.children);
                    }
                  });
                };
                walk(nodes);
                return leaves;
              };

              const leafItems = getLeafItems(currentItem.children);
              let speedDialItems = [];
              if (speedDialPreferences && speedDialPreferences[currentItem.id]) {
                const currentSpeedDialIds = speedDialPreferences[currentItem.id];
                speedDialItems = leafItems
                  .filter(item => currentSpeedDialIds.includes(item.id))
                  .sort((a, b) => currentSpeedDialIds.indexOf(a.id) - currentSpeedDialIds.indexOf(b.id));
              } else {
                speedDialItems = leafItems.slice(0, 5);
              }

              if (speedDialItems.length === 0) return null;

              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 1 }}>
                  {speedDialItems.map((child, index) => {
                    const ChildIcon = child.icon;
                    return (
                      <Tooltip key={child.id} title={<FormattedMessage id={child.title} defaultMessage={child.title} />} placement="bottom" disableHoverListener={true}>
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(child.url);
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            opacity: 0,
                            animation: 'slideInRight 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards',
                            animationDelay: `${index * 0.05}s`,
                            '&:hover .child-icon': {
                              transform: 'scale(1.2)',
                              color: colors.main,
                            },
                            '@keyframes slideInRight': {
                              '0%': { opacity: 0, transform: 'translateX(-10px)' },
                              '100%': { opacity: 1, transform: 'translateX(0)' }
                            }
                          }}
                        >
                          <ChildIcon className="child-icon" stroke={1.5} size="20px" style={{ color: colors.main, transition: 'all 0.2s ease' }} />
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
              );
            })()}

            {/* Popper for full menu */}
            {anchorEl && (
              <Popper
                id={popperId}
                open={openMini}
                anchorEl={anchorEl}
                placement="bottom-start"
                sx={{
                  overflow: 'visible',
                  zIndex: 2001,
                  minWidth: 220,
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 5,
                    left: 20,
                    width: 12,
                    height: 12,
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 120,
                    borderWidth: '6px',
                    borderStyle: 'solid',
                    borderTopColor: 'background.paper',
                    borderLeftColor: 'background.paper',
                    borderRightColor: 'transparent',
                    borderBottomColor: 'transparent'
                  }
                }}
              >
                {({ TransitionProps }) => (
                  <Transitions in={openMini} {...TransitionProps}>
                    <Paper
                      sx={{
                        mt: 1.5,
                        py: 1,
                        boxShadow: theme.shadows[8],
                        backgroundImage: 'none',
                        minWidth: 220
                      }}
                    >
                      <ClickAwayListener onClickAway={handleClose}>
                        <Box
                          sx={{
                            maxHeight: 'calc(100vh - 140px)',
                            overflowY: 'auto',
                            msOverflowStyle: 'none',
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': {
                              display: 'none'
                            }
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              px: 2,
                              pt: 0.5,
                              pb: 1,
                              fontWeight: 600,
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              fontSize: '0.65rem',
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              mb: 0.5
                            }}
                          >
                            <FormattedMessage id={currentItem.title} defaultMessage={currentItem.title} />
                          </Typography>
                          {currentItem.id !== lastItemId ? items : moreItems}
                        </Box>
                      </ClickAwayListener>
                    </Paper>
                  </Transitions>
                )}
              </Popper>
            )}
          </Box>
        </Box>
      )}
    </>
  );
}

NavGroup.propTypes = {
  item: PropTypes.any,
  lastItem: PropTypes.number,
  remItems: PropTypes.array,
  lastItemId: PropTypes.string,
  selectedID: PropTypes.oneOfType([PropTypes.any, PropTypes.string]),
  setSelectedID: PropTypes.oneOfType([PropTypes.any, PropTypes.func]),
  speedDialPreferences: PropTypes.object
};
