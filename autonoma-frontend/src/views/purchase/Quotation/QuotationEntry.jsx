import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, Grid, CircularProgress, Typography, Paper, Avatar, alpha, TextField, MenuItem } from '@mui/material';
import useQuotationStore from 'store/useQuotationStore';
import useRfqStore from 'store/useRfqStore';
import { useMasterDataStore } from 'store/useMasterDataStore';
import useAuth from 'hooks/useAuth';
import { IconFileInvoice } from '@tabler/icons-react';
import { Save, CheckCircle, Cancel } from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import { BOSTextField, BOSAutocomplete } from 'ui-component/bos';
import { useTheme } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import quotationService from 'api/quotationService';
import { isInterStateTransaction } from 'utils/taxUtils';

import QuotationItemGrid from './QuotationItemGrid';
import CommercialSummary from './CommercialSummary';
import SmartSupplierInsights from './SmartSupplierInsights';

const QuotationEntry = () => {
    const { id } = useParams();
    const isNew = !id;
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const dispatch = useDispatch();
    const { currentQuotation, fetchQuotationById, initNewQuotation, saveQuotation, evaluateTechnicalStatus, loading: quotationLoading, loadFromRfq, updateQuotationField } = useQuotationStore();
    const { rfqs, fetchRfqs } = useRfqStore();
    const { data: masterData, fetchLookups } = useMasterDataStore();
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [existingQuotations, setExistingQuotations] = useState([]);

    useEffect(() => {
        if (currentQuotation?.rfqId && isNew) {
            quotationService.getByRfq(currentQuotation.rfqId)
                .then(res => setExistingQuotations(res.data))
                .catch(err => console.error("Error fetching existing quotations", err));
        } else {
            setExistingQuotations([]);
        }
    }, [currentQuotation?.rfqId, isNew]);

    useEffect(() => {
        if (id) {
            fetchQuotationById(id);
            // Also load RFQ list so the RFQ dropdown resolves the saved rfqId to its label
            if (user?.divisionId) {
                fetchRfqs(user.divisionId);
            }
            fetchLookups(['SUPPLIERS']);
        } else {
            initNewQuotation();
            if (user?.divisionId) {
                fetchRfqs(user.divisionId);
            }
            fetchLookups(['SUPPLIERS']);
        }
    }, [id, fetchQuotationById, initNewQuotation, user?.divisionId, fetchRfqs, fetchLookups]);

    // Handle auto-load from location state when coming from RFQ list
    useEffect(() => {
        if (!id && location.state?.fromRfqId && rfqs?.length > 0 && String(currentQuotation?.rfqId) !== String(location.state?.fromRfqId)) {
            const rfqToLoad = rfqs.find(r => String(r.id) === String(location.state.fromRfqId));
            if (rfqToLoad) {
                loadFromRfq(rfqToLoad);
            }
        }
    }, [id, location.state, rfqs, loadFromRfq, currentQuotation?.rfqId]);

    const handleSave = async () => {
        const newErrors = {};
        if (!currentQuotation.rfqId) newErrors.rfqId = "RFQ Reference is required";
        if (!currentQuotation.supplierId) newErrors.supplierId = "Supplier is required";
        if (!currentQuotation.supplierReferenceNo) newErrors.supplierReferenceNo = "Supplier Ref No is required";
        if (!currentQuotation.supplierReferenceDate) newErrors.supplierReferenceDate = "Supplier Ref Date is required";

        let hasItemErrors = false;
        if (!currentQuotation.details || currentQuotation.details.length === 0) {
            hasItemErrors = true;
            dispatch(openSnackbar({ open: true, message: 'Please add at least one item', variant: 'alert', severity: 'error' }));
        } else {
            for (let i = 0; i < currentQuotation.details.length; i++) {
                const item = currentQuotation.details[i];
                if (item.unitPrice === undefined || item.unitPrice === null || item.unitPrice === '' || Number(item.unitPrice) <= 0) {
                    hasItemErrors = true;
                    newErrors[`unitPrice_${i}`] = "Unit price is required";
                }
                if (!item.deliveryDate) {
                    hasItemErrors = true;
                    newErrors[`deliveryDate_${i}`] = "Delivery Date is required";
                }
            }
            if (hasItemErrors) {
                dispatch(openSnackbar({ open: true, message: 'Please fix the highlighted errors in item specifications', variant: 'alert', severity: 'error' }));
            }
        }

        if (Object.keys(newErrors).length > 0) {
            // Briefly clear errors to restart the CSS shake animation on subsequent clicks
            setErrors({});
            setTimeout(() => {
                setErrors(newErrors);
                dispatch(openSnackbar({ open: true, message: 'Please fill all required fields', variant: 'alert', severity: 'warning' }));

                // Focus on the first field with an error
                setTimeout(() => {
                    const firstErrorKey = Object.keys(newErrors)[0];
                    let element = document.getElementById(firstErrorKey);

                    if (!element) {
                        element = document.querySelector(`[name="${firstErrorKey}"]`);
                    }

                    if (element) {
                        element.focus();
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }, 10);
            return;
        }

        setErrors({});
        setSubmitting(true);
        try {
            const saved = await saveQuotation(currentQuotation);
            dispatch(openSnackbar({ open: true, message: 'Quotation saved successfully', variant: 'alert', severity: 'success' }));
            if (!id && saved?.id) {
                navigate(`/purchase/quotation/entry/${saved.id}`);
            }
        } catch (err) {
            dispatch(openSnackbar({ open: true, message: err.message || 'Error saving quotation', variant: 'alert', severity: 'error' }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleTechnicalEvaluation = async (status) => {
        try {
            await evaluateTechnicalStatus(id, status);
            dispatch(openSnackbar({ open: true, message: `Technical status updated to ${status}`, variant: 'alert', severity: 'success' }));
            fetchQuotationById(id);
        } catch (err) {
            const backendMsg = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Error updating status';
            dispatch(openSnackbar({ open: true, message: backendMsg, variant: 'alert', severity: 'error' }));
        }
    };

    if (quotationLoading && !currentQuotation) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!currentQuotation) {
        return <Typography color="error">Failed to load quotation.</Typography>;
    }

    const isReadOnly = currentQuotation.statusName === 'APPROVED' || currentQuotation.statusName === 'SENT' || currentQuotation.technicalStatusName?.toUpperCase() === 'VERIFIED';

    return (
        <Box>
            <Paper
                elevation={0}
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    p: 1.25,
                    mb: 1.5,
                    borderRadius: 4,
                    bgcolor: 'background.paper',
                    backgroundImage: 'none',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s ease-in-out'
                }}
            >
                <Box display="flex" alignItems="center" gap={2.5}>
                    <Avatar
                        sx={{
                            bgcolor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.main,
                            color: '#fff',
                            width: 52,
                            height: 52,
                            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
                        }}
                    >
                        <IconFileInvoice size={28} />
                    </Avatar>
                    <Box>
                        <Typography variant="h3" fontWeight="800" sx={{
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 0.5
                        }}>
                            {id ? `Supplier Quotation: ${currentQuotation.quotationNo || ''}` : 'New Supplier Quotation'}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
                            {id ? 'View or modify the details of this quotation' : 'Record a new quotation from a supplier'}
                        </Typography>
                    </Box>
                </Box>
                <Box gap={1.5} display="flex">
                    <Button variant="outlined" sx={{ borderRadius: 2, px: 3, borderWidth: 2, '&:hover': { borderWidth: 2 } }} onClick={() => {
                        if (location.state?.from) {
                            navigate(location.state.from);
                        } else if (location.state?.fromRfqList) {
                            navigate('/purchase/rfq/list');
                        } else {
                            navigate('/purchase/quotation/list');
                        }
                    }}>
                        Close
                    </Button>

                    {id && currentQuotation.technicalStatusName?.toUpperCase() !== 'VERIFIED' && currentQuotation.technicalStatusName?.toUpperCase() !== 'REJECTED' && currentQuotation.statusName?.toUpperCase() !== 'APPROVED' && (
                        <>
                            <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleTechnicalEvaluation('Verified')} disabled={submitting} sx={{ borderRadius: 2 }}>
                                Verified
                            </Button>
                            <Button variant="contained" color="error" startIcon={<Cancel />} onClick={() => handleTechnicalEvaluation('Rejected')} disabled={submitting} sx={{ borderRadius: 2 }}>
                                Reject
                            </Button>
                        </>
                    )}

                    {!isReadOnly && (
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={submitting}
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                py: 1,
                                fontWeight: '700',
                                boxShadow: `0 8px 16px ${alpha(theme.palette.warning.main, 0.3)}`,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 10px 20px ${alpha(theme.palette.warning.main, 0.5)}`,
                                }
                            }}
                        >
                            {submitting ? 'Saving...' : 'Save Quotation'}
                        </Button>
                    )}
                </Box>
            </Paper>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Grid container spacing={2} sx={{ width: '100%' }}>
                        {/* Left Group */}
                        <Grid item xs={12} md={8} sx={{ width: { xs: '100%', md: '78%' } }}>
                            <MainCard stretch={false} sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={2.5}>
                                        {isNew && !location.state?.fromRfqId ? (
                                            <BOSAutocomplete
                                                options={(rfqs || []).filter(r => r.statusName !== 'Closed' && r.trackingStatus !== 'Closed' && r.statusName !== 'Draft')}
                                                value={rfqs?.find(r => r.id === currentQuotation.rfqId) || null}
                                                getOptionLabel={(option) => option.rfqNo || ''}
                                                onChange={(newValue) => {
                                                    updateQuotationField('rfqId', newValue ? newValue.id : null);
                                                    updateQuotationField('rfqNo', newValue ? newValue.rfqNo : '');
                                                    loadFromRfq(newValue);
                                                    setErrors(prev => ({ ...prev, rfqId: null }));
                                                }}
                                                id="rfqId"
                                                label="RFQ Reference"
                                                placeholder="Select RFQ"
                                                disabled={isReadOnly}
                                                error={!!errors.rfqId}
                                                helperText={errors.rfqId}
                                                sx={errors.rfqId ? { animation: 'shake 0.5s' } : {}}
                                            />
                                        ) : (
                                            <BOSTextField
                                                fullWidth
                                                label="RFQ Reference"
                                                value={currentQuotation.rfqNo || ''}
                                                disabled
                                            />
                                        )}
                                    </Grid>
                                    <Grid item xs={12} md={2.5}>
                                        <BOSTextField
                                            fullWidth
                                            label="PR Reference No"
                                            value={currentQuotation.prNo || ''}
                                            disabled
                                            placeholder="PR Ref"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <BOSAutocomplete
                                            options={currentQuotation.rfqSuppliers && currentQuotation.rfqSuppliers.length > 0 ? currentQuotation.rfqSuppliers.map(s => ({ id: s.supplierId, name: s.supplierName, supplierName: s.supplierName })) : (masterData.suppliers || [])}
                                            value={
                                                (masterData.suppliers && masterData.suppliers.length > 0 ? masterData.suppliers.find(s => s.id === currentQuotation.supplierId) : null)
                                                || (currentQuotation.supplierId ? { id: currentQuotation.supplierId, name: currentQuotation.supplierName, supplierName: currentQuotation.supplierName } : null)
                                            }
                                            getOptionLabel={(option) => option.supplierName || option.name || option.label || ''}
                                            onChange={(newValue) => {
                                                if (newValue) {
                                                    const existing = existingQuotations.find(q => q.supplierId === newValue.id || q.supplierId === newValue.supplierId);
                                                    if (existing) {
                                                        dispatch(openSnackbar({ open: true, message: `A quotation already exists for this RFQ and Supplier combination (Quotation No: ${existing.quotationNo || 'Draft'}). Duplicate quotations are not allowed.`, variant: 'alert', severity: 'error' }));
                                                        updateQuotationField('supplierId', null);
                                                        updateQuotationField('supplierName', '');
                                                        return;
                                                    }
                                                }
                                                updateQuotationField('supplierId', newValue ? newValue.id : null);
                                                updateQuotationField('supplierName', newValue ? (newValue.supplierName || newValue.name || newValue.label) : '');
                                                setErrors(prev => ({ ...prev, supplierId: null }));

                                                if (newValue) {
                                                    const fullSupplier = masterData.suppliers?.find(s => s.id === (newValue.id || newValue.supplierId)) || newValue;
                                                    if (fullSupplier.stateCode) {
                                                        const isInter = isInterStateTransaction(fullSupplier.stateCode);
                                                        updateQuotationField('gstType', isInter ? 'INTER_STATE' : 'INTRA_STATE');
                                                    } else {
                                                        updateQuotationField('gstType', 'INTRA_STATE');
                                                    }
                                                }
                                            }}
                                            id="supplierId"
                                            label="Supplier"
                                            placeholder="Select Supplier"
                                            disabled={!isNew || isReadOnly}
                                            error={!!errors.supplierId}
                                            helperText={errors.supplierId}
                                            getOptionDisabled={(option) => {
                                                if (!existingQuotations || existingQuotations.length === 0) return false;
                                                return existingQuotations.some(q => String(q.supplierId) === String(option.id || option.supplierId));
                                            }}
                                            sx={errors.supplierId ? { animation: 'shake 0.5s' } : {}}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <BOSTextField
                                            fullWidth
                                            id="supplierReferenceNo"
                                            label="Supplier Ref No"
                                            value={currentQuotation.supplierReferenceNo || ''}
                                            onChange={(e) => {
                                                updateQuotationField('supplierReferenceNo', e.target.value);
                                                setErrors(prev => ({ ...prev, supplierReferenceNo: null }));
                                            }}
                                            placeholder="Ref No"
                                            disabled={isReadOnly}
                                            error={!!errors.supplierReferenceNo}
                                            helperText={errors.supplierReferenceNo}
                                            sx={errors.supplierReferenceNo ? { animation: 'shake 0.5s' } : {}}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <BOSTextField
                                            fullWidth
                                            id="supplierReferenceDate"
                                            type="date"
                                            label="Supplier Ref Date"
                                            InputLabelProps={{ shrink: true }}
                                            value={currentQuotation.supplierReferenceDate ? (currentQuotation.supplierReferenceDate.includes('T') ? currentQuotation.supplierReferenceDate.split('T')[0] : currentQuotation.supplierReferenceDate) : ''}
                                            onChange={(e) => {
                                                updateQuotationField('supplierReferenceDate', e.target.value);
                                                setErrors(prev => ({ ...prev, supplierReferenceDate: null }));
                                            }}
                                            disabled={isReadOnly}
                                            error={!!errors.supplierReferenceDate}
                                            helperText={errors.supplierReferenceDate}
                                            sx={errors.supplierReferenceDate ? { animation: 'shake 0.5s' } : {}}
                                        />
                                    </Grid>
                                </Grid>
                            </MainCard>
                        </Grid>

                        {/* Right Group - Separate Panel */}
                        <Grid item xs={12} md={4} sx={{ width: { xs: '100%', md: '20%' } }}>
                            <MainCard stretch={false} sx={{
                                borderRadius: 3,
                                boxShadow: theme.shadows[2],
                                border: '1px solid',
                                borderColor: 'primary.main',
                                bgcolor: 'background.paper'
                            }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <BOSTextField
                                            fullWidth
                                            label="Quotation No"
                                            value={currentQuotation.quotationNo || ''}
                                            placeholder="Auto Generated"
                                            disabled
                                            sx={{ '& .MuiInputBase-input': { fontWeight: 'bold', color: theme.palette.primary.main } }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <BOSTextField
                                            fullWidth
                                            type="date"
                                            label="Quotation Date"
                                            InputLabelProps={{ shrink: true }}
                                            value={currentQuotation.quotationDate ? new Date(currentQuotation.quotationDate).toISOString().split('T')[0] : ''}
                                            onChange={(e) => updateQuotationField('quotationDate', e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                    </Grid>
                                </Grid>
                            </MainCard>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            {/* Items Section */}
            <Box mt={1} sx={{ px: { xs: 2, lg: 3 } }}>

                <QuotationItemGrid
                    isReadOnly={isReadOnly}
                    errors={errors}
                    setErrors={setErrors}
                />
            </Box>

            {/* Commercial + Insights side-by-side */}
            <Box mt={2} sx={{ width: "100%", px: { xs: 2, lg: 3 } }}>
                <Box sx={{ px: 1, py: 0.5, display: 'flex', alignItems: 'center', width: "100%" }}>
                    <Box sx={{ width: 4, height: 14, bgcolor: 'primary.main', borderRadius: 1, mr: 1 }} />
                    <Typography variant="subtitle2" fontWeight={700} color="primary">
                        Commercial Details & Summary :
                    </Typography>
                    {/* {currentQuotation.supplierId && currentQuotation.supplierInsights && (
                        <Grid item xs={12} md={4}>
                            <SmartSupplierInsights insights={currentQuotation.supplierInsights} />
                        </Grid>
                    )} */}
                </Box>
                <Box sx={{ mt: 1, width: '100%' }}>
                    <CommercialSummary isReadOnly={isReadOnly} />
                </Box>
            </Box>
        </Box>
    );
};

export default QuotationEntry;
