// Organization: Nutech
// Updated By: Nutech
// Updated At: 2026-09-04
// Description: Executive Theme Studio Drawer — clean minimalist header, iOS-style segmented pill tabs, and cohesive aesthetic.

import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
import { useColorScheme, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

// project imports
import FontFamily from './FontFamily';
import FontSize from './FontSize';
import BoxContainer from './BoxContainer';
import PresetColor from './PresetColor';
import Layout from './Layout';
import InputFilled from './InputFilled';
import BorderRadius from './BorderRadius';
import ThemeModeLayout from './ThemeMode';
import SidebarDrawer from './SidebarDrawer';
import MenuOrientation from './MenuOrientation';
import MenuCardStyle from './MenuCardStyle';
import RibbonLayoutPage from './RibbonLayout';
import NotificationRingtone from './NotificationRingtone';
import HeaderThemePage from './HeaderTheme';

import { DEFAULT_THEME_MODE, RibbonLayout, ThemeMode, HeaderTheme } from 'config';
import SimpleBar from 'ui-component/third-party/SimpleBar';
import useConfig from 'hooks/useConfig';

// assets
import {
  IconColorSwatch,
  IconTextSize,
  IconX,
  IconRefresh,
  IconBorderRadius,
  IconAlignLeft,
  IconResize,
  IconArrowsLeftRight,
  IconLayoutSidebar,
  IconSparkles,
  IconBrush,
  IconTypography,
  IconVolume,
  IconVolumeOff,
  IconSun,
  IconMoon,
  IconLayoutColumns,
  IconLayoutKanban,
  IconLayoutNavbar
} from '@tabler/icons-react';

// ─────────────────────────────────────────────────────────────────────────────
// Premium Clean Section Block
// ─────────────────────────────────────────────────────────────────────────────
function SectionBlock({ icon: Icon, label, children, gradient, badge }) {
  const { colorScheme, mode } = useColorScheme();
  const theme = useTheme();
  const isDark = colorScheme === 'dark' || mode === 'dark' || theme.palette.mode === 'dark';

  return (
    <Box sx={{ mb: 2 }}>
      {/* Section Header Row */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        sx={{ px: 2.5, mb: 1 }}
      >
        {Icon && (
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: 1.75,
              background: gradient || `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              flexShrink: 0
            }}
          >
            <Icon size={14} color="#fff" strokeWidth={2.5} />
          </Box>
        )}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            fontSize: '0.68rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#475569',
            flex: 1
          }}
        >
          {label}
        </Typography>
        {badge && (
          <Chip
            label={badge}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 800,
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              color: isDark ? '#fff' : 'text.primary',
              borderRadius: 1.5,
              px: 0.5
            }}
          />
        )}
      </Stack>

      {/* Frosted Glass Content Card */}
      <Box
        sx={{
          mx: 2,
          borderRadius: 2.75,
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          bgcolor: isDark ? 'rgba(17, 25, 54, 0.85)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          boxShadow: isDark
            ? '0 4px 20px rgba(0, 0, 0, 0.45)'
            : '0 4px 16px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'primary.light',
            boxShadow: isDark
              ? '0 8px 30px rgba(0, 0, 0, 0.55)'
              : '0 8px 24px rgba(0, 0, 0, 0.06)'
          }
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

SectionBlock.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string,
  children: PropTypes.node,
  gradient: PropTypes.string,
  badge: PropTypes.string
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab Panel
// ─────────────────────────────────────────────────────────────────────────────
function TabPanel({ children, value, index }) {
  return (
    <Box role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2, pb: 4 }}>{children}</Box>}
    </Box>
  );
}

TabPanel.propTypes = { children: PropTypes.node, value: PropTypes.number, index: PropTypes.number };

// Helper for computing readable text contrast on arbitrary hex colors
function getContrastColor(hexColor, fallback = '#ffffff') {
  if (!hexColor || typeof hexColor !== 'string') return fallback;
  const hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#0f172a' : '#ffffff';
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#0f172a' : '#ffffff';
  }
  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Customization Drawer
// ─────────────────────────────────────────────────────────────────────────────
export default function Customization() {
  const { colorScheme, mode, setMode } = useColorScheme();
  const theme = useTheme();
  const isDark = colorScheme === 'dark' || mode === 'dark' || theme.palette.mode === 'dark';

  const primaryColor = theme.palette.primary.main || '#6366f1';
  const secondaryColor = theme.palette.secondary.main || '#ec4899';
  const headerTextColor = getContrastColor(primaryColor);
  const isLightHeader = headerTextColor === '#0f172a';

  const {
    state: { notificationMapping, ribbonLayout },
    resetState,
    customizationOpen,
    setCustomizationOpen
  } = useConfig();

  const [tab, setTab] = useState(0);

  let mapping = {};
  try {
    mapping = typeof notificationMapping === 'string'
      ? JSON.parse(notificationMapping)
      : (notificationMapping || {});
  } catch {
    mapping = {};
  }

  const eventKeys = [
    'newTask', 'taskCompleted', 'approvalRequired', 'taskRejected',
    'deadlineReminder', 'overdueTask', 'successMessage',
    'generalNotification', 'errorNotification', 'meetingReminder'
  ];
  const isAllMuted = eventKeys.length > 0 && eventKeys.every((k) => mapping[k] === 'silent');

  const handleToggle = () => setCustomizationOpen(!customizationOpen);
  const handleReset = () => {
    setMode(DEFAULT_THEME_MODE);
    resetState();
  };

  const handleQuickThemeToggle = () => {
    setMode(isDark ? ThemeMode.LIGHT : ThemeMode.DARK);
  };

  // Curated Gradients for section badges
  const G = {
    mode:    'linear-gradient(135deg, #f59e0b, #ef4444)',
    color:   'linear-gradient(135deg, #3b82f6, #6366f1)',
    ribbon:  'linear-gradient(135deg, #8b5cf6, #3b82f6)',
    sidebar: 'linear-gradient(135deg, #10b981, #06b6d4)',
    menu:    'linear-gradient(135deg, #f97316, #fb923c)',
    width:   'linear-gradient(135deg, #0ea5e9, #6366f1)',
    rtl:     'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    input:   'linear-gradient(135deg, #ef4444, #f97316)',
    font:    'linear-gradient(135deg, #2563eb, #7c3aed)',
    size:    'linear-gradient(135deg, #0ea5e9, #2563eb)',
    radius:  'linear-gradient(135deg, #10b981, #0ea5e9)',
    topbar:  'linear-gradient(135deg, #0284c7, #6366f1)'
  };

  return (
    <Drawer
      anchor="right"
      onClose={handleToggle}
      open={customizationOpen}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 420 },
            maxWidth: '100vw',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: isDark ? '#0b0f19' : '#f8faff',
            backgroundImage: isDark
              ? 'linear-gradient(180deg, #0b0f19 0%, #111936 100%)'
              : 'linear-gradient(180deg, #f8faff 0%, #ffffff 100%)',
            borderLeft: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            boxShadow: isDark
              ? '-24px 0 80px rgba(0,0,0,0.7)'
              : '-24px 0 80px rgba(0,0,0,0.12)',
            overflow: 'hidden'
          }
        }
      }}
    >
      {customizationOpen && (
        <>
          {/* ══════════════════════════════════════════════════════════
              EXECUTIVE HEADER — Branded Tab Buttons & Adaptive Theme
          ═══════════════════════════════════════════════════════════ */}
          <Box
            sx={{
              flexShrink: 0,
              bgcolor: isDark ? '#111936' : '#ffffff',
              borderBottom: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
              px: 2.5,
              pt: 2.5,
              pb: 1.5,
              boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.03)'
            }}
          >
            {/* Top Brand & Actions Row */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 3px 10px ${primaryColor}44`,
                    color: '#fff'
                  }}
                >
                  <IconSparkles size={18} strokeWidth={2.4} />
                </Box>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'text.primary',
                        fontWeight: 900,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        fontSize: '1.05rem'
                      }}
                    >
                      Theme Studio
                    </Typography>
                    <Chip
                      label="BOS(S)"
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.55rem',
                        fontWeight: 900,
                        bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                        color: 'text.secondary',
                        borderRadius: 1
                      }}
                    />
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.7rem'
                    }}
                  >
                    Personalize your executive workspace
                  </Typography>
                </Box>
              </Stack>

              {/* Action Buttons */}
              <Stack direction="row" spacing={0.75}>
                {/* Quick Theme Mode Toggle */}
                <Tooltip title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}>
                  <IconButton
                    size="small"
                    onClick={handleQuickThemeToggle}
                    sx={{
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      border: '1px solid',
                      borderColor: 'divider',
                      color: 'text.primary',
                      borderRadius: 1.75,
                      width: 32,
                      height: 32,
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    {isDark ? <IconSun size={15} strokeWidth={2.4} /> : <IconMoon size={15} strokeWidth={2.4} />}
                  </IconButton>
                </Tooltip>

                {/* Reset Defaults */}
                <Tooltip title="Reset all theme settings">
                  <IconButton
                    size="small"
                    onClick={handleReset}
                    sx={{
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      border: '1px solid',
                      borderColor: 'divider',
                      color: 'text.secondary',
                      borderRadius: 1.75,
                      width: 32,
                      height: 32,
                      '&:hover': {
                        bgcolor: 'error.lighter',
                        color: 'error.main',
                        transform: 'rotate(-45deg)'
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    <IconRefresh size={15} strokeWidth={2.4} />
                  </IconButton>
                </Tooltip>

                {/* Close Drawer */}
                <Tooltip title="Close">
                  <IconButton
                    size="small"
                    onClick={handleToggle}
                    sx={{
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      border: '1px solid',
                      borderColor: 'divider',
                      color: 'text.primary',
                      borderRadius: 1.75,
                      width: 32,
                      height: 32,
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s'
                    }}
                  >
                    <IconX size={15} strokeWidth={2.4} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Segmented Pill Tabs Navigation with Colored Active Button */}
            <Box
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                p: 0.5,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
              }}
            >
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="fullWidth"
                sx={{
                  minHeight: 38,
                  '& .MuiTabs-indicator': {
                    display: 'none'
                  },
                  '& .MuiTab-root': {
                    minHeight: 34,
                    borderRadius: 2,
                    color: 'text.secondary',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    py: 0.5,
                    px: 1,
                    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.Mui-selected': {
                      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%) !important`,
                      color: '#ffffff !important',
                      boxShadow: `0 3px 12px ${primaryColor}66`,
                      fontWeight: 900,
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                      transform: 'scale(1.02)'
                    },
                    '&:hover:not(.Mui-selected)': {
                      color: 'text.primary',
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                    }
                  }
                }}
              >
                <Tab
                  id="tab-appearance"
                  icon={<IconBrush size={15} strokeWidth={2.4} />}
                  label="Appearance"
                  iconPosition="start"
                  sx={{ gap: 0.75 }}
                />
                <Tab
                  id="tab-typography"
                  icon={<IconTypography size={15} strokeWidth={2.4} />}
                  label="Typography"
                  iconPosition="start"
                  sx={{ gap: 0.75 }}
                />
                <Tab
                  id="tab-sounds"
                  icon={isAllMuted ? <IconVolumeOff size={15} strokeWidth={2.4} /> : <IconVolume size={15} strokeWidth={2.4} />}
                  label="Sounds"
                  iconPosition="start"
                  sx={{ gap: 0.75 }}
                />
              </Tabs>
            </Box>
          </Box>

          {/* ══════════════════════════════════════════════════════════
              SCROLLABLE BODY
          ═══════════════════════════════════════════════════════════ */}
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <SimpleBar style={{ height: '100%' }}>

              {/* ── TAB 0: APPEARANCE & LAYOUT ─────────────────────── */}
              <TabPanel value={tab} index={0}>

                <SectionBlock icon={IconSun} label="Theme Mode" gradient={G.mode}>
                  <ThemeModeLayout />
                </SectionBlock>

                <SectionBlock icon={IconColorSwatch} label="Preset Palette" gradient={G.color} badge="21 Colors">
                  <PresetColor />
                </SectionBlock>

                <SectionBlock icon={IconLayoutNavbar} label="Top Bar Theme" gradient={G.topbar} badge="20 Styles">
                  <HeaderThemePage />
                </SectionBlock>

                <SectionBlock icon={IconLayoutKanban} label="Ribbon System" gradient={G.ribbon} badge="Pro">
                  <RibbonLayoutPage />
                </SectionBlock>

                {ribbonLayout === RibbonLayout.CLASSIC && (
                  <SectionBlock icon={IconLayoutColumns} label="Menu Card Style" gradient={G.ribbon}>
                    <MenuCardStyle />
                  </SectionBlock>
                )}

                <SectionBlock icon={IconLayoutSidebar} label="Sidebar Behavior" gradient={G.sidebar}>
                  <SidebarDrawer />
                </SectionBlock>

                <SectionBlock icon={IconBrush} label="Menu Orientation" gradient={G.menu}>
                  <MenuOrientation />
                </SectionBlock>

                <SectionBlock icon={IconResize} label="Workspace Width" gradient={G.width}>
                  <BoxContainer />
                </SectionBlock>

                <SectionBlock icon={IconArrowsLeftRight} label="Text Direction" gradient={G.rtl}>
                  <Layout />
                </SectionBlock>

                <SectionBlock icon={IconAlignLeft} label="Input Field Style" gradient={G.input}>
                  <InputFilled />
                </SectionBlock>

              </TabPanel>

              {/* ── TAB 1: TYPOGRAPHY & SHAPES ─────────────────────── */}
              <TabPanel value={tab} index={1}>

                <SectionBlock icon={IconTypography} label="Font Family" gradient={G.font} badge="28 Local Fonts">
                  <FontFamily />
                </SectionBlock>

                <SectionBlock icon={IconTextSize} label="Font Size" gradient={G.size}>
                  <FontSize />
                </SectionBlock>

                <SectionBlock icon={IconBorderRadius} label="Border Radius & Shapes" gradient={G.radius}>
                  <BorderRadius />
                </SectionBlock>

              </TabPanel>

              {/* ── TAB 2: AUDIO & FEEDBACK ───────────────────────── */}
              <TabPanel value={tab} index={2}>
                <NotificationRingtone />
              </TabPanel>

            </SimpleBar>
          </Box>

          {/* ══════════════════════════════════════════════════════════
              FOOTER
          ═══════════════════════════════════════════════════════════ */}
          <Box
            sx={{
              flexShrink: 0,
              px: 2.5,
              py: 1.75,
              borderTop: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
              bgcolor: isDark ? '#111936' : '#ffffff'
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: '#10b981',
                    boxShadow: '0 0 8px #10b981'
                  }}
                />
                <Typography variant="caption" color="text.secondary" fontSize="0.7rem" fontWeight={600}>
                  Instant live apply
                </Typography>
              </Stack>

              <Button
                size="small"
                onClick={handleReset}
                startIcon={<IconRefresh size={13} />}
                sx={{
                  borderRadius: 2,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'error.main',
                  border: '1px solid',
                  borderColor: 'error.light',
                  px: 1.75,
                  '&:hover': {
                    bgcolor: 'error.lighter',
                    borderColor: 'error.main'
                  }
                }}
              >
                Reset Defaults
              </Button>
            </Stack>
          </Box>
        </>
      )}
    </Drawer>
  );
}
