/*
Organization: Autonova ERP
Owner: Developer
Created At: 2026-09-05
Description: List view for Production Plans with filters, metrics & actions
*/
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tooltip, Box, Typography, Grid, Card, CardContent, Chip, IconButton } from '@mui/material';
import { IconPlus, IconEye, IconCheck, IconX, IconShoppingCart, IconLayersSubtract } from '@tabler/icons-react';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSStatusChip, btnNew } from 'ui-component/bos';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { API_PATHS } from 'utils/api-constants';

export default function ProductionPlanList() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_PATHS.PRODUCTION_PLAN.BASE);
            setData(response.data || []);
        } catch (error) {
            console.error('Failed to fetch Production Plans:', error);
            dispatch(openSnackbar({ open: true, message: 'Failed to fetch Production Plans', variant: 'alert', severity: 'error' }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRelease = async (planNo) => {
        try {
            await axios.post(API_PATHS.PRODUCTION_PLAN.RELEASE(planNo));
            dispatch(openSnackbar({ open: true, message: `Production Plan #${planNo} Released Successfully`, variant: 'alert', severity: 'success' }));
            fetchData();
        } catch (error) {
            console.error('Failed to release plan:', error);
            dispatch(openSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to release plan', variant: 'alert', severity: 'error' }));
        }
    };

    const handleCancel = async (planNo) => {
        try {
            await axios.post(API_PATHS.PRODUCTION_PLAN.CANCEL(planNo));
            dispatch(openSnackbar({ open: true, message: `Production Plan #${planNo} Cancelled`, variant: 'alert', severity: 'info' }));
            fetchData();
        } catch (error) {
            console.error('Failed to cancel plan:', error);
            dispatch(openSnackbar({ open: true, message: error?.response?.data?.message || 'Failed to cancel plan', variant: 'alert', severity: 'error' }));
        }
    };

    const totalPlans = data.length;
    const activePlans = data.filter(d => d.status === 'RELEASED' || d.status === 'IN_PROGRESS').length;
    const draftPlans = data.filter(d => d.status === 'DRAFT').length;

    const columns = [
        { id: 'planNo', label: 'Plan No', sortable: true, format: (row) => `#${row.planNo}` },
        { id: 'planDate', label: 'Plan Date', sortable: true, format: (row) => row.planDate ? new Date(row.planDate).toLocaleDateString() : '-' },
        { id: 'productCode', label: 'Product', sortable: true, render: (row) => row.productCode ? `${row.productCode} - ${row.productName || ''}` : '-' },
        { id: 'sourceType', label: 'Source Type', sortable: true, render: (row) => <Chip label={row.sourceType} size="small" color="primary" variant="outlined" /> },
        { id: 'sourceNo', label: 'Source No', sortable: true, format: (row) => row.sourceNo || '-' },
        { id: 'priority', label: 'Priority', sortable: true, render: (row) => {
            let color = 'info';
            if (row.priority === 'HIGH' || row.priority === 'URGENT') color = 'error';
            return <Chip label={row.priority || 'MEDIUM'} size="small" color={color} />;
        }},
        { id: 'status', label: 'Status', sortable: true, render: (row) => <BOSStatusChip status={row.status} /> },
        { id: 'actions', label: 'Actions', sortable: false, render: (row) => (
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="View Detail">
                    <IconButton size="small" color="primary" onClick={() => navigate(`/production/production-plan/view/${row.planNo}`)}>
                        <IconEye size={18} />
                    </IconButton>
                </Tooltip>
                {row.status === 'DRAFT' && (
                    <Tooltip title="Release Plan">
                        <IconButton size="small" color="success" onClick={() => handleRelease(row.planNo)}>
                            <IconCheck size={18} />
                        </IconButton>
                    </Tooltip>
                )}
                {row.status !== 'CANCELLED' && row.status !== 'COMPLETED' && (
                    <Tooltip title="Cancel Plan">
                        <IconButton size="small" color="error" onClick={() => handleCancel(row.planNo)}>
                            <IconX size={18} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        )}
    ];

    return (
        <MainCard
            pageCode="PP1010"
            title="Production Planning & BOM Explosion"
            secondary={
                <Tooltip title="Create New Production Plan">
                    <Button variant="contained" startIcon={<IconPlus size={18} />} onClick={() => navigate('/production/production-plan/add')} sx={btnNew}>
                        New Plan
                    </Button>
                </Tooltip>
            }
        >
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="subtitle2" color="textSecondary">Total Plans</Typography>
                            <Typography variant="h3" color="primary">{totalPlans}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="subtitle2" color="textSecondary">Active Released Plans</Typography>
                            <Typography variant="h3" color="success.main">{activePlans}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="subtitle2" color="textSecondary">Draft Plans</Typography>
                            <Typography variant="h3" color="warning.main">{draftPlans}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <BOSDataTable
                columns={columns}
                data={data}
                loading={loading}
                onDoubleClickRow={(row) => navigate(`/production/production-plan/view/${row.planNo}`)}
            />
        </MainCard>
    );
}
