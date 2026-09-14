import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Stack,
  Avatar,
  Tooltip,
  Button,
  Fade,
  Chip,
  Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Icons
import CallTwoToneIcon from '@mui/icons-material/CallTwoTone';
import CallEndIcon from '@mui/icons-material/CallEnd';
import PhoneInTalkTwoToneIcon from '@mui/icons-material/PhoneInTalkTwoTone';
import VideocamTwoToneIcon from '@mui/icons-material/VideocamTwoTone';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import axios from 'utils/axios';
import useAuth from 'hooks/useAuth';
import { useWebRTC } from 'hooks/useWebRTC';
import { getUserImageUrl } from 'utils/upload-helper';
import { callSounds } from 'utils/callSounds';
import BOSUniversalCallDialog from './BOSUniversalCallDialog';
import { BOS_CALL_EVENTS } from 'utils/universalCallManager';

const UNIVERSAL_CALL_SESSION_KEY = 'bos_active_universal_call_session';

export default function GlobalIncomingCallHandler() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const currentUserId =
    user?.userId ||
    user?.userName ||
    user?.id ||
    user?.empCode ||
    sessionStorage.getItem('userName') ||
    sessionStorage.getItem('userId') ||
    localStorage.getItem('userName') ||
    localStorage.getItem('userId');

  const [callState, setCallState] = useState(null); // null | 'INCOMING' | 'IN_CALL' | 'RINGING'
  const callStateRef = useRef(null);
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(true);
  const ringTimeoutRef = useRef(null);

  // Call metadata
  const [activeCallMeta, setActiveCallMeta] = useState({
    callType: 'AUDIT',
    title: '',
    subtitle: '',
    targetUser: null,
    schedule: null,
    participants: []
  });

  const onSyncAttendanceCallbackRef = useRef(null);
  const incomingOfferRef = useRef(null);
  const incomingCallerIdRef = useRef(null);
  const incomingVideoRef = useRef(true);
  const declinedCallersRef = useRef(new Map());
  const inviteTimersRef = useRef(new Map());

  const updateCallState = (newState) => {
    callStateRef.current = newState;
    setCallState(newState);
  };

  const handleCallEnded = useCallback((reason) => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    callSounds.stopAll();
    if (reason === 'BUSY') {
      callSounds.playBusyTone();
      dispatch(
        openSnackbar({
          open: true,
          message: 'The participant is busy on another call.',
          severity: 'warning',
          variant: 'alert'
        })
      );
    } else if (reason === 'DECLINED' || reason === 'REJECTED') {
      callSounds.playCallEnded();
      dispatch(
        openSnackbar({
          open: true,
          message: 'Call was declined by participant.',
          severity: 'info',
          variant: 'alert'
        })
      );
    } else {
      callSounds.playCallEnded();
    }
    sessionStorage.removeItem(UNIVERSAL_CALL_SESSION_KEY);
    setIsCallDialogOpen(false);
    updateCallState(null);
    setActiveCallMeta({
      callType: 'AUDIT',
      title: '',
      subtitle: '',
      targetUser: null,
      schedule: null,
      participants: []
    });
    incomingOfferRef.current = null;
    incomingCallerIdRef.current = null;
  }, [dispatch]);

  const handleCallConnected = useCallback(() => {
    callSounds.stopAll();
    callSounds.playCallConnected();
    setIsCallDialogOpen(true);
    updateCallState('IN_CALL');
  }, []);

  const activeLocalStreamRef = useRef(null);
  const webRTCActionsRef = useRef({});

  const handleIncomingCallDirect = useCallback((sender, video, offer, data = {}) => {
    const isGroupOffer = data?.callType === 'GROUP_MEETING' || Boolean(data?.isRejoin) || (data?.participants && data.participants.length > 0);
    const offerParticipants = data?.participants || [];

    if (sender) {
      const sLower = String(sender).toLowerCase().trim();
      const lastDeclined = declinedCallersRef.current.get(sLower);
      if (lastDeclined && Date.now() - lastDeclined < 5000) {
        console.log('[GlobalCallManager] Suppressing call offer from recently declined caller:', sender);
        return;
      }
    }

    const sLower = sender ? String(sender).toLowerCase().trim() : '';
    const incomingCallerLower = incomingCallerIdRef.current ? String(incomingCallerIdRef.current).toLowerCase().trim() : '';

    if (callStateRef.current === 'INCOMING' && (sLower === incomingCallerLower || !sLower)) {
      console.log('[GlobalCallManager] Duplicate incoming call offer received from same sender, ignoring:', sender);
      return;
    }

    if (callStateRef.current === 'IN_CALL' && activeLocalStreamRef.current) {
      const existingKeys = getAllParticipantIds().map((id) => String(id).toLowerCase().trim());
      const targetUserLower = activeCallMeta.targetUser ? String(activeCallMeta.targetUser.userId || activeCallMeta.targetUser.id || activeCallMeta.targetUser.userName || '').toLowerCase().trim() : '';
      const isExistingParticipant = existingKeys.includes(sLower) || sLower === incomingCallerLower || sLower === targetUserLower;
      const isGroupMeeting = isGroupOffer || activeCallMeta.callType === 'GROUP_MEETING';

      if (isExistingParticipant || data?.isRejoin || isGroupMeeting) {
        console.log('[GlobalCallManager] Auto-linking/accepting peer connection offer during active call from member:', sender);
        if (offer && webRTCActionsRef.current.acceptCall) {
          webRTCActionsRef.current.acceptCall(sender, offer, video, data);
        }
        setIsCallDialogOpen(true);
        if (offerParticipants.length > 0) {
          setActiveCallMeta((prev) => ({
            ...prev,
            callType: 'GROUP_MEETING',
            participants: deduplicateParticipants([...(prev.participants || []), ...offerParticipants])
          }));
        }
        return;
      }

      console.log('[GlobalCallManager] Suppressing duplicate offer from:', sender);
      return;
    }

    incomingOfferRef.current = offer;
    incomingCallerIdRef.current = sender;
    incomingVideoRef.current = video;

    callSounds.playIncomingRingtone();

    // 1. Instantly set incoming state and open dialog with zero network delay
    const initialCallerName = data?.senderName || data?.callerName || sender;
    setActiveCallMeta({
      callType: isGroupOffer ? 'GROUP_MEETING' : 'AUDIT',
      title: isGroupOffer ? (data?.title || 'Incoming Group Video Meeting') : 'Incoming Video Call',
      subtitle: 'End-to-end encrypted',
      targetUser: {
        userId: sender,
        employeeName: initialCallerName,
        designationName: isGroupOffer ? 'Group Meeting Host' : 'Participant'
      },
      schedule: data?.schedule || null,
      participants: offerParticipants
    });
    setIsCallDialogOpen(true);
    updateCallState('INCOMING');

    // 2. Resolve enriched caller name & avatar in background
    axios
      .get(`/api/chat/search/users?query=${encodeURIComponent(sender)}`)
      .then((res) => {
        const found = (res.data || []).find(
          (u) =>
            u.userId === sender ||
            (u.employeeName && u.employeeName.toLowerCase().includes(sender.toLowerCase()))
        ) || res.data?.[0];

        if (found) {
          setActiveCallMeta((prev) => ({
            ...prev,
            targetUser: {
              ...prev.targetUser,
              ...found,
              employeeName: found.employeeName || initialCallerName,
              designationName: isGroupOffer ? 'Group Meeting Host' : (found.designationName || 'Participant')
            }
          }));
        }
      })
      .catch(() => {});
  }, []);

  const {
    localStream,
    remoteStream,
    remoteStreams,
    screenStream,
    isScreenSharing,
    screenPresenter,
    remoteIsAudioEnabled,
    remoteIsVideoEnabled,
    toggleScreenShare,
    makeCall: makeWebRTCCall,
    acceptCall: acceptWebRTCCall,
    rejectCall: rejectWebRTCCall,
    sendBusy: sendWebRTCBusy,
    endCall: endWebRTCCall,
    leaveCall: leaveWebRTCCall,
    broadcastParticipantSync,
    syncMeshConnections,
    broadcastMediaState,
    hostMuteUser,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled,
    startLocalMedia
  } = useWebRTC(currentUserId, handleIncomingCallDirect, handleCallEnded, handleCallConnected, user);

  useEffect(() => {
    activeLocalStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    webRTCActionsRef.current = {
      acceptCall: acceptWebRTCCall,
      makeCall: makeWebRTCCall,
      endCall: endWebRTCCall,
      leaveCall: leaveWebRTCCall
    };
  }, [acceptWebRTCCall, makeWebRTCCall, endWebRTCCall, leaveWebRTCCall]);

  const getAllParticipantIds = useCallback(() => {
    const keys = new Set();
    if (incomingCallerIdRef.current) {
      keys.add(String(incomingCallerIdRef.current).toLowerCase().trim());
    }
    (activeCallMeta.participants || []).forEach((p) => {
      if (!p) return;
      const emp = p.employee || p;
      if (emp.userId) keys.add(String(emp.userId).toLowerCase().trim());
      if (emp.id) keys.add(String(emp.id).toLowerCase().trim());
      if (emp.userName) keys.add(String(emp.userName).toLowerCase().trim());
      if (emp.employeeCode) keys.add(String(emp.employeeCode).toLowerCase().trim());
      if (emp.empCode) keys.add(String(emp.empCode).toLowerCase().trim());
      if (emp.name) keys.add(String(emp.name).toLowerCase().trim());
      if (emp.employeeName) keys.add(String(emp.employeeName).toLowerCase().trim());
      if (p.userId) keys.add(String(p.userId).toLowerCase().trim());
      if (p.id) keys.add(String(p.id).toLowerCase().trim());
      if (p.userName) keys.add(String(p.userName).toLowerCase().trim());
    });
    if (activeCallMeta.targetUser) {
      const tu = activeCallMeta.targetUser;
      if (tu.userId) keys.add(String(tu.userId).toLowerCase().trim());
      if (tu.id) keys.add(String(tu.id).toLowerCase().trim());
      if (tu.userName) keys.add(String(tu.userName).toLowerCase().trim());
      if (tu.employeeCode) keys.add(String(tu.employeeCode).toLowerCase().trim());
      if (tu.employeeName) keys.add(String(tu.employeeName).toLowerCase().trim());
      if (tu.empCode) keys.add(String(tu.empCode).toLowerCase().trim());
      if (tu.name) keys.add(String(tu.name).toLowerCase().trim());
    }
    return Array.from(keys);
  }, [activeCallMeta.participants, activeCallMeta.targetUser]);

  // Sync initial media state to all peers whenever call is active or media toggled
  useEffect(() => {
    if (callState === 'IN_CALL') {
      const allUserIds = getAllParticipantIds();
      broadcastMediaState(allUserIds);
    }
  }, [callState, isAudioEnabled, isVideoEnabled, getAllParticipantIds, broadcastMediaState]);

  // Listen to host moderation notifications
  useEffect(() => {
    const handleHostAction = (e) => {
      const { message } = e.detail || {};
      if (message) {
        dispatch(
          openSnackbar({
            open: true,
            message: message,
            variant: 'alert',
            alert: { color: 'warning' },
            close: false
          })
        );
      }
    };
    window.addEventListener('bos-host-action', handleHostAction);
    return () => window.removeEventListener('bos-host-action', handleHostAction);
  }, [dispatch]);

  const handleToggleScreenShare = () => {
    toggleScreenShare(getAllParticipantIds(), user?.employeeName || user?.name || 'Presenter');
  };

  const handleToggleAudio = () => {
    toggleAudio(getAllParticipantIds(), user?.employeeName || user?.name || '');
  };

  const handleToggleVideo = () => {
    toggleVideo(getAllParticipantIds(), user?.employeeName || user?.name || '');
  };

  // Clear stale session on initial load so incoming calls are never trapped
  useEffect(() => {
    sessionStorage.removeItem(UNIVERSAL_CALL_SESSION_KEY);
    updateCallState(null);
    setIsCallDialogOpen(false);
  }, []);

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

  const deduplicateParticipants = (list = []) => {
    const seen = new Set();
    const result = [];
    (list || []).forEach((p) => {
      const keys = getIdentityKeys(p);
      const already = keys.some((k) => seen.has(k));
      if (!already) {
        keys.forEach((k) => seen.add(k));
        result.push(p);
      }
    });
    return result;
  };

  // -------------------------------------------------------------
  // Listen to Global Call Events (startCall, endCall, openDialog, invite, sync)
  // -------------------------------------------------------------
  useEffect(() => {
    const handleStartCallEvent = (e) => {
      const detail = e.detail || {};
      const {
        targetUser,
        callType = 'AUDIT',
        title,
        subtitle,
        schedule,
        participants,
        onSyncAttendance
      } = detail;

      onSyncAttendanceCallbackRef.current = onSyncAttendance || null;

      const dedupedList = deduplicateParticipants(participants || []);

      const meta = {
        callType,
        title: title || (callType === 'GROUP_MEETING' ? `Live Meeting • ${schedule?.scheduleNo || 'QMS'}` : `Audit Video Verification`),
        subtitle: subtitle || 'End-to-end encrypted',
        targetUser: targetUser || null,
        schedule: schedule || null,
        participants: dedupedList,
        hostUserId: currentUserId
      };

      setActiveCallMeta(meta);
      setIsCallDialogOpen(true);

      if (callType === 'GROUP_MEETING') {
        updateCallState('IN_CALL');
        const myKeys = new Set([
          String(user?.userId || '').toLowerCase().trim(),
          String(user?.id || '').toLowerCase().trim(),
          String(user?.userName || '').toLowerCase().trim(),
          String(user?.empCode || '').toLowerCase().trim(),
          String(user?.employeeCode || '').toLowerCase().trim(),
          String(user?.employeeName || '').toLowerCase().trim(),
          String(currentUserId || '').toLowerCase().trim()
        ]);

        startLocalMedia(true).then(() => {
          if (dedupedList && dedupedList.length > 0) {
            dedupedList.forEach((p) => {
              const pKeys = getIdentityKeys(p);
              const isSelf = pKeys.some((k) => myKeys.has(k));
              const pEmp = p.employee || p;
              if (!isSelf && (pEmp.empCode || pEmp.id || pEmp.userId || p.empCode)) {
                console.log('[GlobalCallManager] Dialing attendee for conference call:', pEmp.employeeName || pEmp.id, pEmp);
                makeWebRTCCall(pEmp, true, false, {
                  callType: 'GROUP_MEETING',
                  schedule: schedule,
                  participants: dedupedList,
                  title: meta.title
                });
              }
            });
          }
        }).catch((err) => {
          console.warn('[GlobalCallManager] Group call local media acquire error:', err);
        });
      } else if (targetUser) {
        updateCallState('RINGING');
        const isVideoCall = detail.video !== false;
        console.log('[GlobalCallManager] Initiating direct 1-to-1 call (video:', isVideoCall, ') to:', targetUser);
        makeWebRTCCall(targetUser, isVideoCall, false, {
          callType: callType || 'DIRECT',
          title: meta.title
        });
      }
    };

    const handleEndCallEvent = () => {
      handleEnd();
    };

    const handleOpenDialogEvent = () => {
      setIsCallDialogOpen(true);
    };

    const handleCloseDialogEvent = () => {
      setIsCallDialogOpen(false);
    };

    const handleInviteParticipantEvent = (e) => {
      const { targetUser } = e.detail || {};
      if (targetUser) {
        console.log('[GlobalCallManager] Sending call invite signal to active user:', targetUser);
        const targetKey = String(targetUser.userId || targetUser.id || targetUser.empCode || targetUser.employeeCode || targetUser.userName || '').toLowerCase().trim();

        // 30-Second Auto Invite Cancellation Timer
        if (inviteTimersRef.current.has(targetKey)) {
          clearTimeout(inviteTimersRef.current.get(targetKey));
        }

        const timer = setTimeout(() => {
          console.warn('[GlobalCallManager] 30s invite timeout reached for:', targetKey);
          inviteTimersRef.current.delete(targetKey);
          window.dispatchEvent(
            new CustomEvent('bos-invite-cancelled', {
              detail: { targetUser, reason: 'TIMEOUT' }
            })
          );
        }, 30000);
        inviteTimersRef.current.set(targetKey, timer);

        const markedTarget = { ...targetUser, callStatus: 'CALLING', invitedBy: currentUserId };

        setActiveCallMeta((prev) => {
          const currentList = [...(prev.participants || [])];
          currentList.push(markedTarget);

          if (prev.targetUser) {
            currentList.unshift(prev.targetUser);
          }

          if (user) {
            const selfObj = {
              userId: currentUserId,
              employeeName: user.employeeName || user.name || 'Host',
              imgName: user.imgName,
              designationName: user.designationName || 'Host',
              callStatus: 'JOINED'
            };
            currentList.unshift(selfObj);
          }

          const cleanList = deduplicateParticipants(currentList);

          // Call newly invited user with user's current video state preserved
          makeWebRTCCall(targetUser, isVideoEnabled, false, {
            callType: 'GROUP_MEETING',
            participants: cleanList.filter((p) => p.callStatus !== 'CALLING'),
            title: prev.title || 'Live Group Video Call'
          });

          // Broadcast sync ONLY of joined participants to existing peers (inviter-scoped ringing)
          const joinedList = cleanList.filter((p) => p.callStatus !== 'CALLING');
          const joinedUserIds = joinedList.map((p) => String(p.userId || p.id || p.empCode));
          broadcastParticipantSync(joinedUserIds, joinedList);

          return {
            ...prev,
            callType: 'GROUP_MEETING',
            participants: cleanList
          };
        });
      }
    };

    const handleParticipantsSyncEvent = (e) => {
      const { participants = [] } = e.detail || {};
      console.log('[GlobalCallManager] Synchronizing group participants across users:', participants);
      const cleanList = deduplicateParticipants(participants);
      setActiveCallMeta((prev) => ({
        ...prev,
        callType: 'GROUP_MEETING',
        participants: cleanList
      }));
      if (cleanList.length > 1) {
        setTimeout(() => {
          syncMeshConnections(cleanList, { callType: 'GROUP_MEETING' });
        }, 500);
      }
    };

    const handleParticipantLeftEvent = (e) => {
      const { leavingUserId, leavingUserName } = e.detail || {};
      console.log('[GlobalCallManager] Member left the group call:', leavingUserId, leavingUserName);
      if (leavingUserId) {
        const lId = String(leavingUserId).toLowerCase().trim();
        setActiveCallMeta((prev) => {
          const matchesLeaving = (u) => {
            if (!u) return false;
            const uId = String(u.userId || u.id || u.userName || '').toLowerCase().trim();
            const uEmp = String(u.employeeCode || u.empCode || '').toLowerCase().trim();
            return uId === lId || uEmp === lId;
          };

          const filteredParticipants = (prev.participants || []).filter((p) => !matchesLeaving(p.employee || p));
          const isTargetLeaving = matchesLeaving(prev.targetUser);
          const updatedTargetUser = isTargetLeaving ? (filteredParticipants[0] || null) : prev.targetUser;

          return {
            ...prev,
            targetUser: updatedTargetUser,
            participants: filteredParticipants
          };
        });

        dispatch(
          openSnackbar({
            open: true,
            message: `${leavingUserName || 'A participant'} left the meeting`,
            variant: 'alert',
            alert: { color: 'info' },
            close: false
          })
        );
      }
    };

    const handleCallDeclinedEvent = (e) => {
      const { sender } = e.detail || {};
      console.log('[GlobalCallManager] Peer declined call:', sender);
      dispatch(
        openSnackbar({
          open: true,
          message: `${activeCallMeta.targetUser?.employeeName || sender || 'Participant'} declined the call.`,
          variant: 'alert',
          alert: { color: 'warning' },
          close: false
        })
      );
      if (activeCallMeta.callType !== 'GROUP_MEETING' || (activeCallMeta.participants || []).length <= 2) {
        handleEnd();
      } else {
        setActiveCallMeta((prev) => {
          const filtered = (prev.participants || []).filter((p) => {
            const pId = String(p.userId || p.id || p.userName || p.employee?.id || p.employee?.empCode || '').toLowerCase().trim();
            return pId !== String(sender).toLowerCase().trim();
          });
          return { ...prev, participants: filtered };
        });
      }
    };

    const handleInviteCancelledEvent = (e) => {
      const { targetUser, reason } = e.detail || {};
      if (targetUser) {
        const uKeys = getIdentityKeys(targetUser);
        const name = targetUser.employeeName || targetUser.name || 'Invited participant';
        console.log('[GlobalCallManager] Invite cancelled for user (timeout):', name, reason);

        setActiveCallMeta((prev) => {
          const filtered = (prev.participants || []).filter((p) => {
            const pKeys = getIdentityKeys(p);
            return !pKeys.some((k) => uKeys.includes(k));
          });
          return { ...prev, participants: filtered };
        });

        dispatch(
          openSnackbar({
            open: true,
            message: `${name} did not join (invite timed out after 30s)`,
            variant: 'alert',
            severity: 'info'
          })
        );
      }
    };

    const handleParticipantJoinedEvent = (e) => {
      const { sender } = e.detail || {};
      if (sender) {
        const senderKey = String(sender).toLowerCase().trim();
        if (inviteTimersRef.current.has(senderKey)) {
          clearTimeout(inviteTimersRef.current.get(senderKey));
          inviteTimersRef.current.delete(senderKey);
        }

        setActiveCallMeta((prev) => {
          let foundName = '';
          const updatedList = (prev.participants || []).map((p) => {
            const pKeys = getIdentityKeys(p);
            if (pKeys.includes(senderKey)) {
              foundName = p.employeeName || p.name || sender;
              return { ...p, callStatus: 'JOINED' };
            }
            return p;
          });
          const cleanList = deduplicateParticipants(updatedList);

          // Broadcast updated joined participant list to all members
          const allUserIds = cleanList.map((p) => String(p.userId || p.id || p.empCode));
          broadcastParticipantSync(allUserIds, cleanList);

          if (foundName) {
            dispatch(
              openSnackbar({
                open: true,
                message: `${foundName} joined the meeting`,
                variant: 'alert',
                alert: { color: 'success' },
                close: false
              })
            );
          }

          if (cleanList.length > 1) {
            setTimeout(() => {
              syncMeshConnections(cleanList, { callType: 'GROUP_MEETING' });
            }, 500);
          }

          return {
            ...prev,
            participants: cleanList
          };
        });
      }
    };

    window.addEventListener(BOS_CALL_EVENTS.START_CALL, handleStartCallEvent);
    window.addEventListener(BOS_CALL_EVENTS.END_CALL, handleEndCallEvent);
    window.addEventListener(BOS_CALL_EVENTS.OPEN_DIALOG, handleOpenDialogEvent);
    window.addEventListener(BOS_CALL_EVENTS.CLOSE_DIALOG, handleCloseDialogEvent);
    window.addEventListener('bos-invite-participant', handleInviteParticipantEvent);
    window.addEventListener('bos-participants-sync', handleParticipantsSyncEvent);
    window.addEventListener('bos-participant-left', handleParticipantLeftEvent);
    window.addEventListener('bos-call-declined', handleCallDeclinedEvent);
    window.addEventListener('bos-invite-cancelled', handleInviteCancelledEvent);
    window.addEventListener('bos-participant-joined', handleParticipantJoinedEvent);

    return () => {
      window.removeEventListener(BOS_CALL_EVENTS.START_CALL, handleStartCallEvent);
      window.removeEventListener(BOS_CALL_EVENTS.END_CALL, handleEndCallEvent);
      window.removeEventListener(BOS_CALL_EVENTS.OPEN_DIALOG, handleOpenDialogEvent);
      window.removeEventListener(BOS_CALL_EVENTS.CLOSE_DIALOG, handleCloseDialogEvent);
      window.removeEventListener('bos-invite-participant', handleInviteParticipantEvent);
      window.removeEventListener('bos-participants-sync', handleParticipantsSyncEvent);
      window.removeEventListener('bos-participant-left', handleParticipantLeftEvent);
      window.removeEventListener('bos-call-declined', handleCallDeclinedEvent);
      window.removeEventListener('bos-invite-cancelled', handleInviteCancelledEvent);
      window.removeEventListener('bos-participant-joined', handleParticipantJoinedEvent);
    };
  }, [makeWebRTCCall, broadcastParticipantSync, syncMeshConnections, dispatch, user, currentUserId, activeCallMeta]);

  const handleAccept = async () => {
    callSounds.stopAll();
    callSounds.playCallConnected();
    updateCallState('IN_CALL');
    setIsCallDialogOpen(true);

    if (incomingCallerIdRef.current && incomingOfferRef.current) {
      const caller = incomingCallerIdRef.current;
      const offer = incomingOfferRef.current;
      const video = incomingVideoRef.current;
      try {
        await acceptWebRTCCall(caller, offer, video, {
          participants: activeCallMeta.participants || [],
          callType: activeCallMeta.callType || 'GROUP_MEETING',
          sender: caller
        });
        if (activeCallMeta.participants && activeCallMeta.participants.length > 1) {
          setTimeout(() => {
            syncMeshConnections(activeCallMeta.participants, { callType: 'GROUP_MEETING' });
          }, 600);
        }
      } catch (err) {
        console.error('[GlobalCallManager] Error accepting WebRTC call:', err);
      }
    }
  };

  const handleDecline = () => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    callSounds.stopAll();
    callSounds.playCallEnded();
    if (incomingCallerIdRef.current) {
      const caller = String(incomingCallerIdRef.current).toLowerCase().trim();
      declinedCallersRef.current.set(caller, Date.now());
      rejectWebRTCCall(incomingCallerIdRef.current);
    }
    handleCallEnded('DECLINED');
  };

  const handleEnd = () => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    callSounds.stopAll();
    callSounds.playCallEnded();
    sessionStorage.removeItem(UNIVERSAL_CALL_SESSION_KEY);
    
    // Check total participants and joined participants
    const allParticipants = activeCallMeta.participants || [];
    const otherList = allParticipants.filter((p) => {
      const pKeys = getIdentityKeys(p);
      return !pKeys.some((k) => k === String(currentUserId).toLowerCase().trim());
    });
    if (activeCallMeta.targetUser) {
      const targetId = String(activeCallMeta.targetUser.userId || activeCallMeta.targetUser.id).toLowerCase().trim();
      const hasTarget = otherList.some((p) => String(p.userId || p.id).toLowerCase().trim() === targetId);
      if (!hasTarget && targetId !== String(currentUserId).toLowerCase().trim()) {
        otherList.push(activeCallMeta.targetUser);
      }
    }

    const isGroupMeeting = activeCallMeta.callType === 'GROUP_MEETING' || Boolean(activeCallMeta.schedule) || (allParticipants && allParticipants.length > 2) || (otherList.length > 1);

    if (isGroupMeeting) {
      // In any group meeting, leaving participant ONLY disconnects themselves
      console.log('[GlobalCallManager] Participant leaving group meeting. Disconnecting self only.');
      leaveWebRTCCall(true, otherList, user?.employeeName || user?.name || '');
    } else {
      // Direct 1-to-1 call ending for both participants
      console.log('[GlobalCallManager] Direct 1-to-1 call ending.');
      endWebRTCCall(otherList[0] || activeCallMeta.targetUser, otherList);
    }
    handleCallEnded();
  };

  // 30-second Auto Call End Timer if call is not answered/attended
  useEffect(() => {
    if (callState === 'RINGING') {
      console.log('[GlobalCallManager] Outgoing call ringing. Starting 30-second auto-end timer.');
      ringTimeoutRef.current = setTimeout(() => {
        console.warn('[GlobalCallManager] 30 seconds passed with no answer. Auto-ending call.');
        handleEnd();
        dispatch(
          openSnackbar({
            open: true,
            message: `${activeCallMeta.targetUser?.employeeName || 'The participant'} did not answer. Call ended automatically after 30 seconds.`,
            severity: 'warning',
            variant: 'alert'
          })
        );
      }, 30000); // 30 seconds timeout
    } else if (callState === 'INCOMING') {
      console.log('[GlobalCallManager] Incoming call ringing. Starting 30-second auto-decline timer.');
      ringTimeoutRef.current = setTimeout(() => {
        console.warn('[GlobalCallManager] 30 seconds passed for incoming call. Auto-declining.');
        handleDecline();
      }, 30000);
    } else {
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }
    }

    return () => {
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }
    };
  }, [callState, activeCallMeta.targetUser, dispatch]);

  const handleReopenOrReconnect = () => {
    setIsCallDialogOpen(true);
    updateCallState('IN_CALL');

    // If streams were reset by page reload and targetUser is present, silently re-link
    if (!localStream && activeCallMeta.targetUser && activeCallMeta.callType !== 'GROUP_MEETING') {
      console.log('[GlobalCallManager] Silently re-joining active call stream with:', activeCallMeta.targetUser);
      makeWebRTCCall(activeCallMeta.targetUser, true, true); // isRejoin = true
    }
  };

  if (!callState) return null;

  // -------------------------------------------------------------
  // ACTIVE CALL (IN_CALL or RINGING)
  // -------------------------------------------------------------
  if (callState === 'IN_CALL' || callState === 'RINGING') {
    const isGroupMeeting = activeCallMeta.callType === 'GROUP_MEETING' || Boolean(activeCallMeta.schedule);

    return (
      <>
        <BOSUniversalCallDialog
          open={isCallDialogOpen}
          onClose={() => setIsCallDialogOpen(false)}
          callType={activeCallMeta.callType}
          title={activeCallMeta.title}
          subtitle={activeCallMeta.subtitle}
          callingState={callState}
          targetUser={activeCallMeta.targetUser}
          schedule={activeCallMeta.schedule}
          participants={activeCallMeta.participants}
          currentUser={user}
          localStream={localStream}
          remoteStream={remoteStream}
          remoteStreams={remoteStreams}
          screenStream={screenStream}
          isScreenSharing={isScreenSharing}
          screenPresenter={screenPresenter}
          remoteIsAudioEnabled={remoteIsAudioEnabled}
          remoteIsVideoEnabled={remoteIsVideoEnabled}
          onToggleScreenShare={handleToggleScreenShare}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onHostMuteUser={hostMuteUser}
          onEndCall={handleEnd}
          onSyncAttendance={(ids) => {
            if (onSyncAttendanceCallbackRef.current) {
              onSyncAttendanceCallbackRef.current(ids);
            }
          }}
        />

        {/* Global Bottom-Right Floating Active Call Return Widget */}
        {!isCallDialogOpen && (
          <Fade in={true}>
            <Paper
              elevation={16}
              onClick={handleReopenOrReconnect}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 99999,
                cursor: 'pointer',
                borderRadius: '24px',
                p: 1.25,
                pl: 1.5,
                pr: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(10, 15, 29, 0.98) 100%)',
                backdropFilter: 'blur(16px)',
                border: '2px solid #10b981',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.4)',
                animation: 'pulseBorderGlobal 2s infinite',
                '@keyframes pulseBorderGlobal': {
                  '0%': { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 10px rgba(16, 185, 129, 0.3)' },
                  '50%': { boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 24px rgba(16, 185, 129, 0.6)' },
                  '100%': { boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 10px rgba(16, 185, 129, 0.3)' }
                },
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-3px) scale(1.02)',
                  borderColor: '#34d399',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85), 0 0 30px rgba(16, 185, 129, 0.7)'
                }
              }}
            >
              {/* Animated Call Icon */}
              <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: isGroupMeeting ? '#00a884' : '#10b981',
                    color: '#fff',
                    width: 42,
                    height: 42,
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.5)'
                  }}
                >
                  {isGroupMeeting ? (
                    <VideocamTwoToneIcon sx={{ fontSize: '1.4rem', animation: 'wiggle 1.5s ease-in-out infinite', '@keyframes wiggle': { '0%, 100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-8deg)' }, '75%': { transform: 'rotate(8deg)' } } }} />
                  ) : (
                    <PhoneInTalkTwoToneIcon sx={{ fontSize: '1.4rem', animation: 'wiggle 1.5s ease-in-out infinite', '@keyframes wiggle': { '0%, 100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-12deg)' }, '75%': { transform: 'rotate(12deg)' } } }} />
                  )}
                </Avatar>
              </Box>

              {/* Call info & status */}
              <Box sx={{ minWidth: 130 }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <FiberManualRecordIcon sx={{ fontSize: 10, color: '#10b981', animation: 'pulseDot 1.5s infinite', '@keyframes pulseDot': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
                  <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.875rem', lineHeight: 1.2 }}>
                    {isGroupMeeting ? (activeCallMeta.schedule?.scheduleNo || 'Live Group Meeting') : (activeCallMeta.targetUser?.employeeName || 'Live Video Call')}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600, fontSize: '0.725rem', display: 'block', mt: 0.25 }}>
                  {isGroupMeeting ? 'Meeting Active • Click to return' : 'Active Call • Click to return'}
                </Typography>
              </Box>

              {/* End call quick action */}
              <Tooltip title="End / Leave Call">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEnd();
                  }}
                  sx={{
                    bgcolor: 'rgba(244, 63, 94, 0.2)',
                    color: '#f43f5e',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    width: 32,
                    height: 32,
                    '&:hover': { bgcolor: '#f43f5e', color: '#fff' }
                  }}
                >
                  <CallEndIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Paper>
          </Fade>
        )}
      </>
    );
  }

  // -------------------------------------------------------------
  // INCOMING CALL PROMPT OVERLAY
  // -------------------------------------------------------------
  return (
    <Dialog
      open={callState === 'INCOMING'}
      sx={{
        zIndex: 99999,
        '& .MuiDialog-paper': {
          borderRadius: '28px',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.96) 0%, rgba(10, 15, 29, 0.98) 100%)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(16, 185, 129, 0.25), 0 0 60px rgba(16, 185, 129, 0.12)',
          overflow: 'hidden',
          maxWidth: 460,
          width: '92%',
          mx: 'auto'
        }
      }}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') return;
        handleDecline();
      }}
      maxWidth="xs"
      fullWidth
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(16px)'
        }
      }}
    >
      {/* Ambient Top Glow Bar */}
      <Box
        sx={{
          position: 'relative',
          px: 3,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.4) 100%)'
        }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: '#10b981',
              boxShadow: '0 0 12px #10b981',
              animation: 'pulseDot 1.4s infinite'
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: '#34d399',
              fontWeight: 800,
              letterSpacing: '1px',
              fontSize: '0.75rem',
              textTransform: 'uppercase'
            }}
          >
            Incoming Video Call
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={0.6}
          alignItems="center"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.06)',
            px: 1.2,
            py: 0.4,
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: '0.8rem', color: '#94a3b8' }} />
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>
            E2E Encrypted
          </Typography>
        </Stack>
      </Box>

      {/* Main Content Area */}
      <DialogContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
        <Stack direction="column" alignItems="center" spacing={2.5}>
          {/* Animated Concentric Waves & Avatar */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 150,
              height: 150,
              my: 1
            }}
          >
            {/* Outer Wave 1 */}
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                animation: 'incomingRipple 2.2s cubic-bezier(0.1, 0.8, 0.3, 1) infinite',
                '@keyframes incomingRipple': {
                  '0%': { transform: 'scale(0.85)', opacity: 1 },
                  '100%': { transform: 'scale(1.45)', opacity: 0 }
                }
              }}
            />
            {/* Outer Wave 2 */}
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: '1.5px solid rgba(16, 185, 129, 0.6)',
                animation: 'incomingRipple2 2.2s cubic-bezier(0.1, 0.8, 0.3, 1) 0.7s infinite',
                '@keyframes incomingRipple2': {
                  '0%': { transform: 'scale(0.85)', opacity: 1 },
                  '100%': { transform: 'scale(1.3)', opacity: 0 }
                }
              }}
            />
            {/* Glowing Ring */}
            <Box
              sx={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                p: '3px',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.45)'
              }}
            >
              <Avatar
                src={activeCallMeta.targetUser?.imgName ? getUserImageUrl(activeCallMeta.targetUser.imgName) : ''}
                alt={activeCallMeta.targetUser?.employeeName || 'Caller'}
                sx={{
                  width: '100%',
                  height: '100%',
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  bgcolor: '#0f172a',
                  color: '#fff',
                  border: '2px solid #0f172a'
                }}
              >
                {activeCallMeta.targetUser?.employeeName?.charAt(0) || 'A'}
              </Avatar>
            </Box>
          </Box>

          {/* Soundwave Bouncing Bars */}
          <Stack direction="row" spacing={0.6} alignItems="center" sx={{ height: 16 }}>
            {[0.4, 0.8, 1, 0.6, 0.3].map((scale, i) => (
              <Box
                key={i}
                sx={{
                  width: 3.5,
                  height: 16,
                  borderRadius: 2,
                  bgcolor: '#10b981',
                  animation: `bounceWave 0.8s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.15}s`,
                  '@keyframes bounceWave': {
                    '0%': { transform: 'scaleY(0.25)', opacity: 0.4 },
                    '100%': { transform: 'scaleY(1)', opacity: 1 }
                  }
                }}
              />
            ))}
          </Stack>

          {/* Caller Details */}
          <Box sx={{ width: '100%' }}>
            <Typography
              variant="h3"
              sx={{
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.6rem',
                letterSpacing: '-0.4px',
                mb: 0.5
              }}
            >
              {activeCallMeta.targetUser?.employeeName || 'Caller'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#94a3b8',
                fontWeight: 500,
                fontSize: '0.9rem',
                mb: 1.5
              }}
            >
              {activeCallMeta.targetUser?.departmentName
                ? `${activeCallMeta.targetUser.departmentName} • ${activeCallMeta.targetUser.designationName || 'Staff'}`
                : activeCallMeta.targetUser?.designationName || 'Quality Management'}
            </Typography>

            <Chip
              icon={<VideocamTwoToneIcon sx={{ fontSize: '1rem !important', color: '#34d399 !important' }} />}
              label="Live Video Attendance & Verification Request"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                fontWeight: 600,
                fontSize: '0.8rem',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                py: 0.4,
                px: 0.8,
                borderRadius: '16px'
              }}
            />
          </Box>

          {/* Action Buttons: Decline & Accept */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ pt: 1.5, width: '100%', justifyContent: 'center' }}
          >
            {/* Decline Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleDecline}
              startIcon={<CallEndIcon sx={{ fontSize: '1.3rem' }} />}
              sx={{
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                color: '#ffffff',
                py: 1.4,
                borderRadius: '16px',
                fontSize: '0.95rem',
                fontWeight: 700,
                textTransform: 'none',
                letterSpacing: '0.2px',
                boxShadow: '0 8px 24px rgba(244, 63, 94, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
                  boxShadow: '0 12px 28px rgba(244, 63, 94, 0.5)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Decline
            </Button>

            {/* Accept Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleAccept}
              startIcon={<VideocamTwoToneIcon sx={{ fontSize: '1.35rem' }} />}
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                py: 1.4,
                borderRadius: '16px',
                fontSize: '0.95rem',
                fontWeight: 700,
                textTransform: 'none',
                letterSpacing: '0.2px',
                boxShadow: '0 8px 28px rgba(16, 185, 129, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                  boxShadow: '0 12px 34px rgba(16, 185, 129, 0.65)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Accept Video
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
