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
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { IconX, IconPrinter, IconDeviceFloppy, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';

const defaultClauses = [
  "You will be on probation for a period of six months from your date of joining.",
  "You shall perform the duties and responsibilities assigned to you by the Management from time to time.",
  "Your working hours will be in accordance with the standard operating hours and policies of the Company.",
  "Your compensation will be as per the agreed salary structure, subject to applicable tax and statutory deductions.",
  "You shall maintain strict confidentiality regarding all business secrets, client data, and proprietary information.",
  "Either party may terminate this employment contract by giving 30 days prior written notice or paying salary in lieu thereof.",
  "You are expected to adhere to the code of conduct, anti-harassment, and ethics policies of the Company.",
  "You shall not engage in any other business, commercial activity, or parallel employment during your service with us.",
  "You will be eligible for leaves and paid holidays as per the leave rules and policy of the Company.",
  "The Management reserves the right to transfer you to any department, branch, office, or subsidiary of the Company.",
  "The retirement age for all employees in the organization is 58 years.",
  "This appointment is subject to a satisfactory background check, reference checks, and verification of credentials.",
  "Any intellectual property or software created by you during your employment shall belong exclusively to the Company.",
  "Any misconduct, breach of policy, or failure to perform duties may result in disciplinary action up to termination.",
  "Any dispute arising out of this agreement shall be subject to the exclusive jurisdiction of local courts."
];

export default function AppointmentOrderDialog({ open, onClose, onSaveSuccess }) {
  const dispatch = useDispatch();
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Form States
  const [orderDate, setOrderDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [refNo, setRefNo] = useState('');
  const [appointmentOrderNo, setAppointmentOrderNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [emailId, setEmailId] = useState('');
  const [subject, setSubject] = useState('Appointment Order');

  // Lookup selections
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDesg, setSelectedDesg] = useState('');

  // Letter Variables
  const [joiningDate, setJoiningDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [companyName, setCompanyName] = useState('AUTONOVA ENTERPRISE SYSTEMS');
  const [signingManager, setSigningManager] = useState('HR Manager');

  // Clauses list
  const [clauses, setClauses] = useState([...defaultClauses]);

  // Load departments and designations
  useEffect(() => {
    if (open) {
      axios.get('/api/master/hr/departments')
        .then(res => setDepartments(res.data || []))
        .catch(err => console.error(err));

      axios.get('/api/master/hr/designations')
        .then(res => setDesignations(res.data || []))
        .catch(err => console.error(err));

      // Auto generate reference number format: AO-YYYYMMDD-NNNN
      const datePart = format(new Date(), 'yyyyMMdd');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      setRefNo(`AO-${datePart}-${randomPart}`);
    }
  }, [open]);

  const handleClauseChange = (idx, val) => {
    const next = [...clauses];
    next[idx] = val;
    setClauses(next);
  };

  const handleClear = () => {
    setOrderDate(format(new Date(), 'yyyy-MM-dd'));
    setAppointmentOrderNo('');
    setFirstName('');
    setLastName('');
    setAddress('');
    setEmailId('');
    setSubject('Appointment Order');
    setSelectedDept('');
    setSelectedDesg('');
    setJoiningDate(format(new Date(), 'yyyy-MM-dd'));
    setCompanyName('AUTONOVA ENTERPRISE SYSTEMS');
    setSigningManager('HR Manager');
    setClauses([...defaultClauses]);
  };

  const handleSave = async () => {
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
      letterType: 'APPOINTMENT_ORDER',
      refNo,
      letterDate: new Date(orderDate),
      employeeCode: null,
      employeeName: `${firstName} ${lastName}`,
      department: selectedDept,
      designation: selectedDesg,
      formData: JSON.stringify({
        appointmentOrderNo,
        firstName,
        lastName,
        address,
        emailId,
        subject,
        joiningDate,
        companyName,
        signingManager,
        clauses
      }),
      status: 'SUBMITTED'
    };

    try {
      await axios.post('/api/hra/letters', payload);
      dispatch(openSnackbar({
        open: true,
        message: 'Appointment Order saved successfully.',
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
        message: 'Failed to save Appointment Order.',
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
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-appointment-order, #printable-appointment-order * {
            visibility: visible;
          }
          #printable-appointment-order {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <DialogTitle className="no-print">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight="bold">Create Appointment Order</Typography>
          <IconButton onClick={onClose} size="small">
            <IconX size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent className="no-print" dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Order Date"
              type="date"
              fullWidth
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
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
              label="Appointment Order No"
              fullWidth
              value={appointmentOrderNo}
              onChange={(e) => setAppointmentOrderNo(e.target.value)}
              placeholder="e.g. APT-2026-001"
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
          <Grid item xs={12} sm={6}>
            <TextField
              label="Joining Date"
              type="date"
              fullWidth
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Subject"
              fullWidth
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
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
              label="Signing Manager (Title)"
              fullWidth
              value={signingManager}
              onChange={(e) => setSigningManager(e.target.value)}
            />
          </Grid>

          {/* Clauses Editor */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h5" color="primary" sx={{ mb: 2 }}>Terms and Conditions (15 Clauses)</Typography>
            <Stack spacing={2}>
              {clauses.map((clause, idx) => (
                <Card key={idx} variant="outlined" sx={{ bgcolor: '#fafafa' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="subtitle2" color="secondary" gutterBottom>Clause {idx + 1}</Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={clause}
                      onChange={(e) => handleClauseChange(idx, e.target.value)}
                    />
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Grid>
        </Grid>

        {/* Live Preview section */}
        <Box sx={{ mt: 4, p: 3, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#fafafa' }}>
          <Typography variant="subtitle2" color="secondary" gutterBottom>Letter Preview</Typography>
          <div id="printable-appointment-order" style={{ fontFamily: 'Georgia, serif', color: '#333', padding: '20px', backgroundColor: '#fff', lineHeight: 1.6 }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ margin: 0, color: '#1a365d', textTransform: 'uppercase' }}>{companyName}</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>Human Resources Department</p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <strong>Ref No:</strong> {refNo}<br />
                {appointmentOrderNo && <><strong>Order No:</strong> {appointmentOrderNo}<br /></>}
              </div>
              <div>
                <strong>Date:</strong> {orderDate ? format(new Date(orderDate), 'dd MMMM yyyy') : ''}
              </div>
            </div>

            <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px', textDecoration: 'underline', margin: '20px 0' }}>
              APPOINTMENT ORDER
            </p>

            <div style={{ marginBottom: '20px' }}>
              <strong>To,</strong><br />
              {firstName} {lastName}<br />
              {address && <div style={{ whiteSpace: 'pre-wrap' }}>{address}</div>}
              {emailId && <div>Email: {emailId}</div>}
            </div>

            <p><strong>Sub: {subject}</strong></p>

            <p>Dear {firstName},</p>

            <p>
              We are pleased to appoint you as <strong>{selectedDesg || '[Designation]'}</strong> in the department of <strong>{selectedDept || '[Department]'}</strong> with effect from <strong>{joiningDate ? format(new Date(joiningDate), 'dd/MM/yyyy') : ''}</strong>. Your appointment is subject to the following terms and conditions:
            </p>

            <ol style={{ paddingLeft: '20px', margin: '20px 0' }}>
              {clauses.map((clause, idx) => (
                <li key={idx} style={{ marginBottom: '10px' }}>{clause}</li>
              ))}
            </ol>

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p>For <strong>{companyName}</strong></p>
                <div style={{ height: '40px' }}></div>
                <strong>Authorized Signatory</strong><br />
                {signingManager}
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
