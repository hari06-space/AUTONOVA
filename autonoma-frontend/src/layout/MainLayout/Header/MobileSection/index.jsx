import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

// project imports
import useAuth from 'hooks/useAuth';
import useConfig from 'hooks/useConfig';
import useLookups from 'hooks/useLookups';
import { getUserStorageJson, setUserStorageItem } from 'utils/userStorage';
import { getUserImageUrl } from 'utils/upload-helper';
import axios from 'utils/axios';
import ChangePasswordModal from 'ui-component/ChangePasswordModal';
import WeightCalculator from 'ui-component/WeightCalculator';

// assets
import User1 from 'assets/images/users/avatar-1.png';
import {
  IconMenu2, IconDotsVertical, IconMessage, IconMail, IconCalendar,
  IconAddressBook, IconUsers, IconCalculator, IconBrain, IconBell,
  IconLogout, IconSettings, IconUser, IconKey, IconX, IconChevronRight,
  IconAccessPoint, IconWorld, IconCoffee
} from '@tabler/icons-react';
import { useBossBreak } from 'contexts/BossBreakContext';

// ── Centralized notification count (avoids duplicate polling) ──
// useNotifications (mounted in NotificationSection) keeps this live via WebSocket.
// Reading from Redux is zero-cost — no extra API call needed here.
import { useSelector } from 'store';
import { selectUnreadCount } from 'store/slices/notifications';

const getLangIndicator = (lng) => {
  switch (lng) {
    case 'ta': return 'த';
    case 'hi': return 'ह';
    case 'fr': return 'F';
    case 'ro': return 'R';
    case 'zh': return '中';
    default: return 'E';
  }
};

function applyGoogTransCookie(lng) {
  const googleLang = lng === 'zh' ? 'zh-CN' : lng;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || /^[0-9.]+$/.test(hostname);

  const domains = ['', hostname];
  if (!isLocalhost) {
    domains.push(`.${hostname}`);
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const rootDomain = parts.slice(-2).join('.');
      domains.push(rootDomain, `.${rootDomain}`);
    }
  } else {
    domains.push('.localhost');
  }

  const paths = ['/', window.location.pathname];
  const expire = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; Max-Age=0;';

  domains.forEach((dom) => {
    paths.forEach((p) => {
      if (dom) {
        document.cookie = `googtrans=; ${expire} path=${p}; domain=${dom}`;
      }
      document.cookie = `googtrans=; ${expire} path=${p};`;
    });
  });

  if (lng === 'en') {
    document.cookie = `googtrans=/en/en; path=/;`;
    if (!isLocalhost) {
      document.cookie = `googtrans=/en/en; path=/; domain=${hostname};`;
      document.cookie = `googtrans=/en/en; path=/; domain=.${hostname};`;
    }
    try {
      sessionStorage.removeItem('googtrans');
      localStorage.removeItem('googtrans');
    } catch (_) {}
    return;
  }

  const value = `/en/${googleLang}`;
  document.cookie = `googtrans=${value}; path=/`;
  if (!isLocalhost) {
    document.cookie = `googtrans=${value}; path=/; domain=${hostname}`;
    document.cookie = `googtrans=${value}; path=/; domain=.${hostname}`;
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const rootDomain = parts.slice(-2).join('.');
      document.cookie = `googtrans=${value}; path=/; domain=.${rootDomain}`;
    }
  }
}

export default function MobileSection() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const {
    state: { borderRadius, i18n },
    setField,
    setCustomizationOpen
  } = useConfig();

  const [open, setOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  const isLangMenuOpen = Boolean(langAnchorEl);
  const { openBossBreak } = useBossBreak();

  // ── Notification count — read from Redux (kept live by WebSocket in NotificationSection) ──
  // Removed the previous 15-second polling loop; the WebSocket already pushes updates.
  const unreadNotifsCount = useSelector(selectUnreadCount);

  const [empDesigDept, setEmpDesigDept] = useState('');
  const { departments = [], designations = [], employees = [] } = useLookups(['DEPARTMENTS', 'DESIGNATIONS', 'EMPLOYEES']);

  // Fetch Employee designation & department
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

        setEmpDesigDept([desig, dept].filter(Boolean).join(' / '));
      } else {
        const desig = user.designationName || (typeof user.designation === 'string' ? user.designation : user.designation?.name) || '';
        const dept = user.departmentName || (typeof user.department === 'string' ? user.department : user.department?.name) || '';
        setEmpDesigDept([desig, dept].filter(Boolean).join(' / '));
      }
    } else if (user && employees.length === 0) {
        const desig = user.designationName || (typeof user.designation === 'string' ? user.designation : user.designation?.name) || '';
        const dept = user.departmentName || (typeof user.department === 'string' ? user.department : user.department?.name) || '';
        setEmpDesigDept([desig, dept].filter(Boolean).join(' / '));
    }
  }, [user, departments, designations, employees]);

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
    setOpen(false);
    if (path === 'calculator') {
      setCalcOpen(true);
    } else if (path === 'boss-break') {
      openBossBreak('timer');
    } else if (path !== '#') {
      navigate(path);
    }
  };

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLangClick = (event) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLangClose = () => {
    setLangAnchorEl(null);
  };

  const handleLangSelect = (lng) => {
    handleLangClose();
    setOpen(false);
    if (lng === i18n) return;
    setField('i18n', lng);
    try {
      const STORAGE_KEY = 'berry-config-vite-js';
      const stored = getUserStorageJson(STORAGE_KEY) || {};
      const updated = { ...stored, i18n: lng };
      setUserStorageItem(STORAGE_KEY, updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    applyGoogTransCookie(lng);
    window.location.reload();
  };

  return (
    <>
      {/* Trigger Button: User Avatar with Badge for notification count */}
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          p: 0.5,
          transition: 'all 0.2s ease-in-out',
          '&:hover': { transform: 'scale(1.05)' }
        }}
      >
        <Badge
          color="error"
          badgeContent={unreadNotifsCount}
          max={9}
          sx={{
            '& .MuiBadge-badge': {
              right: 2,
              top: 2,
              border: `2px solid ${theme.palette.background.paper}`,
              padding: '0 4px',
            }
          }}
        >
          <Avatar
            src={user?.imgName ? getUserImageUrl(user.imgName) : User1}
            alt="user-profile"
            sx={{
              width: 36,
              height: 36,
              border: `2px solid ${theme.palette.primary.main}`
            }}
          />
        </Badge>
      </IconButton>

      {/* Slide-out Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: 310,
            bgcolor: theme.palette.mode === 'dark' ? '#111936' : '#ffffff',
            boxShadow: theme.shadows[16],
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* User Card Header */}
        <Box sx={{ p: 2.5, pb: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Avatar
              src={user?.imgName ? getUserImageUrl(user.imgName) : User1}
              sx={{ width: 50, height: 50, border: `2.5px solid ${theme.palette.primary.main}` }}
            />
            <IconButton onClick={() => setOpen(false)} sx={{ mt: -0.5, mr: -0.5 }}>
              <IconX size={20} />
            </IconButton>
          </Stack>

          <Typography variant="h4" sx={{ fontWeight: 800, color: theme.palette.mode === 'dark' ? '#fff' : '#1e293b', mb: 0.5, textTransform: 'capitalize' }}>
            {user?.name || user?.id || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }}>
            {empDesigDept || 'USER DESIGNATION / DEPARTMENT'}
          </Typography>
        </Box>
        <Divider />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5 }}>
          {/* Section 1: Main Tools (Notification & AURA Assistant) */}
          <Typography variant="caption" sx={{ pl: 1, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'text.disabled', display: 'block', mb: 1 }}>
            System Tools
          </Typography>
          <List dense sx={{ mb: 2, p: 0 }}>
            {/* Notification Section */}
            <ListItemButton
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent('toggle-notifications'));
              }}
              sx={{ borderRadius: '8px', mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: theme.palette.warning.dark }}>
                <Badge color="error" badgeContent={unreadNotifsCount} max={99}>
                  <IconBell stroke={1.5} size="22px" />
                </Badge>
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Notifications</Typography>}
                secondary={unreadNotifsCount > 0 ? `${unreadNotifsCount} unread updates` : 'No new notifications'}
              />
              <IconChevronRight size={16} style={{ opacity: 0.5 }} />
            </ListItemButton>

            {/* AURA AI Assistant */}
            <ListItemButton
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent('toggle-aura'));
              }}
              sx={{ borderRadius: '8px', mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: '#0ea5e9' }}>
                <IconBrain stroke={1.5} size="22px" />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>AURA AI Assistant</Typography>}
                secondary="Voice assistant command hub"
              />
              <IconChevronRight size={16} style={{ opacity: 0.5 }} />
            </ListItemButton>

            {/* Language Selector */}
            <ListItemButton onClick={handleLangClick} sx={{ borderRadius: '8px', mb: 0.5 }}>
              <ListItemIcon sx={{ color: theme.palette.primary.main }}>
                <IconWorld stroke={1.5} size="22px" />
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>Language</Typography>}
                secondary={`Selected: ${getLangIndicator(i18n)}`}
              />
              <Typography variant="caption" sx={{ fontWeight: 800, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', color: 'primary.main', px: 1, py: 0.25, borderRadius: '4px', mr: 1 }}>
                {getLangIndicator(i18n)}
              </Typography>
              <IconChevronRight size={16} style={{ opacity: 0.5 }} />
            </ListItemButton>
          </List>

          <Divider sx={{ my: 1.5 }} />

          {/* Section 2: Quick Links */}
          <Typography variant="caption" sx={{ pl: 1, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'text.disabled', display: 'block', mb: 1 }}>
            Quick Links
          </Typography>
          <Grid container spacing={1.5} sx={{ px: 0.5, mb: 2 }}>
            {quickLinks.map((link) => (
              <Grid item xs={6} key={link.label}>
                <Box
                  onClick={() => handleNavigate(link.path)}
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    border: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: link.bg,
                      borderColor: link.color,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ color: link.color }}>{link.icon}</Box>
                  <Typography variant="caption" sx={{ fontWeight: 650, color: 'text.secondary' }}>
                    {link.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 1.5 }} />

          {/* Section 3: Settings & Account */}
          <Typography variant="caption" sx={{ pl: 1, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'text.disabled', display: 'block', mb: 1 }}>
            Settings & Account
          </Typography>
          <List dense sx={{ p: 0 }}>
            <ListItemButton
              onClick={() => {
                setOpen(false);
                setCustomizationOpen(true);
              }}
              sx={{ borderRadius: '8px', mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: 'text.secondary' }}>
                <IconSettings stroke={1.5} size="20px" />
              </ListItemIcon>
              <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 550 }}>Live Customize</Typography>} />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                setOpen(false);
                navigate('/apps/user/account-profile/profile1');
              }}
              sx={{ borderRadius: '8px', mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: 'text.secondary' }}>
                <IconUser stroke={1.5} size="20px" />
              </ListItemIcon>
              <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 550 }}>Account Settings</Typography>} />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                setOpen(false);
                setChangePwdOpen(true);
              }}
              sx={{ borderRadius: '8px', mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: 'text.secondary' }}>
                <IconKey stroke={1.5} size="20px" />
              </ListItemIcon>
              <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 550 }}>Change Password</Typography>} />
            </ListItemButton>

            <ListItemButton onClick={handleLogout} sx={{ borderRadius: '8px', mt: 1, color: '#f44336', '&:hover': { bgcolor: '#ffebee' } }}>
              <ListItemIcon sx={{ color: '#f44336' }}>
                <IconLogout stroke={1.5} size="20px" />
              </ListItemIcon>
              <ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 650 }}>Logout</Typography>} />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* Dialog Modals */}
      <ChangePasswordModal open={changePwdOpen} handleClose={() => setChangePwdOpen(false)} />
      <WeightCalculator open={calcOpen} handleClose={() => setCalcOpen(false)} />

      {/* Language Popup Menu */}
      <Menu
        anchorEl={langAnchorEl}
        open={isLangMenuOpen}
        onClose={handleLangClose}
        PaperProps={{
          sx: {
            mt: 0.5,
            borderRadius: '12px',
            minWidth: 150,
            boxShadow: theme.shadows[8]
          }
        }}
      >
        <MenuItem onClick={() => handleLangSelect('en')} selected={i18n === 'en'}>English (UK)</MenuItem>
        <MenuItem onClick={() => handleLangSelect('ta')} selected={i18n === 'ta'}>தமிழ் (Tamil)</MenuItem>
        <MenuItem onClick={() => handleLangSelect('hi')} selected={i18n === 'hi'}>हिन्दी (Hindi)</MenuItem>
        <MenuItem onClick={() => handleLangSelect('fr')} selected={i18n === 'fr'}>français (French)</MenuItem>
        <MenuItem onClick={() => handleLangSelect('ro')} selected={i18n === 'ro'}>Română (Romanian)</MenuItem>
        <MenuItem onClick={() => handleLangSelect('zh')} selected={i18n === 'zh'}>Chinese</MenuItem>
      </Menu>
    </>
  );
}
