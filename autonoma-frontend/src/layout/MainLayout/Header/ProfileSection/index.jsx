// Organization: AUTONOVA
// Owner: hari06-space
// Created At: 2026-09-04
// Description: Ultra-luxury Executive Profile Popper & User Quick Controls Dropdown.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme, alpha } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

// third party
import { FormattedMessage } from 'react-intl';

// project imports
import Transitions from 'ui-component/extended/Transitions';
import useAuth from 'hooks/useAuth';
import useLookups from 'hooks/useLookups';
import { getUserImageUrl } from 'utils/upload-helper';
import ChangePasswordModal from 'ui-component/ChangePasswordModal';
import useConfig from 'hooks/useConfig';
import { useBossBreak } from 'contexts/BossBreakContext';

// assets
import User1 from 'assets/images/users/avatar-1.png';
import {
  IconLogout,
  IconSettings,
  IconUser,
  IconKey,
  IconCoffee,
  IconMoonStars,
  IconBellRinging,
  IconChevronRight
} from '@tabler/icons-react';

// ==============================|| PROFILE MENU ||============================== //

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning,';
  if (h < 17) return 'Good Afternoon,';
  return 'Good Evening,';
}

export default function ProfileSection() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const {
    state: { dndMode, allowNotifications },
    setField,
    setCustomizationOpen
  } = useConfig();
  const navigate = useNavigate();

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { logout, user } = useAuth();
  const { departments = [], designations = [], levels = [], designationLevels = [], employees = [] } = useLookups([
    'DEPARTMENTS',
    'DESIGNATIONS',
    'LEVELS',
    'DESIGNATION_LEVELS',
    'EMPLOYEES'
  ]);
  const finalLevels = levels.length > 0 ? levels : designationLevels;
  const [open, setOpen] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const { openBossBreak } = useBossBreak();

  const [empInfo, setEmpInfo] = useState('Loading...');

  useEffect(() => {
    if (user && employees.length > 0) {
      const allEmps = employees;
      const empRecord = allEmps.find(
        (e) =>
          (e.id && user.empId && String(e.id) === String(user.empId)) ||
          (e.empCode && user.empCode && String(e.empCode) === String(user.empCode))
      );
      if (empRecord) {
        const getDesigName = (id, fallback) =>
          String(designations.find((d) => String(d.id) === String(id))?.designationName || fallback || '');
        const getDeptName = (id, fallback) =>
          String(departments.find((d) => String(d.id) === String(id))?.departmentName || fallback || '');
        const getLevelName = (id, fallback) => {
          const match = (finalLevels || []).find((l) => String(l.rowId || l.id) === String(id));
          return String(match?.level || match?.levelName || fallback || '');
        };

        const fallbackDesig =
          empRecord.designationName ||
          (typeof empRecord.designation === 'string' ? empRecord.designation : empRecord.designation?.designationName) ||
          '';
        const fallbackDept =
          empRecord.departmentName ||
          (typeof empRecord.department === 'string' ? empRecord.department : empRecord.department?.departmentName) ||
          '';
        const fallbackLevel =
          empRecord.levelName ||
          (typeof empRecord.level === 'string'
            ? empRecord.level
            : empRecord.level?.levelName || empRecord.level?.level) ||
          '';

        const desig = empRecord.designationId
          ? getDesigName(empRecord.designationId, fallbackDesig)
          : user.designationName ||
            (typeof user.designation === 'string' ? user.designation : user.designation?.name) ||
            fallbackDesig;
        const dept = empRecord.departmentId
          ? getDeptName(empRecord.departmentId, fallbackDept)
          : user.departmentName ||
            (typeof user.department === 'string' ? user.department : user.department?.name) ||
            fallbackDept;
        const level = empRecord.empLevelId
          ? getLevelName(empRecord.empLevelId, fallbackLevel)
          : user.levelName ||
            (typeof user.level === 'string' ? user.level : user.level?.name) ||
            fallbackLevel;

        const empName =
          empRecord.employeeName ||
          empRecord.empName ||
          empRecord.name ||
          (empRecord.firstName ? `${empRecord.firstName} ${empRecord.lastName || ''}`.trim() : '');
        const combinedText = (level ? `${level} - ` : '') + [desig, dept].filter(Boolean).join(' / ');
        const finalText = [empName, combinedText].filter(Boolean).join(' • ');
        setEmpInfo(finalText.toUpperCase() || 'USER');
      } else {
        const empName = user.employeeName || user.name || '';
        const desig =
          user.designationName || (typeof user.designation === 'string' ? user.designation : user.designation?.name) || '';
        const dept =
          user.departmentName || (typeof user.department === 'string' ? user.department : user.department?.name) || '';
        const combinedText = [desig, dept].filter(Boolean).join(' / ');
        const finalText = [empName, combinedText].filter(Boolean).join(' • ');
        setEmpInfo(finalText.toUpperCase() || 'USER');
      }
    } else if (user && employees.length === 0) {
      const empName = user.employeeName || user.name || '';
      const desig =
        user.designationName || (typeof user.designation === 'string' ? user.designation : user.designation?.name) || '';
      const dept =
        user.departmentName || (typeof user.department === 'string' ? user.department : user.department?.name) || '';
      const combinedText = [desig, dept].filter(Boolean).join(' / ');
      const finalText = [empName, combinedText].filter(Boolean).join(' • ');
      setEmpInfo(finalText.toUpperCase() || 'USER');
    }
  }, [user, departments, designations, levels, finalLevels, employees]);

  const anchorRef = useRef(null);
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  const handleListItemClick = (event, index, route = '') => {
    setSelectedIndex(index);
    handleClose(event);

    if (route && route !== '') {
      navigate(route);
    }
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }

    prevOpen.current = open;
  }, [open]);

  return (
    <>
      <Stack
        direction="row"
        sx={{
          ml: 2,
          height: '46px',
          alignItems: 'center',
          borderRadius: '26px',
          background: isDark
            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
            : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          boxShadow: isDark
            ? '0 4px 14px rgba(0, 0, 0, 0.4)'
            : `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.25)',
          px: 0.75,
          gap: 0.75,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Tooltip
          placement="bottom"
          title={
            user?.imgName ? (
              <img
                src={getUserImageUrl(user.imgName)}
                alt="Enlarged User"
                style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'contain' }}
              />
            ) : (
              ''
            )
          }
        >
          <Avatar
            src={user?.imgName ? getUserImageUrl(user.imgName) : User1}
            alt="user-images"
            sx={{
              typography: 'mediumAvatar',
              cursor: 'pointer',
              width: 34,
              height: 34,
              transition: 'all 0.22s ease-in-out',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              '&:hover': { transform: 'scale(1.06)', boxShadow: '0 0 12px rgba(255,255,255,0.6)' }
            }}
            ref={anchorRef}
            aria-controls={open ? 'menu-list-grow' : undefined}
            aria-haspopup="true"
            onClick={handleToggle}
          />
        </Tooltip>
        <Tooltip title="Customize Theme & Layout" placement="bottom" arrow>
          <IconButton
            color="inherit"
            onClick={() => setCustomizationOpen(true)}
            sx={{
              p: 0.6,
              color: '#fff',
              borderRadius: '50%',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.18)',
                transform: 'rotate(45deg)'
              }
            }}
            aria-label="live-customize"
            data-shortcut="settings"
          >
            <IconSettings stroke={1.8} size="22px" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 12]
            }
          }
        ]}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Transitions in={open} {...TransitionProps}>
              <Paper
                elevation={0}
                sx={{
                  width: 340,
                  maxWidth: '92vw',
                  borderRadius: 3.5,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  boxShadow: isDark
                    ? '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 24px rgba(99, 102, 241, 0.15)'
                    : '0 20px 45px rgba(15, 23, 42, 0.14), 0 4px 16px rgba(0, 0, 0, 0.04)',
                  bgcolor: isDark ? '#0f172a' : '#ffffff',
                  backdropFilter: 'blur(20px)'
                }}
              >
                {open && (
                  <Box>
                    {/* Executive Hero Header Banner */}
                    <Box
                      sx={{
                        p: 2.25,
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)'
                          : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                        borderBottom: '1px solid',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Ambient background aura */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -24,
                          right: -24,
                          width: 110,
                          height: 110,
                          borderRadius: '50%',
                          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.22)} 0%, transparent 70%)`,
                          pointerEvents: 'none'
                        }}
                      />

                      <Stack direction="row" spacing={1.75} alignItems="center">
                        <Box sx={{ position: 'relative' }}>
                          <Avatar
                            src={user?.imgName ? getUserImageUrl(user.imgName) : User1}
                            alt="user-avatar"
                            sx={{
                              width: 48,
                              height: 48,
                              border: '2.5px solid',
                              borderColor: 'primary.main',
                              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 1,
                              right: 1,
                              width: 11,
                              height: 11,
                              borderRadius: '50%',
                              bgcolor: '#22c55e',
                              border: '2px solid #fff',
                              boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)'
                            }}
                          />
                        </Box>

                        <Stack spacing={0.4} sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontWeight: 600,
                              fontSize: '0.72rem',
                              letterSpacing: 0.3
                            }}
                          >
                            {getGreeting()}
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={{
                              fontWeight: 700,
                              color: 'text.primary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '1rem'
                            }}
                          >
                            {user?.employeeName || user?.userName || user?.name || user?.id || 'User'}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'primary.main',
                              fontWeight: 600,
                              fontSize: '0.68rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block'
                            }}
                          >
                            {empInfo}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>

                    {/* Quick Controls Card (DND & Notifications) */}
                    <Box sx={{ px: 2, pt: 1.75, pb: 1 }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.25,
                          borderRadius: 2.5,
                          bgcolor: isDark ? 'rgba(15, 23, 42, 0.65)' : '#f8fafc',
                          border: '1px solid',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.9)',
                          boxShadow: isDark ? 'inset 0 1px 2px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" spacing={1.25} alignItems="center">
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 1.75,
                                  bgcolor: isDark ? 'rgba(168, 85, 247, 0.2)' : '#f3e8ff',
                                  color: isDark ? '#c084fc' : '#7e22ce',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <IconMoonStars size={16} strokeWidth={2} />
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.82rem' }}>
                                Start DND Mode
                              </Typography>
                            </Stack>
                            <Switch
                              color="primary"
                              checked={dndMode}
                              onChange={(e) => setField('dndMode', e.target.checked)}
                              name="dndMode"
                              size="small"
                            />
                          </Stack>

                          <Divider sx={{ borderStyle: 'dashed', opacity: 0.5 }} />

                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" spacing={1.25} alignItems="center">
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 1.75,
                                  bgcolor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
                                  color: isDark ? '#fbbf24' : '#b45309',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <IconBellRinging size={16} strokeWidth={2} />
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.82rem' }}>
                                Allow Notifications
                              </Typography>
                            </Stack>
                            <Switch
                              color="warning"
                              checked={allowNotifications}
                              onChange={(e) => setField('allowNotifications', e.target.checked)}
                              name="allowNotifications"
                              size="small"
                            />
                          </Stack>
                        </Stack>
                      </Paper>
                    </Box>

                    {/* Navigation Menu List */}
                    <Box sx={{ px: 1.5, pb: 1.5 }}>
                      <List
                        component="nav"
                        disablePadding
                        sx={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5
                        }}
                      >
                        {/* Account Settings */}
                        <ListItemButton
                          sx={{
                            borderRadius: 2,
                            py: 0.9,
                            px: 1.25,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(37, 99, 235, 0.06)',
                              transform: 'translateX(4px)'
                            }
                          }}
                          selected={selectedIndex === 0}
                          onClick={(event) => handleListItemClick(event, 0, '/apps/user/account-profile/profile1')}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1.75,
                                bgcolor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#e0f2fe',
                                color: isDark ? '#38bdf8' : '#0284c7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <IconSettings stroke={1.8} size="16px" />
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.84rem' }}>
                                <FormattedMessage id="account-settings" />
                              </Typography>
                            }
                          />
                          <IconChevronRight size={14} opacity={0.4} />
                        </ListItemButton>

                        {/* Social Profile */}
                        <ListItemButton
                          sx={{
                            borderRadius: 2,
                            py: 0.9,
                            px: 1.25,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(34, 197, 94, 0.06)',
                              transform: 'translateX(4px)'
                            }
                          }}
                          selected={selectedIndex === 1}
                          onClick={(event) => handleListItemClick(event, 1, '/apps/user/social-profile/posts')}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1.75,
                                bgcolor: isDark ? 'rgba(34, 197, 94, 0.18)' : '#dcfce7',
                                color: isDark ? '#4ade80' : '#15803d',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <IconUser stroke={1.8} size="16px" />
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.84rem' }}>
                                  <FormattedMessage id="social-profile" />
                                </Typography>
                                <Chip
                                  label="02"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7',
                                    color: isDark ? '#4ade80' : '#15803d',
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(34, 197, 94, 0.35)' : '#86efac'
                                  }}
                                />
                              </Stack>
                            }
                          />
                        </ListItemButton>

                        {/* Change Password */}
                        <ListItemButton
                          sx={{
                            borderRadius: 2,
                            py: 0.9,
                            px: 1.25,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(147, 51, 234, 0.06)',
                              transform: 'translateX(4px)'
                            }
                          }}
                          selected={selectedIndex === 2}
                          onClick={() => {
                            setChangePwdOpen(true);
                            setOpen(false);
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1.75,
                                bgcolor: isDark ? 'rgba(168, 85, 247, 0.18)' : '#f3e8ff',
                                color: isDark ? '#c084fc' : '#7e22ce',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <IconKey stroke={1.8} size="16px" />
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.84rem' }}>
                                Change Password
                              </Typography>
                            }
                          />
                          <IconChevronRight size={14} opacity={0.4} />
                        </ListItemButton>

                        {/* BOSS Break */}
                        <ListItemButton
                          sx={{
                            borderRadius: 2,
                            py: 0.9,
                            px: 1.25,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                              transform: 'translateX(4px)'
                            }
                          }}
                          selected={selectedIndex === 3}
                          onClick={() => {
                            openBossBreak('timer');
                            setOpen(false);
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1.75,
                                bgcolor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#fef3c7',
                                color: isDark ? '#fbbf24' : '#b45309',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <IconCoffee stroke={1.8} size="16px" />
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.84rem' }}>
                                  BOSS Break
                                </Typography>
                                <Chip
                                  label="Refresh"
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
                                    color: isDark ? '#fbbf24' : '#b45309',
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a'
                                  }}
                                />
                              </Stack>
                            }
                          />
                        </ListItemButton>

                        <Divider sx={{ my: 0.5 }} />

                        {/* Logout */}
                        <ListItemButton
                          sx={{
                            borderRadius: 2,
                            py: 0.9,
                            px: 1.25,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                              transform: 'translateX(4px)'
                            }
                          }}
                          selected={selectedIndex === 4}
                          onClick={handleLogout}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1.75,
                                bgcolor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#ffe4e6',
                                color: isDark ? '#f87171' : '#e11d48',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <IconLogout stroke={1.8} size="16px" />
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 700, color: isDark ? '#f87171' : '#e11d48', fontSize: '0.84rem' }}
                              >
                                <FormattedMessage id="logout" />
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </List>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Transitions>
          </ClickAwayListener>
        )}
      </Popper>
      <ChangePasswordModal open={changePwdOpen} handleClose={() => setChangePwdOpen(false)} />
    </>
  );
}
