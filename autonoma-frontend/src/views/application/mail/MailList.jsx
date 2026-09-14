import PropTypes from 'prop-types';
import * as React from 'react';

// material-ui
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

// third party
import { format } from 'date-fns';

// assets
import AttachmentIcon from '@mui/icons-material/AttachFileTwoTone';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/MenuOutlined';
import RefreshIcon from '@mui/icons-material/RefreshOutlined';
import InboxIcon from '@mui/icons-material/AllInboxRounded';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import EmailIcon from '@mui/icons-material/Email';

// ==============================|| PREMIUM MAIL LIST ||============================== //

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.replace('@', ' ').split(/[\s.,]+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#10b981', '#06b6d4', '#3b82f6', '#84cc16', '#f97316'
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
};

export default function MailList({
  data,
  search,
  handleSearch,
  handleDrawerOpen,
  handleUserDetails,
  handleStarredChange,
  handleImportantChange
}) {
  const [page, setPage] = React.useState(0);
  const rowsPerPage = 15;
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const pagedData = data.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '80vh' }}>
      {/* Toolbar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
        borderBottom: '1px solid #f1f5f9', bgcolor: '#ffffff',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <Tooltip title="Toggle Sidebar">
          <IconButton size="small" onClick={handleDrawerOpen} sx={{ color: '#64748b' }}>
            <MenuIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Search */}
        <TextField
          value={search}
          onChange={handleSearch}
          placeholder="Search emails..."
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: 3,
                bgcolor: '#f8fafc',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#c4b5fd' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: 1 },
                fontSize: '0.85rem'
              }
            }
          }}
        />

        <Tooltip title="Refresh">
          <IconButton size="small" sx={{ color: '#64748b' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Pagination control */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto', flexShrink: 0 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>
            {data.length === 0 ? '0' : `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, data.length)}`} of {data.length}
          </Typography>
          <IconButton size="small" disabled={page === 0} onClick={() => setPage(p => p - 1)} sx={{ color: page === 0 ? '#d1d5db' : '#64748b' }}>
            <ArrowBackIosIcon sx={{ fontSize: 12 }} />
          </IconButton>
          <IconButton size="small" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} sx={{ color: page >= totalPages - 1 ? '#d1d5db' : '#64748b' }}>
            <ArrowForwardIosIcon sx={{ fontSize: 12 }} />
          </IconButton>
        </Box>
      </Box>

      {/* Mail List */}
      {data.length === 0 ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10 }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: 4, bgcolor: '#ede9fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3
          }}>
            <InboxIcon sx={{ fontSize: 40, color: '#8b5cf6' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="#1e293b" gutterBottom>No emails yet</Typography>
          <Typography variant="body2" color="#94a3b8">
            Sent RFQ emails will appear here automatically.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {pagedData.map((row, index) => {
            const avatarColor = getAvatarColor(row.profile?.name);
            const initials = getInitials(row.profile?.name);
            const isUnread = !row.isRead;
            return (
              <Box
                key={row.id || index}
                onClick={(e) => handleUserDetails(e, row)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  px: 2.5, py: 1.75,
                  cursor: 'pointer',
                  bgcolor: isUnread ? alpha('#6366f1', 0.03) : 'white',
                  borderBottom: '1px solid #f8fafc',
                  borderLeft: isUnread ? '3px solid #6366f1' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: '#f8fafc',
                    borderLeftColor: '#8b5cf6',
                    '& .mail-actions': { opacity: 1 }
                  }
                }}
              >
                {/* Star */}
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handleStarredChange(e, row); }}
                  sx={{ color: row.starred ? '#f59e0b' : '#cbd5e1', flexShrink: 0, p: 0.5 }}
                >
                  {row.starred ? <StarIcon sx={{ fontSize: 17 }} /> : <StarBorderIcon sx={{ fontSize: 17 }} />}
                </IconButton>

                {/* Avatar */}
                <Avatar
                  sx={{
                    width: 38, height: 38, flexShrink: 0,
                    bgcolor: avatarColor,
                    fontSize: '0.78rem', fontWeight: 700,
                    boxShadow: `0 2px 8px ${alpha(avatarColor, 0.35)}`
                  }}
                >
                  {initials}
                </Avatar>

                {/* Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 0.3 }}>
                    <Typography
                      variant="body2"
                      fontWeight={isUnread ? 700 : 500}
                      noWrap
                      sx={{ color: isUnread ? '#0f172a' : '#374151', maxWidth: '55%', fontSize: '0.875rem' }}
                    >
                      {row.profile?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', flexShrink: 0, fontSize: '0.72rem', ml: 1 }}>
                      {row.time ? format(new Date(row.time), 'd MMM · h:mm a') : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="caption"
                      noWrap
                      sx={{ flex: 1, color: isUnread ? '#4b5563' : '#6b7280', fontWeight: isUnread ? 600 : 400 }}
                    >
                      <Box component="span" sx={{ color: isUnread ? '#1e293b' : '#374151', fontWeight: isUnread ? 700 : 500 }}>
                        {row.subject}
                      </Box>
                      {row.message && <Box component="span" sx={{ color: '#94a3b8' }}> — {row.message.substring(0, 60)}</Box>}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, alignItems: 'center' }}>
                      {row.rfqNo && (
                        <Chip
                          label={row.rfqNo}
                          size="small"
                          sx={{
                            height: 18, fontSize: '0.62rem', fontWeight: 700,
                            bgcolor: '#ede9fe', color: '#6366f1',
                            border: '1px solid #c4b5fd',
                            '& .MuiChip-label': { px: 1 }
                          }}
                        />
                      )}
                      {row.attach && (
                        <AttachmentIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Footer */}
      {data.length > 0 && (
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 3, py: 1.5,
          borderTop: '1px solid #f1f5f9', bgcolor: '#fafbfc',
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              {data.length} total sent emails
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <Box
                key={i}
                onClick={() => setPage(i)}
                sx={{
                  width: 8, height: 8, borderRadius: '50%',
                  bgcolor: page === i ? '#6366f1' : '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: page === i ? '#4f46e5' : '#c4b5fd' }
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

MailList.propTypes = {
  data: PropTypes.any,
  search: PropTypes.any,
  handleSearch: PropTypes.any,
  handleDrawerOpen: PropTypes.any,
  handleUserDetails: PropTypes.any,
  handleStarredChange: PropTypes.any,
  handleImportantChange: PropTypes.any
};
