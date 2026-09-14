import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Autocomplete,
  TextField,
  FormControlLabel,
  Checkbox,
  InputAdornment
} from '@mui/material';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
  IconSearch,
  IconX,
  IconTruckDelivery,
  IconFileText,
  IconPrinter,
  IconUser,
  IconBuilding,
  IconCurrencyRupee,
  IconArrowsRightLeft,
  IconCalendarEvent,
  IconTag,
  IconMapPin,
  IconTruck,
  IconClipboardList
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import useConfig from 'hooks/useConfig';
import { formatDateTime } from 'utils/BOSTimeUtils';
import { BOSTextField, BOSFormSection, BOSAutocomplete, BOSPageHeader, btnSave, btnCancel } from 'ui-component/bos';
import DeliveryReceiptPdfDialog from './DeliveryReceiptPdfDialog';

const INITIAL_STATE = {
  invoiceNo: '',
  docType: 'DELIVERY_RECEIPT',
  invoiceDate: '',
  customerId: '',
  billingAddressId: '',
  shippingAddressId: '',
  sameAsBilling: true,
  paymentTerms: '30 Days',
  deliveryTerms: 'Ex-Works',
  currencyCode: 'INR',
  exchangeRate: '1.0000',
  customerPo: '',
  scheduleNo: '',
  remarks: '',
  invoiceDetails: [],
  invoiceCharges: [],
  roundOff: '0.00',
  additionalCharges: '0.00'
};

const initialRowState = {
  salesOrderId: null,
  salesOrderNo: 'DIRECT-DC',
  salesOrderLineId: null,
  partId: null,
  partNo: '',
  partName: '',
  uom: 'NOS',
  qty: 1,
  price: 0,
  discountPer: 0,
  cgstPer: 9,
  sgstPer: 9,
  igstPer: 0,
  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 0,
  taxAmount: 0,
  netAmount: 0
};

function numberToWords(num) {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const inWords = (n) => {
    if (n === 0) return '';
    if (n < 20) return a[n] + ' ';
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '') + ' ';
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
  };
  
  return inWords(Math.floor(num)).trim() + ' Rupees Only';
}

export default function DeliveryReceiptForm() {
  const { timeFormat, dateFormat } = useConfig();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [customers, setCustomers] = useState([]);
  const [shippingCustomerId, setShippingCustomerId] = useState('');
  const [billingAddresses, setBillingAddresses] = useState([]);
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [customerPOs, setCustomerPOs] = useState([]);
  const [customerSchedules, setCustomerSchedules] = useState([]);
  const [chargeMasters, setChargeMasters] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);

  // PO Items Modal
  const [showPoItemsModal, setShowPoItemsModal] = useState(false);
  const [selectedPoLineIds, setSelectedPoLineIds] = useState([]);

  // Part Master Search Modal for specific row
  const [modalTargetRowIndex, setModalTargetRowIndex] = useState(null);
  const [showPartModal, setShowPartModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalParts, setModalParts] = useState([]);
  const [modalPage, setModalPage] = useState(0);
  const [modalHasMore, setModalHasMore] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const modalObserver = useRef();

  // Dropdown lists
  const [paymentTermsList, setPaymentTermsList] = useState([]);
  const [deliveryTermsList, setDeliveryTermsList] = useState([]);
  const [currenciesList, setCurrenciesList] = useState([]);

  // Fetch Customers, Charge Masters, and Product Master
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [custRes, chargeRes, ptRes, dtRes, curRes, prodRes] = await Promise.all([
          axios.get(API_PATHS.SM.CUSTOMERS),
          axios.get('/api/sm/additional-charges'),
          axios.get('/api/payment-terms'),
          axios.get('/api/delivery-terms'),
          axios.get('/api/admin/currency'),
          axios.get('/api/master/npd/product-master/paginated?page=0&size=500')
        ]);
        const isActive = (m) => m && (m.status === true || m.status === 1 || m.status === 'Active' || m.status === 'ACTIVE' || m.status === undefined || m.status === null);
        setCustomers(custRes.data || []);
        setChargeMasters(chargeRes.data || []);
        setPaymentTermsList(ptRes.data ? ptRes.data.filter(isActive) : []);
        setDeliveryTermsList(dtRes.data ? dtRes.data.filter(isActive) : []);
        setCurrenciesList(curRes.data ? curRes.data.filter(isActive) : []);
        setAllProducts(prodRes.data?.content || []);
      } catch (err) {
        console.error('Failed to load base data:', err);
      }
    };
    fetchBaseData();
  }, []);

  // Load existing receipt or fetch next DC number if new
  useEffect(() => {
    if (isEditing) {
      const loadReceipt = async () => {
        try {
          const response = await axios.get(`${API_PATHS.SM.INVOICES}/${id}`);
          const data = response.data;
          setFormData({
            ...data,
            docType: 'DELIVERY_RECEIPT',
            invoiceDate: data.invoiceDate ? data.invoiceDate : '',
            sameAsBilling: data.billingAddressId === data.shippingAddressId,
            roundOff: parseFloat(data.roundOff || 0).toFixed(2),
            additionalCharges: parseFloat(data.additionalCharges || 0).toFixed(2)
          });
          if (data.customerId) {
            setShippingCustomerId(data.customerId); // Fallback for existing records
            loadAddresses(data.customerId);
          }
        } catch (err) {
          console.error('Failed to load delivery receipt:', err);
          dispatch(openSnackbar({ open: true, message: 'Failed to load delivery receipt data.', variant: 'alert', severity: 'error' }));
        }
      };
      loadReceipt();
    } else {
      const fetchNextDcNo = async () => {
        try {
          const response = await axios.get(`${API_PATHS.SM.INVOICES}/next-number`, {
            params: { docType: 'DELIVERY_RECEIPT' }
          });
          if (response.data && (response.data.invoiceNo || response.data.docNo)) {
            setFormData(prev => ({ ...prev, invoiceNo: response.data.invoiceNo || response.data.docNo }));
          }
        } catch (err) {
          console.error('Failed to fetch next DC number:', err);
        }
      };
      fetchNextDcNo();
    }
  }, [id, isEditing, dispatch]);

  const loadCustomerPOs = async (custId) => {
    try {
      const res = await axios.get(`/api/sm/invoices/customer/${custId}/open-orders`);
      setCustomerPOs(res.data || []);
    } catch (err) {
      console.error('Failed to load customer POs:', err);
    }
  };

  const loadCustomerSchedules = async (custId) => {
    try {
      const res = await axios.get(`/api/v1/sm/customer-schedules/customer/${custId}`);
      setCustomerSchedules(res.data || []);
    } catch (err) {
      console.error('Failed to load customer schedules:', err);
    }
  };

  const loadAddresses = async (cust, type = 'both') => {
    try {
      const response = await axios.get(`/api/sm/customer-details?customerId=${cust.id}`);
      let list = response.data || [];
      
      // Fallback to customer master address if no multiple addresses exist
      if (list.length === 0) {
        if (cust.address || cust.city) {
          list = [{
            id: -1, // Fallback ID for customer master address
            address: cust.address,
            city: cust.city,
            state: cust.state,
            pincode: cust.pinCode || cust.pincode,
            country: cust.country,
            status: 'Active'
          }];
        }
      }

      if (type === 'both' || type === 'billing') setBillingAddresses(list);
      if (type === 'both' || type === 'shipping') setShippingAddresses(list);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  const handleShippingCustomerChange = async (event, cust) => {
    if (!cust) {
      setShippingCustomerId('');
      setShippingAddresses([]);
      setFormData(prev => ({ ...prev, shippingAddressId: '' }));
      return;
    }
    setShippingCustomerId(cust.id);
    setFormData(prev => ({ ...prev, shippingAddressId: '' }));
    loadAddresses(cust, 'shipping');
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

  // Handle Customer Change
  const handleCustomerChange = async (event, cust) => {
    if (!cust) {
      setFormData(INITIAL_STATE);
      setBillingAddresses([]);
      setShippingAddresses([]);
      setShippingCustomerId('');
      return;
    }

    const currency = cust.currencyCode || 'INR';
    setFormData(prev => ({
      ...prev,
      customerId: cust.id,
      billingAddressId: '',
      paymentTerms: cust.paymentTerms || '30 Days',
      deliveryTerms: cust.deliveryTerms || 'Ex-Works',
      currencyCode: currency,
      exchangeRate: currency === 'INR' ? '1.0000' : '0.0000',
      invoiceDetails: prev.invoiceDetails,
      invoiceCharges: [],
      roundOff: '0.00',
      additionalCharges: '0.00'
    }));
    loadAddresses(cust, 'billing');
    loadCustomerPOs(cust.id);
    loadCustomerSchedules(cust.id);

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
        const response = await fetch(`https://api.frankfurter.dev/v2/rate/${val}/INR`);
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

  // ── INLINE TABLE ROW ACTIONS ──
  const handleAddRow = useCallback(() => {
    if (formData.customerPo) {
      setShowPoItemsModal(true);
      setSelectedPoLineIds([]); // reset selection
      return;
    }
    setModalTargetRowIndex(null);
    setModalSearch('');
    setModalPage(0);
    setModalHasMore(true);
    fetchModalParts('', 0);
    setShowPartModal(true);
  }, [formData.customerPo]);

  const handleRowChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.invoiceDetails];
      const item = { ...updated[index] };

      if (field === 'product') {
        if (value) {
          item.partId = value.id || value.partId;
          item.partNo = value.itemNo || value.partNo || '';
          item.partName = value.itemName || value.itemDescription || value.partName || '';
          item.uom = value.uomName || value.uom || 'NOS';
          item.price = parseFloat(value.rate || value.standardPrice || value.unitPrice || 0);
          item.salesOrderNo = 'DIRECT-DC';
          item.salesOrderId = null;
        } else {
          item.partId = null;
          item.partNo = '';
          item.partName = '';
          item.price = 0;
        }
      } else {
        item[field] = value;
      }

      const qty = parseFloat(item.qty) || 0;
      const price = parseFloat(item.price) || 0;
      const discountPer = parseFloat(item.discountPer) || 0;
      const cgstPer = parseFloat(item.cgstPer || 9);
      const sgstPer = parseFloat(item.sgstPer || 9);
      const igstPer = parseFloat(item.igstPer || 0);

      const lineVal = qty * price;
      const discAmount = lineVal * (discountPer / 100);
      const taxable = lineVal - discAmount;
      const cgst = taxable * (cgstPer / 100);
      const sgst = taxable * (sgstPer / 100);
      const igst = taxable * (igstPer / 100);
      const tax = cgst + sgst + igst;

      item.taxableAmount = taxable;
      item.cgstAmount = cgst;
      item.sgstAmount = sgst;
      item.igstAmount = igst;
      item.taxAmount = tax;
      item.netAmount = taxable + tax;

      updated[index] = item;
      return { ...prev, invoiceDetails: updated };
    });
  };

  const handleRemoveLine = (index) => {
    const updated = [...formData.invoiceDetails];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, invoiceDetails: updated }));
  };

  // ── PART SEARCH MODAL ──
  const openModalForRow = (rowIndex) => {
    setModalTargetRowIndex(rowIndex);
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

  const handleAddSelectedPoLines = () => {
    const po = customerPOs.find(p => p.orderNo === formData.customerPo);
    if (!po || !po.eligibleLines) return;
    
    // Use modalLines logic to get correct balance qty for schedule
    let lines = po.eligibleLines || [];
    if (formData.scheduleNo) {
      const schedule = customerSchedules.find(s => s.id?.toString() === formData.scheduleNo);
      if (schedule && schedule.orderItemId) {
        lines = lines.filter(l => l.id === schedule.orderItemId).map(l => ({
          ...l,
          balanceQty: schedule.balanceQty !== undefined ? schedule.balanceQty : l.balanceQty
        }));
      }
    }
    
    // Find selected lines
    const linesToAdd = lines.filter(line => selectedPoLineIds.includes(line.id));
    
    const newDetails = linesToAdd.map(line => {
      const qty = line.balanceQty || 0;
      const price = line.unitPrice || 0;
      const discPer = line.discountPer || 0;
      const lineVal = qty * price;
      const lineDisc = lineVal * (discPer / 100);
      const taxable = lineVal - lineDisc;
      const cgstAmt = taxable * ((line.cgstPer || 0) / 100);
      const sgstAmt = taxable * ((line.sgstPer || 0) / 100);
      const igstAmt = taxable * ((line.igstPer || 0) / 100);
      return {
        ...initialRowState,
        salesOrderNo: po.orderNo,
        salesOrderId: po.id,
        salesOrderLineId: line.id,
        partId: line.partId,
        partNo: line.partNo,
        partName: line.partName,
        product: { id: line.partId, itemNo: line.partNo, itemName: line.partName, uomName: line.uom, rate: price },
        uom: line.uom,
        qty: qty,
        price: price,
        discountPer: discPer,
        cgstPer: line.cgstPer || 0,
        sgstPer: line.sgstPer || 0,
        igstPer: line.igstPer || 0,
        cgstAmount: cgstAmt,
        sgstAmount: sgstAmt,
        igstAmount: igstAmt,
        taxAmount: cgstAmt + sgstAmt + igstAmt,
        taxableAmount: taxable,
        netAmount: taxable + cgstAmt + sgstAmt + igstAmt,
        maxQty: qty
      };
    });

    setFormData(prev => {
      // Filter out empty rows if we are adding actual items
      const currentDetails = prev.invoiceDetails.filter(d => d.partId || d.qty > 0 || d.price > 0);
      return { ...prev, invoiceDetails: [...currentDetails, ...newDetails] };
    });
    
    setShowPoItemsModal(false);
    setSelectedPoLineIds([]);
  };

  const handleModalSearchChange = (e) => {
    const val = e.target.value;
    setModalSearch(val);
    setModalPage(0);
    setModalHasMore(true);
    fetchModalParts(val, 0);
  };

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
    let targetIndex = modalTargetRowIndex;
    if (targetIndex === null || targetIndex === undefined) {
      setFormData(prev => {
        const newRow = { 
          ...initialRowState, 
          partId: part.id,
          partNo: part.itemNo,
          partName: part.itemName || part.itemDescription,
          uom: part.uomName || part.uom || 'NOS',
          price: part.rate || part.standardPrice || 0
        };
        return { ...prev, invoiceDetails: [...prev.invoiceDetails, newRow] };
      });
    } else {
      handleRowChange(targetIndex, 'product', {
        id: part.id,
        itemNo: part.itemNo,
        itemName: part.itemName || part.itemDescription,
        uom: part.uomName || part.uom || 'NOS',
        unitPrice: part.rate || part.standardPrice || 0
      });
    }

    setShowPartModal(false);
    setModalTargetRowIndex(null);
  };

  // Additional Charges
  const handleAddChargeRow = useCallback(() => {
    if (chargeMasters.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'No charge types defined in master.', variant: 'alert', severity: 'warning' }));
      return;
    }
    const defaultMaster = chargeMasters[0];
    const newCharge = {
      chargeId: defaultMaster.id,
      amount: '0.00',
      taxAvailable: false,
      cgstPer: 0,
      cgstVal: 0,
      sgstPer: 0,
      sgstVal: 0,
      igstPer: 0,
      igstVal: 0,
      totalValue: 0,
      status: true
    };
    setFormData(prev => ({ ...prev, invoiceCharges: [...prev.invoiceCharges, newCharge] }));
  }, [chargeMasters, dispatch]);

  const handleChargeChange = (index, field, value) => {
    const updated = [...formData.invoiceCharges];
    const charge = { ...updated[index] };

    if (field === 'chargeId') {
      charge.chargeId = value;
    } else if (field === 'amount') {
      charge.amount = value;
    }

    const amt = parseFloat(charge.amount) || 0;
    charge.totalValue = amt;

    updated[index] = charge;
    setFormData(prev => ({ ...prev, invoiceCharges: updated }));
  };

  const handleRemoveCharge = (index) => {
    const updated = [...formData.invoiceCharges];
    updated.splice(index, 1);
    setFormData(prev => ({ ...prev, invoiceCharges: updated }));
  };

  // Calculations
  const receiptDetailsTotals = formData.invoiceDetails.reduce(
    (acc, cur) => {
      const q = parseFloat(cur.qty) || 0;
      const p = parseFloat(cur.price) || 0;
      const disc = parseFloat(cur.discountPer) || 0;
      const lineVal = q * p;
      const lineDisc = lineVal * (disc / 100);
      acc.subTotal += lineVal;
      acc.discountAmount += lineDisc;
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

  const taxableAmount = receiptDetailsTotals.subTotal - receiptDetailsTotals.discountAmount;
  const totalTax = receiptDetailsTotals.cgstAmount + receiptDetailsTotals.sgstAmount + receiptDetailsTotals.igstAmount;

  const rawGrandTotal = taxableAmount + totalTax + chargesTotal;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = roundedGrandTotal - rawGrandTotal;

  const handleSave = useCallback(async () => {
    if (!formData.customerId) {
      dispatch(openSnackbar({ open: true, message: 'Please select a Customer.', variant: 'alert', severity: 'error' }));
      return;
    }
    
    const validLines = formData.invoiceDetails.filter(d => (d.partNo && d.partNo.trim() !== '') || d.partId);
    if (validLines.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'Please add at least one line item with a valid Part / Product.', variant: 'alert', severity: 'error' }));
      return;
    }

    const invalidQtyLines = validLines.filter(d => d.maxQty !== undefined && parseFloat(d.qty) > parseFloat(d.maxQty));
    if (invalidQtyLines.length > 0) {
      dispatch(openSnackbar({ open: true, message: 'Quantity cannot exceed pending quantity.', variant: 'alert', severity: 'error' }));
      return;
    }

    setSaving(true);
    const payload = {
      ...formData,
      docType: 'DELIVERY_RECEIPT',
      billingAddressId: formData.billingAddressId === -1 ? null : formData.billingAddressId,
      shippingAddressId: formData.shippingAddressId === -1 ? null : formData.shippingAddressId,
      invoiceDetails: validLines,
      subTotal: receiptDetailsTotals.subTotal,
      discountAmount: receiptDetailsTotals.discountAmount,
      taxableAmount,
      cgstAmount: receiptDetailsTotals.cgstAmount,
      sgstAmount: receiptDetailsTotals.sgstAmount,
      igstAmount: receiptDetailsTotals.igstAmount,
      additionalCharges: chargesTotal,
      roundOff,
      grandTotal: roundedGrandTotal,
      exchangeRate: parseFloat(formData.exchangeRate) || 1
    };

    try {
      if (isEditing) {
        await axios.put(`${API_PATHS.SM.INVOICES}/${id}`, payload);
        dispatch(openSnackbar({ open: true, message: 'Delivery Receipt updated successfully!', variant: 'alert', severity: 'success' }));
      } else {
        await axios.post(API_PATHS.SM.INVOICES, payload);
        dispatch(openSnackbar({ open: true, message: 'Delivery Receipt created successfully!', variant: 'alert', severity: 'success' }));
      }
      navigate('/sm/sales/customer/delivery-receipts');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'Failed to save delivery receipt.';
      dispatch(openSnackbar({ open: true, message: errMsg, variant: 'alert', severity: 'error' }));
    } finally {
      setSaving(false);
    }
  }, [formData, receiptDetailsTotals, taxableAmount, chargesTotal, roundOff, roundedGrandTotal, isEditing, id, dispatch, navigate]);

  const handleCancel = useCallback(() => {
    navigate('/sm/sales/customer/delivery-receipts');
  }, [navigate]);

  // ── KEYBOARD SHORTCUTS LISTENER ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isAltS = e.altKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS');
      const isCtrlS = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS');
      const isAltC = e.altKey && (e.key === 'c' || e.key === 'C' || e.code === 'KeyC');
      const isAltA = e.altKey && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA');
      const isAltH = e.altKey && (e.key === 'h' || e.key === 'H' || e.code === 'KeyH');

      if (isAltS || isCtrlS) {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
      } else if (isAltC || (e.key === 'Escape' && !showPartModal)) {
        e.preventDefault();
        handleCancel();
      } else if (isAltA) {
        e.preventDefault();
        handleAddRow();
      } else if (isAltH) {
        e.preventDefault();
        handleAddChargeRow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleCancel, handleAddRow, handleAddChargeRow, showPartModal]);

  const formatEntryDate = (dateVal) => {
    if (!dateVal) return '';
    return formatDateTime(dateVal, timeFormat, dateFormat);
  };

  const receiptDateToShow = isEditing ? formatEntryDate(formData.invoiceDate) : formatEntryDate(new Date());

  const modalLines = useMemo(() => {
    const po = customerPOs.find(p => p.orderNo === formData.customerPo);
    if (!po) return [];
    let lines = po.eligibleLines || [];
    
    if (formData.scheduleNo) {
      const schedule = customerSchedules.find(s => s.id?.toString() === formData.scheduleNo);
      if (schedule && schedule.orderItemId) {
        lines = lines.filter(l => l.id === schedule.orderItemId);
      }
    }
    return lines;
  }, [customerPOs, formData.customerPo, formData.scheduleNo, customerSchedules]);

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', p: 0 }}>
      
      {/* ── TOP HEADER BLOCK ── */}
      <BOSPageHeader
        title="Delivery Chellan (DC)"
        icon={<IconTruckDelivery size={24} />}
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 170 }}>
              <BOSTextField
                fullWidth
                size="small"
                name="invoiceNo"
                label="Receipt No"
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
            <Box sx={{ width: 170 }}>
              <BOSTextField
                fullWidth
                size="small"
                name="invoiceDate"
                label="Receipt Date"
                value={receiptDateToShow}
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

      {/* ── MAIN CONTENT: CRISP & COMPACT ── */}
      <Box sx={{ p: 2 }}>

        {/* ── SECTION 1: CUSTOMER & PARTY DETAILS ── */}
        <Box sx={{ mb: 2 }}>
          <BOSFormSection
            title="Customer & Party Details"
            icon={<IconUser size={20} color="#3b82f6" />}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              
              {/* Bill To */}
              <Box sx={{ flex: '1 1 48%', minWidth: 300 }}>
                <BOSAutocomplete
                  options={customers}
                  getOptionLabel={opt => opt ? opt.customerName : ''}
                  value={customers.find(c => c.id === formData.customerId) || null}
                  onChange={handleCustomerChange}
                  label="Bill To *"
                  required
                  disabled={isEditing}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconBuilding size={20} color="#64748b" />
                      </InputAdornment>
                    )
                  }}
                />
                
                {/* Billing Address Area */}
                <Box sx={{ position: 'relative', mt: 1.5, pt: 1 }}>
                  <Box sx={{ border: '1px solid #fbbf24', borderRadius: 1, p: 1.5, minHeight: 80, bgcolor: 'transparent' }}>
                    <Typography component="span" sx={{ position: 'absolute', top: 0, left: 12, bgcolor: '#fff', px: 0.5, fontSize: '0.75rem', fontWeight: 600, color: '#64748b', fontStyle: 'italic' }}>
                      Address
                    </Typography>
                    {formData.customerId ? (
                      <>
                        {(() => {
                          const addr = billingAddresses.find(a => a.id == formData.billingAddressId);
                          if (addr) {
                            const cityState = [addr.city, addr.state].filter(Boolean).join(', ');
                            const pin = addr.pincode ? ` - ${addr.pincode}` : '';
                            const cityStatePin = `${cityState}${pin}`;
                            return (
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', mb: 0.5 }}>
                                  {addr.address || addr.addressLine1}
                                </Typography>
                                {(cityStatePin || addr.addressLine2) && (
                                  <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
                                    {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{cityStatePin}
                                  </Typography>
                                )}
                                {addr.country && (
                                  <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
                                    {addr.country}
                                  </Typography>
                                )}
                              </Box>
                            );
                          } else if (billingAddresses.length === 0) {
                            return <Typography variant="body2" sx={{ color: '#ef4444', fontStyle: 'italic', mt: 0.5 }}>No address found for this customer.</Typography>;
                          } else {
                            return <Typography variant="body2" sx={{ color: '#f59e0b', fontStyle: 'italic', mt: 0.5 }}>Loading address...</Typography>;
                          }
                        })()}
                      </>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>Select a customer to view address...</Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Ship To */}
              <Box sx={{ flex: '1 1 48%', minWidth: 300 }}>
                <BOSAutocomplete
                  options={customers}
                  getOptionLabel={opt => opt ? opt.customerName : ''}
                  value={customers.find(c => c.id === shippingCustomerId) || null}
                  onChange={handleShippingCustomerChange}
                  label="Ship To *"
                  disabled={isEditing}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconTruck size={20} color="#64748b" />
                      </InputAdornment>
                    )
                  }}
                />

                {/* Shipping Address Area */}
                <Box sx={{ position: 'relative', mt: 1.5, pt: 1 }}>
                  <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1, p: 1.5, minHeight: 80, bgcolor: 'transparent' }}>
                    <Typography component="span" sx={{ position: 'absolute', top: 0, left: 12, bgcolor: '#fff', px: 0.5, fontSize: '0.75rem', fontWeight: 600, color: '#64748b', fontStyle: 'italic' }}>
                      Address
                    </Typography>
                    {shippingCustomerId ? (
                      <>
                        {(() => {
                          const addr = shippingAddresses.find(a => a.id == formData.shippingAddressId);
                          if (addr) {
                            const cityState = [addr.city, addr.state].filter(Boolean).join(', ');
                            const pin = addr.pincode ? ` - ${addr.pincode}` : '';
                            const cityStatePin = `${cityState}${pin}`;
                            return (
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', mb: 0.5 }}>
                                  {addr.address || addr.addressLine1}
                                </Typography>
                                {(cityStatePin || addr.addressLine2) && (
                                  <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
                                    {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{cityStatePin}
                                  </Typography>
                                )}
                                {addr.country && (
                                  <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
                                    {addr.country}
                                  </Typography>
                                )}
                              </Box>
                            );
                          } else if (shippingAddresses.length === 0) {
                            return <Typography variant="body2" sx={{ color: '#ef4444', fontStyle: 'italic', mt: 0.5 }}>No address found for this customer.</Typography>;
                          } else {
                            return <Typography variant="body2" sx={{ color: '#f59e0b', fontStyle: 'italic', mt: 0.5 }}>Loading address...</Typography>;
                          }
                        })()}
                      </>
                    ) : (
                      <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>Select a customer to view address...</Typography>
                    )}
                  </Box>
                </Box>
              </Box>

            </Box>
          </BOSFormSection>
        </Box>

        {/* ── SECTION 2: DISPATCH DETAILS ── */}
        <Box sx={{ mb: 2 }}>
          <BOSFormSection
            title="Dispatch Details"
            icon={<IconClipboardList size={20} color="#374151" />}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 15%', minWidth: 140 }}>
                <BOSAutocomplete
                  options={customerPOs}
                  getOptionLabel={opt => opt ? opt.orderNo : ''}
                  value={customerPOs.find(p => p.orderNo === formData.customerPo) || null}
                  onChange={(e, val) => {
                    if (!val) {
                      setFormData(prev => ({ ...prev, customerPo: '', scheduleNo: '' }));
                      return;
                    }
                    setFormData(prev => ({ ...prev, customerPo: val.orderNo }));
                  }}
                  label="Customer PO / Ref"
                  placeholder="Select PO number..."
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box sx={{ flex: '1 1 15%', minWidth: 140 }}>
                <BOSAutocomplete
                  options={customerSchedules.filter(s => !formData.customerPo || s.orderNo === formData.customerPo)}
                  getOptionLabel={opt => opt ? `${opt.id} - ${opt.itemCode}` : ''}
                  value={customerSchedules.find(s => s.id?.toString() === formData.scheduleNo) || null}
                  onChange={(e, val) => {
                    if (!val) {
                      setFormData(prev => ({ ...prev, scheduleNo: '' }));
                      return;
                    }
                    setFormData(prev => {
                      const updated = { ...prev, scheduleNo: val.id?.toString() };
                      
                      // Auto-select PO if not already selected
                      if (!updated.customerPo) {
                        updated.customerPo = val.orderNo;
                      }

                      return updated;
                    });
                  }}
                  label="Schedule No"
                  placeholder="Select Schedule..."
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box sx={{ flex: '1 1 15%', minWidth: 140 }}>
                <BOSTextField
                  select
                  fullWidth
                  name="currencyCode"
                  label="Currency *"
                  value={formData.currencyCode}
                  onChange={handleCurrencyChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ bgcolor: '#fbbf24', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>₹</Box>
                      </InputAdornment>
                    )
                  }}
                >
                  {currenciesList.map(curr => (
                    <MenuItem key={curr.id || curr.currencyCode} value={curr.currencyCode || curr.code}>
                      {curr.currencyCode || curr.code}
                    </MenuItem>
                  ))}
                </BOSTextField>
              </Box>
              <Box sx={{ flex: '1 1 15%', minWidth: 140 }}>
                <BOSTextField
                  type="number"
                  fullWidth
                  name="exchangeRate"
                  label="Exchange Rate"
                  value={formData.exchangeRate}
                  onChange={e => setFormData(prev => ({ ...prev, exchangeRate: e.target.value }))}
                  disabled={formData.currencyCode === 'INR'}
                />
              </Box>
              <Box sx={{ flex: '1 1 15%', minWidth: 140 }}>
                <BOSTextField
                  select
                  fullWidth
                  name="paymentTerms"
                  label="Payment Terms *"
                  value={formData.paymentTerms}
                  onChange={e => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                >
                  {paymentTermsList.map(pt => (
                    <MenuItem key={pt.id} value={pt.termName || pt.description}>{pt.termName || pt.description}</MenuItem>
                  ))}
                </BOSTextField>
              </Box>
              <Box sx={{ flex: '1 1 15%', minWidth: 140 }}>
                <BOSTextField
                  select
                  fullWidth
                  name="deliveryTerms"
                  label="Delivery Terms *"
                  value={formData.deliveryTerms}
                  onChange={e => setFormData(prev => ({ ...prev, deliveryTerms: e.target.value }))}
                >
                  {deliveryTermsList.map(dt => (
                    <MenuItem key={dt.id} value={dt.termName || dt.description}>{dt.termName || dt.description}</MenuItem>
                  ))}
                </BOSTextField>
              </Box>
              <Box sx={{ flex: '1 1 20%', minWidth: 180 }}>
                <BOSTextField
                  fullWidth
                  name="remarks"
                  label="Dispatch / Delivery Reference"
                  placeholder="Dispatch / Delivery Ref..."
                  value={formData.remarks || ''}
                  onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>
          </BOSFormSection>
        </Box>


        {/* ── SECTION 2: DELIVERY ITEMS (DC) ── */}
        <Box sx={{ mb: 2 }}>
          <BOSFormSection
            title="Delivery Items (DC)"
            icon={<Box sx={{ bgcolor: '#2563eb', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>2</Box>}
            action={
              <Tooltip title="Add Item (Alt + A)">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<IconPlus size={16} />}
                  onClick={handleAddRow}
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#fff',
                    borderRadius: '20px',
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 2.5,
                    py: 0.5,
                    boxShadow: '0 3px 10px 0 rgba(0,0,0,0.1)',
                    '&:hover': { bgcolor: 'primary.dark', transform: 'translateY(-1px)' }
                  }}
                >
                  Add Item
                </Button>
              </Tooltip>
            }
          >
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', overflowX: 'auto', minHeight: '350px' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#2563eb' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#fff', fontWeight: 700, width: 45, py: 1 }}>#</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 700, minWidth: 150, py: 1 }}>PART NO *</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 700, minWidth: 250, py: 1 }}>DESCRIPTION</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 700, width: 90, py: 1 }} align="center">UOM</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 700, width: 110, py: 1 }} align="right">QUANTITY *</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 700, width: 140, py: 1 }} align="right">UNIT PRICE ({formData.currencyCode}) *</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 700, width: 95, py: 1 }} align="right">DISCOUNT (%)</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 700, width: 90, py: 1 }} align="center">TAX</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 700, minWidth: 130, py: 1 }} align="right">AMOUNT ({formData.currencyCode})</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 700, width: 55, py: 1 }} align="center">ACTION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.invoiceDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 10, color: '#64748b' }}>
                        No delivery items added yet. Click "Add Item" to add a row.
                      </TableCell>
                    </TableRow>
                  ) : (
                    formData.invoiceDetails.map((row, index) => (
                      <TableRow key={index} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#fbfcfd' } }}>
                        <TableCell sx={{ fontWeight: 600, py: 1.5 }}>{index + 1}</TableCell>

                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {row.partNo || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ color: '#475569' }}>
                            {row.partName || '-'}
                          </Typography>
                        </TableCell>

                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>
                            {row.uom || 'NOS'}
                          </Typography>
                        </TableCell>

                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <BOSTextField
                            type="number"
                            value={row.qty}
                            onChange={e => handleRowChange(index, 'qty', e.target.value)}
                            error={row.maxQty !== undefined && parseFloat(row.qty) > parseFloat(row.maxQty)}
                            helperText={row.maxQty !== undefined && parseFloat(row.qty) > parseFloat(row.maxQty) ? `Max: ${row.maxQty}` : ''}
                            sx={{ width: 100, '& input': { textAlign: 'right', fontWeight: 600 } }}
                          />
                        </TableCell>

                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <BOSTextField
                            type="number"
                            value={row.price}
                            onChange={e => handleRowChange(index, 'price', e.target.value)}
                            sx={{ width: 130, '& input': { textAlign: 'right', fontWeight: 600 } }}
                          />
                        </TableCell>

                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <BOSTextField
                            type="number"
                            value={row.discountPer}
                            onChange={e => handleRowChange(index, 'discountPer', e.target.value)}
                            sx={{ width: 75, '& input': { textAlign: 'right' } }}
                          />
                        </TableCell>

                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569' }}>GST 18%</Typography>
                        </TableCell>

                        <TableCell align="right" sx={{ py: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                            {parseFloat(row.netAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        </TableCell>

                        <TableCell align="center" sx={{ py: 1.5 }}>
                          <IconButton size="small" color="error" onClick={() => handleRemoveLine(index)}>
                            <IconTrash size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <Tooltip title="Add Another Item (Alt + A)">
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<IconPlus size={14} />}
                  onClick={handleAddRow}
                  sx={{ textTransform: 'none', borderRadius: '4px', fontWeight: 600, py: 0.5 }}
                >
                  Add Another Item
                </Button>
              </Tooltip>
            </Box>
          </BOSFormSection>
        </Box>

        {/* ── SECTION 3 & 4: CHARGES & VALUATION SUMMARY ── */}
        <Grid container spacing={2} justifyContent="space-between" alignItems="flex-start">
          
          {/* Section 3 - Additional Charges (Left Side) */}
          <Grid item xs={12} md={6} lg={6.5}>
            <BOSFormSection
              title="Additional Charges"
              icon={<Box sx={{ bgcolor: '#2563eb', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>3</Box>}
              action={
                <Tooltip title="Add Charge (Alt + H)">
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<IconPlus size={14} />}
                    onClick={handleAddChargeRow}
                    sx={{ textTransform: 'none', borderRadius: '6px', fontWeight: 600, py: 0.4 }}
                  >
                    Add Charge
                  </Button>
                </Tooltip>
              }
            >
              <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', mb: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, py: 0.75, width: 40 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, py: 0.75 }}>Charge Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, py: 0.75, width: 140 }}>Amount ({formData.currencyCode})</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, py: 0.75, width: 50 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.invoiceCharges.map((charge, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ py: 0.5 }}>{idx + 1}</TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <BOSTextField
                            select
                            fullWidth
                            size="small"
                            value={charge.chargeId}
                            onChange={e => handleChargeChange(idx, 'chargeId', e.target.value)}
                          >
                            {chargeMasters.map(cm => (
                              <MenuItem key={cm.id} value={cm.id}>{cm.charges || cm.chargeName}</MenuItem>
                            ))}
                          </BOSTextField>
                        </TableCell>
                        <TableCell align="right" sx={{ py: 0.5 }}>
                          <BOSTextField
                            type="number"
                            size="small"
                            value={charge.amount}
                            onChange={e => handleChargeChange(idx, 'amount', e.target.value)}
                            sx={{ width: 130, '& input': { textAlign: 'right' } }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 0.5 }}>
                          <IconButton size="small" color="error" onClick={() => handleRemoveCharge(idx)}>
                            <IconTrash size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {formData.invoiceCharges.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 2, color: '#64748b' }}>
                          No additional charges added.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {formData.invoiceCharges.length > 0 && (
                <Box display="flex" justifyContent="space-between" sx={{ px: 1.5, py: 1, bgcolor: '#f8fafc', borderRadius: '4px' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>Total Charges:</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e3a8a' }}>{chargesTotal.toFixed(2)} {formData.currencyCode}</Typography>
                </Box>
              )}
            </BOSFormSection>
          </Grid>

          {/* Section 4 - Receipt Summary (Right Side) */}
          <Grid item xs={12} md={6} lg={5}>
            <Box sx={{ width: '100%', ml: 'auto' }}>
              <BOSFormSection
                title="Receipt Valuation Summary"
                icon={<Box sx={{ bgcolor: '#2563eb', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>4</Box>}
                action={<IconFileText size={18} style={{ color: '#94a3b8' }} />}
              >
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: '#64748b' }}>Subtotal (Items)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{receiptDetailsTotals.subTotal.toFixed(2)}</Typography>
                  </Box>
                  {receiptDetailsTotals.discountAmount > 0 && (
                    <Box display="flex" justifyContent="space-between" sx={{ color: '#ef4444' }}>
                      <Typography variant="body2">Discount</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>-{receiptDetailsTotals.discountAmount.toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600 }}>Taxable Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{taxableAmount.toFixed(2)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: '#64748b' }}>CGST (9%)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{receiptDetailsTotals.cgstAmount.toFixed(2)}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: '#64748b' }}>SGST (9%)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{receiptDetailsTotals.sgstAmount.toFixed(2)}</Typography>
                  </Box>
                  {chargesTotal > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: '#64748b' }}>Additional Charges</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{chargesTotal.toFixed(2)}</Typography>
                    </Box>
                  )}
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: '#64748b' }}>Round Off</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{roundOff.toFixed(2)}</Typography>
                  </Box>
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <Box
                    sx={{
                      bgcolor: '#2563eb',
                      color: '#fff',
                      p: 1.5,
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800 }}>Grand Total ({formData.currencyCode})</Typography>
                    <Typography variant="h4" sx={{ color: '#fff', fontWeight: 900 }}>{roundedGrandTotal.toFixed(2)}</Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 700, display: 'block', textAlign: 'left', fontStyle: 'italic', mt: 0.5 }}>
                    Amount in Words : {numberToWords(roundedGrandTotal)}
                  </Typography>
                </Box>
              </BOSFormSection>
            </Box>
          </Grid>
        </Grid>

        {/* ── ACTION FOOTER WITH BOS TOKENS & SHORTCUTS ── */}
        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 2.5 }}>
          {isEditing && (
            <Tooltip title="Print / Download PDF (Alt + P)">
              <Button
                variant="outlined"
                color="info"
                startIcon={<IconPrinter size={18} />}
                onClick={() => setPdfDialogOpen(true)}
                sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 700, px: 2.5 }}
              >
                Print PDF
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Cancel (Esc / Alt + C)">
            <Button
              variant="contained"
              sx={btnCancel}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </Tooltip>
          <Tooltip title="Save Delivery Receipt (Alt + S / Ctrl + S)">
            <Button
              variant="contained"
              sx={btnSave}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={18} />}
              onClick={handleSave}
              disabled={saving}
            >
              {isEditing ? 'Update DC' : 'Save Delivery Receipt'}
            </Button>
          </Tooltip>
        </Stack>

      </Box>

      {/* ── PART SEARCH MODAL ── */}
      <Dialog
        open={showPartModal}
        onClose={() => setShowPartModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Find Catalog Part / Product</Typography>
          <IconButton size="small" onClick={() => setShowPartModal(false)}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <BOSTextField
            fullWidth
            size="small"
            placeholder="Search by part number, name, or description..."
            value={modalSearch}
            onChange={handleModalSearchChange}
            InputProps={{
              startAdornment: <IconSearch size={18} style={{ marginRight: 8, color: '#94a3b8' }} />
            }}
            sx={{ mb: 2 }}
          />

          <List sx={{ maxHeight: 380, overflow: 'auto', p: 0 }}>
            {modalParts.map((part, index) => {
              const isLast = index === modalParts.length - 1;
              return (
                <ListItemButton
                  key={part.id || index}
                  ref={isLast ? lastModalPartRef : null}
                  onClick={() => selectPartFromModal(part)}
                  sx={{
                    border: '1px solid #f1f5f9',
                    borderRadius: '6px',
                    mb: 1,
                    p: 1.2,
                    '&:hover': { bgcolor: '#eff6ff', borderColor: '#bfdbfe' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563eb' }}>
                          {part.itemNo}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
                          {part.itemName || part.itemDescription}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Category: <b>{part.itemCategory || 'Standard'}</b>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          UOM: <b>{part.uomName || part.uom || 'NOS'}</b>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                          Rate: ₹{parseFloat(part.rate || part.standardPrice || 0).toFixed(2)}
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItemButton>
              );
            })}
            {modalLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={28} />
              </Box>
            )}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setShowPartModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── PO ITEMS MODAL ── */}
      <Dialog 
        open={showPoItemsModal} 
        onClose={() => setShowPoItemsModal(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', p: 2 }}>
          <Typography variant="h4" color="#1e293b">Select Items from Order: {formData.customerPo}</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2, bgcolor: '#fbfcfd', minHeight: 400 }}>
          <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox 
                      size="small"
                      checked={
                        modalLines.length > 0 && selectedPoLineIds.length === modalLines.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPoLineIds(modalLines.map(l => l.id));
                        } else {
                          setSelectedPoLineIds([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>PART NO & DESCRIPTION</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>UOM</TableCell>
                  <TableCell sx={{ fontWeight: 700, align: 'right' }}>PENDING QTY</TableCell>
                  <TableCell sx={{ fontWeight: 700, align: 'right' }}>PRICE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modalLines.length === 0 && (
                  <TableRow><TableCell colSpan={5} align="center">No pending items found.</TableCell></TableRow>
                )}
                {modalLines.map((line, idx) => (
                  <TableRow key={line.id} hover onClick={() => {
                    setSelectedPoLineIds(prev => 
                      prev.includes(line.id) ? prev.filter(id => id !== line.id) : [...prev, line.id]
                    );
                  }} sx={{ cursor: 'pointer' }}>
                    <TableCell padding="checkbox">
                      <Checkbox 
                        size="small"
                        checked={selectedPoLineIds.includes(line.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedPoLineIds(prev => 
                            e.target.checked ? [...prev, line.id] : prev.filter(id => id !== line.id)
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{line.partNo}</Typography>
                      <Typography variant="caption" color="textSecondary">{line.partName}</Typography>
                    </TableCell>
                    <TableCell>{line.uom}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{line.balanceQty}</TableCell>
                    <TableCell align="right">₹{parseFloat(line.unitPrice || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <Button onClick={() => setShowPoItemsModal(false)} color="inherit">Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddSelectedPoLines}
            disabled={selectedPoLineIds.length === 0}
            sx={{ fontWeight: 700, borderRadius: '8px' }}
          >
            Add Selected Items ({selectedPoLineIds.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── PDF PREVIEW DIALOG ── */}
      <DeliveryReceiptPdfDialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        receipt={{
          ...formData,
          customerName: customers.find(c => c.id === formData.customerId)?.customerName || 'Customer',
          grandTotal: roundedGrandTotal,
          subTotal: receiptDetailsTotals.subTotal,
          discountAmount: receiptDetailsTotals.discountAmount,
          cgstAmount: receiptDetailsTotals.cgstAmount,
          sgstAmount: receiptDetailsTotals.sgstAmount,
          additionalCharges: chargesTotal
        }}
      />

    </Box>
  );
}
