import { useState } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme, alpha } from '@mui/material/styles';

// assets
import { IconBuilding, IconBuildingFactory2, IconChevronDown, IconArrowsLeftRight } from '@tabler/icons-react';

// project imports
import useAuth from 'hooks/useAuth';
import axios from 'utils/axios';

import useMediaQuery from '@mui/material/useMediaQuery';

// ==============================|| SESSION INFO BADGE ||============================== //

export default function SessionInfoBadge() {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, switchContext } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const open = Boolean(anchorEl);

  const handleClick = async (event) => {
    setAnchorEl(event.currentTarget);
    if (options.length === 0) {
      setLoading(true);
      try {
        const res = await axios.get('/api/account/switch-options');
        setOptions(res.data);
      } catch (err) {
        console.error('Failed to load switch options:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSwitch = (tenantId, divisionId) => {
    handleClose();
    switchContext(tenantId, divisionId);
  };

  const companyName = user?.companyName || sessionStorage.getItem('companyName') || null;
  const divisionName = user?.divisionName || sessionStorage.getItem('divisionName') || null;

  if (!companyName && !divisionName) return null;

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0.5, sm: 1 },
          px: { xs: 1, sm: 1.5 },
          py: 0.7,
          borderRadius: '12px',
          cursor: 'pointer',
          bgcolor: 'transparent',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          border: 'none',
          color: '#ffffff',
          boxShadow: `0 4px 14px ${theme.palette.primary.main}45`,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          maxWidth: { xs: 140, sm: 280, md: 380, lg: 500 },
          '&:hover': {
            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            transform: 'translateY(-1px)',
            boxShadow: `0 6px 20px ${theme.palette.primary.main}60`
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
          <IconBuilding size={16} stroke={2} style={{ color: '#fff', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem' }}>
            {companyName}
          </Typography>
        </Box>

        {divisionName && !downSM && (
          <>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 300, mx: 0.2 }}>/</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
              <IconBuildingFactory2 size={15} stroke={2} style={{ color: '#fff', flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem' }}>
                {divisionName}
              </Typography>
            </Box>
          </>
        )}

        <IconChevronDown size={14} stroke={2} style={{ color: 'rgba(255,255,255,0.7)', marginLeft: 4 }} />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: '16px',
            minWidth: 280,
            boxShadow: theme.customShadows?.z16 || '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
            bgcolor: 'background.paper',
            WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)'
          }
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >

        <Divider sx={{ opacity: 0.6 }} />

        {loading ? (
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box
            sx={{
              maxHeight: 320,
              overflowY: 'auto',
              pr: 0.5,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { bgcolor: alpha(theme.palette.divider, 0.05), borderRadius: '6px' },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: '6px',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.4) }
              }
            }}
          >
            {options
              .filter((opt) => opt.company.companyName === companyName || opt.company.dbSourceName === sessionStorage.getItem('tenantId'))
              .map((opt, idx) => (
                <Box key={idx}>
                  <Box sx={{ px: 2, py: 1, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.disabled' }}>
                      {opt.company.companyName}
                    </Typography>
                  </Box>
                  {opt.divisions.map((div) => (
                    <MenuItem
                      key={div.id}
                      onClick={() => handleSwitch(opt.company.dbSourceName, div.id)}
                      selected={div.divisionName === divisionName && opt.company.companyName === companyName}
                      sx={{
                        py: 1.2,
                        mx: 1,
                        borderRadius: '8px',
                        '&.Mui-selected': {
                          bgcolor: alpha(theme.palette.secondary.main, 0.1),
                          '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.15) }
                        }
                      }}
                    >
                      <IconBuildingFactory2 size={16} stroke={1.5} style={{ marginRight: 12, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{div.divisionName}</Typography>
                    </MenuItem>
                  ))}
                </Box>
              ))}
          </Box>
        )}
      </Menu>
    </>
  );
}
