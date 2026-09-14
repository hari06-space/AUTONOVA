import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button, useTheme } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';

export default function BOSPillTabs({
  tabs = [],
  value,
  onChange,
  orientation = 'responsive', // 'responsive', 'horizontal', 'vertical'
  sx = {}
}) {
  const theme = useTheme();
  const { mode, systemMode } = useColorScheme();
  const computedMode = mode === 'system' ? systemMode : mode;
  const isDark = computedMode === 'dark';

  const isResponsive = orientation === 'responsive';
  const isVertical = orientation === 'vertical';

  const containerDirection = isResponsive 
    ? { xs: 'row', md: 'column' } 
    : isVertical ? 'column' : 'row';

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: containerDirection, 
      gap: 1.5, 
      overflowX: { xs: 'auto', md: isVertical || isResponsive ? 'visible' : 'auto' },
      ...sx 
    }}>
      {tabs.map((tab, idx) => {
        const tabValue = typeof tab === 'object' ? tab.value : idx;
        const tabLabel = typeof tab === 'object' ? tab.label : tab;
        const isSelected = value === tabValue;

        return (
          <Button
            key={tabValue}
            size="large"
            variant={isSelected ? 'contained' : 'outlined'}
            onClick={() => onChange(tabValue)}
            sx={{
              borderRadius: '8px',
              px: 2,
              py: 0.75,
              textTransform: 'uppercase',
              justifyContent: 'center',
              minWidth: { xs: 'auto', md: isVertical || isResponsive ? '100%' : 'auto' },
              letterSpacing: '0.05em',
              whiteSpace: 'nowrap',
              ...(isSelected
                ? { 
                    bgcolor: theme.palette.primary.main, 
                    color: theme.palette.primary.contrastText || '#fff', 
                    boxShadow: `0 4px 15px ${theme.palette.primary.main}4D`, 
                    border: 'none', 
                    '&:hover': { bgcolor: theme.palette.primary.dark } 
                  }
                : { 
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0', 
                    color: isDark ? '#94a3b8' : '#64748b', 
                    '&:hover': { 
                      borderColor: theme.palette.primary.main, 
                      color: theme.palette.primary.main, 
                      bgcolor: `${theme.palette.primary.main}0D` 
                    } 
                  })
            }}
          >
            {tabLabel}
          </Button>
        );
      })}
    </Box>
  );
}

BOSPillTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.node.isRequired,
        value: PropTypes.any.isRequired
      })
    ])
  ).isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  orientation: PropTypes.oneOf(['responsive', 'horizontal', 'vertical']),
  sx: PropTypes.object
};
