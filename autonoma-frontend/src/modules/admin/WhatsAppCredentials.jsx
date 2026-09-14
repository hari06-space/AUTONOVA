import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Paper,
  InputBase,
  IconButton,
  CircularProgress,
  Stack,
  Chip,
  Alert,
  Tooltip,
  InputAdornment
} from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axios';

// Icons
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChatIcon from '@mui/icons-material/Chat';
import KeyIcon from '@mui/icons-material/VpnKey';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DeleteIcon from '@mui/icons-material/Delete';
import VideocamIcon from '@mui/icons-material/Videocam';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PushPinIcon from '@mui/icons-material/PushPin';
import AddIcon from '@mui/icons-material/Add';

const ChatBubble = styled(Box)(({ theme, isMe }) => ({
  position: 'relative',
  maxWidth: '75%',
  padding: '8px 12px 6px 12px',
  borderRadius: isMe ? '8px 0px 8px 8px' : '0px 8px 8px 8px',
  backgroundColor: isMe
    ? (theme.palette.mode === 'dark' ? '#005c4b' : '#d9fdd3')
    : (theme.palette.mode === 'dark' ? '#202c33' : '#ffffff'),
  color: theme.palette.mode === 'dark' ? '#e9edef' : '#111b21',
  boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
  alignSelf: isMe ? 'flex-end' : 'flex-start',
  margin: '2px 0',
  wordBreak: 'break-word',
  fontFamily: 'Segoe UI, Helvetica Neue, Helvetica, Lucida Grande, Arial, Ubuntu, Cantarell, Fira Sans, sans-serif',
  fontSize: '14.2px',
  lineHeight: '19px',
  display: 'flex',
  flexDirection: 'column',
  '&:hover .delete-action': {
    opacity: 1
  }
}));

const WhatsAppCredentials = () => {
  const theme = useTheme();
  
  // Credentials & Settings
  const [instanceId, setInstanceId] = useState(localStorage.getItem('ultramsg_instance_id') || '');
  const [token, setToken] = useState(localStorage.getItem('ultramsg_token') || '');
  const [limit, setLimit] = useState(100);
  const [isConnected, setIsConnected] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);
  
  // Data State
  const [chats, setChats] = useState([]);
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Unread', 'Favourites'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chats on load if credentials exist
  useEffect(() => {
    if (instanceId && token) {
      handleFetchChats();
    }
  }, []);

  const handleFetchChats = async () => {
    if (!instanceId || !token) {
      setError('Please provide both Instance ID and Token');
      return;
    }

    setLoadingChats(true);
    setError(null);
    try {
      // Save credentials in local storage
      localStorage.setItem('ultramsg_instance_id', instanceId);
      localStorage.setItem('ultramsg_token', token);

      const response = await axios.get('/api/whatsapp/chats', {
        params: { instanceId, token }
      });

      if (Array.isArray(response.data)) {
        setChats(response.data);
        setIsConnected(true);
      } else if (response.data && response.data.error) {
        setError(response.data.error.message || 'Failed to connect to UltraMsg');
        setIsConnected(false);
      } else {
        setError('Unexpected response from UltraMsg. Check your credentials.');
        setIsConnected(false);
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed. Please check your credentials and network.');
      setIsConnected(false);
    } finally {
      setLoadingChats(false);
    }
  };

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    try {
      const response = await axios.get('/api/whatsapp/messages', {
        params: {
          instanceId,
          token,
          chatId: chat.id,
          limit: limit
        }
      });
      if (Array.isArray(response.data)) {
        // Filter out deleted/revoked messages
        const visibleMessages = response.data.filter(
          (msg) => msg && msg.type !== 'revoked' && msg.type !== 'deleted' && !msg.isDeleted
        );
        setMessages(visibleMessages.reverse());
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch messages for ' + chat.name);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    setSending(true);
    const body = newMessage;
    setNewMessage('');

    try {
      const response = await axios.post('/api/whatsapp/send', null, {
        params: {
          instanceId,
          token,
          to: selectedChat.id,
          body: body
        }
      });

      if (response.data && response.data.sent === 'true') {
        // Optimistically add message to current chat messages list
        const localMsg = {
          id: response.data.id || Math.random().toString(),
          fromMe: true,
          body: body,
          timestamp: Math.floor(Date.now() / 1000),
          type: 'chat'
        };
        setMessages((prev) => [...prev, localMsg]);
      } else {
        setError('Failed to send message.');
      }
    } catch (err) {
      console.error(err);
      setError('Error sending message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const response = await axios.post('/api/whatsapp/delete', null, {
        params: {
          instanceId,
          token,
          msgId
        }
      });

      const res = response.data;
      const hasError = res && (res.error || res.status === 'error' || res.success === 'false' || res.success === false);
      const isSuccess = res && !hasError && (res.success || res.sent || res.id || res.message);

      if (isSuccess) {
        // Completely remove message from UI with no trace
        setMessages((prev) => prev.filter((msg) => msg.id !== msgId));
      } else {
        const errMsg = res?.error?.message || res?.error || res?.message || 'Verify message belongs to you and is recent.';
        setError('Failed to delete message: ' + errMsg);
      }
    } catch (err) {
      console.error(err);
      const serverMsg = err.response?.data?.error?.message || err.response?.data?.error || err.message;
      setError('Error deleting message: ' + serverMsg);
    }
  };

  const filteredChats = chats.filter((c) => {
    // Search filter
    const matchesSearch =
      (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.id && c.id.includes(searchQuery));

    // Tab filter
    if (!matchesSearch) return false;
    if (activeTab === 'Unread') return c.unread > 0;
    return true; // 'All' & 'Favourites'
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Helper to color member names in group chats
  const getMemberColor = (name) => {
    if (!name) return '#075E54';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 40%)`;
  };

  return (
    <MainCard title="WhatsApp Credentials">
      <Grid container spacing={3}>

        {/* Credentials & Limit Form */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ background: theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc', borderColor: theme.palette.divider }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                <KeyIcon color="primary" /> Credentials & Limit Configuration
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Enter your UltraMsg details. Set a message limit to control the number of conversation messages fetched.
              </Typography>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Instance ID"
                    variant="outlined"
                    value={instanceId}
                    onChange={(e) => setInstanceId(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="UltraMsg Token"
                    type="password"
                    variant="outlined"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Message Limit"
                    type="number"
                    variant="outlined"
                    value={limit}
                    onChange={(e) => setLimit(Math.max(1, Number(e.target.value)))}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    onClick={handleFetchChats}
                    disabled={loadingChats}
                    startIcon={loadingChats ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
                  >
                    {isConnected ? 'Refresh' : 'Connect'}
                  </Button>
                </Grid>
              </Grid>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Messaging Interface */}
        {isConnected && (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ height: '700px', display: 'flex', overflow: 'hidden', borderRadius: '8px' }}>
              <Grid container sx={{ height: '100%' }}>

                {/* Chat List (Left Pane - WhatsApp style) */}
                <Grid
                  item
                  xs={4}
                  sx={{
                    borderRight: '1px solid',
                    borderColor: theme.palette.divider,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    backgroundColor: theme.palette.mode === 'dark' ? '#111b21' : '#ffffff'
                  }}
                >
                  {/* Left Header */}
                  <Box sx={{ p: 2.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.palette.mode === 'dark' ? '#202c33' : '#f0f2f5' }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: theme.palette.mode === 'dark' ? '#e9edef' : '#111b21' }}>
                      Chats
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small">
                        <AddIcon fontSize="small" sx={{ color: theme.palette.mode === 'dark' ? '#a0aab4' : '#54656f' }} />
                      </IconButton>
                      <IconButton size="small">
                        <MoreVertIcon fontSize="small" sx={{ color: theme.palette.mode === 'dark' ? '#a0aab4' : '#54656f' }} />
                      </IconButton>
                    </Stack>
                  </Box>

                  {/* Search box */}
                  <Box sx={{ px: 2, py: 1.5, backgroundColor: theme.palette.mode === 'dark' ? '#111b21' : '#ffffff' }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search or start a new chat"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme.palette.mode === 'dark' ? '#202c33' : '#f0f2f5',
                          border: 'none',
                          borderRadius: '8px',
                          '& fieldset': { border: 'none' }
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" sx={{ color: theme.palette.mode === 'dark' ? '#a0aab4' : '#54656f' }} />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Box>

                  {/* Filter Tabs/Chips */}
                  <Stack direction="row" spacing={1} sx={{ px: 2, pb: 1.5, overflowX: 'auto' }}>
                    {['All', 'Unread', 'Favourites'].map((tab) => (
                      <Chip
                        key={tab}
                        label={tab}
                        onClick={() => setActiveTab(tab)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: activeTab === tab
                            ? (theme.palette.mode === 'dark' ? '#0a3321' : '#e7f7ef')
                            : (theme.palette.mode === 'dark' ? '#202c33' : '#f0f2f5'),
                          color: activeTab === tab ? '#008069' : 'text.primary',
                          fontWeight: activeTab === tab ? 'bold' : 'normal',
                          '&:hover': {
                            backgroundColor: activeTab === tab
                              ? (theme.palette.mode === 'dark' ? '#0a3321' : '#e7f7ef')
                              : (theme.palette.mode === 'dark' ? '#2a3942' : '#eaeaea')
                          }
                        }}
                      />
                    ))}
                  </Stack>
                  <Divider />

                  {/* Chats List */}
                  <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    {loadingChats ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress color="success" />
                      </Box>
                    ) : filteredChats.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="textSecondary">No chats found.</Typography>
                      </Box>
                    ) : (
                      <List disablePadding>
                        {filteredChats.map((chat) => {
                          const isSelected = selectedChat?.id === chat.id;
                          return (
                            <React.Fragment key={chat.id}>
                              <ListItem
                                button
                                onClick={() => handleSelectChat(chat)}
                                sx={{
                                  py: 1.5,
                                  backgroundColor: isSelected
                                    ? (theme.palette.mode === 'dark' ? '#2a3942' : '#f0f2f5')
                                    : 'transparent',
                                  '&:hover': {
                                    backgroundColor: theme.palette.mode === 'dark' ? '#202c33' : '#f5f6f6'
                                  }
                                }}
                              >
                                <ListItemAvatar>
                                  <Avatar src={chat.image || ''} alt={chat.name || chat.id}>
                                    <ChatIcon />
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme.palette.mode === 'dark' ? '#e9edef' : '#111b21' }}>
                                        {chat.name || chat.id.split('@')[0]}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#8696a0' }}>
                                        {chat.timestamp ? formatTime(chat.timestamp) : ''}
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                      <Typography variant="body2" noWrap sx={{ maxWidth: '85%', color: '#8696a0' }}>
                                        {chat.id}
                                      </Typography>
                                      {chat.unread > 0 && (
                                        <Chip
                                          label={chat.unread}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            minWidth: 20,
                                            backgroundColor: '#25D366',
                                            color: '#ffffff',
                                            fontWeight: 'bold',
                                            fontSize: '0.7rem'
                                          }}
                                        />
                                      )}
                                    </Box>
                                  }
                                />
                              </ListItem>
                              <Divider sx={{ ml: 9 }} />
                            </React.Fragment>
                          );
                        })}
                      </List>
                    )}
                  </Box>
                </Grid>

                {/* Conversation View (Right Pane - WhatsApp style) */}
                <Grid
                  item
                  xs={8}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    backgroundColor: theme.palette.mode === 'dark' ? '#0b141a' : '#efeae2',
                    backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                    backgroundRepeat: 'repeat',
                    backgroundBlendMode: theme.palette.mode === 'dark' ? 'overlay' : 'normal'
                  }}
                >
                  {selectedChat ? (
                    <>
                      {/* Active Chat Header */}
                      <Box
                        sx={{
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid',
                          borderColor: theme.palette.divider,
                          backgroundColor: theme.palette.mode === 'dark' ? '#202c33' : '#f0f2f5',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          zIndex: 1
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar src={selectedChat.image || ''} alt={selectedChat.name}>
                            <ChatIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: theme.palette.mode === 'dark' ? '#e9edef' : '#111b21' }}>
                              {selectedChat.name || selectedChat.id.split('@')[0]}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#8696a0' }}>
                              Karthi, NT, NT, Shibin, You
                            </Typography>
                          </Box>
                        </Stack>

                        <Stack direction="row" spacing={1}>
                          <IconButton>
                            <VideocamIcon sx={{ color: theme.palette.mode === 'dark' ? '#a0aab4' : '#54656f' }} />
                          </IconButton>
                          <IconButton>
                            <SearchIcon sx={{ color: theme.palette.mode === 'dark' ? '#a0aab4' : '#54656f' }} />
                          </IconButton>
                          <IconButton onClick={() => handleSelectChat(selectedChat)} disabled={loadingMessages}>
                            <RefreshIcon sx={{ color: theme.palette.mode === 'dark' ? '#a0aab4' : '#54656f' }} />
                          </IconButton>
                          <IconButton>
                            <MoreVertIcon sx={{ color: theme.palette.mode === 'dark' ? '#a0aab4' : '#54656f' }} />
                          </IconButton>
                        </Stack>
                      </Box>

                      {/* Pinned Info Bar */}
                      <Box
                        sx={{
                          px: 3,
                          py: 1,
                          backgroundColor: theme.palette.mode === 'dark' ? '#182229' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          borderBottom: '1px solid',
                          borderColor: theme.palette.divider,
                          zIndex: 1
                        }}
                      >
                        <PushPinIcon sx={{ color: '#8696a0', fontSize: '1.2rem', transform: 'rotate(45deg)' }} />
                        <Typography variant="body2" noWrap sx={{ color: theme.palette.mode === 'dark' ? '#d1d7db' : '#3b4a54', flexGrow: 1 }}>
                          <strong>NT Digi Tech:</strong> <a href="https://teams.microsoft.com/meet/49905990551098?p=HPyut08eWfcLqTKTAe" target="_blank" rel="noreferrer" style={{ color: '#008069', textDecoration: 'none' }}>https://teams.microsoft.com/meet/49905990551098?p=HPyut08eWfcLqTKTAe</a>
                        </Typography>
                      </Box>

                      {/* Messages Container */}
                      <Box
                        sx={{
                          flexGrow: 1,
                          overflowY: 'auto',
                          p: 3,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        {loadingMessages ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress color="success" />
                          </Box>
                        ) : messages.length === 0 ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography color="textSecondary">No messages found in this chat.</Typography>
                          </Box>
                        ) : (
                          messages.map((msg) => {
                            const isMe = msg.fromMe;
                            const authorName = msg.fromMe ? 'You' : (msg.author || msg.sender || msg.from?.split('@')[0] || 'Member');

                            return (
                              <Box
                                key={msg.id}
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: isMe ? 'flex-end' : 'flex-start'
                                }}
                              >
                                <ChatBubble isMe={isMe}>
                                  {/* Sender name for received messages in group style */}
                                  {!isMe && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: 'bold',
                                        color: getMemberColor(authorName),
                                        mb: 0.5,
                                        display: 'block'
                                      }}
                                    >
                                      {authorName}
                                    </Typography>
                                  )}

                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                                    <Typography variant="body1">
                                      {msg.body}
                                    </Typography>
                                    {!msg.isDeleted && isMe && (
                                      <IconButton
                                        className="delete-action"
                                        size="small"
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        sx={{
                                          p: 0,
                                          opacity: 0,
                                          transition: 'opacity 0.2s',
                                          color: theme.palette.mode === 'dark' ? '#a0aab4' : '#8696a0',
                                          '&:hover': { color: theme.palette.error.main }
                                        }}
                                      >
                                        <DeleteIcon sx={{ fontSize: '1rem' }} />
                                      </IconButton>
                                    )}
                                  </Box>

                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: 'block',
                                      textAlign: 'right',
                                      mt: 0.5,
                                      opacity: 0.7,
                                      fontSize: '0.65rem',
                                      color: '#8696a0'
                                    }}
                                  >
                                    {formatTime(msg.timestamp)} {isMe && <span style={{ color: '#53bdeb', marginLeft: '3px' }}>✓✓</span>}
                                  </Typography>
                                </ChatBubble>
                              </Box>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </Box>

                      {/* Send Message Input */}
                      <Box
                        component="form"
                        onSubmit={handleSendMessage}
                        sx={{
                          p: 1.5,
                          backgroundColor: theme.palette.mode === 'dark' ? '#202c33' : '#f0f2f5',
                          borderTop: '1px solid',
                          borderColor: theme.palette.divider
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <TextField
                            fullWidth
                            size="medium"
                            placeholder="Type a message"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={sending}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: theme.palette.mode === 'dark' ? '#2a3942' : '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                '& fieldset': { border: 'none' }
                              }
                            }}
                          />
                          <IconButton
                            type="submit"
                            disabled={sending || !newMessage.trim()}
                            sx={{
                              backgroundColor: '#008069',
                              color: '#ffffff',
                              '&:hover': { backgroundColor: '#006653' },
                              '&.Mui-disabled': { backgroundColor: 'action.disabledBackground', color: 'action.disabled' }
                            }}
                          >
                            {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                          </IconButton>
                        </Stack>
                      </Box>
                    </>
                  ) : (
                    // Default Empty State
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        gap: 2,
                        p: 3,
                        textAlign: 'center'
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          backgroundColor: '#25D366',
                          color: '#fff',
                          boxShadow: '0 8px 16px rgba(37, 211, 102, 0.2)'
                        }}
                      >
                        <WhatsAppIcon sx={{ fontSize: 50 }} />
                      </Avatar>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        WhatsApp Chat Viewer
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ maxWidth: '400px' }}>
                        Select a chat from the left pane to view the conversation history and send replies via UltraMsg.
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </MainCard>
  );
};

export default WhatsAppCredentials;
