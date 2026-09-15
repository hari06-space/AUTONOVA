import { useState, useEffect, useRef } from 'react';

// material-ui
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormHelperText from '@mui/material/FormHelperText';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Checkbox from '@mui/material/Checkbox';
import { useTheme, alpha } from '@mui/material/styles';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';
import { motion, AnimatePresence } from 'framer-motion';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import CustomFormControl from 'ui-component/extended/Form/CustomFormControl';
import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';
import axios from 'utils/axios';
import { FaceAuthEngine, CameraManager, FaceDetectionService } from 'utils/face';
import FaceDetectionDashboard from './FaceDetectionDashboard';
import ActiveSessionConfirmationDialog from 'ui-component/ActiveSessionConfirmationDialog';

// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { IconBuilding, IconBuildingFactory2, IconArrowLeft, IconLogin, IconShieldCheck, IconLock, IconCheck, IconInfoCircle, IconCamera, IconCameraOff, IconScan, IconUser, IconFaceId, IconActivity, IconDiamond } from '@tabler/icons-react';

// ===============================|| JWT - TWO-STEP LOGIN ||=============================== //

export default function JWTLogin({ onFaceModeChange, ...others }) {
  const theme = useTheme();
  const { login, faceLogin } = useAuth();
  const scriptedRef = useScriptRef();

  // Step management: 'credentials' | 'selection'
  const [step, setStep] = useState('credentials');
  const [loginMethod, setLoginMethod] = useState(() => {
    return localStorage.getItem('preferredLoginMethod') || 'password';
  });

  // Background model preloading for instant face camera startup
  useEffect(() => {
    FaceDetectionService.initialize().catch(err => console.warn('Background model preload notice:', err));
  }, []); // 'password' | 'face'

  const handleLoginMethodChange = (method) => {
    setLoginMethod(method);
    localStorage.setItem('preferredLoginMethod', method);
  };
  const [showPassword, setShowPassword] = useState(false);
  const [checkError, setCheckError] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [faceScanSuccess, setFaceScanSuccess] = useState(false);

  useEffect(() => {
    if (onFaceModeChange) {
      onFaceModeChange(loginMethod === 'face' && step === 'credentials');
    }
  }, [loginMethod, step, onFaceModeChange]);

  const [webcamStream, setWebcamStream] = useState(null);
  const webcamStreamRef = useRef(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState(null);
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const engineRef = useRef(null);
  const [engineState, setEngineState] = useState(null);

  const [pendingCredentials, setPendingCredentials] = useState({ username: '', password: '', faceImage: '', faceDescriptors: null });
  const [companies, setCompanies] = useState([]); // [{company, divisions}]

  // Session Takeover State
  const [sessionConflictState, setSessionConflictState] = useState({
    open: false,
    sessionInfo: null,
    pendingAction: null,
    pendingParams: null
  });
  const [isTakingOver, setIsTakingOver] = useState(false);

  // Step 2 selections
  const [selectedCompanyIndex, setSelectedCompanyIndex] = useState(0);
  const [selectedDivisionId, setSelectedDivisionId] = useState('');

  const handleClickShowPassword = () => setShowPassword((v) => !v);
  const handleMouseDownPassword = (e) => e.preventDefault();

  const cameraManagerRef = useRef(null);

  const startWebcam = () => {
    setWebcamError(null);
    setWebcamActive(true);
  };

  useEffect(() => {
    let active = true;
    if (webcamActive && loginMethod === 'face' && step === 'credentials') {
      const initCam = async () => {
        let videoElement = document.getElementById('webcam-video');
        let attempts = 0;
        while (!videoElement && attempts < 10 && active) {
          await new Promise(r => setTimeout(r, 50));
          videoElement = document.getElementById('webcam-video');
          attempts++;
        }

        if (!active) return;
        if (!videoElement) {
          setWebcamError("Camera video element not available.");
          setWebcamActive(false);
          return;
        }

        try {
          if (!cameraManagerRef.current) {
            cameraManagerRef.current = new CameraManager({ width: 640, height: 480 });
          }
          await cameraManagerRef.current.start(videoElement);
          setWebcamError(null);
        } catch (err) {
          if (!active) return;
          console.error("CameraManager access error:", err);
          setWebcamError(err.message || "Camera access denied or unavailable.");
          setWebcamActive(false);
        }
      };
      initCam();
    }
    return () => {
      active = false;
    };
  }, [webcamActive, loginMethod, step]);

  const stopWebcam = () => {
    if (cameraManagerRef.current) {
      cameraManagerRef.current.stop();
      cameraManagerRef.current = null;
    }
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    setWebcamStream(null);
    setWebcamActive(false);
    setFaceScanSuccess(false);
  };

  // Auto start/stop camera based on loginMethod and step
  useEffect(() => {
    if (loginMethod === 'face' && step === 'credentials') {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => {
      stopWebcam();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginMethod, step]);

  // Auto face scan using FaceAuthEngine
  useEffect(() => {
    if (loginMethod === 'face' && webcamActive && step === 'credentials') {
      const videoElement = document.getElementById('webcam-video');
      if (videoElement) {
        setIsFaceScanning(true);
        engineRef.current = new FaceAuthEngine(
          videoElement,
          (state) => {
            setEngineState(state);
            if (state.status === 'ERROR') {
              setCheckError(state.message);
            } else {
              setCheckError(null); // clear errors if engine is recovering
            }
          },
          (payload) => handleFaceAuthenticated(payload)
        );
        engineRef.current.start();
      }
    } else {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
      setIsFaceScanning(false);
      setEngineState(null);
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginMethod, webcamActive, step]);

  // ── STEP 1 (Password): Verify credentials & get company/division options ────────────────
  const handleCheckCredentials = async (values, isTakeover = false) => {
    if (values.rememberMe) {
      localStorage.setItem('bos_remembered_email', values.email.trim());
      localStorage.setItem('bos_remembered_password', values.password);
    } else {
      localStorage.removeItem('bos_remembered_email');
      localStorage.removeItem('bos_remembered_password');
    }

    setIsChecking(true);
    setCheckError(null);
    try {
      const res = await axios.post('/api/account/check-credentials', {
        username: values.email.trim(),
        password: values.password,
        confirmTakeover: isTakeover
      });

      const matches = res.data;
      if (!matches || matches.length === 0) {
        setCheckError('Invalid credentials or no company mapping found.');
        return;
      }

      // If super user (BOS admin) and only 0 or 1 company is available, auto-login directly.
      const isSuperUser = res.headers?.['x-is-bos-admin'] === '1';
      if (isSuperUser && matches.length <= 1) {
        const tenantId = matches[0]?.company?.dbSourceName || null;
        const divisionId = matches[0]?.divisions?.[0]?.id || null;

        setIsLoggingIn(true);
        try {
          await login(values.email.trim(), values.password, {
            tenantId,
            divisionId: divisionId ? Number(divisionId) : null,
            confirmTakeover: isTakeover
          });
          return;
        } catch (loginErr) {
          if (loginErr?.response?.status === 409) {
            setSessionConflictState({
              open: true,
              sessionInfo: loginErr.response.data?.existingSession || {},
              pendingAction: 'check-credentials',
              pendingParams: values
            });
            setIsChecking(false);
            setIsLoggingIn(false);
            return;
          }
          setCheckError(typeof loginErr === 'string' ? loginErr : loginErr?.message || 'Login failed.');
          setIsChecking(false);
          setIsLoggingIn(false);
          return;
        }
      }

      // If exactly one company and zero or one division, auto-login
      if (matches.length === 1 && matches[0].divisions.length <= 1) {
        const tenantId = matches[0].company.dbSourceName;
        const divisionId = matches[0].divisions.length === 1 ? matches[0].divisions[0].id : null;

        setIsLoggingIn(true);
        try {
          await login(values.email.trim(), values.password, {
            tenantId,
            divisionId: divisionId ? Number(divisionId) : null,
            confirmTakeover: isTakeover
          });
          return;
        } catch (loginErr) {
          if (loginErr?.response?.status === 409) {
            setSessionConflictState({
              open: true,
              sessionInfo: loginErr.response.data?.existingSession || {},
              pendingAction: 'check-credentials',
              pendingParams: values
            });
            setIsChecking(false);
            setIsLoggingIn(false);
            return;
          }
          setCheckError(typeof loginErr === 'string' ? loginErr : loginErr?.message || 'Login failed.');
          setIsChecking(false);
          setIsLoggingIn(false);
          return;
        }
      }

      setPendingCredentials({ username: values.email.trim(), password: values.password, faceImage: '', faceDescriptors: null });
      setCompanies(matches);
      setSelectedCompanyIndex(0);
      const firstDivs = matches[0]?.divisions || [];
      setSelectedDivisionId(firstDivs.length > 0 ? String(firstDivs[0].id) : '');
      setStep('selection');
    } catch (err) {
      if (err?.response?.status === 409) {
        setSessionConflictState({
          open: true,
          sessionInfo: err.response.data?.existingSession || {},
          pendingAction: 'check-credentials',
          pendingParams: values
        });
        return;
      }
      const msg =
        typeof err === 'string'
          ? err
          : err?.response?.data?.message || err?.message || 'Connection failed. Please try again.';
      setCheckError(msg);
    } finally {
      setIsChecking(false);
    }
  };

  // ── STEP 1 (Face ID): Handle Engine Authentication Callback ──────────────────
  // Called by FaceAuthEngine after collecting 3 quality frames + passing liveness.
  // Engine calls this WITHOUT await (fire-and-forget), so MUST throw on failure
  // so the engine's isPendingAuth lock is released for retry.
  const handleFaceAuthenticated = async (payload) => {
    const rawDescriptors = payload.faceDescriptors || payload.descriptors;
    const { imageBase64 } = payload;
    setCheckError(null);

    if (!Array.isArray(rawDescriptors) || rawDescriptors.length < 3) {
      const err = new Error('Multi-frame verification requires 3 captured face frames. Please hold still.');
      setCheckError(err.message);
      throw err;
    }

    try {
      // Backend performs: median aggregate → user-level Top-1/Top-2 → threshold → margin
      // Frontend is NOT the security decision maker.
      const res = await axios.post('/api/account/face-login', {
        username: '',           // 1:N multi-frame identification
        faceImage: imageBase64,
        faceDescriptors: rawDescriptors, // 3 × 128-D descriptors
      });

      const resData = res.data;
      const matches = Array.isArray(resData) ? resData : (resData?.matches || []);
      const matchedUserId = resData?.userId || resData?.user?.id || '';

      if (!matchedUserId) {
        throw new Error(resData?.message || 'Face not recognized. Please look directly at the camera.');
      }

      // Face matched — check for legacy template re-enrollment recommendation
      const isReenrollmentRecommended = resData?.faceReenrollmentRecommended === true;

      // Update UI with matched user
      setPendingCredentials({
        username: matchedUserId.trim(),
        password: '',
        faceImage: imageBase64,
        faceDescriptors: rawDescriptors,
      });
      setFaceScanSuccess(true);
      setEngineState(prev => ({
        ...prev,
        status: 'AUTH_SUCCESS',
        message: isReenrollmentRecommended
          ? 'Identity Verified — Consider updating Face ID'
          : 'Identity Verified',
      }));
      stopWebcam();

      // Optional: store re-enrollment flag so post-login UI can prompt user
      if (isReenrollmentRecommended) {
        sessionStorage.setItem('faceReenrollmentRecommended', '1');
      } else {
        sessionStorage.removeItem('faceReenrollmentRecommended');
      }

      // If super user (BOS admin) and only 0 or 1 company — auto-login with token
      const isSuperUser = res.headers?.['x-is-bos-admin'] === '1';
      if (isSuperUser && matches.length <= 1) {
        const tenantId = matches[0]?.company?.dbSourceName || null;
        const divisionId = matches[0]?.divisions?.[0]?.id || null;

        setIsLoggingIn(true);
        try {
          await faceLogin(matchedUserId.trim(), imageBase64, {
            tenantId,
            divisionId: divisionId ? Number(divisionId) : null
          }, rawDescriptors);
          return;
        } catch (loginErr) {
          setCheckError(typeof loginErr === 'string' ? loginErr : loginErr?.response?.data?.message || loginErr?.message || 'Face login failed.');
          setIsLoggingIn(false);
          return;
        }
      }

      // If exactly one company and zero or one division — auto-login
      if (matches.length === 1 && matches[0].divisions.length <= 1) {
        const tenantId = matches[0].company.dbSourceName;
        const divisionId = matches[0].divisions.length === 1 ? matches[0].divisions[0].id : null;

        setIsLoggingIn(true);
        try {
          await faceLogin(matchedUserId.trim(), imageBase64, {
            tenantId,
            divisionId: divisionId ? Number(divisionId) : null
          }, rawDescriptors);
          return;
        } catch (loginErr) {
          setCheckError(typeof loginErr === 'string' ? loginErr : loginErr?.response?.data?.message || loginErr?.message || 'Face login failed.');
          setIsLoggingIn(false);
          return;
        }
      }

      // Multiple companies — show company/division selector
      setCompanies(matches);
      setSelectedCompanyIndex(0);
      const firstDivs = matches[0]?.divisions || [];
      setSelectedDivisionId(firstDivs.length > 0 ? String(firstDivs[0].id) : '');
      setStep('selection');
    } catch (err) {
      // Catch network or 401 errors from backend
      const msg = typeof err === 'string' ? err : err?.response?.data?.message || err?.message || 'Face not recognized.';
      setCheckError(msg);
      // Re-throw so the engine's finally block releases isPendingAuth and can retry
      throw err;
    }
  };

  // ── STEP 2: Complete login with chosen company + division ────────────────────
  const handleFinalLogin = async (isTakeover = false) => {
    const chosen = companies[selectedCompanyIndex];
    if (!chosen) return;

    const currentDivisions = chosen.divisions || [];
    if (currentDivisions.length > 0 && !selectedDivisionId) {
      setLoginError('Please select a division to continue.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);
    try {
      if (loginMethod === 'face') {
        await faceLogin(pendingCredentials.username, pendingCredentials.faceImage, {
          tenantId: chosen.company.dbSourceName,
          divisionId: selectedDivisionId ? Number(selectedDivisionId) : null,
          confirmTakeover: isTakeover
        }, pendingCredentials.faceDescriptors);
      } else {
        await login(pendingCredentials.username, pendingCredentials.password, {
          tenantId: chosen.company.dbSourceName,
          divisionId: selectedDivisionId ? Number(selectedDivisionId) : null,
          confirmTakeover: isTakeover
        });
      }
    } catch (err) {
      if (err?.response?.status === 409) {
        setSessionConflictState({
          open: true,
          sessionInfo: err.response.data?.existingSession || {},
          pendingAction: 'final-login',
          pendingParams: null
        });
        setIsLoggingIn(false);
        return;
      }
      if (scriptedRef.current) {
        const msg = typeof err === 'string' ? err : err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
        setLoginError(msg);
      }
    } finally {
      if (scriptedRef.current) setIsLoggingIn(false);
    }
  };

  const handleConfirmTakeover = async () => {
    setIsTakingOver(true);
    try {
      const { pendingAction, pendingParams } = sessionConflictState;
      setSessionConflictState(prev => ({ ...prev, open: false }));
      if (pendingAction === 'check-credentials') {
        await handleCheckCredentials(pendingParams, true);
      } else if (pendingAction === 'final-login') {
        await handleFinalLogin(true);
      } else if (pendingAction === 'face-login') {
        await handleFaceAuthenticated(pendingParams, true);
      }
    } catch (e) {
      console.error('Session takeover error:', e);
    } finally {
      setIsTakingOver(false);
    }
  };

  const currentDivisions = companies[selectedCompanyIndex]?.divisions || [];

  const rememberedEmail = localStorage.getItem('bos_remembered_email') || '';
  const rememberedPassword = localStorage.getItem('bos_remembered_password') || '';

  return (
    <Box {...others} sx={{ position: 'relative' }}>
      <Box
        component={motion.div}
        initial={false}
        animate={{ 
          opacity: step === 'credentials' ? 1 : 0, 
          x: step === 'credentials' ? 0 : -20,
          pointerEvents: step === 'credentials' ? 'auto' : 'none'
        }}
        transition={{ duration: 0.3 }}
        sx={{
          position: step === 'credentials' ? 'relative' : 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: step === 'credentials' ? 1 : -1,
          visibility: step === 'credentials' ? 'visible' : 'hidden'
        }}
      >
            <Formik
              initialValues={{ email: rememberedEmail, password: rememberedPassword, rememberMe: Boolean(rememberedEmail), submit: null }}
              validationSchema={Yup.object().shape({
                email: loginMethod === 'password'
                  ? Yup.string().max(255).required('User ID is required')
                  : Yup.string().max(255).nullable(),
                password: loginMethod === 'password'
                  ? Yup.string()
                    .required('Password is required')
                    .test('no-spaces', 'Password cannot start or end with spaces', (v) => v === v?.trim())
                    .max(50, 'Password must be under 50 characters')
                  : Yup.string().nullable()
              })}
              onSubmit={(values) => {
                if (loginMethod === 'face') {
                  // handleFaceScan is triggered automatically by engine callback now
                  // but we handle standard submit just in case
                } else {
                  handleCheckCredentials(values);
                }
              }}
            >
              {({ errors, handleBlur, handleChange, handleSubmit, touched, values, setFieldValue }) => (
                <form noValidate onSubmit={handleSubmit}>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: '#fff', mb: 1 }}>
                      Welcome Back!
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                      {loginMethod === 'face'
                        ? 'Authenticate with your face to access BOS(S)'
                        : 'Enter your credentials to access BOS(S)'}
                    </Typography>
                  </Box>

                  {loginMethod === 'password' ? (
                    <>
                      <CustomFormControl fullWidth error={Boolean(touched.email && errors.email)} sx={{ mb: 2 }}>
                        <InputLabel htmlFor="login-userid" sx={{ color: 'rgba(0,0,0,0.5)' }}>User ID / Email</InputLabel>
                        <OutlinedInput
                          id="login-userid"
                          type="text"
                          value={values.email}
                          name="email"
                          onBlur={handleBlur}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleChange(e);
                            if (checkError) setCheckError(null);
                            if (rememberedEmail && val.trim() === rememberedEmail.trim()) {
                              setFieldValue('password', rememberedPassword);
                            } else {
                              setFieldValue('password', '');
                            }
                          }}
                          label="User ID"
                          autoComplete="username"
                          sx={{
                            borderRadius: '12px',
                            bgcolor: '#f8f9fa',
                            color: '#121926',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.1)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.2)' },
                            '& input:-webkit-autofill': {
                              WebkitBoxShadow: '0 0 0 1000px #f8f9fa inset !important',
                              WebkitTextFillColor: '#121926 !important',
                              caretColor: '#121926',
                              borderRadius: 'inherit'
                            }
                          }}
                        />
                        {touched.email && errors.email && (
                          <FormHelperText error id="standard-weight-helper-text-email-login">
                            {errors.email}
                          </FormHelperText>
                        )}
                      </CustomFormControl>

                      <CustomFormControl fullWidth error={Boolean(touched.password && errors.password)}>
                        <InputLabel htmlFor="login-password" sx={{ color: 'rgba(0,0,0,0.5)' }}>Password</InputLabel>
                        <OutlinedInput
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={values.password}
                          name="password"
                          onBlur={handleBlur}
                          onChange={(e) => {
                            handleChange(e);
                            if (checkError) setCheckError(null);
                          }}
                          label="Password"
                          autoComplete="current-password"
                          /* endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowPassword}
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                                size="large"
                                sx={{ color: 'rgba(0,0,0,0.6)' }}
                              >
                                {showPassword ? <Visibility /> : <VisibilityOff />}
                              </IconButton>
                            </InputAdornment>
                          } */
                          sx={{
                            borderRadius: '12px',
                            bgcolor: '#f8f9fa',
                            color: '#121926',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.1)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.2)' },
                            '& input:-webkit-autofill': {
                              WebkitBoxShadow: '0 0 0 1000px #f8f9fa inset !important',
                              WebkitTextFillColor: '#121926 !important',
                              caretColor: '#121926',
                              borderRadius: '12px 0 0 12px'
                            }
                          }}
                        />
                        {touched.password && errors.password && (
                          <FormHelperText error id="standard-weight-helper-text-password-login">
                            {errors.password}
                          </FormHelperText>
                        )}
                      </CustomFormControl>

                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1, ml: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={values.rememberMe}
                              onChange={(e) => setFieldValue('rememberMe', e.target.checked)}
                              name="rememberMe"
                              color="primary"
                              size="small"
                              sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-checked': { color: '#ffb400' } }}
                            />
                          }
                          label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Remember Password</Typography>}
                        />
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ width: '100%', mt: 2 }}>
                      <FaceDetectionDashboard
                        webcamActive={webcamActive}
                        webcamError={webcamError}
                        engineState={engineState}
                      />
                    </Box>
                  )}

                  {checkError && loginMethod === 'password' && (
                    <Box sx={{ mt: 2 }}>
                      <Alert
                        severity="error"
                        variant="outlined"
                        sx={{
                          borderRadius: '12px',
                          bgcolor: alpha(theme.palette.error.light, 0.1),
                          borderColor: alpha(theme.palette.error.main, 0.2),
                          color: theme.palette.error.dark,
                          fontWeight: 500
                        }}
                      >
                        {checkError}
                      </Alert>
                    </Box>
                  )}

                  {loginMethod === 'password' ? (
                    <Box sx={{ mt: 4 }}>
                      <AnimateButton>
                        <Button
                          disabled={isChecking}
                          fullWidth
                          size="large"
                          type="submit"
                          variant="contained"
                          startIcon={isChecking ? <CircularProgress size={18} color="inherit" /> : <IconLock size={18} />}
                          sx={{
                            borderRadius: '12px',
                            fontWeight: 700,
                            py: 1.5,
                            fontSize: '1rem',
                            color: '#000',
                            background: 'linear-gradient(90deg, #D4AF37 0%, #FFDF73 100%)',
                            boxShadow: '0 8px 20px rgba(212, 175, 55, 0.3)',
                            '&:hover': {
                              background: 'linear-gradient(90deg, #C29B27 0%, #E6C858 100%)',
                              boxShadow: '0 10px 25px rgba(212, 175, 55, 0.5)',
                            }
                          }}
                        >
                          {isChecking ? 'Verifying...' : 'Authenticate'}
                        </Button>
                      </AnimateButton>

                      <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', mb: 2 }}>or</Typography>
                        <Button
                          onClick={() => {
                            handleLoginMethodChange('face');
                            setCheckError(null);
                            startWebcam();
                          }}
                          sx={{ color: '#00B0FF', textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                          startIcon={<IconFaceId size={18} />}
                        >
                          Use Face ID Instead
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', mb: 1 }}>or</Typography>
                      <Button
                        onClick={() => {
                          handleLoginMethodChange('password');
                          stopWebcam();
                          setCheckError(null);
                        }}
                        sx={{ color: '#00B0FF', textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                        startIcon={<IconLock size={18} />}
                      >
                        Use Password Instead
                      </Button>
                    </Box>
                  )}
                </form>
              )}
            </Formik>

            {/* Footer Features */}
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'space-between', mt: 3, pt: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Box sx={{ display: 'flex', gap: 1.5, flex: 1 }}>
                <IconLock size={20} color="#D4AF37" stroke={1.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', mb: 0.5 }}>Secure & Private</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>🔒 Advanced end-to-end encryption.</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flex: 1 }}>
                <IconActivity size={20} color="#D4AF37" stroke={1.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', mb: 0.5 }}>Fast & Responsive</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>⚡ Blazing fast, smooth, and efficient.</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, flex: 1 }}>
                <IconDiamond size={20} color="#D4AF37" stroke={1.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', mb: 0.5 }}>Premium Interface</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>✨ Elegant UI with seamless experience.</Typography>
                </Box>
              </Box>
            </Box>
      </Box>
      <Box
        component={motion.div}
        initial={{ opacity: 0, x: 20 }}
        animate={{ 
          opacity: step === 'selection' ? 1 : 0, 
          x: step === 'selection' ? 0 : 20,
          pointerEvents: step === 'selection' ? 'auto' : 'none'
        }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        sx={{
          position: step === 'selection' ? 'relative' : 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: step === 'selection' ? 1 : -1,
          visibility: step === 'selection' ? 'visible' : 'hidden'
        }}
      >
            <Box>
              {/* Header Section */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, mb: 1.5 }}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setStep('credentials');
                    setLoginError(null);
                    setPendingCredentials({ username: '', password: '', faceImage: '', faceDescriptors: null });
                    setFaceScanSuccess(false);
                  }}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: theme.palette.primary.main,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderRadius: '12px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.22),
                      transform: 'scale(1.06) translateY(-1px)',
                      boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }}
                >
                  <IconArrowLeft size={18} stroke={2.2} />
                </IconButton>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '-0.3px',
                      background: `linear-gradient(90deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 0.2
                    }}
                  >
                    Context Selection
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.75rem' }}>
                      Signed in as
                    </Typography>
                    <Chip
                      label={pendingCredentials.username}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.dark,
                        borderRadius: '6px'
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Company Selection */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.15em' }}>
                  Select Company ({companies.length})
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={String(selectedCompanyIndex)}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setSelectedCompanyIndex(idx);
                      const divs = companies[idx]?.divisions || [];
                      setSelectedDivisionId(divs.length > 0 ? String(divs[0].id) : '');
                      setLoginError(null);
                    }}
                    sx={{
                      borderRadius: '16px',
                      background: 'background.paper',
                      border: 'none',
                      boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
                      py: 0.3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: `0 10px 36px ${alpha(theme.palette.primary.main, 0.3)}`
                      },
                      '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        pl: 2
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: 'background.paper',
                          borderRadius: '12px',
                          mt: 1,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        }
                      }
                    }}
                  >
                    {companies.map((item, idx) => (
                      <MenuItem key={idx} value={String(idx)} sx={{ py: 1.2, borderRadius: '10px', mx: 1, my: 0.2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: selectedCompanyIndex === idx ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.12),
                              color: selectedCompanyIndex === idx ? '#fff' : theme.palette.primary.main,
                              boxShadow: selectedCompanyIndex === idx ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}` : 'none',
                              transition: 'all 0.3s'
                            }}
                          >
                            <IconBuilding size={18} stroke={2.2} />
                          </Box>
                          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.88rem' }}>
                              {item.company.companyName || item.company.dbSourceName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>
                              Instance: <span style={{ color: theme.palette.primary.main, fontWeight: 700 }}>{item.company.dbSourceName}</span>
                            </Typography>
                          </Box>
                          {selectedCompanyIndex === idx && (
                            <Chip
                              icon={<IconCheck size={14} />}
                              label="Selected"
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                bgcolor: alpha(theme.palette.primary.main, 0.15),
                                color: theme.palette.primary.dark,
                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                border: '1px solid',
                                px: 0.5
                              }}
                            />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Division Selection */}
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.15em' }}>
                  Select Division {currentDivisions.length > 0 ? `(${currentDivisions.length})` : ''}
                </Typography>

                {currentDivisions.length === 0 ? (
                  <Alert
                    icon={<IconInfoCircle size={24} />}
                    severity="info"
                    variant="outlined"
                    sx={{
                      borderRadius: '16px',
                      background: `linear-gradient(145deg, ${alpha(theme.palette.info.light, 0.15)}, ${alpha(theme.palette.info.light, 0.05)})`,
                      borderColor: alpha(theme.palette.info.main, 0.4),
                      color: theme.palette.info.dark,
                      fontWeight: 700,
                      py: 1.5,
                      px: 2,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.12)}`,
                      WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)'
                    }}
                  >
                    No active divisions found. You will be signed in with Company-wide Administrative access to configure divisions.
                  </Alert>
                ) : (
                  <FormControl fullWidth>
                    <Select
                      value={selectedDivisionId}
                      onChange={(e) => {
                        setSelectedDivisionId(e.target.value);
                        setLoginError(null);
                      }}
                      sx={{
                        borderRadius: '16px',
                        background: 'background.paper',
                        border: 'none',
                        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
                        py: 0.3,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: `0 10px 36px ${alpha(theme.palette.secondary.main, 0.3)}`
                        },
                        '& .MuiSelect-select': {
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          pl: 2
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: 'background.paper',
                            borderRadius: '12px',
                            mt: 1,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                          }
                        }
                      }}
                    >
                      {currentDivisions.map((div) => (
                        <MenuItem key={div.id} value={String(div.id)} sx={{ py: 1.2, borderRadius: '10px', mx: 1, my: 0.2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: selectedDivisionId === String(div.id) ? theme.palette.secondary.main : alpha(theme.palette.secondary.main, 0.12),
                                color: selectedDivisionId === String(div.id) ? '#fff' : theme.palette.secondary.main,
                                boxShadow: selectedDivisionId === String(div.id) ? `0 4px 12px ${alpha(theme.palette.secondary.main, 0.4)}` : 'none',
                                transition: 'all 0.3s'
                              }}
                            >
                              <IconBuildingFactory2 size={18} stroke={2.2} />
                            </Box>
                            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.88rem' }}>
                                {div.divisionName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', fontSize: '0.72rem' }}>
                                Division ID: <span style={{ color: theme.palette.secondary.main, fontWeight: 700 }}>{div.id}</span>
                              </Typography>
                            </Box>
                            {selectedDivisionId === String(div.id) && (
                              <Chip
                                icon={<IconCheck size={14} />}
                                label="Active"
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  bgcolor: alpha(theme.palette.secondary.main, 0.15),
                                  color: theme.palette.secondary.dark,
                                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                                  border: '1px solid',
                                  px: 0.5
                                }}
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>

              {loginError && (
                <Box sx={{ mb: 2.5 }}>
                  <Alert severity="error" variant="filled" sx={{ borderRadius: '14px', fontWeight: 700, py: 1, boxShadow: `0 6px 20px ${alpha(theme.palette.error.main, 0.3)}` }}>
                    {loginError}
                  </Alert>
                </Box>
              )}

              <Box sx={{ mt: 'auto', pt: 3 }}>
                <form onSubmit={(e) => { e.preventDefault(); handleFinalLogin(); }}>
                  {/* Hidden inputs to help browser password managers detect the login submission */}
                  <input type="text" name="email" autoComplete="username" defaultValue={pendingCredentials.username} style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} tabIndex={-1} aria-hidden="true" />
                  <input type="password" name="password" autoComplete="current-password" defaultValue={pendingCredentials.password} style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} tabIndex={-1} aria-hidden="true" />
                  <AnimateButton>
                    <Button
                      disabled={isLoggingIn || (currentDivisions.length > 0 && !selectedDivisionId)}
                      fullWidth
                      size="large"
                      variant="contained"
                      type="submit"
                      startIcon={isLoggingIn ? <CircularProgress size={18} color="inherit" /> : <IconLogin size={20} />}
                      sx={{
                        borderRadius: '16px',
                        fontWeight: 800,
                        py: 1.5,
                        fontSize: '1rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                        boxShadow: `0 10px 25px ${alpha(theme.palette.secondary.main, 0.45)}`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${theme.palette.secondary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                          boxShadow: `0 14px 30px ${alpha(theme.palette.secondary.main, 0.55)}`,
                          transform: 'translateY(-2px) scale(1.01)'
                        }
                      }}
                    >
                      {isLoggingIn ? 'Launching Autonova…' : 'Sign In'}
                    </Button>
                  </AnimateButton>
                </form>
              </Box>
            </Box>
      </Box>

      {/* Single Active Session Conflict Confirmation Dialog */}
      <ActiveSessionConfirmationDialog
        open={sessionConflictState.open}
        onClose={() => setSessionConflictState({ open: false, sessionInfo: null, pendingAction: null, pendingParams: null })}
        onConfirm={handleConfirmTakeover}
        sessionInfo={sessionConflictState.sessionInfo}
        isLoading={isTakingOver}
      />
    </Box>
  );
}
