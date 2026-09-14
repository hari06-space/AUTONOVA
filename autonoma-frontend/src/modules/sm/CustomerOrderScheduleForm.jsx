import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Box, Button, Grid, Typography, Paper, useTheme, Avatar, alpha, Tooltip } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { IconArrowLeft, IconCheck, IconCalendarEvent } from '@tabler/icons-react';
import { BOSAutocomplete, BOSTextField } from 'ui-component/bos';
import MainCard from 'ui-component/cards/MainCard';
import { useSnackbar } from 'notistack';
import useAuth from 'hooks/useAuth';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import CustomerOrderScheduleItemGrid from './components/CustomerOrderScheduleItemGrid';

export default function CustomerOrderScheduleForm() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    
    // Global Data
    const [customers, setCustomers] = useState([]);
    const [orders, setOrders] = useState([]);

    // Form State
    const [customerId, setCustomerId] = useState(null);
    const [orderId, setOrderId] = useState(null);
    const [currentOrder, setCurrentOrder] = useState(null);
    
    // Grid State
    const [scheduleItems, setScheduleItems] = useState([]);

    // Initialization
    useEffect(() => {
        // Fetch Customers
        axios.get(API_PATHS.SM.CUSTOMERS)
            .then(res => setCustomers((res.data || []).map(c => ({ value: c.id, label: c.customerName, ...c }))))
            .catch(() => {});
            
        // Fetch Orders
        axios.get(API_PATHS.SM.CUSTOMER_ORDERS)
            .then(res => setOrders(res.data?.content || res.data || []))
            .catch(() => {});
    }, []);

    // Dependent Dropdown Logic
    const handleCustomerChange = (selectedCustomer) => {
        setCustomerId(selectedCustomer?.value || null);
        // Reset Order if it doesn't belong to the newly selected customer
        if (selectedCustomer && orderId) {
            const co = orders?.find(o => o.id === orderId);
            if (co && co.custId !== selectedCustomer.value) {
                setOrderId(null);
                setCurrentOrder(null);
            }
        }
    };

    const handleOrderChange = async (selectedOrder, autoAddItemIds = []) => {
        const selectedId = selectedOrder?.value || null;
        setOrderId(selectedId);
        if (selectedId) {
            const co = orders?.find(o => o.id === selectedId);
            if (co && co.custId) {
                setCustomerId(co.custId);
            }
            
            // Fetch full order details
            try {
                const res = await axios.get(`${API_PATHS.SM.CUSTOMER_ORDERS}/${selectedId}`);
                const fullOrder = res.data;
                setCurrentOrder(fullOrder);
                
                // Fetch existing schedules
                const schRes = await axios.get(`/api/v1/sm/customer-schedules/order/${selectedId}`, { skipGlobalAlert: true }).catch(() => ({ data: [] }));
                const availableItems = fullOrder.orderDetails || fullOrder.lineItems || fullOrder.items || [];
                
                const existing = (schRes.data || []).map(s => {
                    const orderItem = availableItems.find(i => i.id === s.orderItemId);
                    return {
                        id: s.id,
                        orderItemId: s.orderItemId,
                        itemCode: orderItem?.partNo || orderItem?.itemCode || orderItem?.product?.itemCode || s.itemCode || '',
                        itemName: orderItem?.partName || orderItem?.itemName || orderItem?.product?.itemName || s.itemName || '',
                        uom: orderItem?.uom || orderItem?.product?.uom || s.uom || '',
                        orderQty: orderItem?.qty || orderItem?.quantity || s.orderQty || 0,
                        itemReceiveQty: orderItem?.despatchQty || orderItem?.deliveredQty || orderItem?.receivedQty || orderItem?.receiveQty || 0,
                        balanceQty: orderItem?.balanceQty ?? ((orderItem?.qty || orderItem?.quantity || s.orderQty || 0) - (orderItem?.despatchQty || orderItem?.deliveredQty || 0)),
                        scheduledDate: s.scheduleDate ? new Date(s.scheduleDate).toISOString().split('T')[0] : '',
                        scheduledQty: s.scheduleQty || 0,
                        despatchQty: s.despatchQty || s.deliveredQty || 0,
                        status: s.statusName || 'Pending'
                    };
                });
                if (id) {
                    setScheduleItems([...existing]);
                } else {
                    let initialItems = [];
                    if (autoAddItemIds && autoAddItemIds.length > 0) {
                        const itemsToAdd = availableItems.filter(i => autoAddItemIds.includes(String(i.id)));
                        initialItems = itemsToAdd.map(orderItem => ({
                            id: Date.now() + Math.random(),
                            orderItemId: orderItem.id,
                            itemCode: orderItem?.partNo || orderItem?.itemCode || orderItem?.product?.itemCode || '',
                            itemName: orderItem?.partName || orderItem?.itemName || orderItem?.product?.itemName || '',
                            uom: orderItem?.uom || orderItem?.product?.uom || '',
                            orderQty: orderItem?.qty || orderItem?.quantity || 0,
                            itemReceiveQty: orderItem?.despatchQty || orderItem?.deliveredQty || orderItem?.receivedQty || orderItem?.receiveQty || 0,
                            balanceQty: orderItem?.balanceQty ?? ((orderItem?.qty || orderItem?.quantity || 0) - (orderItem?.despatchQty || orderItem?.deliveredQty || 0)),
                            scheduledDate: '',
                            scheduledQty: 0,
                            despatchQty: 0,
                            status: 'Pending'
                        }));
                    }
                    setScheduleItems(initialItems);
                }
            } catch (e) {
                console.error("Failed to load order details", e);
            }
        } else {
            setCurrentOrder(null);
            setScheduleItems([]);
        }
    };

    const urlLoadedRef = useRef(false);
    useEffect(() => {
        if (id) {
            axios.get(`/api/v1/sm/customer-schedules/${id}`).then(res => {
                const schedule = res.data;
                if (schedule && schedule.orderId) {
                    setCustomerId(schedule.customerId);
                    handleOrderChange({ value: schedule.orderId });
                }
            }).catch(console.error);
        } else if (!urlLoadedRef.current && orders.length > 0) {
            const urlOrderId = searchParams.get('orderId');
            const urlItemId = searchParams.get('itemId');
            if (urlOrderId) {
                const parsedOrderId = parseInt(urlOrderId, 10);
                const co = orders.find(o => o.id === parsedOrderId);
                if (co) {
                    setCustomerId(co.custId);
                    handleOrderChange({ value: parsedOrderId }, urlItemId ? [urlItemId] : []);
                    urlLoadedRef.current = true;
                }
            }
        }
    }, [id, searchParams, orders]);


    const filteredOrders = useMemo(() => {
        let list = orders || [];
        // Filter by OPEN status
        list = list.filter(o => !o.status || String(o.status).toUpperCase() === 'OPEN');
        
        if (customerId) {
            list = list.filter(o => o.custId === customerId);
        }
        return list.map(o => ({ value: o.id, label: o.orderNo, custId: o.custId }));
    }, [orders, customerId]);

    const handleSaveSchedule = async () => {
        if (!scheduleItems || scheduleItems.length === 0) {
            enqueueSnackbar('Please add at least one schedule item.', { variant: 'error' });
            return;
        }

        const payload = [];

        for (let i = 0; i < scheduleItems.length; i++) {
            const item = scheduleItems[i];
            
            // Skip auto-populated rows that the user hasn't filled
            if ((!item.scheduledQty || parseFloat(item.scheduledQty) <= 0) && !item.scheduledDate) {
                continue;
            }

            if (!item.orderItemId) {
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
                customerId: customerId,
                orderId: orderId,
                orderItemId: item.orderItemId,
                scheduleQty: parseFloat(item.scheduledQty),
                scheduleDate: item.scheduledDate,
                despatchQty: item.despatchQty
            });
        }

        if (payload.length === 0) {
            enqueueSnackbar('Please enter schedule details for at least one item.', { variant: 'error' });
            return;
        }

        try {
            await axios.post('/api/v1/sm/customer-schedules/bulk', payload);
            enqueueSnackbar('Schedule saved successfully', { variant: 'success' });
            navigate('/sm/sales/customer/order-schedule');
        } catch (error) {
            enqueueSnackbar(`Failed to save schedule: ${error?.response?.data?.message || error.message}`, { variant: 'error' });
        }
    };

    useKeyboardShortcuts({
        'ctrl+s': (e) => {
            if (e) e.preventDefault();
            if (orderId) handleSaveSchedule();
        },
        'escape': () => {
            navigate('/sm/sales/customer/order-schedule');
        }
    });

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
                        <IconCalendarEvent size={28} />
                    </Avatar>
                    <Box>
                        <Typography variant="h3" fontWeight="800" sx={{
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 0.5
                        }}>
                            Customer Order Schedule
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
                            Select Customer and Order to proceed
                        </Typography>
                    </Box>
                </Box>

                <Box gap={1.5} display="flex" flexWrap="wrap">
                    <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/sm/sales/customer/order-schedule')}>
                        Back to List
                    </Button>
                    <Tooltip title={shortcutTooltip('Save Schedule', 'Ctrl + S')}>
                        <span>
                            <Button variant="contained" color="success" startIcon={<IconCheck size={18} />} disabled={!orderId} onClick={handleSaveSchedule}>
                                Save
                            </Button>
                        </span>
                    </Tooltip>
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minHeight: 0 }}>
                <MainCard title="Schedule Details" stretch={false}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <BOSAutocomplete
                                label="Customer Name"
                                value={customers.find(c => c.value === customerId) || null}
                                options={customers}
                                onChange={handleCustomerChange}
                                placeholder="Select Customer..."
                            />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <BOSAutocomplete
                                label="Order No"
                                value={filteredOrders.find(o => o.value === orderId) || null}
                                options={filteredOrders}
                                onChange={handleOrderChange}
                                placeholder="Select Customer Order..."
                                disabled={filteredOrders.length === 0 && !customerId}
                            />
                        </Grid>
                    </Grid>
                </MainCard>

                <CustomerOrderScheduleItemGrid 
                    orderDetails={orderId ? currentOrder : null} 
                    scheduleItems={scheduleItems} 
                    setScheduleItems={setScheduleItems} 
                />
            </Box>
        </Box>
    );
}
