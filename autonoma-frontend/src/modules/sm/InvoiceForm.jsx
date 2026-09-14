import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Grid,
  Box,
  Button,
  Typography,
  Stack,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  useTheme,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Alert,
  Card,
  CardContent,
  alpha,
  Checkbox
} from '@mui/material';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
  IconSearch,
  IconX,
  IconAlertTriangle,
  IconFileText,
  IconLock,
  IconPencil
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import useConfig from 'hooks/useConfig';
import { formatDateTime } from 'utils/BOSTimeUtils';
import MainCard from 'ui-component/cards/MainCard';
import { BOSTextField, BOSFormSection, BOSAutocomplete, BOSPageHeader } from 'ui-component/bos';

const INITIAL_STATE = {
  invoiceNo: '',
  invoiceDate: '',
  customerId: '',
  billingAddressId: '',
  shippingAddressId: '',
  sameAsBilling: true,
  paymentTerms: '30 Days',
  deliveryTerms: 'Ex-Works',
  currencyCode: 'INR',
  exchangeRate: '1.0000',
  remarks: '',
  customerPo: '',
  refDcNos: '',
  dcIds: [],
  invoiceDetails: [],
  invoiceCharges: [],
  roundOff: '0.00',
  additionalCharges: '0.00'
};

export default function InvoiceForm() {
  const theme = useTheme();
  const { timeFormat, dateFormat } = useConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [customers, setCustomers] = useState([]);
  const [billingAddresses, setBillingAddresses] = useState([]);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [chargeMasters, setChargeMasters] = useState([]);

  // UI state for adding invoice item
  const [showAddRow, setShowAddRow] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [partsList, setPartsList] = useState([]);
  const [selectedPartLine, setSelectedPartLine] = useState(null);
  const [invoiceQty, setInvoiceQty] = useState('');
  const [itemDiscount, setItemDiscount] = useState('0.00');
  const [itemTaxCode, setItemTaxCode] = useState('GST 18%');
  const [itemError, setItemError] = useState('');

  // Part Master Search Modal (Case 2 Selection)
  const [showPartModal, setShowPartModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalParts, setModalParts] = useState([]);
  const [modalPage, setModalPage] = useState(0);
  const [modalHasMore, setModalHasMore] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const modalObserver = useRef();

  // Confirmation dialogs
  const [showCustomerChangeWarning, setShowCustomerChangeWarning] = useState(false);
  const [pendingCustomer, setPendingCustomer] = useState(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeIndex, setRemoveIndex] = useState(null);

  // Dropdown lists (fetched from DB)
  const [paymentTermsList, setPaymentTermsList] = useState([]);
  const [deliveryTermsList, setDeliveryTermsList] = useState([]);
  const [currenciesList, setCurrenciesList] = useState([]);

  // Fetch Customers, Charge Masters, and dropdown lists from DB
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [custRes, chargeRes, ptRes, dtRes, curRes] = await Promise.all([
          axios.get(API_PATHS.SM.CUSTOMERS),
          axios.get('/api/sm/additional-charges'),
          axios.get('/api/payment-terms'),
          axios.get('/api/delivery-terms'),
          axios.get('/api/admin/currency')
        ]);
        const isActive = (m) => m && (m.status === true || m.status === 1 || m.status === 'Active' || m.status === 'ACTIVE' || m.status === undefined || m.status === null);
        setCustomers(custRes.data || []);
        setChargeMasters(chargeRes.data || []);
        setPaymentTermsList(ptRes.data ? ptRes.data.filter(isActive) : []);
        setDeliveryTermsList(dtRes.data ? dtRes.data.filter(isActive) : []);
        setCurrenciesList(curRes.data ? curRes.data.filter(isActive) : []);
      } catch (err) {
        console.error('Failed to load base data:', err);
      }
    };
    fetchBaseData();
  }, []);

  // Load existing invoice or fetch next number if new
  useEffect(() => {
    if (isEditing) {
      const loadInvoice = async () => {
        try {
          const response = await axios.get(`${API_PATHS.SM.INVOICES}/${id}`);
          const data = response.data;
          setFormData({
            ...data,
            invoiceDate: data.invoiceDate ? data.invoiceDate : '',
            sameAsBilling: data.billingAddressId === data.shippingAddressId,
            roundOff: parseFloat(data.roundOff || 0).toFixed(2),
            additionalCharges: parseFloat(data.additionalCharges || 0).toFixed(2)
          });
          if (data.customerId) {
            loadAddresses(data.customerId);
            loadOpenOrders(data.customerId);
          }
        } catch (err) {
          console.error('Failed to load invoice:', err);
          dispatch(openSnackbar({ open: true, message: 'Failed to load invoice data.', variant: 'alert', severity: 'error' }));
        }
      };
      loadInvoice();
    } else {
      const fetchNextInvoiceNo = async () => {
        try {
          const response = await axios.get(`${API_PATHS.SM.INVOICES}/next-number`);
          if (response.data && response.data.invoiceNo) {
            setFormData(prev => ({ ...prev, invoiceNo: response.data.invoiceNo }));
          }
        } catch (err) {
          console.error('Failed to fetch next invoice number:', err);
        }
      };
      fetchNextInvoiceNo();

      const fromDcs = location.state?.fromDcs;
      if (fromDcs) {
        setFormData(prev => ({
          ...prev,
          customerId: fromDcs.customerId,
          billingAddressId: fromDcs.billingAddressId,
          shippingAddressId: fromDcs.shippingAddressId,
          paymentTerms: fromDcs.paymentTerms || prev.paymentTerms,
          deliveryTerms: fromDcs.deliveryTerms || prev.deliveryTerms,
          currencyCode: fromDcs.currencyCode || 'INR',
          exchangeRate: fromDcs.exchangeRate || '1.0000',
          customerPo: fromDcs.customerPo || '',
          refDcNos: fromDcs.refDcNos || '',
          dcIds: fromDcs.dcIds || [],
          invoiceDetails: fromDcs.invoiceDetails || [],
          invoiceCharges: fromDcs.invoiceCharges || [],
          remarks: fromDcs.refDcNos ? `Generated against DC: ${fromDcs.refDcNos}` : ''
        }));
        if (fromDcs.customerId) {
          loadAddresses(fromDcs.customerId);
          loadOpenOrders(fromDcs.customerId);
        }
      }
    }
  }, [id, isEditing, location.state, dispatch]);

  const loadAddresses = async (custId) => {
    try {
      const response = await axios.get(`/api/sm/customer-details?customerId=${custId}`);
      const list = response.data || [];
      setBillingAddresses(list);
      setShippingAddresses(list);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  const loadOpenOrders = async (custId) => {
    try {
      const response = await axios.get(`${API_PATHS.SM.INVOICES}/customer/${custId}/open-orders`);
      setOpenOrders(response.data || []);
    } catch (err) {
      console.error('Failed to load open orders:', err);
    }
  };

  // Pre-select default address
  useEffect(() => {
    if (billingAddresses.length > 0 && !formData.billingAddressId) {
      const def = billingAddresses.find(a => a.status === 'Active') || billingAddresses[0];
      setFormData(prev => ({ ...prev, billingAddressId: def.id }));
    }
  }, [billingAddresses, formData.billingAddressId]);

  useEffect(() => {
    if (shippingAddresses.length > 0 && !formData.shippingAddressId) {
      const def = shippingAddresses.find(a => a.status === 'Active') || shippingAddresses[0];
      setFormData(prev => ({ ...prev, shippingAddressId: def.id }));
    }
  }, [shippingAddresses, formData.shippingAddressId]);

  // Sync addresses if sameAsBilling is toggled
  useEffect(() => {
    if (formData.sameAsBilling && formData.billingAddressId) {
      setFormData(prev => ({ ...prev, shippingAddressId: prev.billingAddressId }));
    }
  }, [formData.sameAsBilling, formData.billingAddressId]);

  // Handle Customer Change
  const handleCustomerChange = (event, val) => {
    if (!val) {
      resetCustomerState();
      return;
    }

    if (formData.invoiceDetails.length > 0) {
      setPendingCustomer(val);
      setShowCustomerChangeWarning(true);
    } else {
      applyCustomerChange(val);
    }
  };

  const confirmCustomerChange = () => {
    if (pendingCustomer) {
      applyCustomerChange(pendingCustomer);
    }
    setShowCustomerChangeWarning(false);
    setPendingCustomer(null);
  };

  const applyCustomerChange = async (cust) => {
    const currency = cust.currencyCode || 'INR';
    setFormData(prev => ({
      ...prev,
      customerId: cust.id,
      billingAddressId: '',
      shippingAddressId: '',
      paymentTerms: cust.paymentTerms || '30 Days',
      deliveryTerms: cust.deliveryTerms || 'Ex-Works',
      currencyCode: currency,
      exchangeRate: currency === 'INR' ? '1.00' : '0.00',
      invoiceDetails: [],
      invoiceCharges: [],
      roundOff: '0.00',
      additionalCharges: '0.00'
    }));
    loadAddresses(cust.id);
    loadOpenOrders(cust.id);
    setSelectedOrder(null);
    setSelectedPartLine(null);
    setShowAddRow(false);

    if (currency !== 'INR') {
      try {
        const response = await fetch(`https://api.frankfurter.dev/v2/rate/${currency}/INR`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.rate) {
            setFormData(prev => ({ ...prev, exchangeRate: Number(data.rate).toFixed(4) }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch exchange rate:', err);
      }
    }
  };

  const handleCurrencyChange = async (event) => {
    const val = event.target.value;
    setFormData(prev => ({
      ...prev,
      currencyCode: val,
      exchangeRate: val === 'INR' ? '1.0000' : '0.0000'
    }));

    if (val && val !== 'INR') {
      try {
        console.log(`Fetching rate for ${val}...`);
        const response = await fetch(`https://api.frankfurter.dev/v2/rate/${val}/INR`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.rate) {
            console.log(`Fetched rate for ${val}:`, data.rate);
            setFormData(prev => ({ ...prev, exchangeRate: Number(data.rate).toFixed(4) }));
          }
        } else {
          console.error(`Frankfurter API returned status ${response.status}`);
        }
      } catch (err) {
        console.error('Failed to fetch exchange rate:', err);
        dispatch(openSnackbar({
          open: true,
          message: `Failed to fetch exchange rate for ${val}. Please enter manually.`,
          variant: 'alert',
          severity: 'error'
        }));
      }
    }
  };

  const resetCustomerState = () => {
    setFormData(INITIAL_STATE);
    setBillingAddresses([]);
    setShippingAddresses([]);
    setOpenOrders([]);
    setSelectedOrder(null);
    setSelectedPartLine(null);
    setShowAddRow(false);
  };

  // Order Number Change
  const handleOrderChange = (event) => {
    const orderId = event.target.value;
    const orderObj = openOrders.find(o => o.id === orderId);
    setSelectedOrder(orderObj);
    setPartsList(orderObj ? orderObj.eligibleLines : []);
    setSelectedPartLine(null);
    setItemError('');
  };

  // Part Selection from Dropdown (Case 1)
  const handlePartChange = (event) => {
    const lineId = event.target.value;
    const lineObj = partsList.find(p => p.id === lineId);
    setSelectedPartLine(lineObj);
    if (lineObj) {
      setInvoiceQty(lineObj.balanceQty.toString());
    }
    setItemError('');
  };

  // Part Selection from Modal (Case 2)
  const openPartModal = () => {
    if (!formData.customerId) {
      dispatch(openSnackbar({ open: true, message: 'Please select a Customer first.', variant: 'alert', severity: 'warning' }));
      return;
    }
    setModalSearch('');
    setModalParts([]);
    setModalPage(0);
    setModalHasMore(true);
    setShowPartModal(true);
    fetchModalParts('', 0);
  };

  const fetchModalParts = async (search, page) => {
    try {
      setModalLoading(true);
      const res = await axios.get(`/api/master/npd/product-master/paginated?page=${page}&size=50&search=${search}`);
      const content = res.data.content || [];
      setModalParts(prev => (page === 0 ? content : [...prev, ...content]));
      setModalHasMore(!res.data.last);
      setModalLoading(false);
    } catch (err) {
      console.error('Failed to load parts:', err);
      setModalLoading(false);
    }
  };

  const handleModalSearchChange = (e) => {
    const val = e.target.value;
    setModalSearch(val);
    setModalPage(0);
    setModalHasMore(true);
    fetchModalParts(val, 0);
  };

  // Infinite scroll observer
  const lastModalPartRef = useCallback(
    node => {
      if (modalLoading) return;
      if (modalObserver.current) modalObserver.current.disconnect();
      modalObserver.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && modalHasMore) {
          setModalPage(prev => {
            const next = prev + 1;
            fetchModalParts(modalSearch, next);
            return next;
          });
        }
      });
      if (node) modalObserver.current.observe(node);
    },
    [modalLoading, modalHasMore, modalSearch]
  );

  const selectPartFromModal = (part) => {
    const matchingLines = [];
    openOrders.forEach(order => {
      order.eligibleLines.forEach(line => {
        if (line.partNo === part.itemNo) {
          matchingLines.push({ order, line });
        }
      });
    });

    if (matchingLines.length === 0) {
      dispatch(openSnackbar({
        open: true,
        message: `No active Sales Orders contain Part ${part.itemNo} for this customer.`,
        variant: 'alert',
        severity: 'error'
      }));
      return;
    }

    const match = matchingLines[0];
    setSelectedOrder(match.order);
    setPartsList(match.order.eligibleLines);
    setSelectedPartLine(match.line);
    setInvoiceQty(match.line.balanceQty.toString());
    setShowPartModal(false);
    setItemError('');
  };

  const handleAddPartToInvoice = () => {
    if (!selectedPartLine || !selectedOrder) {
      setItemError('Order and Part are required.');
      return;
    }
    const qty = parseInt(invoiceQty) || 0;
    if (qty <= 0) {
      setItemError('Invoice quantity must be greater than 0.');
      return;
    }
    if (qty > selectedPartLine.balanceQty) {
      setItemError(`Cannot invoice ${qty} units. Maximum allowed remaining quantity is ${selectedPartLine.balanceQty}.`);
      return;
    }

    // Duplicate Part validation
    const isDuplicate = formData.invoiceDetails.some(
      d => d.salesOrderLineId === selectedPartLine.id
    );
    if (isDuplicate) {
      setItemError('This Part is already added to the Invoice.');
      return;
    }

    const price = parseFloat(selectedPartLine.unitPrice) || 0;
    const discountPer = parseFloat(itemDiscount) || 0;
    const cgstPer = parseFloat(selectedPartLine.cgstPer) || 0;
    const sgstPer = parseFloat(selectedPartLine.sgstPer) || 0;
    const igstPer = parseFloat(selectedPartLine.igstPer) || 0;

    const lineVal = qty * price;
    const discAmount = lineVal * (discountPer / 100);
    const taxableAmount = lineVal - discAmount;

    const cgstAmount = taxableAmount * (cgstPer / 100);
    const sgstAmount = taxableAmount * (sgstPer / 100);
    const igstAmount = taxableAmount * (igstPer / 100);
    const taxAmount = cgstAmount + sgstAmount + igstAmount;
    const netAmount = taxableAmount + taxAmount;

    const detailItem = {
      salesOrderId: selectedOrder.id,
      salesOrderNo: selectedOrder.orderNo,
      salesOrderLineId: selectedPartLine.id,
      partId: selectedPartLine.partId,
      partNo: selectedPartLine.partNo,
      partName: selectedPartLine.partName,
      uom: selectedPartLine.uom,
      qty,
      price,
      discountPer,
      cgstPer,
      sgstPer,
      igstPer,
      cgstAmount,
      sgstAmount,
      igstAmount,
      taxAmount,
      netAmount
    };

    setFormData(prev => ({
      ...prev,
      invoiceDetails: [...prev.invoiceDetails, detailItem]
    }));

    setSelectedPartLine(null);
    setInvoiceQty('');
    setItemDiscount('0.00');
    setShowAddRow(false);
  };

  const triggerRemoveLine = (index) => {
    setRemoveIndex(index);
    setShowRemoveConfirm(true);
  };

  const confirmRemoveLine = () => {
    if (removeIndex !== null) {
      const updated = [...formData.invoiceDetails];
      updated.splice(removeIndex, 1);
      setFormData(prev => ({ ...prev, invoiceDetails: updated }));
    }
    setShowRemoveConfirm(false);
    setRemoveIndex(null);
  };

  // Additional Charges
  const handleAddChargeRow = () => {
    if (chargeMasters.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'No charge types defined in master.', variant: 'alert', severity: 'warning' }));
      return;
    }
    const defaultMaster = chargeMasters[0];
    const newCharge = {
      chargeId: defaultMaster.id,
      amount: '0.00',
      taxAvailable: true,
      cgstPer: 9,
      cgstVal: 0,
      sgstPer: 9,
      sgstVal: 0,
      igstPer: 0,
      igstVal: 0,
      totalValue: 0,
      status: true
    };
    setFormData(prev => ({ ...prev, invoiceCharges: [...prev.invoiceCharges, newCharge] }));
  };

  const handleChargeChange = (index, field, value) => {
    const updated = [...formData.invoiceCharges];
    const charge = { ...updated[index] };

    if (field === 'chargeId') {
      charge.chargeId = value;
    } else if (field === 'amount') {
      charge.amount = value;
    } else if (field === 'taxAvailable') {
      charge.taxAvailable = value;
    }

    const amt = parseFloat(charge.amount) || 0;
    if (charge.taxAvailable) {
      charge.cgstPer = 9;
      charge.sgstPer = 9;
      charge.cgstVal = amt * 0.09;
      charge.sgstVal = amt * 0.09;
      charge.totalValue = amt + charge.cgstVal + charge.sgstVal;
    } else {
      charge.cgstPer = 0;
      charge.sgstPer = 0;
      charge.cgstVal = 0;
      charge.sgstVal = 0;
      charge.totalValue = amt;
    }

    updated[index] = charge;
    setFormData(prev => ({ ...prev, invoiceCharges: updated }));
  };

  const handleRemoveCharge = (index) => {
    const updated = [...formData.invoiceCharges];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, invoiceCharges: updated }));
  };

  // Calculations
  const invoiceDetailsTotals = formData.invoiceDetails.reduce(
    (acc, cur) => {
      acc.subTotal += cur.qty * cur.price;
      acc.discountAmount += (cur.qty * cur.price) * (cur.discountPer / 100);
      acc.cgstAmount += cur.cgstAmount || 0;
      acc.sgstAmount += cur.sgstAmount || 0;
      acc.igstAmount += cur.igstAmount || 0;
      acc.itemsTotal += cur.netAmount || 0;
      return acc;
    },
    { subTotal: 0, discountAmount: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, itemsTotal: 0 }
  );

  const chargesTotal = formData.invoiceCharges.reduce(
    (acc, cur) => acc + (parseFloat(cur.amount) || 0),
    0
  );

  const chargesTaxTotal = formData.invoiceCharges.reduce(
    (acc, cur) => acc + (parseFloat(cur.cgstVal || 0) + parseFloat(cur.sgstVal || 0) + parseFloat(cur.igstVal || 0)),
    0
  );

  const taxableAmount = invoiceDetailsTotals.subTotal - invoiceDetailsTotals.discountAmount;
  const totalTax = invoiceDetailsTotals.cgstAmount + invoiceDetailsTotals.sgstAmount + invoiceDetailsTotals.igstAmount + chargesTaxTotal;

  const rawGrandTotal = taxableAmount + totalTax + chargesTotal;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = roundedGrandTotal - rawGrandTotal;

  const handleSave = async () => {
    if (!formData.customerId) {
      dispatch(openSnackbar({ open: true, message: 'Customer is required.', variant: 'alert', severity: 'error' }));
      return;
    }
    if (!formData.billingAddressId) {
      dispatch(openSnackbar({ open: true, message: 'Billing Address is required.', variant: 'alert', severity: 'error' }));
      return;
    }
    if (!formData.shippingAddressId) {
      dispatch(openSnackbar({ open: true, message: 'Shipping Address is required.', variant: 'alert', severity: 'error' }));
      return;
    }
    if (formData.invoiceDetails.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'At least one invoice line item is required.', variant: 'alert', severity: 'error' }));
      return;
    }

    const payload = {
      ...formData,
      subTotal: invoiceDetailsTotals.subTotal,
      discountAmount: invoiceDetailsTotals.discountAmount,
      taxableAmount,
      cgstAmount: invoiceDetailsTotals.cgstAmount,
      sgstAmount: invoiceDetailsTotals.sgstAmount,
      igstAmount: invoiceDetailsTotals.igstAmount,
      additionalCharges: chargesTotal,
      roundOff,
      grandTotal: roundedGrandTotal,
      exchangeRate: parseFloat(formData.exchangeRate) || 1
    };

    try {
      if (isEditing) {
        await axios.put(`${API_PATHS.SM.INVOICES}/${id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Invoice updated successfully!', variant: 'alert', severity: 'success' }));
      } else {
        await axios.post(API_PATHS.SM.INVOICES, payload);
        dispatch(openSnackbar({ open: true, message: 'Invoice created successfully!', variant: 'alert', severity: 'success' }));
      }
      navigate('/sm/sales/customer/invoices');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to save invoice.';
      dispatch(openSnackbar({ open: true, message: errMsg, variant: 'alert', severity: 'error' }));
    }
  };

  // Helper to fetch details of a selected customer address
  const getAddressText = (addressId) => {
    const addr = billingAddresses.find(a => a.id === addressId);
    if (!addr) return '';
    return `${addr.invoiceName || ''}, ${addr.address || ''}, ${addr.city || ''}, Tamil Nadu, India`;
  };

  const formatEntryDate = (dateVal) => {
    if (!dateVal) return '';
    return formatDateTime(dateVal, timeFormat, dateFormat);
  };

  const invoiceDateToShow = isEditing ? formatEntryDate(formData.invoiceDate) : formatEntryDate(new Date());

  return (
    <Box sx={{ bgcolor: '#fbfcfd', p: 0, minHeight: '100vh' }}>
      {/* ── TOP HEADER BLOCK ── */}
      <BOSPageHeader
        title="Sales Invoice"
        icon={<IconFileText size={24} />}
        actions={
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 160 }}>
              <BOSTextField
                fullWidth
                size="small"
                name="invoiceNo"
                label="Invoice No"
                value={formData.invoiceNo || ''}
                InputProps={{ readOnly: true }}
                sx={{
                  bgcolor: '#ffffcc',
                  '& .MuiOutlinedInput-root': { height: 36 },
                  '& .MuiInputBase-input': { fontWeight: 700, color: '#000' },
                  '& .MuiInputLabel-root': { fontWeight: 600, color: '#000' }
                }}
              />
            </Box>
            <Box sx={{ width: 180 }}>
              <BOSTextField
                fullWidth
                size="small"
                name="invoiceDate"
                label="Invoice Date"
                value={invoiceDateToShow}
                InputProps={{ readOnly: true }}
                sx={{
                  bgcolor: '#ffffcc',
                  '& .MuiOutlinedInput-root': { height: 36 },
                  '& .MuiInputBase-input': { fontWeight: 700, color: '#000' },
                  '& .MuiInputLabel-root': { fontWeight: 600, color: '#000' }
                }}
              />
            </Box>
          </Stack>
        }
      />

      <Box sx={{ p: 3 }}>

        {/* ── SECTIONS GRID ── */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <BOSFormSection
              title="Customer & Payment Details"
              icon={<Box sx={{ bgcolor: '#2563eb', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>1</Box>}
            >
              <Grid container spacing={2.5}>
                {/* Row 1: Customer, Payment Terms, Delivery Terms */}
                <Grid item xs={12} md={6}>
                  <BOSAutocomplete
                    options={customers}
                    getOptionLabel={opt => opt ? (opt.gstin ? `${opt.customerName} (${opt.gstin})` : opt.customerName) : ''}
                    value={customers.find(c => c.id === formData.customerId) || null}
                    onChange={handleCustomerChange}
                    label="Customer"
                    required
                    disabled={isEditing}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <BOSTextField
                    select
                    name="paymentTerms"
                    label="Payment Terms *"
                    value={formData.paymentTerms}
                    onChange={e => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  >
                    {paymentTermsList.map(pt => (
                      <MenuItem key={pt.id} value={pt.termName || pt.description}>{pt.termName || pt.description}</MenuItem>
                    ))}
                  </BOSTextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <BOSTextField
                    select
                    name="deliveryTerms"
                    label="Delivery Terms *"
                    value={formData.deliveryTerms}
                    onChange={e => setFormData(prev => ({ ...prev, deliveryTerms: e.target.value }))}
                  >
                    {deliveryTermsList.map(dt => (
                      <MenuItem key={dt.id} value={dt.termName || dt.description || dt.deliveryTerms}>{dt.termName || dt.description || dt.deliveryTerms}</MenuItem>
                    ))}
                  </BOSTextField>
                </Grid>

                {/* Row 2: Billing Address, Shipping Address, Currency, Exchange Rate */}
                <Grid item xs={12} md={4}>
                  <BOSTextField
                    select
                    name="billingAddressId"
                    label="Billing Address *"
                    value={formData.billingAddressId}
                    onChange={e => setFormData(prev => ({ ...prev, billingAddressId: e.target.value }))}
                    required
                  >
                    {billingAddresses.map(a => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.invoiceName}
                      </MenuItem>
                    ))}
                  </BOSTextField>
                  {formData.billingAddressId && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', px: 0.5, lineHeight: 1.3 }}>
                      {getAddressText(formData.billingAddressId)}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <BOSTextField
                    select
                    name="shippingAddressId"
                    label="Shipping Address *"
                    value={formData.shippingAddressId}
                    onChange={e => setFormData(prev => ({ ...prev, shippingAddressId: e.target.value }))}
                    required
                    disabled={formData.sameAsBilling}
                  >
                    {shippingAddresses.map(a => (
                      <MenuItem key={a.id} value={a.id}>
                        {a.invoiceName}
                      </MenuItem>
                    ))}
                  </BOSTextField>
                  {formData.shippingAddressId && (
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', px: 0.5, lineHeight: 1.3 }}>
                      {getAddressText(formData.shippingAddressId)}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={2}>
                  <BOSTextField
                    select
                    name="currencyCode"
                    label="Currency *"
                    value={formData.currencyCode}
                    onChange={handleCurrencyChange}
                  >
                    {currenciesList.map(c => (
                      <MenuItem key={c.id} value={c.currencyCode}>{c.currencyCode}</MenuItem>
                    ))}
                  </BOSTextField>
                </Grid>

                <Grid item xs={12} md={2}>
                  <BOSTextField
                    name="exchangeRate"
                    label="Exchange Rate *"
                    value={formData.exchangeRate}
                    onChange={e => setFormData(prev => ({ ...prev, exchangeRate: e.target.value }))}
                    disabled={formData.currencyCode === 'INR'}
                    InputProps={{
                      endAdornment: formData.currencyCode === 'INR' ? <IconLock size={16} style={{ color: '#94a3b8' }} /> : null
                    }}
                  />
                </Grid>

                {/* Row 3: Checkbox */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.sameAsBilling}
                        onChange={e => setFormData(prev => ({ ...prev, sameAsBilling: e.target.checked }))}
                        color="primary"
                      />
                    }
                    label={<Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '0.85rem' }}>Same as Billing Address</Typography>}
                  />
                </Grid>
              </Grid>
            </BOSFormSection>
          </Grid>
        </Grid>

        {/* ── Section 4 - Invoice Items ── */}
        {/* ── Section 4 - Invoice Items ── */}
        <BOSFormSection
          title="Invoice Items"
          icon={<Box sx={{ bgcolor: '#2563eb', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>4</Box>}
          sx={{ mb: 3 }}
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<IconPlus size={16} />}
              onClick={() => setShowAddRow(true)}
              disabled={!formData.customerId}
              sx={{ textTransform: 'none', borderRadius: '8px', px: 3, fontWeight: 700, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
            >
              Add Item
            </Button>
          }
        >
          {showAddRow && (
            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderColor: '#bfdbfe', bgcolor: '#f0f7ff', borderRadius: '8px' }}>
              <Grid container spacing={2}>
                {/* Row 1 */}
                <Grid item xs={12} sm={3}>
                  <BOSTextField
                    select
                    label="Order No *"
                    value={selectedOrder ? selectedOrder.id : ''}
                    onChange={handleOrderChange}
                    required
                  >
                    {openOrders.map(o => (
                      <MenuItem key={o.id} value={o.id}>{o.orderNo}</MenuItem>
                    ))}
                  </BOSTextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Stack direction="row" spacing={1}>
                    <BOSTextField
                      select
                      label="Part No *"
                      value={selectedPartLine ? selectedPartLine.id : ''}
                      onChange={handlePartChange}
                      required
                      sx={{ flexGrow: 1 }}
                    >
                      {partsList.map(p => (
                        <MenuItem key={p.id} value={p.id}>{p.partNo}</MenuItem>
                      ))}
                    </BOSTextField>
                    <IconButton onClick={openPartModal} sx={{ border: '1px solid #cbd5e1', bgcolor: '#fff', borderRadius: '8px' }}>
                      <IconSearch size={18} />
                    </IconButton>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={2.4}>
                  <BOSTextField
                    label="Description"
                    value={selectedPartLine ? selectedPartLine.partName : ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={6} sm={1.2}>
                  <BOSTextField
                    label="UOM"
                    value={selectedPartLine ? (selectedPartLine.uom || 'Nos') : ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={6} sm={1.2}>
                  <BOSTextField
                    label="Current Stock"
                    value={selectedPartLine ? selectedPartLine.currentStock : ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={1.2}>
                  <BOSTextField
                    label="Unit Price"
                    value={selectedPartLine ? selectedPartLine.unitPrice : ''}
                    disabled
                  />
                </Grid>

                {/* Row 2 */}
                <Grid item xs={6} sm={1.5}>
                  <BOSTextField
                    label="Order Qty"
                    value={selectedPartLine ? selectedPartLine.orderedQty : ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={6} sm={1.5}>
                  <BOSTextField
                    label="Already Invoiced"
                    value={selectedPartLine ? selectedPartLine.alreadyInvoicedQty : ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={6} sm={1.5}>
                  <BOSTextField
                    label="Balance Qty"
                    value={selectedPartLine ? selectedPartLine.balanceQty : ''}
                    disabled
                    inputProps={{ style: { color: '#10b981', fontWeight: 'bold' } }}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <BOSTextField
                    type="number"
                    label="Invoice Qty *"
                    value={invoiceQty}
                    onChange={e => { setInvoiceQty(e.target.value); setItemError(''); }}
                    required
                  />
                </Grid>
                <Grid item xs={6} sm={1.5}>
                  <BOSTextField
                    type="number"
                    label="Discount (%)"
                    value={itemDiscount}
                    onChange={e => setItemDiscount(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <BOSTextField
                    select
                    label="Tax Code"
                    value={itemTaxCode}
                    onChange={e => setItemTaxCode(e.target.value)}
                  >
                    <MenuItem value="GST 18%">GST 18%</MenuItem>
                    <MenuItem value="GST 12%">GST 12%</MenuItem>
                    <MenuItem value="GST 5%">GST 5%</MenuItem>
                    <MenuItem value="Exempt">Exempt</MenuItem>
                  </BOSTextField>
                </Grid>
                <Grid item xs={12} sm={1.5} display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="textSecondary" block>Amount</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {selectedPartLine && invoiceQty ? (parseFloat(invoiceQty) * parseFloat(selectedPartLine.unitPrice)).toFixed(2) : '0.00'}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => setShowAddRow(false)} color="error">
                    <IconX size={20} />
                  </IconButton>
                </Grid>

                {itemError && (
                  <Grid item xs={12}>
                    <Alert severity="error">{itemError}</Alert>
                  </Grid>
                )}

                <Grid item xs={12} display="flex" justifyContent="flex-end" sx={{ mt: 1 }}>
                  <Button variant="outlined" color="primary" onClick={() => setShowAddRow(false)} sx={{ mr: 2 }}>Cancel</Button>
                  <Button variant="contained" color="secondary" onClick={handleAddPartToInvoice}>Add Item</Button>
                </Grid>
              </Grid>
            </Paper>
          )}

          <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Order No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Part No</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#475569' }}>UOM</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Order Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Already Invoiced</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Balance Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Invoice Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Unit Price</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Discount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Tax</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Amount</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#475569' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.invoiceDetails.map((line, idx) => (
                  <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{line.salesOrderNo}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{line.partNo}</TableCell>
                    <TableCell>{line.partName}</TableCell>
                    <TableCell>{line.uom}</TableCell>
                    <TableCell align="right">{line.qty + (selectedPartLine?.balanceQty || 0)}</TableCell> {/* Placeholder logic to simulate total SO Qty */}
                    <TableCell align="right">{selectedPartLine?.alreadyInvoicedQty || 0}</TableCell>
                    <TableCell align="right" sx={{ color: '#10b981' }}>{selectedPartLine?.balanceQty || 0}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{line.qty}</TableCell>
                    <TableCell align="right">{parseFloat(line.price || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{parseFloat(line.discountPer || 0).toFixed(2)}%</TableCell>
                    <TableCell align="right">GST 18%</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#1e3a8a' }}>{parseFloat(line.netAmount || 0).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton size="small" color="primary"><IconPencil size={16} /></IconButton>
                        <IconButton size="small" color="error" onClick={() => triggerRemoveLine(idx)}><IconTrash size={16} /></IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {formData.invoiceDetails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={14} align="center" sx={{ py: 3, color: '#64748b' }}>
                      No invoice items added yet. Click Add Item to add.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </BOSFormSection>

        {/* ── BOTTOM SECTIONS: Additional Charges & Summary ── */}
        <Grid container spacing={3}>
          {/* Section 5 - Additional Charges */}
          <Grid item xs={12} md={7}>
            <BOSFormSection
              title="Additional Charges"
              icon={<Box sx={{ bgcolor: '#2563eb', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>5</Box>}
              action={
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<IconPlus size={16} />}
                  onClick={handleAddChargeRow}
                  sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600 }}
                >
                  Add Charge
                </Button>
              }
            >
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', mb: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Charge Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Amount (INR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tax Code</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Amount (With Tax)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.invoiceCharges.map((charge, idx) => {
                      const masterObj = chargeMasters.find(cm => cm.id === charge.chargeId) || {};
                      return (
                        <TableRow key={idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <BOSTextField
                              select
                              value={charge.chargeId}
                              onChange={e => handleChargeChange(idx, 'chargeId', e.target.value)}
                              variant="standard"
                            >
                              {chargeMasters.map(cm => (
                                <MenuItem key={cm.id} value={cm.id}>{cm.charges}</MenuItem>
                              ))}
                            </BOSTextField>
                          </TableCell>
                          <TableCell>{masterObj.calculationType || 'Standard'}</TableCell>
                          <TableCell align="right">
                            <BOSTextField
                              type="number"
                              value={charge.amount}
                              onChange={e => handleChargeChange(idx, 'amount', e.target.value)}
                              variant="standard"
                            />
                          </TableCell>
                          <TableCell>
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={charge.taxAvailable}
                                  onChange={e => handleChargeChange(idx, 'taxAvailable', e.target.checked)}
                                />
                              }
                              label="GST 18%"
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {parseFloat(charge.totalValue || 0).toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="error" onClick={() => handleRemoveCharge(idx)}>
                              <IconTrash size={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {formData.invoiceCharges.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 2, color: '#64748b' }}>
                          No additional charges added.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {formData.invoiceCharges.length > 0 && (
                <Box display="flex" justifyContent="space-between" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px' }}>
                  <Typography sx={{ fontWeight: 700, color: '#475569' }}>Total Additional Charges</Typography>
                  <Stack direction="row" spacing={4}>
                    <Typography sx={{ fontWeight: 700 }}>{chargesTotal.toFixed(2)} INR</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#1e3a8a' }}>{(chargesTotal + chargesTaxTotal).toFixed(2)} INR</Typography>
                  </Stack>
                </Box>
              )}
            </BOSFormSection>
          </Grid>

          {/* Section 6 - Invoice Summary */}
          <Grid item xs={12} md={5}>
            <BOSFormSection
              title="Invoice Summary"
              icon={<Box sx={{ bgcolor: '#2563eb', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>6</Box>}
              action={<IconFileText size={20} style={{ color: '#94a3b8' }} />}
            >
              <Stack spacing={1.8}>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Subtotal (Items)</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{invoiceDetailsTotals.subTotal.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" sx={{ color: '#ef4444' }}>
                  <Typography sx={{ fontSize: '0.9rem' }}>Discount</Typography>
                  <Typography sx={{ fontWeight: 700 }}>-{invoiceDetailsTotals.discountAmount.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: '#334155', fontWeight: 600 }}>Taxable Amount</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{taxableAmount.toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>CGST (9%)</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{(invoiceDetailsTotals.cgstAmount + (chargesTaxTotal / 2)).toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>SGST (9%)</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{(invoiceDetailsTotals.sgstAmount + (chargesTaxTotal / 2)).toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>Additional Charges (With Tax)</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{(chargesTotal + chargesTaxTotal).toFixed(2)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>Round Off</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{roundOff.toFixed(2)}</Typography>
                </Box>
              </Stack>


              <Box sx={{ mt: 3 }}>
                <Box
                  sx={{
                    bgcolor: '#2563eb',
                    color: '#fff',
                    p: 2,
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5
                  }}
                >
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>Grand Total (INR)</Typography>
                  <Typography variant="h3" sx={{ color: '#fff', fontWeight: 900 }}>{roundedGrandTotal.toFixed(2)}</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 700, display: 'block', textAlign: 'left', fontStyle: 'italic' }}>
                  Amount in Words : Thirty Four Thousand Seven Hundred Fifty One Rupees Only
                </Typography>
              </Box>
            </BOSFormSection>
          </Grid>
        </Grid>

        {/* ── ACTION FOOTER ── */}
        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/sm/sales/customer/invoices')}
            sx={{ textTransform: 'none', px: 4, borderRadius: '8px', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<IconDeviceFloppy />}
            onClick={handleSave}
            sx={{ textTransform: 'none', px: 5, borderRadius: '8px', fontWeight: 700 }}
          >
            Save Invoice
          </Button>
        </Stack>

        {/* ── PART MASTER MODAL (Case 2) ── */}
        <Dialog open={showPartModal} onClose={() => setShowPartModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>Select Part/Product</Typography>
            <IconButton onClick={() => setShowPartModal(false)}><IconX size={18} /></IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2 }}>
            <BOSTextField
              placeholder="Search by Part No or Item Name..."
              value={modalSearch}
              onChange={handleModalSearchChange}
              InputProps={{ startAdornment: <IconSearch size={18} style={{ marginRight: 8, color: '#9e9e9e' }} /> }}
              fullWidth
              sx={{ mb: 2 }}
            />
            <List sx={{ maxHeight: 350, overflow: 'auto' }}>
              {modalParts.map((part, index) => {
                const isLast = index === modalParts.length - 1;
                return (
                  <ListItemButton
                    key={part.id}
                    ref={isLast ? lastModalPartRef : null}
                    onClick={() => selectPartFromModal(part)}
                    sx={{ borderBottom: `1px solid ${theme.palette.divider}`, borderRadius: '6px', mb: 0.5 }}
                  >
                    <ListItemText
                      primary={<Typography sx={{ fontWeight: 700, color: '#1e293b' }}>{part.itemNo}</Typography>}
                      secondary={<Typography variant="body2" sx={{ color: '#64748b' }}>{part.itemName}</Typography>}
                    />
                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>Select</Typography>
                  </ListItemButton>
                );
              })}
              {modalLoading && (
                <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>
              )}
              {!modalLoading && modalParts.length === 0 && (
                <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No parts found matching search term.</Typography>
              )}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPartModal(false)} color="primary">Close</Button>
          </DialogActions>
        </Dialog>

        {/* ── CUSTOMER CHANGE WARNING DIALOG ── */}
        <Dialog open={showCustomerChangeWarning} onClose={() => setShowCustomerChangeWarning(false)}>
          <DialogTitle sx={{ fontWeight: 800 }}>Confirm Customer Change</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Changing the customer will clear all current invoice items and additional charges. Are you sure you want to proceed?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCustomerChangeWarning(false)} color="primary">Cancel</Button>
            <Button onClick={confirmCustomerChange} color="error" variant="contained">Proceed</Button>
          </DialogActions>
        </Dialog>

        {/* ── REMOVE ITEM CONFIRMATION DIALOG ── */}
        <Dialog open={showRemoveConfirm} onClose={() => setShowRemoveConfirm(false)}>
          <DialogTitle sx={{ fontWeight: 800 }}>Remove Invoice Item?</DialogTitle>
          <DialogContent>
            <Typography variant="body1">Are you sure you want to remove this line item from the invoice?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRemoveConfirm(false)} color="primary">Cancel</Button>
            <Button onClick={confirmRemoveLine} color="error" variant="contained">Remove</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
