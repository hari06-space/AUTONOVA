import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Avatar, useTheme, useMediaQuery } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { glassSurface } from 'ui-component/bos/BOSStyles';

import useConfig from 'hooks/useConfig';
import { useRibbon } from 'contexts/RibbonContext';
import { MenuOrientation } from 'config';

export default function BOSPageHeader({
  title,
  subtitle,
  icon: Icon,
  actions,
  sx = {}
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';

  const { state: { menuOrientation } } = useConfig();
  const { ribbonOpen } = useRibbon();
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL;
  const stickyTop = isHorizontal ? (ribbonOpen ? 174 : 126) : 88;

  return (
    <Box sx={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      ...glassSurface(isDark),
      background: isDark 
        ? `linear-gradient(135deg, ${'background.paper'} 0%, ${alpha(theme.palette.primary.dark, 0.8)} 100%)`
        : `linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, ${alpha(theme.palette.primary.light, 0.85)} 100%)`,
      borderLeft: 'none',
      borderRight: 'none',
      borderTop: 'none',
      borderRadius: 0,
      pt: { xs: 0.5, sm: 1 },
      pb: { xs: 0.5, sm: 1 },
      px: { xs: 3, sm: 4, md: 3 },
      mb: 0,
      ...sx
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5} sx={{ width: '100%', flexWrap: 'nowrap' }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
          {Icon && (
            <Avatar sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: '#fff',
              borderRadius: '10px',
              width: { xs: 26, sm: 38 },
              height: { xs: 26, sm: 38 },
              boxShadow: `0 6px 12px ${theme.palette.primary.main}4D`,
              flexShrink: 0
            }}>
              {React.isValidElement(Icon) ? (
                Icon
              ) : typeof Icon === 'function' || (typeof Icon === 'object' && Icon?.$$typeof) ? (
                <Icon size={isMobile ? 14 : 18} stroke={1.5} />
              ) : null}
            </Avatar>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant={isMobile ? 'h4' : 'h3'} sx={{ 
              fontWeight: 800, 
              color: isDark ? '#f1f5f9' : '#0f172a', 
              lineHeight: 1.2, 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              fontSize: { xs: '1.05rem', sm: '1.25rem', md: '1.5rem' }
            }}>
              {title}
            </Typography>
            {subtitle && !isMobile && (
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : theme.palette.text.secondary, fontWeight: 500, mt: 0.25, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        {actions && (
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0
          }}>
            {actions}
          </Box>
        )}
      </Stack>
    </Box>
  );
}

BOSPageHeader.propTypes = {

  title: PropTypes.node.isRequired,
  subtitle: PropTypes.node,
  icon: PropTypes.elementType,
  actions: PropTypes.node,
  sx: PropTypes.object
};
