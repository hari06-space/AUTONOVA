import PropTypes from 'prop-types';
import React, { useState, useRef, useEffect, memo } from 'react';

// material-ui
import { useTheme, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';

// Icons
import MoodTwoToneIcon from '@mui/icons-material/MoodTwoTone';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import CloseIcon from '@mui/icons-material/Close';
import ImageTwoToneIcon from '@mui/icons-material/ImageTwoTone';
import InsertDriveFileTwoToneIcon from '@mui/icons-material/InsertDriveFileTwoTone';
import AudiotrackTwoToneIcon from '@mui/icons-material/AudiotrackTwoTone';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

// Emoji Picker
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';

function ChatInputBarComponent({
  onSendMessage,
  onSendVoiceNote,
  onUploadFile,
  replyingTo,
  onCancelReply,
  smartReplies = [],
  onSelectSmartReply,
  disabled
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [text, setText] = useState('');
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [attachAnchorEl, setAttachAnchorEl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const isCancelledRef = useRef(false);

  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setText('');
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  // Voice recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      isCancelledRef.current = false;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (!isCancelledRef.current && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          onSendVoiceNote && onSendVoiceNote(audioBlob);
        }
        audioChunksRef.current = [];
        isCancelledRef.current = false;
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(250); // Collect 250ms chunks continuously
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      isCancelledRef.current = false;
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const cancelRecording = () => {
    isCancelledRef.current = true;
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordingDuration(0);
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await onUploadFile(file, type);
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
      setAttachAnchorEl(null);
    }
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.paper,
        borderTop: '1px solid',
        borderColor: 'divider',
        p: { xs: 1, sm: 1.25 },
        position: 'relative',
        zIndex: 2,
        flexShrink: 0
      }}
    >
      {/* Smart Replies Suggestions */}
      {smartReplies && smartReplies.length > 0 && !isRecording && (
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, pt: 0.25, '::-webkit-scrollbar': { display: 'none' } }}>
          {smartReplies.map((reply, i) => (
            <Chip
              key={i}
              label={reply}
              onClick={() => onSelectSmartReply && onSelectSmartReply(reply)}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: theme.palette.primary.main,
                fontWeight: 600,
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.2),
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                flexShrink: 0,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) }
              }}
            />
          ))}
        </Stack>
      )}

      {/* Replying To Banner */}
      {replyingTo && (
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            borderLeft: '4px solid',
            borderColor: theme.palette.primary.main,
            p: '6px 12px',
            borderRadius: '8px',
            mb: 1
          }}
        >
          <Box sx={{ minWidth: 0, pr: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main, display: 'block' }}>
              Replying to {replyingTo.senderName || 'Message'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {replyingTo.messageContent || 'Attachment'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}

      {/* Main Input Row */}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        {isRecording ? (
          /* Live Audio Recording Bar with Listening Soundwave Visualizer */
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexGrow: 1,
              bgcolor: alpha(theme.palette.error.main, 0.06),
              border: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.3),
              borderRadius: '24px',
              px: { xs: 1.5, sm: 2 },
              py: 0.75,
              gap: { xs: 1, sm: 1.5 }
            }}
          >
            {/* Live Pulsing Indicator & Duration */}
            <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', flexShrink: 0 }}>
              <FiberManualRecordIcon
                sx={{
                  color: 'error.main',
                  fontSize: '0.95rem',
                  animation: 'recordBlink 1s infinite ease-in-out',
                  '@keyframes recordBlink': {
                    '0%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.25, transform: 'scale(1.3)' },
                    '100%': { opacity: 1, transform: 'scale(1)' }
                  }
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'error.main', minWidth: 40, fontVariantNumeric: 'tabular-nums' }}>
                {formatSeconds(recordingDuration)}
              </Typography>
            </Stack>

            {/* Live Listening Soundwave Animation */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: { xs: '2.5px', sm: '3.5px' },
                flexGrow: 1,
                height: 26,
                px: 1,
                overflow: 'hidden'
              }}
            >
              {[35, 70, 50, 95, 65, 100, 45, 85, 60, 90, 40, 80, 70, 95, 50, 75, 90, 60, 40, 65, 85, 55, 75, 45].map((h, i) => (
                <Box
                  key={i}
                  sx={{
                    width: { xs: 2, sm: 3 },
                    height: '100%',
                    bgcolor: alpha(theme.palette.error.main, 0.85),
                    borderRadius: '2px',
                    animation: 'liveSoundWave 0.8s ease-in-out infinite alternate',
                    animationDelay: `${(i % 6) * 0.12}s`,
                    transformOrigin: 'center',
                    '@keyframes liveSoundWave': {
                      '0%': { transform: 'scaleY(0.15)', opacity: 0.4 },
                      '50%': { transform: `scaleY(${h / 100})`, opacity: 0.95 },
                      '100%': { transform: 'scaleY(0.25)', opacity: 0.5 }
                    }
                  }}
                />
              ))}
            </Box>

            {/* Action Buttons: Delete & Send */}
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
              <Tooltip title="Cancel recording">
                <IconButton
                  size="small"
                  onClick={cancelRecording}
                  sx={{
                    color: 'error.main',
                    p: 0.8,
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                    '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.18), transform: 'scale(1.05)' },
                    transition: 'all 0.15s ease'
                  }}
                >
                  <DeleteTwoToneIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Send audio">
                <IconButton
                  size="small"
                  onClick={stopAndSendRecording}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText || '#ffffff',
                    p: 0.8,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`,
                    '&:hover': { bgcolor: theme.palette.primary.dark, transform: 'scale(1.05)' },
                    transition: 'all 0.15s ease'
                  }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Paper>
        ) : (
          /* Standard Input Bar */
          <>
            {/* Emoji & Attachment Triggers */}
            <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
              <IconButton
                size="medium"
                onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
                sx={{ color: theme.palette.text.secondary, p: 1 }}
              >
                <MoodTwoToneIcon fontSize="small" />
              </IconButton>

              <IconButton
                size="medium"
                onClick={(e) => setAttachAnchorEl(e.currentTarget)}
                disabled={isUploading}
                sx={{ color: theme.palette.text.secondary, p: 1 }}
              >
                {isUploading ? <CircularProgress size={18} color="primary" /> : <AttachFileIcon fontSize="small" />}
              </IconButton>
            </Stack>

            {/* Input Box */}
            <Paper
              elevation={0}
              sx={{
                flexGrow: 1,
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '24px',
                px: 2,
                py: { xs: 0.5, sm: 0.75 },
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <InputBase
                inputRef={inputRef}
                fullWidth
                multiline
                maxRows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message"
                disabled={disabled}
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: '0.92rem',
                  lineHeight: 1.4,
                  '& textarea': {
                    padding: '2px 0'
                  }
                }}
              />
            </Paper>

            {/* Send or Voice Note Button */}
            {text.trim() ? (
              <IconButton
                onClick={handleSend}
                size="medium"
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText || '#ffffff',
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': { bgcolor: theme.palette.primary.dark }
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            ) : (
              <Tooltip title="Hold or click to record voice note">
                <IconButton
                  onClick={startRecording}
                  size="medium"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                    width: 42,
                    height: 42,
                    flexShrink: 0,
                    '&:hover': {
                      bgcolor: theme.palette.primary.main,
                      color: '#ffffff'
                    }
                  }}
                >
                  <MicIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Stack>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*,video/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'IMAGE')}
      />
      <input
        type="file"
        ref={docInputRef}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'DOCUMENT')}
      />
      <input
        type="file"
        ref={audioInputRef}
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'AUDIO')}
      />

      {/* Attachment Menu */}
      <Menu
        anchorEl={attachAnchorEl}
        open={Boolean(attachAnchorEl)}
        onClose={() => setAttachAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              p: 1,
              minWidth: 180,
              boxShadow: '0 6px 24px rgba(0,0,0,0.18)'
            }
          }
        }}
      >
        <MenuItem
          onClick={() => {
            imageInputRef.current?.click();
            setAttachAnchorEl(null);
          }}
          sx={{ gap: 2, py: 1.2, borderRadius: '10px' }}
        >
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: theme.palette.error.main, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <ImageTwoToneIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Photos & Videos
          </Typography>
        </MenuItem>

        <MenuItem
          onClick={() => {
            docInputRef.current?.click();
            setAttachAnchorEl(null);
          }}
          sx={{ gap: 2, py: 1.2, borderRadius: '10px' }}
        >
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: theme.palette.primary.main, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <InsertDriveFileTwoToneIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Document
          </Typography>
        </MenuItem>

        <MenuItem
          onClick={() => {
            audioInputRef.current?.click();
            setAttachAnchorEl(null);
          }}
          sx={{ gap: 2, py: 1.2, borderRadius: '10px' }}
        >
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: theme.palette.secondary.main, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <AudiotrackTwoToneIcon fontSize="small" />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Audio
          </Typography>
        </MenuItem>
      </Menu>

      {/* Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={() => setEmojiAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
              borderRadius: '16px',
              overflow: 'hidden'
            }
          }
        }}
      >
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT}
          searchDisabled={false}
          width={320}
          height={380}
        />
      </Popover>
    </Box>
  );
}

ChatInputBarComponent.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  onSendVoiceNote: PropTypes.func,
  onUploadFile: PropTypes.func.isRequired,
  replyingTo: PropTypes.object,
  onCancelReply: PropTypes.func,
  smartReplies: PropTypes.array,
  onSelectSmartReply: PropTypes.func,
  disabled: PropTypes.bool
};

const ChatInputBar = memo(ChatInputBarComponent);
export default ChatInputBar;
