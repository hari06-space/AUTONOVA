import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// material-ui
import { styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import NavItem from '../NavItem';
import Transitions from 'ui-component/extended/Transitions';
import { withAlpha } from 'utils/colorUtils';
import { useSelector } from 'store';

import { useGetMenuMaster } from 'api/menu';
import { MenuOrientation, ThemeDirection } from 'config';
import useConfig from 'hooks/useConfig';
import useMenuCollapse from 'hooks/useMenuCollapse';

// third party
import { FormattedMessage } from 'react-intl';

// assets
import { IconChevronDown, IconChevronRight, IconChevronUp } from '@tabler/icons-react';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

// horizontal-menu - wrapper
const PopperStyled = styled(Popper)(({ theme }) => ({
  overflow: 'visible',
  zIndex: 1202,
  minWidth: 180,
  '&:before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    top: 34,
    left: -5,
    width: 12,
    height: 12,
    transform: 'translateY(-50%) rotate(45deg)',
    zIndex: 120,
    borderWidth: '6px',
    borderStyle: 'solid',
    borderColor: `transparent transparent ${theme.vars.palette.background.paper}  ${theme.vars.palette.background.paper}`
  },
  '&[data-popper-placement="left-start"]:before': {
    left: 'auto',
    right: -5,
    borderColor: `${theme.vars.palette.background.paper}  ${theme.vars.palette.background.paper} transparent transparent`
  },
  '&[data-popper-placement="left-end"]:before': {
    top: 'auto',
    bottom: 15,
    left: 'auto',
    right: -5,
    borderColor: `${theme.vars.palette.background.paper}  ${theme.vars.palette.background.paper} transparent transparent`
  },
  '&[data-popper-placement="right-end"]:before': {
    top: 'auto',
    bottom: 15
  }
}));

export default function NavCollapse({ menu, level, parentId }) {
  const theme = useTheme();
  const permMap = useSelector((state) => state.permissions?.map) || {};
  const showPageCode = !!menu.pageCode;
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const ref = useRef(null);

  const {
    state: { menuOrientation, borderRadius, themeDirection }
  } = useConfig();

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downMD;

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClickMini = (event) => {
    setAnchorEl(null);
    if (drawerOpen) {
      setOpen(!open);
      setSelected(!selected ? menu.id : null);
    } else {
      setAnchorEl(event?.currentTarget);
    }
  };

  const timeoutRef = useRef(null);

  const handleHover = (event) => {
    setAnchorEl(event?.currentTarget);
  };

  const handleMouseEnterHorizontal = (event) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setAnchorEl(event?.currentTarget);
  };

  const handleMouseLeaveHorizontal = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
      if (!menu.url) {
        setSelected(null);
      }
      setAnchorEl(null);
    }, 200); // 200ms delay to seamlessly cross any gap
  };

  const handlePopperMouseEnterHorizontal = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const openMini = Boolean(anchorEl);

  const handleMiniClose = () => {
    setAnchorEl(null);
  };

  const handleClosePopper = () => {
    setOpen(false);
    if (!openMini) {
      if (!menu.url) {
        setSelected(null);
      }
    }
    setAnchorEl(null);
  };

  const { pathname } = useLocation();

  // menu collapse for sub-levels
  useMenuCollapse(menu, pathname, openMini, setSelected, setOpen, setAnchorEl);

  const [hoverStatus, setHover] = useState(false);

  const compareSize = () => {
    const compare = ref.current && ref.current.scrollWidth > ref.current.clientWidth;
    setHover(compare);
  };

  useEffect(() => {
    compareSize();
    window.addEventListener('resize', compareSize);
    return () => {
      window.removeEventListener('resize', compareSize);
    };
  }, []);

  useEffect(() => {
    if (menu.url === pathname) {
      setSelected(menu.id);
      setAnchorEl(null);
      setOpen(true);
    }
  }, [pathname, menu]);

  // menu collapse & item
  const menus = menu.children?.map((item) => {
    switch (item.type) {
      case 'collapse':
        return <NavCollapse key={item.id} menu={item} level={level + 1} parentId={parentId} />;
      case 'item':
        return <NavItem key={item.id} item={item} level={level + 1} />;
      default:
        return (
          <Typography key={item.id} variant="h6" align="center" sx={{ color: 'error.main' }}>
            Menu Items Error
          </Typography>
        );
    }
  });

  const isSelected = selected === menu.id;

  const renderIcon = (iconProp, props = {}) => {
    if (!iconProp) return null;
    if (React.isValidElement(iconProp)) return iconProp;
    if (typeof iconProp === 'function' || (typeof iconProp === 'object' && iconProp?.$$typeof)) {
      const Component = iconProp;
      return <Component {...props} />;
    }
    return null;
  };

  const menuIcon = menu.icon ? (
    renderIcon(menu.icon, { strokeWidth: 1.5, size: drawerOpen ? '20px' : '24px' })
  ) : (
    <FiberManualRecordIcon
      sx={{
        width: isSelected ? 8 : 6,
        height: isSelected ? 8 : 6
      }}
      fontSize={level > 0 ? 'inherit' : 'medium'}
    />
  );

  const collapseIcon = drawerOpen ? (
    <IconChevronUp stroke={1.5} size="16px" style={{ marginTop: 'auto', marginBottom: 'auto' }} />
  ) : (
    <IconChevronRight stroke={1.5} size="16px" style={{ marginTop: 'auto', marginBottom: 'auto' }} />
  );

  const popperId = openMini ? `collapse-pop-${menu.id}` : undefined;

  const verticalButton = (
    <ListItemButton
      sx={{
        zIndex: 1201,
        borderRadius: `${borderRadius}px`,
        mb: 0.5,
        ...(drawerOpen && level !== 1 && { ml: `${(level - 1) * 12}px` }),
        ...(!drawerOpen && { pl: 1.25 }),
        ...((!drawerOpen || level !== 1) && {
          py: level === 1 ? 0 : 1,
          '&:hover': { bgcolor: 'transparent' },
          '&.Mui-selected': { '&:hover': { bgcolor: 'transparent' }, bgcolor: 'transparent' }
        }),
        ...(downMD && {
          py: 1.2,
          my: 0.4,
          mx: 1.5,
          width: 'auto',
          borderRadius: `${borderRadius}px`,
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          '&.Mui-selected': {
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(103, 58, 183, 0.1)' : 'rgba(103, 58, 183, 0.04)',
            color: 'secondary.main',
            paddingLeft: '16px',
            '&:hover': {
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(103, 58, 183, 0.15)' : 'rgba(103, 58, 183, 0.08)'
            }
          }
        })
      }}
      selected={isSelected}
      {...(!drawerOpen && { onMouseEnter: handleClickMini, onMouseLeave: handleMiniClose })}
      className={anchorEl ? 'Mui-selected' : ''}
      onClick={handleClickMini}
    >
      {menuIcon && (
        <ListItemIcon
          sx={{
            minWidth: level === 1 ? 36 : 18,
            color: isSelected ? 'secondary.main' : 'text.primary',
            ...(!drawerOpen &&
              level === 1 && {
                borderRadius: `${borderRadius}px`,
                width: 46,
                height: 46,
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': { bgcolor: 'secondary.light' },

                ...((isSelected || anchorEl) && {
                  bgcolor: 'secondary.light',
                  '&:hover': { bgcolor: 'secondary.light' }
                })
              }),

            // dark overrides
            ...theme.applyStyles('dark', {
              color: isSelected && drawerOpen ? 'text.primary' : 'text.primary',

              ...(!drawerOpen &&
                level === 1 && {
                  '&:hover': { bgcolor: withAlpha(theme.vars.palette.secondary.main, 0.25) },
                  ...((isSelected || anchorEl) && {
                    bgcolor: withAlpha(theme.vars.palette.secondary.main, 0.25),
                    '&:hover': { bgcolor: withAlpha(theme.vars.palette.secondary.main, 0.3) }
                  })
                })
            })
          }}
        >
          {menuIcon}
        </ListItemIcon>
      )}
      {(drawerOpen || (!drawerOpen && level !== 1)) && (
        <ListItemText
          primary={
            <Typography
              ref={ref}
              noWrap
              variant={isSelected || anchorEl ? 'h5' : 'body1'}
              sx={{
                color: 'inherit',
                fontWeight: isSelected ? 'bold' : 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: drawerOpen ? `calc(260px - ${(level - 1) * 12 + 100}px)` : 'auto',
                ...(themeDirection === ThemeDirection.RTL && { textAlign: 'end', direction: 'rtl' }),
                '.MuiListItemButton-root:hover &': {
                  overflow: 'visible',
                  textOverflow: 'clip',
                  whiteSpace: 'normal',
                  width: 'auto',
                  wordBreak: 'break-word'
                }
              }}
            >
              <FormattedMessage id={menu.title} />
            </Typography>
          }
          secondary={
            menu.caption && (
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
                <FormattedMessage id={menu.caption} />
              </Typography>
            )
          }
        />
      )}

      {menu.children && menu.children.length > 0 && (openMini || open ? (
        collapseIcon
      ) : (
        <IconChevronDown stroke={1.5} size="16px" style={{ marginTop: 'auto', marginBottom: 'auto' }} />
      ))}

      {!drawerOpen && (
        <Popper
          open={openMini}
          anchorEl={anchorEl}
          placement="right-start"
          strategy="fixed"
          modifiers={[
            {
              name: 'offset',
              options: {
                offset: [-12, 0]
              }
            },
            {
              name: 'preventOverflow',
              options: {
                boundary: 'window'
              }
            },
            {
              name: 'flip',
              options: {
                boundary: 'window'
              }
            }
          ]}
          sx={{
            overflow: 'visible',
            zIndex: 2001,
            minWidth: 180,
            '&:before': {
              content: '""',
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 120,
              borderLeft: `1px solid`,
              borderBottom: `1px solid`,
              borderColor: 'divider'
            }
          }}
        >
          {({ TransitionProps }) => (
            <Transitions in={openMini} {...TransitionProps}>
              <Paper
                sx={{
                  overflow: 'hidden',
                  boxShadow: theme.shadows[8],
                  backgroundImage: 'none'
                }}
              >
                <ClickAwayListener onClickAway={handleClosePopper}>
                  <Box>{menus}</Box>
                </ClickAwayListener>
              </Paper>
            </Transitions>
          )}
        </Popper>
      )}
    </ListItemButton>
  );

  const horizontalButton = (
    <ListItemButton
      id={`boundary-${popperId}`}
      disableRipple
      selected={isSelected}
      onMouseEnter={handleMouseEnterHorizontal}
      onMouseLeave={handleMouseLeaveHorizontal}
      onClick={handleHover}
      aria-describedby={popperId}
      className={anchorEl ? 'Mui-selected' : ''}
    >
      {menuIcon && (
        <ListItemIcon sx={{ my: 'auto', minWidth: !menu.icon ? 18 : 36 }}>{menuIcon}</ListItemIcon>
      )}
      {showPageCode ? (
        <Tooltip 
          title={
            <span>
              <FormattedMessage id={menu.title} /> {showPageCode ? `(${menu.pageCode})` : ''}
            </span>
          } 
          placement="top" 
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
          <ListItemText
            sx={{ mb: 0.25 }}
            primary={
              <Typography variant={isSelected ? 'h5' : 'body1'} sx={{ my: 'auto', color: 'inherit', fontWeight: isSelected ? 'bold' : 'normal' }}>
                <FormattedMessage id={menu.title} />
              </Typography>
            }
          />
        </Tooltip>
      ) : (
        <Tooltip
          title={
            <span>
              <FormattedMessage id={menu.title} />
            </span>
          }
          placement="top"
          disableHoverListener={true}
          arrow
          slotProps={{ popper: { sx: { zIndex: 2500 } } }}
        >
          <ListItemText
            sx={{ mb: 0.25 }}
            primary={
              <Typography variant={isSelected ? 'h5' : 'body1'} sx={{ my: 'auto', color: 'inherit', fontWeight: isSelected ? 'bold' : 'normal' }}>
                <FormattedMessage id={menu.title} />
              </Typography>
            }
          />
        </Tooltip>
      )}
      {menu.children && menu.children.length > 0 && (openMini ? <IconChevronRight stroke={1.5} size="16px" /> : <IconChevronDown stroke={1.5} size="16px" />)}

      {anchorEl && (
        <PopperStyled
          id={popperId}
          open={openMini}
          anchorEl={anchorEl}
          placement="right-start"
          strategy="fixed"
          style={{
            zIndex: 2001
          }}
          modifiers={[
            {
              name: 'offset',
              options: {
                offset: [-10, 0]
              }
            },
            {
              name: 'preventOverflow',
              options: {
                boundary: 'window'
              }
            },
            {
              name: 'flip',
              options: {
                boundary: 'window'
              }
            }
          ]}
          onMouseEnter={handlePopperMouseEnterHorizontal}
          onMouseLeave={handleMouseLeaveHorizontal}
        >
          {({ TransitionProps }) => (
            <Transitions in={openMini} {...TransitionProps}>
              <Paper
                sx={{
                  maxHeight: 'calc(100vh - 140px)',
                  overflowY: 'auto',
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none'
                  },
                  mt: 1.5,
                  py: 0.5,
                  boxShadow: theme.shadows[8],
                  backgroundImage: 'none'
                }}
              >
                <ClickAwayListener onClickAway={handleClosePopper}>
                  <Box>{menus}</Box>
                </ClickAwayListener>
              </Paper>
            </Transitions>
          )}
        </PopperStyled>
      )}
    </ListItemButton>
  );

  return (
    <>
      {!isHorizontal ? (
        <>
          <Tooltip
            title={
              <span>
                <FormattedMessage id={menu.title} /> {showPageCode ? `(${menu.pageCode})` : ''}
              </span>
            }
            placement="right"
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
            {verticalButton}
          </Tooltip>

          {drawerOpen && (
            <Collapse in={open} timeout="auto" unmountOnExit>
              {open && (
                <List
                  disablePadding
                  sx={{
                    position: 'relative',
                    '&:after': {
                      content: "''",
                      position: 'absolute',
                      left: '25px',
                      top: 0,
                      height: '100%',
                      width: '1px',
                      opacity: 1,
                      bgcolor: 'primary.light',
                      ...theme.applyStyles('dark', { opacity: 0.2, bgcolor: 'dark.light' })
                    }
                  }}
                >
                  {menus}
                </List>
              )}
            </Collapse>
          )}
        </>
      ) : (
        horizontalButton
      )}
    </>
  );
}

NavCollapse.propTypes = { menu: PropTypes.any, level: PropTypes.number, parentId: PropTypes.string };
