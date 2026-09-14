import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, Box, Grid, IconButton, InputAdornment, useTheme, Autocomplete, TextField
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { 
    IconX, IconDeviceFloppy, IconClipboardCheck, IconCircleCheck, IconCircleX, 
    IconAlertTriangle, IconUser, IconCertificate, IconBuildingBank, IconFlame, 
    IconFileText, IconMessageCircle, IconBox, IconHash, IconTag,
    IconCurrencyRupee, IconDownload, IconScale
} from '@tabler/icons-react';
import { BOSTextField, BOSAutocomplete, btnSave } from 'ui-component/bos';
import useAuth from 'hooks/useAuth';
import useRejectionReasonStore from 'store/purchase/inspection/useRejectionReasonStore';
import { useSnackbar } from 'notistack';

const QualityInspectionItemDialog = ({ open, onClose, onSave, itemData, grnData, isReadOnly }) => {
    const theme = useTheme();
    const { user } = useAuth();
    const currentUserId = user?.userId;
    const { reasons, fetchReasons, createReason } = useRejectionReasonStore();
    const { enqueueSnackbar } = useSnackbar();
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchReasons();
    }, [fetchReasons]);

    useEffect(() => {
        if (open && itemData) {
            setFormData({
                ...itemData,
                inspectedBy: itemData.inspectedBy || user?.name || user?.username || ''
            });
        }
    }, [open, itemData, user]);

    const handleChange = (field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            
            // Re-calculate balance based on accepted/rejected qty
            if (field === 'acceptedQty' || field === 'rejectedQty') {
                const acc = parseFloat(updated.acceptedQty) || 0;
                const rej = parseFloat(updated.rejectedQty) || 0;
                const remaining = parseFloat(itemData.remainingQty) || 0; // Total eligible to inspect
                
                if ((acc + rej) > remaining) {
                    // Prevent over-allocation, cap it
                    if (field === 'acceptedQty') {
                        updated.acceptedQty = Math.max(0, remaining - rej);
                    } else {
                        updated.rejectedQty = Math.max(0, remaining - acc);
                    }
                }
            }
            return updated;
        });
    };

    const handleSave = () => {
        const rej = parseFloat(formData.rejectedQty) || 0;
        if (rej > 0 && (!formData.rejectionReason || formData.rejectionReason.trim() === '')) {
            enqueueSnackbar('Rejection Reason is mandatory when Rejected Qty is greater than 0', { variant: 'error' });
            return;
        }
        onSave(formData);
    };

    if (!itemData) return null;

    const grnQty = parseFloat(formData.grnQty) || 0;
    const acc = parseFloat(formData.acceptedQty) || 0;
    const rej = parseFloat(formData.rejectedQty) || 0;
    const balQty = grnQty - (acc + rej);

    const iconColor = theme.palette.primary.main;
    const getIconProps = () => ({ size: 18, color: iconColor, style: { opacity: 0.7 } });

    const SectionHeader = ({ icon, title }) => (
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            {icon}
            <Typography variant="h5" color="primary" fontWeight="bold">
                {title}
            </Typography>
        </Box>
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box display="flex" gap={2} alignItems="center">
                        <Box sx={{ 
                            p: 1.5, 
                            borderRadius: 2, 
                            bgcolor: 'primary.light', 
                            color: 'primary.dark',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                        }}>
                            <IconClipboardCheck size={28} />
                        </Box>
                        <Box>
                            <Typography variant="h3" fontWeight="bold" color="text.primary">
                                Quality Inspection - Item Entry
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Capture inspection details and item information
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3, bgcolor: '#fafafa' }}>
                
                {/* Read-Only Details Section */}
                <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
                    <SectionHeader icon={<IconBox size={22} color={theme.palette.primary.main} />} title="Item Details (From GRN)" />
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="Material Name" 
                                value={formData.itemName || ''} 
                                InputProps={{ 
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start"><IconBox {...getIconProps()} /></InputAdornment>
                                }} 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="Batch No" 
                                value={formData.batchNo || ''} 
                                InputProps={{ 
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start"><IconHash {...getIconProps()} /></InputAdornment>
                                }} 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="UOM" 
                                value={formData.uom || ''} 
                                InputProps={{ 
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start"><IconTag {...getIconProps()} /></InputAdornment>
                                }} 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="Price" 
                                value={formData.price || ''} 
                                InputProps={{ 
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start"><IconCurrencyRupee {...getIconProps()} /></InputAdornment>
                                }} 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="GRN Qty (Received)" 
                                value={formData.grnQty || 0} 
                                InputProps={{ 
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start"><IconDownload {...getIconProps()} /></InputAdornment>
                                }} 
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="Balance Qty" 
                                value={balQty} 
                                InputProps={{ 
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start"><IconScale {...getIconProps()} /></InputAdornment>
                                }} 
                            />
                        </Grid>
                        <Grid item xs={12} sm={12} md={6}>
                            <BOSTextField 
                                label="GRN Remarks" 
                                value={formData.grnRemarks || ''} 
                                InputProps={{ 
                                    readOnly: true,
                                    startAdornment: <InputAdornment position="start"><IconMessageCircle {...getIconProps()} /></InputAdornment>
                                }} 
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Entry Section */}
                <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <SectionHeader icon={<IconClipboardCheck size={22} color={theme.palette.primary.main} />} title="Inspection Entry" />
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="Accepted Qty *" 
                                type="number"
                                placeholder="Enter accepted qty"
                                value={formData.acceptedQty === 0 && formData.rejectedQty === 0 && !formData.acceptedQty ? '' : formData.acceptedQty} 
                                onChange={(e) => handleChange('acceptedQty', e.target.value)} 
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconCircleCheck {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="Rejected Qty *" 
                                type="number"
                                placeholder="Enter rejected qty"
                                value={formData.rejectedQty === 0 && formData.acceptedQty === 0 && !formData.rejectedQty ? '' : formData.rejectedQty} 
                                onChange={(e) => handleChange('rejectedQty', e.target.value)} 
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconCircleX {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSAutocomplete
                                sx={{ width: '100% !important' }}
                                style={{ width: '100%' }}
                                fullWidth
                                freeSolo
                                forcePopupIcon={true}
                                disabled={isReadOnly}
                                options={reasons.map(r => r.rejectionReason)}
                                value={formData.rejectionReason || ''}
                                label="Rejection Reason"
                                placeholder="Select or enter reason"
                                error={parseFloat(formData.rejectedQty) > 0 && !formData.rejectionReason}
                                helperText={parseFloat(formData.rejectedQty) > 0 && !formData.rejectionReason ? "Mandatory" : ""}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ ml: 1 }}>
                                            <IconAlertTriangle {...getIconProps()} />
                                        </InputAdornment>
                                    )
                                }}
                                onChange={async (newValue) => {
                                    if (newValue) {
                                        let selected = reasons.find(r => r.rejectionReason === newValue);
                                        if (!selected) {
                                            try {
                                                selected = await createReason(newValue, currentUserId || 'system');
                                            } catch (error) {
                                                return;
                                            }
                                        }
                                        handleChange('rejectionReason', selected.rejectionReason);
                                        handleChange('rejectionReasonId', selected.id);
                                    } else {
                                        handleChange('rejectionReason', '');
                                        handleChange('rejectionReasonId', null);
                                    }
                                }}
                                onInputChange={(event, newInputValue) => {
                                    handleChange('rejectionReason', newInputValue);
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="Inspected By" 
                                value={formData.inspectedBy || ''} 
                                onChange={(e) => handleChange('inspectedBy', e.target.value)} 
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconUser {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="Test Certificate" 
                                placeholder="Enter certificate no."
                                value={formData.testCertificate || ''} 
                                onChange={(e) => handleChange('testCertificate', e.target.value)} 
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconCertificate {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="TC Source" 
                                placeholder="Enter TC source"
                                value={formData.tcSource || ''} 
                                onChange={(e) => handleChange('tcSource', e.target.value)} 
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconBuildingBank {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="Heat No" 
                                placeholder="Enter heat number"
                                value={formData.heatNo || ''} 
                                onChange={(e) => handleChange('heatNo', e.target.value)} 
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconFlame {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <BOSTextField 
                                label="Remarks" 
                                placeholder="Enter remarks"
                                value={formData.remarks || ''} 
                                onChange={(e) => handleChange('remarks', e.target.value)} 
                                InputProps={{
                                    readOnly: isReadOnly,
                                    startAdornment: <InputAdornment position="start"><IconFileText {...getIconProps()} /></InputAdornment>
                                }}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: 'background.paper' }}>
                <Button onClick={onClose} variant="outlined" color="secondary" sx={{ px: 4, borderRadius: 2 }}>
                    {isReadOnly ? 'Close' : 'Cancel'}
                </Button>
                {!isReadOnly && (
                    <Button 
                        onClick={handleSave} 
                        variant="contained" 
                        color="success" 
                        startIcon={<IconDeviceFloppy size={18} />}
                        sx={{ ...btnSave, px: 4, borderRadius: 2 }}
                    >
                        Apply
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default QualityInspectionItemDialog;
