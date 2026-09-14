import React from 'react';
import { sanitizeHTML } from 'utils/sanitize';
import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, TableContainer, Table, TableHead,
  TableRow, TableCell, TableBody, Paper, Stack, Box, useTheme
} from '@mui/material';
import {
  IconFileSpreadsheet, IconFileDownload, IconFileDescription,
  IconFileTypePdf, IconPhoto
} from '@tabler/icons-react';

// ==============================|| CENTRALIZED BOS DOCUMENT PREVIEW DIALOG ||============================== //

export const BOSDocumentPreviewDialog = ({
  open,
  onClose,
  onDownload,
  type = 'excel', // 'excel' | 'pdf' | 'image' | 'html' | 'text'
  data = null,    // Array for 'excel', string for 'html'/'text'
  fileUrl = '',   // URL for 'pdf'/'image'
  fileName = 'document'
}) => {
  const theme = useTheme();

  if (!open) return null;

  // Render appropriate dynamic icon based on preview type
  const getHeaderIcon = () => {
    switch (type) {
      case 'excel':
        return <IconFileSpreadsheet size={24} color={theme.palette.primary.main} />;
      case 'pdf':
        return <IconFileTypePdf size={24} color={theme.palette.error.main} />;
      case 'image':
        return <IconPhoto size={24} color={theme.palette.success.main} />;
      default:
        return <IconFileDescription size={24} color={theme.palette.secondary.main} />;
    }
  };

  // Helper to safely format attribute arrays into sticky header tabular containers
  const renderExcelPreview = () => {
    if (!Array.isArray(data) || !data.length) {
      return (
        <Typography variant="body2" sx={{ p: 4, textAlign: 'center' }} color="text.secondary">
          No records found to preview.
        </Typography>
      );
    }
    const headers = Object.keys(data[0]);
    return (
      <TableContainer component={Paper} sx={{ maxHeight: 420, borderRadius: 0, boxShadow: 'none' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {headers.map((h) => (
                <TableCell
                  key={h}
                  sx={{
                    bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
                    color: theme.palette.mode === 'dark' ? 'grey.100' : 'grey.900',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    px: 2,
                    py: 1.2
                  }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, rIdx) => (
              <TableRow key={rIdx} hover>
                {headers.map((h) => (
                  <TableCell key={h} sx={{ whiteSpace: 'nowrap', px: 2, py: 1 }}>
                    {row[h] !== null && row[h] !== undefined ? String(row[h]) : ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Dynamic preview content switch routing
  const renderContent = () => {
    switch (type) {
      case 'excel':
        return renderExcelPreview();

      case 'pdf':
        return fileUrl ? (
          <iframe
            title={fileName}
            src={fileUrl}
            style={{ width: '100%', height: '65vh', border: 'none', display: 'block' }}
          />
        ) : (
          <Typography variant="body2" sx={{ p: 4, textAlign: 'center' }}>Missing PDF target source.</Typography>
        );

      case 'image':
        return fileUrl ? (
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100' }}>
            <Box
              component="img"
              src={fileUrl}
              alt={fileName}
              sx={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 1 }}
            />
          </Box>
        ) : (
          <Typography variant="body2" sx={{ p: 4, textAlign: 'center' }}>Missing Image target source.</Typography>
        );

      case 'html':
        return data ? (
          <Box
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(data) }}
            sx={{
              p: 3,
              maxHeight: '60vh',
              overflow: 'auto',
              bgcolor: 'background.paper',
              '& table': { borderCollapse: 'collapse', width: '100%' },
              '& th, & td': { border: '1px solid', borderColor: 'divider', p: 1 }
            }}
          />
        ) : null;

      default:
        return (
          <Box sx={{ p: 3, maxHeight: '60vh', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            <Typography variant="body2">{String(data || 'No Content')}</Typography>
          </Box>
        );
    }
  };

  // Dynamic summary bar label
  const getSummaryText = () => {
    if (type === 'excel' && Array.isArray(data)) {
      return (
        <>
          Previewing precisely <b>{data.length}</b> verified row(s) prepared for offline export. Please review tabular layout before triggering manual download.
        </>
      );
    }
    return (
      <>
        Previewing document: <b>{fileName}</b>. Ensure compatibility and format settings are correct before saving locally.
      </>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[8]
        }
      }}
    >
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <DialogTitle sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'primary.light', py: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {getHeaderIcon()}
          <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
            Document Preview — {fileName}
          </Typography>
        </Stack>
      </DialogTitle>

      {/* ── Content Summary Indicator ────────────────────────────────────────── */}
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            {getSummaryText()}
          </Typography>
        </Box>

        {renderContent()}
      </DialogContent>

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <DialogActions sx={{ p: 2, px: 3, bgcolor: 'background.paper' }}>
        <Button variant="outlined" color="secondary" onClick={onClose} sx={{ borderRadius: 1.5, px: 2.5 }}>
          Close
        </Button>
        {onDownload && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<IconFileDownload size={18} />}
            onClick={() => {
              onDownload();
              onClose();
            }}
            sx={{ borderRadius: 1.5, px: 3, py: 0.8, boxShadow: theme.shadows[2] }}
          >
            Confirm Download
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

BOSDocumentPreviewDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDownload: PropTypes.func,
  type: PropTypes.oneOf(['excel', 'pdf', 'image', 'html', 'text']),
  data: PropTypes.any,
  fileUrl: PropTypes.string,
  fileName: PropTypes.string
};
