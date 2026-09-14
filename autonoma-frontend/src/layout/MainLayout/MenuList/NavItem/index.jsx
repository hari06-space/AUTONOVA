import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { Link, matchPath, useLocation } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// project imports
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import { prefetchRoute } from 'routes/routePreloader';
import { MenuOrientation, ThemeDirection } from 'config';
import useConfig from 'hooks/useConfig';
import { withAlpha } from 'utils/colorUtils';
import { useSelector } from 'store';

// third party
import { FormattedMessage } from 'react-intl';

// assets
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

export default function NavItem({ item, level, isParents = false, setSelectedID }) {
  const theme = useTheme();
  const permMap = useSelector((state) => state.permissions?.map) || {};
  const showPageCode = !!item.pageCode;
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const ref = useRef(null);

  const { pathname } = useLocation();
  const {
    state: { menuOrientation, borderRadius, themeDirection }
  } = useConfig();

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downMD;
  const isSelected = !!matchPath({ path: item?.link ? item.link : item.url, end: false }, pathname);

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

  const renderIcon = (iconProp, props = {}) => {
    if (!iconProp) return null;
    if (React.isValidElement(iconProp)) return iconProp;
    if (typeof iconProp === 'function' || (typeof iconProp === 'object' && iconProp?.$$typeof)) {
      const Component = iconProp;
      return <Component {...props} />;
    }
    return null;
  };

  const itemIcon = item?.icon ? (
    renderIcon(item.icon, { stroke: 1.5, size: drawerOpen ? '20px' : '24px', style: { ...(isHorizontal && isParents && { fontSize: 20, stroke: '1.5' }) } })
  ) : (
    <FiberManualRecordIcon sx={{ width: isSelected ? 8 : 6, height: isSelected ? 8 : 6 }} fontSize={level > 0 ? 'inherit' : 'medium'} />
  );

  let itemTarget = '_self';
  if (item.target) {
    itemTarget = '_blank';
  }

  const itemHandler = () => {
    if (downMD) handlerDrawerOpen(false);

    if (isParents && setSelectedID) {
      setSelectedID();
    }
  };

  const handlePrefetch = () => {
    if (item?.url) {
      prefetchRoute(item.url);
    }
  };

  const listItemButton = (
    <ListItemButton
      component={Link}
      to={item.url}
      target={itemTarget}
      disabled={item.disabled}
      disableRipple={!drawerOpen}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      onTouchStart={handlePrefetch}
      sx={{
        zIndex: 1201,
        borderRadius: `${borderRadius}px`,
        mb: 0.5,
        ...(drawerOpen && level !== 1 && { ml: `${(level - 1) * 12}px` }),
        ...(!drawerOpen && { pl: 1.25 }),
        ...((!drawerOpen || level !== 1) && {
          py: level === 1 ? 0 : 1,
          '&:hover': { bgcolor: 'transparent' },
          '&.Mui-selected': {
            '&:hover': { bgcolor: 'transparent' },
            bgcolor: 'transparent'
          }
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
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(103, 58, 183, 0.15)' : 'rgba(103, 58, 183, 0.08)',
            color: 'secondary.main',
            paddingLeft: '16px',
            '&:hover': {
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(103, 58, 183, 0.2)' : 'rgba(103, 58, 183, 0.12)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '15%',
              height: '70%',
              width: '4px',
              borderRadius: '0 4px 4px 0',
              bgcolor: 'secondary.main'
            }
          }
        })
      }}
      selected={isSelected}
      onClick={() => itemHandler()}
    >
      <ButtonBase aria-label="theme-icon" sx={{ borderRadius: `${borderRadius}px` }} disableRipple={drawerOpen}>
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
                ...(isSelected && {
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
                  ...(isSelected && {
                    bgcolor: withAlpha(theme.vars.palette.secondary.main, 0.25),
                    '&:hover': { bgcolor: withAlpha(theme.vars.palette.secondary.main, 0.3) }
                  })
                })
            })
          }}
        >
          {itemIcon}
        </ListItemIcon>
      </ButtonBase>

      {(drawerOpen || (!drawerOpen && level !== 1)) && (
        <ListItemText
          primary={
            <Typography
              ref={ref}
              noWrap
              variant={isSelected ? 'h5' : 'body1'}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: drawerOpen ? `calc(260px - ${(level - 1) * 12 + 80}px)` : 'auto',
                color: 'inherit',
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
              <FormattedMessage id={item.title} />{showPageCode ? ` (${item.pageCode})` : ''}
            </Typography>
          }
          secondary={
            item.caption && (
              <Typography
                variant="caption"
                component="span"
                gutterBottom
                sx={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  textTransform: 'capitalize',
                  lineHeight: 1.66
                }}
              >
                <FormattedMessage id={item.caption} />
              </Typography>
            )
          }
        />
      )}

      {(drawerOpen && item.chip) && (
        <Chip
          color={item.chip?.color}
          variant={item.chip?.variant}
          size={item.chip?.size}
          label={item.chip?.label}
          avatar={
            item.chip?.avatar ? (
              <Avatar>{item.chip?.avatar}</Avatar>
            ) : undefined
          }
        />
      )}
    </ListItemButton>
  );

  return (
    <>
      {!isHorizontal ? (
        <Tooltip
          title={
            <span>
              <FormattedMessage id={item.title} /> {showPageCode ? `(${item.pageCode})` : ''}
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
          {listItemButton}
        </Tooltip>
      ) : showPageCode ? (
        <Tooltip
          title={
            <span>
              <FormattedMessage id={item.title} /> {showPageCode ? `(${item.pageCode})` : ''}
            </span>
          }
          placement="left"
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
          <ListItemButton
            component={Link}
            to={item.url}
            target={itemTarget}
            disabled={item.disabled}
            sx={{
              borderRadius: isParents ? `${borderRadius}px` : 0,
              mb: isParents ? 0 : 0.5,
              alignItems: 'flex-start',
              backgroundColor: level > 1 ? 'transparent !important' : 'inherit',
              py: 1,
              pl: 2,
              mr: isParents ? 1 : 0
            }}
            selected={isSelected}
            onClick={() => itemHandler()}
          >
            <ListItemIcon
              sx={{
                my: 'auto',
                minWidth: !item?.icon ? 18 : 36
              }}
            >
              {itemIcon}
            </ListItemIcon>

            <ListItemText
              sx={{ mb: 0.25 }}
              primary={
                <Typography variant={isSelected ? 'h5' : 'body1'} sx={{ color: 'inherit' }}>
                  <FormattedMessage id={item.title} />{showPageCode ? ` (${item.pageCode})` : ''}
                </Typography>
              }
              secondary={
                item.caption && (
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
                    {item.caption}
                  </Typography>
                )
              }
            />

            {item.chip && (
              <Chip
                color={item.chip?.color}
                variant={item.chip?.variant}
                size={item.chip?.size}
                label={item.chip?.label}
                avatar={
                  item.chip?.avatar ? (
                    <Avatar>{item.chip?.avatar}</Avatar>
                  ) : undefined
                }
              />
            )}
          </ListItemButton>
        </Tooltip>
      ) : (
        <Tooltip
          title={
            <span>
              <FormattedMessage id={item.title} />
            </span>
          }
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
          <ListItemButton
            component={Link}
            to={item.url}
            target={itemTarget}
            disabled={item.disabled}
            sx={{
              borderRadius: isParents ? `${borderRadius}px` : 0,
              mb: isParents ? 0 : 0.5,
              alignItems: 'flex-start',
              backgroundColor: level > 1 ? 'transparent !important' : 'inherit',
              py: 1,
              pl: 2,
              mr: isParents ? 1 : 0
            }}
            selected={isSelected}
            onClick={() => itemHandler()}
          >
            <ListItemIcon
              sx={{
                my: 'auto',
                minWidth: !item?.icon ? 18 : 36
              }}
            >
              {itemIcon}
            </ListItemIcon>

            <ListItemText
              sx={{ mb: 0.25 }}
              primary={
                <Typography variant={isSelected ? 'h5' : 'body1'} sx={{ color: 'inherit' }}>
                  <FormattedMessage id={item.title} />{showPageCode ? ` (${item.pageCode})` : ''}
                </Typography>
              }
              secondary={
                item.caption && (
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
                    {item.caption}
                  </Typography>
                )
              }
            />

            {item.chip && (
              <Chip
                color={item.chip?.color}
                variant={item.chip?.variant}
                size={item.chip?.size}
                label={item.chip?.label}
                avatar={
                  item.chip?.avatar ? (
                    <Avatar>{item.chip?.avatar}</Avatar>
                  ) : undefined
                }
              />
            )}
          </ListItemButton>
        </Tooltip>
      )}
    </>
  );
}

NavItem.propTypes = { item: PropTypes.any, level: PropTypes.number, isParents: PropTypes.bool, setSelectedID: PropTypes.func };
