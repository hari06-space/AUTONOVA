import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, Divider, Grid, Alert
} from '@mui/material';
import { IconX, IconCloudUpload, IconCheck, IconDownload } from '@tabler/icons-react';
import * as XLSX from 'xlsx-js-style';
import axios from 'utils/axios';
import { useDispatch } from 'react-redux';
import { openSnackbar } from 'store/slices/snackbar';
import { API_PATHS } from 'utils/api-constants';

import useAuth from 'hooks/useAuth';

// ==============================|| OEM MAPPING BULK EXCEL UPLOADER (BOS SOP COMPLIANT) ||============================== //

export default function BulkUploadDialog({ open, handleClose }) {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClear = () => {
    setSelectedFile(null);
    setParsedData([]);
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setErrorMsg('Please select a valid Excel or CSV file (.xlsx, .xls, .csv).');
      return;
    }

    setSelectedFile(file);
    setLoading(true);

    try {
      const dataBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(dataBuffer, { type: 'array' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (rawRows.length < 2) {
        setErrorMsg('The selected spreadsheet does not contain any record rows.');
        setLoading(false);
        return;
      }

      // Map spreadsheet headers case-insensitively
      const headers = rawRows[0].map(h => String(h).trim().toLowerCase());
      const partNoIdx = headers.findIndex(h => h.includes('part no') || h.includes('part_no') || h.includes('partnumber'));
      const oemPartNoIdx = headers.findIndex(h => h.includes('oem part') || h.includes('oem_part') || h.includes('oempart'));
      const oemDescIdx = headers.findIndex(h => h.includes('description') || h.includes('desc'));
      const statusIdx = headers.findIndex(h => h.includes('status'));

      if (partNoIdx === -1 || oemPartNoIdx === -1) {
        setErrorMsg('Could not find required columns "Part No" and "OEM Part No" in the spreadsheet.');
        setLoading(false);
        return;
      }

      const rowsToSave = [];
      const seenPartNos = new Set();
      let duplicatesRemoved = 0;

      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || row.length === 0) continue;

        const partNo = row[partNoIdx] ? String(row[partNoIdx]).trim() : '';
        const oemPartNo = row[oemPartNoIdx] ? String(row[oemPartNoIdx]).trim() : '';
        const oemDescription = oemDescIdx !== -1 && row[oemDescIdx] ? String(row[oemDescIdx]).trim() : '';
        const status = statusIdx !== -1 && row[statusIdx] ? String(row[statusIdx]).trim().toUpperCase() : 'ACTIVE';

        // Skip blank key rows
        if (!partNo || !oemPartNo) continue;

        const key = partNo.toLowerCase();
        if (seenPartNos.has(key)) {
          duplicatesRemoved++;
          continue; // Automatically skip duplicate part numbers
        }
        seenPartNos.add(key);

        rowsToSave.push({
          partNo,
          oemPartNo,
          oemDescription,
          status: ['ACTIVE', 'INACTIVE'].includes(status) ? status : 'ACTIVE'
        });
      }

      if (rowsToSave.length === 0) {
        setErrorMsg('No valid rows found in the sheet. Please make sure Part No and OEM Part No are not empty.');
        setParsedData([]);
      } else {
        setParsedData(rowsToSave);
        if (duplicatesRemoved > 0) {
          dispatch(openSnackbar({
            open: true,
            message: `${duplicatesRemoved} duplicate Part No row(s) automatically filtered and removed from the file.`,
            variant: 'alert',
            alert: { variant: 'filled' },
            severity: 'info',
            close: false
          }));
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to read or parse the Excel file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateHeaders = [['Part No', 'OEM Part No', 'OEM Description', 'Status']];
    const sampleRows = [
      ['PN-001', 'OEM-PN-100', 'Sample OEM Description details', 'ACTIVE'],
      ['PN-002', 'OEM-PN-200', 'Another sample description', 'INACTIVE']
    ];
    
    // Create sheet with headers and placeholder data rows
    const ws = XLSX.utils.aoa_to_sheet([...templateHeaders, ...sampleRows]);
    
    // Define header and cell styles
    const headerStyle = {
      fill: { fgColor: { rgb: "FFCC99" } }, // Light Orange
      font: { bold: true, name: "Calibri", sz: 11 },
      alignment: { vertical: "center", horizontal: "left" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    const dataStyle = {
      font: { name: "Calibri", sz: 11 },
      border: {
        top: { style: "thin", color: { rgb: "E2E2E2" } },
        bottom: { style: "thin", color: { rgb: "E2E2E2" } },
        left: { style: "thin", color: { rgb: "E2E2E2" } },
        right: { style: "thin", color: { rgb: "E2E2E2" } }
      },
      alignment: { vertical: "center", horizontal: "left" }
    };

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[address]) continue;
        if (R === 0) {
          ws[address].s = headerStyle;
        } else {
          ws[address].s = dataStyle;
        }
      }
    }

    // Set standard columns width
    ws['!cols'] = [
      { wch: 25 },
      { wch: 25 },
      { wch: 40 },
      { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'OEM_Mapping_Bulk_Upload_Template.xlsx');
  };

  const handleUploadSave = async () => {
    if (parsedData.length === 0) return;
    setLoading(true);

    try {
      const dataWithUser = parsedData.map(row => ({
        ...row,
        createdBy: user?.id || 'Admin',
        updatedBy: user?.id || 'Admin'
      }));
      const response = await axios.post(`${API_PATHS.NPD.ITEM_OEM_MAPPING}/bulk`, dataWithUser);
      const { savedCount } = response.data;

      dispatch(openSnackbar({
        open: true,
        message: `Successfully imported ${savedCount} mappings!`,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'success',
        close: false
      }));

      handleClose(true);
      handleClear();
    } catch (error) {
      console.error('Failed bulk import:', error);
      const backendData = error.response?.data;
      let displayMsg = 'Bulk import failed. Please verify your data formatting.';
      if (typeof backendData === 'string' && backendData.trim().length > 0) {
        displayMsg = backendData;
      } else if (backendData && typeof backendData === 'object' && backendData.message) {
        displayMsg = backendData.message;
      }

      dispatch(openSnackbar({
        open: true,
        message: displayMsg,
        variant: 'alert',
        alert: { variant: 'filled' },
        severity: 'error',
        close: false
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => handleClose()} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.light', py: 1.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.dark' }}>Bulk OEM Upload</Typography>
        <IconButton onClick={() => handleClose()} size="small"><IconX size={20} /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          {errorMsg && (
            <Grid item xs={12}>
              <Alert severity="error">{errorMsg}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Step 1: Download Template Spreadsheet
            </Typography>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<IconDownload size={18} />}
              onClick={handleDownloadTemplate}
              sx={{ textTransform: 'none', borderRadius: '8px' }}
            >
              Download Excel Template
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Step 2: Upload Mapped File
            </Typography>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: selectedFile ? 'primary.main' : 'divider',
                borderRadius: '12px',
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: 'grey.50',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'primary.light', borderColor: 'primary.main' }
              }}
            >
              <IconCloudUpload size={48} stroke={1.5} color={selectedFile ? '#2196f3' : '#9e9e9e'} />
              <Typography variant="body1" sx={{ mt: 1.5, fontWeight: 600 }}>
                {selectedFile ? selectedFile.name : 'Click to select spreadsheet'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Supports Excel (.xlsx, .xls) and CSV (.csv)
              </Typography>
            </Box>
          </Grid>

          {parsedData.length > 0 && (
            <Grid item xs={12}>
              <Alert severity="info">
                Found <strong>{parsedData.length}</strong> valid rows ready for import.
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, justifyContent: 'flex-end', gap: 1.5 }}>
        <Button onClick={handleClear} variant="text" color="secondary" sx={{ textTransform: 'none' }}>
          Clear
        </Button>
        <Button
          onClick={handleUploadSave}
          variant="contained"
          color="primary"
          disabled={parsedData.length === 0 || loading}
          startIcon={<IconCheck size={18} />}
          sx={{ textTransform: 'none', px: 3, borderRadius: '8px' }}
        >
          {loading ? 'Importing...' : 'Save & Import'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

BulkUploadDialog.propTypes = {
  open: PropTypes.bool,
  handleClose: PropTypes.func
};
