import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MenuItem,
  useTheme,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Typography,
  Stack,
  Box,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardActions,
  Chip
} from '@mui/material';
import { IconSettings, IconTrash, IconPlus, IconDownload, IconUpload, IconArrowLeft, IconEraser, IconDeviceFloppy } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import MainCard from 'ui-component/cards/MainCard';
import {
  BOSFormSection,
  BOSTextField,
  BOSDatePicker,
  BOSStatusField,
  errorStyle,
  btnSave,
  btnDelete,
  btnCancel,
  btnClear
} from 'ui-component/bos';
import useBOSValidation from 'hooks/useBOSValidation';
import useKeyboardShortcuts, { shortcutTooltip } from 'hooks/useKeyboardShortcuts';
import Tooltip from '@mui/material/Tooltip';
import CustomerLookupDialog from './popup/CustomerLookupDialog';
import ProductLookupDialog from './popup/ProductLookupDialog';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import { BOSFileUpload } from 'ui-component/bos';

const VALIDATION_RULES = [
  { field: 'effectiveFrom', label: 'Effective From', required: true },
  { field: 'effectiveTo', label: 'Effective To', required: true }
];

const INITIAL_STATE = {
  priceListNo: '',
  priceListType: 'GENERAL PRICE LIST',
  customerId: '',
  customerCode: '',
  customerName: '',
  customerGroupId: '',
  customerGroupName: '',
  paymentTermsId: '',
  paymentTermsCode: '',
  paymentTermsName: '',
  referenceNo: '',
  attachments: [],
  effectiveFrom: new Date().toISOString().split('T')[0],
  effectiveTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  exchangeRate: 1.0,
  status: 'ACTIVE',
  verifyStatus: 'Pending',
  verifyRemarks: '',
  remarks: '',
  details: []
};

export default function AddPriceMasterPage() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const { errors, validate, clearErrors } = useBOSValidation();

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [customerLookupOpen, setCustomerLookupOpen] = useState(false);
  const [productLookupOpen, setProductLookupOpen] = useState(false);
  const [activeDetailIndex, setActiveDetailIndex] = useState(null);

  const [paymentTermsList, setPaymentTermsList] = useState([]);

  // Excel upload states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);

  useEffect(() => {
    const fetchPaymentTerms = async () => {
      try {
        const res = await axios.get('/api/payment-terms', { skipGlobalAlert: true });
        setPaymentTermsList(res.data || []);
      } catch (err) {
        console.error('Failed to fetch payment terms:', err);
      }
    };
    fetchPaymentTerms();
  }, []);

  useEffect(() => {
    clearErrors();
    if (id) {
      setLoading(true);
      axios.get(`/api/sales/price-master/${id}`)
        .then((res) => {
          const data = res.data;
          setFormData({
            id: data.id,
            priceListNo: data.priceListNo || '',
            priceListType: data.priceListType || 'GENERAL PRICE LIST',
            customerId: data.customerId || '',
            customerCode: data.customerCode || '',
            customerName: data.customerName || '',
            customerGroupId: data.customerGroupId || '',
            customerGroupName: data.customerGroupName || '',
            paymentTermsId: data.paymentTermsId || '',
            paymentTermsCode: data.paymentTermsCode || '',
            paymentTermsName: data.paymentTermsName || '',
            referenceNo: data.referenceNo || '',
            attachments: (data.attachments || []).map(a => ({
              id: a.id,
              fileName: a.fileName,
              serverFileName: a.path,
              isServer: true
            })),
            effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom).toISOString().split('T')[0] : '',
            effectiveTo: data.effectiveTo ? new Date(data.effectiveTo).toISOString().split('T')[0] : '',
            exchangeRate: data.exchangeRate || 1.0,
            status: data.status || 'ACTIVE',
            verifyStatus: data.verifyStatus || 'Pending',
            verifyRemarks: data.verifyRemarks || '',
            remarks: data.remarks || '',
            details: data.details || []
          });
        })
        .catch((err) => console.error('Failed to fetch price list data:', err))
        .finally(() => setLoading(false));
    } else {
      setFormData(INITIAL_STATE);
    }
  }, [id, clearErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'paymentTermsId') {
      const selected = paymentTermsList.find((p) => p.id === value);
      setFormData((prev) => ({
        ...prev,
        paymentTermsId: value,
        paymentTermsCode: selected ? selected.termCode : '',
        paymentTermsName: selected ? selected.termName : ''
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleClear = () => {
    setFormData(INITIAL_STATE);
    clearErrors();
  };

  const handleSave = async () => {
    if (!validate(formData, VALIDATION_RULES)) return;

    if (formData.priceListType === 'CUSTOMER PRICE LIST' && !formData.customerId) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'Customer is mandatory for Customer Price List',
          variant: 'alert',
          severity: 'error',
          close: false
        })
      );
      return;
    }

    if (formData.priceListType === 'CUSTOMER PRICE LIST' && (!formData.attachments || formData.attachments.length === 0)) {
        dispatch(
        openSnackbar({
          open: true,
          message: 'Upload Document is mandatory for Customer Price List',
          variant: 'alert',
          severity: 'error',
          close: false
        })
      );
      return;
    }

    if (!formData.details || formData.details.length === 0) {
      dispatch(
        openSnackbar({
          open: true,
          message: 'At least one Product is mandatory',
          variant: 'alert',
          severity: 'error',
          close: false
        })
      );
      return;
    }

    // Grid validations
    for (let i = 0; i < formData.details.length; i++) {
      const detail = formData.details[i];
      if (!detail.productId) {
        dispatch(
          openSnackbar({
            open: true,
            message: `Row ${i + 1}: Product selection is mandatory`,
            variant: 'alert',
            severity: 'error',
            close: false
          })
        );
        return;
      }
      if (detail.basePrice === null || detail.basePrice === undefined || detail.basePrice <= 0) {
        dispatch(
          openSnackbar({
            open: true,
            message: `Row ${i + 1}: Base Price is mandatory and must be greater than 0`,
            variant: 'alert',
            severity: 'error',
            close: false
          })
        );
        return;
      }

      if (formData.priceListType === 'GENERAL PRICE LIST') {
        if (detail.minPrice === null || detail.minPrice === undefined || detail.minPrice === '') {
          dispatch(
            openSnackbar({
              open: true,
              message: `Row ${i + 1}: Min Price is mandatory for General Price List`,
              variant: 'alert',
              severity: 'error',
              close: false
            })
          );
          return;
        }
        if (detail.maxPrice === null || detail.maxPrice === undefined || detail.maxPrice === '') {
          dispatch(
            openSnackbar({
              open: true,
              message: `Row ${i + 1}: Max Price is mandatory for General Price List`,
              variant: 'alert',
              severity: 'error',
              close: false
            })
          );
          return;
        }
      }
    }

    try {
        const payload = { ...formData };
        payload.attachments = formData.attachments ? formData.attachments.map(a => ({
          id: (a.id && typeof a.id !== 'string') ? a.id : null,
          fileName: a.fileName || a.name || 'document',
          path: a.serverFileName || a.path || '',
          docType: 'PRICE_MASTER_DOC'
        })) : [];

        if (payload.id) {
        await axios.put(`/api/sales/price-master/${payload.id}`, payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'Price list updated successfully!',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success',
            close: false
          })
        );
      } else {
        await axios.post('/api/sales/price-master', payload);
        dispatch(
          openSnackbar({
            open: true,
            message: 'Price list created successfully!',
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'success',
            close: false
          })
        );
      }
      navigate('/sm/price-master');
    } catch (error) {
      console.error('Failed to save price list:', error);
      const errMsg = error.response?.data?.message || 'Failed to save price list.';
      dispatch(
        openSnackbar({
          open: true,
          message: errMsg,
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`/api/sales/price-master/${formData.id}`);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Price list deleted!',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'success',
          close: false
        })
      );
      navigate('/sm/price-master');
    } catch (error) {
      console.error('Failed to delete:', error);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Failed to delete.',
          variant: 'alert',
          alert: { variant: 'filled' },
          severity: 'error',
          close: false
        })
      );
    }
  };

  const handleAddRow = () => {
    if (formData.details.length > 0) {
      const lastRowIndex = formData.details.length - 1;
      const lastRow = formData.details[lastRowIndex];

      if (!lastRow.productId) {
        dispatch(openSnackbar({ open: true, message: `Please select a product for row ${lastRowIndex + 1} before adding a new row.`, variant: 'alert', severity: 'error', close: false }));
        return;
      }
      if (!lastRow.basePrice) {
        dispatch(openSnackbar({ open: true, message: `Please enter base price for row ${lastRowIndex + 1} before adding a new row.`, variant: 'alert', severity: 'error', close: false }));
        return;
      }
      if (formData.priceListType === 'GENERAL PRICE LIST') {
        if (!lastRow.minPrice) {
          dispatch(openSnackbar({ open: true, message: `Please enter min price for row ${lastRowIndex + 1} before adding a new row.`, variant: 'alert', severity: 'error', close: false }));
          return;
        }
        if (!lastRow.maxPrice) {
          dispatch(openSnackbar({ open: true, message: `Please enter max price for row ${lastRowIndex + 1} before adding a new row.`, variant: 'alert', severity: 'error', close: false }));
          return;
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        {
          productId: '',
          productCode: '',
          productName: '',
          uom: '',
          currency: 'INR',
          basePrice: '',
          minPrice: '',
          maxPrice: '',
          contractPrice: '',
          targetQty: '',
          remarks: '',
          status: 'ACTIVE'
        }
      ]
    }));
  };

  const handleDeleteRow = (index) => {
    const updated = [...formData.details];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, details: updated }));
  };

  const handleDetailChange = (index, field, value) => {
    const updated = [...formData.details];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, details: updated }));
  };

  const triggerProductLookup = (index) => {
    setActiveDetailIndex(index);
    setProductLookupOpen(true);
  };

  const handleSelectProduct = (product) => {
    if (activeDetailIndex !== null) {
      const existingIndex = formData.details.findIndex((d, idx) => idx !== activeDetailIndex && (d.productId === product.id || d.productCode === product.itemNo));
      if (existingIndex !== -1) {
        dispatch(
          openSnackbar({
            open: true,
            message: `Already this part no is selected in line no ${existingIndex + 1}`,
            variant: 'alert',
            severity: 'error',
            close: false
          })
        );
        return;
      }

      setFormData((prev) => {
        const updatedDetails = [...prev.details];
        updatedDetails[activeDetailIndex] = {
          ...updatedDetails[activeDetailIndex],
          productId: product.id,
          productCode: product.itemNo,
          productName: product.itemName,
          uom: product.uom || product.unit || 'NOS',
          currency: 'INR',
          basePrice: product.sellingRate != null ? product.sellingRate : (updatedDetails[activeDetailIndex].basePrice || '')
        };
        return {
          ...prev,
          details: updatedDetails
        };
      });
    }
  };

  const handleSelectCustomer = (customer) => {
    let ptMatch = null;
    if (customer.paymentTerms) {
      ptMatch = paymentTermsList.find(
        (p) => p.id === customer.paymentTerms ||
          p.termName === customer.paymentTerms ||
          p.termCode === customer.paymentTerms
      );
    }

    setFormData((prev) => ({
      ...prev,
      customerId: customer.id,
      customerCode: customer.customerCode || customer.code,
      customerName: customer.customerName || customer.ledgerName,
      customerGroupId: customer.groupId || '',
      customerGroupName: customer.category || '',
      currency: customer.currency || 'INR',
      ...(ptMatch && {
        paymentTermsId: ptMatch.id,
        paymentTermsCode: ptMatch.termCode,
        paymentTermsName: ptMatch.termName
      })
    }));
  };

  const handleTemplateDownload = async () => {
    try {
      const response = await axios.get(`/api/sales/price-master/template?type=${formData.priceListType}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${formData.priceListType}_Template.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download template:', err);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    const uploadData = new FormData();
    uploadData.append('file', selectedFile);
    try {
      const res = await axios.post(`/api/sales/price-master/upload?type=${formData.priceListType}`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSummary(res.data);
      if (res.data.successCount > 0) {
        dispatch(
          openSnackbar({
            open: true,
            message: `Excel uploaded: ${res.data.successCount} Success, ${res.data.failedCount} Failed.`,
            variant: 'alert',
            severity: res.data.failedCount === 0 ? 'success' : 'warning',
            close: false
          })
        );
        if (res.data.rows && res.data.rows.length > 0) {
          setFormData(prev => {
            const existingCodes = new Set(prev.details.map(d => d.productCode));
            const newRows = [];
            const duplicateCodes = [];

            res.data.rows.forEach(r => {
              if (existingCodes.has(r.productCode)) {
                duplicateCodes.push(r.productCode);
              } else {
                existingCodes.add(r.productCode);
                newRows.push(r);
              }
            });

            if (duplicateCodes.length > 0) {
              setTimeout(() => {
                dispatch(openSnackbar({ open: true, message: `Ignored duplicate part numbers already in grid: ${duplicateCodes.join(', ')}`, variant: 'alert', severity: 'warning', close: false }));
              }, 1500);
            }

            return {
              ...prev,
              details: [...prev.details, ...newRows]
            };
          });
        }
        if (res.data.failedCount === 0) {
          setTimeout(() => setUploadOpen(false), 1500);
        }
      }
    } catch (err) {
      console.error('Excel upload failed:', err);
      dispatch(
        openSnackbar({
          open: true,
          message: 'Excel upload failed: ' + (err.response?.data?.message || err.message),
          variant: 'alert',
          severity: 'error',
          close: false
        })
      );
    }
  };

  useKeyboardShortcuts({
    'ctrl+s': handleSave,
    'escape': () => {
      if (customerLookupOpen) setCustomerLookupOpen(false);
      else if (productLookupOpen) setProductLookupOpen(false);
      else if (deleteOpen) setDeleteOpen(false);
      else if (uploadOpen) setUploadOpen(false);
      else navigate('/sm/price-master');
    }
  }, true);

  return (
    <MainCard
      title={id ? 'Edit Price List' : 'Create Price List'}
      secondary={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 140 }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Price List No
            </Typography>
            <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 800 }}>
              {formData.priceListNo || 'Auto-generated'}
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.5 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 100 }}>
            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Verify Status
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: formData.verifyStatus === 'Verified' ? 'success.main' :
                  formData.verifyStatus === 'Rejected' ? 'error.main' : 'warning.main'
              }}
            >
              {formData.verifyStatus ? formData.verifyStatus.toUpperCase() : 'PENDING'}
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 0.5 }} />
          <Tooltip title={shortcutTooltip('Back', 'Esc')}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate('/sm/price-master')}
              startIcon={<IconArrowLeft size={18} />}
              sx={btnCancel}
            >
              Back
            </Button>
          </Tooltip>

          {id && (
            <Button
              variant="contained"
              color="error"
              onClick={() => setDeleteOpen(true)}
              startIcon={<IconTrash size={18} />}
              sx={btnDelete}
            >
              Delete
            </Button>
          )}
          <Tooltip title={shortcutTooltip('Save', 'Ctrl + S')}>
            <Button
              variant="contained"
              color="success"
              onClick={handleSave}
              disabled={loading}
              startIcon={<IconDeviceFloppy size={18} />}
              sx={btnSave}
            >
              Save
            </Button>
          </Tooltip>
        </Stack>
      }
    >
      {loading ? (
        <Typography align="center">Loading price list details...</Typography>
      ) : (
        <Stack spacing={1.5}>
          <BOSFormSection icon={<IconSettings size={20} color={theme.palette.primary.main} />} title="Header Details">
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 360px' },
                gap: 3,
                alignItems: 'start'
              }}
            >
              {/* Left Side: Form Fields */}
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                  {/* Row 1 */}
                  <Box>
                    <BOSTextField
                      fullWidth
                      select
                      name="priceListType"
                      label="Price List Type *"
                      value={formData.priceListType}
                      onChange={handleChange}
                      disabled={!!formData.id}
                      required
                    >
                      <MenuItem value="GENERAL PRICE LIST">GENERAL PRICE LIST</MenuItem>
                      <MenuItem value="CUSTOMER PRICE LIST">CUSTOMER PRICE LIST</MenuItem>
                    </BOSTextField>
                  </Box>

                  {formData.priceListType === 'GENERAL PRICE LIST' ? (
                    <>
                      <Box>
                        <BOSTextField
                          fullWidth
                          select
                          name="paymentTermsId"
                          label="Payment Terms"
                          value={formData.paymentTermsId || ''}
                          onChange={handleChange}
                        >
                          <MenuItem value="">Select Payment Term...</MenuItem>
                          {paymentTermsList.map((pt) => (
                            <MenuItem key={pt.id} value={pt.id}>
                              {pt.termName}{pt.termCode ? ` (${pt.termCode})` : ''}
                            </MenuItem>
                          ))}
                        </BOSTextField>
                      </Box>
                      <Box>
                        <BOSTextField
                          fullWidth
                          name="referenceNo"
                          label="Reference No"
                          value={formData.referenceNo}
                          onChange={handleChange}
                          placeholder="Enter Reference No"
                        />
                      </Box>
                      <Box>
                        <BOSDatePicker
                          fullWidth
                          name="effectiveFrom"
                          label="Effective From *"
                          value={formData.effectiveFrom}
                          onChange={handleChange}
                          required
                        />
                      </Box>

                      {/* Row 2 */}
                      <Box>
                        <BOSDatePicker
                          fullWidth
                          name="effectiveTo"
                          label="Effective To *"
                          value={formData.effectiveTo}
                          onChange={handleChange}
                          required
                        />
                      </Box>
                      <Box>
                        <BOSStatusField
                          fullWidth
                          isCreate={!id}
                          name="status"
                          label="Status"
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <MenuItem value="Active">Active</MenuItem>
                          <MenuItem value="Inactive">Inactive</MenuItem>
                        </BOSStatusField>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box>
                        <BOSTextField
                          fullWidth
                          name="customerName"
                          label="Customer *"
                          value={formData.customerName}
                          onClick={() => setCustomerLookupOpen(true)}
                          placeholder="Click to Select Customer..."
                          InputProps={{ readOnly: true }}
                        />
                      </Box>
                      <Box>
                        <BOSTextField
                          fullWidth
                          name="customerGroupName"
                          label="Customer Group"
                          value={formData.customerGroupName}
                          disabled
                        />
                      </Box>
                      <Box>
                        <BOSTextField
                          fullWidth
                          name="exchangeRate"
                          label="Exchange Rate"
                          type="number"
                          value={formData.exchangeRate}
                          onChange={handleChange}
                        />
                      </Box>

                      {/* Row 2 for Customer Price List */}
                      <Box>
                        <BOSTextField
                          fullWidth
                          select
                          name="paymentTermsId"
                          label="Payment Terms"
                          value={formData.paymentTermsId || ''}
                          onChange={handleChange}
                        >
                          <MenuItem value="">Select Payment Term...</MenuItem>
                          {paymentTermsList.map((pt) => (
                            <MenuItem key={pt.id} value={pt.id}>
                              {pt.termName}{pt.termCode ? ` (${pt.termCode})` : ''}
                            </MenuItem>
                          ))}
                        </BOSTextField>
                      </Box>
                      <Box>
                        <BOSTextField
                          fullWidth
                          name="referenceNo"
                          label="Reference No"
                          value={formData.referenceNo}
                          onChange={handleChange}
                          placeholder="Enter Reference No"
                        />
                      </Box>
                      <Box>
                        <BOSDatePicker
                          fullWidth
                          name="effectiveFrom"
                          label="Effective From *"
                          value={formData.effectiveFrom}
                          onChange={handleChange}
                          required
                        />
                      </Box>
                      <Box>
                        <BOSDatePicker
                          fullWidth
                          name="effectiveTo"
                          label="Effective To *"
                          value={formData.effectiveTo}
                          onChange={handleChange}
                          required
                        />
                      </Box>

                      {/* Row 3 for Customer Price List */}
                      <Box>
                        <BOSStatusField
                          fullWidth
                          isCreate={!id}
                          name="status"
                          label="Status"
                          value={formData.status}
                          onChange={handleChange}
                        >
                          <MenuItem value="Active">Active</MenuItem>
                          <MenuItem value="Inactive">Inactive</MenuItem>
                        </BOSStatusField>
                      </Box>
                    </>
                  )}

                  {/* Remarks Row */}
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <BOSTextField
                      fullWidth
                      name="remarks"
                      label="Remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      multiline
                      rows={3}
                      placeholder="Enter remarks (optional)"
                      sx={{
                        width: '100% !important',
                        '& .quill': { width: '100% !important' },
                        '& .ql-container': { width: '100% !important', minHeight: '80px' },
                        '& .ql-toolbar': { width: '100% !important' }
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Right Side: Upload Files */}
              <Box sx={{ width: '100%' }}>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'grey.50',
                    boxSizing: 'border-box'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    Reference Documents
                  </Typography>
                    <BOSFileUpload
                      files={formData.attachments || []}
                      onChange={(files) => setFormData({ ...formData, attachments: files })}
                      module="SM_PRICE_MASTER"
                    multiple={true}
                    maxFiles={50}
                    compact={true}
                    verticalList={true}
                    maxListHeight="100px"
                    compactDropzoneOnly={true}
                  />
                </Box>
              </Box>
            </Box>
          </BOSFormSection>

          <BOSFormSection
            title="Product Pricing Grid"
            icon={<IconSettings size={20} color={theme.palette.primary.main} />}
            action={
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<IconDownload size={16} />}
                  onClick={handleTemplateDownload}
                >
                  Template
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<IconUpload size={16} />}
                  onClick={() => setUploadOpen(true)}
                >
                  Upload Excel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<IconPlus size={16} />}
                  onClick={handleAddRow}
                >
                  Add Row
                </Button>
              </Stack>
            }
          >
            <TableContainer component={Paper} variant="outlined" sx={{ minHeight: '350px' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell width={60}>#</TableCell>
                    <TableCell>Product Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>UOM</TableCell>
                    <TableCell>Currency</TableCell>

                    {formData.priceListType === 'GENERAL PRICE LIST' ? (
                      <>
                        <TableCell>Base Price *</TableCell>
                        <TableCell>Min Price</TableCell>
                        <TableCell>Max Price</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>Base Price *</TableCell>
                        <TableCell>Target Sale Qty</TableCell>
                      </>
                    )}

                    <TableCell>Remarks</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell width={60}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.details.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={formData.priceListType === 'GENERAL PRICE LIST' ? 11 : 10}
                        align="center"
                      >
                        No records found. Click 'Add Row' or 'Upload Excel' to add products.
                      </TableCell>
                    </TableRow>
                  ) : (
                    formData.details.map((detail, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={detail.productCode || ''}
                            onClick={() => triggerProductLookup(index)}
                            placeholder="Select..."
                            InputProps={{ readOnly: true }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {detail.productName || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>{detail.uom || 'N/A'}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={detail.currency || 'INR'}
                            disabled
                          />
                        </TableCell>

                        {formData.priceListType === 'GENERAL PRICE LIST' ? (
                          <>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                fullWidth
                                value={detail.basePrice || ''}
                                onChange={(e) => handleDetailChange(index, 'basePrice', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                fullWidth
                                value={detail.minPrice || ''}
                                onChange={(e) => handleDetailChange(index, 'minPrice', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                fullWidth
                                value={detail.maxPrice || ''}
                                onChange={(e) => handleDetailChange(index, 'maxPrice', e.target.value)}
                              />
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                fullWidth
                                value={detail.basePrice || ''}
                                onChange={(e) => handleDetailChange(index, 'basePrice', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                fullWidth
                                value={detail.targetQty || ''}
                                onChange={(e) => handleDetailChange(index, 'targetQty', e.target.value)}
                              />
                            </TableCell>
                          </>
                        )}

                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={detail.remarks || ''}
                            onChange={(e) => handleDetailChange(index, 'remarks', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            fullWidth
                            value={detail.status || 'ACTIVE'}
                            onChange={(e) => handleDetailChange(index, 'status', e.target.value)}
                            disabled
                          >
                            <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                            <MenuItem value="INACTIVE">INACTIVE</MenuItem>
                          </TextField>
                        </TableCell>

                        <TableCell>
                          <IconButton onClick={() => handleDeleteRow(index)} color="error" size="small">
                            <IconTrash size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </BOSFormSection>
        </Stack>
      )}

      <ConfirmDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Price List"
        message="Are you sure you want to delete this price list? This will delete all rows."
        itemName={formData.priceListNo}
      />

      <CustomerLookupDialog
        open={customerLookupOpen}
        onClose={() => setCustomerLookupOpen(false)}
        onSelect={handleSelectCustomer}
      />

      <ProductLookupDialog
        open={productLookupOpen}
        onClose={() => setProductLookupOpen(false)}
        onSelect={handleSelectProduct}
      />

      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h4">Excel Bulk Upload</Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box
              component="label"
              sx={{
                border: '2px dashed',
                borderColor: selectedFile ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: selectedFile ? 'primary.light' : 'grey.50',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.light',
                }
              }}
            >
              <input
                type="file"
                accept=".xlsx, .xls"
                hidden
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <IconUpload size={48} color={theme.palette.primary.main} style={{ marginBottom: 16 }} />
              <Typography variant="h5" color="textPrimary" gutterBottom fontWeight={600}>
                {selectedFile ? selectedFile.name : 'Click to select or drag and drop an Excel file'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Only .xls and .xlsx files are allowed
              </Typography>
            </Box>

            {uploadSummary && (
              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2, border: '1px solid', borderColor: 'grey.300' }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Upload Summary:</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">Total Rows</Typography>
                    <Typography variant="h6">{uploadSummary.totalRows}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="success.main">Success</Typography>
                    <Typography variant="h6" color="success.main">{uploadSummary.successCount}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="error.main">Failed</Typography>
                    <Typography variant="h6" color="error.main">{uploadSummary.failedCount}</Typography>
                  </Grid>
                </Grid>
                {uploadSummary.errors && uploadSummary.errors.length > 0 && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: '#ffebee', borderRadius: 1, maxHeight: 150, overflowY: 'auto' }}>
                    <Typography variant="subtitle2" color="error" gutterBottom>Errors:</Typography>
                    {uploadSummary.errors.map((err, idx) => (
                      <Typography key={idx} variant="caption" display="block" color="error" sx={{ mb: 0.5 }}>
                        • {err}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setUploadOpen(false)} variant="outlined" color="inherit" sx={{ px: 3 }}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadFile}
            color="primary"
            variant="contained"
            disabled={!selectedFile}
            startIcon={<IconUpload size={18} />}
            sx={{ px: 4, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            Upload File
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
