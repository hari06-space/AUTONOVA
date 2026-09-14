import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Button, Grid, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, IconButton, Select, MenuItem, FormControl, InputLabel,
    Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Card, useTheme, alpha, TablePagination, Divider, TableFooter, Tooltip, Checkbox
} from '@mui/material';
import { Add, Delete, Save, CheckCircle, Cancel, LocalPrintshop, Person, ShoppingCart, Check, Close, FlashOn } from '@mui/icons-material';
import usePurchaseRequestStore from '../../../store/usePurchaseRequestStore';
import purchaseRequestService from '../../../api/purchaseRequestService';
import { useDispatch, useSelector } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';

import useAuth from 'hooks/useAuth';

import MainCard from 'ui-component/cards/MainCard';
import { BOSAutocomplete, BOSTextField, BOSDataTable, tableContainerSx, tableHeadCellSx, getTableRowSx, BOSExportButton, errorStyle, BOSStatusChip } from 'ui-component/bos';
import { getCompanyImageUrl, getFileViewUrl } from 'utils/upload-helper';
import { getPrStampText, isDraftStatus, isPendingStatus, isTerminalStatus } from './purchaseRequestStatus';
import { DEFAULT_STATUS_LABEL } from 'autonoma-common/constants/documentStampConstants';
import { STATUS_CHIP_WIDTH_TABLE } from 'autonoma-common/constants/uiConstants';

const PurchaseRequestEntry = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const theme = useTheme();

    const { user } = useAuth();

    const {
        currentPR, setField, addTransaction, updateTransaction, removeTransaction,
        getById, savePurchaseRequest, deletePurchaseRequest, resetForm, approveItem, rejectItem,
        departments, employees, products, fetchMasterData, fetchProducts
    } = usePurchaseRequestStore();

    const [submitting, setSubmitting] = useState(false);
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState(null);
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [lastSelectedProductIndex, setLastSelectedProductIndex] = useState(null);
    const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [errors, setErrors] = useState({});
    const [quickFillOpen, setQuickFillOpen] = useState(false);
    const [quickFillQty, setQuickFillQty] = useState('');
    const [quickFillDate, setQuickFillDate] = useState('');
    const [isTableEditable, setIsTableEditable] = useState(!id);
    const [companyLogo, setCompanyLogo] = useState('');

    useEffect(() => {
        if (currentPR?.rfqNo) {
            setIsTableEditable(false);
        } else {
            setIsTableEditable(!id);
        }
    }, [id, currentPR?.rfqNo]);

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const token = sessionStorage.getItem('serviceToken') || '';
                const API_BASE = (import.meta.env.VITE_API_URL || import.meta.env.VITE_APP_API_URL || window.location.origin).replace(/\/+$/, '');
                const res = await fetch(`${API_BASE}/api/company-profile/all`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0 && data[0].logoFileName) {
                        setCompanyLogo(getCompanyImageUrl(data[0].logoFileName));
                    }
                }
            } catch (err) {
                console.error('Failed to load company logo', err);
            }
        };
        fetchLogo();
    }, []);

    const totalQty = currentPR?.transactions?.reduce((sum, row) => sum + (parseFloat(row.reqQty) || 0), 0) || 0;
    const totalAmount = currentPR?.transactions?.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0) || 0;

    useEffect(() => {
        fetchMasterData();
        fetchProducts();
    }, [fetchMasterData, fetchProducts]);

    useEffect(() => {
        if (id) {
            getById(id);
        } else {
            resetForm();
        }
    }, [id, getById, resetForm]);

    useEffect(() => {
        if (!id && employees.length > 0 && departments.length > 0) {
            if (!currentPR.departmentId) {
                const defaultDept = departments.find(d => d.departmentName?.toLowerCase() === 'admin');
                if (defaultDept) {
                    setField('departmentId', defaultDept.id);
                }
            }
            if (!currentPR.plannerId) {
                let emp = null;
                if (user) {
                    emp = employees.find(e => (user.empId && String(e.id) === String(user.empId)) || String(e.userId) === String(user.id) || e.employeeName === user.name);
                }
                if (emp) {
                    setField('plannerId', emp.id);
                } else {
                    const defaultEmp = employees.find(e => e.employeeName?.toLowerCase() === 'administrator' || e.employeeName?.toLowerCase() === 'admin');
                    if (defaultEmp) setField('plannerId', defaultEmp.id);
                }
            }
        }
    }, [id, employees, departments, user, currentPR.plannerId, currentPR.departmentId, setField]);

    const handleSave = async () => {
        const newErrors = {};
        if (!currentPR.departmentId) newErrors.departmentId = true;
        if (!currentPR.plannerId) newErrors.plannerId = true;

        const invalidTransactions = [];
        currentPR.transactions.forEach((t, index) => {
            if (!t.itemId || Number(t.reqQty) <= 0) {
                invalidTransactions.push(index);
            }
        });

        if (invalidTransactions.length > 0) {
            newErrors.transactions = invalidTransactions;
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0 || currentPR.transactions.length === 0) {
            if (currentPR.transactions.length === 0) {
                dispatch(openSnackbar({ open: true, message: 'At least one item is required.', variant: 'alert', severity: 'error' }));
            } else if (newErrors.departmentId || newErrors.plannerId) {
                dispatch(openSnackbar({ open: true, message: 'Department and Planner are required.', variant: 'alert', severity: 'error' }));
            } else {
                dispatch(openSnackbar({ open: true, message: 'All items must have a valid product and quantity greater than 0.', variant: 'alert', severity: 'error' }));
            }
            return;
        }

        setSubmitting(true);
        try {
            const savedPR = await savePurchaseRequest();
            dispatch(openSnackbar({ open: true, message: 'Purchase Request saved successfully', variant: 'alert', severity: 'success' }));
            navigate(`/purchase/pr/entry/${savedPR.id}`);
        } catch (error) {
            dispatch(openSnackbar({ open: true, message: error.response?.data?.message || error.message, variant: 'alert', severity: 'error' }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePR = async () => {
        try {
            await deletePurchaseRequest(currentPR.id);
            dispatch(openSnackbar({ open: true, message: 'Purchase Request deleted successfully', variant: 'alert', severity: 'success' }));
            navigate(location.state?.from || '/purchase/pr/list');
        } catch (error) {
            dispatch(openSnackbar({ open: true, message: error.response?.data?.message || error.message, variant: 'alert', severity: 'error' }));
        } finally {
            setDeleteDialogOpen(false);
        }
    };

    const handleAction = async (actionFn, successMsg) => {
        try {
            await actionFn(currentPR.id);
            dispatch(openSnackbar({ open: true, message: successMsg, variant: 'alert', severity: 'success' }));
            getById(currentPR.id);
        } catch (error) {
            dispatch(openSnackbar({ open: true, message: error.response?.data?.message || error.message, variant: 'alert', severity: 'error' }));
        }
    };

    const handleApproveItem = async (transId) => {
        try {
            await approveItem(transId);
            dispatch(openSnackbar({ open: true, message: 'Item approved successfully', variant: 'alert', severity: 'success' }));
            getById(currentPR.id);
        } catch (error) {
            dispatch(openSnackbar({ open: true, message: error.response?.data?.message || error.message, variant: 'alert', severity: 'error' }));
        }
    };

    const handleRejectItem = async (transId) => {
        try {
            await rejectItem(transId);
            dispatch(openSnackbar({ open: true, message: 'Item rejected successfully', variant: 'alert', severity: 'success' }));
            getById(currentPR.id);
        } catch (error) {
            dispatch(openSnackbar({ open: true, message: error.response?.data?.message || error.message, variant: 'alert', severity: 'error' }));
        }
    };

    const handleApproveAllItems = async () => {
        const pendingItems = currentPR.transactions.filter((transaction) => isPendingStatus(transaction.statusName));
        if (pendingItems.length === 0) return;
        setSubmitting(true);
        try {
            await Promise.all(pendingItems.map((transaction) => approveItem(transaction.id)));
            dispatch(openSnackbar({ open: true, message: 'All pending items verified successfully', variant: 'alert', severity: 'success' }));
            getById(currentPR.id);
        } catch (error) {
            dispatch(openSnackbar({ open: true, message: error.response?.data?.message || error.message, variant: 'alert', severity: 'error' }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleRejectAllItems = async () => {
        const pendingItems = currentPR.transactions.filter((transaction) => isPendingStatus(transaction.statusName));
        if (pendingItems.length === 0) return;
        setSubmitting(true);
        try {
            await Promise.all(pendingItems.map((transaction) => rejectItem(transaction.id)));
            dispatch(openSnackbar({ open: true, message: 'All pending items rejected successfully', variant: 'alert', severity: 'success' }));
            getById(currentPR.id);
        } catch (error) {
            dispatch(openSnackbar({ open: true, message: error.response?.data?.message || error.message, variant: 'alert', severity: 'error' }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddRow = () => {
        if (currentPR.transactions.length > 0) {
            const lastRow = currentPR.transactions[currentPR.transactions.length - 1];
            if (!lastRow.itemId && !lastRow.itemName) {
                dispatch(openSnackbar({ open: true, message: 'Please select a product for the empty row before adding a new one.', variant: 'alert', severity: 'warning' }));
                return;
            }
            if (Number(lastRow.reqQty) <= 0) {
                dispatch(openSnackbar({ open: true, message: 'Please enter a valid Quantity greater than 0 before adding a new row.', variant: 'alert', severity: 'warning' }));
                return;
            }
        }
        addTransaction({
            itemId: null,
            itemName: '',
            itemCode: '',
            hsnCode: '',
            uom: '',
            price: 0,
            reqQty: 0,
            reqDate: new Date().toISOString().split('T')[0],
            amount: 0,
            remarks: '',
            approverId: null
        });
    };

    const handleApplyQuickFill = () => {
        if (!quickFillQty && !quickFillDate) {
            dispatch(openSnackbar({ open: true, message: 'Please enter a Quantity or Date to apply.', variant: 'alert', severity: 'warning' }));
            return;
        }

        const newTransactions = currentPR.transactions.map(t => {
            let updated = { ...t };
            if (quickFillQty && Number(quickFillQty) > 0) {
                updated.reqQty = Number(quickFillQty);
                updated.amount = (Number(quickFillQty) || 0) * (Number(t.price) || 0);
            }
            if (quickFillDate) {
                updated.reqDate = quickFillDate;
            }
            return updated;
        });

        setField('transactions', newTransactions);
        setQuickFillOpen(false);
        dispatch(openSnackbar({ open: true, message: 'Quick fill applied to all items successfully.', variant: 'alert', severity: 'success' }));
    };

    const handleOpenProductDialog = (rowIndex = null) => {
        setActiveRowIndex(rowIndex);
        const existingIds = (currentPR.transactions || [])
            .map(t => t.itemId)
            .filter(Boolean);
        setSelectedProductIds(existingIds);
        setProductDialogOpen(true);
    };

    const handleToggleProductSelect = (productId) => {
        setSelectedProductIds(prev => {
            const ids = (prev || []).map(id => typeof id === 'object' && id !== null ? (id.id ?? id.value ?? id) : id);
            const exists = ids.some(id => String(id) === String(productId));
            if (exists) {
                return ids.filter(id => String(id) !== String(productId));
            } else {
                return [...ids, productId];
            }
        });
    };

    const handleAddSelectedProducts = () => {
        const ids = (selectedProductIds || []).map(id => typeof id === 'object' && id !== null ? (id.id ?? id.value ?? id) : id);
        const selectedProductsList = products.filter(p => ids.some(id => String(id) === String(p.id)));

        let newTransactions = [...currentPR.transactions];

        if (activeRowIndex !== null && newTransactions[activeRowIndex] && !newTransactions[activeRowIndex].itemId) {
            newTransactions.splice(activeRowIndex, 1);
        }

        let addedCount = 0;
        selectedProductsList.forEach(product => {
            const isDuplicate = newTransactions.some(t => String(t.itemId) === String(product.id));
            if (!isDuplicate) {
                newTransactions.push({
                    itemId: product.id,
                    itemName: product.itemName,
                    itemCode: product.itemCode,
                    hsnCode: product.hsnCode || '',
                    uom: product.uom || 'NOS',
                    productImage: product.productImage || product.photo || '',
                    price: product.price || 0,
                    reqQty: 0,
                    reqDate: new Date().toISOString().split('T')[0],
                    amount: 0,
                    remarks: '',
                    approverId: null
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            setField('transactions', newTransactions);
            dispatch(openSnackbar({ open: true, message: `${addedCount} items added successfully.`, variant: 'alert', severity: 'success' }));
        } else if (selectedProductsList.length > 0) {
            dispatch(openSnackbar({ open: true, message: 'All selected items are already added.', variant: 'alert', severity: 'warning' }));
        }

        setProductDialogOpen(false);
        setSelectedProductIds([]);
        setActiveRowIndex(null);
    };

    const departmentOptions = useMemo(() => {
        return (departments || []).map(d => ({ value: d.id, label: d.departmentName }));
    }, [departments]);

    const plannerOptions = useMemo(() => {
        let filtered = (employees || []).filter(e =>
            currentPR.departmentId ? String(e.departmentId) === String(currentPR.departmentId) : true
        );
        // Fallback: If department has no employees mapped in DB, show all employees
        if (filtered.length === 0 && employees && employees.length > 0) {
            filtered = employees;
        }
        return filtered.map(e => ({ value: e.id, label: e.employeeName }));
    }, [employees, currentPR.departmentId]);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return products;
        const lower = productSearch.toLowerCase();
        return products.filter(p =>
            (p.itemName && p.itemName.toLowerCase().includes(lower)) ||
            (p.itemCode && p.itemCode.toLowerCase().includes(lower))
        );
    }, [products, productSearch]);

    const normalizedSelectedIds = useMemo(() => {
        return (selectedProductIds || []).map(id => typeof id === 'object' && id !== null ? (id.id ?? id.value ?? id) : id);
    }, [selectedProductIds]);

    const productColumns = useMemo(() => [
        {
            id: 'checkbox',
            label: (
                <Checkbox
                    size="small"
                    indeterminate={normalizedSelectedIds.length > 0 && normalizedSelectedIds.length < filteredProducts.length}
                    checked={filteredProducts.length > 0 && normalizedSelectedIds.length === filteredProducts.length}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedProductIds(filteredProducts.map(p => p.id));
                        } else {
                            setSelectedProductIds([]);
                        }
                    }}
                    sx={{ p: 0, color: 'inherit', '&.Mui-checked': { color: 'inherit' }, '&.MuiCheckbox-indeterminate': { color: 'inherit' } }}
                />
            ),
            minWidth: 70,
            align: 'center',
            render: (row) => {
                const isChecked = normalizedSelectedIds.some(id => String(id) === String(row.id));
                return (
                    <Checkbox
                        size="small"
                        checked={isChecked}
                        onChange={(e) => {
                            e.stopPropagation();
                            handleToggleProductSelect(row.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ p: 0 }}
                    />
                );
            }
        },
        { id: 'index', label: 'Sl.No', minWidth: 60, align: 'center' },
        { id: 'itemCode', label: 'Item Code', minWidth: 100 },
        { id: 'itemName', label: 'Item Name', minWidth: 200 },
        { id: 'itemCategory', label: 'Category', minWidth: 120 },
        { id: 'stockQty', label: 'Stock', minWidth: 80, align: 'right', format: (val) => val != null ? val : '0' },
        { id: 'price', label: 'Price', minWidth: 80, align: 'right', format: (val) => val != null ? val : '0.00' },
        { id: 'uom', label: 'UOM', minWidth: 80 }
    ], [normalizedSelectedIds, filteredProducts]);

    const printColumns = useMemo(() => [
        { id: 'itemCode', label: 'Item Code' },
        { id: 'itemName', label: 'Item Description' },
        { id: 'uom', label: 'UOM' },
        { id: 'price', label: 'Price' },
        { id: 'reqQty', label: 'Req Qty' },
        { id: 'reqDate', label: 'Req Date' },
        { id: 'amount', label: 'Amount' },
        { id: 'statusName', label: 'Status' },
        { id: 'remarks', label: 'Remarks' },
    ], []);

    const selectedPlanner = useMemo(() => {
        if (!currentPR.plannerId) return null;
        return employees.find(e => e.id === currentPR.plannerId) || null;
    }, [currentPR.plannerId, employees]);

    const isCurrentUser = selectedPlanner && user && (selectedPlanner.id === user.employeeId || selectedPlanner.employeeName === user.name);


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
                        <ShoppingCart fontSize="medium" />
                    </Avatar>
                    <Box>
                        <Typography variant="h3" fontWeight="800" sx={{
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 0.5
                        }}>
                            {id ? `Purchase Request: ${currentPR.prNo}` : 'New Purchase Request'}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
                            {id ? 'View or modify the details of this request' : 'Create a new request for purchasing items'}
                        </Typography>
                    </Box>
                </Box>
                <Box gap={1.5} display="flex">
                    <Button variant="outlined" sx={{ borderRadius: 2, px: 3, borderWidth: 2, '&:hover': { borderWidth: 2 } }} onClick={() => {
                        if (location.state?.from) {
                            navigate(location.state.from);
                        } else if (location.state?.fromRfqList) {
                            navigate('/purchase/rfq/list');
                        } else {
                            navigate('/purchase/pr/list');
                        }
                    }}>
                        Close
                    </Button>
                    {id && (
                        <>
                            <BOSExportButton
                                variant="outlined"
                                color="secondary"
                                buttonLabel="Print"
                                buttonIcon={<LocalPrintshop />}
                                sx={{ borderRadius: 2 }}
                                data={currentPR?.transactions || []}
                                columns={printColumns}
                                filename={`Purchase_Request_${currentPR?.prNo || id}`}
                                reportName="PURCHASE REQUEST"
                                reportTitle={`DOC. No : ${currentPR?.prNo || id}`}
                                documentDetails={[
                                    { label: 'Department', value: currentPR?.departmentName || currentPR?.departmentId || '-' },
                                    { label: 'Planner', value: currentPR?.plannerName || currentPR?.plannerId || '-' },
                                    { label: 'Remarks', value: currentPR?.remarks || '-' }
                                ]}
                                signatures={[
                                    { label: 'Prepared By', name: currentPR?.plannerName || currentPR?.plannerId || '' },
                                    { label: 'Verified By', name: currentPR?.transactions?.find(t => t.approverName)?.approverName || '' }
                                ]}
                                stampText={getPrStampText(currentPR?.transactions)}
                            />
                            {currentPR.transactions.some((transaction) => isDraftStatus(transaction.statusName)) && (
                                <Button variant="contained" color="info" startIcon={<CheckCircle />} onClick={() => handleAction(purchaseRequestService.submitForApproval, 'Submitted for approval')} sx={{ borderRadius: 2 }}>
                                    Submit
                                </Button>
                            )}
                            {/* <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleAction(purchaseRequestService.approve, 'Approved successfully')} sx={{ borderRadius: 2 }}>
                                Approve
                            </Button>
                            <Button variant="contained" color="error" startIcon={<Cancel />} onClick={() => handleAction(purchaseRequestService.reject, 'Rejected successfully')} sx={{ borderRadius: 2 }}>
                                Reject
                            </Button> */}
                        </>
                    )}
                    {id && !currentPR?.rfqNo && currentPR?.transactions?.every((transaction) => isDraftStatus(transaction.statusName)) && (
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => setDeleteDialogOpen(true)}
                            sx={{ borderRadius: 2, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                        >
                            Delete
                        </Button>
                    )}
                    {!currentPR?.rfqNo && (
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={submitting || !isTableEditable}
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                py: 1,
                                fontWeight: '700',
                                boxShadow: `0 8px 16px ${alpha(theme.palette.warning.main, 0.3)}`,
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 10px 20px ${alpha(theme.palette.warning.main, 0.5)}`,
                                }
                            }}
                        >
                            {submitting ? 'Saving...' : 'Save Request'}
                        </Button>
                    )}
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', width: '100%', gap: 2, alignItems: 'stretch', mb: 2 }}>
                <MainCard pageCode="PP0104" stretch={false} sx={{ flex: 1, borderRadius: 3, boxShadow: theme.shadows[2] }}>
                    <Box sx={{ display: 'flex', width: '100%', gap: 2, alignItems: 'flex-', flexWrap: 'wrap' }}>
                        {/* Department */}
                        <Box sx={{ flex: '1 1 200px' }}>
                            <BOSAutocomplete
                                options={departmentOptions}
                                value={currentPR.departmentId}
                                onChange={(val) => {
                                    const deptId = val && typeof val === 'object' ? val.value : val;
                                    setField('departmentId', deptId);
                                    setField('plannerId', null);
                                    if (deptId) setErrors(prev => ({ ...prev, departmentId: false }));
                                }}
                                label="Department"
                                placeholder="Select Department"
                                sx={errorStyle(!!errors.departmentId)}
                                disabled={!!currentPR?.rfqNo || !isTableEditable}
                            />
                        </Box>

                        {/* Planner */}
                        <Box sx={{ flex: '1 1 200px' }}>
                            <BOSAutocomplete
                                options={plannerOptions}
                                value={currentPR.plannerId}
                                onChange={(val) => {
                                    const planId = val && typeof val === 'object' ? val.value : val;
                                    setField('plannerId', planId);
                                    if (planId) setErrors(prev => ({ ...prev, plannerId: false }));
                                }}
                                label="Planner"
                                placeholder="Select Planner"
                                disabled={!currentPR.departmentId || !!currentPR?.rfqNo || !isTableEditable}
                                sx={errorStyle(!!errors.plannerId)}
                            />
                        </Box>

                        {/* PR From */}
                        <Box sx={{ flex: '0 1 150px' }}>
                            <FormControl fullWidth size="small" disabled={!!currentPR?.rfqNo || !isTableEditable}>
                                <InputLabel>PR From</InputLabel>
                                <Select value={currentPR.prFrom} label="PR From" onChange={e => setField('prFrom', e.target.value)}>
                                    <MenuItem value="REGULAR">REGULAR</MenuItem>
                                    <MenuItem value="PROJECT">PROJECT</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Remarks */}
                        <Box sx={{ flex: '2 1 300px' }}>
                            <BOSTextField
                                fullWidth
                                label="Remarks / Justification"
                                value={currentPR.remarks}
                                onChange={e => setField('remarks', e.target.value)}
                                disableRichText
                                disabled={!!currentPR?.rfqNo || !isTableEditable}
                            />
                        </Box>
                    </Box>
                </MainCard>

                <MainCard stretch={false} sx={{ width: { xs: '100%', md: '250px' }, flexShrink: 0, borderRadius: 3, boxShadow: theme.shadows[2] }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%', justifyContent: 'center' }}>
                        <BOSTextField
                            fullWidth
                            label="PR No"
                            value={currentPR.prNo || ''}
                            placeholder="Auto Generated"
                            disabled
                            sx={{ '& .MuiInputBase-input': { fontWeight: 'bold', color: theme.palette.primary.main } }}
                        />
                        <BOSTextField
                            fullWidth
                            type="date"
                            label="PR Date"
                            InputLabelProps={{ shrink: true }}
                            value={currentPR.prDate}
                            onChange={e => setField('prDate', e.target.value)}
                            disabled={!!currentPR?.rfqNo || !isTableEditable}
                        />
                    </Box>
                </MainCard>
            </Box>

            <Grid container spacing={2} sx={{ mt: 0 }}>


            </Grid>

            {/* Items Section */}
            <Box mt={0}>
                <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 4, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
                        Item Specifications
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {id && !currentPR?.rfqNo && (
                            <Button
                                variant={isTableEditable ? 'contained' : 'outlined'}
                                color={isTableEditable ? 'warning' : 'primary'}
                                onClick={() => setIsTableEditable(!isTableEditable)}
                                sx={{ borderRadius: 2, boxShadow: theme.shadows[1] }}
                            >
                                {isTableEditable ? 'Disable Edit Mode' : 'Enable Edit Mode'}
                            </Button>
                        )}
                        {currentPR?.transactions?.some((transaction) => isPendingStatus(transaction.statusName)) && (
                            <>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleApproveAllItems}
                                    disabled={submitting}
                                    sx={{ borderRadius: 2, boxShadow: theme.shadows[2] }}
                                    startIcon={<Check />}
                                >
                                    Verify All
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={handleRejectAllItems}
                                    disabled={submitting}
                                    sx={{ borderRadius: 2, boxShadow: theme.shadows[2] }}
                                    startIcon={<Close />}
                                >
                                    Reject All
                                </Button>
                            </>
                        )}
                        {isTableEditable && (
                            <>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<FlashOn />}
                                    onClick={() => {
                                        setQuickFillQty('');
                                        setQuickFillDate('');
                                        setQuickFillOpen(true);
                                    }}
                                    sx={{ borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'background.paper' }}
                                >
                                    Quick Fill
                                </Button>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<Add />}
                                    onClick={handleAddRow}
                                    sx={{ borderRadius: 2, boxShadow: theme.shadows[2] }}
                                >
                                    Add Item
                                </Button>
                            </>
                        )}
                    </Box>
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{ ...tableContainerSx, height: 'calc(100vh - 310px)' }}>
                    <Table size="medium" stickyHeader sx={{ height: '100%' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell width={50} sx={tableHeadCellSx}>S.No</TableCell>
                                <TableCell width={350} sx={tableHeadCellSx}>Item *</TableCell>
                                <TableCell sx={tableHeadCellSx}>UOM</TableCell>
                                <TableCell sx={tableHeadCellSx} align="right">Price</TableCell>
                                <TableCell sx={tableHeadCellSx} align="right">Qty</TableCell>
                                <TableCell sx={tableHeadCellSx}>Req Date</TableCell>
                                <TableCell sx={tableHeadCellSx} align="right">Amount</TableCell>
                                <TableCell sx={tableHeadCellSx} width={150}>Approver</TableCell>
                                <TableCell sx={tableHeadCellSx} width={120} align="center">Status</TableCell>
                                <TableCell sx={tableHeadCellSx}>Remarks</TableCell>
                                <TableCell align="center" sx={{ ...tableHeadCellSx, textAlign: 'center' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {currentPR.transactions.length === 0 ? (
                                <TableRow sx={{ height: '100%' }}>
                                    <TableCell colSpan={13} align="center" sx={{ py: 6, color: 'text.secondary', borderBottom: 'none' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 'calc(10vh - 400px)' }}>
                                            <Typography variant="body1" mb={2}>No items added yet.</Typography>
                                            <Button variant="outlined" startIcon={<Add />} onClick={handleAddRow}>
                                                Add Your First Item
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentPR.transactions.map((row, actualIndex) => {
                                    const displayHsnCode = row.hsnCode || (products?.find(p => String(p.id) === String(row.itemId))?.hsnCode) || '';
                                    const isRowEditable = isTableEditable && !isTerminalStatus(row.statusName);
                                    return (
                                        <TableRow key={actualIndex} sx={getTableRowSx(theme, theme.palette.mode === 'dark')}>
                                            <TableCell align="center">
                                                <Typography variant="body2" fontWeight="bold">{actualIndex + 1}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                    <Box sx={{ p: 0.5, border: '1px solid', borderColor: theme.palette.divider, borderRadius: 2, bgcolor: theme.palette.background.paper, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        {row.productImage || companyLogo ? (
                                                            <Tooltip
                                                                title={<img src={row.productImage ? getFileViewUrl(row.productImage) : companyLogo} alt="Preview" style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain' }} />}
                                                                placement="right"
                                                                componentsProps={{ tooltip: { sx: { bgcolor: 'background.paper', boxShadow: theme.shadows[5], p: 1, border: '1px solid', borderColor: 'divider' } } }}
                                                            >
                                                                <Avatar src={row.productImage ? getFileViewUrl(row.productImage) : companyLogo} variant="rounded" sx={{ width: 48, height: 48, '& img': { objectFit: 'contain' }, cursor: 'pointer' }} />
                                                            </Tooltip>
                                                        ) : (
                                                            <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: theme.palette.mode === 'dark' ? '#333' : '#f1f5f9', color: 'text.disabled' }}>
                                                                <Typography variant="caption" fontWeight="bold">IMG</Typography>
                                                            </Avatar>
                                                        )}
                                                    </Box>
                                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 250, flex: 1 }}>
                                                        {isRowEditable ? (
                                                            <BOSTextField
                                                                size="small"
                                                                fullWidth
                                                                value={row.itemName || row.itemCode || row.itemId || ''}
                                                                placeholder="Click to select product..."
                                                                onClick={() => handleOpenProductDialog(actualIndex)}
                                                                InputProps={{ readOnly: true }}
                                                                sx={{ cursor: 'pointer', '& .MuiOutlinedInput-root': { cursor: 'pointer', bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f8fafc' } }}
                                                            />
                                                        ) : (
                                                            <Box sx={{ px: 1.5, py: 1, border: '1px solid', borderColor: theme.palette.divider, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f8fafc' }}>
                                                                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                    {row.itemName || row.itemCode || '-'}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                            {row.itemCode && (
                                                                <Box sx={{ px: 1, py: 0.25, border: `1px solid ${theme.palette.warning.main}`, borderRadius: 1, color: theme.palette.warning.main, fontSize: '0.75rem', fontWeight: 600 }}>
                                                                    {row.itemCode}
                                                                </Box>
                                                            )}
                                                            {displayHsnCode && (
                                                                <Box sx={{ px: 1, py: 0.25, border: `1px solid ${theme.palette.error.main}`, borderRadius: 1, color: theme.palette.error.main, fontSize: '0.75rem', fontWeight: 600 }}>
                                                                    HSN: {displayHsnCode}
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {isRowEditable ? (
                                                    <FormControl fullWidth size="small">
                                                        <Select value={row.uom || ''} onChange={e => updateTransaction(actualIndex, 'uom', e.target.value)}>
                                                            {['NOS', 'KGS', 'MTRS', 'LTRS', 'SETS', 'PCS'].map(u => (
                                                                <MenuItem key={u} value={u}>{u}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                ) : (
                                                    <Typography variant="body2">{row.uom}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {isRowEditable ? (
                                                    <BOSTextField type="number" sx={{ minWidth: 80, '& input': { textAlign: 'right' } }} value={row.price} onChange={e => updateTransaction(actualIndex, 'price', e.target.value)} />
                                                ) : (
                                                    <Typography variant="body2">{parseFloat(row.price || 0).toFixed(2)}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {isRowEditable ? (
                                                    <BOSTextField type="number" sx={{ minWidth: 80, '& input': { textAlign: 'right' } }} value={row.reqQty} onChange={e => updateTransaction(actualIndex, 'reqQty', e.target.value)} />
                                                ) : (
                                                    <Typography variant="body2">{parseFloat(row.reqQty || 0)}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {isRowEditable ? (
                                                    <BOSTextField fullWidth type="date" value={row.reqDate} onChange={e => updateTransaction(actualIndex, 'reqDate', e.target.value)} />
                                                ) : (
                                                    <Typography variant="body2">{row.reqDate}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography fontWeight="bold" color="primary.main">{parseFloat(row.amount || 0).toFixed(2)}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                                                    {isTerminalStatus(row.statusName)
                                                        ? (row.approverName || '-')
                                                        : '-'}
                                                </Typography>
                                                {row.approvedDate && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                        {new Date(row.approvedDate).toLocaleString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <BOSStatusChip status={row.statusName || DEFAULT_STATUS_LABEL} width={STATUS_CHIP_WIDTH_TABLE} />
                                            </TableCell>
                                            <TableCell>
                                                {isRowEditable ? (
                                                    <BOSTextField fullWidth value={row.remarks} onChange={e => updateTransaction(actualIndex, 'remarks', e.target.value)} placeholder="Optional" />
                                                ) : (
                                                    <Typography variant="body2">{row.remarks || '-'}</Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                                {isPendingStatus(row.statusName) && (
                                                    <>
                                                        <IconButton color="success" onClick={() => handleApproveItem(row.id)} title="Verify Item" sx={{ mr: 1, bgcolor: alpha(theme.palette.success.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) } }}>
                                                            <Check fontSize="small" />
                                                        </IconButton>
                                                        <IconButton color="error" onClick={() => handleRejectItem(row.id)} title="Reject Item" sx={{ mr: 1, bgcolor: alpha(theme.palette.error.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) } }}>
                                                            <Close fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                                {isRowEditable && currentPR.transactions.length > 1 && (
                                                    <IconButton color="error" onClick={() => setDeleteConfirmIndex(actualIndex)} title="Delete Item" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) } }}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                            <TableRow sx={{ height: '100%' }}>
                                <TableCell colSpan={13} sx={{ border: 'none', p: 0 }} />
                            </TableRow>
                        </TableBody>
                        <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 2, bgcolor: theme.palette.background.paper, boxShadow: `0px -2px 4px ${alpha(theme.palette.common.black, 0.05)}` }}>
                            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.15) : '#f1f5f9' }}>
                                <TableCell colSpan={6} align="right" sx={{ borderBottom: 'none', py: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">Total</Typography>
                                </TableCell>
                                <TableCell align="right" sx={{ borderBottom: 'none', py: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">{totalQty}</Typography>
                                </TableCell>
                                <TableCell sx={{ borderBottom: 'none', py: 2 }}></TableCell>
                                <TableCell align="right" sx={{ borderBottom: 'none', py: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                                        {totalAmount.toFixed(2)}
                                    </Typography>
                                </TableCell>
                                <TableCell colSpan={4} sx={{ borderBottom: 'none', py: 2 }}></TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>

            </Box>

            <Dialog open={productDialogOpen} onClose={() => { setProductDialogOpen(false); setSelectedProductIds([]); }} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, height: '80vh' } }}>
                <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: '#fff', px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" color="inherit">Select Product</Typography>
                    <BOSTextField
                        placeholder="Search products..."
                        size="small"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        sx={{
                            width: 250,
                            '& .MuiInputBase-root': { bgcolor: 'rgba(255,255,255,0.9)' }
                        }}
                    />
                </DialogTitle>
                <DialogContent sx={{ p: 0, bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                    <BOSDataTable
                        id="purchase-request-product-selection-table"
                        columns={productColumns}
                        data={filteredProducts}
                        onClickRow={(row) => handleToggleProductSelect(row.id)}
                        selectedRowId={selectedProductIds}
                        sx={{ height: '100%', flexGrow: 1 }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => { setProductDialogOpen(false); setSelectedProductIds([]); }} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
                    <Button onClick={handleAddSelectedProducts} variant="contained" color="primary" sx={{ borderRadius: 2 }} disabled={selectedProductIds.length === 0}>Add Selected ({selectedProductIds.length})</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={deleteConfirmIndex !== null} onClose={() => setDeleteConfirmIndex(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to remove this item from the request?</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setDeleteConfirmIndex(null)} color="inherit">Cancel</Button>
                    <Button
                        autoFocus
                        onClick={() => {
                            removeTransaction(deleteConfirmIndex);
                            setDeleteConfirmIndex(null);
                        }}
                        color="error"
                        variant="contained"
                        sx={{ borderRadius: 2 }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Delete Purchase Request</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete Purchase Request <b>{currentPR?.prNo}</b>? This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleDeletePR} color="error" variant="contained">Delete Request</Button>
                </DialogActions>
            </Dialog>

            {/* Quick Fill Dialog */}
            <Dialog open={quickFillOpen} onClose={() => setQuickFillOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Quick Fill Items</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Apply the same Quantity and Required Date to all items in the grid.
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <BOSTextField
                                fullWidth
                                type="number"
                                label="Quantity"
                                value={quickFillQty}
                                onChange={(e) => setQuickFillQty(e.target.value)}
                                placeholder="Enter Quantity"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <BOSTextField
                                fullWidth
                                type="date"
                                label="Required Date"
                                InputLabelProps={{ shrink: true }}
                                value={quickFillDate}
                                onChange={(e) => setQuickFillDate(e.target.value)}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setQuickFillOpen(false)} color="inherit">Cancel</Button>
                    <Button onClick={handleApplyQuickFill} variant="contained" color="primary">Apply to All</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PurchaseRequestEntry;
