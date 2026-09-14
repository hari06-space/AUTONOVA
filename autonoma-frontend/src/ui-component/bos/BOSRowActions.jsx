import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Stack, IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText, Box } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { useColorScheme } from '@mui/material/styles';
import { IconDotsVertical } from '@tabler/icons-react';
import { glassSurface, menuRevealAnimation, bosEasing } from './BOSStyles';

/**
 * BOSRowActions — the unified row-action group for data tables.
 *
 * Renders a tidy row of icon buttons with consistent sizing, spacing,
 * tooltips and soft-tinted hover fills. When the number of *visible*
 * actions exceeds `maxInline`, the overflow collapses into a single
 * glassmorphic "⋯" dropdown menu — keeping every table row uniform.
 *
 * actions: Array<{
 *   key?: string,
 *   icon: ReactNode,            // e.g. <IconFileDots size={16} />
 *   label: string,              // menu text + fallback tooltip
 *   tooltip?: string,           // overrides label for the inline tooltip
 *   onClick: (e) => void,
 *   color?: 'primary'|'secondary'|'success'|'warning'|'error'|'info',
 *   disabled?: boolean,
 *   disabledTooltip?: string,   // tooltip shown when disabled
 *   hidden?: boolean            // omit entirely
 * }>
 */

const renderActionIcon = (Icon, size) => {
  if (!Icon) return null;
  if (React.isValidElement(Icon)) {
    return React.cloneElement(Icon, { size: Icon.props.size || size });
  }
  if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon.render)) {
    return <Icon size={size} />;
  }
  return Icon;
};

const PALETTE_KEYS = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];

export default function BOSRowActions({ actions = [], maxInline = 2, size = 'small', sx = {} }) {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const visible = actions.filter((a) => a && !a.hidden);
  if (visible.length === 0) return null;

  // Decide how many render inline vs. in the overflow menu.
  const collapse = visible.length > maxInline;
  const inline = collapse ? visible.slice(0, maxInline) : visible;
  const overflow = collapse ? visible.slice(maxInline) : [];

  const iconSize = size === 'small' ? 16 : 18;

  const toneColor = (color) => {
    if (!color) return theme.palette.primary.main;
    if (PALETTE_KEYS.includes(color)) return theme.palette[color].main;
    return color;
  };

  const handleMenuOpen = (e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); };
  const handleMenuClose = (e) => { if (e) e.stopPropagation?.(); setAnchorEl(null); };

  const renderInlineButton = (action, idx) => {
    const main = toneColor(action.color);
    const disabled = !!action.disabled;
    const tip = disabled ? (action.disabledTooltip || action.tooltip || action.label) : (action.tooltip || action.label);

    const btn = (
      <IconButton
        size={size}
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); if (!disabled) action.onClick?.(e); }}
        sx={{
          color: disabled ? 'text.disabled' : main,
          bgcolor: disabled ? 'action.disabledBackground' : alpha(main, isDark ? 0.18 : 0.1),
          borderRadius: '8px',
          p: '6px',
          transition: `all 180ms ${bosEasing}`,
          '&:hover': disabled ? {} : {
            bgcolor: main,
            color: theme.palette.getContrastText(main),
            transform: 'translateY(-1px) scale(1.04)',
            boxShadow: `0 4px 12px ${alpha(main, 0.4)}`
          },
          '&.Mui-disabled': { opacity: 0.45 }
        }}
      >
        {renderActionIcon(action.icon, iconSize)}
      </IconButton>
    );

    return (
      <Tooltip key={action.key || idx} title={tip || ''} arrow>
        {/* span keeps tooltip working on disabled buttons */}
        <span style={{ display: 'inline-flex' }}>{btn}</span>
      </Tooltip>
    );
  };

  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      justifyContent="center"
      sx={{ flexWrap: 'nowrap', ...sx }}
      onClick={(e) => e.stopPropagation()}
    >
      {inline.map(renderInlineButton)}

      {overflow.length > 0 && (
        <>
          <Tooltip title="More actions" arrow>
            <IconButton
              size={size}
              onClick={handleMenuOpen}
              sx={{
                color: open ? 'primary.main' : 'text.secondary',
                bgcolor: open ? alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1) : 'transparent',
                borderRadius: '8px',
                p: '6px',
                transition: `all 180ms ${bosEasing}`,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1), color: 'primary.main' }
              }}
            >
              <IconDotsVertical size={iconSize} />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  ...glassSurface(isDark),
                  ...menuRevealAnimation,
                  borderRadius: '12px',
                  minWidth: 184,
                  mt: 0.75,
                  p: 0.75,
                  overflow: 'visible'
                }
              }
            }}
          >
            {overflow.map((action, idx) => {
              const main = toneColor(action.color);
              const disabled = !!action.disabled;
              return (
                <MenuItem
                  key={action.key || `ov-${idx}`}
                  disabled={disabled}
                  onClick={(e) => { e.stopPropagation(); handleMenuClose(); if (!disabled) action.onClick?.(e); }}
                  sx={{
                    borderRadius: '8px',
                    my: 0.25,
                    py: 0.9,
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: isDark ? '#c9d1d9' : 'text.primary',
                    transition: `all 150ms ${bosEasing}`,
                    '&:hover': { bgcolor: alpha(main, isDark ? 0.18 : 0.1), color: main, transform: 'translateX(2px)' }
                  }}
                >
                  {action.icon && (
                    <ListItemIcon sx={{ color: main, minWidth: '32px !important' }}>
                      <Box sx={{ display: 'inline-flex' }}>
                        {renderActionIcon(action.icon, 18)}
                      </Box>
                    </ListItemIcon>
                  )}
                  <ListItemText primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {action.label}
                  </ListItemText>
                </MenuItem>
              );
            })}
          </Menu>
        </>
      )}
    </Stack>
  );
}

BOSRowActions.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      icon: PropTypes.node,
      label: PropTypes.string,
      tooltip: PropTypes.string,
      onClick: PropTypes.func,
      color: PropTypes.string,
      disabled: PropTypes.bool,
      disabledTooltip: PropTypes.string,
      hidden: PropTypes.bool
    })
  ),
  maxInline: PropTypes.number,
  size: PropTypes.string,
  sx: PropTypes.object
};
