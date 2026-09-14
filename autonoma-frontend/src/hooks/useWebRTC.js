import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export const OPTIMAL_VIDEO_CONSTRAINTS = {
  width: { ideal: 640, max: 1280 },
  height: { ideal: 480, max: 720 },
  frameRate: { ideal: 24, max: 30 }
};

export const applyOptimalSenderParameters = (sender, isScreenShare = false) => {
  if (!sender || !sender.track || sender.track.kind !== 'video') return;
  try {
    const params = sender.getParameters();
    if (!params.encodings || params.encodings.length === 0) {
      params.encodings = [{}];
    }
    if (isScreenShare) {
      params.encodings[0].maxBitrate = 1200000; // 1.2 Mbps for clear presentation
      params.encodings[0].maxFramerate = 24;
    } else {
      params.encodings[0].maxBitrate = 400000; // 400 kbps for smooth mesh video without CPU lag
      params.encodings[0].maxFramerate = 24;
    }
    sender.setParameters(params).catch(() => {});
  } catch (e) {
    // Gracefully handle in transitional signaling states
  }
};

export const useWebRTC = (currentUserId, onIncomingCall, onCallEnded, onCallConnected, userObj = null) => {
  const [stompClient, setStompClient] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const peerConnection = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const candidateQueuesRef = useRef(new Map());
  const stompClientRef = useRef(null);
  const connectingPromiseRef = useRef(null);
  const subscribedTopicsRef = useRef(new Set());
  const [remoteUserId, setRemoteUserId] = useState(null);
  const remoteUserIdRef = useRef(null);
  const recentMsgCacheRef = useRef(new Map()); // fingerprint -> timestamp
  const candidateQueueRef = useRef([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const isVideoEnabledRef = useRef(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const isAudioEnabledRef = useRef(true);
  const [remoteIsAudioEnabled, setRemoteIsAudioEnabled] = useState(true);
  const [remoteIsVideoEnabled, setRemoteIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const isScreenSharingRef = useRef(false);
  const [screenStream, setScreenStream] = useState(null);
  const screenStreamRef = useRef(null);
  const [screenPresenter, setScreenPresenter] = useState(null);
  const ringPulseIntervalRef = useRef(null);

  useEffect(() => {
    isVideoEnabledRef.current = isVideoEnabled;
  }, [isVideoEnabled]);

  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  const onIncomingCallRef = useRef(onIncomingCall);
  const onCallEndedRef = useRef(onCallEnded);
  const onCallConnectedRef = useRef(onCallConnected);

  useEffect(() => {
    onIncomingCallRef.current = onIncomingCall;
  }, [onIncomingCall]);

  useEffect(() => {
    onCallEndedRef.current = onCallEnded;
  }, [onCallEnded]);

  useEffect(() => {
    onCallConnectedRef.current = onCallConnected;
  }, [onCallConnected]);

  const getUserIdentityKeys = useCallback(() => {
    const keys = new Set();
    const addKey = (k) => {
      if (k !== null && k !== undefined) {
        const s = String(k).trim().toLowerCase();
        if (s && s !== 'null' && s !== 'undefined' && s !== 'broadcast' && s !== '[object object]') {
          keys.add(s);
        }
      }
    };
    addKey(currentUserId);
    if (userObj) {
      addKey(userObj.userId);
      addKey(userObj.userName);
      addKey(userObj.id);
      addKey(userObj.empId);
      addKey(userObj.empCode);
      addKey(userObj.employeeCode);
      addKey(userObj.oldEmpCode);
      addKey(userObj.oldCode);
      addKey(userObj.employeeName);
      addKey(userObj.name);
      if (userObj.employee) {
        addKey(userObj.employee.id);
        addKey(userObj.employee.empId);
        addKey(userObj.employee.userId);
        addKey(userObj.employee.userName);
        addKey(userObj.employee.empCode);
        addKey(userObj.employee.employeeCode);
        addKey(userObj.employee.employeeName);
        addKey(userObj.employee.name);
      }
    }
    addKey(sessionStorage.getItem('userName'));
    addKey(sessionStorage.getItem('userId'));
    addKey(sessionStorage.getItem('empCode'));
    addKey(sessionStorage.getItem('empId'));
    addKey(sessionStorage.getItem('employeeId'));
    addKey(sessionStorage.getItem('employeeName'));
    addKey(sessionStorage.getItem('name'));
    addKey(localStorage.getItem('userName'));
    addKey(localStorage.getItem('userId'));
    addKey(localStorage.getItem('empCode'));
    return keys;
  }, [currentUserId, userObj]);

  // Safe publish helper
  const publishSignaling = useCallback((destination, body) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      try {
        stompClientRef.current.publish({
          destination,
          body: typeof body === 'string' ? body : JSON.stringify(body)
        });
      } catch (err) {
        console.warn('[WebRTC] publish failed:', err);
      }
    } else {
      console.warn('[WebRTC] STOMP not connected, skipping publish:', destination, body);
    }
  }, []);

  // Helper to subscribe to all user aliases dynamically
  const subscribeAllAliases = useCallback((client) => {
    if (!client || !client.connected) return;

    const subscribeTopic = (id) => {
      if (id === null || id === undefined) return;
      const strId = String(id).trim();
      if (!strId || strId === 'null' || strId === 'undefined') return;
      const clean = strId.toLowerCase();
      if (subscribedTopicsRef.current.has(clean)) return;
      subscribedTopicsRef.current.add(clean);

      console.log('[WebRTC] Subscribing to signaling topic:', `/topic/signaling.${clean}`);
      try {
        client.subscribe(`/topic/signaling.${clean}`, (message) => {
          try {
            const data = JSON.parse(message.body);
            handleSignalingMessage(data);
          } catch (e) {
            console.error('[WebRTC] JSON parse error:', e);
          }
        });
      } catch (err) {
        console.warn('[WebRTC] Subscribe error for topic:', clean, err);
      }
    };

    const myKeys = getUserIdentityKeys();
    myKeys.forEach(subscribeTopic);
    subscribeTopic('broadcast');
  }, [getUserIdentityKeys]);

  // ── Lazy STOMP connect with singleton in-flight promise ─────────────────────────
  const connectSignaling = useCallback(() => {
    if (stompClientRef.current?.connected) {
      subscribeAllAliases(stompClientRef.current);
      return Promise.resolve(stompClientRef.current);
    }
    if (connectingPromiseRef.current) {
      return connectingPromiseRef.current;
    }

    connectingPromiseRef.current = new Promise((resolve, reject) => {
      const token = sessionStorage.getItem('serviceToken') || localStorage.getItem('serviceToken');
      if (!token) {
        connectingPromiseRef.current = null;
        reject(new Error('No serviceToken found'));
        return;
      }

      const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const client = new Client({
        webSocketFactory: () => new SockJS(`${baseUrl}/ws/signaling`),
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
      });

      client.onConnect = () => {
        console.log('[WebRTC] Connected to Signaling Server for user:', currentUserId);
        connectingPromiseRef.current = null;
        stompClientRef.current = client;
        setStompClient(client);

        subscribeAllAliases(client);
        resolve(client);
      };

      client.onStompError = (frame) => {
        console.error('[WebRTC] STOMP error', frame);
        connectingPromiseRef.current = null;
        reject(new Error(frame.headers?.message || 'STOMP error'));
      };

      client.onWebSocketClose = () => {
        connectingPromiseRef.current = null;
      };

      client.activate();
    });

    return connectingPromiseRef.current;
  }, [currentUserId, subscribeAllAliases]);

  // Auto-connect signaling on mount / when currentUserId or userObj updates
  useEffect(() => {
    const token = sessionStorage.getItem('serviceToken') || localStorage.getItem('serviceToken');
    if (token) {
      if (stompClientRef.current?.connected) {
        subscribeAllAliases(stompClientRef.current);
      } else {
        connectSignaling().catch((err) => {
          console.warn('[WebRTC] Auto-connect signaling error:', err?.message);
        });
      }
    }
  }, [currentUserId, userObj, connectSignaling, subscribeAllAliases]);

  // Re-verify STOMP signaling and re-subscribe on tab focus / visibility change
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        const token = sessionStorage.getItem('serviceToken') || localStorage.getItem('serviceToken');
        if (!token) return;
        if (!stompClientRef.current || !stompClientRef.current.connected) {
          console.log('[WebRTC] Tab became active, reconnecting STOMP signaling...');
          connectSignaling().catch((e) => console.warn('[WebRTC] Reconnect signaling failed:', e?.message));
        } else {
          subscribeAllAliases(stompClientRef.current);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [connectSignaling, subscribeAllAliases]);

  // Listen to global incoming signaling events dispatched by useNotifications
  useEffect(() => {
    const handleGlobalSignaling = (e) => {
      const data = e.detail;
      if (data) {
        handleSignalingMessage(data);
      }
    };
    window.addEventListener('bos-incoming-signaling', handleGlobalSignaling);
    return () => {
      window.removeEventListener('bos-incoming-signaling', handleGlobalSignaling);
    };
  }, []);

  // Deactivate on unmount
  useEffect(() => {
    return () => {
      stompClientRef.current?.deactivate();
      stompClientRef.current = null;
      connectingPromiseRef.current = null;
      subscribedTopicsRef.current.clear();
    };
  }, []);

  const extractUserKeys = (userObj, extraData = null) => {
    const keys = new Set();
    const add = (val) => {
      if (val !== undefined && val !== null) {
        const s = String(val).trim();
        if (s && s !== 'null' && s !== 'undefined' && s !== '[object Object]' && s !== '-') {
          keys.add(s);
          keys.add(s.toLowerCase());
        }
      }
    };
    if (typeof userObj === 'string' || typeof userObj === 'number') {
      add(userObj);
    } else if (userObj && typeof userObj === 'object') {
      const emp = userObj.employee || userObj;
      add(emp.id);
      add(emp.empId);
      add(emp.userId);
      add(emp.userName);
      add(emp.empCode);
      add(emp.employeeCode);
      add(emp.oldEmpCode);
      add(emp.employeeName);
      add(emp.name);
      add(userObj.id);
      add(userObj.userId);
      add(userObj.empCode);
      add(userObj.employeeName);
      add(userObj.name);
    }
    if (extraData && typeof extraData === 'object') {
      add(extraData.sender);
      add(extraData.callerName);
      add(extraData.senderName);
      if (extraData.targetUser) add(extraData.targetUser);
    }
    return Array.from(keys);
  };

  const initPeerConnection = (targetId = null, targetAliases = []) => {
    const peerKey = targetId ? String(targetId).toLowerCase().trim() : (remoteUserIdRef.current ? String(remoteUserIdRef.current).toLowerCase().trim() : 'primary');
    const allAliases = new Set([peerKey]);
    if (Array.isArray(targetAliases)) {
      targetAliases.forEach((a) => {
        if (a) {
          allAliases.add(String(a));
          allAliases.add(String(a).toLowerCase().trim());
        }
      });
    }

    allAliases.forEach((k) => {
      if (peerConnectionsRef.current.has(k)) {
        try {
          peerConnectionsRef.current.get(k).close();
        } catch (e) { }
      }
    });

    candidateQueueRef.current = [];
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:openrelay.metered.ca:80' }
      ],
      iceCandidatePoolSize: 10
    });

    pc.onicecandidate = (event) => {
      const target = targetId || remoteUserIdRef.current;
      if (event.candidate && target) {
        publishSignaling('/app/signaling', {
          type: 'ICE_CANDIDATE',
          targetUser: target,
          candidate: event.candidate,
          sender: currentUserId
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind, 'id:', event.track.id, 'from peer:', peerKey);
      let tracks = [];
      const existing = remoteStreamsRef.current.get(peerKey) || remoteStreamsRef.current.get(String(peerKey).toLowerCase().trim());
      if (existing) {
        try {
          if (!existing.getTracks().some((t) => t.id === event.track.id)) {
            existing.addTrack(event.track);
          }
        } catch (e) { }
        tracks = existing.getTracks();
      } else if (event.streams && event.streams[0]) {
        tracks = event.streams[0].getTracks();
      } else {
        tracks = [event.track];
      }

      const freshStream = new MediaStream(tracks);
      allAliases.forEach((k) => {
        remoteStreamsRef.current.set(k, freshStream);
      });
      setRemoteStreams(new Map(remoteStreamsRef.current));
      setRemoteStream(freshStream);

      window.dispatchEvent(
        new CustomEvent('bos-peer-stream-received', {
          detail: { peerId: peerKey, stream: freshStream, track: event.track, aliases: Array.from(allAliases) }
        })
      );
    };

    allAliases.forEach((k) => {
      peerConnectionsRef.current.set(k, pc);
    });
    peerConnection.current = pc;
    return pc;
  };

  // Creates an active animated canvas & audio fallback stream if camera permission is blocked (e.g. LAN HTTP)
  const createFallbackMediaStream = (name = 'Live Video Stream', color = '#10b981') => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      let tick = 0;
      const drawFrame = () => {
        tick += 0.05;
        // Animated gradient background
        const grad = ctx.createLinearGradient(0, 0, 640, 480);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#1e293b');
        grad.addColorStop(1, '#0b1329');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 480);

        // Center pulse circle
        const cx = 320;
        const cy = 220;
        const radius = 55 + Math.sin(tick * 3) * 4;

        // Outer glow
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fill();

        // Main Avatar Circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#34d399';
        ctx.stroke();

        // Letter
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name.charAt(0).toUpperCase() || 'U', cx, cy);

        // Waveform bars
        const barCount = 7;
        const spacing = 14;
        const startX = cx - ((barCount - 1) * spacing) / 2;
        const waveY = cy + radius + 35;
        for (let i = 0; i < barCount; i++) {
          const h = Math.abs(Math.sin(tick * 3 + i * 0.8)) * 24 + 6;
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.rect(startX + i * spacing - 2, waveY - h / 2, 4, h);
          ctx.fill();
        }

        // Live badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(20, 20, 140, 32);
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(36, 36, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('LIVE STREAM', 50, 40);

        // Participant Name
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(20, 430, 200, 32);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.fillText(name, 35, 451);
      };

      drawFrame();
      const animInterval = setInterval(drawFrame, 150);

      const canvasStream = canvas.captureStream ? canvas.captureStream(12) : null;

      let audioTrack = null;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const osc = audioCtx.createOscillator();
          const dst = audioCtx.createMediaStreamDestination();
          osc.connect(dst);
          osc.start();
          const tracks = dst.stream.getAudioTracks();
          if (tracks.length > 0) {
            tracks[0].enabled = false;
            audioTrack = tracks[0];
          }
        }
      } catch (e) {
        // audio context optional
      }

      const combinedTracks = [];
      if (canvasStream && canvasStream.getVideoTracks().length > 0) {
        const vTrack = canvasStream.getVideoTracks()[0];
        const origStop = vTrack.stop.bind(vTrack);
        vTrack.stop = () => {
          clearInterval(animInterval);
          origStop();
        };
        combinedTracks.push(vTrack);
      }
      if (audioTrack) {
        combinedTracks.push(audioTrack);
      }

      return combinedTracks.length > 0 ? new MediaStream(combinedTracks) : null;
    } catch (err) {
      console.warn('[WebRTC] Could not create fallback stream:', err);
      return null;
    }
  };

  const acquireMediaWithTimeout = async (constraints, timeoutMs = 2000) => {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Media acquire timeout')), timeoutMs);
    });
    try {
      const res = await Promise.race([
        navigator.mediaDevices.getUserMedia(constraints),
        timeoutPromise
      ]);
      clearTimeout(timer);
      return res;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  const startLocalMedia = async (video = true) => {
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getTracks();
      if (tracks.length > 0 && tracks.some((t) => t.readyState === 'live')) {
        return localStreamRef.current;
      }
    }

    // 1. Modern API with Fast 2-Second Timeout Race
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await acquireMediaWithTimeout({
          video: video ? OPTIMAL_VIDEO_CONSTRAINTS : false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        }, 2000);
        localStreamRef.current = stream;
        setLocalStream(stream);
        return stream;
      } catch (err) {
        console.warn('[WebRTC] Fast getUserMedia with audio failed/timed out, attempting video-only:', err?.message);
        try {
          const stream = await acquireMediaWithTimeout({
            video: video ? OPTIMAL_VIDEO_CONSTRAINTS : false,
            audio: false
          }, 1500);
          localStreamRef.current = stream;
          setLocalStream(stream);
          return stream;
        } catch (vErr) {
          console.warn('[WebRTC] Fast getUserMedia video-only failed/timed out:', vErr?.message);
        }
      }
    }

    // 2. Legacy API fallback
    const legacyGetUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
    if (legacyGetUserMedia) {
      try {
        const stream = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Legacy media timeout')), 1500);
          legacyGetUserMedia.call(
            navigator,
            { video: Boolean(video), audio: true },
            (s) => {
              clearTimeout(timer);
              resolve(s);
            },
            (e) => {
              clearTimeout(timer);
              reject(e);
            }
          );
        });
        if (stream) {
          localStreamRef.current = stream;
          setLocalStream(stream);
          return stream;
        }
      } catch (e) {
        console.warn('[WebRTC] Legacy camera access failed, trying video only:', e?.message);
      }
    }

    // 3. Dynamic Animated Stream Fallback (Instant Zero-Delay for Low-Spec / Insecure LAN origin)
    console.info('[WebRTC] Using instant animated live fallback stream for ultra-fast call dispatch.');
    const fallback = createFallbackMediaStream('You (Local Stream)', '#6366f1');
    if (fallback) {
      localStreamRef.current = fallback;
      setLocalStream(fallback);
    }

    // Asynchronously try to acquire hardware webcam in background without blocking call initiation
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setTimeout(() => {
        navigator.mediaDevices
          .getUserMedia({
            video: video ? OPTIMAL_VIDEO_CONSTRAINTS : false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          })
          .then((hwStream) => {
            if (hwStream && localStreamRef.current) {
              console.log('[WebRTC] Hardware media stream ready, upgrading tracks dynamically.');
              localStreamRef.current = hwStream;
              setLocalStream(hwStream);
              // Upgrade active peer connection tracks
              peerConnectionsRef.current.forEach((pc) => {
                const senders = pc.getSenders();
                hwStream.getTracks().forEach((newTrack) => {
                  const sender = senders.find((s) => s.track && s.track.kind === newTrack.kind);
                  if (sender) {
                    sender.replaceTrack(newTrack).catch((e) => console.warn('[WebRTC] Error replacing track:', e));
                    applyOptimalSenderParameters(sender, Boolean(screenStreamRef.current));
                  } else {
                    const newSender = pc.addTrack(newTrack, hwStream);
                    applyOptimalSenderParameters(newSender, Boolean(screenStreamRef.current));
                  }
                });
              });
            }
          })
          .catch(() => {
            // Hardware camera optional if unavailable
          });
      }, 500);
    }

    return fallback;
  };

  const flushCandidateQueue = async (pc, peerId = null) => {
    if (!pc) return;
    const peerKey = peerId ? String(peerId).toLowerCase().trim() : '';
    const queue = (peerKey && candidateQueuesRef.current.get(peerKey)) || candidateQueueRef.current;
while (queue && queue.length > 0) {
      const cand = queue.shift();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (e) {
        console.warn('[WebRTC] Failed to add queued ICE candidate:', e);
      }
    }
  };

  const makeCall = async (target, video = true, isRejoin = false, extraMeta = {}) => {
    const targetUserId = typeof target === 'object' && target !== null ? (target.userId || target.id || target.empCode) : target;
    remoteUserIdRef.current = targetUserId;
    setRemoteUserId(targetUserId);

    // Only initialize initial audio/video state when starting a brand new call from scratch!
    // Never reset or force enable audio/video when adding participants or syncing mesh in an active meeting!
    const isAlreadyInCall = peerConnectionsRef.current.size > 0 || Boolean(extraMeta?.isMeshConnection) || Boolean(extraMeta?.callType === 'GROUP_MEETING' && localStreamRef.current);
    if (!isAlreadyInCall) {
      setIsVideoEnabled(Boolean(video));
      isVideoEnabledRef.current = Boolean(video);
      setRemoteIsVideoEnabled(Boolean(video));
      setIsAudioEnabled(true);
      isAudioEnabledRef.current = true;
    }

    try {
      await connectSignaling();
      const stream = await startLocalMedia(Boolean(isVideoEnabledRef.current));

      const targetAliases = extractUserKeys(target);
      const pc = initPeerConnection(targetUserId, targetAliases);
      const activeStream = screenStreamRef.current || stream;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => {
          if (track.kind === 'audio') {
            track.enabled = isAudioEnabledRef.current;
          }
          if (track.kind === 'video') {
            track.enabled = isVideoEnabledRef.current;
          }
          const sender = pc.addTrack(track, activeStream);
          if (track.kind === 'video') {
            applyOptimalSenderParameters(sender, Boolean(screenStreamRef.current));
          }
        });
      }

      // Ensure transceivers exist for both audio & video if not added by tracks
      if (!pc.getTransceivers().some((t) => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio')) {
        pc.addTransceiver('audio', { direction: 'sendrecv' });
      }
      if (!pc.getTransceivers().some((t) => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video')) {
        pc.addTransceiver('video', { direction: 'sendrecv' });
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      const allKeys = new Set(targetAliases);
      if (targetUserId) allKeys.add(String(targetUserId));

      const broadcastOffer = () => {
        console.log('[WebRTC] Broadcasting CALL_OFFER (isRejoin:', isRejoin, ') to targets:', Array.from(allKeys), 'extraMeta:', extraMeta);
        allKeys.forEach((key) => {
          publishSignaling('/app/signaling', {
            type: 'CALL_OFFER',
            targetUser: key,
            sender: currentUserId,
            senderName: userObj?.employeeName || userObj?.name || currentUserId,
            callerName: userObj?.employeeName || userObj?.name || currentUserId,
            offer: offer,
            video: isVideoEnabledRef.current,
            isRejoin: Boolean(isRejoin),
            isMeshConnection: Boolean(extraMeta?.isMeshConnection),
            callType: extraMeta?.callType || (extraMeta?.participants?.length > 1 ? 'GROUP_MEETING' : 'AUDIT'),
            participants: extraMeta?.participants || [],
            schedule: extraMeta?.schedule || null,
            title: extraMeta?.title || ''
          });
        });
      };

      // 1. Send offer immediately
      broadcastOffer();

      // 2. Pulse offer every 3s (up to 30s) so recipient is guaranteed to receive ringing notification even if network lagged
      if (!isRejoin && !extraMeta?.isMeshConnection) {
        if (ringPulseIntervalRef.current) {
          clearInterval(ringPulseIntervalRef.current);
          ringPulseIntervalRef.current = null;
        }
        ringPulseIntervalRef.current = setInterval(() => {
          const targetKey = String(targetUserId).toLowerCase().trim();
          if (peerConnectionsRef.current.has(targetKey)) {
            const currentPc = peerConnectionsRef.current.get(targetKey);
            if (currentPc && currentPc.connectionState !== 'connected' && currentPc.iceConnectionState !== 'connected' && currentPc.connectionState !== 'connecting') {
              broadcastOffer();
            } else {
              if (ringPulseIntervalRef.current) {
                clearInterval(ringPulseIntervalRef.current);
                ringPulseIntervalRef.current = null;
              }
            }
          } else {
            if (ringPulseIntervalRef.current) {
              clearInterval(ringPulseIntervalRef.current);
              ringPulseIntervalRef.current = null;
            }
          }
        }, 3000);

        setTimeout(() => {
          if (ringPulseIntervalRef.current) {
            clearInterval(ringPulseIntervalRef.current);
            ringPulseIntervalRef.current = null;
          }
        }, 30000);
      }
    } catch (err) {
      console.error('[WebRTC] Error in makeCall:', err);
    }
  };

  const syncMeshConnections = useCallback(async (participantsList = [], extraMeta = {}) => {
    if (!participantsList || !Array.isArray(participantsList) || participantsList.length <= 1) return;
    const myKeys = getUserIdentityKeys();
    const myPrimaryId = String(currentUserId || '').toLowerCase().trim();

    for (const p of participantsList) {
      const pEmp = p?.employee || p;
      if (!pEmp) continue;
      const pKeys = extractUserKeys(pEmp);
      const isSelf = pKeys.some((k) => myKeys.has(k));
      if (isSelf) continue;

      const pPrimaryId = String(pEmp.userId || pEmp.id || pEmp.empCode || pEmp.userName || '').toLowerCase().trim();
      if (!pPrimaryId) continue;

      let hasActivePc = false;
      for (const key of pKeys) {
        if (peerConnectionsRef.current.has(key)) {
          const existingPc = peerConnectionsRef.current.get(key);
          if (existingPc && (existingPc.connectionState === 'connected' || existingPc.connectionState === 'connecting' || existingPc.iceConnectionState === 'connected')) {
            hasActivePc = true;
            break;
          }
        }
      }

      if (!hasActivePc) {
        // Deterministic tie-breaking:
        // Participant with lexicographically higher ID initiates offer
        if (myPrimaryId > pPrimaryId) {
          console.log('[WebRTC Mesh] Initiating mesh connection offer to peer:', pPrimaryId, 'myId:', myPrimaryId);
          makeCall(pEmp, isVideoEnabledRef.current, false, {
            callType: 'GROUP_MEETING',
            isMeshConnection: true,
            participants: participantsList,
            ...extraMeta
          });
        } else {
          console.log('[WebRTC Mesh] Waiting for mesh connection offer from higher-order peer:', pPrimaryId, 'myId:', myPrimaryId);
        }
      }
    }
  }, [currentUserId, getUserIdentityKeys, isVideoEnabled, makeCall]);

  const handleSignalingMessage = async (data) => {
    const { type, sender, offer, answer, candidate, video, isRejoin, targetUser } = data;

    // Ignore self messages
    if (sender && currentUserId && String(sender).toLowerCase().trim() === String(currentUserId).toLowerCase().trim()) {
      return;
    }

    // Deduplicate rapid duplicate signaling packets (e.g. from multiple alias topic subscriptions)
    const fingerprint = `${type}_${sender}_${data.audio}_${data.video}_${data.leavingUserId}_${data.presenterId}_${typeof offer === 'object' ? offer?.sdp?.slice(0, 40) : ''}_${typeof answer === 'object' ? answer?.sdp?.slice(0, 40) : ''}_${typeof candidate === 'object' ? candidate?.candidate?.slice(0, 40) : ''}`;
    const now = Date.now();
    if (recentMsgCacheRef.current.has(fingerprint)) {
      const last = recentMsgCacheRef.current.get(fingerprint);
      if (now - last < 500) {
        return; // Drop duplicate
      }
    }
    recentMsgCacheRef.current.set(fingerprint, now);

    // Determine if message is meant for this user
    const myKeys = getUserIdentityKeys();
    const isTargetForMe = (
      !targetUser ||
      targetUser === 'broadcast' ||
      myKeys.has(String(targetUser).toLowerCase().trim()) ||
      (data?.participants && Array.isArray(data.participants) && data.participants.some((p) => {
        const pEmp = p?.employee || p;
        if (!pEmp) return false;
        return [
          pEmp.id,
          pEmp.empId,
          pEmp.userId,
          pEmp.userName,
          pEmp.empCode,
          pEmp.employeeCode,
          pEmp.oldEmpCode,
          pEmp.employeeName,
          pEmp.name
        ].some((val) => val !== null && val !== undefined && myKeys.has(String(val).toLowerCase().trim()));
      }))
    );

    if (!isTargetForMe) {
      return; // Message is meant for another user
    }

    console.log('[WebRTC] Received signaling message for current user:', type, 'from:', sender, data);

    switch (type) {
      case 'CALL_OFFER':
        remoteUserIdRef.current = sender;
        setRemoteUserId(sender);
        setRemoteIsVideoEnabled(Boolean(video));
        {
          const isMeshOrActiveGroup = Boolean(data?.isMeshConnection) || (data?.callType === 'GROUP_MEETING' && peerConnectionsRef.current.size > 0);
          if (isRejoin || isMeshOrActiveGroup) {
            console.log('[WebRTC] Auto-accepting mesh/reconnect call offer from:', sender);
            acceptCall(sender, offer, video, data);
            if (onCallConnectedRef.current) onCallConnectedRef.current();
          } else if (onIncomingCallRef.current) {
            onIncomingCallRef.current(sender, video, offer, data);
          }
        }
        break;

      case 'CALL_ANSWER':
        if (ringPulseIntervalRef.current) {
          clearInterval(ringPulseIntervalRef.current);
          ringPulseIntervalRef.current = null;
        }
        {
          const senderKey = sender ? String(sender).toLowerCase().trim() : '';
          let targetPc = peerConnectionsRef.current.get(senderKey) || peerConnection.current;
          if (!targetPc && peerConnectionsRef.current.size > 0) {
            targetPc = Array.from(peerConnectionsRef.current.values())[0];
          }

          if (targetPc) {
            try {
              if (targetPc.signalingState === 'have-local-offer') {
                await targetPc.setRemoteDescription(new RTCSessionDescription(answer));
                await flushCandidateQueue(targetPc, senderKey);
              } else {
                console.log('[WebRTC] targetPc signalingState is:', targetPc.signalingState);
              }
              if (onCallConnectedRef.current) onCallConnectedRef.current();
              window.dispatchEvent(
                new CustomEvent('bos-participant-joined', {
                  detail: { sender: sender }
                })
              );
              // Send current media state to answerer immediately
              if (sender) {
                publishSignaling('/app/signaling', {
                  type: 'MEDIA_STATE_CHANGE',
                  targetUser: sender,
                  sender: currentUserId,
                  senderName: userObj?.employeeName || userObj?.name || currentUserId,
                  audio: isAudioEnabled,
                  video: isVideoEnabled
                });
              }
            } catch (e) {
              console.error('[WebRTC] Error setting remote description from answer:', e);
            }
          }
        }
        break;

      case 'CALL_RENEGOTIATE_OFFER':
        {
          console.log('[WebRTC] Received CALL_RENEGOTIATE_OFFER from:', sender);
          const senderKey = sender ? String(sender).toLowerCase().trim() : '';
          let targetPc = peerConnectionsRef.current.get(senderKey) || peerConnection.current;
          if (targetPc && offer) {
            try {
              await targetPc.setRemoteDescription(new RTCSessionDescription(offer));
              await flushCandidateQueue(targetPc, senderKey);

              const activeStream = screenStreamRef.current || localStreamRef.current;
              if (activeStream) {
                for (const track of activeStream.getTracks()) {
                  const s = targetPc.getSenders().find((sdr) => (sdr.track === null && (!sdr.kind || sdr.kind === track.kind)) || (sdr.track && sdr.track.kind === track.kind));
                  if (s) {
                    try { 
                      await s.replaceTrack(track); 
                      applyOptimalSenderParameters(s, Boolean(screenStreamRef.current));
                    } catch (e) {}
                  } else {
                    try { 
                      const newSender = targetPc.addTrack(track, activeStream); 
                      applyOptimalSenderParameters(newSender, Boolean(screenStreamRef.current));
                    } catch (e) {}
                  }
                }
              }

              const ans = await targetPc.createAnswer();
              await targetPc.setLocalDescription(ans);
              publishSignaling('/app/signaling', {
                type: 'CALL_RENEGOTIATE_ANSWER',
                targetUser: sender,
                sender: currentUserId,
                answer: ans
              });
            } catch (err) {
              console.warn('[WebRTC] Error handling CALL_RENEGOTIATE_OFFER:', err);
            }
          }
        }
        break;

      case 'CALL_RENEGOTIATE_ANSWER':
        {
          console.log('[WebRTC] Received CALL_RENEGOTIATE_ANSWER from:', sender);
          const senderKey = sender ? String(sender).toLowerCase().trim() : '';
          let targetPc = peerConnectionsRef.current.get(senderKey) || peerConnection.current;
          if (targetPc && answer) {
            try {
              if (targetPc.signalingState === 'have-local-offer') {
                await targetPc.setRemoteDescription(new RTCSessionDescription(answer));
                await flushCandidateQueue(targetPc, senderKey);
              }
            } catch (err) {
              console.warn('[WebRTC] Error handling CALL_RENEGOTIATE_ANSWER:', err);
            }
          }
        }
        break;

      case 'ICE_CANDIDATE':
        {
          const senderKey = sender ? String(sender).toLowerCase().trim() : '';
          let targetPc = peerConnectionsRef.current.get(senderKey) || peerConnection.current;
          if (!targetPc && peerConnectionsRef.current.size > 0) {
            targetPc = Array.from(peerConnectionsRef.current.values())[0];
          }

          if (targetPc && candidate) {
            if (targetPc.remoteDescription && targetPc.remoteDescription.type) {
              try {
                await targetPc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.warn('[WebRTC] Could not add ice candidate:', e);
              }
            } else {
              if (!candidateQueuesRef.current.has(senderKey)) {
                candidateQueuesRef.current.set(senderKey, []);
              }
              candidateQueuesRef.current.get(senderKey).push(candidate);
              candidateQueueRef.current.push(candidate);
            }
          }
        }
        break;

      case 'MEDIA_STATE_CHANGE':
        console.log('[WebRTC] Received MEDIA_STATE_CHANGE from', sender, data);
        if (typeof data.audio === 'boolean') {
          setRemoteIsAudioEnabled(data.audio);
        }
        if (typeof data.video === 'boolean') {
          setRemoteIsVideoEnabled(data.video);
        }
        window.dispatchEvent(
          new CustomEvent('bos-media-state-changed', {
            detail: {
              userId: sender || data.sender,
              audio: data.audio,
              video: data.video
            }
          })
        );
        break;

      case 'CALL_BUSY':
        console.log('[WebRTC] Peer is busy on another call:', sender);
        if (sender) {
          const sKey = String(sender).toLowerCase().trim();
          if (peerConnectionsRef.current.has(sKey)) {
            try { peerConnectionsRef.current.get(sKey).close(); } catch (e) { }
            peerConnectionsRef.current.delete(sKey);
          }
        }
        if (peerConnectionsRef.current.size === 0) {
          cleanupCall();
          if (onCallEndedRef.current) onCallEndedRef.current('BUSY');
        }
        break;

      case 'CALL_REJECT':
      case 'CALL_DECLINED':
        console.log('[WebRTC] Peer rejected call:', sender);
        if (sender) {
          const sKey = String(sender).toLowerCase().trim();
          if (peerConnectionsRef.current.has(sKey)) {
            try { peerConnectionsRef.current.get(sKey).close(); } catch (e) { }
            peerConnectionsRef.current.delete(sKey);
          }
        }
        window.dispatchEvent(
          new CustomEvent('bos-call-declined', {
            detail: {
              sender: sender,
              reason: data?.reason || 'DECLINED'
            }
          })
        );
        if (peerConnectionsRef.current.size === 0) {
          cleanupCall();
          if (onCallEndedRef.current) onCallEndedRef.current('DECLINED');
        }
        break;

      case 'CALL_END':
      case 'CALL_ENDED':
        console.log('[WebRTC] Call ended by peer:', sender);
        cleanupCall();
        if (onCallEndedRef.current) onCallEndedRef.current('ENDED');
        break;

      case 'CALL_PARTICIPANTS_SYNC':
        console.log('[WebRTC] Received CALL_PARTICIPANTS_SYNC:', data);
        {
          const syncList = data.participants || [];
          window.dispatchEvent(
            new CustomEvent('bos-participants-sync', {
              detail: {
                participants: syncList,
                isGroup: true,
                sender: sender
              }
            })
          );
          if (syncList.length > 1) {
            setTimeout(() => {
              syncMeshConnections(syncList, { callType: 'GROUP_MEETING' });
            }, 500);
          }
        }
        break;

      case 'CALL_PARTICIPANT_LEFT':
        console.log('[WebRTC] Received CALL_PARTICIPANT_LEFT for user:', data.leavingUserId);
        if (data.leavingUserId) {
          const lKey = String(data.leavingUserId).toLowerCase().trim();
          if (peerConnectionsRef.current.has(lKey)) {
            try { peerConnectionsRef.current.get(lKey).close(); } catch (e) { }
            peerConnectionsRef.current.delete(lKey);
          }
          if (remoteStreamsRef.current.has(lKey)) {
            remoteStreamsRef.current.delete(lKey);
            setRemoteStreams(new Map(remoteStreamsRef.current));
          }
        }
        window.dispatchEvent(
          new CustomEvent('bos-participant-left', {
            detail: {
              leavingUserId: data.leavingUserId,
              leavingUserName: data.leavingUserName
            }
          })
        );
        break;

      case 'SCREEN_SHARE_STATE_CHANGE':
        console.log('[WebRTC] Received SCREEN_SHARE_STATE_CHANGE:', data);
        if (data.isSharing) {
          const presId = data.presenterId || sender;
          const presKey = presId ? String(presId).toLowerCase().trim() : '';

          // If someone else took over, exit self screen share
          if (isScreenSharingRef.current || screenStreamRef.current) {
            if (screenStreamRef.current) {
              try {
                screenStreamRef.current.getTracks().forEach((track) => track.stop());
              } catch (e) { }
              screenStreamRef.current = null;
            }
            if (localStream) {
              const videoTrack = localStream.getVideoTracks()[0];
              if (videoTrack) {
                peerConnectionsRef.current.forEach((pc) => {
                  const s = pc.getSenders().find((tr) => tr.track && tr.track.kind === 'video');
                  if (s) s.replaceTrack(videoTrack).catch(() => { });
                });
              }
            }
            isScreenSharingRef.current = false;
            setIsScreenSharing(false);
            setScreenStream(null);
            window.dispatchEvent(
              new CustomEvent('bos-host-action', {
                detail: {
                  message: `${data.presenterName || 'Another participant'} is now presenting screen. Your screen share was stopped.`
                }
              })
            );
          }

          // Only update stream view if connected to presenter in an active call
          if (presKey && presKey !== String(currentUserId).toLowerCase().trim()) {
            if (remoteStreamsRef.current.has(presKey)) {
              setRemoteStream(remoteStreamsRef.current.get(presKey));
            }
          }

          setScreenPresenter({
            id: data.presenterId || sender,
            name: data.presenterName || 'Presenter'
          });
        } else {
          setScreenPresenter(null);
        }
        window.dispatchEvent(
          new CustomEvent('bos-screen-share-changed', {
            detail: {
              isSharing: Boolean(data.isSharing),
              presenterId: data.presenterId || sender,
              presenterName: data.presenterName || 'Presenter'
            }
          })
        );
        break;

      case 'HOST_MUTE_PARTICIPANT':
        console.log('[WebRTC] Received HOST_MUTE_PARTICIPANT action:', data);
        if (data.mediaType === 'audio') {
          if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            audioTracks.forEach((tr) => {
              tr.enabled = false;
            });
          }
          peerConnectionsRef.current.forEach((pc) => {
            try {
              pc.getSenders().forEach((senderTrack) => {
                if (senderTrack.track && senderTrack.track.kind === 'audio') {
                  senderTrack.track.enabled = false;
                }
              });
            } catch (e) { }
          });
          setIsAudioEnabled(false);
          window.dispatchEvent(
            new CustomEvent('bos-host-action', {
              detail: {
                message: 'You were muted by the Host',
                type: 'audio'
              }
            })
          );
        } else if (data.mediaType === 'video') {
          if (localStream) {
            const videoTracks = localStream.getVideoTracks();
            videoTracks.forEach((tr) => {
              tr.enabled = false;
            });
          }
          peerConnectionsRef.current.forEach((pc) => {
            try {
              pc.getSenders().forEach((senderTrack) => {
                if (senderTrack.track && senderTrack.track.kind === 'video') {
                  senderTrack.track.enabled = false;
                }
              });
            } catch (e) { }
          });
          setIsVideoEnabled(false);
          window.dispatchEvent(
            new CustomEvent('bos-host-action', {
              detail: {
                message: 'You were turned off by the Host',
                type: 'video'
              }
            })
          );
        }
        break;

      default:
        break;
    }
  };

  const hostMuteUser = (targetUserId, mediaType = 'audio') => {
    if (!targetUserId) return;
    console.log('[WebRTC] Host muting participant:', targetUserId, mediaType);
    publishSignaling('/app/signaling', {
      type: 'HOST_MUTE_PARTICIPANT',
      targetUser: targetUserId,
      sender: currentUserId,
      mediaType: mediaType
    });
  };

  const acceptCall = async (callerId, offer, video = true, callerData = {}) => {
    const primaryCallerId = typeof callerId === 'object' && callerId !== null ? (callerId.userId || callerId.id || callerId.empCode) : callerId;
    remoteUserIdRef.current = primaryCallerId;
    setRemoteUserId(primaryCallerId);

    // If user is already in a call (group meeting or mesh link), PRESERVE their current audio & video states!
    const isAlreadyInCall = peerConnectionsRef.current.size > 0 || Boolean(callerData?.isMeshConnection) || Boolean(callerData?.callType === 'GROUP_MEETING' && localStreamRef.current);
    if (!isAlreadyInCall) {
      setIsVideoEnabled(Boolean(video));
      isVideoEnabledRef.current = Boolean(video);
      setRemoteIsVideoEnabled(Boolean(video));
      setIsAudioEnabled(true);
      isAudioEnabledRef.current = true;
    }

    try {
      await connectSignaling();
      const stream = await startLocalMedia(Boolean(isVideoEnabledRef.current));

      const callerAliases = extractUserKeys(callerId, callerData);
      const pc = initPeerConnection(primaryCallerId, callerAliases);

      // 1. Set remote description FIRST so transceivers match the caller's offer exactly
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await flushCandidateQueue(pc, primaryCallerId);

      // 2. Attach local tracks to the matched senders or addTrack with preserved mute/video enabled flags
      const activeStream = screenStreamRef.current || stream;
      if (activeStream) {
        for (const track of activeStream.getTracks()) {
          if (track.kind === 'audio') {
            track.enabled = isAudioEnabledRef.current;
          }
          if (track.kind === 'video') {
            track.enabled = isVideoEnabledRef.current;
          }
          const sender = pc.getSenders().find((s) => (s.track === null && (!s.kind || s.kind === track.kind)) || (s.track && s.track.kind === track.kind));
          if (sender) {
            try {
              await sender.replaceTrack(track);
              applyOptimalSenderParameters(sender, Boolean(screenStreamRef.current));
            } catch (e) {
              console.warn('[WebRTC] replaceTrack error:', e);
            }
            const tr = pc.getTransceivers().find((t) => t.sender === sender);
            if (tr) {
              tr.direction = 'sendrecv';
            }
          } else {
            try {
              const newSender = pc.addTrack(track, activeStream);
              applyOptimalSenderParameters(newSender, Boolean(screenStreamRef.current));
            } catch (e) {
              console.warn('[WebRTC] addTrack fallback error:', e);
            }
          }
        }
      }

      // Ensure both audio and video transceivers are set to sendrecv
      pc.getTransceivers().forEach((tr) => {
        if (tr.direction === 'recvonly' || tr.direction === 'inactive') {
          tr.direction = 'sendrecv';
        }
      });

      // 3. Create answer and set local description
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const allTargetKeys = new Set(callerAliases);
      if (primaryCallerId) allTargetKeys.add(String(primaryCallerId));
      if (callerData?.sender) allTargetKeys.add(String(callerData.sender));

      allTargetKeys.forEach((key) => {
        if (!key) return;
        const s = String(key).trim();
        publishSignaling('/app/signaling', {
          type: 'CALL_ANSWER',
          targetUser: s,
          sender: currentUserId,
          senderName: userObj?.employeeName || userObj?.name || currentUserId,
          answer: answer
        });
        publishSignaling('/app/signaling', {
          type: 'CALL_ANSWER',
          targetUser: s.toLowerCase(),
          sender: currentUserId,
          senderName: userObj?.employeeName || userObj?.name || currentUserId,
          answer: answer
        });
        publishSignaling('/app/signaling', {
          type: 'MEDIA_STATE_CHANGE',
          targetUser: s,
          sender: currentUserId,
          senderName: userObj?.employeeName || userObj?.name || currentUserId,
          audio: isAudioEnabled,
          video: isVideoEnabled
        });
      });

      // Broadcast media state to all meeting participants so newly joined user's mic/video status is accurate across all screens
      if (callerData?.participants && Array.isArray(callerData.participants)) {
        callerData.participants.forEach((p) => {
          const pEmp = p?.employee || p;
          const pKeys = extractUserKeys(pEmp);
          pKeys.forEach((k) => {
            if (k && String(k).toLowerCase() !== String(currentUserId).toLowerCase()) {
              publishSignaling('/app/signaling', {
                type: 'MEDIA_STATE_CHANGE',
                targetUser: k,
                sender: currentUserId,
                senderName: userObj?.employeeName || userObj?.name || currentUserId,
                audio: isAudioEnabled,
                video: isVideoEnabled
              });
            }
          });
        });
      }

      if (onCallConnectedRef.current) onCallConnectedRef.current();

      // If call came with other participants, auto mesh sync
      if (callerData?.participants && Array.isArray(callerData.participants) && callerData.participants.length > 1) {
        setTimeout(() => {
          syncMeshConnections(callerData.participants, { callType: 'GROUP_MEETING' });
        }, 500);
      }
    } catch (err) {
      console.error('[WebRTC] Error in acceptCall:', err);
    }
  };

  const endCall = (targetOverride = null, allRemainingParticipants = []) => {
    const targetKeys = new Set();
    if (targetOverride) {
      if (typeof targetOverride === 'object') {
        if (targetOverride.userId) targetKeys.add(String(targetOverride.userId));
        if (targetOverride.userName) targetKeys.add(String(targetOverride.userName));
        if (targetOverride.id) targetKeys.add(String(targetOverride.id));
        if (targetOverride.empCode) targetKeys.add(String(targetOverride.empCode));
        if (targetOverride.employeeCode) targetKeys.add(String(targetOverride.employeeCode));
      } else {
        targetKeys.add(String(targetOverride));
      }
    }
    (allRemainingParticipants || []).forEach((p) => {
      const uId = typeof p === 'object' ? (p.userId || p.id || p.userName) : p;
      if (uId && String(uId).toLowerCase() !== String(currentUserId).toLowerCase()) {
        targetKeys.add(String(uId));
      }
    });

    const target = remoteUserIdRef.current || remoteUserId;
    if (target) targetKeys.add(String(target));

    const allKeys = new Set();
    targetKeys.forEach((k) => {
      if (!k) return;
      const s = String(k).trim();
      allKeys.add(s);
      allKeys.add(s.toLowerCase());
    });

    console.log('[WebRTC] Ending call, sending CALL_END to all peers:', Array.from(allKeys));
    allKeys.forEach((key) => {
      publishSignaling('/app/signaling', {
        type: 'CALL_END',
        targetUser: key,
        sender: currentUserId
      });
    });

    cleanupCall();
  };

  const broadcastParticipantSync = (targetUserIds = [], participantsList = []) => {
    (targetUserIds || []).forEach((uId) => {
      if (!uId || String(uId).toLowerCase() === String(currentUserId).toLowerCase()) return;
      publishSignaling('/app/signaling', {
        type: 'CALL_PARTICIPANTS_SYNC',
        targetUser: uId,
        sender: currentUserId,
        participants: participantsList,
        isGroup: true
      });
    });
  };

  const leaveCall = (isGroupCall = false, allParticipants = [], currentUserName = '') => {
    console.log('[WebRTC] Participant leaving call, notifying peers:', allParticipants);
    const allTargetKeys = new Set();
    (allParticipants || []).forEach((p) => {
      const pEmp = p?.employee || p;
      const keys = extractUserKeys(pEmp);
      keys.forEach((k) => allTargetKeys.add(k));
    });
    // Also include all active peer connections
    peerConnectionsRef.current.forEach((_, key) => {
      allTargetKeys.add(key);
    });

    allTargetKeys.forEach((key) => {
      if (key && String(key).toLowerCase() !== String(currentUserId).toLowerCase()) {
        publishSignaling('/app/signaling', {
          type: 'CALL_PARTICIPANT_LEFT',
          targetUser: key,
          sender: currentUserId,
          leavingUserId: currentUserId,
          leavingUserName: currentUserName || userObj?.employeeName || userObj?.name || currentUserId
        });
        publishSignaling('/app/signaling', {
          type: 'CALL_PARTICIPANT_LEFT',
          targetUser: String(key).toLowerCase(),
          sender: currentUserId,
          leavingUserId: currentUserId,
          leavingUserName: currentUserName || userObj?.employeeName || userObj?.name || currentUserId
        });
      }
    });

    cleanupCall();
  };

  const cleanupCall = () => {
    if (ringPulseIntervalRef.current) {
      clearInterval(ringPulseIntervalRef.current);
      ringPulseIntervalRef.current = null;
    }
    candidateQueueRef.current = [];
    // Stop and clear screen sharing tracks
    if (screenStreamRef.current) {
      try {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) { }
      screenStreamRef.current = null;
    }
    if (screenStream) {
      try {
        screenStream.getTracks().forEach((track) => track.stop());
      } catch (e) { }
    }
    setScreenStream(null);
    isScreenSharingRef.current = false;
    setIsScreenSharing(false);
    setScreenPresenter(null);

    window.dispatchEvent(
      new CustomEvent('bos-screen-share-changed', {
        detail: {
          isSharing: false,
          presenterId: null,
          presenterName: null
        }
      })
    );

    if (peerConnectionsRef.current.size > 0) {
      peerConnectionsRef.current.forEach((pc) => {
        try {
          pc.close();
        } catch (e) { }
      });
      peerConnectionsRef.current.clear();
    }
    peerConnection.current = null;
    remoteStreamsRef.current.clear();
    candidateQueuesRef.current.clear();
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) { }
      localStreamRef.current = null;
    }
    setLocalStream((prevStream) => {
      if (prevStream) {
        prevStream.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
    setRemoteStream(null);
    remoteUserIdRef.current = null;
    setRemoteUserId(null);
    setRemoteIsAudioEnabled(true);
    setRemoteIsVideoEnabled(true);
  };

  const rejectCall = (targetUserId, reason = 'DECLINED') => {
    console.log('[WebRTC] Rejecting incoming call from:', targetUserId, 'reason:', reason);
    if (targetUserId) {
      const keys = [targetUserId, String(targetUserId).toLowerCase()];
      keys.forEach((target) => {
        publishSignaling('/app/signaling', {
          type: 'CALL_REJECT',
          targetUser: target,
          sender: currentUserId,
          reason: reason
        });
        publishSignaling('/app/signaling', {
          type: 'CALL_DECLINED',
          targetUser: target,
          sender: currentUserId,
          reason: reason
        });
        if (reason !== 'BUSY') {
          publishSignaling('/app/signaling', {
            type: 'CALL_END',
            targetUser: target,
            sender: currentUserId,
            reason: reason
          });
        }
      });
    }
    cleanupCall();
  };

  const sendBusy = (targetUserId) => {
    rejectCall(targetUserId, 'BUSY');
  };

  const toggleAudio = (targetUserIds = [], currentUserName = '') => {
    const newAudioState = !isAudioEnabled;
    setIsAudioEnabled(newAudioState);

    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((tr) => {
        tr.enabled = newAudioState;
      });
    }

    // Toggle track enabled state across all peer connections
    peerConnectionsRef.current.forEach((pc) => {
      try {
        pc.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = newAudioState;
          }
        });
      } catch (e) { }
    });

    // Notify local UI immediately
    window.dispatchEvent(
      new CustomEvent('bos-media-state-changed', {
        detail: {
          userId: currentUserId,
          audio: newAudioState,
          video: isVideoEnabled
        }
      })
    );

    const allTargetKeys = new Set();
    (targetUserIds || []).forEach((u) => {
      const uId = typeof u === 'object' ? (u.userId || u.id || u.userName || u.empCode || u.employeeCode) : u;
      if (uId) allTargetKeys.add(String(uId));
    });
    if (remoteUserIdRef.current) allTargetKeys.add(String(remoteUserIdRef.current));

    allTargetKeys.forEach((target) => {
      if (!target || target.toLowerCase() === String(currentUserId).toLowerCase()) return;
      publishSignaling('/app/signaling', {
        type: 'MEDIA_STATE_CHANGE',
        targetUser: target,
        sender: currentUserId,
        senderName: currentUserName,
        audio: newAudioState,
        video: isVideoEnabled
      });
      publishSignaling('/app/signaling', {
        type: 'MEDIA_STATE_CHANGE',
        targetUser: target.toLowerCase(),
        sender: currentUserId,
        senderName: currentUserName,
        audio: newAudioState,
        video: isVideoEnabled
      });
    });
  };

  const toggleVideo = async (targetUserIds = [], currentUserName = '') => {
    const newVideoState = !isVideoEnabled;
    setIsVideoEnabled(newVideoState);

    let activeVideoTrack = null;

    if (newVideoState) {
      // 1. Check if localStream already has an active live video track
      if (localStream) {
        const tracks = localStream.getVideoTracks();
        if (tracks.length > 0 && tracks[0].readyState === 'live') {
          tracks[0].enabled = true;
          activeVideoTrack = tracks[0];
        }
      }

      // 2. If no active video track, acquire camera dynamically from getUserMedia
      if (!activeVideoTrack) {
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const camStream = await navigator.mediaDevices.getUserMedia({
              video: OPTIMAL_VIDEO_CONSTRAINTS,
              audio: false
            });
            const newTrack = camStream.getVideoTracks()[0];
            if (newTrack) {
              activeVideoTrack = newTrack;
              if (localStream) {
                localStream.addTrack(newTrack);
              } else {
                const newStream = new MediaStream([newTrack]);
                localStreamRef.current = newStream;
                setLocalStream(newStream);
              }
            }
          }
        } catch (camErr) {
          console.warn('[WebRTC] Could not acquire camera on toggleVideo:', camErr);
        }
      }

      // 3. Replace track and renegotiate on all peer connections
      if (activeVideoTrack) {
        peerConnectionsRef.current.forEach(async (pc, peerKey) => {
          try {
            const sender = pc.getSenders().find((s) => s.track?.kind === 'video' || (s.track === null && (!s.kind || s.kind === 'video')));
            if (sender) {
              await sender.replaceTrack(activeVideoTrack);
              applyOptimalSenderParameters(sender, false);
            } else {
              try {
                const newSender = pc.addTrack(activeVideoTrack, localStream);
                applyOptimalSenderParameters(newSender, false);
              } catch (e) {}
            }
            const tr = pc.getTransceivers().find((t) => t.sender?.track?.kind === 'video' || t.receiver?.track?.kind === 'video');
            if (tr) {
              tr.direction = 'sendrecv';
            }
            if (pc.signalingState === 'stable') {
              const reOffer = await pc.createOffer();
              await pc.setLocalDescription(reOffer);
              publishSignaling('/app/signaling', {
                type: 'CALL_RENEGOTIATE_OFFER',
                targetUser: peerKey,
                sender: currentUserId,
                offer: reOffer
              });
            }
          } catch (e) {
            console.warn('[WebRTC] replaceTrack / renegotiate on toggleVideo failed:', e);
          }
        });
      }
    } else {
      // Turning video off
      if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach((tr) => {
          tr.enabled = false;
        });
      }
      peerConnectionsRef.current.forEach(async (pc, peerKey) => {
        try {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video' || (s.track === null && (!s.kind || s.kind === 'video')));
          if (sender) {
            await sender.replaceTrack(null);
          }
          const tr = pc.getTransceivers().find((t) => t.sender?.track?.kind === 'video' || t.receiver?.track?.kind === 'video');
          if (tr) {
            tr.direction = 'recvonly';
          }
          if (pc.signalingState === 'stable') {
            const reOffer = await pc.createOffer();
            await pc.setLocalDescription(reOffer);
            publishSignaling('/app/signaling', {
              type: 'CALL_RENEGOTIATE_OFFER',
              targetUser: peerKey,
              sender: currentUserId,
              offer: reOffer
            });
          }
        } catch (e) {}
      });
    }

    // Notify local UI immediately
    window.dispatchEvent(
      new CustomEvent('bos-media-state-changed', {
        detail: {
          userId: currentUserId,
          audio: isAudioEnabled,
          video: newVideoState
        }
      })
    );

    const allTargetKeys = new Set();
    (targetUserIds || []).forEach((u) => {
      const uId = typeof u === 'object' ? (u.userId || u.id || u.userName || u.empCode || u.employeeCode) : u;
      if (uId) allTargetKeys.add(String(uId));
    });
    if (remoteUserIdRef.current) allTargetKeys.add(String(remoteUserIdRef.current));

    allTargetKeys.forEach((target) => {
      if (!target || target.toLowerCase() === String(currentUserId).toLowerCase()) return;
      publishSignaling('/app/signaling', {
        type: 'MEDIA_STATE_CHANGE',
        targetUser: target,
        sender: currentUserId,
        senderName: currentUserName,
        audio: isAudioEnabled,
        video: newVideoState
      });
      publishSignaling('/app/signaling', {
        type: 'MEDIA_STATE_CHANGE',
        targetUser: target.toLowerCase(),
        sender: currentUserId,
        senderName: currentUserName,
        audio: isAudioEnabled,
        video: newVideoState
      });
    });
  };

  const toggleScreenShare = async (targetUserIds = [], currentUserName = '') => {
    const allTargetKeys = new Set();
    (targetUserIds || []).forEach((u) => {
      const uId = typeof u === 'object' ? (u.userId || u.id || u.userName || u.employeeCode || u.name || u.empCode) : u;
      if (uId) allTargetKeys.add(String(uId));
    });
    if (remoteUserIdRef.current) allTargetKeys.add(String(remoteUserIdRef.current));

    if (isScreenSharingRef.current || screenStreamRef.current) {
      // Revert back to local camera track
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      const videoTrack = (isVideoEnabled && localStream) ? localStream.getVideoTracks()[0] : null;
      peerConnectionsRef.current.forEach(async (pc, peerKey) => {
        try {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video' || (s.track === null && (!s.kind || s.kind === 'video')));
          if (sender) {
            await sender.replaceTrack(videoTrack || null);
            applyOptimalSenderParameters(sender, false);
          }
          const tr = pc.getTransceivers().find((t) => t.sender?.track?.kind === 'video' || t.receiver?.track?.kind === 'video');
          if (tr) {
            tr.direction = videoTrack ? 'sendrecv' : 'recvonly';
          }
          if (pc.signalingState === 'stable') {
            const reOffer = await pc.createOffer();
            await pc.setLocalDescription(reOffer);
            publishSignaling('/app/signaling', {
              type: 'CALL_RENEGOTIATE_OFFER',
              targetUser: peerKey,
              sender: currentUserId,
              offer: reOffer
            });
          }
        } catch (e) {}
      });
      isScreenSharingRef.current = false;
      setIsScreenSharing(false);
      setScreenStream(null);
      setScreenPresenter(null);

      // Broadcast screen share stopped to all call participants
      allTargetKeys.forEach((uId) => {
        if (!uId || String(uId).toLowerCase() === String(currentUserId).toLowerCase()) return;
        publishSignaling('/app/signaling', {
          type: 'SCREEN_SHARE_STATE_CHANGE',
          targetUser: uId,
          sender: currentUserId,
          isSharing: false
        });
        publishSignaling('/app/signaling', {
          type: 'SCREEN_SHARE_STATE_CHANGE',
          targetUser: String(uId).toLowerCase(),
          sender: currentUserId,
          isSharing: false
        });
      });
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
          });
          screenStreamRef.current = stream;
          setScreenStream(stream);
          isScreenSharingRef.current = true;
          setIsScreenSharing(true);
          setScreenPresenter({ id: currentUserId, name: currentUserName || 'You' });

          const screenTrack = stream.getVideoTracks()[0];
          peerConnectionsRef.current.forEach(async (pc, peerKey) => {
            try {
              const sender = pc.getSenders().find((s) => s.track?.kind === 'video' || (s.track === null && (!s.kind || s.kind === 'video')));
              if (sender) {
                await sender.replaceTrack(screenTrack);
                applyOptimalSenderParameters(sender, true);
              } else {
                try {
                  const newSender = pc.addTrack(screenTrack, stream);
                  applyOptimalSenderParameters(newSender, true);
                } catch (e) {
                  console.warn('[WebRTC] Failed to add screen track to peer connection:', e);
                }
              }
              const tr = pc.getTransceivers().find((t) => t.sender?.track?.kind === 'video' || t.receiver?.track?.kind === 'video');
              if (tr) {
                tr.direction = 'sendrecv';
              }
              if (pc.signalingState === 'stable') {
                const reOffer = await pc.createOffer();
                await pc.setLocalDescription(reOffer);
                publishSignaling('/app/signaling', {
                  type: 'CALL_RENEGOTIATE_OFFER',
                  targetUser: peerKey,
                  sender: currentUserId,
                  offer: reOffer
                });
              }
            } catch (e) {}
          });

          // Broadcast screen share started to all call participants
          allTargetKeys.forEach((uId) => {
            if (!uId || String(uId).toLowerCase() === String(currentUserId).toLowerCase()) return;
            publishSignaling('/app/signaling', {
              type: 'SCREEN_SHARE_STATE_CHANGE',
              targetUser: uId,
              sender: currentUserId,
              presenterId: currentUserId,
              presenterName: currentUserName || 'Presenter',
              isSharing: true
            });
            publishSignaling('/app/signaling', {
              type: 'SCREEN_SHARE_STATE_CHANGE',
              targetUser: String(uId).toLowerCase(),
              sender: currentUserId,
              presenterId: currentUserId,
              presenterName: currentUserName || 'Presenter',
              isSharing: true
            });
          });

          screenTrack.onended = () => {
            const revertTrack = (isVideoEnabled && localStream) ? localStream.getVideoTracks()[0] : null;
            peerConnectionsRef.current.forEach(async (pc, peerKey) => {
              try {
                const sender = pc.getSenders().find((s) => s.track?.kind === 'video' || (s.track === null && (!s.kind || s.kind === 'video')));
                if (sender) {
                  await sender.replaceTrack(revertTrack || null);
                  applyOptimalSenderParameters(sender, false);
                }
                const tr = pc.getTransceivers().find((t) => t.sender?.track?.kind === 'video' || t.receiver?.track?.kind === 'video');
                if (tr) {
                  tr.direction = revertTrack ? 'sendrecv' : 'recvonly';
                }
                if (pc.signalingState === 'stable') {
                  const reOffer = await pc.createOffer();
                  await pc.setLocalDescription(reOffer);
                  publishSignaling('/app/signaling', {
                    type: 'CALL_RENEGOTIATE_OFFER',
                    targetUser: peerKey,
                    sender: currentUserId,
                    offer: reOffer
                  });
                }
              } catch (e) {}
            });
            isScreenSharingRef.current = false;
            setIsScreenSharing(false);
            screenStreamRef.current = null;
            setScreenStream(null);
            setScreenPresenter(null);

            allTargetKeys.forEach((uId) => {
              if (!uId || String(uId).toLowerCase() === String(currentUserId).toLowerCase()) return;
              publishSignaling('/app/signaling', {
                type: 'SCREEN_SHARE_STATE_CHANGE',
                targetUser: uId,
                sender: currentUserId,
                isSharing: false
              });
              publishSignaling('/app/signaling', {
                type: 'SCREEN_SHARE_STATE_CHANGE',
                targetUser: String(uId).toLowerCase(),
                sender: currentUserId,
                isSharing: false
              });
            });
          };
        } else {
          console.warn('[WebRTC] getDisplayMedia is not supported in this environment');
        }
      } catch (err) {
        console.warn('[WebRTC] Screen share cancelled or failed:', err);
      }
    }
  };

  const broadcastMediaState = useCallback((targetUserIds = []) => {
    const allTargetKeys = new Set();
    (targetUserIds || []).forEach((u) => {
      const uId = typeof u === 'object' ? (u.userId || u.id || u.userName || u.employeeCode) : u;
      if (uId) allTargetKeys.add(String(uId));
    });
    if (remoteUserIdRef.current) allTargetKeys.add(String(remoteUserIdRef.current));

    allTargetKeys.forEach((target) => {
      if (!target || target.toLowerCase() === String(currentUserId).toLowerCase()) return;
      publishSignaling('/app/signaling', {
        type: 'MEDIA_STATE_CHANGE',
        targetUser: target,
        sender: currentUserId,
        audio: isAudioEnabled,
        video: isVideoEnabled
      });
      publishSignaling('/app/signaling', {
        type: 'MEDIA_STATE_CHANGE',
        targetUser: target.toLowerCase(),
        sender: currentUserId,
        audio: isAudioEnabled,
        video: isVideoEnabled
      });
    });
  }, [currentUserId, isAudioEnabled, isVideoEnabled, publishSignaling]);

  return {
    localStream,
    remoteStream,
    remoteStreams,
    screenStream,
    isScreenSharing,
    screenPresenter,
    remoteIsAudioEnabled,
    remoteIsVideoEnabled,
    toggleScreenShare,
    makeCall,
    acceptCall,
    rejectCall,
    sendBusy,
    endCall,
    leaveCall,
    broadcastParticipantSync,
    syncMeshConnections,
    broadcastMediaState,
    hostMuteUser,
    toggleAudio,
    toggleVideo,
    isAudioEnabled,
    isVideoEnabled,
    startLocalMedia
  };
};
