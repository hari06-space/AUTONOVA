// Organization: AUTONOVA
// Owner: hari06-space
// Created At: 2026-09-04
// Description: Ultra-luxury Header / Top Bar Theme selector with realistic miniature topbar previews,
//              interactive category filter chips, and instant live theme switching.

import { useState } from 'react';

// material-ui
import { useColorScheme, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

// project imports
import { HeaderTheme, ThemeMode } from 'config';
import useConfig from 'hooks/useConfig';
import { HEADER_THEME_LIST, getHeaderThemeStyles } from '../MainLayout/headerThemes';

// assets
import {
  IconCheck,
  IconLayersLinked,
  IconPalette,
  IconSparkles,
  IconPhoto,
  IconPolygon,
  IconTexture,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react';

// Category filter definitions
const CATEGORIES = [
  { id: 'all', label: 'All', count: 20, icon: IconLayersLinked },
  { id: 'solid', label: 'Solid', count: 4, icon: IconPalette },
  { id: 'gradients', label: 'Gradients', count: 4, icon: IconSparkles },
  { id: 'images', label: 'Images', count: 4, icon: IconPhoto },
  { id: 'shapes', label: 'Shapes', count: 4, icon: IconPolygon },
  { id: 'textures', label: 'Textures', count: 4, icon: IconTexture }
];

const getBadgeStyles = (badge, isDark) => {
  switch (badge) {
    case 'LIGHT':
    case 'MINIMAL':
      return {
        bgcolor: isDark ? 'rgba(56, 189, 248, 0.16)' : '#e0f2fe',
        color: isDark ? '#38bdf8' : '#0369a1',
        border: '1px solid',
        borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#bae6fd'
      };
    case 'CHROME':
      return {
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9',
        color: isDark ? '#e2e8f0' : '#334155',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1'
      };
    case 'NANO':
      return {
        bgcolor: isDark ? 'rgba(148, 163, 184, 0.16)' : '#f8fafc',
        color: isDark ? '#cbd5e1' : '#475569',
        border: '1px solid',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.3)' : '#94a3b8'
      };
    case 'HOLO':
      return {
        bgcolor: isDark ? 'rgba(129, 140, 248, 0.18)' : '#ede9fe',
        color: isDark ? '#a5b4fc' : '#4338ca',
        border: '1px solid',
        borderColor: isDark ? 'rgba(129, 140, 248, 0.35)' : '#818cf8'
      };
    case 'OPAL':
      return {
        bgcolor: isDark ? 'rgba(168, 85, 247, 0.18)' : '#f5f3ff',
        color: isDark ? '#c084fc' : '#7c3aed',
        border: '1px solid',
        borderColor: isDark ? 'rgba(168, 85, 247, 0.35)' : '#ddd6fe'
      };
    case 'CLOUD':
      return {
        bgcolor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#eff6ff',
        color: isDark ? '#7dd3fc' : '#0284c7',
        border: '1px solid',
        borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#bae6fd'
      };
    case 'SUNSET':
      return {
        bgcolor: isDark ? 'rgba(244, 63, 94, 0.2)' : '#ffe4e6',
        color: isDark ? '#fb7185' : '#e11d48',
        border: '1px solid',
        borderColor: isDark ? 'rgba(244, 63, 94, 0.35)' : '#fda4af'
      };
    case 'FROST':
      return {
        bgcolor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#e0f2fe',
        color: isDark ? '#38bdf8' : '#0284c7',
        border: '1px solid',
        borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#bae6fd'
      };
    case 'NEBULA':
      return {
        bgcolor: isDark ? 'rgba(168, 85, 247, 0.2)' : '#f3e8ff',
        color: isDark ? '#c084fc' : '#7e22ce',
        border: '1px solid',
        borderColor: isDark ? 'rgba(168, 85, 247, 0.4)' : '#d8b4fe'
      };
    case 'EMBER':
      return {
        bgcolor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
        color: isDark ? '#fbbf24' : '#b45309',
        border: '1px solid',
        borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#fde68a'
      };
    case 'SILK':
      return {
        bgcolor: isDark ? 'rgba(148, 163, 184, 0.18)' : '#f8fafc',
        color: isDark ? '#cbd5e1' : '#475569',
        border: '1px solid',
        borderColor: isDark ? 'rgba(148, 163, 184, 0.35)' : '#cbd5e1'
      };
    case 'MESH':
      return {
        bgcolor: isDark ? 'rgba(100, 116, 139, 0.18)' : '#f1f5f9',
        color: isDark ? '#94a3b8' : '#334155',
        border: '1px solid',
        borderColor: isDark ? 'rgba(100, 116, 139, 0.35)' : '#cbd5e1'
      };
    case 'TWILL':
      return {
        bgcolor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#0f172a',
        color: isDark ? '#38bdf8' : '#38bdf8',
        border: '1px solid',
        borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : '#0284c7'
      };
    case 'CORE':
      return {
        bgcolor: isDark ? 'rgba(6, 182, 212, 0.2)' : '#080d1a',
        color: isDark ? '#22d3ee' : '#22d3ee',
        border: '1px solid',
        borderColor: isDark ? 'rgba(6, 182, 212, 0.45)' : '#06b6d4'
      };
    case 'MATRIX':
      return {
        bgcolor: isDark ? 'rgba(6, 182, 212, 0.18)' : '#ecfeff',
        color: isDark ? '#22d3ee' : '#0e7490',
        border: '1px solid',
        borderColor: isDark ? 'rgba(6, 182, 212, 0.35)' : '#06b6d4'
      };
    case 'SPECTRUM':
      return {
        bgcolor: isDark ? 'rgba(244, 63, 94, 0.2)' : '#fdf2f8',
        color: isDark ? '#fb7185' : '#db2777',
        border: '1px solid',
        borderColor: isDark ? 'rgba(244, 63, 94, 0.35)' : '#fbcfe8'
      };
    case 'MARBLE':
      return {
        bgcolor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fefce8',
        color: isDark ? '#fbbf24' : '#b45309',
        border: '1px solid',
        borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde047'
      };
    case 'PRISM':
      return {
        bgcolor: isDark ? 'rgba(199, 210, 254, 0.18)' : '#ede9fe',
        color: isDark ? '#a5b4fc' : '#4f46e5',
        border: '1px solid',
        borderColor: isDark ? 'rgba(199, 210, 254, 0.35)' : '#c7d2fe'
      };
    case 'DARK':
    case 'STEALTH':
      return {
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#1e293b',
        color: isDark ? '#f8fafc' : '#ffffff',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#334155'
      };
    case 'LEAF':
      return {
        bgcolor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
        color: isDark ? '#4ade80' : '#15803d',
        border: '1px solid',
        borderColor: isDark ? 'rgba(34, 197, 94, 0.4)' : '#86efac'
      };
    case 'AURORA':
      return {
        bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
        color: isDark ? '#34d399' : '#047857',
        border: '1px solid',
        borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : '#a7f3d0'
      };
    case 'METRO':
      return {
        bgcolor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#e0f2fe',
        color: isDark ? '#38bdf8' : '#0369a1',
        border: '1px solid',
        borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#bae6fd'
      };
    case 'MINT':
      return {
        bgcolor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
        color: isDark ? '#34d399' : '#047857',
        border: '1px solid',
        borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#a7f3d0'
      };
    case 'WARM':
      return {
        bgcolor: isDark ? 'rgba(249, 115, 22, 0.18)' : '#ffedd5',
        color: isDark ? '#fb923c' : '#c2410c',
        border: '1px solid',
        borderColor: isDark ? 'rgba(249, 115, 22, 0.35)' : '#fed7aa'
      };
    case 'RICH':
      return {
        bgcolor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#d1fae5',
        color: isDark ? '#34d399' : '#047857',
        border: '1px solid',
        borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : '#a7f3d0'
      };
    case 'BLUE':
      return {
        bgcolor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#dbeafe',
        color: isDark ? '#60a5fa' : '#1d4ed8',
        border: '1px solid',
        borderColor: isDark ? 'rgba(37, 99, 235, 0.35)' : '#93c5fd'
      };
    case 'NIGHT':
      return {
        bgcolor: isDark ? 'rgba(56, 189, 248, 0.16)' : '#e0f2fe',
        color: isDark ? '#38bdf8' : '#0369a1',
        border: '1px solid',
        borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#bae6fd'
      };
    case 'OCEAN':
      return {
        bgcolor: isDark ? 'rgba(6, 182, 212, 0.2)' : '#cffafe',
        color: isDark ? '#22d3ee' : '#0e7490',
        border: '1px solid',
        borderColor: isDark ? 'rgba(6, 182, 212, 0.35)' : '#67e8f9'
      };
    case 'LASER':
      return {
        bgcolor: isDark ? 'rgba(244, 63, 94, 0.2)' : '#ffe4e6',
        color: isDark ? '#fb7185' : '#e11d48',
        border: '1px solid',
        borderColor: isDark ? 'rgba(244, 63, 94, 0.35)' : '#fda4af'
      };
    case 'YELLOW':
    case 'GOLD':
      return {
        bgcolor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef9c3',
        color: isDark ? '#fbbf24' : '#a16207',
        border: '1px solid',
        borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde047'
      };
    case 'CYAN':
    case 'TECH':
    case 'CYBER':
      return {
        bgcolor: isDark ? 'rgba(6, 182, 212, 0.18)' : '#cffafe',
        color: isDark ? '#22d3ee' : '#0891b2',
        border: '1px solid',
        borderColor: isDark ? 'rgba(6, 182, 212, 0.35)' : '#a5f3fc'
      };
    case 'PURPLE':
    case 'JEWEL':
      return {
        bgcolor: isDark ? 'rgba(168, 85, 247, 0.18)' : '#f3e8ff',
        color: isDark ? '#c084fc' : '#7e22ce',
        border: '1px solid',
        borderColor: isDark ? 'rgba(168, 85, 247, 0.35)' : '#e9d5ff'
      };
    case '3D MESH':
    case 'SPEED':
      return {
        bgcolor: isDark ? 'rgba(99, 102, 241, 0.18)' : '#e0e7ff',
        color: isDark ? '#818cf8' : '#4338ca',
        border: '1px solid',
        borderColor: isDark ? 'rgba(99, 102, 241, 0.35)' : '#c7d2fe'
      };
    case 'NEON':
      return {
        bgcolor: isDark ? 'rgba(16, 185, 129, 0.22)' : '#ecfdf5',
        color: isDark ? '#10b981' : '#047857',
        border: '1px solid',
        borderColor: isDark ? 'rgba(16, 185, 129, 0.45)' : '#a7f3d0'
      };
    case 'FLOW':
      return {
        bgcolor: isDark ? 'rgba(232, 121, 249, 0.18)' : '#fdf4ff',
        color: isDark ? '#f472b6' : '#a21caf',
        border: '1px solid',
        borderColor: isDark ? 'rgba(232, 121, 249, 0.35)' : '#f5d0fe'
      };
    case 'LUXURY':
      return {
        bgcolor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#fef3c7',
        color: isDark ? '#fbbf24' : '#b45309',
        border: '1px solid',
        borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a'
      };
    case 'AUTO':
      return {
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
        color: isDark ? '#cbd5e1' : '#475569',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1'
      };
    default:
      return {
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
        color: 'text.secondary',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
      };
  }
};

export default function HeaderThemePage() {
  const { colorScheme, mode } = useColorScheme();
  const theme = useTheme();
  const isDark = colorScheme === ThemeMode.DARK || mode === ThemeMode.DARK || theme.palette.mode === 'dark';

  const {
    state: { headerTheme },
    setField
  } = useConfig();

  const [activeCategory, setActiveCategory] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const currentThemeId = headerTheme || HeaderTheme.DEFAULT;

  const filteredThemes = activeCategory === 'all'
    ? HEADER_THEME_LIST
    : HEADER_THEME_LIST.filter((item) => item.category === activeCategory);

  const displayedThemes = isExpanded ? filteredThemes : filteredThemes.slice(0, 2);

  return (
    <Stack spacing={1.75} sx={{ p: 2, width: '100%', minWidth: 0, boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* ── Filter Category Chips (All 5 always fully visible) ── */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.65,
          alignItems: 'center',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box'
        }}
      >
        {CATEGORIES.map(({ id, label, count, icon: CatIcon }) => {
          const isSelected = activeCategory === id;
          return (
            <Chip
              key={id}
              icon={<CatIcon size={12} strokeWidth={2.4} />}
              label={`${label} (${count})`}
              size="small"
              onClick={() => setActiveCategory(id)}
              sx={{
                height: 25,
                fontSize: '0.66rem',
                fontWeight: isSelected ? 800 : 600,
                cursor: 'pointer',
                borderRadius: 2,
                transition: 'all 0.18s ease',
                bgcolor: isSelected
                  ? 'primary.main'
                  : isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
                color: isSelected ? '#ffffff' : 'text.secondary',
                border: '1px solid',
                borderColor: isSelected
                  ? 'primary.main'
                  : isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.06)',
                '& .MuiChip-label': {
                  px: 0.75
                },
                '& .MuiChip-icon': {
                  ml: 0.75,
                  mr: -0.3
                },
                '&:hover': {
                  bgcolor: isSelected ? 'primary.dark' : 'action.hover',
                  color: isSelected ? '#ffffff' : 'text.primary'
                }
              }}
            />
          );
        })}
      </Box>

      {/* ── 2-Column Theme Preview Cards Grid (Scrollable when expanded, NEVER horizontal scroll) ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 1.25,
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          maxHeight: isExpanded ? 280 : 'none',
          overflowY: isExpanded ? 'auto' : 'hidden',
          overflowX: 'hidden',
          pr: isExpanded ? 0.5 : 0,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::-webkit-scrollbar': {
            width: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
            borderRadius: '4px'
          }
        }}
      >
        {displayedThemes.map((item) => {
          const active = currentThemeId === item.id;
          const styles = getHeaderThemeStyles(item.id, isDark);
          const isLight = !item.isDark;

          return (
            <Tooltip key={item.id} title={item.desc} placement="top" arrow>
              <Box
                onClick={() => setField('headerTheme', item.id)}
                sx={{
                  position: 'relative',
                  p: 1.15,
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  borderRadius: 2.25,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: active ? 'primary.main' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  bgcolor: active
                    ? isDark
                      ? 'rgba(99,102,241,0.12)'
                      : 'rgba(99,102,241,0.06)'
                    : 'background.paper',
                  boxShadow: active
                    ? '0 0 16px rgba(99,102,241,0.35)'
                    : isDark
                    ? '0 2px 8px rgba(0,0,0,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.85,
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 18px rgba(99,102,241,0.22)'
                  }
                }}
              >
                {/* Active Checkmark Pill */}
                {active && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      zIndex: 2,
                      width: 17,
                      height: 17,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(99,102,241,0.6)'
                    }}
                  >
                    <IconCheck size={11} strokeWidth={3.5} />
                  </Box>
                )}

                {/* Miniature Realistic Topbar Mockup */}
                <Box
                  sx={{
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    height: 38,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                    ...styles,
                    p: '5px 7px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  {/* Left Mock: Mini Brand / Logo */}
                  <Stack direction="row" spacing={0.35} alignItems="center" sx={{ minWidth: 0, flexShrink: 0 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: 0.6,
                        bgcolor: isLight ? 'primary.main' : 'warning.main',
                        boxShadow: isLight ? '0 1px 4px rgba(37,99,235,0.3)' : '0 1px 4px rgba(245,158,11,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#fff' }} />
                    </Box>
                    <Box
                      sx={{
                        width: 20,
                        height: 4.5,
                        borderRadius: 0.5,
                        bgcolor: isLight ? '#1e293b' : '#ffffff',
                        opacity: isLight ? 0.85 : 0.95
                      }}
                    />
                  </Stack>

                  {/* Center Mock: Mini Search Bar */}
                  <Box
                    sx={{
                      width: 28,
                      height: 12,
                      borderRadius: 1,
                      bgcolor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.18)',
                      border: '0.5px solid',
                      borderColor: isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      px: 0.35,
                      flexShrink: 0
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 2.5,
                        borderRadius: 0.5,
                        bgcolor: isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'
                      }}
                    />
                  </Box>

                  {/* Right Mock: Action Dots */}
                  <Stack direction="row" spacing={0.3} alignItems="center" sx={{ flexShrink: 0 }}>
                    <Box sx={{ width: 4.5, height: 4.5, borderRadius: '50%', bgcolor: '#ef4444' }} />
                    <Box sx={{ width: 4.5, height: 4.5, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                    <Box sx={{ width: 4.5, height: 4.5, borderRadius: '50%', bgcolor: '#10b981' }} />
                  </Stack>
                </Box>

                {/* Label & Category Row */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 0.2, minWidth: 0, width: '100%' }}>
                  <Typography
                    variant="caption"
                    fontWeight={active ? 800 : 700}
                    noWrap
                    sx={{
                      fontSize: '0.72rem',
                      color: active ? 'primary.main' : 'text.primary',
                      flexGrow: 1,
                      minWidth: 0,
                      mr: 0.5
                    }}
                  >
                    {item.name}
                  </Typography>

                  {item.badge ? (
                    <Chip
                      label={item.badge}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.55rem',
                        fontWeight: 800,
                        borderRadius: 0.75,
                        px: 0.3,
                        flexShrink: 0,
                        ...getBadgeStyles(item.badge, isDark)
                      }}
                    />
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'text.disabled',
                        flexShrink: 0
                      }}
                    >
                      {item.category}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* ── Load More / Show Less Toggle Button ──────────────────── */}
      {filteredThemes.length > 2 && (
        <Button
          fullWidth
          size="small"
          variant="outlined"
          onClick={() => setIsExpanded(!isExpanded)}
          startIcon={isExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          sx={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'none',
            py: 0.6,
            borderRadius: 2,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'divider',
            color: 'text.secondary',
            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'action.hover',
              borderColor: 'primary.main',
              color: 'primary.main'
            }
          }}
        >
          {isExpanded ? 'Show Less' : `Load More (${filteredThemes.length - 2} more)`}
        </Button>
      )}
    </Stack>
  );
}
