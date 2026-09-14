import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    CircularProgress,
    Alert,
    Tooltip
} from '@mui/material';
import { Close as CloseIcon, Refresh as RefreshIcon, History as HistoryIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import rfqService from 'api/rfqService';

const RfqEmailHistoryDialog = ({ open, onClose, rfqId, rfqNo }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchHistory = useCallback(async () => {
        if (!rfqId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await rfqService.getEmailHistory(rfqId);
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to load RFQ email history', err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch email history.');
        } finally {
            setLoading(false);
        }
    }, [rfqId]);

    useEffect(() => {
        if (open) {
            fetchHistory();
        } else {
            setHistory([]);
            setError(null);
        }
    }, [open, fetchHistory]);

    const getStatusChip = (item) => {
        const rawStatus = (item.statusName || item.status || '').toUpperCase();
        const isSuccess = rawStatus === 'SENT' || rawStatus === 'SUCCESS';
        const isFail = rawStatus === 'FAIL' || rawStatus === 'FAILED';

        let label = item.statusName || item.status || 'UNKNOWN';
        if (rawStatus === 'SUCCESS') label = 'SENT';

        return (
            <Chip
                label={label}
                size="small"
                color={isSuccess ? 'success' : isFail ? 'error' : 'default'}
                variant={isSuccess ? 'filled' : 'outlined'}
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
            />
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
                    borderRadius: 3,
                    boxShadow: 24,
                    minHeight: 450
                }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.light', color: 'primary.dark' }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <HistoryIcon color="primary" />
                    <Typography variant="h4" fontWeight={700} color="inherit">
                        RFQ Email Audit History
                    </Typography>
                    {rfqNo && (
                        <Chip label={`RFQ #${rfqNo}`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                    )}
                </Box>
                <IconButton onClick={onClose} size="small" aria-label="close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 2.5 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} gap={2}>
                        <CircularProgress size={36} />
                        <Typography variant="body2" color="text.secondary">
                            Loading email history records...
                        </Typography>
                    </Box>
                ) : history.length === 0 ? (
                    <Box textAlign="center" py={6}>
                        <Typography variant="h5" color="text.secondary" gutterBottom>
                            No Email History Found
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                            No outgoing supplier emails have been recorded for this RFQ yet.
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                        <Table size="small" aria-label="RFQ email history table">
                            <TableHead sx={{ bgcolor: 'grey.100' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: 90 }}>Attempt</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Recipient Email</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Sent By</TableCell>
                                    <TableCell sx={{ fontWeight: 700, width: 100 }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Failure Details</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.map((row, idx) => {
                                    const formattedDate = row.sentDate
                                        ? format(new Date(row.sentDate), 'dd-MM-yyyy hh:mm a')
                                        : '—';

                                    return (
                                        <TableRow
                                            key={row.id || idx}
                                            hover
                                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                        >
                                            <TableCell>{idx + 1}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={`#${row.attempt || 1}`}
                                                    size="small"
                                                    variant="outlined"
                                                    color="info"
                                                    sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {row.supplierName || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                                    {row.recipientEmail || row.toEmail || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {formattedDate}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {row.sentBy || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusChip(row)}
                                            </TableCell>
                                            <TableCell>
                                                {row.failureReason ? (
                                                    <Tooltip title={row.failureReason} arrow>
                                                        <Typography variant="body2" color="error.main" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                                            {row.failureReason}
                                                        </Typography>
                                                    </Tooltip>
                                                ) : (
                                                    <Typography variant="body2" color="text.disabled">—</Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    startIcon={<RefreshIcon />}
                    onClick={fetchHistory}
                    disabled={loading}
                    variant="outlined"
                    color="inherit"
                    size="small"
                >
                    Refresh
                </Button>
                <Button onClick={onClose} variant="contained" color="primary" sx={{ px: 3 }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

RfqEmailHistoryDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    rfqId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rfqNo: PropTypes.string
};

export default RfqEmailHistoryDialog;
