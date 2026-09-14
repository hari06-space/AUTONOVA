import { useState, useEffect } from 'react';
import { MenuItem, Grid, InputAdornment, Box, Typography } from '@mui/material';
import { BOSTextField, BOSFormDialog, BOSFormSection, BOSDatePicker } from 'ui-component/bos';
import {
  IconSettings,
  IconBuildingSkyscraper,
  IconUsersGroup,
  IconUser,
  IconPhone,
  IconMail,
  IconBox,
  IconHash,
  IconCurrencyRupee,
  IconTag,
  IconCalendarEvent,
  IconMessageChatbot,
  IconAddressBook
} from '@tabler/icons-react';
import { useTheme } from '@mui/material/styles';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import BOSFileUpload from 'ui-component/bos/BOSFileUpload';

export default function QuotationFollowUpPopup({ open, onClose, onSave, rowData }) {
  const theme = useTheme();
  const dispatch = useDispatch();

  const initialFormState = {
    followType: 'Follow Up',
    comments: '',
    followUpDate: new Date().toISOString().split('T')[0],
    attachmentPath: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [contacts, setContacts] = useState([]);
  const [quoteData, setQuoteData] = useState({ currency: '', exchangeRate: '', enquiryMode: '' });

  useEffect(() => {
    if (open) {
      setFormData(initialFormState);
      setQuoteData({ currency: '', exchangeRate: '', enquiryMode: '' });
    }
    if (open && rowData?.custName) {
      axios.get('/api/sm/contacts')
        .then(res => {
          const filtered = (res.data || []).filter(c => c.groupName === rowData.custName);
          setContacts(filtered);
        })
        .catch(err => console.error('Failed to fetch contacts:', err));
    } else {
      setContacts([]);
    }

    if (open && rowData?.quotationId) {
      axios.get(`/api/sm/quotation/${rowData.quotationId}`)
        .then(res => {
          if (res.data) {
            setQuoteData({
              currency: res.data.currency || '',
              exchangeRate: res.data.exchangeRate || '',
              enquiryMode: res.data.rfqMode || ''
            });
          }
        })
        .catch(err => console.error('Failed to fetch quotation details:', err));

      // Fetch existing follow-up data to show comments and attachment
      if (rowData?.partId) {
        axios.get(`/api/sm/quotation-follow-up/quotation/${rowData.quotationId}`)
          .then(res => {
            const followUps = res.data || [];
            const partFollowUps = followUps.filter(f => f.partId === rowData.partId);
            if (partFollowUps.length > 0) {
              const latest = partFollowUps.sort((a, b) => b.id - a.id)[0];
              setFormData(prev => ({
                ...prev,
                followType: latest.followType || 'Follow Up',
                comments: latest.comments || '',
                followUpDate: latest.followUpDate ? latest.followUpDate.split('T')[0] : prev.followUpDate,
                attachmentPath: latest.attachmentPath || ''
              }));
            }
          })
          .catch(err => console.error('Failed to fetch follow up history:', err));
      }
    }
  }, [open, rowData]);

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleClear = () => {
    setFormData(initialFormState);
  };

  const handleSave = async () => {
    if (!formData.followUpDate || !formData.followType || !formData.comments) {
      dispatch(openSnackbar({ open: true, message: 'Please fill all mandatory fields.', variant: 'alert', severity: 'error' }));
      return;
    }

    try {
      const payload = {
        quotationId: rowData.quotationId,
        customerId: rowData.customerId,
        partId: rowData.partId,
        followUpDate: new Date(formData.followUpDate),
        followType: formData.followType,
        comments: formData.comments,
        attachmentPath: formData.attachmentPath,
        status: true
      };

      await axios.post('/api/sm/quotation-follow-up', payload);

      dispatch(openSnackbar({ open: true, message: 'Follow up saved successfully!', variant: 'alert', severity: 'success' }));
      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error('Save failed:', err);
      dispatch(openSnackbar({ open: true, message: 'Failed to save follow up.', variant: 'alert', severity: 'error' }));
    }
  };

  const iconColor = theme.palette.text.secondary;

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      onSave={handleSave}
      onClear={handleClear}
      title="FollowUp Entry Details"
      maxWidth="md"
    >
      <BOSFormSection icon={<IconBuildingSkyscraper size={20} color={theme.palette.primary.main} />} title="Customer Details">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '32%' }}>
            <BOSTextField
              label="Customer Name"
              value={rowData?.custName || ''}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start"><IconBuildingSkyscraper size={18} color={iconColor} /></InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '32%' }}>
            <BOSTextField
              label="Quotation No"
              value={rowData?.quoteNo || ''}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start"><IconHash size={18} color={iconColor} /></InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '32%' }}>
            <BOSTextField
              label="Customer Group"
              value={rowData?.custGroup || '-'}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start"><IconUsersGroup size={18} color={iconColor} /></InputAdornment>
              }}
            />
          </Grid>
        </Grid>
      </BOSFormSection>

      <BOSFormSection icon={<IconAddressBook size={20} color={theme.palette.primary.main} />} title="Contact Details">
        {contacts.length === 0 ? (
          <Typography color="textSecondary" align="center" sx={{ width: '100%', py: 2 }}>
            No contacts found for this quotation.
          </Typography>
        ) : (
          contacts.map((contact, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: index < contacts.length - 1 ? 2 : 0 }}>
              <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '32%' }}>
                <BOSTextField
                  label="Contact Name"
                  value={contact.contactName || ''}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <InputAdornment position="start"><IconUser size={18} color={iconColor} /></InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '32%' }}>
                <BOSTextField
                  label="Mobile No"
                  value={contact.mobileNo || ''}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <InputAdornment position="start"><IconPhone size={18} color={iconColor} /></InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '32%' }}>
                <BOSTextField
                  label="Email"
                  value={contact.emailId || ''}
                  InputProps={{
                    readOnly: true,
                    startAdornment: <InputAdornment position="start"><IconMail size={18} color={iconColor} /></InputAdornment>
                  }}
                />
              </Grid>
            </Grid>
          ))
        )}
      </BOSFormSection>

      <BOSFormSection icon={<IconSettings size={20} color={theme.palette.primary.main} />} title="Part Details">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '32%' }}>
            <BOSTextField
              label="Part No"
              value={rowData?.partNo || ''}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start"><IconBox size={18} color={iconColor} /></InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '32%' }}>
            <BOSTextField
              label="Part Name"
              value={rowData?.partName || ''}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start"><IconBox size={18} color={iconColor} /></InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '32%' }}>
            <BOSTextField
              label="Qty"
              value={rowData?.qty || ''}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start"><IconHash size={18} color={iconColor} /></InputAdornment>
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '32%' }}>
            <BOSTextField
              label="Unit Price"
              value={rowData?.price || ''}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start"><IconCurrencyRupee size={18} color={iconColor} /></InputAdornment>
              }}
            />
          </Grid>



          <Grid item xs={12} sm={12} md={4} lg={4} sx={{ width: '32%' }}>
            <BOSTextField
              select
              label="Type"
              required
              value={formData.followType}
              onChange={handleChange('followType')}
              InputProps={{
                startAdornment: <InputAdornment position="start"><IconTag size={18} color={iconColor} /></InputAdornment>
              }}
            >
              <MenuItem value="Follow Up">Follow Up</MenuItem>
              <MenuItem value="Demo">Demo</MenuItem>
              <MenuItem value="Negotiation">Negotiation</MenuItem>
            </BOSTextField>
          </Grid>

          <Grid item xs={12} sm={12} md={4} lg={4} sx={{ width: '32%' }}>
            <BOSDatePicker
              name="followUpDate"
              label="Next Date"
              required
              value={formData.followUpDate}
              onChange={handleChange('followUpDate')}
              disableFuture={false}
            />
          </Grid>
        </Grid>


        <Grid container spacing={2} sx={{ mt: 1, width: '100%' }}>
          <Grid item xs={12} sm={12} md={6} lg={6} sx={{ display: 'flex', width: '48%', minHeight: '110px' }}>
            <Box sx={{ width: '100%', minHeight: '110px', display: 'flex', flexDirection: 'column' }}>
                <BOSTextField
                  label="Comments"
                  required
                  multiline
                  rows={4}
                  disableRichText={true}
                value={formData.comments}
                onChange={handleChange('comments')}
                sx={{
                  width: '100%',
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  '& .MuiInputBase-root': { flexGrow: 1, alignItems: 'flex-start' },
                  '& .MuiInputBase-input': { height: '100% !important', overflowY: 'auto !important' }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}><IconMessageChatbot size={18} color={iconColor} /></InputAdornment>
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} md={6} lg={6} sx={{ display: 'flex', width: '48%', minHeight: '110px' }}>
            <Box sx={{ width: '100%', minHeight: '110px', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flexGrow: 1 }}>
                <BOSFileUpload
                  label="Upload File"
                  module="QUOTATION_FOLLOW_UP"
                  multiple={false}
                  maxFiles={1}
                  compact={true}
                  maxListHeight={110}
                  files={formData.attachmentPath ? [{ name: formData.attachmentPath, serverFileName: formData.attachmentPath }] : []}
                  onChange={(files) => {
                    if (files.length > 0) {
                      setFormData({ ...formData, attachmentPath: files[0].serverFileName });
                    } else {
                      setFormData({ ...formData, attachmentPath: '' });
                    }
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </BOSFormSection>
    </BOSFormDialog>
  );
}
