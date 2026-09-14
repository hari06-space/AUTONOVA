import React, { useState, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Tooltip, CircularProgress, Box, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Stack, Divider, Tabs, Tab, Paper, useTheme, useMediaQuery,
  Checkbox, FormControlLabel, FormGroup, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
  IconFileExport, IconFileSpreadsheet, IconFileTypePdf,
  IconX, IconEye, IconFunction, IconPlus, IconMinus, IconSearch,
  IconChevronLeft, IconChevronRight, IconFileDescription,
  IconDownload, IconSettings
} from '@tabler/icons-react';
import { exportToExcel } from 'utils/excelExport';
import useAuth from 'hooks/useAuth';
import BOSDataTable from './BOSDataTable';
import { format } from 'date-fns';
import axios from 'utils/axios';
import { useSelector } from 'react-redux';
import { resolveNestedValue, filterRows, resolveExportValue } from './BOSUtils';
import { formatDate as bosFormatDate } from 'utils/BOSTimeUtils';
import { buildDigitalPdfDocument, exportToPdf } from 'utils/digitalPdfExport';
import { getCompanyImageUrl } from 'utils/upload-helper';

/**
 * ═══════════════════════════════════════════════════════════════
 * BOSExportButton — Standard Export with High-Fidelity Preview
 * ═══════════════════════════════════════════════════════════════
 */

const getCleanHeader = (c) => {
  if (!c) return '';
  if (c.header && typeof c.header === 'string') return c.header;
  if (c.label && typeof c.label === 'string') return c.label;

  const element = c.header || c.label;
  if (element && typeof element === 'object' && React.isValidElement(element)) {
    if (element.props && element.props.title && typeof element.props.title === 'string') {
      return element.props.title;
    }
    if (element.props && element.props.label && typeof element.props.label === 'string') {
      return element.props.label;
    }
    if (element.props && typeof element.props.children === 'string') {
      return element.props.children;
    }
  }

  if (c.id && typeof c.id === 'string') return c.id;
  if (c.key && typeof c.key === 'string') return c.key;
  return 'Column';
};

const extractTextFromReactElement = (el) => {
  if (el === null || el === undefined || typeof el === 'boolean') return '';
  if (typeof el === 'string' || typeof el === 'number') return String(el);
  if (Array.isArray(el)) return el.map(extractTextFromReactElement).filter(Boolean).join(' ');
  if (React.isValidElement(el)) {
    const props = el.props || {};
    if (props.status && (typeof props.status === 'string' || typeof props.status === 'number')) return String(props.status);
    if (props.label && typeof props.label === 'string') return props.label;
    if (props.title && typeof props.title === 'string') return props.title;
    if (props.value && (typeof props.value === 'string' || typeof props.value === 'number')) return String(props.value);
    if (props.children) return extractTextFromReactElement(props.children);
  }
  return '';
};

const BOSExportButton = React.forwardRef(({
  data = [],
  filename = 'Export',
  reportTitle = null,
  reportName = null,
  columns = null,
  screenColumns = null,
  disabled = false,
  loading = false,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  pageId = null,
  pageName = null,
  pageCode = null,
  tooltip,
  iconOnly = false,
  ignoreGlobalFilters = false,
  buttonLabel = 'Export',
  buttonIcon = <IconEye size={18} />,
  open = undefined,
  onClose = undefined,
  fetchExportData = null,
  documentDetails = [],
  signatures = [],
  stampText = null,
  sx = {}
}, ref) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [asyncData, setAsyncData] = useState(null);
  const [isFetchingExport, setIsFetchingExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [zoom, setZoom] = useState(1);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const viewportRef = React.useRef(null);

  const activeData = asyncData || data || [];

  const normalizedColumns = useMemo(() => {
    if (!columns) return [];
    return columns.map(c => {
      if (!c) return null;
      const stringKey = typeof c.id === 'string' ? c.id : (typeof c.key === 'string' ? c.key : (c.header || c.label || 'col'));
      return {
        ...c,
        id: stringKey,
        key: stringKey,
        exportValue: typeof c.exportValue === 'function' ? c.exportValue : (typeof c.key === 'function' ? c.key : undefined),
        render: typeof c.render === 'function' ? c.render : undefined,
        header: getCleanHeader(c)
      };
    }).filter(Boolean);
  }, [columns]);

  const normalizedScreenColumns = useMemo(() => {
    if (!screenColumns) return [];
    return screenColumns.map(c => {
      if (!c) return null;
      const stringKey = typeof c.id === 'string' ? c.id : (typeof c.key === 'string' ? c.key : (c.header || c.label || 'col'));
      return {
        ...c,
        id: stringKey,
        key: stringKey,
        exportValue: typeof c.exportValue === 'function' ? c.exportValue : (typeof c.key === 'function' ? c.key : undefined),
        render: typeof c.render === 'function' ? c.render : undefined,
        header: getCleanHeader(c)
      };
    }).filter(Boolean);
  }, [screenColumns]);
  const { user } = useAuth();
  const [previewOpen, setPreviewOpen] = useState(false);
  const prevPreviewOpenRef = useRef(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Excel, 1: PDF
  const [page, setPage] = useState(0);
  const [sizePerPage, setSizePerPage] = useState(10);

  const [selectedPdfColKeys, setSelectedPdfColKeys] = useState([]);
  const [selectedExcelColKeys, setSelectedExcelColKeys] = useState([]);
  const [orientationMode, setOrientationMode] = useState('auto'); // 'auto' | 'portrait' | 'landscape'
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [showPdfHeader, setShowPdfHeader] = useState(true);
  const [companyProfile, setCompanyProfile] = useState({ companyName: 'AUTONOMA', shortName: 'Business Operating System' });

  useEffect(() => {
    if (open !== undefined) {
      setPreviewOpen(open);
    }
  }, [open]);

  // Fetch company profile only when preview is opened to save bandwidth on mount
  useEffect(() => {
    if (previewOpen && companyProfile.companyName === 'AUTONOMA') {
      axios.get('/api/company-profile/all')
        .then(res => {
          const list = Array.isArray(res.data) ? res.data : [];
          if (list.length > 0) {
            const rec = list[0];
            setCompanyProfile({
              companyName: rec.companyName || 'AUTONOMA',
              shortName: rec.shortName || rec.dbSourceName || 'Business Operating System',
              address: rec.address || '',
              city: rec.city || '',
              state: rec.state || '',
              pincode: rec.pincode || '',
              phoneNo: rec.phoneNo || '',
              mobileNo: rec.mobileNo || '',
              emailId: rec.emailId || '',
              website: rec.website || '',
              gstIn: rec.gstIn || rec.gstNo || '',
              logoFileName: rec.logoFileName || ''
            });
          }
        })
        .catch(() => { /* silently use defaults */ });
    }
  }, [previewOpen, companyProfile.companyName]);

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = Math.max(200, Math.min(480, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const allAvailableCols = useMemo(() => {
    const seen = new Set();
    const list = [];
    const source = [...(normalizedColumns || []), ...(normalizedScreenColumns || [])];
    source.forEach(col => {
      if (col && col.key && !seen.has(col.key)) {
        seen.add(col.key);
        list.push(col);
      }
    });
    return list;
  }, [normalizedColumns, normalizedScreenColumns]);

  const rawQuery = useSelector((state) => state.search?.rawQuery);
  const filters = useSelector((state) => state.search?.filters);
  const searchQuery = ignoreGlobalFilters ? '' : (rawQuery || '');
  const globalFilters = ignoreGlobalFilters ? {} : (filters || {});

  const filteredData = useMemo(() => {
    const getCellDisplayValue = (col, row, idx) => {
      if (!col || !col.id || typeof col.id !== 'string') return '-';
      let val = resolveNestedValue(col.id, row);
      if (val === undefined || val === null) {
        const snakeCaseId = col.id.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        val = row[snakeCaseId];
        if (val === undefined || val === null || val === '') {
          if (col.id === 'createdDate') val = row['createdAt'] || row['created_at'];
          if (col.id === 'updatedDate') val = row['updatedAt'] || row['updated_at'];
          if (col.id === 'createdUser') val = row['createdBy'] || row['created_by'] || row['created_user'];
          if (col.id === 'updatedUser') val = row['updatedBy'] || row['updated_by'] || row['updated_user'];
          if (col.id === 'createdBy') val = row['createdUser'] || row['created_by'] || row['created_user'];
          if (col.id === 'updatedBy') val = row['updatedUser'] || row['updated_by'] || row['updated_user'];
        }
      }
      if (col.id?.toLowerCase() === 'status' || col.id?.toLowerCase() === 'accountstatus' || col.id?.toLowerCase() === 'isactive') {
        return (val === 1 || val === true || val === 'Active' || val === 'ACTIVE') ? 'Active' : 'Inactive';
      }
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      if (col.format && typeof col.format === 'function') {
        let formatted = col.format(val, row);
        if (formatted === undefined) {
          formatted = col.format(row, row);
        }
        return formatted !== null && formatted !== undefined ? String(formatted) : '-';
      }
      return resolveExportValue(val);
    };

    const formatDate = (d, colId) => {
      if (!d) return '-';
      return bosFormatDate(d);
    };

    return filterRows(
      activeData,
      searchQuery,
      globalFilters,
      allAvailableCols,
      resolveNestedValue,
      formatDate,
      getCellDisplayValue
    );
  }, [activeData, searchQuery, globalFilters, allAvailableCols]);

  const isExportable = (c) => {
    if (!c) return false;
    const key = String(c.key || c.id || '').toLowerCase();
    const header = String(c.header || c.label || '').toLowerCase();
    if (key.includes('password') || key.includes('action') || header.includes('password') || header.includes('action')) return false;
    if (c.exportValue && typeof c.exportValue === 'function' && c.exportValue({}) === null) return false;
    return true;
  };

  // Synchronize/initialize checkboxes ONLY when dialog opens (on rising edge)
  useEffect(() => {
    if (previewOpen && !prevPreviewOpenRef.current) {
      const exportable = (allAvailableCols && allAvailableCols.length > 0 ? allAvailableCols : (normalizedColumns || [])).filter(isExportable);
      const allKeys = exportable.map(c => c.key);

      setSelectedPdfColKeys(allKeys);
      setSelectedExcelColKeys(allKeys);

      setOrientationMode('auto');
      setSettingsCollapsed(false);
      setShowPdfHeader(true);
    }
    prevPreviewOpenRef.current = previewOpen;
  }, [previewOpen, allAvailableCols, normalizedColumns]);

  const excelColumns = useMemo(() => {
    return allAvailableCols.filter(col => isExportable(col) && selectedExcelColKeys.includes(col.key));
  }, [allAvailableCols, selectedExcelColKeys]);

  const pdfCols = useMemo(() => {
    return allAvailableCols.filter(col => isExportable(col) && selectedPdfColKeys.includes(col.key));
  }, [allAvailableCols, selectedPdfColKeys]);


  const handleOpenPreview = async () => {
    if (fetchExportData) {
      setIsFetchingExport(true);
      try {
        const fullData = await fetchExportData();
        setAsyncData(fullData || []);
      } catch (err) {
        console.error('Failed to fetch export data:', err);
      } finally {
        setIsFetchingExport(false);
      }
    }
    setPreviewOpen(true);
  };
  const handleClosePreview = () => {
    setPreviewOpen(false);
    if (onClose) onClose();
    setActiveTab(0);
  };

  const prepareData = (colsList) => {
    const activeCols = colsList || normalizedColumns;
    if (!activeCols || activeCols.length === 0) return [];

    const hasSNo = activeCols.some(c => {
      const k = String(c.id || c.key || c.header || c.label || '').toLowerCase().replace(/[^a-z]/g, '');
      return k === 'index' || k === 'sno' || k === 'slno';
    });

    const finalCols = hasSNo ? activeCols : [{ header: 'SL.NO', key: 'slNo', exportValue: (r, idx) => idx + 1 }, ...activeCols];

    return filteredData.map((row, index) => {
      const mappedRow = {};
      finalCols.forEach(col => {
        let colId = col.key || col.id;
        const upperHeaderKey = String(col.header || col.label || col.id || 'COLUMN').toUpperCase();
        let val = null;
        let hasCustomFormatter = false;

        const keyName = typeof colId === 'string' ? colId : (col.id || col.field || '');
        const keyNameLower = String(keyName).toLowerCase();
        const colHeaderLower = String(col.header || col.label || '').toLowerCase();

        const cleanColId = keyNameLower.replace(/[^a-z]/g, '');
        const cleanHeader = colHeaderLower.replace(/[^a-z]/g, '');
        const isSNoCol = cleanColId === 'index' || cleanColId === 'sno' || cleanColId === 'slno' || cleanHeader === 'slno' || cleanHeader === 'sno';

        if (isSNoCol) {
          val = index + 1;
        } else {
          if (col.exportValue && typeof col.exportValue === 'function') {
            try {
              val = col.exportValue(row, index);
              if (val !== null && val !== undefined) {
                hasCustomFormatter = true;
              }
            } catch (e) {
              val = null;
            }
          }
          if (val === null || val === undefined) {
            if (typeof colId === 'function') {
              val = colId(row, index);
              if (val !== null && val !== undefined) {
                hasCustomFormatter = true;
              }
            } else {
              val = resolveNestedValue(colId, row);
            }
          }

          if (val === undefined || val === null || val === '') {
            if (typeof colId === 'string') {
              if (colId === 'enRolledNo' || colId === 'enrolledNo') val = row.enRolledNo || row.enrolledNo || row.empCode || row.enRollNo;
              else if (colId === 'firstName' || colId === 'applicantName') val = row.firstName || row.applicantName || row.employeeName || row.name;
              else if (colId === 'lastName' || colId === 'fatherName') val = row.lastName || row.fatherName || row.father_name || row.q1_father_name;
              else {
                const snakeCaseId = colId.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                val = row[snakeCaseId];
                if ((val === undefined || val === null) && colId.includes('.')) {
                  val = resolveNestedValue(colId, row);
                }
              }
            }
          }

          let renderResult = null;
          if (!col.exportValue && col.render && typeof col.render === 'function') {
            try {
              renderResult = col.render(row, row);
            } catch (e) {
              renderResult = null;
            }
          }

          if (renderResult !== null && renderResult !== undefined) {
            if (typeof renderResult === 'string' || typeof renderResult === 'number') {
              val = renderResult;
              hasCustomFormatter = true;
            } else {
              const extracted = extractTextFromReactElement(renderResult);
              if (extracted) {
                val = extracted;
                hasCustomFormatter = true;
              }
            }
          }

          if ((val === undefined || val === null || val === '') && col.format && typeof col.format === 'function') {
            let formatted = col.format(val, row);
            if (formatted === undefined) formatted = col.format(row, row);
            if (formatted !== null && formatted !== undefined) {
              val = formatted;
              hasCustomFormatter = true;
            }
          }

          if (keyName === 'updatedBy' || keyName === 'updated_by') {
            const hasUpdate = row['updatedAt'] || row['updated_at'] || row['updatedDate'] || row['updated_date'];
            if (!hasUpdate) {
              val = '-';
            }
          }

          if (!hasCustomFormatter) {
            // Format dates & objects for Excel readability
            const isUserField = keyNameLower.includes('user') || keyNameLower.includes('by') ||
              colHeaderLower.includes('user') || colHeaderLower.includes('by');

            if (isUserField) {
              if (typeof val === 'object' && val !== null) {
                val = val.username || val.userId || val.empCode || val.empId || val.id || '-';
              }
            } else if (typeof val === 'object' && val !== null) {
              val = val.name || val.label || val.id || val.typeName || val.code || '-';
            }

            if (keyNameLower === 'status' || keyNameLower === 'accountstatus' || keyNameLower === 'isactive') {
              val = (val === 1 || val === true || val === 'Active' || val === 'ACTIVE') ? 'Active' : (val === 0 || val === false || val === 'Inactive' || val === 'INACTIVE') ? 'Inactive' : val;
            } else if (typeof val === 'boolean') {
              val = val ? 'Yes' : 'No';
            }

            const isDateField = (keyNameLower.endsWith('date') || keyNameLower.includes('_date') || keyNameLower.includes('date_') || colHeaderLower.includes('date') || keyNameLower.endsWith('at') || keyNameLower.includes('_at')) &&
              !keyNameLower.includes('by') &&
              !keyNameLower.includes('status') &&
              !keyNameLower.includes('candidate');

            if (isDateField) {
              if (!val || val === '-' || val === 'null') {
                val = '-';
              } else if (typeof val === 'string' && (val.includes('AM') || val.includes('PM') || val.includes('am') || val.includes('pm') || /\d{2}\/\d{2}\/\d{4}/.test(val))) {
                // Already formatted string (with or without time): preserve exact string
                val = String(val).trim();
              } else {
                try {
                  const d = new Date(val);
                  if (!isNaN(d.getTime())) {
                    const isTimeCol = colHeaderLower.includes('time') || keyNameLower.includes('time') || keyNameLower.endsWith('at');
                    val = format(d, isTimeCol ? 'dd/MM/yyyy hh:mm a' : 'dd/MM/yyyy');
                  }
                } catch (e) {
                  // ignore, keep original val
                }
              }
            }
          }
        }

        // Final safety: strip any residual HTML tags from string values
        if (typeof val === 'string' && val.includes('<')) {
          val = val.replace(/<[^>]*>/g, '').trim();
        }

        const isPasswordOrActionCol = keyNameLower.includes('password') || keyNameLower.includes('action') || colHeaderLower.includes('password') || colHeaderLower.includes('action');
        if (!isPasswordOrActionCol && (!col.exportValue || typeof col.exportValue !== 'function' || col.exportValue(row) !== null)) {
          mappedRow[upperHeaderKey] = (val !== null && val !== undefined && val !== '') ? String(val) : '-';
        }
      });

      // Auto-append Audit Columns if they exist in the row data (SOP Standard)
      const auditFields = [
        { key: 'createdUser', fallback: 'createdBy', label: 'Created By' },
        { key: 'createdDate', fallback: 'createdAt', label: 'Created Date' },
        { key: 'updatedUser', fallback: 'updatedBy', label: 'Updated By' },
        { key: 'updatedDate', fallback: 'updatedAt', label: 'Updated Date' }
      ];

      // Auto-append Audit Columns only if no explicit column list was selected by user
      if (!colsList) {
        const hasUpdate = row['updatedAt'] || row['updated_at'] || row['updatedDate'] || row['updated_date'];
        const hasCreatedInMapped = Object.keys(mappedRow).some(k => k.toLowerCase().includes('created'));
        const hasUpdatedInMapped = Object.keys(mappedRow).some(k => k.toLowerCase().includes('update'));

        auditFields.forEach(field => {
          if (field.key.startsWith('created') && hasCreatedInMapped) return;
          if (field.key.startsWith('updated') && hasUpdatedInMapped) return;

          let val = row[field.key] ||
            (field.fallback ? row[field.fallback] : undefined) ||
            row[field.key.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)] ||
            (field.fallback ? row[field.fallback.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)] : undefined);
          if (field.key.startsWith('updated') && !hasUpdate) {
            val = null;
          }
          if (val) {
            if (field.key.startsWith('createdUser') || field.key.startsWith('updatedUser') ||
              field.key.startsWith('createdBy') || field.key.startsWith('updatedBy')) {
              if (typeof val === 'object' && val !== null) {
                val = val.username || val.userId || val.empCode || val.empId || val.id || '-';
              }
            } else if (typeof val === 'object' && val !== null) {
              val = val.name || val.label || val.id || '-';
            }
            if (field.key.endsWith('At') || field.key.endsWith('Date')) {
              try { val = format(new Date(val), 'dd/MM/yyyy hh:mm a'); } catch (e) { /* ignore */ }
            }
            mappedRow[field.label] = val;
          }
        });
      }

      return mappedRow;
    });
  };

  const getFormattedFilename = () => {
    const ts = format(new Date(), 'dd-MM-yyyy_HHmm');
    return `${filename}_${ts}`;
  };

  const uploadAndLogExport = async (formatType) => {
    const pageTitle = filename.replace(/_/g, ' ');
    let filePath = null;
    const activeCols = formatType === 'Excel' ? excelColumns : pdfCols;

    // 1. Prepare and upload the JSON metadata file to enable high-fidelity preview
    try {
      const exportMeta = {
        data: prepareData(activeCols),
        columns: (activeCols || []).map(c => ({ id: c.id, key: typeof c.key === 'string' ? c.key : c.id, header: c.header })),
        filename: filename,
        formatType: formatType,
        timestamp: new Date().toISOString()
      };

      const jsonBlob = new Blob([JSON.stringify(exportMeta)], { type: 'application/json' });
      const formData = new FormData();
      const metaFilename = `${getFormattedFilename()}_meta.json`;
      formData.append('file', jsonBlob, metaFilename);
      formData.append('module', 'TRACEABILITY');

      const uploadRes = await axios.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const rawResData = uploadRes.data;
      if (typeof rawResData === 'string') {
        filePath = rawResData;
      } else if (rawResData && typeof rawResData === 'object') {
        filePath = rawResData.filePath || rawResData.path || rawResData.fileUrl || rawResData.url || null;
      }
    } catch (err) {
      console.error('Failed to upload export metadata to server:', err);
    }

    // 2. Log to standard audit trail
    try {
      await axios.post('/api/audit-trail/log', {
        userId: user?.username || user?.email || user?.name || 'SYSTEM',
        pageName: `${pageTitle} Master`,
        actionType: 'EXPORT',
        tableName: filename,
        recordId: formatType,
        previousValue: JSON.stringify({
          recordCount: filteredData.length,
          filename: getFormattedFilename(),
          format: formatType
        }),
        currentValue: null,
        comments: `Exported ${filteredData.length} records of ${pageTitle} in ${formatType} format.`
      });
    } catch (err) {
      console.error('Failed to log export audit:', err);
    }

    // 3. Log to File Traceability Hub
    try {
      const computedPageName = pageTitle.toLowerCase().endsWith('master') ? pageTitle : `${pageTitle} Master`;
      await axios.post('/api/file-traceability', {
        pageId: pageId,
        pageCode: pageCode || 'M_DF_01',
        pageName: pageName || computedPageName,
        reportName: `${getFormattedFilename()}.${formatType === 'Excel' ? 'xlsx' : 'pdf'}`,
        filePath: filePath,
        createdUser: user?.username || user?.email || user?.name || 'SYSTEM'
      });
    } catch (err) {
      console.error('Failed to log file traceability:', err);
    }
  };

  const handleExportExcel = async () => {
    if (!filteredData || filteredData.length === 0 || isExporting) return;
    setIsExporting(true);
    try {
      await uploadAndLogExport('Excel');
      await exportToExcel(prepareData(excelColumns), getFormattedFilename(), {
        userName: user?.id || user?.username || user?.email || 'SYSTEM',
        companyName: companyProfile.companyName || 'AUTONOMA',
        shortName: companyProfile.shortName || 'Business Operating System',
        reportTitle: reportTitle
      });
    } catch (err) {
      console.error('Export Excel failed:', err);
    } finally {
      setIsExporting(false);
      handleClosePreview();
    }
  };

  React.useImperativeHandle(ref, () => ({
    generatePdfBlob: async () => {
      if (!filteredData || filteredData.length === 0) throw new Error("No data to export");
      const logoUrl = companyProfile.logoFileName ? getCompanyImageUrl(companyProfile.logoFileName) : '';
      const doc = await buildDigitalPdfDocument({
        theme,
        companyProfile,
        user,
        reportTitle,
        reportName,
        filename,
        documentDetails,
        signatures,
        stampText,
        showPdfHeader,
        pdfColumns,
        pdfRows,
        pdfColumnMetas,
        isLandscape,
        logoUrl
      });
      return doc.output('blob');
    }
  }));

  const handleExportPDF = async () => {
    if (!filteredData || filteredData.length === 0 || isExporting) return;
    setIsExporting(true);
    try {
      await uploadAndLogExport('PDF');
      const logoUrl = companyProfile.logoFileName ? getCompanyImageUrl(companyProfile.logoFileName) : '';
      await exportToPdf({
        theme,
        companyProfile,
        user,
        reportTitle,
        reportName,
        filename,
        documentDetails,
        signatures,
        stampText,
        showPdfHeader,
        pdfColumns,
        pdfRows,
        pdfColumnMetas,
        isLandscape,
        logoUrl
      }, getFormattedFilename());
    } catch (err) {
      console.error('Export PDF failed:', err);
    } finally {
      setIsExporting(false);
      handleClosePreview();
    }
  };

  const getColumnLetter = (n) => String.fromCharCode(65 + n);

  const previewColumns = useMemo(() => {
    const hasSNo = (excelColumns || []).some(c => {
      const k = String(c.id || c.key || c.header || c.label || '').toLowerCase().replace(/[^a-z]/g, '');
      return k === 'index' || k === 'sno' || k === 'slno';
    });
    const finalCols = hasSNo ? excelColumns : [{ header: 'SL.NO' }, ...excelColumns];
    const cols = finalCols.map((c, i) => {
      const colKey = String(c.header || c.label || c.id || '').toUpperCase();
      return {
        id: colKey,
        label: getColumnLetter(i),
        render: (row) => (row[colKey] !== undefined && row[colKey] !== null) ? String(row[colKey]) : '-'
      };
    });
    return [
      {
        id: 'excel_row_num',
        label: '',
        minWidth: 50,
        align: 'center',
        render: (row, idx) => (
          <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            bgcolor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRight: '1px solid #bbb', borderBottom: '1px solid #bbb', color: '#666',
            fontSize: '11px', fontWeight: 600, userSelect: 'none'
          }}>
            {idx + 1}
          </Box>
        )
      },
      ...cols
    ];
  }, [excelColumns]);

  const previewRows = useMemo(() => {
    const baseData = prepareData(excelColumns);
    const hasSNo = (excelColumns || []).some(c => {
      const k = String(c.id || c.key || c.header || c.label || '').toLowerCase().replace(/[^a-z]/g, '');
      return k === 'index' || k === 'sno' || k === 'slno';
    });
    const finalCols = hasSNo ? excelColumns : [{ header: 'SL.NO' }, ...excelColumns];

    // Excel column headers row
    const colHeadersRow = {};
    finalCols.forEach(col => {
      const upperHeader = String(col.header || col.label || col.id || '').toUpperCase();
      colHeadersRow[upperHeader] = upperHeader;
    });

    return [colHeadersRow, ...baseData];
  }, [filteredData, excelColumns]);

  const pdfColumns = useMemo(() => {
    const hasSNo = (pdfCols || []).some(c => {
      const k = String(c.id || c.key || c.header || c.label || '').toLowerCase().replace(/[^a-z]/g, '');
      return k === 'index' || k === 'sno' || k === 'slno';
    });
    const finalCols = hasSNo ? pdfCols : [{ header: 'SL.NO', minWidth: 60, align: 'center' }, ...pdfCols];
    return finalCols.map(c => ({
      id: String(c.header || c.label || c.id || '').toUpperCase(),
      label: String(c.header || c.label || c.id || '').toUpperCase(),
      minWidth: c.minWidth || 100,
      align: c.align || 'left'
    }));
  }, [pdfCols]);

  const pdfRows = useMemo(() => {
    return prepareData(pdfCols);
  }, [filteredData, pdfCols]);

  const previewDisplayRows = useMemo(() => {
    return pdfRows.slice(0, 50);
  }, [pdfRows]);

  // Dynamic PDF Column Layout Meta: calculates column weights based on actual character lengths of runtime cell values
  const pdfColumnLayout = useMemo(() => {
    if (!pdfColumns || pdfColumns.length === 0) return { metas: {}, requiredTableWidth: 0 };

    // 1. Measure max character length for each column across header + sampled rows
    const colMaxLens = {};
    pdfColumns.forEach(col => {
      const colKey = col.id || col.header;
      const headerText = String(col.label || col.header || '');
      let maxLen = headerText.length;

      // Sample up to top 50 rows for fast, robust character length analysis
      const sampleRows = pdfRows.slice(0, 50);
      sampleRows.forEach(row => {
        const val = row[colKey];
        if (val !== null && val !== undefined) {
          const valStr = String(val).trim();
          if (valStr.length > maxLen) {
            maxLen = valStr.length;
          }
        }
      });
      colMaxLens[colKey] = maxLen;
    });

    // 2. Calculate dynamic proportional weight for each column based on content length
    const colWeights = {};
    let totalWeight = 0;
    let requiredTableWidth = 0;

    pdfColumns.forEach(col => {
      const colKey = col.id || col.header;
      const len = colMaxLens[colKey] || 5;
      const headerText = String(col.label || col.header || '').toUpperCase();

      let weight = 50;
      if (colKey === 'S.No.' || headerText === 'S.NO.' || headerText === 'SL. NO.') {
        weight = 40;
      } else if (headerText.includes('AADHAR') || headerText.includes('ENROLLED') || headerText.includes('CODE')) {
        weight = 85;
      } else if (len <= 5) {
        weight = 45;
      } else if (len <= 12) {
        weight = 75;
      } else if (len <= 25) {
        weight = 110;
      } else if (len <= 60) {
        weight = 180;
      } else {
        weight = Math.min(len * 2.5, 320);
      }

      colWeights[colKey] = weight;
      totalWeight += weight;

      // Physical width estimation in mm derived directly from header length and displayed cell value extent
      const rawHeaderLen = String(col.label || col.header || '').length;
      const colPhysicalWidth = Math.max(rawHeaderLen * 1.55, Math.min(len, 35) * 1.45) + 3.0;
      requiredTableWidth += colPhysicalWidth;
    });

    // 3. Construct column metadata mapping with clean percentage widths
    const metas = {};
    pdfColumns.forEach(col => {
      const colKey = col.id || col.header;
      const len = colMaxLens[colKey] || 5;
      const headerText = String(col.label || col.header || '');
      const weight = colWeights[colKey] || 50;
      const upperHeader = headerText.toUpperCase();
      const isSNo = colKey === 'S.No.' || upperHeader === 'S.NO.' || upperHeader === 'SL. NO.';
      const minPct = isSNo ? 3.5 : (upperHeader.includes('AADHAR') || upperHeader.includes('ENROLLED') ? 7.5 : 3);
      const pct = Math.max(minPct, ((weight / totalWeight) * 100)).toFixed(1) + '%';

      // Clean up common verbose audit headers dynamically
      let cleanHeader = headerText;
      if (upperHeader === 'CREATEDUSER' || upperHeader === 'CREATED BY' || upperHeader === 'CREATED_USER') cleanHeader = 'Created By';
      else if (upperHeader === 'CREATEDDATE' || upperHeader === 'CREATED DATE' || upperHeader === 'CREATED_DATE') cleanHeader = 'Created Date';
      else if (upperHeader === 'UPDATEDUSER' || upperHeader === 'UPDATED BY' || upperHeader === 'UPDATED_USER') cleanHeader = 'Updated By';
      else if (upperHeader === 'UPDATEDDATE' || upperHeader === 'UPDATED DATE' || upperHeader === 'UPDATED_DATE') cleanHeader = 'Updated Date';
      else if (upperHeader === 'ATTACHMENT REQUIRED' || upperHeader === 'ATTACHMENT REQ') cleanHeader = 'Att. Req';
      else if (isSNo) cleanHeader = 'S.No.';

      const isShort = len <= 12 || isSNo || upperHeader.includes('STATUS') || upperHeader === 'LEVEL' || upperHeader === 'ROUND';
      const isCodeOrNum = upperHeader.includes('AADHAR') || upperHeader.includes('ENROLLED') || upperHeader.includes('CODE') || upperHeader.includes('NO');
      const isDate = upperHeader.includes('DATE') || (len >= 8 && len <= 22 && /\d{2}\/\d{2}\/\d{4}/.test(headerText));

      metas[colKey] = {
        cleanHeader: cleanHeader,
        widthPct: pct,
        align: isShort ? 'center' : 'left',
        nowrapHeader: isShort || isDate || isCodeOrNum || cleanHeader.length <= 10,
        nowrapCell: isShort || isDate || isCodeOrNum
      };
    });

    return { metas, requiredTableWidth };
  }, [pdfColumns, pdfRows]);

  const pdfColumnMetas = pdfColumnLayout.metas;

  // Standard paper & layout dimensions (reusing existing 210x297mm A4 and 10mm margins)
  const A4_DIMENSIONS = {
    portraitWidth: 210,
    landscapeWidth: 297,
    margin: 10
  };

  const recommendedOrientation = useMemo(() => {
    if (!pdfColumns || pdfColumns.length === 0) return 'portrait';
    const usablePortraitWidth = A4_DIMENSIONS.portraitWidth - (2 * A4_DIMENSIONS.margin); // 190mm
    const threshold = usablePortraitWidth * 0.90; // 171mm threshold for readable, uncompressed layout
    return pdfColumnLayout.requiredTableWidth <= threshold ? 'portrait' : 'landscape';
  }, [pdfColumns, pdfColumnLayout.requiredTableWidth]);

  const resolvedOrientation = useMemo(() => {
    if (orientationMode === 'portrait') return 'portrait';
    if (orientationMode === 'landscape') return 'landscape';
    return recommendedOrientation;
  }, [orientationMode, recommendedOrientation]);

  const isLandscape = (resolvedOrientation === 'landscape');

  const isManyColsPortrait = !isLandscape && pdfColumns.length >= 10;
  const padding = isManyColsPortrait ? '3px 2px' : (pdfColumns.length > 8 ? '4px 3px' : (pdfColumns.length > 5 ? '6px 4px' : '10px 8px'));
  const fontSizeHeader = isManyColsPortrait ? '6.5px' : (pdfColumns.length > 8 ? '8.5px' : (pdfColumns.length > 5 ? '10px' : '11.5px'));
  const fontSizeCell = isManyColsPortrait ? '6px' : (pdfColumns.length > 8 ? '7.5px' : (pdfColumns.length > 5 ? '9px' : '10.5px'));
  const paperPadding = isManyColsPortrait ? '4mm' : (pdfColumns.length > 8 ? '8mm' : (pdfColumns.length > 5 ? '12mm' : '20mm'));
  const paperWidth = isLandscape ? '297mm' : '210mm';
  const paperMinHeight = isLandscape ? '210mm' : '297mm';

  const handleAutoFit = React.useCallback(() => {
    if (!viewportRef.current) return;
    const viewportWidth = viewportRef.current.clientWidth;
    const paddingVal = 64; // horizontal workspace margins
    const availableWidth = viewportWidth - paddingVal;

    // A4 width in pixels at standard 96 DPI: 210mm = 794px, 297mm = 1123px
    const targetWidth = isLandscape ? 1123 : 794;

    if (availableWidth < targetWidth) {
      const fitScale = Number((availableWidth / targetWidth).toFixed(2));
      setZoom(Math.max(0.3, fitScale));
    } else {
      setZoom(1.0);
    }
  }, [isLandscape]);

  useEffect(() => {
    if (previewOpen && activeTab === 1) {
      const timer = setTimeout(() => {
        handleAutoFit();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [previewOpen, activeTab, isLandscape, sidebarWidth, handleAutoFit]);

  useEffect(() => {
    if (!viewportRef.current) return;
    const viewportWidth = viewportRef.current.clientWidth;
    const targetWidth = isLandscape ? 1123 : 794;
    const scaledWidth = targetWidth * zoom;
    setIsOverflowing(scaledWidth > (viewportWidth - 32));
  }, [zoom, isLandscape, previewOpen, sidebarWidth]);

  const displayTooltip = useMemo(() => {
    const base = tooltip !== undefined ? tooltip : `Preview & Export ${filteredData.length} records`;
    if (disabled || filteredData.length === 0 || loading) return base;
    return `${base} (Space + E)`;
  }, [tooltip, filteredData.length, disabled, loading]);

  // Handle keyboard shortcut (Space + S) when Export Designer dialog is open
  useEffect(() => {
    if (!previewOpen) return;

    let spacePressed = false;
    let spaceTimeout = null;

    const handleKeyDown = (e) => {
      const tag = e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        spacePressed = true;
        clearTimeout(spaceTimeout);
        spaceTimeout = setTimeout(() => {
          spacePressed = false;
        }, 1200);
        return;
      }

      if (spacePressed && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        spacePressed = false;
        clearTimeout(spaceTimeout);

        if (activeTab === 0) {
          handleExportExcel();
        } else {
          handleExportPDF();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        // preserve spacePressed window
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      clearTimeout(spaceTimeout);
    };
  }, [previewOpen, activeTab, handleExportExcel, handleExportPDF]);

  return (
    <>
      <Tooltip title={displayTooltip} arrow>
        <span>
          {iconOnly ? (
            <IconButton
              id="bos-export-button"
              data-shortcut="export"
              color={color}
              size={size}
              disabled={disabled || (!fetchExportData && activeData.length === 0) || loading || isFetchingExport}
              onClick={handleOpenPreview}
              sx={sx}
            >
              {(loading || isFetchingExport) ? <CircularProgress size={16} /> : <IconFileDescription size={20} />}
            </IconButton>
          ) : (
            <Button
              id="bos-export-button"
              data-shortcut="export"
              variant={variant}
              color={color}
              size={size}
              disabled={disabled || (!fetchExportData && activeData.length === 0) || loading || isFetchingExport}
              onClick={handleOpenPreview}
              startIcon={(loading || isFetchingExport) ? <CircularProgress size={16} /> : buttonIcon}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                px: 2,
                ...sx
              }}
            >
              {buttonLabel}
            </Button>
          )}
        </span>
      </Tooltip>

      <Dialog
        id="bos-pdf-print-dialog"
        open={previewOpen}
        onClose={handleClosePreview}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : '16px', overflow: 'hidden', height: isMobile ? '100%' : '90vh' } }}
      >
        <DialogTitle className="no-print" sx={{ 
          p: { xs: 1.5, sm: 2 }, 
          bgcolor: 'grey.50', 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: { xs: 1.25, sm: 2 },
          borderBottom: '1px solid', 
          borderColor: 'divider' 
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ width: { xs: '100%', sm: 'auto' }, flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
              <IconFileExport size={24} color="#2196f3" style={{ flexShrink: 0 }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
                  Export Designer
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {filename.replace(/_/g, ' ')} ({filteredData.length} records) • {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Stack>
            {isMobile && (
              <IconButton onClick={handleClosePreview} size="small" sx={{ flexShrink: 0 }}>
                <IconX size={20} />
              </IconButton>
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'space-between', sm: 'flex-end' }} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <ToggleButtonGroup
              value={activeTab}
              exclusive
              onChange={(e, val) => { if (val !== null) setActiveTab(val); }}
              size="small"
              sx={{
                flex: { xs: 1, sm: 'none' },
                bgcolor: 'background.paper',
                borderRadius: '8px',
                p: '2px',
                border: '1px solid',
                borderColor: 'divider',
                '& .MuiToggleButton-root': {
                  flex: { xs: 1, sm: 'none' },
                  px: 1.5,
                  py: 0.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  border: 'none',
                  borderRadius: '6px !important',
                  gap: 0.75,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }
                }
              }}
            >
              <ToggleButton value={0}>
                <IconFileSpreadsheet size={18} /> Excel
              </ToggleButton>
              <ToggleButton value={1}>
                <IconFileTypePdf size={18} /> PDF
              </ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title={settingsCollapsed ? "Show Settings" : "Hide Settings"}>
              <IconButton
                onClick={() => setSettingsCollapsed(prev => !prev)}
                color={!settingsCollapsed ? 'primary' : 'default'}
                size="small"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '8px',
                  p: 0.75,
                  bgcolor: !settingsCollapsed ? 'primary.light' : 'background.paper'
                }}
              >
                <IconSettings size={18} />
              </IconButton>
            </Tooltip>

            {!isMobile && (
              <IconButton onClick={handleClosePreview} size="small" sx={{ ml: 0.5 }}>
                <IconX size={20} />
              </IconButton>
            )}
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: 'grey.100', display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%', overflow: 'hidden' }}>
          {/* LEFT SIDEBAR: EXPORT SETTINGS */}
          <Box className="no-print" sx={{
            width: isMobile ? '100%' : (settingsCollapsed ? 0 : sidebarWidth),
            height: isMobile ? (settingsCollapsed ? 0 : 'auto') : '100%',
            maxHeight: isMobile ? '45vh' : 'none',
            borderRight: (!isMobile && !settingsCollapsed) ? '1px solid' : 'none',
            borderBottom: (isMobile && !settingsCollapsed) ? '1px solid' : 'none',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowX: 'hidden',
            overflowY: 'auto',
            p: settingsCollapsed ? 0 : (isMobile ? 1.75 : 2.5),
            position: 'relative',
            transition: isResizing ? 'none' : 'all 0.25s ease',
          }}>
            {/* Resize Handle */}
            {!settingsCollapsed && !isMobile && (
              <Box
                onMouseDown={startResizing}
                sx={{
                  width: '6px',
                  cursor: 'col-resize',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 10,
                  bgcolor: isResizing ? 'primary.main' : 'transparent',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                  transition: 'background-color 0.2s',
                }}
              />
            )}

            {!settingsCollapsed && (
              <Box sx={{ width: isMobile ? '100%' : sidebarWidth - 40, minWidth: isMobile ? 0 : 230 }}>
                {activeTab === 0 ? (
                  // Excel settings
                  <Stack spacing={3}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          Excel Settings
                        </Typography>
                        <IconButton size="small" onClick={() => setSettingsCollapsed(true)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', p: 0.5 }}>
                          <IconChevronLeft size={16} />
                        </IconButton>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Select columns to include in the spreadsheet.
                      </Typography>
                    </Box>

                    <Divider />

                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Columns</Typography>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: '11px', fontWeight: 600 }} onClick={() => setSelectedExcelColKeys(allAvailableCols.filter(isExportable).map(c => c.key))}>
                            All
                          </Button>
                          <Typography variant="caption" color="text.disabled">|</Typography>
                          <Button size="small" variant="text" color="secondary" sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: '11px', fontWeight: 600 }} onClick={() => setSelectedExcelColKeys([])}>
                            None
                          </Button>
                        </Stack>
                      </Stack>

                      <FormGroup sx={{ gap: 0.5 }}>
                        {allAvailableCols.map(col => (
                          <FormControlLabel
                            key={col.key}
                            control={
                              <Checkbox
                                size="small"
                                checked={selectedExcelColKeys.includes(col.key)}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setSelectedExcelColKeys(prev => isChecked ? (prev.includes(col.key) ? prev : [...prev, col.key]) : prev.filter(k => k !== col.key));
                                }}
                              />
                            }
                            label={
                              <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary', fontWeight: selectedExcelColKeys.includes(col.key) ? 600 : 400 }}>
                                {String(col.header || '').toUpperCase()}
                              </Typography>
                            }
                            sx={{ ml: -0.5 }}
                          />
                        ))}
                      </FormGroup>
                    </Box>
                  </Stack>
                ) : (
                  // PDF settings
                  <Stack spacing={3}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          PDF Settings
                        </Typography>
                        <IconButton size="small" onClick={() => setSettingsCollapsed(true)} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '6px', p: 0.5 }}>
                          <IconChevronLeft size={16} />
                        </IconButton>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Configure document format and layout.
                      </Typography>
                    </Box>

                    <Divider />

                    {/* Page Layout Settings */}
                    <Box sx={{ mb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Orientation
                        </Typography>
                        {orientationMode === 'auto' && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 700,
                              color: 'primary.main',
                              bgcolor: 'action.hover',
                              px: 1,
                              py: 0.25,
                              borderRadius: '4px',
                              fontSize: '11px'
                            }}
                          >
                            Auto: {isLandscape ? 'Landscape' : 'Portrait'}
                          </Typography>
                        )}
                      </Stack>
                      <ToggleButtonGroup
                        value={orientationMode}
                        exclusive
                        onChange={(e, val) => { if (val) setOrientationMode(val); }}
                        size="small"
                        fullWidth
                        sx={{
                          '& .MuiToggleButton-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 0.6,
                            fontSize: '12px'
                          }
                        }}
                      >
                        <ToggleButton value="auto">
                          Auto
                        </ToggleButton>
                        <ToggleButton value="portrait">
                          Portrait
                        </ToggleButton>
                        <ToggleButton value="landscape">
                          Landscape
                        </ToggleButton>
                      </ToggleButtonGroup>
                      {orientationMode !== 'auto' && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.75, fontSize: '11px' }}>
                          Manual override ({orientationMode === 'portrait' ? 'Portrait' : 'Landscape'})
                        </Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Paper Size
                      </Typography>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.25,
                        bgcolor: 'grey.50',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '13px' }}>
                          A4 Standard
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                          210 x 297 mm
                        </Typography>
                      </Box>
                    </Box>

                    <Divider />

                    {/* Show Header Toggle */}
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Document Header
                      </Typography>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={showPdfHeader}
                            onChange={(e) => setShowPdfHeader(e.target.checked)}
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary' }}>
                            Show AUTONOMA header
                          </Typography>
                        }
                        sx={{ ml: -0.5 }}
                      />
                    </Box>

                    <Divider />

                    {/* Columns selection */}
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Columns</Typography>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: '11px', fontWeight: 600 }} onClick={() => setSelectedPdfColKeys(allAvailableCols.filter(isExportable).map(c => c.key))}>
                            All
                          </Button>
                          <Typography variant="caption" color="text.disabled">|</Typography>
                          <Button size="small" variant="text" color="secondary" sx={{ p: 0, minWidth: 0, textTransform: 'none', fontSize: '11px', fontWeight: 600 }} onClick={() => setSelectedPdfColKeys([])}>
                            None
                          </Button>
                        </Stack>
                      </Stack>

                      <FormGroup sx={{ gap: 0.5 }}>
                        {allAvailableCols.map(col => (
                          <FormControlLabel
                            key={col.key}
                            control={
                              <Checkbox
                                size="small"
                                checked={selectedPdfColKeys.includes(col.key)}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setSelectedPdfColKeys(prev => isChecked ? (prev.includes(col.key) ? prev : [...prev, col.key]) : prev.filter(k => k !== col.key));
                                }}
                              />
                            }
                            label={
                              <Typography variant="body2" sx={{ fontSize: '13px', color: 'text.primary', fontWeight: selectedPdfColKeys.includes(col.key) ? 600 : 400 }}>
                                {String(col.header || '').toUpperCase()}
                              </Typography>
                            }
                            sx={{ ml: -0.5 }}
                          />
                        ))}
                      </FormGroup>
                    </Box>
                  </Stack>
                )}
              </Box>
            )}
          </Box>

          {/* RIGHT VIEWPORT: PREVIEW */}
          <Box ref={viewportRef} className="print-viewport" sx={{
            flexGrow: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            p: activeTab === 0 ? 2 : 2,
            height: '100%',
            width: '100%',
            position: 'relative',
            bgcolor: '#f4f6f8'
          }}>

            {activeTab === 0 ? (
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                {/* EXCEL TOOLBAR SIMULATION */}
                <Paper sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: '4px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 1, borderRight: '1px solid #eee' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>A1</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                    <IconFunction size={16} color="#aaa" />
                    <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                    <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '13px' }}>
                      {previewRows[0] ? previewRows[0][previewColumns[0]?.id] : ''}
                    </Typography>
                  </Box>
                </Paper>

                <Paper sx={{
                  flexGrow: 1,
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: '#bbb',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  width: '100%',
                  height: 'calc(100% - 60px)'
                }}>
                  {excelColumns.length === 0 ? (
                    <Box sx={{ display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', bgcolor: 'background.paper' }}>
                      <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No columns selected. Use the settings panel on the left to select columns to display.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ flexGrow: 1, display: 'flex', width: '100%', height: '100%' }}>
                      <Box sx={{ flexGrow: 1, width: '100%', height: '100%' }}>
                        <BOSDataTable
                          id={pageCode ? `bos-export-preview-${pageCode}` : 'bos-export-preview-table'}
                          columns={previewColumns}
                          rows={previewRows}
                          page={0}
                          size={previewRows.length || 10000}
                          totalCount={previewRows.length}
                          showActions={false}
                          disableSearchFilter={true}
                          disableTableConfig={true}
                          hideFooter={true}
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            '& .MuiTableContainer-root': {
                              maxHeight: '100%',
                              overflow: 'auto',
                              flexGrow: 1
                            },
                            '& th': {
                              bgcolor: '#f8f9fa !important',
                              color: '#444 !important',
                              fontWeight: '600 !important',
                              textAlign: 'center',
                              borderRight: '1px solid #bbb',
                              borderBottom: '2px solid #bbb',
                              height: 40,
                              fontSize: '11px',
                              minWidth: '160px !important'
                            },
                            '& th:nth-of-type(1)': {
                              minWidth: '50px !important',
                              width: '50px !important',
                              maxWidth: '50px !important'
                            },
                            '& td': {
                              borderRight: '1px solid #ccc',
                              borderBottom: '1px solid #ccc',
                              fontSize: '13px',
                              height: 40,
                              position: 'relative',
                              minWidth: '160px !important'
                            },
                            '& td:nth-of-type(1)': {
                              minWidth: '50px !important',
                              width: '50px !important',
                              maxWidth: '50px !important',
                              padding: '0 !important',
                              bgcolor: '#f8f9fa !important'
                            },
                            // SPREADSHEET TABLE HEADER ROW (Row 1)
                            '& tr:nth-of-type(1) td': {
                              bgcolor: '#f1f3f4 !important',
                              fontWeight: '700 !important',
                              color: '#000 !important',
                              textAlign: 'center !important',
                              justifyContent: 'center !important',
                              fontSize: '12px',
                              borderBottom: '2px solid #bbb !important'
                            },
                            // SPREADSHEET TABLE HEADER ROW Column 0 override (keep row numbers column gray)
                            '& tr:nth-of-type(1) td:nth-of-type(1)': {
                              bgcolor: '#f8f9fa !important',
                              fontWeight: '600 !important',
                              color: '#666 !important',
                              textAlign: 'center'
                            },
                            // SELECTED CELL HIGHLIGHT (Row 2, Column 2 - wait, since column 0 is row number, the first data cell is Column 1)
                            '& tr:nth-of-type(2) td:nth-of-type(2)': {
                              outline: '2px solid #217346',
                              outlineOffset: '-2px',
                              bgcolor: '#e7f1ec'
                            },
                            border: 'none',
                            boxShadow: 'none'
                          }}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* EXCEL BOTTOM BAR (Sheet Tabs) */}
                  <Box sx={{ bgcolor: '#f8f9fa', borderTop: '1px solid #bbb', p: 0.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Stack direction="row" spacing={0.5} sx={{ px: 1 }}>
                      <Box sx={{ bgcolor: 'background.paper', px: 2, py: 0.5, border: '1px solid #bbb', borderBottom: 'none', borderRadius: '4px 4px 0 0', fontSize: '11px', fontWeight: 700, color: '#217346' }}>
                        Sheet1
                      </Box>
                      <IconButton size="small"><IconPlus size={14} /></IconButton>
                    </Stack>
                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    <Typography variant="caption" sx={{ fontSize: '10px', color: 'grey.600' }}>Ready</Typography>
                  </Box>
                </Paper>
              </Box>
            ) : (
              <>
                {/* ZOOM TOOLBAR */}
                <Paper className="no-print" sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: '6px 12px',
                  mb: 3,
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  bgcolor: 'background.paper',
                  flexShrink: 0
                }}>
                  <IconButton size="small" onClick={() => setZoom(prev => Math.max(0.3, Number((prev - 0.1).toFixed(1))))}>
                    <IconMinus size={16} />
                  </IconButton>
                  <Typography sx={{ minWidth: '45px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>
                    {Math.round(zoom * 100)}%
                  </Typography>
                  <IconButton size="small" onClick={() => setZoom(prev => Math.min(2.0, Number((prev + 0.1).toFixed(1))))}>
                    <IconPlus size={16} />
                  </IconButton>
                  <Divider orientation="vertical" flexItem />
                  <Button size="small" variant="outlined" sx={{ textTransform: 'none', py: 0.2, px: 1, fontSize: '11px', minWidth: 'auto' }} onClick={handleAutoFit}>
                    Fit Page
                  </Button>
                </Paper>

                {/* SCALED PREVIEW WRAPPER */}
                <Box sx={{
                  width: isMobile ? '100%' : `calc(${paperWidth} * ${zoom})`,
                  height: isMobile ? 'auto' : `calc(${paperMinHeight} * ${zoom})`,
                  transition: 'all 0.15s ease-out',
                  display: 'flex',
                  justifyContent: isMobile ? 'center' : (isOverflowing ? 'flex-start' : 'center'),
                  alignItems: 'flex-start',
                  overflow: 'visible',
                  mb: 4,
                  pl: isMobile ? 0 : (isOverflowing ? 2 : 0) // add padding when left-aligned so margins look nice
                }}>
                  <Box sx={{
                    transform: isMobile ? 'none' : `scale(${zoom})`,
                    transformOrigin: isMobile ? 'none' : (isOverflowing ? 'top left' : 'top center'),
                    width: isMobile ? '100%' : paperWidth,
                    height: isMobile ? 'auto' : paperMinHeight,
                    flexShrink: 0
                  }}>
                    <style>{`
                      @media print {
                        #root {
                          display: none !important;
                        }
                        body {
                          margin: 0 !important;
                          padding: 0 !important;
                          overflow: visible !important;
                          background: white !important;
                        }
                        .no-print {
                          display: none !important;
                        }
                        .print-only {
                          display: table !important;
                        }
                        .MuiDialog-root {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 100% !important;
                          height: auto !important;
                          overflow: visible !important;
                        }
                        .MuiDialog-container {
                          display: block !important;
                          width: 100% !important;
                          height: auto !important;
                          overflow: visible !important;
                        }
                        .MuiDialog-paper {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 100% !important;
                          height: auto !important;
                          max-height: none !important;
                          box-shadow: none !important;
                          border: none !important;
                          border-radius: 0 !important;
                          margin: 0 !important;
                          padding: 0 !important;
                          overflow: visible !important;
                        }
                        .MuiDialogContent-root {
                          display: block !important;
                          overflow: visible !important;
                          padding: 0 !important;
                          margin: 0 !important;
                          background: white !important;
                        }
                        .MuiDialogContent-root > div:not(.no-print) {
                          padding: 0 !important;
                          margin: 0 !important;
                          display: block !important;
                          overflow: visible !important;
                          width: 100% !important;
                          height: auto !important;
                        }
                        .print-viewport, .print-viewport > div {
                          display: block !important;
                          width: 100% !important;
                          height: auto !important;
                          padding: 0 !important;
                          margin: 0 !important;
                          overflow: visible !important;
                        }
                        .bos-pdf-page-card {
                          width: 100% !important;
                          max-width: none !important;
                          min-height: 0 !important;
                          box-shadow: none !important;
                          border: none !important;
                          margin: 0 !important;
                          padding: 0 !important;
                          page-break-inside: avoid !important;
                        }
                        table {
                          width: 100% !important;
                          table-layout: auto !important;
                        }
                        tr {
                          page-break-inside: avoid !important;
                        }
                        @page {
                          size: ${isLandscape ? 'landscape' : 'portrait'};
                          margin: 10mm;
                        }
                      }
                      @media screen {
                        .print-only {
                          display: none !important;
                        }
                      }
                    `}</style>
                    <Paper
                      className="bos-pdf-page-card"
                      sx={{
                        width: isMobile ? '100%' : paperWidth,
                        minWidth: isMobile ? '100%' : paperWidth,
                        maxWidth: isMobile ? '100%' : paperWidth,
                        height: isMobile ? 'auto' : paperMinHeight,
                        minHeight: isMobile ? 'auto' : paperMinHeight,
                        maxHeight: isMobile ? 'auto' : paperMinHeight,
                        flexShrink: 0,
                        flexGrow: 0,
                        p: isMobile ? 2 : paperPadding,
                        bgcolor: 'background.paper',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
                        fontFamily: theme.typography.fontFamily,
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box',
                        position: 'relative',
                        zIndex: 1
                      }}
                    >
                      {companyProfile.logoFileName && (
                        <Box sx={{
                          position: 'absolute', top: '30%', left: '20%', right: '20%', bottom: '30%',
                          backgroundImage: `url('${getCompanyImageUrl(companyProfile.logoFileName)}')`,
                          backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
                          opacity: 0.05, zIndex: -1, pointerEvents: 'none'
                        }} />
                      )}
                      {showPdfHeader && (
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2, borderBottom: '3px solid', borderColor: 'primary.main', pb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {companyProfile.logoFileName && (
                              <img src={getCompanyImageUrl(companyProfile.logoFileName)} style={{ maxHeight: '60px', maxWidth: '150px', objectFit: 'contain' }} alt="Logo" />
                            )}
                            <Box>
                              <Typography variant="h1" sx={{ color: 'primary.main', fontWeight: 900, fontSize: '2.5rem', letterSpacing: -1.5, m: 0, lineHeight: 1.1 }}>
                                {companyProfile.companyName}
                              </Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 2, m: '2px 0 0 0' }}>
                                {companyProfile.shortName}
                              </Typography>
                              {[companyProfile.address, companyProfile.city, companyProfile.state, companyProfile.pincode].filter(Boolean).join(', ') && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5, lineHeight: 1.2 }}>
                                  {[companyProfile.address, companyProfile.city, companyProfile.state, companyProfile.pincode].filter(Boolean).join(', ')}
                                </Typography>
                              )}
                              {(companyProfile.gstIn || companyProfile.gstNo) && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.2, lineHeight: 1.2 }}>
                                  GSTIN: {companyProfile.gstIn || companyProfile.gstNo}
                                </Typography>
                              )}
                              {(() => {
                                const contactItems = [];
                                if (companyProfile.mobileNo || companyProfile.phoneNo) contactItems.push(`Mob: ${companyProfile.mobileNo || companyProfile.phoneNo}`);
                                if (companyProfile.emailId) contactItems.push(`Email: ${companyProfile.emailId}`);
                                if (companyProfile.website) contactItems.push(`Web: ${companyProfile.website}`);
                                return contactItems.length > 0 ? (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.2, lineHeight: 1.2 }}>
                                    {contactItems.join(' | ')}
                                  </Typography>
                                ) : null;
                              })()}
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Generated By: {user?.name || 'System User'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontWeight: 700 }}>
                              Time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </Typography>
                          </Box>
                        </Stack>
                      )}

                      {reportName && (
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                          <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, textTransform: 'uppercase', color: 'text.primary', letterSpacing: 1, textDecoration: 'underline', textUnderlineOffset: 4 }}>
                            {reportName}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ mb: 4, p: 2, bgcolor: 'grey.50', borderRadius: '4px', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', mb: documentDetails?.length ? 2 : 0, fontSize: '1.1rem' }}>
                          {reportTitle || filename.replace(/_/g, ' ')}
                        </Typography>
                        {documentDetails && documentDetails.length > 0 && (
                          <Stack direction="row" flexWrap="wrap" gap={2}>
                            {documentDetails.map((detail, idx) => (
                              <Box key={idx} sx={{ flex: detail.label.toLowerCase() === 'remarks' ? '1 1 100%' : 1, minWidth: '150px' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>
                                  {detail.label}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.2 }}>
                                  {detail.value || '-'}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        )}
                      </Box>

                      {pdfColumns.length === 0 ? (
                        <Box sx={{ py: 8, textAlign: 'center', flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No columns selected. Use the settings panel on the left to select columns to display.
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ width: '100%', overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', tableLayout: (isManyColsPortrait || pdfColumns.length > 12) ? 'fixed' : 'auto' }}>
                            <thead>
                              <tr style={{ backgroundColor: theme.palette.primary.main, color: 'white' }}>
                                {pdfColumns.map(col => {
                                  const colKey = col.id || col.header;
                                  const meta = pdfColumnMetas[colKey] || { cleanHeader: col.label || col.header, widthPct: 'auto', align: 'left' };
                                  return (
                                    <th key={col.id} style={{
                                      padding: padding,
                                      textAlign: meta.align,
                                      fontSize: fontSizeHeader,
                                      fontWeight: '700',
                                      textTransform: 'uppercase',
                                      width: meta.widthPct,
                                      minWidth: (isManyColsPortrait || pdfColumns.length > 12) ? undefined : meta.widthPct,
                                      whiteSpace: meta.nowrapHeader ? 'nowrap' : 'normal',
                                      wordBreak: 'break-word',
                                      overflowWrap: 'break-word',
                                      letterSpacing: '0.2px'
                                    }}>
                                      {meta.cleanHeader}
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {previewDisplayRows.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                  {pdfColumns.map(col => {
                                    const colKey = col.id || col.header;
                                    const meta = pdfColumnMetas[colKey] || { cleanHeader: col.label || col.header, widthPct: 'auto', align: 'left' };
                                    const colHeaderKey = String(col.id || col.header || col.label || '').toUpperCase();
                                    const val = row[colHeaderKey] !== undefined ? row[colHeaderKey] : (row[col.header] !== undefined ? row[col.header] : '-');
                                    return (
                                      <td key={col.id} style={{
                                        padding: padding,
                                        fontSize: fontSizeCell,
                                        color: '#334155',
                                        textAlign: meta.align,
                                        width: meta.widthPct,
                                        minWidth: (isManyColsPortrait || pdfColumns.length > 12) ? undefined : meta.widthPct,
                                        whiteSpace: meta.nowrapCell ? 'nowrap' : 'normal',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word'
                                      }}>
                                        {val}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {pdfRows.length > 50 && (
                            <Box sx={{ py: 1.2, px: 2, bgcolor: 'grey.50', borderRadius: '8px', mb: 2, textAlign: 'center', border: '1px dashed', borderColor: 'divider' }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                Showing live preview of first 50 of {pdfRows.length} records. All {pdfRows.length} records will be included in the downloaded file.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {signatures && signatures.length > 0 ? (
                        <Box sx={{ mt: 'auto', pt: 4, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', pageBreakInside: 'avoid', position: 'relative' }}>
                          {signatures.map((sig, idx) => (
                            <Box key={idx} sx={{ textAlign: 'center', width: 150, position: 'relative', zIndex: 2 }}>
                              <Typography sx={{ m: 0, fontSize: '12px', fontWeight: 'bold', color: '#333' }}>{sig.label}</Typography>
                              <Box sx={{ mt: 6, borderBottom: '1px solid #333', pb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>{sig.name || ''}</Typography>
                              </Box>
                            </Box>
                          ))}
                          {stampText && (
                            <Box sx={{
                              position: 'absolute', left: '50%', bottom: '10px', transform: 'translateX(-50%) rotate(-15deg)',
                              opacity: 0.15, zIndex: 1, pointerEvents: 'none', border: '4px solid', borderRadius: '8px', px: 2, py: 0.5,
                              color: stampText.toLowerCase() === 'approved' ? '#166534' : stampText.toLowerCase() === 'rejected' ? '#991b1b' : '#444',
                              borderColor: stampText.toLowerCase() === 'approved' ? '#166534' : stampText.toLowerCase() === 'rejected' ? '#991b1b' : '#444'
                            }}>
                              <Typography sx={{ m: 0, fontSize: '42px', fontWeight: 900, letterSpacing: '6px', textTransform: 'uppercase', lineHeight: 1 }}>
                                {stampText}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ) : <Box sx={{ mt: 'auto' }} />}

                      <Box sx={{ pt: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', position: 'relative', bottom: 0 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          Confidential Report | © {new Date().getFullYear()} {companyProfile.companyName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          Page 1 of 1
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions className="no-print" sx={{ p: 2, bgcolor: 'grey.50', flexDirection: isMobile ? 'column' : 'row', gap: 1.5, alignItems: 'stretch' }}>
          <Button variant="outlined" color="secondary" onClick={handleClosePreview} startIcon={<IconX size={18} />} fullWidth={isMobile}>
            Cancel
          </Button>
          {!isMobile && <Box sx={{ flexGrow: 1 }} />}
          <Tooltip title="Download (Space + S)" arrow>
            <Button
              id="bos-export-download-btn"
              data-shortcut="download"
              data-shortcut-key="save"
              variant="contained"
              color="primary"
              disabled={isExporting}
              onClick={activeTab === 0 ? handleExportExcel : handleExportPDF}
              fullWidth={isMobile}
              startIcon={isExporting ? <CircularProgress size={16} color="inherit" /> : <IconDownload size={18} />}
              sx={{
                bgcolor: activeTab === 0 ? '#107c41' : theme.palette.primary.main,
                '&:hover': { bgcolor: activeTab === 0 ? '#0a5c31' : theme.palette.primary.dark },
                fontWeight: 700,
                px: 3,
                borderRadius: '8px'
              }}
            >
              {isExporting ? 'Downloading...' : 'Download'}
            </Button>
          </Tooltip>
        </DialogActions>
      </Dialog>
    </>
  );
});

BOSExportButton.propTypes = {
  data: PropTypes.array.isRequired,
  filename: PropTypes.string,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired
    })
  ),
  screenColumns: PropTypes.arrayOf(
    PropTypes.shape({
      header: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired
    })
  ),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  variant: PropTypes.string,
  color: PropTypes.string,
  size: PropTypes.string,
  pageId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  pageName: PropTypes.string,
  pageCode: PropTypes.string,
  sx: PropTypes.object
};



export default BOSExportButton;
