import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// material-ui
import { useTheme, alpha } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Checkbox from '@mui/material/Checkbox';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import ForwardToInboxTwoToneIcon from '@mui/icons-material/ForwardToInboxTwoTone';
import ChatIcon from '@mui/icons-material/Chat';

// project imports
import ChatDrawer from './ChatDrawer';
import ChatHeader from './ChatHeader';
import ChartHistory from './ChartHistory';
import ChatInputBar from './ChatInputBar';
import UserDetails from './UserDetails';

import useAuth from 'hooks/useAuth';
import axiosServices from 'utils/axios';
import { startUniversalCall } from 'utils/universalCallManager';
import { autoUploadFile, getUserImageUrl, getFileViewUrl } from 'utils/upload-helper';

export default function ChatMainPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const currentUserId = authUser?.userId || authUser?.id || 'bos';

  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState({});
  const [smartReplies, setSmartReplies] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);

  // Selection mode for bulk forward / delete
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);

  // Forward dialog
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [forwardSearch, setForwardSearch] = useState('');
  const [forwardSelectedChannels, setForwardSelectedChannels] = useState([]);

  // In-Memory Message Cache for 0ms lag-free channel switching
  const messageCacheRef = useRef({});
  const rawMessageCountRef = useRef({});
  const activeChannelRef = useRef(activeChannel);
  activeChannelRef.current = activeChannel;

  const messagesScrollRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTo({
        top: messagesScrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // Process server message payload
  const processMessagesAndReactions = useCallback((data, channelId) => {
    if (!data) return [];
    rawMessageCountRef.current[channelId] = data.length;

    const normalMsgs = [];
    const reactObj = {};

    data.forEach((rawMsg) => {
      const m = { ...rawMsg };
      if (m.messageType === 'REACTION') {
        const targetId = m.attachmentName;
        if (!reactObj[targetId]) reactObj[targetId] = [];
        reactObj[targetId].push(m.messageContent);
      } else {
        // Parse tagged quoted reply if embedded
        if (m.messageContent && m.messageContent.startsWith('>>>REPLY:') && m.messageContent.includes('<<<\n')) {
          try {
            const endIdx = m.messageContent.indexOf('<<<\n');
            const jsonStr = m.messageContent.slice(9, endIdx);
            const replyMeta = JSON.parse(jsonStr);
            m.replyToMessage = {
              id: replyMeta.id,
              senderName: replyMeta.senderName,
              messageContent: replyMeta.content
            };
            m.messageContent = m.messageContent.slice(endIdx + 4);
          } catch (e) {}
        }
        normalMsgs.push(m);
      }
    });

    messageCacheRef.current[channelId] = normalMsgs;

    if (activeChannelRef.current?.id === channelId) {
      setMessages(normalMsgs);
      setReactions(reactObj);
    }
    return normalMsgs;
  }, []);

  // Fetch all channels
  const fetchChannels = useCallback(async () => {
    try {
      const res = await axiosServices.get('/api/chat/channels');
      if (res.data) {
        setChannels(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch channels', e);
    }
  }, []);

  // Fetch messages for a specific channel
  const fetchChannelMessages = useCallback(
    async (channelId) => {
      try {
        const res = await axiosServices.get(`/api/chat/channels/${channelId}/messages`);
        if (res.data) {
          processMessagesAndReactions(res.data, channelId);
          setTimeout(() => scrollToBottom(false), 50);
        }
      } catch (e) {
        console.error(`Failed to fetch messages for channel ${channelId}`, e);
      }
    },
    [processMessagesAndReactions, scrollToBottom]
  );

  // Fetch Smart Replies
  const fetchSmartReplies = useCallback(async (channelId) => {
    try {
      const res = await axiosServices.get(`/api/chat/channels/${channelId}/smart-replies`);
      if (res.data && res.data.suggestions) {
        setSmartReplies(res.data.suggestions.slice(0, 5));
      } else {
        setSmartReplies([]);
      }
    } catch (e) {
      setSmartReplies([]);
    }
  }, []);

  // Zero-Lag Channel Selection Handler
  const handleSelectChannel = useCallback(
    (chan) => {
      if (!chan) return;
      setActiveChannel(chan);
      setReplyingTo(null);
      setSelectionMode(false);
      setSelectedMessages([]);

      // 1. INSTANT: If messages already exist in cache, show them immediately in 0ms!
      if (messageCacheRef.current[chan.id]) {
        setMessages(messageCacheRef.current[chan.id]);
        setTimeout(() => scrollToBottom(false), 20);
      } else {
        setMessages([]);
      }

      // 2. Fetch fresh messages in background
      if (chan.id && !String(chan.id).startsWith('temp-')) {
        fetchChannelMessages(chan.id);
        fetchSmartReplies(chan.id);

        // Mark as read asynchronously
        axiosServices
          .post(`/api/chat/channels/${chan.id}/read`)
          .then(() => {
            setChannels((prev) =>
              prev.map((c) => (c.id === chan.id ? { ...c, unreadCount: 0 } : c))
            );
          })
          .catch(() => {});
      }
    },
    [fetchChannelMessages, fetchSmartReplies, scrollToBottom]
  );

  // Initial load & smart polling (every 4 seconds)
  useEffect(() => {
    fetchChannels();

    const interval = setInterval(async () => {
      try {
        const resChan = await axiosServices.get('/api/chat/channels');
        if (resChan.data) {
          setChannels(resChan.data);
        }

        const currentActive = activeChannelRef.current;
        if (currentActive && currentActive.id && !String(currentActive.id).startsWith('temp-')) {
          const resMsg = await axiosServices.get(`/api/chat/channels/${currentActive.id}/messages`);
          if (resMsg.data && rawMessageCountRef.current[currentActive.id] !== resMsg.data.length) {
            processMessagesAndReactions(resMsg.data, currentActive.id);
            setTimeout(() => scrollToBottom(true), 50);
          }
        }
      } catch (e) {}
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchChannels, processMessagesAndReactions, scrollToBottom]);

  // Deep-linking / Notification navigation support
  useEffect(() => {
    if (location.state?.openChannelId && channels.length > 0) {
      if (activeChannel?.id !== location.state.openChannelId) {
        const targetChan = channels.find((c) => c.id === location.state.openChannelId);
        if (targetChan) {
          handleSelectChannel(targetChan);
        }
      }
      navigate(location.pathname, { replace: true });
    }
  }, [location.state?.openChannelId, channels, activeChannel?.id, handleSelectChannel, location.pathname, navigate]);

  // Helper to ensure a channel exists on the server before sending messages/attachments
  const ensureResolvedChannel = async (chan) => {
    if (!chan) return null;
    if (chan.id && !String(chan.id).startsWith('temp-')) {
      return chan;
    }
    const targetUserId = chan.targetUserId || String(chan.id).replace('temp-', '');
    try {
      const res = await axiosServices.post(`/api/chat/channels/direct?targetUserId=${targetUserId}`);
      if (res.data && res.data.id) {
        const resolved = res.data;
        setActiveChannel(resolved);
        setChannels((prev) => {
          const exists = prev.some((c) => c.id === resolved.id);
          if (exists) {
            return prev.map((c) => (c.id === resolved.id ? resolved : c));
          }
          return [resolved, ...prev.filter((c) => !String(c.id).startsWith('temp-'))];
        });
        if (messageCacheRef.current[chan.id]) {
          messageCacheRef.current[resolved.id] = messageCacheRef.current[chan.id];
          delete messageCacheRef.current[chan.id];
        }
        return resolved;
      }
    } catch (e) {
      console.error('Failed to resolve temporary channel', e);
    }
    return null;
  };

  // Optimistic Message Sending
  const handleSendMessage = async (textContent) => {
    if (!activeChannel || !textContent.trim()) return;

    let targetChannel = activeChannel;
    if (String(targetChannel.id).startsWith('temp-')) {
      const resolved = await ensureResolvedChannel(targetChannel);
      if (resolved && !String(resolved.id).startsWith('temp-')) {
        targetChannel = resolved;
      } else {
        return;
      }
    }

    const currentReplyingTo = replyingTo ? { ...replyingTo } : null;
    const tempId = `temp-msg-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      channelId: targetChannel.id,
      senderId: currentUserId,
      senderName: authUser?.name || 'You',
      messageContent: textContent.trim(),
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
      isSending: true,
      replyToMessage: currentReplyingTo
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    messageCacheRef.current[targetChannel.id] = [
      ...(messageCacheRef.current[targetChannel.id] || []),
      optimisticMsg
    ];
    setReplyingTo(null);
    setTimeout(() => scrollToBottom(true), 10);

    setChannels((prev) =>
      prev.map((c) =>
        c.id === targetChannel.id
          ? {
              ...c,
              lastMessage: textContent.trim(),
              lastMessageTime: new Date().toISOString()
            }
          : c
      )
    );

    try {
      const serverContent = currentReplyingTo
        ? `>>>REPLY:${JSON.stringify({
            id: currentReplyingTo.id,
            senderName: currentReplyingTo.senderName || 'User',
            content: (currentReplyingTo.messageContent || 'Attachment').slice(0, 120)
          })}<<<\n${textContent.trim()}`
        : textContent.trim();

      const payload = {
        channelId: targetChannel.id,
        messageContent: serverContent,
        messageType: 'TEXT',
        replyToMessageId: currentReplyingTo?.id || null
      };

      const res = await axiosServices.post('/api/chat/channels/messages', payload);
      if (res.data) {
        const processedMsg = {
          ...res.data,
          messageContent: textContent.trim(),
          isSending: false,
          replyToMessage: currentReplyingTo
        };
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? processedMsg : m))
        );
        if (messageCacheRef.current[targetChannel.id]) {
          messageCacheRef.current[targetChannel.id] = messageCacheRef.current[targetChannel.id].map((m) =>
            m.id === tempId ? processedMsg : m
          );
        }
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Voice Note Sending using ERP's autoUploadFile
  const handleSendVoiceNote = async (audioBlob) => {
    if (!activeChannel || !audioBlob) return;

    let targetChannel = activeChannel;
    if (String(targetChannel.id).startsWith('temp-')) {
      const resolved = await ensureResolvedChannel(targetChannel);
      if (resolved && !String(resolved.id).startsWith('temp-')) {
        targetChannel = resolved;
      } else {
        return;
      }
    }

    try {
      const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
      const uploadedFilePath = await autoUploadFile(audioFile, 'CHAT');

      if (uploadedFilePath) {
        const payload = {
          channelId: targetChannel.id,
          messageContent: '[AUDIO]',
          messageType: 'AUDIO',
          attachmentUrl: uploadedFilePath,
          attachmentName: 'Voice Note'
        };
        const res = await axiosServices.post('/api/chat/channels/messages', payload);
        if (res.data) {
          setMessages((prev) => [...prev, res.data]);
          setTimeout(() => scrollToBottom(true), 20);
        }
      }
    } catch (err) {
      console.error('Failed to send voice note', err);
    }
  };

  // Upload Attachment (Document / Image / Audio) using ERP's autoUploadFile
  const handleUploadFile = async (file, type) => {
    if (!activeChannel || !file) return;

    let targetChannel = activeChannel;
    if (String(targetChannel.id).startsWith('temp-')) {
      const resolved = await ensureResolvedChannel(targetChannel);
      if (resolved && !String(resolved.id).startsWith('temp-')) {
        targetChannel = resolved;
      } else {
        return;
      }
    }

    try {
      const uploadedFilePath = await autoUploadFile(file, 'CHAT');

      if (uploadedFilePath) {
        const payload = {
          channelId: targetChannel.id,
          messageContent: type === 'IMAGE' ? 'Sent an image' : file.name || 'Document',
          messageType: type,
          attachmentUrl: uploadedFilePath,
          attachmentName: file.name
        };

        const res = await axiosServices.post('/api/chat/channels/messages', payload);
        if (res.data) {
          setMessages((prev) => [...prev, res.data]);
          setTimeout(() => scrollToBottom(true), 20);
        }
      }
    } catch (err) {
      console.error('Failed to upload file', err);
    }
  };

  // Emoji Reaction
  const handleReact = async (msgId, emoji) => {
    setReactions((prev) => {
      const current = prev[msgId] || [];
      if (current.includes(emoji)) {
        return { ...prev, [msgId]: current.filter((e) => e !== emoji) };
      }
      return { ...prev, [msgId]: [...current, emoji] };
    });

    try {
      await axiosServices.post(
        `/api/chat/channels/messages/${msgId}/react?emoji=${encodeURIComponent(emoji)}`
      );
    } catch (e) {
      console.error('Failed to react', e);
    }
  };

  // Delete message(s)
  const handleDeleteMessage = async (msgId) => {
    try {
      await axiosServices.delete('/api/chat/channels/messages', {
        params: { msgIds: msgId, deleteType: 'FOR_EVERYONE' }
      });
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  // Delete entire conversation
  const handleDeleteChat = async () => {
    if (!activeChannel) return;
    if (String(activeChannel.id).startsWith('temp-')) {
      setActiveChannel(null);
      setMessages([]);
      return;
    }
    try {
      await axiosServices.delete(`/api/chat/channels/${activeChannel.id}`);
      delete messageCacheRef.current[activeChannel.id];
      setActiveChannel(null);
      setMessages([]);
      fetchChannels();
    } catch (e) {
      console.error('Failed to delete chat', e);
    }
  };

  // Start Voice or Video Call connected to GlobalIncomingCallHandler
  const handleStartCall = (isVideo) => {
    if (!activeChannel) return;
    const isDirect = activeChannel.channelType === 'DIRECT';
    let targetUser = isDirect
      ? activeChannel.members?.find((m) => String(m.userId).toLowerCase() !== String(currentUserId).toLowerCase()) || activeChannel.members?.[0]
      : null;

    if (isDirect && targetUser) {
      startUniversalCall({
        callType: 'DIRECT',
        targetUser: {
          userId: targetUser.userId,
          employeeName: targetUser.employeeName || targetUser.name || activeChannel.channelName,
          imgName: targetUser.imgName
        },
        title: targetUser.employeeName || activeChannel.channelName,
        subtitle: isVideo ? 'Video Call' : 'Voice Call',
        video: isVideo
      });
    } else {
      // Group Call
      startUniversalCall({
        callType: 'GROUP_MEETING',
        title: activeChannel.channelName || 'Group Meeting',
        subtitle: `${activeChannel.members?.length || 0} participants`,
        participants: (activeChannel.members || []).map((m) => ({
          userId: m.userId,
          employeeName: m.employeeName,
          name: m.employeeName
        })),
        video: isVideo
      });
    }
  };

  // Selection Mode Helpers
  const toggleSelectMessage = (msg) => {
    setSelectedMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev.filter((m) => m.id !== msg.id) : [...prev, msg]
    );
  };

  const handleOpenForwardDialog = (msg) => {
    if (msg) setSelectedMessages([msg]);
    setForwardDialogOpen(true);
  };

  const handleExecuteForward = async () => {
    if (forwardSelectedChannels.length === 0 || selectedMessages.length === 0) return;

    for (const chanId of forwardSelectedChannels) {
      for (const msg of selectedMessages) {
        try {
          await axiosServices.post('/api/chat/channels/messages', {
            channelId: chanId,
            messageContent: msg.messageContent,
            messageType: msg.messageType,
            attachmentUrl: msg.attachmentUrl,
            attachmentName: msg.attachmentName
          });
        } catch (e) {}
      }
    }

    setForwardDialogOpen(false);
    setSelectedMessages([]);
    setSelectionMode(false);
    fetchChannels();
  };

  // Theme-derived ERP wallpaper pattern
  const wallpaperPattern = `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 10%, transparent 11%), radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.main, 0.04)} 15%, transparent 16%)`;

  return (
    <Box
      sx={{
        width: '100%',
        height: 'calc(100vh - 85px)',
        display: 'flex',
        overflow: 'hidden',
        bgcolor: isDark ? theme.palette.background.default : alpha(theme.palette.primary.main, 0.02),
        borderRadius: { xs: 0, md: '16px' },
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        position: 'relative'
      }}
    >
      {/* 1. Left Sidebar (Chats List / New Conversation) */}
      {(!isMobile || !activeChannel) && (
        <ChatDrawer
          openChatDrawer={true}
          setChannel={handleSelectChannel}
          channels={channels}
          activeChannel={activeChannel}
          currentUserId={currentUserId}
          isMobile={isMobile}
        />
      )}

      {/* 2. Main Conversation Pane */}
      {(!isMobile || activeChannel) && (
        <Box
          sx={{
            flexGrow: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: isDark ? theme.palette.background.default : '#f8fafc',
            backgroundImage: wallpaperPattern,
            backgroundSize: '240px 240px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {activeChannel ? (
            <>
              {/* Top Bar Header */}
              <ChatHeader
                channel={activeChannel}
                currentUserId={currentUserId}
                onBack={() => setActiveChannel(null)}
                onOpenDetails={() => setOpenDetails((prev) => !prev)}
                onStartCall={handleStartCall}
                onToggleSelectionMode={() => setSelectionMode((prev) => !prev)}
                onDeleteChat={handleDeleteChat}
                onSearchClick={() => setOpenDetails(true)}
                isMobile={isMobile}
              />

              {/* Selection Mode Action Banner */}
              {selectionMode && (
                <Box
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText || '#ffffff',
                    px: 2,
                    py: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 3
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 700 }}>
                    {selectedMessages.length} selected
                  </Typography>

                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenForwardDialog()}
                      disabled={selectedMessages.length === 0}
                      sx={{ color: 'inherit' }}
                    >
                      <ForwardToInboxTwoToneIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => {
                        selectedMessages.forEach((m) => handleDeleteMessage(m.id));
                        setSelectedMessages([]);
                        setSelectionMode(false);
                      }}
                      disabled={selectedMessages.length === 0}
                      sx={{ color: 'inherit' }}
                    >
                      <DeleteTwoToneIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedMessages([]);
                        setSelectionMode(false);
                      }}
                      sx={{ color: 'inherit' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              )}

              {/* Message History Canvas */}
              <Box
                ref={messagesScrollRef}
                sx={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                <ChartHistory
                  data={messages}
                  currentUserId={currentUserId}
                  isGroup={activeChannel.channelType === 'GROUP' || activeChannel.isGroup}
                  onReply={(msg) => setReplyingTo(msg)}
                  onForward={(msg) => handleOpenForwardDialog(msg)}
                  onDelete={handleDeleteMessage}
                  onReact={handleReact}
                  reactions={reactions}
                  selectionMode={selectionMode}
                  selectedMessages={selectedMessages}
                  onToggleSelect={toggleSelectMessage}
                />
              </Box>

              {/* Floating Input Bar */}
              <ChatInputBar
                onSendMessage={handleSendMessage}
                onSendVoiceNote={handleSendVoiceNote}
                onUploadFile={handleUploadFile}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                smartReplies={smartReplies}
                onSelectSmartReply={(reply) => handleSendMessage(reply)}
              />
            </>
          ) : (
            /* Empty State Placeholder (Desktop) */
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                textAlign: 'center',
                bgcolor: isDark ? theme.palette.background.paper : '#f8fafc',
                borderBottom: '6px solid',
                borderColor: theme.palette.primary.main
              }}
            >
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  width: 80,
                  height: 80,
                  mb: 3,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                }}
              >
                <ChatIcon sx={{ fontSize: '2.5rem' }} />
              </Avatar>

              <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 1 }}>
                Autonova Connect
              </Typography>

              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 460, lineHeight: 1.6 }}>
                Send and receive real-time messages, voice notes, and documents with end-to-end encryption across your entire organization.
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* 3. Contact / Group Details Sliding Panel */}
      <Drawer
        anchor="right"
        open={openDetails && Boolean(activeChannel)}
        onClose={() => setOpenDetails(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 380 },
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
              borderLeft: '1px solid',
              borderColor: 'divider'
            }
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, bgcolor: theme.palette.background.paper, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => setOpenDetails(false)} size="small">
              <CloseIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {activeChannel?.channelType === 'GROUP' || activeChannel?.isGroup ? 'Group Info' : 'Contact Info'}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <UserDetails
              channel={activeChannel}
              currentUserId={currentUserId}
              startCall={handleStartCall}
              messages={messages}
            />
          </Box>
        </Box>
      </Drawer>

      {/* 4. Forward Message Modal */}
      <Dialog
        open={forwardDialogOpen}
        onClose={() => setForwardDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: '16px', p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Forward message to</DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <OutlinedInput
            fullWidth
            size="small"
            value={forwardSearch}
            onChange={(e) => setForwardSearch(e.target.value)}
            placeholder="Search chats..."
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            }
            sx={{ mb: 1, borderRadius: '12px' }}
          />

          <List sx={{ maxHeight: 260, overflowY: 'auto' }}>
            {channels
              .filter((c) =>
                !forwardSearch ||
                c.channelName?.toLowerCase().includes(forwardSearch.toLowerCase())
              )
              .map((c) => {
                const isChecked = forwardSelectedChannels.includes(c.id);
                return (
                  <ListItemButton
                    key={c.id}
                    onClick={() =>
                      setForwardSelectedChannels((prev) =>
                        prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                      )
                    }
                    sx={{ py: 0.75, borderRadius: '8px' }}
                  >
                    <Checkbox checked={isChecked} edge="start" tabIndex={-1} disableRipple />
                    <ListItemAvatar sx={{ minWidth: 42 }}>
                      <Avatar
                        src={c.imgName ? getUserImageUrl(c.imgName) : ''}
                        sx={{ width: 34, height: 34, fontSize: '0.85rem' }}
                      >
                        {c.channelName?.[0] || 'C'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={c.channelName} />
                  </ListItemButton>
                );
              })}
          </List>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setForwardDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleExecuteForward}
            variant="contained"
            disabled={forwardSelectedChannels.length === 0}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText || '#ffffff',
              '&:hover': { bgcolor: theme.palette.primary.dark },
              borderRadius: '8px',
              px: 3
            }}
          >
            Forward
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
