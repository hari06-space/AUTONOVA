import { useState, useEffect } from 'react';
import {
    Typography, Box, Grid, InputAdornment, useTheme, Button, alpha
} from '@mui/material';
import {
    IconCircleCheck, IconCircleX,
    IconAlertTriangle, IconUser, IconCertificate, IconBuildingBank, IconFlame,
    IconFileText, IconMessageCircle, IconHash, IconTag,
    IconDownload, IconScale, IconPlus
} from '@tabler/icons-react';
import { BOSTextField, BOSAutocomplete } from 'ui-component/bos';
import BOSFileUpload from 'ui-component/bos/BOSFileUpload';
import useAuth from 'hooks/useAuth';
import useRejectionReasonStore from 'store/purchase/inspection/useRejectionReasonStore';
import { useSnackbar } from 'notistack';
import axios from 'utils/axios';
import TestReportDialog from './TestReportDialog';

const QualityInspectionInlineEntry = ({ searchableItems, onAdd, onCancel, editItem, onEditItemSelect, isReadOnly }) => {
    const theme = useTheme();
    const { user } = useAuth();
    const currentUserId = user?.userId;
    const { reasons, fetchReasons, createReason } = useRejectionReasonStore();
    const { enqueueSnackbar } = useSnackbar();

    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [testReportOpen, setTestReportOpen] = useState(false);
    const [loadingTestReport, setLoadingTestReport] = useState(false);

    useEffect(() => {
        fetchReasons();
    }, [fetchReasons]);

    useEffect(() => {
        if (editItem) {
            setFormData({
                ...editItem,
                inspectedBy: editItem.inspectedBy || user?.name || user?.username || ''
            });
            setSelectedItem(editItem);
        } else {
            setSelectedItem(null);
            setFormData({});
        }
    }, [editItem, user]);

    const handleItemSelect = (item) => {
        if (onEditItemSelect) {
            onEditItemSelect(item);
        } else {
            setSelectedItem(item);
            if (item) {
                setFormData({
                    ...item,
                    inspectedBy: item.inspectedBy || user?.name || user?.username || ''
                });
            } else {
                setFormData({});
            }
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };

            if (field === 'acceptedQty' || field === 'rejectedQty' || field === 'ncQty') {
                const acc = parseFloat(field === 'acceptedQty' ? value : updated.acceptedQty) || 0;
                const rej = parseFloat(field === 'rejectedQty' ? value : updated.rejectedQty) || 0;
                const nc = parseFloat(field === 'ncQty' ? value : updated.ncQty) || 0;
                const remaining = parseFloat(selectedItem.remainingQty) || parseFloat(selectedItem.grnQty) || 0;

                if ((acc + rej + nc) > remaining) {
                    if (field === 'acceptedQty') {
                        updated.acceptedQty = Math.max(0, remaining - (rej + nc));
                    } else if (field === 'rejectedQty') {
                        updated.rejectedQty = Math.max(0, remaining - (acc + nc));
                    } else if (field === 'ncQty') {
                        updated.ncQty = Math.max(0, remaining - (acc + rej));
                    }
                }
            }
            return updated;
        });
    };

    const handleSave = async () => {
        if (!selectedItem) {
            enqueueSnackbar('Please select an item to inspect', { variant: 'warning' });
            return;
        }

        const acc = parseFloat(formData.acceptedQty);
        const rej = parseFloat(formData.rejectedQty);
        const nc = parseFloat(formData.ncQty);

        if (isNaN(acc) && isNaN(rej) && isNaN(nc)) {
            enqueueSnackbar('Please enter Accepted, Rejected, or NC Qty', { variant: 'error' });
            return;
        }

        const total = (acc || 0) + (rej || 0) + (nc || 0);
        if (total <= 0) {
            enqueueSnackbar('Total Inspected Qty must be greater than zero', { variant: 'error' });
            return;
        }

        const rejVal = rej || 0;
        if (rejVal > 0 && (!formData.rejectionReason || formData.rejectionReason.trim() === '')) {
            enqueueSnackbar('Rejection Reason is mandatory when Rejected Qty is greater than 0', { variant: 'error' });
            return;
        }

        const ncVal = nc || 0;
        if (ncVal > 0 && (!formData.ncRemarks || formData.ncRemarks.trim() === '')) {
            enqueueSnackbar('NC Remarks is mandatory when NC Qty is greater than 0', { variant: 'error' });
            return;
        }

        let updatedFormData = { ...formData };
        if (rejVal > 0 && formData.rejectionReason && !formData.rejectionReasonId) {
            try {
                let existing = reasons.find(r => r.rejectionReason.toLowerCase() === formData.rejectionReason.toLowerCase().trim());
                if (existing) {
                    updatedFormData.rejectionReasonId = existing.id;
                } else {
                    const newReason = await createReason(formData.rejectionReason.trim(), currentUserId || 'system');
                    updatedFormData.rejectionReasonId = newReason.id;
                }
            } catch (error) {
                console.error(error);
                enqueueSnackbar('Failed to create rejection reason', { variant: 'error' });
                return;
            }
        }

        onAdd(updatedFormData);
        setSelectedItem(null);
        setFormData({});
    };

    const handleOpenTestReport = async () => {
        if (!formData.testReports || formData.testReports.length === 0) {
            try {
                setLoadingTestReport(true);
                const res = await axios.get('/api/purchase/quality-inspection/test-report/parameters', {
                    params: { itemId: formData.itemId, grnQty: formData.grnQty || 0 }
                });
                handleChange('testReports', res.data || []);
            } catch (err) {
                console.error(err);
                enqueueSnackbar('Failed to fetch Test Report parameters', { variant: 'error' });
            } finally {
                setLoadingTestReport(false);
            }
        }
        setTestReportOpen(true);
    };

    const handleSaveTestReport = (savedReports) => {
        handleChange('testReports', savedReports);
        setTestReportOpen(false);
        enqueueSnackbar('Test Report saved locally. Apply to save to DB.', { variant: 'success' });
    };

    const grnQty = parseFloat(formData.grnQty) || 0;
    const acc = parseFloat(formData.acceptedQty) || 0;
    const rej = parseFloat(formData.rejectedQty) || 0;
    const nc = parseFloat(formData.ncQty) || 0;
    const balQty = grnQty - (acc + rej + nc);

    const iconColor = theme.palette.primary.main;
    const getIconProps = () => ({ size: 18, color: iconColor, style: { opacity: 0.7 } });

    return (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#fafafa', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" color="text.primary" fontWeight="bold">
                    {editItem ? 'Edit Inspection Entry' : 'Quick Inspect Item'}
                </Typography>
                {editItem && (
                    <Button size="small" variant="outlined" color="secondary" onClick={onCancel}>
                        Cancel Edit
                    </Button>
                )}
            </Box>

            <Box sx={{ mb: 2 }}>
                <BOSAutocomplete
                    label="Search & Select Item to Inspect"
                    size="small"
                    options={searchableItems || []}
                    getOptionLabel={(option) => `${option.itemCode || ''} - ${option.itemName || ''} (Batch: ${option.batchNo || '-'} | GRN Qty: ${option.grnQty || 0})`}
                    value={selectedItem}
                    onChange={handleItemSelect}
                    disabled={isReadOnly}
                    placeholder="Search by Item Code, Name or Batch..."
                    forcePopupIcon={true}
                />
            </Box>

            {selectedItem && (
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>

                    {/* Distinct Read-Only Details Headings */}
                    <Grid container spacing={2} mb={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box display="flex" alignItems="center" justifyContent="center" gap={1} p={1} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2) }}>
                                <IconHash size={18} color={theme.palette.primary.main} />
                                <Typography variant="body2" color="primary.main" fontWeight="medium">Batch No:</Typography>
                                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">{formData.batchNo || '-'}</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box display="flex" alignItems="center" justifyContent="center" gap={1} p={1} sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.08), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.secondary.main, 0.2) }}>
                                <IconTag size={18} color={theme.palette.secondary.main} />
                                <Typography variant="body2" color="secondary.main" fontWeight="medium">UOM:</Typography>
                                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">{formData.uom || '-'}</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box display="flex" alignItems="center" justifyContent="center" gap={1} p={1} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2) }}>
                                <IconDownload size={18} color={theme.palette.primary.main} />
                                <Typography variant="body2" color="primary.main" fontWeight="medium">GRN Qty:</Typography>
                                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">{formData.grnQty || 0}</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Box display="flex" alignItems="center" justifyContent="center" gap={1} p={1} sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.08), borderRadius: 2, border: '1px solid', borderColor: alpha(theme.palette.secondary.main, 0.2) }}>
                                <IconScale size={18} color={theme.palette.secondary.main} />
                                <Typography variant="body2" color="secondary.main" fontWeight="medium">Balance Qty:</Typography>
                                <Typography variant="subtitle2" fontWeight="bold" color="text.primary">{balQty}</Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {formData.grnRemarks && (
                        <Box display="flex" alignItems="center" gap={0.5} mb={2} p={1.5} sx={{ bgcolor: 'grey.50', borderRadius: 1, border: '1px dashed', borderColor: 'grey.300' }}>
                            <IconMessageCircle size={16} color={theme.palette.text.secondary} />
                            <Typography variant="body2" color="text.secondary">GRN Remarks: </Typography>
                            <Typography variant="subtitle2">{formData.grnRemarks}</Typography>
                        </Box>
                    )}

                    {/* Entry Section */}
                    <Grid container spacing={2} alignItems="flex-start">
                        {/* --- FIRST ROW --- */}
                        <Grid item xs={12} sm={6} md={2}>
                            <BOSTextField
                                label="Accepted Qty *"
                                size="small"
                                type="number"
                                placeholder="Enter qty"
                                value={formData.acceptedQty === 0 && formData.rejectedQty === 0 && !formData.acceptedQty ? '' : formData.acceptedQty}
                                onChange={(e) => handleChange('acceptedQty', e.target.value)}
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconCircleCheck {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <BOSTextField
                                label="Rejected Qty *"
                                size="small"
                                type="number"
                                placeholder="Enter qty"
                                value={formData.rejectedQty === 0 && formData.acceptedQty === 0 && !formData.rejectedQty ? '' : formData.rejectedQty}
                                onChange={(e) => handleChange('rejectedQty', e.target.value)}
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconCircleX {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <BOSAutocomplete
                                sx={{ width: '100% !important' }}
                                style={{ width: '100%' }}
                                fullWidth
                                freeSolo
                                size="small"
                                forcePopupIcon={true}
                                disabled={isReadOnly || !formData.rejectedQty || parseFloat(formData.rejectedQty) <= 0}
                                options={reasons.map(r => r.rejectionReason)}
                                value={formData.rejectionReason || ''}
                                label="Rejection Reason"
                                placeholder="Select or enter..."
                                error={parseFloat(formData.rejectedQty) > 0 && !formData.rejectionReason}
                                helperText={parseFloat(formData.rejectedQty) > 0 && !formData.rejectionReason ? "Mandatory" : ""}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ ml: 1 }}>
                                            <IconAlertTriangle {...getIconProps()} />
                                        </InputAdornment>
                                    )
                                }}
                                onChange={(newValue) => {
                                    if (newValue) {
                                        let selected = reasons.find(r => r.rejectionReason === newValue);
                                        handleChange('rejectionReason', newValue);
                                        handleChange('rejectionReasonId', selected ? selected.id : null);
                                    } else {
                                        handleChange('rejectionReason', '');
                                        handleChange('rejectionReasonId', null);
                                    }
                                }}
                                onInputChange={(e, newInputValue) => {
                                    if (newInputValue !== undefined) {
                                        handleChange('rejectionReason', newInputValue);
                                        let selected = reasons.find(r => r.rejectionReason === newInputValue);
                                        handleChange('rejectionReasonId', selected ? selected.id : null);
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <BOSTextField
                                label="NC Qty *"
                                size="small"
                                type="number"
                                placeholder="Enter qty"
                                value={formData.ncQty === 0 && formData.acceptedQty === 0 && formData.rejectedQty === 0 && !formData.ncQty ? '' : formData.ncQty}
                                onChange={(e) => handleChange('ncQty', e.target.value)}
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconScale {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <BOSTextField
                                label="NC Remarks"
                                size="small"
                                placeholder="Enter NC remarks..."
                                value={formData.ncRemarks || ''}
                                onChange={(e) => handleChange('ncRemarks', e.target.value)}
                                disabled={isReadOnly || !formData.ncQty || parseFloat(formData.ncQty) <= 0}
                                error={parseFloat(formData.ncQty) > 0 && !formData.ncRemarks}
                                helperText={parseFloat(formData.ncQty) > 0 && !formData.ncRemarks ? "Mandatory" : ""}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><IconFileText {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <BOSTextField
                                label="Inspected By"
                                size="small"
                                placeholder="Inspector name"
                                value={formData.inspectedBy || ''}
                                onChange={(e) => handleChange('inspectedBy', e.target.value)}
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconUser {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>

                        {/* --- SECOND ROW --- */}
                        <Grid item xs={12} sm={6} md={2}>
                            <BOSTextField
                                label="Test Certificate"
                                size="small"
                                placeholder="Certificate no"
                                value={formData.testCertificate || ''}
                                onChange={(e) => handleChange('testCertificate', e.target.value)}
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconCertificate {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <BOSTextField
                                label="TC Source"
                                size="small"
                                placeholder="Source of TC"
                                value={formData.tcSource || ''}
                                onChange={(e) => handleChange('tcSource', e.target.value)}
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconBuildingBank {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <BOSTextField
                                label="Heat No"
                                size="small"
                                placeholder="Heat number"
                                value={formData.heatNo || ''}
                                onChange={(e) => handleChange('heatNo', e.target.value)}
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconFlame {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <BOSTextField
                                label="Remarks"
                                size="small"
                                placeholder="Remarks"
                                value={formData.remarks || ''}
                                onChange={(e) => handleChange('remarks', e.target.value)}
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconFileText {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>

                        {/* Spacer to push Upload and Button to the far right */}
                        <Grid item xs={0} md={1} />

                        <Grid item xs={12} md={5}>
                            <BOSFileUpload
                                files={(formData.attachments || []).map(att => ({
                                    id: att.id ? String(att.id) : att.serverFileName || att.filePath,
                                    fileName: att.fileName || att.name,
                                    serverFileName: att.filePath || att.serverFileName,
                                    fileSize: att.fileSize,
                                    fileType: att.mimeType || att.fileType,
                                    isServer: true,
                                }))}
                                onChange={(updatedFiles) => {
                                    const mapped = updatedFiles.map(f => ({
                                        id: isNaN(f.id) || String(f.id).includes('_') ? null : f.id,
                                        fileName: f.fileName || f.name,
                                        filePath: f.serverFileName || f.path || f.filePath,
                                        serverFileName: f.serverFileName || f.path || f.filePath,
                                        fileSize: f.fileSize,
                                        mimeType: f.fileType || f.mimeType,
                                        docType: 'QI_TRANS',
                                        activeStatus: 1,
                                    }));
                                    if (!isReadOnly) {
                                        handleChange('attachments', mapped);
                                    }
                                }}
                                module="Purchase/Quality Inspection"
                                multiple={true}
                                maxFiles={20}
                                maxSizeMB={25}
                                disabled={isReadOnly}
                                compact={true}
                                sideBySide={true}
                                maxListHeight={80}
                            />
                        </Grid>

                        <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleOpenTestReport}
                                disabled={isReadOnly}
                                startIcon={<IconCertificate size={20} />}
                                fullWidth
                            >
                                Inspection
                            </Button>
                        </Grid>
                    </Grid>

                    <TestReportDialog
                        open={testReportOpen}
                        onClose={() => setTestReportOpen(false)}
                        testReports={formData.testReports || []}
                        onSave={handleSaveTestReport}
                    />

                    {!isReadOnly && (
                        <Box display="flex" justifyContent="flex-end" mt={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={handleSave}
                                startIcon={<IconPlus size={18} />}
                            >
                                Apply
                            </Button>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default QualityInspectionInlineEntry;
