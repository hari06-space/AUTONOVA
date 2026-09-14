import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import Tooltip from '@mui/material/Tooltip';

// project imports
import WeightCalculator from 'ui-component/WeightCalculator';
import ChangePasswordModal from 'ui-component/ChangePasswordModal';

// assets
import { IconApps, IconMessage, IconMail, IconCalendar, IconAddressBook, IconUsers, IconX, IconCalculator, IconKey, IconCoffee } from '@tabler/icons-react';
import { useBossBreak } from 'contexts/BossBreakContext';

// ==============================|| QUICK ACCESS SECTION ||============================== //

export default function QuickAccessSection() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const { openBossBreak } = useBossBreak();

  const quickLinks = [
    { label: 'Chat', icon: <IconMessage stroke={1.5} size="20px" />, path: '/apps/chat', color: '#0288d1', bg: '#e1f5fe' },
    { label: 'Mail', icon: <IconMail stroke={1.5} size="20px" />, path: '/apps/mail', color: '#d32f2f', bg: '#ffebee' },
    { label: 'Calendar', icon: <IconCalendar stroke={1.5} size="20px" />, path: '/apps/calendar', color: '#ed6c02', bg: '#fff3e0' },
    { label: 'Contacts', icon: <IconAddressBook stroke={1.5} size="20px" />, path: '/apps/contact/c-card', color: '#2e7d32', bg: '#e8f5e9' },
    { label: 'BOSS Break', icon: <IconCoffee stroke={1.5} size="20px" />, path: 'boss-break', color: '#d97706', bg: '#fef3c7' },
    { label: 'Live Users', icon: <IconUsers stroke={1.5} size="20px" />, path: '#', color: '#9c27b0', bg: '#f3e5f5' },
    { label: 'Calculator', icon: <IconCalculator stroke={1.5} size="20px" />, path: 'calculator', color: '#00897b', bg: '#e0f2f1' },
  ];

  const handleNavigate = (path) => {
    if (path === 'calculator') {
      setCalcOpen(true);
      setOpen(false);
    } else if (path === 'boss-break') {
      openBossBreak('timer');
      setOpen(false);
    } else if (path !== '#') {
      navigate(path);
      setOpen(false);
    }
  };

  return (
    <>
      <Box sx={{ ml: 1, position: 'relative', width: 34, height: 34, zIndex: 1300 }}>
        <SpeedDial
          ariaLabel="Quick Access Menu"
          direction="down"
          icon={<SpeedDialIcon icon={<IconApps stroke={1.5} size="20px" />} openIcon={<IconX stroke={1.5} size="20px" />} />}
          onClose={() => setOpen(false)}
          onOpen={() => setOpen(true)}
          open={open}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            '& .MuiSpeedDial-fab': {
              margin: 0
            },
            '& .MuiSpeedDial-actions': {
              paddingTop: '16px'
            }
          }}
          FabProps={{
            variant: 'rounded',
            sx: {
              ...theme.typography.commonAvatar,
              ...theme.typography.mediumAvatar,
              boxShadow: 'none',
              minHeight: '34px',
              width: '36px',
              height: '36px',
              transition: 'all .2s cubic-bezier(0.4,0,0.2,1)',
              color: '#ffffff',
              background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
                boxShadow: `0 6px 20px ${theme.palette.success.main}60`,
                transform: 'translateY(-1px)'
              }
            }
          }}
        >
          {quickLinks.map((action) => (
            <SpeedDialAction
              key={action.label}
              icon={action.icon}
              tooltipTitle={action.label}
              onClick={() => handleNavigate(action.path)}
              sx={{ margin: '4px 0' }}
              FabProps={{
                sx: {
                  backgroundColor: `${action.bg} !important`,
                  color: `${action.color} !important`,
                  boxShadow: `${theme.shadows[2]} !important`,
                  '&:hover': {
                    backgroundColor: `${action.color} !important`,
                    color: '#ffffff !important'
                  }
                }
              }}
            />
          ))}
        </SpeedDial>
      </Box>

      <WeightCalculator open={calcOpen} handleClose={() => setCalcOpen(false)} />
    </>
  );
}
