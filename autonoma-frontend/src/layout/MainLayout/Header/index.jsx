import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

// project imports
import LogoSection from '../LogoSection';
import SearchSection from './SearchSection';
import MobileSection from './MobileSection';
import ProfileSection from './ProfileSection';
import LocalizationSection from './LocalizationSection';
import MegaMenuSection from './MegaMenuSection';
import FullScreenSection from './FullScreenSection';
import NotificationSection from './NotificationSection';

import QuickAccessSection from './QuickAccessSection';
import FloatingVoiceAssistant from 'ui-component/ai/FloatingVoiceAssistant';
import ClientNotificationPopupModal from 'ui-component/notifications/ClientNotificationPopupModal';
import ScheduleReminderDialog from './ScheduleReminderDialog';

import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import { MenuOrientation } from 'config';
import useConfig from 'hooks/useConfig';
import useLookups from 'hooks/useLookups';
import axios from 'utils/axios';

// assets
import { IconMenu2, IconLogout, IconUser, IconCake } from '@tabler/icons-react';
import SessionInfoBadge from 'ui-component/SessionInfoBadge';
import useAuth from 'hooks/useAuth';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

export default function Header({ onBirthdayClick }) {
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));

  const {
    state: { menuOrientation }
  } = useConfig();
  const { menuMaster } = useGetMenuMaster();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [openSecretDialog, setOpenSecretDialog] = useState(false);
  const [secretPassword, setSecretPassword] = useState('');
  const [secretError, setSecretError] = useState('');
  const lastClickTimeRef = useRef(0);

  const handleUserBadgeClick = () => {
    if (user?.userLevel >= 5) {
      const now = Date.now();
      const lastClick = lastClickTimeRef.current;
      lastClickTimeRef.current = now;

      setClickCount((prev) => {
        // If time between clicks is more than 1 second (1000ms), reset count to 1
        if (now - lastClick > 1000) {
          return 1;
        }
        const next = prev + 1;
        if (next >= 5) {
          setOpenSecretDialog(true);
          setSecretPassword('');
          setSecretError('');
          return 0;
        }
        return next;
      });
    }
  };

  // Fallback SHA-256 implementation for insecure contexts (non-HTTPS IP access)
  const sha256Fallback = (str) => {
    // A simple standard SHA-256 implementation in pure JS
    const rotateRight = (n, x) => (n >>> x) | (n << (32 - x));
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    let H = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    const words = [];
    const ascii = unescape(encodeURIComponent(str));
    for (let i = 0; i < ascii.length; i++) {
      words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
    }
    const len = ascii.length * 8;
    words[len >> 5] |= 0x80 << (24 - (len % 32));
    words[(((len + 64) >> 9) << 4) + 15] = len;

    for (let i = 0; i < words.length; i += 16) {
      const w = new Array(64);
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];

      for (let j = 0; j < 64; j++) {
        if (j < 16) {
          w[j] = words[i + j] || 0;
        } else {
          const s0 = rotateRight(w[j - 15], 7) ^ rotateRight(w[j - 15], 18) ^ (w[j - 15] >>> 3);
          const s1 = rotateRight(w[j - 2], 17) ^ rotateRight(w[j - 2], 19) ^ (w[j - 2] >>> 10);
          w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
        }

        const S1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[j] + w[j]) | 0;
        const S0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) | 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) | 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) | 0;
      }

      H[0] = (H[0] + a) | 0;
      H[1] = (H[1] + b) | 0;
      H[2] = (H[2] + c) | 0;
      H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0;
      H[5] = (H[5] + f) | 0;
      H[6] = (H[6] + g) | 0;
      H[7] = (H[7] + h) | 0;
    }

    return H.map(x => {
      const hex = (x >>> 0).toString(16);
      return '00000000'.substring(hex.length) + hex;
    }).join('');
  };

  const handleSecretSubmit = async (e) => {
    e.preventDefault();
    const targetHash = '5e20737aa49b9140dd68db75b95ace3750f2d5c3325667f30dbb226895466ad3';
    let hashHex = '';

    if (window.crypto && window.crypto.subtle) {
      const utf8 = new TextEncoder().encode(secretPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback if not running in a secure context (e.g. accessed via HTTP IP address)
      hashHex = sha256Fallback(secretPassword);
    }

    if (hashHex === targetHash) {
      setOpenSecretDialog(false);
      navigate('/vendor-licensing');
    } else {
      setSecretError('Invalid secret key.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downMD;

  const [empDesig, setEmpDesig] = useState('');
  const [empDept, setEmpDept] = useState('');
  const { departments = [], designations = [], employees = [] } = useLookups(['DEPARTMENTS', 'DESIGNATIONS', 'EMPLOYEES']);

  useEffect(() => {
    if (user && employees.length > 0) {
      const allEmps = employees;
      const empRecord = allEmps.find(e =>
        (e.id && user.empId && String(e.id) === String(user.empId)) ||
        (e.empCode && user.empCode && String(e.empCode) === String(user.empCode))
      );
      if (empRecord) {
        const getDesigName = (id, fallback) => String(designations.find(d => String(d.id) === String(id))?.designationName || fallback || '');
        const getDeptName = (id, fallback) => String(departments.find(d => String(d.id) === String(id))?.departmentName || fallback || '');

        const desig = empRecord.designationId ? getDesigName(empRecord.designationId, empRecord.designationName || empRecord.designation) : (user.designationName || (typeof user.designation === 'string' ? user.designation : user.designation?.name) || empRecord.designationName || empRecord.designation || '');
        const dept = empRecord.departmentId ? getDeptName(empRecord.departmentId, empRecord.departmentName || empRecord.department) : (user.departmentName || (typeof user.department === 'string' ? user.department : user.department?.name) || empRecord.departmentName || empRecord.department || '');

        setEmpDesig(desig);
        setEmpDept(dept);
      } else {
        setEmpDesig(user.designationName || (typeof user.designation === 'string' ? user.designation : user.designation?.name) || '');
        setEmpDept(user.departmentName || (typeof user.department === 'string' ? user.department : user.department?.name) || '');
      }
    } else if (user && employees.length === 0) {
      setEmpDesig(user.designationName || (typeof user.designation === 'string' ? user.designation : user.designation?.name) || '');
      setEmpDept(user.departmentName || (typeof user.department === 'string' ? user.department : user.department?.name) || '');
    }
  }, [user, departments, designations, employees]);

  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    if (user) {
      axios.get('/api/master/hr/employees/birthdays/upcoming')
        .then((response) => {
          if (response.data) {
            const todayDay = new Date().getDate();
            const todayCount = response.data.filter(emp => {
              if (!emp.birthDate) return false;
              return new Date(emp.birthDate).getDate() === todayDay;
            }).length;
            setUpcomingCount(todayCount);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch upcoming birthdays count:', err);
        });
    }
  }, [user]);

  return (
    <>
      {/* logo & toggler button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1, md: 2 }, mr: { xs: 0.5, sm: 1, md: 2 } }}>
        <Box component="span" sx={{ display: { xs: 'none', md: 'block' } }}>
          <LogoSection />
        </Box>
        {!isHorizontal && (
          <Avatar
            variant="rounded"
            sx={{
              ...theme.typography.commonAvatar,
              ...theme.typography.mediumAvatar,
              overflow: 'hidden',
              transition: 'all .2s ease-in-out',
              color: theme.vars.palette.secondary.dark,
              background: theme.vars.palette.secondary.light,
              '&:hover': {
                color: theme.vars.palette.secondary.light,
                background: theme.vars.palette.secondary.dark
              },
              ...theme.applyStyles('dark', {
                color: theme.vars.palette.secondary.main,
                background: theme.vars.palette.dark.main,
                '&:hover': {
                  color: theme.vars.palette.secondary.light,
                  background: theme.vars.palette.secondary.main
                }
              })
            }}
            onClick={() => handlerDrawerOpen(!drawerOpen)}
          >
            <IconMenu2 stroke={1.5} size="20px" />
          </Avatar>
        )}
        <SessionInfoBadge />

        {/* User Info near Company Info */}
        {user && (
          <Box
            onClick={handleUserBadgeClick}
            style={{ cursor: user?.userLevel >= 5 ? 'pointer' : 'default' }}
            sx={{
              display: { xs: 'none', lg: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              px: 1.5,
              py: 0.5,
              ml: 1,
              borderRadius: '12px',
              bgcolor: 'transparent',
              background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
              border: 'none',
              boxShadow: `0 4px 14px ${theme.palette.secondary.main}45`,
              minWidth: 0,
              maxWidth: { xs: 160, sm: 300, md: 450 }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.2 }}>
              <IconUser size={15} stroke={2} style={{ color: '#fff', flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                {user?.id || user?.name || 'User'}
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.65rem' }}>
              {[empDesig, empDept].filter(Boolean).join(' / ')}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Global Header Search + Session Context */}
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 0.5, sm: 1, md: 2 }, gap: { xs: 0.5, sm: 1, md: 1.5 } }}>
        <Box sx={{ flexGrow: 1 }} />
        <SearchSection />
      </Box>

      {/* mega-menu
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <MegaMenuSection />
      </Box> */}

      {/* live customization & localization */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <LocalizationSection />
      </Box>

      {/* notification */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <NotificationSection />
      </Box>

      {/* birthday icon */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, ml: 1.5 }}>
        <Tooltip title="Upcoming Birthdays" placement="bottom" arrow>
          <Badge
            badgeContent={upcomingCount}
            color="error"
            invisible={upcomingCount === 0}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                height: 16,
                minWidth: 16
              }
            }}
          >
            <Avatar
              variant="rounded"
              sx={{
                ...theme.typography.mediumAvatar,
                background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 50%, #ffa502 100%)',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(255, 71, 87, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: 'pulse-birthday 2s infinite',
                '@keyframes pulse-birthday': {
                  '0%': { boxShadow: '0 0 0 0 rgba(255, 71, 87, 0.6)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(255, 71, 87, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(255, 71, 87, 0)' }
                },
                '&:hover': {
                  transform: 'translateY(-3px) scale(1.05)',
                  background: 'linear-gradient(135deg, #ff6b81 0%, #ff4757 50%, #eccc68 100%)',
                  boxShadow: '0 8px 25px rgba(255, 71, 87, 0.5)',
                }
              }}
              onClick={onBirthdayClick}
              aria-label="upcoming-birthdays"
              style={{ cursor: 'pointer' }}
            >
              <IconCake stroke={2.2} size="22px" />
            </Avatar>
          </Badge>
        </Tooltip>
      </Box>

      {/* Client Active Notification Popup */}
      <ClientNotificationPopupModal />

      {/* AURA Assistant */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <FloatingVoiceAssistant />
      </Box>

      {/* full sceen toggler */}
      <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
        <FullScreenSection />
      </Box>

      {/* profile */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <ProfileSection />
      </Box>

      {/* Quick Access */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <QuickAccessSection />
      </Box>

      {/* Logout Button */}
      <Box sx={{ ml: 1, display: { xs: 'none', md: 'block' } }}>
        <Tooltip title="Logout (Space + L)" placement="bottom" arrow>
          <Avatar
            variant="rounded"
            sx={{
              ...theme.typography.commonAvatar,
              ...theme.typography.mediumAvatar,
              transition: 'all .2s cubic-bezier(0.4, 0, 0.2, 1)',
              color: '#ffffff',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
              boxShadow: `0 4px 14px ${theme.palette.error.main}45`,
              '&:hover': {
                color: '#fff',
                background: `linear-gradient(135deg, ${theme.palette.error.light}, ${theme.palette.error.main})`,
                boxShadow: `0 6px 20px ${theme.palette.error.main}60`,
                transform: 'translateY(-2px)'
              }
            }}
            onClick={handleLogout}
            aria-label="logout"
            data-shortcut="logout"
          >
            <IconLogout stroke={2} size="20px" />
          </Avatar>
        </Tooltip>
      </Box>

      {/* mobile header */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        <MobileSection />
      </Box>

      {/* Secret Licensing Dialog */}
      <Dialog open={openSecretDialog} onClose={() => setOpenSecretDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSecretSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Licensing Console Access</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {secretError && <Alert severity="error">{secretError}</Alert>}
              <TextField
                label="Enter Admin Passphrase"
                type="password"
                fullWidth
                value={secretPassword}
                onChange={(e) => setSecretPassword(e.target.value)}
                required
                autoFocus
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenSecretDialog(false)} variant="outlined">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="secondary">
              Unlock Console
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Daily Meeting / Schedule Reminder Popup Dialog */}
      <ScheduleReminderDialog />
    </>
  );
}
