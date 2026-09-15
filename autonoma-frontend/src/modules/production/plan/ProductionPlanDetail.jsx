/*
Organization: Autonova ERP
Owner: Developer
Created At: 2026-09-05
Description: Detail view for Production Plan with multi-tab planning tree, requirements, and execution actions
*/
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Button, Card, CardContent, Grid, Typography, Tabs, Tab, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Alert, CircularProgress, Divider
} from '@mui/material';
import {
    IconArrowLeft, IconCheck, IconX, IconShoppingCart, IconChevronDown, IconChevronRight, IconLink
} from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { BOSStatusChip } from 'ui-component/bos';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { API_PATHS } from 'utils/api-constants';

function TreeRowDetail({ node, depth = 0 }) {
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
                <TreeRowDetail key={idx} node={child} depth={depth + 1} />
            ))}
        </>
    );
}

export default function ProductionPlanDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [generatingPr, setGeneratingPr] = useState(false);

    const fetchPlanDetail = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_PATHS.PRODUCTION_PLAN.BASE}/${id}`);
            setPlan(res.data);
        } catch (err) {
            console.error('Failed to fetch plan detail:', err);
            dispatch(openSnackbar({ open: true, message: 'Failed to fetch Production Plan detail', variant: 'alert', severity: 'error' }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchPlanDetail();
    }, [id]);

    const handleRelease = async () => {
        try {
            await axios.post(API_PATHS.PRODUCTION_PLAN.RELEASE(id));
            dispatch(openSnackbar({ open: true, message: `Production Plan #${id} Released Successfully`, variant: 'alert', severity: 'success' }));
            fetchPlanDetail();
        } catch (err) {
            console.error('Failed to release plan:', err);
            dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || 'Failed to release plan', variant: 'alert', severity: 'error' }));
        }
    };

    const handleCancel = async () => {
        try {
            await axios.post(API_PATHS.PRODUCTION_PLAN.CANCEL(id));
            dispatch(openSnackbar({ open: true, message: `Production Plan #${id} Cancelled`, variant: 'alert', severity: 'info' }));
            fetchPlanDetail();
        } catch (err) {
            console.error('Failed to cancel plan:', err);
            dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || 'Failed to cancel plan', variant: 'alert', severity: 'error' }));
        }
    };

    const handleGeneratePR = async () => {
        setGeneratingPr(true);
        try {
            const res = await axios.post(API_PATHS.PRODUCTION_PLAN.GENERATE_PR(id));
            dispatch(openSnackbar({ open: true, message: res.data.message || 'Purchase Request Generated Successfully!', variant: 'alert', severity: 'success' }));
        } catch (err) {
            console.error('Failed to generate PR:', err);
            dispatch(openSnackbar({ open: true, message: err?.response?.data?.message || 'Failed to generate Purchase Request', variant: 'alert', severity: 'error' }));
        } finally {
            setGeneratingPr(false);
        }
    };

    if (loading) {
        return (
            <MainCard pageCode="PP1010" title="Loading Production Plan...">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    if (!plan) {
        return (
            <MainCard pageCode="PP1010" title="Production Plan Not Found">
                <Alert severity="error">Production Plan #{id} could not be found.</Alert>
            </MainCard>
        );
    }

    const prodSummary = plan.requirementSummary ? plan.requirementSummary.filter(s => s.requirementType === 'PRODUCTION') : [];
    const procSummary = plan.requirementSummary ? plan.requirementSummary.filter(s => s.requirementType === 'PROCUREMENT') : [];

    return (
        <MainCard
            pageCode="PP1010"
            title={`Production Plan #${plan.planNo}`}
            secondary={
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/production/production-plan')}>
                        Back
                    </Button>
                    {plan.status === 'DRAFT' && (
                        <Button variant="contained" color="success" startIcon={<IconCheck size={18} />} onClick={handleRelease}>
                            Release Plan
                        </Button>
                    )}
                    {plan.status !== 'CANCELLED' && plan.status !== 'COMPLETED' && (
                        <Button variant="outlined" color="error" startIcon={<IconX size={18} />} onClick={handleCancel}>
                            Cancel Plan
                        </Button>
                    )}
                </Box>
            }
        >
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="textSecondary">Source Document</Typography>
                    <Typography variant="h5">{plan.sourceType} - {plan.sourceNo || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <Typography variant="caption" color="textSecondary">Original Product</Typography>
                    <Typography variant="h5">{plan.productCode ? `${plan.productCode} - ${plan.productName || ''}` : 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Typography variant="caption" color="textSecondary">Plan Date</Typography>
                    <Typography variant="h5">{plan.planDate ? new Date(plan.planDate).toLocaleDateString() : '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Typography variant="caption" color="textSecondary">Priority & Status</Typography>
                    <Box sx={{ mt: 0.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip label={plan.priority || 'MEDIUM'} color="info" size="small" />
                        <BOSStatusChip status={plan.status} />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Typography variant="caption" color="textSecondary">Total Shortage Qty</Typography>
                    <Typography variant="h4" color="error.main">{plan.totalShortageQty}</Typography>
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tab label="Planning Tree (Hierarchy)" />
                <Tab label={`Production Requirements (${prodSummary.length})`} />
                <Tab label={`Procurement Requirements (${procSummary.length})`} />
                <Tab label="Traceability Chain" />
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
                            {plan.transactions.map((tree, idx) => (
                                <TreeRowDetail key={idx} node={tree} depth={0} />
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
                            {prodSummary.map((row, idx) => (
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
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={<IconShoppingCart size={18} />}
                            onClick={handleGeneratePR}
                            disabled={generatingPr || procSummary.filter(s => s.netQty > 0).length === 0}
                        >
                            {generatingPr ? 'Generating PR...' : 'Generate Purchase Request'}
                        </Button>
                    </Box>
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
                                {procSummary.map((row, idx) => (
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
                </Box>
            )}

            {tabValue === 3 && (
                <Card variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="h4" sx={{ mb: 2 }}>Traceability Flow</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Chip label={`Source: ${plan.sourceType} ${plan.sourceNo || ''}`} color="primary" variant="outlined" icon={<IconLink size={16} />} />
                        <Typography variant="h5">→</Typography>
                        <Chip label={`Production Plan #${plan.planNo}`} color="primary" icon={<IconLink size={16} />} />
                        <Typography variant="h5">→</Typography>
                        <Chip label={`Production Shortages (${prodSummary.length})`} color="info" />
                        <Chip label={`Procurement Shortages (${procSummary.length})`} color="warning" />
                        <Typography variant="h5">→</Typography>
                        <Chip label="Job Cards / Purchase Requests" color="success" variant="outlined" />
                    </Box>
                </Card>
            )}
        </MainCard>
    );
}
