/*
Organization: Autonova ERP
Owner: Developer
Created At: 2026-09-05
Description: Form for Creating Production Plan with live BOM explosion preview, planning tree, and requirement tabs
*/
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography, Tabs, Tab, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Collapse, IconButton, Alert
} from '@mui/material';
import {
    IconArrowLeft, IconCheck, IconChevronDown, IconChevronRight, IconRefresh, IconShoppingCart, IconLayersSubtract
} from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { API_PATHS } from 'utils/api-constants';

function TreeRow({ node, depth = 0 }) {
    const [open, setOpen] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    let reqColor = node.requirementType === 'PRODUCTION' ? 'primary' : 'warning';
    let netColor = node.netQty > 0 ? 'error' : 'success';

    return (
        <>
            <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell sx={{ pl: depth * 3 + 2, display: 'flex', alignItems: 'center' }}>
                    {hasChildren ? (
                        <IconButton size="small" onClick={() => setOpen(!open)} sx={{ mr: 0.5 }}>
                            {open ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                        </IconButton>
                    ) : (
                        <Box sx={{ width: 24 }} />
                    )}
                    <Typography variant="body2" fontWeight={depth === 0 ? 'bold' : 'normal'}>
                        {node.productCode} - {node.productName}
                    </Typography>
                </TableCell>
                <TableCell><Chip label={`L${node.bomLevel || 0}`} size="small" variant="outlined" /></TableCell>
                <TableCell><Chip label={node.itemType || 'ITEM'} size="small" color="default" /></TableCell>
                <TableCell><Chip label={node.requirementType} size="small" color={reqColor} /></TableCell>
                <TableCell align="right">{node.grossQty}</TableCell>
                <TableCell align="right">{node.stockQty}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    <Chip label={node.netQty} size="small" color={netColor} />
                </TableCell>
                <TableCell>{node.uom || 'NOS'}</TableCell>
                <TableCell>{node.bomNo || '-'}</TableCell>
            </TableRow>
            {hasChildren && open && node.children.map((child, idx) => (
                <TreeRow key={idx} node={child} depth={depth + 1} />
            ))}
        </>
    );
}

export default function ProductionPlanForm() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [sourceType, setSourceType] = useState('SALES_ORDER');
    const [sources, setSources] = useState([]);
    const [selectedSourceId, setSelectedSourceId] = useState('');
    const [selectedSourceNo, setSelectedSourceNo] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [remarks, setRemarks] = useState('');

    const [sourceItems, setSourceItems] = useState([]);
    const [preview, setPreview] = useState(null);
    const [loadingSources, setLoadingSources] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    const fetchSources = async (type) => {
        setLoadingSources(true);
        try {
            const res = await axios.get(`${API_PATHS.PRODUCTION_PLAN.SOURCES}?sourceType=${type}`);
            setSources(res.data || []);
        } catch (err) {
            console.error('Failed to fetch sources:', err);
        } finally {
            setLoadingSources(false);
        }
    };

    useEffect(() => {
        fetchSources(sourceType);
        setSelectedSourceId('');
        setSelectedSourceNo('');
        setSourceItems([]);
        setPreview(null);
    }, [sourceType]);

    const handleSourceChange = async (sourceId) => {
        setSelectedSourceId(sourceId);
        const src = sources.find(s => String(s.sourceId) === String(sourceId));
        if (src) {
            setSelectedSourceNo(src.sourceNo);
            try {
                const res = await axios.get(`${API_PATHS.PRODUCTION_PLAN.SOURCE_ITEMS}?sourceType=${sourceType}&sourceId=${sourceId}`);
                setSourceItems(res.data || []);
            } catch (err) {
                console.error('Failed to fetch source items:', err);
            }
        }
    };

    const handleItemQtyChange = (sourceLineId, val) => {
        setSourceItems(prev => prev.map(item => {
            if (item.sourceLineId === sourceLineId) {
                const num = parseFloat(val) || 0;
                return { ...item, planQty: num };
            }
            return item;
        }));
    };

    const handleCalculatePreview = async () => {
        const validItems = sourceItems.filter(i => i.planQty > 0);
        if (validItems.length === 0) {
            dispatch(openSnackbar({ open: true, message: 'Please enter plan quantity > 0 for at least one item', variant: 'alert', severity: 'warning' }));
            return;
        }

        setCalculating(true);
        try {
            const payload = {
                sourceType,
                sourceId: selectedSourceId ? parseInt(selectedSourceId) : null,
                sourceNo: selectedSourceNo,
                priority,
                remarks,
                items: validItems.map(i => ({
                    sourceLineId: i.sourceLineId,
                    productId: i.productId,
                    planQty: i.planQty,
                    requiredDate: i.requiredDate
                }))
            };

            const res = await axios.post(API_PATHS.PRODUCTION_PLAN.CALCULATE_PREVIEW, payload);
            setPreview(res.data);
            dispatch(openSnackbar({ open: true, message: 'BOM Explosion & Netting Calculation Completed', variant: 'alert', severity: 'success' }));
        } catch (err) {
            console.error('BOM Calculation error:', err);
            dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || 'BOM Explosion Calculation Failed', variant: 'alert', severity: 'error' }));
        } finally {
            setCalculating(false);
        }
    };

    const handleSavePlan = async () => {
        const validItems = sourceItems.filter(i => i.planQty > 0);
        if (validItems.length === 0) {
            dispatch(openSnackbar({ open: true, message: 'Please enter plan quantity > 0 for at least one item', variant: 'alert', severity: 'warning' }));
            return;
        }

        setSaving(true);
        try {
            const payload = {
                sourceType,
                sourceId: selectedSourceId ? parseInt(selectedSourceId) : null,
                sourceNo: selectedSourceNo,
                priority,
                remarks,
                items: validItems.map(i => ({
                    sourceLineId: i.sourceLineId,
                    productId: i.productId,
                    planQty: i.planQty,
                    requiredDate: i.requiredDate
                }))
            };

            const res = await axios.post(API_PATHS.PRODUCTION_PLAN.BASE, payload);
            dispatch(openSnackbar({ open: true, message: `Production Plan #${res.data.planNo} Created Successfully!`, variant: 'alert', severity: 'success' }));
            navigate(`/production/production-plan/view/${res.data.planNo}`);
        } catch (err) {
            console.error('Failed to create plan:', err);
            dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || 'Failed to create Production Plan', variant: 'alert', severity: 'error' }));
        } finally {
            setSaving(false);
        }
    };

    return (
        <MainCard
            pageCode="PP1010"
            title="Create Production Plan (BOM Explosion & Netting)"
            secondary={
                <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/production/production-plan')}>
                    Back to List
                </Button>
            }
        >
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                    <TextField
                        select
                        fullWidth
                        label="Source Type"
                        value={sourceType}
                        onChange={(e) => setSourceType(e.target.value)}
                    >
                        <MenuItem value="SALES_ORDER">Sales Order</MenuItem>
                        <MenuItem value="SALES_SCHEDULE">Sales Schedule</MenuItem>
                        <MenuItem value="INVENTORY">Inventory Replenishment</MenuItem>
                        <MenuItem value="ROL">Reorder Level (ROL)</MenuItem>
                        <MenuItem value="MANUAL">Manual Demand</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        select
                        fullWidth
                        label="Source Document"
                        value={selectedSourceId}
                        onChange={(e) => handleSourceChange(e.target.value)}
                        disabled={loadingSources}
                    >
                        <MenuItem value="">-- Select Source Document --</MenuItem>
                        {sources.map(s => (
                            <MenuItem key={s.sourceId} value={s.sourceId} disabled={s.hasActivePlan}>
                                {s.sourceNo} {s.hasActivePlan ? `(Active Plan #${s.activePlanNo})` : ''}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <TextField
                        select
                        fullWidth
                        label="Priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                    >
                        <MenuItem value="LOW">Low</MenuItem>
                        <MenuItem value="MEDIUM">Medium</MenuItem>
                        <MenuItem value="HIGH">High</MenuItem>
                        <MenuItem value="URGENT">Urgent</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <TextField
                        fullWidth
                        label="Remarks"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                    />
                </Grid>
            </Grid>

            {sourceItems.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ mb: 2 }}>Source Products & Planning Quantity</Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                                <TableRow>
                                    <TableCell>Product Code</TableCell>
                                    <TableCell>Product Name</TableCell>
                                    <TableCell>UOM</TableCell>
                                    <TableCell align="right">Source Qty</TableCell>
                                    <TableCell align="right">Already Planned</TableCell>
                                    <TableCell align="right">Pending Qty</TableCell>
                                    <TableCell align="right" sx={{ width: 180 }}>Plan Qty</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sourceItems.map((row) => {
                                    const isExceeded = row.planQty > row.pendingQty;
                                    return (
                                        <TableRow key={row.sourceLineId}>
                                            <TableCell>{row.productCode}</TableCell>
                                            <TableCell>{row.productName}</TableCell>
                                            <TableCell>{row.uom}</TableCell>
                                            <TableCell align="right">{row.sourceQty}</TableCell>
                                            <TableCell align="right">{row.alreadyPlannedQty}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{row.pendingQty}</TableCell>
                                            <TableCell align="right">
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={row.planQty}
                                                    onChange={(e) => handleItemQtyChange(row.sourceLineId, e.target.value)}
                                                    error={isExceeded}
                                                    helperText={isExceeded ? 'Exceeds Pending Qty' : ''}
                                                    inputProps={{ min: 0, max: row.pendingQty }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<IconRefresh size={18} />}
                            onClick={handleCalculatePreview}
                            disabled={calculating}
                        >
                            {calculating ? 'Exploding BOM & Netting...' : 'Calculate BOM Explosion & Netting'}
                        </Button>

                        {preview && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<IconCheck size={18} />}
                                onClick={handleSavePlan}
                                disabled={saving}
                            >
                                {saving ? 'Saving Plan...' : 'Save & Create Production Plan'}
                            </Button>
                        )}
                    </Box>
                </Box>
            )}

            {preview && (
                <Box sx={{ mt: 4 }}>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={3}>
                            <Card variant="outlined">
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Typography variant="caption">Total Planned Qty</Typography>
                                    <Typography variant="h4" color="primary">{preview.totalPlannedQty}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Card variant="outlined">
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Typography variant="caption">Production Shortage Qty</Typography>
                                    <Typography variant="h4" color="primary.main">{preview.totalProductionQty}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Card variant="outlined">
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Typography variant="caption">Procurement Shortage Qty</Typography>
                                    <Typography variant="h4" color="warning.main">{preview.totalProcurementQty}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Card variant="outlined">
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Typography variant="caption">Total Shortage Net Qty</Typography>
                                    <Typography variant="h4" color="error.main">{preview.totalShortageQty}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tab label="Planning Tree (Hierarchy)" />
                        <Tab label={`Production Requirements (${preview.requirementSummary.filter(s => s.requirementType === 'PRODUCTION').length})`} />
                        <Tab label={`Procurement Requirements (${preview.requirementSummary.filter(s => s.requirementType === 'PROCUREMENT').length})`} />
                    </Tabs>

                    {tabValue === 0 && (
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell>Item Code & Name</TableCell>
                                        <TableCell>Level</TableCell>
                                        <TableCell>Item Type</TableCell>
                                        <TableCell>Req Type</TableCell>
                                        <TableCell align="right">Gross Qty</TableCell>
                                        <TableCell align="right">Available Stock</TableCell>
                                        <TableCell align="right">Net Shortage</TableCell>
                                        <TableCell>UOM</TableCell>
                                        <TableCell>BOM No</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {preview.transactions.map((tree, idx) => (
                                        <TreeRow key={idx} node={tree} depth={0} />
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {tabValue === 1 && (
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell>Product Code</TableCell>
                                        <TableCell>Product Name</TableCell>
                                        <TableCell>Item Type</TableCell>
                                        <TableCell align="right">Total Gross Qty</TableCell>
                                        <TableCell align="right">Stock Qty</TableCell>
                                        <TableCell align="right">Net Shortage Qty</TableCell>
                                        <TableCell>UOM</TableCell>
                                        <TableCell>BOM No</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {preview.requirementSummary.filter(s => s.requirementType === 'PRODUCTION').map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{row.productCode}</TableCell>
                                            <TableCell>{row.productName}</TableCell>
                                            <TableCell><Chip label={row.itemType} size="small" color="primary" variant="outlined" /></TableCell>
                                            <TableCell align="right">{row.totalGrossQty}</TableCell>
                                            <TableCell align="right">{row.stockQty}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: row.netQty > 0 ? 'error.main' : 'success.main' }}>
                                                {row.netQty}
                                            </TableCell>
                                            <TableCell>{row.uom}</TableCell>
                                            <TableCell>{row.bomNo || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {tabValue === 2 && (
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell>Material Code</TableCell>
                                        <TableCell>Material Name</TableCell>
                                        <TableCell>Item Type</TableCell>
                                        <TableCell align="right">Total Gross Qty</TableCell>
                                        <TableCell align="right">Current Stock</TableCell>
                                        <TableCell align="right">Purchase Net Qty</TableCell>
                                        <TableCell>UOM</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {preview.requirementSummary.filter(s => s.requirementType === 'PROCUREMENT').map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{row.productCode}</TableCell>
                                            <TableCell>{row.productName}</TableCell>
                                            <TableCell><Chip label={row.itemType} size="small" color="warning" variant="outlined" /></TableCell>
                                            <TableCell align="right">{row.totalGrossQty}</TableCell>
                                            <TableCell align="right">{row.stockQty}</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: row.netQty > 0 ? 'warning.main' : 'success.main' }}>
                                                {row.netQty}
                                            </TableCell>
                                            <TableCell>{row.uom}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            )}
        </MainCard>
    );
}
