// Organization: AUTONOVA
// Updated By: hari06-space
// Updated At: 2026-09-04
// Description: Luxury circular jewel swatches for theme presets with live custom palette studio.

import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { useColorScheme, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';

// project imports
import { ThemeMode } from 'config';
import useConfig from 'hooks/useConfig';

// color imports
import colors from '../../themes/theme/default';
import theme1 from '../../themes/theme/theme1';
import theme2 from '../../themes/theme/theme2';
import theme3 from '../../themes/theme/theme3';
import theme4 from '../../themes/theme/theme4';
import theme6 from '../../themes/theme/theme6';
import theme7 from '../../themes/theme/theme7';
import theme8 from '../../themes/theme/theme8';
import theme11 from '../../themes/theme/theme11';
import theme14 from '../../themes/theme/theme14';
import theme15 from '../../themes/theme/theme15';
import theme16 from '../../themes/theme/theme16';
import theme17 from '../../themes/theme/theme17';
import theme22 from '../../themes/theme/theme22';
import theme23 from '../../themes/theme/theme23';
import theme24 from '../../themes/theme/theme24';
import theme25 from '../../themes/theme/theme25';
import theme26 from '../../themes/theme/theme26';
import theme27 from '../../themes/theme/theme27';
import theme28 from '../../themes/theme/theme28';
import theme29 from '../../themes/theme/theme29';

// assets
import { IconCheck, IconChevronDown, IconChevronUp, IconColorPicker, IconSparkles } from '@tabler/icons-react';

export default function PresetColorPage() {
  const { colorScheme } = useColorScheme();
  const theme = useTheme();
  const isDark = colorScheme === ThemeMode.DARK;
  const {
    state: { presetColor },
    setField
  } = useConfig();

  const colorOptions = [
    {
      id: 'default',
      name: 'Berry Indigo',
      primary: isDark ? colors.darkPrimaryMain : colors.primaryMain,
      secondary: isDark ? colors.darkSecondaryMain : colors.secondaryMain
    },
    {
      id: 'theme1',
      name: 'Aqua Cyan',
      primary: isDark ? theme1.darkPrimaryMain : theme1.primaryMain,
      secondary: isDark ? theme1.darkSecondaryMain : theme1.secondaryMain
    },
    {
      id: 'theme2',
      name: 'Emerald Forest',
      primary: isDark ? theme2.darkPrimaryMain : theme2.primaryMain,
      secondary: isDark ? theme2.darkSecondaryMain : theme2.secondaryMain
    },
    {
      id: 'theme3',
      name: 'Crimson Rose',
      primary: isDark ? theme3.darkPrimaryMain : theme3.primaryMain,
      secondary: isDark ? theme3.darkSecondaryMain : theme3.secondaryMain
    },
    {
      id: 'theme4',
      name: 'Amber Bronze',
      primary: isDark ? theme4.darkPrimaryMain : theme4.primaryMain,
      secondary: isDark ? theme4.darkSecondaryMain : theme4.secondaryMain
    },
    {
      id: 'theme6',
      name: 'Cyber Violet',
      primary: isDark ? theme6.darkPrimaryMain : theme6.primaryMain,
      secondary: isDark ? theme6.darkSecondaryMain : theme6.secondaryMain
    },
    {
      id: 'theme7',
      name: 'Sapphire Blue',
      primary: isDark ? theme7.darkPrimaryMain : theme7.primaryMain,
      secondary: isDark ? theme7.darkSecondaryMain : theme7.secondaryMain
    },
    {
      id: 'theme8',
      name: 'Sunset Orange',
      primary: isDark ? theme8.darkPrimaryMain : theme8.primaryMain,
      secondary: isDark ? theme8.darkSecondaryMain : theme8.secondaryMain
    },
    {
      id: 'theme11',
      name: 'Royal Teal',
      primary: isDark ? theme11.darkPrimaryMain : theme11.primaryMain,
      secondary: isDark ? theme11.darkSecondaryMain : theme11.secondaryMain
    },
    {
      id: 'theme14',
      name: 'Golden Ochre',
      primary: isDark ? theme14.darkPrimaryMain : theme14.primaryMain,
      secondary: isDark ? theme14.darkSecondaryMain : theme14.secondaryMain
    },
    {
      id: 'theme15',
      name: 'Deep Amethyst',
      primary: isDark ? theme15.darkPrimaryMain : theme15.primaryMain,
      secondary: isDark ? theme15.darkSecondaryMain : theme15.secondaryMain
    },
    {
      id: 'theme16',
      name: 'Nordic Slate',
      primary: isDark ? theme16.darkPrimaryMain : theme16.primaryMain,
      secondary: isDark ? theme16.darkSecondaryMain : theme16.secondaryMain
    },
    {
      id: 'theme17',
      name: 'Coral Punch',
      primary: isDark ? theme17.darkPrimaryMain : theme17.primaryMain,
      secondary: isDark ? theme17.darkSecondaryMain : theme17.secondaryMain
    },
    {
      id: 'theme22',
      name: 'Mystic Jade',
      primary: isDark ? theme22.darkPrimaryMain : theme22.primaryMain,
      secondary: isDark ? theme22.darkSecondaryMain : theme22.secondaryMain
    },
    {
      id: 'theme23',
      name: 'Electric Cobalt',
      primary: isDark ? theme23.darkPrimaryMain : theme23.primaryMain,
      secondary: isDark ? theme23.darkSecondaryMain : theme23.secondaryMain
    },
    {
      id: 'theme24',
      name: 'Neon Fuchsia',
      primary: isDark ? theme24.darkPrimaryMain : theme24.primaryMain,
      secondary: isDark ? theme24.darkSecondaryMain : theme24.secondaryMain
    },
    {
      id: 'theme25',
      name: 'Warm Terracotta',
      primary: isDark ? theme25.darkPrimaryMain : theme25.primaryMain,
      secondary: isDark ? theme25.darkSecondaryMain : theme25.secondaryMain
    },
    {
      id: 'theme26',
      name: 'Lime Spark',
      primary: isDark ? theme26.darkPrimaryMain : theme26.primaryMain,
      secondary: isDark ? theme26.darkSecondaryMain : theme26.secondaryMain
    },
    {
      id: 'theme27',
      name: 'Twilight Plum',
      primary: isDark ? theme27.darkPrimaryMain : theme27.primaryMain,
      secondary: isDark ? theme27.darkSecondaryMain : theme27.secondaryMain
    },
    {
      id: 'theme28',
      name: 'Ocean Breeze',
      primary: isDark ? theme28.darkPrimaryMain : theme28.primaryMain,
      secondary: isDark ? theme28.darkSecondaryMain : theme28.secondaryMain
    },
    {
      id: 'theme29',
      name: 'Midnight Bronze',
      primary: isDark ? theme29.darkPrimaryMain : theme29.primaryMain,
      secondary: isDark ? theme29.darkSecondaryMain : theme29.secondaryMain
    }
  ];

  const [isExpanded, setIsExpanded] = useState(false);
  const [showCustomStudio, setShowCustomStudio] = useState(false);

  const isCustom = presetColor && presetColor.startsWith('custom:');
  const [customPrimary, setCustomPrimary] = useState(isCustom ? presetColor.split(':')[1] || '#6366f1' : '#6366f1');
  const [customSecondary, setCustomSecondary] = useState(isCustom ? presetColor.split(':')[2] || '#ec4899' : '#ec4899');

  useEffect(() => {
    if (presetColor && presetColor.startsWith('custom:')) {
      const parts = presetColor.split(':');
      if (parts[1]) setCustomPrimary(parts[1]);
      if (parts[2]) setCustomSecondary(parts[2]);
    }
  }, [presetColor]);

  const handleApplyCustom = () => {
    setField('presetColor', `custom:${customPrimary}:${customSecondary}`);
  };

  // Show first 6 swatches (1 clean row) or all 21 swatches
  const visibleOptions = isExpanded ? colorOptions : colorOptions.slice(0, 6);

  // Background color for active ring spacing
  const ringGapColor = isDark ? '#1e293b' : '#ffffff';

  return (
    <Stack spacing={2} sx={{ p: 2.25 }}>
      {/* ── Circular Jewel Swatches Row / Grid ─────────────────── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 1.5,
          justifyItems: 'center',
          alignItems: 'center'
        }}
      >
        {visibleOptions.map((c) => {
          const isActive = presetColor === c.id;
          return (
            <Tooltip key={c.id} title={`${c.name} (${c.id})`} placement="top" arrow>
              <Box
                onClick={() => setField('presetColor', c.id)}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  position: 'relative',
                  background: `linear-gradient(135deg, ${c.primary} 50%, ${c.secondary} 50%)`,
                  boxShadow: isActive
                    ? `0 0 0 3px ${ringGapColor}, 0 0 0 5.5px ${c.primary}, 0 8px 20px ${c.primary}66`
                    : '0 3px 10px rgba(0,0,0,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isActive ? 'scale(1.12)' : 'scale(1)',
                  transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px) scale(1.1)',
                    boxShadow: `0 0 0 2px ${ringGapColor}, 0 0 0 4px ${c.primary}88, 0 8px 18px ${c.primary}44`
                  }
                }}
              >
                {isActive && (
                  <IconCheck
                    size={22}
                    color="#fff"
                    strokeWidth={3}
                    style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }}
                  />
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* ── Actions Row: Show More & Custom Palette Studio Toggle ──── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" pt={0.5}>
        <Button
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          endIcon={isExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          sx={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'none',
            color: 'primary.main',
            px: 1,
            py: 0.3,
            borderRadius: 1.5,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          {isExpanded ? 'Show Less' : `All Themes (${colorOptions.length})`}
        </Button>

        <Button
          size="small"
          variant={showCustomStudio ? 'contained' : 'outlined'}
          color={isCustom ? 'secondary' : 'primary'}
          onClick={() => setShowCustomStudio(!showCustomStudio)}
          startIcon={<IconColorPicker size={14} />}
          sx={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'none',
            px: 1.5,
            py: 0.35,
            borderRadius: 2,
            boxShadow: showCustomStudio ? '0 3px 10px rgba(99,102,241,0.25)' : 'none'
          }}
        >
          {showCustomStudio ? 'Close Custom' : 'Custom Palette'}
        </Button>
      </Stack>

      {/* ── Custom Palette Studio Collapse ─────────────────────── */}
      <Collapse in={showCustomStudio}>
        <Box
          sx={{
            p: 1.75,
            borderRadius: 2.5,
            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            border: '1px solid',
            borderColor: isCustom ? 'secondary.main' : 'divider',
            transition: 'all 0.25s'
          }}
        >
          <Stack spacing={1.5}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconSparkles size={16} color={theme.palette.secondary.main} />
                <Typography variant="caption" fontWeight={800} sx={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Custom Color Studio
                </Typography>
              </Stack>
              {isCustom && (
                <Box
                  sx={{
                    px: 1,
                    py: 0.2,
                    borderRadius: 1,
                    bgcolor: 'secondary.lighter',
                    color: 'secondary.main',
                    fontWeight: 800,
                    fontSize: '0.65rem'
                  }}
                >
                  ACTIVE
                </Box>
              )}
            </Stack>

            {/* Gradient Preview Bar */}
            <Box
              sx={{
                height: 38,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${customPrimary} 0%, ${customSecondary} 100%)`,
                boxShadow: `0 4px 14px ${customPrimary}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                px: 2,
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,0.6)', fontSize: '0.72rem' }}>
                {customPrimary.toUpperCase()}
              </Typography>
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,0.6)', fontSize: '0.72rem' }}>
                {customSecondary.toUpperCase()}
              </Typography>
            </Box>

            {/* Color Pickers Controls */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Primary */}
              <Box
                component="label"
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 0.75,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  '&:hover': { borderColor: customPrimary }
                }}
              >
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    bgcolor: customPrimary,
                    boxShadow: `0 2px 6px ${customPrimary}66`,
                    flexShrink: 0
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" display="block" color="text.secondary" fontSize="0.62rem" fontWeight={700}>
                    PRIMARY
                  </Typography>
                  <Typography variant="caption" fontWeight={700} fontSize="0.75rem" noWrap>
                    {customPrimary}
                  </Typography>
                </Box>
                <input
                  type="color"
                  value={customPrimary}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
                />
              </Box>

              {/* Secondary */}
              <Box
                component="label"
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 0.75,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  '&:hover': { borderColor: customSecondary }
                }}
              >
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    bgcolor: customSecondary,
                    boxShadow: `0 2px 6px ${customSecondary}66`,
                    flexShrink: 0
                  }}
                />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" display="block" color="text.secondary" fontSize="0.62rem" fontWeight={700}>
                    SECONDARY
                  </Typography>
                  <Typography variant="caption" fontWeight={700} fontSize="0.75rem" noWrap>
                    {customSecondary}
                  </Typography>
                </Box>
                <input
                  type="color"
                  value={customSecondary}
                  onChange={(e) => setCustomSecondary(e.target.value)}
                  style={{ opacity: 0, position: 'absolute', width: 0, height: 0 }}
                />
              </Box>
            </Stack>

            {/* Apply Button */}
            <Button
              fullWidth
              size="small"
              variant="contained"
              onClick={handleApplyCustom}
              sx={{
                borderRadius: 2,
                py: 0.85,
                fontWeight: 800,
                fontSize: '0.75rem',
                background: `linear-gradient(135deg, ${customPrimary} 0%, ${customSecondary} 100%)`,
                color: '#fff',
                boxShadow: `0 4px 14px ${customPrimary}44`,
                '&:hover': {
                  opacity: 0.95,
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Apply Custom Palette
            </Button>
          </Stack>
        </Box>
      </Collapse>
    </Stack>
  );
}
