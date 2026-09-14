import PropTypes from 'prop-types';
import React, { useState, memo } from 'react';

// material-ui
import { useTheme, alpha } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Fab from '@mui/material/Fab';
import Badge from '@mui/material/Badge';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import GroupAddTwoToneIcon from '@mui/icons-material/GroupAddTwoTone';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsTwoToneIcon from '@mui/icons-material/GroupsTwoTone';
import ChatIcon from '@mui/icons-material/Chat';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltTwoToneIcon from '@mui/icons-material/CameraAltTwoTone';
import SelectAllTwoToneIcon from '@mui/icons-material/SelectAllTwoTone';

// project imports
import UserList from './UserList';
import useAuth from 'hooks/useAuth';
import axiosServices from 'utils/axios';
import { getUserImageUrl } from 'utils/upload-helper';

function ChatDrawerComponent({
  setChannel,
  channels = [],
  activeChannel,
  currentUserId,
  isMobile
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();

  // Navigation views: 'chats' | 'new_chat' | 'create_group'
  const [view, setView] = useState('chats');
  const [allContacts, setAllContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'groups'
  const [isContactsLoading, setIsContactsLoading] = useState(false);

  // Group creation state
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  const fetchAllContacts = async () => {
    setIsContactsLoading(true);
    try {
      const res = await axiosServices.get('/api/chat/search/users?query=');
      setAllContacts(res.data.filter((u) => u.userId !== currentUserId));
    } catch (err) {
      console.error(err);
    } finally {
      setIsContactsLoading(false);
    }
  };

  const handleOpenNewChat = () => {
    fetchAllContacts();
    setView('new_chat');
    setSearchQuery('');
  };

  const handleOpenCreateGroup = () => {
    fetchAllContacts();
    setView('create_group');
    setGroupName('');
    setSelectedUsers([]);
    setGroupSearchQuery('');
  };

  const handleBackToChats = () => {
    setView('chats');
    setSearchQuery('');
  };

  const handleBackToNewChat = () => {
    setView('new_chat');
    setGroupName('');
    setSelectedUsers([]);
    setGroupSearchQuery('');
  };

  // Instant contact selection
  const handleSelectContact = async (contact) => {
    // Strictly find a 1-to-1 direct channel with this contact
    const existing = channels.find(
      (c) =>
        c.channelType === 'DIRECT' &&
        c.members?.some((m) => String(m.userId).toLowerCase() === String(contact.userId).toLowerCase())
    );

    if (existing) {
      setChannel(existing);
      handleBackToChats();
      return;
    }

    const tempChan = {
      id: `temp-${contact.userId}`,
      targetUserId: contact.userId,
      channelName: contact.employeeName,
      channelType: 'DIRECT',
      members: [
        { userId: currentUserId, employeeName: user?.name },
        { userId: contact.userId, employeeName: contact.employeeName, imgName: contact.imgName, isOnline: contact.isOnline }
      ]
    };
    setChannel(tempChan);
    handleBackToChats();

    try {
      const res = await axiosServices.post(`/api/chat/channels/direct?targetUserId=${contact.userId}`);
      if (res.data) {
        setChannel(res.data);
      }
    } catch (e) {
      console.error('Error creating direct chat', e);
    }
  };

  // User-friendly group creation handler
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0 || isCreatingGroup) return;

    setIsCreatingGroup(true);
    try {
      const res = await axiosServices.post(
        `/api/chat/channels/group?name=${encodeURIComponent(groupName.trim())}&type=GROUP`,
        selectedUsers
      );

      if (res.data) {
        setChannel(res.data);
      }
      setView('chats');
      setGroupName('');
      setSelectedUsers([]);
    } catch (e) {
      console.error('Failed to create group', e);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleToggleSelectAll = () => {
    const currentFiltered = allContacts
      .filter((c) =>
        !groupSearchQuery ||
        c.employeeName?.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
        c.designationName?.toLowerCase().includes(groupSearchQuery.toLowerCase())
      )
      .map((c) => c.userId);

    const allInFilteredSelected = currentFiltered.every((id) => selectedUsers.includes(id));

    if (allInFilteredSelected) {
      setSelectedUsers((prev) => prev.filter((id) => !currentFiltered.includes(id)));
    } else {
      setSelectedUsers((prev) => Array.from(new Set([...prev, ...currentFiltered])));
    }
  };

  const filteredChannels = (channels || []).filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      c.channelName?.toLowerCase().includes(q) ||
      c.members?.some((m) => m.employeeName?.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeTab === 'unread') return Boolean(c.unreadCount && c.unreadCount > 0);
    if (activeTab === 'groups') return c.channelType === 'GROUP' || c.isGroup;
    return true;
  });

  const filteredContacts = allContacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      c.employeeName?.toLowerCase().includes(q) ||
      c.userId?.toLowerCase().includes(q) ||
      c.designationName?.toLowerCase().includes(q)
    );
  });

  const filteredGroupContacts = allContacts.filter((c) => {
    const q = groupSearchQuery.toLowerCase();
    return (
      !groupSearchQuery ||
      c.employeeName?.toLowerCase().includes(q) ||
      c.userId?.toLowerCase().includes(q) ||
      c.designationName?.toLowerCase().includes(q)
    );
  });

  return (
    <Box
      sx={{
        width: { xs: '100%', md: 380 },
        height: '100%',
        bgcolor: theme.palette.background.paper,
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 1,
        flexShrink: 0
      }}
    >
      {view === 'chats' ? (
        /* ================= 1. MAIN CHATS LIST ================= */
        <>
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              pb: 1,
              bgcolor: theme.palette.background.paper,
              borderBottom: '1px solid',
              borderColor: 'divider',
              flexShrink: 0
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.3px'
                }}
              >
                Chats
              </Typography>

              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <Tooltip title="New Chat or Group">
                  <IconButton
                    onClick={handleOpenNewChat}
                    size="small"
                    sx={{
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      p: 1,
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.16) }
                    }}
                  >
                    <EditTwoToneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Search Bar */}
            <OutlinedInput
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or start new chat"
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              }
              endAdornment={
                searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')} edge="end">
                      <ClearIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }
              sx={{
                borderRadius: '20px',
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                height: 38,
                fontSize: '0.88rem'
              }}
            />

            {/* Filter Tabs */}
            <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
              <Chip
                label="All"
                size="small"
                onClick={() => setActiveTab('all')}
                sx={{
                  bgcolor: activeTab === 'all' ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.08),
                  color: activeTab === 'all' ? theme.palette.primary.contrastText || '#ffffff' : theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.9 }
                }}
              />
              <Chip
                label="Unread"
                size="small"
                onClick={() => setActiveTab('unread')}
                sx={{
                  bgcolor: activeTab === 'unread' ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.08),
                  color: activeTab === 'unread' ? theme.palette.primary.contrastText || '#ffffff' : theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.9 }
                }}
              />
              <Chip
                label="Groups"
                size="small"
                onClick={() => setActiveTab('groups')}
                sx={{
                  bgcolor: activeTab === 'groups' ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.08),
                  color: activeTab === 'groups' ? theme.palette.primary.contrastText || '#ffffff' : theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.9 }
                }}
              />
            </Stack>
          </Box>

          {/* Conversations List */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <UserList
              channels={filteredChannels}
              setChannel={setChannel}
              activeChannel={activeChannel}
              currentUserId={currentUserId}
            />
          </Box>

          {/* Mobile FAB */}
          {isMobile && (
            <Fab
              color="primary"
              aria-label="new chat"
              onClick={handleOpenNewChat}
              sx={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText || '#ffffff',
                '&:hover': { bgcolor: theme.palette.primary.dark }
              }}
            >
              <ChatIcon />
            </Fab>
          )}
        </>
      ) : view === 'new_chat' ? (
        /* ================= 2. NEW CONVERSATION VIEW ================= */
        <>
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText || '#ffffff',
              flexShrink: 0
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <IconButton onClick={handleBackToChats} sx={{ color: 'inherit', p: 0.5 }}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'inherit', fontSize: '1.05rem' }}>
                  New Conversation
                </Typography>
                <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.85, fontSize: '0.75rem' }}>
                  {filteredContacts.length} contacts
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Search Contacts */}
          <Box sx={{ p: 1.5, bgcolor: theme.palette.background.paper, borderBottom: '1px solid', borderColor: 'divider' }}>
            <OutlinedInput
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, ID, or role..."
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              }
              sx={{ borderRadius: '20px', height: 38 }}
            />
          </Box>

          {/* New Group Action + Contacts List */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <List disablePadding>
              {!searchQuery && (
                <ListItemButton
                  onClick={handleOpenCreateGroup}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 52 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, color: '#ffffff', width: 44, height: 44 }}>
                      <GroupAddTwoToneIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        Create New Group
                      </Typography>
                    }
                    secondary="Start a group chat with colleagues"
                  />
                </ListItemButton>
              )}

              {filteredContacts.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    px: 2,
                    py: 1,
                    display: 'block',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    letterSpacing: '0.5px'
                  }}
                >
                  All Team Members ({filteredContacts.length})
                </Typography>
              )}

              {filteredContacts.map((contact) => (
                <ListItemButton
                  key={contact.userId}
                  onClick={() => handleSelectContact(contact)}
                  sx={{
                    py: 1.25,
                    px: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 52 }}>
                    <Avatar
                      src={contact.imgName ? getUserImageUrl(contact.imgName) : ''}
                      alt={contact.employeeName}
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontWeight: 700
                      }}
                    >
                      {contact.employeeName?.[0] || 'U'}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {contact.employeeName}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {contact.designationName || contact.userId}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}

              {filteredContacts.length === 0 && (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    No contacts matching "{searchQuery}"
                  </Typography>
                </Box>
              )}
            </List>
          </Box>
        </>
      ) : (
        /* ================= 3. USER-FRIENDLY DEDICATED NEW GROUP SCREEN ================= */
        <>
          {/* Top Header */}
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText || '#ffffff',
              flexShrink: 0
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <IconButton onClick={handleBackToNewChat} sx={{ color: 'inherit', p: 0.5 }}>
                <ArrowBackIcon />
              </IconButton>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'inherit', fontSize: '1.05rem' }}>
                  New Group
                </Typography>
                <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.9, fontSize: '0.75rem' }}>
                  {selectedUsers.length} members selected
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Group Subject Name Section */}
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.background.paper,
              borderBottom: '1px solid',
              borderColor: 'divider',
              flexShrink: 0
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main
                }}
              >
                <GroupsTwoToneIcon />
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <OutlinedInput
                  autoFocus
                  fullWidth
                  size="small"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value.slice(0, 35))}
                  placeholder="Enter group name / subject..."
                  sx={{
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.95rem'
                  }}
                />
              </Box>
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textAlign: 'right', mt: 0.5, pr: 0.5 }}>
              {groupName.length}/35
            </Typography>
          </Box>

          {/* Selected Members Avatar Chips Tray */}
          {selectedUsers.length > 0 && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderBottom: '1px solid',
                borderColor: 'divider',
                overflowX: 'auto',
                flexShrink: 0,
                '::-webkit-scrollbar': { height: '4px' }
              }}
            >
              <Stack direction="row" spacing={1}>
                {selectedUsers.map((userId) => {
                  const u = allContacts.find((c) => c.userId === userId);
                  const name = u?.employeeName || userId;
                  return (
                    <Chip
                      key={userId}
                      avatar={
                        <Avatar
                          src={u?.imgName ? getUserImageUrl(u.imgName) : ''}
                          sx={{ width: 24, height: 24 }}
                        >
                          {name[0]}
                        </Avatar>
                      }
                      label={name}
                      onDelete={() => toggleUserSelection(userId)}
                      size="small"
                      sx={{
                        bgcolor: theme.palette.background.paper,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        fontWeight: 600,
                        fontSize: '0.78rem'
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>
          )}

          {/* Member Search Bar + Select All Action */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: theme.palette.background.paper,
              borderBottom: '1px solid',
              borderColor: 'divider',
              flexShrink: 0
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <OutlinedInput
                fullWidth
                size="small"
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                placeholder="Search colleagues..."
                startAdornment={
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                }
                endAdornment={
                  groupSearchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setGroupSearchQuery('')}>
                        <ClearIcon sx={{ fontSize: '0.9rem' }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }
                sx={{ borderRadius: '20px', height: 36 }}
              />

              <Button
                size="small"
                onClick={handleToggleSelectAll}
                sx={{
                  whiteSpace: 'nowrap',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  flexShrink: 0
                }}
              >
                Select All
              </Button>
            </Stack>
          </Box>

          {/* Members List */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <List disablePadding>
              {filteredGroupContacts.map((contact) => {
                const isChecked = selectedUsers.includes(contact.userId);
                return (
                  <ListItemButton
                    key={contact.userId}
                    onClick={() => toggleUserSelection(contact.userId)}
                    sx={{
                      py: 1.25,
                      px: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isChecked ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                      '&:hover': {
                        bgcolor: isChecked ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.04)
                      }
                    }}
                  >
                    <Checkbox
                      checked={isChecked}
                      edge="start"
                      tabIndex={-1}
                      disableRipple
                      sx={{
                        color: isChecked ? theme.palette.primary.main : theme.palette.text.secondary,
                        '&.Mui-checked': { color: theme.palette.primary.main }
                      }}
                    />

                    <ListItemAvatar sx={{ minWidth: 48 }}>
                      <Avatar
                        src={contact.imgName ? getUserImageUrl(contact.imgName) : ''}
                        alt={contact.employeeName}
                        sx={{
                          width: 42,
                          height: 42,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontWeight: 700
                        }}
                      >
                        {contact.employeeName?.[0] || 'U'}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {contact.employeeName}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {contact.designationName || contact.userId}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                );
              })}

              {filteredGroupContacts.length === 0 && (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    No colleagues matching "{groupSearchQuery}"
                  </Typography>
                </Box>
              )}
            </List>
          </Box>

          {/* Bottom WhatsApp-Style Create Group Button Bar */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: theme.palette.background.paper,
              borderTop: '1px solid',
              borderColor: 'divider',
              flexShrink: 0
            }}
          >
            <Button
              fullWidth
              variant="contained"
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0 || isCreatingGroup}
              startIcon={isCreatingGroup ? <CircularProgress size={18} color="inherit" /> : <CheckIcon />}
              sx={{
                py: 1.2,
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText || '#ffffff',
                boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                '&:hover': { bgcolor: theme.palette.primary.dark }
              }}
            >
              {isCreatingGroup ? 'Creating Group...' : `Create Group (${selectedUsers.length})`}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

ChatDrawerComponent.propTypes = {
  setChannel: PropTypes.func.isRequired,
  channels: PropTypes.array,
  activeChannel: PropTypes.object,
  currentUserId: PropTypes.string.isRequired,
  isMobile: PropTypes.bool
};

const ChatDrawer = memo(ChatDrawerComponent);
export default ChatDrawer;
