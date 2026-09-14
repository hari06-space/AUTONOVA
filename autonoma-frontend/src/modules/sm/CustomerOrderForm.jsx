import { useState, useEffect } from 'react';
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
  TableFooter,
  Paper,
  IconButton,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Switch,
  FormControlLabel,
  useTheme,
  useColorScheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Tooltip,
  Radio
} from '@mui/material';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconEraser,
  IconPlus,
  IconTrash,
  IconCheck,
  IconReceipt2,
  IconUser,
  IconBuilding,
  IconTruck,
  IconClipboardList,
  IconChevronDown,
  IconSearch,
  IconX,
  IconCalendarEvent,
  IconPhoto
} from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import { BOSTextField, BOSDatePicker, btnSave, btnCancel, btnClear, BOSFormSection, BOSAutocomplete } from 'ui-component/bos';
import PartLookupDialog from './popup/PartLookupDialog';
import AddCustomerDetailsDialog from './AddCustomerDetailsDialog';
import useBOSValidation from 'hooks/useBOSValidation';
import { format } from 'date-fns';
import { isInterStateTransaction, calculateApplicableTaxes } from 'utils/taxUtils';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';

const formatAddress = (cust) => {
  if (!cust) return '';
  const parts = [];
  if (cust.address) parts.push(cust.address);
  if (cust.city || cust.state) {
    const cityState = [cust.city, cust.state].filter(Boolean).join(', ');
    if (cityState) parts.push(cityState);
  }
  if (cust.country || cust.pinCode || cust.pincode) {
    const countryPin = [cust.country, cust.pinCode || cust.pincode].filter(Boolean).join(' - ');
    if (countryPin) parts.push(countryPin);
  }
  return parts.join('\n');
};

const INITIAL_STATE = {
  customerName: '',
  custId: '',
  woNo: '0',
  entryDate: format(new Date(), 'dd/MM/yyyy HH:mm'),
  billCustId: '',
  billAddress: '',
  shipCustId: '',
  shipAddress: '',
  orderNo: '',
  orderDate: new Date().toISOString().split('T')[0],
  orderType: 'Non Recurring',
  orderCategory: 'Customer',
  orderRecDate: new Date().toISOString().split('T')[0],
  paymentTerms: '30 Days',
  currencyCode: 'INR',
  exchangeRate: '1.000',
  quotationNo: '',
  quotationDate: '',
  modeOfDespatch: '',
  supplyCondition: '',
  deliveryTerms: '',
  orderDetails: [],
  orderCharges: []
};

const recalculateRow = (row) => {
  const qty = parseFloat(row.qty) || 0;
  const price = parseFloat(row.price) || 0;
  const discountPer = parseFloat(row.discountPer) || 0;
  const cgstPer = parseFloat(row.cgstPer) || 0;
  const sgstPer = parseFloat(row.sgstPer) || 0;
  const igstPer = parseFloat(row.igstPer) || 0;
  const freightPer = parseFloat(row.freightPer) || 0;

  const orderPrice = qty * price;
  row.orderPrice = orderPrice.toFixed(3);

  const discountAmt = orderPrice * (discountPer / 100);
  const taxableValue = orderPrice - discountAmt;
  const taxAmt = taxableValue * ((cgstPer + sgstPer + igstPer) / 100);
  row.taxAmt = taxAmt.toFixed(2);
  const freightAmt = taxableValue * (freightPer / 100);

  const itemValue = taxableValue + taxAmt + freightAmt;
  row.itemValue = itemValue.toFixed(3);
  return row;
};

const applyQuotationToRow = (row, quotation, part) => {
  if (!quotation || !quotation.parts || quotation.parts.length === 0) return row;

  // Find matching part item inside quotation parts list
  const qPart = quotation.parts.find(p => 
    (p.partNoId && part && part.id && String(p.partNoId) === String(part.id)) ||
    (p.partNo && part && part.itemNo && p.partNo.toLowerCase() === part.itemNo.toLowerCase()) ||
    (p.name && part && part.itemName && p.name.toLowerCase() === part.itemName.toLowerCase())
  ) || quotation.parts[0];

  if (qPart) {
    const qtyVal = parseFloat(qPart.qty || qPart.reqQty || 0);
    const rateVal = parseFloat(qPart.unitRate || qPart.amount || qPart.price || 0);
    const discountVal = parseFloat(qPart.discount || 0);
    const disType = qPart.disType || '%';

    let discountPer = 0;
    if (disType === '%' || !disType) {
      discountPer = discountVal;
    } else if (disType === 'Amt' && (qtyVal * rateVal) > 0) {
      discountPer = (discountVal / (qtyVal * rateVal)) * 100;
    }

    if (qtyVal > 0) row.qty = qtyVal;
    if (rateVal > 0) row.price = rateVal;
    if (qPart.hsnCode) row.hsnCode = qPart.hsnCode;
    if (qPart.uom) row.uom = qPart.uom;
    row.discountPer = discountPer;

    if (parseFloat(qPart.cgstRate) > 0 || parseFloat(qPart.sgstRate) > 0 || parseFloat(qPart.igstRate) > 0) {
      row.cgstPer = parseFloat(qPart.cgstRate || 0);
      row.sgstPer = parseFloat(qPart.sgstRate || 0);
      row.igstPer = parseFloat(qPart.igstRate || 0);
    }

    row = recalculateRow(row);
  }
  return row;
};

export default function CustomerOrderForm() {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [customers, setCustomers] = useState([]);
  const [despatchModes, setDespatchModes] = useState([]);
  const [paymentTermsList, setPaymentTermsList] = useState([]);
  const [deliveryTermsList, setDeliveryTermsList] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [uomList, setUomList] = useState([]);
  const [additionalChargesMaster, setAdditionalChargesMaster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [partLookupOpen, setPartLookupOpen] = useState(false);
  const [activeRowIndex, setActiveRowIndex] = useState(null);
  const [selectedScheduleItemIndex, setSelectedScheduleItemIndex] = useState(null);

  const [billAddresses, setBillAddresses] = useState([]);
  const [shipAddresses, setShipAddresses] = useState([]);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressTarget, setAddressTarget] = useState(null); // 'bill' or 'ship'

  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedLineItems, setSelectedLineItems] = useState([]);

  const handleApprovalAction = async (status) => {
    if (selectedLineItems.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'Please select at least one line item.', variant: 'alert', severity: 'warning' }));
      return;
    }

    try {
      setLoading(true);
      await axios.put(`${API_PATHS.SM.CUSTOMER_ORDERS}/${id}/line-items/approval`, {
        lineItemIds: selectedLineItems,
        status: status
      });

      dispatch(openSnackbar({
        open: true,
        message: `Selected line items successfully ${status.toLowerCase()}!`,
        variant: 'alert',
        severity: 'success'
      }));

      // Refresh order details from backend
      const response = await axios.get(`${API_PATHS.SM.CUSTOMER_ORDERS}/${id}`);
      setFormData(response.data);
      setSelectedLineItems([]);
      setApprovalDialogOpen(false);
    } catch (error) {
      console.error('Failed to update line items approval status:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to update approval status.', variant: 'alert', severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useKeyboardShortcuts({
    'ctrl+s': (e) => {
      if (e) e.preventDefault();
      handleSave();
    },
    'alt+v': (e) => {
      if (approvalDialogOpen && selectedLineItems.length > 0) {
        if (e) e.preventDefault();
        handleApprovalAction('VERIFIED');
      }
    },
    'alt+r': (e) => {
      if (approvalDialogOpen && selectedLineItems.length > 0) {
        if (e) e.preventDefault();
        handleApprovalAction('REJECTED');
      }
    }
  });

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [custRes, modeRes, termsRes, curRes, uomRes, chargesRes] = await Promise.all([
          axios.get(API_PATHS.SM.CUSTOMERS, { skipGlobalAlert: true }).catch(() => ({ data: [] })),
          axios.get('/api/sm/despatch-mode', { skipGlobalAlert: true }).catch(() => ({ data: [] })),
          axios.get('/api/terms-master', { skipGlobalAlert: true }).catch(() => ({ data: [] })),
          axios.get('/api/admin/currency', { skipGlobalAlert: true }).catch(() => ({ data: [] })),
          axios.get('/api/master/admin/uom', { skipGlobalAlert: true }).catch(() => ({ data: [] })),
          axios.get(API_PATHS.SM.ADDITIONAL_CHARGES, { skipGlobalAlert: true }).catch(() => ({ data: [] }))
        ]);
        const isActive = (m) => m && (m.status === true || m.status === 1 || m.status === 'Active' || m.status === 'ACTIVE' || m.status === undefined || m.status === null);
        
        const allTerms = termsRes.data || [];
        const activeTerms = allTerms.filter(isActive);
        
        const ptList = activeTerms.filter(t => t.type && t.type.toUpperCase() === 'PAYMENT TERMS');
        const dtList = activeTerms.filter(t => t.type && (t.type.toUpperCase() === 'LEAD TIME FOR DELIVERY' || t.type.toUpperCase() === 'INCOTERMS OF DELIVERY'));

        setCustomers(custRes.data || []);
        setDespatchModes((modeRes.data || []).filter(isActive));
        setPaymentTermsList(ptList);
        setDeliveryTermsList(dtList);
        setCurrencies((curRes.data || []).filter(isActive));
        setUomList(uomRes.data ? uomRes.data.filter(isActive) : []);
        setAdditionalChargesMaster(chargesRes.data ? chargesRes.data.filter(isActive) : []);
      } catch (err) {
        console.error('Failed to fetch dependencies for customer order:', err);
      }
    };
    fetchDependencies();
  }, []);

  useEffect(() => {
    if (isEditing) {
      axios.get(`${API_PATHS.SM.CUSTOMER_ORDERS}/${id}`).then(async res => {
        if (res.data) {
          const fetchedData = res.data;
          if (fetchedData.orderDetails && Array.isArray(fetchedData.orderDetails)) {
            const custId = fetchedData.billCustId || fetchedData.custId;
            const updatedDetails = await Promise.all(fetchedData.orderDetails.map(async (row) => {
              let updatedRow = recalculateRow(row);
              let available = [];
              if (updatedRow.quotationNo) {
                available.push(updatedRow.quotationNo);
              }
              if (updatedRow.partNo || updatedRow.partName) {
                try {
                  const quotRes = await axios.get('/api/sm/quotation/by-product', {
                    params: {
                      customerId: custId || '',
                      partNo: updatedRow.partNo || '',
                      productName: updatedRow.partName || ''
                    },
                    skipGlobalAlert: true
                  }).catch(() => ({ data: [] }));
                  const quotList = quotRes.data || [];
                  updatedRow.fullQuotationsList = quotList;
                  const fetchedNos = quotList.map(q => q.quotationNo).filter(Boolean);
                  available = [...new Set([...available, ...fetchedNos])];
                } catch (err) {
                  // Keep existing
                }
              }
              updatedRow.availableQuotations = available;
              return updatedRow;
            }));
            fetchedData.orderDetails = updatedDetails;
          }
          setFormData(prev => ({
            ...prev,
            ...fetchedData,
            orderType: fetchedData.orderType || 'Non Recurring',
            orderCategory: fetchedData.orderCategory || 'Customer'
          }));
        }
      }).catch(err => {
        console.error("Failed to fetch order details", err);
      });
    }
  }, [id, isEditing]);

  const fetchAddresses = async (customerId, target) => {
    try {
      const res = await axios.get(`/api/sm/customer-details?customerId=${customerId}`, { skipGlobalAlert: true }).catch(() => ({ data: [] }));
      let addresses = res.data || [];

      // If no sub-addresses in CustomerAddress table, fallback to main customer object's address
      if (addresses.length === 0) {
        const cust = customers.find(c => String(c.id) === String(customerId));
        if (cust) {
          const formattedMain = formatAddress(cust);
          if (formattedMain) {
            addresses = [{
              id: cust.id,
              address: cust.address || '',
              city: cust.city || '',
              state: cust.state || '',
              country: cust.country || '',
              pinCode: cust.pinCode || cust.pincode || ''
            }];
          }
        }
      }

      if (target === 'bill') {
        setBillAddresses(addresses);
        if (addresses.length > 0) {
          const defaultAddr = addresses.find(a => a.isDefault || a.defaultAddress) || addresses[0];
          const formatted = formatAddress(defaultAddr);
          if (formatted) {
            setFormData(prev => ({ ...prev, billAddress: formatted }));
          }
        }
      } else if (target === 'ship') {
        setShipAddresses(addresses);
        if (addresses.length > 0) {
          const defaultAddr = addresses.find(a => a.isDefault || a.defaultAddress) || addresses[0];
          const formatted = formatAddress(defaultAddr);
          if (formatted) {
            setFormData(prev => ({ ...prev, shipAddress: formatted }));
          }
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ${target} addresses`, err);
    }
  };

  useEffect(() => {
    if (formData.billCustId) {
      fetchAddresses(formData.billCustId, 'bill');
    } else {
      setBillAddresses([]);
    }
  }, [formData.billCustId, customers]);

  useEffect(() => {
    if (formData.shipCustId) {
      fetchAddresses(formData.shipCustId, 'ship');
    } else {
      setShipAddresses([]);
    }
  }, [formData.shipCustId, customers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'currencyCode') {
      const isInr = value === 'INR';
      const newExch = isInr ? '1.000' : (formData.exchangeRate === '1.000' || !formData.exchangeRate ? '1' : formData.exchangeRate);
      const exchNum = parseFloat(newExch) || 1;

      setFormData(prev => ({
        ...prev,
        currencyCode: value,
        exchangeRate: newExch
      }));
      return;
    }

    if (name === 'exchangeRate') {
      const exchVal = value;
      const exchNum = parseFloat(exchVal) || 1;

      setFormData(prev => ({
        ...prev,
        exchangeRate: exchVal
      }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDetailRow = () => {
    if (!formData.billCustId || !formData.shipCustId) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Please select both Bill To and Ship To customers before adding items.',
          variant: 'alert',
          severity: 'error',
          alert: { color: 'error' },
          close: true
        })
      );
      return;
    }

    // Validate existing detail rows before adding a new one
    const details = formData.orderDetails || [];
    for (let i = 0; i < details.length; i++) {
      const item = details[i];
      if (!item.partNo) {
        dispatch(openSnackbar({ open: true, message: `Please enter Part No for Row ${i + 1} before adding a new row.`, variant: 'alert', severity: 'error', alert: { color: 'error' } }));
        return;
      }
      if (!item.qty || parseFloat(item.qty) <= 0) {
        dispatch(openSnackbar({ open: true, message: `Please enter a valid Quantity for Row ${i + 1} before adding a new row.`, variant: 'alert', severity: 'error', alert: { color: 'error' } }));
        return;
      }
      if (item.price === undefined || item.price === null || parseFloat(item.price) <= 0) {
        dispatch(openSnackbar({ open: true, message: `Please enter a valid Price for Row ${i + 1} before adding a new row.`, variant: 'alert', severity: 'error', alert: { color: 'error' } }));
        return;
      }
    }

    const newRow = {
      id: Date.now(), // temporary id
      partNo: '',
      partName: '',
      quotationNo: '',
      hsnCode: '',
      uom: 'Nos',
      stock: 0,
      qty: 0,
      price: 0,
      orderPrice: 0,
      orderWeight: 0,
      discountPer: 0,
      cgstPer: 0,
      sgstPer: 0,
      igstPer: 0,
      freightPer: 0,
      itemValue: 0,
      approvalStatus: 'PENDING',
      status: 'ACTIVE'
    };
    setFormData(prev => ({ ...prev, orderDetails: [...prev.orderDetails, newRow] }));
  };



  const handlePartSelect = async (part) => {
    if (activeRowIndex !== null) {
      // Duplicate Part No Validation
      const isDuplicate = formData.orderDetails.some((row, idx) => 
        idx !== activeRowIndex && 
        ((part.id && row.productId && String(row.productId) === String(part.id)) ||
         (part.itemNo && row.partNo && row.partNo.toLowerCase() === part.itemNo.toLowerCase()))
      );

      if (isDuplicate) {
        dispatch(openSnackbar({
          open: true,
          message: `Part No '${part.itemNo || part.itemName}' is already added in line items. Duplicate parts are not allowed.`,
          variant: 'alert',
          severity: 'error',
          alert: { color: 'error' },
          close: true
        }));
        return;
      }

      const updatedDetails = [...formData.orderDetails];
      let row = { ...updatedDetails[activeRowIndex] };
      row.productId = part.id;
      row.partNo = part.itemNo || '';
      row.partName = part.itemName || '';
      row.hsnCode = part.hsnCode || '';
      row.uom = part.uom || 'NOS';
      row.stock = part.stockQty || 0;

      let fetchedPrice = 0;
      try {
        const custId = formData.billCustId || formData.custId;
        const res = await axios.get('/api/sales/price-master/applicable-price', {
          params: {
            customerId: custId || '',
            productId: part.id
          }
        });
        if (res.data !== undefined && res.data !== null) {
          const val = Number(res.data);
          if (val < 0) {
            dispatch(
              openSnackbar({
                open: true,
                message: 'Price not mapped for this product in Price Master or Product Master. Please map the price.',
                variant: 'alert',
                alert: { color: 'error' },
                close: true
              })
            );
            fetchedPrice = 0;
          } else {
            fetchedPrice = val;
          }
        }
      } catch (err) {
        console.error('Failed to fetch applicable price:', err);
        fetchedPrice = 0;
      }

      row.price = fetchedPrice;
      row.defaultPrice = fetchedPrice;

      // Fetch Verified Quotations for this Customer & Product
      row.availableQuotations = [];
      row.fullQuotationsList = [];
      try {
        const custId = formData.billCustId || formData.custId;
        const quotRes = await axios.get('/api/sm/quotation/by-product', {
          params: {
            customerId: custId || '',
            productId: part.id || '',
            partNo: part.itemNo || '',
            productName: part.itemName || ''
          },
          skipGlobalAlert: true
        }).catch(() => ({ data: [] }));
        const quotList = quotRes.data || [];
        if (quotList.length > 0) {
          row.fullQuotationsList = quotList;
          row.availableQuotations = [...new Set(quotList.map(q => q.quotationNo).filter(Boolean))];
          if (row.availableQuotations.length === 1) {
            row.quotationNo = row.availableQuotations[0];
            row = applyQuotationToRow(row, quotList[0], part);
          }
        }
      } catch (err) {
        console.error('Failed to fetch quotations:', err);
      }

      // Fetch HSN Tax Rates based on State Code
      const hsnCodeToUse = row.hsnCode || part.hsnCode;
      if (hsnCodeToUse) {
        try {
          const hsnRes = await axios.get(`/api/admin/hsn-codes/${hsnCodeToUse}`, { skipGlobalAlert: true }).catch(() => null);
          if (hsnRes && hsnRes.data) {
            const custId = formData.billCustId || formData.custId;
            const cust = customers.find(c => String(c.id) === String(custId));

            const taxes = calculateApplicableTaxes(hsnRes.data, cust?.stateCode);
            row.cgstPer = taxes.cgstPer;
            row.sgstPer = taxes.sgstPer;
            row.igstPer = taxes.igstPer;
          }
        } catch (err) {
          console.error('Failed to fetch HSN details:', err);
        }
      }

      // Recalculate fields based on new price and taxes
      row = recalculateRow(row);

      updatedDetails[activeRowIndex] = row;
      setFormData(prev => ({ ...prev, orderDetails: updatedDetails }));
    }
  };

  const handleDetailChange = async (index, field, value) => {
    const newDetails = [...formData.orderDetails];
    let row = { ...newDetails[index] };

    // Mutual exclusion logic for tax
    if ((field === 'cgstPer' || field === 'sgstPer') && parseFloat(value) > 0) {
      row.igstPer = 0;
    }
    if (field === 'igstPer' && parseFloat(value) > 0) {
      row.cgstPer = 0;
      row.sgstPer = 0;
    }

    row[field] = value;

    if (field === 'quotationNo') {
      if (value) {
        const selectedQuot = (row.fullQuotationsList || []).find(q => q.quotationNo === value);
        if (selectedQuot) {
          row = applyQuotationToRow(row, selectedQuot, { id: row.productId, itemNo: row.partNo, itemName: row.partName });
        }
      } else {
        // Revert to Price Master default price when quotation is cleared
        row.quotationNo = '';
        row.price = row.defaultPrice || 0;
        row.discountPer = 0;
      }
    }

    // Auto-fetch GST rates if HSN Code or Quotation changed
    if (field === 'hsnCode' || field === 'quotationNo') {
      const hsnCodeToUse = row.hsnCode;
      if (hsnCodeToUse) {
        try {
          const hsnRes = await axios.get(`/api/admin/hsn-codes/${hsnCodeToUse}`, { skipGlobalAlert: true }).catch(() => null);
          if (hsnRes && hsnRes.data) {
            const custId = formData.billCustId || formData.custId;
            const cust = customers.find(c => String(c.id) === String(custId));
            const taxes = calculateApplicableTaxes(hsnRes.data, cust?.stateCode);
            row.cgstPer = taxes.cgstPer;
            row.sgstPer = taxes.sgstPer;
            row.igstPer = taxes.igstPer;
          }
        } catch (err) {
          console.error('Failed to fetch HSN details:', err);
        }
      }
    }

    // Recalculate derived fields
    row = recalculateRow(row);

    newDetails[index] = row;
    setFormData(prev => ({ ...prev, orderDetails: newDetails }));
  };

  const handleRemoveDetailRow = (index) => {
    if (window.confirm("Are you sure you want to delete this line item?")) {
      setFormData(prev => ({
        ...prev,
        orderDetails: prev.orderDetails.filter((_, i) => i !== index)
      }));
    }
  };

  const handleAddCharge = () => {
    setFormData(prev => ({
      ...prev,
      orderCharges: [...(prev.orderCharges || []), {
        id: Date.now(),
        chargeId: '',
        chargeName: '',
        calculationType: 'ADD',
        amount: 0,
        taxAvailable: false,
        cgstPer: 0,
        cgstVal: 0,
        sgstPer: 0,
        sgstVal: 0,
        igstPer: 0,
        igstVal: 0
      }]
    }));
  };

  const handleChargeChange = (index, field, value) => {
    setFormData(prev => {
      const newCharges = [...(prev.orderCharges || [])];

      if (field === 'cgstVal') {
        const amt = parseFloat(newCharges[index].amount) || 0;
        newCharges[index].cgstVal = value;
        newCharges[index].cgstPer = amt ? ((parseFloat(value) / amt) * 100).toFixed(2) : 0;
      } else if (field === 'sgstVal') {
        const amt = parseFloat(newCharges[index].amount) || 0;
        newCharges[index].sgstVal = value;
        newCharges[index].sgstPer = amt ? ((parseFloat(value) / amt) * 100).toFixed(2) : 0;
      } else if (field === 'igstVal') {
        const amt = parseFloat(newCharges[index].amount) || 0;
        newCharges[index].igstVal = value;
        newCharges[index].igstPer = amt ? ((parseFloat(value) / amt) * 100).toFixed(2) : 0;
      } else {
        newCharges[index] = { ...newCharges[index], [field]: value };
        // Recalculate values if amount or percent fields are edited
        if (field === 'amount' || field === 'cgstPer' || field === 'sgstPer' || field === 'igstPer') {
          const amt = parseFloat(newCharges[index].amount) || 0;
          if (field === 'amount' || field === 'cgstPer') {
            newCharges[index].cgstVal = (amt * (parseFloat(newCharges[index].cgstPer) || 0) / 100).toFixed(2);
          }
          if (field === 'amount' || field === 'sgstPer') {
            newCharges[index].sgstVal = (amt * (parseFloat(newCharges[index].sgstPer) || 0) / 100).toFixed(2);
          }
          if (field === 'amount' || field === 'igstPer') {
            newCharges[index].igstVal = (amt * (parseFloat(newCharges[index].igstPer) || 0) / 100).toFixed(2);
          }
        }
      }

      if (field === 'chargeId') {
        const selected = additionalChargesMaster.find(c => c.id === value);
        if (selected) {
          newCharges[index].chargeName = selected.charges;
          newCharges[index].calculationType = selected.calculationType;
        }
      }

      return { ...prev, orderCharges: newCharges };
    });
  };

  const handleRemoveCharge = (index) => {
    if (window.confirm("Are you sure you want to delete this additional charge?")) {
      setFormData(prev => ({
        ...prev,
        orderCharges: (prev.orderCharges || []).filter((_, i) => i !== index)
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.orderNo) {
      dispatch(openSnackbar({ open: true, message: 'Order No is required', variant: 'alert', severity: 'error' }));
      return;
    }
    if (!formData.billCustId) {
      dispatch(openSnackbar({ open: true, message: 'Bill To is required', variant: 'alert', severity: 'error' }));
      return;
    }
    if (!formData.shipCustId) {
      dispatch(openSnackbar({ open: true, message: 'Ship To is required', variant: 'alert', severity: 'error' }));
      return;
    }
    if (!formData.paymentTerms) {
      dispatch(openSnackbar({ open: true, message: 'Payment Terms is required', variant: 'alert', severity: 'error' }));
      return;
    }
    if (!formData.currencyCode) {
      dispatch(openSnackbar({ open: true, message: 'Currency is required', variant: 'alert', severity: 'error' }));
      return;
    }

    if (formData.currencyCode.trim().toUpperCase() !== 'INR') {
      const exchRate = parseFloat(formData.exchangeRate);
      if (isNaN(exchRate) || exchRate <= 1) {
        dispatch(openSnackbar({ open: true, message: `Exchange Rate must be greater than 1 for ${formData.currencyCode}`, variant: 'alert', severity: 'error' }));
        return;
      }
    }
    if (!formData.modeOfDespatch) {
      dispatch(openSnackbar({ open: true, message: 'Mode of Despatch is required', variant: 'alert', severity: 'error' }));
      return;
    }
    if (!formData.deliveryTerms) {
      dispatch(openSnackbar({ open: true, message: 'Delivery Terms is required', variant: 'alert', severity: 'error' }));
      return;
    }
    if (!formData.orderDetails || formData.orderDetails.length === 0) {
      dispatch(openSnackbar({ open: true, message: 'At least one line item is required', variant: 'alert', severity: 'error' }));
      return;
    }

    // Verify each line item has partNo, qty, and price
    for (let i = 0; i < formData.orderDetails.length; i++) {
      const item = formData.orderDetails[i];
      if (!item.partNo) {
        dispatch(openSnackbar({ open: true, message: `Part No is required for line item ${i + 1}`, variant: 'alert', severity: 'error' }));
        return;
      }
      if (!item.qty || parseFloat(item.qty) <= 0) {
        dispatch(openSnackbar({ open: true, message: `Valid Quantity is required for line item ${i + 1}`, variant: 'alert', severity: 'error' }));
        return;
      }
      if (item.price === undefined || item.price === null || parseFloat(item.price) < 0) {
        dispatch(openSnackbar({ open: true, message: `Valid Price is required for line item ${i + 1}`, variant: 'alert', severity: 'error' }));
        return;
      }
    }

    try {
      if (isEditing) {
        await axios.put(`${API_PATHS.SM.CUSTOMER_ORDERS}/${id}`, formData);
        dispatch(openSnackbar({ open: true, message: 'Order updated successfully', variant: 'alert', severity: 'success' }));
      } else {
        await axios.post(API_PATHS.SM.CUSTOMER_ORDERS, formData);
        dispatch(openSnackbar({ open: true, message: 'Order created successfully', variant: 'alert', severity: 'success' }));
      }
      navigate('/sm/sales/customer/order-management');
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || 'Failed to save order';
      dispatch(openSnackbar({ open: true, message: errMsg, variant: 'alert', severity: 'error' }));
    }
  };

  const orderValueTotal = formData.orderDetails.reduce((sum, row) => sum + (parseFloat(row.itemValue) || 0), 0);

  // Calculate Tax Totals based on taxable value (orderPrice - discount)
  const totalCGST = formData.orderDetails.reduce((sum, row) => {
    const qty = parseFloat(row.qty) || 0;
    const price = parseFloat(row.price) || 0;
    const discountPer = parseFloat(row.discountPer) || 0;
    const orderPrice = qty * price;
    const discountAmt = orderPrice * (discountPer / 100);
    const taxableValue = orderPrice - discountAmt;
    const pct = parseFloat(row.cgstPer) || 0;
    return sum + (taxableValue * pct / 100);
  }, 0);

  const totalSGST = formData.orderDetails.reduce((sum, row) => {
    const qty = parseFloat(row.qty) || 0;
    const price = parseFloat(row.price) || 0;
    const discountPer = parseFloat(row.discountPer) || 0;
    const orderPrice = qty * price;
    const discountAmt = orderPrice * (discountPer / 100);
    const taxableValue = orderPrice - discountAmt;
    const pct = parseFloat(row.sgstPer) || 0;
    return sum + (taxableValue * pct / 100);
  }, 0);

  const totalIGST = formData.orderDetails.reduce((sum, row) => {
    const qty = parseFloat(row.qty) || 0;
    const price = parseFloat(row.price) || 0;
    const discountPer = parseFloat(row.discountPer) || 0;
    const orderPrice = qty * price;
    const discountAmt = orderPrice * (discountPer / 100);
    const taxableValue = orderPrice - discountAmt;
    const pct = parseFloat(row.igstPer) || 0;
    return sum + (taxableValue * pct / 100);
  }, 0);

  // Calculate Additional Charges Total
  const totalCharges = (formData.orderCharges || []).reduce((sum, charge) => {
    const amt = parseFloat(charge.amount) || 0;
    let chargeTotal = amt;

    if (charge.taxAvailable) {
      const cgstVal = amt * (parseFloat(charge.cgstPer) || 0) / 100;
      const sgstVal = amt * (parseFloat(charge.sgstPer) || 0) / 100;
      const igstVal = amt * (parseFloat(charge.igstPer) || 0) / 100;
      chargeTotal += cgstVal + sgstVal + igstVal;
    }

    if (charge.calculationType === 'SUBTRACT') return sum - chargeTotal;
    return sum + chargeTotal;
  }, 0);

  const totalChargesCGST = (formData.orderCharges || []).reduce((sum, charge) => sum + ((parseFloat(charge.amount) || 0) * (parseFloat(charge.cgstPer) || 0) / 100), 0);
  const totalChargesSGST = (formData.orderCharges || []).reduce((sum, charge) => sum + ((parseFloat(charge.amount) || 0) * (parseFloat(charge.sgstPer) || 0) / 100), 0);
  const totalChargesIGST = (formData.orderCharges || []).reduce((sum, charge) => sum + ((parseFloat(charge.amount) || 0) * (parseFloat(charge.igstPer) || 0) / 100), 0);

  // grandTotal is orderValueTotal (which already includes item-level taxes) + additional charges total
  const grandTotal = orderValueTotal + totalCharges;
  const overallCGST = totalCGST + totalChargesCGST;
  const overallSGST = totalSGST + totalChargesSGST;
  const overallIGST = totalIGST + totalChargesIGST;

  const exchangeRateNum = parseFloat(formData.exchangeRate) || 1;
  const orderValueINR = (grandTotal * exchangeRateNum).toFixed(3);
  const orderValueCurr = (grandTotal / exchangeRateNum).toFixed(3);

  // Calculate state codes for tax column rendering
  const currentCust = customers.find(c => c.id === (formData.billCustId || formData.custId));
  const isInterState = isInterStateTransaction(currentCust?.stateCode);

  const formatEntryDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      const date = new Date(dateVal);
      if (isNaN(date.getTime())) return '';
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
    } catch (e) {
      return '';
    }
  };

  const entryDateToShow = isEditing ? formatEntryDate(formData.createdDate) : formatEntryDate(new Date());

  return (
    <MainCard
      title={isEditing ? 'Edit Customer Order' : 'Create Customer Order'}
      secondary={
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1.5 }}>
          <Box sx={{ width: 140 }}>
            <BOSTextField
              fullWidth
              size="small"
              name="woNo"
              label="WO No"
              value={isEditing ? formData.id || '' : '0'}
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
              name="entryDate"
              label="Entry Date"
              value={entryDateToShow}
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
    >
      <Stack spacing={2} sx={{ width: '100%' }}>
        {/* Top Header Blocks in standard layout */}
        {/* Top Header Cards wrapped in one common Accordion */}
        <Accordion defaultExpanded sx={{ border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: 'none', '&:before': { display: 'none' }, mt: 2, overflow: 'hidden' }}>
          <AccordionSummary
            expandIcon={<IconChevronDown size={18} />}
            sx={{
              bgcolor: '#f8fafc',
              minHeight: '40px !important',
              px: 2,
              borderBottom: '1px solid #e0e0e0',
              '& .MuiAccordionSummary-content': { my: 0, alignItems: 'center', justifyContent: 'space-between', width: '100%' }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconUser size={18} color="#2196f3" />
              <Typography variant="subtitle2" fontWeight="bold" color="#364152">Customer & Party Details</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 1.5, px: 2, pb: 1.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, alignItems: 'stretch' }}>

              {/* Box 1: Bill To */}
              <Box sx={{ height: '100%' }}>
                <Stack spacing={1.5}>
                  <BOSAutocomplete
                    name="billCustId"
                    label="Bill To *"
                    options={customers}
                    getOptionLabel={(opt) => typeof opt === 'object' ? (opt.ledgerName || opt.customerName || '') : (customers.find(c => String(c.id) === String(opt))?.ledgerName || customers.find(c => String(c.id) === String(opt))?.customerName || '')}
                    value={formData.billCustId}
                    onChange={(val) => {
                      const id = typeof val === 'object' ? val?.id : val;
                      const cust = customers.find(c => String(c.id) === String(id));

                      let shouldClear = false;
                      if (formData.billCustId && formData.billCustId !== id && formData.orderDetails.length > 0) {
                        shouldClear = true;
                      }

                      const defaultAddrText = formatAddress(cust);

                      setFormData(prev => ({
                        ...prev,
                        billCustId: id || '',
                        billAddress: defaultAddrText || '',
                        custId: id || '',
                        customerName: cust?.ledgerName || cust?.customerName || '',
                        ...(shouldClear ? { orderDetails: [] } : {})
                      }));

                      if (shouldClear) {
                        dispatch(openSnackbar({ open: true, message: 'Line items cleared due to customer change.', variant: 'alert', alert: { color: 'info' }, close: true }));
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconBuilding size={20} color="#555" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    {billAddresses.length > 1 ? (
                      <BOSTextField
                        select
                        fullWidth
                        name="billAddress"
                        label="Address"
                        value={formData.billAddress}
                        onChange={handleInputChange}
                      >
                        {billAddresses.map((addr, idx) => (
                          <MenuItem key={addr.id || idx} value={formatAddress(addr)}>
                            {formatAddress(addr).replace(/\n/g, ', ')}
                          </MenuItem>
                        ))}
                      </BOSTextField>
                    ) : (
                      <BOSTextField
                        fullWidth
                        multiline
                        rows={3}
                        disableRichText
                        name="billAddress"
                        label="Address"
                        value={formData.billAddress}
                        InputProps={{ readOnly: true }}
                        placeholder={billAddresses.length === 0 ? "No address found" : "Address"}
                      />
                    )}
                    <Tooltip title="Add New Address">
                      <span>
                        <IconButton
                          color="primary"
                          onClick={() => { setAddressTarget('bill'); setAddressDialogOpen(true); }}
                          disabled={!formData.billCustId}
                          sx={{ mt: 0.5, bgcolor: theme.palette.primary.light, color: theme.palette.primary.main, '&:hover': { bgcolor: theme.palette.primary.main, color: 'white' } }}
                        >
                          <IconPlus size={20} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>

              {/* Box 2: Ship To */}
              <Box sx={{ height: '100%' }}>
                <Stack spacing={1.5}>
                  <BOSAutocomplete
                    name="shipCustId"
                    label="Ship To *"
                    options={customers}
                    getOptionLabel={(opt) => typeof opt === 'object' ? (opt.ledgerName || opt.customerName || '') : (customers.find(c => String(c.id) === String(opt))?.ledgerName || customers.find(c => String(c.id) === String(opt))?.customerName || '')}
                    value={formData.shipCustId}
                    onChange={(val) => {
                      const id = typeof val === 'object' ? val?.id : val;
                      const cust = customers.find(c => String(c.id) === String(id));

                      let shouldClear = false;
                      if (formData.shipCustId && formData.shipCustId !== id && formData.orderDetails.length > 0) {
                        shouldClear = true;
                      }

                      const defaultAddrText = formatAddress(cust);

                      setFormData(prev => ({
                        ...prev,
                        shipCustId: id || '',
                        shipAddress: defaultAddrText || '',
                        ...(shouldClear ? { orderDetails: [] } : {})
                      }));

                      if (shouldClear) {
                        dispatch(openSnackbar({ open: true, message: 'Line items cleared due to customer change.', variant: 'alert', alert: { color: 'info' }, close: true }));
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconTruck size={20} color="#555" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    {shipAddresses.length > 1 ? (
                      <BOSTextField
                        select
                        fullWidth
                        name="shipAddress"
                        label="Address"
                        value={formData.shipAddress}
                        onChange={handleInputChange}
                      >
                        {shipAddresses.map((addr, idx) => (
                          <MenuItem key={addr.id || idx} value={formatAddress(addr)}>
                            {formatAddress(addr).replace(/\n/g, ', ')}
                          </MenuItem>
                        ))}
                      </BOSTextField>
                    ) : (
                      <BOSTextField
                        fullWidth
                        multiline
                        rows={3}
                        disableRichText
                        name="shipAddress"
                        label="Address"
                        value={formData.shipAddress}
                        InputProps={{ readOnly: true }}
                        placeholder={shipAddresses.length === 0 ? "No address found" : "Address"}
                      />
                    )}
                    <Tooltip title="Add New Address">
                      <span>
                        <IconButton
                          color="primary"
                          onClick={() => { setAddressTarget('ship'); setAddressDialogOpen(true); }}
                          disabled={!formData.shipCustId}
                          sx={{ mt: 0.5, bgcolor: theme.palette.primary.light, color: theme.palette.primary.main, '&:hover': { bgcolor: theme.palette.primary.main, color: 'white' } }}
                        >
                          <IconPlus size={20} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Order Details Section */}
        <Box>
          <Divider sx={{ mb: 1.5 }} />
          <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
            <IconClipboardList size={22} color="#555" />
            <Typography variant="subtitle1" fontWeight="bold">Order Details</Typography>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 2 }}>
            <BOSTextField fullWidth name="orderNo" label="Order No *" value={formData.orderNo} onChange={handleInputChange} />
            <BOSDatePicker fullWidth name="orderDate" label="Order Date *" value={formData.orderDate} onChange={handleInputChange} />
            <BOSTextField select fullWidth name="orderType" label="Order Type" value={formData.orderType} onChange={handleInputChange}>
              <MenuItem value="Non Recurring">Non Recurring</MenuItem>
              <MenuItem value="Recurring">Recurring</MenuItem>
            </BOSTextField>
            <BOSTextField select fullWidth name="orderCategory" label="Order Category" value={formData.orderCategory} onChange={handleInputChange}>
              <MenuItem value="Customer">Customer</MenuItem>
              <MenuItem value="Labour">Labour</MenuItem>
              <MenuItem value="Scrap">Scrap</MenuItem>
            </BOSTextField>
            <BOSDatePicker fullWidth name="orderRecDate" label="Ord.Rec.Date" value={formData.orderRecDate} onChange={handleInputChange} />
            <BOSTextField select fullWidth name="paymentTerms" label="Payment Terms *" value={formData.paymentTerms} onChange={handleInputChange}>
              {paymentTermsList.map(pt => (
                <MenuItem key={pt.id} value={pt.termName || pt.description}>{pt.termName || pt.description}</MenuItem>
              ))}
            </BOSTextField>
            <BOSTextField select fullWidth name="currencyCode" label="Currency *" value={formData.currencyCode} onChange={handleInputChange}>

              {currencies.map(c => (
                <MenuItem key={c.id} value={c.currencyCode}>{c.currencyCode}</MenuItem>
              ))}
            </BOSTextField>
            <BOSTextField fullWidth name="exchangeRate" label="Exch.Rate" value={formData.exchangeRate} onChange={handleInputChange} disabled={formData.currencyCode === 'INR'} />
            <BOSTextField select fullWidth name="modeOfDespatch" label="Mode Of Despatch *" value={formData.modeOfDespatch} onChange={handleInputChange}>

              {despatchModes.map(mode => (
                <MenuItem key={mode.id} value={mode.modeName || mode.despatchMode || mode.termName || mode.description}>{mode.modeName || mode.despatchMode || mode.termName || mode.description}</MenuItem>
              ))}
            </BOSTextField>
            <BOSTextField select fullWidth name="supplyCondition" label="Supply Condition *" value={formData.supplyCondition} onChange={handleInputChange}>

              <MenuItem value="All Part Full Qty">All Part Full Qty</MenuItem>
              <MenuItem value="Part wise Full Qty">Part wise Full Qty</MenuItem>
              <MenuItem value="Partial Supply">Partial Supply</MenuItem>
            </BOSTextField>
            <BOSTextField select fullWidth name="deliveryTerms" label="Delivery Terms *" value={formData.deliveryTerms} onChange={handleInputChange}>

              {deliveryTermsList.map(dt => (
                <MenuItem key={dt.id} value={dt.termName || dt.description || dt.deliveryTerms}>{dt.termName || dt.description || dt.deliveryTerms}</MenuItem>
              ))}
            </BOSTextField>
          </Box>
        </Box>

        {/* Table Controls */}
        <Box>
          <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mb: 1 }}>
            {selectedScheduleItemIndex !== null && formData.orderDetails[selectedScheduleItemIndex]?.approvalStatus === 'VERIFIED' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<IconCalendarEvent size={20} />}
                onClick={() => navigate(`/sm/sales/customer/order-schedule/create?orderId=${formData.id}&itemId=${formData.orderDetails[selectedScheduleItemIndex].id}`)}
              >
                Create Schedule
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddDetailRow}
              startIcon={<IconPlus size={20} />}
            >
              Add Item
            </Button>
          </Stack>

          {/* Details Table */}
          <TableContainer component={Paper} sx={{ border: '1px solid #ccc', height: 400, '& .MuiTableCell-root': { p: 1 }, '& .MuiInputBase-root': { minWidth: 100 }, overflow: 'auto' }}>
            <Table size="small" stickyHeader sx={{ minHeight: '100%' }}>
              <TableHead sx={{ bgcolor: '#1a237e', '& .MuiTableCell-head': { color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center', fontSize: '0.75rem', p: 1 } }}>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Part No</TableCell>
                  <TableCell>Quotation No</TableCell>
                  <TableCell>HSN Code</TableCell>
                  <TableCell>UOM</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Order Price</TableCell>
                  <TableCell>Dis.%</TableCell>
                  {!isInterState && (
                    <>
                      <TableCell>CGST%</TableCell>
                      <TableCell>SGST%</TableCell>
                    </>
                  )}
                  {isInterState && (
                    <TableCell>IGST%</TableCell>
                  )}
                  <TableCell>Tax Value</TableCell>
                  <TableCell>Freight</TableCell>
                  <TableCell>Item Value</TableCell>
                  <TableCell>Approval Status</TableCell>
                  <TableCell>Item Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.orderDetails.map((row, index) => {
                  const isVerified = row.approvalStatus === 'VERIFIED';
                  return (
                  <TableRow 
                    key={row.id}
                    hover
                    selected={selectedScheduleItemIndex === index}
                    onClick={(e) => {
                      // Prevent toggling if user clicked an input, button, or dropdown
                      if (['INPUT', 'BUTTON', 'SVG', 'PATH'].includes(e.target.tagName.toUpperCase())) {
                        return;
                      }
                      setSelectedScheduleItemIndex(selectedScheduleItemIndex === index ? null : index);
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Radio
                          checked={selectedScheduleItemIndex === index}
                          onChange={() => setSelectedScheduleItemIndex(index)}
                          size="small"
                          sx={{ p: 0.5 }}
                        />
                        <span>{index + 1}</span>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
                          {row.productImage ? (
                            <img src={row.productImage} alt={row.partNo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <IconPhoto size={20} color="#9e9e9e" />
                          )}
                        </Box>
                        <BOSTextField
                          size="small"
                          value={row.partNo}
                          onClick={() => {
                            if (!isVerified) {
                              setActiveRowIndex(index);
                              setPartLookupOpen(true);
                            }
                          }}
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconSearch size={16} />
                              </InputAdornment>
                            )
                          }}
                          sx={{ cursor: isVerified ? 'default' : 'pointer', minWidth: 160, '& .MuiInputBase-input': { cursor: isVerified ? 'default' : 'pointer', paddingRight: '0px' } }}
                          disabled={isVerified}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <BOSTextField select size="small" value={row.quotationNo || ''} onChange={(e) => handleDetailChange(index, 'quotationNo', e.target.value)} disabled={isVerified}>
                        {[...new Set([...(row.availableQuotations || []), ...(row.quotationNo ? [row.quotationNo] : [])])].map(q => (
                          <MenuItem key={q} value={q}>{q}</MenuItem>
                        ))}
                      </BOSTextField>
                    </TableCell>
                    <TableCell><BOSTextField size="small" value={row.hsnCode} disabled /></TableCell>
                    <TableCell>
                      <BOSTextField select size="small" value={row.uom || ''} onChange={(e) => handleDetailChange(index, 'uom', e.target.value)} disabled={isVerified}>
                        {uomList.map((uomObj) => {
                          const code = typeof uomObj === 'string' ? uomObj : (uomObj.uomCode || uomObj.code || '');
                          return (
                            <MenuItem key={code} value={code}>{code}</MenuItem>
                          );
                        })}
                      </BOSTextField>
                    </TableCell>
                    <TableCell><BOSTextField size="small" type="number" value={row.stock} disabled /></TableCell>
                    <TableCell><BOSTextField size="small" type="number" value={row.qty} onChange={(e) => handleDetailChange(index, 'qty', e.target.value)} disabled={isVerified} /></TableCell>
                    <TableCell><BOSTextField size="small" type="number" value={row.price} disabled /></TableCell>
                    <TableCell><BOSTextField size="small" type="number" value={row.orderPrice} disabled /></TableCell>
                    <TableCell><BOSTextField size="small" type="number" value={row.discountPer} onChange={(e) => handleDetailChange(index, 'discountPer', e.target.value)} disabled={isVerified} /></TableCell>
                    {!isInterState && (
                      <>
                        <TableCell>
                          <BOSTextField size="small" type="number" value={row.cgstPer} disabled />
                        </TableCell>
                        <TableCell>
                          <BOSTextField size="small" type="number" value={row.sgstPer} disabled />
                        </TableCell>
                      </>
                    )}
                    {isInterState && (
                      <TableCell>
                        <BOSTextField size="small" type="number" value={row.igstPer} disabled />
                      </TableCell>
                    )}
                    <TableCell><BOSTextField size="small" type="number" value={row.taxAmt || 0} disabled /></TableCell>
                    <TableCell><BOSTextField size="small" type="number" value={row.freightPer} onChange={(e) => handleDetailChange(index, 'freightPer', e.target.value)} disabled={isVerified} /></TableCell>
                    <TableCell><BOSTextField size="small" type="number" value={row.itemValue} disabled /></TableCell>
                    <TableCell align="center">
                      <Box sx={{
                        display: 'inline-block',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        bgcolor: row.approvalStatus === 'VERIFIED' ? 'success.light' : row.approvalStatus === 'REJECTED' ? 'error.light' : 'warning.light',
                        color: row.approvalStatus === 'VERIFIED' ? 'success.dark' : row.approvalStatus === 'REJECTED' ? 'error.dark' : 'warning.dark'
                      }}>
                        {row.approvalStatus || 'PENDING'}
                      </Box>
                    </TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>
                      <IconButton color="error" size="small" onClick={() => handleRemoveDetailRow(index)} disabled={isVerified}>
                        <IconTrash size={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )})}
                {formData.orderDetails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={17} align="center" sx={{ py: 3 }}>No items added. Click + to add details.</TableCell>
                  </TableRow>
                )}
                {/* Filler row to push footer to the bottom */}
                <TableRow sx={{ height: '100%' }}>
                  <TableCell colSpan={17} sx={{ border: 'none', p: 0 }} />
                </TableRow>
              </TableBody>
              <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 3, background: `linear-gradient(90deg, ${theme.palette.secondary.light} 0%, ${theme.palette.primary.light} 100%)`, boxShadow: '0 -2px 8px rgba(0,0,0,0.15)' }}>
                <TableRow sx={{ background: 'transparent' }}>
                  <TableCell colSpan={2} align="center" sx={{ position: 'sticky', left: 0, background: theme.palette.secondary.light, zIndex: 4, fontWeight: '900', color: '#1a237e', borderRight: '1px solid rgba(0, 0, 0, 0.1)', fontSize: '0.85rem' }}>
                    TOTAL
                  </TableCell>
                  <TableCell colSpan={6} align="right" sx={{ fontWeight: '900', color: '#1a237e', borderRight: '1px solid rgba(0, 0, 0, 0.1)', fontSize: '0.85rem' }}>
                    ASSESSABLE VALUE
                  </TableCell>
                  <TableCell sx={{ fontWeight: '900', color: '#d32f2f', fontSize: '1.1rem' }}>
                    {formData.orderDetails.reduce((sum, row) => sum + (parseFloat(row.orderPrice) || 0), 0).toFixed(2)}
                  </TableCell>
                  <TableCell colSpan={isInterState ? 2 : 3} align="right" sx={{ fontWeight: '900', color: '#1a237e', fontSize: '0.85rem', pr: 2 }}>
                    GST VALUE
                  </TableCell>
                  <TableCell sx={{ fontWeight: '900', color: '#d32f2f', fontSize: '1.1rem' }}>
                    {formData.orderDetails.reduce((sum, row) => sum + (parseFloat(row.taxAmt) || 0), 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: '900', color: '#1a237e', fontSize: '0.85rem', pr: 2 }}>
                    ORDER VALUE
                  </TableCell>
                  <TableCell sx={{ fontWeight: '900', color: '#d32f2f', fontSize: '1.1rem' }}>
                    {formData.orderDetails.reduce((sum, row) => sum + (parseFloat(row.itemValue) || 0), 0).toFixed(2)}
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Box>

        {/* Additional Charges Box */}
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              variant="contained"
              size="small"
              color="primary"
              startIcon={<IconPlus size={18} />}
              onClick={handleAddCharge}
            >
              Add Additional Charges
            </Button>
          </Stack>

          {(formData.orderCharges || []).length > 0 && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} useFlexGap flexWrap="wrap" sx={{ width: '100%' }}>
              {(formData.orderCharges || []).map((charge, idx) => {
                const amt = parseFloat(charge.amount) || 0;
                const cPer = parseFloat(charge.cgstPer) || 0;
                const sPer = parseFloat(charge.sgstPer) || 0;
                const iPer = parseFloat(charge.igstPer) || 0;
                let cVal = charge.cgstVal !== undefined && charge.cgstVal !== null ? charge.cgstVal : (amt * cPer / 100).toFixed(2);
                let sVal = charge.sgstVal !== undefined && charge.sgstVal !== null ? charge.sgstVal : (amt * sPer / 100).toFixed(2);
                let iVal = charge.igstVal !== undefined && charge.igstVal !== null ? charge.igstVal : (amt * iPer / 100).toFixed(2);
                let totVal = amt;

                if (charge.taxAvailable) {
                  const cv = parseFloat(cVal) || 0;
                  const sv = parseFloat(sVal) || 0;
                  const iv = parseFloat(iVal) || 0;
                  if (isInterState) {
                    totVal = amt + iv;
                  } else {
                    totVal = amt + cv + sv;
                  }
                }

                return (
                  <Box key={charge.id || idx} sx={{
                    flex: '1 1 240px', // Min width 240px, stretches to fill space
                    maxWidth: { xs: '100%', md: 'calc(25% - 16px)' }, // show 4 per row on desktop
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8f9fc',
                    boxShadow: isDark ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.03)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: isDark ? 'none' : '0 6px 16px rgba(0, 0, 0, 0.05)'
                    }
                  }}>
                    <Box sx={{ background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, color: '#ffffff', borderBottom: `1px solid ${theme.palette.divider}`, px: 1.5, py: 0.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.7rem', color: '#ffffff' }}>Additional Charge {idx + 1}</Typography>
                      <IconButton size="small" onClick={() => handleRemoveCharge(idx)} sx={{ color: '#ffffff', p: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                        <IconTrash size={16} />
                      </IconButton>
                    </Box>
                    <Box sx={{ p: 1.5 }}>
                      <Stack spacing={1.2}>
                        {/* Row 1 */}
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Box sx={{ flex: 1.2 }}>
                            <BOSTextField
                              select
                              size="small"
                              fullWidth
                              label="Select Charge"
                              value={charge.chargeId || ''}
                              onChange={(e) => handleChargeChange(idx, 'chargeId', e.target.value)}
                            >

                              {additionalChargesMaster.map(ac => (
                                <MenuItem key={ac.id} value={ac.id}>{ac.charges}</MenuItem>
                              ))}
                            </BOSTextField>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <BOSTextField
                              size="small"
                              fullWidth
                              label="Amount (₹)"
                              type="number"
                              value={charge.amount}
                              onChange={(e) => handleChargeChange(idx, 'amount', e.target.value)}
                              disabled={!charge.chargeId}
                            />
                          </Box>
                        </Stack>

                        {/* Row 2 - Tax Available Toggle */}
                        <FormControlLabel
                          control={
                            <Switch
                              checked={charge.taxAvailable || false}
                              onChange={(e) => handleChargeChange(idx, 'taxAvailable', e.target.checked)}
                              color="primary"
                              size="small"
                            />
                          }
                          label={<Typography variant="body2" fontWeight="600" fontSize="0.75rem" color={!charge.chargeId ? (isDark ? 'rgba(255, 255, 255, 0.4)' : '#888888') : (isDark ? '#ffffff' : '#333333')}>Apply Tax (Tax Available)</Typography>}
                          labelPlacement="start"
                          disabled={!charge.chargeId}
                          sx={{
                            m: 0,
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            bgcolor: isDark ? 'rgba(0, 0, 0, 0.2)' : '#ffffff',
                            borderRadius: 1.5,
                            border: `1px solid ${theme.palette.divider}`,
                            p: 1,
                            px: 2,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              bgcolor: charge.chargeId ? (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f7ff') : (isDark ? 'rgba(0, 0, 0, 0.2)' : '#ffffff')
                            }
                          }}
                        />

                        {/* Row 3 (Taxes - visible only if checked) */}
                        {charge.taxAvailable && !isInterState && (
                          <Stack spacing={1.2}>
                            <Stack direction="row" spacing={1.2}>
                              <Box sx={{ flex: 1 }}>
                                <BOSTextField size="small" fullWidth label="CGST (%)" value={charge.cgstPer} onChange={(e) => handleChargeChange(idx, 'cgstPer', e.target.value)} />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <BOSTextField size="small" fullWidth label="CGST Value (₹)" value={cVal} onChange={(e) => handleChargeChange(idx, 'cgstVal', e.target.value)} />
                              </Box>
                            </Stack>
                            <Stack direction="row" spacing={1.2}>
                              <Box sx={{ flex: 1 }}>
                                <BOSTextField size="small" fullWidth label="SGST (%)" value={charge.sgstPer} onChange={(e) => handleChargeChange(idx, 'sgstPer', e.target.value)} />
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <BOSTextField size="small" fullWidth label="SGST Value (₹)" value={sVal} onChange={(e) => handleChargeChange(idx, 'sgstVal', e.target.value)} />
                              </Box>
                            </Stack>
                          </Stack>
                        )}

                        {charge.taxAvailable && isInterState && (
                          <Stack direction="row" spacing={1.2}>
                            <Box sx={{ flex: 1 }}>
                              <BOSTextField size="small" fullWidth label="IGST (%)" value={charge.igstPer} onChange={(e) => handleChargeChange(idx, 'igstPer', e.target.value)} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <BOSTextField size="small" fullWidth label="IGST Value (₹)" value={iVal} onChange={(e) => handleChargeChange(idx, 'igstVal', e.target.value)} />
                            </Box>
                          </Stack>
                        )}

                        {/* Row 4 (Total) */}
                        <Box sx={{ pt: 0.5 }}>
                          <Divider sx={{ mb: 1.2, borderColor: theme.palette.divider }} />
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <Typography variant="subtitle2" fontWeight="bold" fontSize="0.75rem" sx={{ mr: 1.5, color: isDark ? '#bbbbbb' : '#555555' }}>Total Value (₹):</Typography>
                            <Box sx={{ bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : '#e3f2fd', color: isDark ? '#90caf9' : '#0d47a1', px: 1.5, py: 0.5, borderRadius: 1, minWidth: 100, textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
                              <Typography variant="subtitle2" fontWeight="bold">{totVal.toFixed(2)}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Stack>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* Footer Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>

          {/* Left Empty Space for balance */}
          <Box sx={{ flex: 1 }} />

          {/* Center: Beautiful Order Value Display */}
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={3} sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 280, background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`, px: 4, py: 2, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', color: '#ffffff' }}>
              <Typography variant="subtitle2" sx={{ mr: 2, textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)' }}>Order Value (INR):</Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, m: 0, color: '#ffffff' }}>₹ {orderValueINR}</Typography>
            </Box>
            {(formData.currencyCode && formData.currencyCode.trim().toUpperCase() !== 'INR') && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 280, background: `linear-gradient(90deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`, px: 4, py: 2, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', color: '#ffffff' }}>
                <Typography variant="subtitle2" sx={{ mr: 2, textTransform: 'uppercase', fontWeight: 700, color: 'rgba(255, 255, 255, 0.9)' }}>Order Value ({formData.currencyCode.trim().toUpperCase()}):</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, m: 0, color: '#ffffff' }}>{orderValueCurr}</Typography>
              </Box>
            )}
          </Stack>

          {/* Right: Actions */}
          <Stack direction="row" spacing={1} sx={{ flex: 1, justifyContent: 'flex-end' }}>
            <Button variant="contained" color="inherit" startIcon={<IconArrowLeft />} onClick={() => navigate('/sm/sales/customer/order-management')} sx={btnCancel}>
              Back
            </Button>
            <Button
              variant="contained"
              color="secondary"
              disabled={!isEditing}
              startIcon={<IconCheck />}
              onClick={() => setApprovalDialogOpen(true)}
            >
              Verify / Rejection
            </Button>
            <Tooltip title={shortcutTooltip('Save', 'Ctrl + S')}>
              <Button variant="contained" color="primary" startIcon={<IconDeviceFloppy />} onClick={handleSave} sx={btnSave}>
                Save
              </Button>
            </Tooltip>
          </Stack>
        </Box>

      </Stack>
      <PartLookupDialog
        open={partLookupOpen}
        onClose={() => setPartLookupOpen(false)}
        onSelect={handlePartSelect}
        isInterState={isInterState}
      />

      {addressDialogOpen && (
        <AddCustomerDetailsDialog
          open={addressDialogOpen}
          handleClose={setAddressDialogOpen}
          initialData={{
            id: addressTarget === 'bill' ? formData.billCustId : formData.shipCustId,
            customerName: customers.find(c => c.id === (addressTarget === 'bill' ? formData.billCustId : formData.shipCustId))?.ledgerName || '',
            invoiceName: customers.find(c => c.id === (addressTarget === 'bill' ? formData.billCustId : formData.shipCustId))?.ledgerName || ''
          }}
          onSuccess={() => {
            if (addressTarget === 'bill' && formData.billCustId) {
              fetchAddresses(formData.billCustId, 'bill');
            } else if (addressTarget === 'ship' && formData.shipCustId) {
              fetchAddresses(formData.shipCustId, 'ship');
            }
          }}
        />
      )}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => setApprovalDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '75vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: `1px solid ${theme.palette.divider}`, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Customer Order Line-Items Verify / Rejection
          <IconButton onClick={() => setApprovalDialogOpen(false)} size="small">
            <IconX />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, pb: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
          {((formData.orderDetails || []).filter(item => item.id && item.id < 1000000000000 && (!item.approvalStatus || item.approvalStatus === 'PENDING'))).length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">No pending line items found in this order.</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, flex: 1, minHeight: '450px', maxHeight: '600px' }}>
              <Table stickyHeader size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedLineItems.length > 0 && selectedLineItems.length < (formData.orderDetails || []).filter(item => item.id && item.id < 1000000000000 && (!item.approvalStatus || item.approvalStatus === 'PENDING')).length}
                        checked={(formData.orderDetails || []).filter(item => item.id && item.id < 1000000000000 && (!item.approvalStatus || item.approvalStatus === 'PENDING')).length > 0 && selectedLineItems.length === (formData.orderDetails || []).filter(item => item.id && item.id < 1000000000000 && (!item.approvalStatus || item.approvalStatus === 'PENDING')).length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLineItems((formData.orderDetails || []).filter(item => item.id && item.id < 1000000000000 && (!item.approvalStatus || item.approvalStatus === 'PENDING')).map(item => item.id));
                          } else {
                            setSelectedLineItems([]);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Part No</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Part Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Price (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Item Value (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Current Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(formData.orderDetails || []).filter(item => item.id && item.id < 1000000000000 && (!item.approvalStatus || item.approvalStatus === 'PENDING')).map((item) => {
                    const isSelected = selectedLineItems.includes(item.id);
                    return (
                      <TableRow
                        key={item.id}
                        hover
                        selected={isSelected}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedLineItems(prev => prev.filter(id => id !== item.id));
                          } else {
                            setSelectedLineItems(prev => [...prev, item.id]);
                          }
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLineItems(prev => [...prev, item.id]);
                              } else {
                                setSelectedLineItems(prev => prev.filter(id => id !== item.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{item.partNo}</TableCell>
                        <TableCell>{item.partName}</TableCell>
                        <TableCell align="right">{item.qty}</TableCell>
                        <TableCell align="right">{parseFloat(item.price || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">{parseFloat(item.itemValue || 0).toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <Box sx={{
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            bgcolor: 'warning.light',
                            color: 'warning.dark'
                          }}>
                            {item.approvalStatus || 'PENDING'}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Tooltip title={shortcutTooltip('Reject', 'Alt + R')}>
            <span>
              <Button
                onClick={() => handleApprovalAction('REJECTED')}
                color="error"
                variant="contained"
                startIcon={<IconX />}
                disabled={selectedLineItems.length === 0}
              >
                Reject
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={shortcutTooltip('Verify', 'Alt + V')}>
            <span>
              <Button
                onClick={() => handleApprovalAction('VERIFIED')}
                color="success"
                variant="contained"
                startIcon={<IconCheck />}
                disabled={selectedLineItems.length === 0}
              >
                Verify
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
