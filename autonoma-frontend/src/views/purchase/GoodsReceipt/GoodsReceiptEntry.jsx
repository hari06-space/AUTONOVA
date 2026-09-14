import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box, Grid, Typography, Button, TextField, Paper, Avatar,
    CircularProgress, Alert, Chip, MenuItem, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconDeviceFloppy, IconCheck, IconTrash, IconPrinter, IconArrowLeft, IconPaperclip } from '@tabler/icons-react';
import { Receipt, ExpandMore } from '@mui/icons-material';
import { bos, bosConfirm } from 'ui-component/bos/BOSConfirmDialog';
import autonomaLogo from 'assets/images/autonoma-logo.png';
import Swal from 'sweetalert2';

// Project imports
import MainCard from 'ui-component/cards/MainCard';
import BOSFileUpload from 'ui-component/bos/BOSFileUpload';
import BOSDataTable from 'ui-component/bos/BOSDataTable';
import BOSTextField from 'ui-component/bos/BOSTextField';
import BOSStatusChip from 'ui-component/bos/BOSStatusChip';
import BOSAutocomplete from 'ui-component/bos/BOSAutocomplete';
import useAuth from 'hooks/useAuth';
import useGoodsReceiptStore from 'store/purchase/useGoodsReceiptStore';
import SupplierSearchDialog from 'views/master/commercial/SupplierSearchDialog';
import PendingPoItemsDialog from './PendingPoItemsDialog';
import DirectProductDialog from './DirectProductDialog';

const GoodsReceiptEntry = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const gateEntryId = searchParams.get('gateEntryId');
    const poHeadId = searchParams.get('poHeadId');

    const navigate = useNavigate();
    const theme = useTheme();
    const { user } = useAuth();

    const isNew = id === 'new';
    const isDirectMode = isNew && !gateEntryId && !poHeadId;

    const [supplierDialogOpen, setSupplierDialogOpen] = React.useState(false);
    const [poItemsDialogOpen, setPoItemsDialogOpen] = React.useState(false);
    const [directProductDialogOpen, setDirectProductDialogOpen] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [shakeFields, setShakeFields] = React.useState({});

    const {
        currentReceipt, loading, error,
        getReceiptById, previewFromGateEntry, previewFromPurchaseOrder, saveReceipt, deleteReceipt, updateTransactionLine
    } = useGoodsReceiptStore();

    const handleSupplierSelect = (supplier) => {
        useGoodsReceiptStore.setState((state) => ({
            currentReceipt: {
                ...state.currentReceipt,
                supplierId: supplier.id,
                supplierName: supplier.ledgerName
            }
        }));
    };

    const handleAddPoItems = (selectedItems) => {
        if (!selectedItems || selectedItems.length === 0) return;

        const newTrans = selectedItems.map((item, idx) => ({
            poTransId: item.id,
            poNo: item.sourceDocumentNo,
            itemId: item.itemId,
            itemCode: item.itemCode,
            itemName: item.itemName,
            uom: item.uom,
            price: item.unitPrice || 0,
            grnQty: item.pendingQty,
            eligibleQty: item.pendingQty,
            hsnCode: item.hsnCode,
            taxPercent: item.taxPercent,
            cgstPer: item.cgstPer,
            sgstPer: item.sgstPer,
            igstPer: item.igstPer,
            isExpiryItem: false, // will be generated for all anyway in UI
            batchNo: '',
            remarks: ''
        }));

        useGoodsReceiptStore.setState((state) => ({
            currentReceipt: {
                ...state.currentReceipt,
                transactions: [...(state.currentReceipt.transactions || []), ...newTrans]
            }
        }));
    };

    const handleAddDirectItems = (selectedItems) => {
        if (!selectedItems || selectedItems.length === 0) return;

        const newTrans = selectedItems.map((item, idx) => ({
            poTransId: null,
            poNo: null,
            itemId: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            uom: item.uom,
            price: 0,
            grnQty: 1,
            eligibleQty: 999999,
            hsnCode: item.hsnCode,
            taxPercent: item.taxPercentage || 0,
            cgstPer: 0,
            sgstPer: 0,
            igstPer: 0,
            isExpiryItem: false,
            batchNo: '',
            remarks: ''
        }));

        useGoodsReceiptStore.setState((state) => ({
            currentReceipt: {
                ...state.currentReceipt,
                transactions: [...(state.currentReceipt.transactions || []), ...newTrans]
            }
        }));
    };

    useEffect(() => {
        if (isNew) {
            if (gateEntryId) {
                previewFromGateEntry(gateEntryId, user?.userId).catch(err => {
                    bos.error('Load Error', err?.message || 'Failed to load GRN preview from Gate Entry');
                });
            } else if (poHeadId) {
                previewFromPurchaseOrder(poHeadId, user?.userId).catch(err => {
                    bos.error('Load Error', err?.message || 'Failed to load GRN preview from PO');
                });
            } else {
                useGoodsReceiptStore.setState({
                    currentReceipt: {
                        id: null,
                        grnNo: 'AUTO-GENERATED ON SAVE',
                        grnDate: new Date().toISOString().split('T')[0],
                        divisionId: user?.divisionId || null,
                        supplierId: null,
                        supplierName: '',
                        gateEntryNo: 'N/A',
                        poNo: 'N/A',
                        remarks: '',
                        statusName: 'DRAFT',
                        documentType: 'Invoice',
                        transactions: []
                    },
                    loading: false,
                    error: null
                });
            }
        } else if (id && !isNew) {
            getReceiptById(id);
        }
    }, [id, isNew, gateEntryId, poHeadId, getReceiptById, previewFromGateEntry, previewFromPurchaseOrder, user?.userId, user?.divisionId]);

    const handleSave = async () => {
        if (!currentReceipt) return;
        try {
            const cleanId = (idVal) => {
                if (!idVal) return null;
                const str = String(idVal);
                return /^\d+$/.test(str) ? parseInt(str, 10) : null;
            };

            const payload = { ...currentReceipt };
            let validationErrors = {};
            let validationShakes = {};

            if (!payload.documentType) {
                validationErrors.documentType = true;
                validationShakes.documentType = true;
            }
            if (!payload.documentNo) {
                validationErrors.documentNo = true;
                validationShakes.documentNo = true;
            }
            if (!payload.documentDate) {
                validationErrors.documentDate = true;
                validationShakes.documentDate = true;
            }

            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                setShakeFields(validationShakes);
                setTimeout(() => setShakeFields({}), 600);
                bos.grnError('Validation Error', 'Please fill all mandatory fields highlighted in red.');
                return;
            } else {
                setErrors({});
            }

            if (payload.documentDate === '') {
                payload.documentDate = null;
            }

            if (payload.attachments && payload.attachments.length > 0) {
                payload.attachments = payload.attachments.map(att => ({
                    ...att,
                    id: cleanId(att.id)
                }));
            }

            const saved = await saveReceipt(isNew ? null : id, payload, user?.userId);
            await bos.grnCreateSuccess(saved.grnNo || 'AUTO-GENERATED ON SAVE');
            if (isNew && saved?.id) {
                navigate(`/purchase/goods-receipt/entry/${saved.id}`);
            }
        } catch (err) {
            bos.grnError('Save Error', err?.message || 'Failed to save GRN');
        }
    };



    const handleDelete = async () => {
        if (!id || isNew) return;
        const confirmed = await bosConfirm({
            type: 'danger',
            title: 'Delete GRN?',
            message: 'Are you sure you want to delete this DRAFT GRN? This action cannot be undone.',
            confirmText: 'Yes, Delete',
            cancelText: 'Cancel'
        });
        if (confirmed) {
            try {
                await deleteReceipt(id, user?.userId);
                await bos.grnDeleteSuccess();
                navigate('/purchase/goods-receipt/list');
            } catch (err) {
                bos.grnError('Delete Failed', err?.message || 'Failed to delete GRN');
            }
        }
    };

    const normStatus = (currentReceipt?.statusName || 'DRAFT').toUpperCase();
    const isDraft = isNew || normStatus === 'DRAFT';

    const columns = useMemo(() => [
        { id: 'sno', label: '#', minWidth: 50, render: (row, idx) => <Typography fontWeight={600} color="textSecondary">{idx + 1}</Typography> },
        {
            id: 'item',
            label: 'ITEM *',
            minWidth: 350,
            render: (row) => {
                return (
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar variant="rounded" src={autonomaLogo} sx={{ width: 48, height: 48, boxShadow: theme.shadows[1], bgcolor: '#fff', '& img': { objectFit: 'contain' } }} />
                        <Box flex={1}>
                            <Typography variant="body2" fontWeight={700} color="text.primary">
                                {row.itemName || row.itemCode || 'Unknown Item'}
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, alignItems: 'center' }}>
                                {row.itemCode && (
                                    <Typography variant="caption" display="block">
                                        <span style={{ fontWeight: 600, color: theme.palette.primary.main, border: `1px solid ${theme.palette.primary.main}`, padding: '1px 4px', borderRadius: '4px' }}>
                                            {row.itemCode}
                                        </span>
                                    </Typography>
                                )}
                                {row.hsnCode && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        <span style={{ fontWeight: 600, color: theme.palette.error.main, border: `1px solid ${theme.palette.error.main}`, padding: '1px 4px', borderRadius: '4px' }}>
                                            HSN: {row.hsnCode}
                                        </span>
                                    </Typography>
                                )}
                            </Box>
                            {row.poNo && (
                                <Box display="flex" gap={1} mt={0.5}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: theme.palette.grey[100], px: 0.5, borderRadius: 1, fontWeight: 600 }}>
                                        {row.poNo}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                );
            }
        },
        { id: 'taxPercent', label: 'GST %', minWidth: 80, align: 'right' },
        { id: 'uom', label: 'UOM', minWidth: 80 },
        { id: 'price', label: 'Price', minWidth: 100, align: 'right' },
        {
            id: 'eligibleQty',
            label: 'Eligible',
            minWidth: 100,
            align: 'right',
            render: (row) => <Typography fontWeight="bold" color="primary">{row.eligibleQty ?? 0}</Typography>
        },
        {
            id: 'grnQty',
            label: 'GRN Qty',
            minWidth: 130,
            align: 'right',
            render: (row, idx) => (
                isDraft ? (
                    <TextField
                        size="small"
                        type="number"
                        value={row.grnQty ?? 0}
                        onChange={(e) => {
                            const newQty = parseFloat(e.target.value) || 0;
                            updateTransactionLine(row.id || idx, 'grnQty', newQty);
                        }}
                        inputProps={{
                            min: 0,
                            max: row.eligibleQty,
                            step: "0.01",
                            style: { textAlign: 'right', fontWeight: 'bold' }
                        }}
                        error={row.eligibleQty != null && row.grnQty > row.eligibleQty}
                    />
                ) : (
                    <Typography fontWeight="bold">{row.grnQty}</Typography>
                )
            )
        },
        {
            id: 'batchNo',
            label: 'Batch No',
            minWidth: 150,
            render: (row) => (
                <Typography variant="body2" color="textSecondary">
                    {row.batchNo || 'Auto-generated on Post'}
                </Typography>
            )
        },
        {
            id: 'remarks',
            label: 'Remarks',
            minWidth: 200,
            render: (row, idx) => (
                isDraft ? (
                    <TextField
                        size="small"
                        fullWidth
                        value={row.remarks || ''}
                        onChange={(e) => updateTransactionLine(row.id || idx, 'remarks', e.target.value)}
                    />
                ) : (
                    <Typography>{row.remarks || ''}</Typography>
                )
            )
        }
    ], [isDraft, updateTransactionLine, theme]);

    if (loading && !currentReceipt) {
        return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;
    }

    if (!currentReceipt && !loading) {
        return (
            <Box p={3}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error || "GRN not found or preview failed to load."}
                </Alert>
                <Button variant="contained" onClick={() => navigate('/purchase/goods-receipt/list')}>
                    Back to GRN List
                </Button>
            </Box>
        );
    }

    const isChallan = String(currentReceipt?.documentType || '').trim().toLowerCase() === 'delivery challan';
    const docNoLabel = isChallan ? 'Challan No' : 'Invoice No';
    const docDateLabel = isChallan ? 'Challan Date' : 'Invoice Date';

    return (
        <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 4 }}>
            {/* ── Sticky Header Bar ── */}
            <Paper elevation={0} sx={{
                position: "sticky", top: 0, zIndex: 10, px: 2, py: 1.5, mb: 1.5, borderRadius: 3,
                bgcolor: "background.paper", backgroundImage: "none", border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, color: "#fff", width: 42, height: 42, boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}` }}>
                        <Receipt fontSize="small" />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>
                            {isNew ? `New Goods Receipt Note (${poHeadId ? "Direct PO Mode" : gateEntryId ? "Gate Entry Mode" : "Direct Manual Mode"})` : `Goods Receipt Note: ${currentReceipt.grnNo}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {isNew ? "Review details and click Save GRN to create record" : `Division: ${user?.divisionName || 'Main'}`}
                        </Typography>
                    </Box>
                    <BOSStatusChip status={isNew ? "PREVIEW" : normStatus} />
                </Box>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    <Button variant="outlined" size="small" startIcon={<IconArrowLeft size={16} />} onClick={() => navigate("/purchase/goods-receipt/list")}>Back</Button>
                    {!isNew && <Button variant="outlined" size="small" startIcon={<IconPrinter size={16} />}>Print</Button>}
                    {!isNew && normStatus === "DRAFT" && (
                        <Button variant="outlined" color="error" size="small" startIcon={<IconTrash size={16} />} onClick={handleDelete}>Delete</Button>
                    )}
                    {isDraft && (
                        <Button variant="contained" color="primary" size="small"
                            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <IconDeviceFloppy size={16} />}
                            onClick={handleSave} disabled={loading}>
                            {isNew ? "Save GRN" : "Save Changes"}
                        </Button>
                    )}

                </Box>
            </Paper>

            <Box sx={{ px: { xs: 2, lg: 1 }, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <style>{`@keyframes shakeField{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}.shake-field{animation:shakeField .5s ease}`}</style>
                {error && <Alert severity="error">{error}</Alert>}

                {/* ── Document Details Card (Combined & Optimized) ── */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, width: '100%', gap: 2, alignItems: 'stretch', mb: 2 }}>
                {/* GRN Details Card */}
                <MainCard stretch={false} sx={{ flex: 1, borderRadius: 3, boxShadow: theme.shadows[2] }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2} sx={{ color: theme.palette.text.secondary }}>
                        GRN Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Row 1: Editable Fields */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, width: '100%' }}>
                            <Box sx={{ flex: '1 1 150px' }}>
                                {isDirectMode ? (
                                    <BOSTextField
                                        label="Supplier / Party"
                                        value={currentReceipt?.supplierName || ""}
                                        placeholder="Click to select Supplier"
                                        onClick={() => setSupplierDialogOpen(true)}
                                        InputProps={{ readOnly: true, sx: { cursor: 'pointer' } }}
                                        required
                                    />
                                ) : (
                                    <BOSTextField label="Supplier / Party" value={currentReceipt?.supplierName || ""} disabled sx={{ width: '100%' }} />
                                )}
                            </Box>
                            <Box sx={{ flex: '1 1 150px' }}>
                                <BOSTextField label="Gate Entry No" value={currentReceipt?.gateEntryNo || ""} disabled sx={{ width: '100%' }} />
                            </Box>
                            <Box sx={{ flex: '1 1 150px' }}>
                                <BOSAutocomplete
                                    label="Document Type"
                                    value={currentReceipt?.documentType || null}
                                    onChange={(v) => {
                                        const docVal = v?.value ?? v ?? null;
                                        if (docVal) {
                                            setErrors(prev => ({ ...prev, documentType: false }));
                                        }
                                        isDraft && useGoodsReceiptStore.setState(s => ({
                                            currentReceipt: { ...s.currentReceipt, documentType: docVal }
                                        }));
                                    }}
                                    options={[
                                        { value: "Invoice", label: "Invoice" },
                                        { value: "Delivery Challan", label: "Delivery Challan" }
                                    ]}
                                    disabled={!isDraft}
                                    sx={{ width: '100%' }}
                                    required
                                    error={!!errors.documentType}
                                    className={shakeFields.documentType ? 'shake-field' : ''}
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 150px' }}>
                                <BOSTextField
                                    label={docNoLabel}
                                    value={currentReceipt?.documentNo || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val) {
                                            setErrors(prev => ({ ...prev, documentNo: false }));
                                        }
                                        isDraft && useGoodsReceiptStore.setState(s => ({ currentReceipt: { ...s.currentReceipt, documentNo: val } }));
                                    }}
                                    disabled={!isDraft}
                                    sx={{ width: '100%' }}
                                    required
                                    error={!!errors.documentNo}
                                    className={shakeFields.documentNo ? 'shake-field' : ''}
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 150px' }}>
                                <BOSTextField
                                    label={docDateLabel}
                                    type="date"
                                    value={currentReceipt?.documentDate || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val) {
                                            setErrors(prev => ({ ...prev, documentDate: false }));
                                        }
                                        isDraft && useGoodsReceiptStore.setState(s => ({ currentReceipt: { ...s.currentReceipt, documentDate: val } }));
                                    }}
                                    disabled={!isDraft}
                                    sx={{ width: '100%' }}
                                    required
                                    error={!!errors.documentDate}
                                    className={shakeFields.documentDate ? 'shake-field' : ''}
                                />
                            </Box>
                        </Box>

                        {/* Row 2: Remarks only */}
                        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                            <BOSTextField
                                fullWidth
                                label="Remarks"
                                placeholder="Remarks"
                                value={currentReceipt?.remarks || ""}
                                onChange={(e) => isDraft && useGoodsReceiptStore.setState(s => ({ currentReceipt: { ...s.currentReceipt, remarks: e.target.value } }))}
                                disabled={!isDraft}
                            />
                        </Box>
                    </Box>
                </MainCard>

                {/* GRN Information Card */}
                <MainCard stretch={false} sx={{
                    borderRadius: 3,
                    boxShadow: theme.shadows[2],
                    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.1) : alpha(theme.palette.primary.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    p: 0,
                    overflow: 'hidden',
                    flexShrink: 0,
                    width: { xs: '100%', md: '360px' }
                }}>
                    <Box sx={{ p: 0, pt: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{
                            background: theme.palette.mode === 'dark'
                                ? `linear-gradient(to right, ${alpha(theme.palette.primary.dark, 0.5)}, ${alpha(theme.palette.primary.dark, 0.0)})`
                                : `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.primary.main, 0.0)})`,
                            px: 1,
                            py: 0.5,
                            mb: 1,
                            borderRadius: 1
                        }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: theme.palette.primary.main }}>
                                GRN Information
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, px: 2, pb: 2, flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
                            <Box sx={{ flex: '1 1 150px' }}>
                                <BOSTextField
                                    fullWidth
                                    label="GRN No"
                                    value={currentReceipt?.grnNo || ""}
                                    placeholder="Auto Generated"
                                    disabled
                                    sx={{
                                        bgcolor: theme.palette.background.paper,
                                        borderRadius: 2,
                                        '& .MuiOutlinedInput-root': { borderRadius: 2, fieldset: { borderColor: alpha(theme.palette.primary.main, 0.1) } },
                                        '& .MuiInputBase-input': { fontWeight: 'bold', color: theme.palette.primary.main }
                                    }}
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 150px' }}>
                                <BOSTextField
                                    fullWidth
                                    label="GRN Date"
                                    type="date"
                                    value={currentReceipt?.grnDate || ""}
                                    disabled
                                    sx={{
                                        bgcolor: theme.palette.background.paper,
                                        borderRadius: 2,
                                        '& .MuiOutlinedInput-root': { borderRadius: 2, fieldset: { borderColor: alpha(theme.palette.primary.main, 0.1) } }
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                </MainCard>
            </Box>

                {/* ── Receipt Lines Table ── */}
                <MainCard
                    stretch={false}
                    title={
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="h5" fontWeight={700}>Items / Receipt Lines</Typography>
                            <Chip label={`${(currentReceipt?.transactions || []).length} Items`} size="small" color="primary" variant="outlined" />
                        </Box>
                    }
                    secondary={
                        isDirectMode && isDraft && (
                            <Box display="flex" gap={1}>
                                <Button
                                    variant="contained"
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                        if (!currentReceipt?.supplierId) {
                                            Swal.fire('Warning', 'Please select a supplier first', 'warning');
                                            return;
                                        }
                                        // TODO: setProductDialogOpen(true)
                                        setDirectProductDialogOpen(true);
                                    }}
                                    disabled={(currentReceipt?.transactions || []).some(t => t.poTransId != null)}
                                >
                                    Add Direct Items
                                </Button>
                                <Button
                                    variant="contained"
                                    size="small"
                                    color="secondary"
                                    onClick={() => {
                                        if (!currentReceipt?.supplierId) {
                                            Swal.fire('Warning', 'Please select a supplier first', 'warning');
                                            return;
                                        }
                                        setPoItemsDialogOpen(true);
                                    }}
                                    disabled={(currentReceipt?.transactions || []).some(t => t.poTransId == null)}
                                >
                                    Add PO Items
                                </Button>
                            </Box>
                        )
                    }
                    sx={{ borderRadius: 2 }}
                >
                    <BOSDataTable
                        id="goods-receipt-entry-items-table"
                        columns={columns}
                        data={currentReceipt?.transactions || []}
                        loading={loading}
                        disablePagination
                    />
                </MainCard>

                {/* ── Attachments ── */}
                <Accordion defaultExpanded={false} sx={{ borderRadius: "12px !important", "&:before": { display: "none" }, border: "1px solid", borderColor: "divider" }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <IconPaperclip size={18} color={theme.palette.primary.main} />
                            <Typography fontWeight={700}>Attachments</Typography>
                            {currentReceipt?.attachments?.length > 0 && <Chip label={currentReceipt.attachments.length} size="small" color="primary" sx={{ height: 18, fontSize: "0.65rem" }} />}
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 1, pb: 2 }}>
                        <BOSFileUpload
                            files={(currentReceipt?.attachments || []).map(att => ({
                                id: att.id ? String(att.id) : att.serverFileName || att.filePath,
                                fileName: att.fileName || att.name,
                                serverFileName: att.filePath || att.serverFileName,
                                fileSize: att.fileSize,
                                fileType: att.mimeType || att.fileType,
                                isServer: true,
                                readonly: att.attachmentType === 'GATE_ENTRY',
                                attachmentType: att.attachmentType
                            }))}
                            onChange={(updatedFiles) => {
                                const mapped = updatedFiles.map(f => ({
                                    id: f.id && /^\d+$/.test(String(f.id)) ? parseInt(f.id, 10) : null,
                                    fileName: f.fileName || f.name,
                                    filePath: f.serverFileName || f.path || f.filePath,
                                    serverFileName: f.serverFileName || f.path || f.filePath,
                                    fileSize: f.fileSize,
                                    mimeType: f.fileType || f.mimeType,
                                    attachmentType: f.readonly || f.attachmentType === 'GATE_ENTRY' ? 'GATE_ENTRY' : 'GRN',
                                    activeStatus: 1,
                                }));
                                if (isDraft) {
                                    useGoodsReceiptStore.setState(s => ({
                                        currentReceipt: { ...s.currentReceipt, attachments: mapped }
                                    }));
                                }
                            }}
                            module="PURCHASE_GRN"
                            multiple={true}
                            maxFiles={20}
                            maxSizeMB={25}
                            scan={true}
                            disabled={!isDraft}
                        />
                    </AccordionDetails>
                </Accordion>
            </Box>

            {/* Dialogs */}
            <SupplierSearchDialog
                open={supplierDialogOpen}
                onClose={() => setSupplierDialogOpen(false)}
                onSelect={handleSupplierSelect}
            />

            <PendingPoItemsDialog
                open={poItemsDialogOpen}
                onClose={() => setPoItemsDialogOpen(false)}
                supplierId={currentReceipt?.supplierId}
                onAddItems={handleAddPoItems}
            />

            <DirectProductDialog
                open={directProductDialogOpen}
                onClose={() => setDirectProductDialogOpen(false)}
                onAddItems={handleAddDirectItems}
            />
        </Box>
    );
};

export default GoodsReceiptEntry;
