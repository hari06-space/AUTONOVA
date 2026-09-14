import PropTypes from 'prop-types';
import React, { forwardRef } from 'react';

// material-ui
import { useTheme, alpha } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

import { useLocation, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconHelp, IconX } from '@tabler/icons-react';
import { PAGE_USER_MANUALS } from 'ui-component/bos/PageUserManuals';

// project imports
import { MenuOrientation } from 'config';
import useConfig from 'hooks/useConfig';
import { useRibbon } from 'contexts/RibbonContext';
import { glassSurface } from 'ui-component/bos/BOSStyles';
import BOSAuditTrailDrawer from 'ui-component/bos/BOSAuditTrailDrawer';

// ── GLASSMORPHISM HEADER GLOW KEYFRAME ──────────────────────
const headerGlowKF = {
  '@keyframes headerGlowPulse': {
    '0%, 100%': { opacity: 0.6 },
    '50%': { opacity: 1 },
  }
};

// ==============================|| CUSTOM MAIN CARD ||============================== //

const renderNodeOrComponent = (node, props = {}) => {
  if (!node) return null;
  if (React.isValidElement(node)) return node;
  if (typeof node === 'function' || (typeof node === 'object' && node?.$$typeof)) {
    const Comp = node;
    return <Comp {...props} />;
  }
  return node;
};

const MainCard = forwardRef(
  (
    {
      border = true,
      boxShadow,
      children,
      content = true,
      contentClass = '',
      contentSX = {},
      darkTitle,
      secondary,
      shadow,
      sx = {},
      title,
      icon: Icon,
      fullWidth = false,
      stretch = true,
      pageCode,
      subtitle,
      stickyHeader = false,
      auditProps,
      ...others
    },
    ref
  ) => {
    const theme = useTheme();
    const { state: { menuOrientation } } = useConfig();
    const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL;
    const location = useLocation();
    const navigate = useNavigate();
    const fromDashboard = location.state?.fromDashboard === true;
    const [helpOpen, setHelpOpen] = React.useState(false);
    const [showAudit, setShowAudit] = React.useState(false);

    const handleToggleAudit = (open) => {
      setShowAudit(open);
      if (open && auditProps?.onOpen) {
        auditProps.onOpen();
      }
    };

    const isDark =
      theme.palette.mode === 'dark' ||
      (typeof window !== 'undefined' &&
        (localStorage.getItem('theme-mode') === 'dark' ||
          document.documentElement.getAttribute('data-mui-color-scheme') === 'dark'));
    const pMain = theme.palette.primary.main;
    const pDark = theme.palette.primary.dark;
    const pLight = theme.palette.primary.light;

    const renderTitle = () => {
      if (!title && !Icon && !fromDashboard) return null;
      // When this is a premium gradient header (title is a string)
      if (typeof title === 'string') return null; // rendered inline in premium header
      return renderNodeOrComponent(title);
    };

    return (
      <>
        <Card
          ref={ref}
          {...others}
        sx={(theme) => ({
          border: border ? '1px solid' : 'none',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          overflow: 'visible',
          ':hover': {
            boxShadow: boxShadow ? shadow || '0 2px 14px 0 rgb(32 40 45 / 8%)' : 'inherit'
          },
          ...(stretch ? {
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 0',
            minHeight: 0
          } : {}),
          ...(auditProps?.isEdit && showAudit ? {
            width: 'calc(100% - 380px)',
            marginRight: '380px'
          } : { width: '100%' }),
          transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1), margin-right 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(typeof sx === 'function' ? sx(theme) : sx || {})
        })}
      >
        {/* ════ PREMIUM GLASS PAGE HEADER ════ */}
        {title && typeof title === 'string' && (
          <Box
            sx={{
              position: stickyHeader ? 'sticky' : 'relative',
              top: stickyHeader ? 0 : 'auto',
              zIndex: stickyHeader ? 10 : 'auto',
              borderTopLeftRadius: 'inherit',
              borderTopRightRadius: 'inherit',
              overflow: 'hidden',
              ...headerGlowKF,
              // Glass surface
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              background: isDark
                ? `linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)`
                : `linear-gradient(135deg, ${alpha('#ffffff', 0.82)} 0%, ${alpha(pLight, 0.22)} 100%)`,
              borderBottom: isDark
                ? `1px solid rgba(255, 255, 255, 0.1)`
                : `1px solid ${alpha(pMain, 0.14)}`,
              boxShadow: isDark
                ? `0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                : `0 4px 24px ${alpha(pMain, 0.1)}, inset 0 1px 0 rgba(255, 255, 255, 0.9)`,
              // Animated bottom glow line
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: '10%',
                right: '10%',
                height: '2px',
                borderRadius: '2px',
                background: isDark
                  ? `linear-gradient(90deg, transparent, ${alpha(pLight, 0.7)}, transparent)`
                  : `linear-gradient(90deg, transparent, ${alpha(pMain, 0.55)}, transparent)`,
                animation: 'headerGlowPulse 3s ease-in-out infinite',
              },
              // Left accent bar
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: '1%',
                bottom: '1%',
                width: '5px',

                background: isDark
                  ? `linear-gradient(180deg, ${alpha(pLight, 0.9)}, ${pMain})`
                  : `linear-gradient(180deg, ${pMain}, ${pDark})`,
                boxShadow: isDark
                  ? `0 0 8px ${alpha(pLight, 0.5)}`
                  : `0 0 8px ${alpha(pMain, 0.4)}`,
              },
            }}
          >
            {/* Inner content layer */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: secondary ? 'column' : 'row', sm: 'row' },
                alignItems: { xs: secondary ? 'stretch' : 'center', sm: 'center' },
                justifyContent: 'space-between',
                gap: { xs: 1, sm: 2 },
                px: { xs: 1.5, sm: 3 },
                py: { xs: 0.85, sm: 1.1 },
              }}
            >
              {/* LEFT: back + icon + title + help */}
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
                {/* Back button */}
                {fromDashboard && (
                  <Box
                    component="button"
                    onClick={() => navigate(-1)}
                    title="Back to Dashboard"
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      border: `1px solid ${alpha(pMain, 0.3)}`,
                      borderRadius: '20px',
                      px: 1.5, py: 0.4,
                      bgcolor: alpha(pMain, 0.08),
                      color: isDark ? pLight : pDark,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      transition: 'all 0.2s',
                      flexShrink: 0,
                      '&:hover': { bgcolor: alpha(pMain, 0.18), borderColor: pMain },
                    }}
                  >
                    <IconArrowLeft size={14} stroke={2.5} />
                    Back
                  </Box>
                )}

                {/* Module Icon */}
                {Icon && (
                  <Avatar sx={{
                    background: isDark
                      ? `linear-gradient(135deg, ${alpha(pMain, 0.5)}, ${alpha(pDark, 0.4)})`
                      : `linear-gradient(135deg, ${alpha(pMain, 0.15)}, ${alpha(pLight, 0.3)})`,
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(pMain, 0.25)}`,
                    color: isDark ? pLight : pMain,
                    borderRadius: '10px',
                    width: { xs: 30, sm: 36 },
                    height: { xs: 30, sm: 36 },
                    flexShrink: 0,
                  }}>
                    {renderNodeOrComponent(Icon, { size: 18, stroke: 1.5 })}
                  </Avatar>
                )}

                {/* Title and Subtitle */}
                <Box>
                  <Typography
                    variant="h3"
                    noWrap
                    sx={{
                      background: isDark
                        ? `linear-gradient(90deg, ${pLight}, ${pMain})`
                        : `linear-gradient(90deg, ${pMain}, ${theme.palette.secondary.main})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: 0.2,
                      lineHeight: 1.3,
                      mb: subtitle ? 0.2 : 0,
                    }}
                  >
                    {title}
                  </Typography>
                  {subtitle && (
                    <Typography variant="subtitle2" sx={{ color: isDark ? alpha('#e2e8f0', 0.7) : alpha(pDark, 0.7) }}>
                      {subtitle}
                    </Typography>
                  )}
                </Box>

                {/* Help SOP pill button */}
                {pageCode && PAGE_USER_MANUALS[pageCode] && (
                  <Box
                    component="button"
                    onClick={(e) => { e.stopPropagation(); setHelpOpen(true); }}
                    title="User Manual / SOP"
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      border: `1px solid ${alpha(pMain, 0.3)}`,
                      borderRadius: '20px',
                      px: 1.2, py: 0.35,
                      bgcolor: alpha(pMain, 0.08),
                      color: isDark ? pLight : pMain,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.4,
                      flexShrink: 0,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: alpha(pMain, 0.18), borderColor: pMain, transform: 'scale(1.04)' },
                    }}
                  >
                    <IconHelp size={13} />

                  </Box>
                )}
              </Stack>

              {/* RIGHT: action slot — themed pill buttons on glass */}
              {secondary && (
                <Box sx={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'flex-end', sm: 'flex-end' },
                  maxWidth: '100%',
                  overflowX: { xs: 'auto', sm: 'visible' },
                  gap: 1,
                  '& .MuiButton-root': {
                    borderRadius: '20px',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    letterSpacing: 0.4,
                    py: 0.55,
                    px: 1.6,
                    transition: 'all 0.2s ease !important',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 14px ${alpha(pMain, 0.35)} !important`,
                    },
                  },
                  '& .MuiIconButton-root': {
                    color: isDark ? pLight : pMain,
                    border: `1px solid ${alpha(pMain, 0.25)}`,
                    bgcolor: alpha(pMain, 0.07),
                    borderRadius: '12px',
                    width: 34, height: 34,
                    '&:hover': { bgcolor: alpha(pMain, 0.15) },
                  },
                }}>
                  {renderNodeOrComponent(secondary)}
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Non-string title fallback (custom node or component) */}
        {title && typeof title !== 'string' && (
          <Box sx={{
            position: stickyHeader ? 'sticky' : 'relative',
            top: stickyHeader ? 0 : 'auto',
            zIndex: stickyHeader ? 10 : 'auto',
            ...glassSurface(isDark),
            bgcolor: isDark ? alpha(pMain, 0.1) : alpha(pMain, 0.04),
            borderTopLeftRadius: 'inherit',
            borderTopRightRadius: 'inherit',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}>
            <CardHeader
              sx={{ '& .MuiCardHeader-action': { mr: 0, my: 0, alignSelf: 'center' }, py: 1, px: 3 }}
              title={renderTitle()}
              action={renderNodeOrComponent(secondary)}
            />
            <Divider />
          </Box>
        )}

        {/* card content */}
        {content && (
          <CardContent
            sx={{
              p: fullWidth ? 0 : 1.5,
              '&:last-child': { pb: fullWidth ? 0 : 1.5 },
              // When stretch is active, CardContent must also flex-grow so its children can stretch
              ...(stretch ? { display: 'flex', flexDirection: 'column', flex: '1 1 0', minHeight: 0, overflowY: 'auto' } : {}),
              ...contentSX
            }}
            className={contentClass}
          >
            {children}
          </CardContent>
        )}
        {!content && children}

        {/* Centralized SOP Manual Dialog */}
        {helpOpen && pageCode && PAGE_USER_MANUALS[pageCode] && (
          <Dialog
            open={helpOpen}
            onClose={() => setHelpOpen(false)}
            fullWidth
            maxWidth="md"
            PaperProps={{ sx: { borderRadius: 4, position: 'relative' } }}
          >
            {typeof PAGE_USER_MANUALS[pageCode] === 'function' || (typeof PAGE_USER_MANUALS[pageCode] === 'object' && PAGE_USER_MANUALS[pageCode].$$typeof) ? (
              <Box sx={{ position: 'relative', bgcolor: '#eef1f6', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '90vh' }}>
                <IconButton
                  onClick={() => setHelpOpen(false)}
                  sx={{
                    position: 'absolute',
                    right: 24,
                    top: 24,
                    color: '#6b7280',
                    zIndex: 1300,
                    bgcolor: 'rgba(255,255,255,0.8)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
                  }}
                >
                  <IconX size={20} />
                </IconButton>
                <Box sx={{ overflowY: 'auto', flexGrow: 1, pt: 2 }}>
                  {React.createElement(PAGE_USER_MANUALS[pageCode], { onClose: () => setHelpOpen(false) })}
                </Box>
              </Box>
            ) : (
              <>
                <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: '#fff', py: 2.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <IconHelp size={28} />
                    <Typography variant="h3" color="inherit" fontWeight="bold">
                      {PAGE_USER_MANUALS[pageCode].title}
                    </Typography>
                  </Stack>
                </DialogTitle>
                <DialogContent dividers sx={{ py: 3, px: 4, bgcolor: theme.palette.mode === 'dark' ? '#121212' : '#f8fafc' }}>

                  {/* Introduction Card */}
                  <Box sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#eff6ff', borderLeft: `5px solid ${theme.palette.primary.main}` }}>
                    <Typography variant="body1" color={theme.palette.mode === 'dark' ? '#93c5fd' : '#1e3a8a'} fontWeight={500}>
                      {PAGE_USER_MANUALS[pageCode].introduction}
                    </Typography>
                  </Box>

                  {/* Step-by-Step SOP Grid */}
                  <Typography variant="h4" fontWeight="bold" gutterBottom color="primary" sx={{ mb: 2 }}>
                    Standard Operating Procedure (SOP)
                  </Typography>
                  <Grid container spacing={2.5} sx={{ mb: 4 }}>
                    {PAGE_USER_MANUALS[pageCode].steps.map((step) => (
                      <Grid item xs={12} sm={6} key={step.num}>
                        <Card sx={{ p: 2.5, height: '100%', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                          <Stack direction="row" alignItems="center" gap={1.5}>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main, color: '#fff', width: 32, height: 32, fontSize: 14, fontWeight: 'bold' }}>
                              {step.num}
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold">
                              {step.title}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" color="textSecondary" sx={{ pl: 0.5 }}>
                            {step.desc}
                          </Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Supported Components / Features Grid */}
                  {PAGE_USER_MANUALS[pageCode].components && (
                    <>
                      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary" sx={{ mb: 2 }}>
                        Module Elements Reference
                      </Typography>
                      <Grid container spacing={2} sx={{ mb: 4 }}>
                        {PAGE_USER_MANUALS[pageCode].components.map((comp) => (
                          <Grid item xs={12} sm={4} key={comp.name}>
                            <Card sx={{ p: 2, height: '100%', borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
                              <Chip label={comp.name} color="primary" size="small" variant="light" sx={{ mb: 1, fontWeight: 'bold' }} />
                              <Typography variant="body2" color="textSecondary">
                                {comp.desc}
                              </Typography>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}

                  {/* Workflow Status Transitions Pipeline */}
                  {PAGE_USER_MANUALS[pageCode].statusFlow && (
                    <>
                      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary" sx={{ mb: 2 }}>
                        Workflow Status Pipeline
                      </Typography>
                      <Card sx={{ p: 3, mb: 4, borderRadius: 3, border: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, overflowX: 'auto' }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ minWidth: 600 }}>
                          {PAGE_USER_MANUALS[pageCode].statusFlow.map((flow, index) => {
                            const isLast = index === PAGE_USER_MANUALS[pageCode].statusFlow.length - 1;
                            return (
                              <React.Fragment key={flow.status}>
                                <Box sx={{ textAlign: 'center', flex: 1 }}>
                                  <Box sx={{
                                    p: 1.25,
                                    borderRadius: 2.5,
                                    bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#eff6ff',
                                    border: `2px solid ${theme.palette.primary.main}`,
                                    mb: 1,
                                    display: 'inline-block',
                                    minWidth: 130
                                  }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                      {flow.status}
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" display="block" color="textSecondary" sx={{ px: 1, maxWidth: 150, mx: 'auto', lineHeight: 1.2 }}>
                                    {flow.desc}
                                  </Typography>
                                </Box>
                                {!isLast && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', color: theme.palette.primary.light }}>
                                    <Typography variant="h3" color="primary">➔</Typography>
                                  </Box>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </Stack>
                      </Card>
                    </>
                  )}

                  {/* Examples Block */}
                  {PAGE_USER_MANUALS[pageCode].examples && (
                    <>
                      <Typography variant="h4" fontWeight="bold" gutterBottom color="secondary" sx={{ mb: 2 }}>
                        Step-by-Step Examples
                      </Typography>
                      <Card sx={{ p: 2.5, borderRadius: 3, bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f1f5f9', border: `1px solid ${theme.palette.divider}` }}>
                        <Stack gap={1.5}>
                          {PAGE_USER_MANUALS[pageCode].examples.map((ex, index) => (
                            <Stack direction="row" gap={1.5} alignItems="flex-start" key={index}>
                              <Chip label={`Ex ${index + 1}`} size="small" color="secondary" sx={{ fontWeight: 'bold' }} />
                              <Typography variant="body2" color="textPrimary" fontWeight={500} sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                                {ex}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Card>
                    </>
                  )}
                </DialogContent>
                <DialogActions sx={{ px: 4, py: 2 }}>
                  <Button onClick={() => setHelpOpen(false)} variant="contained" color="primary" sx={{ borderRadius: 2, px: 4, py: 1, fontWeight: 'bold' }}>
                    Got It!
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        )}
      </Card>
      
      {/* Centralized Audit Trail Drawer injected at the layout level */}
      {auditProps?.isEdit && (
        <BOSAuditTrailDrawer 
          showAudit={showAudit}
          setShowAudit={handleToggleAudit}
          auditLogs={auditProps.auditLogs}
          formData={auditProps.formData}
        />
      )}
    </>
  );
});

MainCard.propTypes = {
  border: PropTypes.bool,
  boxShadow: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  content: PropTypes.bool,
  contentClass: PropTypes.string,
  contentSX: PropTypes.object,
  headerSX: PropTypes.object,
  darkTitle: PropTypes.bool,
  secondary: PropTypes.any,
  shadow: PropTypes.string,
  sx: PropTypes.object,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  icon: PropTypes.elementType,
  ref: PropTypes.object,
  fullWidth: PropTypes.bool,
  stretch: PropTypes.bool,
  pageCode: PropTypes.string,
  auditProps: PropTypes.object,
  others: PropTypes.any
};

export default MainCard;
