import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  Button,
  Typography,
  MenuItem,
  Stack,
  Box,
  Divider,
  Breadcrumbs,
  Link,
  Autocomplete
} from '@mui/material';
import {
  IconPrinter,
  IconDeviceFloppy,
  IconRefresh,
  IconArrowLeft,
  IconFileText,
  IconHome,
  IconUserCheck
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { format } from 'date-fns';
import { BOSPageHeader, BOSFormSection, BOSTextField } from 'ui-component/bos';
import useConfig from 'hooks/useConfig';
import { useRibbon } from 'contexts/RibbonContext';
import { MenuOrientation } from 'config';

// ==============================|| RELIEVING ORDER PAGE ||============================== //

export default function RelievingOrderPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
  const [emailId, setEmailId] = useState('');
  const [session, setSession] = useState('A.N.');
  const [subject, setSubject] = useState('Relieving Order');

  const { state: { menuOrientation } } = useConfig();
  const { ribbonOpen } = useRibbon();
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL;
  const stickyTop = isHorizontal ? (ribbonOpen ? 174 : 126) : 88;

  const [companyName, setCompanyName] = useState('AUTONOVA ENTERPRISE SYSTEMS');
  const [signingManager, setSigningManager] = useState('HR Manager');

  // Load all lookups on mount
  useEffect(() => {
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
  }, []);

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
      navigate('/hra/employee/onboarding');
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
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-relieving-order, #printable-relieving-order * { visibility: visible; }
          #printable-relieving-order {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <Box
        sx={{
          mx: { xs: -2, sm: -3 },
          width: { xs: 'calc(100% + 32px)', sm: 'calc(100% + 48px)' },
          borderRadius: 0
        }}
      >
        <BOSPageHeader
          title="Create Relieving Order"
          subtitle="Generate and print employee relieving order"
          icon={IconFileText}
          actions={
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<IconArrowLeft size={18} />}
                onClick={() => navigate('/hra/employee/onboarding')}
                size="small"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                Back
              </Button>
              <Button
                startIcon={<IconRefresh size={18} />}
                color="secondary"
                onClick={handleClear}
                variant="outlined"
                size="small"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                Clear
              </Button>
              <Button
                startIcon={<IconPrinter size={18} />}
                color="info"
                onClick={handlePrint}
                variant="outlined"
                size="small"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                Print
              </Button>
              <Button
                startIcon={<IconDeviceFloppy size={18} />}
                variant="contained"
                color="primary"
                onClick={handleSave}
                size="small"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
              >
                Save
              </Button>
            </Stack>
          }
        />

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Form Section */}
            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                <BOSFormSection title="Employee & Relieving Details" icon={<IconUserCheck size={20} />}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <BOSTextField
                        label="Order Date"
                        type="date"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <BOSTextField
                        label="Ref No"
                        value={refNo}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                        options={employees}
                        getOptionLabel={(option) => `${option.firstName || option.employeeName || ''} ${option.lastName || ''} (${option.empCode || ''})`}
                        value={selectedEmp}
                        onChange={handleEmployeeChange}
                        renderInput={(params) => (
                          <BOSTextField {...params} label="Select Employee" required />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <BOSTextField
                        label="Employee Name"
                        value={employeeName}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <BOSTextField
                        label="Employee Code"
                        value={employeeCode}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <BOSTextField
                        label="Department"
                        value={department}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <BOSTextField
                        label="Designation"
                        value={designation}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <BOSTextField
                        label="Resignation Letter Date"
                        type="date"
                        value={resignationDate}
                        onChange={(e) => setResignationDate(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <BOSTextField
                        label="Relieving Date"
                        type="date"
                        value={relievingDate}
                        onChange={(e) => setRelievingDate(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <BOSTextField
                        select
                        label="Session"
                        value={session}
                        onChange={(e) => setSession(e.target.value)}
                        required
                      >
                        <MenuItem value="A.N.">Afternoon Session (A.N.)</MenuItem>
                        <MenuItem value="F.N.">Forenoon Session (F.N.)</MenuItem>
                      </BOSTextField>
                    </Grid>
                    <Grid item xs={12}>
                      <BOSTextField
                        label="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <BOSTextField
                        label="Company Name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <BOSTextField
                        label="Signing Manager (Title)"
                        value={signingManager}
                        onChange={(e) => setSigningManager(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </BOSFormSection>
              </Stack>
            </Grid>

            {/* Live Preview section */}
            <Grid item xs={12} md={5}>
              <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: '16px', bgcolor: '#fafafa', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'sticky', top: `calc(${stickyTop}px + 90px)` }}>
                <Typography variant="h5" color="secondary" sx={{ fontWeight: 700, mb: 2 }}>Letter Preview</Typography>
                <div id="printable-relieving-order" style={{ fontFamily: 'Georgia, serif', color: '#333', padding: '20px', backgroundColor: '#fff', lineHeight: 1.6, border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ margin: 0, color: '#1a365d', textTransform: 'uppercase' }}>{companyName}</h2>
                    <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>Human Resources Department</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div><strong>Ref No:</strong> {refNo}</div>
                    <div><strong>Date:</strong> {orderDate ? format(new Date(orderDate), 'dd MMMM yyyy') : ''}</div>
                  </div>

                  <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '18px', textDecoration: 'underline', margin: '20px 0' }}>
                    RELIEVING ORDER
                  </p>

                  <div style={{ marginBottom: '20px' }}>
                    <strong>To,</strong><br />
                    <strong>Mr./Ms. {employeeName || '[Employee Name]'}</strong><br />
                    Emp Code: {employeeCode || '[Code]'}<br />
                    Designation: {designation || '[Designation]'}<br />
                    Department: {department || '[Department]'}<br />
                  </div>

                  <p><strong>Sub: {subject}</strong></p>
                  <p>Dear {employeeName || '[Employee Name]'},</p>
                  <p>
                    We hereby accept your resignation letter dated <strong>{resignationDate ? format(new Date(resignationDate), 'dd/MM/yyyy') : ''}</strong> and relieve you from all your duties on <strong>{relievingDate ? format(new Date(relievingDate), 'dd/MM/yyyy') : ''} ({session})</strong> after closing all your accounts and dues.
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
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
}
