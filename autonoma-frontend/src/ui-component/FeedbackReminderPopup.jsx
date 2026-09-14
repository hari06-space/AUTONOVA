import { useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button, Stack, Box, Chip } from '@mui/material';
import { IconBell, IconTruck, IconBuildingSkyscraper, IconUsers, IconSparkles } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

// ─── FeedbackReminderPopup ─────────────────────────────────────────────────────
// Props:
//   employeePending    {boolean}  — true if employee has a pending survey
//   employeeMappingId  {string}   — mapping ID for employee survey
//   customerPending    {boolean}  — true if customer has a pending survey
//   customerMappingId  {string}   — mapping ID for customer survey
//   vendorPending      {boolean}  — true if vendor has a pending survey
//   internalPending    {boolean}  — true if internal customer has a pending survey
//   onDismissEmployee  {fn}       — called when employee survey is dismissed
//   onDismissCustomer  {fn}       — called when customer survey is dismissed
//   onDismissVendor    {fn}       — called when vendor survey is dismissed
//   onDismissInternal  {fn}       — called when internal customer survey is dismissed
//
// This component handles all pending satisfaction notifications in a unified list popup.
//

export default function FeedbackReminderPopup({
  employeePending = false,
  employeeMappingId = null,
  employeeDaysLeft = 7,
  customerPending = false,
  customerMappingId = null,
  vendorPending = false,
  vendorMappingId = null,
  internalPending = false,
  internalMappingId = null,
  onDismissEmployee,
  onDismissCustomer,
  onDismissVendor,
  onDismissInternal
}) {
  const navigate = useNavigate();

  const isAnyPending = employeePending || customerPending || vendorPending || internalPending;

  useEffect(() => {
    if (isAnyPending) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAnyPending]);

  if (isAnyPending) {
    let title = 'Pending Survey';
    let subTitle = 'Satisfaction Feedback';
    let desc =
      'You have a pending satisfaction survey mapping. Please fill out your feedback to help us build a better workspace environment.';
    let route = '/hra/satisfaction/feedback-form';
    let color = '#1976d2';

    if (employeePending) {
      title = 'Employee Satisfaction Survey';
      subTitle = 'Employee Feedback';
      desc = 'You have a pending Employee Satisfaction Survey. Please click below to submit your feedback.';
      route = employeeMappingId ? `/hra/satisfaction/feedback-form?mappingId=${employeeMappingId}` : '/hra/satisfaction/feedback-form';
      color = '#1976d2';
    } else if (customerPending) {
      title = 'Customer Satisfaction Survey';
      subTitle = 'Customer Feedback';
      desc = 'You have a pending Customer Satisfaction Survey. Please click below to submit your feedback.';
      route = customerMappingId ? `/hra/satisfaction/feedback-form?mappingId=${customerMappingId}` : '/hra/satisfaction/feedback-form';
      color = '#0288d1';
    } else if (vendorPending) {
      title = 'Vendor Satisfaction Survey';
      subTitle = 'Vendor Feedback';
      desc = 'You have a pending Vendor Satisfaction Survey. Please click below to submit your feedback.';
      route = vendorMappingId
        ? `/master/sales/crm/satisfaction/feedback-entry?type=Vendor&mappingId=${vendorMappingId}`
        : '/hra/satisfaction/feedback-form';
      color = '#1565c0';
    } else if (internalPending) {
      title = 'Internal Customer Satisfaction Survey';
      subTitle = 'Internal Customer Feedback';
      desc = 'You have a pending Internal Customer Satisfaction Survey. Please click below to submit your feedback.';
      route = internalMappingId
        ? `/master/sales/crm/satisfaction/feedback-entry?type=InternalCustomer&mappingId=${internalMappingId}`
        : '/hra/satisfaction/feedback-form';
      color = '#e65100';
    }

    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          bgcolor: 'rgba(8, 10, 16, 0.65)',
          WebkitBackdropFilter: 'blur(20px)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          p: 2,
          overflow: 'hidden'
        }}
      >
        <style>
          {`
            @keyframes floatIn {
              0% { opacity: 0; transform: translateY(40px) scale(0.96); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes pulseGlow {
              0%, 100% { transform: scale(1); opacity: 0.12; }
              50% { transform: scale(1.15); opacity: 0.22; }
            }
            @keyframes floatGlow {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-15px) rotate(180deg); }
            }
          `}
        </style>

        {/* Ambient background glow spheres */}
        <Box
          sx={{
            position: 'absolute',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)`,
            filter: 'blur(60px)',
            animation: 'pulseGlow 6s infinite ease-in-out',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #f43f5e 0%, rgba(255,255,255,0) 70%)',
            filter: 'blur(50px)',
            animation: 'floatGlow 8s infinite ease-in-out',
            zIndex: 0,
            pointerEvents: 'none',
            top: '30%',
            left: '35%'
          }}
        />

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            borderRadius: '28px',
            background: 'rgba(255, 255, 255, 0.82)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.7)',
            p: 4,
            animation: 'floatIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            color: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            gap: 3.5,
            zIndex: 1
          }}
        >
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={2.5}>
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '20px',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.8)'
              }}
            >
              <IconBell size={26} color={color} />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(15, 23, 42, 0.5)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontSize: '0.72rem',
                  display: 'block',
                  mb: 0.5
                }}
              >
                {subTitle}
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                {title} <IconSparkles size={18} color="#eab308" />
              </Typography>
            </Box>
          </Stack>

          {/* Body */}
          <Stack spacing={3.5}>
            <Typography variant="body1" sx={{ color: '#334155', fontSize: '1rem', lineHeight: 1.6, fontWeight: 500 }}>
              {desc}
            </Typography>

            <Box
              sx={{
                p: 2.5,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.9rem' }}>
                  Time Remaining:
                </Typography>
              </Stack>
              <Chip
                label={employeeDaysLeft <= 0 ? 'Overdue' : `${employeeDaysLeft} Working Days Left`}
                size="small"
                sx={{
                  background:
                    employeeDaysLeft <= 2
                      ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                      : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                  color: employeeDaysLeft <= 2 ? '#dc2626' : '#16a34a',
                  border: '1px solid',
                  borderColor: employeeDaysLeft <= 2 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(22, 163, 74, 0.2)',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  height: 28,
                  px: 1,
                  boxShadow: employeeDaysLeft <= 2 ? '0 4px 12px rgba(239, 68, 68, 0.15)' : '0 4px 12px rgba(22, 163, 74, 0.15)'
                }}
              />
            </Box>

            <Typography variant="caption" sx={{ color: 'rgba(15, 23, 42, 0.45)', lineHeight: 1.5, display: 'block', fontStyle: 'italic' }}>
              * Weekends and scheduled company holidays are automatically excluded from the countdown.
            </Typography>
          </Stack>

          {/* Footer Actions */}
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                onDismissEmployee?.();
                onDismissCustomer?.();
                onDismissVendor?.();
                onDismissInternal?.();
              }}
              sx={{
                color: '#64748b',
                borderColor: 'rgba(100, 116, 139, 0.3)',
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.925rem',
                py: 1.5,
                background: 'rgba(255, 255, 255, 0.5)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderColor: '#64748b',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  color: '#475569',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Remind Me Later
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                onDismissEmployee?.();
                onDismissCustomer?.();
                onDismissVendor?.();
                onDismissInternal?.();
                navigate(route);
              }}
              sx={{
                background: `linear-gradient(135deg, ${color} 0%, #1d4ed8 100%)`,
                color: '#fff',
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '0.925rem',
                py: 1.5,
                boxShadow: `0 8px 24px rgba(25, 118, 210, 0.25)`,
                transition: 'all 0.25s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #115293 0%, #1e40af 100%)',
                  boxShadow: '0 12px 28px rgba(25, 118, 210, 0.35)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Go to Feedback
            </Button>
          </Stack>
        </Box>
      </Box>
    );
  }

  const open = false; // Disable original ugly fallback modal entirely

  const handleNavigate = (route) => {
    // Dismiss all to close the popup, then navigate
    handleDismissAll();
    navigate(route);
  };

  const handleDismissAll = () => {
    onDismissEmployee?.();
    onDismissCustomer?.();
    onDismissVendor?.();
    onDismissInternal?.();
  };

  if (!open) return null;

  const pendingItems = [
    customerPending && {
      key: 'customer',
      label: 'Customer Satisfaction Survey',
      icon: IconUsers,
      color: '#0288d1',
      route: customerMappingId ? `/hra/satisfaction/feedback-form?mappingId=${customerMappingId}` : '/hra/satisfaction/feedback-form'
    },
    vendorPending && {
      key: 'vendor',
      label: 'Vendor Satisfaction Survey',
      icon: IconTruck,
      color: '#1565c0',
      route: vendorMappingId ? `/hra/satisfaction/feedback-form?mappingId=${vendorMappingId}` : '/hra/satisfaction/feedback-form'
    },
    internalPending && {
      key: 'internal',
      label: 'Internal Customer Satisfaction Survey',
      icon: IconBuildingSkyscraper,
      color: '#e65100',
      route: internalMappingId ? `/hra/satisfaction/feedback-form?mappingId=${internalMappingId}` : '/hra/satisfaction/feedback-form'
    }
  ].filter(Boolean);

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown={true}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.08)',
          bgcolor: 'background.paper',
          color: '#0f172a',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
          zIndex: 9999
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ bgcolor: 'rgba(25, 118, 210, 0.08)', borderRadius: '50%', p: 0.8, display: 'flex' }}>
            <IconBell size={22} color="#1976d2" />
          </Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a' }}>
            Pending Feedback Reminder
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: '#1e293b', mb: 2 }}>
          You have pending satisfaction feedback to complete
        </Typography>
        <Stack spacing={1.5}>
          {pendingItems.map((item) => {
            const IconComp = item.icon;
            return (
              <Box
                key={item.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  border: '1.5px solid rgba(25, 118, 210, 0.2)',
                  borderRadius: 2,
                  bgcolor: 'rgba(25, 118, 210, 0.04)'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <IconComp size={20} color={item.color} />
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#0f172a' }}>
                    {item.label}
                  </Typography>
                  <Chip
                    label="Pending"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,152,0,0.1)',
                      color: '#ff9800',
                      fontWeight: 700,
                      height: 20,
                      border: '1px solid rgba(255,152,0,0.3)'
                    }}
                  />
                </Stack>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleNavigate(item.route)}
                  sx={{
                    fontWeight: 700,
                    borderRadius: 2,
                    bgcolor: '#1976d2',
                    '&:hover': { bgcolor: '#115293' }
                  }}
                >
                  Start
                </Button>
              </Box>
            );
          })}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={handleDismissAll}
          sx={{
            color: '#1976d2',
            borderColor: '#1976d2',
            borderRadius: 2,
            fontWeight: 650,
            '&:hover': { borderColor: '#115293', bgcolor: 'rgba(25, 118, 210, 0.04)' }
          }}
        >
          Remind Later
        </Button>
        {pendingItems.length === 1 && (
          <Button
            variant="contained"
            onClick={() => handleNavigate(pendingItems[0].route)}
            sx={{ fontWeight: 700, borderRadius: 2, bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
          >
            Complete Now
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
