import PropTypes from 'prop-types';
import React, { memo, useState, useRef, useEffect, useMemo } from 'react';

// material-ui
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Slider from '@mui/material/Slider';
import Avatar from '@mui/material/Avatar';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';

// Icons
import DoneTwoToneIcon from '@mui/icons-material/DoneTwoTone';
import DoneAllTwoToneIcon from '@mui/icons-material/DoneAllTwoTone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReplyTwoToneIcon from '@mui/icons-material/ReplyTwoTone';
import ForwardToInboxTwoToneIcon from '@mui/icons-material/ForwardToInboxTwoTone';
import ContentCopyTwoToneIcon from '@mui/icons-material/ContentCopyTwoTone';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MicIcon from '@mui/icons-material/Mic';
import InsertDriveFileTwoToneIcon from '@mui/icons-material/InsertDriveFileTwoTone';
import DownloadTwoToneIcon from '@mui/icons-material/DownloadTwoTone';
import PhoneMissedTwoToneIcon from '@mui/icons-material/PhoneMissedTwoTone';
import VideocamOffTwoToneIcon from '@mui/icons-material/VideocamOffTwoTone';
import AddReactionOutlinedIcon from '@mui/icons-material/AddReactionOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { getFileViewUrl, getFileDownloadUrl } from 'utils/upload-helper';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return getFileViewUrl(url);
};

const resolveDownloadUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  return getFileDownloadUrl(url);
};

// Dynamic theme sender colors based on primary & secondary
const getSenderColor = (name = '', theme) => {
  const colors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.info?.main || '#0288d1',
    theme.palette.success?.main || '#2e7d32',
    theme.palette.warning?.main || '#ed6c02',
    '#9c27b0'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// Theme-driven WhatsApp Audio Player
const WhatsAppAudioPlayer = memo(function WhatsAppAudioPlayer({ src, isSent }) {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef(null);

  const finalSrc = resolveMediaUrl(src);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const dur = audio.duration;
      if (dur && isFinite(dur) && dur > 0) {
        setProgress((audio.currentTime / dur) * 100);
      }
    };

    const setAudioData = () => {
      const dur = audio.duration;
      if (dur === Infinity || isNaN(dur)) {
        // Chromium WebM recorded audio duration resolution
        audio.currentTime = 1e101;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = updateProgress;
          audio.currentTime = 0;
          if (isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
          }
        };
      } else if (isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      if (audio) audio.currentTime = 0;
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('durationchange', setAudioData);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('durationchange', setAudioData);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (event, newValue) => {
    if (!audioRef.current || !duration || !isFinite(duration)) return;
    const newTime = (newValue / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(newValue);
  };

  const toggleSpeed = () => {
    if (!audioRef.current) return;
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    audioRef.current.playbackRate = nextSpeed;
    setSpeed(nextSpeed);
  };

  const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null || !isFinite(seconds) || isNaN(seconds) || seconds <= 0) {
      return '0:00';
    }
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const barHeights = useMemo(() => [
    30, 45, 75, 60, 90, 40, 65, 85, 50, 70, 95, 45, 60, 80, 55, 75, 90, 40, 65, 85, 50, 70, 60, 40
  ], []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: { xs: 210, sm: 250 }, gap: 1, py: 0.5 }}>
      <audio ref={audioRef} src={finalSrc} preload="metadata" />

      <IconButton
        onClick={togglePlay}
        size="small"
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText || '#ffffff',
          width: 38,
          height: 38,
          '&:hover': { bgcolor: theme.palette.primary.dark }
        }}
      >
        {isPlaying ? <PauseIcon sx={{ fontSize: '1.25rem' }} /> : <PlayArrowIcon sx={{ fontSize: '1.25rem' }} />}
      </IconButton>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ position: 'relative', height: 26, display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 0.5,
              pointerEvents: 'none'
            }}
          >
            {barHeights.map((h, i) => (
              <Box
                key={i}
                sx={{
                  width: 2.5,
                  height: `${h}%`,
                  bgcolor: progress > (i / barHeights.length) * 100 ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.25),
                  borderRadius: '2px',
                  transition: 'background-color 0.1s'
                }}
              />
            ))}
          </Box>

          <Slider
            value={progress}
            onChange={handleSliderChange}
            size="small"
            sx={{
              position: 'absolute',
              inset: 0,
              height: '100%',
              p: 0,
              opacity: 0,
              cursor: 'pointer'
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.25 }}>
          <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 600 }}>
            {formatTime(isPlaying ? (progress / 100) * duration : duration)}
          </Typography>
          <Box
            component="button"
            onClick={toggleSpeed}
            sx={{
              border: 'none',
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: theme.palette.primary.main,
              fontSize: '0.65rem',
              fontWeight: 700,
              borderRadius: '8px',
              px: 0.75,
              py: 0.2,
              cursor: 'pointer'
            }}
          >
            {speed}x
          </Box>
        </Box>
      </Box>

      <Avatar
        sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.15),
          color: theme.palette.primary.main,
          width: 32,
          height: 32
        }}
      >
        <MicIcon sx={{ fontSize: '1rem' }} />
      </Avatar>
    </Box>
  );
});

WhatsAppAudioPlayer.propTypes = {
  src: PropTypes.string,
  isSent: PropTypes.bool
};

function MessageBubbleComponent({
  message,
  currentUserId,
  isGroup,
  onReply,
  onForward,
  onDelete,
  onReact,
  reactions = [],
  selectionMode,
  isSelected,
  onToggleSelect
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [anchorEl, setAnchorEl] = useState(null);
  const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
  const isSent = message.senderId === currentUserId;

  // Resolve reply metadata (either from object or embedded prefix)
  let replyData = message.replyToMessage;
  let displayContent = message.messageContent || '';

  if (!replyData && displayContent.startsWith('>>>REPLY:') && displayContent.includes('<<<\n')) {
    try {
      const endIdx = displayContent.indexOf('<<<\n');
      const jsonStr = displayContent.slice(9, endIdx);
      const parsed = JSON.parse(jsonStr);
      replyData = {
        id: parsed.id,
        senderName: parsed.senderName,
        messageContent: parsed.content
      };
      displayContent = displayContent.slice(endIdx + 4);
    } catch (e) {}
  }

  const isMissedCall =
    displayContent.toLowerCase().includes('missed voice call') ||
    displayContent.toLowerCase().includes('missed video call');

  const handleOpenMenu = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleCloseMenu = () => setAnchorEl(null);

  const handleOpenReactions = (e) => {
    e.stopPropagation();
    setReactionAnchorEl(e.currentTarget);
  };

  const handleCloseReactions = () => setReactionAnchorEl(null);

  const handleSelectReaction = (emoji) => {
    if (onReact) onReact(message.id, emoji);
    handleCloseReactions();
  };

  const formatMessageTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  // Theme-driven dynamic bubble colors (Based on primary & secondary theme palette)
  const outgoingBg = isDark
    ? alpha(theme.palette.primary.main, 0.3)
    : alpha(theme.palette.primary.light || theme.palette.primary.main, 0.22);

  const incomingBg = isDark ? theme.palette.background.paper : '#ffffff';

  const bubbleBg = isSent ? outgoingBg : incomingBg;
  const textColor = theme.palette.text.primary;
  const metaColor = alpha(theme.palette.text.primary, 0.65);

  const mediaViewUrl = resolveMediaUrl(message.attachmentUrl);
  const mediaDownloadUrl = resolveDownloadUrl(message.attachmentUrl);

  return (
    <Box
      id={`msg-${message.id}`}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: isSent ? 'flex-end' : 'flex-start',
        position: 'relative',
        px: { xs: 0.5, sm: 1 },
        my: 0.35,
        '&:hover .msg-actions': { opacity: 1 }
      }}
    >
      {selectionMode && (
        <Checkbox
          checked={isSelected}
          onChange={() => onToggleSelect && onToggleSelect(message)}
          size="small"
          sx={{ mr: 1, alignSelf: 'center' }}
        />
      )}

      <Box
        sx={{
          maxWidth: { xs: '85%', sm: '75%', md: '65%' },
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isSent ? 'flex-end' : 'flex-start'
        }}
      >
        <Paper
          elevation={1}
          sx={{
            bgcolor: bubbleBg,
            color: textColor,
            borderRadius: isSent ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
            p: '6px 10px 5px 10px',
            border: '1px solid',
            borderColor: isSent ? alpha(theme.palette.primary.main, 0.25) : alpha(theme.palette.divider, 0.6),
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            position: 'relative',
            wordBreak: 'break-word'
          }}
        >
          {/* Group Sender Name with dynamic theme color */}
          {isGroup && !isSent && message.senderName && (
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: '0.78rem',
                color: getSenderColor(message.senderName, theme),
                mb: 0.25,
                lineHeight: 1.2
              }}
            >
              {message.senderName}
            </Typography>
          )}

          {/* Reply Quote Preview */}
          {replyData && (
            <Box
              onClick={(e) => {
                e.stopPropagation();
                if (replyData?.id) {
                  const targetEl = document.getElementById(`msg-${replyData.id}`);
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetEl.style.transition = 'background-color 0.3s ease';
                    targetEl.style.backgroundColor = alpha(theme.palette.primary.main, 0.15);
                    setTimeout(() => {
                      targetEl.style.backgroundColor = '';
                    }, 1200);
                  }
                }
              }}
              sx={{
                borderLeft: '4px solid',
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                p: '4px 8px',
                borderRadius: '4px',
                mb: 0.75,
                maxWidth: '100%',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.14)
                }
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, display: 'block' }}>
                {replyData.senderName || 'Reply'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.72rem',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {replyData.messageContent || 'Attachment'}
              </Typography>
            </Box>
          )}

          {/* Message Content */}
          {isMissedCall ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', py: 0.5 }}>
              {displayContent.toLowerCase().includes('video') ? (
                <VideocamOffTwoToneIcon sx={{ color: 'error.main', fontSize: '1.2rem' }} />
              ) : (
                <PhoneMissedTwoToneIcon sx={{ color: 'error.main', fontSize: '1.2rem' }} />
              )}
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main', fontSize: '0.85rem' }}>
                {displayContent}
              </Typography>
            </Stack>
          ) : message.messageType === 'AUDIO' || displayContent.startsWith('[AUDIO]') ? (
            <WhatsAppAudioPlayer src={message.attachmentUrl || displayContent.replace('[AUDIO]', '')} isSent={isSent} />
          ) : message.messageType === 'IMAGE' || (message.attachmentUrl && message.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
            <Box sx={{ mb: 0.5, borderRadius: '8px', overflow: 'hidden' }}>
              <Box
                component="img"
                src={mediaViewUrl}
                alt="Attachment"
                sx={{
                  width: '100%',
                  maxHeight: 280,
                  objectFit: 'cover',
                  borderRadius: '8px',
                  display: 'block',
                  cursor: 'pointer'
                }}
                onClick={() => window.open(mediaViewUrl, '_blank')}
              />
              {displayContent && displayContent !== 'Sent an image' && (
                <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.88rem' }}>
                  {displayContent}
                </Typography>
              )}
            </Box>
          ) : message.messageType === 'DOCUMENT' || message.attachmentUrl ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                p: 1,
                borderRadius: '8px',
                mb: 0.5
              }}
            >
              <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 36, height: 36 }}>
                <InsertDriveFileTwoToneIcon sx={{ fontSize: '1.2rem', color: '#fff' }} />
              </Avatar>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.82rem', noWrap: true }}>
                  {message.attachmentName || 'Document'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  File attachment
                </Typography>
              </Box>
              <IconButton size="small" component="a" href={mediaDownloadUrl} download target="_blank">
                <DownloadTwoToneIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
              </IconButton>
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.9rem',
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                pr: 3.5
              }}
            >
              {displayContent}
            </Typography>
          )}

          {/* Timestamp & Status Checkmarks */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 0.4,
              mt: 0.25,
              ml: 'auto',
              float: 'right'
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.66rem',
                color: metaColor,
                fontWeight: 500,
                userSelect: 'none'
              }}
            >
              {formatMessageTime(message.createdAt || message.timestamp || message.sentAt)}
            </Typography>

            {isSent && (
              message.isSending ? (
                <AccessTimeIcon sx={{ fontSize: '0.75rem', color: metaColor }} />
              ) : message.isRead ? (
                <DoneAllTwoToneIcon sx={{ fontSize: '0.95rem', color: theme.palette.primary.main }} />
              ) : message.isDelivered ? (
                <DoneAllTwoToneIcon sx={{ fontSize: '0.95rem', color: metaColor }} />
              ) : (
                <DoneTwoToneIcon sx={{ fontSize: '0.95rem', color: metaColor }} />
              )
            )}
          </Box>

          <Box sx={{ clear: 'both' }} />

          {/* Action trigger button */}
          <IconButton
            className="msg-actions"
            size="small"
            onClick={handleOpenMenu}
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              opacity: 0,
              transition: 'opacity 0.15s',
              bgcolor: isDark ? alpha(theme.palette.background.paper, 0.9) : 'rgba(255,255,255,0.9)',
              p: 0.2,
              '&:hover': { bgcolor: theme.palette.background.paper }
            }}
          >
            <KeyboardArrowDownIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
          </IconButton>
        </Paper>

        {/* Reaction Badges */}
        {reactions && reactions.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              bgcolor: theme.palette.background.paper,
              borderRadius: '12px',
              px: 0.75,
              py: 0.1,
              mt: -0.75,
              ml: isSent ? 'auto' : 1,
              mr: isSent ? 1 : 'auto',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              zIndex: 1
            }}
          >
            {reactions.slice(0, 3).map((r, i) => (
              <Typography key={i} sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
                {r}
              </Typography>
            ))}
            {reactions.length > 1 && (
              <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary' }}>
                {reactions.length}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '10px',
              minWidth: 140,
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
            }
          }
        }}
      >
        <MenuItem
          onClick={() => {
            onReply && onReply(message);
            handleCloseMenu();
          }}
          sx={{ py: 1, gap: 1.5, fontSize: '0.85rem' }}
        >
          <ReplyTwoToneIcon fontSize="small" sx={{ color: theme.palette.primary.main }} /> Reply
        </MenuItem>

        <MenuItem
          onClick={handleOpenReactions}
          sx={{ py: 1, gap: 1.5, fontSize: '0.85rem' }}
        >
          <AddReactionOutlinedIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} /> React
        </MenuItem>

        <MenuItem
          onClick={() => {
            onForward && onForward(message);
            handleCloseMenu();
          }}
          sx={{ py: 1, gap: 1.5, fontSize: '0.85rem' }}
        >
          <ForwardToInboxTwoToneIcon fontSize="small" /> Forward
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (message.messageContent) navigator.clipboard.writeText(message.messageContent);
            handleCloseMenu();
          }}
          sx={{ py: 1, gap: 1.5, fontSize: '0.85rem' }}
        >
          <ContentCopyTwoToneIcon fontSize="small" /> Copy
        </MenuItem>

        {isSent && (
          <MenuItem
            onClick={() => {
              onDelete && onDelete(message.id);
              handleCloseMenu();
            }}
            sx={{ py: 1, gap: 1.5, fontSize: '0.85rem', color: 'error.main' }}
          >
            <DeleteTwoToneIcon fontSize="small" /> Delete
          </MenuItem>
        )}
      </Menu>

      {/* Quick Reaction Bar */}
      <Popover
        open={Boolean(reactionAnchorEl)}
        anchorEl={reactionAnchorEl}
        onClose={handleCloseReactions}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              p: 0.75,
              borderRadius: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              bgcolor: theme.palette.background.paper
            }
          }
        }}
      >
        <Stack direction="row" spacing={0.5}>
          {QUICK_REACTIONS.map((emoji) => (
            <IconButton
              key={emoji}
              size="small"
              onClick={() => handleSelectReaction(emoji)}
              sx={{
                fontSize: '1.25rem',
                p: 0.5,
                transition: 'transform 0.15s',
                '&:hover': { transform: 'scale(1.25)' }
              }}
            >
              {emoji}
            </IconButton>
          ))}
        </Stack>
      </Popover>
    </Box>
  );
}

MessageBubbleComponent.propTypes = {
  message: PropTypes.object.isRequired,
  currentUserId: PropTypes.string.isRequired,
  isGroup: PropTypes.bool,
  onReply: PropTypes.func,
  onForward: PropTypes.func,
  onDelete: PropTypes.func,
  onReact: PropTypes.func,
  reactions: PropTypes.array,
  selectionMode: PropTypes.bool,
  isSelected: PropTypes.bool,
  onToggleSelect: PropTypes.func
};

const MessageBubble = memo(MessageBubbleComponent);
export default MessageBubble;
