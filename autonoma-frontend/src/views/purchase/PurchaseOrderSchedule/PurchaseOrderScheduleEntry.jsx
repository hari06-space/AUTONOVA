import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, Grid, Typography, Paper, useTheme, Avatar, alpha } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { BOSAutocomplete, BOSTextField } from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import { useSnackbar } from 'notistack';
import usePurchaseOrderStore from 'store/usePurchaseOrderStore';
import useAuth from 'hooks/useAuth';
import axios from 'utils/axios';
import POScheduleItemGrid from './components/POScheduleItemGrid';

export default function PurchaseOrderScheduleEntry() {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    
    // Global Data
    const { pos, currentPo, fetchAllPos, fetchPoById } = usePurchaseOrderStore();
    const [suppliers, setSuppliers] = useState([]);

    // Form State
    const [supplierId, setSupplierId] = useState(null);
    const [poId, setPoId] = useState(null);
    
    // Grid State
    const [scheduleItems, setScheduleItems] = useState([]);

    // Initialization
    useEffect(() => {
        if (user?.divisionId) {
            fetchAllPos(user.divisionId);
        }
        
        axios.get('/api/master/vendors?type=supplier')
            .then(res => setSuppliers((res.data || []).map(s => ({ value: s.id, label: s.ledgerName, ...s }))))
            .catch(() => {});
    }, [user?.divisionId, fetchAllPos]);

    // Handle Edit Mode from URL
    useEffect(() => {
        const queryPoId = searchParams.get('poId');
        if (queryPoId && pos?.length > 0 && suppliers?.length > 0) {
            const parsedId = parseInt(queryPoId, 10);
            if (poId === parsedId) return; // Prevent loop
            
            const poToSelect = pos.find(p => p.id === parsedId);
            if (poToSelect) {
                setPoId(parsedId);
                setSupplierId(poToSelect.supplierId);
                
                fetchPoById(parsedId).then((fullPo) => {
                    // Fetch existing schedules for this PO
                    axios.get(`/api/v1/purchase-schedule/po/${parsedId}`)
                        .then(res => {
                            const existing = (res.data || []).map(s => {
                                const poItem = fullPo?.items?.find(i => i.id === s.poItemId);
                                return {
                                    id: s.id,
                                    poItemId: s.poItemId,
                                    itemCode: poItem?.itemCode || poItem?.product?.itemCode || s.itemCode || '',
                                    itemName: poItem?.itemName || poItem?.product?.itemName || s.itemName || '',
                                    uom: poItem?.uom || poItem?.product?.uom || s.uom || '',
                                    poQty: poItem?.qty || s.poQty || s.orderQty || 0,
                                    balanceQty: poItem?.balanceQty ?? ((poItem?.qty || s.poQty || s.orderQty || 0) - (poItem?.receiveQty || poItem?.receivedQty || poItem?.grnQty || poItem?.receivedQuantity || 0) - (poItem?.asnQty || 0)),
                                    scheduledDate: s.scheduleDate ? new Date(s.scheduleDate).toISOString().split('T')[0] : '',
                                    scheduledQty: s.scheduleQty || 0,
                                    receiveQty: s.receiveQty || 0,
                                    asnQty: s.asnQty || 0,
                                    status: s.statusName || 'Pending'
                                };
                            });
                            
                            // Handle auto-adding item from URL if present
                            const queryItemId = searchParams.get('itemId');
                            const itemsToSet = [...existing];
                            
                            if (queryItemId) {
                                const parsedItemId = parseInt(queryItemId, 10);
                                const itemToAutoAdd = fullPo?.items?.find(i => i.id === parsedItemId);
                                
                                if (itemToAutoAdd) {
                                    itemsToSet.push({
                                        id: Math.random().toString(36).substr(2, 9),
                                        poItemId: itemToAutoAdd.id,
                                        itemCode: itemToAutoAdd.itemCode || itemToAutoAdd.product?.itemCode || '',
                                        itemName: itemToAutoAdd.itemName || itemToAutoAdd.product?.itemName || '',
                                        uom: itemToAutoAdd.uom || itemToAutoAdd.product?.uom || '',
                                        poQty: itemToAutoAdd.qty || 0,
                                        balanceQty: itemToAutoAdd.balanceQty ?? ((itemToAutoAdd.qty || 0) - (itemToAutoAdd.receiveQty || itemToAutoAdd.receivedQty || itemToAutoAdd.grnQty || itemToAutoAdd.receivedQuantity || 0) - (itemToAutoAdd.asnQty || 0)),
                                        scheduledDate: '',
                                        scheduledQty: 0,
                                        receiveQty: itemToAutoAdd.receiveQty || itemToAutoAdd.receivedQty || itemToAutoAdd.grnQty || itemToAutoAdd.receivedQuantity || 0,
                                        asnQty: itemToAutoAdd.asnQty || 0,
                                        status: 'Pending'
                                    });
                                }
                            }
                            
                            if (itemsToSet.length > 0) {
                                setScheduleItems(itemsToSet);
                            }
                        })
                        .catch(e => console.error(e));
                }).catch(e => console.error(e));
            }
        }
    }, [searchParams, pos, suppliers, fetchPoById, poId]);

    // Dependent Dropdown Logic
    const handleSupplierChange = (selectedSupplier) => {
        setSupplierId(selectedSupplier?.value || null);
        // Reset PO if it doesn't belong to the newly selected supplier
        if (selectedSupplier && poId) {
            const currentPo = pos?.find(p => p.id === poId);
            if (currentPo && currentPo.supplierId !== selectedSupplier.value) {
                setPoId(null);
            }
        }
    };

    const handlePoChange = async (selectedPo) => {
        const selectedId = selectedPo?.value || null;
        setPoId(selectedId);
        if (selectedId) {
            // Auto-populate supplier based on the selected PO
            const currentPo = pos?.find(p => p.id === selectedId);
            if (currentPo && currentPo.supplierId) {
                setSupplierId(currentPo.supplierId);
            }
            const fullPo = await fetchPoById(selectedId);
            
            setScheduleItems([]);
        } else {
            setScheduleItems([]);
        }
    };

    // Derived Options
    const filteredPos = useMemo(() => {
        let list = pos || [];
        if (supplierId) {
            list = list.filter(p => p.supplierId === supplierId);
        }
        return list.map(p => ({ value: p.id, label: p.poNo, supplierId: p.supplierId }));
    }, [pos, supplierId]);

    // No manual proceed required anymore

    const handleSaveSchedule = async () => {
        if (!scheduleItems || scheduleItems.length === 0) {
            enqueueSnackbar('Please add at least one schedule item.', { variant: 'error' });
            return;
        }

        if (currentPo?.poType?.toUpperCase() === 'ONETIME') {
            // Aggregate scheduled quantities per item
            const qtyPerItem = {};
            for (let i = 0; i < scheduleItems.length; i++) {
                const item = scheduleItems[i];
                if (!qtyPerItem[item.poItemId]) {
                    qtyPerItem[item.poItemId] = { totalScheduled: 0, poQty: parseFloat(item.poQty) || 0, itemCode: item.itemCode };
                }
                qtyPerItem[item.poItemId].totalScheduled += parseFloat(item.scheduledQty) || 0;
            }

            // Check if any item exceeds poQty
            for (const key in qtyPerItem) {
                if (qtyPerItem[key].totalScheduled > qtyPerItem[key].poQty) {
                    enqueueSnackbar(`Total Scheduled Qty (${qtyPerItem[key].totalScheduled}) for Item ${qtyPerItem[key].itemCode} exceeds PO Qty (${qtyPerItem[key].poQty}) for a ONETIME PO.`, { variant: 'error' });
                    return;
                }
            }
        }

        const payload = [];

        for (let i = 0; i < scheduleItems.length; i++) {
            const item = scheduleItems[i];
            if (!item.poItemId) {
                enqueueSnackbar(`Please select an Item No for row ${i + 1}.`, { variant: 'error' });
                return;
            }
            if (!item.scheduledDate) {
                enqueueSnackbar(`Please select a Scheduled Date for row ${i + 1}.`, { variant: 'error' });
                return;
            }
            if (!item.scheduledQty || parseFloat(item.scheduledQty) <= 0) {
                enqueueSnackbar(`Please enter a valid Scheduled Qty for row ${i + 1}.`, { variant: 'error' });
                return;
            }

            payload.push({
                id: (typeof item.id === 'number') ? item.id : null,
                supplierId: supplierId,
                poId: poId,
                poItemId: item.poItemId,
                scheduleQty: parseFloat(item.scheduledQty),
                scheduleDate: item.scheduledDate,
                receiveQty: item.receiveQty,
                asnQty: item.asnQty
            });
        }

        try {
            await axios.post('/api/v1/purchase-schedule/bulk', payload);
            enqueueSnackbar('Schedule saved successfully', { variant: 'success' });
            navigate('/purchase/po-schedule');
        } catch (error) {
            enqueueSnackbar(`Failed to save schedule: ${error?.response?.data?.message || error.message}`, { variant: 'error' });
        }
    };

    return (
        <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header section similar to POHeader standard */}
            <Paper
                elevation={0}
                sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1200,
                    p: 1.25,
                    mb: 1.5,
                    borderRadius: 4,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
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
                        <ShoppingCart fontSize="medium" />
                    </Avatar>
                    <Box>
                        <Typography variant="h3" fontWeight="800" sx={{
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 0.5
                        }}>
                            Purchase Order Schedule Entry
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
                            Select Supplier and PO to proceed
                        </Typography>
                    </Box>
                </Box>

                <Box gap={1.5} display="flex" flexWrap="wrap">
                    <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/purchase/po-schedule')}>
                        Back to List
                    </Button>
                    <Button variant="contained" color="success" startIcon={<IconCheck size={18} />} disabled={!poId} onClick={handleSaveSchedule}>
                        Save Schedule
                    </Button>
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minHeight: 0 }}>
                <MainCard title="Schedule Details" stretch={false}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={currentPo ? 4 : 6}>
                            <BOSAutocomplete
                                label="Supplier Name"
                                value={suppliers.find(s => s.value === supplierId) || null}
                                options={suppliers}
                                onChange={handleSupplierChange}
                                placeholder="Select Supplier..."
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={currentPo ? 4 : 6}>
                            <BOSAutocomplete
                                label="PO No"
                                value={filteredPos.find(p => p.value === poId) || null}
                                options={filteredPos}
                                onChange={handlePoChange}
                                placeholder="Select Purchase Order..."
                                disabled={filteredPos.length === 0 && !supplierId}
                            />
                        </Grid>

                        {currentPo && (
                            <Grid item xs={12} md={4}>
                                <BOSTextField
                                    label="PO Type"
                                    value={currentPo?.poType || ''}
                                    disabled
                                    fullWidth
                                />
                            </Grid>
                        )}
                    </Grid>
                </MainCard>

                <POScheduleItemGrid 
                    poDetails={poId ? currentPo : null} 
                    scheduleItems={scheduleItems} 
                    setScheduleItems={setScheduleItems} 
                />
            </Box>
        </Box>
    );
}
