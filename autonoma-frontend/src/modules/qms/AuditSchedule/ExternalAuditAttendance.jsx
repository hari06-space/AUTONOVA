import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'utils/axios';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Alert,
  Container,
  Avatar,
  Chip,
  Grid,
  Button,
  Tooltip,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import LockClockRoundedIcon from '@mui/icons-material/LockClockRounded';
import PersonPinRoundedIcon from '@mui/icons-material/PersonPinRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import defaultLogo from 'assets/images/autonova-logo.png';
import { getCompanyImageUrl, getFileViewUrl } from 'utils/upload-helper';

const ExternalAuditAttendance = () => {
  const [searchParams] = useSearchParams();
  const scheduleNo = searchParams.get('scheduleNo');
  const email = searchParams.get('email');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [markedIn, setMarkedIn] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch Company Profile from branding or company-profiles
  useEffect(() => {
    axios
      .get('/api/hra/applicants/portal/branding', { skipGlobalAlert: true })
      .then((res) => {
        if (res.data) {
          setCompanyProfile((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => { });

    axios
      .get('/api/company-profiles/all', { skipGlobalAlert: true })
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const activeProf = res.data.find((p) => p.status === 'ACTIVE') || res.data[0];
          setCompanyProfile((prev) => ({ ...prev, ...activeProf }));
        } else if (res.data && typeof res.data === 'object') {
          setCompanyProfile((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (scheduleNo && email) {
      processAttendance();
    } else {
      setError('Invalid link parameters. Missing audit schedule number or email.');
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [scheduleNo, email]);

  const processAttendance = async () => {
    try {
      setLoading(true);
      // 1. Validate Link
      const validateRes = await axios.get('/api/qms/audit/external/validate', {
        params: { scheduleNo, email },
        skipGlobalAlert: true
      });

      if (validateRes.data && validateRes.data.valid) {
        setAuditData(validateRes.data);

        // If attendance was already recorded prior to this visit -> Link Expired
        if (validateRes.data.alreadyMarkedIn || validateRes.data.linkExpired) {
          setMarkedIn(true);
          setLinkExpired(true);
        } else {
          // 2. Mark IN now
          const markRes = await axios.post(
            '/api/qms/audit/external/mark-in',
            { scheduleNo, email },
            { skipGlobalAlert: true }
          );

          if (markRes.data && markRes.data.success) {
            setMarkedIn(true);
            setLinkExpired(markRes.data.linkExpired || markRes.data.alreadyMarked === true);
            setAuditData((prev) => ({ ...prev, ...markRes.data }));
          } else {
            setError(markRes.data?.message || 'Failed to record attendance.');
          }
        }
      } else {
        setError(validateRes.data?.message || 'This audit attendance link is invalid or expired.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Unable to process audit attendance. The link may have expired or is no longer active.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyScheduleNo = () => {
    if (scheduleNo) {
      navigator.clipboard.writeText(scheduleNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal).split('T')[0];
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(dateVal);
    }
  };

  // Resolve Company details from DB
  const compName = companyProfile?.companyName || 'AUTONOVA';

  // Resolve Company Logo from DB with defaultLogo fallback
  const rawLogo = companyProfile?.logoFileName || companyProfile?.logo || companyProfile?.logoUrl;
  let compLogo = defaultLogo;
  if (rawLogo && typeof rawLogo === 'string') {
    if (rawLogo.startsWith('http') || rawLogo.startsWith('blob:') || rawLogo.startsWith('data:')) {
      compLogo = rawLogo;
    } else if (rawLogo.includes('/')) {
      compLogo = getFileViewUrl(rawLogo);
    } else {
      compLogo = getCompanyImageUrl(rawLogo) || getFileViewUrl(rawLogo);
    }
  }

  // Address (show only if available)
  const compAddressParts = [
    companyProfile?.address1,
    companyProfile?.address2,
    companyProfile?.city,
    companyProfile?.state ? `${companyProfile.state}${companyProfile?.pincode ? ` - ${companyProfile.pincode}` : ''}` : ''
  ].filter((p) => p && typeof p === 'string' && p.trim() !== '' && p.trim() !== '-' && p !== 'null');
  const compAddress = compAddressParts.length > 0 ? compAddressParts.join(', ') : null;

  // Phone: ONLY show if present in database with actual digits
  const rawPhone = companyProfile?.phoneNo || companyProfile?.mobileNo || companyProfile?.contactNo || companyProfile?.phone;
  let compPhone = null;
  if (rawPhone && typeof rawPhone === 'string') {
    const trimmed = rawPhone.trim();
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 6 && trimmed !== '+91' && trimmed !== '+91 ' && trimmed !== '91' && trimmed !== '+') {
      compPhone = trimmed;
    }
  }

  // Email (show if available)
  const rawEmail = companyProfile?.emailId || companyProfile?.email;
  const compEmail = (rawEmail && typeof rawEmail === 'string' && rawEmail.trim() !== '' && rawEmail.trim() !== '-' && rawEmail !== 'null') ? rawEmail.trim() : null;

  // Website (show if available)
  const rawWebsite = companyProfile?.website;
  const compWebsite = (rawWebsite && typeof rawWebsite === 'string' && rawWebsite.trim() !== '' && rawWebsite.trim() !== '-' && rawWebsite !== 'null') ? rawWebsite.trim() : null;

  // GSTIN (show if available)
  const rawGstin = companyProfile?.gstin || companyProfile?.gstNumber;
  const compGstin = (rawGstin && typeof rawGstin === 'string' && rawGstin.trim() !== '' && rawGstin.trim() !== '-' && rawGstin !== 'null') ? rawGstin.trim() : null;

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 60%, #020617 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Paper
          elevation={12}
          sx={{
            p: 5,
            borderRadius: 4,
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            color: 'white',
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)'
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
            <CircularProgress size={64} thickness={3.5} sx={{ color: '#38bdf8' }} />
            <Avatar
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 32,
                height: 32,
                bgcolor: 'transparent',
                color: '#38bdf8'
              }}
            >
              <SecurityRoundedIcon sx={{ fontSize: 20 }} />
            </Avatar>
          </Box>
          <Typography variant="h5" fontWeight="800" sx={{ letterSpacing: '-0.02em', color: '#f8fafc', mb: 1 }}>
            Connecting to QMS Engine
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6 }}>
            Verifying audit credentials and recording your IN attendance timestamp securely.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 0%, #1e293b 0%, #0f172a 50%, #020617 100%)',
        py: { xs: 3, sm: 5, md: 7 },
        px: { xs: 2, sm: 3 },
        position: 'relative',
        overflow: 'hidden',
        color: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Dynamic Ambient Background Glows */}
      <Box
        sx={{
          position: 'absolute',
          top: '-15%',
          left: '25%',
          width: 600,
          height: 600,
          background: linkExpired
            ? 'radial-gradient(circle, rgba(217, 119, 6, 0.18) 0%, rgba(0,0,0,0) 70%)'
            : 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-15%',
          right: '20%',
          width: 650,
          height: 650,
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.14) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Master Unified Executive Portal Card */}
        <Card
          elevation={16}
          sx={{
            borderRadius: 5,
            overflow: 'hidden',
            backdropFilter: 'blur(30px)',
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'white',
            boxShadow: '0 32px 80px rgba(0, 0, 0, 0.65)'
          }}
        >
          {/* Header Brand Bar */}
          <Box
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              bgcolor: 'rgba(30, 41, 59, 0.65)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              gap: { xs: 2, sm: 3 }
            }}
          >

            {/* Company Info */}
            <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: 'left' } }}>
              <Stack direction="row" spacing={1.5} alignItems="center" justifyContent={{ xs: 'center', sm: 'flex-start' }} sx={{ mb: 0.8 }}>
                <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.02em', color: '#f8fafc', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {compName}
                </Typography>
                <Chip
                  label="QMS CERTIFIED"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    fontWeight: '800',
                    fontSize: '0.68rem',
                    letterSpacing: '0.05em',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    height: 22
                  }}
                />
              </Stack>

              {compAddress && (
                <Typography variant="body2" sx={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 0.7, justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 1.2, fontSize: '0.84rem' }}>
                  <LocationOnRoundedIcon sx={{ fontSize: 16, color: '#38bdf8', flexShrink: 0 }} />
                  {compAddress}
                </Typography>
              )}

              <Stack
                direction="row"
                flexWrap="wrap"
                gap={1.5}
                alignItems="center"
                justifyContent={{ xs: 'center', sm: 'flex-start' }}
                sx={{ fontSize: '0.8rem', color: '#94a3b8' }}
              >
                {compEmail && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, bgcolor: 'rgba(15, 23, 42, 0.5)', px: 1.2, py: 0.4, borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <EmailRoundedIcon sx={{ fontSize: 14, color: '#38bdf8' }} />
                    <span>{compEmail}</span>
                  </Box>
                )}
                {compPhone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, bgcolor: 'rgba(15, 23, 42, 0.5)', px: 1.2, py: 0.4, borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <PhoneRoundedIcon sx={{ fontSize: 14, color: '#38bdf8' }} />
                    <span>{compPhone}</span>
                  </Box>
                )}
                {compWebsite && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, bgcolor: 'rgba(15, 23, 42, 0.5)', px: 1.2, py: 0.4, borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <LanguageRoundedIcon sx={{ fontSize: 14, color: '#38bdf8' }} />
                    <span>{compWebsite}</span>
                  </Box>
                )}
                {compGstin && (
                  <Chip
                    label={`GSTIN: ${compGstin}`}
                    size="small"
                    variant="outlined"
                    sx={{ color: '#94a3b8', borderColor: 'rgba(255,255,255,0.15)', fontSize: '0.72rem', height: 22 }}
                  />
                )}
              </Stack>
            </Box>
          </Box>

          {/* Hero Status Section */}
          {error ? (
            <Box
              sx={{
                p: { xs: 3, sm: 4.5 },
                textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.22) 0%, rgba(15, 23, 42, 0.6) 100%)',
                borderBottom: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  mx: 'auto',
                  mb: 2,
                  width: 72,
                  height: 72,
                  border: '2px solid rgba(239, 68, 68, 0.4)',
                  boxShadow: '0 8px 30px rgba(239, 68, 68, 0.3)'
                }}
              >
                <ErrorOutlineRoundedIcon sx={{ fontSize: 44 }} />
              </Avatar>
              <Typography variant="h4" fontWeight="800" sx={{ color: '#fca5a5', mb: 1 }}>
                Attendance Link Unavailable
              </Typography>
              <Typography variant="body1" sx={{ color: '#fecaca', maxWidth: 520, mx: 'auto', lineHeight: 1.5 }}>
                {error}
              </Typography>
            </Box>
          ) : linkExpired ? (
            <Box
              sx={{
                p: { xs: 3.5, sm: 4.5 },
                textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(217, 119, 6, 0.2) 0%, rgba(15, 23, 42, 0.6) 100%)',
                borderBottom: '1px solid rgba(217, 119, 6, 0.25)'
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'rgba(217, 119, 6, 0.25)',
                  color: '#fbbf24',
                  mx: 'auto',
                  mb: 2,
                  width: 76,
                  height: 76,
                  border: '2px solid rgba(251, 191, 36, 0.4)',
                  boxShadow: '0 10px 32px rgba(217, 119, 6, 0.35)'
                }}
              >
                <LockClockRoundedIcon sx={{ fontSize: 44 }} />
              </Avatar>
              <Chip
                label="LINK EXPIRED"
                sx={{
                  bgcolor: 'rgba(217, 119, 6, 0.25)',
                  color: '#fef08a',
                  fontWeight: '800',
                  fontSize: '0.74rem',
                  letterSpacing: '0.08em',
                  mb: 1.5,
                  border: '1px solid rgba(254, 240, 138, 0.4)',
                  px: 0.5
                }}
              />
              <Typography variant="h3" fontWeight="900" sx={{ letterSpacing: '-0.02em', color: '#fef3c7', fontSize: { xs: '1.6rem', sm: '2.1rem' }, mb: 1 }}>
                Attendance Link Expired
              </Typography>
              <Typography variant="body1" sx={{ color: '#cbd5e1', maxWidth: 560, mx: 'auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Attendance for this audit schedule has <strong>already been recorded</strong>. For audit integrity and security, this single-use link is no longer active.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                p: { xs: 3.5, sm: 4.5 },
                textAlign: 'center',
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.2) 0%, rgba(15, 23, 42, 0.6) 100%)',
                borderBottom: '1px solid rgba(16, 185, 129, 0.25)'
              }}
            >
              <Avatar
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.25)',
                  color: '#34d399',
                  mx: 'auto',
                  mb: 2,
                  width: 76,
                  height: 76,
                  border: '2px solid rgba(52, 211, 153, 0.4)',
                  boxShadow: '0 10px 32px rgba(16, 185, 129, 0.35)'
                }}
              >
                <CheckCircleRoundedIcon sx={{ fontSize: 48 }} />
              </Avatar>
              <Chip
                label="ATTENDANCE CONFIRMED"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.25)',
                  color: '#a7f3d0',
                  fontWeight: '800',
                  fontSize: '0.74rem',
                  letterSpacing: '0.08em',
                  mb: 1.5,
                  border: '1px solid rgba(167, 243, 208, 0.4)',
                  px: 0.5
                }}
              />
              <Typography variant="h3" fontWeight="900" sx={{ letterSpacing: '-0.02em', color: '#ecfdf5', fontSize: { xs: '1.6rem', sm: '2.1rem' }, mb: 1 }}>
                Attendance Marked Successfully!
              </Typography>
              <Typography variant="body1" sx={{ color: '#cbd5e1', maxWidth: 560, mx: 'auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Welcome, <strong>{auditData?.externalName || 'Auditor'}</strong>. Your presence has been officially authenticated in the QMS Audit Ledger.
              </Typography>
            </Box>
          )}

          {/* Main Card Content */}
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            {!error && (
              <Box>
                {/* Attendance Confirmation Ribbon */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 4,
                    borderRadius: 3.5,
                    background: linkExpired
                      ? 'linear-gradient(90deg, rgba(217, 119, 6, 0.14) 0%, rgba(30, 41, 59, 0.7) 100%)'
                      : 'linear-gradient(90deg, rgba(16, 185, 129, 0.14) 0%, rgba(30, 41, 59, 0.7) 100%)',
                    border: '1px solid',
                    borderColor: linkExpired ? 'rgba(217, 119, 6, 0.35)' : 'rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      sx={{
                        bgcolor: linkExpired ? '#d97706' : '#10b981',
                        color: 'white',
                        width: 50,
                        height: 50,
                        boxShadow: linkExpired ? '0 6px 20px rgba(217, 119, 6, 0.4)' : '0 6px 20px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <AccessTimeFilledRoundedIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 'bold' }}>
                        Recorded IN Timestamp
                      </Typography>
                      <Typography variant="h5" fontWeight="800" sx={{ color: linkExpired ? '#fef08a' : '#6ee7b7', letterSpacing: '-0.01em' }}>
                        {auditData?.inTime || 'Recorded IN'}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    icon={<VerifiedUserRoundedIcon sx={{ fontSize: '18px !important', color: linkExpired ? '#fef08a !important' : '#6ee7b7 !important' }} />}
                    label={linkExpired ? 'STATUS: PRESENT (RECORDED)' : 'STATUS: PRESENT (ACTIVE)'}
                    sx={{
                      bgcolor: linkExpired ? 'rgba(217, 119, 6, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                      color: linkExpired ? '#fef08a' : '#6ee7b7',
                      fontWeight: '800',
                      border: '1px solid',
                      borderColor: linkExpired ? 'rgba(217, 119, 6, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                      py: 2.2,
                      px: 1.5,
                      fontSize: '0.8rem'
                    }}
                  />
                </Paper>

                {/* Section Title */}
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                  <Typography variant="h5" fontWeight="800" sx={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <EventAvailableRoundedIcon sx={{ color: '#38bdf8' }} />
                    Audit Schedule Intelligence
                  </Typography>

                  <Tooltip title={copied ? 'Copied Schedule No!' : 'Click to copy Schedule No'}>
                    <Chip
                      label={scheduleNo}
                      onClick={handleCopyScheduleNo}
                      onDelete={handleCopyScheduleNo}
                      deleteIcon={<ContentCopyRoundedIcon sx={{ fontSize: '15px !important', color: '#38bdf8 !important' }} />}
                      sx={{
                        bgcolor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        fontWeight: '800',
                        fontSize: '0.82rem',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        cursor: 'pointer',
                        py: 2,
                        '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.25)' }
                      }}
                    />
                  </Tooltip>
                </Box>

                {/* Information Card Grid */}
                <Grid container spacing={2.5}>
                  {/* Audit Type */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: 3.5,
                        bgcolor: 'rgba(30, 41, 59, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          bgcolor: 'rgba(30, 41, 59, 0.85)'
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                        <CategoryRoundedIcon sx={{ fontSize: 16, color: '#38bdf8' }} />
                        <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                          Audit Type
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#f8fafc' }}>
                        {auditData?.auditType || 'Quality Audit'}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Audit Area / Location */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: 3.5,
                        bgcolor: 'rgba(30, 41, 59, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          bgcolor: 'rgba(30, 41, 59, 0.85)'
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                        <MeetingRoomRoundedIcon sx={{ fontSize: 16, color: '#38bdf8' }} />
                        <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                          Audit Area / Scope
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#f8fafc' }}>
                        {auditData?.auditArea || 'QMS Scope'}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Department */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: 3.5,
                        bgcolor: 'rgba(30, 41, 59, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          bgcolor: 'rgba(30, 41, 59, 0.85)'
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                        <CorporateFareRoundedIcon sx={{ fontSize: 16, color: '#38bdf8' }} />
                        <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                          Department
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#f8fafc' }}>
                        {auditData?.department || 'Quality Assurance'}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Date & Timings */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: 3.5,
                        bgcolor: 'rgba(30, 41, 59, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          bgcolor: 'rgba(30, 41, 59, 0.85)'
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                        <ScheduleRoundedIcon sx={{ fontSize: 16, color: '#38bdf8' }} />
                        <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                          Scheduled Schedule & Time
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#f8fafc' }}>
                        {formatDate(auditData?.auditDate)}
                        {auditData?.startTime ? ` (${auditData.startTime}${auditData?.endTime ? ` - ${auditData.endTime}` : ''})` : ''}
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Auditor */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: 3.5,
                        bgcolor: 'rgba(30, 41, 59, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          bgcolor: 'rgba(30, 41, 59, 0.85)'
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                        <PersonPinRoundedIcon sx={{ fontSize: 16, color: '#38bdf8' }} />
                        <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                          Auditor / Visitor Contact
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#f8fafc' }}>
                        {auditData?.externalName || auditData?.auditor || 'External Auditor'}
                      </Typography>
                      {email && (
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.3 }}>
                          {email}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>

                  {/* Auditee */}
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.2,
                        borderRadius: 3.5,
                        bgcolor: 'rgba(30, 41, 59, 0.65)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          bgcolor: 'rgba(30, 41, 59, 0.85)'
                        }
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                        <GroupsRoundedIcon sx={{ fontSize: 16, color: '#38bdf8' }} />
                        <Typography variant="caption" sx={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                          Auditee / Host Representative
                        </Typography>
                      </Box>
                      <Typography variant="subtitle1" fontWeight="800" sx={{ color: '#f8fafc' }}>
                        {auditData?.auditee || 'Quality Management Team'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Footer Actions */}
                <Box
                  display="flex"
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)', gap: 2 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <VerifiedUserRoundedIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                      Cryptographically Authenticated &bull; Autonova BOS(S)
                    </Typography>
                  </Stack>

                  <Button
                    variant="outlined"
                    startIcon={<PrintRoundedIcon />}
                    onClick={() => window.print()}
                    sx={{
                      color: '#f8fafc',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: '800',
                      px: 3,
                      py: 1,
                      '&:hover': {
                        borderColor: '#38bdf8',
                        color: '#38bdf8',
                        bgcolor: 'rgba(56, 189, 248, 0.12)'
                      }
                    }}
                  >
                    Print Audit Confirmation
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* System Watermark */}
        <Typography
          variant="caption"
          align="center"
          sx={{ display: 'block', mt: 3, color: '#64748b', fontSize: '0.75rem', fontWeight: 500 }}
        >
          &bull; Quality Management System (QMS) &copy; {new Date().getFullYear()} {compName}
        </Typography>
      </Container>
    </Box>
  );
};

export default ExternalAuditAttendance;
