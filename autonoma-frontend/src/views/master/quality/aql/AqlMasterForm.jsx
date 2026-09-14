import React, { useState, useEffect } from 'react';
import {
    Grid, Box, Typography, Button, TextField, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Divider, CircularProgress, alpha, useTheme, Avatar, TablePagination
} from '@mui/material';
import { IconDeviceFloppy, IconX, IconPlus, IconTrash, IconChecks } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { BOSAutocomplete } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import axios from 'utils/axios';
import { dispatch } from 'store';
import { openSnackbar } from 'store/slices/snackbar';

const AqlMasterForm = ({ id, onCancel }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [itemGroupOptions, setItemGroupOptions] = useState([]);

    const [formData, setFormData] = useState({
        aqlCode: '',
        aqlName: '',
        inspectionLevel: '',
        inspectionType: '',
        aqlValue: '',
        remarks: '',
        status: 1,
        itemGroups: [],
        samplingRules: []
    });

    useEffect(() => {
        const fetchItemGroups = async () => {
            try {
                const response = await axios.get(API_PATHS.NPD.ITEM_GROUP);
                const groups = response.data || [];
                setItemGroupOptions(groups.map((g) => ({
                    value: g.groupName,
                    label: g.groupName
                })));
            } catch (err) {
                console.error('Failed to fetch item groups:', err);
            }
        };
        fetchItemGroups();
    }, []);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/qmc/aql/${id}`);
            const data = response.data;
            setFormData({
                ...data,
                itemGroups: data.itemGroups || [],
                samplingRules: data.samplingRules || []
            });
        } catch (error) {
            console.error('Error fetching AQL Master:', error);
            dispatch(openSnackbar({
                open: true,
                message: 'Failed to fetch AQL Master details.',
                variant: 'alert',
                alert: { color: 'error' },
                close: true
            }));
            onCancel();
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleRuleChange = (index, field, value) => {
        const updatedRules = [...formData.samplingRules];
        updatedRules[index] = { ...updatedRules[index], [field]: value };
        setFormData(prev => ({ ...prev, samplingRules: updatedRules }));

        // Clear specific rule errors
        const errorKey = `rule_${index}_${field}`;
        if (errors[errorKey]) {
            setErrors(prev => ({ ...prev, [errorKey]: null }));
        }
        if (errors.overlap) {
            setErrors(prev => ({ ...prev, overlap: null }));
        }
    };

    const addRule = () => {
        setFormData(prev => ({
            ...prev,
            samplingRules: [
                ...prev.samplingRules,
                { lotSizeFrom: '', lotSizeTo: '', sampleSize: '', acceptanceQty: '', rejectionQty: '' }
            ]
        }));
    };

    const removeRule = (index) => {
        const updatedRules = formData.samplingRules.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, samplingRules: updatedRules }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.aqlName?.trim()) newErrors.aqlName = 'AQL Name is required';
        if (!formData.inspectionLevel?.trim()) newErrors.inspectionLevel = 'Inspection Level is required';
        if (!formData.inspectionType?.trim()) newErrors.inspectionType = 'Inspection Type is required';
        if (!formData.aqlValue) newErrors.aqlValue = 'AQL Value is required';
        else if (isNaN(formData.aqlValue) || Number(formData.aqlValue) < 0) newErrors.aqlValue = 'Must be a valid positive number';

        const rules = formData.samplingRules;
        let overlapError = null;

        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            const from = Number(rule.lotSizeFrom);
            const to = Number(rule.lotSizeTo);
            const sample = Number(rule.sampleSize);
            const acc = Number(rule.acceptanceQty);
            const rej = Number(rule.rejectionQty);

            if (!rule.lotSizeFrom || isNaN(from)) newErrors[`rule_${i}_lotSizeFrom`] = 'Required';
            if (!rule.lotSizeTo || isNaN(to)) newErrors[`rule_${i}_lotSizeTo`] = 'Required';
            if (!rule.sampleSize || isNaN(sample)) newErrors[`rule_${i}_sampleSize`] = 'Required';
            else if (sample <= 0) newErrors[`rule_${i}_sampleSize`] = 'Must be > 0';

            if (rule.acceptanceQty === '' || isNaN(acc)) newErrors[`rule_${i}_acceptanceQty`] = 'Required';
            else if (acc > sample) newErrors[`rule_${i}_acceptanceQty`] = 'Cannot exceed Sample Size';

            if (rule.rejectionQty === '' || isNaN(rej)) newErrors[`rule_${i}_rejectionQty`] = 'Required';

            if (from && to && from > to) {
                newErrors[`rule_${i}_lotSizeFrom`] = 'From > To';
                newErrors[`rule_${i}_lotSizeTo`] = 'From > To';
            }

            // Overlap check
            for (let j = i + 1; j < rules.length; j++) {
                const nextRule = rules[j];
                const nextFrom = Number(nextRule.lotSizeFrom);
                const nextTo = Number(nextRule.lotSizeTo);

                if (from && to && nextFrom && nextTo) {
                    if (from <= nextTo && to >= nextFrom) {
                        overlapError = `Row ${i + 1} and ${j + 1} have overlapping Lot Sizes.`;
                    }
                }
            }
        }

        if (overlapError) {
            newErrors.overlap = overlapError;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            dispatch(openSnackbar({
                open: true,
                message: 'Please fix the validation errors.',
                variant: 'alert',
                alert: { color: 'error' },
                close: true
            }));

            // Add shake animation to visually indicate failure
            const card = document.getElementById('aql-form-card');
            if (card) {
                card.classList.add('shake-animation');
                setTimeout(() => card.classList.remove('shake-animation'), 500);
            }
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...formData,
                aqlValue: Number(formData.aqlValue),
                samplingRules: formData.samplingRules.map(r => ({
                    lotSizeFrom: Number(r.lotSizeFrom),
                    lotSizeTo: Number(r.lotSizeTo),
                    sampleSize: Number(r.sampleSize),
                    acceptanceQty: Number(r.acceptanceQty),
                    rejectionQty: Number(r.rejectionQty)
                }))
            };

            if (id) {
                await axios.put(`/api/qmc/aql/${id}`, payload);
            } else {
                await axios.post('/api/qmc/aql', payload);
            }

            dispatch(openSnackbar({
                open: true,
                message: `AQL Configuration ${id ? 'updated' : 'saved'} successfully.`,
                variant: 'alert',
                alert: { color: 'success' },
                close: true
            }));
            onCancel();
        } catch (error) {
            console.error('Error saving AQL Configuration:', error);
            dispatch(openSnackbar({
                open: true,
                message: error.response?.data?.message || 'Failed to save AQL Configuration.',
                variant: 'alert',
                alert: { color: 'error' },
                close: true
            }));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainCard stretch={false}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <MainCard
                id="aql-form-card"
                fullWidth
                stretch={false}
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                            variant="rounded"
                            sx={{
                                ...theme.typography.commonAvatar,
                                ...theme.typography.largeAvatar,
                                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.warning.light,
                                color: theme.palette.warning.dark
                            }}
                        >
                            <IconChecks stroke={1.5} size="1.3rem" />
                        </Avatar>
                        <Box>
                            <Typography variant="h3" sx={{ fontWeight: 600 }}>
                                {id ? `Edit AQL/Sampling Plan: ${formData.aqlCode}` : 'New AQL/Sampling Plan'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {id ? 'View or modify the details of this AQL/Sampling Plan configuration' : 'Configure a new Sampling and Acceptance Quality Limit sampling standard'}
                            </Typography>
                        </Box>
                    </Box>
                }
                secondary={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<IconX size={16} />}
                            onClick={onCancel}
                            disabled={saving}
                            sx={{ minWidth: '90px' }}
                        >
                            Close
                        </Button>
                        <Button
                            variant="contained"
                            color="warning"
                            size="small"
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={16} />}
                            onClick={handleSave}
                            disabled={saving}
                            sx={{ minWidth: '140px' }}
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </Button>
                    </Box>
                }
                sx={{
                    width: '100%',
                    '&.shake-animation': {
                        animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
                        border: `1px solid ${theme.palette.error.main}`
                    },
                    '@keyframes shake': {
                        '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                        '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                        '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                        '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
                    }
                }}
            >
                <Grid container spacing={3} sx={{ width: '100%' }}>
                    <Grid item xs={12} >
                        <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 4, height: 20, bgcolor: 'primary.main', borderRadius: 1 }} />
                            Basic Information
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 0.5, width: '100%' }}>
                            <Grid item xs={6} sm={6} lg={4} xl={3} sx={{ width: { xs: '100%', sm: '48%', md: '19%' } }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="AQL Code"
                                    name="aqlCode"
                                    value={formData.aqlCode || 'Auto-generated'}
                                    disabled
                                    InputProps={{
                                        sx: { bgcolor: 'grey.100', '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)', fontWeight: 600 } }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="AQL Name"
                                    name="aqlName"
                                    value={formData.aqlName}
                                    onChange={handleInputChange}
                                    error={!!errors.aqlName}
                                    helperText={errors.aqlName}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <BOSAutocomplete
                                    multiple
                                    name="itemGroups"
                                    label="Product Item Group"
                                    placeholder="Select Item Groups"
                                    options={itemGroupOptions}
                                    value={formData.itemGroups || []}
                                    onChange={(val) => {
                                        setFormData(prev => ({ ...prev, itemGroups: val || [] }));
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Inspection Level"
                                    name="inspectionLevel"
                                    value={formData.inspectionLevel}
                                    onChange={handleInputChange}
                                    error={!!errors.inspectionLevel}
                                    helperText={errors.inspectionLevel}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Inspection Type"
                                    name="inspectionType"
                                    value={formData.inspectionType}
                                    onChange={handleInputChange}
                                    error={!!errors.inspectionType}
                                    helperText={errors.inspectionType}
                                    required
                                >
                                    <MenuItem value="Normal">Normal</MenuItem>
                                    <MenuItem value="Tightened">Tightened</MenuItem>
                                    <MenuItem value="Reduced">Reduced</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="AQL Value"
                                    name="aqlValue"
                                    type="number"
                                    inputProps={{ step: "0.01", min: "0" }}
                                    value={formData.aqlValue}
                                    onChange={handleInputChange}
                                    error={!!errors.aqlValue}
                                    helperText={errors.aqlValue}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '19%' } }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    <MenuItem value={1}>Active</MenuItem>
                                    <MenuItem value={0}>Inactive</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ width: { xs: '100%', md: '50%' } }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Remarks"
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    multiline
                                    rows={1}
                                />
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 4, height: 20, bgcolor: 'secondary.main', borderRadius: 1 }} />
                                Sampling Rules Matrix
                            </Typography>
                            <Button variant="outlined" color="secondary" startIcon={<IconPlus size={18} />} onClick={addRule}>
                                Add Rule
                            </Button>
                        </Box>

                        {errors.overlap && (
                            <Typography color="error" variant="body2" sx={{ mb: 2, p: 1, bgcolor: 'error.light', borderRadius: 1, fontWeight: 500 }}>
                                {errors.overlap}
                            </Typography>
                        )}

                        <TableContainer
                            component={Paper}
                            elevation={0}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                width: '100%',
                                height: 'calc(100vh - 430px)',
                                minHeight: '260px',
                                overflow: 'auto',
                                borderRadius: 1.5,
                                '&::-webkit-scrollbar': { width: 6, height: 6 },
                                '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
                                '&::-webkit-scrollbar-thumb': { backgroundColor: 'grey.300', borderRadius: 10, '&:hover': { backgroundColor: 'grey.400' } }
                            }}
                        >
                            <Table size="small" stickyHeader sx={{ width: '100%', minWidth: '100%', tableLayout: 'fixed' }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="6%" sx={{ bgcolor: 'warning.main', color: '#fff', fontWeight: 700, textTransform: 'uppercase', py: 1.5, position: 'sticky', top: 0, zIndex: 2, textAlign: 'center' }}>S.No</TableCell>
                                        <TableCell width="18%" sx={{ bgcolor: 'warning.main', color: '#fff', fontWeight: 700, textTransform: 'uppercase', py: 1.5, position: 'sticky', top: 0, zIndex: 2 }}>Lot Size From</TableCell>
                                        <TableCell width="18%" sx={{ bgcolor: 'warning.main', color: '#fff', fontWeight: 700, textTransform: 'uppercase', py: 1.5, position: 'sticky', top: 0, zIndex: 2 }}>Lot Size To</TableCell>
                                        <TableCell width="18%" sx={{ bgcolor: 'warning.main', color: '#fff', fontWeight: 700, textTransform: 'uppercase', py: 1.5, position: 'sticky', top: 0, zIndex: 2 }}>Sample Size</TableCell>
                                        <TableCell width="17%" sx={{ bgcolor: 'warning.main', color: '#fff', fontWeight: 700, textTransform: 'uppercase', py: 1.5, position: 'sticky', top: 0, zIndex: 2 }}>Acceptance Qty</TableCell>
                                        <TableCell width="17%" sx={{ bgcolor: 'warning.main', color: '#fff', fontWeight: 700, textTransform: 'uppercase', py: 1.5, position: 'sticky', top: 0, zIndex: 2 }}>Rejection Qty</TableCell>
                                        <TableCell width="6%" align="center" sx={{ bgcolor: 'warning.main', color: '#fff', fontWeight: 700, textTransform: 'uppercase', py: 1.5, position: 'sticky', top: 0, zIndex: 2 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {formData.samplingRules.length === 0 ? (
                                        <TableRow sx={{ height: '100%' }}>
                                            <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '160px' }}>
                                                    <Typography color="textSecondary" variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                                                        No sampling rules configured.
                                                    </Typography>
                                                    <Typography color="textSecondary" variant="body2" sx={{ mb: 2 }}>
                                                        Add lot-size sampling rules to define inspection quantity and criteria.
                                                    </Typography>
                                                    <Button variant="contained" color="primary" startIcon={<IconPlus size={16} />} onClick={addRule} sx={{ borderRadius: 2 }}>
                                                        Add Sampling Rule
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        formData.samplingRules
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((rule, idx) => {
                                                const index = page * rowsPerPage + idx;
                                                return (
                                                    <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                        <TableCell align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>{index + 1}</TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                size="small"
                                                                fullWidth
                                                                type="number"
                                                                value={rule.lotSizeFrom}
                                                                onChange={(e) => handleRuleChange(index, 'lotSizeFrom', e.target.value)}
                                                                error={!!errors[`rule_${index}_lotSizeFrom`]}
                                                                helperText={errors[`rule_${index}_lotSizeFrom`]}
                                                                inputProps={{ min: 1 }}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 }, '& .MuiOutlinedInput-input': { p: 1, textAlign: 'right' } }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                size="small"
                                                                fullWidth
                                                                type="number"
                                                                value={rule.lotSizeTo}
                                                                onChange={(e) => handleRuleChange(index, 'lotSizeTo', e.target.value)}
                                                                error={!!errors[`rule_${index}_lotSizeTo`]}
                                                                helperText={errors[`rule_${index}_lotSizeTo`]}
                                                                inputProps={{ min: 1 }}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 }, '& .MuiOutlinedInput-input': { p: 1, textAlign: 'right' } }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                size="small"
                                                                fullWidth
                                                                type="number"
                                                                value={rule.sampleSize}
                                                                onChange={(e) => handleRuleChange(index, 'sampleSize', e.target.value)}
                                                                error={!!errors[`rule_${index}_sampleSize`]}
                                                                helperText={errors[`rule_${index}_sampleSize`]}
                                                                inputProps={{ min: 1 }}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 }, '& .MuiOutlinedInput-input': { p: 1, textAlign: 'right' } }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                size="small"
                                                                fullWidth
                                                                type="number"
                                                                value={rule.acceptanceQty}
                                                                onChange={(e) => handleRuleChange(index, 'acceptanceQty', e.target.value)}
                                                                error={!!errors[`rule_${index}_acceptanceQty`]}
                                                                helperText={errors[`rule_${index}_acceptanceQty`]}
                                                                inputProps={{ min: 0 }}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 }, '& .MuiOutlinedInput-input': { p: 1, textAlign: 'right' } }}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                size="small"
                                                                fullWidth
                                                                type="number"
                                                                value={rule.rejectionQty}
                                                                onChange={(e) => handleRuleChange(index, 'rejectionQty', e.target.value)}
                                                                error={!!errors[`rule_${index}_rejectionQty`]}
                                                                helperText={errors[`rule_${index}_rejectionQty`]}
                                                                inputProps={{ min: 0 }}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 }, '& .MuiOutlinedInput-input': { p: 1, textAlign: 'right' } }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <IconButton size="small" color="error" onClick={() => removeRule(index)}>
                                                                <IconTrash size={18} />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={formData.samplingRules.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    </Grid>
                </Grid>
            </MainCard>
        </Box>
    );
};

export default AqlMasterForm;
