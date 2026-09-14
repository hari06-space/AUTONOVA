import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  IconButton,
  Stack,
  Avatar,
  Tooltip,
  Paper,
  Chip,
  Fade,
  Button,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Icons from Material UI
import VideocamTwoToneIcon from '@mui/icons-material/VideocamTwoTone';
import VideocamOffTwoToneIcon from '@mui/icons-material/VideocamOffTwoTone';
import MicTwoToneIcon from '@mui/icons-material/MicTwoTone';
import MicOffTwoToneIcon from '@mui/icons-material/MicOffTwoTone';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareTwoToneIcon from '@mui/icons-material/ScreenShareTwoTone';
import StopScreenShareTwoToneIcon from '@mui/icons-material/StopScreenShareTwoTone';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import FullscreenTwoToneIcon from '@mui/icons-material/FullscreenTwoTone';
import FullscreenExitTwoToneIcon from '@mui/icons-material/FullscreenExitTwoTone';
import CameraAltTwoToneIcon from '@mui/icons-material/CameraAltTwoTone';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AspectRatioTwoToneIcon from '@mui/icons-material/AspectRatioTwoTone';
import PhotoSizeSelectSmallTwoToneIcon from '@mui/icons-material/PhotoSizeSelectSmallTwoTone';
import GridViewTwoToneIcon from '@mui/icons-material/GridViewTwoTone';
import PhoneInTalkTwoToneIcon from '@mui/icons-material/PhoneInTalkTwoTone';
import PersonPinTwoToneIcon from '@mui/icons-material/PersonPinTwoTone';
import PanToolTwoToneIcon from '@mui/icons-material/PanToolTwoTone';
import HowToRegTwoToneIcon from '@mui/icons-material/HowToRegTwoTone';
import GroupTwoToneIcon from '@mui/icons-material/GroupTwoTone';
import PersonAddTwoToneIcon from '@mui/icons-material/PersonAddTwoTone';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import CheckCircleTwoToneIcon from '@mui/icons-material/CheckCircleTwoTone';
import CloseIcon from '@mui/icons-material/Close';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import VolumeUpTwoToneIcon from '@mui/icons-material/VolumeUpTwoTone';
import VolumeOffTwoToneIcon from '@mui/icons-material/VolumeOffTwoTone';

import axios from 'utils/axios';
import { getUserImageUrl } from 'utils/upload-helper';
import { callSounds } from 'utils/callSounds';

/**
 * VideoStreamRenderer
 * Safe video element wrapper for MediaStream (memoized to eliminate redundant renders)
 */
export const VideoStreamRenderer = React.memo(function VideoStreamRenderer({ stream, isMuted = false, isMirror = false, style, ...props }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        if (videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
        }
        videoRef.current.play().catch((err) => {
          console.warn('[VideoStreamRenderer] Autoplay prevented:', err);
        });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = Boolean(isMuted);
    }
  }, [isMuted]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: isMirror ? 'scaleX(-1)' : 'none',
        backgroundColor: '#0b141a',
        ...style
      }}
      {...props}
    />
  );
});

/**
 * AudioStreamRenderer
 * Hidden audio element wrapper ensuring remote stream audio is always audible,
 * even if participant camera is disabled or in audio-only call mode.
 */
export const AudioStreamRenderer = React.memo(function AudioStreamRenderer({ stream, isMuted = false }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      if (stream) {
        if (audioRef.current.srcObject !== stream) {
          audioRef.current.srcObject = stream;
        }
        audioRef.current.play().catch((err) => {
          console.warn('[AudioStreamRenderer] Autoplay prevented:', err);
        });
      } else {
        audioRef.current.srcObject = null;
      }
    }
  }, [stream]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = Boolean(isMuted);
    }
  }, [isMuted]);

  return (
    <audio
      ref={audioRef}
      autoPlay
      playsInline
      muted={isMuted}
      style={{ display: 'none' }}
    />
  );
});

/**
 * Animated simulated participant canvas feed (WhatsApp Style Live Video)
 */
export function SimulatedVideoCanvas({ name, color = '#10b981', isSpeaking = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let tick = 0;

    const render = () => {
      tick += 0.04;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#0b141a');
      grad.addColorStop(0.5, '#111b21');
      grad.addColorStop(1, '#1f2c34');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ambient dynamic circles
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 50 + (isSpeaking ? Math.sin(tick * 4) * 6 : Math.sin(tick) * 2);

      // Outer glow pulse
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + (isSpeaking ? 16 : 8), 0, Math.PI * 2);
      ctx.fillStyle = isSpeaking ? 'rgba(0, 168, 132, 0.2)' : 'rgba(56, 189, 248, 0.08)';
      ctx.fill();

      // Avatar circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = isSpeaking ? 3 : 1.5;
      ctx.strokeStyle = isSpeaking ? '#00a884' : 'rgba(255,255,255,0.3)';
      ctx.stroke();

      // Initial letter in center
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initial = (name || 'U').charAt(0).toUpperCase();
      ctx.fillText(initial, centerX, centerY);

      // Soundwave bars if speaking
      if (isSpeaking) {
        const barCount = 7;
        const spacing = 12;
        const startX = centerX - ((barCount - 1) * spacing) / 2;
        const waveY = centerY + radius + 34;

        for (let i = 0; i < barCount; i++) {
          const h = Math.abs(Math.sin(tick * 3 + i * 0.8)) * 22 + 4;
          ctx.fillStyle = '#00a884';
          ctx.beginPath();
          ctx.rect(startX + i * spacing - 2, waveY - h / 2, 4, h);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [name, color, isSpeaking]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={320}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}

/**
 * Avatar placeholder when camera is turned off (displays user profile image or initial)
 */
export function UserAvatarPlaceholder({ name, imgName, isCameraOff = false, isSpeaking = false, color = '#00a884', size = 'medium', callStatus }) {
  const avatarSize = size === 'large' ? 96 : size === 'small' ? 44 : 64;
  const pulseSize = avatarSize + 18;
  const fontSize = size === 'large' ? '2.4rem' : size === 'small' ? '1.1rem' : '1.6rem';

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #0b141a 0%, #111b21 50%, #1f2c34 100%)',
        position: 'relative',
        p: 1.5,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Animated Soundwave Pulse Ring */}
        <Box
          sx={{
            position: 'absolute',
            width: pulseSize,
            height: pulseSize,
            borderRadius: '50%',
            bgcolor: isSpeaking ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 255, 255, 0.04)',
            border: isSpeaking ? '2.5px solid #00e676' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: isSpeaking ? '0 0 24px rgba(0, 230, 118, 0.6)' : 'none',
            animation: isSpeaking ? 'pulse 1.2s infinite ease-in-out' : 'none'
          }}
        />
        <Avatar
          src={imgName ? getUserImageUrl(imgName) : ''}
          sx={{
            width: avatarSize,
            height: avatarSize,
            bgcolor: color,
            color: '#fff',
            fontSize: fontSize,
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            border: isSpeaking ? '2.5px solid #00e676' : '2px solid rgba(255,255,255,0.2)'
          }}
        >
          {(name || 'U').charAt(0).toUpperCase()}
        </Avatar>
      </Box>

      {/* Speaking Soundwave Equalizer Bars */}
      {isSpeaking && (
        <Stack direction="row" spacing={0.4} sx={{ mt: 1.2, alignItems: 'center', height: 16 }}>
          {[8, 14, 18, 12, 16, 10, 6].map((h, i) => (
            <Box
              key={i}
              sx={{
                width: 3,
                height: `${h}px`,
                bgcolor: '#00e676',
                borderRadius: '2px',
                animation: 'pulse 0.8s infinite alternate',
                animationDelay: `${i * 0.12}s`
              }}
            />
          ))}
        </Stack>
      )}

      {name && (
        <Typography variant="body2" sx={{ color: '#e9edef', fontWeight: 700, mt: isSpeaking ? 0.6 : 1.2, fontSize: size === 'small' ? '0.72rem' : '0.85rem', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90%' }}>
          {name}
        </Typography>
      )}

      {callStatus === 'CALLING' ? (
        <Chip
          icon={<PhoneInTalkTwoToneIcon sx={{ fontSize: '0.75rem !important', color: '#f59e0b !important', animation: 'wiggle 1.2s ease-in-out infinite' }} />}
          label="Calling..."
          size="small"
          sx={{
            bgcolor: 'rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
            fontSize: '0.62rem',
            height: 18,
            mt: 0.5,
            fontWeight: 700,
            border: '1px solid rgba(245, 158, 11, 0.4)'
          }}
        />
      ) : isCameraOff && size !== 'small' && (
        <Chip
          icon={<VideocamOffTwoToneIcon sx={{ fontSize: '0.75rem !important', color: '#f43f5e !important' }} />}
          label="Camera Off"
          size="small"
          sx={{
            bgcolor: 'rgba(244, 63, 94, 0.15)',
            color: '#f43f5e',
            fontSize: '0.62rem',
            height: 18,
            mt: 0.5,
            fontWeight: 700,
            border: '1px solid rgba(244, 63, 94, 0.3)'
          }}
        />
      )}
    </Box>
  );
}

/**
 * Universal Centralized Video Call Dialog Component
 */
export default function BOSUniversalCallDialog({
  open,
  onClose,
  callType = 'AUDIT', // 'AUDIT' | 'DIRECT' | 'GROUP_MEETING' | 'CHAT'
  title,
  subtitle,
  callingState = 'IN_CALL', // 'RINGING' | 'IN_CALL' | 'INCOMING_CALL' | null
  targetUser, // { userId, employeeName, departmentName, designationName, imgName }
  schedule, // For group meetings
  participants = [], // For group meetings
  currentUser,
  localStream,
  remoteStream,
  remoteStreams,
  screenStream,
  isScreenSharing = false,
  screenPresenter = null,
  remoteIsAudioEnabled = true,
  remoteIsVideoEnabled = true,
  onToggleScreenShare,
  isAudioEnabled = true,
  isVideoEnabled = true,
  onToggleAudio,
  onToggleVideo,
  onHostMuteUser,
  onEndCall,
  onAnswerCall,
  onDeclineCall,
  onSyncAttendance,
  onIndividualCall,
  onSimulateConnect
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const durationTimerRef = useRef(null);

  // Dialog Resizing State (Presets & Free-form Corner Drag)
  const [dialogPresetSize, setDialogPresetSize] = useState('medium'); // 'compact' | 'medium' | 'large'
  const [customDialogSize, setCustomDialogSize] = useState(null); // { width, height }
  const isDialogResizingRef = useRef(false);
  const dialogResizeStartRef = useRef({ pointerX: 0, pointerY: 0, startWidth: 0, startHeight: 0 });
  const dialogPaperRef = useRef(null);

  // Extra Dynamically Invited Participants
  const [extraParticipants, setExtraParticipants] = useState([]);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [isFetchingUsers, setIsFetchingUsers] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState(new Set());

  // Group Meeting or Multi-Participant Call flag
  const isGroupMeeting = callType === 'GROUP_MEETING' || Boolean(schedule);
  const isMultiParticipant = isGroupMeeting || (participants && participants.length > 1) || extraParticipants.length > 0;

  const [connectedUserIds, setConnectedUserIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'spotlight'
  const [spotlightId, setSpotlightId] = useState(null);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [simulatedSpeakers, setSimulatedSpeakers] = useState({});
  const [participantMediaState, setParticipantMediaState] = useState({}); // { [userId]: { isMuted: bool, isVideoOff: bool } }

  // Auto-switch to spotlight mode when anyone (or self) starts screen sharing in group call
  useEffect(() => {
    if (isScreenSharing || screenPresenter) {
      setViewMode('spotlight');
    }
  }, [isScreenSharing, screenPresenter]);

  // Track connected participants via signaling events & active streams
  useEffect(() => {
    const handleParticipantJoined = (e) => {
      const { sender } = e.detail || {};
      if (sender) {
        setConnectedUserIds((prev) => {
          const next = new Set(prev);
          next.add(String(sender).toLowerCase().trim());
          return next;
        });
      }
    };

    const handlePeerStreamReceived = (e) => {
      const { peerId } = e.detail || {};
      if (peerId) {
        setConnectedUserIds((prev) => {
          const next = new Set(prev);
          next.add(String(peerId).toLowerCase().trim());
          return next;
        });
      }
    };

    const handleMediaChanged = (e) => {
      const { userId, audio, video, isMuted, isVideoOff } = e.detail || {};
      if (userId) {
        const cleanId = String(userId).toLowerCase().trim();
        const computedMuted = isMuted !== undefined ? isMuted : (audio !== undefined ? !audio : undefined);
        const computedVideoOff = isVideoOff !== undefined ? isVideoOff : (video !== undefined ? !video : undefined);

        setParticipantMediaState((prev) => {
          const current = prev[cleanId] || {};
          return {
            ...prev,
            [cleanId]: {
              isMuted: computedMuted !== undefined ? computedMuted : current.isMuted,
              isVideoOff: computedVideoOff !== undefined ? computedVideoOff : current.isVideoOff
            }
          };
        });

        setConnectedUserIds((prev) => {
          const next = new Set(prev);
          next.add(cleanId);
          return next;
        });
      }
    };

    window.addEventListener('bos-participant-joined', handleParticipantJoined);
    window.addEventListener('bos-peer-stream-received', handlePeerStreamReceived);
    window.addEventListener('bos-media-state-changed', handleMediaChanged);
    return () => {
      window.removeEventListener('bos-participant-joined', handleParticipantJoined);
      window.removeEventListener('bos-peer-stream-received', handlePeerStreamReceived);
      window.removeEventListener('bos-media-state-changed', handleMediaChanged);
    };
  }, []);

  // Filter active users by search query
  const filteredActiveUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return activeUsersList;
    const q = userSearchQuery.toLowerCase();
    return activeUsersList.filter(
      (u) =>
        (u.employeeName || '').toLowerCase().includes(q) ||
        (u.userId || '').toLowerCase().includes(q) ||
        (u.departmentName || '').toLowerCase().includes(q) ||
        (u.designationName || '').toLowerCase().includes(q)
    );
  }, [activeUsersList, userSearchQuery]);

  // Extract all alias identity keys for any user object
  const getIdentityKeys = (userObj) => {
    if (!userObj) return [];
    const emp = userObj.employee || userObj;
    const keys = new Set();

    [
      emp.id,
      emp.empId,
      emp.userId,
      emp.userName,
      emp.empCode,
      emp.employeeCode,
      emp.oldEmpCode,
      emp.oldCode,
      emp.employeeName,
      emp.name
    ].forEach((val) => {
      if (val !== undefined && val !== null) {
        const s = String(val).trim().toLowerCase();
        if (s && s !== 'undefined' && s !== 'null' && s !== '[object object]' && s !== '-') {
          keys.add(s);
        }
      }
    });

    return Array.from(keys);
  };

  // Stream resolver across multiple potential identity keys (userId, empCode, name, id)
  const findStreamForMember = useCallback((member) => {
    if (!member) return null;
    if (member.isSelf) return localStream;

    const keys = getIdentityKeys(member);
    if (remoteStreams && remoteStreams.size > 0) {
      for (const key of keys) {
        if (remoteStreams.has(key)) {
          const s = remoteStreams.get(key);
          if (s) return s;
        }
      }
    }
    if (!isMultiParticipant) {
      return remoteStream;
    }
    return null;
  }, [localStream, remoteStreams, remoteStream, isMultiParticipant]);

  // Parse list of meeting members
  const memberList = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    const markSeen = (userObj) => {
      const keys = getIdentityKeys(userObj);
      keys.forEach((k) => seenKeys.add(k));
    };

    const isAlreadySeen = (userObj) => {
      const keys = getIdentityKeys(userObj);
      return keys.some((k) => seenKeys.has(k));
    };

    const isMemberConnected = (userObj, defaultStatus = 'CALLING') => {
      if (!isMultiParticipant && (callingState === 'IN_CALL' || remoteStream)) return true;
      const keys = getIdentityKeys(userObj);
      if (keys.some((k) => connectedUserIds.has(k))) return true;
      if (remoteStreams && keys.some((k) => remoteStreams.has(k))) return true;
      if (defaultStatus === 'JOINED') return true;
      return false;
    };

    const getMemberMedia = (id, name, fallbackAudioMuted = false, fallbackVideoOff = false, userObj = null) => {
      const cleanId = String(id || '').trim();
      const lowerId = cleanId.toLowerCase();
      const cleanName = String(name || '').trim().toLowerCase();

      const userKeys = userObj ? getIdentityKeys(userObj) : [cleanId, lowerId, cleanName];
      let mState = null;
      for (const k of userKeys) {
        if (participantMediaState[k]) {
          mState = participantMediaState[k];
          break;
        }
      }

      if (mState) {
        return {
          isMuted: mState.isMuted !== undefined ? mState.isMuted : fallbackAudioMuted,
          isVideoOff: mState.isVideoOff !== undefined ? mState.isVideoOff : fallbackVideoOff
        };
      }

      const mStream = userObj ? findStreamForMember(userObj) : null;
      const streamHasLiveVideo = Boolean(
        mStream &&
        mStream.getVideoTracks().length > 0 &&
        mStream.getVideoTracks().some((t) => t.enabled !== false && t.readyState !== 'ended' && !t.muted)
      );

      return {
        isMuted: fallbackAudioMuted,
        isVideoOff: streamHasLiveVideo ? false : true
      };
    };

    // 1. Local User (You) - Registered first
    const selfName = currentUser?.employeeName || currentUser?.name || sessionStorage.getItem('employeeName') || 'You (Host)';
    const selfId = currentUser?.id || currentUser?.userId || currentUser?.empCode || sessionStorage.getItem('userId') || 'current-user';

    markSeen(currentUser);
    markSeen({
      id: sessionStorage.getItem('userId'),
      userId: sessionStorage.getItem('userName'),
      empCode: sessionStorage.getItem('empCode'),
      employeeName: selfName
    });

    list.push({
      id: String(selfId),
      userId: currentUser?.userId,
      empCode: currentUser?.empCode,
      isSelf: true,
      name: selfName,
      designation: currentUser?.designationName || currentUser?.designation?.designationName || 'Organizer',
      department: currentUser?.departmentName || currentUser?.department?.deptName || '',
      isHost: true,
      isConnected: true,
      isMuted: !isAudioEnabled,
      isVideoOff: !isVideoEnabled,
      imgName: currentUser?.imgName || currentUser?.image
    });

    // 2. Target User (if 1-to-1 or explicit peer, and not self / not seen)
    if (targetUser && !isAlreadySeen(targetUser)) {
      const tEmp = targetUser.employee || targetUser;
      const tId = String(tEmp.userId || tEmp.id || tEmp.empCode || 'target-user');
      markSeen(targetUser);
      const isConn = isMemberConnected(targetUser, isMultiParticipant ? (targetUser.callStatus || 'CALLING') : (callingState === 'IN_CALL' ? 'JOINED' : 'CALLING'));
      const mMedia = getMemberMedia(tId, tEmp.employeeName || tEmp.name, !isConn || !remoteIsAudioEnabled, !isConn || !remoteIsVideoEnabled, targetUser);
      list.push({
        id: tId,
        userId: tEmp.userId,
        empCode: tEmp.empCode,
        userName: tEmp.userName,
        isSelf: false,
        name: tEmp.employeeName || tEmp.name || 'Participant',
        designation: tEmp.designationName || tEmp.designation?.designationName || 'Auditee',
        department: tEmp.departmentName || tEmp.department?.deptName || '',
        isHost: false,
        isConnected: isConn,
        callStatus: isConn ? 'JOINED' : 'CALLING',
        isMuted: isConn ? mMedia.isMuted : true,
        isVideoOff: isConn ? mMedia.isVideoOff : true,
        imgName: tEmp.imgName || tEmp.image
      });
    }

    // 3. Schedule Chaired Person if present and not self / not seen
    if (schedule?.chairedBy && !isAlreadySeen(schedule.chairedBy)) {
      const chair = schedule.chairedBy;
      const cId = String(chair.id || chair.userId || chair.empCode);
      markSeen(chair);
      const isConn = isMemberConnected(chair, chair.callStatus || 'CALLING');
      const mMedia = getMemberMedia(cId, chair.employeeName || chair.name, !isConn, !isConn, chair);
      list.push({
        id: cId,
        userId: chair.userId,
        empCode: chair.empCode,
        userName: chair.userName,
        isSelf: false,
        name: chair.employeeName || chair.name || 'Chaired Person',
        designation: chair.designation?.designationName || chair.designationName || 'Chairperson',
        department: chair.department?.deptName || chair.departmentName || '',
        isHost: true,
        isConnected: isConn,
        callStatus: isConn ? 'JOINED' : 'CALLING',
        isMuted: isConn ? mMedia.isMuted : true,
        isVideoOff: isConn ? mMedia.isVideoOff : true,
        imgName: chair.imgName || chair.image
      });
    }

    // 4. Meeting Attendees from participants list (strictly deduplicated)
    (participants || []).forEach((p, idx) => {
      const emp = p.employee || p;
      if (emp && !isAlreadySeen(emp)) {
        const uId = String(emp.id || emp.userId || emp.empCode || `p-${idx}`);
        markSeen(emp);
        const isConn = isMemberConnected(emp, p.callStatus || emp.callStatus || 'CALLING');
        const mMedia = getMemberMedia(uId, emp.employeeName || emp.name, !isConn, !isConn, emp);
        list.push({
          id: uId,
          userId: emp.userId,
          empCode: emp.empCode,
          userName: emp.userName,
          isSelf: false,
          name: emp.employeeName || emp.name || `Member ${idx + 1}`,
          designation: emp.designation?.designationName || emp.designationName || 'Attendee',
          department: emp.department?.deptName || emp.departmentName || '',
          isHost: false,
          isConnected: isConn,
          callStatus: isConn ? 'JOINED' : 'CALLING',
          isMuted: isConn ? mMedia.isMuted : true,
          isVideoOff: isConn ? mMedia.isVideoOff : true,
          imgName: emp.imgName || emp.image
        });
      }
    });

    // 5. Extra Dynamically Invited Active Participants (strictly deduplicated)
    extraParticipants.forEach((extraUser, idx) => {
      const emp = extraUser.employee || extraUser;
      if (emp && !isAlreadySeen(emp)) {
        const uId = String(emp.userId || emp.id || emp.empCode || `extra-${idx}`);
        markSeen(emp);
        const isConn = isMemberConnected(emp, extraUser.callStatus || emp.callStatus || 'CALLING');
        const mMedia = getMemberMedia(uId, emp.employeeName || emp.name, !isConn, !isConn, emp);
        list.push({
          id: uId,
          userId: emp.userId,
          empCode: emp.empCode,
          userName: emp.userName,
          isSelf: false,
          name: emp.employeeName || emp.name || 'Invited User',
          designation: emp.designationName || emp.designation?.designationName || 'Staff',
          department: emp.departmentName || emp.department?.deptName || '',
          isHost: false,
          isConnected: isConn,
          callStatus: isConn ? 'JOINED' : 'CALLING',
          isMuted: isConn ? mMedia.isMuted : true,
          isVideoOff: isConn ? mMedia.isVideoOff : true,
          imgName: emp.imgName || emp.image
        });
      }
    });

    return list;
  }, [currentUser, targetUser, schedule, participants, extraParticipants, isAudioEnabled, isVideoEnabled, remoteIsAudioEnabled, remoteIsVideoEnabled, participantMediaState, connectedUserIds, isMultiParticipant, callingState, remoteStream, remoteStreams, findStreamForMember]);

  // Auto-switch to spotlight mode when anyone presents screen (only 1 presenter at a time)
  useEffect(() => {
    if (isScreenSharing || screenPresenter) {
      setViewMode('spotlight');
      if (screenPresenter?.id) {
        setSpotlightId(String(screenPresenter.id));
      }
    } else {
      setViewMode('grid');
      setSpotlightId(null);
    }
  }, [isScreenSharing, screenPresenter]);

  // Listen to peer screen share state events
  useEffect(() => {
    const handleScreenShareChanged = (e) => {
      const { isSharing, presenterId } = e.detail || {};
      if (isSharing) {
        setViewMode('spotlight');
        if (presenterId) {
          setSpotlightId(String(presenterId));
        }
      } else {
        setViewMode('grid');
        setSpotlightId(null);
      }
    };
    window.addEventListener('bos-screen-share-changed', handleScreenShareChanged);
    return () => window.removeEventListener('bos-screen-share-changed', handleScreenShareChanged);
  }, []);

  // Synchronize real-time media states (mute/unmute, video on/off) from all participants
  useEffect(() => {
    const handleMediaStateChanged = (e) => {
      const { userId, audio, video } = e.detail || {};
      if (userId !== undefined && userId !== null) {
        const uId = String(userId).trim();
        const lowerId = uId.toLowerCase();
        const audioMuted = typeof audio === 'boolean' ? !audio : undefined;
        const videoOff = typeof video === 'boolean' ? !video : undefined;

        setConnectedUserIds((prev) => {
          const next = new Set(prev);
          next.add(lowerId);
          next.add(uId);
          return next;
        });

        setParticipantMediaState((prev) => {
          const next = { ...prev };
          const curU = prev[uId] || prev[lowerId] || {};
          const entry = {
            isMuted: audioMuted !== undefined ? audioMuted : curU.isMuted ?? false,
            isVideoOff: videoOff !== undefined ? videoOff : curU.isVideoOff ?? false
          };

          next[uId] = entry;
          next[lowerId] = entry;

          memberList.forEach((m) => {
            if (
              String(m.id).toLowerCase() === lowerId ||
              String(m.userId || '').toLowerCase() === lowerId ||
              String(m.name || '').toLowerCase() === lowerId ||
              String(m.employeeName || '').toLowerCase() === lowerId ||
              String(m.employeeCode || '').toLowerCase() === lowerId ||
              lowerId.includes(String(m.name || '').toLowerCase()) ||
              String(m.name || '').toLowerCase().includes(lowerId)
            ) {
              next[String(m.id)] = entry;
              next[String(m.id).toLowerCase()] = entry;
              if (m.userId) {
                next[String(m.userId)] = entry;
                next[String(m.userId).toLowerCase()] = entry;
              }
              if (m.name) {
                next[String(m.name).toLowerCase()] = entry;
              }
            }
          });

          return next;
        });

        if (audioMuted) {
          setSimulatedSpeakers((spk) => {
            const next = { ...spk };
            delete next[uId];
            delete next[lowerId];
            memberList.forEach((m) => {
              if (
                String(m.id).toLowerCase() === lowerId ||
                String(m.userId || '').toLowerCase() === lowerId ||
                String(m.name || '').toLowerCase() === lowerId
              ) {
                delete next[m.id];
              }
            });
            return next;
          });
        }
      }
    };
    window.addEventListener('bos-media-state-changed', handleMediaStateChanged);
    return () => window.removeEventListener('bos-media-state-changed', handleMediaStateChanged);
  }, [memberList]);

  // Real-time audio activity detection using WebAudio API (AnalyserNode)
  useEffect(() => {
    if (!open || callingState !== 'IN_CALL') {
      setSimulatedSpeakers({});
      return;
    }

    let audioCtx = null;
    let isCancelled = false;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        const analysers = new Map(); // id -> { analyser, dataArray, isMuted }

        // 1. Local user audio track (only if mic is unmuted)
        if (localStream && isAudioEnabled) {
          const audioTracks = localStream.getAudioTracks();
          if (audioTracks.length > 0 && audioTracks[0].enabled) {
            try {
              const src = audioCtx.createMediaStreamSource(new MediaStream([audioTracks[0]]));
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              analyser.smoothingTimeConstant = 0.4;
              src.connect(analyser);
              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const selfId = String(currentUser?.id || currentUser?.userId || 'current-user');
              analysers.set(selfId, { analyser, dataArray, isMuted: false });
            } catch (e) { }
          }
        }

        // 2. Remote participant audio tracks (only if participant is unmuted)
        memberList.forEach((m) => {
          if (!m.isSelf && m.isConnected && !m.isMuted) {
            const mStream = findStreamForMember(m);
            if (mStream) {
              const aTracks = mStream.getAudioTracks();
              if (aTracks.length > 0 && aTracks[0].enabled) {
                try {
                  const src = audioCtx.createMediaStreamSource(new MediaStream([aTracks[0]]));
                  const analyser = audioCtx.createAnalyser();
                  analyser.fftSize = 64;
                  analyser.smoothingTimeConstant = 0.4;
                  src.connect(analyser);
                  const dataArray = new Uint8Array(analyser.frequencyBinCount);
                  analysers.set(String(m.id), { analyser, dataArray, isMuted: false });
                } catch (e) { }
              }
            }
          }
        });

        // Periodic volume measurement without random generation (shallow comparison bail-out to eliminate redundant dialog re-renders)
        const checkAudioLevels = () => {
          if (isCancelled) return;
          const currentSpeakers = {};
          analysers.forEach(({ analyser, dataArray }, id) => {
            try {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              if (avg > 18) { // Distinct human voice volume threshold
                currentSpeakers[id] = true;
              }
            } catch (e) { }
          });
          setSimulatedSpeakers((prev) => {
            const prevKeys = Object.keys(prev || {});
            const curKeys = Object.keys(currentSpeakers);
            if (prevKeys.length !== curKeys.length) return currentSpeakers;
            for (let i = 0; i < curKeys.length; i++) {
              if (!prev[curKeys[i]]) return currentSpeakers;
            }
            return prev; // Same reference bails out React re-render completely
          });
        };

        const interval = setInterval(checkAudioLevels, 320);

        return () => {
          isCancelled = true;
          clearInterval(interval);
          if (audioCtx && audioCtx.state !== 'closed') {
            audioCtx.close().catch(() => { });
          }
        };
      }
    } catch (err) {
      console.warn('[WebAudio] Speaking analyser initialization error:', err);
    }

    return () => {
      isCancelled = true;
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => { });
      }
    };
  }, [open, callingState, isAudioEnabled, localStream, memberList, currentUser, findStreamForMember]);

  // Synchronize dynamic participant leaves and updates in real-time
  useEffect(() => {
    const handleParticipantLeft = (e) => {
      const { leavingUserId } = e.detail || {};
      if (leavingUserId) {
        const lId = String(leavingUserId).toLowerCase().trim();
        setExtraParticipants((prev) =>
          prev.filter((p) => {
            const pId = String(p.userId || p.id || p.userName || '').toLowerCase().trim();
            const pEmp = String(p.employeeCode || p.empCode || '').toLowerCase().trim();
            return pId !== lId && pEmp !== lId;
          })
        );
        setInvitedUserIds((prev) => {
          const next = new Set(prev);
          next.delete(leavingUserId);
          next.delete(lId);
          return next;
        });
        setSpotlightId((prev) => (prev && String(prev).toLowerCase().trim() === lId ? null : prev));
      }
    };

    const handleParticipantsSync = (e) => {
      const { participants: syncList = [] } = e.detail || {};
      if (syncList && syncList.length > 0) {
        const existingKeys = new Set();
        const addKeys = (u) => {
          getIdentityKeys(u).forEach((k) => existingKeys.add(k));
        };
        addKeys(currentUser);
        addKeys({
          id: sessionStorage.getItem('userId'),
          userId: sessionStorage.getItem('userName'),
          empCode: sessionStorage.getItem('empCode'),
          employeeName: sessionStorage.getItem('employeeName')
        });
        (participants || []).forEach(addKeys);
        if (targetUser) addKeys(targetUser);
        if (schedule?.chairedBy) addKeys(schedule.chairedBy);

        const extras = [];
        syncList.forEach((p) => {
          const pKeys = getIdentityKeys(p);
          const alreadyKnown = pKeys.some((k) => existingKeys.has(k));
          if (!alreadyKnown) {
            pKeys.forEach((k) => existingKeys.add(k));
            extras.push(p);
          }
        });
        setExtraParticipants(extras);
      }
    };

    window.addEventListener('bos-participant-left', handleParticipantLeft);
    window.addEventListener('bos-participants-sync', handleParticipantsSync);
    return () => {
      window.removeEventListener('bos-participant-left', handleParticipantLeft);
      window.removeEventListener('bos-participants-sync', handleParticipantsSync);
    };
  }, [currentUser, participants, targetUser, schedule]);

  // Floating Minimized PiP Drag State
  const [pipPosition, setPipPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, pipX: 0, pipY: 0 });

  // In-Dialog Local Video Drag & Size State
  const [localPipPos, setLocalPipPos] = useState(null);
  const [localPipSize, setLocalPipSize] = useState('medium'); // 'compact' (96x130) | 'medium' (140x190) | 'large' (190x255)
  const [isLocalPipDragging, setIsLocalPipDragging] = useState(false);
  const isLocalPipDraggingRef = useRef(false);
  const localPipDragStartRef = useRef({ pointerX: 0, pointerY: 0, boxLeft: 0, boxTop: 0, boxWidth: 0, boxHeight: 0, containerWidth: 0, containerHeight: 0 });
  const videoContainerRef = useRef(null);
  const localPipBoxRef = useRef(null);

  // Fetch active users when opening the add participant modal
  const handleOpenAddParticipant = async () => {
    setAddParticipantOpen(true);
    setUserSearchQuery('');
    setIsFetchingUsers(true);
    try {
      const res = await axios.get('/api/chat/search/users?query=');
      if (res?.data && Array.isArray(res.data)) {
        setActiveUsersList(res.data);
      } else if (res?.data?.content && Array.isArray(res.data.content)) {
        setActiveUsersList(res.data.content);
      }
    } catch (err) {
      console.warn('Failed to search active users for call:', err);
    } finally {
      setIsFetchingUsers(false);
    }
  };

  const inviteTimeoutsRef = useRef(new Map()); // userId -> timer

  // Auto-clear invite timer when peer stream or connection is active
  useEffect(() => {
    if (remoteStreams && remoteStreams.size > 0) {
      inviteTimeoutsRef.current.forEach((timer, uId) => {
        const lower = String(uId).toLowerCase();
        if (remoteStreams.has(uId) || remoteStreams.has(lower)) {
          clearTimeout(timer);
          inviteTimeoutsRef.current.delete(uId);
        }
      });
    }
  }, [remoteStreams]);

  // Clean up all invite timers on unmount
  useEffect(() => {
    return () => {
      inviteTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
      inviteTimeoutsRef.current.clear();
    };
  }, []);

  const handleInviteUser = (userToInvite) => {
    if (!userToInvite) return;
    const uId = String(userToInvite.userId || userToInvite.id || userToInvite.empCode);
    const uKeys = getIdentityKeys(userToInvite);

    setInvitedUserIds((prev) => new Set(prev).add(uId));
    setExtraParticipants((prev) => {
      const already = prev.some((p) => {
        const pKeys = getIdentityKeys(p);
        return pKeys.some((k) => uKeys.includes(k));
      });
      if (already) return prev;
      return [...prev, userToInvite];
    });

    // Clear existing timer if any
    if (inviteTimeoutsRef.current.has(uId)) {
      clearTimeout(inviteTimeoutsRef.current.get(uId));
      inviteTimeoutsRef.current.delete(uId);
    }

    // 30 seconds auto-cancel if participant has not joined
    const timer = setTimeout(() => {
      console.log('[BOSUniversalCallDialog] 30s invite timeout expired for:', userToInvite.employeeName || uId);

      const hasStream = uKeys.some((k) => remoteStreams && remoteStreams.has(k));
      if (!hasStream) {
        setExtraParticipants((prev) => {
          return prev.filter((p) => {
            const pKeys = getIdentityKeys(p);
            return !pKeys.some((k) => uKeys.includes(k));
          });
        });
        setInvitedUserIds((prev) => {
          const next = new Set(prev);
          next.delete(uId);
          uKeys.forEach((k) => next.delete(k));
          return next;
        });

        window.dispatchEvent(
          new CustomEvent('bos-invite-cancelled', {
            detail: {
              targetUser: userToInvite,
              reason: 'TIMEOUT_30S'
            }
          })
        );
      }
      inviteTimeoutsRef.current.delete(uId);
    }, 30000);

    inviteTimeoutsRef.current.set(uId, timer);

    try {
      window.dispatchEvent(
        new CustomEvent('bos-invite-participant', {
          detail: {
            targetUser: userToInvite,
            schedule: schedule,
            callType: callType || 'GROUP_MEETING'
          }
        })
      );
    } catch (e) {
      console.error('Failed to dispatch invite signal:', e);
    }
  };


  const spotlightMember = useMemo(() => {
    if (!isGroupMeeting) return null;
    return memberList.find((m) => m.id === spotlightId) || memberList[0] || null;
  }, [isGroupMeeting, memberList, spotlightId]);

  // Dimension calculator for local PiP
  const getPipDimensions = () => {
    if (isMobile) {
      if (localPipSize === 'compact') {
        return { width: 72, height: 98 };
      }
      if (localPipSize === 'large') {
        return { width: 110, height: 148 };
      }
      return { width: 88, height: 120 };
    }

    if (localPipSize === 'compact') {
      return {
        width: isFullScreen ? 120 : 96,
        height: isFullScreen ? 160 : 130
      };
    }
    if (localPipSize === 'large') {
      return {
        width: isFullScreen ? 230 : 190,
        height: isFullScreen ? 305 : 255
      };
    }
    return {
      width: isFullScreen ? 180 : 140,
      height: isFullScreen ? 240 : 190
    };
  };

  const { width: pipWidth, height: pipHeight } = getPipDimensions();

  // Full Dialog Resizing Dimension Calculator
  const getDialogPaperDimensions = () => {
    if (isFullScreen) {
      return {
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        borderRadius: 0,
        m: 0
      };
    }
    if (isMobile) {
      return {
        width: 'calc(100% - 16px)',
        height: isGroupMeeting ? '92vh' : 'auto',
        maxHeight: '94vh',
        borderRadius: 2,
        m: 1
      };
    }
    if (customDialogSize) {
      return {
        width: `${customDialogSize.width}px`,
        height: `${customDialogSize.height}px`,
        maxWidth: '98vw',
        maxHeight: '96vh',
        borderRadius: 4,
        m: 2
      };
    }
    if (dialogPresetSize === 'compact') {
      return {
        width: '640px',
        height: '520px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        borderRadius: 3.5,
        m: 2
      };
    }
    if (dialogPresetSize === 'large') {
      return {
        width: '1160px',
        height: '760px',
        maxWidth: '98vw',
        maxHeight: '95vh',
        borderRadius: 4,
        m: 2
      };
    }
    // Default Medium
    return {
      width: isGroupMeeting ? '1060px' : '860px',
      height: isGroupMeeting ? '720px' : '600px',
      maxWidth: '96vw',
      maxHeight: '94vh',
      borderRadius: 4,
      m: 2
    };
  };

  const handleCycleDialogPresetSize = () => {
    setCustomDialogSize(null);
    setDialogPresetSize((prev) => {
      if (prev === 'medium') return 'large';
      if (prev === 'large') return 'compact';
      return 'medium';
    });
  };

  const handleDialogResizePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDialogResizingRef.current = true;

    const paperEl = dialogPaperRef.current;
    if (!paperEl) return;
    const rect = paperEl.getBoundingClientRect();

    dialogResizeStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height
    };

    const handlePointerMove = (moveEvt) => {
      if (!isDialogResizingRef.current) return;
      const deltaX = moveEvt.clientX - dialogResizeStartRef.current.pointerX;
      const deltaY = moveEvt.clientY - dialogResizeStartRef.current.pointerY;

      const newWidth = Math.max(480, Math.min(window.innerWidth - 32, dialogResizeStartRef.current.startWidth + deltaX));
      const newHeight = Math.max(400, Math.min(window.innerHeight - 32, dialogResizeStartRef.current.startHeight + deltaY));

      setCustomDialogSize({ width: Math.round(newWidth), height: Math.round(newHeight) });
    };

    const handlePointerUp = () => {
      isDialogResizingRef.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleToggleLocalPipSize = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setLocalPipSize((prev) => {
      if (prev === 'medium') return 'compact';
      if (prev === 'compact') return 'large';
      return 'medium';
    });
  };

  // Local camera preview drag pointer down
  const handleLocalPipPointerDown = (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="button"]')) {
      return;
    }

    if (!videoContainerRef.current || !localPipBoxRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    isLocalPipDraggingRef.current = true;
    setIsLocalPipDragging(true);

    const containerRect = videoContainerRef.current.getBoundingClientRect();
    const boxRect = localPipBoxRef.current.getBoundingClientRect();

    const currentLeft = boxRect.left - containerRect.left;
    const currentTop = boxRect.top - containerRect.top;

    localPipDragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      boxLeft: currentLeft,
      boxTop: currentTop,
      boxWidth: boxRect.width,
      boxHeight: boxRect.height,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height
    };

    const handlePointerMove = (moveEvt) => {
      if (!isLocalPipDraggingRef.current) return;
      const deltaX = moveEvt.clientX - localPipDragStartRef.current.pointerX;
      const deltaY = moveEvt.clientY - localPipDragStartRef.current.pointerY;

      const targetX = localPipDragStartRef.current.boxLeft + deltaX;
      const targetY = localPipDragStartRef.current.boxTop + deltaY;

      const boxWidth = localPipDragStartRef.current.boxWidth || pipWidth;
      const boxHeight = localPipDragStartRef.current.boxHeight || pipHeight;
      const containerWidth = localPipDragStartRef.current.containerWidth || 800;
      const containerHeight = localPipDragStartRef.current.containerHeight || 460;

      const boundedX = Math.max(12, Math.min(containerWidth - boxWidth - 12, targetX));
      const boundedY = Math.max(12, Math.min(containerHeight - boxHeight - 12, targetY));

      setLocalPipPos({ x: boundedX, y: boundedY });
    };

    const handlePointerUp = () => {
      isLocalPipDraggingRef.current = false;
      setIsLocalPipDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Floating Minimized View Drag Handler
  const handleMinimizedPointerDown = (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[role="button"]')) {
      return;
    }

    isDraggingRef.current = true;
    setIsDragging(true);

    const defaultX = window.innerWidth - 320 - 24;
    const defaultY = window.innerHeight - 220 - 24;
    const currentX = pipPosition ? pipPosition.x : defaultX;
    const currentY = pipPosition ? pipPosition.y : defaultY;

    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      pipX: currentX,
      pipY: currentY
    };

    const handlePointerMove = (moveEvt) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvt.clientX - dragStartRef.current.pointerX;
      const deltaY = moveEvt.clientY - dragStartRef.current.pointerY;

      const targetX = dragStartRef.current.pipX + deltaX;
      const targetY = dragStartRef.current.pipY + deltaY;

      const boundedX = Math.max(12, Math.min(window.innerWidth - 332, targetX));
      const boundedY = Math.max(12, Math.min(window.innerHeight - 232, targetY));

      setPipPosition({ x: boundedX, y: boundedY });
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Sound Engine
  useEffect(() => {
    if (!open) {
      callSounds.stopAll();
      return;
    }

    if (callingState === 'RINGING' || (isGroupMeeting && open && (!remoteStreams || remoteStreams.size === 0) && !remoteStream)) {
      callSounds.playOutgoingRingback();
    } else if (callingState === 'INCOMING_CALL') {
      callSounds.playIncomingRingtone();
    } else if (callingState === 'IN_CALL') {
      callSounds.stopAll();
      callSounds.playCallConnected();
    } else if (callingState === 'BUSY') {
      callSounds.stopAll();
      callSounds.playBusyTone();
    } else if (callingState === 'DECLINED') {
      callSounds.stopAll();
      callSounds.playCallEnded();
    } else {
      callSounds.stopAll();
    }

    return () => {
      callSounds.stopAll();
    };
  }, [open, callingState]);

  // Duration Timer
  useEffect(() => {
    if (callingState === 'IN_CALL' || (isGroupMeeting && open)) {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      setCallDuration(0);
    }

    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callingState, isGroupMeeting, open]);

  // 30-Second Countdown Timer during Calling / Ringing state
  const [ringCountdown, setRingCountdown] = useState(30);
  useEffect(() => {
    let interval = null;
    if (open && callingState === 'RINGING') {
      setRingCountdown(30);
      interval = setInterval(() => {
        setRingCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setRingCountdown(30);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, callingState]);

  // Reset when dialog closes or call ends
  useEffect(() => {
    if (!open) {
      setIsMinimized(false);
      setPipPosition(null);
      setLocalPipPos(null);
      if (screenStream) {
        try {
          screenStream.getTracks().forEach((t) => t.stop());
        } catch (e) {}
      }
    }
  }, [open, screenStream]);

  // Reset local dock on fullscreen change
  useEffect(() => {
    setLocalPipPos(null);
  }, [isFullScreen]);

  // Clamp on local pip size change
  useEffect(() => {
    if (localPipPos && videoContainerRef.current) {
      const containerRect = videoContainerRef.current.getBoundingClientRect();
      const { width: w, height: h } = getPipDimensions();
      const boundedX = Math.max(12, Math.min(containerRect.width - w - 12, localPipPos.x));
      const boundedY = Math.max(12, Math.min(containerRect.height - h - 12, localPipPos.y));
      setLocalPipPos({ x: boundedX, y: boundedY });
    }
  }, [localPipSize]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Snapshot capture
  const handleCaptureSnapshot = () => {
    try {
      const activeStream = screenStream || remoteStream || localStream;
      if (!activeStream) return;

      const imageCapture = document.createElement('canvas');
      const tempVideo = document.createElement('video');
      tempVideo.srcObject = activeStream;
      tempVideo.play().then(() => {
        imageCapture.width = tempVideo.videoWidth || 640;
        imageCapture.height = tempVideo.videoHeight || 480;
        const ctx = imageCapture.getContext('2d');
        ctx.drawImage(tempVideo, 0, 0, imageCapture.width, imageCapture.height);

        const dataUrl = imageCapture.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `video_call_snapshot_${targetUser?.employeeName || schedule?.scheduleNo || 'evidence'}_${Date.now()}.jpg`;
        link.click();
      });
    } catch (e) {
      console.error('Failed to capture snapshot', e);
    }
  };

  if (!open) return null;

  const displayTitle = title || (isGroupMeeting ? `Live Group Meeting • ${schedule?.scheduleNo || 'QMS'}` : (callType === 'AUDIT' ? 'Audit Live Video Verification' : 'Live Video Call'));
  const displaySubtitle = subtitle || (isGroupMeeting ? `${schedule?.meetingType || 'General'} • ${memberList.length} Connected` : 'End-to-end encrypted • QMS Compliance');

  // ----------------------------------------------------
  // Floating Picture-in-Picture Minimized View (Draggable)
  // ----------------------------------------------------
  if (isMinimized) {
    return (
      <Fade in={isMinimized}>
        <Paper
          elevation={16}
          onPointerDown={handleMinimizedPointerDown}
          sx={{
            position: 'fixed',
            left: pipPosition ? `${pipPosition.x}px` : undefined,
            top: pipPosition ? `${pipPosition.y}px` : undefined,
            right: pipPosition ? undefined : 24,
            bottom: pipPosition ? undefined : 24,
            width: 320,
            height: 220,
            borderRadius: '20px',
            overflow: 'hidden',
            zIndex: 99999,
            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(10, 15, 29, 0.98))',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(16, 185, 129, 0.35)',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.75), 0 0 24px rgba(16, 185, 129, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            transition: isDragging ? 'none' : 'box-shadow 0.2s ease, border-color 0.2s ease',
            '&:hover': {
              borderColor: '#10b981',
              boxShadow: '0 24px 56px rgba(0, 0, 0, 0.85), 0 0 32px rgba(16, 185, 129, 0.35)'
            }
          }}
        >
          {/* Header Bar with Drag Handle */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 0.8,
              bgcolor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(10px)',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <DragIndicatorIcon sx={{ fontSize: 16, color: '#94a3b8', opacity: 0.8 }} />
              <FiberManualRecordIcon sx={{ fontSize: 10, color: '#10b981', animation: 'pulse 1.5s infinite' }} />
              <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.2px' }}>
                {targetUser?.employeeName || schedule?.scheduleNo || 'Live Call'}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.75} alignItems="center">
              <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600, fontSize: '0.725rem', bgcolor: 'rgba(16, 185, 129, 0.15)', px: 0.75, py: 0.2, borderRadius: '6px' }}>
                {formatTimer(callDuration)}
              </Typography>
              <Tooltip title="Expand View">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(false);
                  }}
                  sx={{
                    color: '#ffffff',
                    p: 0.3,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                  }}
                >
                  <OpenInFullIcon sx={{ fontSize: '0.85rem' }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Video Stream */}
          <Box sx={{ flexGrow: 1, width: '100%', height: '100%', position: 'relative', pointerEvents: 'none' }}>
            {screenStream ? (
              <VideoStreamRenderer stream={screenStream} />
            ) : remoteStream ? (
              <VideoStreamRenderer stream={remoteStream} />
            ) : localStream && isVideoEnabled ? (
              <VideoStreamRenderer stream={localStream} isMirror isMuted />
            ) : (
              <SimulatedVideoCanvas name={targetUser?.employeeName || schedule?.scheduleNo || 'Live Feed'} color="#10b981" isSpeaking={true} />
            )}
          </Box>

          {/* Quick Floating Controls */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 1.25,
              zIndex: 10,
              pointerEvents: 'auto'
            }}
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleAudio) onToggleAudio();
              }}
              sx={{
                bgcolor: isAudioEnabled ? '#1e293b' : '#f43f5e',
                color: isAudioEnabled ? '#00e676' : '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                '&:hover': { bgcolor: isAudioEnabled ? '#334155' : '#e11d48' },
                width: 34,
                height: 34,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}
            >
              {isAudioEnabled ? <MicTwoToneIcon sx={{ fontSize: '1.1rem', color: '#00e676' }} /> : <MicOffTwoToneIcon sx={{ fontSize: '1.1rem', color: '#ffffff' }} />}
            </IconButton>

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleVideo) onToggleVideo();
              }}
              sx={{
                bgcolor: isVideoEnabled ? '#1e293b' : '#f43f5e',
                color: isVideoEnabled ? '#00e676' : '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                '&:hover': { bgcolor: isVideoEnabled ? '#334155' : '#e11d48' },
                width: 34,
                height: 34,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}
            >
              {isVideoEnabled ? <VideocamTwoToneIcon sx={{ fontSize: '1.1rem', color: '#00e676' }} /> : <VideocamOffTwoToneIcon sx={{ fontSize: '1.1rem', color: '#ffffff' }} />}
            </IconButton>

            {onToggleScreenShare && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleScreenShare();
                }}
                sx={{
                  bgcolor: isScreenSharing ? '#00a884' : '#1e293b',
                  color: isScreenSharing ? '#ffffff' : '#38bdf8',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  '&:hover': { bgcolor: isScreenSharing ? '#008f6f' : '#334155' },
                  width: 34,
                  height: 34,
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                }}
              >
                {isScreenSharing ? <StopScreenShareTwoToneIcon sx={{ fontSize: '1.1rem', color: '#ffffff' }} /> : <ScreenShareTwoToneIcon sx={{ fontSize: '1.1rem', color: '#38bdf8' }} />}
              </IconButton>
            )}

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleCaptureSnapshot();
              }}
              sx={{
                bgcolor: '#1e293b',
                color: '#38bdf8',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                '&:hover': { bgcolor: '#334155' },
                width: 34,
                height: 34,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}
            >
              <CameraAltTwoToneIcon sx={{ fontSize: '1.1rem', color: '#38bdf8' }} />
            </IconButton>

            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (onEndCall) onEndCall();
              }}
              sx={{
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                '&:hover': { background: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)' },
                width: 34,
                height: 34,
                boxShadow: '0 4px 14px rgba(244, 63, 94, 0.5)'
              }}
            >
              <CallEndIcon sx={{ fontSize: '1.1rem', color: '#ffffff' }} />
            </IconButton>
          </Box>
        </Paper>
      </Fade>
    );
  }

  // ----------------------------------------------------
  // Full Modal Dialog View
  // ----------------------------------------------------
  return (
    <Dialog
      open={open}
      fullScreen={isFullScreen}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') return;
        onClose();
      }}
      maxWidth={false}
      PaperProps={{
        ref: dialogPaperRef,
        sx: {
          ...getDialogPaperDimensions(),
          bgcolor: '#111b21',
          color: '#fff',
          overflow: 'hidden',
          boxShadow: isFullScreen ? 'none' : '0 24px 48px rgba(0,0,0,0.6)',
          border: isFullScreen ? 'none' : '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: isDialogResizingRef.current ? 'none' : 'width 0.2s ease, height 0.2s ease'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 1.5, sm: 3 },
          py: { xs: 1.25, sm: 1.75 },
          bgcolor: '#1f2c34',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          gap: 1
        }}
      >
        <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
          <Avatar
            sx={{
              width: { xs: 32, sm: 38 },
              height: { xs: 32, sm: 38 },
              bgcolor: theme.palette.primary.main,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              flexShrink: 0
            }}
          >
            {isGroupMeeting ? <GroupTwoToneIcon sx={{ color: '#fff', fontSize: { xs: '1.1rem', sm: '1.35rem' } }} /> : <VideocamTwoToneIcon sx={{ color: '#fff', fontSize: { xs: '1.1rem', sm: '1.35rem' } }} />}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ color: '#e9edef', fontWeight: 700, lineHeight: 1.2, fontSize: { xs: '0.825rem', sm: '0.95rem' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayTitle}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.2, display: { xs: 'none', sm: 'flex' } }}>
              <LockOutlinedIcon sx={{ fontSize: '0.8rem', color: '#8696a0' }} />
              <Typography variant="caption" sx={{ color: '#8696a0', fontSize: '0.725rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displaySubtitle}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} alignItems="center" sx={{ flexShrink: 0 }}>
          {callingState === 'RINGING' && (
            <Chip
              icon={<FiberManualRecordIcon sx={{ fontSize: '9px !important', color: ringCountdown <= 10 ? '#f43f5e !important' : '#34d399 !important', animation: 'pulse 1.4s infinite' }} />}
              label={isMobile ? `${ringCountdown}s` : `RINGING (${ringCountdown}s)`}
              size="small"
              sx={{
                bgcolor: ringCountdown <= 10 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: ringCountdown <= 10 ? '#f43f5e' : '#34d399',
                fontWeight: 800,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 },
                border: `1px solid ${ringCountdown <= 10 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
                borderRadius: '12px'
              }}
            />
          )}

          {isGroupMeeting && (!remoteStreams || remoteStreams.size === 0) && !remoteStream ? (
            <Chip
              icon={<FiberManualRecordIcon sx={{ fontSize: '9px !important', color: '#fbbf24 !important', animation: 'pulse 1.4s infinite' }} />}
              label={isMobile ? 'CALLING' : `CALLING (${formatTimer(callDuration)})`}
              size="small"
              sx={{
                bgcolor: 'rgba(251, 191, 36, 0.15)',
                color: '#fbbf24',
                fontWeight: 800,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 },
                border: '1px solid rgba(251, 191, 36, 0.4)',
                borderRadius: '12px'
              }}
            />
          ) : (callingState === 'IN_CALL' || (isGroupMeeting && open)) && (
            <Chip
              icon={<FiberManualRecordIcon sx={{ fontSize: '9px !important', color: '#00e676 !important' }} />}
              label={isMobile ? formatTimer(callDuration) : `LIVE  ${formatTimer(callDuration)}`}
              size="small"
              sx={{
                bgcolor: 'rgba(0, 230, 118, 0.15)',
                color: '#00e676',
                fontWeight: 800,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 24, sm: 28 },
                border: '1px solid rgba(0, 230, 118, 0.3)',
                borderRadius: '12px'
              }}
            />
          )}

          {isMultiParticipant && (
            <>
              <Tooltip title={viewMode === 'grid' ? 'Switch to Spotlight View' : 'Switch to Grid View'}>
                <IconButton
                  size="small"
                  onClick={() => setViewMode((prev) => (prev === 'grid' ? 'spotlight' : 'grid'))}
                  sx={{ color: '#8696a0', p: { xs: 0.5, sm: 0.75 }, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                  {viewMode === 'grid' ? <PersonPinTwoToneIcon fontSize="small" /> : <GridViewTwoToneIcon fontSize="small" />}
                </IconButton>
              </Tooltip>

              {onSyncAttendance && isGroupMeeting && (
                <Tooltip title="Sync Attendance for connected members">
                  <IconButton
                    size="small"
                    onClick={() => {
                      const ids = memberList.filter((m) => m.isConnected && !m.isSelf).map((m) => m.id);
                      onSyncAttendance(ids);
                    }}
                    sx={{ color: '#00e676', p: { xs: 0.5, sm: 0.75 }, '&:hover': { bgcolor: 'rgba(0, 230, 118, 0.15)' } }}
                  >
                    <HowToRegTwoToneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}

          {/* Add Active Participant Button (Top-Right Header) */}
          {(callingState === 'IN_CALL' || (isGroupMeeting && open)) && (
            <Tooltip title="Add Active Participant to Call">
              <IconButton
                size="small"
                onClick={handleOpenAddParticipant}
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  p: { xs: 0.5, sm: 0.6 },
                  '&:hover': { bgcolor: '#10b981', color: '#fff' }
                }}
              >
                <PersonAddTwoToneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Resize Dialog Preset Toggle Button */}
          {!isFullScreen && !isMobile && (
            <Tooltip title={`Resize Dialog: ${dialogPresetSize.toUpperCase()} (Click to toggle Compact / Medium / Large)`}>
              <IconButton
                size="small"
                onClick={handleCycleDialogPresetSize}
                sx={{ color: '#8696a0', p: { xs: 0.5, sm: 0.75 }, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                <AspectRatioTwoToneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Maximize / Fullscreen Toggle Button */}
          <Tooltip title={isFullScreen ? 'Exit Fullscreen' : 'Maximize Fullscreen'}>
            <IconButton
              size="small"
              onClick={() => setIsFullScreen((prev) => !prev)}
              sx={{ color: '#8696a0', p: { xs: 0.5, sm: 0.75 }, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              {isFullScreen ? <FullscreenExitTwoToneIcon fontSize="small" /> : <FullscreenTwoToneIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Minimize to Floating PiP */}
          <Tooltip title="Minimize to Floating PiP">
            <IconButton
              size="small"
              onClick={() => {
                setIsFullScreen(false);
                setIsMinimized(true);
              }}
              sx={{ color: '#8696a0', p: { xs: 0.5, sm: 0.75 }, '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              <CloseFullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Main Video Body */}
      <DialogContent sx={{ p: isMultiParticipant ? { xs: 1, sm: 2 } : 0, overflow: 'hidden !important', position: 'relative', flexGrow: 1, minHeight: isFullScreen ? 'calc(100vh - 120px)' : { xs: 340, sm: 460 }, height: isFullScreen ? 'calc(100vh - 120px)' : { xs: 340, sm: 460 }, bgcolor: '#0b141a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {/* Dedicated Background Audio Sinks: Guarantees audio playback 100% of the time, even when cameras are off */}
        <Box sx={{ display: 'none' }}>
          {remoteStream && (
            <AudioStreamRenderer
              stream={remoteStream}
              isMuted={!remoteIsAudioEnabled}
            />
          )}
          {remoteStreams && Array.from(remoteStreams.entries()).map(([key, stream]) => {
            if (!stream) return null;
            const mMedia = participantMediaState[key] || participantMediaState[key?.toLowerCase()];
            const isMuted = mMedia?.isMuted !== undefined ? mMedia.isMuted : !remoteIsAudioEnabled;
            return (
              <AudioStreamRenderer
                key={`audio-sink-${key}`}
                stream={stream}
                isMuted={isMuted}
              />
            );
          })}
        </Box>

        {/* MULTI-PARTICIPANT / GROUP MEETING VIEW */}
        {isMultiParticipant ? (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {viewMode === 'spotlight' ? (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, flexGrow: 1, height: '100%', overflow: 'hidden' }}>
                <Box
                  sx={{
                    flex: 1,
                    borderRadius: '18px',
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: '#000',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isScreenSharing && screenStream ? (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#111b21',
                        p: 3,
                        textAlign: 'center'
                      }}
                    >
                      <ScreenShareTwoToneIcon sx={{ fontSize: 56, color: '#00a884', mb: 1.5 }} />
                      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                        You are presenting your screen
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8696a0', maxWidth: 380, mb: 2.5 }}>
                        Other participants in the call can see your shared screen in real-time.
                      </Typography>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<StopScreenShareTwoToneIcon />}
                        onClick={onToggleScreenShare}
                        sx={{ borderRadius: '20px', textTransform: 'none', px: 2.5, fontWeight: 600 }}
                      >
                        Stop Sharing
                      </Button>
                    </Box>
                  ) : screenPresenter ? (
                    <VideoStreamRenderer
                      stream={
                        (screenPresenter.id && (remoteStreams?.get(String(screenPresenter.id).toLowerCase().trim()) || remoteStreams?.get(String(screenPresenter.id)))) ||
                        remoteStream
                      }
                      isMuted={true}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : spotlightMember?.isSelf ? (
                    localStream && isVideoEnabled ? (
                      <VideoStreamRenderer stream={localStream} isMirror isMuted={true} />
                    ) : (
                      <UserAvatarPlaceholder
                        name={spotlightMember?.name}
                        imgName={spotlightMember?.imgName}
                        color="#00a884"
                        isCameraOff={true}
                        isSpeaking={!spotlightMember?.isMuted && Boolean(simulatedSpeakers[spotlightMember?.id])}
                        size="large"
                      />
                    )
                  ) : (() => {
                    const memberStream = findStreamForMember(spotlightMember);
                    const hasVideo = Boolean(
                      memberStream &&
                      memberStream.getVideoTracks().length > 0 &&
                      memberStream.getVideoTracks().some((t) => t.enabled !== false && t.readyState !== 'ended' && !t.muted)
                    );
                    if (hasVideo && !spotlightMember?.isVideoOff) {
                      return (
                        <VideoStreamRenderer
                          stream={memberStream}
                          isMuted={Boolean(spotlightMember?.isMuted || !remoteIsAudioEnabled)}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      );
                    }
                    return (
                      <UserAvatarPlaceholder
                        name={spotlightMember?.name}
                        imgName={spotlightMember?.imgName}
                        color="#00a884"
                        isCameraOff={true}
                        isSpeaking={!spotlightMember?.isMuted && Boolean(simulatedSpeakers[spotlightMember?.id])}
                        size="large"
                      />
                    );
                  })()}

                  {/* Spotlight Top-Left User Label */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      px: 1.5,
                      py: 0.6,
                      borderRadius: '10px',
                      bgcolor: 'rgba(17, 27, 33, 0.85)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      zIndex: 10
                    }}
                  >
                    <Avatar
                      src={spotlightMember?.imgName ? getUserImageUrl(spotlightMember.imgName) : ''}
                      sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: '#00a884' }}
                    >
                      {spotlightMember?.name?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>
                      {isScreenSharing
                        ? '🖥️ You are presenting screen'
                        : screenPresenter
                          ? `🖥️ ${screenPresenter.name || 'Participant'} is presenting screen`
                          : `${spotlightMember?.name || 'Participant'} (Spotlight)`}
                    </Typography>
                    {spotlightMember?.isHost && (
                      <Chip label="Host" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#00a884', color: '#fff', fontWeight: 800 }} />
                    )}
                    {!spotlightMember?.isMuted && Boolean(simulatedSpeakers[spotlightMember?.id]) && (
                      <GraphicEqIcon sx={{ fontSize: '1rem', color: '#00e676', animation: 'pulse 1s infinite' }} />
                    )}
                  </Box>

                  {/* Spotlight Top-Right Status Badges */}
                  <Stack direction="row" spacing={0.75} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 5 }}>
                    <Tooltip title={spotlightMember?.isMuted ? 'Microphone Muted' : (!spotlightMember?.isMuted && Boolean(simulatedSpeakers[spotlightMember?.id])) ? 'Speaking' : 'Microphone Active'}>
                      <Box
                        sx={{
                          bgcolor: spotlightMember?.isMuted ? 'rgba(244, 63, 94, 0.92)' : (!spotlightMember?.isMuted && Boolean(simulatedSpeakers[spotlightMember?.id])) ? 'rgba(0, 230, 118, 0.95)' : 'rgba(0, 0, 0, 0.65)',
                          color: '#fff',
                          borderRadius: '50%',
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(4px)',
                          boxShadow: (!spotlightMember?.isMuted && Boolean(simulatedSpeakers[spotlightMember?.id])) ? '0 0 12px rgba(0, 230, 118, 0.8)' : '0 2px 6px rgba(0,0,0,0.5)'
                        }}
                      >
                        {spotlightMember?.isMuted ? (
                          <MicOffTwoToneIcon sx={{ fontSize: '0.9rem' }} />
                        ) : (!spotlightMember?.isMuted && Boolean(simulatedSpeakers[spotlightMember?.id])) ? (
                          <GraphicEqIcon sx={{ fontSize: '0.9rem', color: '#000' }} />
                        ) : (
                          <MicTwoToneIcon sx={{ fontSize: '0.9rem', color: '#00e676' }} />
                        )}
                      </Box>
                    </Tooltip>
                    <Tooltip title={spotlightMember?.isVideoOff ? 'Camera Off' : 'Camera Active'}>
                      <Box
                        sx={{
                          bgcolor: spotlightMember?.isVideoOff ? 'rgba(244, 63, 94, 0.92)' : 'rgba(0, 0, 0, 0.65)',
                          color: '#fff',
                          borderRadius: '50%',
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                        }}
                      >
                        {spotlightMember?.isVideoOff ? (
                          <VideocamOffTwoToneIcon sx={{ fontSize: '0.9rem' }} />
                        ) : (
                          <VideocamTwoToneIcon sx={{ fontSize: '0.9rem', color: '#00e676' }} />
                        )}
                      </Box>
                    </Tooltip>
                  </Stack>
                </Box>

                {/* Side Strip */}
                <Box
                  sx={{
                    width: { xs: '100%', md: 240 },
                    display: 'flex',
                    flexDirection: { xs: 'row', md: 'column' },
                    gap: 1.5,
                    overflowY: 'auto',
                    pr: 0.5
                  }}
                >
                  {memberList.map((member, idx) => {
                    const isSpk = !member.isMuted && Boolean(simulatedSpeakers[member.id]);
                    return (
                      <Box
                        key={member.id}
                        onClick={() => setSpotlightId(member.id)}
                        sx={{
                          width: { xs: 160, md: '100%' },
                          height: { xs: 110, md: 140 },
                          flexShrink: 0,
                          borderRadius: '14px',
                          overflow: 'hidden',
                          position: 'relative',
                          bgcolor: '#1f2c34',
                          cursor: 'pointer',
                          border: spotlightId === member.id ? '2px solid #00a884' : isSpk ? '2px solid #00e676' : '1px solid rgba(255,255,255,0.1)',
                          boxShadow: isSpk ? '0 0 12px rgba(0, 230, 118, 0.4)' : 'none',
                          transition: 'all 0.2s ease',
                          '&:hover': { transform: 'scale(1.02)', borderColor: '#00a884' }
                        }}
                      >
                        {member.isSelf ? (
                          localStream && isVideoEnabled ? (
                            <VideoStreamRenderer stream={localStream} isMirror isMuted />
                          ) : (
                            <UserAvatarPlaceholder
                              name={member.name}
                              imgName={member.imgName}
                              color={idx === 0 ? '#00a884' : idx === 1 ? '#06b6d4' : idx === 2 ? '#6366f1' : '#f59e0b'}
                              isCameraOff={!isVideoEnabled}
                              isSpeaking={isSpk}
                              size="small"
                            />
                          )
                        ) : (() => {
                          const mStream = findStreamForMember(member);
                          const mHasVideo = Boolean(
                            mStream &&
                            mStream.getVideoTracks().length > 0 &&
                            mStream.getVideoTracks().some((t) => t.enabled !== false && t.readyState !== 'ended' && !t.muted)
                          );
                          if (mHasVideo && !member.isVideoOff) {
                            return <VideoStreamRenderer stream={mStream} />;
                          }
                          return (
                            <UserAvatarPlaceholder
                              name={member.name}
                              imgName={member.imgName}
                              color={idx === 0 ? '#00a884' : idx === 1 ? '#06b6d4' : idx === 2 ? '#6366f1' : '#f59e0b'}
                              isCameraOff={true}
                              isSpeaking={isSpk}
                              size="small"
                            />
                          );
                        })()}

                        {/* Top-Right Badges with Host Moderation */}
                        <Stack direction="row" spacing={0.4} sx={{ position: 'absolute', top: 4, right: 4, zIndex: 6 }}>
                          <Tooltip title={!member.isSelf && onHostMuteUser && !member.isMuted ? `Mute ${member.name} (Host Control)` : member.isMuted ? 'Muted' : 'Mic Active'}>
                            <Box
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!member.isSelf && onHostMuteUser) {
                                  onHostMuteUser(member.id, 'audio');
                                }
                              }}
                              sx={{
                                bgcolor: member.isMuted ? 'rgba(244, 63, 94, 0.9)' : isSpk ? '#00e676' : 'rgba(0,0,0,0.6)',
                                borderRadius: '50%',
                                p: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: !member.isSelf && onHostMuteUser ? 'pointer' : 'default',
                                '&:hover': {
                                  bgcolor: !member.isSelf && onHostMuteUser ? 'rgba(244, 63, 94, 1)' : undefined,
                                  transform: !member.isSelf && onHostMuteUser ? 'scale(1.15)' : undefined
                                },
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {member.isMuted ? (
                                <MicOffTwoToneIcon sx={{ fontSize: '0.75rem', color: '#fff' }} />
                              ) : isSpk ? (
                                <GraphicEqIcon sx={{ fontSize: '0.75rem', color: '#000' }} />
                              ) : (
                                <MicTwoToneIcon sx={{ fontSize: '0.75rem', color: '#00e676' }} />
                              )}
                            </Box>
                          </Tooltip>

                          <Tooltip title={!member.isSelf && onHostMuteUser && !member.isVideoOff ? `Turn off ${member.name}'s camera (Host Control)` : member.isVideoOff ? 'Camera Off' : 'Camera Active'}>
                            <Box
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!member.isSelf && onHostMuteUser) {
                                  onHostMuteUser(member.id, 'video');
                                }
                              }}
                              sx={{
                                bgcolor: member.isVideoOff ? 'rgba(244, 63, 94, 0.9)' : 'rgba(0,0,0,0.6)',
                                borderRadius: '50%',
                                p: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: !member.isSelf && onHostMuteUser ? 'pointer' : 'default',
                                '&:hover': {
                                  bgcolor: !member.isSelf && onHostMuteUser ? 'rgba(244, 63, 94, 1)' : undefined,
                                  transform: !member.isSelf && onHostMuteUser ? 'scale(1.15)' : undefined
                                },
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {member.isVideoOff ? (
                                <VideocamOffTwoToneIcon sx={{ fontSize: '0.75rem', color: '#fff' }} />
                              ) : (
                                <VideocamTwoToneIcon sx={{ fontSize: '0.75rem', color: '#00e676' }} />
                              )}
                            </Box>
                          </Tooltip>
                        </Stack>

                        <Box sx={{ position: 'absolute', bottom: 4, left: 6, bgcolor: 'rgba(0,0,0,0.75)', px: 0.75, py: 0.2, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {isSpk && <GraphicEqIcon sx={{ fontSize: '0.75rem', color: '#00e676' }} />}
                          <Typography variant="caption" sx={{ color: isSpk ? '#00e676' : '#fff', fontSize: '0.68rem', fontWeight: 700 }}>
                            {member.name}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ) : (
              /* Grid Mode */
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: memberList.length <= 2 ? '1fr 1fr' : 'repeat(2, 1fr)',
                    md: memberList.length <= 2 ? '1fr 1fr' : memberList.length <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'
                  },
                  gap: 1.5,
                  flexGrow: 1,
                  overflowY: 'auto',
                  p: 0.5
                }}
              >
                {memberList.map((member, idx) => {
                  const isSpk = !member.isMuted && Boolean(simulatedSpeakers[member.id]);
                  return (
                    <Box
                      key={member.id}
                      sx={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        position: 'relative',
                        bgcolor: '#1f2c34',
                        border: isSpk ? '2px solid #00e676' : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isSpk ? '0 0 16px rgba(0, 230, 118, 0.45)' : 'none',
                        minHeight: 180,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {(() => {
                        if (member.isSelf) {
                          return localStream && isVideoEnabled ? (
                            <VideoStreamRenderer stream={localStream} isMirror isMuted />
                          ) : (
                            <UserAvatarPlaceholder
                              name={member.name}
                              imgName={member.imgName}
                              color={idx === 0 ? '#00a884' : idx === 1 ? '#06b6d4' : idx === 2 ? '#6366f1' : '#f59e0b'}
                              isCameraOff={!isVideoEnabled}
                              isSpeaking={isSpk}
                              size="medium"
                            />
                          );
                        }
                        const memberStream = findStreamForMember(member);
                        const hasVideo = Boolean(
                          memberStream &&
                          memberStream.getVideoTracks().length > 0 &&
                          memberStream.getVideoTracks().some((t) => t.enabled !== false && t.readyState !== 'ended' && !t.muted)
                        );
                        if (hasVideo && !member.isVideoOff) {
                          return (
                            <VideoStreamRenderer
                              stream={memberStream}
                              isMuted={Boolean(member.isMuted || !remoteIsAudioEnabled)}
                            />
                          );
                        }
                        return (
                          <UserAvatarPlaceholder
                            name={member.name}
                            imgName={member.imgName}
                            color={idx === 0 ? '#00a884' : idx === 1 ? '#06b6d4' : idx === 2 ? '#6366f1' : '#f59e0b'}
                            isCameraOff={true}
                            isSpeaking={isSpk}
                            size="medium"
                            callStatus={member.callStatus}
                          />
                        );
                      })()}

                      {/* Top-Right Badges: Mic & Video Status (With Host Moderation for Host) */}
                      <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 6 }}>
                        <Tooltip title={!member.isSelf && onHostMuteUser && !member.isMuted ? `Mute ${member.name}'s mic (Host Control)` : member.isMuted ? `${member.name} is muted` : isSpk ? `${member.name} is speaking` : 'Microphone Active'}>
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!member.isSelf && onHostMuteUser) {
                                onHostMuteUser(member.id, 'audio');
                              }
                            }}
                            sx={{
                              bgcolor: member.isMuted ? 'rgba(244, 63, 94, 0.92)' : isSpk ? 'rgba(0, 230, 118, 0.95)' : 'rgba(0, 0, 0, 0.65)',
                              color: '#fff',
                              borderRadius: '50%',
                              width: 28,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backdropFilter: 'blur(4px)',
                              boxShadow: isSpk ? '0 0 10px rgba(0, 230, 118, 0.8)' : '0 2px 6px rgba(0,0,0,0.5)',
                              border: isSpk ? '1.5px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                              cursor: !member.isSelf && onHostMuteUser ? 'pointer' : 'default',
                              '&:hover': {
                                bgcolor: !member.isSelf && onHostMuteUser ? 'rgba(244, 63, 94, 1)' : undefined,
                                transform: !member.isSelf && onHostMuteUser ? 'scale(1.12)' : undefined
                              },
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {member.isMuted ? (
                              <MicOffTwoToneIcon sx={{ fontSize: '0.85rem' }} />
                            ) : isSpk ? (
                              <GraphicEqIcon sx={{ fontSize: '0.85rem', color: '#000' }} />
                            ) : (
                              <MicTwoToneIcon sx={{ fontSize: '0.85rem', color: '#00e676' }} />
                            )}
                          </Box>
                        </Tooltip>

                        <Tooltip title={!member.isSelf && onHostMuteUser && !member.isVideoOff ? `Turn off ${member.name}'s camera (Host Control)` : member.isVideoOff ? `${member.name}'s camera is off` : 'Camera Active'}>
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!member.isSelf && onHostMuteUser) {
                                onHostMuteUser(member.id, 'video');
                              }
                            }}
                            sx={{
                              bgcolor: member.isVideoOff ? 'rgba(244, 63, 94, 0.92)' : 'rgba(0, 0, 0, 0.65)',
                              color: '#fff',
                              borderRadius: '50%',
                              width: 28,
                              height: 28,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backdropFilter: 'blur(4px)',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              cursor: !member.isSelf && onHostMuteUser ? 'pointer' : 'default',
                              '&:hover': {
                                bgcolor: !member.isSelf && onHostMuteUser ? 'rgba(244, 63, 94, 1)' : undefined,
                                transform: !member.isSelf && onHostMuteUser ? 'scale(1.12)' : undefined
                              },
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {member.isVideoOff ? (
                              <VideocamOffTwoToneIcon sx={{ fontSize: '0.85rem' }} />
                            ) : (
                              <VideocamTwoToneIcon sx={{ fontSize: '0.85rem', color: '#00e676' }} />
                            )}
                          </Box>
                        </Tooltip>
                      </Stack>

                      {/* Bottom Name Bar */}
                      <Box sx={{ position: 'absolute', bottom: 6, left: 8, bgcolor: 'rgba(0,0,0,0.75)', px: 1, py: 0.3, borderRadius: '6px', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {isSpk && <GraphicEqIcon sx={{ fontSize: '0.85rem', color: '#00e676', animation: 'pulse 1s infinite' }} />}
                        <Typography variant="caption" sx={{ color: isSpk ? '#00e676' : '#fff', fontSize: '0.72rem', fontWeight: 700 }}>
                          {member.name} {member.isSelf ? '(You)' : !member.isConnected ? '• Calling...' : ''}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        ) : (
          /* 1-TO-1 CALL VIEW (Audit Verification / Direct Call) */
          callingState === 'IN_CALL' ? (
            <Box
              ref={videoContainerRef}
              sx={{
                width: '100%',
                height: isFullScreen ? 'calc(100vh - 120px)' : { xs: 340, sm: 460 },
                position: 'relative',
                bgcolor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Remote / Screen Share Stream */}
              {isScreenSharing && screenStream ? (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#111b21',
                    p: 3,
                    textAlign: 'center'
                  }}
                >
                  <ScreenShareTwoToneIcon sx={{ fontSize: 56, color: '#00a884', mb: 1.5 }} />
                  <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600, mb: 1 }}>
                    You are sharing your screen
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8696a0', maxWidth: 360, mb: 2.5 }}>
                    Your screen is being shared live with {targetUser?.employeeName || 'participant'}.
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<StopScreenShareTwoToneIcon />}
                    onClick={onToggleScreenShare}
                    sx={{ borderRadius: '20px', textTransform: 'none', px: 2.5, fontWeight: 600 }}
                  >
                    Stop Sharing
                  </Button>
                </Box>
              ) : (() => {
                const effectiveRemoteStream = (targetUser && findStreamForMember(targetUser)) || remoteStream;
                const hasRemoteVideo = Boolean(
                  effectiveRemoteStream &&
                  effectiveRemoteStream.getVideoTracks().length > 0 &&
                  effectiveRemoteStream.getVideoTracks().some((t) => t.enabled !== false && t.readyState !== 'ended' && !t.muted)
                );
                const showRemoteVideo = hasRemoteVideo || Boolean(screenPresenter && effectiveRemoteStream);

                if (showRemoteVideo && remoteIsVideoEnabled) {
                  return (
                    <VideoStreamRenderer stream={effectiveRemoteStream} isMuted={true} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  );
                }

                return (
                  <UserAvatarPlaceholder
                    name={targetUser?.employeeName || 'Participant'}
                    imgName={targetUser?.imgName}
                    color="#00a884"
                    isCameraOff={true}
                    isSpeaking={Boolean(simulatedSpeakers[String(targetUser?.userId || targetUser?.id)])}
                    size="large"
                  />
                );
              })()}

              {/* Remote User Label */}
              <Box
                sx={{
                  position: 'absolute',
                  top: { xs: 10, sm: 16 },
                  left: { xs: 10, sm: 16 },
                  px: { xs: 1, sm: 1.5 },
                  py: { xs: 0.35, sm: 0.5 },
                  borderRadius: 2,
                  bgcolor: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 0.6, sm: 1 },
                  zIndex: 10,
                  maxWidth: { xs: '65%', sm: '80%' },
                  pointerEvents: 'none'
                }}
              >
                <Avatar
                  src={targetUser?.imgName ? getUserImageUrl(targetUser.imgName) : ''}
                  sx={{ width: { xs: 18, sm: 22 }, height: { xs: 18, sm: 22 }, fontSize: '0.75rem', flexShrink: 0 }}
                >
                  {targetUser?.employeeName?.charAt(0) || 'U'}
                </Avatar>
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isScreenSharing ? '🖥️ Screen' : screenPresenter ? `🖥️ ${screenPresenter.name || targetUser?.employeeName || 'Presenter'} (Screen)` : `${targetUser?.employeeName || 'Participant'} (Live)`}
                </Typography>
                {Boolean(simulatedSpeakers[String(targetUser?.userId || targetUser?.id)]) && (
                  <GraphicEqIcon sx={{ fontSize: '0.9rem', color: '#00e676', animation: 'pulse 1s infinite' }} />
                )}
              </Box>

              {/* Remote Status Badges: Mic & Video (Top Right) */}
              <Stack direction="row" spacing={0.6} sx={{ position: 'absolute', top: { xs: 10, sm: 16 }, right: { xs: 10, sm: 16 }, zIndex: 10 }}>
                {/* Remote Mic / Speaking Status */}
                <Tooltip title={!remoteIsAudioEnabled ? `${targetUser?.employeeName || 'Participant'} is muted` : Boolean(simulatedSpeakers[String(targetUser?.userId || targetUser?.id)]) ? `${targetUser?.employeeName || 'Participant'} is speaking` : `${targetUser?.employeeName || 'Participant'} mic active`}>
                  <Box
                    sx={{
                      bgcolor: !remoteIsAudioEnabled ? 'rgba(244, 63, 94, 0.92)' : Boolean(simulatedSpeakers[String(targetUser?.userId || targetUser?.id)]) ? 'rgba(0, 230, 118, 0.95)' : 'rgba(0, 0, 0, 0.65)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: { xs: 26, sm: 30 },
                      height: { xs: 26, sm: 30 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: Boolean(simulatedSpeakers[String(targetUser?.userId || targetUser?.id)]) ? '0 0 12px rgba(0, 230, 118, 0.8)' : '0 4px 12px rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(4px)',
                      border: Boolean(simulatedSpeakers[String(targetUser?.userId || targetUser?.id)]) ? '1.5px solid #fff' : '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {!remoteIsAudioEnabled ? (
                      <MicOffTwoToneIcon sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, color: '#fff' }} />
                    ) : Boolean(simulatedSpeakers[String(targetUser?.userId || targetUser?.id)]) ? (
                      <GraphicEqIcon sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, color: '#000' }} />
                    ) : (
                      <MicTwoToneIcon sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, color: '#00e676' }} />
                    )}
                  </Box>
                </Tooltip>

                {/* Remote Camera Status */}
                {(() => {
                  const effectiveRemoteStream = (targetUser && findStreamForMember(targetUser)) || remoteStream;
                  const targetKeys = getIdentityKeys(targetUser);
                  let mediaState = null;
                  for (const k of targetKeys) {
                    if (participantMediaState[k]) {
                      mediaState = participantMediaState[k];
                      break;
                    }
                  }
                  const isCamOffExplicit = mediaState ? Boolean(mediaState.isVideoOff) : !remoteIsVideoEnabled;
                  const hasRemoteVideo = Boolean(
                    effectiveRemoteStream &&
                    effectiveRemoteStream.getVideoTracks().length > 0 &&
                    effectiveRemoteStream.getVideoTracks().some((t) => t.enabled !== false && t.readyState !== 'ended' && !t.muted)
                  );
                  const isCamActive = hasRemoteVideo && !isCamOffExplicit && Boolean(remoteIsVideoEnabled);
                  return (
                    <Tooltip title={!isCamActive ? `${targetUser?.employeeName || 'Participant'}'s camera is off` : `${targetUser?.employeeName || 'Participant'}'s camera is active`}>
                      <Box
                        sx={{
                          bgcolor: !isCamActive ? 'rgba(244, 63, 94, 0.92)' : 'rgba(0, 0, 0, 0.65)',
                          color: '#fff',
                          borderRadius: '50%',
                          width: { xs: 26, sm: 30 },
                          height: { xs: 26, sm: 30 },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(255,255,255,0.2)'
                        }}
                      >
                        {!isCamActive ? (
                          <VideocamOffTwoToneIcon sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, color: '#fff' }} />
                        ) : (
                          <VideocamTwoToneIcon sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, color: '#00e676' }} />
                        )}
                      </Box>
                    </Tooltip>
                  );
                })()}
              </Stack>

              {/* Local Video Draggable & Resizable PiP Box */}
              <Box
                ref={localPipBoxRef}
                onPointerDown={handleLocalPipPointerDown}
                onDoubleClick={handleToggleLocalPipSize}
                sx={{
                  position: 'absolute',
                  left: localPipPos ? localPipPos.x : 'auto',
                  top: localPipPos ? localPipPos.y : 'auto',
                  bottom: localPipPos ? 'auto' : 16,
                  right: localPipPos ? 'auto' : 16,
                  width: pipWidth,
                  height: pipHeight,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  bgcolor: '#1f2c34',
                  boxShadow: isLocalPipDragging ? '0 16px 36px rgba(0,0,0,0.8), 0 0 0 2px #00a884' : '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15)',
                  cursor: isLocalPipDragging ? 'grabbing' : 'grab',
                  zIndex: 15,
                  touchAction: 'none',
                  transition: isLocalPipDragging ? 'none' : 'width 0.2s ease, height 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 12px 30px rgba(0,0,0,0.7), 0 0 0 2px #00a884'
                  }
                }}
              >
                {localStream && isVideoEnabled ? (
                  <VideoStreamRenderer stream={localStream} isMirror isMuted />
                ) : (
                  <UserAvatarPlaceholder
                    name={currentUser?.employeeName || 'You'}
                    imgName={currentUser?.imgName}
                    color="#6366f1"
                    isCameraOff={true}
                    size="small"
                  />
                )}

                {/* PiP Size Toggle Button */}
                <Tooltip title={`Current: ${localPipSize} (Double-click or click to resize)`}>
                  <IconButton
                    size="small"
                    onClick={handleToggleLocalPipSize}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      width: 22,
                      height: 22,
                      backdropFilter: 'blur(4px)',
                      zIndex: 16,
                      '&:hover': { bgcolor: 'rgba(0, 168, 132, 0.8)' }
                    }}
                  >
                    {localPipSize === 'compact' ? (
                      <PhotoSizeSelectSmallTwoToneIcon sx={{ fontSize: '0.8rem' }} />
                    ) : (
                      <AspectRatioTwoToneIcon sx={{ fontSize: '0.8rem' }} />
                    )}
                  </IconButton>
                </Tooltip>

                {/* Self Status Badges (Top Right) */}
                <Stack direction="row" spacing={0.4} sx={{ position: 'absolute', top: 4, right: 4, zIndex: 17 }}>
                  {/* Self Muted / Speaking Badge */}
                  <Tooltip title={isAudioEnabled ? (Boolean(simulatedSpeakers[String(currentUser?.id || currentUser?.userId || 'current-user')]) ? 'You are speaking' : 'Your mic is active') : 'Your microphone is muted'}>
                    <Box
                      sx={{
                        bgcolor: !isAudioEnabled ? 'rgba(244, 63, 94, 0.92)' : Boolean(simulatedSpeakers[String(currentUser?.id || currentUser?.userId || 'current-user')]) ? 'rgba(0, 230, 118, 0.95)' : 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                        border: Boolean(simulatedSpeakers[String(currentUser?.id || currentUser?.userId || 'current-user')]) ? '1px solid #fff' : 'none'
                      }}
                    >
                      {!isAudioEnabled ? (
                        <MicOffTwoToneIcon sx={{ fontSize: '0.75rem', color: '#fff' }} />
                      ) : Boolean(simulatedSpeakers[String(currentUser?.id || currentUser?.userId || 'current-user')]) ? (
                        <GraphicEqIcon sx={{ fontSize: '0.75rem', color: '#000' }} />
                      ) : (
                        <MicTwoToneIcon sx={{ fontSize: '0.75rem', color: '#00e676' }} />
                      )}
                    </Box>
                  </Tooltip>

                  {/* Self Camera Off Badge */}
                  {!isVideoEnabled && (
                    <Tooltip title="Your camera is off">
                      <Box
                        sx={{
                          bgcolor: 'rgba(244, 63, 94, 0.92)',
                          color: '#fff',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                        }}
                      >
                        <VideocamOffTwoToneIcon sx={{ fontSize: '0.75rem', color: '#fff' }} />
                      </Box>
                    </Tooltip>
                  )}
                </Stack>

                {/* Bottom Tag */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 3,
                    left: 5,
                    px: 0.6,
                    py: 0.15,
                    borderRadius: 1,
                    bgcolor: 'rgba(0,0,0,0.65)',
                    pointerEvents: 'none'
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#fff', fontSize: localPipSize === 'compact' ? '0.55rem' : '0.65rem', fontWeight: 600 }}>
                    {localPipSize === 'compact' ? 'You' : 'You (Host)'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            /* Ringing / Calling State */
            <Box sx={{ width: '100%', height: isFullScreen ? 'calc(100vh - 120px)' : { xs: 340, sm: 460 }, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', p: { xs: 2, sm: 3 } }}>
              {localStream && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.35, zIndex: 0, filter: 'blur(8px)' }}>
                  <VideoStreamRenderer stream={localStream} isMirror isMuted />
                </Box>
              )}
              <Stack
                direction="column"
                alignItems="center"
                spacing={{ xs: 1.5, sm: 2.5 }}
                sx={{
                  zIndex: 2,
                  textAlign: 'center',
                  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.94) 0%, rgba(10, 15, 29, 0.98) 100%)',
                  backdropFilter: 'blur(24px)',
                  px: { xs: 2.5, sm: 5 },
                  py: { xs: 3, sm: 4.5 },
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(16, 185, 129, 0.2)',
                  maxWidth: 440,
                  width: '90%'
                }}
              >
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: { xs: 100, sm: 140 }, height: { xs: 100, sm: 140 } }}>
                  <Box
                    sx={{
                      width: { xs: 80, sm: 110 },
                      height: { xs: 80, sm: 110 },
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      p: '3px',
                      boxShadow: '0 0 28px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    <Avatar
                      src={targetUser?.imgName ? getUserImageUrl(targetUser.imgName) : ''}
                      sx={{ width: '100%', height: '100%', fontSize: { xs: '1.8rem', sm: '2.5rem' }, fontWeight: 700, bgcolor: '#0f172a', color: '#fff', border: '2px solid #0f172a' }}
                    >
                      {targetUser?.employeeName?.charAt(0) || 'U'}
                    </Avatar>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h3" sx={{ color: '#ffffff', fontWeight: 800, fontSize: { xs: '1.2rem', sm: '1.5rem' }, letterSpacing: '-0.3px', mb: 0.5 }}>
                    {targetUser?.employeeName || 'Participant'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 500 }}>
                    {targetUser?.departmentName || 'Connecting video stream...'}
                  </Typography>
                </Box>
                <Chip
                  icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: ringCountdown <= 10 ? '#f43f5e !important' : '#34d399 !important', animation: 'pulse 1.4s infinite' }} />}
                  label={`Calling... (${ringCountdown}s)`}
                  sx={{
                    bgcolor: ringCountdown <= 10 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: ringCountdown <= 10 ? '#f43f5e' : '#34d399',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    border: `1px solid ${ringCountdown <= 10 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
                    px: 1.25,
                    py: 0.5
                  }}
                />
              </Stack>
            </Box>
          )
        )}
      </DialogContent>

      {/* Footer Controls Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: { xs: 0.8, sm: 2 },
          py: { xs: 1.25, sm: 2 },
          px: { xs: 1, sm: 3 },
          bgcolor: '#1f2c34',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' }
        }}
      >
        <Tooltip title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}>
          <IconButton
            onClick={onToggleAudio}
            sx={{
              bgcolor: isAudioEnabled ? '#1e293b' : '#f43f5e',
              color: isAudioEnabled ? '#00e676' : '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': { bgcolor: isAudioEnabled ? '#334155' : '#e11d48' },
              width: { xs: 38, sm: 44 },
              height: { xs: 38, sm: 44 }
            }}
          >
            {isAudioEnabled ? <MicTwoToneIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem' }, color: '#00e676' }} /> : <MicOffTwoToneIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem' }, color: '#ffffff' }} />}
          </IconButton>
        </Tooltip>

        <Tooltip title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}>
          <IconButton
            onClick={onToggleVideo}
            sx={{
              bgcolor: isVideoEnabled ? '#1e293b' : '#f43f5e',
              color: isVideoEnabled ? '#00e676' : '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': { bgcolor: isVideoEnabled ? '#334155' : '#e11d48' },
              width: { xs: 38, sm: 44 },
              height: { xs: 38, sm: 44 }
            }}
          >
            {isVideoEnabled ? <VideocamTwoToneIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem' }, color: '#00e676' }} /> : <VideocamOffTwoToneIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem' }, color: '#ffffff' }} />}
          </IconButton>
        </Tooltip>

        {onToggleScreenShare && (
          <Tooltip title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}>
            <IconButton
              onClick={onToggleScreenShare}
              sx={{
                bgcolor: isScreenSharing ? '#00a884' : '#1e293b',
                color: isScreenSharing ? '#ffffff' : '#38bdf8',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': { bgcolor: isScreenSharing ? '#008f6f' : '#334155' },
                width: { xs: 38, sm: 44 },
                height: { xs: 38, sm: 44 }
              }}
            >
              {isScreenSharing ? <StopScreenShareTwoToneIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem' }, color: '#ffffff' }} /> : <ScreenShareTwoToneIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem' }, color: '#38bdf8' }} />}
            </IconButton>
          </Tooltip>
        )}

        {isMultiParticipant && (
          <Tooltip title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}>
            <IconButton
              onClick={() => setIsHandRaised((prev) => !prev)}
              sx={{
                bgcolor: isHandRaised ? '#f59e0b' : '#1e293b',
                color: isHandRaised ? '#ffffff' : '#fbbf24',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': { bgcolor: isHandRaised ? '#d97706' : '#334155' },
                width: { xs: 38, sm: 44 },
                height: { xs: 38, sm: 44 }
              }}
            >
              <PanToolTwoToneIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem' }, color: isHandRaised ? '#ffffff' : '#fbbf24' }} />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Capture Evidence Snapshot">
          <IconButton
            onClick={handleCaptureSnapshot}
            sx={{
              bgcolor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': { bgcolor: '#334155' },
              width: { xs: 38, sm: 44 },
              height: { xs: 38, sm: 44 }
            }}
          >
            <CameraAltTwoToneIcon sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem' }, color: '#38bdf8' }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Leave / End Call">
          {isMobile ? (
            <IconButton
              onClick={onEndCall}
              sx={{
                bgcolor: '#f43f5e',
                color: '#fff',
                '&:hover': { bgcolor: '#e11d48' },
                width: 38,
                height: 38,
                boxShadow: '0 4px 14px rgba(244, 63, 94, 0.5)'
              }}
            >
              <CallEndIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          ) : (
            <Button
              variant="contained"
              color="error"
              startIcon={<CallEndIcon />}
              onClick={onEndCall}
              sx={{
                borderRadius: '24px',
                px: 3,
                py: 1,
                fontWeight: 700,
                bgcolor: '#f43f5e',
                '&:hover': { bgcolor: '#e11d48' },
                boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)'
              }}
            >
              {isMultiParticipant ? 'Leave Meeting' : 'End Call'}
            </Button>
          )}
        </Tooltip>
      </Box>

      {/* Bottom-Right Corner Free-form Resize Grip */}
      {!isFullScreen && !isMobile && (
        <Box
          onPointerDown={handleDialogResizePointerDown}
          title="Click and drag to resize dialog"
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 22,
            height: 22,
            cursor: 'nwse-resize',
            zIndex: 99,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            p: '3px',
            opacity: 0.5,
            transition: 'opacity 0.2s',
            userSelect: 'none',
            touchAction: 'none',
            '&:hover': { opacity: 1 },
            '&::after': {
              content: '""',
              width: 10,
              height: 10,
              borderRight: '2.5px solid rgba(255,255,255,0.7)',
              borderBottom: '2.5px solid rgba(255,255,255,0.7)',
              borderBottomRightRadius: '3px'
            }
          }}
        />
      )}

      {/* Sub-Dialog: Add Active Participants to Call */}
      <Dialog
        open={addParticipantOpen}
        onClose={() => setAddParticipantOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            bgcolor: '#111b21',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ px: 3, py: 2, bgcolor: '#1f2c34', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Avatar sx={{ bgcolor: '#10b981', width: 34, height: 34 }}>
              <PersonAddTwoToneIcon sx={{ fontSize: '1.2rem', color: '#fff' }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>
                Add Active Participants
              </Typography>
              <Typography variant="caption" sx={{ color: '#34d399', fontSize: '0.72rem', fontWeight: 600 }}>
                • Active users available for call
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setAddParticipantOpen(false)} sx={{ color: '#8696a0', '&:hover': { color: '#fff' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, bgcolor: '#0b141a' }}>
          {/* Search Box */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search active users by name, dept, id..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchTwoToneIcon sx={{ color: '#8696a0', fontSize: '1.2rem' }} />
                </InputAdornment>
              )
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#1f2c34',
                color: '#fff',
                borderRadius: '12px',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                '&:hover fieldset': { borderColor: '#10b981' },
                '&.Mui-focused fieldset': { borderColor: '#10b981' }
              }
            }}
          />

          {/* User List */}
          {isFetchingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
              <CircularProgress size={32} sx={{ color: '#10b981' }} />
            </Box>
          ) : filteredActiveUsers.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#8696a0', fontStyle: 'italic' }}>
                No active users found matching search.
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 340, overflowY: 'auto', p: 0, '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 3 } }}>
              {filteredActiveUsers.map((activeUser) => {
                const uId = String(activeUser.userId || activeUser.id);
                const isInvited = invitedUserIds.has(uId);

                return (
                  <ListItem
                    key={uId}
                    sx={{
                      px: 1.5,
                      py: 1,
                      mb: 1,
                      borderRadius: '14px',
                      bgcolor: '#1f2c34',
                      border: isInvited ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={activeUser.imgName ? getUserImageUrl(activeUser.imgName) : ''}
                          sx={{ width: 38, height: 38, bgcolor: '#00a884', color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}
                        >
                          {activeUser.employeeName?.charAt(0) || 'U'}
                        </Avatar>
                        {/* Active Green Dot */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: '#00e676',
                            border: '2px solid #111b21',
                            boxShadow: '0 0 6px #00e676'
                          }}
                        />
                      </Box>

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {activeUser.employeeName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {activeUser.departmentName ? `${activeUser.departmentName} • ${activeUser.designationName || 'Staff'}` : activeUser.designationName || 'Active User'}
                        </Typography>
                      </Box>
                    </Stack>

                    <Button
                      size="small"
                      variant={isInvited ? 'outlined' : 'contained'}
                      disabled={isInvited}
                      onClick={() => handleInviteUser(activeUser)}
                      startIcon={isInvited ? <CheckCircleTwoToneIcon sx={{ fontSize: '1rem !important', color: '#10b981' }} /> : <PersonAddTwoToneIcon sx={{ fontSize: '1rem !important' }} />}
                      sx={{
                        borderRadius: '12px',
                        py: 0.5,
                        px: 1.5,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        bgcolor: isInvited ? 'rgba(16, 185, 129, 0.15)' : '#10b981',
                        color: isInvited ? '#34d399' : '#fff',
                        border: isInvited ? '1px solid #10b981' : 'none',
                        '&:hover': { bgcolor: isInvited ? 'rgba(16, 185, 129, 0.25)' : '#059669' }
                      }}
                    >
                      {isInvited ? 'Added' : 'Add'}
                    </Button>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
