import React from 'react';
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import { IconCoffee } from '@tabler/icons-react';
import { useBossBreak } from 'contexts/BossBreakContext';

export default function BossBreakButton() {
  const theme = useTheme();
  const { openBossBreak } = useBossBreak();

  const handleOpen = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    openBossBreak('timer');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-boss-break', { detail: { tab: 'timer' } }));
    }
  };

  return (
    <Box sx={{ ml: 1 }}>
      <Tooltip title="☕ BOSS Break / Mind Refresh" placement="bottom" arrow>
        <ButtonBase
          onClick={handleOpen}
          sx={{ borderRadius: '12px' }}
          aria-label="boss-break-launcher"
        >
          <Avatar
            variant="rounded"
            sx={{
              ...theme.typography.commonAvatar,
              ...theme.typography.mediumAvatar,
              cursor: 'pointer',
              transition: 'all .2s cubic-bezier(0.4, 0, 0.2, 1)',
              color: '#ffffff',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.6)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <IconCoffee stroke={2} size="20px" />
          </Avatar>
        </ButtonBase>
      </Tooltip>
    </Box>
  );
}
