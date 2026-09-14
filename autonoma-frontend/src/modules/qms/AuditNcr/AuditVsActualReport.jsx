import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Button,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  Select,
  MenuItem,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import {
  IconReportAnalytics,
  IconFileTypePdf,
  IconListDetails,
  IconLayoutGrid,
  IconBuilding,
  IconCategory,
  IconCopy,
  IconCheck
} from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar, BOSTableFooter } from 'ui-component/bos';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSFilters from 'hooks/useBOSFilters';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';
import { API_PATHS } from 'utils/api-constants';
import html2canvas from 'html2canvas';
import AuditObservationPDFDialog from '../AuditObservation/AuditObservationPDFDialog';
import AuditVsActualPDFDialog from './AuditVsActualPDFDialog';

// Robust Date Parser with Map Caching
const parseDateObjCache = new Map();
const parseDateObj = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  if (parseDateObjCache.has(dateVal)) return parseDateObjCache.get(dateVal);

  let res = null;
  if (typeof dateVal === 'string') {
    const s = dateVal.trim();
    if (s) {
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
        const parts = s.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        res = isNaN(d.getTime()) ? null : d;
      } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
        const parts = s.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        res = isNaN(d.getTime()) ? null : d;
      }
    }
  }

  if (!res) {
    const d = new Date(dateVal);
    res = isNaN(d.getTime()) ? null : d;
  }
  parseDateObjCache.set(dateVal, res);
  return res;
};

// Formatting Helpers with Caching
const dateStrCache = new Map();
const formatDateStr = (dateVal) => {
  if (!dateVal) return '-';
  if (dateStrCache.has(dateVal)) return dateStrCache.get(dateVal);
  const d = parseDateObj(dateVal);
  if (!d) {
    const res = String(dateVal);
    dateStrCache.set(dateVal, res);
    return res;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const res = `${day}/${month}/${year}`;
  dateStrCache.set(dateVal, res);
  return res;
};

const shortDateStrCache = new Map();
const formatShortDateStr = (dateVal) => {
  if (!dateVal) return '';
  if (shortDateStrCache.has(dateVal)) return shortDateStrCache.get(dateVal);
  const d = parseDateObj(dateVal);
  if (!d) {
    const res = String(dateVal);
    shortDateStrCache.set(dateVal, res);
    return res;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const res = `${day}/${month}/${year}`;
  shortDateStrCache.set(dateVal, res);
  return res;
};

const isoDateCache = new Map();
const formatIsoDate = (dInput) => {
  if (!dInput) return '';
  if (isoDateCache.has(dInput)) return isoDateCache.get(dInput);
  const d = parseDateObj(dInput);
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const res = `${yyyy}-${mm}-${dd}`;
  isoDateCache.set(dInput, res);
  return res;
};

const consolidateCache = new Map();
export const consolidateMonthlyItems = (items) => {
  if (!items || items.length === 0) return [];
  if (consolidateCache.has(items)) return consolidateCache.get(items);

  const validItems = items.filter((i) => i && i.scheduleDate);
  if (validItems.length === 0) return [];

  // Sort items chronologically by scheduleDate
  const series = [...validItems].sort((a, b) => {
    const dA = parseDateObj(a.scheduleDate);
    const dB = parseDateObj(b.scheduleDate);
    return (dA ? dA.getTime() : 0) - (dB ? dB.getTime() : 0);
  });

  // Deduplicate entries that have the exact same date string
  const uniqueDateItemsMap = new Map();
  series.forEach((item) => {
    const dStr = item.scheduleDateStr || formatShortDateStr(item.scheduleDate);
    if (!uniqueDateItemsMap.has(dStr)) {
      uniqueDateItemsMap.set(dStr, item);
    }
  });

  const uniqueDateSeries = Array.from(uniqueDateItemsMap.values());

  // ORIG: MIN(SCHEDULE_NO), MIN(SCHEDULE_DATE)
  const initialItem = uniqueDateSeries[0];
  // MAX: MAX(SCHEDULE_NO), MAX(SCHEDULE_DATE)
  const latestItem = uniqueDateSeries[uniqueDateSeries.length - 1];

  // Observation d: ON (d.AUDIT_SCHEDULE_NO = b.MAX_SCHEDULE_NO OR d.AUDIT_SCHEDULE_NO = b.ORIG_SCH_NO)
  const obsItem = series.find((i) => i.rawObservation || i.observationDate) || null;

  const initialDateStr = initialItem.scheduleDateStr || formatShortDateStr(initialItem.scheduleDate);
  const latestDateStr = latestItem.scheduleDateStr || formatShortDateStr(latestItem.scheduleDate);

  const isRescheduled = uniqueDateSeries.length > 1 && initialDateStr !== latestDateStr;
  const rescheduleCount = isRescheduled ? (uniqueDateSeries.length - 1) : 0;
  const pathDates = uniqueDateSeries.map((i) => i.scheduleDateStr || formatShortDateStr(i.scheduleDate));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let executionStatus = 'PENDING';
  if (obsItem && (obsItem.observationDate || obsItem.rawObservation)) {
    executionStatus = 'COMPLETED';
  } else {
    const st = String(latestItem.rawSchedule?.status || '').toUpperCase();
    if (st === 'CLOSED' || st === 'COMPLETED') {
      executionStatus = 'COMPLETED';
    } else {
      const d = parseDateObj(latestItem.scheduleDate);
      if (d && d < today) {
        executionStatus = 'OVERDUE';
      } else {
        executionStatus = 'PENDING';
      }
    }
  }

  let origDeviationDays = 0;
  let latestDeviationDays = 0;

  if (obsItem && obsItem.observationDate) {
    const obsDateObj = parseDateObj(obsItem.observationDate);
    const initialDateObj = parseDateObj(initialItem.scheduleDate);
    const latestDateObj = parseDateObj(latestItem.scheduleDate);

    if (obsDateObj && initialDateObj) {
      const diff1 = obsDateObj.getTime() - initialDateObj.getTime();
      origDeviationDays = Math.round(diff1 / (1000 * 60 * 60 * 24));
    }
    if (obsDateObj && latestDateObj) {
      const diff2 = obsDateObj.getTime() - latestDateObj.getTime();
      latestDeviationDays = Math.round(diff2 / (1000 * 60 * 60 * 24));
    }
  } else if (obsItem && typeof obsItem.deviationDays === 'number') {
    origDeviationDays = obsItem.deviationDays;
    latestDeviationDays = obsItem.deviationDays;
  }

  const initialScheduleNo = initialItem.scheduleNo || initialItem.rawSchedule?.scheduleNo || initialItem.rawSchedule?.auditScheduleNo || '-';
  const latestScheduleNo = latestItem.scheduleNo || latestItem.rawSchedule?.scheduleNo || '-';

  const consolidated = {
    ...latestItem,
    scheduleNo: latestScheduleNo,
    latestScheduleNo,
    initialScheduleNo,
    initialScheduleDate: initialItem.scheduleDate,
    initialScheduleDateStr: initialDateStr,
    latestScheduleDate: latestItem.scheduleDate,
    latestScheduleDateStr: latestDateStr,
    isRescheduled,
    rescheduleCount,
    pathDates,
    observationNo: obsItem ? obsItem.observationNo : '-',
    observationDate: obsItem ? obsItem.observationDate : null,
    observationDateStr: obsItem ? obsItem.observationDateStr : '-',
    deviationDays: origDeviationDays,
    origDeviationDays,
    latestDeviationDays,
    executionStatus,
    rawObservation: obsItem ? obsItem.rawObservation : null
  };
  const resArr = [consolidated];
  consolidateCache.set(items, resArr);
  return resArr;
};

// Department Colors
const getDeptTheme = (name) => {
  const n = String(name || '').toUpperCase();
  if (n.includes('PLAN')) return { primary: '#059669', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' };
  if (n.includes('STORE')) return { primary: '#d97706', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' };
  if (n.includes('HR') || n.includes('ADMIN')) return { primary: '#7c3aed', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' };
  if (n.includes('PROD')) return { primary: '#0284c7', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' };
  if (n.includes('DESIGN') || n.includes('DEV')) return { primary: '#e11d48', gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' };
  return { primary: '#2563eb', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' };
};

// Audit Type Colors
const getAuditTypeTheme = (name) => {
  const n = String(name || '').toUpperCase();
  if (n.includes('SCREEN') || n.includes('ERP')) return { primary: '#0284c7', gradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)' };
  if (n.includes('STOCK') || n.includes('QTY')) return { primary: '#d97706', gradient: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' };
  if (n.includes('ISO') || n.includes('EMS') || n.includes('PLAN')) return { primary: '#059669', gradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)' };
  if (n.includes('5S') || n.includes('HR')) return { primary: '#7c3aed', gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' };
  return { primary: '#4f46e5', gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)' };
};

// ─────────────────────────────────────────────────────────────────────────────
// FULL-DATA OFF-SCREEN MATRIX CAPTURE
// Builds a plain HTML table from ALL raw data rows + ALL month columns,
// renders it off-screen, copies HTML + PNG to system clipboard.
// ─────────────────────────────────────────────────────────────────────────────
export const copyFullMatrixToClipboard = async ({ rows, monthColumns, isDeptTab, reportTitle, onDone }) => {
  if (typeof window.ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
    if (onDone) onDone(false);
    return;
  }

  const HEADER_BLUE_BG = '#0284c7';
  const ACTIVE_GREEN_BG = '#16a34a';
  const PAST_YELLOW_BG = '#ca8a04';

  const PLAN_BLUE_BG = '#e0f2fe';
  const ACTUAL_BLUE_BG = '#bae6fd';
  const PLAN_GREEN_BG = '#86efac';
  const ACTUAL_GREEN_BG = '#4ade80';
  const PLAN_YELLOW_BG = '#fef9c3';
  const ACTUAL_YELLOW_BG = '#fef08a';

  const CELL_GREEN_PLAN = '#f0fdf4';
  const CELL_GREEN_ACTUAL = '#dcfce7';
  const CELL_YELLOW_PLAN = '#fffbeb';
  const CELL_YELLOW_ACTUAL = '#fef3c7';
  const CELL_BLUE_PLAN = '#f0f9ff';
  const CELL_BLUE_ACTUAL = '#e0f2fe';

  const BORDER = '1px solid #cbd5e1';
  const BORDER2 = '2px solid #64748b';

  const cs = (extra = '') => `border:${BORDER};padding:6px 9px;white-space:nowrap;word-break:keep-all;vertical-align:middle;${extra}`;
  const fmtDate = (s) => {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // Off-screen wrapper
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-99999px;top:0;background:#ffffff;padding:16px;font-family:Inter,Roboto,Arial,sans-serif;z-index:-1;width:max-content;';

  // Title
  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-size:14px;font-weight:800;color:#0f172a;margin-bottom:10px;padding:8px 14px;background:#f1f5f9;border-radius:6px;border-left:5px solid #0284c7;';
  titleEl.textContent = reportTitle;
  wrap.appendChild(titleEl);

  // Explicit table width calculation for Word/HTML paste
  const tableWidth = 38 + 240 + (monthColumns.length * 190);

  // Table
  const table = document.createElement('table');
  table.setAttribute('width', String(tableWidth));
  table.style.cssText = `border-collapse:collapse;width:${tableWidth}px;min-width:${tableWidth}px;font-size:11px;font-family:inherit;background:#ffffff;table-layout:fixed;`;

  const mkTh = (txt, rs, cs2, style, widthPx) => {
    const th = document.createElement('th');
    th.innerHTML = txt;
    th.rowSpan = rs || 1;
    th.colSpan = cs2 || 1;
    if (widthPx) th.setAttribute('width', String(widthPx));
    th.style.cssText = cs(`${widthPx ? `width:${widthPx}px;min-width:${widthPx}px;` : ''}${style || ''}`);
    return th;
  };

  const thead = document.createElement('thead');
  const hr1 = document.createElement('tr');
  hr1.appendChild(mkTh('#', 2, 1, `background:${HEADER_BLUE_BG};color:#ffffff;font-weight:800;text-align:center;border:${BORDER2};`, 38));
  hr1.appendChild(mkTh(isDeptTab ? 'Department &amp; Audit Type' : 'Audit Type &amp; Department', 2, 1, `background:${HEADER_BLUE_BG};color:#ffffff;font-weight:800;text-align:left;border:${BORDER2};`, 240));

  monthColumns.forEach((m) => {
    const bg = m.isCurrentMonth ? ACTIVE_GREEN_BG : m.isPastMonth ? PAST_YELLOW_BG : HEADER_BLUE_BG;
    const col = '#ffffff';
    const labelText = m.isCurrentMonth ? `${m.label} (ACTIVE)` : m.label;
    hr1.appendChild(mkTh(labelText, 1, 2, `background:${bg};color:${col};font-weight:900;text-align:center;border:${BORDER2};font-size:12px;`, 190));
  });
  thead.appendChild(hr1);

  const hr2 = document.createElement('tr');
  monthColumns.forEach((m) => {
    const pBg = m.isCurrentMonth ? PLAN_GREEN_BG : m.isPastMonth ? PLAN_YELLOW_BG : PLAN_BLUE_BG;
    const aBg = m.isCurrentMonth ? ACTUAL_GREEN_BG : m.isPastMonth ? ACTUAL_YELLOW_BG : ACTUAL_BLUE_BG;
    const pCol = m.isCurrentMonth ? '#14532d' : m.isPastMonth ? '#854d0e' : '#0369a1';
    const aCol = m.isCurrentMonth ? '#052e16' : m.isPastMonth ? '#713f12' : '#0284c7';
    hr2.appendChild(mkTh('Plan', 1, 1, `background:${pBg};color:${pCol};font-weight:800;text-align:center;`, 90));
    hr2.appendChild(mkTh('Actual', 1, 1, `background:${aBg};color:${aCol};font-weight:800;text-align:center;border-right:${BORDER2};`, 100));
  });
  thead.appendChild(hr2);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach((row, rIdx) => {
    const tr = document.createElement('tr');
    const rbg = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
    const mkTd = (html, style, widthPx) => {
      const td = document.createElement('td');
      if (widthPx) td.setAttribute('width', String(widthPx));
      td.innerHTML = html;
      td.style.cssText = cs(`background:${rbg};${widthPx ? `width:${widthPx}px;min-width:${widthPx}px;` : ''}${style || ''}`);
      return td;
    };

    tr.appendChild(mkTd(`${rIdx + 1}`, 'text-align:center;font-weight:700;color:#64748b;', 38));

    const freqBadge = `<span style="font-size:9px;font-weight:800;background:#f1f5f9;color:#475569;padding:1px 4px;border-radius:3px;margin-left:4px;display:inline-block;white-space:nowrap;">${row.frequency || 'MONTHLY'}</span>`;
    const nameHtml = isDeptTab
      ? `<span style="font-weight:800;color:#0369a1;white-space:nowrap;">${row.departmentName || '-'}</span><br/><span style="font-size:10px;color:#334155;white-space:nowrap;">&#8627; ${row.auditType || '-'}</span> ${freqBadge}`
      : `<span style="font-weight:800;color:#334155;white-space:nowrap;">${row.auditType || '-'}</span><br/><span style="font-size:10px;color:#0369a1;white-space:nowrap;">&#127970; ${row.departmentName || '-'}</span> ${freqBadge}`;
    tr.appendChild(mkTd(nameHtml, 'text-align:left;border-right:' + BORDER2 + ';', 240));

    monthColumns.forEach((m) => {
      const rawItems = row.monthsData[m.monthKey] || [];
      const items = consolidateMonthlyItems(rawItems);

      const pCellBg = m.isCurrentMonth ? CELL_GREEN_PLAN : m.isPastMonth ? CELL_YELLOW_PLAN : CELL_BLUE_PLAN;
      const aCellBg = m.isCurrentMonth ? CELL_GREEN_ACTUAL : m.isPastMonth ? CELL_YELLOW_ACTUAL : CELL_BLUE_ACTUAL;
      const planTextColor = m.isCurrentMonth ? '#14532d' : m.isPastMonth ? '#854d0e' : '#0369a1';

      const planHtml = items.length === 0
        ? '<span style="color:#94a3b8;">-</span>'
        : items.map(i => {
          const origNo = i.initialScheduleNo || i.scheduleNo || '';
          const origStr = i.isRescheduled ? `<br/><span style="font-size:9px;color:#d97706;font-weight:700;white-space:nowrap;">(OG: ${origNo} · ${fmtDate(i.initialScheduleDate)} · ${i.rescheduleCount}x 🔄)</span>` : '';
          return `<div style="font-weight:700;color:${planTextColor};white-space:nowrap;">${fmtDate(i.scheduleDate) || i.scheduleDateStr || '-'}${origStr}</div>`;
        }).join('');

      const actHtml = items.length === 0
        ? '<span style="color:#94a3b8;">-</span>'
        : items.map(i => {
          if (i.observationDate) {
            const ok = (i.deviationDays ?? 0) <= 0;
            const bg2 = ok ? '#dcfce7' : '#fee2e2';
            const c2 = ok ? '#15803d' : '#b91c1c';
            const bd = ok ? '#86efac' : '#fca5a5';
            const dl = !ok ? ` <span style="font-size:9px;font-weight:900;color:${c2};">+${i.deviationDays}d</span>` : '';
            return `<div style="display:inline-block;background:${bg2};color:${c2};border:1px solid ${bd};border-radius:4px;padding:2px 6px;font-weight:800;white-space:nowrap;">${fmtDate(i.observationDate) || i.observationDateStr || '-'}${dl}</div>`;
          }
          const st = (i.executionStatus || '').toUpperCase();
          const sc = st.includes('PENDING') ? '#b45309' : st.includes('OVERDUE') ? '#b91c1c' : '#64748b';
          const bg3 = st.includes('PENDING') ? '#fffbeb' : st.includes('OVERDUE') ? '#fef2f2' : '#f1f5f9';
          return `<div style="font-size:10px;font-weight:800;color:${sc};background:${bg3};padding:2px 6px;border-radius:4px;display:inline-block;white-space:nowrap;">${i.executionStatus || '-'}</div>`;
        }).join('');

      const planTd = mkTd(planHtml, `background:${pCellBg};text-align:center;`, 90);
      tr.appendChild(planTd);

      const actTd = mkTd(actHtml, `background:${aCellBg};text-align:center;border-right:${BORDER2};`, 100);
      tr.appendChild(actTd);
    });

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);

  const footEl = document.createElement('div');
  footEl.style.cssText = 'margin-top:8px;font-size:11px;color:#64748b;font-weight:600;';
  footEl.textContent = `Total Records: ${rows.length}`;
  wrap.appendChild(footEl);
  document.body.appendChild(wrap);

  try {
    const htmlString = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>${reportTitle}</title>
        <style>
          table { width: ${tableWidth}px !important; min-width: ${tableWidth}px !important; table-layout: fixed !important; border-collapse: collapse; }
          th, td { white-space: nowrap !important; word-break: keep-all !important; }
        </style>
      </head>
      <body>${wrap.innerHTML}</body>
      </html>
    `;
    const plainText = rows.map((r, i) => `${i + 1}. ${r.auditType} (${r.departmentName})`).join('\n');

    let canvasBlob = null;
    try {
      const canvas = await html2canvas(wrap, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: false, allowTaint: true, imageTimeout: 0 });
      canvasBlob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    } catch (e) {
      console.warn('Canvas fallback skipped:', e);
    }

    const clipboardItems = {};
    if (canvasBlob) {
      // Primary: Copy crisp PNG image so pasting into MS Word / PowerPoint / Teams pastes as a clean unclipped image snapshot!
      clipboardItems['image/png'] = canvasBlob;
    } else {
      // Fallback: Copy HTML & Plain text
      clipboardItems['text/html'] = new Blob([htmlString], { type: 'text/html' });
      clipboardItems['text/plain'] = new Blob([plainText], { type: 'text/plain' });
    }

    await navigator.clipboard.write([new ClipboardItem(clipboardItems)]);
    if (onDone) onDone(true);
  } catch (err) {
    console.error('Full matrix copy error:', err);
    if (onDone) onDone(false);
  } finally {
    document.body.removeChild(wrap);
  }
};

export default function AuditVsActualReport() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_VS_ACTUAL_REPORT || 'QM1280');
  const bosFilters = useBOSFilters(perms);

    // Redux Global Filters & Query from Top Header Bar
    const globalQuery = useSelector((state) => state.search?.query) || '';
    const globalFiltersRaw = useSelector((state) => state.search?.filters);
    const globalFilters = useMemo(() => globalFiltersRaw || {}, [globalFiltersRaw]);

    // Primary Tabs: 'auditType' (Audit Type Wise) | 'department' (Department Wise)
    const [primaryTab, setPrimaryTab] = useState('auditType');

    // Sub-View: 'summary' (Monthly Matrix) | 'detailed' (Detailed Table)
    const [subView, setSubView] = useState('summary');

    // Clipboard Copy State & Toast
    const [copying, setCopying] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copySnackbar, setCopySnackbar] = useState({ open: false, title: '' });
    const summaryPaperRef = useRef(null);

    // PDF Export Dialog State
    const [pdfOpen, setPdfOpen] = useState(false);

    // Default Financial Year calculation (Apr to Mar)
    const defaultFinYear = useMemo(() => {
      const now = new Date();
      const yr = now.getFullYear();
      const m = now.getMonth(); // 0-indexed: 0=Jan, 3=Apr
      return m >= 3 ? yr : yr - 1;
    }, []);

    // Selected Financial Year for Summary Matrix (Derived from Global Header Filter Bar)
    const selectedYear = useMemo(() => {
      if (globalFilters.year && globalFilters.year !== 'All') {
        const parsed = parseInt(globalFilters.year, 10);
        if (!isNaN(parsed) && parsed > 2000 && parsed < 2100) {
          return parsed;
        }
      }
      return defaultFinYear;
    }, [globalFilters.year, defaultFinYear]);

    // Pagination State for Summary Matrix View
    // Summary view: no pagination — all rows shown

    // Pagination State for Detailed Table View
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);

    // Data & Loading
    const [schedules, setSchedules] = useState([]);
    const [observations, setObservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
    const [selectedPdfRow, setSelectedPdfRow] = useState(null);

    // Lookups for Global Filter Bar
    const [departmentsList, setDepartmentsList] = useState([]);
    const [auditTypeOptions, setAuditTypeOptions] = useState([{ value: 'All', label: 'All Audit Types' }]);

    // References for Auto-focusing Active Month Column
    const tableContainerRef = useRef(null);
    const activeHeaderCellRef = useRef(null);

    // Auto-scroll matrix table so the Active Month column is in focus on load/filter change
    useEffect(() => {
      if (subView === 'summary' && !loading) {
        const timer = setTimeout(() => {
          if (activeHeaderCellRef.current && tableContainerRef.current) {
            const container = tableContainerRef.current;
            const targetCell = activeHeaderCellRef.current;
            // Offset for frozen columns (# 48px + Name 220px + Feq 90px = 358px)
            const frozenColumnsWidth = 358;
            const cellLeft = targetCell.offsetLeft;
            const scrollTarget = Math.max(0, cellLeft - frozenColumnsWidth - 16);

            container.scrollTo({
              left: scrollTarget,
              behavior: 'smooth'
            });
          }
        }, 350);

        return () => clearTimeout(timer);
      }
    }, [subView, loading, selectedYear, primaryTab]);

    // Fetch Lookups
    useEffect(() => {
      let isMounted = true;
      Promise.all([
        axios.get('/api/master/hr/departments'),
        axios.get(API_PATHS.QMS.AUDIT_TYPE)
      ])
        .then(([deptRes, typeRes]) => {
          if (!isMounted) return;
          setDepartmentsList(deptRes.data || []);
          if (typeRes.data && Array.isArray(typeRes.data)) {
            const opts = [{ value: 'All', label: 'All Audit Types' }];
            typeRes.data.forEach((item) => {
              const val = typeof item === 'object' ? (item.auditType || item.name) : item;
              if (val && !opts.some((o) => o.value.toUpperCase() === String(val).toUpperCase())) {
                opts.push({ value: String(val), label: String(val) });
              }
            });
            setAuditTypeOptions(opts);
          }
        })
        .catch((err) => console.error('Failed to fetch lookups:', err));

      return () => {
        isMounted = false;
      };
    }, []);

    // Register Config for Top Global Header Filter Bar
    useEffect(() => {
      if (perms.loading || !bosFilters.myTeamLoaded) return;

      const curNow = new Date();
      const curFinYr = curNow.getMonth() >= 3 ? curNow.getFullYear() : curNow.getFullYear() - 1;
      const yearOpts = [
        { value: String(curFinYr), label: `FY ${curFinYr}-${String(curFinYr + 1).slice(-2)}` },
        { value: String(curFinYr - 1), label: `FY ${curFinYr - 1}-${String(curFinYr).slice(-2)}` },
        { value: String(curFinYr - 2), label: `FY ${curFinYr - 2}-${String(curFinYr - 1).slice(-2)}` },
        { value: String(curFinYr + 1), label: `FY ${curFinYr + 1}-${String(curFinYr + 2).slice(-2)}` }
      ];

      const deptOpts = [
        { value: 'All', label: 'All Departments' },
        ...departmentsList.map((d) => ({
          value: String(d.departmentName || d.name || d.id),
          label: String(d.departmentName || d.name || d.id)
        }))
      ];

      const filterConfigList = [
        {
          id: 'taskScope',
          label: 'Scope',
          type: 'select',
          isStarred: true,
          defaultValue: perms.additional1 ? 'Company' : 'Mine',
          options: bosFilters.getFilterOptions()
        }
      ];

      if (subView === 'summary') {
        filterConfigList.push({
          id: 'year',
          label: 'Financial Year',
          type: 'select',
          isStarred: true,
          defaultValue: String(curFinYr),
          options: yearOpts
        });
      } else {
        filterConfigList.push({
          id: 'scheduleDate',
          label: 'Date',
          type: 'dateRange',
          isStarred: true
        });
      }

      filterConfigList.push(
        {
          id: 'department',
          label: 'Department',
          type: 'select',
          isStarred: true,
          defaultValue: 'All',
          options: deptOpts
        },
        {
          id: 'auditType',
          label: 'Audit Type',
          type: 'select',
          isStarred: true,
          defaultValue: 'All',
          options: auditTypeOptions
        },
        {
          id: 'executionStatus',
          label: 'Status',
          type: 'select',
          isStarred: true,
          defaultValue: 'All',
          options: [
            { value: 'All', label: 'All Execution Status' },
            { value: 'COMPLETED', label: 'Conducted / Completed' },
            { value: 'PENDING', label: 'Pending / Scheduled' },
            { value: 'OVERDUE', label: 'Overdue' }
          ]
        }
      );

      dispatch(setFilterConfig(filterConfigList));

      return () => {
        dispatch(setFilterConfig(null));
      };
    }, [perms.loading, perms.additional1, bosFilters.myTeamLoaded, departmentsList.length, auditTypeOptions.length, subView, dispatch]);

    // Fetch Schedules & Observations
    const fetchData = useCallback(async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      try {
        const [schedRes, obsRes] = await Promise.all([
          axios.get(API_PATHS.QMS.AUDIT_SCHEDULE, { params: { taskScope: 'Company' } }),
          axios.get(API_PATHS.QMS.AUDIT_OBSERVATION, { params: { taskScope: 'Company' } })
        ]);

        const schedList = Array.isArray(schedRes.data)
          ? schedRes.data
          : schedRes.data?.content || [];
        const obsList = Array.isArray(obsRes.data)
          ? obsRes.data
          : obsRes.data?.content || [];

        setSchedules(schedList);
        setObservations(obsList);
      } catch (err) {
        console.error('Failed to fetch audit schedules & observations:', err);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    useRealtimeRefresh(fetchData, 'AuditSchedule');

    // Combine Schedules (Plan) vs Observations (Actual)
    const combinedRows = useMemo(() => {
      // Index observations by schedule number
      const obsMap = {};
      observations.forEach((obs) => {
        const schedKey = String(obs.auditScheduleNo || '').trim().toUpperCase();
        if (schedKey) {
          obsMap[schedKey] = obs;
        }
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return schedules.map((sched, idx) => {
        const schedNo = sched.scheduleNo || '-';
        const schedKey = String(schedNo).trim().toUpperCase();
        const obs = obsMap[schedKey];

        const effectiveScheduleDate = sched.auditDate || sched.scheduleDate;
        const schedDateObj = effectiveScheduleDate ? new Date(effectiveScheduleDate) : null;
        const obsDateObj = obs && obs.observationDate ? new Date(obs.observationDate) : null;

        // Status determination
        let executionStatus = 'PENDING';
        let deviationDays = 0;

        if (obs) {
          executionStatus = 'COMPLETED';
          if (schedDateObj && obsDateObj) {
            const diffTime = obsDateObj.getTime() - schedDateObj.getTime();
            deviationDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          }
        } else if (sched.status === 'CLOSED' || sched.status === 'COMPLETED') {
          executionStatus = 'COMPLETED';
        } else if (schedDateObj && schedDateObj < today) {
          executionStatus = 'OVERDUE';
        }

        // Frequency
        let frequency = sched.frequency || (sched.repeatEveryUnit ? `${sched.repeatEveryValue || 1} ${sched.repeatEveryUnit}` : 'MONTHLY');
        if (frequency === 'NONE' || !frequency) {
          frequency = 'MONTHLY';
        }

        const auditType =
          sched.auditType ||
          sched.auditTypeEntity?.auditType ||
          sched.auditTypeName ||
          (obs ? (obs.auditType || obs.auditTypeEntity?.auditType) : null) ||
          '-';

        const departmentName =
          sched.departmentName ||
          sched.department ||
          sched.departmentEntity?.departmentName ||
          sched.deptName ||
          (obs ? (obs.departmentName || obs.department || obs.departmentEntity?.departmentName) : null) ||
          '-';

        const auditor =
          sched.auditor ||
          sched.auditorEntity?.employeeName ||
          (sched.auditorEntity ? `${sched.auditorEntity.firstName || ''} ${sched.auditorEntity.lastName || ''}`.trim() : null) ||
          (obs ? obs.auditor : null) ||
          '-';

        const auditee =
          sched.auditee ||
          sched.auditeeEntity?.employeeName ||
          (sched.auditeeEntity ? `${sched.auditeeEntity.firstName || ''} ${sched.auditeeEntity.lastName || ''}`.trim() : null) ||
          (obs ? obs.auditee : null) ||
          '-';

        return {
          id: sched.id || idx + 1,
          auditType: String(auditType).trim(),
          scheduleNo: schedNo,
          scheduleDate: effectiveScheduleDate,
          scheduleDateStr: formatDateStr(effectiveScheduleDate),
          observationNo: obs ? obs.observationNo : '-',
          observationDate: obs ? obs.observationDate : null,
          observationDateStr: obs ? formatDateStr(obs.observationDate) : '-',
          departmentName: String(departmentName).trim(),
          frequency,
          auditor,
          auditee,
          auditScore: obs ? obs.auditScore : null,
          complianceCount: obs ? obs.complianceCount : 0,
          ncrCount: obs ? obs.ncrCount : 0,
          ofiCount: obs ? obs.ofiCount : 0,
          obsStatus: obs ? obs.status : null,
          executionStatus,
          deviationDays,
          rawObservation: obs || null,
          rawSchedule: sched
        };
      });
    }, [schedules, observations]);

    // Apply Global Redux Filters
    const filteredRows = useMemo(() => {
      return combinedRows.filter((r) => {
        // 1. Text Query Filter
        if (globalQuery && globalQuery.trim() !== '') {
          const q = globalQuery.toLowerCase().trim();
          const matches =
            String(r.auditType || '').toLowerCase().includes(q) ||
            String(r.scheduleNo || '').toLowerCase().includes(q) ||
            String(r.observationNo || '').toLowerCase().includes(q) ||
            String(r.departmentName || '').toLowerCase().includes(q) ||
            String(r.auditor || '').toLowerCase().includes(q) ||
            String(r.auditee || '').toLowerCase().includes(q);
          if (!matches) return false;
        }

        // 2. Department Dropdown
        if (globalFilters.department && globalFilters.department !== 'All') {
          const dFilter = String(globalFilters.department).toLowerCase();
          const rowDept = String(r.departmentName || '').toLowerCase();
          if (!rowDept.includes(dFilter)) return false;
        }

        // 3. Audit Type Dropdown
        if (globalFilters.auditType && globalFilters.auditType !== 'All') {
          const tFilter = String(globalFilters.auditType).toLowerCase();
          const rowType = String(r.auditType || '').toLowerCase();
          if (!rowType.includes(tFilter)) return false;
        }

        // 4. Execution Status Dropdown
        if (globalFilters.executionStatus && globalFilters.executionStatus !== 'All') {
          if (r.executionStatus !== globalFilters.executionStatus) {
            return false;
          }
        }

        // 5. Date Range & Consider Date Filter (APPLIES TO DETAILED VIEW ONLY)
        if (subView === 'detailed') {
          const considerVal =
            globalFilters.scheduleDateConsider === true ||
            globalFilters.scheduleDateConsider === 'Yes' ||
            globalFilters.considerDate === 'Yes' ||
            globalFilters.considerDate === 'true';

          if (considerVal) {
            if (!r.scheduleDate) return false;
            const rowDateIso = formatIsoDate(r.scheduleDate);
            const fromDate = globalFilters.scheduleDateStart || globalFilters.startDate;
            const toDate = globalFilters.scheduleDateEnd || globalFilters.endDate;

            if (fromDate && rowDateIso < fromDate) return false;
            if (toDate && rowDateIso > toDate) return false;
          }
        }

        return true;
      });
    }, [combinedRows, globalQuery, globalFilters, subView]);

    // Extract available Financial Years from schedules & observations
    const availableYears = useMemo(() => {
      const curNow = new Date();
      const curFinYr = curNow.getMonth() >= 3 ? curNow.getFullYear() : curNow.getFullYear() - 1;
      const yearsSet = new Set([curFinYr]);
      combinedRows.forEach((r) => {
        if (r.scheduleDate) {
          const d = parseDateObj(r.scheduleDate);
          if (d) {
            const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
            if (y > 2000 && y < 2100) yearsSet.add(y);
          }
        }
        if (r.observationDate) {
          const d = parseDateObj(r.observationDate);
          if (d) {
            const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
            if (y > 2000 && y < 2100) yearsSet.add(y);
          }
        }
      });
      return Array.from(yearsSet).sort((a, b) => b - a);
    }, [combinedRows]);

    // Active Month Key based on business rule: if today's date < 20th, active audit month is previous month
    const activeMonthKey = useMemo(() => {
      const now = new Date();
      const day = now.getDate();
      let yyyy = now.getFullYear();
      let month = now.getMonth(); // 0-indexed

      if (day < 20) {
        month -= 1;
        if (month < 0) {
          month = 11;
          yyyy -= 1;
        }
      }

      const mm = String(month + 1).padStart(2, '0');
      return `${yyyy}-${mm}`;
    }, []);

    // Months List for Summary Grid Header (Financial Year Apr to Mar, e.g. Apr-26 to Mar-27)
    const monthColumns = useMemo(() => {
      const finMonths = [
        { name: 'Apr', monthNum: 4, yearOffset: 0 },
        { name: 'May', monthNum: 5, yearOffset: 0 },
        { name: 'Jun', monthNum: 6, yearOffset: 0 },
        { name: 'Jul', monthNum: 7, yearOffset: 0 },
        { name: 'Aug', monthNum: 8, yearOffset: 0 },
        { name: 'Sep', monthNum: 9, yearOffset: 0 },
        { name: 'Oct', monthNum: 10, yearOffset: 0 },
        { name: 'Nov', monthNum: 11, yearOffset: 0 },
        { name: 'Dec', monthNum: 12, yearOffset: 0 },
        { name: 'Jan', monthNum: 1, yearOffset: 1 },
        { name: 'Feb', monthNum: 2, yearOffset: 1 },
        { name: 'Mar', monthNum: 3, yearOffset: 1 }
      ];

      return finMonths.map((m, idx) => {
        const actualYear = selectedYear + m.yearOffset;
        const monthKey = `${actualYear}-${String(m.monthNum).padStart(2, '0')}`;
        const shortYr = String(actualYear).slice(-2);
        const isCurrentMonth = monthKey === activeMonthKey;
        const isPastMonth = monthKey < activeMonthKey;
        const isFutureMonth = monthKey > activeMonthKey;

        return {
          monthIndex: idx,
          monthKey,
          label: `${m.name}-${shortYr}`,
          name: m.name,
          year: actualYear,
          isCurrentMonth,
          isPastMonth,
          isFutureMonth
        };
      });
    }, [selectedYear, activeMonthKey]);

    const normalizeFrequency = (freq) => {
      if (!freq) return 'MONTHLY';
      const s = String(freq).trim().toUpperCase();
      if (s === 'NONE' || s === 'NULL' || s === 'UNDEFINED' || s === '') return 'MONTHLY';
      return s;
    };

    // 1. Audit Type Wise Grouped Data
    const auditTypeSummaryRows = useMemo(() => {
      const groups = {};

      filteredRows.forEach((row) => {
        const auditType = row.auditType || '-';
        const deptName = row.departmentName || '-';
        const frequency = normalizeFrequency(row.frequency);
        const groupKey = `${auditType.toUpperCase()}__${deptName.toUpperCase()}__${frequency}`;

        if (!groups[groupKey]) {
          groups[groupKey] = {
            key: groupKey,
            auditType,
            departmentName: deptName,
            frequency,
            monthsData: {}
          };
        }

        const addToMonth = (dateVal) => {
          if (!dateVal) return;
          const d = parseDateObj(dateVal);
          if (!d) return;
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const monthKey = `${yyyy}-${mm}`;
          if (!groups[groupKey].monthsData[monthKey]) {
            groups[groupKey].monthsData[monthKey] = [];
          }
          if (!groups[groupKey].monthsData[monthKey].some((existing) => existing.id === row.id || (existing.scheduleNo && existing.scheduleNo === row.scheduleNo && existing.observationNo === row.observationNo))) {
            groups[groupKey].monthsData[monthKey].push(row);
          }
        };

        if (row.scheduleDate) {
          addToMonth(row.scheduleDate);
        }
        if (row.observationDate) {
          addToMonth(row.observationDate);
        }
      });

      return Object.values(groups).sort((a, b) => a.auditType.localeCompare(b.auditType));
    }, [filteredRows]);

    // 2. Department Wise Grouped Data
    const departmentSummaryRows = useMemo(() => {
      const groups = {};

      filteredRows.forEach((row) => {
        const deptName = row.departmentName || '-';
        const auditType = row.auditType || '-';
        const frequency = normalizeFrequency(row.frequency);
        const groupKey = `${deptName.toUpperCase()}__${auditType.toUpperCase()}__${frequency}`;

        if (!groups[groupKey]) {
          groups[groupKey] = {
            key: groupKey,
            departmentName: deptName,
            auditType,
            frequency,
            monthsData: {}
          };
        }

        const addToMonth = (dateVal) => {
          if (!dateVal) return;
          const d = parseDateObj(dateVal);
          if (!d) return;
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const monthKey = `${yyyy}-${mm}`;
          if (!groups[groupKey].monthsData[monthKey]) {
            groups[groupKey].monthsData[monthKey] = [];
          }
          if (!groups[groupKey].monthsData[monthKey].some((existing) => existing.id === row.id || (existing.scheduleNo && existing.scheduleNo === row.scheduleNo && existing.observationNo === row.observationNo))) {
            groups[groupKey].monthsData[monthKey].push(row);
          }
        };

        if (row.scheduleDate) {
          addToMonth(row.scheduleDate);
        }
        if (row.observationDate) {
          addToMonth(row.observationDate);
        }
      });

      return Object.values(groups).sort((a, b) => {
        const dComp = a.departmentName.localeCompare(b.departmentName);
        if (dComp !== 0) return dComp;
        return a.auditType.localeCompare(b.auditType);
      });
    }, [filteredRows]);

    // Detailed Table Rows (Sorted based on active tab)
    const detailedRowsSorted = useMemo(() => {
      const list = [...filteredRows];
      if (primaryTab === 'department') {
        return list.sort((a, b) => {
          const dComp = String(a.departmentName || '').localeCompare(String(b.departmentName || ''));
          if (dComp !== 0) return dComp;
          return String(a.auditType || '').localeCompare(String(b.auditType || ''));
        });
      }
      return list.sort((a, b) => {
        const tComp = String(a.auditType || '').localeCompare(String(b.auditType || ''));
        if (tComp !== 0) return tComp;
        return String(a.departmentName || '').localeCompare(String(b.departmentName || ''));
      });
    }, [filteredRows, primaryTab]);

    // Detailed Table Columns - Audit Type Primary
    const tableColumnsAuditType = useMemo(() => [
      {
        id: 'index',
        label: '#',
        minWidth: 50,
        align: 'center',
        render: (row, idx) => (
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary' }}>
            {page * size + idx + 1}
          </Typography>
        )
      },
      {
        id: 'auditType',
        label: 'Audit Type & Department',
        minWidth: 180,
        render: (row) => {
          const themeInfo = getAuditTypeTheme(row.auditType);
          const deptInfo = getDeptTheme(row.departmentName);
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35, py: 0.2 }}>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: themeInfo.primary,
                    flexShrink: 0
                  }}
                />
                <Typography sx={{ fontSize: '0.84rem', fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                  {row.auditType}
                </Typography>
              </Stack>
              <Box sx={{ pl: 1.8 }}>
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: deptInfo.primary,
                    bgcolor: alpha(deptInfo.primary, 0.08),
                    px: 0.8,
                    py: 0.15,
                    borderRadius: '4px',
                    border: `1px solid ${alpha(deptInfo.primary, 0.2)}`,
                    display: 'inline-block',
                    lineHeight: 1.2
                  }}
                >
                  🏢 {row.departmentName || '-'}
                </Typography>
              </Box>
            </Box>
          );
        }
      },
      {
        id: 'scheduleNo',
        label: 'Schedule No',
        minWidth: 130,
        render: (row) => (
          <Chip
            label={row.scheduleNo}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.74rem',
              bgcolor: isDark ? alpha('#fff', 0.08) : '#f1f5f9',
              color: 'text.primary',
              borderRadius: '6px'
            }}
          />
        )
      },
      {
        id: 'scheduleDate',
        label: 'Schedule Date',
        minWidth: 120,
        align: 'center',
        render: (row) => (
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary' }}>
            {row.scheduleDateStr}
          </Typography>
        )
      },
      {
        id: 'auditorAuditee',
        label: 'Auditor & Auditee',
        minWidth: 175,
        render: (row) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 0.3 }}>
            <Stack direction="row" spacing={0.7} alignItems="center">
              <Typography
                component="span"
                sx={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#4338ca',
                  bgcolor: alpha('#4f46e5', 0.1),
                  px: 0.6,
                  py: 0.15,
                  borderRadius: '4px',
                  border: `1px solid ${alpha('#4f46e5', 0.25)}`,
                  letterSpacing: '0.02em',
                  lineHeight: 1.1,
                  flexShrink: 0
                }}
              >
                Auditor
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: isDark ? '#e0e7ff' : '#1e1b4b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {row.auditor || '-'}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.7} alignItems="center">
              <Typography
                component="span"
                sx={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#0d9488',
                  bgcolor: alpha('#0d9488', 0.1),
                  px: 0.6,
                  py: 0.15,
                  borderRadius: '4px',
                  border: `1px solid ${alpha('#0d9488', 0.25)}`,
                  letterSpacing: '0.02em',
                  lineHeight: 1.1,
                  flexShrink: 0
                }}
              >
                Auditee
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: isDark ? '#ccfbf1' : '#134e4a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {row.auditee || '-'}
              </Typography>
            </Stack>
          </Box>
        )
      },
      {
        id: 'observationDetails',
        label: 'Observation No & Date',
        minWidth: 160,
        align: 'center',
        render: (row) => {
          if (!row.observationNo || row.observationNo === '-') {
            return (
              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 500 }}>
                -
              </Typography>
            );
          }
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, py: 0.3 }}>
              <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                <Chip
                  label={row.observationNo}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    bgcolor: isDark ? alpha('#3b82f6', 0.15) : '#eff6ff',
                    color: isDark ? '#93c5fd' : '#1d4ed8',
                    border: `1px solid ${isDark ? alpha('#3b82f6', 0.3) : '#bfdbfe'}`,
                    borderRadius: '6px'
                  }}
                />
                {row.rawObservation && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedPdfRow(row.rawObservation);
                      setPdfDialogOpen(true);
                    }}
                    sx={{
                      p: 0.3,
                      bgcolor: alpha('#ef4444', 0.1),
                      color: '#ef4444',
                      border: `1px solid ${alpha('#ef4444', 0.25)}`,
                      borderRadius: '6px',
                      '&:hover': {
                        bgcolor: '#ef4444',
                        color: '#fff'
                      }
                    }}
                    title="View PDF Report"
                  >
                    <IconFileTypePdf size={15} />
                  </IconButton>
                )}
              </Stack>

              {row.observationDateStr && row.observationDateStr !== '-' && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    color: isDark ? '#fed7aa' : '#c2410c',
                    bgcolor: alpha('#f97316', 0.08),
                    px: 0.7,
                    py: 0.15,
                    borderRadius: '4px',
                    border: `1px solid ${alpha('#f97316', 0.2)}`,
                    lineHeight: 1.1
                  }}
                >
                  📅 {row.observationDateStr}
                </Typography>
              )}
            </Box>
          );
        }
      },
      {
        id: 'result',
        label: 'Result',
        minWidth: 150,
        align: 'center',
        render: (row) => {
          if (row.executionStatus === 'COMPLETED') {
            return (
              <Stack direction="row" spacing={0.6} alignItems="center" justifyContent="center">
                <Chip
                  label={row.auditScore !== null ? `Score: ${row.auditScore}` : 'COMPLETED'}
                  size="small"
                  color="success"
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.74rem',
                    borderRadius: '8px'
                  }}
                />
                {row.deviationDays !== 0 && (
                  <Chip
                    label={row.deviationDays > 0 ? `+${row.deviationDays}d` : `${row.deviationDays}d`}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      bgcolor: row.deviationDays > 0 ? alpha('#f59e0b', 0.15) : alpha('#10b981', 0.15),
                      color: row.deviationDays > 0 ? '#d97706' : '#059669'
                    }}
                  />
                )}
              </Stack>
            );
          }

          if (row.executionStatus === 'OVERDUE') {
            return (
              <Chip
                label="OVERDUE"
                size="small"
                color="error"
                sx={{
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  borderRadius: '8px'
                }}
              />
            );
          }

          return (
            <Chip
              label="PENDING"
              size="small"
              color="warning"
              sx={{
                fontWeight: 800,
                fontSize: '0.72rem',
                borderRadius: '8px'
              }}
            />
          );
        }
      }
    ], [isDark, page, size]);

    // Detailed Table Columns - Department Primary
    const tableColumnsDepartment = useMemo(() => [
      {
        id: 'index',
        label: '#',
        minWidth: 50,
        align: 'center',
        render: (row, idx) => (
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary' }}>
            {page * size + idx + 1}
          </Typography>
        )
      },
      {
        id: 'department',
        label: 'Department & Audit Type',
        minWidth: 180,
        render: (row) => {
          const themeInfo = getAuditTypeTheme(row.auditType);
          const deptInfo = getDeptTheme(row.departmentName);
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35, py: 0.2 }}>
              <Stack direction="row" spacing={0.8} alignItems="center">
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: deptInfo.primary,
                    bgcolor: alpha(deptInfo.primary, 0.1),
                    px: 0.8,
                    py: 0.15,
                    borderRadius: '5px',
                    border: `1px solid ${alpha(deptInfo.primary, 0.25)}`,
                    lineHeight: 1.2
                  }}
                >
                  🏢 {row.departmentName || '-'}
                </Typography>
              </Stack>
              <Box sx={{ pl: 0.5, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: themeInfo.primary,
                    flexShrink: 0
                  }}
                />
                <Typography sx={{ fontSize: '0.80rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                  {row.auditType}
                </Typography>
              </Box>
            </Box>
          );
        }
      },
      {
        id: 'scheduleNo',
        label: 'Schedule No',
        minWidth: 130,
        render: (row) => (
          <Chip
            label={row.scheduleNo}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.74rem',
              bgcolor: isDark ? alpha('#fff', 0.08) : '#f1f5f9',
              color: 'text.primary',
              borderRadius: '6px'
            }}
          />
        )
      },
      {
        id: 'scheduleDate',
        label: 'Schedule Date',
        minWidth: 120,
        align: 'center',
        render: (row) => (
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary' }}>
            {row.scheduleDateStr}
          </Typography>
        )
      },
      {
        id: 'auditorAuditee',
        label: 'Auditor & Auditee',
        minWidth: 175,
        render: (row) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, py: 0.3 }}>
            <Stack direction="row" spacing={0.7} alignItems="center">
              <Typography
                component="span"
                sx={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#4338ca',
                  bgcolor: alpha('#4f46e5', 0.1),
                  px: 0.6,
                  py: 0.15,
                  borderRadius: '4px',
                  border: `1px solid ${alpha('#4f46e5', 0.25)}`,
                  letterSpacing: '0.02em',
                  lineHeight: 1.1,
                  flexShrink: 0
                }}
              >
                Auditor
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: isDark ? '#e0e7ff' : '#1e1b4b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {row.auditor || '-'}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.7} alignItems="center">
              <Typography
                component="span"
                sx={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#0d9488',
                  bgcolor: alpha('#0d9488', 0.1),
                  px: 0.6,
                  py: 0.15,
                  borderRadius: '4px',
                  border: `1px solid ${alpha('#0d9488', 0.25)}`,
                  letterSpacing: '0.02em',
                  lineHeight: 1.1,
                  flexShrink: 0
                }}
              >
                Auditee
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: isDark ? '#ccfbf1' : '#134e4a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {row.auditee || '-'}
              </Typography>
            </Stack>
          </Box>
        )
      },
      {
        id: 'observationDetails',
        label: 'Observation No & Date',
        minWidth: 160,
        align: 'center',
        render: (row) => {
          if (!row.observationNo || row.observationNo === '-') {
            return (
              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 500 }}>
                -
              </Typography>
            );
          }
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, py: 0.3 }}>
              <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                <Chip
                  label={row.observationNo}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    bgcolor: isDark ? alpha('#3b82f6', 0.15) : '#eff6ff',
                    color: isDark ? '#93c5fd' : '#1d4ed8',
                    border: `1px solid ${isDark ? alpha('#3b82f6', 0.3) : '#bfdbfe'}`,
                    borderRadius: '6px'
                  }}
                />
                {row.rawObservation && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedPdfRow(row.rawObservation);
                      setPdfDialogOpen(true);
                    }}
                    sx={{
                      p: 0.3,
                      bgcolor: alpha('#ef4444', 0.1),
                      color: '#ef4444',
                      border: `1px solid ${alpha('#ef4444', 0.25)}`,
                      borderRadius: '6px',
                      '&:hover': {
                        bgcolor: '#ef4444',
                        color: '#fff'
                      }
                    }}
                    title="View PDF Report"
                  >
                    <IconFileTypePdf size={15} />
                  </IconButton>
                )}
              </Stack>

              {row.observationDateStr && row.observationDateStr !== '-' && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: '0.70rem',
                    fontWeight: 700,
                    color: isDark ? '#fed7aa' : '#c2410c',
                    bgcolor: alpha('#f97316', 0.08),
                    px: 0.7,
                    py: 0.15,
                    borderRadius: '4px',
                    border: `1px solid ${alpha('#f97316', 0.2)}`,
                    lineHeight: 1.1
                  }}
                >
                  📅 {row.observationDateStr}
                </Typography>
              )}
            </Box>
          );
        }
      },
      {
        id: 'result',
        label: 'Result',
        minWidth: 150,
        align: 'center',
        render: (row) => {
          if (row.executionStatus === 'COMPLETED') {
            return (
              <Stack direction="row" spacing={0.6} alignItems="center" justifyContent="center">
                <Chip
                  label={row.auditScore !== null ? `Score: ${row.auditScore}` : 'COMPLETED'}
                  size="small"
                  color="success"
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.74rem',
                    borderRadius: '8px'
                  }}
                />
                {row.deviationDays !== 0 && (
                  <Chip
                    label={row.deviationDays > 0 ? `+${row.deviationDays}d` : `${row.deviationDays}d`}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      bgcolor: row.deviationDays > 0 ? alpha('#f59e0b', 0.15) : alpha('#10b981', 0.15),
                      color: row.deviationDays > 0 ? '#d97706' : '#059669'
                    }}
                  />
                )}
              </Stack>
            );
          }

          if (row.executionStatus === 'OVERDUE') {
            return (
              <Chip
                label="OVERDUE"
                size="small"
                color="error"
                sx={{
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  borderRadius: '8px'
                }}
              />
            );
          }

          return (
            <Chip
              label="PENDING"
              size="small"
              color="warning"
              sx={{
                fontWeight: 800,
                fontSize: '0.72rem',
                borderRadius: '8px'
              }}
            />
          );
        }
      }
    ], [isDark, page, size]);

    // Active columns for detailed table based on tab
    const activeDetailedColumns = primaryTab === 'department' ? tableColumnsDepartment : tableColumnsAuditType;

    // BOS Export Configuration
    const exportConfig = useMemo(() => {
      const isDept = primaryTab === 'department';

      if (subView === 'summary') {
        const activeData = isDept ? departmentSummaryRows : auditTypeSummaryRows;

        const cols = isDept
          ? [
            { id: 'slNo', label: '#', header: '#', render: (r, i) => i + 1 },
            { id: 'departmentName', label: 'Department', header: 'Department' },
            { id: 'auditType', label: 'Audit Type', header: 'Audit Type' },
            { id: 'frequency', label: 'Frequency', header: 'Frequency' }
          ]
          : [
            { id: 'slNo', label: '#', header: '#', render: (r, i) => i + 1 },
            { id: 'auditType', label: 'Audit Type', header: 'Audit Type' },
            { id: 'departmentName', label: 'Department', header: 'Department' },
            { id: 'frequency', label: 'Frequency', header: 'Frequency' }
          ];

        monthColumns.forEach((m) => {
          cols.push({
            id: `${m.monthKey}_plan`,
            label: `${m.label} (Plan)`,
            header: `${m.label} (Plan)`
          });
          cols.push({
            id: `${m.monthKey}_actual`,
            label: `${m.label} (Actual)`,
            header: `${m.label} (Actual)`
          });
        });

        const data = activeData.map((r, rIdx) => {
          const rowObj = {
            slNo: rIdx + 1,
            departmentName: r.departmentName,
            auditType: r.auditType,
            frequency: r.frequency
          };

          monthColumns.forEach((m) => {
            const rawItems = r.monthsData[m.monthKey] || [];
            const items = consolidateMonthlyItems(rawItems);
            const planDates = items.map((i) => formatDateStr(i.scheduleDate)).filter((d) => d !== '-');
            const actualDates = items
              .map((i) => {
                if (i.observationDate) {
                  return `${formatDateStr(i.observationDate)}${i.auditScore !== null ? ` (Score: ${i.auditScore})` : ''}`;
                }
                return i.executionStatus;
              })
              .filter((d) => d && d !== '-');

            rowObj[`${m.monthKey}_plan`] = planDates.join(', ') || '-';
            rowObj[`${m.monthKey}_actual`] = actualDates.join(', ') || '-';
          });

          return rowObj;
        });

        const reportTitle = isDept
          ? `AUDIT VS ACTUAL DEPARTMENT SUMMARY (FY ${selectedYear}-${String(selectedYear + 1).slice(-2)})`
          : `AUDIT VS ACTUAL AUDIT TYPE SUMMARY (FY ${selectedYear}-${String(selectedYear + 1).slice(-2)})`;
        const filename = isDept
          ? `Audit_Vs_Actual_Department_Summary_FY${selectedYear}_${String(selectedYear + 1).slice(-2)}`
          : `Audit_Vs_Actual_AuditType_Summary_FY${selectedYear}_${String(selectedYear + 1).slice(-2)}`;

        return {
          data,
          columns: cols,
          reportName: reportTitle,
          filename
        };
      }

      // Detailed View Export
      const cols = isDept
        ? [
          { id: 'slNo', label: '#', header: '#', render: (r, i) => i + 1 },
          { id: 'departmentName', label: 'Department', header: 'Department' },
          { id: 'auditType', label: 'Audit Type', header: 'Audit Type' },
          { id: 'scheduleNo', label: 'Schedule No', header: 'Schedule No' },
          { id: 'scheduleDateStr', label: 'Schedule Date', header: 'Schedule Date' },
          { id: 'auditor', label: 'Auditor', header: 'Auditor' },
          { id: 'auditee', label: 'Auditee', header: 'Auditee' },
          { id: 'observationNo', label: 'Observation No', header: 'Observation No' },
          { id: 'observationDateStr', label: 'Observation Date', header: 'Observation Date' },
          {
            id: 'result',
            label: 'Result',
            header: 'Result',
            render: (r) =>
              r.executionStatus === 'COMPLETED'
                ? r.auditScore !== null
                  ? `Score: ${r.auditScore} (COMPLETED)`
                  : 'COMPLETED'
                : r.executionStatus === 'OVERDUE'
                  ? 'OVERDUE'
                  : 'PENDING'
          }
        ]
        : [
          { id: 'slNo', label: '#', header: '#', render: (r, i) => i + 1 },
          { id: 'auditType', label: 'Audit Type', header: 'Audit Type' },
          { id: 'departmentName', label: 'Department', header: 'Department' },
          { id: 'scheduleNo', label: 'Schedule No', header: 'Schedule No' },
          { id: 'scheduleDateStr', label: 'Schedule Date', header: 'Schedule Date' },
          { id: 'auditor', label: 'Auditor', header: 'Auditor' },
          { id: 'auditee', label: 'Auditee', header: 'Auditee' },
          { id: 'observationNo', label: 'Observation No', header: 'Observation No' },
          { id: 'observationDateStr', label: 'Observation Date', header: 'Observation Date' },
          {
            id: 'result',
            label: 'Result',
            header: 'Result',
            render: (r) =>
              r.executionStatus === 'COMPLETED'
                ? r.auditScore !== null
                  ? `Score: ${r.auditScore} (COMPLETED)`
                  : 'COMPLETED'
                : r.executionStatus === 'OVERDUE'
                  ? 'OVERDUE'
                  : 'PENDING'
          }
        ];

      const reportTitle = isDept
        ? 'AUDIT VS ACTUAL DEPARTMENT-WISE REPORT'
        : 'AUDIT VS ACTUAL REPORT';
      const filename = isDept
        ? 'Audit_Vs_Actual_Department_Detailed'
        : 'Audit_Vs_Actual_Detailed';

      return {
        data: detailedRowsSorted,
        columns: cols,
        reportName: reportTitle,
        filename
      };
    }, [primaryTab, subView, detailedRowsSorted, auditTypeSummaryRows, departmentSummaryRows, monthColumns, selectedYear]);

    // Color Styles matching User's Wireframe Template
    const headerSkyBlueBg = isDark ? '#0284c7' : '#74c0e3';
    const planCyanBg = isDark ? '#075985' : '#bfdbfe';
    const actualPinkBg = isDark ? '#831843' : '#fad2e1';
    const tableBorderColor = isDark ? alpha('#fff', 0.15) : '#cbd5e1';

    // Active Matrix Rows for Summary View
    const activeMatrixRows = primaryTab === 'department' ? departmentSummaryRows : auditTypeSummaryRows;
    const isDeptTab = primaryTab === 'department';

    // Summary View: all rows shown (no pagination)

    // Full-Data Image Copy to Clipboard — ALL rows + ALL month columns (no scroll/pagination clipping)
    const handleCopyClipboard = () => {
      const reportTitle = isDeptTab
        ? 'Department Wise — Audit vs Actual Report'
        : 'Audit Type Wise — Audit vs Actual Report';

      setCopying(true);
      copyFullMatrixToClipboard({
        rows: activeMatrixRows,        // ALL rows (no pagination)
        monthColumns,                  // ALL 12 month columns (no horizontal scroll limit)
        isDeptTab,
        reportTitle,
        onDone: (success) => {
          setCopying(false);
          if (success) {
            setCopied(true);
            setCopySnackbar({ open: true, title: 'Full Report Matrix Image Copied to Clipboard!' });
            setTimeout(() => setCopied(false), 2500);
          } else {
            setCopySnackbar({ open: true, title: 'Failed to copy image. Please try again.' });
          }
        }
      });
    };

    return (
      <MainCard
        fullWidth
        pageCode="QM1280"
        icon={IconReportAnalytics}
        title="Audit vs Actual Report"
        contentSX={{ p: 1.5, pb: 1 }}
        secondary={
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={copied ? 'Copied!' : 'Copy'}>
              <Button
                variant="outlined"
                size="small"
                disabled={copying}
                startIcon={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                onClick={handleCopyClipboard}
                sx={{
                  height: 34,
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  borderColor: copied ? '#10b981' : theme.palette.primary.main,
                  color: copied ? '#10b981' : theme.palette.primary.main,
                  bgcolor: copied ? alpha('#10b981', 0.1) : alpha(theme.palette.primary.main, 0.06),
                  '&:hover': {
                    bgcolor: copied ? alpha('#10b981', 0.18) : alpha(theme.palette.primary.main, 0.12),
                    borderColor: copied ? '#10b981' : theme.palette.primary.dark
                  }
                }}
              >
                {copying ? 'Copying...' : copied ? 'Copied!' : 'Copy'}
              </Button>
            </Tooltip>

            {/* Export PDF Button — opens full-data matrix PDF dialog */}
            <Tooltip title={`Preview & Export ${activeMatrixRows.length} records (Matrix PDF)`}>
              <Button
                variant="contained"
                size="small"
                startIcon={<IconFileTypePdf size={16} />}
                onClick={() => setPdfOpen(true)}
                sx={{
                  height: 34,
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  bgcolor: '#d32f2f',
                  '&:hover': { bgcolor: '#b71c1c' }
                }}
              >

              </Button>
            </Tooltip>

            {/* BOS Export & Refresh Toolbar */}
            <BOSTableToolbar
              onRefresh={fetchData}
              hasExportPermission={perms.export}
              exportData={exportConfig.data}
              exportColumns={exportConfig.columns}
              exportFilename={exportConfig.filename}
              columns={activeDetailedColumns}
            />
          </Stack>
        }
      >
        {/* Top Primary Tabs & Sub-View Switcher */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1
          }}
        >
          <Tabs
            value={primaryTab}
            onChange={(e, val) => setPrimaryTab(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minHeight: 38,
              '& .MuiTab-root': {
                minHeight: 38,
                fontWeight: 800,
                fontSize: '0.84rem',
                textTransform: 'none',
                px: 2,
                py: 0.5,
                gap: 0.8,
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: theme.palette.primary.main
                }
              }
            }}
          >
            <Tab
              value="auditType"
              icon={<IconCategory size={17} />}
              iconPosition="start"
              label="Audit Type Wise"
            />
            <Tab
              value="department"
              icon={<IconBuilding size={17} />}
              iconPosition="start"
              label="Department Wise"
            />
          </Tabs>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            {/* Status Legend Indicator */}
            {subView === 'summary' && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, bgcolor: alpha('#16a34a', 0.08), px: 0.7, py: 0.2, borderRadius: '4px', border: `1px solid ${alpha('#16a34a', 0.25)}` }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#16a34a' }} />
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#16a34a' }}>On-Time</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, bgcolor: alpha('#dc2626', 0.08), px: 0.7, py: 0.2, borderRadius: '4px', border: `1px solid ${alpha('#dc2626', 0.25)}` }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#dc2626' }} />
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#dc2626' }}>Delayed (+Xd)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, bgcolor: alpha('#f59e0b', 0.08), px: 0.7, py: 0.2, borderRadius: '4px', border: `1px solid ${alpha('#f59e0b', 0.25)}` }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706' }}>Pending</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, bgcolor: alpha('#ef4444', 0.08), px: 0.7, py: 0.2, borderRadius: '4px', border: `1px solid ${alpha('#ef4444', 0.25)}` }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#ef4444' }} />
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#ef4444' }}>Overdue</Typography>
                </Box>
              </Stack>
            )}

            {/* Sub-View Switcher: Summary View vs Detailed View */}
            <ToggleButtonGroup
              value={subView}
              exclusive
              onChange={(e, val) => {
                if (val) setSubView(val);
              }}
              size="small"
              sx={{
                bgcolor: isDark ? alpha('#fff', 0.05) : '#f8fafc',
                border: `1px solid ${isDark ? alpha('#fff', 0.1) : '#e2e8f0'}`,
                borderRadius: '8px',
                p: 0.3,
                '& .MuiToggleButton-root': {
                  px: 1.2,
                  py: 0.3,
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  gap: 0.6,
                  border: 0,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: theme.palette.primary.main,
                    color: '#fff',
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark
                    }
                  }
                }
              }}
            >
              <ToggleButton value="summary">
                <IconLayoutGrid size={15} />
                Summary View
              </ToggleButton>
              <ToggleButton value="detailed">
                <IconListDetails size={15} />
                Detailed View
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>

        {/* 1. Summary Matrix View (Plan vs Actual Calendar Grid) */}
        {subView === 'summary' && (
          <Paper
            ref={summaryPaperRef}
            elevation={0}
            sx={{
              width: '100%',
              height: 'calc(100vh - 300px)',
              minHeight: 'calc(100vh - 300px)',
              maxHeight: 'calc(100vh - 300px)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: `1px solid ${tableBorderColor}`,
              borderRadius: '8px',
              bgcolor: 'background.paper'
            }}
          >
            <TableContainer
              ref={tableContainerRef}
              sx={{
                flex: 1,
                height: 'calc(100vh - 330px)',
                minHeight: 'calc(100vh - 330px)',
                maxHeight: 'calc(100vh - 330px)',
                overflowX: 'auto',
                overflowY: 'auto',
                // Force clear, prominent scrollbars for both horizontal and vertical scrolling
                '&::-webkit-scrollbar': {
                  height: 12,
                  width: 10
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: isDark ? alpha('#fff', 0.08) : '#e2e8f0',
                  borderRadius: 6
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: isDark ? alpha('#38bdf8', 0.4) : '#0284c7',
                  borderRadius: 6,
                  border: '2px solid transparent',
                  backgroundClip: 'padding-box',
                  '&:hover': {
                    backgroundColor: isDark ? '#38bdf8' : '#0369a1'
                  }
                }
              }}
            >
              <Table stickyHeader size="small" sx={{ borderCollapse: 'separate', tableLayout: 'fixed', minWidth: 3020 }}>
                <TableHead sx={{ position: 'sticky', top: 0, zIndex: 30 }}>
                  {/* Header Row 1: Sl.No (#), Primary Group Column, Feq, and Month Names */}
                  <TableRow sx={{ height: 38 }}>
                    {/* Column 1: Sl.No (#) */}
                    <TableCell
                      rowSpan={2}
                      sx={{
                        bgcolor: headerSkyBlueBg,
                        color: isDark ? '#fff' : '#0f172a',
                        fontWeight: 800,
                        fontSize: '0.86rem',
                        textAlign: 'center',
                        py: 1,
                        px: 0.8,
                        width: 48,
                        minWidth: 48,
                        maxWidth: 48,
                        borderRight: `1px solid ${tableBorderColor}`,
                        borderBottom: `2px solid ${tableBorderColor}`,
                        position: 'sticky',
                        left: 0,
                        top: 0,
                        zIndex: 40
                      }}
                    >
                      #
                    </TableCell>

                    {/* Column 2: Department & Audit Type / Audit Type & Department */}
                    <TableCell
                      rowSpan={2}
                      sx={{
                        bgcolor: headerSkyBlueBg,
                        color: isDark ? '#fff' : '#0f172a',
                        fontWeight: 800,
                        fontSize: '0.86rem',
                        textAlign: 'left',
                        py: 1,
                        px: 1.5,
                        width: 280,
                        minWidth: 280,
                        maxWidth: 280,
                        borderRight: `2px solid ${tableBorderColor}`,
                        borderBottom: `2px solid ${tableBorderColor}`,
                        position: 'sticky',
                        left: 48,
                        top: 0,
                        zIndex: 40,
                        boxShadow: '4px 0 8px -2px rgba(0,0,0,0.18)'
                      }}
                    >
                      Feq
                    </TableCell>

                    {monthColumns.map((m) => {
                      let headerBg = '#0284c7'; // Future month Blue
                      let textColor = '#ffffff';
                      let borderRight = `2px solid ${tableBorderColor}`;
                      let borderLeft = undefined;

                      if (m.isCurrentMonth) {
                        headerBg = '#16a34a'; // Active month Green
                        borderRight = `2px solid #15803d`;
                        borderLeft = `2px solid #15803d`;
                      } else if (m.isPastMonth) {
                        headerBg = '#ca8a04'; // Past month Yellow / Amber
                        borderRight = `1px solid ${tableBorderColor}`;
                      }

                      return (
                        <TableCell
                          key={m.monthKey}
                          ref={m.isCurrentMonth ? activeHeaderCellRef : null}
                          colSpan={2}
                          sx={{
                            bgcolor: headerBg,
                            color: textColor,
                            fontWeight: m.isCurrentMonth ? 900 : 800,
                            fontSize: '0.86rem',
                            textAlign: 'center',
                            py: 0.6,
                            width: 235,
                            minWidth: 235,
                            maxWidth: 235,
                            borderLeft,
                            borderRight,
                            borderBottom: `1px solid ${tableBorderColor}`,
                            position: 'sticky',
                            top: 0,
                            zIndex: 20,
                            height: 38,
                            boxSizing: 'border-box'
                          }}
                        >
                          <Stack direction="row" spacing={0.6} alignItems="center" justifyContent="center">
                            <Typography sx={{ fontWeight: m.isCurrentMonth ? 900 : 800, fontSize: '0.86rem', color: textColor }}>
                              {m.label}
                            </Typography>
                            {m.isCurrentMonth && (
                              <Chip
                                label="ACTIVE"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.60rem',
                                  fontWeight: 900,
                                  bgcolor: '#14532d',
                                  color: '#ffffff',
                                  borderRadius: '4px',
                                  px: 0.2
                                }}
                              />
                            )}
                          </Stack>
                        </TableCell>
                      );
                    })}
                  </TableRow>

                  {/* Header Row 2: Sub-headers Plan (sch dt) & Actual (obr dt) */}
                  <TableRow sx={{ height: 38 }}>
                    {monthColumns.map((m) => {
                      let planBg = isDark ? '#075985' : '#e0f2fe';
                      let planColor = isDark ? '#e0f2fe' : '#0369a1';
                      let actualBg = isDark ? '#0369a1' : '#bae6fd';
                      let actualColor = isDark ? '#e0f2fe' : '#0284c7';
                      let subBorderRight = `2px solid ${tableBorderColor}`;
                      let subBorderLeft = undefined;

                      if (m.isCurrentMonth) {
                        planBg = isDark ? '#14532d' : '#86efac'; // Mint green
                        planColor = isDark ? '#f0fdf4' : '#14532d';
                        actualBg = isDark ? '#166534' : '#4ade80'; // Emerald green
                        actualColor = isDark ? '#f0fdf4' : '#052e16';
                        subBorderRight = `2px solid #15803d`;
                        subBorderLeft = `2px solid #15803d`;
                      } else if (m.isPastMonth) {
                        planBg = isDark ? '#854d0e' : '#fef9c3'; // Soft Yellow
                        planColor = isDark ? '#fef08a' : '#854d0e';
                        actualBg = isDark ? '#a16207' : '#fef08a'; // Soft Amber Yellow
                        actualColor = isDark ? '#fef08a' : '#713f12';
                      }

                      return (
                        <React.Fragment key={`sub-${m.monthKey}`}>
                          {/* Plan Column Header */}
                          <TableCell
                            sx={{
                              bgcolor: planBg,
                              color: planColor,
                              fontWeight: m.isCurrentMonth ? 900 : 800,
                              fontSize: '0.78rem',
                              textAlign: 'center',
                              py: 0.5,
                              width: 110,
                              minWidth: 110,
                              maxWidth: 110,
                              borderLeft: subBorderLeft,
                              borderRight: `1px solid ${tableBorderColor}`,
                              borderBottom: `2px solid ${tableBorderColor}`,
                              position: 'sticky',
                              top: '38px',
                              zIndex: 20,
                              height: 38,
                              boxSizing: 'border-box'
                            }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <Typography sx={{ fontSize: '0.76rem', fontWeight: m.isCurrentMonth ? 900 : 800, lineHeight: 1.1 }}>
                                Plan
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* Actual Column Header */}
                          <TableCell
                            sx={{
                              bgcolor: actualBg,
                              color: actualColor,
                              fontWeight: m.isCurrentMonth ? 900 : 800,
                              fontSize: '0.78rem',
                              textAlign: 'center',
                              py: 0.5,
                              width: 125,
                              minWidth: 125,
                              maxWidth: 125,
                              borderRight: subBorderRight,
                              borderBottom: `2px solid ${tableBorderColor}`,
                              position: 'sticky',
                              top: '38px',
                              zIndex: 20,
                              height: 38,
                              boxSizing: 'border-box'
                            }}
                          >
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <Typography sx={{ fontSize: '0.76rem', fontWeight: m.isCurrentMonth ? 900 : 800, lineHeight: 1.1 }}>
                                Actual
                              </Typography>
                            </Box>
                          </TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3 + monthColumns.length * 2} align="center" sx={{ py: 6 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                          <CircularProgress size={24} />
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: 'text.secondary' }}>
                            Loading Audit vs Actual {isDeptTab ? 'Department-Wise' : 'Audit Type Wise'} Summary...
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : activeMatrixRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3 + monthColumns.length * 2} align="center" sx={{ py: 6 }}>
                        <Typography sx={{ fontSize: '0.88rem', color: 'text.secondary', fontWeight: 600 }}>
                          No audit records found for the selected filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeMatrixRows.map((row, rIdx) => {
                      const themeInfo = getAuditTypeTheme(row.auditType);
                      const deptInfo = getDeptTheme(row.departmentName);
                      const rowBg = rIdx % 2 === 0 ? 'transparent' : isDark ? alpha('#fff', 0.02) : '#fbfcfd';
                      const serialNo = rIdx + 1;

                      return (
                        <TableRow
                          key={row.key}
                          hover
                          sx={{
                            bgcolor: rowBg,
                            '&:hover': {
                              bgcolor: isDark ? alpha('#fff', 0.05) : alpha(theme.palette.primary.main, 0.04)
                            }
                          }}
                        >
                          {/* 1. Sl.No (#) Sticky Column */}
                          <TableCell
                            align="center"
                            sx={{
                              borderRight: `1px solid ${tableBorderColor}`,
                              borderBottom: `1px solid ${tableBorderColor}`,
                              py: 0.6,
                              px: 0.8,
                              width: 48,
                              minWidth: 48,
                              maxWidth: 48,
                              position: 'sticky',
                              left: 0,
                              bgcolor: isDark ? '#1e293b' : '#ffffff',
                              zIndex: 10
                            }}
                          >
                            <Typography sx={{ fontSize: '0.80rem', fontWeight: 700, color: 'text.secondary' }}>
                              {serialNo}
                            </Typography>
                          </TableCell>

                          {/* 2. Primary Name (Department/Audit Type) Sticky Column */}
                          <TableCell
                            sx={{
                              borderRight: `2px solid ${tableBorderColor}`,
                              borderBottom: `1px solid ${tableBorderColor}`,
                              py: 0.6,
                              px: 1.5,
                              width: 280,
                              minWidth: 280,
                              maxWidth: 280,
                              position: 'sticky',
                              left: 48,
                              bgcolor: isDark ? '#1e293b' : '#ffffff',
                              zIndex: 10,
                              overflow: 'hidden',
                              boxShadow: '4px 0 8px -2px rgba(0,0,0,0.18)'
                            }}
                          >
                            {isDeptTab ? (
                              /* Department Wise: Department primary */
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      color: deptInfo.primary,
                                      bgcolor: alpha(deptInfo.primary, 0.1),
                                      px: 0.8,
                                      py: 0.12,
                                      borderRadius: '5px',
                                      border: `1px solid ${alpha(deptInfo.primary, 0.25)}`,
                                      lineHeight: 1.2
                                    }}
                                  >
                                    🏢 {row.departmentName || '-'}
                                  </Typography>
                                </Stack>
                                <Box sx={{ pl: 0.5, display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', mt: 0.2 }}>
                                  <Box
                                    sx={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      bgcolor: themeInfo.primary,
                                      flexShrink: 0
                                    }}
                                  />
                                  <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                                    {row.auditType}
                                  </Typography>
                                  <Chip
                                    label={row.frequency}
                                    size="small"
                                    sx={{
                                      fontSize: '0.62rem',
                                      fontWeight: 800,
                                      textTransform: 'uppercase',
                                      height: 18,
                                      bgcolor: isDark ? alpha('#fff', 0.08) : '#f1f5f9',
                                      color: 'text.secondary',
                                      borderRadius: '4px',
                                      px: 0.2
                                    }}
                                  />
                                </Box>
                              </Box>
                            ) : (
                              /* Audit Type Wise: Audit Type primary */
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                  <Box
                                    sx={{
                                      width: 7,
                                      height: 7,
                                      borderRadius: '50%',
                                      bgcolor: themeInfo.primary,
                                      flexShrink: 0
                                    }}
                                  />
                                  <Typography sx={{ fontSize: '0.80rem', fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                                    {row.auditType}
                                  </Typography>
                                </Stack>
                                <Box sx={{ pl: 1.6, display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', mt: 0.2 }}>
                                  <Typography
                                    component="span"
                                    sx={{
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      color: deptInfo.primary,
                                      bgcolor: alpha(deptInfo.primary, 0.08),
                                      px: 0.7,
                                      py: 0.08,
                                      borderRadius: '4px',
                                      border: `1px solid ${alpha(deptInfo.primary, 0.2)}`,
                                      display: 'inline-block',
                                      lineHeight: 1.1
                                    }}
                                  >
                                    🏢 {row.departmentName || '-'}
                                  </Typography>

                                  <Chip
                                    label={row.frequency}
                                    size="small"
                                    sx={{
                                      fontSize: '0.62rem',
                                      fontWeight: 800,
                                      textTransform: 'uppercase',
                                      height: 18,
                                      bgcolor: isDark ? alpha('#fff', 0.08) : '#f1f5f9',
                                      color: 'text.secondary',
                                      borderRadius: '4px',
                                      px: 0.2
                                    }}
                                  />
                                </Box>
                              </Box>
                            )}
                          </TableCell>

                          {/* 4. Monthly Plan vs Actual Cells */}
                          {monthColumns.map((m) => {
                            const rawItems = row.monthsData[m.monthKey] || [];
                            const items = consolidateMonthlyItems(rawItems);

                            const isCompleted = items.length > 0 && items.some((i) => i.observationDate || i.executionStatus === 'COMPLETED');
                            const isOverdue = items.length > 0 && items.some((i) => i.executionStatus === 'OVERDUE');
                            const isPending = items.length > 0 && items.some((i) => i.executionStatus === 'PENDING');
                            const isInactiveMonth = items.length === 0;

                            // Dynamic styling: Column background is strictly set by Month Column Type
                            // Active Month = GREEN ONLY; Past Months = YELLOW ONLY; Future Months = BLUE ONLY
                            let planCellBg = 'transparent';
                            let actualCellBg = 'transparent';
                            let cellBorderLeft = m.isCurrentMonth ? '2px solid #15803d' : undefined;
                            let cellBorderRight = m.isCurrentMonth ? '2px solid #15803d' : `1px solid ${tableBorderColor}`;
                            let planDateColor = isDark ? '#7dd3fc' : '#0369a1';
                            let actualDateColor = isDark ? '#f472b6' : '#be185d';

                            if (m.isCurrentMonth) {
                              // Active Month ONLY gets Green Column Background
                              planCellBg = isDark ? alpha('#16a34a', 0.16) : '#f0fdf4';
                              actualCellBg = isDark ? alpha('#16a34a', 0.24) : '#dcfce7';
                              planDateColor = isDark ? '#86efac' : '#14532d';
                              actualDateColor = isDark ? '#86efac' : '#052e16';
                            } else if (m.isPastMonth) {
                              // ALL Past Months get Yellow Column Background
                              planCellBg = isDark ? alpha('#eab308', 0.16) : '#fffbeb';
                              actualCellBg = isDark ? alpha('#eab308', 0.24) : '#fef3c7';
                              planDateColor = isDark ? '#fde047' : '#b45309';
                              actualDateColor = isDark ? '#fde047' : '#b45309';
                            } else {
                              // ALL Future Months get Blue Column Background
                              planCellBg = isDark ? alpha('#0284c7', 0.15) : '#f0f9ff';
                              actualCellBg = isDark ? alpha('#0284c7', 0.22) : '#e0f2fe';
                              planDateColor = isDark ? '#7dd3fc' : '#0369a1';
                              actualDateColor = isDark ? '#7dd3fc' : '#0369a1';
                            }

                            return (
                              <React.Fragment key={`${row.key}_${m.monthKey}`}>
                                <TableCell
                                  align="center"
                                  sx={{
                                    borderLeft: cellBorderLeft,
                                    borderRight: `1px solid ${tableBorderColor}`,
                                    borderBottom: `1px solid ${tableBorderColor}`,
                                    py: 0.6,
                                    px: 0.5,
                                    width: 110,
                                    minWidth: 110,
                                    maxWidth: 110,
                                    overflow: 'hidden',
                                    bgcolor: planCellBg
                                  }}
                                >
                                  {items.length === 0 ? (
                                    <Typography sx={{ color: m.isPastMonth ? '#94a3b8' : 'text.disabled', fontSize: '0.78rem' }}>-</Typography>
                                  ) : (
                                    <Stack spacing={0.4} alignItems="center">
                                      {items.map((item) => (
                                        <Tooltip
                                          key={item.id}
                                          arrow
                                          title={
                                            <Box sx={{ p: 0.6, maxWidth: 330 }}>
                                              <Typography sx={{ fontSize: '0.80rem', fontWeight: 800, color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.15)', pb: 0.4, mb: 0.5 }}>
                                                📋 Schedule: {item.latestScheduleNo || item.scheduleNo}
                                              </Typography>
                                              <Typography sx={{ fontSize: '0.74rem' }}>
                                                🏢 Dept: <b>{item.departmentName}</b> | 📋 Type: <b>{item.auditType}</b>
                                              </Typography>
                                              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.2 }}>
                                                👤 Auditor: {item.auditor} | 👥 Auditee: {item.auditee}
                                              </Typography>

                                              <Box sx={{ mt: 1, p: 0.6, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: '#fbbf24', mb: 0.3 }}>
                                                  📊 SCHEDULE BREAKUP:
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.72rem' }}>
                                                  📌 <b>Original Schedule</b>: {item.initialScheduleNo} ({item.initialScheduleDateStr || formatDateStr(item.initialScheduleDate)})
                                                </Typography>
                                                {item.isRescheduled && (
                                                  <>
                                                    <Typography sx={{ fontSize: '0.72rem', color: '#38bdf8', mt: 0.2 }}>
                                                      🔄 <b>Last Schedule</b>: {item.latestScheduleNo} ({item.latestScheduleDateStr || item.scheduleDateStr})
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.70rem', color: '#f59e0b', mt: 0.3, fontWeight: 700 }}>
                                                      ⏱️ Reschedule Shift: +{item.rescheduleDays ?? 0} Days ({item.rescheduleCount}x Rescheduled)
                                                    </Typography>
                                                  </>
                                                )}
                                              </Box>

                                              {item.pathDates && item.pathDates.length > 1 && (
                                                <Typography sx={{ fontSize: '0.70rem', color: 'text.secondary', mt: 0.5 }}>
                                                  📜 History Path: {item.pathDates.join(' ➔ ')}
                                                </Typography>
                                              )}
                                            </Box>
                                          }
                                        >
                                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Typography
                                              sx={{
                                                fontSize: '0.76rem',
                                                fontWeight: m.isCurrentMonth ? 900 : 700,
                                                color: planDateColor,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                '&:hover': { textDecoration: 'underline' }
                                              }}
                                            >
                                              {formatShortDateStr(item.scheduleDate) || item.scheduleDateStr}
                                            </Typography>
                                            {item.isRescheduled && (
                                              <React.Fragment>
                                                <Typography
                                                  sx={{
                                                    fontSize: '0.66rem',
                                                    fontWeight: 700,
                                                    color: isDark ? '#94a3b8' : '#64748b',
                                                    textDecoration: 'line-through',
                                                    lineHeight: 1.1,
                                                    mt: 0.1,
                                                    whiteSpace: 'nowrap'
                                                  }}
                                                >
                                                  OG: {formatShortDateStr(item.initialScheduleDate)}
                                                </Typography>
                                                <Box
                                                  sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.2,
                                                    px: 0.4,
                                                    py: 0.05,
                                                    mt: 0.15,
                                                    borderRadius: '4px',
                                                    bgcolor: isDark ? alpha('#ef4444', 0.2) : '#fee2e2',
                                                    color: isDark ? '#fca5a5' : '#b91c1c',
                                                     border: `1px solid ${isDark ? alpha('#ef4444', 0.35) : '#fca5a5'}`,
                                                    fontSize: '0.60rem',
                                                    fontWeight: 800,
                                                    lineHeight: 1,
                                                    whiteSpace: 'nowrap'
                                                  }}
                                                >
                                                  🔄 Rescheduled
                                                </Box>
                                              </React.Fragment>
                                            )}
                                          </Box>
                                        </Tooltip>
                                      ))}
                                    </Stack>
                                  )}
                                </TableCell>

                                {/* Actual (Observation Date / Result) */}
                                <TableCell
                                  align="center"
                                  sx={{
                                    borderRight: cellBorderRight,
                                    borderBottom: `1px solid ${tableBorderColor}`,
                                    py: 0.6,
                                    px: 0.5,
                                    width: 125,
                                    minWidth: 125,
                                    maxWidth: 125,
                                    overflow: 'hidden',
                                    bgcolor: actualCellBg
                                  }}
                                >
                                  {items.length === 0 ? (
                                    <Typography sx={{ color: m.isPastMonth ? '#94a3b8' : 'text.disabled', fontSize: '0.78rem' }}>-</Typography>
                                  ) : (
                                    <Stack spacing={0.5} alignItems="center">
                                      {items.map((item) => {
                                        if (item.observationDate) {
                                          const dev = item.origDevDays ?? item.deviationDays ?? 0;
                                          const lastDev = item.lastDevDays ?? item.latestDeviationDays ?? dev;
                                          const isLate = dev > 0;
                                          const isOnTime = dev === 0;
                                          const isEarly = dev < 0;

                                          // Distinct High-Contrast Badges for On-Time (Green) vs Late (Red/Coral)
                                          const badgeBg = isLate
                                            ? (isDark ? alpha('#dc2626', 0.25) : '#fee2e2')
                                            : (isDark ? alpha('#16a34a', 0.25) : '#dcfce7');
                                          const badgeColor = isLate
                                            ? (isDark ? '#fca5a5' : '#b91c1c')
                                            : (isDark ? '#86efac' : '#15803d');
                                          const badgeBorder = isLate
                                            ? (isDark ? alpha('#ef4444', 0.4) : '#fca5a5')
                                            : (isDark ? alpha('#22c55e', 0.4) : '#86efac');

                                          const devTag = isLate ? `+${dev}d` : isEarly ? `${dev}d` : null;

                                          return (
                                            <Stack
                                              key={item.id}
                                              direction="row"
                                              spacing={0.3}
                                              alignItems="center"
                                              justifyContent="center"
                                            >
                                              <Tooltip
                                                arrow
                                                title={
                                                  <Box sx={{ p: 0.6, maxWidth: 340 }}>
                                                    <Typography sx={{ fontSize: '0.80rem', fontWeight: 800, color: '#38bdf8', borderBottom: '1px solid rgba(255,255,255,0.15)', pb: 0.4, mb: 0.5 }}>
                                                      📑 Observation No: {item.observationNo}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.74rem' }}>
                                                      🏢 Dept: <b>{item.departmentName}</b> | 📅 Actual Date: <b>{item.observationDateStr}</b>
                                                    </Typography>
                                                    {item.auditScore !== null && (
                                                      <Typography sx={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700, mt: 0.2 }}>
                                                        ⭐ Score: {item.auditScore}%
                                                      </Typography>
                                                    )}

                                                    <Box sx={{ mt: 1, p: 0.6, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                      <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: '#fbbf24', mb: 0.4 }}>
                                                        📊 DELAY BREAKUP:
                                                      </Typography>

                                                      {/* Breakup 1: Original Schedule */}
                                                      <Typography sx={{ fontSize: '0.72rem', color: isLate ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                                                        📌 <b>Vs Original Plan ({item.initialScheduleDateStr})</b>:{' '}
                                                        {isLate
                                                          ? `⚠️ +${dev} Days Delayed`
                                                          : isOnTime
                                                          ? `✅ 0 Days (On-Time Same Day)`
                                                          : `✅ ${Math.abs(dev)} Days Early`}
                                                      </Typography>

                                                      <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', pl: 2, mb: 0.4 }}>
                                                        ↳ Original Schedule No: <b>{item.initialScheduleNo}</b>
                                                      </Typography>

                                                      {/* Breakup 2: Last Schedule if Rescheduled */}
                                                      {item.isRescheduled && (
                                                        <>
                                                          <Typography sx={{ fontSize: '0.72rem', color: lastDev > 0 ? '#ef4444' : '#38bdf8', fontWeight: 700, mt: 0.3 }}>
                                                            🔄 <b>Vs Last Schedule ({item.latestScheduleDateStr})</b>:{' '}
                                                            {lastDev > 0
                                                              ? `⚠️ +${lastDev} Days Delayed`
                                                              : lastDev === 0
                                                              ? `✅ 0 Days (On-Time)`
                                                              : `✅ ${Math.abs(lastDev)} Days Early`}
                                                          </Typography>
                                                          <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', pl: 2 }}>
                                                            ↳ Last Schedule No: <b>{item.latestScheduleNo}</b>
                                                          </Typography>
                                                        </>
                                                      )}

                                                      {/* Breakup 3: Reschedule Shift */}
                                                      {item.isRescheduled && (
                                                        <Typography sx={{ fontSize: '0.70rem', color: '#f59e0b', mt: 0.5, pt: 0.3, borderTop: '1px dashed rgba(255,255,255,0.15)' }}>
                                                          ⏱️ <b>Reschedule Shift</b>: +{item.rescheduleDays ?? 0} Days ({item.initialScheduleNo} ➔ {item.latestScheduleNo})
                                                        </Typography>
                                                      )}
                                                    </Box>
                                                  </Box>
                                                }
                                              >
                                                <Box
                                                  sx={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: 0.35,
                                                    px: 0.6,
                                                    py: 0.15,
                                                    borderRadius: '5px',
                                                    bgcolor: badgeBg,
                                                    color: badgeColor,
                                                    border: `1px solid ${badgeBorder}`,
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    transition: 'all 0.15s ease',
                                                    '&:hover': {
                                                      transform: 'scale(1.05)',
                                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                    }
                                                  }}
                                                >
                                                  <Typography
                                                    sx={{
                                                      fontSize: '0.74rem',
                                                      fontWeight: 800,
                                                      color: 'inherit',
                                                      lineHeight: 1.1
                                                    }}
                                                  >
                                                    {formatShortDateStr(item.observationDate) || item.observationDateStr}
                                                  </Typography>
                                                  {devTag && (
                                                    <Typography
                                                      component="span"
                                                      sx={{
                                                        fontSize: '0.64rem',
                                                        fontWeight: 900,
                                                        color: badgeColor,
                                                        opacity: 0.95
                                                      }}
                                                    >
                                                      ({devTag})
                                                    </Typography>
                                                  )}
                                                </Box>
                                              </Tooltip>

                                              {item.rawObservation && (
                                                <IconButton
                                                  size="small"
                                                  onClick={() => {
                                                    setSelectedPdfRow(item.rawObservation);
                                                    setPdfDialogOpen(true);
                                                  }}
                                                  sx={{
                                                    p: 0.2,
                                                    color: '#ef4444',
                                                    '&:hover': { bgcolor: alpha('#ef4444', 0.1) }
                                                  }}
                                                  title="View PDF Report"
                                                >
                                                  <IconFileTypePdf size={13} />
                                                </IconButton>
                                              )}
                                            </Stack>
                                          );
                                        }

                                        if (item.executionStatus === 'OVERDUE') {
                                          return (
                                            <Chip
                                              key={item.id}
                                              label="Overdue"
                                              size="small"
                                              color="error"
                                              sx={{
                                                height: 18,
                                                fontSize: '0.62rem',
                                                fontWeight: 800,
                                                borderRadius: '4px'
                                              }}
                                            />
                                          );
                                        }

                                        return (
                                          <Chip
                                            key={item.id}
                                            label="Pending"
                                            size="small"
                                            color="warning"
                                            sx={{
                                              height: 18,
                                              fontSize: '0.62rem',
                                              fontWeight: 800,
                                              borderRadius: '4px'
                                            }}
                                          />
                                        );
                                      })}
                                    </Stack>
                                  )}
                                </TableCell>
                              </React.Fragment>
                            );
                          })}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total Row Count Badge */}
            <Box sx={{ px: 2, py: 0.8, display: 'flex', alignItems: 'center', gap: 1, borderTop: `1px solid ${tableBorderColor}` }}>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 600 }}>
                Total Records:
              </Typography>
              <Chip
                label={activeMatrixRows.length}
                size="small"
                sx={{ height: 20, fontSize: '0.72rem', fontWeight: 800, bgcolor: isDark ? alpha('#fff', 0.08) : '#f1f5f9', borderRadius: '4px' }}
              />
            </Box>
          </Paper>
        )}

        {/* 2. Detailed Tabular View */}
        {subView === 'detailed' && (
          <Box
            id="bos_detailed_datatable_container"
            sx={{
              width: '100%',
              height: 'calc(100vh - 335px)',
              minHeight: 'calc(100vh - 335px)',
              maxHeight: 'calc(100vh - 335px)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <BOSDataTable
              columns={activeDetailedColumns}
              rows={detailedRowsSorted}
              page={page}
              size={size}
              totalCount={detailedRowsSorted.length}
              loading={loading}
              onPageChange={setPage}
              onSizeChange={(s) => {
                setSize(s);
                setPage(0);
              }}
              disableSearchFilter={true}
              sx={{
                height: 'calc(100vh - 330px)',
                minHeight: 'calc(100vh - 330px)',
                maxHeight: 'calc(100vh - 330px)'
              }}
            />
          </Box>
        )}

        {/* 3. 1-Click PDF Inspection Modal */}
        <AuditObservationPDFDialog
          open={pdfDialogOpen}
          onClose={() => setPdfDialogOpen(false)}
          observation={selectedPdfRow}
        />

        {/* 4. Copy to Clipboard Toast Notification */}
        <Snackbar
          open={copySnackbar.open}
          autoHideDuration={3000}
          onClose={() => setCopySnackbar({ open: false, title: '' })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setCopySnackbar({ open: false, title: '' })}
            severity="success"
            variant="filled"
            sx={{ width: '100%', fontWeight: 700, borderRadius: '8px' }}
          >
            {copySnackbar.title}
          </Alert>
        </Snackbar>

        {/* 5. Full-Data Matrix PDF Export Dialog */}
        <AuditVsActualPDFDialog
          open={pdfOpen}
          onClose={() => setPdfOpen(false)}
          rows={activeMatrixRows}
          monthColumns={monthColumns}
          isDeptTab={isDeptTab}
          selectedYear={selectedYear}
          filters={globalFilters}
        />
      </MainCard>
    );
  }
