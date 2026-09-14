import PropTypes from 'prop-types';

// material-ui
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

// third party
import { format } from 'date-fns';

// icons
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import AttachFileIcon from '@mui/icons-material/AttachFileTwoTone';
import ReplyIcon from '@mui/icons-material/Reply';
import ForwardIcon from '@mui/icons-material/Forward';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';

// ==============================|| PREMIUM MAIL DETAILS ||============================== //

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.replace('@', ' ').split(/[\s.,]+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
};

const MetaRow = ({ icon: Icon, label, value }) => (
  value ? (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 0.75 }}>
      <Icon sx={{ fontSize: 15, color: '#94a3b8', mt: 0.25, flexShrink: 0 }} />
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', minWidth: 50, flexShrink: 0, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.82rem', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  ) : null
);

export default function MailDetails({ handleUserDetails, data, handleStarredChange }) {
  if (!data) return null;
  const avatarColor = getAvatarColor(data.profile?.name);
  const initials = getInitials(data.profile?.name);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#ffffff' }}>
      {/* Header Bar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.5,
        borderBottom: '1px solid #f1f5f9',
        bgcolor: '#ffffff', flexShrink: 0
      }}>
        <Tooltip title="Back to inbox">
          <IconButton size="small" onClick={(e) => handleUserDetails(e, null)} sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' }, borderRadius: 1.5 }}>
            <ArrowBackIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Reply">
          <IconButton size="small" sx={{ color: '#64748b', '&:hover': { bgcolor: '#ede9fe', color: '#6366f1' } }}>
            <ReplyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Forward">
          <IconButton size="small" sx={{ color: '#64748b', '&:hover': { bgcolor: '#ede9fe', color: '#6366f1' } }}>
            <ForwardIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={data.starred ? 'Unstar' : 'Star'}>
          <IconButton size="small" onClick={(e) => handleStarredChange(e, data)} sx={{ color: data.starred ? '#f59e0b' : '#94a3b8' }}>
            {data.starred ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Email Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, md: 4 }, py: 3 }}>
        {/* Subject */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#0f172a', lineHeight: 1.3, mb: 1 }}>
              {data.subject}
            </Typography>
            {data.rfqNo && (
              <Chip
                label={`RFQ: ${data.rfqNo}`}
                size="small"
                sx={{ bgcolor: '#ede9fe', color: '#6366f1', fontWeight: 700, border: '1px solid #c4b5fd', height: 22, fontSize: '0.72rem' }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', px: 2, py: 0.75, borderRadius: 2, flexShrink: 0 }}>
            <CheckCircleIcon sx={{ fontSize: 14, color: '#22c55e' }} />
            <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700, fontSize: '0.72rem' }}>Delivered</Typography>
          </Box>
        </Box>

        {/* Sender Card */}
        <Box sx={{
          display: 'flex', alignItems: 'flex-start', gap: 2, p: 2.5,
          bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0', mb: 3
        }}>
          <Avatar sx={{ width: 46, height: 46, bgcolor: avatarColor, fontSize: '0.95rem', fontWeight: 700, flexShrink: 0, boxShadow: `0 4px 12px ${alpha(avatarColor, 0.35)}` }}>
            {initials}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b' }}>{data.profile?.name}</Typography>
                {data.sentBy && (
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Sent by {data.sentBy}</Typography>
                )}
              </Box>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                {data.time ? format(new Date(data.time), 'EEE, d MMM yyyy · h:mm a') : ''}
              </Typography>
            </Box>
            <Divider sx={{ mb: 1.5, borderColor: '#e2e8f0' }} />
            <MetaRow icon={EmailIcon} label="From" value={data.fromEmail} />
            <MetaRow icon={PersonIcon} label="To" value={data.toEmail} />
            <MetaRow icon={GroupIcon} label="CC" value={data.ccEmail} />
          </Box>
        </Box>

        {/* Message Body */}
        <Box sx={{
          bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #f1f5f9',
          p: 3, mb: 3, lineHeight: 1.9
        }}>
          {data.message ? (
            <Typography sx={{ color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.85, fontFamily: '"Inter", sans-serif', fontSize: '0.9rem' }}>
              {data.message}
            </Typography>
          ) : (
            <Typography sx={{ color: '#94a3b8', fontStyle: 'italic' }}>No message content</Typography>
          )}
        </Box>

        {/* Attachment indicator */}
        {data.attach && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 2, p: 2,
            bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2
          }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DescriptionIcon sx={{ fontSize: 18, color: '#ef4444' }} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ color: '#1e293b' }}>
                {data.rfqNo ? `${data.rfqNo.replace(/\//g, '_')}.pdf` : 'RFQ_Document.pdf'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>System Generated PDF · Auto-attached</Typography>
            </Box>
            <AttachFileIcon sx={{ color: '#94a3b8', ml: 'auto', fontSize: 16 }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

MailDetails.propTypes = {
  handleUserDetails: PropTypes.func,
  data: PropTypes.object,
  handleStarredChange: PropTypes.func,
  handleImportantChange: PropTypes.func
};
