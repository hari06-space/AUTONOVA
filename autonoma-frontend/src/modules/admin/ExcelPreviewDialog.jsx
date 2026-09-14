import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, TableContainer, Table, TableHead,
  TableRow, TableCell, TableBody, Paper, Stack, Box, useTheme
} from '@mui/material';
import { IconFileSpreadsheet, IconFileDownload } from '@tabler/icons-react';

// ==============================|| EXCEL EXPORT PREVIEW DIALOG ||============================== //

export default function ExcelPreviewDialog({ open, onClose, onDownload, data, fileName }) {
  const theme = useTheme();

  if (!data || !data.length) return null;

  const headers = Object.keys(data[0]);

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
          <IconFileSpreadsheet size={24} color={theme.palette.primary.main} />
          <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
            Excel Export Preview — {fileName}.xlsx
          </Typography>
        </Stack>
      </DialogTitle>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary">
            Previewing precisely <b>{data.length}</b> verified row(s) prepared for offline spreadsheet export. Please review table format and mapped attributes below before triggering manual download.
          </Typography>
        </Box>

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
      </DialogContent>

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <DialogActions sx={{ p: 2, px: 3, bgcolor: 'background.paper' }}>
        <Button variant="contained" color="secondary" onClick={onClose} sx={{ borderRadius: 1.5, px: 2.5 }}>
          Cancel
        </Button>
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
      </DialogActions>
    </Dialog>
  );
}

ExcelPreviewDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  data: PropTypes.array,
  fileName: PropTypes.string
};
