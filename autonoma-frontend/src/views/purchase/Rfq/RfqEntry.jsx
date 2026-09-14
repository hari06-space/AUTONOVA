import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Button, Grid, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, IconButton,
    Avatar, useTheme, alpha, Chip, Tooltip, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add, Delete, Send, Save, Close, RequestQuote, History, Check } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSAutocomplete, BOSTextField, tableContainerSx, tableHeadCellSx, getTableRowSx, BOSDataTable } from 'ui-component/bos';
import useAuth from 'hooks/useAuth';
import axios from 'utils/axios';
import rfqService from '../../../api/rfqService';
import purchaseRequestService from '../../../api/purchaseRequestService';
import autonomaLogo from 'assets/images/autonoma-logo.png';
import { getFileViewUrl, getCompanyImageUrl } from 'utils/upload-helper';
import SendRfqDialog from './SendRfqDialog';
import RfqEmailHistoryDialog from './RfqEmailHistoryDialog';
import BOSExportButton from 'ui-component/bos/BOSExportButton';
import { format } from 'date-fns';

const RfqEntry = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const theme = useTheme();
    const { user } = useAuth();

    // ── Form Head State ──────────────────────────────────────
    const [rfqNo, setRfqNo] = useState('AUTO');
    const [rfqDate, setRfqDate] = useState(new Date().toISOString().split('T')[0]);
    const [closingDate, setClosingDate] = useState('');
    const [departmentId, setDepartmentId] = useState(null);
    const [buyerId, setBuyerId] = useState(null);
    const [prRefId, setPrRefId] = useState(null);
    const [commercialTerms, setCommercialTerms] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [statusName, setStatusName] = useState('Draft');
    const [companyLogo, setCompanyLogo] = useState(null);

    // ── Line Items & Suppliers ───────────────────────────────
    const [items, setItems] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [supplierSearchText, setSupplierSearchText] = useState('');

    // ── Master Data ──────────────────────────────────────────
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [products, setProducts] = useState([]);
    const [vendorList, setVendorList] = useState([]);
    const [prList, setPrList] = useState([]);

    const [submitting, setSubmitting] = useState(false);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // ── Product Dialog State ─────────────────────────────────
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState(null);
    const [productSearch, setProductSearch] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState([]);

    // ── Email Dialog State ───────────────────────────────────
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [emailHistory, setEmailHistory] = useState(null);
    const [hasEmailHistory, setHasEmailHistory] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [companyEmail, setCompanyEmail] = useState('');

    // ── Load Master Data ─────────────────────────────────────
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [deptRes, empRes, prodRes, vendorRes, prRes, companyRes] = await Promise.all([
                    axios.get('/api/master/hr/departments'),
                    axios.get('/api/master/hr/employees/list'),
                    axios.get('/api/master/npd/product-master/list'),
                    axios.get('/api/master/vendors?type=supplier'),
                    purchaseRequestService.search({}),
                    axios.get('/api/company-profile/all').catch(() => ({ data: [] }))
                ]);
                setDepartments(deptRes.data || []);
                setEmployees(empRes.data || []);
                setProducts(prodRes.data || []);
                setVendorList(vendorRes.data || []);
                setPrList(prRes.data || []);
                if (companyRes.data && companyRes.data.length > 0) {
                    const comp = companyRes.data[0];
                    if (comp.logoFileName) {
                        setCompanyLogo(comp.logoFileName);
                    }
                    const compMail = comp.smtpUsername || comp.emailId || '';
                    if (compMail) {
                        setCompanyEmail(compMail);
                    }
                }
            } catch (err) {
                console.error('Failed to load master data:', err);
            }
        };
        fetchMasters();
    }, []);

    // ── Auto-set Buyer from logged-in user ───────────────────
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const prIdParam = queryParams.get('prId');
        if (!id && !prIdParam && !prRefId && employees.length > 0 && user) {
            const emp = employees.find(e =>
                (user.empId && String(e.id) === String(user.empId)) ||
                e.employeeName === user.name
            );
            if (emp) setBuyerId(emp.id);
        }
    }, [id, employees, user, location.search, prRefId]);

    // ── Load existing RFQ ────────────────────────────────────
    useEffect(() => {
        if (id) {
            setLoading(true);
            rfqService.getById(id).then(res => {
                const d = res.data;
                setRfqNo(d.rfqNo || 'AUTO');
                setRfqDate(d.rfqDate ? d.rfqDate.split('T')[0] : new Date().toISOString().split('T')[0]);
                setClosingDate(d.closingDate ? d.closingDate.split('T')[0] : '');
                setDepartmentId(d.departmentId || null);
                setBuyerId(d.buyerId || null);
                setPrRefId(d.prRefId || null);
                setCommercialTerms(d.commercialTerms || '');
                setInternalNotes(d.internalNotes || '');
                setStatusName(d.statusName || 'Draft');
                setItems(d.details || []);
                setSuppliers(d.suppliers || []);
                if (d.statusName === 'Sent') {
                    rfqService.getLatestEmail(id).then(res => {
                        setEmailHistory(res.data);
                    }).catch(err => console.error("Failed to load email history", err));
                }
                rfqService.getEmailHistory(id).then(res => {
                    setHasEmailHistory(Array.isArray(res.data) && res.data.length > 0);
                }).catch(() => setHasEmailHistory(false));
            }).catch(() => {
                dispatch(openSnackbar({ open: true, message: 'Failed to load RFQ', variant: 'alert', severity: 'error' }));
            }).finally(() => setLoading(false));
        } else {
            setHasEmailHistory(false);
        }
    }, [id]);

    // ── PR auto-fill ─────────────────────────────────────────
    const handlePrSelect = async (val) => {
        const prId = val && typeof val === 'object' ? val.value : val;
        setPrRefId(prId);
        if (!prId) { setItems([]); return; }
        try {
            const res = await purchaseRequestService.getById(prId);
            const data = res.data;
            if (data) {
                if (data.departmentId) setDepartmentId(data.departmentId);
                if (data.plannerId) setBuyerId(data.plannerId);

                if (data.transactions && data.transactions.length > 0) {
                    const validItems = data.transactions.filter(t => {
                        const s = (t.statusName || '').toLowerCase();
                        return s !== 'rejected' && s !== 'cancelled';
                    });
                    setItems(validItems.map(t => ({
                        prTransId: t.id,
                        productImage: t.productImage,
                        itemId: t.itemId,
                        itemCode: t.itemCode,
                        itemName: t.itemName,
                        uom: t.uom,
                        reqQty: t.reqQty,
                        expectedDeliveryDate: t.reqDate ? t.reqDate.split('T')[0] : new Date().toISOString().split('T')[0],
                        remarks: t.remarks || ''
                    })));
                } else {
                    setItems([]);
                }
            }
        } catch (err) {
            console.error('Failed to load PR:', err);
        }
    };

    // ── Read PR ID from Query Params ─────────────────────────
    useEffect(() => {
        if (!id) {
            const queryParams = new URLSearchParams(location.search);
            const prIdParam = queryParams.get('prId');
            if (prIdParam) {
                handlePrSelect(Number(prIdParam));
            }
        }
    }, [id, location.search]);

    // ── Items CRUD ───────────────────────────────────────────
    const handleAddItem = () => setItems(prev => [...prev, {
        itemId: null, itemCode: '', itemName: '', uom: '',
        reqQty: 1, expectedDeliveryDate: new Date().toISOString().split('T')[0], remarks: ''
    }]);
    const handleRemoveItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
    const handleItemChange = (i, field, value) => setItems(prev => {
        const next = [...prev];
        next[i] = { ...next[i], [field]: value };
        return next;
    });
    const handleToggleProductSelect = (productId) => {
        setSelectedProductIds(prev =>
            prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
        );
    };

    const handleAddSelectedProducts = () => {
        const selectedProductsList = products.filter(p => selectedProductIds.includes(p.id));
        let newItems = [...items];

        if (activeRowIndex !== null && newItems[activeRowIndex] && !newItems[activeRowIndex].itemId) {
            newItems.splice(activeRowIndex, 1);
        }

        let addedCount = 0;
        selectedProductsList.forEach(product => {
            const isDuplicate = newItems.some(t => String(t.itemId) === String(product.id));
            if (!isDuplicate) {
                newItems.push({
                    itemId: product.id,
                    itemName: product.itemName,
                    itemCode: product.itemCode,
                    uom: product.uom || 'NOS',
                    productImage: product.productImage || product.photo || '',
                    reqQty: 1,
                    expectedDeliveryDate: new Date().toISOString().split('T')[0],
                    remarks: ''
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            setItems(newItems);
            dispatch(openSnackbar({ open: true, message: `${addedCount} items added successfully.`, variant: 'alert', severity: 'success' }));
        } else if (selectedProductsList.length > 0) {
            dispatch(openSnackbar({ open: true, message: 'All selected items are already added.', variant: 'alert', severity: 'warning' }));
        }

        setSelectedProductIds([]);
        setProductDialogOpen(false);
    };

    const filteredProducts = useMemo(() => {
        if (!productSearch) return products;
        const lower = productSearch.toLowerCase();
        return products.filter(p =>
            p.itemName?.toLowerCase().includes(lower) ||
            p.itemCode?.toLowerCase().includes(lower)
        );
    }, [products, productSearch]);

    const productColumns = useMemo(() => [
        {
            id: 'productImage', label: 'Image', minWidth: 60, align: 'center', renderCell: (val) => (
                <Avatar variant="rounded" src={val ? getCompanyImageUrl(val) : autonomaLogo} sx={{ width: 40, height: 40, bgcolor: 'transparent', objectFit: 'contain' }} />
            )
        },
        { id: 'itemCode', label: 'Item Code', minWidth: 120 },
        { id: 'itemName', label: 'Item Description', minWidth: 250 },
        { id: 'categoryName', label: 'Category', minWidth: 150 },
        { id: 'uom', label: 'UOM', minWidth: 80 }
    ], []);

    // ── Suppliers CRUD ───────────────────────────────────────
    const handleAddSupplier = () => setSuppliers(prev => [...prev, { supplierId: null, supplierName: '', email: '' }]);
    const handleRemoveSupplier = (i) => setSuppliers(prev => prev.filter((_, idx) => idx !== i));
    const handleSupplierSelect = (i, vendor) => {
        if (vendor) {
            const isDuplicate = suppliers.some((s, index) => index !== i && s.supplierId === vendor.id);
            if (isDuplicate) {
                dispatch(openSnackbar({ open: true, message: 'Supplier already added', variant: 'alert', severity: 'error' }));
                return;
            }
        }

        setSuppliers(prev => {
            const next = [...prev];
            next[i] = {
                ...next[i],
                supplierId: vendor?.id || null,
                supplierName: vendor?.vendorName || vendor?.supplierName || '',
                supplierCode: vendor?.vendorCode || vendor?.supplierCode || '',
                email: vendor?.email || ''
            };
            return next;
        });
    };

    // ── Validate & Build Payload ─────────────────────────────
    const validate = () => {
        const errs = {};
        if (!departmentId) errs.departmentId = 'Department is required';
        if (!buyerId) errs.buyerId = 'Buyer is required';
        if (!closingDate) {
            errs.closingDate = 'Closing date is required';
        } else if (items && items.length > 0) {
            const closing = new Date(closingDate);
            // Check if closing date is after ANY item's expected delivery date
            const invalidItem = items.find(i => {
                if (!i.expectedDeliveryDate) return false;
                return new Date(i.expectedDeliveryDate) < closing;
            });
            if (invalidItem) {
                errs.closingDate = 'Closing date cannot be later than expected delivery date of any item';
            }
        }

        const validSuppliers = suppliers.filter(s => s.supplierId);
        if (validSuppliers.length === 0) {
            errs.suppliers = 'At least one supplier is required';
        } else {
            const uniqueSupplierIds = new Set(validSuppliers.map(s => String(s.supplierId)));
            if (uniqueSupplierIds.size !== validSuppliers.length) {
                errs.suppliers = 'Duplicate suppliers are not allowed';
            }
        }

        if (items.length === 0) {
            errs.items = 'At least one item is required';
        } else {
            if (items.some(i => !i.itemId || Number(i.reqQty) <= 0)) {
                errs.items = 'All items need a valid product and quantity > 0';
            } else {
                const uniqueItemIds = new Set(items.map(i => String(i.itemId)));
                if (uniqueItemIds.size !== items.length) {
                    errs.items = 'Duplicate items are not allowed';
                }
            }
        }

        setErrors(errs);
        return Object.keys(errs).length === 0 ? null : errs;
    };

    const buildPayload = () => ({
        divisionId: user?.divisionId,
        rfqDate: rfqDate ? rfqDate : null,
        closingDate: closingDate ? closingDate : null,
        departmentId: departmentId || null,
        buyerId: buyerId || null,
        prRefId: prRefId || null,
        commercialTerms: commercialTerms || '',
        internalNotes: internalNotes || '',
        details: items.map(i => ({
            id: i.id || null,
            prTransId: i.prTransId || null,
            itemId: i.itemId, itemCode: i.itemCode, itemName: i.itemName,
            uom: i.uom, reqQty: i.reqQty ? Number(i.reqQty) : 0,
            expectedDeliveryDate: i.expectedDeliveryDate ? i.expectedDeliveryDate : null,
            remarks: i.remarks || ''
        })),
        suppliers: suppliers.filter(s => s.supplierId).map(s => ({
            id: s.id || null,
            supplierId: s.supplierId, supplierName: s.supplierName,
            supplierCode: s.supplierCode || '', email: s.email || ''
        }))
    });

    const handleSave = async () => {
        const validationErrs = validate();
        if (validationErrs) {
            dispatch(openSnackbar({ open: true, message: Object.values(validationErrs)[0], variant: 'alert', severity: 'error' }));
            return;
        }
        setSubmitting(true);
        try {
            const res = id ? await rfqService.update(id, buildPayload()) : await rfqService.create(buildPayload());
            dispatch(openSnackbar({ open: true, message: 'RFQ saved successfully', variant: 'alert', severity: 'success' }));
            const queryParams = new URLSearchParams(location.search);
            const isFromPr = queryParams.get('prId') || location.state?.fromPr;
            navigate(`/purchase/rfq/entry/${res.data.id}`, { state: { fromPr: isFromPr }, replace: true });
        } catch (err) {
            dispatch(openSnackbar({ open: true, message: err.response?.data?.message || err.message, variant: 'alert', severity: 'error' }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendToSuppliers = () => {
        if (!id) return;
        setEmailDialogOpen(true);
    };

    const handleDialogSend = async (emailData) => {
        if (!id) return;
        setSending(true);
        try {
            await rfqService.sendEmails(id, emailData);
            dispatch(openSnackbar({ open: true, message: 'RFQ sent to suppliers successfully', variant: 'alert', severity: 'success' }));
            setStatusName('Sent');
            setHasEmailHistory(true);
            setEmailDialogOpen(false);
            const emailRes = await rfqService.getLatestEmail(id);
            setEmailHistory(emailRes.data);
        } catch (err) {
            dispatch(openSnackbar({ open: true, message: err.response?.data?.message || 'Send failed', variant: 'alert', severity: 'error' }));
        } finally {
            setSending(false);
        }
    };

    const handleDialogResend = async (emailData) => {
        if (!id) return;
        try {
            await rfqService.sendEmails(id, emailData);
            dispatch(openSnackbar({ open: true, message: 'RFQ resent to suppliers successfully', variant: 'alert', severity: 'success' }));
            setHasEmailHistory(true);
            const emailRes = await rfqService.getLatestEmail(id);
            setEmailHistory(emailRes.data);
        } catch (err) {
            dispatch(openSnackbar({ open: true, message: err.response?.data?.message || 'Resend failed', variant: 'alert', severity: 'error' }));
        }
    };

    const handleDialogReminder = async (emailData) => {
        if (!id) return;
        try {
            await rfqService.sendEmails(id, { ...emailData, isReminder: true });
            setHasEmailHistory(true);
            dispatch(openSnackbar({ open: true, message: 'Reminder sent to suppliers successfully', variant: 'alert', severity: 'success' }));
        } catch (err) {
            dispatch(openSnackbar({ open: true, message: err.response?.data?.message || 'Reminder send failed', variant: 'alert', severity: 'error' }));
        }
    };

    // ── Options ──────────────────────────────────────────────
    const deptOptions = useMemo(() => departments.map(d => ({ value: d.id, label: d.departmentName })), [departments]);
    const buyerOptions = useMemo(() => employees.map(e => ({ value: e.id, label: e.employeeName })), [employees]);
    const prOptions = useMemo(() =>
        prList
            .filter(p => p.workflowStatus === 'Approved' || p.workflowStatus === 'Verified')
            .filter(p => !p.rfqId || (prRefId && p.id === prRefId))
            .filter(p => (departmentId ? p.departmentId == departmentId : true))
            .filter(p => (buyerId ? p.plannerId == buyerId : true))
            .map(p => ({ value: p.id, label: `${p.prNo}${p.departmentName ? ' — ' + p.departmentName : ''}` })),
        [prList, departmentId, buyerId, prRefId]);
    const vendorOptions = useMemo(() => vendorList.map(v => ({ value: v.id, label: v.vendorName || v.supplierName || `Vendor #${v.id}`, ...v })), [vendorList]);

    const statusLower = (statusName || '').toLowerCase();
    const isReadOnly = statusLower === 'awarded';
    const isSent = statusLower === 'sent';
    const totalSuppliers = suppliers.filter(s => s.supplierId).length;

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
        </Box>
    );

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
                            width: 52,
                            height: 52,
                            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`
                        }}
                    >
                        <RequestQuote fontSize="medium" />
                    </Avatar>
                    <Box>
                        <Typography variant="h3" fontWeight="800" sx={{
                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 0.5
                        }}>
                            {id ? `RFQ : ${rfqNo}` : 'New Request For Quotation'}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                            <Typography variant="subtitle2" color="text.secondary" fontWeight="500">
                                {id ? 'Review or update this RFQ' : 'Fill in the details and add items & suppliers to create a new RFQ'}
                            </Typography>
                            {id && (
                                <Chip label={statusName} size="small"
                                    color={statusName === 'Awarded' ? 'success' : statusName === 'Sent' ? 'info' : 'default'}
                                    sx={{ fontWeight: 700, height: 22 }} />
                            )}
                        </Box>
                    </Box>
                </Box>
                <Box gap={1.5} display="flex">
                    <Button variant="outlined" startIcon={<Close />}
                        onClick={() => {
                            if (location.state?.from) {
                                navigate(location.state.from);
                                return;
                            }
                            const queryParams = new URLSearchParams(location.search);
                            if (location.state?.fromQuotation) {
                                navigate('/purchase/quotation/list');
                            } else if (queryParams.get('prId') || location.state?.fromPr) {
                                navigate('/purchase/pr/list');
                            } else {
                                navigate('/purchase/rfq/list');
                            }
                        }} sx={{ borderRadius: 2 }}>
                        Close
                    </Button>
                    {id && (
                        <BOSExportButton
                            variant="outlined"
                            color="primary"
                            data={items.map((t, index) => ({
                                ...t,
                                sNo: index + 1
                            }))}
                            columns={[
                                { key: 'itemCode', header: 'Item Code' },
                                { key: 'itemName', header: 'Item Description' },
                                { key: 'uom', header: 'UOM' },
                                { key: 'reqQty', header: 'Req Qty' },
                                { key: 'expectedDeliveryDate', header: 'Exp. Delivery' },
                                { key: 'remarks', header: 'Remarks' },
                            ]}
                            filename={`RFQ_${rfqNo || id}`}
                            reportTitle="REQUEST FOR QUOTATION"
                            documentDetails={[
                                { label: 'RFQ No', value: rfqNo || '' },
                                { label: 'RFQ Date', value: rfqDate ? format(new Date(rfqDate), 'dd-MM-yyyy') : '' },
                                { label: 'Closing Date', value: closingDate ? format(new Date(closingDate), 'dd-MM-yyyy') : '' },
                                { label: 'Buyer', value: employees.find(e => e.id === buyerId)?.employeeName || '' },
                                { label: 'Department', value: departments.find(d => d.id === departmentId)?.departmentName || '' },
                                { label: 'PR Ref No', value: prList.find(p => p.id === prRefId)?.prNo || '' },
                                { label: 'Commercial Terms', value: commercialTerms || '' }

                            ]}
                            sx={{ borderRadius: 2 }}
                        />
                    )}
                    {id && hasEmailHistory && (
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<History />}
                            onClick={() => setHistoryOpen(true)}
                            sx={{ borderRadius: 2 }}
                        >
                            History
                        </Button>
                    )}
                    {id && !isReadOnly && (
                        <Button variant="outlined" color="primary"
                            startIcon={sending ? <CircularProgress size={14} /> : <Send />}
                            onClick={handleSendToSuppliers} disabled={sending} sx={{ borderRadius: 2 }}>
                            {isSent ? (sending ? 'Sending...' : 'Resend RFQ') : (sending ? 'Sending...' : 'Send RFQ')}
                        </Button>
                    )}
                    {!isReadOnly && (
                        <Button
                            variant="contained"
                            color="warning"
                            startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <Save />}
                            onClick={handleSave} disabled={submitting}
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
                            {submitting ? 'Saving...' : id ? 'Update' : 'Save RFQ'}
                        </Button>
                    )}
                </Box>
            </Paper>

            <Box sx={{ display: 'flex', width: '100%', gap: 2, alignItems: 'stretch', mb: 2 }}>
                {/* Request Details */}
                <MainCard stretch={false} sx={{ flex: 1, borderRadius: 3, boxShadow: theme.shadows[2] }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2} sx={{ color: theme.palette.text.secondary }}>
                        Request Details
                    </Typography>
                    <Box sx={{ display: 'flex', width: '100%', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <Box sx={{ flex: '1 1 200px' }}>
                            <BOSAutocomplete label="Department" options={deptOptions}
                                value={departmentId} onChange={val => setDepartmentId(val && typeof val === 'object' ? val.value : val)} disabled={isReadOnly} />
                        </Box>
                        <Box sx={{ flex: '1 1 200px' }}>
                            <BOSAutocomplete label="Buyer / Requester" options={buyerOptions}
                                value={buyerId} onChange={val => setBuyerId(val && typeof val === 'object' ? val.value : val)} disabled={isReadOnly} />
                        </Box>
                        <Box sx={{ flex: '1 1 200px' }}>
                            <BOSAutocomplete
                                label="PR Reference (Optional)"
                                options={prOptions}
                                value={prRefId}
                                onChange={val => handlePrSelect(val)}
                                disabled={isReadOnly || !!id}
                            />
                        </Box>
                    </Box>
                </MainCard>

                {/* Document Info */}
                <MainCard stretch={false} sx={{
                    borderRadius: 3,
                    boxShadow: theme.shadows[2],
                    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.1) : alpha(theme.palette.primary.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    p: 0,
                    overflow: 'hidden',
                    flexShrink: 0
                }}>
                    <Box sx={{ p: 0, pt: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{
                            background: theme.palette.mode === 'dark'
                                ? `linear-gradient(to right, ${alpha(theme.palette.primary.dark, 0.5)}, ${alpha(theme.palette.primary.dark, 0.0)})`
                                : `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.15)}, ${alpha(theme.palette.primary.main, 0.0)})`,
                            px: 1,
                            py: 0.5,
                            mb: 1,
                            borderRadius: 1
                        }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: theme.palette.primary.main }}>
                                Document Info
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, px: 2, pb: 2, flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
                            <Box sx={{ flex: '1 1 150px' }}>
                                <BOSTextField
                                    fullWidth
                                    label="RFQ No"
                                    value={rfqNo}
                                    placeholder="Auto Generated"
                                    disabled
                                    sx={{
                                        bgcolor: theme.palette.background.paper,
                                        borderRadius: 2,
                                        '& .MuiOutlinedInput-root': { borderRadius: 2, fieldset: { borderColor: alpha(theme.palette.primary.main, 0.1) } },
                                        '& .MuiInputBase-input': { fontWeight: 'bold' }
                                    }}
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 150px' }}>
                                <BOSTextField
                                    fullWidth
                                    type="date"
                                    label="RFQ Date"
                                    InputLabelProps={{ shrink: true }}
                                    value={rfqDate}
                                    onChange={e => setRfqDate(e.target.value)}
                                    disabled={isReadOnly}
                                    sx={{
                                        bgcolor: theme.palette.background.paper,
                                        borderRadius: 2,
                                        '& .MuiOutlinedInput-root': { borderRadius: 2, fieldset: { borderColor: alpha(theme.palette.primary.main, 0.1) } }
                                    }}
                                />
                            </Box>
                            <Box sx={{ flex: '1 1 150px' }}>
                                <BOSTextField fullWidth label="Closing Date *" type="date" value={closingDate}
                                    onChange={e => setClosingDate(e.target.value)} disabled={isReadOnly}
                                    error={!!errors.closingDate} helperText={errors.closingDate}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        bgcolor: theme.palette.background.paper,
                                        borderRadius: 2,
                                        '& .MuiOutlinedInput-root': { borderRadius: 2, fieldset: { borderColor: alpha(theme.palette.primary.main, 0.1) } }
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                </MainCard>
            </Box>

            {/* ── Requisition Items ──────────────────────────────── */}
            <Box mt={2}>
                <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 4, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
                        Requisition Items
                        {items.length > 0 && (
                            <Chip label={items.length} size="small" color="primary" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                        )}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {!isReadOnly && (
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<Add />}
                                onClick={handleAddItem}
                                sx={{ borderRadius: 2, boxShadow: theme.shadows[2] }}
                            >
                                Add Item
                            </Button>
                        )}
                    </Box>
                </Box>

                {errors.items && (
                    <Typography color="error" variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600, pl: 1 }}>{errors.items}</Typography>
                )}

                <TableContainer component={Paper} elevation={0} sx={{ ...tableContainerSx, maxHeight: 400 }}>
                    <Table size="medium" stickyHeader sx={{ height: '100%' }}>
                        <TableHead>
                            <TableRow>
                                <TableCell width={50} sx={tableHeadCellSx}>S.No</TableCell>
                                <TableCell width={350} sx={tableHeadCellSx}>Item *</TableCell>
                                <TableCell width={70} sx={tableHeadCellSx}>UOM</TableCell>
                                <TableCell width={100} align="right" sx={tableHeadCellSx}>Qty</TableCell>
                                <TableCell width={140} sx={tableHeadCellSx}>Expected Delivery</TableCell>
                                <TableCell sx={tableHeadCellSx}>Remarks</TableCell>
                                {!isReadOnly && <TableCell align="center" width={48} sx={tableHeadCellSx}>Action</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        <Typography variant="body1" mb={2}>No items added yet.</Typography>
                                        <Button variant="outlined" startIcon={<Add />} onClick={handleAddItem}>
                                            Add your first item
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ) : items.map((item, idx) => (
                                <TableRow key={idx} sx={getTableRowSx(theme, theme.palette.mode === 'dark')}>
                                    <TableCell align="center">
                                        <Typography variant="body2" fontWeight="bold">{idx + 1}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                            <Box sx={{ p: 0.5, border: '1px solid', borderColor: theme.palette.divider, borderRadius: 2, bgcolor: theme.palette.background.paper, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                {item.productImage || companyLogo ? (
                                                    <Tooltip
                                                        title={<img src={item.productImage ? getFileViewUrl(item.productImage) : getCompanyImageUrl(companyLogo)} alt="Preview" style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain' }} />}
                                                        placement="right"
                                                        componentsProps={{ tooltip: { sx: { bgcolor: 'background.paper', boxShadow: theme.shadows[5], p: 1, border: '1px solid', borderColor: 'divider' } } }}
                                                    >
                                                        <Avatar src={item.productImage ? getFileViewUrl(item.productImage) : getCompanyImageUrl(companyLogo)} variant="rounded" sx={{ width: 48, height: 48, '& img': { objectFit: 'contain' }, cursor: 'pointer' }} />
                                                    </Tooltip>
                                                ) : (
                                                    <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: theme.palette.mode === 'dark' ? '#333' : '#f1f5f9', color: 'text.disabled' }}>
                                                        <Typography variant="caption" fontWeight="bold">IMG</Typography>
                                                    </Avatar>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 250, flex: 1 }}>
                                                {isReadOnly ? (
                                                    <Box sx={{ px: 1.5, py: 1, border: '1px solid', borderColor: theme.palette.divider, borderRadius: 2, bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f8fafc' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {item.itemName || item.itemCode || '-'}
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <BOSTextField
                                                        size="small"
                                                        fullWidth
                                                        value={item.itemName || item.itemCode || item.itemId || ''}
                                                        placeholder="Click to select product..."
                                                        onClick={() => {
                                                            if (isReadOnly) return;
                                                            setActiveRowIndex(idx);
                                                            setProductDialogOpen(true);
                                                        }}
                                                        InputProps={{ readOnly: true }}
                                                        sx={{ cursor: 'pointer', '& .MuiOutlinedInput-root': { cursor: 'pointer', bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f8fafc' } }}
                                                    />
                                                )}
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                    {item.itemCode && (
                                                        <Box sx={{ px: 1, py: 0.25, border: `1px solid ${theme.palette.warning.main}`, borderRadius: 1, color: theme.palette.warning.main, fontSize: '0.75rem', fontWeight: 600 }}>
                                                            {item.itemCode}
                                                        </Box>
                                                    )}
                                                    {(item.hsnCode || (products?.find(p => String(p.id) === String(item.itemId))?.hsnCode)) && (
                                                        <Box sx={{ px: 1, py: 0.25, border: `1px solid ${theme.palette.error.main}`, borderRadius: 1, color: theme.palette.error.main, fontSize: '0.75rem', fontWeight: 600 }}>
                                                            HSN: {item.hsnCode || (products?.find(p => String(p.id) === String(item.itemId))?.hsnCode)}
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={item.uom || '—'} size="small" variant="outlined"
                                            sx={{ fontSize: '0.7rem', height: 20 }} />
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1 }}>
                                        {isReadOnly ? (
                                            <Typography variant="body2" fontWeight={700}>{item.reqQty}</Typography>
                                        ) : (
                                            <BOSTextField size="small" type="number" value={item.reqQty}
                                                onChange={e => handleItemChange(idx, 'reqQty', e.target.value)}
                                                inputProps={{ min: 0.01, step: 0.01, style: { textAlign: 'right', fontWeight: 700, width: 70 } }} />
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                        {isReadOnly ? (
                                            <Typography variant="body2">{item.expectedDeliveryDate}</Typography>
                                        ) : (
                                            <BOSTextField size="small" type="date" value={item.expectedDeliveryDate}
                                                onChange={e => handleItemChange(idx, 'expectedDeliveryDate', e.target.value)}
                                                InputLabelProps={{ shrink: true }} />
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ py: 1 }}>
                                        {isReadOnly ? (
                                            <Typography variant="body2">{item.remarks}</Typography>
                                        ) : (
                                            <BOSTextField size="small" value={item.remarks}
                                                onChange={e => handleItemChange(idx, 'remarks', e.target.value)}
                                                placeholder="Optional..." />
                                        )}
                                    </TableCell>
                                    {!isReadOnly && (
                                        <TableCell align="center" sx={{ py: 1 }}>
                                            <Tooltip title="Remove">
                                                <IconButton size="small" color="error" onClick={() => handleRemoveItem(idx)}>
                                                    <Delete sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* ── Invited Suppliers ──────────────────────────────── */}
            <Box mt={3} mb={3}>
                <Box sx={{ p: 1, display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 4, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
                        Invited Suppliers
                        {totalSuppliers > 0 && (
                            <Chip label={totalSuppliers} size="small" color="primary" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                        )}
                    </Typography>
                </Box>

                <MainCard stretch={false} sx={{ borderRadius: 3, boxShadow: theme.shadows[2], overflow: 'hidden' }}>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: 'minmax(240px, 1fr) minmax(0, 3fr)', md: 'minmax(220px, 1fr) minmax(0, 2fr)' },
                        gap: { xs: 2, md: 2.5 },
                        alignItems: 'start',
                        width: '100%',
                        minWidth: 0
                    }}>
                        {/* Left Column: Search / Add Supplier (~25%) */}
                        <Box sx={{
                            p: { xs: 2, md: 2.5 },
                            borderRadius: 2.5,
                            border: '1px solid',
                            borderColor: theme.palette.divider,
                            bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.5) : '#fcfcfd',
                            minWidth: 0,
                            boxSizing: 'border-box'
                        }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.primary' }}>
                                Add Supplier
                            </Typography>
                            {!isReadOnly ? (
                                <Box>
                                    <BOSAutocomplete
                                        name="rfq_suppliers_search"
                                        placeholder="SEARCH AND ADD A SUPPLIER..."
                                        options={vendorOptions}
                                        value={null}
                                        inputValue={supplierSearchText}
                                        onInputChange={(event, newInputValue, reason) => {
                                            if (reason === 'input') {
                                                setSupplierSearchText(newInputValue);
                                            } else if (reason === 'clear' || reason === 'reset') {
                                                setSupplierSearchText('');
                                            }
                                        }}
                                        disableCloseOnSelect={true}
                                        getOptionDisabled={(option) => suppliers.some(s => s.supplierId === (option?.value || option?.id))}
                                        renderOption={(props, option) => {
                                            const { key, ...otherProps } = props;
                                            const isSelected = suppliers.some(s => s.supplierId === (option?.value || option?.id));
                                            return (
                                                <li
                                                    key={key || (option?.value || option?.id)}
                                                    {...otherProps}
                                                    style={{
                                                        ...otherProps.style,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '8px 12px',
                                                        opacity: isSelected ? 0.6 : 1,
                                                        cursor: isSelected ? 'not-allowed' : 'pointer',
                                                        backgroundColor: isSelected ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fafc') : undefined
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: isSelected ? 'text.disabled' : 'text.primary',
                                                            fontWeight: isSelected ? 400 : 500
                                                        }}
                                                    >
                                                        {option.label || option.vendorName || option.supplierName}
                                                    </Typography>
                                                    {isSelected && (
                                                        <Check
                                                            sx={{
                                                                fontSize: 18,
                                                                color: theme.palette.primary.main,
                                                                ml: 1,
                                                                flexShrink: 0
                                                            }}
                                                        />
                                                    )}
                                                </li>
                                            );
                                        }}
                                        onChange={val => {
                                            setSupplierSearchText('');
                                            if (!val) return;
                                            const selectedId = val && typeof val === 'object' ? val.value : val;
                                            if (suppliers.some(s => s.supplierId === selectedId)) return;
                                            const vendor = vendorList.find(v => v.id === selectedId);
                                            if (vendor) {
                                                setSuppliers(prev => [...prev, {
                                                    supplierId: vendor.id,
                                                    supplierName: vendor.vendorName || vendor.supplierName || '',
                                                    supplierCode: vendor.vendorCode || vendor.supplierCode || '',
                                                    email: vendor.email || vendor.vendorEmail || ''
                                                }].filter(s => s.supplierId));
                                            }
                                        }}
                                        error={!!errors.suppliers}
                                        helperText={errors.suppliers || "Select a supplier to add them to the invitation list."}
                                    />
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    RFQ is in read-only mode.
                                </Typography>
                            )}
                        </Box>

                        {/* Right Column: Selected Suppliers (~75%) */}
                        <Box sx={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: theme.palette.primary.main }}>
                                Selected Suppliers {totalSuppliers > 0 ? `(${totalSuppliers})` : ''}
                            </Typography>

                            {suppliers.filter(s => s.supplierId).length === 0 ? (
                                <Box sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    borderRadius: 2.5,
                                    border: '1px dashed',
                                    borderColor: theme.palette.divider,
                                    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.3) : 'grey.50'
                                }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No suppliers added yet. Select a supplier from the left panel.
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: 'repeat(2, minmax(0, 1fr))',
                                        md: 'repeat(2, minmax(0, 1fr))',
                                        lg: 'repeat(3, minmax(0, 1fr))'
                                    },
                                    gap: 1.5,
                                    width: '100%',
                                    minWidth: 0,
                                    boxSizing: 'border-box'
                                }}>
                                    {suppliers.filter(s => s.supplierId).map((s, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: 1.25,
                                                borderRadius: 2.5,
                                                border: '1px solid',
                                                borderColor: theme.palette.divider,
                                                bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#ffffff',
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                                                minWidth: 0,
                                                boxSizing: 'border-box',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                                    borderColor: alpha(theme.palette.primary.main, 0.4)
                                                }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1, mr: 1 }}>
                                                <Avatar sx={{
                                                    bgcolor: theme.palette.primary.main,
                                                    color: '#fff',
                                                    fontWeight: 'bold',
                                                    width: 32,
                                                    height: 32,
                                                    fontSize: '0.85rem',
                                                    flexShrink: 0
                                                }}>
                                                    {s.supplierName?.charAt(0)?.toUpperCase() || 'S'}
                                                </Avatar>
                                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                                    <Tooltip title={s.supplierName || ''} arrow placement="top" disableInteractive>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={600}
                                                            sx={{
                                                                lineHeight: 1.2,
                                                                color: 'text.primary',
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                display: 'block'
                                                            }}
                                                        >
                                                            {s.supplierName}
                                                        </Typography>
                                                    </Tooltip>
                                                    {s.email ? (
                                                        <Tooltip title={s.email} arrow placement="bottom" disableInteractive>
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: 'text.secondary',
                                                                    fontSize: '0.7rem',
                                                                    display: 'block',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}
                                                            >
                                                                {s.email}
                                                            </Typography>
                                                        </Tooltip>
                                                    ) : (
                                                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', display: 'block' }}>
                                                            No email
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                            {!isReadOnly && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setSuppliers(prev => prev.filter((_, i) => i !== idx));
                                                    }}
                                                    sx={{
                                                        p: 0.5,
                                                        color: theme.palette.primary.main,
                                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                        '&:hover': {
                                                            bgcolor: alpha(theme.palette.error.main, 0.12),
                                                            color: theme.palette.error.main
                                                        }
                                                    }}
                                                    title="Remove supplier"
                                                >
                                                    <Close sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </MainCard>
            </Box>

            {/* Terms & Notes - Moved to bottom */}
            <Box mt={3} mb={3}>
                <MainCard stretch={false} sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Box sx={{ width: 4, height: 16, bgcolor: 'primary.main', borderRadius: 1 }} />
                        <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main' }}>
                            Terms & Notes
                        </Typography>
                    </Box>
                    <Grid container spacing={3} xs={12} md={12} lg={12}>
                        <Grid item xs={12} md={6} sx={{ width: "40%" }}>
                            <BOSTextField label="Commercial Terms" sx={{ width: "350px" }}
                                value={commercialTerms} onChange={e => setCommercialTerms(e.target.value)}
                                disabled={isReadOnly} placeholder="e.g. FOB, CIF, Ex-Works" multiline rows={4} disableRichText />
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ width: "40%" }}>
                            <BOSTextField label="Internal Notes" sx={{ width: "350px" }}
                                value={internalNotes} onChange={e => setInternalNotes(e.target.value)}
                                disabled={isReadOnly} multiline rows={4} placeholder="Notes visible only to your team..." disableRichText />
                        </Grid>
                    </Grid>
                </MainCard>
            </Box>

            <SendRfqDialog
                open={emailDialogOpen}
                mode={isSent ? 'resend' : 'edit'}
                rfqId={id}
                rfqNo={rfqNo}
                companyEmail={companyEmail}
                items={items}
                suppliers={suppliers}
                documentDetails={[
                    { label: 'RFQ No', value: rfqNo || '' },
                    { label: 'RFQ Date', value: rfqDate ? format(new Date(rfqDate), 'dd-MM-yyyy') : '' },
                    { label: 'Closing Date', value: closingDate ? format(new Date(closingDate), 'dd-MM-yyyy') : '' },
                    { label: 'Buyer', value: employees.find(e => e.id === buyerId)?.employeeName || '' },
                    { label: 'Department', value: departments.find(d => d.id === departmentId)?.departmentName || '' },
                    { label: 'PR Ref No', value: prList.find(p => p.id === prRefId)?.prNo || '' },
                    { label: 'Commercial Terms', value: commercialTerms || '' },
                    { label: 'Remarks', value: internalNotes || '' }
                ]}
                initialSubject={emailHistory?.subject}
                initialContent={emailHistory?.content}
                initialFromEmail={emailHistory?.fromEmail || companyEmail}
                initialCcEmail={emailHistory?.ccEmail}
                sentBy={emailHistory?.sentBy}
                sentDate={emailHistory?.sentDate}
                onSend={handleDialogSend}
                onResend={handleDialogResend}
                onReminder={handleDialogReminder}
                onClose={() => setEmailDialogOpen(false)}
            />

            <RfqEmailHistoryDialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                rfqId={id}
                rfqNo={rfqNo}
            />

            {/* Product Selection Dialog */}
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
        </Box>
    );
};

export default RfqEntry;
