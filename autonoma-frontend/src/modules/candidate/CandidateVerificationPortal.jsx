import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Button,
  TextField,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  Container,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'utils/axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconClock,
  IconLock,
  IconDeviceFloppy,
  IconChevronRight,
  IconAlertCircle,
  IconShieldCheck,
  IconUser,
  IconUsers,
  IconCheck
} from '@tabler/icons-react';
import { getCompanyImageUrl } from 'utils/upload-helper';
import { playPortalSound } from 'utils/AudioEngine';

import {
  CandidatePortalSplash,
  CandidateNetworkBackground,
  CandidatePortalHeader,
  staticBgStylesheet,
  SmoothLoadingSpinner,
  PremiumStarRating
} from './CandidatePortalShared';


const MotionCard = motion.create ? motion.create(Card) : motion(Card);
const MotionButton = motion.create ? motion.create(Button) : motion(Button);

const CandidateVerificationPortal = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState('');
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  const [applicantName, setApplicantName] = useState('');
  const [applicantCode, setApplicantCode] = useState('');
  const [role, setRole] = useState('');
  const [managerName, setManagerName] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [questions, setQuestions] = useState([]);

  // Store ratings and feedback text
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('candidateThemeMode') || 'light');

  const [verificationStarted, setVerificationStarted] = useState(() => {
    return sessionStorage.getItem('bgv_verification_started') === 'true';
  });
  const [splashDone, setSplashDone] = useState(() => {
    return sessionStorage.getItem('bgv_verification_started') === 'true';
  });
  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem('bgv_verification_started') !== 'true';
  });

  const [companyBranding, setCompanyBranding] = useState(() => {
    try {
      const cached = localStorage.getItem('candidate_company_branding');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return { logoUrl: null, companyName: 'Autonoma ERP' };
  });

  useEffect(() => {
    axios.get('/api/hra/applicants/portal/branding')
      .then(res => {
        if (res.data) {
          const cName = res.data.companyName || 'Autonoma ERP';
          const logoFileName = res.data.logoFileName;
          const lUrl = logoFileName ? getCompanyImageUrl(logoFileName) : null;
          const brandingData = { companyName: cName, logoUrl: lUrl };
          setCompanyBranding(brandingData);
          localStorage.setItem('candidate_company_branding', JSON.stringify(brandingData));
        }
      })
      .catch(err => console.error("Failed to fetch public portal branding", err));
  }, []);

  // Display welcome splash loader on mount
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        // delay marking done until exit animation completes (0.8s)
        setTimeout(() => setSplashDone(true), 800);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  useEffect(() => {
    if (!token) {
      setError('Invalid URL: Token is missing.');
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.get('/api/hra/applicants/verification/verify-token', {
          params: { token }
        });
        if (response.data.valid) {
          setValid(true);
          setAlreadySubmitted(response.data.alreadySubmitted);
          setRole(response.data.role);
          setManagerName(response.data.name);
          setApplicantName(response.data.applicantName);
          setApplicantCode(response.data.applicantCode || '');
          setDepartment(response.data.department || '');
          setDesignation(response.data.designation || '');
          setVerificationStatus(response.data.verificationStatus || '');
          setQuestions(response.data.questions || []);

          // Initialize responses map (retains existing loaded values if present, defaults to null)
          const initialResponses = {};
          (response.data.questions || []).forEach(q => {
            initialResponses[q.id] = {
              questionId: q.id,
              rating: q.existingRating !== undefined && q.existingRating !== null ? q.existingRating : null,
              feedback: q.existingFeedback || '',
              reason: ''
            };
          });
          setResponses(initialResponses);
        } else {
          setError(response.data.message || 'Invalid or expired verification token.');
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || 'Failed to verify token or verification link has expired.';
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Handle 401 Unauthorized globally for candidate page
  useEffect(() => {
    const handleUnauthorized = (e) => {
      const errMsg = (typeof e.detail === 'string' ? e.detail : e.detail?.message || e.detail?.error) || 'This verification link is invalid or has expired.';
      setError(errMsg);
      // Always stop loading so the error state is visible instead of an indefinite spinner
      setLoading(false);
    };
    window.addEventListener('bos-candidate-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('bos-candidate-unauthorized', handleUnauthorized);
  }, []);

  const handleStartVerification = () => {
    playPortalSound('next');
    setVerificationStarted(true);
    sessionStorage.setItem('bgv_verification_started', 'true');
  };

  const handleRatingChange = (questionId, newRating) => {
    if (newRating === null && responses[questionId]?.rating !== null) {
      // Prevent resetting to null once a rating is clicked
      return;
    }
    playPortalSound('click');
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        rating: newRating
      }
    }));

    if (newRating !== null) {
      setErrors(prev => {
        const next = { ...prev };
        if (next[questionId] === 'Rating is required *') {
          delete next[questionId];
        }
        if (newRating >= 3 && next[questionId] === 'Feedback is required *') {
          delete next[questionId];
        }
        return next;
      });
    }
  };

  const handleFeedbackChange = (questionId, text) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        feedback: text
      }
    }));

    if (text && text.trim()) {
      setErrors(prev => {
        const next = { ...prev };
        if (next[questionId] === 'Feedback is required *') {
          delete next[questionId];
        }
        return next;
      });
    }
  };

  const hasValidTextContent = (val, minAlphaNum = 2) => {
    if (val === undefined || val === null) return false;
    const str = val.toString().trim();
    if (!str) return false;
    const matches = str.match(/[a-zA-Z0-9\u0B80-\u0BFF]/g);
    return matches !== null && matches.length >= minAlphaNum;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const responsesArray = Object.values(responses);
    const stepErrors = {};

    // Validate that all questions are explicitly rated, and feedback contains valid text
    for (const resp of responsesArray) {
      if (resp.rating === null) {
        stepErrors[resp.questionId] = 'Rating is required *';
      } else {
        const rating = resp.rating;
        const feedback = resp.feedback ? resp.feedback.trim() : '';
        if ((rating === 1 || rating === 2) && !feedback) {
          stepErrors[resp.questionId] = 'Feedback is required *';
        } else if (feedback && !hasValidTextContent(feedback, 2)) {
          stepErrors[resp.questionId] = 'Remarks must contain valid text (at least 2 letters/digits) *';
        }
      }
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      playPortalSound('error');
      
      // Auto-scroll and focus the FIRST missing required rating/feedback in visual order
      setTimeout(() => {
        const firstErrorId = Object.keys(stepErrors)[0];
        const targetContainer = document.getElementById(`question-card-${firstErrorId}`);
        if (targetContainer) {
          targetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setErrors({});
    setError('');
    setSubmitting(true);
    try {
      await axios.post('/api/hra/applicants/verification/submit', {
        token,
        responses: responsesArray
      });
      playPortalSound('submit');
      setSubmitSuccess(true);
      // Clear BGV session storage state
      sessionStorage.removeItem('bgv_verification_started');
    } catch (err) {
      playPortalSound('error');
      const errMsg = err.response?.data?.message || err.response?.data?.error || (typeof err.response?.data === 'string' ? err.response.data : '') || 'Failed to submit verification details. Please try again.';
      setError(errMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextTheme);
    localStorage.setItem('candidateThemeMode', nextTheme);
  };

  const textPrimaryColor = themeMode === 'light' ? '#0f172a' : '#f8fafc';
  const textSecondaryColor = themeMode === 'light' ? '#475569' : '#cbd5e1';
  const textMutedColor = themeMode === 'light' ? '#64748b' : '#94a3b8';
  const borderCol = themeMode === 'light' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';

  const localTheme = React.useMemo(() => {
    return createTheme({
      palette: {
        mode: themeMode,
        primary: {
          main: '#0d9488'
        }
      }
    });
  }, [themeMode]);

  const wrapTheme = (content) => (
    <ThemeProvider theme={localTheme}>
      <div className={themeMode === 'light' ? 'theme-light' : 'theme-dark'} style={{ minHeight: '100vh' }}>
        {content}
      </div>
    </ThemeProvider>
  );


  const cardStyle = {
    background: themeMode === 'light' ? '#ffffff' : '#1e293b',
    border: `1.5px solid ${themeMode === 'light' ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: '24px',
    boxShadow: themeMode === 'light' 
      ? '0 20px 45px rgba(30, 40, 70, 0.04)' 
      : '0 30px 65px rgba(0, 0, 0, 0.4)',
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    maxWidth: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    '&:hover': {
      borderColor: themeMode === 'light' ? '#7c8cf8' : '#63d9c4',
      boxShadow: themeMode === 'light'
        ? '0 32px 50px rgba(124, 140, 248, 0.1), 0 0 0 1px rgba(124, 140, 248, 0.05)'
        : '0 32px 50px rgba(99, 217, 196, 0.1), 0 0 0 1.5px rgba(99, 217, 196, 0.2)'
    }
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      color: textPrimaryColor,
      backgroundColor: themeMode === 'light' ? '#F8FAFC' : 'rgba(15, 23, 42, 0.4)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      '& fieldset': {
        borderColor: borderCol
      },
      '&:hover fieldset': {
        borderColor: themeMode === 'light' ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)'
      },
      '&.Mui-focused fieldset': {
        borderColor: '#7c8cf8',
        borderWidth: '1.5px'
      }
    },
    '& .MuiInputLabel-root': {
      color: textMutedColor
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#7c8cf8'
    }
  };

  if (loading) {
    return wrapTheme(
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: themeMode === 'light' ? '#f8fafc' : '#0f172a'
        }}
      >
        {/* Inject @keyframes smoothSpin so the spinner animation is defined in the DOM */}
        <style>{staticBgStylesheet}</style>
        <SmoothLoadingSpinner size={54} color="#3b82f6" label="Loading verification portal..." />
      </Box>
    );
  }

  if (error && !valid) {
    return wrapTheme(
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <style>{staticBgStylesheet}</style>
        <CandidateNetworkBackground themeMode={themeMode} />
        
        <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <CandidatePortalHeader
            logoUrl={companyBranding.logoUrl}
            companyName={companyBranding.companyName}
            portalTitle="Background Verification Portal"
            themeMode={themeMode}
            toggleTheme={toggleTheme}
            borderCol={borderCol}
            textPrimaryColor={textPrimaryColor}
            textMutedColor={textMutedColor}
            onboardingStarted={false}
          />
          
          <Container maxWidth="sm" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', py: 4 }}>
            <Card sx={cardStyle}>
              <CardContent sx={{ textAlign: 'center', p: 2 }}>
                <Box sx={{ p: 2.5, borderRadius: '50%', bgcolor: 'rgba(239, 68, 68, 0.1)', color: 'error.main', display: 'inline-flex', mb: 3 }}>
                  <IconAlertCircle size={48} />
                </Box>
                <Typography variant="h2" sx={{ fontWeight: 800, color: textPrimaryColor, mb: 2 }}>
                  Verification Request Error
                </Typography>
                <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }}>
                  {error}
                </Alert>
                <Typography variant="body2" sx={{ color: textMutedColor }}>
                  Please contact the Autonoma HR team to request a new verification link.
                </Typography>
              </CardContent>
            </Card>
          </Container>
        </Box>
      </Box>
    );
  }

  if (alreadySubmitted || submitSuccess) {
    return wrapTheme(
      <Box sx={{ position: 'relative', minHeight: '100vh' }}>
        <style>{staticBgStylesheet}</style>
        <CandidateNetworkBackground themeMode={themeMode} />

        <Box sx={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Container maxWidth="sm" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', py: 4 }}>
            <MotionCard
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
              whileHover={{
                y: -8,
                boxShadow: themeMode === 'light'
                  ? '0 32px 40px -8px rgba(124,140,248,0.12), 0 16px 24px -6px rgba(0,0,0,0.05)'
                  : '0 32px 40px -8px rgba(124,140,248,0.2), 0 16px 24px -6px rgba(0,0,0,0.5)'
              }}
              sx={{
                ...cardStyle,
                p: { xs: 4, sm: 5 },
                borderTop: '5px solid transparent',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '24px',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '5px',
                  background: 'linear-gradient(90deg, #7c8cf8 0%, #63d9c4 100%)',
                  borderRadius: '24px 24px 0 0'
                }
              }}
            >
              <CardContent sx={{ textAlign: 'center', p: 0 }}>
                {/* Company branding header inside card */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 3 }}>
                  {companyBranding.logoUrl ? (
                    <Box sx={{
                      p: 0.8,
                      bgcolor: themeMode === 'light' ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${borderCol}`,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '42px',
                      width: '42px'
                    }}>
                      <img
                        src={companyBranding.logoUrl}
                        alt={companyBranding.companyName}
                        onError={(e) => { e.target.style.display = 'none'; }}
                        style={{ maxHeight: '30px', maxWidth: '34px', objectFit: 'contain' }}
                      />
                    </Box>
                  ) : (
                    <Box className="brand-mark" sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '18px' }}>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </Box>
                  )}
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '15px', fontFamily: "'Manrope', sans-serif", color: textPrimaryColor, lineHeight: 1.15 }}>
                      {companyBranding.companyName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: textMutedColor, fontWeight: 500, fontSize: '12px' }}>
                      Verification Portal
                    </Typography>
                  </Box>
                </Box>

                {/* SVG Document & Identity Verification Illustration */}
                <Box className="illus" sx={{ display: 'flex', justifyContent: 'center', mb: 3.5 }}>
                  <svg viewBox="0 0 150 130" fill="none" style={{ width: '150px', height: '130px' }}>
                    <rect x="42" y="18" width="76" height="86" rx="14" fill={themeMode === 'light' ? 'rgba(124,140,248,0.12)' : 'rgba(124,140,248,0.06)'} stroke={themeMode === 'light' ? 'rgba(90,100,190,0.35)' : 'rgba(140,155,255,0.35)'} strokeWidth="1.5" />
                    <line x1="58" y1="46" x2="98" y2="46" stroke={themeMode === 'light' ? 'rgba(90,100,190,0.45)' : 'rgba(140,155,255,0.45)'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="58" y1="60" x2="90" y2="60" stroke={themeMode === 'light' ? 'rgba(90,100,190,0.3)' : 'rgba(140,155,255,0.3)'} strokeWidth="3" strokeLinecap="round" />
                    <line x1="58" y1="74" x2="94" y2="74" stroke={themeMode === 'light' ? 'rgba(90,100,190,0.3)' : 'rgba(140,155,255,0.3)'} strokeWidth="3" strokeLinecap="round" />

                    <circle className="check-pulse c1" cx="100" cy="22" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90,100,190,0.4)' : 'rgba(140,155,255,0.4)'} strokeWidth="1.5" />
                    <path className="check-pulse c1" d="M94 22l4 4 8-8" stroke="#7c8cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                    <circle className="check-pulse c2" cx="128" cy="40" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90,100,190,0.4)' : 'rgba(140,155,255,0.4)'} strokeWidth="1.5" />
                    <path className="check-pulse c2" d="M122 40l4 4 8-8" stroke="#63d9c4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                    <g className="lock-float">
                      <rect x="22" y="72" width="46" height="38" rx="10" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90,100,190,0.4)' : 'rgba(140,155,255,0.4)'} strokeWidth="1.5" />
                      <path d="M31 72v-9a14 14 0 0128 0v9" stroke={themeMode === 'light' ? 'rgba(90,100,190,0.5)' : 'rgba(140,155,255,0.5)'} strokeWidth="3" fill="none" strokeLinecap="round" />
                      <circle className="check-pulse c3" cx="45" cy="91" r="10.5" fill="#63d9c4" />
                      <path className="check-pulse c3" d="M40 91l4 4 7-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </g>
                  </svg>
                </Box>

                <Typography
                  variant="h2"
                  sx={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 800,
                    fontSize: '28px',
                    mb: 2.5,
                    backgroundImage: 'linear-gradient(90deg, #7c8cf8, #63d9c4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Verification Submitted
                </Typography>
                
                <Typography variant="body1" sx={{ color: textSecondaryColor, mb: 4, lineHeight: 1.6 }}>
                  Thank you, <strong>{managerName}</strong>. Your professional verification and reference feedback for <strong>{applicantName}</strong> has been successfully recorded.
                </Typography>
                
                <Typography variant="body2" sx={{ color: textMutedColor }}>
                  You can now safely close this window.
                </Typography>
              </CardContent>
            </MotionCard>
          </Container>
        </Box>
      </Box>
    );
  }

  const totalQuestions = questions.length;
  const answeredQuestions = Object.values(responses).filter(resp => resp.rating !== null).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  const stepLabel = `${answeredQuestions} of ${totalQuestions} criteria rated`;

  return wrapTheme(
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        height: !verificationStarted ? { xs: 'auto', md: '100vh' } : 'auto',
        overflow: !verificationStarted ? { xs: 'visible', md: 'hidden' } : 'visible'
      }}
    >
      <style>{staticBgStylesheet}</style>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'all' }}
          >
            <CandidatePortalSplash
              logoUrl={companyBranding.logoUrl}
              companyName={companyBranding.companyName}
              greetingName={managerName ? `Welcome, ${managerName.split(' ')[0]}` : 'Welcome, Verifier'}
              subtext="Initialising verification portal..."
              themeMode={themeMode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {splashDone && (
        <>
          <CandidateNetworkBackground themeMode={themeMode} />

          <Box
            sx={{
              minHeight: '100vh',
              height: { xs: 'auto', md: !verificationStarted ? '100vh' : 'auto' },
              overflow: { xs: 'visible', md: !verificationStarted ? 'hidden' : 'visible' },
              background: 'transparent',
              position: 'relative',
              transition: 'background 0.3s ease, color 0.3s ease',
              color: textPrimaryColor,
              display: 'flex',
              flexDirection: 'column',
              pb: { xs: 8, md: !verificationStarted ? 0 : 12 },
              zIndex: 1,
              overflowX: 'hidden'
            }}
          >
            <CandidatePortalHeader
              logoUrl={companyBranding.logoUrl}
              companyName={companyBranding.companyName}
              portalTitle="Background Verification Portal"
              candidateName={managerName}
              candidateId={`( ${role === 'REPORTING_MANAGER' ? 'HR Manager' : 'Vertical Head'} )`}
              saveStatus={submitting ? 'saving' : null}
              themeMode={themeMode}
              toggleTheme={toggleTheme}
              progressPercent={progressPercent}
              borderCol={borderCol}
              textPrimaryColor={textPrimaryColor}
              textMutedColor={textMutedColor}
              onboardingStarted={verificationStarted}
              activeTab={0}
              totalSteps={1}
              progressText="Verification progress"
              stepLabel={stepLabel}
            />

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: { xs: 2.5, sm: 3, md: 6 } }}>
              <Container
                maxWidth={!verificationStarted ? "lg" : "md"}
                sx={{
                  maxWidth: !verificationStarted ? '1280px' : undefined,
                  mx: 'auto',
                  px: { xs: 2, sm: 3, md: 4 },
                  width: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1,
                  justifyContent: 'center',
                  overflowX: 'hidden'
                }}
              >
                <AnimatePresence mode="wait">
                  {!verificationStarted ? (
                    <motion.div
                      key="welcome-step"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', width: '100%' }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          flexGrow: 1,
                          justifyContent: 'center',
                          alignItems: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          maxWidth: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div className="scan-ring"></div>
                        <div className="scan-ring inner"></div>

                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
                            gap: { xs: 3.5, sm: 5, md: 8 },
                            alignItems: 'center',
                            width: '100%',
                            mt: { xs: 2, sm: 3, md: 0 },
                            position: 'relative',
                            zIndex: 2,
                            boxSizing: 'border-box'
                          }}
                        >
                          <Box sx={{ textAlign: 'left', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                            <Box
                              className="welcome-badge"
                              sx={{
                                display: 'inline-block',
                                px: { xs: 1.5, sm: 2 },
                                py: 0.8,
                                borderRadius: '999px',
                                background: themeMode === 'light'
                                  ? 'linear-gradient(90deg, rgba(124,140,248,0.18), rgba(99,217,196,0.22))'
                                  : 'linear-gradient(90deg, rgba(124,140,248,0.12), rgba(99,217,196,0.15))',
                                border: themeMode === 'light' ? '1px solid rgba(124,140,248,0.25)' : '1px solid rgba(124,140,248,0.15)',
                                fontSize: { xs: '11px', sm: '12px' },
                                fontWeight: 700,
                                letterSpacing: '0.6px',
                                color: '#7c8cf8',
                                mb: { xs: 2, sm: 3 },
                                maxWidth: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              SECURE VERIFICATION GATEWAY
                            </Box>

                            <Typography
                              variant="h1"
                              sx={{
                                fontFamily: "'Manrope', sans-serif",
                                fontWeight: 800,
                                color: textPrimaryColor,
                                fontSize: { xs: '28px', sm: '38px', md: '48px', lg: '56px' },
                                lineHeight: { xs: 1.15, sm: 1.1, md: 1.05 },
                                mb: { xs: 1.5, sm: 2.5 },
                                letterSpacing: { xs: '-0.5px', sm: '-1px' },
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                maxWidth: '100%'
                              }}
                            >
                              <Box component="span" sx={{ display: 'inline', mr: { xs: 1, sm: 1.5 } }}>
                                Welcome,
                              </Box>
                              <Box
                                component="span"
                                sx={{
                                  display: 'inline',
                                  backgroundImage: 'linear-gradient(90deg, #7c8cf8, #63d9c4)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                  backgroundClip: 'text',
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word'
                                }}
                              >
                                {managerName ? managerName.split(' ')[0] : 'Verifier'}
                              </Box>
                            </Typography>

                            <Typography
                              variant="h2"
                              sx={{
                                fontFamily: "'Manrope', sans-serif",
                                fontWeight: 700,
                                fontSize: { xs: '18px', sm: '21px', md: '24px' },
                                lineHeight: 1.3,
                                mb: { xs: 1.5, sm: 2 },
                                color: textPrimaryColor,
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                maxWidth: '100%'
                              }}
                            >
                              Candidate Background Verification Portal
                            </Typography>

                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 400,
                                color: textMutedColor,
                                mb: { xs: 3, sm: 4.5 },
                                fontSize: { xs: '14px', sm: '15px', md: '16px' },
                                lineHeight: 1.6,
                                maxWidth: { xs: '100%', md: '460px' },
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word'
                              }}
                            >
                              Thank you for participating in our reference check. This portal enables you to verify the candidate's employment background, performance, and key traits securely.
                            </Typography>

                            <Stack
                              direction="row"
                              spacing={{ xs: 1.5, sm: 2.5, md: 3 }}
                              sx={{
                                pt: 0.5,
                                flexWrap: 'wrap',
                                gap: { xs: '10px 14px', sm: '12px 20px' },
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              {[
                                { label: '256-bit encrypted secure verification link', icon: <IconLock size={18} stroke={3} color="#fff" /> },
                                { label: 'Completion time: ~3 mins', icon: <IconClock size={18} stroke={3} color="#fff" /> },
                                { label: 'Draft session state retained', icon: <IconDeviceFloppy size={18} stroke={3} color="#fff" /> }
                              ].map(({ label, icon }) => (
                                <Tooltip key={label} title={label} arrow placement="bottom">
                                  <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: { xs: 34, sm: 36 },
                                    height: { xs: 34, sm: 36 },
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #7c8cf8, #63d9c4)',
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 10px rgba(124,140,248,0.3)'
                                    }
                                  }}>
                                    {icon}
                                  </Box>
                                </Tooltip>
                              ))}
                            </Stack>
                          </Box>

                          <MotionCard
                            className="welcome-card"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                            whileHover={isMobile ? {} : {
                              y: -8,
                              boxShadow: themeMode === 'light'
                                ? '0 32px 40px -8px rgba(124,140,248,0.12), 0 16px 24px -6px rgba(0,0,0,0.05)'
                                : '0 32px 40px -8px rgba(124,140,248,0.2), 0 16px 24px -6px rgba(0,0,0,0.5)'
                            }}
                            sx={{
                              ...cardStyle,
                              p: { xs: 2.5, sm: 4, md: 5 },
                              width: '100%',
                              maxWidth: { xs: '100%', sm: '480px', md: '100%' },
                              mx: 'auto',
                              boxSizing: 'border-box',
                              borderTop: '5px solid transparent',
                              backgroundImage: cardStyle.background
                                ? `${cardStyle.background}`
                                : undefined,
                              borderImageSlice: 1,
                              position: 'relative',
                              overflow: 'hidden',
                              borderRadius: { xs: '18px', sm: '24px' },
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '5px',
                                background: 'linear-gradient(90deg, #7c8cf8 0%, #63d9c4 100%)',
                                borderRadius: '24px 24px 0 0'
                              }
                            }}
                          >
                            <CardContent sx={{ p: 0, textAlign: 'left' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3.5 }}>
                                {companyBranding.logoUrl ? (
                                  <Box sx={{
                                    p: 0.5,
                                    bgcolor: themeMode === 'light' ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${borderCol}`,
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '38px',
                                    width: '38px'
                                  }}>
                                    <img
                                      src={companyBranding.logoUrl}
                                      alt={companyBranding.companyName}
                                      style={{ maxHeight: '28px', maxWidth: '32px', objectFit: 'contain' }}
                                    />
                                  </Box>
                                ) : (
                                  <Box className="brand-mark" sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '18px' }}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                  </Box>
                                )}
                                <Box>
                                  <Typography sx={{ fontWeight: 800, fontSize: '15px', fontFamily: "'Manrope', sans-serif", color: textPrimaryColor, lineHeight: 1.15 }}>
                                    {companyBranding.companyName}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: textMutedColor, fontWeight: 500, fontSize: '12px' }}>
                                    Reference Verification Portal
                                  </Typography>
                                </Box>
                              </Box>

                              <Box className="illus" sx={{ display: 'flex', justifyContent: 'center', mb: 3.5 }}>
                                <svg viewBox="0 0 150 130" fill="none" style={{ width: '150px', height: '130px' }}>
                                  <rect x="42" y="18" width="76" height="86" rx="14" fill={themeMode === 'light' ? 'rgba(124,140,248,0.12)' : 'rgba(124,140,248,0.06)'} stroke={themeMode === 'light' ? 'rgba(90,100,190,0.35)' : 'rgba(140,155,255,0.35)'} strokeWidth="1.5" />
                                  <line x1="58" y1="46" x2="98" y2="46" stroke={themeMode === 'light' ? 'rgba(90,100,190,0.45)' : 'rgba(140,155,255,0.45)'} strokeWidth="3" strokeLinecap="round" />
                                  <line x1="58" y1="60" x2="90" y2="60" stroke={themeMode === 'light' ? 'rgba(90,100,190,0.3)' : 'rgba(140,155,255,0.3)'} strokeWidth="3" strokeLinecap="round" />
                                  <line x1="58" y1="74" x2="94" y2="74" stroke={themeMode === 'light' ? 'rgba(90,100,190,0.3)' : 'rgba(140,155,255,0.3)'} strokeWidth="3" strokeLinecap="round" />

                                  <circle className="check-pulse c1" cx="100" cy="22" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90,100,190,0.4)' : 'rgba(140,155,255,0.4)'} strokeWidth="1.5" />
                                  <path className="check-pulse c1" d="M94 22l4 4 8-8" stroke="#7c8cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                                  <circle className="check-pulse c2" cx="128" cy="40" r="13" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90,100,190,0.4)' : 'rgba(140,155,255,0.4)'} strokeWidth="1.5" />
                                  <path className="check-pulse c2" d="M122 40l4 4 8-8" stroke="#63d9c4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                                  <g className="lock-float">
                                    <rect x="22" y="72" width="46" height="38" rx="10" fill={themeMode === 'light' ? '#fff' : '#1b2333'} stroke={themeMode === 'light' ? 'rgba(90,100,190,0.4)' : 'rgba(140,155,255,0.4)'} strokeWidth="1.5" />
                                    <path d="M31 72v-9a14 14 0 0128 0v9" stroke={themeMode === 'light' ? 'rgba(90,100,190,0.5)' : 'rgba(140,155,255,0.5)'} strokeWidth="3" fill="none" strokeLinecap="round" />
                                    <circle className="check-pulse c3" cx="45" cy="91" r="10.5" fill="#63d9c4" />
                                    <path className="check-pulse c3" d="M40 91l4 4 7-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                  </g>
                                </svg>
                              </Box>

                              <MotionButton
                                component={motion.button}
                                whileHover={{ scale: 1.03, translateY: -2 }}
                                whileTap={{ scale: 0.98 }}
                                variant="contained"
                                onClick={handleStartVerification}
                                endIcon={<IconChevronRight size={18} />}
                                fullWidth
                                className="cta-sweep-btn"
                                sx={{
                                  background: 'linear-gradient(90deg, #7c8cf8, #63d9c4)',
                                  py: 2,
                                  borderRadius: '14px',
                                  fontSize: '15.5px',
                                  fontWeight: 700,
                                  boxShadow: '0 14px 30px -12px rgba(124,140,248,0.55)',
                                  textTransform: 'none',
                                  mb: 3,
                                  color: '#fff'
                                }}
                              >
                                Start Verification
                              </MotionButton>

                              <Typography variant="caption" sx={{ color: textMutedColor, display: 'block', textAlign: 'center', lineHeight: 1.5, px: 2 }}>
                                You've received a secure invitation link from {companyBranding.companyName}. Please do not share it.
                              </Typography>
                            </CardContent>
                          </MotionCard>
                        </Box>
                      </Box>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form-step"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      style={{ width: '100%' }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Card sx={{ ...cardStyle, p: 0, overflow: 'hidden', width: '100%' }}>
                          <Box sx={{ p: 0, width: '100%' }}>
                            {/* Candidate Banner - Full Width Gradient */}
                            <Box 
                              sx={{
                                background: 'linear-gradient(135deg, #7c8cf8 0%, #63d9c4 100%)',
                                p: { xs: 2, sm: 3.5 },
                                display: 'flex',
                                alignItems: 'center',
                                gap: { xs: 1.75, sm: 3 },
                                position: 'relative'
                              }}
                            >
                              <Box 
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: { xs: 46, sm: 60 },
                                  height: { xs: 46, sm: 60 },
                                  borderRadius: '50%',
                                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                                  color: '#ffffff',
                                  border: '1.5px solid rgba(255, 255, 255, 0.25)',
                                  flexShrink: 0
                                }}
                              >
                                <IconUser size={26} />
                              </Box>
                              <Box sx={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                                  Candidate
                                </Typography>
                                <Typography sx={{ color: '#ffffff', fontSize: { xs: '18px', sm: '24px' }, fontWeight: 800, fontFamily: "'Manrope', sans-serif", mt: 0.1, wordBreak: 'break-word' }}>
                                  {applicantName}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Overlapping Shield Badge */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: '-18px', position: 'relative', zIndex: 2 }}>
                              <Box 
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  bgcolor: themeMode === 'light' ? '#ffffff' : '#1e293b',
                                  border: `1px solid ${themeMode === 'light' ? 'rgba(124, 140, 248, 0.2)' : 'rgba(99, 217, 196, 0.25)'}`,
                                  color: '#63d9c4',
                                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
                                }}
                              >
                                <IconShieldCheck size={18} stroke={2.5} />
                              </Box>
                            </Box>

                            {/* Main content body with padding */}
                            <Box sx={{ p: { xs: 1.5, sm: 4 }, pt: { xs: 1.5, sm: 2 } }}>
                              {error && (
                                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                                  {error}
                                </Alert>
                              )}

                              <form onSubmit={handleSubmit}>
                                <Stack spacing={3}>
                                  <Box>
                                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                                      <Typography
                                        variant="h3"
                                        sx={{
                                          fontWeight: 800,
                                          mb: 1,
                                          color: textPrimaryColor,
                                          fontSize: { xs: '18px', sm: '24px' },
                                          fontFamily: "'Manrope', sans-serif"
                                        }}
                                      >
                                        Evaluation &amp; Feedback Form
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: textSecondaryColor, maxWidth: '640px', mx: 'auto', lineHeight: 1.5, fontSize: { xs: '13px', sm: '14px' } }}>
                                        Please rate <Box component="span" sx={{ color: '#7c8cf8', fontWeight: 800 }}>{applicantName}</Box> on the following criteria based on your experience working with them. All star ratings are mandatory.
                                      </Typography>
                                    </Box>

                                  <Stack spacing={2.5}>
                                    {questions.map((q, index) => {
                                      const resp = responses[q.id] || { rating: null, feedback: '', reason: '' };
                                      const isRatingError = errors[q.id] === 'Rating is required *';
                                      const isFeedbackError = errors[q.id] === 'Feedback is required *';
                                      const isError = isRatingError || isFeedbackError;
                                      return (
                                        <Box
                                          key={q.id}
                                          id={`question-card-${q.id}`}
                                          aria-invalid={isError}
                                          sx={(theme) => ({
                                            p: { xs: 1.5, sm: 3 },
                                            borderRadius: '16px',
                                            border: isError ? '1.5px solid #ef4444' : `1px solid ${borderCol}`,
                                            borderLeft: isError ? '5px solid #ef4444' : `5px solid #7c8cf8`,
                                            bgcolor: themeMode === 'light' ? '#ffffff' : '#1e293b',
                                            boxShadow: isError ? '0 0 0 1px rgba(239, 68, 68, 0.15)' : '0 10px 25px -5px rgba(0,0,0,0.02)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            '&:hover': {
                                              borderColor: isError ? '#ef4444' : (themeMode === 'light' ? '#7c8cf8' : '#63d9c4'),
                                              boxShadow: themeMode === 'light'
                                                ? '0 20px 40px rgba(124, 140, 248, 0.08)'
                                                : '0 20px 40px rgba(0, 0, 0, 0.3)'
                                            },
                                            ...(isError ? {
                                              animation: 'shakeError 0.4s ease-in-out',
                                              '@keyframes shakeError': {
                                                '0%, 100%': { transform: 'translateX(0)' },
                                                '20%, 60%': { transform: 'translateX(-4px)' },
                                                '40%, 80%': { transform: 'translateX(4px)' }
                                              }
                                            } : {})
                                          })}
                                        >
                                          <Stack direction="row" spacing={{ xs: 1.25, sm: 2 }} alignItems="flex-start" sx={{ mb: 1.75 }}>
                                            <Box sx={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              width: { xs: 26, sm: 32 },
                                              height: { xs: 26, sm: 32 },
                                              minWidth: { xs: 26, sm: 32 },
                                              borderRadius: '50%',
                                              background: 'linear-gradient(135deg, #7c8cf8, #63d9c4)',
                                              color: '#fff',
                                              fontWeight: 800,
                                              fontSize: { xs: '11px', sm: '12px' },
                                              flexShrink: 0,
                                              mt: 0.25
                                            }}>
                                              {index + 1}
                                            </Box>
                                            <Typography
                                              variant="subtitle1"
                                              sx={{
                                                fontWeight: 800,
                                                color: textPrimaryColor,
                                                fontFamily: "'Manrope', sans-serif",
                                                fontSize: { xs: '0.94rem', sm: '1.05rem' },
                                                lineHeight: 1.45,
                                                flex: 1,
                                                minWidth: 0,
                                                wordBreak: 'break-word'
                                              }}
                                            >
                                              {q.description}
                                            </Typography>
                                          </Stack>

                                          <Box
                                            sx={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              my: { xs: 1.25, sm: 2 },
                                              p: { xs: 1.25, sm: 2 },
                                              borderRadius: '12px',
                                              bgcolor: themeMode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.018)',
                                              border: isError
                                                ? '1.5px solid rgba(239,68,68,0.6)'
                                                : `1px solid ${borderCol}`,
                                              transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                                              boxShadow: isError
                                                ? '0 0 0 3px rgba(239,68,68,0.08)'
                                                : 'none',
                                              width: '100%',
                                              boxSizing: 'border-box'
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                color: textMutedColor,
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                fontSize: '10px',
                                                letterSpacing: '0.5px',
                                                mb: 1.25
                                              }}
                                            >
                                              Select Rating:
                                            </Typography>

                                            <PremiumStarRating
                                              questionId={q.id}
                                              value={resp.rating}
                                              onChange={handleRatingChange}
                                              themeMode={themeMode}
                                              isError={isError}
                                            />

                                            {isRatingError && (
                                              <Typography
                                                id={`error-text-${q.id}`}
                                                aria-live="polite"
                                                variant="caption"
                                                sx={{
                                                  color: '#ef4444',
                                                  fontWeight: 700,
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 0.5,
                                                  mt: 1.25
                                                }}
                                              >
                                                <IconAlertCircle size={14} />
                                                Rating is required *
                                              </Typography>
                                            )}
                                          </Box>

                                          <Stack spacing={1} sx={{ mt: 2 }}>
                                            {resp.rating !== null && (resp.rating === 1 || resp.rating === 2) && (
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  color: '#ef4444',
                                                  fontWeight: 700,
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 0.5,
                                                  mb: 0.5
                                                }}
                                              >
                                                <IconAlertCircle size={14} />
                                                Low rating should contain remarks *
                                              </Typography>
                                            )}
                                            <TextField
                                              fullWidth
                                              multiline
                                              rows={2}
                                              variant="outlined"
                                              label={
                                                resp.rating !== null && (resp.rating === 1 || resp.rating === 2)
                                                  ? "Additional Feedback (Required) *"
                                                  : "Additional Feedback (Optional)"
                                              }
                                              placeholder="Provide any specific remarks or examples..."
                                              value={resp.feedback}
                                              onChange={(e) => handleFeedbackChange(q.id, e.target.value)}
                                              error={isFeedbackError}
                                              helperText={isFeedbackError ? "Remarks are required for low rating *" : ""}
                                              sx={[
                                                inputStyle,
                                                { width: '100%' },
                                                isFeedbackError ? {
                                                  animation: 'shakeError 0.4s ease-in-out',
                                                  '@keyframes shakeError': {
                                                    '0%, 100%': { transform: 'translateX(0)' },
                                                    '25%': { transform: 'translateX(-4px)' },
                                                    '50%': { transform: 'translateX(4px)' },
                                                    '75%': { transform: 'translateX(-4px)' }
                                                  }
                                                } : {}
                                              ]}
                                            />
                                          </Stack>
                                        </Box>
                                      );
                                    })}
                                  </Stack>
                                </Box>

                                <Divider sx={{ my: 1, borderColor: borderCol }} />

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                                  <MotionButton
                                    whileHover={{ scale: 1.02, translateY: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    variant="contained"
                                    disabled={submitting}
                                    sx={{
                                      width: { xs: '100%', sm: 'auto' },
                                      px: { xs: 3, sm: 6 },
                                      py: 1.5,
                                      borderRadius: '14px',
                                      fontSize: '1rem',
                                      fontWeight: 700,
                                      textTransform: 'none',
                                      background: 'linear-gradient(90deg, #7c8cf8 0%, #63d9c4 100%)',
                                      color: '#fff',
                                      boxShadow: '0 8px 20px -6px rgba(124,140,248,0.4)',
                                      height: '52px'
                                    }}
                                  >
                                    {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
                                  </MotionButton>
                                </Box>
                              </Stack>
                              </form>
                            </Box>
                          </Box>
                        </Card>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Container>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default CandidateVerificationPortal;
