import React from 'react';
import {
  Box,
  Typography,
  alpha,
  useTheme,
  CircularProgress,
  Fade,
} from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';
import {
  IconCheck,
  IconX,
  IconCameraOff,
  IconFaceId,
  IconUsers,
  IconAlertTriangle,
  IconSun
} from '@tabler/icons-react';

// ─── Keyframes ────────────────────────────────────────────────────────────────
const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  50%      { box-shadow: 0 0 0 15px rgba(99, 102, 241, 0); }
`;

const scanLine = keyframes`
  0%   { top: 0%; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const ScanLaser = styled(Box)(({ theme, statuscolor }) => ({
  position: 'absolute',
  left: '10%',
  right: '10%',
  height: 3,
  background: `linear-gradient(90deg, transparent, ${statuscolor}, transparent)`,
  boxShadow: `0 0 15px ${statuscolor}, 0 0 30px ${statuscolor}`,
  zIndex: 10,
  animation: `${scanLine} 2.5s ease-in-out infinite`,
}));

// ─── Main Component ─────────────────────────────────────────────────────────
const FaceDetectionDashboard = ({ webcamActive, webcamError, engineState }) => {
  const theme = useTheme();

  // engineState contains: status, message, qualityScore, livenessScore, box, guidance
  const { status, message, qualityScore, livenessScore, box, guidance } = engineState || {
    status: 'INITIALIZING',
    message: 'Loading secure engine...',
    qualityScore: 0,
    livenessScore: 0,
    box: null,
    videoDimensions: { width: 640, height: 480 },
    guidance: []
  };

  // Determine UI colors and icons based on status
  let ringColor = 'rgba(0, 176, 255, 0.6)';
  let laserColor = '#00B0FF';
  let isScanning = true;
  let isError = false;
  let isSuccess = false;

  if (status === 'READY_TO_AUTH' || status === 'AUTHENTICATING') {
    ringColor = 'rgba(0, 230, 118, 0.8)';
    laserColor = '#00e676';
  } else if (status === 'LOW_QUALITY' || status === 'LIVENESS_FAILED') {
    ringColor = 'rgba(255, 179, 0, 0.8)'; // Yellow warning
    laserColor = '#ffb300';
  } else if (status === 'MULTIPLE_FACES' || status === 'ERROR') {
    ringColor = 'rgba(255, 23, 68, 0.8)'; // Red error
    laserColor = '#ff1744';
    isError = true;
    isScanning = false;
  } else if (status === 'AUTH_SUCCESS') {
    isSuccess = true;
    isScanning = false;
  }

  // Draw face box if we have one (on top of video)
  const renderFaceBox = (vidDim) => {
    if (!box || !vidDim) return null;
    
    // Since the video is mirrored (scaleX(-1)), we must mirror the X coordinate
    const mirroredX = vidDim.width - box.x - box.width;
    
    return (
      <Box sx={{
        position: 'absolute',
        top: box.y,
        left: mirroredX,
        width: box.width,
        height: box.height,
        border: `3px solid ${laserColor}`,
        borderRadius: '8px',
        zIndex: 5,
        transition: 'all 0.1s ease',
        boxShadow: `0 0 15px ${laserColor}`
      }}>
      </Box>
    );
  };

  return (
    <Box sx={{
      width: '100%',
      p: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Oval Guide Overlay (The Login Zone) */}
      <Box sx={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '60%',
        height: '80%',
        border: `2px dashed rgba(255,255,255,0.2)`,
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Massive Glowing Camera Container */}
      <Box sx={{
        position: 'relative',
        width: { xs: 160, sm: 200, md: 220 },
        height: { xs: 160, sm: 200, md: 220 },
        mb: 3
      }}>
        {/* Outer Glowing Ring */}
        <Box sx={{
          position: 'absolute', inset: -15,
          borderRadius: '50%',
          border: '1px solid rgba(0, 176, 255, 0.2)',
          boxShadow: '0 0 40px rgba(0, 176, 255, 0.1)',
          animation: `${pulseGlow} 3s infinite alternate`
        }} />

        {/* Dynamic Inner Ring */}
        <Box sx={{
          position: 'absolute', inset: -4,
          borderRadius: '50%',
          border: `3px solid ${ringColor}`,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          animation: `${rotate} 6s linear infinite`,
          transition: 'border-color 0.5s ease'
        }} />

        {/* Video Viewport */}
        <Box sx={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'rgba(10, 14, 23, 0.8)',
          position: 'relative',
          border: `2px solid ${alpha(laserColor, 0.4)}`,
          zIndex: 2
        }}>
          <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transform: status === 'AUTHENTICATING' ? 'scale(1.15)' : 'scale(1)',
            transition: 'transform 2s cubic-bezier(0.25, 0.8, 0.25, 1)',
          }}>
            {webcamActive ? (
              <>
                <video id="webcam-video" autoPlay playsInline muted style={{
                  width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', zIndex: 1
                }} />
                
                {/* SVG Overlay to exactly match object-fit: cover scaling and coordinates */}
                <svg 
                  viewBox={`0 0 ${engineState?.videoDimensions?.width || 640} ${engineState?.videoDimensions?.height || 480}`}
                  preserveAspectRatio="xMidYMid slice"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}
                >
                  <foreignObject x="0" y="0" width={engineState?.videoDimensions?.width || 640} height={engineState?.videoDimensions?.height || 480}>
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      {renderFaceBox(engineState?.videoDimensions || { width: 640, height: 480 })}
                    </div>
                  </foreignObject>
                </svg>
                
                {isScanning && <ScanLaser statuscolor={laserColor} />}
              </>
            ) : (
              <IconCameraOff size={48} color="rgba(255,255,255,0.3)" stroke={1.5} />
            )}
          </Box>

          {/* Overlay on Success/Error */}
          <Fade in={isSuccess || (isError && status === 'ERROR')}>
            <Box sx={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: isSuccess ? 'rgba(0, 230, 118, 0.8)' : 'rgba(255, 23, 68, 0.8)',
              WebkitBackdropFilter: 'blur(4px)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {isSuccess ? <IconCheck size={64} color="#fff" /> : <IconX size={64} color="#fff" />}
            </Box>
          </Fade>
        </Box>
      </Box>

      {/* Status Indicators */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2, px: 2, minHeight: 60, maxWidth: 380, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
          {status === 'MULTIPLE_FACES' ? <IconUsers size={20} color="#ff1744" /> :
           status === 'LOW_QUALITY' ? <IconSun size={20} color="#ffb300" /> :
           status === 'LIVENESS_FAILED' ? <IconAlertTriangle size={20} color="#ffb300" /> :
           isSuccess ? <IconCheck size={20} color="#00e676" /> :
           isError ? <IconX size={20} color="#ff1744" /> :
           status === 'AUTHENTICATING' ? <CircularProgress size={18} sx={{ color: '#00e676' }} /> :
           <IconFaceId size={20} color="#00B0FF" />}
          
          <Typography sx={{ color: (isError || status === 'ERROR') ? '#ff1744' : '#fff', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.3, textAlign: 'center' }}>
            {message}
          </Typography>
        </Box>
        
        <Typography sx={{ color: (isError || status === 'ERROR') ? '#ff5252' : 'rgba(255,255,255,0.7)', fontSize: '0.75rem', textAlign: 'center', mt: 0.5, lineHeight: 1.3 }}>
          {guidance && guidance.length > 0 ? guidance[0] : 
           (status === 'NO_FACE' ? 'Center your face in the oval guide' : 
            status === 'SCANNING' ? 'Hold still...' : 
            status === 'READY_TO_AUTH' ? 'Perfect. Initiating login...' : '')}
        </Typography>
      </Box>
    </Box>
  );
};

export default FaceDetectionDashboard;
