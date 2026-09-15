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
  Autocomplete
} from '@mui/material';
import { IconX, IconPrinter, IconDeviceFloppy, IconRefresh } from '@tabler/icons-react';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';

export default function RelievingOrderDialog({ open, onClose, onSaveSuccess }) {
  const dispatch = useDispatch();
  
  // Lookups
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Form States
  const [orderDate, setOrderDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [refNo, setRefNo] = useState('');
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [employeeCode, setEmployeeCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [resignationDate, setResignationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [relievingDate, setRelievingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [session, setSession] = useState('A.N.'); // A.N. or F.N.
  const [subject, setSubject] = useState('Relieving Order & Experience Certificate');
  const [companyName, setCompanyName] = useState('AUTONOVA ENTERPRISE SYSTEMS');
  const [signingManager, setSigningManager] = useState('HR Manager');

  // Load all lookups
  useEffect(() => {
    if (open) {
      axios.get('/api/master/hr/departments')
        .then(res => setDepartments(res.data || []))
        .catch(err => console.error(err));

      axios.get('/api/master/hr/designations')
        .then(res => setDesignations(res.data || []))
        .catch(err => console.error(err));

      axios.get('/api/master/hr/employees')
        .then(res => setEmployees(res.data || []))
        .catch(err => console.error(err));

      // Auto generate reference number format: RO-YYYYMMDD-NNNN
      const datePart = format(new Date(), 'yyyyMMdd');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      setRefNo(`RO-${datePart}-${randomPart}`);
    }
  }, [open]);

  // Handle Employee selection
  const handleEmployeeChange = (event, val) => {
    setSelectedEmp(val);
    if (val) {
      setEmployeeCode(val.empCode || '');
      const fullName = `${val.firstName || val.employeeName || ''} ${val.lastName || ''}`.trim();
      setEmployeeName(fullName);
      
      // Resolve dept and desg names
      const deptObj = departments.find(d => String(d.id) === String(val.departmentId));
      setDepartment(deptObj ? deptObj.departmentName : (val.departmentName || ''));

      const desgObj = designations.find(d => String(d.id) === String(val.designationId));
      setDesignation(desgObj ? desgObj.designationName : (val.designationName || ''));
    } else {
      setEmployeeCode('');
      setEmployeeName('');
      setDepartment('');
      setDesignation('');
    }
  };

  const handleClear = () => {
    setOrderDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedEmp(null);
    setEmployeeCode('');
    setEmployeeName('');
    setDepartment('');
    setDesignation('');
    setResignationDate(format(new Date(), 'yyyy-MM-dd'));
    setRelievingDate(format(new Date(), 'yyyy-MM-dd'));
    setSession('A.N.');
    setSubject('Relieving Order & Experience Certificate');
    setCompanyName('AUTONOVA ENTERPRISE SYSTEMS');
    setSigningManager('HR Manager');
  };

  const handleSave = async () => {
    if (!employeeCode || !employeeName || !department || !designation) {
      dispatch(openSnackbar({
        open: true,
        message: 'Please select an employee.',
        variant: 'alert',
        alert: { color: 'error' },
        close: true
      }));
      return;
    }

    const payload = {
      letterType: 'RELIEVING_ORDER',
      refNo,
      letterDate: new Date(orderDate),
      employeeCode,
      employeeName,
      department,
      designation,
      formData: JSON.stringify({
        resignationDate,
        relievingDate,
        session,
        subject,
        companyName,
        signingManager
      }),
      status: 'SUBMITTED'
    };

    try {
      await axios.post('/api/hra/letters', payload);
      dispatch(openSnackbar({
        open: true,
        message: 'Relieving Order saved successfully.',
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
        message: 'Failed to save Relieving Order.',
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
          #printable-relieving-order, #printable-relieving-order * {
            visibility: visible;
          }
          #printable-relieving-order {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <DialogTitle className="no-print">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" fontWeight="bold">Create Relieving Order</Typography>
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
          <Grid item xs={12}>
            <Autocomplete
              options={employees}
              getOptionLabel={(option) => `${option.firstName || option.employeeName || ''} ${option.lastName || ''} (${option.empCode || ''})`}
              value={selectedEmp}
              onChange={handleEmployeeChange}
              renderInput={(params) => (
                <TextField {...params} label="Select Employee" required fullWidth />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Employee Name"
              fullWidth
              value={employeeName}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Employee Code"
              fullWidth
              value={employeeCode}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Department"
              fullWidth
              value={department}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Designation"
              fullWidth
              value={designation}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Resignation Letter Date"
              type="date"
              fullWidth
              value={resignationDate}
              onChange={(e) => setResignationDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Relieving Date"
              type="date"
              fullWidth
              value={relievingDate}
              onChange={(e) => setRelievingDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Session"
              fullWidth
              value={session}
              onChange={(e) => setSession(e.target.value)}
              required
            >
              <MenuItem value="A.N.">Afternoon Session (A.N.)</MenuItem>
              <MenuItem value="F.N.">Forenoon Session (F.N.)</MenuItem>
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
        </Grid>

        {/* Live Preview section */}
        <Box sx={{ mt: 4, p: 3, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#fafafa' }}>
          <Typography variant="subtitle2" color="secondary" gutterBottom>Letter Preview</Typography>
          <div id="printable-relieving-order" style={{ fontFamily: 'Georgia, serif', color: '#333', padding: '20px', backgroundColor: '#fff', lineHeight: 1.6 }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ margin: 0, color: '#1a365d', textTransform: 'uppercase' }}>{companyName}</h2>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>Human Resources Department</p>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <strong>Ref No:</strong> {refNo}
              </div>
              <div>
                <strong>Date:</strong> {orderDate ? format(new Date(orderDate), 'dd MMMM yyyy') : ''}
              </div>
            </div>

            <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px', textDecoration: 'underline', margin: '20px 0' }}>
              RELIEVING ORDER
            </p>

            <div style={{ marginBottom: '20px' }}>
              <strong>To,</strong><br />
              <strong>Mr./Ms. {employeeName}</strong><br />
              Emp Code: {employeeCode}<br />
              Designation: {designation}<br />
              Department: {department}<br />
            </div>

            <p><strong>Sub: {subject}</strong></p>

            <p>Dear {employeeName},</p>

            <p>
              We hereby accept your resignation letter dated <strong>{resignationDate ? format(new Date(resignationDate), 'dd/MM/yyyy') : ''}</strong> 
              and relieve you from all your duties on <strong>{relievingDate ? format(new Date(relievingDate), 'dd/MM/yyyy') : ''} ({session})</strong> 
              after closing all your accounts and dues.
            </p>

            <p>
              We appreciate the services rendered by you during your tenure with us and wish you the very best in all your future endeavors.
            </p>

            <div style={{ marginTop: '50px' }}>
              <p>For <strong>{companyName}</strong></p>
              <div style={{ height: '40px' }}></div>
              <strong>Authorized Signatory</strong><br />
              {signingManager}
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
