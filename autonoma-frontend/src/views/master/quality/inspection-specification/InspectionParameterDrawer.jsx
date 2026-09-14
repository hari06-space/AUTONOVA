import React, { useState, useEffect, useCallback } from 'react';
import {
    Drawer, Box, Typography, MenuItem, Button, Divider,
    Grid, IconButton, Chip, FormGroup, FormControlLabel, Checkbox,
    alpha, useTheme, Autocomplete, CircularProgress
} from '@mui/material';
import BOSTextField from 'ui-component/bos/BOSTextField';
import { IconX, IconDeviceFloppy, IconCheck } from '@tabler/icons-react';
import axios from 'utils/axios';

const PARAM_TYPES = ['DIMENSIONAL', 'VISUAL', 'CHEMICAL', 'METALLURGICAL', 'FUNCTIONAL', 'OTHER'];
const PARAM_CONDITIONS = ['MIN_MAX', 'MIN', 'MAX', 'VISUAL', 'ANGLE'];
const INSPECTION_STAGES = ['FIRST', 'LINE', 'INCOMING', 'FINAL', 'LAST_OFF', 'PROCESS', 'REVALIDATION', 'PRE_DISPATCH'];

const emptyDetail = {
    sequenceNo: 1,
    groupHeading: '',
    parameterName: '',
    parameterAlias: '',
    processId: '',
    instrumentId: '',
    aqlMasterId: '',
    parameterType: '',
    parameterCondition: '',
    uomCode: '',
    nominalValue: '',
    lowerTolerance: '',
    upperTolerance: '',
    minimumValue: '',
    maximumValue: '',
    reactionPlanId: '',
    controlPlanName: '',
    inspectionStages: '[]',
    remarks1: '',
    remarks2: '',
    remarks3: '',
    referenceImage: ''
};

const SectionTitle = ({ children }) => {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, mt: 2 }}>
            <Box sx={{ width: 3, height: 16, bgcolor: theme.palette.primary.main, borderRadius: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary' }}>
                {children}
            </Typography>
        </Box>
    );
};

const InspectionParameterDrawer = ({ open, onClose, onSave, parameter, nextSeq = 1 }) => {
    const theme = useTheme();
    const [form, setForm] = useState(emptyDetail);
    const [errors, setErrors] = useState({});
    const [processes, setProcesses] = useState([]);
    const [uoms, setUoms] = useState([]);
    const [reactionPlans, setReactionPlans] = useState([]);
    const [controlMethods, setControlMethods] = useState([]);
    const [instruments, setInstruments] = useState([]);
    const [stages, setStages] = useState([]);
    const [localImagePreview, setLocalImagePreview] = useState('');

    // Load master data once
    useEffect(() => {
        if (!open) return;
        const loadMasters = async () => {
            try {
                const [procRes, uomRes, rpRes, cmRes, prodRes] = await Promise.all([
                    axios.get('/api/master/npd/process').catch(() => ({ data: [] })),
                    axios.get('/api/master/admin/uom').catch(() => ({ data: [] })),
                    axios.get('/api/master/npd/process/reaction-plan').catch(() => ({ data: [] })),
                    axios.get('/api/master/npd/process/control-method').catch(() => ({ data: [] })),
                    axios.get('/api/master/npd/product-master/list').catch(() => ({ data: [] }))
                ]);
                setProcesses(procRes.data || []);
                setUoms(uomRes.data || []);
                setReactionPlans(rpRes.data || []);
                setControlMethods(cmRes.data || []);
                const allProds = prodRes.data || [];
                setInstruments(allProds.filter(p => p.inventoryType === 'Instruments' || p.inventoryType === 'Instrument'));
            } catch (err) {
                console.error('Error loading masters for drawer', err);
            }
        };
        loadMasters();
    }, [open]);

    // Initialize form
    useEffect(() => {
        setLocalImagePreview('');
        if (parameter) {
            setForm({ ...emptyDetail, ...parameter });
            // Parse stages
            try {
                const parsed = JSON.parse(parameter.inspectionStages || '[]');
                setStages(Array.isArray(parsed) ? parsed : []);
            } catch { setStages([]); }
        } else {
            setForm({ ...emptyDetail, sequenceNo: nextSeq });
            setStages([]);
        }
        setErrors({});
    }, [parameter, nextSeq, open]);

    const handleChange = (field) => (e) => {
        const val = e.target.value;
        setForm(prev => ({ ...prev, [field]: val }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const toggleStage = (stage) => {
        setStages(prev => prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]);
    };

    const showMeasurement = ['MIN_MAX', 'MIN', 'MAX', 'ANGLE'].includes(form.parameterCondition);
    const showVisual = form.parameterCondition === 'VISUAL';

    const validate = () => {
        const errs = {};
        if (!form.parameterName?.trim()) errs.parameterName = 'Parameter Name is required';
        if (!form.sequenceNo || isNaN(form.sequenceNo) || form.sequenceNo < 1) errs.sequenceNo = 'Must be ≥ 1';
        if (showMeasurement) {
            const min = parseFloat(form.minimumValue);
            const max = parseFloat(form.maximumValue);
            if (form.minimumValue !== '' && form.maximumValue !== '' && !isNaN(min) && !isNaN(max) && min > max) {
                errs.minimumValue = 'Min cannot exceed Max';
                errs.maximumValue = 'Min cannot exceed Max';
            }
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = () => {
        if (!validate()) {
            setTimeout(() => {
                const errorInput = document.querySelector('.Mui-error input, .Mui-error textarea, .Mui-error [tabindex]');
                if (errorInput) errorInput.focus();
            }, 50);
            return;
        }
        const payload = {
            ...form,
            inspectionStages: JSON.stringify(stages),
            sequenceNo: parseInt(form.sequenceNo) || nextSeq,
            processId: form.processId || null,
            reactionPlanId: form.reactionPlanId || null,
            nominalValue: form.nominalValue !== '' ? parseFloat(form.nominalValue) : null,
            lowerTolerance: form.lowerTolerance !== '' ? parseFloat(form.lowerTolerance) : null,
            upperTolerance: form.upperTolerance !== '' ? parseFloat(form.upperTolerance) : null,
            minimumValue: form.minimumValue !== '' ? parseFloat(form.minimumValue) : null,
            maximumValue: form.maximumValue !== '' ? parseFloat(form.maximumValue) : null,
            instrumentName: form.instrumentId ? instruments.find(i => i.id === form.instrumentId)?.itemName : null,
            referenceImage: form.referenceImage || null
        };
        onSave(payload);
    };

    const fieldSx = { '& .MuiInputBase-root': { fontSize: '0.8rem' } };
    const inputProps = { size: 'small', fullWidth: true, sx: fieldSx };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 650 },
                    bgcolor: 'background.default',
                    boxShadow: '-4px 0 24px rgba(0,0,0,0.12)'
                }
            }}
        >
            {/* Header */}
            <Box sx={{
                px: 2.5, py: 2,
                bgcolor: theme.palette.primary.main,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 10
            }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                    {parameter ? 'Edit Parameter' : 'Add Parameter'}
                </Typography>
                <IconButton size="small" onClick={onClose} sx={{ color: '#fff' }}>
                    <IconX size={18} />
                </IconButton>
            </Box>

            {/* Scrollable Body */}
            <Box sx={{ p: 2.5, overflowY: 'auto', flexGrow: 1 }}>

                {/* Section 1: Parameter Information */}
                <SectionTitle>Parameter Information</SectionTitle>
                <Grid container spacing={2} sx={{ width: '100%' }}>
                    <Grid item xs={12} sm={3} sx={{ width: { xs: '100%', sm: '48%' } }}>
                        <BOSTextField {...inputProps} label="Seq No *" type="number" value={form.sequenceNo}
                            onChange={handleChange('sequenceNo')} error={!!errors.sequenceNo} helperText={errors.sequenceNo}
                            inputProps={{ min: 1 }} />
                    </Grid>
                    <Grid item xs={12} sm={9} sx={{ width: { xs: '100%', sm: '48%' } }}>
                        <BOSTextField {...inputProps} label="Group Heading" value={form.groupHeading}
                            onChange={handleChange('groupHeading')} placeholder="e.g. DIMENSIONAL INSPECTION" />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '48%' } }}>
                        <BOSTextField {...inputProps} label="Parameter Name *" value={form.parameterName}
                            onChange={handleChange('parameterName')} error={!!errors.parameterName} helperText={errors.parameterName} />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '48%' } }}>
                        <BOSTextField {...inputProps} label="Parameter Alias" value={form.parameterAlias}
                            onChange={handleChange('parameterAlias')} />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '48%' } }}>
                        <Autocomplete
                            size="small"
                            options={processes}
                            getOptionLabel={(opt) => opt.processName || ''}
                            value={processes.find(p => p.id === form.processId) || null}
                            onChange={(e, val) => handleChange('processId')({ target: { value: val ? val.id : '' } })}
                            renderInput={(params) => <BOSTextField {...params} {...inputProps} label="Process" />}
                            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '48%' } }}>
                        <Autocomplete
                            size="small"
                            options={instruments}
                            getOptionLabel={(opt) => opt.itemName || ''}
                            value={instruments.find(i => i.id === form.instrumentId) || null}
                            onChange={(e, val) => handleChange('instrumentId')({ target: { value: val ? val.id : '' } })}
                            renderInput={(params) => <BOSTextField {...params} {...inputProps} label="Instrument" />}
                            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '48%' } }}>
                        <BOSTextField {...inputProps} fullWidth select label="Parameter Type" value={form.parameterType}
                            onChange={handleChange('parameterType')}>
                            <MenuItem value=""><em>None</em></MenuItem>
                            {PARAM_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </BOSTextField>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '48%' } }}>
                        <BOSTextField {...inputProps} select label="Parameter Condition" value={form.parameterCondition}
                            onChange={handleChange('parameterCondition')}>
                            <MenuItem value=""><em>None</em></MenuItem>
                            {PARAM_CONDITIONS.map(c => <MenuItem key={c} value={c}>{c.replace('_', ' / ')}</MenuItem>)}
                        </BOSTextField>
                    </Grid>

                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Section 2: Measurement Specification */}
                {showMeasurement && (
                    <>
                        <SectionTitle>Measurement Specification</SectionTitle>
                        <Grid container spacing={2} sx={{ width: '100%' }}>
                            <Grid item xs={12} sx={{ width: { xs: '100%', sm: '48%' } }}>
                                <BOSTextField {...inputProps} select label="UOM" value={form.uomCode}
                                    onChange={handleChange('uomCode')}>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {uoms.map(u => <MenuItem key={u.uomCode} value={u.uomCode}>{u.uomCode} - {u.uomDescription}</MenuItem>)}
                                </BOSTextField>
                            </Grid>
                            <Grid item xs={12} sm={4} sx={{ width: { xs: '100%', sm: '48%' } }}>
                                <BOSTextField {...inputProps} label="Nominal Value" type="number" value={form.nominalValue}
                                    onChange={handleChange('nominalValue')} />
                            </Grid>
                            <Grid item xs={6} sm={4} sx={{ width: { xs: '100%', sm: '48%' } }}>
                                <BOSTextField {...inputProps} label="Lower Tolerance (+/-)" type="number" value={form.lowerTolerance}
                                    onChange={handleChange('lowerTolerance')} />
                            </Grid>
                            <Grid item xs={6} sm={4} sx={{ width: { xs: '100%', sm: '48%' } }}>
                                <BOSTextField {...inputProps} label="Upper Tolerance (-/+)" type="number" value={form.upperTolerance}
                                    onChange={handleChange('upperTolerance')} />
                            </Grid>
                            <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '48%' } }}>
                                <BOSTextField {...inputProps} label="Minimum Value" type="number" value={form.minimumValue}
                                    onChange={handleChange('minimumValue')} error={!!errors.minimumValue} helperText={errors.minimumValue} />
                            </Grid>
                            <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '48%' } }}>
                                <BOSTextField {...inputProps} label="Maximum Value" type="number" value={form.maximumValue}
                                    onChange={handleChange('maximumValue')} error={!!errors.maximumValue} helperText={errors.maximumValue} />
                            </Grid>
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                    </>
                )}

                {showVisual && (
                    <>
                        <SectionTitle>Visual Reference</SectionTitle>
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} sx={{ width: '100%' }}>
                                <BOSTextField {...inputProps} label="Visual Name / Description" value={form.remarks1}
                                    onChange={handleChange('remarks1')} multiline rows={2} />
                            </Grid>
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                    </>
                )}

                {/* Section 3: Inspection Stage */}
                <SectionTitle>Inspection Stage</SectionTitle>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {INSPECTION_STAGES.map(stage => (
                        <Chip
                            key={stage}
                            label={stage.replace('_', ' ')}
                            size="small"
                            onClick={() => toggleStage(stage)}
                            color={stages.includes(stage) ? 'primary' : 'default'}
                            variant={stages.includes(stage) ? 'filled' : 'outlined'}
                            icon={stages.includes(stage) ? <IconCheck size={13} /> : undefined}
                            sx={{ cursor: 'pointer', fontWeight: stages.includes(stage) ? 600 : 400, transition: 'all 0.15s' }}
                        />
                    ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Section 5: Control & Reaction */}
                <SectionTitle>Control & Reaction</SectionTitle>
                <Grid container spacing={2} sx={{ width: '100%' }}>
                    <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '48%' } }}>
                        <BOSTextField {...inputProps} select label="Reaction Plan" value={form.reactionPlanId}
                            onChange={handleChange('reactionPlanId')}>
                            <MenuItem value=""><em>None</em></MenuItem>
                            {reactionPlans.map(rp => <MenuItem key={rp.id} value={rp.id}>{rp.reactionPlan}</MenuItem>)}
                        </BOSTextField>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '48%' } }}>
                        <BOSTextField {...inputProps} select label="Control Plan Name" value={form.controlPlanName}
                            onChange={handleChange('controlPlanName')}>
                            <MenuItem value=""><em>None</em></MenuItem>
                            {controlMethods.map(cm => <MenuItem key={cm.id} value={cm.controlMethod}>{cm.controlMethod}</MenuItem>)}
                        </BOSTextField>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Section 6: Remarks & Reference */}
                <SectionTitle>Remarks & Reference</SectionTitle>
                <Grid item xs={12} sx={{ width: '100%' }}>
                    <Grid container spacing={1.5} sx={{ width: '100%' }}>
                        {!showVisual && (
                            <Grid item xs={12} sx={{ width: { xs: '100%', sm: '48%' } }}>
                                <BOSTextField {...inputProps} fullWidth label="Remarks 1" multiline rows={2} value={form.remarks1} onChange={handleChange('remarks1')} />
                            </Grid>
                        )}
                        <Grid item xs={12} sx={{ width: { xs: '100%', sm: '48%' } }}>
                            <BOSTextField {...inputProps} label="Remarks 2" multiline rows={2} value={form.remarks2} onChange={handleChange('remarks2')} />
                        </Grid>
                        <Grid item xs={12} sx={{ width: { xs: '100%', sm: '48%' } }}>
                            <BOSTextField {...inputProps} label="Remarks 3" multiline rows={2} value={form.remarks3} onChange={handleChange('remarks3')} />
                        </Grid>

                        <Grid item xs={12} sm={4} sx={{ width: { xs: '100%', sm: '48%' } }}>
                            <Box sx={{
                                border: '1px dashed', borderColor: 'divider', borderRadius: 1, p: 1,
                                height: '100%', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02)
                            }}>
                                <Button variant="outlined" component="label" size="small" sx={{ textTransform: 'none', mb: 0.5 }}>
                                    Upload Image
                                    <input type="file" hidden accept="image/*" onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            const file = e.target.files[0];
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setLocalImagePreview(reader.result);
                                            };
                                            reader.readAsDataURL(file);
                                            handleChange('referenceImage')({ target: { value: file.name } });
                                        }
                                    }} />
                                </Button>
                                {(localImagePreview || form.referenceImage) && (
                                    <Box sx={{ mt: 1, mb: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
                                        <img 
                                            src={localImagePreview || `/api/files/download/${form.referenceImage}`}
                                            alt="Preview" 
                                            style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain', borderRadius: 4 }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </Box>
                                )}
                                {form.referenceImage ? (
                                    <Typography variant="caption" sx={{ color: 'primary.main', textAlign: 'center', fontWeight: 600, fontSize: '0.7rem' }}>
                                        {form.referenceImage}
                                    </Typography>
                                ) : (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', fontSize: '0.65rem' }}>
                                        Reference Image JPG/PNG (Max 2MB)
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
            {/* Footer Actions */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, justifyContent: 'flex-end', bgcolor: 'background.paper' }}>
                <Button variant="outlined" size="small" onClick={onClose} startIcon={<IconX size={15} />}>Cancel</Button>
                <Button variant="contained" size="small" onClick={handleSave} startIcon={<IconDeviceFloppy size={15} />}>
                    {parameter ? 'Update' : 'Add Parameter'}
                </Button>
            </Box>
        </Drawer >
    );
};

export default InspectionParameterDrawer;
