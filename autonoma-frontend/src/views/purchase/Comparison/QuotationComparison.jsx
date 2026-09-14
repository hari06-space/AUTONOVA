import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
    Box, Button, CardContent, Typography, Grid, Divider, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import MainCard from 'ui-component/cards/MainCard';
import useQuotationComparisonStore from 'store/useQuotationComparisonStore';
import useAuth from 'hooks/useAuth';
import { openSnackbar } from 'store/slices/snackbar';

const QuotationComparison = () => {
    const { rfqId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { comparisonData, currentDecision, loading, generateComparison, fetchDecision, saveDecision, approveDecision } = useQuotationComparisonStore();

    const [overrideRemarks, setOverrideRemarks] = useState('');
    const [selectedSupplierId, setSelectedSupplierId] = useState('');

    useEffect(() => {
        if (rfqId && user?.divisionId) {
            generateComparison(rfqId, user.divisionId);
            fetchDecision(rfqId);
        }
    }, [rfqId, user?.divisionId, generateComparison, fetchDecision]);

    useEffect(() => {
        if (currentDecision) {
            setOverrideRemarks(currentDecision.overrideRemarks || '');
            setSelectedSupplierId(currentDecision.selectedSupplierId || '');
        } else if (comparisonData?.recommendedSupplierId) {
            setSelectedSupplierId(comparisonData.recommendedSupplierId);
        }
    }, [currentDecision, comparisonData]);

    const handleSaveDecision = async () => {
        if (selectedSupplierId !== comparisonData?.recommendedSupplierId && !overrideRemarks.trim()) {
            dispatch(openSnackbar({ open: true, message: 'Override remarks are mandatory when not selecting the recommended supplier.', variant: 'alert', severity: 'warning' }));
            return;
        }
        const data = {
            rfqRefId: rfqId,
            divisionId: user.divisionId,
            recommendedSupplierId: comparisonData?.recommendedSupplierId,
            recommendedReason: comparisonData?.recommendedReason,
            selectedSupplierId,
            overrideRemarks
        };
        await saveDecision(data);
        dispatch(openSnackbar({ open: true, message: 'Decision saved successfully', variant: 'alert', severity: 'success' }));
    };

    const handleApprove = async () => {
        if (currentDecision?.id) {
            await approveDecision(currentDecision.id);
            dispatch(openSnackbar({ open: true, message: 'Decision approved. PO can now be generated.', variant: 'alert', severity: 'success' }));
            fetchDecision(rfqId);
        }
    };

    return (
        <MainCard title={`Commercial Quotation Comparison : ${comparisonData?.rfqNo || ''}`}>
            {loading ? <Typography>Loading dynamic comparison...</Typography> : (
                <CardContent>
                    <Box mb={4}>
                        <Typography variant="h4" color="primary" gutterBottom>System Recommendation</Typography>
                        <Typography variant="subtitle1">
                            {comparisonData?.recommendedReason || 'No recommendation available'}
                        </Typography>
                    </Box>

                    <TableContainer component={Paper} sx={{ mb: 4 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Item / Supplier</strong></TableCell>
                                    {comparisonData?.suppliers?.map(s => (
                                        <TableCell key={s.supplierId} align="center">
                                            <strong>{s.supplierName}</strong>
                                            {s.isBestRating && <Typography variant="caption" display="block" color="success.main">(Best Rated)</Typography>}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {comparisonData?.items?.map(item => (
                                    <TableRow key={item.itemId}>
                                        <TableCell>{item.itemName} (Qty: {item.reqQty} {item.uom})</TableCell>
                                        {comparisonData?.suppliers?.map(s => {
                                            const details = item.supplierDetails?.[s.supplierId];
                                            return (
                                                <TableCell key={s.supplierId} align="center">
                                                    {details ? `₹${details.totalAmount}` : '-'}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell><strong>Total Amount</strong></TableCell>
                                    {comparisonData?.suppliers?.map(s => (
                                        <TableCell key={s.supplierId} align="center" sx={{ bgcolor: s.isLowestPrice ? 'success.light' : 'inherit' }}>
                                            <strong>₹{s.totalAmount}</strong>
                                            {s.isLowestPrice && <Typography variant="caption" display="block">(Lowest Price)</Typography>}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow>
                                    <TableCell><strong>Delivery (Days)</strong></TableCell>
                                    {comparisonData?.suppliers?.map(s => (
                                        <TableCell key={s.supplierId} align="center" sx={{ bgcolor: s.isFastestDelivery ? 'info.light' : 'inherit' }}>
                                            {s.leadTimeDays}
                                            {s.isFastestDelivery && <Typography variant="caption" display="block">(Fastest)</Typography>}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Divider sx={{ my: 3 }} />

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                label="Select Supplier for PO"
                                value={selectedSupplierId}
                                onChange={(e) => setSelectedSupplierId(e.target.value)}
                                SelectProps={{ native: true }}
                            >
                                <option value="">-- Select --</option>
                                {comparisonData?.suppliers?.map(s => (
                                    <option key={s.supplierId} value={s.supplierId}>
                                        {s.supplierName} {s.supplierId === comparisonData.recommendedSupplierId ? '(Recommended)' : ''}
                                    </option>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Override Remarks (Mandatory if overriding recommendation)"
                                multiline
                                rows={2}
                                value={overrideRemarks}
                                onChange={(e) => setOverrideRemarks(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            )}

            <Box display="flex" justifyContent="space-between" mt={2} sx={{ position: 'sticky', bottom: 10, bgcolor: 'background.paper', p: 2, zIndex: 10 }}>
                <Button variant="outlined" onClick={() => navigate('/purchase/rfq/list')}>
                    Back to RFQs
                </Button>
                <Box>
                    <Button variant="contained" color="primary" onClick={handleSaveDecision} sx={{ mr: 2 }}>
                        Save Decision
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={handleApprove}
                        disabled={!currentDecision?.id || currentDecision.statusName === 'Approved'}
                    >
                        Approve Decision
                    </Button>
                </Box>
            </Box>
        </MainCard>
    );
};

export default QuotationComparison;
