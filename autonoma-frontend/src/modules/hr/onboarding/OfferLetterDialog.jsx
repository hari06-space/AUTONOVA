import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Button,
  Typography,
  MenuItem,
  Stack,
  Box,
  IconButton,
  Divider
} from '@mui/material';
import { IconX, IconPrinter, IconDeviceFloppy, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';

export default function OfferLetterDialog({ open, onClose, onSaveSuccess }) {
  const dispatch = useDispatch();
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Form States
  const [offerDate, setOfferDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [refNo, setRefNo] = useState('');
  const [offerLetterNo, setOfferLetterNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [emailId, setEmailId] = useState('');
  const [subject, setSubject] = useState('Offer of Employment');

  // Lookup selections
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDesg, setSelectedDesg] = useState('');

  // Letter Variables
  const [interviewDate, setInterviewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [joiningDate, setJoiningDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [companyName, setCompanyName] = useState('AUTONOVA ENTERPRISE SYSTEMS');
  const [headHrName, setHeadHrName] = useState('HR Manager');

  // Load departments and designations
  useEffect(() => {
    if (open) {
      // Fetch dynamic lists
      axios.get('/api/master/hr/departments')
        .then(res => setDepartments(res.data || []))
        .catch(err => console.error('Error fetching departments:', err));

      axios.get('/api/master/hr/designations')
        .then(res => setDesignations(res.data || []))
        .catch(err => console.error('Error fetching designations:', err));

      // Auto generate reference number format: OL-YYYYMMDD-NNNN
      const datePart = format(new Date(), 'yyyyMMdd');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      setRefNo(`OL-${datePart}-${randomPart}`);
    }
  }, [open]);

  const handleClear = () => {
    setOfferDate(format(new Date(), 'yyyy-MM-dd'));
    setOfferLetterNo('');
    setFirstName('');
    setLastName('');
    setAddress('');
    setEmailId('');
    setSubject('Offer of Employment');
    setSelectedDept('');
    setSelectedDesg('');
    setInterviewDate(format(new Date(), 'yyyy-MM-dd'));
    setJoiningDate(format(new Date(), 'yyyy-MM-dd'));
    setCompanyName('AUTONOVA ENTERPRISE SYSTEMS');
    setHeadHrName('HR Manager');
  };

  const handleSave = async () => {
    // Validation
    if (!firstName || !lastName || !emailId || !selectedDept || !selectedDesg) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please fill in all mandatory fields.',
        variant: 'alert',
        alert: { color: 'error' },
        close: true
      }));
      return;
    }

    const payload = {
      letterType: 'OFFER_LETTER',
      refNo,
      letterDate: new Date(offerDate),
      employeeCode: null,
      employeeName: `${firstName} ${lastName}`,
      department: selectedDept,
      designation: selectedDesg,
      formData: JSON.stringify({
        offerLetterNo,
        firstName,
        lastName,
        address,
        emailId,
        subject,
        interviewDate,
        joiningDate,
        companyName,
        headHrName
      }),
      status: 'SUBMITTED'
    };

    try {
      await axios.post('/api/hra/letters', payload);
      dispatch(openSnackbar({
        open: true,
        message: 'Offer Letter saved successfully.',
        variant: 'alert',
        alert: { color: 'success' },
        close: true
      }));
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      dispatch(openSnackbar({
        open: true,
        message: 'Failed to save Offer Letter.',
        variant: 'alert',
        alert: { color: 'error' },
        close: true
      }));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Hide on print stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-offer-letter, #printable-offer-letter * {
            visibility: visible;
          }
          #printable-offer-letter {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <DialogTitle className="no-print">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight="bold">Create Offer Letter</Typography>
          <IconButton onClick={onClose} size="small">
            <IconX size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent className="no-print" dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Offer Date"
              type="date"
              fullWidth
              value={offerDate}
              onChange={(e) => setOfferDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Ref No"
              fullWidth
              value={refNo}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Offer Letter No"
              fullWidth
              value={offerLetterNo}
              onChange={(e) => setOfferLetterNo(e.target.value)}
              placeholder="e.g. OL-2026-001"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email Id"
              fullWidth
              type="email"
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Applicant Name"
              fullWidth
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Father Name"
              fullWidth
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Department"
              fullWidth
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              required
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.departmentName}>
                  {dept.departmentName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Designation"
              fullWidth
              value={selectedDesg}
              onChange={(e) => setSelectedDesg(e.target.value)}
              required
            >
              {designations.map((desg) => (
                <MenuItem key={desg.id} value={desg.designationName}>
                  {desg.designationName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Subject"
              fullWidth
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Grid>

          {/* Dynamic Content Placeholders */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="h5" color="primary" sx={{ mb: 2 }}>Letter Settings & Placeholders</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Interview Date"
              type="date"
              fullWidth
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Joining Deadline Date"
              type="date"
              fullWidth
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Company Name"
              fullWidth
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Signing Manager (HEAD HR)"
              fullWidth
              value={headHrName}
              onChange={(e) => setHeadHrName(e.target.value)}
            />
          </Grid>
        </Grid>

        {/* Live Preview section */}
        <Box sx={{ mt: 4, p: 3, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#fafafa' }}>
          <Typography variant="subtitle2" color="secondary" gutterBottom>Letter Preview</Typography>
          <div id="printable-offer-letter" style={{ fontFamily: 'Georgia, serif', color: '#333', padding: '20px', backgroundColor: '#fff', lineHeight: 1.6 }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ margin: 0, color: '#1a365d', textTransform: 'uppercase' }}>{companyName}</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>Corporate Office & HR Department</p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <strong>Ref No:</strong> {refNo}<br />
                {offerLetterNo && <><strong>Letter No:</strong> {offerLetterNo}<br /></>}
              </div>
              <div>
                <strong>Date:</strong> {offerDate ? format(new Date(offerDate), 'dd MMMM yyyy') : ''}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong>To,</strong><br />
              {firstName} {lastName}<br />
              {address && <div style={{ whiteSpace: 'pre-wrap' }}>{address}</div>}
              {emailId && <div>Email: {emailId}</div>}
            </div>

            <p><strong>Sub: {subject}</strong></p>

            <p>Dear {firstName},</p>

            <p>
              With reference to the Interview we had on <strong>{interviewDate ? format(new Date(interviewDate), 'dd/MM/yyyy') : ''}</strong>, 
              we are pleased to inform you that you have been selected as <strong>{selectedDesg || '[Designation]'}</strong> in our 
              Department of <strong>{selectedDept || '[Department]'}</strong>.
            </p>

            <p>
              As already discussed with you, you have to join for duty on or before <strong>{joiningDate ? format(new Date(joiningDate), 'dd/MM/yyyy') : ''}</strong>. 
              Detailed appointment order will be issued at the time of joining.
            </p>

            <p>Please sign and return the duplicate copy of this letter as token of your acceptance.</p>

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ marginBottom: '40px' }}>For <strong>{companyName}</strong></p>
                <strong>{headHrName}</strong><br />
                Head - HR
              </div>
              <div style={{ textAlign: 'right', marginTop: '40px' }}>
                <div style={{ borderTop: '1px solid #333', width: '200px', paddingTop: '5px' }}>
                  Candidate Signature & Date
                </div>
              </div>
            </div>
          </div>
        </Box>
      </DialogContent>

      <DialogActions className="no-print">
        <Button startIcon={<IconRefresh size={18} />} color="secondary" onClick={handleClear}>
          Clear
        </Button>
        <Button startIcon={<IconPrinter size={18} />} color="info" onClick={handlePrint}>
          Print
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button startIcon={<IconDeviceFloppy size={18} />} variant="contained" color="primary" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
