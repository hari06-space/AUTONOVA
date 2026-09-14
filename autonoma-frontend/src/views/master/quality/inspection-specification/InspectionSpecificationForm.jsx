import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Grid, Box, Typography, Button, TextField, MenuItem,
    CircularProgress, alpha, useTheme, Autocomplete, Chip, Paper, Avatar, InputAdornment, IconButton
} from '@mui/material';
import { IconDeviceFloppy, IconX, IconClipboardList, IconAlertCircle, IconSearch } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { openSnackbar } from 'store/slices/snackbar';
import { useDispatch } from 'react-redux';
import axios from 'utils/axios';
import InspectionParameterGrid from './InspectionParameterGrid';
import InspectionParameterDrawer from './InspectionParameterDrawer';
import ProductSelectionDialog from 'modules/npd/OemMapping/ProductSelectionDialog';

// Shake animation keyframes injected once
const SHAKE_STYLE_ID = 'bos-is-shake';
if (!document.getElementById(SHAKE_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = SHAKE_STYLE_ID;
    style.innerHTML = `@keyframes bos-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}`;
    document.head.appendChild(style);
}

const InspectionSpecificationForm = ({ id, onCancel, onSaved }) => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const cardRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState([]);
    const [itemGroups, setItemGroups] = useState([]);
    const [aqlList, setAqlList] = useState([]);
    const [selectedItemGroup, setSelectedItemGroup] = useState('');
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editParamIdx, setEditParamIdx] = useState(null);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        specificationName: '',
        itemId: '',
        aqlId: '',
        versionNo: 1,
        effectiveFrom: '',
        effectiveTo: '',
        remarks: ''
    });
    const [selectedItem, setSelectedItem] = useState(null);
    const [parameters, setParameters] = useState([]);

    // ──────── Load items (products) & AQL Master ────────
    useEffect(() => {
        const loadItems = async () => {
            try {
                const [itemsRes, groupsRes, aqlRes] = await Promise.all([
                    axios.get('/api/master/npd/product-master/list'),
                    axios.get('/api/master/npd/item-group').catch(() => ({ data: [] })),
                    axios.get('/api/qmc/aql', { params: { page: 0, size: 200 } }).catch(() => ({ data: { content: [] } }))
                ]);
                setItems(itemsRes.data || []);
                setItemGroups(groupsRes.data || []);
                setAqlList(aqlRes.data?.content || aqlRes.data || []);
            } catch (err) {
                console.error('Could not load items', err);
            }
        };
        loadItems();
    }, []);

    // ──────── Load existing record ────────
    useEffect(() => {
        if (!id) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/qmc/inspection-specification/${id}`);
                const d = res.data;
                setFormData({
                    specificationCode: d.specificationCode || '',
                    specificationName: d.specificationName || '',
                    itemId: d.itemId || '',
                    aqlId: d.aqlId || '',
                    versionNo: d.versionNo || 1,
                    effectiveFrom: d.effectiveFrom || '',
                    effectiveTo: d.effectiveTo || '',
                    remarks: d.remarks || ''
                });
                setSelectedItem(d.itemId ? { id: d.itemId, itemNo: d.itemNo, itemName: d.itemName, itemGroup: d.itemGroup } : null);
                if (d.itemGroup) setSelectedItemGroup(d.itemGroup);
                setParameters(d.details || []);
            } catch (err) {
                dispatch(openSnackbar({ open: true, message: 'Failed to load specification.', variant: 'alert', alert: { color: 'error' }, close: true }));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, dispatch]);

    const handleChange = (field) => (e) => {
        const val = e.target.value;
        setFormData(prev => ({ ...prev, [field]: val }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleItemGroupChange = (newGroup) => {
        setSelectedItemGroup(newGroup);
        if (selectedItem && selectedItem.itemGroup !== newGroup && newGroup !== '') {
            setSelectedItem(null);
            setFormData(prev => ({ ...prev, itemId: '' }));
        }
        if (newGroup) {
            const grpObj = itemGroups.find(g => (g.groupName || '').trim().toLowerCase() === newGroup.trim().toLowerCase());
            setFormData(prev => ({ ...prev, aqlId: grpObj?.aqlId || '' }));
        } else {
            setFormData(prev => ({ ...prev, aqlId: '' }));
        }
    };

    const handleItemSelect = (_, item) => {
        setSelectedItem(item);
        const grp = item?.itemGroup || '';
        setSelectedItemGroup(grp);
        let mappedAqlId = '';
        if (grp) {
            const grpObj = itemGroups.find(g => (g.groupName || '').trim().toLowerCase() === grp.trim().toLowerCase());
            mappedAqlId = grpObj?.aqlId || '';
        }
        setFormData(prev => ({
            ...prev,
            itemId: item?.id || '',
            aqlId: mappedAqlId
        }));
        if (errors.itemId) setErrors(prev => ({ ...prev, itemId: '' }));
    };

    // ──────── Parameter Management ────────
    const handleAddParam = () => { setEditParamIdx(null); setDrawerOpen(true); };

    const handleEditParam = (idx) => { setEditParamIdx(idx); setDrawerOpen(true); };

    const handleDeleteParam = (idx) => {
        setParameters(prev => prev.filter((_, i) => i !== idx));
    };

    const handleDrawerSave = (paramData) => {
        if (editParamIdx != null) {
            setParameters(prev => prev.map((p, i) => i === editParamIdx ? paramData : p));
        } else {
            setParameters(prev => [...prev, paramData]);
        }
        setDrawerOpen(false);
    };

    // ──────── Validation ────────
    const validate = () => {
        const errs = {};
        if (!formData.specificationName?.trim()) errs.specificationName = 'Specification Name is required';
        if (!formData.itemId) errs.itemId = 'Item is required';
        if (!formData.versionNo || formData.versionNo < 1) errs.versionNo = 'Version must be ≥ 1';
        if (formData.effectiveFrom && formData.effectiveTo && formData.effectiveFrom > formData.effectiveTo) {
            errs.effectiveFrom = 'Effective From cannot be after Effective To';
            errs.effectiveTo = 'Effective From cannot be after Effective To';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ──────── Save ────────
    const handleSave = async () => {
        if (!validate()) {
            if (cardRef.current) {
                cardRef.current.style.animation = 'bos-shake 0.4s ease';
                setTimeout(() => { if (cardRef.current) cardRef.current.style.animation = ''; }, 400);
            }
            dispatch(openSnackbar({ open: true, message: 'Please fix the validation errors.', variant: 'alert', alert: { color: 'error' }, close: true }));
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...formData,
                versionNo: parseInt(formData.versionNo) || 1,
                effectiveFrom: formData.effectiveFrom || null,
                effectiveTo: formData.effectiveTo || null,
                details: parameters.map((p, i) => ({
                    ...p,
                    sequenceNo: p.sequenceNo != null ? parseInt(p.sequenceNo) : i + 1
                }))
            };
            if (id) {
                await axios.put(`/api/qmc/inspection-specification/${id}`, payload);
                dispatch(openSnackbar({ open: true, message: 'Inspection Specification updated successfully!', variant: 'alert', alert: { color: 'success' }, close: true }));
            } else {
                await axios.post('/api/qmc/inspection-specification', payload);
                dispatch(openSnackbar({ open: true, message: 'Inspection Specification created successfully!', variant: 'alert', alert: { color: 'success' }, close: true }));
            }
            onSaved?.();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to save specification.';
            dispatch(openSnackbar({ open: true, message: msg, variant: 'alert', alert: { color: 'error' }, close: true }));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <CircularProgress />
            </Box>
        );
    }

    const nextSeq = parameters.length > 0 ? Math.max(...parameters.map(p => parseInt(p.sequenceNo) || 0)) + 1 : 1;
    const editingParam = editParamIdx != null ? parameters[editParamIdx] : null;

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: 'calc(100vh - 100px)' }}>
                {/* ── Premium Sticky Header ── */}
                <Paper
                    elevation={0}
                    sx={{
                        position: 'sticky', top: 0, zIndex: 1200,
                        p: 1.5, borderRadius: 3,
                        bgcolor: 'background.paper', backgroundImage: 'none',
                        border: '1px solid', borderColor: 'divider',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, color: '#fff', width: 42, height: 42, boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}` }}>
                            <IconClipboardList size={22} />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                {id ? 'Edit Inspection Specification' : 'New Inspection Specification'}
                            </Typography>
                            {formData.specificationCode && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    {formData.specificationCode}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button variant="outlined" startIcon={<IconX size={16} />} onClick={onCancel} disabled={saving} sx={{ borderRadius: 2 }}>
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <IconDeviceFloppy size={16} />}
                            onClick={handleSave}
                            disabled={saving}
                            sx={{ borderRadius: 2, px: 3, boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}` }}
                        >
                            {saving ? 'Saving...' : (id ? 'Update Specification' : 'Save Specification')}
                        </Button>
                    </Box>
                </Paper>

                {/* ── Specification Information Card ── */}
                <MainCard ref={cardRef} id="spec-form-card" pageCode="M10200" content={false} stretch={false}>

                    <Box sx={{ p: 2.5 }}>
                        <Grid container spacing={2} alignItems="flex-start" sx={{ width: '100%' }}>

                            {/* Item Group Autocomplete */}
                            <Grid item xs={12} sm={6} md={3} sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
                                <Autocomplete
                                    size="small"
                                    options={itemGroups.map(ig => ig.groupName)}
                                    value={selectedItemGroup || null}
                                    onChange={(_, val) => handleItemGroupChange(val || '')}
                                    renderInput={(params) => <TextField {...params} label="Item Group" />}
                                />
                            </Grid>

                            {/* Item Selection Dialog */}
                            <Grid item xs={12} sm={6} md={3} sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
                                <TextField
                                    size="small" fullWidth
                                    label="Item *"
                                    value={selectedItem ? `${selectedItem.itemNo || selectedItem.partNo} — ${selectedItem.itemName || selectedItem.partName}` : ''}
                                    placeholder="Click to select Item"
                                    error={!!errors.itemId}
                                    helperText={errors.itemId}
                                    InputProps={{
                                        readOnly: true,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={() => setProductDialogOpen(true)} edge="end" size="small">
                                                    <IconSearch size={18} />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        sx: {
                                            bgcolor: 'background.paper',
                                            cursor: 'pointer',
                                            animation: errors.itemId ? 'bos-shake 0.4s ease' : 'none'
                                        }
                                    }}
                                    onClick={() => setProductDialogOpen(true)}
                                />
                                <ProductSelectionDialog
                                    open={productDialogOpen}
                                    onClose={() => setProductDialogOpen(false)}
                                    itemGroup={selectedItemGroup}
                                    onSelect={(item) => {
                                        if (item.id === 'NIL' || !item.id) {
                                            handleItemSelect(null, null);
                                        } else {
                                            handleItemSelect(null, { ...item, itemNo: item.partNo || item.itemNo, itemName: item.partName || item.itemName });
                                        }
                                        setProductDialogOpen(false);
                                    }}
                                />
                            </Grid>


                            {/* Spec Name */}
                            <Grid item xs={12} sm={6} md={3} sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
                                <TextField
                                    size="small" fullWidth
                                    label="Specification Name *"
                                    value={formData.specificationName}
                                    onChange={handleChange('specificationName')}
                                    error={!!errors.specificationName}
                                    helperText={errors.specificationName}
                                    sx={{ '& .MuiInputBase-root': { animation: errors.specificationName ? 'bos-shake 0.4s ease' : 'none', borderColor: errors.specificationName ? 'error.main' : undefined } }}
                                />
                            </Grid>

                            {/* Code */}
                            <Grid item xs={6} sm={3} md={1.5} sx={{ width: { xs: '100%', md: '11%' } }}>
                                <TextField
                                    size="small" fullWidth
                                    label="Spec Code"
                                    value={formData.specificationCode || 'Auto Generated'}
                                    disabled
                                    InputProps={{ sx: { bgcolor: 'grey.50', fontSize: '0.8rem', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'rgba(0,0,0,0.55)', fontWeight: 600 } } }}
                                />
                            </Grid>

                            {/* Version */}
                            <Grid item xs={6} sm={3} md={1.5} sx={{ width: { xs: '100%', md: '9%' } }}>
                                <TextField
                                    size="small" fullWidth
                                    label="Version *"
                                    type="number"
                                    value={formData.versionNo}
                                    onChange={handleChange('versionNo')}
                                    error={!!errors.versionNo}
                                    helperText={errors.versionNo}
                                    inputProps={{ min: 1 }}
                                />
                            </Grid>

                            {/* Effective From */}
                            <Grid item xs={6} sm={3} md={2} sx={{ width: { xs: '100%', md: '11%' } }}>
                                <TextField
                                    size="small" fullWidth
                                    label="Effective From"
                                    type="date"
                                    value={formData.effectiveFrom}
                                    onChange={handleChange('effectiveFrom')}
                                    error={!!errors.effectiveFrom}
                                    helperText={errors.effectiveFrom}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            {/* Effective To */}
                            <Grid item xs={6} sm={3} md={2} sx={{ width: { xs: '100%', md: '11%' } }}>
                                <TextField
                                    size="small" fullWidth
                                    label="Effective To"
                                    type="date"
                                    value={formData.effectiveTo}
                                    onChange={handleChange('effectiveTo')}
                                    error={!!errors.effectiveTo}
                                    helperText={errors.effectiveTo}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            {/* AQL / Sampling Plan (Read-Only Auto-Mapped from Item Group) */}
                            <Grid item xs={12} sm={6} md={3} sx={{ width: { xs: '100%', sm: '48%', md: '23%' } }}>
                                {(() => {
                                    const aqlObj = aqlList.find(a => a.id === formData.aqlId);
                                    const displayText = aqlObj
                                        ? `${aqlObj.aqlCode} - ${aqlObj.aqlName}${aqlObj.inspectionLevel ? `, LEVEL ${aqlObj.inspectionLevel}` : ''}${aqlObj.aqlValue != null ? `, AQL ${aqlObj.aqlValue}` : ''}`
                                        : (formData.aqlId ? `AQL #${formData.aqlId}` : 'Not Linked to Item Group');
                                    return (
                                        <TextField
                                            size="small"
                                            fullWidth
                                            label="AQL / Sampling Plan"
                                            value={displayText}
                                            disabled
                                            InputProps={{
                                                sx: {
                                                    bgcolor: 'grey.50',
                                                    fontSize: '0.8rem',
                                                    '& .MuiInputBase-input.Mui-disabled': {
                                                        WebkitTextFillColor: aqlObj ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.4)',
                                                        fontWeight: aqlObj ? 600 : 400
                                                    }
                                                }
                                            }}
                                            helperText={formData.aqlId ? "Mapped from Item Group" : ""}
                                        />
                                    );
                                })()}
                            </Grid>


                            {/* Remarks */}
                            <Grid item xs={12} sm={12} md={5} sx={{ width: { xs: '100%', md: '45%' } }}>
                                <TextField
                                    size="small" fullWidth
                                    label="Remarks"
                                    value={formData.remarks}
                                    onChange={handleChange('remarks')}
                                    multiline
                                    rows={1}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </MainCard>

                {/* ── Parameter Matrix Card ── */}
                <MainCard content={false} stretch={false} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.06), flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <InspectionParameterGrid
                            parameters={parameters}
                            onAdd={handleAddParam}
                            onEdit={handleEditParam}
                            onDelete={handleDeleteParam}
                        />
                    </Box>
                </MainCard>

            </Box>

            {/* ── Parameter Drawer ── */}
            <InspectionParameterDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSave={handleDrawerSave}
                parameter={editingParam}
                nextSeq={nextSeq}
            />

        </>
    );
};

export default InspectionSpecificationForm;
