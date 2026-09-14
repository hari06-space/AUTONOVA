import React, { useState, useEffect } from 'react';
import { Box, Button, Grid, TextField, Typography, CircularProgress, Divider, FormControl, InputLabel, Select, MenuItem, Tooltip, Accordion, AccordionSummary, AccordionDetails, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import MainCard from 'ui-component/cards/MainCard';
import {
    IconDeviceFloppy, IconCheck, IconX, IconRotate2, IconPaperclip, IconPlus,
    IconClipboardCheck, IconPackage, IconTag, IconRulerMeasure, IconBox,
    IconCircleCheck, IconCircleX, IconScale, IconAlertTriangle, IconUser,
    IconFlame, IconNote, IconCertificate, IconLink
} from '@tabler/icons-react';
import { ExpandMore } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import useAuth from 'hooks/useAuth';
import useQualityInspectionStore from 'store/purchase/inspection/useQualityInspectionStore';
import axios from 'utils/axios';
import BOSDataTable from 'ui-component/bos/BOSDataTable';
import BOSTextField from 'ui-component/bos/BOSTextField';
import PendingGrnDialog from './PendingGrnDialog';
import QualityInspectionInlineEntry from './QualityInspectionInlineEntry';
import BOSFileUpload from 'ui-component/bos/BOSFileUpload';
import { btnSave } from 'ui-component/bos/BOSStyles';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import dayjs from 'dayjs';

const QualityInspectionForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const txId = searchParams.get('txId');
    const theme = useTheme();
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();

    const { currentInspection, loading, getInspectionById, generateFromGrn, saveInspection, postInspection, clearCurrentInspection } = useQualityInspectionStore();

    const isNew = id === 'new';
    const [grnDialogOpen, setGrnDialogOpen] = useState(false);
    const [selectedGrnId, setSelectedGrnId] = useState('');

    const [editItem, setEditItem] = useState(null);
    const [viewItemDetails, setViewItemDetails] = useState(null);
    const [pendingItems, setPendingItems] = useState([]);

    const [formData, setFormData] = useState(null);

    useKeyboardShortcuts({
        save: () => {
            if (!isReadOnly && !loading) {
                handleSave();
            }
        },
        escape: () => {
            navigate('/purchase/quality-inspection');
        }
    });

    useEffect(() => {
        if (isNew) {
            if (!user?.divisionId) return; // Ensure user is loaded before calling API

            clearCurrentInspection();
        } else {
            getInspectionById(id);
        }
        return () => clearCurrentInspection();
    }, [id, user?.divisionId]);

    useEffect(() => {
        if (currentInspection) {
            const data = JSON.parse(JSON.stringify(currentInspection));
            if (isNew) {
                setPendingItems(data.transactions || []);
                data.transactions = [];
            } else {
                if (txId && data.transactions) {
                    data.transactions = data.transactions.filter(t => String(t.id) === txId);
                }
                setPendingItems([]);
            }
            setFormData(data);
        } else if (isNew) {
            setFormData({
                id: null,
                divisionId: null,
                qiDate: dayjs().format('YYYY-MM-DD'),
                statusName: 'NEW',
                grnNo: '',
                remarks: '',
                transactions: []
            });
            setPendingItems([]);
        }
    }, [currentInspection, isNew]);

    const currentUserId = user?.userId || user?.id || user?.userName || user?.username || 'admin';

    const handleGrnSelect = async (newVal) => {
        setSelectedGrnId(newVal);
        if (!newVal) return;
        try {
            await generateFromGrn(newVal, user.divisionId, currentUserId);
        } catch (error) {
            console.error("Error generating inspection", error);
        }
    };

    const validateForm = () => {
        if (editItem) {
            enqueueSnackbar('Please click Apply on the inline entry before saving.', { variant: 'warning' });
            return false;
        }
        if (!formData.transactions || formData.transactions.length === 0) {
            enqueueSnackbar('Please add at least one item to inspect', { variant: 'error' });
            return false;
        }
        for (let i = 0; i < formData.transactions.length; i++) {
            const t = formData.transactions[i];
            const accQty = parseFloat(t.acceptedQty) || 0;
            const rejQty = parseFloat(t.rejectedQty) || 0;
            const ncQty = parseFloat(t.ncQty) || 0;

            if (accQty === 0 && rejQty === 0 && ncQty === 0) {
                enqueueSnackbar(`Please enter inspection quantities for row ${i + 1} (${t.itemCode || t.itemName})`, { variant: 'error' });
                return false;
            }

            if (rejQty > 0 && (!t.rejectionReason || String(t.rejectionReason).trim() === '')) {
                enqueueSnackbar(`Rejection Reason is required for row ${i + 1} (${t.itemCode || t.itemName})`, { variant: 'error' });
                return false;
            }
        }
        return true;
    };

    const sanitizePayload = (payload) => {
        const clean = { ...payload };

        const sanitizeAtts = (atts) => atts ? atts.map(att => ({
            ...att,
            id: (att.id && typeof att.id === 'string' && (isNaN(att.id) || att.id.includes('_'))) ? null : att.id
        })) : [];

        if (clean.transactions) {
            clean.transactions = clean.transactions.map(t => ({
                ...t,
                attachments: sanitizeAtts(t.attachments)
            }));
        }

        clean.attachments = sanitizeAtts(clean.attachments);

        return clean;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        try {
            const payloadToSave = sanitizePayload(formData);
            console.log("DEBUG PAYLOAD:", payloadToSave);
            const savedData = await saveInspection(payloadToSave.id || payloadToSave.grnHeadId, payloadToSave, currentUserId);
            // Re-fetch to ensure fresh data using the newly generated ID
            const newId = savedData.id;
            setFormData(savedData);
            navigate(`/purchase/quality-inspection/form/${newId}${txId ? '?txId=' + txId : ''}`, { replace: true });
            enqueueSnackbar('Quality Inspection saved successfully', { variant: 'success' });
        } catch (error) {
            console.error("Error saving inspection", error);
            enqueueSnackbar(`Error saving inspection: ${error?.response?.data?.message || error.message || 'Unknown error'}`, { variant: 'error' });
        }
    };

    const handlePost = async () => {
        if (!validateForm()) return;
        try {
            const payloadToSave = sanitizePayload(formData);
            // Save first
            const savedData = await saveInspection(payloadToSave.id || payloadToSave.grnHeadId, payloadToSave, currentUserId);
            // Then post
            await postInspection(savedData.id, currentUserId);
            enqueueSnackbar('Quality Inspection posted successfully', { variant: 'success' });
            navigate('/purchase/quality-inspection');
        } catch (error) {
            console.error("Error posting inspection", error);
            enqueueSnackbar(`Error posting inspection: ${error?.response?.data?.message || error.message || 'Unknown error'}`, { variant: 'error' });
        }
    };



    const isReadOnly = formData?.statusName === 'POSTED' || formData?.statusName === 'CANCELLED';

    const handleInlineAdd = (item) => {
        setFormData(prev => {
            if (!prev) return prev;
            const exists = prev.transactions?.some(t => t.grnTransId === item.grnTransId);
            if (exists) {
                // Update existing
                const newTransactions = prev.transactions.map(t =>
                    t.grnTransId === item.grnTransId ? item : t
                );
                return { ...prev, transactions: newTransactions };
            } else {
                // Add new
                return {
                    ...prev,
                    transactions: [...(prev.transactions || []), item]
                };
            }
        });
        setPendingItems(prev => prev.filter(p => p.grnTransId !== item.grnTransId));
        setEditItem(null);
    };

    const handleEditRow = (row) => {
        setEditItem(row);
    };

    const handleDeleteRow = (row) => {
        setFormData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                transactions: prev.transactions.filter(t => t.grnTransId !== row.grnTransId)
            };
        });

        setPendingItems(prev => {
            // Reset the item quantities back to default when returning it to pending
            const restoredItem = {
                ...row,
                acceptedQty: 0,
                rejectedQty: 0,
                ncQty: 0,
                rejectionReasonId: null,
                inspectedById: null,
                remarks: '',
                testCertificate: '',
                tcSource: '',
                heatNo: ''
            };
            return [...(prev || []), restoredItem];
        });
    };

    const columns = React.useMemo(() => [
        {
            id: 'itemCode',
            label: 'Item Code',
            minWidth: 120,
            render: (row) => (
                <Typography
                    color="primary"
                    sx={{ fontWeight: 'medium' }}
                >
                    {row.itemCode}
                </Typography>
            )
        },
        { id: 'itemName', label: 'Item Name', minWidth: 200 },
        { id: 'batchNo', label: 'Batch No', minWidth: 130 },
        { id: 'grnQty', label: 'GRN Qty', minWidth: 100, align: 'right' },
        {
            id: 'acceptedQty',
            label: 'Accepted Qty',
            minWidth: 120,
            align: 'right',
            render: (row) => row.acceptedQty || '0'
        },
        {
            id: 'rejectedQty',
            label: 'Rejected Qty',
            minWidth: 120,
            align: 'right',
            render: (row) => row.rejectedQty || '0'
        },
        {
            id: 'ncQty',
            label: 'NC Qty',
            minWidth: 100,
            align: 'right',
            render: (row) => row.ncQty || '0'
        },
        {
            id: 'balQty',
            label: 'Bal Qty',
            minWidth: 100,
            align: 'right',
            render: (row) => {
                const grnQty = parseFloat(row.grnQty) || 0;
                const accepted = parseFloat(row.acceptedQty) || 0;
                const rejected = parseFloat(row.rejectedQty) || 0;
                const nc = parseFloat(row.ncQty) || 0;
                const bal = grnQty - (accepted + rejected + nc);
                return <Typography fontWeight="bold">{bal}</Typography>;
            }
        },
        {
            id: 'totalInspected',
            label: 'Total',
            minWidth: 100,
            render: (row) => {
                const total = (parseFloat(row.acceptedQty) || 0) + (parseFloat(row.rejectedQty) || 0) + (parseFloat(row.ncQty) || 0);
                const isOver = total > row.remainingQty;
                return <Typography color={isOver ? 'error' : 'inherit'} fontWeight="bold">{total}</Typography>;
            }
        },
        {
            id: 'rejectionReason',
            label: 'Rejection Reason',
            minWidth: 150,
            render: (row) => row.rejectionReason || '-'
        },
        {
            id: 'ncRemarks',
            label: 'NC Remarks',
            minWidth: 150,
            render: (row) => row.ncRemarks || '-'
        },
        {
            id: 'status',
            label: 'Status',
            minWidth: 100,
            render: (row) => {
                const remaining = parseFloat(row.remainingQty) || parseFloat(row.grnQty) || 0;
                const acc = parseFloat(row.acceptedQty) || 0;
                const rej = parseFloat(row.rejectedQty) || 0;
                const nc = parseFloat(row.ncQty) || 0;
                const balanceQty = remaining - (acc + rej + nc);
                
                let displayStatus = row.statusName;
                if (!displayStatus || displayStatus === 'NEW') {
                    displayStatus = balanceQty > 0 ? 'PENDING' : 'COMPLETED';
                }
                const isPending = displayStatus.toUpperCase() === 'PENDING';
                return (
                    <Box sx={{
                        px: 1, py: 0.5, borderRadius: 1, display: 'inline-block',
                        bgcolor: isPending ? 'warning.light' : 'success.light',
                        color: isPending ? 'warning.dark' : 'success.dark',
                        fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'capitalize'
                    }}>
                        {displayStatus.toLowerCase()}
                    </Box>
                );
            }
        },
        {
            id: 'actions',
            label: 'Actions',
            minWidth: 100,
            align: 'center',
            render: (row) => {
                if (isReadOnly) return '-';
                const total = (parseFloat(row.acceptedQty) || 0) + (parseFloat(row.rejectedQty) || 0);
                const isPending = total === 0;
                return (
                    <Box display="flex" justifyContent="center" gap={1}>
                        <Button
                            size="small"
                            variant="text"
                            color="primary"
                            onClick={() => handleEditRow(row)}
                            sx={{ minWidth: 'auto', p: 0.5 }}
                        >
                            {isPending ? 'Inspect' : 'Edit'}
                        </Button>
                        {!isPending && (
                            <Button
                                size="small"
                                variant="text"
                                color="error"
                                onClick={() => handleDeleteRow(row)}
                                sx={{ minWidth: 'auto', p: 0.5 }}
                            >
                                Delete
                            </Button>
                        )}
                    </Box>
                );
            }
        }
    ], [isReadOnly]);

    const tableRows = React.useMemo(() => {
        const trans = formData?.transactions || [];
        return [...trans].sort((a, b) => (a.grnTransId || 0) - (b.grnTransId || 0));
    }, [formData?.transactions]);

    const activeSearchableItems = React.useMemo(() => {
        let items = [...(pendingItems || [])];
        if (formData?.transactions) {
            formData.transactions.forEach(t => {
                const grnQty = parseFloat(t.grnQty) || 0;
                const acc = parseFloat(t.acceptedQty) || 0;
                const rej = parseFloat(t.rejectedQty) || 0;
                const nc = parseFloat(t.ncQty) || 0;
                const bal = grnQty - (acc + rej + nc);
                if (bal > 0) {
                    items.push(t);
                }
            });
        }
        if (editItem && !items.find(i => i.grnTransId === editItem.grnTransId)) {
            items.push(editItem);
        }
        return items;
    }, [pendingItems, formData?.transactions, editItem]);

    if (!formData) return null;

    return (
        <MainCard
            title={`Quality Inspection${!isNew && formData.grnNo ? ' - ' + formData.grnNo : ''}`}
            pageCode="PP1126"
            secondary={
                <Box display="flex" gap={1} alignItems="center">
                    <Box sx={{ px: 2, py: 0.75, borderRadius: 1.5, bgcolor: 'secondary.light', color: 'secondary.dark', border: '1px solid', borderColor: 'secondary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" fontWeight="bold" sx={{ opacity: 0.8 }}>INSPECTION DATE :</Typography>
                        <Typography variant="subtitle2" fontWeight="900" sx={{ letterSpacing: 0.5 }}>
                            {formData.qiDate ? formData.qiDate.split('-').reverse().join('/') : '-'}
                        </Typography>
                    </Box>
                    {!isReadOnly && (
                        <Tooltip title={shortcutTooltip('Save')}>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<IconDeviceFloppy size={18} />}
                                onClick={handleSave}
                                disabled={loading}
                                sx={btnSave}
                            >
                                Save
                            </Button>
                        </Tooltip>
                    )}
                </Box>
            }
            sx={{ position: 'sticky', top: 0, zIndex: 10 }} // Sticking to golden rule 38
        >
            <Box mt={2}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        {isNew ? (
                            <TextField
                                fullWidth
                                label="Select Goods Receipt Note (GRN)"
                                value={formData.grnNo || ''}
                                placeholder="Click to select GRN"
                                onClick={() => setGrnDialogOpen(true)}
                                InputProps={{ readOnly: true, sx: { cursor: 'pointer' } }}
                                size="small"
                            />
                        ) : (
                            <TextField fullWidth label="GRN No" value={formData.grnNo || ''} InputProps={{ readOnly: true }} size="small" />
                        )}
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <BOSTextField label="GRN Date" value={formData.grnDate || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <BOSTextField label="Gate Entry No" value={formData.gateEntryNo || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <BOSTextField label="Bill No" value={formData.billNo || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <BOSTextField label="Bill Date" value={formData.billDate || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <BOSTextField label="Document Type" value={formData.documentType || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <BOSTextField label="Document No" value={formData.documentNo || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <BOSTextField label="Document Date" value={formData.documentDate || ''} InputProps={{ readOnly: true }} />
                    </Grid>
                    {formData.attachments && formData.attachments.length > 0 && (
                        <Grid item xs={12} sm={12} md={9}>
                            <BOSFileUpload
                                files={(formData.attachments || []).map(att => ({
                                    id: att.id ? String(att.id) : att.serverFileName || att.filePath,
                                    fileName: att.fileName || att.name,
                                    serverFileName: att.filePath || att.serverFileName,
                                    fileSize: att.fileSize,
                                    fileType: att.mimeType || att.fileType,
                                    isServer: true,
                                }))}
                                onChange={() => { }}
                                module="Purchase/Quality Inspection"
                                multiple={true}
                                maxFiles={20}
                                maxSizeMB={25}
                                disabled={true}
                                compact={true}
                                hideDropzone={true}
                            />
                        </Grid>
                    )}
                </Grid>
            </Box>



            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={1}>
                <Typography variant="h5">GRN ITEMS</Typography>
            </Box>

            {(!isReadOnly && (pendingItems.length > 0 || (formData.transactions && formData.transactions.length > 0))) && (
                <QualityInspectionInlineEntry
                    searchableItems={activeSearchableItems}
                    onAdd={handleInlineAdd}
                    onCancel={() => setEditItem(null)}
                    editItem={editItem}
                    onEditItemSelect={(item) => setEditItem(item)}
                    isReadOnly={isReadOnly}
                />
            )}

            <BOSDataTable
                columns={columns}
                rows={tableRows}
                totalCount={tableRows.length}
                loading={loading}
                dense={true}
                onDoubleClickRow={(row) => handleEditRow(row)}
                sx={{ height: 'calc(100vh - 320px)', minHeight: 400, mt: 2 }}
            />
            <PendingGrnDialog
                open={grnDialogOpen}
                onClose={() => setGrnDialogOpen(false)}
                onSelect={(id) => handleGrnSelect(id)}
            />

            {/* View Item Details Dialog - Premium Design */}
            <Dialog
                open={!!viewItemDetails}
                onClose={() => setViewItemDetails(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.18)',
                    }
                }}
            >
                {/* Header */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 3,
                    pb: 2,
                    background: 'radial-gradient(circle at top right, #f4f6f9, #ffffff)'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            bgcolor: 'primary.lighter',
                            color: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <IconClipboardCheck size={28} stroke={1.5} />
                        </Box>
                        <Box>
                            <Typography variant="h3" sx={{ fontWeight: 800, color: 'grey.900' }}>Inspection Details</Typography>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>{viewItemDetails?.itemCode}</Typography>
                        </Box>
                    </Box>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => setViewItemDetails(null)}
                        sx={{
                            minWidth: 'unset',
                            width: 36,
                            height: 36,
                            p: 0,
                            borderRadius: '50%',
                            borderColor: 'grey.200',
                            color: 'grey.600',
                            '&:hover': { bgcolor: 'grey.100', borderColor: 'grey.300' }
                        }}
                    >
                        <IconX size={18} />
                    </Button>
                </Box>

                <DialogContent sx={{ p: 0, bgcolor: '#f4f7fa' }}>
                    {viewItemDetails && (
                        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {/* Card 1: Primary Details */}
                            <Paper sx={{
                                p: 3,
                                borderRadius: '16px',
                                boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)',
                                border: '1px solid',
                                borderColor: 'grey.100'
                            }}>
                                <Grid container spacing={3} alignItems="center">
                                    <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.lighter', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <IconPackage size={20} />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'grey.500', textTransform: 'uppercase' }}>Item Name</Typography>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'grey.900', lineHeight: 1.2, mt: 0.5 }}>{viewItemDetails.itemName}</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={1.5} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'secondary.lighter', color: 'secondary.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <IconTag size={18} />
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'grey.500' }}>Batch No</Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'grey.900' }}>{viewItemDetails.batchNo || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={6} md={1.5} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'info.lighter', color: 'info.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <IconRulerMeasure size={18} />
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'grey.500' }}>UOM</Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'grey.900' }}>{viewItemDetails.uom || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={4} md={1.5} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'success.lighter', color: 'success.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <IconBox size={18} />
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'success.main' }}>GRN Qty</Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'grey.900' }}>{viewItemDetails.grnQty}</Typography>
                                    </Grid>
                                    <Grid item xs={4} md={1.5} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'success.lighter', color: 'success.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <IconCircleCheck size={18} />
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'success.main' }}>Accepted Qty</Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'success.main' }}>{viewItemDetails.acceptedQty || 0}</Typography>
                                    </Grid>
                                    <Grid item xs={4} md={1.5} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'error.lighter', color: 'error.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <IconCircleX size={18} />
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'error.main' }}>Rejected Qty</Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'error.main' }}>{viewItemDetails.rejectedQty || 0}</Typography>
                                    </Grid>
                                    <Grid item xs={12} md={1.5} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'grey.200', color: 'grey.600', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <IconScale size={18} />
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'grey.600' }}>Balance Qty</Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'grey.800' }}>{parseFloat(viewItemDetails.grnQty || 0) - (parseFloat(viewItemDetails.acceptedQty || 0) + parseFloat(viewItemDetails.rejectedQty || 0))}</Typography>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Card 2: Secondary Details */}
                            <Paper sx={{
                                p: 3,
                                borderRadius: '16px',
                                boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)',
                                border: '1px solid',
                                borderColor: 'grey.100'
                            }}>
                                <Grid container spacing={3} alignItems="flex-start" justifyContent="space-between">
                                    <Grid item xs={6} md={2} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'error.lighter', color: 'error.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <IconAlertTriangle size={20} />
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'grey.700' }}>Rejection Reason</Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: viewItemDetails.rejectedQty > 0 ? 'error.main' : 'grey.400' }}>{viewItemDetails.rejectedQty > 0 ? (viewItemDetails.rejectionReason || '-') : '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={6} md={2} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'secondary.lighter', color: 'secondary.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <IconUser size={20} />
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'grey.700' }}>Inspected By</Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'grey.900' }}>{viewItemDetails.inspectedBy || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={6} md={2} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'warning.lighter', color: 'warning.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <IconFlame size={20} />
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'grey.700' }}>Heat No</Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'grey.900' }}>{viewItemDetails.heatNo || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={6} md={2} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'warning.lighter', color: 'warning.dark', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <IconNote size={20} />
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'grey.700' }}>Remarks</Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'grey.900' }}>{viewItemDetails.remarks || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={6} md={2} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'success.lighter', color: 'success.dark', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <IconCertificate size={20} />
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'grey.700' }}>Test Certificate</Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'grey.900' }}>{viewItemDetails.testCertificate || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={6} md={2} sx={{ textAlign: 'center' }}>
                                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.lighter', color: 'primary.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                            <IconLink size={20} />
                                        </Box>
                                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'grey.700' }}>TC Source</Typography>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'grey.900' }}>{viewItemDetails.tcSource || '-'}</Typography>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {/* Uploaded Files Section if exists */}
                            {viewItemDetails.attachments && viewItemDetails.attachments.length > 0 && (
                                <Paper sx={{
                                    p: 3,
                                    borderRadius: '16px',
                                    boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)',
                                    border: '1px solid',
                                    borderColor: 'grey.100'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                        <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'secondary.lighter', color: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <IconPaperclip size={18} />
                                        </Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'grey.800' }}>Attached Documents</Typography>
                                    </Box>
                                    <BOSFileUpload
                                        files={viewItemDetails.attachments.map(att => ({
                                            id: att.id ? String(att.id) : att.serverFileName || att.filePath,
                                            fileName: att.fileName || att.name,
                                            serverFileName: att.filePath || att.serverFileName,
                                            fileSize: att.fileSize,
                                            fileType: att.mimeType || att.fileType,
                                            isServer: true,
                                        }))}
                                        onChange={() => { }}
                                        module="Purchase/Quality Inspection"
                                        multiple={true}
                                        disabled={true}
                                        compact={true}
                                        hideDropzone={true}
                                    />
                                </Paper>
                            )}
                        </Box>
                    )}
                </DialogContent>

                {/* Footer */}
                <Box sx={{ p: 3, bgcolor: '#ffffff', borderTop: '1px solid', borderColor: 'grey.100', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setViewItemDetails(null)}
                        startIcon={<IconX size={18} />}
                        sx={{
                            borderRadius: '10px',
                            px: 3,
                            py: 1,
                            fontWeight: 700,
                            boxShadow: '0 8px 16px -8px rgba(0,0,0,0.3)',
                        }}
                    >
                        Close
                    </Button>
                </Box>
            </Dialog>

        </MainCard>
    );
};

export default QualityInspectionForm;
