import React, { useState, useEffect, useRef } from 'react';
import { Grid, useTheme, MenuItem, Button, Box, Typography } from '@mui/material';
import { IconUser, IconMail, IconPhone, IconBriefcase, IconFileTypography, IconPlus, IconPaperclip } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import useBOSValidation from 'hooks/useBOSValidation';
import { BOSFormDialog, BOSFormSection, BOSTextField, BOSAutocomplete, BOSFileGallery, BOSStatusField, errorStyle } from 'ui-component/bos';
import { API_PATHS } from 'utils/api-constants';
import { autoUploadFile } from 'utils/upload-helper';

// ==============================|| SM - ADD/EDIT CONTACT DIALOG ||============================== //

const fieldConfigs = [
  { field: 'contactName', label: 'Contact Name', required: true, maxLength: 200 },
  { field: 'emailId', label: 'Email ID', type: 'email' },
  { field: 'mobileNo', label: 'Mobile No', maxLength: 50 },
  { field: 'groupName', label: 'Customer Name', required: true }
];

export default function AddContactDialog({ open, handleClose, initialData, initialGroupName, customerDetails, readOnly }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const isEdit = !!initialData;
  const { errors, validate, clearErrors } = useBOSValidation();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    groupName: initialGroupName || '',
    title: '',
    contactName: '',
    designation: '',
    department: '',
    emailId: '',
    landlineNo: '',
    mobileNo: '',
    whatsAppNo: '',
    fileUpload: '',
    status: 'Active',
    type: '',
    contactType: ''
  });

  const [customers, setCustomers] = useState([]);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get('/api/master/vendors');
        const mappedData = response.data.map(v => ({
          ...v,
          customerName: v.vendorName
        }));
        setCustomers(mappedData);
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
      }
    };
    if (open) fetchCustomers();
  }, [open]);

  useEffect(() => {
    clearErrors();
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        type: initialData.type || '',
        contactType: initialData.contactType || ''
      });
    } else {
      setFormData({
        groupName: initialGroupName || '',
        title: '',
        contactName: '',
        designation: '',
        department: '',
        emailId: '',
        landlineNo: '',
        mobileNo: '',
        whatsAppNo: '',
        fileUpload: '',
        status: 'Active',
        type: '',
        contactType: ''
      });
    }

    if (initialData && initialData.fileUpload) {
      const files = initialData.fileUpload.split(',').filter(f => f).map(f => ({
        id: Math.random(),
        fileName: f.split('_').slice(1).join('_') || f,
        serverFileName: f,
        isLoaded: true
      }));
      setAttachments(files);
    } else {
      setAttachments([]);
    }

    // Autofill common details from customer if provided or found
    if (open && !isEdit) {
      const selectedCustomer = customerDetails || customers.find(c => c.customerName === (initialGroupName || formData.groupName));
      if (selectedCustomer) {
        let autoType = '';
        if (selectedCustomer.isCustomer) autoType = 'Customer';
        else if (selectedCustomer.isSupplier) autoType = 'Vendor';

        setFormData(prev => ({
          ...prev,
          status: selectedCustomer.isActive ? 'Active' : 'Inactive',
          type: autoType || prev.type
        }));
      }
    }
  }, [initialData, initialGroupName, open, clearErrors, customerDetails, customers, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };

      // If groupName (Customer) changed, autofill common details
      if (name === 'groupName') {
        const customer = customers.find(c => c.customerName === value);
        if (customer) {
          newFormData.status = customer.isActive ? 'Active' : 'Inactive';
          if (customer.isCustomer) newFormData.type = 'Customer';
          else if (customer.isSupplier) newFormData.type = 'Vendor';
        }
      }

      return newFormData;
    });
  };

  const handleSubmit = async () => {
    if (!validate(formData, fieldConfigs)) return;
    try {
      // Handle File Uploads
      const updatedAttachments = [...attachments];
      for (let i = 0; i < updatedAttachments.length; i++) {
        const att = updatedAttachments[i];
        if (!att.isLoaded && att.file) {
          // autoUploadFile automatically detects 'Sales' (SM) from the URL
          const uploadedPath = await autoUploadFile(att.file);
          updatedAttachments[i] = {
            ...att,
            serverFileName: uploadedPath,
            isLoaded: true
          };
        }
      }

      const finalFormData = {
        ...formData,
        fileUpload: updatedAttachments.map(att => att.serverFileName).join(',')
      };

      if (isEdit) {
        await axios.put(`${API_PATHS.SM.CONTACTS}/${initialData.id}`, finalFormData);
      } else {
        await axios.post(API_PATHS.SM.CONTACTS, finalFormData);
      }
      dispatch(openSnackbar({ open: true, message: `Contact ${isEdit ? 'updated' : 'created'} successfully!`, variant: 'alert', alert: { variant: 'filled' }, severity: 'success', close: false }));
      handleClose(true);
    } catch (error) {
      console.error('Failed to save contact:', error);
      dispatch(openSnackbar({ open: true, message: 'Failed to save contact.', variant: 'alert', alert: { variant: 'filled' }, severity: 'error', close: false }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({
      id: Date.now() + Math.random(),
      fileName: file.name,
      fileType: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      file: file,
      isLoaded: false
    }));
    setAttachments([...attachments, ...newAttachments]);
    e.target.value = null;
  };

  const handleRemoveAttachment = (id) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };


  return (
    <BOSFormDialog
      open={open}
      onClose={() => handleClose(false)}
      onSave={handleSubmit}
      title={isEdit ? (readOnly ? 'View Contact' : 'Edit Contact') : 'Add New Contact'}
      isViewOnly={readOnly}
      maxWidth="md"
    >
      <BOSFormSection icon={<IconUser size={20} color={theme.palette.primary.main} />} title="Basic Information">
        <Grid container spacing={2}>
          {/* Row 1: Type | Title | Customer Name */}
          <Grid item xs={12} sm={4}>
            <BOSTextField
              name="type"
              label="Type"
              value={formData.type}
              onChange={handleChange}
              disabled={readOnly}
              select
            >

              <MenuItem value="Customer">Customer</MenuItem>
              <MenuItem value="Vendor">Vendor</MenuItem>
              <MenuItem value="Prospect">Prospect</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </BOSTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <BOSTextField
              name="title"
              label="Title"
              value={formData.title}
              onChange={handleChange}
              disabled={readOnly}
              select
            >

              <MenuItem value="Mr.">Mr.</MenuItem>
              <MenuItem value="Ms.">Ms.</MenuItem>
              <MenuItem value="Mrs.">Mrs.</MenuItem>
              <MenuItem value="Dr.">Dr.</MenuItem>
              <MenuItem value="Prof.">Prof.</MenuItem>
            </BOSTextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <BOSTextField
              name="groupName"
              label="Customer Name"
              value={formData.groupName}
              onChange={handleChange}
              disabled={readOnly}
              required
              select
              error={!!errors.groupName}
              helperText={errors.groupName}
              sx={errorStyle(!!errors.groupName)} >
              {customers.map((c) => (
                <MenuItem key={c.id} value={c.customerName}>{c.customerName}</MenuItem>
              ))}
            </BOSTextField>
          </Grid>

          {/* Row 2: Contact Name | Contact Type */}
          <Grid item xs={12} sm={6}>
            <BOSTextField name="contactName" label="Contact Name" value={formData.contactName} onChange={handleChange} disabled={readOnly} required error={!!errors.contactName} helperText={errors.contactName} sx={errorStyle(!!errors.contactName)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <BOSTextField
              name="contactType"
              label="Contact Type"
              value={formData.contactType}
              onChange={handleChange}
              disabled={readOnly}
              select
            >

              <MenuItem value="Primary">Primary</MenuItem>
              <MenuItem value="Secondary">Secondary</MenuItem>
              <MenuItem value="Technical">Technical</MenuItem>
              <MenuItem value="Commercial">Commercial</MenuItem>
              <MenuItem value="Accounts">Accounts</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </BOSTextField>
          </Grid>

          {/* Row 3: Mobile No | WhatsApp No | Landline No */}
          <Grid item xs={12} sm={4}>
            <BOSTextField name="mobileNo" label="Mobile No" value={formData.mobileNo} onChange={handleChange} disabled={readOnly} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <BOSTextField name="whatsAppNo" label="WhatsApp No" value={formData.whatsAppNo} onChange={handleChange} disabled={readOnly} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <BOSTextField name="landlineNo" label="Landline No" value={formData.landlineNo} onChange={handleChange} disabled={readOnly} />
          </Grid>

          {/* Row 4: Department | Designation | Email ID */}
          <Grid item xs={12} sm={4}>
            <BOSTextField name="department" label="Department" value={formData.department} onChange={handleChange} disabled={readOnly} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <BOSTextField name="designation" label="Designation" value={formData.designation} onChange={handleChange} disabled={readOnly} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <BOSTextField name="emailId" label="Email ID" value={formData.emailId} onChange={handleChange} disabled={readOnly} error={!!errors.emailId} helperText={errors.emailId} sx={errorStyle(!!errors.emailId)} />
          </Grid>

          {/* Row 5: Status */}
          <Grid item xs={12}>
            <BOSStatusField name="status" label="Status" value={formData.status} onChange={handleChange} disabled={readOnly} isCreate={!isEdit} />
          </Grid>
        </Grid>
      </BOSFormSection>

      <BOSFormSection
        icon={<IconFileTypography size={20} color={theme.palette.primary.main} />}
        title="Documents"
        action={
          <Button
            startIcon={<IconPlus size={18} />}
            size="small"
            variant="contained"
            onClick={() => fileInputRef.current?.click()}
            disabled={readOnly}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Upload
          </Button>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              multiple
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
            <BOSFileGallery
              files={attachments}
              onRemove={(idx) => handleRemoveAttachment(attachments[idx].id)}
              isEditing={!readOnly}
            />
            {attachments.length === 0 && !readOnly && (
              <Box sx={{ p: 4, border: '2px dashed', borderColor: 'divider', borderRadius: '16px', textAlign: 'center', bgcolor: 'grey.50' }}>
                <IconFileTypography size={48} color={theme.palette.text.disabled} />
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  No documents attached yet.
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
                  Upload visit reports, business cards, or other relevant files.
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<IconPlus size={18} />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ borderRadius: '8px' }}
                >
                  Upload
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </BOSFormSection>

    </BOSFormDialog>
  );
}
