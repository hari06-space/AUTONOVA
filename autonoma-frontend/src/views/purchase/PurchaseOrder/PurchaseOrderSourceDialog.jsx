import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Stepper, Step, StepLabel, Button, Box, Grid, Typography,
    FormControl, InputLabel, Select, MenuItem, CircularProgress,
    Alert, Chip, Divider, alpha, useTheme
} from '@mui/material';
import {
    Assignment, RequestQuote, Description, Handshake,
    CompareArrows, ShoppingCart, ArrowForward, CheckCircle, Close
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { BOSAutocomplete } from 'ui-component/bos';
import usePurchaseOrderStore from 'store/usePurchaseOrderStore';
import useAuth from 'hooks/useAuth';
import axios from 'utils/axios';

const SOURCE_TYPES = [
    { value: 'DIRECT', label: 'Direct Purchase Order', icon: <ShoppingCart />, color: '#2196f3', desc: 'Create a PO without any prior document' },
    { value: 'PURCHASE_REQUEST', label: 'Purchase Request', icon: <Assignment />, color: '#ff9800', desc: 'Convert an approved PR into a PO' }
];

const STEPS = ['Select Source', 'Select Document', 'Preview', 'Generate PO'];

export default function PurchaseOrderSourceDialog({ open, onClose }) {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { previewFromSource, previewPo, clearPreview, loading } = usePurchaseOrderStore();

    const [activeStep, setActiveStep] = useState(0);
    const [selectedSource, setSelectedSource] = useState(null);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [selectedDocLabel, setSelectedDocLabel] = useState('');
    const [docOptions, setDocOptions] = useState([]);
    const [docLoading, setDocLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleClose = () => {
        setActiveStep(0);
        setSelectedSource(null);
        setSelectedDocId(null);
        setDocOptions([]);
        clearPreview();
        setError(null);
        onClose();
    };

    const handleSelectSource = async (source) => {
        setSelectedSource(source);
        setError(null);
        if (source === 'DIRECT') {
            setActiveStep(2); // Skip document selection
            return;
        }
        setActiveStep(1);
        setDocLoading(true);
        try {
            const endpoints = {
                PURCHASE_REQUEST: `/api/purchase/pr/search?pendingPo=true`,
                RFQ: `/api/v1/rfq/division/${user?.divisionId}`,
                SUPPLIER_QUOTATION: `/api/v1/quotation/division/${user?.divisionId}`,
                NEGOTIATION: `/api/v1/purchase/negotiation/division/${user?.divisionId}`,
                QUOTATION_COMPARISON: `/api/purchase/quote-comparison/division/${user?.divisionId}`,
            };
            const res = await axios.get(endpoints[source]);
            const data = res.data || [];
            const labelFields = { PURCHASE_REQUEST: 'prNo', RFQ: 'rfqNo', SUPPLIER_QUOTATION: 'quotationNo', NEGOTIATION: 'negotiationNo', QUOTATION_COMPARISON: 'comparisonNo' };
            setDocOptions(data.map(d => ({ value: d.id, label: d[labelFields[source]] || `ID: ${d.id}` })));
        } catch (e) {
            setError('Failed to load documents: ' + (e?.response?.data?.message || e.message));
        } finally {
            setDocLoading(false);
        }
    };

    const handlePreview = async () => {
        setError(null);
        try {
            await previewFromSource({
                sourceType: selectedSource,
                sourceDocId: selectedDocId,
                divisionId: user?.divisionId
            });
            setActiveStep(2);
        } catch (e) {
            setError(e?.message || 'Failed to preview PO');
        }
    };

    const handleGeneratePo = () => {
        navigate('/purchase/po/entry', { state: { previewData: previewPo, sourceType: selectedSource } });
        handleClose();
    };

    const sourceConfig = SOURCE_TYPES.find(s => s.value === selectedSource);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{
            sx: { borderRadius: 3, background: theme.palette.background.paper }
        }}>
            <DialogTitle sx={{ pb: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <ShoppingCart color="primary" />
                        <Typography variant="h5" fontWeight={700}>Create Purchase Order</Typography>
                    </Box>
                    <Button size="small" onClick={handleClose}><Close /></Button>
                </Box>
                <Stepper activeStep={activeStep} sx={{ mt: 2 }} alternativeLabel>
                    {STEPS.map(label => (
                        <Step key={label}><StepLabel>{label}</StepLabel></Step>
                    ))}
                </Stepper>
            </DialogTitle>

            <DialogContent dividers sx={{ minHeight: 320 }}>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Step 0: Select Source */}
                {activeStep === 0 && (
                    <Grid container spacing={1.5}>
                        {SOURCE_TYPES.map(s => (
                            <Grid item xs={12} sm={6} key={s.value}>
                                <Box
                                    onClick={() => handleSelectSource(s.value)}
                                    sx={{
                                        p: 2, border: '2px solid', borderRadius: 2, cursor: 'pointer',
                                        borderColor: selectedSource === s.value ? s.color : theme.palette.divider,
                                        bgcolor: selectedSource === s.value ? alpha(s.color, 0.08) : 'transparent',
                                        transition: 'all 0.2s',
                                        '&:hover': { borderColor: s.color, bgcolor: alpha(s.color, 0.05), transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${alpha(s.color, 0.2)}` }
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                        <Box sx={{ color: s.color }}>{s.icon}</Box>
                                        <Typography variant="subtitle2" fontWeight={700}>{s.label}</Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">{s.desc}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Step 1: Select Document */}
                {activeStep === 1 && (
                    <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            {sourceConfig && <Box sx={{ color: sourceConfig.color }}>{sourceConfig.icon}</Box>}
                            <Typography variant="h6" fontWeight={600}>Select {sourceConfig?.label}</Typography>
                        </Box>
                        {docLoading ? (
                            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                        ) : (
                            <FormControl fullWidth>
                                <InputLabel>Select Document</InputLabel>
                                <Select
                                    value={selectedDocId || ''}
                                    label="Select Document"
                                    onChange={e => {
                                        setSelectedDocId(e.target.value);
                                        setSelectedDocLabel(docOptions.find(d => d.value === e.target.value)?.label || '');
                                    }}
                                >
                                    {docOptions.map(opt => (
                                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    </Box>
                )}

                {/* Step 2: Preview */}
                {activeStep === 2 && (
                    <Box>
                        <Typography variant="h6" fontWeight={600} mb={2}>PO Preview</Typography>
                        {loading ? (
                            <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
                        ) : previewPo || selectedSource === 'DIRECT' ? (
                            <Box>
                                <Grid container spacing={1} mb={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Source Type</Typography>
                                        <Typography fontWeight={600}>{selectedSource}</Typography>
                                    </Grid>
                                    {previewPo?.supplierName && (
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Supplier</Typography>
                                            <Typography fontWeight={600}>{previewPo.supplierName}</Typography>
                                        </Grid>
                                    )}
                                    {previewPo?.sourceDocumentNo && (
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">Source Document</Typography>
                                            <Chip label={previewPo.sourceDocumentNo} size="small" color="primary" />
                                        </Grid>
                                    )}
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="text.secondary">Items</Typography>
                                        <Typography fontWeight={600}>{previewPo?.items?.length || 0} line(s)</Typography>
                                    </Grid>
                                </Grid>
                                <Divider sx={{ my: 1 }} />
                                {previewPo?.items?.slice(0, 5).map((item, i) => (
                                    <Box key={i} display="flex" justifyContent="space-between" py={0.5}>
                                        <Typography variant="body2">{item.itemName || item.itemCode}</Typography>
                                        <Typography variant="body2" color="primary" fontWeight={600}>
                                            Qty: {item.qty} {item.uom}
                                        </Typography>
                                    </Box>
                                ))}
                                {(previewPo?.items?.length || 0) > 5 && (
                                    <Typography variant="caption" color="text.secondary">+ {previewPo.items.length - 5} more items</Typography>
                                )}
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    <CheckCircle sx={{ mr: 1 }} />
                                    Ready to generate Purchase Order!
                                </Alert>
                            </Box>
                        ) : (
                            <Alert severity="info">Click "Load Preview" to see the PO details</Alert>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                {activeStep > 0 && (
                    <Button 
                        onClick={() => {
                            if (activeStep === 2 && selectedSource === 'DIRECT') {
                                setActiveStep(0);
                            } else {
                                setActiveStep(s => s - 1);
                            }
                        }} 
                        variant="outlined"
                    >
                        Back
                    </Button>
                )}
                {activeStep === 0 && <Box flex={1} />}
                {activeStep === 1 && (
                    <Button
                        onClick={handlePreview}
                        variant="contained"
                        disabled={!selectedDocId || loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <ArrowForward />}
                    >
                        Load Preview
                    </Button>
                )}
                {activeStep === 2 && (
                    <Button
                        onClick={handleGeneratePo}
                        variant="contained"
                        color="success"
                        startIcon={<ShoppingCart />}
                    >
                        Generate Purchase Order
                    </Button>
                )}
                <Button onClick={handleClose} variant="outlined" color="error">Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}
