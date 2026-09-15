// Organization: AUTONOVA
// Updated By: hari06-space
// Updated At: 2026-09-04
// Description: Ultra-premium Ribbon Layout selector with futuristic cards, badges and active glow.

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

// project imports
import { RibbonLayout } from 'config';
import useConfig from 'hooks/useConfig';

// assets
import { IconRocket, IconLayoutNavbar, IconMail, IconCheck, IconAtom } from '@tabler/icons-react';

const OPTIONS = [
  {
    value: RibbonLayout.QUANTUM,
    label: 'Quantum',
    sub: 'Command Deck',
    badge: 'ULTRA',
    Icon: IconAtom,
    color: '#8b5cf6',
    desc: 'Quantum Command Deck with spotlight search & ambient glow'
  },
  {
    value: RibbonLayout.SPEED_DIAL,
    label: 'Speed Dial',
    sub: 'Quick Floating',
    badge: 'PRO',
    Icon: IconRocket,
    color: '#ec4899',
    desc: 'Speed Dial Navigation with quick floating actions'
  },
  {
    value: RibbonLayout.CLASSIC,
    label: 'Standard',
    sub: 'Full Toolbar',
    badge: null,
    Icon: IconLayoutNavbar,
    color: '#3b82f6',
    desc: 'Standard multi-tab ERP navigation ribbon'
  },
  {
    value: RibbonLayout.OUTLOOK,
    label: 'Compact',
    sub: 'Minimal Bar',
    badge: null,
    Icon: IconMail,
    color: '#f59e0b',
    desc: 'Compact Outlook-style minimal horizontal bar'
  }
];

export default function RibbonLayoutPage() {
  const {
    state: { ribbonLayout },
    setField
  } = useConfig();

  const currentLayout = ribbonLayout || RibbonLayout.CLASSIC;

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1.25
        }}
      >
        {OPTIONS.map(({ value, label, sub, badge, Icon, color, desc }) => {
          const active = currentLayout === value;
          return (
            <Tooltip key={value} title={desc} placement="top" arrow>
              <Box
                onClick={() => setField('ribbonLayout', value)}
                sx={{
                  position: 'relative',
                  p: 1.5,
                  borderRadius: 2.5,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: active ? color : 'divider',
                  bgcolor: active ? `${color}14` : 'transparent',
                  boxShadow: active ? `0 0 16px ${color}33` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.75,
                  transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: color,
                    bgcolor: `${color}0c`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 16px ${color}25`
                  }
                }}
              >
                {/* Active check pill */}
                {active && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: color,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 2px 6px ${color}66`
                    }}
                  >
                    <IconCheck size={10} strokeWidth={3.5} />
                  </Box>
                )}

                {/* Badge if any */}
                {badge && (
                  <Chip
                    label={badge}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 6,
                      left: 6,
                      height: 14,
                      fontSize: '0.52rem',
                      fontWeight: 900,
                      bgcolor: color,
                      color: '#fff',
                      lineHeight: 1,
                      px: 0.2
                    }}
                  />
                )}

                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: active ? `${color}25` : 'action.hover',
                    color: active ? color : 'text.secondary',
                    mt: badge ? 0.5 : 0
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="caption"
                    display="block"
                    fontWeight={active ? 800 : 600}
                    sx={{
                      fontSize: '0.72rem',
                      letterSpacing: '0.02em',
                      color: active ? color : 'text.primary'
                    }}
                  >
                    {label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>
                    {sub}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
