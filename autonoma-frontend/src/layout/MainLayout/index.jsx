import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

// material-ui
import { useTheme, useColorScheme } from '@mui/material/styles';
import { getHeaderThemeStyles } from './headerThemes';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppBar from '@mui/material/AppBar';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grow from '@mui/material/Grow';
import { Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';

import { useDispatch } from 'store';
import { useSelector } from 'react-redux';
import { fetchUserPermissions, clearPermissions } from 'store/slices/permissions';
import axios from 'utils/axios';
import { loadAllColumnPreferences } from 'store/slices/search';

// project imports
import Footer from './Footer';
import Header from './Header';
import BirthdayPanel from './BirthdayPanel';
import BirthdayGreetingPopup from './BirthdayGreetingPopup';
import SpecialDayGreetingPopup from './SpecialDayGreetingPopup';
import Sidebar from './Sidebar';
import HorizontalBar from './HorizontalBar';
import MainContentStyled from './MainContentStyled';
import Customization from '../Customization';
import Breadcrumbs from 'ui-component/extended/Breadcrumbs';
import Loader from 'ui-component/Loader';
import Transitions from 'ui-component/extended/Transitions';
import useAuth from 'hooks/useAuth';
import Alert from '@mui/material/Alert';
import useGlobalKeyboardShortcuts from 'hooks/useGlobalKeyboardShortcuts';

import { MenuOrientation } from 'config';
import useConfig from 'hooks/useConfig';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';
import { RibbonProvider, useRibbon } from 'contexts/RibbonContext';
import { IconAlertCircle } from '@tabler/icons-react';
import FaceWatchdogGuard from 'ui-component/FaceWatchdogGuard';
import GlobalTaskOverviewModal from 'ui-component/support/GlobalTaskOverviewModal';
import CustomerSatisfactionPopup from 'ui-component/CustomerSatisfactionPopup';
import FeedbackReminderPopup from 'ui-component/FeedbackReminderPopup';
import { BossBreakProvider } from 'contexts/BossBreakContext';
import BossBreakModal from 'ui-component/boss-break/BossBreakModal';
import GlobalIncomingCallHandler from 'ui-component/call/GlobalIncomingCallHandler';
import MeetingAlarmDialog from 'ui-component/meeting/MeetingAlarmDialog';

// ── Helper functions for 7-working-day and business snooze logic ──
const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  }
  return null;
};

const isWeekendOrHoliday = (dateObj, holidaysList) => {
  const day = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) return true;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(dateObj.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${dayOfMonth}`;

  return holidaysList.includes(formattedDate);
};

const getWorkingDaysDeadline = (startDateStr, holidaysList) => {
  let date = parseDateString(startDateStr);
  if (!date) return null;
  let workingDaysCount = 0;

  while (workingDaysCount < 7) {
    if (!isWeekendOrHoliday(date, holidaysList)) {
      workingDaysCount++;
    }
    if (workingDaysCount < 7) {
      date.setDate(date.getDate() + 1);
    }
  }
  return date;
};

const getWorkingDaysLeft = (startDateStr, currentDateObj, holidaysList) => {
  const deadlineObj = getWorkingDaysDeadline(startDateStr, holidaysList);
  if (!deadlineObj) return 0;

  const current = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), currentDateObj.getDate());
  const deadline = new Date(deadlineObj.getFullYear(), deadlineObj.getMonth(), deadlineObj.getDate());

  if (current > deadline) {
    return 0; // Expired
  }

  let count = 0;
  let temp = new Date(current);
  while (temp <= deadline) {
    if (!isWeekendOrHoliday(temp, holidaysList)) {
      count++;
    }
    temp.setDate(temp.getDate() + 1);
  }
  return count;
};

const calculateSnoozeUntil = (currentDateObj, holidaysList) => {
  // Add 24 hours (86,400,000 ms)
  let date = new Date(currentDateObj.getTime() + 24 * 60 * 60 * 1000);

  // If target falls on a weekend or holiday, advance to the next working day
  while (isWeekendOrHoliday(date, holidaysList)) {
    date.setDate(date.getDate() + 1);
  }

  return date.getTime();
};

// Override Reminder Suppression Test Mode Flag
const FORCE_REMINDER_TEST_MODE = false;

// ==============================|| MAIN LAYOUT ||============================== //

// Inner layout — can safely use useRibbon (inside provider)
function MainLayoutInner() {
  useGlobalKeyboardShortcuts();
  const theme = useTheme();
  const downMD = useMediaQuery(theme.breakpoints.down('md'));
  const reduxDispatch = useDispatch();
  const maxResult = useSelector((state) => state.search?.maxResult || '');

  const {
    state: { borderRadius, container, miniDrawer, menuOrientation, ribbonLayout, i18n, headerTheme }
  } = useConfig();
  const { colorScheme, mode } = useColorScheme();
  const isDark = colorScheme === 'dark' || mode === 'dark' || theme.palette.mode === 'dark';
  const headerStyles = useMemo(() => getHeaderThemeStyles(headerTheme, isDark), [headerTheme, isDark]);
  const { menuMaster, menuMasterLoading } = useGetMenuMaster();
  const drawerOpen = menuMaster?.isDashboardDrawerOpened;
  const { ribbonOpen } = useRibbon();
  const navigate = useNavigate();
  const { user, licenseStatus, logoutCountdown, isLoggedIn } = useAuth();
  const [showLicenseAlert, setShowLicenseAlert] = useState(false);
  const [satisfactionPopup, setSatisfactionPopup] = useState(null); // null | 'pending' | 'closed'
  const [satisfactionMappingId, setSatisfactionMappingId] = useState(null);
  const [customerSatisfactionPopup, setCustomerSatisfactionPopup] = useState(false);
  const [customerSatisfactionMappingId, setCustomerSatisfactionMappingId] = useState(null);
  const [vendorSatisfactionPending, setVendorSatisfactionPending] = useState(false);
  const [vendorMappingId, setVendorMappingId] = useState(null);
  const [internalSatisfactionPending, setInternalSatisfactionPending] = useState(false);
  const [internalMappingId, setInternalMappingId] = useState(null);
  const location = useLocation();

  const [holidays, setHolidays] = useState([]);
  const [employeeDaysLeft, setEmployeeDaysLeft] = useState(7);
  const [birthdayPanelOpen, setBirthdayPanelOpen] = useState(false);

  useEffect(() => {
    // ── Single backend-authoritative pending check ────────────────────────────
    // Calls /api/pending-feedback-check which consolidates all 4 types.
    // No sessionStorage flags. Runs fresh on every login (isLoggedIn change).
    // The popup reappears on every subsequent login until feedback is completed.

    const checkAllPendingFeedback = async () => {
      try {
        // Fetch holidays first
        let holidayDates = [];
        try {
          const holidaysRes = await axios.get('/api/master/hr/holidays');
          holidayDates = holidaysRes.data
            .map((h) => h.holidayDate || h.fromDate)
            .filter(Boolean);
          setHolidays(holidayDates);
        } catch (hErr) {
          console.error('[FeedbackCheck] Failed to fetch holidays:', hErr);
        }

        const res = await axios.get('/api/pending-feedback-check');
        const data = res.data;

        // Employee satisfaction
        let activeDaysLeft = 7;
        let startRef = null;

        if (data.employee?.pending) {
          startRef = data.employee.feedbackStartDate || data.employee.eligibilityDate || data.employee.createdDate;
        } else if (data.customer?.pending) {
          startRef = data.customer.feedbackStartDate || data.customer.eligibilityDate || data.customer.createdDate;
        } else if (data.vendor?.pending) {
          startRef = data.vendor.feedbackStartDate || data.vendor.eligibilityDate || data.vendor.createdDate;
        } else if (data.internal?.pending) {
          startRef = data.internal.feedbackStartDate || data.internal.eligibilityDate || data.internal.createdDate;
        }

        if (startRef) {
          activeDaysLeft = getWorkingDaysLeft(startRef, new Date(), holidayDates);
        }
        setEmployeeDaysLeft(activeDaysLeft);

        if (data.employee?.pending && activeDaysLeft > 0) {
          if (window.location.search.includes('clearSnooze=true')) {
            localStorage.removeItem('feedback_snooze_employee_until');
            localStorage.removeItem('feedback_snooze_employee');
          }
          setSatisfactionMappingId(data.employee.mappingId || null);
          setSatisfactionPopup('pending');
        } else {
          setSatisfactionPopup(null);
          setSatisfactionMappingId(null);
        }

        // Customer satisfaction
        if (data.customer?.pending && activeDaysLeft > 0) {
          setCustomerSatisfactionMappingId(data.customer.mappingId || null);
          setCustomerSatisfactionPopup(true);
        } else {
          setCustomerSatisfactionPopup(false);
          setCustomerSatisfactionMappingId(null);
        }

        // Vendor satisfaction
        if (data.vendor?.pending && activeDaysLeft > 0) {
          setVendorMappingId(data.vendor.mappingId || null);
          setVendorSatisfactionPending(true);
        } else {
          setVendorSatisfactionPending(false);
          setVendorMappingId(null);
        }

        // Internal customer satisfaction
        if (data.internal?.pending && activeDaysLeft > 0) {
          setInternalMappingId(data.internal.mappingId || null);
          setInternalSatisfactionPending(true);
        } else {
          setInternalSatisfactionPending(false);
          setInternalMappingId(null);
        }

      } catch (e) {
        // Silent fail — never block the user if the check endpoint is unavailable
        console.error('[FeedbackCheck] Failed to check pending feedback:', e);
      }
    };

    if (isLoggedIn && user) {
      checkAllPendingFeedback();
    }
  }, [isLoggedIn, user?.userId, user?.id]);

  useEffect(() => {
    const uid = user?.userId || user?.id;
    if (uid) {
      reduxDispatch(fetchUserPermissions(uid));
    } else {
      reduxDispatch(clearPermissions());
    }
  }, [user?.userId, user?.id, reduxDispatch]);

  useEffect(() => {
    const uid = user?.userId || user?.id;
    if (uid) {
      axios.get('/api/user-column-preferences')
        .then((res) => {
          reduxDispatch(loadAllColumnPreferences(res.data));
        })
        .catch((err) => {
          console.error('[MainLayout] Failed to load user column preferences:', err);
        });
    } else {
      reduxDispatch(loadAllColumnPreferences([]));
    }
  }, [user?.userId, user?.id, reduxDispatch]);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('licenseAlertDismissed');
    if (licenseStatus?.isWarningPeriod && !isDismissed) {
      setShowLicenseAlert(true);
    } else {
      setShowLicenseAlert(false);
    }
  }, [licenseStatus]);

  const handleDismissAlert = () => {
    sessionStorage.setItem('licenseAlertDismissed', 'true');
    setShowLicenseAlert(false);
  };

  useEffect(() => {
    handlerDrawerOpen(!miniDrawer);
  }, [miniDrawer]);

  useEffect(() => {
    downMD && handlerDrawerOpen(false);
  }, [downMD]);

  // Dynamically load Google Translate Engine on Mount.
  // Translation language is controlled by the 'googtrans' cookie set in LocalizationSection
  // before page reload — Google Translate reads it automatically on script load.
  useEffect(() => {
    // Ensure the hidden GT container exists (idempotent)
    if (!document.getElementById('google_translate_element')) {
      const gtContainer = document.createElement('div');
      gtContainer.id = 'google_translate_element';
      gtContainer.style.display = 'none';
      document.body.appendChild(gtContainer);
    }

    // Inject suppression styles once
    if (!document.getElementById('google-translate-styles')) {
      const style = document.createElement('style');
      style.id = 'google-translate-styles';
      style.innerHTML = `
        iframe.skiptranslate, #goog-gt-tt, .goog-te-balloon-frame {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
        }
      `;
      document.head.appendChild(style);
    }

    const loadTranslateScript = () => {
      if (document.getElementById('google-translate-script')) return;

      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            { pageLanguage: 'en', autoDisplay: false },
            'google_translate_element'
          );
        }
      };

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.onerror = () => {
        console.warn('Google Translate failed to load due to network connectivity issues.');
      };
      document.body.appendChild(script);
    };

    if (navigator.onLine) {
      loadTranslateScript();
    }

    window.addEventListener('online', loadTranslateScript);
    return () => {
      window.removeEventListener('online', loadTranslateScript);
    };
  }, []);

  // Anti-screenshot, printing, and context-menu protection
  useEffect(() => {
    const isSuperUser = user?.userLevel === 5;

    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' && !isSuperUser) {
        navigator.clipboard.writeText('');
      }
      if (e.ctrlKey && (e.key === 'p' || e.key === 'P') && !isSuperUser) {
        e.preventDefault();
        console.warn('Printing and PDF exports are disabled for security reasons.');
      }
      if ((e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c'))) && !isSuperUser) {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e) => {
      if (!isSuperUser && localStorage.getItem('allowRightClick') !== 'true') {
        e.preventDefault();
      }
    };

    // Block printing completely in CSS media query for standard users
    let style;
    if (!isSuperUser) {
      style = document.createElement('style');
      style.innerHTML = `
        @media print {
          body { display: none !important; }
        }
      `;
      document.head.appendChild(style);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      if (style) {
        document.head.removeChild(style);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [user]);

  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downMD;

  // horizontal menu-list bar : drawer
  const menu = useMemo(() => (isHorizontal ? <HorizontalBar /> : <Sidebar />), [isHorizontal]);

  if (menuMasterLoading) return <Loader />;

  return (
    <FaceWatchdogGuard>
      <Box sx={{ display: 'flex' }}>

        {/* header */}
        <AppBar
          enableColorOnDark
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 10,
            transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
            ...headerStyles
          }}
        >
          <Toolbar sx={{ p: isHorizontal ? 1.25 : 2 }}>
            <Header onBirthdayClick={() => setBirthdayPanelOpen(true)} />
          </Toolbar>
        </AppBar>

        {logoutCountdown !== null && (
          <Box
            sx={{
              position: 'fixed',
              top: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 6000,
              display: 'flex',
              alignItems: 'center',
              gap: 2.5,
              px: 4,
              py: 1.5,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1e1e2f 0%, #11111d 100%)',
              color: '#fff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)',
              animation: 'slideInDown 0.5s ease-out',
              '@keyframes slideInDown': {
                '0%': { transform: 'translateX(-50%) translateY(-100%)', opacity: 0 },
                '100%': { transform: 'translateX(-50%) translateY(0)', opacity: 1 }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(244, 67, 54, 0.2)', color: '#f44336' }}>
              <IconAlertCircle size={28} stroke={2.5} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'inherit', mb: 0.2 }}>
                Terminate Session : <span style={{ color: '#f44336' }}>{logoutCountdown}s</span>
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, color: 'inherit', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                The system license is no longer valid. Kindly save your work immediately!
              </Typography>
            </Box>
          </Box>
        )}

        <Grow in={showLicenseAlert && !!licenseStatus} unmountOnExit>
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 5000,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              px: 3,
              py: 1.25,
              borderRadius: '16px',
              bgcolor: 'rgba(255, 171, 0, 0.9)',
              WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(255, 171, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transformOrigin: 'bottom right'
            }}
          >
            <IconAlertCircle size={22} stroke={2} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1, color: 'inherit' }}>
                License Expiry Alert
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500 }}>
                Your plan expires in <strong>{licenseStatus?.daysLeft || 0} days</strong>. Renew soon to continue uninterrupted access.
              </Typography>
            </Box>
            <Button
              size="small"
              variant="contained"
              sx={{
                bgcolor: 'background.paper',
                color: 'warning.main',
                fontWeight: 800,
                borderRadius: '10px',
                px: 2,
                '&:hover': { bgcolor: 'grey.100' }
              }}
              onClick={handleDismissAlert}
            >
              Got it
            </Button>
          </Box>
        </Grow>

        {/* menu / drawer */}
        {menu}

        {/* main content */}
        <MainContentStyled {...{ borderRadius, menuOrientation, open: drawerOpen, ribbonOpen, ribbonLayout }}>
          <Container
            maxWidth={false}
            disableGutters
            sx={{ px: 0, py: 0, my: 0, flexGrow: 1, minHeight: 0, height: '100%', display: 'flex', flexDirection: 'column', maxWidth: 'none' }}
          >
            {/* breadcrumb */}
            {/* <Breadcrumbs title /> */}
            {/* Page outlet — grows naturally with sleek thin scrollbar */}
            <Box
              id="main-scroll-container"
              sx={{
                flexGrow: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                overflowX: 'hidden',
                overflowY: 'auto',
                px: { xs: 1, md: 2 },
                '&::-webkit-scrollbar': {
                  width: '6px',
                  height: '6px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0, 0, 0, 0.18)',
                  borderRadius: '4px'
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent'
                }
              }}
            >
              <Outlet />
            </Box>
            <Footer />
          </Container>
        </MainContentStyled>
        <Customization />
        <GlobalTaskOverviewModal />
        {/* Satisfaction Survey Popup for CLOSED state only */}
        {/* No sessionStorage — user can close this informational notice for the current view */}
        <Dialog
          open={satisfactionPopup === 'closed'}
          onClose={() => setSatisfactionPopup(null)}
          disableEscapeKeyDown={false}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              p: 1,
              bgcolor: '#0a0e17',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              color: '#fff'
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#f44336' }}>
            Feedback Cycle Closed
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', mt: 1 }}>
              The 7-day feedback window for this cycle has expired.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'flex-end', gap: 1 }}>
            <Button
              variant="contained"
              color="error"
              onClick={() => setSatisfactionPopup(null)}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 650 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        <FeedbackReminderPopup
          employeePending={satisfactionPopup === 'pending'}
          employeeMappingId={satisfactionMappingId}
          employeeDaysLeft={employeeDaysLeft}
          customerPending={customerSatisfactionPopup}
          customerMappingId={customerSatisfactionMappingId}
          vendorPending={vendorSatisfactionPending}
          vendorMappingId={vendorMappingId}
          internalPending={internalSatisfactionPending}
          internalMappingId={internalMappingId}
          onDismissEmployee={() => {
            setSatisfactionPopup(null);
          }}
          onDismissCustomer={() => setCustomerSatisfactionPopup(false)}
          onDismissVendor={() => setVendorSatisfactionPending(false)}
          onDismissInternal={() => setInternalSatisfactionPending(false)}
        />

        <BirthdayPanel open={birthdayPanelOpen} onClose={() => setBirthdayPanelOpen(false)} />
        <BirthdayGreetingPopup />
        <SpecialDayGreetingPopup />
        <BossBreakModal />
        <GlobalIncomingCallHandler />
        <MeetingAlarmDialog />

      </Box>
    </FaceWatchdogGuard>
  );
}

export default function MainLayout() {
  const { isLoggedIn } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');
  const isPublicInduction = window.location.pathname.replace(/\/$/, '') === '/hra/ats/induction-trainee' && token;

  if (isPublicInduction) {
    return <Outlet />;
  }

  return (
    <RibbonProvider>
      <BossBreakProvider>
        <MainLayoutInner />
      </BossBreakProvider>
    </RibbonProvider>
  );
}
