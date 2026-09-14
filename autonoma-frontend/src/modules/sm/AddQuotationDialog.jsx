import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Stack, Box, Typography, Paper, useTheme, Chip } from '@mui/material';
import { IconSettings, IconScan, IconReceipt2, IconTruckDelivery, IconCreditCard } from '@tabler/icons-react';
import axios from 'utils/axios';
import { API_PATHS } from 'utils/api-constants';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSAutocomplete, BOSFileUpload, errorStyle } from 'ui-component/bos';
import ConfirmDeleteDialog from 'ui-component/ConfirmDeleteDialog';
import useBOSForm from 'hooks/useBOSForm';

// ==============================|| QUOTATION - PROFESSIONAL TEMPLATE ||============================== //

const AddQuotationDialog = ({ open, handleClose, initialData, initialGroupName, readOnly = false }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customers, setCustomers] = useState([]);

  const { formData, setFormData, handleFormChange, errors, validate, resetForm } = useBOSForm({
    quotationNo: '',
    quotationDate: new Date().toISOString().split('T')[0],
    enquiryRef: '',
    customerName: '',
    customerId: '',
    contactPerson: '',
    productName: '',
    description: '',
    quantity: '',
    unitPrice: '',
    totalAmount: '',
    currency: 'INR',
    validityPeriod: '30 Days',
    deliveryTerms: '',
    paymentTerms: '',
    ocrDocumentPath: '',
    ocrExtractedText: '',
    ocrConfidence: '',
    status: 'Draft',
    remarks: '',
    attachments: [] // Added for Gold Standard compliance
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(API_PATHS.SM.CUSTOMERS);
        setCustomers(res.data);
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      }
    };
    if (open) fetchCustomers();
  }, [open]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          ...initialData,
          quotationDate: initialData.quotationDate ? new Date(initialData.quotationDate).toISOString().split('T')[0] : '',
          customerId: initialData.customer?.id || '',
        });
        setIsEditing(false);
      } else {
        resetForm();
        setIsEditing(!readOnly);
        if (initialGroupName && customers.length > 0) {
          const selectedCust = customers.find(c => c.customerName === initialGroupName);
          if (selectedCust) {
            setFormData(prev => ({
              ...prev,
              customerId: selectedCust.id,
              customerName: selectedCust.customerName,
              contactPerson: selectedCust.contactPerson || ''
            }));
          }
        }
      }
    }
  }, [initialData, initialGroupName, open, readOnly, setFormData, resetForm, customers]);

  const handleCustomChange = (e) => {
    const { name, value } = e.target;
    if (name === 'customerId') {
      const selectedCust = customers.find(c => c.id === value);
      setFormData((prev) => ({ 
        ...prev, 
        customerId: value, 
        customerName: selectedCust ? selectedCust.customerName : prev.customerName,
        contactPerson: selectedCust ? selectedCust.contactPerson : prev.contactPerson
      }));
    } else {
      handleFormChange(e);
    }
  };

  const handleSave = async () => {
    const { isValid, firstMissing } = validate([
      { field: 'customerId', label: 'Customer' },
      { field: 'productName', label: 'Product Name' }
    ]);

    if (!isValid) {
      dispatch(openSnackbar({
        open: true,
        message: `Field ${firstMissing} is mandatory.`,
        variant: 'alert',
        severity: 'error',
        alert: { variant: 'filled' }
      }));
      return;
    }

    const submissionData = {
      ...formData,
      customer: formData.customerId ? { id: formData.customerId } : null
    };

    try {
      if (formData.id) {
        await axios.put(`${API_PATHS.SM.QUOTATIONS}/${formData.id}`, submissionData);
        dispatch(openSnackbar({ open: true, message: 'Quotation updated successfully!', severity: 'success', variant: 'alert' }));
      } else {
        await axios.post(API_PATHS.SM.QUOTATIONS, submissionData);
        dispatch(openSnackbar({ open: true, message: 'Quotation created successfully!', severity: 'success', variant: 'alert' }));
      }
      handleClose(true);
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to save quotation.', severity: 'error', variant: 'alert' }));
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await axios.delete(`${API_PATHS.SM.QUOTATIONS}/${formData.id}`);
      dispatch(openSnackbar({ open: true, message: 'Quotation deleted!', severity: 'success', variant: 'alert' }));
      handleClose(true);
    } catch (error) {
      dispatch(openSnackbar({ open: true, message: 'Failed to delete.', severity: 'error', variant: 'alert' }));
    }
  };

  const isViewOnly = readOnly && !isEditing;

  return (
    <>
      <BOSFormDialog
        open={open}
        onClose={() => handleClose()}
        onSave={handleSave}
        onDelete={() => setDeleteOpen(true)}
        onClear={isEditing ? resetForm : null}
        onEditClick={() => setIsEditing(true)}
        title={initialData ? `Edit Quotation - ${formData.quotationNo}` : 'Create New Quotation'}
        isViewOnly={isViewOnly}
        hasId={!!formData.id}
        maxWidth="lg"
        sidebar={
          <Stack spacing={3}>
            <BOSFileUpload
              label="Standard Attachments"
              files={formData.attachments}
              onChange={(newFiles) => setFormData({ ...formData, attachments: newFiles })}
              module="SALES_QUOTATION"
              multiple={true}
              disabled={isViewOnly}
              helperText="Quotation docs, PDFs, or drawings"
            />

            <BOSFormSection icon={<IconScan size={22} color={theme.palette.warning.main} />} title="OCR AI Analysis">
              <Stack spacing={2}>
                <BOSTextField label="OCR Path" value={formData.ocrDocumentPath} disabled />
                <Box sx={{ p: 1.5, bgcolor: 'warning.lighter', borderRadius: '8px', border: '1px solid', borderColor: 'warning.light' }}>
                  <Typography variant="caption" color="warning.dark" fontWeight={700}>AI Confidence: {formData.ocrConfidence}%</Typography>
                </Box>
                <BOSTextField multiline rows={3} label="Extracted Text" value={formData.ocrExtractedText} disabled />
              </Stack>
            </BOSFormSection>
          </Stack>
        }
      >
        <Stack spacing={3}>
          <BOSFormSection icon={<IconReceipt2 size={22} color={theme.palette.primary.main} />} title="General Information">
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
              <BOSTextField name="quotationNo" label="Quotation No" value={formData.quotationNo} disabled placeholder="Auto-generated" />
              <BOSTextField name="quotationDate" label="Quotation Date" type="date" value={formData.quotationDate} onChange={handleCustomChange} disabled={isViewOnly} />
              <BOSTextField name="enquiryRef" label="Enquiry Reference" value={formData.enquiryRef} onChange={handleCustomChange} disabled={isViewOnly} />
              <BOSTextField 
                select 
                name="customerId" 
                label="Select Customer" 
                value={formData.customerId || ''} 
                onChange={handleCustomChange} 
                disabled={isViewOnly} 
                required 
                error={errors.customerId} 
                sx={errorStyle(errors.customerId)}
              >
                {customers.map((cust) => (
                  <MenuItem key={cust.id} value={cust.id}>
                    {cust.customerName} ({cust.customerCode})
                  </MenuItem>
                ))}
              </BOSTextField>
              <BOSTextField label="Contact Person" value={formData.contactPerson} disabled sx={{ bgcolor: 'grey.50' }} />
              <BOSTextField select name="status" label="Workflow Status" value={formData.status} onChange={handleCustomChange} disabled={isViewOnly}>
                <MenuItem value="Draft">Draft</MenuItem>
                <MenuItem value="Sent">Sent</MenuItem>
                <MenuItem value="Accepted">Accepted</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
                <MenuItem value="Expired">Expired</MenuItem>
              </BOSTextField>
            </Box>
          </BOSFormSection>

          <BOSFormSection icon={<IconSettings size={22} color={theme.palette.secondary.main} />} title="Product & Pricing Structure">
            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 3 }}>
              <BOSTextField 
                required 
                label="Product Name" 
                name="productName" 
                value={formData.productName} 
                onChange={handleCustomChange} 
                disabled={isViewOnly} 
                error={errors.productName} 
                sx={errorStyle(errors.productName)} 
              />
              <BOSTextField type="number" label="Quantity" name="quantity" value={formData.quantity} onChange={handleCustomChange} disabled={isViewOnly} />
              <BOSTextField type="number" label="Unit Price" name="unitPrice" value={formData.unitPrice} onChange={handleCustomChange} disabled={isViewOnly} />
              <BOSTextField select name="currency" label="Currency" value={formData.currency} onChange={handleCustomChange} disabled={isViewOnly}>
                <MenuItem value="INR">INR</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
              </BOSTextField>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 3, mt: 3 }}>
              <BOSTextField multiline rows={2} label="Extended Description" name="description" value={formData.description} onChange={handleCustomChange} disabled={isViewOnly} />
              <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: 'primary.lighter', borderStyle: 'dashed' }}>
                <Typography variant="caption" color="textSecondary" gutterBottom>Total Quote Value</Typography>
                <Typography variant="h3" color="primary.main">{formData.currency} {formData.totalAmount || '0.00'}</Typography>
              </Paper>
            </Box>
          </BOSFormSection>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <BOSFormSection icon={<IconTruckDelivery size={22} color={theme.palette.success.main} />} title="Logistics & Delivery">
              <Stack spacing={2.5}>
                <BOSTextField select label="Validity Period" name="validityPeriod" value={formData.validityPeriod} onChange={handleCustomChange} disabled={isViewOnly}>
                  <MenuItem value="7 Days">7 Days</MenuItem>
                  <MenuItem value="15 Days">15 Days</MenuItem>
                  <MenuItem value="30 Days">30 Days</MenuItem>
                  <MenuItem value="60 Days">60 Days</MenuItem>
                </BOSTextField>
                <BOSTextField multiline rows={3} label="Delivery Terms" name="deliveryTerms" value={formData.deliveryTerms} onChange={handleCustomChange} disabled={isViewOnly} />
              </Stack>
            </BOSFormSection>

            <BOSFormSection icon={<IconCreditCard size={22} color={theme.palette.warning.main} />} title="Financial Terms">
              <Stack spacing={2.5}>
                <BOSTextField multiline rows={2} label="Payment Terms" name="paymentTerms" value={formData.paymentTerms} onChange={handleCustomChange} disabled={isViewOnly} />
                <BOSTextField multiline rows={2} label="Internal Remarks" name="remarks" value={formData.remarks} onChange={handleCustomChange} disabled={isViewOnly} />
              </Stack>
            </BOSFormSection>
          </Box>
        </Stack>
      </BOSFormDialog>

      <ConfirmDeleteDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDeleteConfirm} title="Delete Quotation" message="Are you sure you want to delete this quotation?" itemName={formData.quotationNo || formData.customerName} />
    </>
  );
};

AddQuotationDialog.propTypes = { 
  open: PropTypes.bool, 
  handleClose: PropTypes.func, 
  initialData: PropTypes.object, 
  initialGroupName: PropTypes.string,
  readOnly: PropTypes.bool 
};

export default AddQuotationDialog;
