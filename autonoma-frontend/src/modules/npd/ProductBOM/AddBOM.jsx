import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Button, IconButton, Tooltip, Box, Typography, Grid, Stack, CircularProgress,
    Switch, Tabs, Tab, useTheme, Card, CardContent, Divider, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, MenuItem, Select, FormControl, InputLabel,
    Avatar
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    IconArrowLeft, IconDeviceFloppy, IconEraser, IconPlus, IconArrowUp, IconArrowDown,
    IconTrash, IconCopy, IconCheck, IconAlertTriangle, IconCircleDot, IconHierarchy2,
    IconLayoutGrid
} from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { BOSTextField, BOSAutocomplete } from 'ui-component/bos';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { fetchMasterDataCached } from 'utils/masterDataCache';
import { API_PATHS } from 'utils/api-constants';
import useBOSValidation from 'hooks/useBOSValidation';

const BOM_USAGE_OPTIONS = ['Production', 'Engineering', 'Costing', 'Maintenance', 'Casting'];
const WORK_CENTER_OPTIONS = ['Internal', 'External', 'Both'];

const INITIAL_STATE = {
    product: null,
    bomNo: '',
    revNo: '',
    revDate: '',
    isActive: true,
    baseQuantity: 1, // default to 1 always
    bomUsage: 'Production',
    validFrom: null,
    validTo: null,
    remarks: '',
    processes: []
};

const VALIDATION_RULES = [
    { field: 'product', label: 'Parent Product', required: true }
];

export default function AddBOM() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { id } = useParams();
    const { errors, validate, clearErrors } = useBOSValidation();
    const theme = useTheme();

    const [formData, setFormData] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Master lists
    const [products, setProducts] = useState([]);
    const [uomOptions, setUomOptions] = useState([]);
    const [processMasterList, setProcessMasterList] = useState([]);
    const [machineList, setMachineList] = useState([]);
    const [machineGroupList, setMachineGroupList] = useState([]);

    // UI state
    const [selectedProcessIndex, setSelectedProcessIndex] = useState(0);
    const [detailTabValue, setDetailTabValue] = useState(0);
    const [viewMode, setViewMode] = useState('table'); // Default to 'table' so flow chart is not displayed always

    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const prodRes = await fetchMasterDataCached(API_PATHS.NPD.PRODUCT_MASTER);
                setProducts(prodRes || []);

                const uomRes = await fetchMasterDataCached(API_PATHS.ADMIN.UOM);
                const uomList = (uomRes || []).map(u => u.uomCode || u.uomName || u.name).filter(Boolean);
                const defaultUoms = ['Nos', 'Kg', 'Mtr', 'Set', 'Pcs', 'Ltr', 'Box', 'NOS', 'KG', 'SET', 'PCS'];
                setUomOptions(Array.from(new Set([...uomList, ...defaultUoms])));

                const procRes = await fetchMasterDataCached(API_PATHS.NPD.PROCESS);
                setProcessMasterList(procRes || []);

                const machRes = await axios.get('/api/qmt/machines');
                setMachineList(machRes.data || []);

                const grpsRes = await axios.get('/api/asset-group');
                setMachineGroupList(grpsRes.data || []);
            } catch (error) {
                console.error("Failed to load master lists:", error);
            }
        };
        fetchMasters();

        if (id) {
            setLoading(true);
            axios.get(`${API_PATHS.NPD.BOM_MASTER}/${id}`)
                .then(response => {
                    const data = response.data;
                    setFormData({
                        ...data,
                        product: data.product || null,
                        baseQuantity: 1, // force base qty to 1 always
                        processes: (data.processes || []).map(proc => ({
                            ...proc,
                            materials: (proc.materials || []).map(m => ({
                                ...m,
                                inputProduct: m.inputProduct || null,
                                uom: m.uom || m.inputProduct?.uom || 'Nos',
                                scrapPercentage: (m.scrapPercentage !== undefined && m.scrapPercentage !== null) ? m.scrapPercentage : 0,
                                finishQty: m.finishQty !== undefined ? m.finishQty : '',
                                isAlternate: m.isAlternate || false,
                                primaryItemNo: m.primaryItemNo || '',
                                altPriority: m.altPriority || ''
                            })),
                            machines: (proc.machines || []).map(mach => ({
                                ...mach,
                                machine: mach.machine || null
                            })),
                            tools: proc.tools || [],
                            norms: (proc.norms || []).map(n => ({
                                ...n,
                                machine: n.machine || null
                            })),
                            qualityParameters: proc.qualityParameters || [],
                            labour: proc.labour || [],
                            parameters: proc.parameters || [],
                            documents: proc.documents || []
                        }))
                    });
                    if (data.processes && data.processes.length > 0) {
                        setSelectedProcessIndex(0);
                    }
                })
                .catch(error => {
                    dispatch(openSnackbar({ open: true, message: 'Failed to fetch BOM details', variant: 'alert', severity: 'error' }));
                })
                .finally(() => setLoading(false));
        }
    }, [id, dispatch]);

    const currentProcess = formData.processes[selectedProcessIndex] || null;

    useEffect(() => {
        if (currentProcess && (currentProcess.workCenter === 'External' || currentProcess.workCenter === 'Outsource')) {
            if (detailTabValue === 1 || detailTabValue === 3 || detailTabValue === 5) {
                setDetailTabValue(0);
            }
        }
    }, [currentProcess?.workCenter, detailTabValue]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAutocompleteChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Process Operations Sequence handlers ---
    const addProcessRow = () => {
        // Validate preceding process rows
        if (formData.processes.length > 0) {
            const hasEmpty = formData.processes.some(p => !p.process);
            if (hasEmpty) {
                dispatch(openSnackbar({ open: true, message: 'Please select a Process for all existing rows before adding a new one.', variant: 'alert', severity: 'warning' }));
                return;
            }
        }

        setFormData(prev => {
            const nextSeq = prev.processes.length > 0
                ? Math.max(...prev.processes.map(p => p.seqNo || 0)) + 10
                : 10;
            const newProcess = {
                seqNo: nextSeq,
                process: null,
                workCenter: 'Internal',
                machineGroup: null,
                autoGir: false,
                autoQc: false,
                processCost: 0,
                isActive: true,
                materials: [],
                machines: [],
                tools: [],
                documents: []
            };
            const updated = [...prev.processes, newProcess];
            setSelectedProcessIndex(updated.length - 1);
            return { ...prev, processes: updated };
        });
    };

    const updateProcessField = (index, field, value) => {
        const updated = [...formData.processes];
        updated[index][field] = value;

        if (field === 'workCenter' && (value === 'External' || value === 'Outsource')) {
            updated[index].machineGroup = null;
            updated[index].processCost = 0;
            updated[index].machines = [];
        }

        setFormData(prev => ({ ...prev, processes: updated }));
    };

    const deleteProcessRow = (index) => {
        const updated = [...formData.processes];
        updated.splice(index, 1);
        setFormData(prev => ({ ...prev, processes: updated }));

        // Re-adjust active selected index
        if (selectedProcessIndex >= updated.length) {
            setSelectedProcessIndex(Math.max(0, updated.length - 1));
        }
    };

    const duplicateProcess = (index) => {
        const target = formData.processes[index];
        if (!target || !target.process) {
            dispatch(openSnackbar({ open: true, message: 'Cannot duplicate an empty process step.', variant: 'alert', severity: 'warning' }));
            return;
        }

        setFormData(prev => {
            const nextSeq = prev.processes.length > 0
                ? Math.max(...prev.processes.map(p => p.seqNo || 0)) + 10
                : 10;

            const cloned = {
                ...target,
                id: null,
                seqNo: nextSeq,
                materials: (target.materials || []).map(m => ({ ...m, id: null })),
                machines: (target.machines || []).map(m => ({ ...m, id: null })),
                tools: (target.tools || []).map(t => ({ ...t, id: null })),
                norms: (target.norms || []).map(n => ({ ...n, id: null })),
                qualityParameters: (target.qualityParameters || []).map(q => ({ ...q, id: null })),
                labour: (target.labour || []).map(l => ({ ...l, id: null })),
                parameters: (target.parameters || []).map(p => ({ ...p, id: null })),
                documents: (target.documents || []).map(d => ({ ...d, id: null }))
            };

            const updated = [...prev.processes, cloned];
            setSelectedProcessIndex(updated.length - 1);
            return { ...prev, processes: updated };
        });
        dispatch(openSnackbar({ open: true, message: 'Process step duplicated successfully', variant: 'alert', severity: 'success' }));
    };

    const reorderSequence = (index, direction) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === formData.processes.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const updated = [...formData.processes];

        // Swap elements
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;

        // Auto-realign seqNo values logically (10, 20, 30...)
        updated.forEach((p, idx) => {
            p.seqNo = (idx + 1) * 10;
        });

        setFormData(prev => ({ ...prev, processes: updated }));
        setSelectedProcessIndex(targetIndex);
    };

    // --- Workspace Tabs Data changes ---
    const handleDetailRowChange = (tab, rowIndex, field, value) => {
        if (selectedProcessIndex === -1 || !formData.processes[selectedProcessIndex]) return;

        const updatedProcesses = [...formData.processes];
        const activeProcess = updatedProcesses[selectedProcessIndex];
        const rows = [...activeProcess[tab]];
        const row = rows[rowIndex];

        row[field] = value;

        // Special calculations for Materials
        if (tab === 'materials') {
            if (field === 'quantity') {
                const qty = parseFloat(row.quantity) || 0;
                const scrap = parseFloat(row.scrapPercentage) || 0;
                row.finishQty = Number((qty - (qty * scrap / 100)).toFixed(4));
            } else if (field === 'scrapPercentage') {
                const qty = parseFloat(row.quantity) || 0;
                let scrap = parseFloat(row.scrapPercentage) || 0;
                if (scrap > 100) scrap = 100;
                if (scrap < 0) scrap = 0;
                row.scrapPercentage = scrap;
                row.finishQty = Number((qty - (qty * scrap / 100)).toFixed(4));
            } else if (field === 'finishQty') {
                const qty = parseFloat(row.quantity) || 0;
                let fin = parseFloat(row.finishQty) || 0;
                if (qty > 0) {
                    if (fin > qty) {
                        dispatch(openSnackbar({ open: true, message: 'Finish Qty cannot exceed input Qty.', variant: 'alert', severity: 'warning' }));
                        fin = qty;
                        row.finishQty = fin;
                    }
                    row.scrapPercentage = Number((((qty - fin) / qty) * 100).toFixed(2));
                }
            } else if (field === 'isAlternate') {
                if (!value) {
                    row.primaryItemNo = '';
                    row.altPriority = '';
                }
            }
        }

        activeProcess[tab] = rows;
        setFormData(prev => ({ ...prev, processes: updatedProcesses }));
    };

    const addDetailRow = (tab, template) => {
        if (selectedProcessIndex === -1 || !formData.processes[selectedProcessIndex]) {
            dispatch(openSnackbar({ open: true, message: 'Please select or add a process step first.', variant: 'alert', severity: 'warning' }));
            return;
        }

        const updatedProcesses = [...formData.processes];
        const activeProcess = updatedProcesses[selectedProcessIndex];
        const rows = activeProcess[tab] ? [...activeProcess[tab]] : [];

        // Check if there is already an empty row
        if (rows.length > 0) {
            const isEmpty = (tab === 'materials' && !rows[rows.length - 1].inputProduct) ||
                (tab === 'machines' && !rows[rows.length - 1].machine) ||
                (tab === 'tools' && !rows[rows.length - 1].toolName) ||
                (tab === 'norms' && !rows[rows.length - 1].parameterName) ||
                (tab === 'qualityParameters' && !rows[rows.length - 1].inspectionParameter);
            if (isEmpty) {
                dispatch(openSnackbar({ open: true, message: 'Please complete the last row before adding a new one.', variant: 'alert', severity: 'warning' }));
                return;
            }
        }

        let nextSeq = rows.length > 0 ? (Math.max(...rows.map(r => r.seqNo || 0)) + 10) : 10;
        const newRow = { ...template, seqNo: nextSeq };

        activeProcess[tab] = [...rows, newRow];
        setFormData(prev => ({ ...prev, processes: updatedProcesses }));
    };

    const removeDetailRow = (tab, index) => {
        const updatedProcesses = [...formData.processes];
        const activeProcess = updatedProcesses[selectedProcessIndex];
        const rows = [...activeProcess[tab]];
        rows.splice(index, 1);

        activeProcess[tab] = rows;
        setFormData(prev => ({ ...prev, processes: updatedProcesses }));
    };

    // --- Validation and Submit ---
    const handleSave = async () => {
        clearErrors();
        if (!validate(formData, VALIDATION_RULES)) {
            dispatch(openSnackbar({ open: true, message: 'Please resolve errors in the header section.', variant: 'alert', severity: 'error' }));
            return;
        }

        if (formData.processes.length === 0) {
            dispatch(openSnackbar({ open: true, message: 'At least one process operation is required.', variant: 'alert', severity: 'warning' }));
            return;
        }

        // Validate nested entities
        for (let i = 0; i < formData.processes.length; i++) {
            const proc = formData.processes[i];
            if (!proc.process) {
                dispatch(openSnackbar({ open: true, message: `Row ${i + 1}: Process Operation is mandatory.`, variant: 'alert', severity: 'error' }));
                setSelectedProcessIndex(i);
                return;
            }

            // Material validation
            if (proc.materials && proc.materials.length > 0) {
                for (let mIdx = 0; mIdx < proc.materials.length; mIdx++) {
                    const mat = proc.materials[mIdx];
                    if (!mat.inputProduct) {
                        dispatch(openSnackbar({ open: true, message: `Process ${proc.seqNo}: Input Material is mandatory at row ${mIdx + 1}.`, variant: 'alert', severity: 'error' }));
                        setSelectedProcessIndex(i);
                        setDetailTabValue(0);
                        return;
                    }
                    if (!mat.quantity || parseFloat(mat.quantity) <= 0) {
                        dispatch(openSnackbar({ open: true, message: `Process ${proc.seqNo}: Input Material quantity must be greater than zero.`, variant: 'alert', severity: 'error' }));
                        setSelectedProcessIndex(i);
                        setDetailTabValue(0);
                        return;
                    }
                    if (mat.isAlternate) {
                        if (!mat.primaryItemNo) {
                            dispatch(openSnackbar({ open: true, message: `Process ${proc.seqNo}: Please select a Primary Material for alternate material at row ${mIdx + 1}.`, variant: 'alert', severity: 'error' }));
                            setSelectedProcessIndex(i);
                            setDetailTabValue(0);
                            return;
                        }
                        if (!mat.altPriority || parseInt(mat.altPriority) <= 0) {
                            dispatch(openSnackbar({ open: true, message: `Process ${proc.seqNo}: Alternate material priority must be greater than zero at row ${mIdx + 1}.`, variant: 'alert', severity: 'error' }));
                            setSelectedProcessIndex(i);
                            setDetailTabValue(0);
                            return;
                        }
                    }
                }
            }

            // Norm validation
            if (proc.norms && proc.norms.length > 0) {
                for (let nIdx = 0; nIdx < proc.norms.length; nIdx++) {
                    const norm = proc.norms[nIdx];
                    if (!norm.parameterName) {
                        dispatch(openSnackbar({ open: true, message: `Process ${proc.seqNo}: Norm Parameter is mandatory at row ${nIdx + 1}.`, variant: 'alert', severity: 'error' }));
                        setSelectedProcessIndex(i);
                        setDetailTabValue(3);
                        return;
                    }
                }
            }
        }

        setSubmitting(true);
        try {
            if (id) {
                await axios.put(`${API_PATHS.NPD.BOM_MASTER}/${id}`, formData);
                dispatch(openSnackbar({ open: true, message: 'BOM Revision saved successfully', variant: 'alert', severity: 'success' }));
            } else {
                await axios.post(API_PATHS.NPD.BOM_MASTER, formData);
                dispatch(openSnackbar({ open: true, message: 'BOM created successfully', variant: 'alert', severity: 'success' }));
            }
            navigate('/dd/product-bom');
        } catch (error) {
            console.error('Failed to save BOM:', error);
            const msg = error.response?.data?.message || error.response?.data || 'Server error occurred';
            dispatch(openSnackbar({ open: true, message: `Failed to save BOM: ${msg}`, variant: 'alert', severity: 'error' }));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Premium Header Action Bar */}
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
                        <IconHierarchy2 size={24} />
                    </Avatar>
                    <Box>
                        <Typography variant="h3" fontWeight="800" sx={{
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 0.5
                        }}>
                            {id ? `Amend BOM: ${formData.bomNo} (${formData.revNo || 'R0'})` : 'Create Product BOM & Routing'}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
                            {id ? 'Amend and create a new revision of this process-centric routing configuration' : 'Define operations sequence, machines, tooling, material inputs, and quality norms'}
                        </Typography>
                    </Box>
                </Box>
                <Box gap={1.5} display="flex">
                    <Button variant="outlined" sx={{ borderRadius: 2, px: 3, borderWidth: 2, '&:hover': { borderWidth: 2 } }} onClick={() => navigate('/dd/product-bom')}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSave}
                        disabled={submitting}
                        sx={{
                            borderRadius: 2,
                            px: 4,
                            py: 1,
                            fontWeight: '700',
                            boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                            transition: 'all 0.2s',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.5)}`
                            }
                        }}
                    >
                        {submitting ? 'Saving...' : (id ? 'Save Revision' : 'Save BOM')}
                    </Button>
                </Box>
            </Paper>

            {/* SECTION 1: BOM HEADER */}
            <MainCard title="1. BOM Header Configuration" stretch={false} pageCode="DD1110" sx={{ borderRadius: 3, boxShadow: theme.shadows[2], mb: 2 }}>
                <Box sx={{ display: 'flex', width: '100%', gap: 2.5, alignItems: 'center', flexWrap: 'wrap', p: 1 }}>
                    <Box sx={{ flex: '1 1 350px' }}>
                        <BOSAutocomplete
                            name="product"
                            label="Parent Product *"
                            value={formData.product}
                            options={products.filter(p => p.inventoryType === 'PRODUCT')}
                            getOptionLabel={(opt) => opt ? `${opt.itemNo} - ${opt.itemName}` : ''}
                            onChange={(val) => handleAutocompleteChange('product', val)}
                            error={!!errors.product}
                            helperText={errors.product}
                            disabled={!!id}
                            size="small"
                        />
                    </Box>
                    <Box sx={{ flex: '1 1 200px' }}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="bom-usage-label">BOM Usage</InputLabel>
                            <Select
                                labelId="bom-usage-label"
                                name="bomUsage"
                                value={formData.bomUsage || 'Production'}
                                onChange={handleChange}
                                label="BOM Usage"
                            >
                                {BOM_USAGE_OPTIONS.map(opt => (
                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '1 1 120px' }}>
                        <BOSTextField
                            name="revNo"
                            label="Revision No"
                            value={formData.revNo || 'R0'}
                            disabled
                            size="small"
                        />
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                        <BOSTextField
                            name="revDate"
                            label="Revision Date"
                            type="date"
                            value={formData.revDate || new Date().toISOString().split('T')[0]}
                            disabled
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                    <Box sx={{ flex: '1 1 150px', display: 'flex', justifyContent: 'center' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" color="textSecondary">Inactive</Typography>
                            <Switch
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                color="primary"
                                size="small"
                            />
                            <Typography variant="body2" fontWeight="bold">Active</Typography>
                        </Stack>
                    </Box>
                    <Box sx={{ flex: '1 1 100%' }}>
                        <BOSTextField
                            name="remarks"
                            label="Header Remarks / Notes"
                            value={formData.remarks || ''}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={1.5}
                            size="small"
                        />
                    </Box>
                </Box>
            </MainCard>

            {/* SECTION 2: PROCESS ROUTING LAYOUT OPTIONS */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="h4" fontWeight={700}>2. Process Routing Steps</Typography>
                <Stack direction="row" spacing={1} sx={{ bgcolor: theme.palette.background.paper, p: 0.5, borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}>
                    <Button
                        size="small"
                        variant={viewMode === 'table' ? 'contained' : 'text'}
                        onClick={() => setViewMode('table')}
                        startIcon={<IconLayoutGrid size={16} />}
                    >
                        Table
                    </Button>
                    <Button
                        size="small"
                        variant={viewMode === 'flow' ? 'contained' : 'text'}
                        onClick={() => setViewMode('flow')}
                        startIcon={<IconHierarchy2 size={16} />}
                    >
                        Flow Graph
                    </Button>
                    <Button
                        size="small"
                        variant={viewMode === 'both' ? 'contained' : 'text'}
                        onClick={() => setViewMode('both')}
                    >
                        Split View
                    </Button>
                </Stack>
            </Stack>

            <Grid container spacing={2.5} sx={{ mb: 2 }}>
                {/* DYNAMIC PROCESS ROUTING TABLE VIEW */}
                {(viewMode === 'table' || viewMode === 'both') && (
                    <Grid item xs={12} md={viewMode === 'both' ? 8 : 12} sx={{ minWidth: 0 }}>
                        <MainCard
                            title="Routing Operations Sequence"
                            stretch={false}
                            sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}
                            secondary={
                                <Button variant="contained" color="secondary" size="small" onClick={addProcessRow} startIcon={<IconPlus size={16} />}>
                                    Add Process
                                </Button>
                            }
                        >
                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 350, overflowX: 'auto', maxWidth: '100%' }}>
                                <Table stickyHeader size="small" sx={{ minWidth: 1170, tableLayout: 'fixed' }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ width: '50px', minWidth: '50px' }}>Seq</TableCell>
                                            <TableCell sx={{ width: '250px', minWidth: '250px' }}>Process / Operation *</TableCell>
                                            <TableCell sx={{ width: '80px', minWidth: '80px' }}>Op Code</TableCell>
                                            <TableCell sx={{ width: '120px', minWidth: '120px' }}>Work Center *</TableCell>
                                            <TableCell sx={{ width: '200px', minWidth: '200px' }}>Machine Group</TableCell>
                                            <TableCell sx={{ width: '80px', minWidth: '80px' }}>Auto GIR</TableCell>
                                            <TableCell sx={{ width: '80px', minWidth: '80px' }}>Auto QC</TableCell>
                                            <TableCell sx={{ width: '100px', minWidth: '100px' }}>Cost</TableCell>
                                            <TableCell sx={{ width: '60px', minWidth: '60px' }}>Active</TableCell>
                                            <TableCell sx={{ width: '150px', minWidth: '150px' }} align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.processes.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                                                    <IconAlertTriangle size={32} color={theme.palette.warning.main} />
                                                    <Typography variant="h6" color="textSecondary" sx={{ mt: 1 }}>
                                                        No manufacturing processes mapped. Click "Add Process" to configure routing.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            formData.processes.map((proc, index) => {
                                                const isSelected = selectedProcessIndex === index;
                                                return (
                                                    <TableRow
                                                        key={index}
                                                        hover
                                                        selected={isSelected}
                                                        onClick={() => setSelectedProcessIndex(index)}
                                                        sx={{ cursor: 'pointer', transition: 'background-color 0.2s ease' }}
                                                    >
                                                        <TableCell>{proc.seqNo}</TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            <BOSAutocomplete
                                                                value={proc.process}
                                                                options={processMasterList}
                                                                getOptionLabel={(opt) => opt ? opt.processName : ''}
                                                                onChange={(val) => {
                                                                    const updated = [...formData.processes];
                                                                    updated[index].process = val;
                                                                    setFormData(prev => ({ ...prev, processes: updated }));
                                                                }}
                                                                size="small"
                                                                fullWidth
                                                            />
                                                        </TableCell>
                                                        <TableCell>{proc.process?.processCd || '-'}</TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            <Select
                                                                value={proc.workCenter === 'Inhouse' ? 'Internal' : proc.workCenter === 'Outsource' ? 'External' : (proc.workCenter || 'Internal')}
                                                                onChange={(e) => updateProcessField(index, 'workCenter', e.target.value)}
                                                                size="small"
                                                                fullWidth
                                                            >
                                                                {WORK_CENTER_OPTIONS.map(opt => (
                                                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                                ))}
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            <BOSAutocomplete
                                                                value={proc.machineGroup}
                                                                options={machineGroupList}
                                                                getOptionLabel={(opt) => opt ? opt.groupName : ''}
                                                                onChange={(val) => updateProcessField(index, 'machineGroup', val)}
                                                                size="small"
                                                                disabled={proc.workCenter === 'External' || proc.workCenter === 'Outsource'}
                                                            />
                                                        </TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            <Switch
                                                                checked={proc.autoGir}
                                                                onChange={(e) => updateProcessField(index, 'autoGir', e.target.checked)}
                                                                size="small"
                                                                color="primary"
                                                            />
                                                        </TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            <Switch
                                                                checked={proc.autoQc}
                                                                onChange={(e) => updateProcessField(index, 'autoQc', e.target.checked)}
                                                                size="small"
                                                                color="primary"
                                                            />
                                                        </TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            <BOSTextField
                                                                type="number"
                                                                value={proc.processCost}
                                                                onChange={(e) => updateProcessField(index, 'processCost', parseFloat(e.target.value) || 0)}
                                                                size="small"
                                                                disabled={proc.workCenter !== 'Internal' && proc.workCenter !== 'Inhouse'}
                                                            />
                                                        </TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                                            <Switch
                                                                checked={proc.isActive}
                                                                onChange={(e) => updateProcessField(index, 'isActive', e.target.checked)}
                                                                size="small"
                                                                color="primary"
                                                            />
                                                        </TableCell>
                                                        <TableCell onClick={(e) => e.stopPropagation()} align="center">
                                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                                <Tooltip title="Move Up">
                                                                    <IconButton size="small" onClick={() => reorderSequence(index, 'up')} disabled={index === 0}>
                                                                        <IconArrowUp size={16} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Move Down">
                                                                    <IconButton size="small" onClick={() => reorderSequence(index, 'down')} disabled={index === formData.processes.length - 1}>
                                                                        <IconArrowDown size={16} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Duplicate Step">
                                                                    <IconButton size="small" onClick={() => duplicateProcess(index)} color="info">
                                                                        <IconCopy size={16} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Delete Step">
                                                                    <IconButton size="small" onClick={() => deleteProcessRow(index)} color="error">
                                                                        <IconTrash size={16} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </MainCard>
                    </Grid>
                )}

                {/* GRAPHICAL ROUTING FLOW VIEW */}
                {(viewMode === 'flow' || viewMode === 'both') && (
                    <Grid item xs={12} md={viewMode === 'both' ? 4 : 12} sx={{ minWidth: 0 }}>
                        <MainCard title="Process Flow Chart" stretch={false} sx={{ height: '100%', borderRadius: 3, boxShadow: theme.shadows[2] }}>
                            <Box display="flex" flexDirection="column" alignItems="center" sx={{ overflowY: 'auto', maxHeight: 350, py: 2 }}>
                                <Paper variant="outlined" sx={{ px: 2, py: 1, bgcolor: theme.palette.grey[100], borderRadius: '20px', mb: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">RAW MATERIAL</Typography>
                                </Paper>

                                {formData.processes.map((proc, index) => {
                                    const isSelected = selectedProcessIndex === index;
                                    const matCount = proc.materials?.length || 0;
                                    const machCount = proc.machines?.length || 0;
                                    const toolCount = proc.tools?.length || 0;
                                    const normCount = proc.norms?.length || 0;
                                    const qualCount = proc.qualityParameters?.length || 0;

                                    return (
                                        <Fragment key={index}>
                                            <IconArrowDown size={20} color={theme.palette.grey[400]} style={{ margin: '4px 0' }} />
                                            <Card
                                                variant="outlined"
                                                onClick={() => setSelectedProcessIndex(index)}
                                                sx={{
                                                    width: '90%',
                                                    cursor: 'pointer',
                                                    border: isSelected ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                                                    boxShadow: isSelected ? theme.shadows[3] : theme.shadows[1],
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[3] }
                                                }}
                                            >
                                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} mb={0.5}>
                                                        <Typography variant="subtitle2" fontWeight={800} color={isSelected ? 'primary.main' : 'text.primary'}>
                                                            {proc.seqNo} - {proc.process?.processName || '(Unconfigured Operation)'}
                                                        </Typography>
                                                        {isSelected && <IconCheck size={16} style={{ color: theme.palette.primary.main }} />}
                                                    </Stack>

                                                    <Typography variant="caption" display="block" color="textSecondary" sx={{ mb: 1 }}>
                                                        Group: {proc.machineGroup ? proc.machineGroup.groupName : 'None'} | WC: {proc.workCenter || '-'}
                                                    </Typography>

                                                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                                                        <Box sx={{ bgcolor: theme.palette.info.light, color: theme.palette.info.contrastText, px: 0.8, py: 0.2, borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                            MAT: {matCount}
                                                        </Box>
                                                        <Box sx={{ bgcolor: theme.palette.success.light, color: theme.palette.success.contrastText, px: 0.8, py: 0.2, borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                            MC: {machCount}
                                                        </Box>
                                                        <Box sx={{ bgcolor: theme.palette.warning.light, color: theme.palette.warning.contrastText, px: 0.8, py: 0.2, borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                            T: {toolCount}
                                                        </Box>
                                                        <Box sx={{ bgcolor: theme.palette.secondary.light, color: theme.palette.secondary.contrastText, px: 0.8, py: 0.2, borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                            N: {normCount}
                                                        </Box>
                                                        <Box sx={{ bgcolor: theme.palette.error.light, color: theme.palette.error.contrastText, px: 0.8, py: 0.2, borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>
                                                            Q: {qualCount}
                                                        </Box>
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        </Fragment>
                                    );
                                })}

                                <IconArrowDown size={20} color={theme.palette.grey[400]} style={{ margin: '4px 0' }} />
                                <Paper variant="outlined" sx={{ px: 2, py: 1, bgcolor: theme.palette.success.light, color: theme.palette.success.contrastText, borderRadius: '20px' }}>
                                    <Typography variant="subtitle2" fontWeight="bold">FINISHED PRODUCT</Typography>
                                </Paper>
                            </Box>
                        </MainCard>
                    </Grid>
                )}
            </Grid>

            {/* SECTION 3: PROCESS WORKSPACE DETAIL PANEL */}
            {currentProcess && (
                <MainCard
                    title={`Process Workspace: ${currentProcess.seqNo} - ${currentProcess.process?.processName || '(Select Operation)'}`}
                    stretch={false}
                    sx={{ border: `1px solid ${theme.palette.primary.light}`, borderRadius: 3, boxShadow: theme.shadows[2] }}
                >
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs value={detailTabValue} onChange={(e, val) => setDetailTabValue(val)} variant="scrollable" scrollButtons="auto">
                            <Tab label="Materials Mapping" />
                            <Tab label="Machine Allocations" disabled={currentProcess?.workCenter === 'External' || currentProcess?.workCenter === 'Outsource'} />
                            <Tab label="Required Tooling" />
                            <Tab label="Documents / SOPS" />
                        </Tabs>
                    </Box>

                    {/* TAB 0: MATERIALS */}
                    {detailTabValue === 0 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h5">Materials & Input Components Grid</Typography>
                                <Button variant="outlined" size="small" onClick={() => addDetailRow('materials', { inputProduct: null, quantity: '', finishQty: '', uom: '', scrapPercentage: 0, backflush: true, isAlternate: false, primaryItemNo: '', altPriority: '', remarks: '' })} startIcon={<IconPlus size={16} />}>
                                    Add Material
                                </Button>
                            </Stack>
                            <Table size="small" sx={{ minWidth: 1370, tableLayout: 'fixed' }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ width: '40px', minWidth: '40px' }}>Seq</TableCell>
                                        <TableCell sx={{ width: '280px', minWidth: '280px' }}>Input Material / Component *</TableCell>
                                        <TableCell sx={{ width: '90px', minWidth: '90px' }}>Input Qty *</TableCell>
                                        <TableCell sx={{ width: '90px', minWidth: '90px' }}>Finish Qty</TableCell>
                                        <TableCell sx={{ width: '130px', minWidth: '130px' }}>UOM</TableCell>
                                        <TableCell sx={{ width: '80px', minWidth: '80px' }}>Scrap %</TableCell>
                                        <TableCell sx={{ width: '80px', minWidth: '80px' }}>Backflush</TableCell>
                                        <TableCell sx={{ width: '80px', minWidth: '80px' }}>Is Alt?</TableCell>
                                        <TableCell sx={{ width: '220px', minWidth: '220px' }}>Primary Material</TableCell>
                                        <TableCell sx={{ width: '80px', minWidth: '80px' }}>Priority</TableCell>
                                        <TableCell sx={{ width: '150px', minWidth: '150px' }}>Remarks</TableCell>
                                        <TableCell sx={{ width: '50px', minWidth: '50px' }} align="center">Delete</TableCell>                                        </TableRow>
                                </TableHead>
                                <TableBody>
                                    {!currentProcess.materials || currentProcess.materials.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
                                                No materials mapped to this process step.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        currentProcess.materials.map((row, idx) => {
                                            const primaryOptions = currentProcess.materials
                                                .filter((m, mIdx) => mIdx !== idx && !m.isAlternate && m.inputProduct)
                                                .map(m => m.inputProduct);

                                            return (
                                                <TableRow key={idx}>
                                                    <TableCell>{row.seqNo}</TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSAutocomplete
                                                            value={row.inputProduct}
                                                            options={products}
                                                            getOptionLabel={(opt) => opt ? `${opt.itemNo} - ${opt.itemName}` : ''}
                                                            onChange={(val) => {
                                                                handleDetailRowChange('materials', idx, 'inputProduct', val);
                                                                if (val) {
                                                                    handleDetailRowChange('materials', idx, 'uom', val.uom || 'Nos');
                                                                }
                                                            }}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            type="number"
                                                            value={row.quantity}
                                                            onChange={(e) => handleDetailRowChange('materials', idx, 'quantity', e.target.value)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            type="number"
                                                            value={row.finishQty}
                                                            onChange={(e) => handleDetailRowChange('materials', idx, 'finishQty', e.target.value)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSAutocomplete
                                                            value={row.uom || row.inputProduct?.uom || 'Nos'}
                                                            options={uomOptions}
                                                            freeSolo
                                                            onChange={(val) => handleDetailRowChange('materials', idx, 'uom', typeof val === 'object' && val !== null ? (val.uomCode || val.label || val.name || 'Nos') : (val || 'Nos'))}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            type="number"
                                                            value={row.scrapPercentage}
                                                            onChange={(e) => handleDetailRowChange('materials', idx, 'scrapPercentage', e.target.value)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                        <Switch
                                                            checked={row.backflush}
                                                            onChange={(e) => handleDetailRowChange('materials', idx, 'backflush', e.target.checked)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                        <Switch
                                                            checked={row.isAlternate || false}
                                                            onChange={(e) => handleDetailRowChange('materials', idx, 'isAlternate', e.target.checked)}
                                                            size="small"
                                                            color="secondary"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        {row.isAlternate ? (
                                                            <Select
                                                                value={row.primaryItemNo || ''}
                                                                onChange={(e) => handleDetailRowChange('materials', idx, 'primaryItemNo', e.target.value)}
                                                                size="small"
                                                                fullWidth
                                                            >
                                                                {primaryOptions.map(opt => (
                                                                    <MenuItem key={opt.itemNo} value={opt.itemNo}>
                                                                        {opt.itemNo} - {opt.itemName}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        {row.isAlternate ? (
                                                            <BOSTextField
                                                                type="number"
                                                                value={row.altPriority || ''}
                                                                onChange={(e) => handleDetailRowChange('materials', idx, 'altPriority', parseInt(e.target.value) || '')}
                                                                size="small"
                                                            />
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            value={row.remarks || ''}
                                                            onChange={(e) => handleDetailRowChange('materials', idx, 'remarks', e.target.value)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                        <IconButton size="small" color="error" onClick={() => removeDetailRow('materials', idx)}>
                                                            <IconTrash size={16} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>

                        </Box>
                    )}

                    {/* TAB 1: MACHINE ALLOCATIONS */}
                    {detailTabValue === 1 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h5">Alternate & Primary Machines Allocations</Typography>
                                <Button variant="outlined" size="small" onClick={() => addDetailRow('machines', { machine: null, capacity: '', efficiency: '', isPrimary: false, status: true })} startIcon={<IconPlus size={16} />}>
                                    Allocate Machine
                                </Button>
                            </Stack>
                            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table size="small" sx={{ minWidth: 1100, tableLayout: 'fixed' }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="30%">Machine *</TableCell>
                                            <TableCell width="12%">Machine Code</TableCell>
                                            <TableCell width="12%">Machine Type</TableCell>
                                            <TableCell width="15%">Capacity</TableCell>
                                            <TableCell width="10%">Efficiency %</TableCell>
                                            <TableCell width="10%">Setup(Min)</TableCell>
                                            <TableCell width="10%">Cycle(Min)</TableCell>
                                            <TableCell width="12%">Type</TableCell>
                                            <TableCell width="10%">Status</TableCell>
                                            <TableCell width="6%" align="center">Delete</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {!currentProcess.machines || currentProcess.machines.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                                                    No machines allocated to this process step.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            currentProcess.machines.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSAutocomplete
                                                            value={row.machine}
                                                            options={machineList}
                                                            getOptionLabel={(opt) => opt ? `${opt.assetId} - ${opt.assetName}` : ''}
                                                            onChange={(val) => {
                                                                handleDetailRowChange('machines', idx, 'machine', val);
                                                                if (val) {
                                                                    handleDetailRowChange('machines', idx, 'capacity', val.capacity || '');
                                                                }
                                                            }}
                                                            size="small"
                                                            disablePortal={false}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{row.machine?.assetId || '-'}</TableCell>
                                                    <TableCell>{row.machine?.assetGroup?.groupName || '-'}</TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            value={row.capacity || ''}
                                                            onChange={(e) => handleDetailRowChange('machines', idx, 'capacity', e.target.value)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            type="number"
                                                            value={row.efficiency || ''}
                                                            onChange={(e) => handleDetailRowChange('machines', idx, 'efficiency', parseFloat(e.target.value) || '')}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            type="number"
                                                            value={row.setupTime}
                                                            onChange={(e) => handleDetailRowChange('machines', idx, 'setupTime', parseFloat(e.target.value) || 0)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            type="number"
                                                            value={row.cycleTime}
                                                            onChange={(e) => handleDetailRowChange('machines', idx, 'cycleTime', parseFloat(e.target.value) || 0)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <Select
                                                            value={row.isPrimary ? 'primary' : 'alternate'}
                                                            onChange={(e) => handleDetailRowChange('machines', idx, 'isPrimary', e.target.value === 'primary')}
                                                            size="small"
                                                            fullWidth
                                                        >
                                                            <MenuItem value="primary">Primary</MenuItem>
                                                            <MenuItem value="alternate">Alternate</MenuItem>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <Switch
                                                            checked={row.status}
                                                            onChange={(e) => handleDetailRowChange('machines', idx, 'status', e.target.checked)}
                                                            size="small"
                                                            color="primary"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                        <IconButton size="small" color="error" onClick={() => removeDetailRow('machines', idx)}>
                                                            <IconTrash size={16} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    {/* TAB 2: REQUIRED TOOLING */}
                    {detailTabValue === 2 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h5">Production Tooling requirements</Typography>
                                <Button variant="outlined" size="small" onClick={() => addDetailRow('tools', { toolName: '', toolCode: '', toolType: '', quantity: 1, toolLife: '', usageLimit: '', uom: '', mandatory: false, remarks: '' })} startIcon={<IconPlus size={16} />}>
                                    Add Tool
                                </Button>
                            </Stack>
                            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table size="small" sx={{ minWidth: 1000, tableLayout: 'fixed' }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="6%">Seq</TableCell>
                                            <TableCell width="25%">Tool Name *</TableCell>
                                            <TableCell width="12%">Tool Code</TableCell>
                                            <TableCell width="12%">Tool Type</TableCell>
                                            <TableCell width="8%">Qty</TableCell>
                                            <TableCell width="8%">Tool Life</TableCell>
                                            <TableCell width="8%">Limit</TableCell>
                                            <TableCell width="10%">Mandatory</TableCell>
                                            <TableCell width="15%">Remarks</TableCell>
                                            <TableCell width="6%" align="center">Delete</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {!currentProcess.tools || currentProcess.tools.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                                                    No tools mapped to this process step.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            currentProcess.tools.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{row.seqNo}</TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            value={row.toolName}
                                                            onChange={(e) => handleDetailRowChange('tools', idx, 'toolName', e.target.value)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            value={row.toolCode || ''}
                                                            onChange={(e) => handleDetailRowChange('tools', idx, 'toolCode', e.target.value)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            value={row.toolType || ''}
                                                            onChange={(e) => handleDetailRowChange('tools', idx, 'toolType', e.target.value)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            type="number"
                                                            value={row.quantity}
                                                            onChange={(e) => handleDetailRowChange('tools', idx, 'quantity', parseFloat(e.target.value) || 1)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            type="number"
                                                            value={row.toolLife || ''}
                                                            onChange={(e) => handleDetailRowChange('tools', idx, 'toolLife', parseInt(e.target.value) || '')}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            type="number"
                                                            value={row.usageLimit || ''}
                                                            onChange={(e) => handleDetailRowChange('tools', idx, 'usageLimit', parseInt(e.target.value) || '')}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <Switch
                                                            checked={row.mandatory}
                                                            onChange={(e) => handleDetailRowChange('tools', idx, 'mandatory', e.target.checked)}
                                                            size="small"
                                                            color="primary"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            value={row.remarks || ''}
                                                            onChange={(e) => handleDetailRowChange('tools', idx, 'remarks', e.target.value)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                        <IconButton size="small" color="error" onClick={() => removeDetailRow('tools', idx)}>
                                                            <IconTrash size={16} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}

                    {/* TAB 3: DOCUMENTS / SOPS */}
                    {detailTabValue === 3 && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h5">Associated Documents & SOPs File Paths</Typography>
                                <Button variant="outlined" size="small" onClick={() => addDetailRow('documents', { docName: '', docType: 'SOP', filePath: '', remarks: '' })} startIcon={<IconPlus size={16} />}>
                                    Link Document
                                </Button>
                            </Stack>
                            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', maxWidth: '100%' }}>
                                <Table size="small" sx={{ minWidth: 900, tableLayout: 'fixed' }}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="25%">Document Name</TableCell>
                                            <TableCell width="15%">Document Type</TableCell>
                                            <TableCell width="35%">Reference / File Path</TableCell>
                                            <TableCell width="19%">Remarks</TableCell>
                                            <TableCell width="6%" align="center">Delete</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {!currentProcess.documents || currentProcess.documents.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                                    No documents linked to this process.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            currentProcess.documents.map((row, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            value={row.docName}
                                                            onChange={(e) => handleDetailRowChange('documents', idx, 'docName', e.target.value)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <Select
                                                            value={row.docType || 'SOP'}
                                                            onChange={(e) => handleDetailRowChange('documents', idx, 'docType', e.target.value)}
                                                            size="small"
                                                            fullWidth
                                                        >
                                                            <MenuItem value="SOP">SOP Manual</MenuItem>
                                                            <MenuItem value="Drawing">Engineering Drawing</MenuItem>
                                                            <MenuItem value="Checklist">Quality Checklist</MenuItem>
                                                            <MenuItem value="CNC">CNC Program File</MenuItem>
                                                            <MenuItem value="Other">Other Reference</MenuItem>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            value={row.filePath}
                                                            onChange={(e) => handleDetailRowChange('documents', idx, 'filePath', e.target.value)}
                                                            size="small"
                                                            placeholder="e.g. \\server\drawings\cutting-v1.pdf"
                                                        />
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <BOSTextField
                                                            value={row.remarks || ''}
                                                            onChange={(e) => handleDetailRowChange('documents', idx, 'remarks', e.target.value)}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                        <IconButton size="small" color="error" onClick={() => removeDetailRow('documents', idx)}>
                                                            <IconTrash size={16} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </MainCard>
            )
            }
        </Box >
    );
}
