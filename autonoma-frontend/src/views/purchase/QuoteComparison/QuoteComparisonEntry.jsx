import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Grid, Typography, Button, Paper, Alert, Divider, useTheme, alpha,
    Avatar, Chip, CircularProgress, IconButton, Tooltip, Stack, TextField,
    MenuItem, Collapse, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
    EmojiEvents as TrophyIcon,
    CompareArrows,
    LocalShipping,
    Gavel,
    BarChart as BarChartIcon,
    Assignment as AssignmentIcon,
    Star as StarIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import MainCard from 'ui-component/cards/MainCard';
import useQuoteComparisonStore from '../../../store/purchase/useQuoteComparisonStore';
import useRfqStore from '../../../store/useRfqStore';
import useAuth from 'hooks/useAuth';
import {
    IconDeviceFloppy, IconArrowLeft, IconCheck, IconFileExport, IconPrinter,
    IconAlertCircle, IconRefresh, IconShoppingCart, IconTrash
} from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import usePurchaseOrderStore from 'store/usePurchaseOrderStore';
import useProcurementSettingsStore from 'store/useProcurementSettingsStore';
import { BOSTextField, BOSAutocomplete, BOSFormDialog } from 'ui-component/bos';

// Sub-components
import ComparisonProgressStepper from './ComparisonProgressStepper';
import ComparisonRfqSummary from './ComparisonRfqSummary';
import ComparisonFilterBar from './ComparisonFilterBar';
import ComparisonMatrix from './ComparisonMatrix';
import ComparisonCommercialTabs from './ComparisonCommercialTabs';
import ComparisonCharts from './ComparisonCharts';
import ComparisonSupplierRating from './ComparisonSupplierRating';
import ComparisonDeliveryComparison from './ComparisonDeliveryComparison';

// ─── Collapsible Section Panel ────────────────────────────────────────────────
function SectionPanel({ title, subtitle, icon, defaultOpen = true, children, rightContent, id }) {
    const [open, setOpen] = useState(defaultOpen);
    const theme = useTheme();
    return (
        <Box id={id} sx={{ mb: 1.5 }}>
            <Box
                onClick={() => setOpen(o => !o)}
                sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 1.5, py: 0.75,
                    cursor: 'pointer',
                    borderRadius: open ? '6px 6px 0 0' : '6px',
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.7) : alpha(theme.palette.grey[50], 0.95),
                    '&:hover': { bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.primary.main, 0.04) },
                    transition: 'background-color 0.15s',
                    userSelect: 'none'
                }}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    {icon && <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>{icon}</Box>}
                    <Box>
                        <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.primary', display: 'block', lineHeight: 1.2 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.64rem', display: 'block', lineHeight: 1.1 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                    {rightContent}
                    {open
                        ? <ExpandLessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        : <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    }
                </Box>
            </Box>
            <Collapse in={open}>
                <Box sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderTop: 'none',
                    borderRadius: '0 0 6px 6px',
                    overflow: 'hidden',
                    bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff'
                }}>
                    {children}
                </Box>
            </Collapse>
        </Box>
    );
}

// ─── Award Decision Dialog ────────────────────────────────────────────────────
function AwardDecisionDialog({
    open, onClose, suppliers, supplierTotals, recommendedSupplierId,
    formData, setFormData, onSave, isLocked
}) {
    const theme = useTheme();
    const selectedId = formData?.overallSelectedSupplierId || recommendedSupplierId;
    const selectedSupplier = suppliers.find(s => String(s.id) === String(selectedId));
    const selectedTotal = supplierTotals[selectedId]?.grandTotal || 0;
    const recSupplier = suppliers.find(s => s.id === recommendedSupplierId);
    const isOverride = selectedId && String(selectedId) !== String(recommendedSupplierId);
    const maxTotal = Object.values(supplierTotals).length > 0 ? Math.max(...Object.values(supplierTotals).map(t => t.grandTotal || 0)) : 0;
    const savings = maxTotal > selectedTotal && selectedTotal > 0 ? maxTotal - selectedTotal : 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ p: 0.75, bgcolor: 'primary.main', borderRadius: 1.5, display: 'flex' }}>
                        <Gavel sx={{ color: '#fff', fontSize: 20 }} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>Award Decision</Typography>
                        <Typography variant="caption" color="text.secondary">Finalize supplier selection for this RFQ</Typography>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 2.5 }}>
                <Stack spacing={2}>
                    {/* Recommended indicator */}
                    {recSupplier && (
                        <Box sx={{
                            px: 2, py: 1.25, borderRadius: 1.5,
                            bgcolor: alpha(theme.palette.warning.main, 0.06),
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`
                        }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', display: 'block', mb: 0.25 }}>
                                Recommended
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box display="flex" alignItems="center" gap={1}>
                                    <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                                    <Typography variant="subtitle2" fontWeight={800} color="warning.dark">
                                        {recSupplier.name}
                                    </Typography>
                                </Box>
                                <Box textAlign="right">
                                    <Typography variant="body2" fontWeight={800}>
                                        ₹ {(supplierTotals[recommendedSupplierId]?.grandTotal || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </Typography>
                                    {recSupplier.deliveryDays && (
                                        <Typography variant="caption" color="text.secondary">
                                            {recSupplier.deliveryDays}d delivery
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* Supplier selector */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', display: 'block', mb: 0.75 }}>
                            Winning Supplier *
                        </Typography>
                        <TextField
                            select fullWidth size="small"
                            value={formData?.overallSelectedSupplierId || recommendedSupplierId || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, overallSelectedSupplierId: e.target.value }))}
                            disabled={isLocked}
                        >
                            {suppliers.map(s => (
                                <MenuItem key={s.id} value={s.id}>
                                    {s.id === recommendedSupplierId && '⭐ '}
                                    {s.name}
                                    {s.id === recommendedSupplierId ? ' (Recommended)' : ''}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    {/* Summary of selected */}
                    {selectedSupplier && (
                        <Grid container spacing={1.5}>
                            <Grid item xs={4}>
                                <Box sx={{ p: 1.25, bgcolor: alpha(theme.palette.primary.light, 0.05), borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                                    <Typography variant="caption" color="text.secondary" display="block">Grand Total</Typography>
                                    <Typography variant="subtitle2" fontWeight={800}>
                                        ₹ {selectedTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={4}>
                                <Box sx={{ p: 1.25, bgcolor: alpha(theme.palette.primary.light, 0.05), borderRadius: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                                    <Typography variant="caption" color="text.secondary" display="block">Delivery</Typography>
                                    <Typography variant="subtitle2" fontWeight={800}>
                                        {selectedSupplier.deliveryDays ? `${selectedSupplier.deliveryDays}d` : '—'}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={4}>
                                <Box sx={{
                                    p: 1.25,
                                    bgcolor: savings > 0 ? alpha(theme.palette.success.light, 0.1) : alpha(theme.palette.primary.light, 0.05),
                                    borderRadius: 1.5,
                                    border: `1px solid ${savings > 0 ? theme.palette.success.light : theme.palette.divider}`
                                }}>
                                    <Typography variant="caption" color="text.secondary" display="block">Savings</Typography>
                                    <Typography variant="subtitle2" fontWeight={800} color={savings > 0 ? 'success.main' : 'text.primary'}>
                                        {savings > 0 ? `₹ ${savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    )}

                    {/* Override warning */}
                    {isOverride && (
                        <Alert severity="warning" sx={{ borderRadius: 1.5, py: 0.5 }}>
                            <Typography variant="caption" fontWeight={700}>
                                Different from recommended supplier. Justification is required.
                            </Typography>
                        </Alert>
                    )}

                    {/* Justification */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', display: 'block', mb: 0.75 }}>
                            Justification {isOverride ? '*' : '(Optional)'}
                        </Typography>
                        <TextField
                            fullWidth multiline rows={3} size="small"
                            value={formData?.overrideReason || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, overrideReason: e.target.value }))}
                            placeholder={isOverride
                                ? 'Required: Explain why you are selecting a different supplier...'
                                : 'Enter any justification or award remarks...'}
                            disabled={isLocked}
                        />
                    </Box>

                    {isLocked && (
                        <Chip label="Decision Locked — Read Only" color="success" size="small" sx={{ fontWeight: 700, borderRadius: 1, alignSelf: 'flex-start' }} />
                    )}
                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
                <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}>
                    Cancel
                </Button>
                {!isLocked && (
                    <Button onClick={onSave} variant="contained" color="primary" sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700, px: 3 }}>
                        Save Decision
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default function QuoteComparisonEntry() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const { user } = useAuth();
    const { currentComparison, loading, error, fetchComparisonById, generateComparison } = useQuoteComparisonStore();
    const { rfqs, fetchRfqs } = useRfqStore();
    const { previewFromSource } = usePurchaseOrderStore();
    const { settings: procSettings, fetchSettings: fetchProcSettings } = useProcurementSettingsStore();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState(null);
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [verifyRemarks, setVerifyRemarks] = useState('');
    const [awardDialogOpen, setAwardDialogOpen] = useState(false);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [supplierFilter, setSupplierFilter] = useState('ALL');
    const [showVariationsOnly, setShowVariationsOnly] = useState(false);

    // ─── Data fetching ─────────────────────────────────────────────
    useEffect(() => {
        if (!id && user?.divisionId) {
            fetchRfqs(user.divisionId);
        }
        if (user?.divisionId) {
            fetchProcSettings(user.divisionId);
        }
    }, [id, user?.divisionId, fetchRfqs, fetchProcSettings]);

    useEffect(() => {
        if (id) {
            fetchComparisonById(id);
        } else {
            setFormData({ rfqId: '', selectionType: 'ENTIRE_RFQ' });
        }
    }, [id, fetchComparisonById]);

    useEffect(() => {
        if (currentComparison && id) {
            setFormData(currentComparison);
        }
    }, [currentComparison, id]);

    // ─── Handlers ──────────────────────────────────────────────────

    const handleVerify = useCallback(async () => {
        if (!id) return;
        try {
            const { verifyComparison } = useQuoteComparisonStore.getState();
            const uid = user?.userId || user?.id;
            await verifyComparison(id, uid, verifyRemarks);
            setVerifyDialogOpen(false);
            dispatch(openSnackbar({ open: true, message: 'Comparison verified successfully', variant: 'alert', severity: 'success' }));
            fetchComparisonById(id);
        } catch (err) {
            console.error('Failed to verify comparison', err);
            dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || err.message || 'Failed to verify comparison', variant: 'alert', severity: 'error' }));
        }
    }, [id, user, verifyRemarks, fetchComparisonById, dispatch]);

    const handleCreatePo = useCallback(async () => {
        try {
            const previewPo = await previewFromSource({
                sourceType: 'QUOTATION_COMPARISON',
                sourceDocId: id,
                divisionId: user?.divisionId
            });
            dispatch(openSnackbar({ open: true, message: 'Purchase Order preview generated successfully', variant: 'alert', severity: 'success' }));
            navigate('/purchase/po/entry', { state: { previewData: previewPo, sourceType: 'QUOTATION_COMPARISON' } });
        } catch (e) {
            dispatch(openSnackbar({ open: true, message: e?.response?.data?.message || e.message || 'Failed to generate PO', variant: 'alert', severity: 'error' }));
        }
    }, [id, user?.divisionId, previewFromSource, dispatch, navigate]);

    const handleRefresh = useCallback(() => {
        if (id) fetchComparisonById(id);
    }, [id, fetchComparisonById]);

    const handleDelete = useCallback(async () => {
        if (!id) return;
        if (!window.confirm('Are you sure you want to delete this Quote Comparison?')) return;
        try {
            const { deleteComparison } = useQuoteComparisonStore.getState();
            await deleteComparison(id);
            dispatch(openSnackbar({ open: true, message: 'Comparison deleted successfully', variant: 'alert', severity: 'success' }));
            navigate('/purchase/comparison');
        } catch (err) {
            console.error('Failed to delete comparison', err);
            dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || err.message || 'Failed to delete comparison', variant: 'alert', severity: 'error' }));
        }
    }, [id, dispatch, navigate]);

    const handleRfqSelect = useCallback((val) => {
        const rfqId = val && typeof val === 'object' ? val.value : val;
        setFormData(prev => ({ ...prev, rfqId }));
        if (rfqId) {
            const uid = user?.userId || user?.id || 'admin';
            generateComparison(rfqId, uid).then((data) => {
                if (data?.id) navigate(`/purchase/comparison/entry/${data.id}`, { replace: true });
            });
        }
    }, [user, generateComparison, navigate]);

    const isLocked = ['LOCKED', 'VERIFIED'].includes((formData?.statusName || '').toUpperCase());

    // ─── Matrix Transformation (memoised — no recalculation in JSX) ──
    const derived = useMemo(() => {
        const _items = [];
        const _suppliers = [];
        const _matrix = {};
        const _lowestTotals = {};
        const _supplierTotals = {};

        if (!formData?.matrixItems?.length) {
            return { items: _items, suppliers: _suppliers, matrix: _matrix, lowestTotals: _lowestTotals, supplierTotals: _supplierTotals, rankedSuppliers: [], lowestGrandTotal: 0, recommendedSupplierId: null, hasData: false };
        }

        formData.matrixItems.forEach(item => {
            // Build unique items list
            if (!_items.find(i => i.id === item.rfqItemId)) {
                _items.push({
                    id: item.rfqItemId,
                    name: item.itemName,
                    qty: item.qty || 1,
                    uom: item.uom || 'Nos',
                    itemCode: item.itemCode || ''
                });
            }
            // Build unique suppliers list (pick highest scores across items for same supplier)
            const existingSupplier = _suppliers.find(s => s.id === item.supplierId);
            if (!existingSupplier) {
                _suppliers.push({
                    id: item.supplierId,
                    name: item.supplierName,
                    deliveryDays: item.deliveryDays,
                    warranty: item.warranty,
                    paymentTerms: item.paymentTerms,
                    currency: item.currency || 'INR',
                    technicalScore: item.technicalScore,
                    commercialScore: item.commercialScore,
                    freight: item.freight,
                    quotationNo: item.quotationNo || '',
                    quotationDate: item.quotationDate || '',
                    supplierReferenceNo: item.supplierReferenceNo || '',
                    headTaxAmount: item.headTaxAmount || 0,
                    headFreight: item.headFreight || 0,
                    distance: item.distance,
                    pastDeliveryPerformance: item.pastDeliveryPerformance,
                    pastQualityPerformance: item.pastQualityPerformance,
                    transportScope: item.transportScope
                });
            } else {
                // Update scores if better data available
                if (item.technicalScore && !existingSupplier.technicalScore) existingSupplier.technicalScore = item.technicalScore;
                if (item.commercialScore && !existingSupplier.commercialScore) existingSupplier.commercialScore = item.commercialScore;
            }

            // Build matrix
            if (!_matrix[item.rfqItemId]) _matrix[item.rfqItemId] = {};
            _matrix[item.rfqItemId][item.supplierId] = item;

            // Accumulate supplier totals
            if (!_supplierTotals[item.supplierId]) {
                _supplierTotals[item.supplierId] = { subtotal: 0, tax: 0, freight: 0, grandTotal: 0, itemTaxTotal: 0, itemFreightTotal: 0 };
            }
            const st = _supplierTotals[item.supplierId];
            const qty = Number(item.qty || 1);
            const price = Number(item.isNegotiated ? item.negotiatedPrice : item.originalPrice || 0);
            st.subtotal += price * qty;
            const lineTotal = price * qty;
            const taxPercent = Number(item.tax || 0);
            const taxAmt = taxPercent > 0 ? (lineTotal * taxPercent) / 100 : 0;
            st.itemTaxTotal += taxAmt;
            st.itemFreightTotal += Number(item.freight || 0);
            st.grandTotal += Number(item.totalAmount || 0);
        });

        // Add header level charges to supplier totals
        _suppliers.forEach(s => {
            const st = _supplierTotals[s.id];
            if (st) {
                st.tax = st.itemTaxTotal + Number(s.headTaxAmount || 0);
                st.freight = st.itemFreightTotal + Number(s.headFreight || 0);
                st.grandTotal += Number(s.headTaxAmount || 0) + Number(s.headFreight || 0);
            }
        });

        // Item-level lowest total (across suppliers)
        _items.forEach(item => {
            let min = Infinity;
            _suppliers.forEach(s => {
                const cell = _matrix[item.id]?.[s.id];
                if (cell && Number(cell.totalAmount) > 0 && Number(cell.totalAmount) < min) {
                    min = Number(cell.totalAmount);
                }
            });
            _lowestTotals[item.id] = min === Infinity ? 0 : min;
        });

        // Composite Score Calculation for Ranking based on Procurement Settings
        let minGrandTotal = Infinity;
        let minDistance = Infinity;

        _suppliers.forEach(s => {
            const st = _supplierTotals[s.id];
            if (st && st.grandTotal > 0 && st.grandTotal < minGrandTotal) minGrandTotal = st.grandTotal;
            if (s.distance && s.distance > 0 && s.distance < minDistance) minDistance = s.distance;
        });

        // Weights from settings
        const weightPrice = Number(procSettings?.weightPrice || 40);
        const weightDelivery = Number(procSettings?.weightDelivery || 20);
        const weightRating = Number(procSettings?.weightRating || 15);
        const weightWarranty = Number(procSettings?.weightWarranty || 10);
        const weightPayment = Number(procSettings?.weightPayment || 15);

        let minDeliveryDays = Infinity;
        _suppliers.forEach(s => {
            if (s.deliveryDays && s.deliveryDays > 0 && s.deliveryDays < minDeliveryDays) {
                minDeliveryDays = s.deliveryDays;
            }
        });

        _suppliers.forEach(s => {
            const st = _supplierTotals[s.id];
            let priceScore = 0;
            let deliveryScore = 0;
            let ratingScore = 0;
            let warrantyScore = weightWarranty; // Max by default if no variations, or custom logic
            let paymentScore = weightPayment; // Max by default if no variations, or custom logic

            // Price Score
            if (st && st.grandTotal > 0 && minGrandTotal !== Infinity) {
                priceScore = (minGrandTotal / st.grandTotal) * weightPrice;
            }

            // Delivery Score (Quoted Days + Past Performance)
            let deliveryDaysScore = 0;
            if (s.deliveryDays && minDeliveryDays !== Infinity) {
                deliveryDaysScore = (minDeliveryDays / s.deliveryDays) * weightDelivery;
            } else if (!s.deliveryDays) {
                deliveryDaysScore = 0;
            } else {
                deliveryDaysScore = weightDelivery;
            }

            if (s.pastDeliveryPerformance) {
                deliveryScore = (deliveryDaysScore + ((Number(s.pastDeliveryPerformance) / 100) * weightDelivery)) / 2;
            } else {
                deliveryScore = deliveryDaysScore;
            }

            // Rating Score (Quality)
            if (s.pastQualityPerformance) {
                ratingScore = (Number(s.pastQualityPerformance) / 100) * weightRating;
            } else {
                ratingScore = weightRating; // Default full points
            }

            // Transport Bonus logic
            let transportScore = 0;
            if (s.transportScope === 'SUPPLIER') {
                if (st && st.freight === 0) {
                    transportScore = 5; // Best: Supplier arranges for free
                } else {
                    transportScore = 2; // Better: Supplier arranges but charges
                }
            } else {
                transportScore = 0; // Buyer arranges
            }
            s.transportScore = transportScore;

            let commScore = priceScore + deliveryScore + paymentScore + transportScore;
            let techScore = ratingScore + warrantyScore;

            // Re-normalize to 100 for each section if needed, but since they sum to 100, their absolute values represent their contribution.
            // Let's store them scaled to 100 max for Technical and Commercial
            let totalCommWeight = weightPrice + weightDelivery + weightPayment;
            let totalTechWeight = weightRating + weightWarranty;

            let commScoreScaled = totalCommWeight > 0 ? (commScore / totalCommWeight) * 100 : 0;
            let techScoreScaled = totalTechWeight > 0 ? (techScore / totalTechWeight) * 100 : 0;

            s.technicalScore = techScoreScaled;
            s.commercialScore = commScoreScaled;

            s.techScoreFormula = `Formula: ((Quality Score + Warranty Score) / Total Tech Weight) × 100\nActual: ((${ratingScore.toFixed(1)} + ${warrantyScore.toFixed(1)}) / ${totalTechWeight}) × 100 = ${techScoreScaled.toFixed(1)}`;
            s.commScoreFormula = `Formula: ((Price Score + Delivery Score + Payment Score + Transport Bonus) / Total Comm Weight) × 100\nActual: ((${priceScore.toFixed(1)} + ${deliveryScore.toFixed(1)} + ${paymentScore.toFixed(1)} + ${transportScore.toFixed(1)}) / ${totalCommWeight}) × 100 = ${commScoreScaled.toFixed(1)}`;

            let compositeScore = priceScore + deliveryScore + ratingScore + warrantyScore + paymentScore + transportScore;

            s.compositeScoreFormula = `Formula: Price Score + Delivery + Quality + Warranty + Payment + Transport Bonus\nActual: ${priceScore.toFixed(1)} + ${deliveryScore.toFixed(1)} + ${ratingScore.toFixed(1)} + ${warrantyScore.toFixed(1)} + ${paymentScore.toFixed(1)} + ${transportScore.toFixed(1)} = ${compositeScore.toFixed(1)}`;

            if (st) st.compositeScore = compositeScore;
        });

        const _ranked = [..._suppliers].sort((a, b) => (_supplierTotals[b.id]?.compositeScore || 0) - (_supplierTotals[a.id]?.compositeScore || 0));
        const _lowestGrandTotal = _ranked.length > 0 ? (_supplierTotals[_ranked[0].id]?.grandTotal || 0) : 0;
        const _recId = _ranked.length > 0 ? _ranked[0].id : null;

        return {
            items: _items,
            suppliers: _suppliers,
            matrix: _matrix,
            lowestTotals: _lowestTotals,
            supplierTotals: _supplierTotals,
            rankedSuppliers: _ranked,
            lowestGrandTotal: _lowestGrandTotal,
            recommendedSupplierId: _recId,
            hasData: _suppliers.length > 0 && _items.length > 0
        };
    }, [formData?.matrixItems, procSettings]);

    const handleSave = useCallback(async () => {
        if (!id) return;
        try {
            const { lockComparison } = useQuoteComparisonStore.getState();
            const uid = user?.userId || user?.id || 'admin';
            const payload = {
                ...formData,
                overallRecommendedSupplierId: formData.overallRecommendedSupplierId || derived.recommendedSupplierId,
                overallSelectedSupplierId: formData.overallSelectedSupplierId || formData.overallRecommendedSupplierId || derived.recommendedSupplierId
            };
            await lockComparison(id, uid, payload);
            dispatch(openSnackbar({ open: true, message: 'Comparison locked successfully', variant: 'alert', severity: 'success' }));
            fetchComparisonById(id);
            setAwardDialogOpen(false);
        } catch (err) {
            console.error('Failed to lock comparison', err);
            dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || err.message || 'Failed to lock comparison', variant: 'alert', severity: 'error' }));
        }
    }, [id, user, fetchComparisonById, dispatch, formData, derived.recommendedSupplierId]);

    // ─── Summary values ─────────────────────────────────────────────
    const bestSupplier = derived.rankedSuppliers[0] || null;
    const bestTotal = bestSupplier ? (derived.supplierTotals[bestSupplier.id]?.grandTotal || 0) : 0;
    const maxTotal = derived.suppliers.length > 0 ? Math.max(...Object.values(derived.supplierTotals).map(t => t.grandTotal || 0)) : 0;
    const savings = maxTotal > bestTotal ? maxTotal - bestTotal : 0;

    // Tie-breaker: multiple suppliers at the same lowest price
    const lowestTotal = derived.lowestGrandTotal;
    const tieSuppliersAtLowest = derived.suppliers.filter(s =>
        Math.abs((derived.supplierTotals[s.id]?.grandTotal || 0) - lowestTotal) < 0.01 && lowestTotal > 0
    );
    const hasTie = tieSuppliersAtLowest.length > 1;
    const fastestDeliveryDays = derived.suppliers.filter(s => s.deliveryDays).length > 0
        ? Math.min(...derived.suppliers.filter(s => s.deliveryDays).map(s => s.deliveryDays))
        : null;

    const statusName = (formData?.statusName || 'DRAFT').toUpperCase();
    const statusChipColor = statusName === 'VERIFIED' ? 'info' : statusName === 'LOCKED' ? 'success' : 'default';

    // Check for SUPER_ADMIN to allow overriding delete restrictions
    const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.roles?.includes('SUPER_ADMIN') || user?.roleName === 'SUPER_ADMIN' || user?.userLevel === 5;

    return (
        <Box sx={{ pb: 4 }}>
            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 1. STICKY HEADER                                           */}
            {/* ═══════════════════════════════════════════════════════════ */}
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
                            width: 45,
                            height: 45,
                            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
                        }}
                    >
                        <CompareArrows fontSize="medium" />
                    </Avatar>
                    <Box>
                        <Typography variant="h3" fontWeight="800" sx={{
                            mb: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}>
                            <span style={{
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}>
                                {id ? `Quote Comparison: ${formData?.comparisonNo || 'Loading...'}` : 'New Quote Comparison'}
                            </span>
                            {id && (
                                <Chip label={statusName} size="small" color={statusChipColor}
                                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                            )}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
                            {id
                                ? `RFQ: ${formData?.rfqNo || 'N/A'}`
                                : 'Compare supplier quotations'}
                        </Typography>
                    </Box>
                </Box>

                <Box gap={1.5} display="flex" alignItems="center">
                    {id && (
                        <>
                            <Tooltip title="Refresh"><IconButton onClick={handleRefresh}><IconRefresh size={20} /></IconButton></Tooltip>
                            <Tooltip title="Export"><IconButton><IconFileExport size={20} /></IconButton></Tooltip>
                            <Tooltip title="Print"><IconButton><IconPrinter size={20} /></IconButton></Tooltip>
                            <Divider orientation="vertical" flexItem sx={{ height: 24, my: 'auto', mx: 0.5 }} />
                        </>
                    )}
                    <Button variant="outlined" sx={{ borderRadius: 2, px: 3, borderWidth: 2, '&:hover': { borderWidth: 2 } }} onClick={() => {
                        if (location.state?.from) {
                            navigate(location.state.from);
                        } else {
                            navigate('/purchase/comparison');
                        }
                    }}>
                        Close
                    </Button>
                    {id && (!isLocked || isSuperAdmin) && (
                        <Button variant="contained" color="error" 
                            startIcon={<IconTrash size={18} />}
                            onClick={handleDelete}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                            Delete
                        </Button>
                    )}
                    {id && !isLocked && (
                        <Button variant="contained" color="primary" 
                            startIcon={<IconDeviceFloppy size={18} />}
                            onClick={handleSave}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                            Lock & Save
                        </Button>
                    )}
                    {id && statusName === 'LOCKED' && (
                        <Button variant="contained" color="info" 
                            startIcon={<IconCheck size={18} />}
                            onClick={() => setVerifyDialogOpen(true)}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                            Verify
                        </Button>
                    )}
                    {id && statusName === 'VERIFIED' && (
                        <Button variant="contained" color="success" 
                            startIcon={<IconShoppingCart size={18} />}
                            onClick={handleCreatePo}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
                            Create PO
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* 2. WORKFLOW STEPPER                                        */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <ComparisonProgressStepper statusName={statusName} isNew={!id} />

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* RFQ SELECTOR (new mode only)                               */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {!id && (
                <Box sx={{ my: 2 }}>
                    <MainCard stretch={false}>
                        <Typography variant="h5" fontWeight={700} mb={2}>Select RFQ to Compare</Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={6}>
                                <BOSAutocomplete
                                    label="RFQ"
                                    value={formData?.rfqId || null}
                                    onChange={handleRfqSelect}
                                    options={rfqs ? rfqs.filter(r => r.quotationNos && r.quotationNos.trim() !== '').map(r => ({ value: r.id, label: `${r.rfqNo}${r.statusName ? ` (${r.statusName})` : ''}` })) : []}
                                    required
                                />
                            </Grid>
                        </Grid>
                        {loading && (
                            <Box display="flex" alignItems="center" gap={1.5} mt={2}>
                                <CircularProgress size={18} />
                                <Typography variant="body2" color="text.secondary">Generating comparison matrix...</Typography>
                            </Box>
                        )}
                    </MainCard>
                </Box>
            )}

            {/* ─── Error snackbar ──────────────────────────────────────── */}
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => useQuoteComparisonStore.setState({ error: null })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} sx={{ top: { xs: 70, sm: 80 } }}>
                <Alert onClose={() => { }} severity="error" sx={{ width: '100%', borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={700}>Backend Unavailable</Typography>
                    <Typography variant="caption" display="block">{error?.response?.data?.message || error?.message || 'Some data may be unavailable.'}</Typography>
                </Alert>
            </Snackbar>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* MAIN COMPARISON WORKSPACE                                  */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {id && derived.hasData && (
                <Box>
                    {/* ─── 3. COMPACT STICKY SUMMARY RIBBON ──────────────── */}
                    {bestSupplier && (
                        <Paper elevation={0} sx={{
                            position: 'sticky', top: 55, zIndex: 10, mb: 1.5,
                            px: 2, py: 0.8,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                            borderRadius: 1.5,
                            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.success.main, 0.05),
                            backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            flexWrap: 'wrap', gap: 1
                        }}>
                            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                                {/* L1 / Recommended supplier */}
                                <Box display="flex" alignItems="center" gap={0.75}>
                                    <TrophyIcon sx={{ color: 'warning.main', fontSize: 18 }} />
                                    <Box>
                                        <Typography variant="caption" fontWeight={800} color="success.dark" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', lineHeight: 1 }}>
                                            {hasTie ? 'Recommended' : 'L1 Supplier'}
                                        </Typography>
                                        <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.2 }}>{bestSupplier.name}</Typography>
                                    </Box>
                                </Box>

                                <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />

                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Total</Typography>
                                    <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                                        ₹ {bestTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </Typography>
                                </Box>

                                {savings > 0 && (
                                    <>
                                        <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Saving</Typography>
                                            <Typography variant="subtitle2" fontWeight={800} color="success.main">
                                                ₹ {savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                            </Typography>
                                        </Box>
                                    </>
                                )}

                                <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />

                                <Stack direction="row" spacing={2}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Items</Typography>
                                        <Typography variant="caption" fontWeight={700}>{derived.items.length}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Suppliers</Typography>
                                        <Typography variant="caption" fontWeight={700}>{derived.suppliers.length}</Typography>
                                    </Box>
                                </Stack>

                                {hasTie && (
                                    <>
                                        <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />
                                        <Tooltip title={`${tieSuppliersAtLowest.map(s => s.name).join(' & ')} have the same lowest price. ${bestSupplier.name} is recommended based on overall evaluation score.`} arrow>
                                            <Box display="flex" alignItems="center" gap={0.5} sx={{ cursor: 'help' }}>
                                                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: 'info.main' }} />
                                                <Typography variant="caption" color="info.main" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                                                    Same Price · Recommended by Score
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    </>
                                )}
                            </Stack>

                            <Button size="small" variant="contained" color="success"
                                startIcon={<Gavel sx={{ fontSize: 14 }} />}
                                onClick={() => setAwardDialogOpen(true)}
                                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 1.5, py: 0.4, fontSize: '0.75rem', boxShadow: 'none' }}>
                                View Award Decision
                            </Button>
                        </Paper>
                    )}

                    {/* ─── RFQ Summary + Filter Bar ──────────────────────── */}
                    <Box sx={{
                        mb: 1.5, px: 1.5, py: 1,
                        border: `1px solid ${theme.palette.divider}`, borderRadius: 1.5,
                        display: 'flex', flexDirection: { xs: 'column', lg: 'row' },
                        gap: 1.5, alignItems: { xs: 'flex-start', lg: 'center' },
                        bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.4) : alpha(theme.palette.grey[50], 0.8)
                    }}>
                        <Box sx={{ flex: 1 }}>
                            <ComparisonRfqSummary
                                rfqNo={formData?.rfqNo}
                                rfqDate={formData?.comparisonDate}
                                prNo={formData?.prNo}
                                prDate={formData?.prDate}
                                currency={derived.suppliers[0]?.currency || 'INR'}
                                totalItems={derived.items.length}
                                quotesReceived={derived.suppliers.length}
                                totalSuppliers={derived.suppliers.length}
                            />
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' } }} />
                        <Box>
                            <ComparisonFilterBar
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                supplierFilter={supplierFilter}
                                onSupplierFilterChange={setSupplierFilter}
                                suppliers={derived.suppliers}
                                showVariationsOnly={showVariationsOnly}
                                onShowVariationsChange={setShowVariationsOnly}
                                onRefresh={handleRefresh}
                            />
                        </Box>
                    </Box>

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* SECTION 1: PRIMARY COMPARISON MATRIX               */}
                    {/* ═══════════════════════════════════════════════════ */}
                    <Box sx={{ mb: 1.5 }}>
                        {/* Section header bar */}
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            px: 1.5, py: 0.75, border: `1px solid ${theme.palette.divider}`,
                            borderBottom: 'none', borderRadius: '6px 6px 0 0',
                            bgcolor: theme.palette.primary.main
                        }}>
                            <CompareArrows sx={{ color: '#fff', fontSize: 16 }} />
                            <Typography variant="caption" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 0.8, color: '#fff' }}>
                                Supplier Quotation Comparison
                            </Typography>
                            <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), fontSize: '0.64rem', ml: 0.5 }}>
                                · What did each supplier offer?
                            </Typography>
                        </Box>
                        <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                            <ComparisonMatrix
                                items={derived.items}
                                suppliers={derived.suppliers}
                                matrix={derived.matrix}
                                lowestTotals={derived.lowestTotals}
                                supplierTotals={derived.supplierTotals}
                                lowestGrandTotal={derived.lowestGrandTotal}
                                selectionType={formData?.selectionType || 'ENTIRE_RFQ'}
                                selectedSupplierId={formData?.overallRecommendedSupplierId || derived.recommendedSupplierId}
                                onSupplierSelect={(sid) => setFormData(prev => ({ ...prev, overallRecommendedSupplierId: sid }))}
                                isLocked={isLocked}
                                searchTerm={searchTerm}
                                supplierFilter={supplierFilter}
                                showVariationsOnly={showVariationsOnly}
                            />
                        </Box>
                        {/* Legend */}
                        <Stack direction="row" spacing={2} sx={{ mt: 0.75, px: 0.5 }} flexWrap="wrap" useFlexGap>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <Box component="span" sx={{ color: 'warning.main', fontWeight: 800, fontSize: '0.75rem' }}>★</Box>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Lowest price per item</Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <Chip label="Nego" size="small" color="info" variant="outlined" sx={{ height: 14, fontSize: '0.55rem' }} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Negotiated price applied</Typography>
                            </Stack>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <Chip label="BEST OFFER" size="small" color="warning" sx={{ height: 14, fontSize: '0.55rem' }} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Lowest grand total</Typography>
                            </Stack>
                        </Stack>
                    </Box>

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* SECTION 2: ITEM-WISE DELIVERY (collapsible)        */}
                    {/* ═══════════════════════════════════════════════════ */}
                    <SectionPanel
                        title="Item-wise Delivery"
                        subtitle="Delivery days comparison across suppliers"
                        icon={<LocalShipping sx={{ fontSize: 16 }} />}
                        defaultOpen={true}
                        id="delivery-section"
                    >
                        <Box sx={{ p: 1.5 }}>
                            <ComparisonDeliveryComparison
                                items={derived.items}
                                suppliers={derived.suppliers}
                                matrix={derived.matrix}
                            />
                        </Box>
                    </SectionPanel>

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* SECTION 3: SUPPLIER TERMS (collapsible)            */}
                    {/* ═══════════════════════════════════════════════════ */}
                    <SectionPanel
                        title="Supplier Terms & Conditions"
                        subtitle="Commercial, delivery, payment and warranty terms"
                        icon={<AssignmentIcon sx={{ fontSize: 16 }} />}
                        defaultOpen={false}
                        id="terms-section"
                    >
                        <Box sx={{ p: 1.5 }}>
                            <ComparisonCommercialTabs
                                suppliers={derived.suppliers}
                                matrix={derived.matrix}
                                items={derived.items}
                                remarks={formData?.overrideReason || ''}
                                onRemarksChange={(val) => setFormData(prev => ({ ...prev, overrideReason: val }))}
                                isLocked={isLocked}
                            />
                        </Box>
                    </SectionPanel>

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* SECTION 4: SUPPLIER RANKING & SCORES               */}
                    {/* ═══════════════════════════════════════════════════ */}
                    <SectionPanel
                        title="Supplier Ranking & Scores"
                        subtitle="Composite evaluation: price, delivery, quality, payment"
                        icon={<StarIcon sx={{ fontSize: 16 }} />}
                        defaultOpen={true}
                        id="ranking-section"
                        rightContent={hasTie && (
                            <Chip label="Tied Price · Ranked by Score" size="small" color="info" variant="outlined"
                                sx={{ fontSize: '0.6rem', height: 18, fontWeight: 600, mr: 1 }} />
                        )}
                    >
                        <Box sx={{ p: 1.5 }}>
                            <ComparisonSupplierRating
                                rankedSuppliers={derived.rankedSuppliers}
                                supplierTotals={derived.supplierTotals}
                            />
                        </Box>
                    </SectionPanel>

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* SECTION 5: INSIGHTS / CHARTS (collapsed by default) */}
                    {/* ═══════════════════════════════════════════════════ */}
                    <SectionPanel
                        title="Comparison Insights"
                        subtitle="Analytics and visual charts"
                        icon={<BarChartIcon sx={{ fontSize: 16 }} />}
                        defaultOpen={false}
                        id="insights-section"
                    >
                        <Box sx={{ p: 1.5 }}>
                            <ComparisonCharts
                                suppliers={derived.suppliers}
                                supplierTotals={derived.supplierTotals}
                            />
                        </Box>
                    </SectionPanel>

                    {/* ═══════════════════════════════════════════════════ */}
                    {/* AWARD DECISION CARD (compact, opens dialog)        */}
                    {/* ═══════════════════════════════════════════════════ */}
                    {bestSupplier && (
                        <Paper id="award-decision-section" elevation={0} sx={{
                            p: 2, mb: 2, borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
                            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.warning.main, 0.07) : alpha(theme.palette.warning.main, 0.04)
                        }}>
                            <Box display="flex" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2}>
                                <Box display="flex" alignItems="flex-start" gap={2}>
                                    <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'warning.main', display: 'flex' }}>
                                        <TrophyIcon sx={{ color: '#fff', fontSize: 22 }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                                            Recommended Supplier
                                        </Typography>
                                        <Typography variant="h6" fontWeight={800} color="warning.dark" sx={{ lineHeight: 1.3 }}>
                                            {bestSupplier.name}
                                        </Typography>
                                        <Stack direction="row" spacing={2} mt={0.75}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Total</Typography>
                                                <Typography variant="subtitle2" fontWeight={800}>
                                                    ₹ {bestTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                            {bestSupplier.deliveryDays && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Delivery</Typography>
                                                    <Typography variant="subtitle2" fontWeight={800}>{bestSupplier.deliveryDays}d</Typography>
                                                </Box>
                                            )}
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>Score</Typography>
                                                <Typography variant="subtitle2" fontWeight={800}>
                                                    {(derived.supplierTotals[bestSupplier.id]?.compositeScore || 0).toFixed(1)}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Stack direction="row" spacing={1} mt={1.25} flexWrap="wrap" useFlexGap>
                                            {savings > 0 && (
                                                <Chip icon={<IconCheck size={11} />} label={`Best value · Saving ₹${savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} size="small" color="success" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                            )}
                                            {fastestDeliveryDays && bestSupplier.deliveryDays === fastestDeliveryDays && (
                                                <Chip icon={<IconCheck size={11} />} label="Fastest delivery" size="small" color="success" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                            )}
                                            {hasTie
                                                ? <Chip label="Same price · Recommended by evaluation" size="small" color="info" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                                : <Chip icon={<IconCheck size={11} />} label="Lowest total" size="small" color="success" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                                            }
                                        </Stack>
                                    </Box>
                                </Box>

                                <Box display="flex" flexDirection="column" gap={1} alignItems="flex-end">
                                    {isLocked && <Chip label="Decision Locked" color="success" size="small" sx={{ fontWeight: 700 }} />}
                                    <Button variant="contained" color="warning"
                                        startIcon={<Gavel sx={{ fontSize: 16 }} />}
                                        onClick={() => setAwardDialogOpen(true)}
                                        sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, px: 3 }}>
                                        View Award Decision
                                    </Button>
                                    {statusName === 'LOCKED' && (
                                        <Button variant="outlined" color="info" size="small"
                                            startIcon={<IconCheck size={14} />}
                                            onClick={() => setVerifyDialogOpen(true)}
                                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}>
                                            Verify Comparison
                                        </Button>
                                    )}
                                    {statusName === 'VERIFIED' && (
                                        <Button variant="outlined" color="success" size="small"
                                            startIcon={<IconShoppingCart size={14} />}
                                            onClick={handleCreatePo}
                                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}>
                                            Create Purchase Order
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </Paper>
                    )}

                    {/* Footer */}
                    <Box display="flex" justifyContent="space-between" sx={{ px: 0.5, pb: 1 }}>
                        <Typography variant="caption" color="text.disabled">
                            Last updated: {formData?.comparisonDate ? new Date(formData.comparisonDate).toLocaleString('en-IN') : 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            {derived.items.length} Items · {derived.suppliers.length} Suppliers
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* NO DATA STATE                                              */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {id && !derived.hasData && !loading && (
                <Paper sx={{
                    p: 6, mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    borderRadius: 2, bgcolor: alpha(theme.palette.primary.light, 0.04),
                    border: `1px dashed ${theme.palette.divider}`
                }}>
                    <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, mb: 2 }}>
                        <IconAlertCircle size={32} />
                    </Avatar>
                    <Typography variant="h5" fontWeight={600} mb={0.5}>No comparison data available</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3} textAlign="center">
                        Complete supplier quotations for this RFQ before generating a comparison.
                    </Typography>
                    <Stack direction="row" spacing={1.5}>
                        <Button variant="outlined" onClick={() => navigate('/purchase/quotations')}>Go to Supplier Quotations</Button>
                        <Button variant="contained" startIcon={<IconRefresh size={16} />} onClick={handleRefresh}>Retry</Button>
                    </Stack>
                </Paper>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* LOADING STATE                                              */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {loading && (
                <Box display="flex" justifyContent="center" alignItems="center" py={8} gap={2}>
                    <CircularProgress size={24} />
                    <Typography color="text.secondary">Loading comparison data...</Typography>
                </Box>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* AWARD DECISION DIALOG                                      */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <AwardDecisionDialog
                open={awardDialogOpen}
                onClose={() => setAwardDialogOpen(false)}
                suppliers={derived.suppliers}
                supplierTotals={derived.supplierTotals}
                recommendedSupplierId={derived.recommendedSupplierId}
                formData={formData}
                setFormData={setFormData}
                onSave={handleSave}
                isLocked={isLocked}
            />

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* VERIFY DIALOG (preserved)                                  */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <BOSFormDialog
                open={verifyDialogOpen}
                onClose={() => setVerifyDialogOpen(false)}
                title="Verify Quote Comparison"
                onSave={handleVerify}
                saveLabel="Verify"
                maxWidth="sm"
            >
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <BOSTextField
                            label="Verification Remarks"
                            multiline rows={3}
                            value={verifyRemarks}
                            onChange={(e) => setVerifyRemarks(e.target.value)}
                            placeholder="Enter any remarks before verification..."
                            fullWidth
                        />
                    </Grid>
                </Grid>
            </BOSFormDialog>
        </Box>
    );
}

