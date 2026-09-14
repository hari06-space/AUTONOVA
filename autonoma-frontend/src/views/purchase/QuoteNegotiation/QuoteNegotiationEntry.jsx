import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import useQuoteNegotiationStore from '../../../store/purchase/useQuoteNegotiationStore';
import useAuth from 'hooks/useAuth';
import MainCard from '../../../ui-component/cards/MainCard';
import { BOSTextField, BOSAutocomplete } from 'ui-component/bos';
import axios from 'utils/axios';
import { keyframes } from '@mui/system';
import { format } from 'date-fns';
import { showAppAlert } from 'utils/alert';

import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Grid,
    Paper,
    Typography,
    useTheme,
    alpha,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';

import {
    Save as SaveIcon,
    Close as CloseIcon,
    Handshake as HandshakeIcon,
    ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

const shakeAnimation = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

const QuoteNegotiationEntry = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const isViewMode = new URLSearchParams(location.search).get('mode') === 'view';
    const initQuotationId = new URLSearchParams(location.search).get('quotationId');

    const { currentNegotiation, loading, fetchNegotiationById, saveNegotiation, resetCurrentNegotiation, initNegotiationByQuotationId } = useQuoteNegotiationStore();
    const { user } = useAuth();

    const [formData, setFormData] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [shakeFields, setShakeFields] = useState({});
    const [despatchModes, setDespatchModes] = useState([]);

    const dispatch = useDispatch();
    const itemSearch = useSelector((state) => state.search.query) || '';

    useEffect(() => {
        axios.get('/api/sm/despatch-mode')
            .then(res => setDespatchModes((res.data || []).map(m => m.modeName || m.despatchMode || m.description || m.termName)))
            .catch(() => {});
    }, []);

    useEffect(() => {
        dispatch(setFilterConfig([]));
        return () => {
            dispatch(setFilterConfig(null));
        };
    }, [dispatch]);

    useEffect(() => {
        const initNewNegotiation = async () => {
            if (initQuotationId) {
                try {
                    await initNegotiationByQuotationId(initQuotationId, user?.empId || 1);
                } catch (e) {
                    showAppAlert("Failed to initialize negotiation: " + (e.response?.data?.message || e.message), 'error');
                    navigate('/purchase/quotation/list');
                }
            }
        };

        if (id) {
            fetchNegotiationById(id);
        } else if (initQuotationId) {
            initNewNegotiation();
        } else {
            navigate('/purchase/negotiation/list');
        }
        return () => resetCurrentNegotiation();
    }, [id, initQuotationId, fetchNegotiationById, saveNegotiation, navigate, resetCurrentNegotiation, user]);

    useEffect(() => {
        if (currentNegotiation) {
            setFormData(JSON.parse(JSON.stringify(currentNegotiation))); // Deep copy
        }
    }, [currentNegotiation]);

    const handleTransactionChange = (index, field, value) => {
        const newData = { ...formData };
        const trans = newData.transactions[index];

        if (field === 'negotiatedPrice') {
            const val = parseFloat(value) || 0;
            trans.negotiatedPrice = val;
            trans.savings = (trans.originalPrice - val) * trans.qty;
        } else if (field === 'negotiatedDeliveryDays') {
            trans.negotiatedDeliveryDays = parseInt(value) || 0;
        } else if (field === 'negotiatedWarranty') {
            trans.negotiatedWarranty = value;
        } else if (field === 'remarks') {
            trans.remarks = value;
        }

        let newTotal = 0;
        let newSavings = 0;
        newData.transactions.forEach(t => {
            newTotal += (t.negotiatedPrice * t.qty);
            newSavings += (t.originalPrice - t.negotiatedPrice) * t.qty;
        });
        newData.negotiatedTotal = newTotal;
        newData.totalSavings = newSavings;

        setFormData(newData);
    };

    const handleSave = async () => {
        let errors = {};
        let shakes = {};
        let isValid = true;

        if (!formData.negotiationRemarks || formData.negotiationRemarks.trim() === '') {
            errors.negotiationRemarks = "Remarks is mandatory to explain what was negotiated.";
            shakes.negotiationRemarks = true;
            isValid = false;
        }

        let hasItemNegotiation = false;
        if (formData.transactions && formData.transactions.length > 0) {
            for (let trans of formData.transactions) {
                const nPrice = parseFloat(trans.negotiatedPrice) || 0;
                const oPrice = parseFloat(trans.originalPrice) || 0;
                const nDays = parseInt(trans.negotiatedDeliveryDays) || 0;
                const oDays = parseInt(trans.originalDeliveryDays) || 0;
                const nWarr = (trans.negotiatedWarranty || '').trim();
                const oWarr = (trans.originalWarranty || '').trim();

                if (nPrice !== oPrice || nDays !== oDays || nWarr !== oWarr) {
                    hasItemNegotiation = true;
                    break;
                }
            }
        } else {
            hasItemNegotiation = true;
        }

        const hasHeaderNegotiation =
            (formData.negotiatedDeliveryTerms || '').trim() !== (formData.originalDeliveryTerms || '').trim() ||
            (formData.negotiatedPaymentTerms || '').trim() !== (formData.originalPaymentTerms || '').trim() ||
            (formData.negotiatedTransportMode || '').trim() !== (formData.originalTransportMode || '').trim();

        if (!hasItemNegotiation && !hasHeaderNegotiation) {
            showAppAlert('Please negotiate at least one item or header term before saving.', 'warning');
            return;
        }

        if (!isValid) {
            setFormErrors(errors);
            setShakeFields(shakes);
            setTimeout(() => setShakeFields({}), 500);
            showAppAlert('Please enter the mandatory Internal Remarks.', 'warning');
            return;
        }

        try {
            const savedData = await saveNegotiation(formData);
            if (!id && savedData && savedData.id) {
                navigate(`/purchase/negotiation/entry/${savedData.id}`, { replace: true });
            }
        } catch (error) {
            // Error handled in store
        }
    };

    if (loading || !formData) {
        return (
            <MainCard>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    const isEditable = !isViewMode && formData.statusName !== 'CLOSED' && formData.statusName !== 'AGREED';

    const totalSavingsPct = formData.originalTotal > 0 ? ((formData.totalSavings / formData.originalTotal) * 100).toFixed(2) : '0.00';
    const hasTotalSavings = formData.totalSavings > 0;
    const hasTotalIncrease = formData.totalSavings < 0;

    return (
        <Box sx={{ p: { xs: 1, md: 2 }, maxWidth: '100%', overflowX: 'hidden' }}>
            {/* 1. STICKY HEADER */}
            <Paper
                elevation={0}
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    px: 2,
                    py: 1.5,
                    mb: 2,
                    bgcolor: 'background.paper',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    boxShadow: theme.shadows[1],
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2
                }}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <HandshakeIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Quote Negotiation
                            <Chip size="small" label={formData.negotiationNo} sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }} />
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {formData.supplierName} • {formData.negotiationRound} •{' '}
                            <Box component="span" sx={{ color: formData.statusName === 'AGREED' ? 'success.main' : formData.statusName === 'CLOSED' ? 'text.secondary' : 'primary.main', fontWeight: 700 }}>
                                {formData.statusName}
                            </Box>
                        </Typography>
                    </Box>
                </Box>
                <Box gap={1} display="flex">
                    <Button variant="outlined" size="small" onClick={() => navigate(-1)} sx={{ borderRadius: 1.5 }}>Close</Button>
                    {isEditable && (
                        <Button variant="contained" color="primary" size="small" startIcon={<SaveIcon />} onClick={handleSave} sx={{ borderRadius: 1.5, px: 3, fontWeight: '700' }}>
                            Save Changes
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* 2. NEGOTIATION CONTEXT BAR */}
            <Paper variant="outlined" sx={{ px: 2, py: 1.5, mb: 2, bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.4) : alpha(theme.palette.grey[50], 0.6), borderRadius: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={4} md={2}>
                        <Typography variant="caption" color="textSecondary" display="block">Supplier</Typography>
                        <Typography variant="body2" fontWeight="600">{formData.supplierName}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Typography variant="caption" color="textSecondary" display="block">Buyer</Typography>
                        <Typography variant="body2" fontWeight="600">{formData.buyerName}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Typography variant="caption" color="textSecondary" display="block">Round</Typography>
                        <Typography variant="body2" fontWeight="600">{formData.negotiationRound}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Typography variant="caption" color="textSecondary" display="block">RFQ No</Typography>
                        <Typography variant="body2" fontWeight="600">{formData.rfqNo}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Typography variant="caption" color="textSecondary" display="block">Quotation No</Typography>
                        <Typography variant="body2" fontWeight="600">{formData.quotationNo}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Typography variant="caption" color="textSecondary" display="block">Date</Typography>
                        <Typography variant="body2" fontWeight="600">{formData.negotiationDate ? format(new Date(formData.negotiationDate), 'dd-MMM-yyyy') : ''}</Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* 3. FINANCIAL SUMMARY */}
            <Paper
                variant="outlined"
                sx={{
                    px: 2,
                    py: 2,
                    mb: 2,
                    borderRadius: 2,
                    borderColor: hasTotalSavings ? 'success.light' : hasTotalIncrease ? 'warning.light' : 'divider',
                    bgcolor: hasTotalSavings ? alpha(theme.palette.success.light, 0.05) : hasTotalIncrease ? alpha(theme.palette.warning.light, 0.05) : 'background.paper'
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6} sm={4} md={2.5}>
                        <Typography variant="caption" color="textSecondary" display="block" fontWeight="600">ORIGINAL TOTAL</Typography>
                        <Typography variant="subtitle1" fontWeight="700">₹{formData.originalTotal?.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={4} md={3}>
                        <Typography variant="caption" color="textSecondary" display="block" fontWeight="600">NEGOTIATED TOTAL</Typography>
                        <Typography variant="h6" color={hasTotalSavings ? 'success.main' : hasTotalIncrease ? 'warning.main' : 'textPrimary'} fontWeight="800">
                            ₹{formData.negotiatedTotal?.toFixed(2)}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Typography variant="caption" color="textSecondary" display="block" fontWeight="600">SAVINGS</Typography>
                        <Typography variant="subtitle1" color={hasTotalSavings ? 'success.main' : hasTotalIncrease ? 'warning.main' : 'textPrimary'} fontWeight="700">
                            {hasTotalIncrease ? `↑ ₹${Math.abs(formData.totalSavings).toFixed(2)}` : `₹${(formData.totalSavings || 0).toFixed(2)}`}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Typography variant="caption" color="textSecondary" display="block" fontWeight="600">SAVINGS %</Typography>
                        <Typography variant="subtitle1" color={hasTotalSavings ? 'success.main' : hasTotalIncrease ? 'warning.main' : 'textPrimary'} fontWeight="700">
                            {hasTotalIncrease ? `-${Math.abs(totalSavingsPct)}%` : `${totalSavingsPct}%`}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={8} md={2.5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Typography variant="caption" color="textSecondary" display="block" fontWeight="600">STATUS</Typography>
                        <Chip
                            label={formData.statusName}
                            size="small"
                            color={formData.statusName === 'AGREED' ? 'success' : formData.statusName === 'CLOSED' ? 'default' : 'primary'}
                            sx={{ fontWeight: 700, height: 24, mt: 0.5 }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* 3.5. HEADER COMMERCIAL TERMS */}
            <Paper variant="outlined" sx={{ px: 2, py: 2, mb: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" color="primary.main" sx={{ mb: 1.5 }}>
                    Header Commercial Terms
                </Typography>
                <Grid container spacing={3}>
                    {/* Delivery Terms */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.4) : alpha(theme.palette.grey[50], 0.6), p: 1.5, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                            <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Delivery Terms</Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" color="textSecondary" sx={{ minWidth: '40%' }}>{formData.originalDeliveryTerms || 'N/A'}</Typography>
                                <Typography variant="body2" color="textSecondary">→</Typography>
                                {isEditable ? (
                                    <BOSTextField
                                        size="small"
                                        fullWidth
                                        placeholder="Negotiated delivery..."
                                        value={formData.negotiatedDeliveryTerms || ''}
                                        onChange={(e) => setFormData({ ...formData, negotiatedDeliveryTerms: e.target.value })}
                                        sx={{ bgcolor: alpha(theme.palette.primary.light, 0.05) }}
                                    />
                                ) : (
                                    <Typography variant="body2" fontWeight="700">[{formData.negotiatedDeliveryTerms || 'N/A'}]</Typography>
                                )}
                            </Box>
                        </Box>
                    </Grid>
                    {/* Payment Terms */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.4) : alpha(theme.palette.grey[50], 0.6), p: 1.5, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                            <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Payment Terms</Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" color="textSecondary" sx={{ minWidth: '40%' }}>{formData.originalPaymentTerms || 'N/A'}</Typography>
                                <Typography variant="body2" color="textSecondary">→</Typography>
                                {isEditable ? (
                                    <BOSTextField
                                        size="small"
                                        fullWidth
                                        placeholder="Negotiated payment..."
                                        value={formData.negotiatedPaymentTerms || ''}
                                        onChange={(e) => setFormData({ ...formData, negotiatedPaymentTerms: e.target.value })}
                                        sx={{ bgcolor: alpha(theme.palette.primary.light, 0.05) }}
                                    />
                                ) : (
                                    <Typography variant="body2" fontWeight="700">[{formData.negotiatedPaymentTerms || 'N/A'}]</Typography>
                                )}
                            </Box>
                        </Box>
                    </Grid>
                    {/* Transport Mode */}
                    <Grid item xs={12} md={4}>
                        <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.4) : alpha(theme.palette.grey[50], 0.6), p: 1.5, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                            <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>Transport Mode</Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" color="textSecondary" sx={{ minWidth: '40%' }}>{formData.originalTransportMode || 'N/A'}</Typography>
                                <Typography variant="body2" color="textSecondary">→</Typography>
                                {isEditable ? (
                                    <BOSAutocomplete
                                        size="small"
                                        fullWidth
                                        freeSolo
                                        placeholder="Negotiated transport..."
                                        value={formData.negotiatedTransportMode || ''}
                                        options={despatchModes}
                                        onChange={(val) => setFormData({ ...formData, negotiatedTransportMode: val?.value ?? val ?? '' })}
                                        sx={{ bgcolor: alpha(theme.palette.primary.light, 0.05) }}
                                    />
                                ) : (
                                    <Typography variant="body2" fontWeight="700">[{formData.negotiatedTransportMode || 'N/A'}]</Typography>
                                )}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>


            {/* 5. NEGOTIATED ITEMS WORKSPACE */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        Negotiated Items
                    </Typography>
                    {formData.transactions?.length > 0 && (
                        <Chip label={`${formData.transactions.length} Items`} size="small" color="primary" variant="outlined" sx={{ ml: 1.5, height: 22, fontSize: '0.75rem', fontWeight: 600 }} />
                    )}
                </Box>
            </Box>

            <Paper variant="outlined" sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: '450px', overflowX: 'auto' }}>
                    <Table size="small" sx={{ minWidth: 750, borderCollapse: 'separate', borderSpacing: 0 }}>
                        <TableHead sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50] }}>
                            <TableRow>
                                <TableCell width="35%" sx={{ fontWeight: 'bold', color: 'text.secondary', borderBottom: `1px solid ${theme.palette.divider}` }}>Item Details</TableCell>
                                <TableCell width="15%" sx={{ fontWeight: 'bold', color: 'text.secondary', borderBottom: `1px solid ${theme.palette.divider}` }}>Original Price</TableCell>
                                <TableCell width="20%" sx={{ fontWeight: 'bold', color: 'text.secondary', borderBottom: `1px solid ${theme.palette.divider}` }}>Negotiated Price</TableCell>
                                <TableCell width="30%" sx={{ fontWeight: 'bold', color: 'text.secondary', borderBottom: `1px solid ${theme.palette.divider}` }}>Savings</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {formData.transactions?.map((row, index) => ({ ...row, originalIndex: index }))
                                .filter(row => {
                                    if (!itemSearch.trim()) return true;
                                    const lowerSearch = itemSearch.toLowerCase();
                                    return (row.itemCode && row.itemCode.toLowerCase().includes(lowerSearch)) ||
                                        (row.itemName && row.itemName.toLowerCase().includes(lowerSearch));
                                })
                                .map((row) => {
                                    const index = row.originalIndex;
                                    const isPriceReduced = row.savings > 0;
                                    const isPriceIncreased = row.savings < 0;

                                    return (
                                        <React.Fragment key={row.id || index}>
                                            {/* PRIMARY ROW */}
                                            <TableRow hover sx={{ '& td': { borderBottom: 'none', pt: 1.5, pb: 0.5 } }}>
                                                <TableCell width="35%" sx={{ pl: 2, verticalAlign: 'top' }}>
                                                    <Typography variant="subtitle2" fontWeight="700" color="primary.main">
                                                        [{row.itemCode}] - {row.itemName}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary" fontWeight="600">Qty: {row.qty?.toFixed(2)}</Typography>
                                                </TableCell>
                                                <TableCell width="15%" sx={{ verticalAlign: 'top', pt: 2 }}>
                                                    <Typography variant="body2" fontWeight="600">₹{row.originalPrice?.toFixed(2)}</Typography>
                                                </TableCell>
                                                <TableCell width="20%" sx={{ verticalAlign: 'top', pt: 1.5 }}>
                                                    {isEditable ? (
                                                        <BOSTextField
                                                            size="small"
                                                            type="number"
                                                            value={row.negotiatedPrice === 0 ? '0' : row.negotiatedPrice || ''}
                                                            onChange={(e) => handleTransactionChange(index, 'negotiatedPrice', e.target.value)}
                                                            inputProps={{ style: { textAlign: 'right', fontWeight: 'bold' } }}
                                                            sx={{
                                                                width: '120px',
                                                                bgcolor: alpha(theme.palette.primary.light, 0.05),
                                                                '& .MuiOutlinedInput-root': { borderColor: isPriceIncreased ? 'warning.main' : isPriceReduced ? 'success.main' : 'divider' }
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography variant="body2" fontWeight="700">[ ₹{row.negotiatedPrice?.toFixed(2)} ]</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell width="30%" sx={{ verticalAlign: 'top', pt: 2 }}>
                                                    {isPriceReduced && <Typography variant="body2" color="success.main" fontWeight="bold">↓ ₹{row.savings?.toFixed(2)}</Typography>}
                                                    {isPriceIncreased && <Typography variant="body2" color="warning.main" fontWeight="bold">↑ ₹{Math.abs(row.savings).toFixed(2)}</Typography>}
                                                    {(row.savings === 0 || !row.savings) && <Typography variant="body2" color="textSecondary">₹0.00</Typography>}
                                                </TableCell>
                                            </TableRow>

                                            {/* SECONDARY ROW */}
                                            <TableRow hover sx={{ '& td': { pt: 0.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }, bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.4) : alpha(theme.palette.grey[50], 0.6) }}>
                                                <TableCell colSpan={4} sx={{ pl: 2 }}>
                                                    <Box display="flex" flexWrap="wrap" gap={3} alignItems="center">
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Typography variant="caption" color="textSecondary" minWidth={50}>Delivery</Typography>
                                                            <Typography variant="body2" color="textSecondary">{row.originalDeliveryDays || 'N/A'} →</Typography>
                                                            {isEditable ? (
                                                                <BOSTextField size="small" type="number" placeholder="Days" value={row.negotiatedDeliveryDays === 0 ? '0' : row.negotiatedDeliveryDays || ''} onChange={(e) => handleTransactionChange(index, 'negotiatedDeliveryDays', e.target.value)} sx={{ width: '70px', bgcolor: alpha(theme.palette.primary.light, 0.05) }} />
                                                            ) : (
                                                                <Typography variant="body2" fontWeight="600">[{row.negotiatedDeliveryDays || 'N/A'}]</Typography>
                                                            )}
                                                        </Box>

                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Typography variant="caption" color="textSecondary" minWidth={60}>Warranty</Typography>
                                                            <Typography variant="body2" color="textSecondary">{row.originalWarranty || 'N/A'} →</Typography>
                                                            {isEditable ? (
                                                                <BOSTextField size="small" placeholder="Months/Years" value={row.negotiatedWarranty || ''} onChange={(e) => handleTransactionChange(index, 'negotiatedWarranty', e.target.value)} sx={{ width: '120px', bgcolor: alpha(theme.palette.primary.light, 0.05) }} />
                                                            ) : (
                                                                <Typography variant="body2" fontWeight="600">[{row.negotiatedWarranty || 'N/A'}]</Typography>
                                                            )}
                                                        </Box>

                                                        <Box display="flex" alignItems="center" gap={1} flex={1} minWidth={200}>
                                                            <Typography variant="caption" color="textSecondary">Remarks</Typography>
                                                            {isEditable ? (
                                                                <BOSTextField size="small" fullWidth placeholder="Negotiation remark..." value={row.remarks || ''} onChange={(e) => handleTransactionChange(index, 'remarks', e.target.value)} sx={{ bgcolor: alpha(theme.palette.primary.light, 0.05) }} />
                                                            ) : (
                                                                <Typography variant="body2" color="textSecondary">[{row.remarks || 'None'}]</Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    );
                                })}
                        </TableBody>
                    </Table>

                </TableContainer>

                {/* 6. TOTAL FOOTER */}
                <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.2) : alpha(theme.palette.primary.light, 0.1), borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Typography variant="subtitle2" fontWeight="bold" color="primary.main">NEGOTIATION TOTAL</Typography>
                        <Box display="flex" gap={4} flexWrap="wrap">
                            <Box>
                                <Typography variant="caption" color="textSecondary" display="block">Original Total</Typography>
                                <Typography variant="subtitle2" fontWeight="700">₹{formData.originalTotal?.toFixed(2)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="textSecondary" display="block">Negotiated Total</Typography>
                                <Typography variant="subtitle2" fontWeight="700">₹{formData.negotiatedTotal?.toFixed(2)}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="textSecondary" display="block">Total Savings</Typography>
                                <Typography variant="subtitle2" fontWeight="800" color={hasTotalSavings ? 'success.main' : hasTotalIncrease ? 'warning.main' : 'textPrimary'}>
                                    ₹{formData.totalSavings?.toFixed(2)} <Box component="span" sx={{ fontWeight: 600, fontSize: '0.8em' }}>({totalSavingsPct}%)</Box>
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* 4. REMARKS (Moved below datatable) */}
            <Grid container spacing={2} sx={{ mt: 1, mb: 2 }}>
                <Grid item xs={12} md={6}>
                    <BOSTextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Internal Remarks *"
                        placeholder="Enter internal remarks..."
                        value={formData.negotiationRemarks || ''}
                        onChange={(e) => {
                            setFormData({ ...formData, negotiationRemarks: e.target.value });
                            if (e.target.value.trim() !== '') {
                                setFormErrors(prev => ({ ...prev, negotiationRemarks: null }));
                            }
                        }}
                        disabled={!isEditable}
                        error={Boolean(formErrors.negotiationRemarks)}
                        helperText={formErrors.negotiationRemarks}
                        sx={{ animation: shakeFields.negotiationRemarks ? `${shakeAnimation} 0.4s` : 'none', bgcolor: 'background.paper', '& .MuiInputBase-root': { py: 1 } }}
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <BOSTextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Supplier Remarks"
                        placeholder="Enter supplier remarks..."
                        value={formData.supplierRemarks || ''}
                        onChange={(e) => setFormData({ ...formData, supplierRemarks: e.target.value })}
                        disabled={!isEditable}
                        sx={{ bgcolor: 'background.paper', '& .MuiInputBase-root': { py: 1 } }}
                    />
                </Grid>
            </Grid>

            {/* 7. NEGOTIATION HISTORY */}
            <Accordion elevation={0} variant="outlined" sx={{ mt: 3, borderRadius: 2, '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.4) : alpha(theme.palette.grey[50], 0.6) }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        Negotiation History
                        <Chip size="small" label={`${formData.history?.length || 0} Events`} sx={{ ml: 1.5, height: 20, fontSize: '0.7rem' }} />
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.2) : alpha(theme.palette.primary.light, 0.1) }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {formData.history?.map((h) => (
                                <TableRow key={h.id} hover>
                                    <TableCell>{format(new Date(h.actionDate), 'dd-MMM-yyyy HH:mm')}</TableCell>
                                    <TableCell>
                                        <Chip label={h.actionType} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.75rem' }} />
                                    </TableCell>
                                    <TableCell>{h.userId}</TableCell>
                                    <TableCell>{h.remarks}</TableCell>
                                </TableRow>
                            ))}
                            {(!formData.history || formData.history.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No history available</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default QuoteNegotiationEntry;
