import { format } from 'date-fns';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Stack,
  Tooltip,
  IconButton,
  Chip,
  Button,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  Collapse,
  Grid,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Rating,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconReportAnalytics,
  IconFileTypePdf,
  IconRefresh,
  IconDownload,
  IconPrinter,
  IconChevronDown,
  IconChevronUp,
  IconTable,
  IconLayoutGrid,
  IconBuilding,
  IconCalendarEvent,
  IconBuildingStore,
  IconUsers,
  IconSettings,
  IconPencil,
  IconDeviceDesktop,
  IconBox,
  IconCertificate,
  IconCheckbox,
  IconCategory,
  IconStarFilled,
  IconCopy,
  IconCheck,
  IconDeviceFloppy,
  IconPhoto,
  IconCalendarTime,
  IconAlertTriangle
} from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSExportButton } from 'ui-component/bos';
import { useDispatch, useSelector } from 'react-redux';
import { setFilterConfig } from 'store/slices/search';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import useBOSFilters from 'hooks/useBOSFilters';
import useRealtimeRefresh from 'hooks/useRealtimeRefresh';
import { API_PATHS } from 'utils/api-constants';
import html2canvas from 'html2canvas';
import AuditObservationPDFDialog from '../AuditObservation/AuditObservationPDFDialog';
import AuditScoreReportPDFDialog from './AuditScoreReportPDFDialog';

// Main Table Columns for Detailed View
const detailedColumns = [
  { id: 'index', label: 'Sl.No', minWidth: 60, align: 'center' },
  { id: 'observationNo', label: 'Observation No', minWidth: 140, bold: true },
  { id: 'observationDate', label: 'Date', minWidth: 110, align: 'center' },
  { id: 'scheduleNo', label: 'Schedule No', minWidth: 130 },
  { id: 'auditType', label: 'Audit Type', minWidth: 140 },
  { id: 'departmentName', label: 'Department Name', minWidth: 160 },
  { id: 'auditee', label: 'Auditee', minWidth: 150 },
  { id: 'auditor', label: 'Auditor', minWidth: 150 },
  { id: 'complianceCount', label: 'Compliance', minWidth: 100, align: 'center' },
  { id: 'ncrCount', label: 'NC', minWidth: 80, align: 'center' },
  { id: 'ofiCount', label: 'OFI', minWidth: 80, align: 'center' },
  { id: 'auditScore', label: 'Score', minWidth: 90, align: 'center', bold: true },
  { id: 'status', label: 'Status', minWidth: 100, align: 'center' },
  { id: 'pdf', label: 'PDF', minWidth: 70, align: 'center' }
];

const dateStrCache = new Map();
const formatDateStr = (dateVal) => {
  if (!dateVal) return '-';
  if (dateStrCache.has(dateVal)) return dateStrCache.get(dateVal);
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) {
      dateStrCache.set(dateVal, String(dateVal));
      return String(dateVal);
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const res = `${day}/${month}/${year}`;
    dateStrCache.set(dateVal, res);
    return res;
  } catch (e) {
    return String(dateVal);
  }
};

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
        res = new Date(year, month, day);
      } else if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
        const parts = s.substring(0, 10).split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        res = new Date(year, month, day);
      } else {
        const parsed = new Date(s);
        if (!isNaN(parsed.getTime())) res = parsed;
      }
    }
  } else if (typeof dateVal === 'number') {
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) res = parsed;
  }

  parseDateObjCache.set(dateVal, res);
  return res;
};

const isoDateCache = new Map();
const formatIsoDate = (d) => {
  if (!d) return '';
  if (isoDateCache.has(d)) return isoDateCache.get(d);
  const dateObj = parseDateObj(d);
  if (!dateObj) return '';
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const res = `${yyyy}-${mm}-${dd}`;
  isoDateCache.set(d, res);
  return res;
};

// Curated Unique Color Themes Array for Sorted Cards (Index 0 = Red for lowest score, followed by distinct vibrant themes)
const CARD_PALETTES = [
  // 0: Lowest score (Critical Red)
  { primary: '#dc2626', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', bgLight: '#fef2f2', borderLight: '#fca5a5' },
  // 1: Deep Orange
  { primary: '#ea580c', gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', bgLight: '#fff7ed', borderLight: '#ffedd5' },
  // 2: Royal Blue
  { primary: '#2563eb', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', bgLight: '#eff6ff', borderLight: '#bfdbfe' },
  // 3: Golden Amber
  { primary: '#d97706', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', bgLight: '#fffbeb', borderLight: '#fde68a' },
  // 4: Indigo
  { primary: '#4f46e5', gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', bgLight: '#eef2ff', borderLight: '#c7d2fe' },
  // 5: Violet / Purple
  { primary: '#7c3aed', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', bgLight: '#f5f3ff', borderLight: '#ddd6fe' },
  // 6: Teal
  { primary: '#0d9488', gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', bgLight: '#f0fdfa', borderLight: '#99f6e4' },
  // 7: Sky Blue / Cyan
  { primary: '#0284c7', gradient: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', bgLight: '#f0f9ff', borderLight: '#bae6fd' },
  // 8: Rose / Pink Red
  { primary: '#e11d48', gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', bgLight: '#fff1f2', borderLight: '#fecdd3' },
  // 9: Fuchsia / Magenta
  { primary: '#c026d3', gradient: 'linear-gradient(135deg, #d946ef 0%, #c026d3 100%)', bgLight: '#fdf4ff', borderLight: '#f5d0fe' },
  // 10: Emerald Green
  { primary: '#059669', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', bgLight: '#ecfdf5', borderLight: '#a7f3d0' },
  // 11: Lime Green
  { primary: '#65a30d', gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)', bgLight: '#f7fee7', borderLight: '#d9f99d' },
  // 12: Deep Sapphire Blue
  { primary: '#1e40af', gradient: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', bgLight: '#eff6ff', borderLight: '#93c5fd' },
  // 13: Coral Warm Red
  { primary: '#f43f5e', gradient: 'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)', bgLight: '#fff1f2', borderLight: '#fda4af' },
  // 14: Dark Cyan
  { primary: '#0891b2', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', bgLight: '#ecfeff', borderLight: '#a5f3fc' }
];

// Distinct Department Theme & Palette Configuration with Caching
const deptThemeCache = new Map();
const getDeptTheme = (name, cardIndex = null) => {
  const n = String(name || '').toUpperCase();
  let baseTheme;
  if (cardIndex !== null && cardIndex !== undefined && cardIndex >= 0) {
    baseTheme = CARD_PALETTES[cardIndex % CARD_PALETTES.length];
  } else {
    if (deptThemeCache.has(n)) return deptThemeCache.get(n);
    if (n.includes('PLAN')) baseTheme = CARD_PALETTES[10];
    else if (n.includes('STORE')) baseTheme = CARD_PALETTES[3];
    else if (n.includes('HR') || n.includes('ADMIN')) baseTheme = CARD_PALETTES[5];
    else if (n.includes('PROD')) baseTheme = CARD_PALETTES[7];
    else if (n.includes('DESIGN') || n.includes('DEV')) baseTheme = CARD_PALETTES[8];
    else baseTheme = CARD_PALETTES[2];
  }

  let icon = <IconBuilding size={22} />;
  if (n.includes('PLAN')) icon = <IconCalendarEvent size={22} />;
  else if (n.includes('STORE')) icon = <IconBuildingStore size={22} />;
  else if (n.includes('HR') || n.includes('ADMIN')) icon = <IconUsers size={22} />;
  else if (n.includes('PROD')) icon = <IconSettings size={22} />;
  else if (n.includes('DESIGN') || n.includes('DEV')) icon = <IconPencil size={22} />;
  else if (cardIndex === 0) icon = <IconAlertTriangle size={22} />;

  const res = { ...baseTheme, icon };
  if (cardIndex === null || cardIndex === undefined) deptThemeCache.set(n, res);
  return res;
};

// Distinct Audit Type Theme Configuration with Caching
const auditTypeThemeCache = new Map();
const getAuditTypeTheme = (name, cardIndex = null) => {
  const n = String(name || '').toUpperCase();
  let baseTheme;
  if (cardIndex !== null && cardIndex !== undefined && cardIndex >= 0) {
    baseTheme = CARD_PALETTES[cardIndex % CARD_PALETTES.length];
  } else {
    if (auditTypeThemeCache.has(n)) return auditTypeThemeCache.get(n);
    if (n.includes('SCREEN') || n.includes('ERP')) baseTheme = CARD_PALETTES[7];
    else if (n.includes('STOCK') || n.includes('QTY')) baseTheme = CARD_PALETTES[3];
    else if (n.includes('ISO') || n.includes('EMS')) baseTheme = CARD_PALETTES[10];
    else if (n.includes('5S')) baseTheme = CARD_PALETTES[5];
    else baseTheme = CARD_PALETTES[4];
  }

  let icon = <IconCategory size={22} />;
  if (n.includes('SCREEN') || n.includes('ERP')) icon = <IconDeviceDesktop size={22} />;
  else if (n.includes('STOCK') || n.includes('QTY')) icon = <IconBox size={22} />;
  else if (n.includes('ISO') || n.includes('EMS')) icon = <IconCertificate size={22} />;
  else if (n.includes('5S')) icon = <IconCheckbox size={22} />;
  else if (cardIndex === 0) icon = <IconAlertTriangle size={22} />;

  const res = { ...baseTheme, icon };
  if (cardIndex === null || cardIndex === undefined) auditTypeThemeCache.set(n, res);
  return res;
};

// ══════════════════════════════════════════════════════════════════════
// ULTRA-FAST PURE CANVAS 2D RENDERER WITH RICH GRADIENT STYLES
// ══════════════════════════════════════════════════════════════════════

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function getThemeGradientColors(name) {
  const n = String(name || '').toUpperCase();
  if (n.includes('SCREEN') || n.includes('ERP')) return ['#0ea5e9', '#0284c7'];
  if (n.includes('STOCK') || n.includes('QTY')) return ['#fbbf24', '#d97706'];
  if (n.includes('ISO') || n.includes('EMS') || n.includes('PLAN')) return ['#10b981', '#059669'];
  if (n.includes('5S') || n.includes('HR') || n.includes('ADMIN')) return ['#8b5cf6', '#6366f1'];
  if (n.includes('SUPPLIER')) return ['#4f46e5', '#3730a3'];
  if (n.includes('PROD')) return ['#0ea5e9', '#0284c7'];
  if (n.includes('DESIGN') || n.includes('DEV')) return ['#f43f5e', '#e11d48'];
  return ['#3b82f6', '#1d4ed8'];
}

function createLinearGrad(ctx, x0, y0, x1, y1, colors) {
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[1]);
  return grad;
}

function renderDepartmentCardCanvas(d, itemsCount) {
  const width = 420;
  const height = 340;
  const scale = 2; // HD Retina resolution

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const deptTheme = getDeptTheme(d.departmentName);
  const gradColors = getThemeGradientColors(d.departmentName);
  const scoreNum = Number(d.avgScore) || 0;
  const starValue = Number(Math.min(5, Math.max(0, scoreNum / 2)).toFixed(1));
  const pct = Math.min(100, Math.max(0, Math.round(scoreNum <= 10 ? scoreNum * 10 : scoreNum)));

  const isSatisfactory = d.color === 'warning' || (scoreNum < 7 && scoreNum >= 4);
  const isNeedsAttention = d.color === 'error' || scoreNum < 4;
  const badgeBg = isNeedsAttention ? '#fef2f2' : isSatisfactory ? '#fef8e7' : '#ecfdf5';
  const badgeText = isNeedsAttention ? '#ef4444' : isSatisfactory ? '#d97706' : '#059669';

  // 1. Card Container (White background + soft border)
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, 4, 4, width - 8, height - 8, 16);
  ctx.fill();
  ctx.strokeStyle = deptTheme.primary + '40';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 2. Top Color Accent Gradient Line
  ctx.save();
  drawRoundedRect(ctx, 4, 4, width - 8, 8, 4);
  ctx.clip();
  ctx.fillStyle = createLinearGrad(ctx, 4, 4, width - 4, 12, gradColors);
  ctx.fillRect(4, 4, width - 8, 8);
  ctx.restore();

  // 3. Header: Gradient Avatar Circle + Department Title
  ctx.fillStyle = createLinearGrad(ctx, 20, 27, 56, 63, gradColors);
  ctx.beginPath();
  ctx.arc(38, 45, 18, 0, Math.PI * 2);
  ctx.fill();

  // Avatar Letter
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const deptDisplayName = String(d.departmentName || 'General');
  ctx.fillText(deptDisplayName.charAt(0).toUpperCase(), 38, 45);

  // Department Name
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText(deptDisplayName.toUpperCase(), 66, 38);

  // Schedules info
  ctx.fillStyle = '#64748b';
  ctx.font = '600 12px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`${d.scheduleCount || 1} Schedule${(d.scheduleCount || 1) > 1 ? 's' : ''} • ${d.count || itemsCount || 1} Audits`, 66, 54);

  // Performance Grade Pill (Top Right)
  ctx.fillStyle = badgeBg;
  drawRoundedRect(ctx, width - 110, 30, 90, 26, 13);
  ctx.fill();
  ctx.strokeStyle = badgeText + '60';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = badgeText;
  ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
  ctx.fillText(d.grade || 'Excellent', width - 65, 47);

  // 4. Hero Audit Score Box (Gradient Tint)
  ctx.fillStyle = deptTheme.primary + '10';
  drawRoundedRect(ctx, 20, 78, width - 40, 76, 12);
  ctx.fill();
  ctx.strokeStyle = deptTheme.primary + '30';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Score Title & Stars
  ctx.textAlign = 'left';
  ctx.fillStyle = deptTheme.primary;
  ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
  ctx.fillText('AUDIT SCORE', 36, 100);

  // Stars
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  const fullStars = Math.floor(starValue);
  const starsStr = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
  ctx.fillText(starsStr, 36, 124);

  ctx.fillStyle = '#d97706';
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`${starValue}/5`, 125, 123);

  // Big Vibrant Score Gradient Badge
  ctx.fillStyle = createLinearGrad(ctx, width - 115, 88, width - 35, 144, gradColors);
  drawRoundedRect(ctx, width - 115, 88, 80, 56, 12);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
  ctx.fillText(String(d.avgScore || '0.0'), width - 75, 118);
  ctx.font = 'bold 9px "Segoe UI", Arial, sans-serif';
  ctx.fillText('SCORE', width - 75, 134);

  // 5. 3 Metric Tiles (Compliance, OFI, Total NCR)
  const tileWidth = (width - 60) / 3;
  const tileY = 168;
  const tileHeight = 60;

  // Comp Tile
  ctx.fillStyle = '#f0fdf4';
  drawRoundedRect(ctx, 20, tileY, tileWidth, tileHeight, 10);
  ctx.fill();
  ctx.strokeStyle = '#bbf7d0';
  ctx.stroke();

  ctx.fillStyle = '#15803d';
  ctx.font = '600 11px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Compliance', 20 + tileWidth / 2, tileY + 20);
  ctx.fillStyle = '#16a34a';
  ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText(String(d.avgCompliance || '0.0'), 20 + tileWidth / 2, tileY + 46);

  // OFI Tile
  ctx.fillStyle = '#fffbeb';
  drawRoundedRect(ctx, 20 + tileWidth + 10, tileY, tileWidth, tileHeight, 10);
  ctx.fill();
  ctx.strokeStyle = '#fef3c7';
  ctx.stroke();

  ctx.fillStyle = '#b45309';
  ctx.font = '600 11px "Segoe UI", Arial, sans-serif';
  ctx.fillText('OFI', 20 + tileWidth + 10 + tileWidth / 2, tileY + 20);
  ctx.fillStyle = '#d97706';
  ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText(String(d.avgOfi || '0.0'), 20 + tileWidth + 10 + tileWidth / 2, tileY + 46);

  // Total NCR Tile
  const hasNcr = (d.totalNcr || 0) > 0;
  ctx.fillStyle = hasNcr ? '#fef2f2' : '#f8fafc';
  drawRoundedRect(ctx, 20 + (tileWidth + 10) * 2, tileY, tileWidth, tileHeight, 10);
  ctx.fill();
  ctx.strokeStyle = hasNcr ? '#fecaca' : '#e2e8f0';
  ctx.stroke();

  ctx.fillStyle = hasNcr ? '#b91c1c' : '#64748b';
  ctx.font = '600 11px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Total NCR', 20 + (tileWidth + 10) * 2 + tileWidth / 2, tileY + 20);
  ctx.fillStyle = hasNcr ? '#dc2626' : '#0f172a';
  ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
  ctx.fillText(String(d.totalNcr || '0'), 20 + (tileWidth + 10) * 2 + tileWidth / 2, tileY + 46);

  // 6. Progress Bar & Index Percentage
  const barY = 250;
  const barWidth = width - 95;
  ctx.fillStyle = '#e2e8f0';
  drawRoundedRect(ctx, 20, barY, barWidth, 8, 4);
  ctx.fill();

  if (pct > 0) {
    ctx.fillStyle = createLinearGrad(ctx, 20, barY, 20 + (barWidth * pct) / 100, barY + 8, gradColors);
    drawRoundedRect(ctx, 20, barY, (barWidth * pct) / 100, 8, 4);
    ctx.fill();
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = deptTheme.primary;
  ctx.font = '900 14px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`${pct}%`, width - 20, barY + 8);

  return canvas;
}

function renderAuditTypeCardCanvas(t, itemsCount) {
  const width = 420;
  const height = 350;
  const scale = 2; // HD Retina resolution

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const typeTheme = getAuditTypeTheme(t.auditType);
  const gradColors = getThemeGradientColors(t.auditType);
  const scoreNum = Number(t.avgScore) || 0;
  const starValue = Number(Math.min(5, Math.max(0, scoreNum / 2)).toFixed(1));
  const pct = Math.min(100, Math.max(0, Math.round(scoreNum <= 10 ? scoreNum * 10 : scoreNum)));

  // 1. Outer Container
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, 4, 4, width - 8, height - 8, 18);
  ctx.fill();
  ctx.strokeStyle = typeTheme.primary + '40';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 2. Gradient Top Header Banner
  ctx.save();
  drawRoundedRect(ctx, 4, 4, width - 8, 62, 16);
  ctx.clip();
  ctx.fillStyle = createLinearGrad(ctx, 4, 4, width - 4, 66, gradColors);
  ctx.fillRect(4, 4, width - 8, 62);
  ctx.restore();

  // Top Banner Content: Title & Pill Badges
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.font = '900 16px "Segoe UI", Arial, sans-serif';
  const typeDisplayName = String(t.auditType || 'General Audit');
  ctx.fillText(typeDisplayName.toUpperCase(), 20, 30);

  ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(`${t.departmentCount || 1} Depts   |   ${t.scheduleCount || 1} Sched   |   ${t.count || itemsCount || 1} Audits`, 20, 50);

  // 3. Centered Score Showcase
  ctx.fillStyle = '#f8fafc';
  drawRoundedRect(ctx, 20, 78, width - 40, 74, 14);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = typeTheme.primary;
  ctx.font = '900 28px "Segoe UI", Arial, sans-serif';
  ctx.fillText(String(t.avgScore || '0.0'), width / 2 - 18, 114);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.fillText('/ 10', width / 2 + 25, 114);

  // Stars
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
  const fullStars = Math.floor(starValue);
  const starsStr = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
  ctx.fillText(`${starsStr}  ${starValue}/5`, width / 2, 138);

  // 4. Audited Departments
  if (t.departmentsList && t.departmentsList.length > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Audited Departments: ' + t.departmentsList.join(', '), 22, 172);
  }

  // 5. 3 Connected Metrics Strip
  const stripY = 190;
  const stripWidth = width - 40;
  const colW = stripWidth / 3;

  ctx.fillStyle = '#f8fafc';
  drawRoundedRect(ctx, 20, stripY, stripWidth, 54, 10);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  // Divider lines
  ctx.beginPath();
  ctx.moveTo(20 + colW, stripY);
  ctx.lineTo(20 + colW, stripY + 54);
  ctx.moveTo(20 + colW * 2, stripY);
  ctx.lineTo(20 + colW * 2, stripY + 54);
  ctx.strokeStyle = '#e2e8f0';
  ctx.stroke();

  ctx.textAlign = 'center';
  // Comp
  ctx.fillStyle = '#15803d';
  ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Compliance', 20 + colW / 2, stripY + 20);
  ctx.fillStyle = '#16a34a';
  ctx.font = '900 17px "Segoe UI", Arial, sans-serif';
  ctx.fillText(String(t.avgCompliance || '0.0'), 20 + colW / 2, stripY + 42);

  // OFI
  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
  ctx.fillText('OFI', 20 + colW * 1.5, stripY + 20);
  ctx.fillStyle = '#d97706';
  ctx.font = '900 17px "Segoe UI", Arial, sans-serif';
  ctx.fillText(String(t.avgOfi || '0.0'), 20 + colW * 1.5, stripY + 42);

  // NC
  const hasNc = (t.totalNcr || 0) > 0;
  ctx.fillStyle = hasNc ? '#b91c1c' : '#64748b';
  ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Total NC', 20 + colW * 2.5, stripY + 20);
  ctx.fillStyle = hasNc ? '#dc2626' : '#0f172a';
  ctx.font = '900 17px "Segoe UI", Arial, sans-serif';
  ctx.fillText(String(t.totalNcr || '0'), 20 + colW * 2.5, stripY + 42);

  // 6. Progress Bar
  const barY = 264;
  const barWidth = width - 95;
  ctx.fillStyle = '#e2e8f0';
  drawRoundedRect(ctx, 20, barY, barWidth, 8, 4);
  ctx.fill();

  if (pct > 0) {
    ctx.fillStyle = createLinearGrad(ctx, 20, barY, 20 + (barWidth * pct) / 100, barY + 8, gradColors);
    drawRoundedRect(ctx, 20, barY, (barWidth * pct) / 100, 8, 4);
    ctx.fill();
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = typeTheme.primary;
  ctx.font = '900 14px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`${pct}%`, width - 20, barY + 8);

  return canvas;
}

function renderAuditTypeDeptBreakdownCanvas(t) {
  const width = 440;
  const items = t.items || [];
  const cardH = 58;
  const headerH = 65;
  const gap = 8;
  const height = headerH + 16 + Math.max(1, items.length) * (cardH + gap) + 12;
  const scale = 2;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const typeTheme = getAuditTypeTheme(t.auditType);
  const gradColors = getThemeGradientColors(t.auditType);

  const totalScore = items.reduce((acc, r) => acc + (Number(r.auditScore) || 0), 0);
  const avgDbScore = items.length > 0 ? (totalScore / items.length).toFixed(1) : '0.0';

  // 1. Outer Container
  ctx.fillStyle = '#ffffff';
  drawRoundedRect(ctx, 4, 4, width - 8, height - 8, 16);
  ctx.fill();
  ctx.strokeStyle = typeTheme.primary + '40';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 2. Top Header Gradient Banner (135° diagonal gradient)
  ctx.save();
  drawRoundedRect(ctx, 4, 4, width - 8, headerH, 16);
  ctx.clip();
  ctx.fillStyle = createLinearGrad(ctx, 4, 4, width - 4, headerH + 4, gradColors);
  ctx.fillRect(4, 4, width - 8, headerH);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.font = '900 15px "Segoe UI", Arial, sans-serif';
  const typeDisplayName = String(t.auditType || 'General Audit');
  ctx.fillText(typeDisplayName.toUpperCase(), 18, 30);

  ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(`${t.departmentCount || 1} Depts   |   ${t.scheduleCount || 1} Sched   |   ${items.length} Audits`, 18, 50);

  // Overall Score Glassmorphism Pill in Header Top Right
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  drawRoundedRect(ctx, width - 82, 13, 62, 39, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '900 15px "Segoe UI", Arial, sans-serif';
  ctx.fillText(`${avgDbScore}%`, width - 51, 31);
  ctx.font = 'bold 8px "Segoe UI", Arial, sans-serif';
  ctx.fillText('SCORE', width - 51, 43);

  // 3. Mini-Cards for each Department Audit
  let curY = headerH + 16;
  items.forEach((r) => {
    const deptGradColors = getThemeGradientColors(r.departmentName);

    // Inner Mini Card Background
    ctx.fillStyle = '#f8fafc';
    drawRoundedRect(ctx, 16, curY, width - 32, cardH, 10);
    ctx.fill();
    ctx.strokeStyle = typeTheme.primary + '25';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Dept Gradient Avatar
    ctx.fillStyle = createLinearGrad(ctx, 22, curY + 15, 50, curY + 43, deptGradColors);
    ctx.beginPath();
    ctx.arc(36, curY + cardH / 2, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((r.departmentName || 'G').charAt(0).toUpperCase(), 36, curY + cardH / 2);

    // Dept Name & Mini Stats
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.fillText((r.departmentName || 'General').toUpperCase(), 58, curY + 20);

    ctx.fillStyle = '#64748b';
    ctx.font = '600 10.5px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`Comp: ${r.complianceCount || 0}   |   NC: ${r.ncrCount || 0}`, 58, curY + 40);

    // Obs No Chip
    ctx.fillStyle = '#e2e8f0';
    drawRoundedRect(ctx, width - 180, curY + 10, 95, 20, 5);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 10px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.observationNo || '-', width - 132, curY + 23);

    // Observation Date below Observation No
    ctx.fillStyle = '#64748b';
    ctx.font = '600 9.5px "Segoe UI", Arial, sans-serif';
    ctx.fillText(formatDateStr(r.observationDate), width - 132, curY + 41);

    // Score Gradient Badge (Right)
    ctx.fillStyle = createLinearGrad(ctx, width - 72, curY + 11, width - 26, curY + 45, gradColors);
    drawRoundedRect(ctx, width - 72, curY + 11, 46, 34, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 14px "Segoe UI", Arial, sans-serif';
    ctx.fillText(String(r.auditScore || 0), width - 49, curY + 28);
    ctx.font = 'bold 8px "Segoe UI", Arial, sans-serif';
    ctx.fillText('SCORE', width - 49, 40);

    curY += cardH + gap;
  });

  return canvas;
}

// ══════════════════════════════════════════════════════════════════════
// LIVE CARD & CLIPBOARD WRITE HELPERS (FULL LIST CAPTURE)
// ══════════════════════════════════════════════════════════════════════

// Full-Height Live DOM Snapshot Engine
const captureElementWithFullHeight = async (element, scale = 1.6) => {
  if (!element) return null;

  // 1. Save original styles and state of collapsed items
  const collapsedItems = element.querySelectorAll('[data-collapsed-item="true"]');
  const scrollContainers = element.querySelectorAll('*');
  const originalScrollStyles = [];

  // Temporarily reveal all items & remove max-height on the live DOM for 1 frame
  collapsedItems.forEach((el) => {
    el.dataset.prevDisplay = el.style.display;
    el.style.display = 'block';
  });

  scrollContainers.forEach((container) => {
    if (container.style.maxHeight || container.style.overflowY) {
      originalScrollStyles.push({
        container,
        maxHeight: container.style.maxHeight,
        overflowY: container.style.overflowY
      });
      container.style.maxHeight = 'none';
      container.style.overflowY = 'visible';
    }
  });

  try {
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: false,
      allowTaint: true,
      imageTimeout: 0,
      ignoreElements: (el) =>
        el.getAttribute?.('data-html2canvas-ignore') === 'true' ||
        el.dataset?.html2canvasIgnore === 'true',
      onclone: (clonedDoc, clonedEl) => {
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.margin = '0';
        clonedEl.style.transform = 'none';
        clonedEl.style.maxHeight = 'none';
        clonedEl.style.height = 'auto';
        clonedEl.style.overflow = 'visible';
      }
    });
    return canvas;
  } finally {
    // 2. Instantly restore original styles
    collapsedItems.forEach((el) => {
      el.style.display = el.dataset.prevDisplay || 'none';
      delete el.dataset.prevDisplay;
    });
    originalScrollStyles.forEach(({ container, maxHeight, overflowY }) => {
      container.style.maxHeight = maxHeight;
      container.style.overflowY = overflowY;
    });
  }
};

// High-Speed Live Card Image Capture & Copy to Clipboard
const copyCardElementAsImage = (element, title, onDone, onStart) => {
  if (!element) return;
  if (onStart) onStart();

  if (typeof window.ClipboardItem === 'undefined' || !navigator.clipboard || !navigator.clipboard.write) {
    if (onDone) onDone(false, title);
    return;
  }

  const imagePromise = new Promise((resolve, reject) => {
    captureElementWithFullHeight(element, 1.6)
      .then((canvas) => {
        if (!canvas) {
          reject(new Error('Canvas creation failed'));
          return;
        }
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Blob conversion failed'));
        }, 'image/png');
      })
      .catch(reject);
  });

  try {
    const clipboardItem = new ClipboardItem({ 'image/png': imagePromise });
    navigator.clipboard
      .write([clipboardItem])
      .then(() => {
        if (onDone) onDone(true, title);
      })
      .catch((err) => {
        console.error('clipboard.write error:', err);
        if (onDone) onDone(false, title);
      });
  } catch (err) {
    if (onDone) onDone(false, title);
  }
};

// 1-Click Instant Save Live Card Image
const saveCardElementAsImage = (element, title, onDone, onStart) => {
  if (!element) return;
  if (onStart) onStart();

  captureElementWithFullHeight(element, 1.8)
    .then((canvas) => {
      if (!canvas) {
        if (onDone) onDone(false, title);
        return;
      }
      const safeName = (title || 'Audit_Card').replace(/[^a-zA-Z0-9_-]/g, '_');
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${safeName}_Audit_Score.png`;
      a.click();
      if (onDone) onDone(true, title);
    })
    .catch((err) => {
      console.error('Save image failed:', err);
      if (onDone) onDone(false, title);
    });
};

const copyCanvasToClipboard = (canvas, title, onDone) => {
  if (!canvas) return;

  canvas.toBlob((blob) => {
    if (!blob) {
      if (onDone) onDone(false, title);
      return;
    }
    try {
      const item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard
        .write([item])
        .then(() => {
          if (onDone) onDone(true, title);
        })
        .catch((err) => {
          console.error('Clipboard write error:', err);
          if (onDone) onDone(false, title);
        });
    } catch (err) {
      console.error('ClipboardItem error:', err);
      if (onDone) onDone(false, title);
    }
  }, 'image/png');
};

const saveCanvasAsPng = (canvas, title, onDone) => {
  if (!canvas) return;
  const safeName = (title || 'Audit_Score_Card').replace(/[^a-zA-Z0-9_-]/g, '_');
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `${safeName}.png`;
  a.click();
  if (onDone) onDone(true, title);
};

// Render All Cards Grid to single Canvas
function renderAllCardsCanvas(dataList, isAuditType = false) {
  const cardW = 420;
  const cardH = isAuditType ? 350 : 340;
  const cols = 3;
  const rows = Math.ceil(dataList.length / cols);
  const gap = 16;
  const padding = 20;

  const totalW = padding * 2 + cols * cardW + (cols - 1) * gap;
  const totalH = padding * 2 + rows * cardH + (rows - 1) * gap;

  const masterCanvas = document.createElement('canvas');
  masterCanvas.width = totalW * 2;
  masterCanvas.height = totalH * 2;
  const ctx = masterCanvas.getContext('2d');
  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, totalW, totalH);

  dataList.forEach((item, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = padding + col * (cardW + gap);
    const y = padding + row * (cardH + gap);

    const c = isAuditType ? renderAuditTypeCardCanvas(item, 1) : renderDepartmentCardCanvas(item, 1);
    ctx.drawImage(c, 0, 0, c.width, c.height, x, y, cardW, cardH);
  });

  return masterCanvas;
}

// Collapsible Row Component for Department Score Summary Table
const DepartmentSummaryRow = React.memo(function DepartmentSummaryRow({ d, items, onOpenPdf }) {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow
        hover
        onClick={() => setOpen(!open)}
        sx={{
          cursor: 'pointer',
          bgcolor: open ? 'action.selected' : 'inherit',
          transition: 'background-color 0.2s',
          '& > td': { py: 0.75, px: 1.5 },
          '& > *': { borderBottom: open ? 'unset' : undefined }
        }}
      >
        <TableCell sx={{ fontWeight: 600 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(!open);
              }}
              color="primary"
            >
              {open ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            </IconButton>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontStyle: 'normal' }}>
              {d.departmentName}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell align="center">
          <Chip label={d.scheduleCount || 1} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
        </TableCell>
        <TableCell align="center">
          <Chip label={d.count} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        </TableCell>
        <TableCell align="center" sx={{ color: 'success.main', fontWeight: 700, fontStyle: 'normal' }}>
          {d.avgCompliance}
        </TableCell>
        <TableCell align="center" sx={{ color: 'warning.main', fontWeight: 700, fontStyle: 'normal' }}>
          {d.avgOfi}
        </TableCell>
        <TableCell align="center" sx={{ color: 'error.main', fontWeight: 700, fontStyle: 'normal' }}>
          {d.avgNcr}
        </TableCell>
        <TableCell align="center">
          <Chip
            label={d.totalNcr}
            size="small"
            color={d.totalNcr > 0 ? 'error' : 'default'}
            variant={d.totalNcr > 0 ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700 }}
          />
        </TableCell>

        {/* Super Highlighted AVG AUDIT SCORE Column */}
        <TableCell align="center">
          <Chip
            label={d.avgScore}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.85rem',
              px: 1,
              bgcolor: 'primary.main',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(25, 118, 210, 0.35)',
              borderRadius: '12px'
            }}
          />
        </TableCell>

        <TableCell align="center">
          <Chip label={d.grade} color={d.color} size="small" sx={{ fontWeight: 600 }} />
        </TableCell>
      </TableRow>

      {/* Expanded Sub-Table */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1.5, p: 2, bgcolor: 'background.default', borderRadius: 2, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.06)' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main', fontStyle: 'normal' }}>
                Observation Details for {d.departmentName} ({items.length} records)
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Observation No</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Schedule No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Audit Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Auditee</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Auditor</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Comp</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>NC</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>OFI</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Score</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>PDF</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((r, idx) => (
                      <TableRow key={r.id || idx} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{r.observationNo}</TableCell>
                        <TableCell align="center">{formatDateStr(r.observationDate)}</TableCell>
                        <TableCell>{r.auditScheduleNo || '-'}</TableCell>
                        <TableCell>{r.auditType || '-'}</TableCell>
                        <TableCell>{r.auditee ? String(r.auditee).split(' - ')[0] : '-'}</TableCell>
                        <TableCell>{r.auditor ? String(r.auditor).split(' - ')[0] : '-'}</TableCell>
                        <TableCell align="center">
                          <Chip label={r.complianceCount || 0} size="small" color="success" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={r.ncrCount || 0}
                            size="small"
                            color={(r.ncrCount || 0) > 0 ? 'error' : 'default'}
                            variant={(r.ncrCount || 0) > 0 ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={r.ofiCount || 0} size="small" color="warning" variant="outlined" />
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {r.auditScore || 0}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={String(r.status || 'OPEN').toUpperCase()}
                            size="small"
                            color={
                              String(r.status).toUpperCase() === 'CLOSED' || String(r.status).toUpperCase() === 'APPROVED'
                                ? 'success'
                                : 'info'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => onOpenPdf(r)}>
                            <IconFileTypePdf size={18} color="#d32f2f" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
});

// Colorful & Star-Rated Department Card Component with Uniform Width & Height & Schedules Count
const DepartmentCard = React.memo(function DepartmentCard({ d, items, cardIndex, onOpenPdf, onCopyNotify, onSaveNotify }) {
  const cardRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const deptTheme = getDeptTheme(d.departmentName, cardIndex);
  const scoreNum = Number(d.avgScore) || 0;
  const starValue = Number(Math.min(5, Math.max(0, scoreNum / 2)).toFixed(1));
  const pct = Math.min(100, Math.max(0, Math.round(scoreNum <= 10 ? scoreNum * 10 : scoreNum)));

  const isSatisfactory = d.color === 'warning' || (scoreNum < 7 && scoreNum >= 4);
  const isNeedsAttention = d.color === 'error' || scoreNum < 4;

  const badgeBg = isNeedsAttention ? '#fef2f2' : isSatisfactory ? '#fef8e7' : '#ecfdf5';
  const badgeText = isNeedsAttention ? '#ef4444' : isSatisfactory ? '#d97706' : '#059669';

  const handleCopy = (e) => {
    e.stopPropagation();
    copyCardElementAsImage(
      cardRef.current,
      d.departmentName,
      (success) => {
        if (success) {
          setCopied(true);
          if (onCopyNotify) onCopyNotify(d.departmentName);
          setTimeout(() => setCopied(false), 2500);
        }
      }
    );
  };

  const handleSave = (e) => {
    e.stopPropagation();
    saveCardElementAsImage(
      cardRef.current,
      `${d.departmentName}_Audit_Score`,
      (success) => {
        if (success && onSaveNotify) onSaveNotify(d.departmentName);
      }
    );
  };

  return (
    <Grid item xs={12} sm={6} md={4} lg={2.4} sx={{ display: 'flex', width: { xs: '100%', md: '24%' } }}>
      <Card
        ref={cardRef}
        elevation={0}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '18px',
          bgcolor: isDark ? 'background.paper' : '#ffffff',
          border: `1.5px solid ${isDark ? theme.palette.divider : deptTheme.borderLight}`,
          boxShadow: isDark
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : `0 6px 20px ${alpha(deptTheme.primary, 0.08)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: `0 12px 32px ${alpha(deptTheme.primary, 0.18)}`,
            transform: 'translateY(-3px)',
            borderColor: deptTheme.primary
          }
        }}
      >
        {/* Top Colorful Gradient Accent Line */}
        <Box sx={{ height: 4, background: deptTheme.gradient, width: '100%' }} />

        <CardContent sx={{ p: 2.2, display: 'flex', flexDirection: 'column', flex: 1, '&:last-child': { pb: 1.8 } }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.8 }}>
            <Stack direction="row" alignItems="center" spacing={1.2}>
              <Avatar
                sx={{
                  background: deptTheme.gradient,
                  color: '#ffffff',
                  width: 40,
                  height: 40,
                  boxShadow: `0 3px 10px ${alpha(deptTheme.primary, 0.4)}`
                }}
              >
                {deptTheme.icon}
              </Avatar>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    color: 'text.primary',
                    fontStyle: 'normal',
                    lineHeight: 1.2
                  }}
                >
                  {d.departmentName}
                </Typography>
                <Typography sx={{ fontStyle: 'normal', fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
                  {d.scheduleCount || 1} Schedule{d.scheduleCount > 1 ? 's' : ''}
                </Typography>
              </Box>
            </Stack>

            {/* Header Right Action Buttons: [Copy], [Save Image], [Grade Chip] */}
            <Stack direction="row" alignItems="center" spacing={0.6}>
              <Tooltip title={copied ? 'Card Copied!' : 'Copy Card (Paste in Word / WordPad)'}>
                <IconButton
                  data-html2canvas-ignore="true"
                  size="small"
                  onClick={handleCopy}
                  disabled={loadingAction}
                  sx={{
                    p: 0.6,
                    color: copied ? '#10b981' : deptTheme.primary,
                    bgcolor: copied ? alpha('#10b981', 0.15) : alpha(deptTheme.primary, 0.1),
                    border: `1px solid ${copied ? '#10b981' : alpha(deptTheme.primary, 0.3)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: alpha(deptTheme.primary, 0.2), transform: 'scale(1.06)' }
                  }}
                >
                  {loadingAction ? <CircularProgress size={15} color="inherit" /> : copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Save Card as PNG Image">
                <IconButton
                  data-html2canvas-ignore="true"
                  size="small"
                  onClick={handleSave}
                  disabled={loadingAction}
                  sx={{
                    p: 0.6,
                    color: 'text.secondary',
                    bgcolor: alpha(theme.palette.divider, 0.08),
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: alpha(deptTheme.primary, 0.15), color: deptTheme.primary, transform: 'scale(1.06)' }
                  }}
                >
                  <IconDeviceFloppy size={16} />
                </IconButton>
              </Tooltip>

              <Chip
                label={d.grade}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  fontStyle: 'normal',
                  bgcolor: badgeBg,
                  color: badgeText,
                  border: `1px solid ${alpha(badgeText, 0.3)}`,
                  borderRadius: '12px',
                  height: 24,
                  px: 0.5
                }}
              />
            </Stack>
          </Stack>

          {/* HERO AUDIT SCORE & STAR RATING VIBRANT SHOWCASE BOX */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${alpha(deptTheme.primary, 0.1)} 0%, ${alpha(deptTheme.primary, 0.03)} 100%)`,
              border: `1.5px solid ${alpha(deptTheme.primary, 0.25)}`,
              mb: 1.8,
              position: 'relative',
              overflow: 'hidden',
              width: '100%'
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography
                  sx={{
                    fontStyle: 'normal',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: deptTheme.primary
                  }}
                >
                  AUDIT SCORE
                </Typography>

                {/* Glowing Star Rating Component */}
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.4 }}>
                  <Rating
                    value={starValue}
                    precision={0.1}
                    readOnly
                    size="small"
                    emptyIcon={<IconStarFilled size={14} style={{ opacity: 0.25 }} />}
                    icon={<IconStarFilled size={14} color="#f59e0b" />}
                    sx={{
                      '& .MuiRating-iconFilled': { color: '#f59e0b', filter: 'drop-shadow(0 1px 2px rgba(245, 158, 11, 0.4))' }
                    }}
                  />
                  <Typography sx={{ fontStyle: 'normal', fontSize: '0.72rem', fontWeight: 800, color: '#d97706' }}>
                    {starValue}/5
                  </Typography>
                </Stack>
              </Box>

              {/* Big Vibrant Score Badge */}
              <Box
                sx={{
                  px: 1.6,
                  py: 0.6,
                  borderRadius: '12px',
                  background: deptTheme.gradient,
                  color: '#ffffff',
                  boxShadow: `0 4px 14px ${alpha(deptTheme.primary, 0.4)}`,
                  textAlign: 'center'
                }}
              >
                <Typography sx={{ fontStyle: 'normal', fontSize: '1.35rem', fontWeight: 900, lineHeight: 1, color: '#ffffff' }}>
                  {d.avgScore}
                </Typography>
                <Typography sx={{ fontStyle: 'normal', fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', mt: 0.2 }}>
                  SCORE
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* 3 Metric Tiles (Compliance, OFI, NCR) */}
          <Grid container spacing={1} sx={{ mb: 1.5, width: '100%' }}>
            <Grid item xs={4} sx={{ width: '30%' }}>
              <Box
                sx={{
                  p: 0.8,
                  textAlign: 'center',
                  borderRadius: '10px',
                  bgcolor: isDark ? alpha('#10b981', 0.05) : '#f0fdf4',
                  border: '1px solid',
                  borderColor: isDark ? alpha('#10b981', 0.2) : '#dcfce7'
                }}
              >
                <Typography sx={{ fontStyle: 'normal', fontSize: '0.68rem', color: '#15803d', fontWeight: 600 }}>
                  Compliance
                </Typography>
                <Typography sx={{ fontStyle: 'normal', fontSize: '0.92rem', fontWeight: 900, color: '#16a34a' }}>
                  {d.avgCompliance}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4} sx={{ width: '30%' }}>
              <Box
                sx={{
                  p: 0.8,
                  textAlign: 'center',
                  borderRadius: '10px',
                  bgcolor: isDark ? alpha('#f59e0b', 0.05) : '#fffbeb',
                  border: '1px solid',
                  borderColor: isDark ? alpha('#f59e0b', 0.2) : '#fef3c7'
                }}
              >
                <Typography sx={{ fontStyle: 'normal', fontSize: '0.68rem', color: '#b45309', fontWeight: 600 }}>
                  OFI
                </Typography>
                <Typography sx={{ fontStyle: 'normal', fontSize: '0.92rem', fontWeight: 900, color: '#d97706' }}>
                  {d.avgOfi}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4} sx={{ width: '30%' }}>
              <Box
                sx={{
                  p: 0.8,
                  textAlign: 'center',
                  borderRadius: '10px',
                  bgcolor: d.totalNcr > 0 ? (isDark ? alpha('#ef4444', 0.08) : '#fef2f2') : (isDark ? alpha('#fff', 0.03) : '#f8fafc'),
                  border: '1px solid',
                  borderColor: d.totalNcr > 0 ? (isDark ? alpha('#ef4444', 0.3) : '#fecaca') : (isDark ? 'divider' : '#edf2f7')
                }}
              >
                <Typography sx={{ fontStyle: 'normal', fontSize: '0.68rem', color: d.totalNcr > 0 ? '#b91c1c' : 'text.secondary', fontWeight: 600 }}>
                  Total NCR
                </Typography>
                <Typography sx={{ fontStyle: 'normal', fontSize: '0.92rem', fontWeight: 900, color: d.totalNcr > 0 ? '#dc2626' : 'text.primary' }}>
                  {d.totalNcr}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Progress Bar & Index Percentage */}
          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mt: 'auto', pt: 1, mb: 0.8 }}>
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  height: 7,
                  borderRadius: 4,
                  bgcolor: isDark ? alpha('#fff', 0.1) : '#edf2f7',
                  '& .MuiLinearProgress-bar': {
                    background: deptTheme.gradient,
                    borderRadius: 4
                  }
                }}
              />
            </Box>
            <Typography sx={{ fontStyle: 'normal', fontWeight: 900, fontSize: '0.82rem', color: deptTheme.primary, minWidth: 34 }}>
              {pct}%
            </Typography>
          </Stack>

          {/* Bottom Expand Observations Toggle & Drawer (Ignored on Card Image Export) */}
          <Box data-html2canvas-ignore="true" sx={{ width: '100%', mt: 0.5 }}>
            <Button
              fullWidth
              size="small"
              variant="text"
              onClick={() => setExpanded(!expanded)}
              endIcon={
                <IconChevronDown
                  size={16}
                  style={{
                    transform: expanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s'
                  }}
                />
              }
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                fontSize: '0.74rem',
                fontStyle: 'normal',
                py: 0.4,
                borderRadius: 2,
                '&:hover': { bgcolor: alpha(deptTheme.primary, 0.08), color: deptTheme.primary }
              }}
            >
              {expanded ? 'Hide Details' : `Observations (${items.length})`}
            </Button>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box sx={{ pt: 1.2, borderTop: `1px solid ${theme.palette.divider}`, mt: 0.8 }}>
                <Stack spacing={1} sx={{ maxHeight: 260, overflowY: 'auto', pr: 0.5 }}>
                  {items.map((r, idx) => (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{
                        p: 1.2,
                        borderRadius: '12px',
                        bgcolor: isDark ? alpha('#fff', 0.02) : '#f8fafc',
                        borderColor: theme.palette.divider,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: deptTheme.primary,
                          bgcolor: isDark ? alpha(deptTheme.primary, 0.08) : alpha(deptTheme.primary, 0.03),
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      {/* Line 1: Obs No + Date + PDF */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                          <Typography sx={{ fontStyle: 'normal', fontWeight: 800, fontSize: '0.82rem', color: 'text.primary' }}>
                            {r.observationNo}
                          </Typography>
                          <Chip
                            label={formatDateStr(r.observationDate)}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: isDark ? alpha('#fff', 0.06) : '#e2e8f0',
                              color: 'text.secondary'
                            }}
                          />
                        </Stack>
                        <IconButton size="small" color="error" onClick={() => onOpenPdf(r)}>
                          <IconFileTypePdf size={18} color="#d32f2f" />
                        </IconButton>
                      </Stack>

                      {/* Line 2: Audit Type & Schedule No */}
                      <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.6, flexWrap: 'wrap', gap: 0.4 }}>
                        {r.auditType && (
                          <Chip
                            label={r.auditType}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              bgcolor: isDark ? alpha(deptTheme.primary, 0.2) : alpha(deptTheme.primary, 0.1),
                              color: deptTheme.primary,
                              borderRadius: '6px'
                            }}
                          />
                        )}
                        {r.auditScheduleNo && (
                          <Typography sx={{ fontStyle: 'normal', fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
                            Sched: <b>{r.auditScheduleNo}</b>
                          </Typography>
                        )}
                      </Stack>

                      {/* Line 3: Score, Compliance, NC, OFI & Status */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.8, pt: 0.6, borderTop: `1px dashed ${theme.palette.divider}` }}>
                        <Typography sx={{ fontStyle: 'normal', fontSize: '0.72rem', color: 'text.secondary' }}>
                          Score: <b style={{ color: deptTheme.primary }}>{r.auditScore || 0}</b> | Comp: <b>{r.complianceCount || 0}</b> | NC: <b style={{ color: (r.ncrCount || 0) > 0 ? '#ef4444' : 'inherit' }}>{r.ncrCount || 0}</b> | OFI: <b>{r.ofiCount || 0}</b>
                        </Typography>
                        <Chip
                          label={String(r.status || 'OPEN').toUpperCase()}
                          size="small"
                          color={String(r.status).toUpperCase() === 'CLOSED' || String(r.status).toUpperCase() === 'APPROVED' ? 'success' : 'info'}
                          variant="outlined"
                          sx={{ fontSize: '0.62rem', height: 18, fontWeight: 800, fontStyle: 'normal' }}
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Collapse>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
});

// Collapsible Row Component for Audit Type Score Summary Table
function AuditTypeSummaryRow({ t, items, onOpenPdf }) {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow
        hover
        onClick={() => setOpen(!open)}
        sx={{
          cursor: 'pointer',
          bgcolor: open ? 'action.selected' : 'inherit',
          transition: 'background-color 0.2s',
          '& > td': { py: 0.75, px: 1.5 },
          '& > *': { borderBottom: open ? 'unset' : undefined }
        }}
      >
        <TableCell sx={{ fontWeight: 600 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(!open);
              }}
              color="primary"
            >
              {open ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            </IconButton>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', fontStyle: 'normal' }}>
              {t.auditType}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell align="center">
          <Tooltip title={t.departmentsList ? t.departmentsList.join(', ') : ''}>
            <Chip
              label={`${t.departmentCount || 1} Dept${(t.departmentCount || 1) > 1 ? 's' : ''}`}
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontWeight: 700, cursor: 'pointer' }}
            />
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <Chip label={t.scheduleCount || 1} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
        </TableCell>
        <TableCell align="center">
          <Chip label={t.count} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        </TableCell>
        <TableCell align="center" sx={{ color: 'success.main', fontWeight: 700, fontStyle: 'normal' }}>
          {t.avgCompliance}
        </TableCell>
        <TableCell align="center" sx={{ color: 'warning.main', fontWeight: 700, fontStyle: 'normal' }}>
          {t.avgOfi}
        </TableCell>
        <TableCell align="center" sx={{ color: 'error.main', fontWeight: 700, fontStyle: 'normal' }}>
          {t.avgNcr}
        </TableCell>
        <TableCell align="center">
          <Chip
            label={t.totalNcr}
            size="small"
            color={t.totalNcr > 0 ? 'error' : 'default'}
            variant={t.totalNcr > 0 ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700 }}
          />
        </TableCell>

        {/* Super Highlighted AVG AUDIT SCORE Column */}
        <TableCell align="center">
          <Chip
            label={t.avgScore}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: '0.85rem',
              px: 1,
              bgcolor: 'primary.main',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(25, 118, 210, 0.35)',
              borderRadius: '12px'
            }}
          />
        </TableCell>
      </TableRow>

      {/* Expanded Sub-Table */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1.5, p: 2, bgcolor: 'background.default', borderRadius: 2, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.06)' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main', fontStyle: 'normal' }}>
                Observation Details for {t.auditType} ({items.length} records)
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Observation No</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Schedule No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Auditee</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Auditor</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Comp</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>NC</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>OFI</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Score</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>PDF</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((r, idx) => (
                      <TableRow key={r.id || idx} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{r.observationNo}</TableCell>
                        <TableCell align="center">{formatDateStr(r.observationDate)}</TableCell>
                        <TableCell>{r.auditScheduleNo || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{r.departmentName || '-'}</TableCell>
                        <TableCell>{r.auditee ? String(r.auditee).split(' - ')[0] : '-'}</TableCell>
                        <TableCell>{r.auditor ? String(r.auditor).split(' - ')[0] : '-'}</TableCell>
                        <TableCell align="center">
                          <Chip label={r.complianceCount || 0} size="small" color="success" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={r.ncrCount || 0}
                            size="small"
                            color={(r.ncrCount || 0) > 0 ? 'error' : 'default'}
                            variant={(r.ncrCount || 0) > 0 ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={r.ofiCount || 0} size="small" color="warning" variant="outlined" />
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {r.auditScore || 0}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={String(r.status || 'OPEN').toUpperCase()}
                            size="small"
                            color={
                              String(r.status).toUpperCase() === 'CLOSED' || String(r.status).toUpperCase() === 'APPROVED'
                                ? 'success'
                                : 'info'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" color="error" onClick={() => onOpenPdf(r)}>
                            <IconFileTypePdf size={18} color="#d32f2f" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

// Colorful & Star-Rated Audit Type Card Component with Departments Breakdown
// Distinct, Executive Gradient-Banner Audit Type Card Component
const AuditTypeCard = React.memo(function AuditTypeCard({ t, items, cardIndex, onOpenPdf, onCopyNotify, onSaveNotify }) {
  const cardRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const typeTheme = getAuditTypeTheme(t.auditType, cardIndex);
  const scoreNum = Number(t.avgScore) || 0;
  const starValue = Number(Math.min(5, Math.max(0, scoreNum / 2)).toFixed(1));
  const pct = Math.min(100, Math.max(0, Math.round(scoreNum <= 10 ? scoreNum * 10 : scoreNum)));

  const handleCopy = (e) => {
    e.stopPropagation();
    copyCardElementAsImage(
      cardRef.current,
      t.auditType,
      (success) => {
        if (success) {
          setCopied(true);
          if (onCopyNotify) onCopyNotify(t.auditType);
          setTimeout(() => setCopied(false), 2500);
        }
      }
    );
  };

  const handleSave = (e) => {
    e.stopPropagation();
    saveCardElementAsImage(
      cardRef.current,
      `${t.auditType}_Audit_Score`,
      (success) => {
        if (success && onSaveNotify) onSaveNotify(t.auditType);
      }
    );
  };

  return (
    <Grid item xs={12} sm={6} md={4} lg={2.4} sx={{ display: 'flex', width: { xs: '100%', md: '24%' } }}>
      <Card
        ref={cardRef}
        elevation={0}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          bgcolor: isDark ? 'background.paper' : '#ffffff',
          border: `1.5px solid ${isDark ? theme.palette.divider : alpha(typeTheme.primary, 0.25)}`,
          boxShadow: isDark
            ? '0 6px 24px rgba(0,0,0,0.35)'
            : `0 8px 24px ${alpha(typeTheme.primary, 0.1)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: `0 14px 36px ${alpha(typeTheme.primary, 0.22)}`,
            transform: 'translateY(-4px)',
            borderColor: typeTheme.primary
          }
        }}
      >
        {/* 1. Sleek Gradient Top Header Banner with Copy & Save Actions */}
        <Box
          sx={{
            p: 2,
            pb: 1.5,
            background: typeTheme.gradient,
            color: '#ffffff',
            position: 'relative'
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0, flex: 1 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  width: 38,
                  height: 38,
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                {typeTheme.icon}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.92rem',
                    color: '#ffffff',
                    fontStyle: 'normal',
                    lineHeight: 1.2,
                    textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {t.auditType}
                </Typography>
                <Stack direction="row" spacing={0.6} sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    label={`${t.departmentCount || 1} Depts`}
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(255,255,255,0.25)',
                      color: '#ffffff',
                      backdropFilter: 'blur(4px)'
                    }}
                  />
                  <Chip
                    size="small"
                    label={`${t.scheduleCount || 1} Sched`}
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(255,255,255,0.25)',
                      color: '#ffffff',
                      backdropFilter: 'blur(4px)'
                    }}
                  />
                  <Chip
                    size="small"
                    label={`${t.count} Audits`}
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(255,255,255,0.25)',
                      color: '#ffffff',
                      backdropFilter: 'blur(4px)'
                    }}
                  />
                </Stack>
              </Box>
            </Stack>

            {/* Header Right Action Buttons: [Copy] & [Save Image] */}
            <Stack direction="row" alignItems="center" spacing={0.6}>
              <Tooltip title={copied ? 'Card Copied!' : 'Copy Card (Paste in Word / WordPad)'}>
                <IconButton
                  data-html2canvas-ignore="true"
                  size="small"
                  onClick={handleCopy}
                  disabled={loadingAction}
                  sx={{
                    bgcolor: copied ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    p: 0.6,
                    border: '1px solid rgba(255,255,255,0.35)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.35)', transform: 'scale(1.06)' }
                  }}
                >
                  {loadingAction ? <CircularProgress size={15} sx={{ color: '#fff' }} /> : copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Save Card as PNG Image">
                <IconButton
                  data-html2canvas-ignore="true"
                  size="small"
                  onClick={handleSave}
                  disabled={loadingAction}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    p: 0.6,
                    border: '1px solid rgba(255,255,255,0.25)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.35)', transform: 'scale(1.06)' }
                  }}
                >
                  <IconDeviceFloppy size={16} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {/* 2. Card Body */}
        <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1, '&:last-child': { pb: 1.5 } }}>

          {/* Centered Score Showcase with Dial Ring & Gold Stars */}
          <Box
            sx={{
              py: 1.5,
              px: 2,
              borderRadius: '16px',
              bgcolor: isDark ? alpha('#fff', 0.03) : typeTheme.bgLight,
              border: `1px solid ${isDark ? theme.palette.divider : typeTheme.borderLight}`,
              textAlign: 'center',
              mb: 1.5
            }}
          >
            <Stack direction="row" justifyContent="center" alignItems="baseline" spacing={0.6}>
              <Typography sx={{ fontStyle: 'normal', fontSize: '2rem', fontWeight: 900, lineHeight: 1, color: typeTheme.primary }}>
                {t.avgScore}
              </Typography>
              <Typography sx={{ fontStyle: 'normal', fontSize: '0.85rem', fontWeight: 700, color: 'text.secondary' }}>
                / 10
              </Typography>
            </Stack>

            {/* Glowing Star Rating */}
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.6} sx={{ mt: 0.6 }}>
              <Rating
                value={starValue}
                precision={0.1}
                readOnly
                size="small"
                emptyIcon={<IconStarFilled size={14} style={{ opacity: 0.25 }} />}
                icon={<IconStarFilled size={14} color="#f59e0b" />}
                sx={{
                  '& .MuiRating-iconFilled': { color: '#f59e0b', filter: 'drop-shadow(0 1px 2px rgba(245, 158, 11, 0.4))' }
                }}
              />
              <Typography sx={{ fontStyle: 'normal', fontSize: '0.75rem', fontWeight: 800, color: '#d97706' }}>
                {starValue} / 5
              </Typography>
            </Stack>
          </Box>

          {/* Included Departments Tags Strip */}
          {t.departmentsList && t.departmentsList.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ fontStyle: 'normal', fontSize: '0.68rem', color: 'text.secondary', fontWeight: 800, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Audited Departments:
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {t.departmentsList.map((dept, i) => (
                  <Chip
                    key={i}
                    icon={<IconBuilding size={12} style={{ marginLeft: 6 }} />}
                    label={dept}
                    size="small"
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      height: 22,
                      bgcolor: isDark ? alpha('#fff', 0.05) : '#ffffff',
                      border: `1px solid ${isDark ? theme.palette.divider : '#e2e8f0'}`,
                      color: 'text.primary',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Modern Connected Stat Strip (Compliance | OFI | NCR) */}
          <Box
            sx={{
              display: 'flex',
              borderRadius: '12px',
              overflow: 'hidden',
              border: `1px solid ${isDark ? theme.palette.divider : '#e2e8f0'}`,
              bgcolor: isDark ? alpha('#fff', 0.02) : '#f8fafc',
              mb: 1.5
            }}
          >
            <Box sx={{ flex: 1, p: 0.8, textAlign: 'center', borderRight: `1px solid ${isDark ? theme.palette.divider : '#e2e8f0'}` }}>
              <Typography sx={{ fontStyle: 'normal', fontSize: '0.65rem', color: '#16a34a', fontWeight: 700 }}>
                Compliance
              </Typography>
              <Typography sx={{ fontStyle: 'normal', fontSize: '0.95rem', fontWeight: 900, color: '#15803d' }}>
                {t.avgCompliance}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, p: 0.8, textAlign: 'center', borderRight: `1px solid ${isDark ? theme.palette.divider : '#e2e8f0'}` }}>
              <Typography sx={{ fontStyle: 'normal', fontSize: '0.65rem', color: '#d97706', fontWeight: 700 }}>
                OFI
              </Typography>
              <Typography sx={{ fontStyle: 'normal', fontSize: '0.95rem', fontWeight: 900, color: '#b45309' }}>
                {t.avgOfi}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, p: 0.8, textAlign: 'center', bgcolor: t.totalNcr > 0 ? (isDark ? alpha('#ef4444', 0.12) : '#fef2f2') : 'inherit' }}>
              <Typography sx={{ fontStyle: 'normal', fontSize: '0.65rem', color: t.totalNcr > 0 ? '#dc2626' : 'text.secondary', fontWeight: 700 }}>
                Total NC
              </Typography>
              <Typography sx={{ fontStyle: 'normal', fontSize: '0.95rem', fontWeight: 900, color: t.totalNcr > 0 ? '#b91c1c' : 'text.primary' }}>
                {t.totalNcr}
              </Typography>
            </Box>
          </Box>

          {/* Progress Bar & Index */}
          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mt: 'auto', pt: 0.5, mb: 0.8 }}>
            <Box sx={{ flexGrow: 1 }}>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  height: 7,
                  borderRadius: 4,
                  bgcolor: isDark ? alpha('#fff', 0.1) : '#edf2f7',
                  '& .MuiLinearProgress-bar': {
                    background: typeTheme.gradient,
                    borderRadius: 4
                  }
                }}
              />
            </Box>
            <Typography sx={{ fontStyle: 'normal', fontWeight: 900, fontSize: '0.82rem', color: typeTheme.primary, minWidth: 34 }}>
              {pct}%
            </Typography>
          </Stack>

          {/* Bottom Expand Observations Toggle & Drawer (Ignored on Card Image Export) */}
          <Box data-html2canvas-ignore="true" sx={{ width: '100%', mt: 0.5 }}>
            <Button
              fullWidth
              size="small"
              variant="text"
              onClick={() => setExpanded(!expanded)}
              endIcon={
                <IconChevronDown
                  size={16}
                  style={{
                    transform: expanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s'
                  }}
                />
              }
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                fontSize: '0.74rem',
                fontStyle: 'normal',
                py: 0.4,
                borderRadius: 2,
                '&:hover': { bgcolor: alpha(typeTheme.primary, 0.08), color: typeTheme.primary }
              }}
            >
              {expanded ? 'Hide Details' : `Observations (${items.length})`}
            </Button>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box sx={{ pt: 1.2, borderTop: `1px solid ${theme.palette.divider}`, mt: 0.8 }}>
                <Stack spacing={1} sx={{ maxHeight: 180, overflowY: 'auto', pr: 0.5 }}>
                  {items.map((r, idx) => (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{
                        p: 1.2,
                        borderRadius: '12px',
                        bgcolor: isDark ? alpha('#fff', 0.02) : '#f8fafc',
                        borderColor: theme.palette.divider,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: typeTheme.primary,
                          bgcolor: isDark ? alpha(typeTheme.primary, 0.08) : alpha(typeTheme.primary, 0.03),
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      {/* Line 1: Obs No + Date + PDF */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                          <Typography sx={{ fontStyle: 'normal', fontWeight: 800, fontSize: '0.82rem', color: 'text.primary' }}>
                            {r.observationNo}
                          </Typography>
                          <Chip
                            label={formatDateStr(r.observationDate)}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: isDark ? alpha('#fff', 0.06) : '#e2e8f0',
                              color: 'text.secondary'
                            }}
                          />
                        </Stack>
                        <IconButton size="small" color="error" onClick={() => onOpenPdf(r)}>
                          <IconFileTypePdf size={18} color="#d32f2f" />
                        </IconButton>
                      </Stack>

                      {/* Line 2: Dept Name & Schedule No */}
                      <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.6, flexWrap: 'wrap', gap: 0.4 }}>
                        {r.departmentName && (
                          <Chip
                            label={r.departmentName}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              bgcolor: isDark ? alpha(typeTheme.primary, 0.2) : alpha(typeTheme.primary, 0.1),
                              color: typeTheme.primary,
                              borderRadius: '6px'
                            }}
                          />
                        )}
                        {r.auditScheduleNo && (
                          <Typography sx={{ fontStyle: 'normal', fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
                            Sched: <b>{r.auditScheduleNo}</b>
                          </Typography>
                        )}
                      </Stack>

                      {/* Line 3: Score, Compliance, NC, OFI & Status */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 0.8, pt: 0.6, borderTop: `1px dashed ${theme.palette.divider}` }}>
                        <Typography sx={{ fontStyle: 'normal', fontSize: '0.72rem', color: 'text.secondary' }}>
                          Score: <b style={{ color: typeTheme.primary }}>{r.auditScore || 0}</b> | Comp: <b>{r.complianceCount || 0}</b> | NC: <b style={{ color: (r.ncrCount || 0) > 0 ? '#ef4444' : 'inherit' }}>{r.ncrCount || 0}</b> | OFI: <b>{r.ofiCount || 0}</b>
                        </Typography>
                        <Chip
                          label={String(r.status || 'OPEN').toUpperCase()}
                          size="small"
                          color={String(r.status).toUpperCase() === 'CLOSED' || String(r.status).toUpperCase() === 'APPROVED' ? 'success' : 'info'}
                          variant="outlined"
                          sx={{ fontSize: '0.62rem', height: 18, fontWeight: 800, fontStyle: 'normal' }}
                        />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            </Collapse>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
});


// ══════════════════════════════════════════════════════════════════════
// AUDIT TYPE & DEPARTMENT WISE BREAKDOWN CARD (No Top Overall Score)
// ══════════════════════════════════════════════════════════════════════
// Expandable Department Observation Mini Card Row
const AuditTypeMiniCardRow = React.memo(function AuditTypeMiniCardRow({ r, typeTheme, onOpenPdf }) {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const deptTheme = getDeptTheme(r.departmentName);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.2,
        borderRadius: '12px',
        bgcolor: isDark ? alpha('#fff', 0.03) : alpha(typeTheme.primary, 0.03),
        border: `1.5px solid ${expanded ? typeTheme.primary : isDark ? theme.palette.divider : alpha(typeTheme.primary, 0.18)}`,
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        '&:hover': {
          borderColor: typeTheme.primary,
          bgcolor: isDark ? alpha(typeTheme.primary, 0.08) : alpha(typeTheme.primary, 0.06),
          boxShadow: '0 3px 12px rgba(0,0,0,0.06)'
        }
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Top Main Row */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        {/* 1. Department with Avatar & Mini Stats */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: 1.2 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              background: deptTheme.gradient,
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 900,
              boxShadow: `0 2px 6px ${alpha(deptTheme.primary, 0.35)}`
            }}
          >
            {(r.departmentName || 'G').charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '0.82rem',
                color: 'text.primary',
                fontStyle: 'normal',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {r.departmentName || 'General'}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 600, fontStyle: 'normal' }}>
              Comp: <b style={{ color: '#16a34a' }}>{r.complianceCount || 0}</b> | NC:{' '}
              <b style={{ color: (r.ncrCount || 0) > 0 ? '#ef4444' : 'inherit' }}>{r.ncrCount || 0}</b>
            </Typography>
          </Box>
        </Stack>

        {/* 2. Observation No & Observation Date below */}
        <Stack direction="column" alignItems="center" spacing={0.3}>
          <Stack direction="row" alignItems="center" spacing={0.4}>
            <Chip
              label={r.observationNo}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: isDark ? alpha('#fff', 0.06) : '#e2e8f0',
                color: 'text.primary',
                borderRadius: '6px'
              }}
            />
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPdf(r);
              }}
              sx={{ p: 0.3 }}
              title="View PDF"
            >
              <IconFileTypePdf size={16} color="#d32f2f" />
            </IconButton>
            <IconChevronDown
              size={16}
              style={{
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.25s ease',
                color: '#64748b'
              }}
            />
          </Stack>
          <Typography sx={{ fontStyle: 'normal', fontSize: '0.64rem', color: 'text.secondary', fontWeight: 600 }}>
            {formatDateStr(r.observationDate)}
          </Typography>
        </Stack>

        {/* 3. Audit Score Badge */}
        <Box
          sx={{
            px: 1.2,
            py: 0.4,
            borderRadius: '8px',
            background: typeTheme.gradient,
            color: '#ffffff',
            textAlign: 'center',
            minWidth: 42,
            boxShadow: `0 2px 8px ${alpha(typeTheme.primary, 0.35)}`
          }}
        >
          <Typography sx={{ fontStyle: 'normal', fontSize: '0.92rem', fontWeight: 900, lineHeight: 1, color: '#ffffff' }}>
            {r.auditScore || 0}
          </Typography>
          <Typography sx={{ fontStyle: 'normal', fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', mt: 0.2 }}>
            SCORE
          </Typography>
        </Box>
      </Stack>

      {/* Expandable Rich Observation Details Drawer */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            pt: 1.2,
            mt: 1,
            borderTop: `1px dashed ${theme.palette.divider}`,
            cursor: 'default'
          }}
        >
          <Box
            sx={{
              p: 1.2,
              borderRadius: '10px',
              bgcolor: isDark ? alpha('#000', 0.25) : '#f8fafc',
              border: `1px solid ${isDark ? theme.palette.divider : '#e2e8f0'}`
            }}
          >
            {/* Row 1: Audit No, Audit Date & Status */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.4 }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
                  Audit No: <b>{r.auditScheduleNo || r.scheduleNo || '-'}</b>
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
                  | Audit Date: <b>{formatDateStr(r.auditDate || r.scheduleDate || r.observationDate)}</b>
                </Typography>
              </Stack>

              <Chip
                label={String(r.status || 'OPEN').toUpperCase()}
                size="small"
                color={
                  String(r.status).toUpperCase() === 'CLOSED' || String(r.status).toUpperCase() === 'APPROVED'
                    ? 'success'
                    : 'info'
                }
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
              />
            </Stack>

            {/* Row 2: Auditee & Auditor */}
            <Stack direction="row" spacing={2} sx={{ mb: 0.8, fontSize: '0.72rem', color: 'text.secondary' }}>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                Auditee: <b style={{ color: 'inherit' }}>{r.auditee ? String(r.auditee).split(' - ')[0] : '-'}</b>
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                Auditor: <b style={{ color: 'inherit' }}>{r.auditor ? String(r.auditor).split(' - ')[0] : '-'}</b>
              </Typography>
            </Stack>

            {/* Row 3: Full Findings Breakdown Strip + Action Button */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.6, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                Compliance: <b style={{ color: '#16a34a' }}>{r.complianceCount || 0}</b> | OFI:{' '}
                <b style={{ color: '#d97706' }}>{r.ofiCount || 0}</b> | Total NC:{' '}
                <b style={{ color: (r.ncrCount || 0) > 0 ? '#ef4444' : 'inherit' }}>{r.ncrCount || 0}</b>
              </Typography>

              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<IconFileTypePdf size={15} />}
                onClick={() => onOpenPdf(r)}
                sx={{
                  py: 0.2,
                  px: 1,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '6px'
                }}
              >
                View PDF
              </Button>
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
});

const AuditTypeDeptBreakdownCard = React.memo(function AuditTypeDeptBreakdownCard({ t, cardIndex, onOpenPdf, onCopyNotify, onSaveNotify }) {
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const typeTheme = getAuditTypeTheme(t.auditType, cardIndex);
  const items = t.items || [];
  const visibleItems = showAll ? items : items.slice(0, 2);
  const totalScore = items.reduce((acc, r) => acc + (Number(r.auditScore) || 0), 0);
  const avgDbScore = items.length > 0 ? (totalScore / items.length).toFixed(1) : '0.0';

  const handleCopy = (e) => {
    e.stopPropagation();
    copyCardElementAsImage(
      cardRef.current,
      t.auditType,
      (success) => {
        if (success) {
          setCopied(true);
          if (onCopyNotify) onCopyNotify(t.auditType);
          setTimeout(() => setCopied(false), 2500);
        }
      }
    );
  };

  const handleSave = (e) => {
    e.stopPropagation();
    saveCardElementAsImage(
      cardRef.current,
      `${t.auditType}_Dept_Breakdown`,
      (success) => {
        if (success && onSaveNotify) onSaveNotify(t.auditType);
      }
    );
  };

  return (
    <Grid item xs={12} sm={6} md={4} lg={4} sx={{ display: 'flex', width: { xs: '100%', md: '30%' } }}>
      <Card
        ref={cardRef}
        elevation={0}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '18px',
          bgcolor: isDark ? 'background.paper' : '#ffffff',
          border: `1.5px solid ${isDark ? theme.palette.divider : alpha(typeTheme.primary, 0.3)}`,
          boxShadow: isDark
            ? '0 4px 20px rgba(0,0,0,0.35)'
            : `0 6px 20px ${alpha(typeTheme.primary, 0.08)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: `0 12px 32px ${alpha(typeTheme.primary, 0.18)}`,
            transform: 'translateY(-3px)',
            borderColor: typeTheme.primary
          }
        }}
      >
        {/* Top Header Banner with Copy & Save Actions */}
        <Box
          sx={{
            p: 1.8,
            pb: 1.4,
            background: typeTheme.gradient,
            color: '#ffffff'
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0, flex: 1 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  width: 36,
                  height: 36,
                  border: '1.5px solid rgba(255,255,255,0.4)'
                }}
              >
                {typeTheme.icon}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    color: '#ffffff',
                    fontStyle: 'normal',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {t.auditType}
                </Typography>
                <Stack direction="row" spacing={0.6} sx={{ mt: 0.4 }}>
                  <Chip
                    size="small"
                    label={`${t.departmentCount || 1} Depts`}
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(255,255,255,0.25)',
                      color: '#ffffff'
                    }}
                  />
                  <Chip
                    size="small"
                    label={`${items.length} Audits`}
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(255,255,255,0.25)',
                      color: '#ffffff'
                    }}
                  />
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.8}>
              {/* Overall Score Badge in Heading Banner */}
              <Box
                sx={{
                  px: 1.3,
                  py: 0.35,
                  borderRadius: '10px',
                  bgcolor: 'rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  color: '#ffffff',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
              >
                <Typography sx={{ fontStyle: 'normal', fontSize: '1.05rem', fontWeight: 900, lineHeight: 1, color: '#ffffff' }}>
                  {avgDbScore}%
                </Typography>
                <Typography sx={{ fontStyle: 'normal', fontSize: '0.52rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', mt: 0.1 }}>
                  SCORE
                </Typography>
              </Box>

              <Tooltip title={copied ? 'Card Copied!' : 'Copy Card'}>
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  sx={{
                    bgcolor: copied ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    p: 0.6,
                    border: '1px solid rgba(255,255,255,0.35)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.35)', transform: 'scale(1.06)' }
                  }}
                >
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Save Card as PNG Image">
                <IconButton
                  size="small"
                  onClick={handleSave}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    p: 0.6,
                    border: '1px solid rgba(255,255,255,0.25)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.35)', transform: 'scale(1.06)' }
                  }}
                >
                  <IconDeviceFloppy size={16} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {/* Embedded Department Findings Mini-Cards (Default 2 items + Load More / Max 4 items scroll on UI, All on Export) */}
        <CardContent sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flex: 1, '&:last-child': { pb: 1.5 } }}>
          <Stack
            spacing={1}
            sx={{
              pr: 0.5,
              maxHeight: showAll ? 285 : 'none',
              overflowY: showAll ? 'auto' : 'visible'
            }}
          >
            {items.map((r, idx) => (
              <Box
                key={idx}
                data-collapsed-item={idx >= 2 ? 'true' : undefined}
                sx={{ display: idx < 2 || showAll ? 'block' : 'none' }}
              >
                <AuditTypeMiniCardRow
                  r={r}
                  typeTheme={typeTheme}
                  onOpenPdf={onOpenPdf}
                />
              </Box>
            ))}
          </Stack>

          {items.length > 2 && (
            <Button
              data-html2canvas-ignore="true"
              fullWidth
              size="small"
              variant="text"
              onClick={(e) => {
                e.stopPropagation();
                setShowAll(!showAll);
              }}
              endIcon={
                <IconChevronDown
                  size={15}
                  style={{
                    transform: showAll ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s'
                  }}
                />
              }
              sx={{
                mt: 0.8,
                py: 0.35,
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'none',
                color: typeTheme.primary,
                borderRadius: '8px',
                bgcolor: alpha(typeTheme.primary, 0.06),
                '&:hover': { bgcolor: alpha(typeTheme.primary, 0.14) }
              }}
            >
              {showAll ? 'Show Less' : `Load More (+${items.length - 2} more)`}
            </Button>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
});


// ══════════════════════════════════════════════════════════════════════
// DEPARTMENT & AUDIT TYPE BREAKDOWN COMPONENTS (TAB 4)
// ══════════════════════════════════════════════════════════════════════

const DeptMiniCardRow = React.memo(function DeptMiniCardRow({ r, deptTheme, onOpenPdf }) {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const typeTheme = getAuditTypeTheme(r.auditType);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.2,
        borderRadius: '12px',
        bgcolor: isDark ? alpha('#fff', 0.03) : alpha(deptTheme.primary, 0.03),
        border: `1.5px solid ${expanded ? deptTheme.primary : isDark ? theme.palette.divider : alpha(deptTheme.primary, 0.18)}`,
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        '&:hover': {
          borderColor: deptTheme.primary,
          bgcolor: isDark ? alpha(deptTheme.primary, 0.08) : alpha(deptTheme.primary, 0.06),
          boxShadow: '0 3px 12px rgba(0,0,0,0.06)'
        }
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Top Main Row */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        {/* 1. Audit Type with Avatar & Mini Stats */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: 1.2 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              background: typeTheme.gradient,
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: 900,
              boxShadow: `0 2px 6px ${alpha(typeTheme.primary, 0.35)}`
            }}
          >
            {typeTheme.icon}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '0.82rem',
                color: 'text.primary',
                fontStyle: 'normal',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {r.auditType || 'General Audit'}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', fontWeight: 600, fontStyle: 'normal' }}>
              Comp: <b style={{ color: '#16a34a' }}>{r.complianceCount || 0}</b> | NC:{' '}
              <b style={{ color: (r.ncrCount || 0) > 0 ? '#ef4444' : 'inherit' }}>{r.ncrCount || 0}</b>
            </Typography>
          </Box>
        </Stack>

        {/* 2. Observation No & Observation Date below */}
        <Stack direction="column" alignItems="center" spacing={0.3}>
          <Stack direction="row" alignItems="center" spacing={0.4}>
            <Chip
              label={r.observationNo}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: isDark ? alpha('#fff', 0.06) : '#e2e8f0',
                color: 'text.primary',
                borderRadius: '6px'
              }}
            />
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPdf(r);
              }}
              sx={{ p: 0.3 }}
              title="View PDF"
            >
              <IconFileTypePdf size={16} color="#d32f2f" />
            </IconButton>
            <IconChevronDown
              size={16}
              style={{
                transform: expanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.25s ease',
                color: '#64748b'
              }}
            />
          </Stack>
          <Typography sx={{ fontStyle: 'normal', fontSize: '0.64rem', color: 'text.secondary', fontWeight: 600 }}>
            {formatDateStr(r.observationDate)}
          </Typography>
        </Stack>

        {/* 3. Audit Score Badge */}
        <Box
          sx={{
            px: 1.2,
            py: 0.4,
            borderRadius: '8px',
            background: deptTheme.gradient,
            color: '#ffffff',
            textAlign: 'center',
            minWidth: 42,
            boxShadow: `0 2px 8px ${alpha(deptTheme.primary, 0.35)}`
          }}
        >
          <Typography sx={{ fontStyle: 'normal', fontSize: '0.92rem', fontWeight: 900, lineHeight: 1, color: '#ffffff' }}>
            {r.auditScore || 0}
          </Typography>
          <Typography sx={{ fontStyle: 'normal', fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', mt: 0.2 }}>
            SCORE
          </Typography>
        </Box>
      </Stack>

      {/* Expandable Rich Observation Details Drawer */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            pt: 1.2,
            mt: 1,
            borderTop: `1px dashed ${theme.palette.divider}`,
            cursor: 'default'
          }}
        >
          <Box
            sx={{
              p: 1.2,
              borderRadius: '10px',
              bgcolor: isDark ? alpha('#000', 0.25) : '#f8fafc',
              border: `1px solid ${isDark ? theme.palette.divider : '#e2e8f0'}`
            }}
          >
            {/* Row 1: Audit No, Audit Date & Status */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.4 }}>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
                  Audit No: <b>{r.auditScheduleNo || r.scheduleNo || '-'}</b>
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
                  | Audit Date: <b>{formatDateStr(r.auditDate || r.scheduleDate || r.observationDate)}</b>
                </Typography>
              </Stack>

              <Chip
                label={String(r.status || 'OPEN').toUpperCase()}
                size="small"
                color={
                  String(r.status).toUpperCase() === 'CLOSED' || String(r.status).toUpperCase() === 'APPROVED'
                    ? 'success'
                    : 'info'
                }
                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
              />
            </Stack>

            {/* Row 2: Auditee & Auditor */}
            <Stack direction="row" spacing={2} sx={{ mb: 0.8, fontSize: '0.72rem', color: 'text.secondary' }}>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                Auditee: <b style={{ color: 'inherit' }}>{r.auditee ? String(r.auditee).split(' - ')[0] : '-'}</b>
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                Auditor: <b style={{ color: 'inherit' }}>{r.auditor ? String(r.auditor).split(' - ')[0] : '-'}</b>
              </Typography>
            </Stack>

            {/* Row 3: Full Findings Breakdown Strip + Action Button */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.6, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                Compliance: <b style={{ color: '#16a34a' }}>{r.complianceCount || 0}</b> | OFI:{' '}
                <b style={{ color: '#d97706' }}>{r.ofiCount || 0}</b> | Total NC:{' '}
                <b style={{ color: (r.ncrCount || 0) > 0 ? '#ef4444' : 'inherit' }}>{r.ncrCount || 0}</b>
              </Typography>

              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<IconFileTypePdf size={15} />}
                onClick={() => onOpenPdf(r)}
                sx={{
                  py: 0.2,
                  px: 1,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '6px'
                }}
              >
                View PDF
              </Button>
            </Stack>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
});

const DeptAuditTypeBreakdownCard = React.memo(function DeptAuditTypeBreakdownCard({ d, cardIndex, onOpenPdf, onCopyNotify, onSaveNotify }) {
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const deptTheme = getDeptTheme(d.departmentName, cardIndex);
  const items = d.items || [];
  const visibleItems = showAll ? items : items.slice(0, 2);
  const totalScore = items.reduce((acc, r) => acc + (Number(r.auditScore) || 0), 0);
  const avgDbScore = items.length > 0 ? (totalScore / items.length).toFixed(1) : '0.0';

  const handleCopy = (e) => {
    e.stopPropagation();
    copyCardElementAsImage(
      cardRef.current,
      d.departmentName,
      (success) => {
        if (success) {
          setCopied(true);
          if (onCopyNotify) onCopyNotify(d.departmentName);
          setTimeout(() => setCopied(false), 2500);
        }
      }
    );
  };

  const handleSave = (e) => {
    e.stopPropagation();
    saveCardElementAsImage(
      cardRef.current,
      `${d.departmentName}_Audit_Breakdown`,
      (success) => {
        if (success && onSaveNotify) onSaveNotify(d.departmentName);
      }
    );
  };

  return (
    <Grid item xs={12} sm={6} md={4} lg={4} sx={{ display: 'flex', width: { xs: '100%', md: '30%' } }}>
      <Card
        ref={cardRef}
        elevation={0}
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '18px',
          bgcolor: isDark ? 'background.paper' : '#ffffff',
          border: `1.5px solid ${isDark ? theme.palette.divider : alpha(deptTheme.primary, 0.3)}`,
          boxShadow: isDark
            ? '0 4px 20px rgba(0,0,0,0.35)'
            : `0 6px 20px ${alpha(deptTheme.primary, 0.08)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: `0 12px 32px ${alpha(deptTheme.primary, 0.18)}`,
            transform: 'translateY(-3px)',
            borderColor: deptTheme.primary
          }
        }}
      >
        {/* Top Header Banner with Overall Score & Copy/Save Actions */}
        <Box
          sx={{
            p: 1.8,
            pb: 1.4,
            background: deptTheme.gradient,
            color: '#ffffff'
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0, flex: 1 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  width: 36,
                  height: 36,
                  border: '1.5px solid rgba(255,255,255,0.4)'
                }}
              >
                {deptTheme.icon}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 900,
                    fontSize: '0.9rem',
                    color: '#ffffff',
                    fontStyle: 'normal',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {d.departmentName}
                </Typography>
                <Stack direction="row" spacing={0.6} sx={{ mt: 0.4 }}>
                  <Chip
                    size="small"
                    label={`${d.auditTypeCount || 1} Audit Types`}
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(255,255,255,0.25)',
                      color: '#ffffff'
                    }}
                  />
                  <Chip
                    size="small"
                    label={`${items.length} Audits`}
                    sx={{
                      height: 18,
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      bgcolor: 'rgba(255,255,255,0.25)',
                      color: '#ffffff'
                    }}
                  />
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.8}>
              {/* Overall Score Badge in Heading Banner */}
              <Box
                sx={{
                  px: 1.3,
                  py: 0.35,
                  borderRadius: '10px',
                  bgcolor: 'rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  color: '#ffffff',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
              >
                <Typography sx={{ fontStyle: 'normal', fontSize: '1.05rem', fontWeight: 900, lineHeight: 1, color: '#ffffff' }}>
                  {avgDbScore}%
                </Typography>
                <Typography sx={{ fontStyle: 'normal', fontSize: '0.52rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', mt: 0.1 }}>
                  SCORE
                </Typography>
              </Box>

              <Tooltip title={copied ? 'Card Copied!' : 'Copy Card'}>
                <IconButton
                  data-html2canvas-ignore="true"
                  size="small"
                  onClick={handleCopy}
                  sx={{
                    bgcolor: copied ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    p: 0.6,
                    border: '1px solid rgba(255,255,255,0.35)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.35)', transform: 'scale(1.06)' }
                  }}
                >
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Save Card as PNG Image">
                <IconButton
                  data-html2canvas-ignore="true"
                  size="small"
                  onClick={handleSave}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    p: 0.6,
                    border: '1px solid rgba(255,255,255,0.25)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.35)', transform: 'scale(1.06)' }
                  }}
                >
                  <IconDeviceFloppy size={16} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>

        {/* Embedded Audit Type Findings Mini-Cards (Default 2 items + Load More / Max 4 items scroll on UI, All on Export) */}
        <CardContent sx={{ p: 1.5, display: 'flex', flexDirection: 'column', flex: 1, '&:last-child': { pb: 1.5 } }}>
          <Stack
            spacing={1}
            sx={{
              pr: 0.5,
              maxHeight: showAll ? 285 : 'none',
              overflowY: showAll ? 'auto' : 'visible'
            }}
          >
            {items.map((r, idx) => (
              <Box
                key={idx}
                data-collapsed-item={idx >= 2 ? 'true' : undefined}
                sx={{ display: idx < 2 || showAll ? 'block' : 'none' }}
              >
                <DeptMiniCardRow
                  r={r}
                  deptTheme={deptTheme}
                  onOpenPdf={onOpenPdf}
                />
              </Box>
            ))}
          </Stack>

          {items.length > 2 && (
            <Button
              data-html2canvas-ignore="true"
              fullWidth
              size="small"
              variant="text"
              onClick={(e) => {
                e.stopPropagation();
                setShowAll(!showAll);
              }}
              endIcon={
                <IconChevronDown
                  size={15}
                  style={{
                    transform: showAll ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s'
                  }}
                />
              }
              sx={{
                mt: 0.8,
                py: 0.35,
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'none',
                color: deptTheme.primary,
                borderRadius: '8px',
                bgcolor: alpha(deptTheme.primary, 0.06),
                '&:hover': { bgcolor: alpha(deptTheme.primary, 0.14) }
              }}
            >
              {showAll ? 'Show Less' : `Load More (+${items.length - 2} more)`}
            </Button>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
});

export default function AuditScoreReport() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const perms = usePagePermissions(PAGE_CODES.QMS_AUDIT_REPORT || 'QM1260');
  const bosFilters = useBOSFilters(perms);

  // Redux Global Filters & Query from Top Header Bar
  const globalQuery = useSelector((state) => state.search?.query) || '';
  const globalFiltersRaw = useSelector((state) => state.search?.filters);
  const globalFilters = useMemo(() => globalFiltersRaw || {}, [globalFiltersRaw]);

  // Active View Tab: 0 = Detailed List, 1 = Department Score Summary, 2 = Audit Type Score Summary
  const [viewTab, setViewTab] = useState(0);

  // View Display Mode: 'table' vs 'cards' (Default: 'cards')
  const [displayMode, setDisplayMode] = useState('cards');

  // Data & Loading
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [reportPdfOpen, setReportPdfOpen] = useState(false);
  const [copySnackbar, setCopySnackbar] = useState({ open: false, title: "" });
  const cardsGridRef = useRef(null);
  const [selectedPdfRow, setSelectedPdfRow] = useState(null);

  // Lookups for Global Filter Bar
  const [departmentsList, setDepartmentsList] = useState([]);
  const [auditTypeOptions, setAuditTypeOptions] = useState([{ value: 'All', label: 'All Audit Types' }]);

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

    const deptOpts = [
      { value: 'All', label: 'All Departments' },
      ...departmentsList.map((d) => ({
        value: String(d.departmentName || d.name || d.id),
        label: String(d.departmentName || d.name || d.id)
      }))
    ];

    dispatch(
      setFilterConfig([
        {
          id: 'taskScope',
          label: 'Scope',
          type: 'select',
          isStarred: true,
          defaultValue: perms.additional1 ? 'Company' : 'Mine',
          options: bosFilters.getFilterOptions()
        },
        {
          id: 'observationDate',
          label: 'Date',
          type: 'dateRange',
          isStarred: true
        },
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
        }
      ])
    );

    return () => {
      dispatch(setFilterConfig(null));
    };
  }, [dispatch, perms.loading, perms.additional1, bosFilters.myTeamLoaded, departmentsList.length, auditTypeOptions.length]);

  // Fetch Data from Backend using Global Filters
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const considerVal = globalFilters.observationDateConsider === true || globalFilters.observationDateConsider === 'Yes' ? 'Yes' : 'No';
      const response = await axios.get('/api/qms/audit/observation', {
        params: {
          taskScope: globalFilters.taskScope || undefined,
          considerDate: considerVal,
          fromDate: considerVal === 'Yes' ? (globalFilters.observationDateStart || undefined) : undefined,
          toDate: considerVal === 'Yes' ? (globalFilters.observationDateEnd || undefined) : undefined
        }
      });
      setRows(response.data || []);
    } catch (error) {
      console.error('Failed to fetch audit observation report data:', error);
    } finally {
      setLoading(false);
    }
  }, [
    globalFilters.taskScope,
    globalFilters.observationDateConsider,
    globalFilters.observationDateStart,
    globalFilters.observationDateEnd
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRealtimeRefresh(fetchData, 'AuditObservation');

  // Filtered Rows for Detailed View & Summaries
  const filteredRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];

    const considerVal = globalFilters.observationDateConsider === true || globalFilters.observationDateConsider === 'Yes';
    const fromDate = globalFilters.observationDateStart;
    const toDate = globalFilters.observationDateEnd;
    const deptFilter = globalFilters.department;
    const typeFilter = globalFilters.auditType;
    const q = globalQuery.toLowerCase().trim();

    return rows.filter((row) => {
      // 1. Consider Date Filter
      if (considerVal) {
        const obsDateRaw = row.observationDate || row.createdDate;
        if (obsDateRaw) {
          const rowDateIso = formatIsoDate(obsDateRaw);
          if (rowDateIso) {
            if (fromDate && rowDateIso < fromDate) return false;
            if (toDate && rowDateIso > toDate) return false;
          }
        }
      }

      // 2. Department Filter
      if (deptFilter && deptFilter !== 'All') {
        const rowDept = String(row.departmentName || row.departmentId || '').toLowerCase();
        if (!rowDept.includes(String(deptFilter).toLowerCase())) return false;
      }

      // 3. Audit Type Filter
      if (typeFilter && typeFilter !== 'All') {
        const rowType = String(row.auditType || row.auditTypeId || '').toLowerCase();
        if (!rowType.includes(String(typeFilter).toLowerCase())) return false;
      }

      // 4. Search Query from Global Top Search Input
      if (q !== '') {
        const matches =
          (row.observationNo && row.observationNo.toLowerCase().includes(q)) ||
          (row.auditScheduleNo && row.auditScheduleNo.toLowerCase().includes(q)) ||
          (row.departmentName && row.departmentName.toLowerCase().includes(q)) ||
          (row.auditee && row.auditee.toLowerCase().includes(q)) ||
          (row.auditor && row.auditor.toLowerCase().includes(q)) ||
          (row.auditType && row.auditType.toLowerCase().includes(q)) ||
          (row.status && row.status.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [rows, globalFilters, globalQuery]);

  // Overall KPI Metrics
  const metrics = useMemo(() => {
    const totalAudits = filteredRows.length;
    if (totalAudits === 0) {
      return {
        totalAudits: 0,
        totalSchedules: 0,
        avgScore: 0,
        totalCompliance: 0,
        avgCompliance: 0,
        totalOfi: 0,
        avgOfi: 0,
        totalNcr: 0,
        avgNcr: 0
      };
    }

    const uniqueSchedules = new Set(filteredRows.map((r) => r.auditScheduleNo).filter(Boolean));
    const totalScore = filteredRows.reduce((acc, r) => acc + (Number(r.auditScore) || 0), 0);
    const totalCompliance = filteredRows.reduce((acc, r) => acc + (Number(r.complianceCount) || 0), 0);
    const totalOfi = filteredRows.reduce((acc, r) => acc + (Number(r.ofiCount) || 0), 0);
    const totalNcr = filteredRows.reduce((acc, r) => acc + (Number(r.ncrCount) || 0), 0);

    return {
      totalAudits,
      totalSchedules: uniqueSchedules.size || 1,
      avgScore: (totalScore / totalAudits).toFixed(1),
      totalCompliance,
      avgCompliance: (totalCompliance / totalAudits).toFixed(1),
      totalOfi,
      avgOfi: (totalOfi / totalAudits).toFixed(1),
      totalNcr,
      avgNcr: (totalNcr / totalAudits).toFixed(1)
    };
  }, [filteredRows]);

  // View 2: Department Score Summary Grouping
  const departmentSummary = useMemo(() => {
    const map = {};
    filteredRows.forEach((r) => {
      const deptName = r.departmentName || 'General / Unassigned';
      if (!map[deptName]) {
        map[deptName] = {
          departmentName: deptName,
          count: 0,
          schedulesSet: new Set(),
          totalScore: 0,
          totalCompliance: 0,
          totalOfi: 0,
          totalNcr: 0
        };
      }
      map[deptName].count += 1;
      if (r.auditScheduleNo) map[deptName].schedulesSet.add(r.auditScheduleNo);
      map[deptName].totalScore += Number(r.auditScore) || 0;
      map[deptName].totalCompliance += Number(r.complianceCount) || 0;
      map[deptName].totalOfi += Number(r.ofiCount) || 0;
      map[deptName].totalNcr += Number(r.ncrCount) || 0;
    });

    return Object.values(map).map((item) => {
      const avgScore = (item.totalScore / item.count).toFixed(1);
      const avgCompliance = (item.totalCompliance / item.count).toFixed(1);
      const avgOfi = (item.totalOfi / item.count).toFixed(1);
      const avgNcr = (item.totalNcr / item.count).toFixed(1);
      const scheduleCount = item.schedulesSet.size || 1;

      let grade = 'Good';
      let color = 'info';
      if (Number(avgScore) >= 10 || item.totalNcr === 0) {
        grade = 'Excellent';
        color = 'success';
      } else if (item.totalNcr > 3) {
        grade = 'Needs Attention';
        color = 'error';
      } else if (item.totalNcr > 0) {
        grade = 'Satisfactory';
        color = 'warning';
      }

      return {
        ...item,
        scheduleCount,
        avgScore,
        avgCompliance,
        avgOfi,
        avgNcr,
        grade,
        color
      };
    }).sort((a, b) => Number(a.avgScore) - Number(b.avgScore));
  }, [filteredRows]);

  // View 3: Audit Type Summary Grouping with Departments Tracking
  const auditTypeSummary = useMemo(() => {
    const map = {};
    filteredRows.forEach((r) => {
      const typeName = r.auditType || 'General Audit';
      if (!map[typeName]) {
        map[typeName] = {
          auditType: typeName,
          count: 0,
          schedulesSet: new Set(),
          departmentsSet: new Set(),
          totalScore: 0,
          totalCompliance: 0,
          totalOfi: 0,
          totalNcr: 0
        };
      }
      map[typeName].count += 1;
      if (r.auditScheduleNo) map[typeName].schedulesSet.add(r.auditScheduleNo);
      if (r.departmentName) map[typeName].departmentsSet.add(r.departmentName);
      map[typeName].totalScore += Number(r.auditScore) || 0;
      map[typeName].totalCompliance += Number(r.complianceCount) || 0;
      map[typeName].totalOfi += Number(r.ofiCount) || 0;
      map[typeName].totalNcr += Number(r.ncrCount) || 0;
    });

    return Object.values(map).map((item) => {
      const scheduleCount = item.schedulesSet.size || 1;
      const departmentCount = item.departmentsSet.size || 1;
      const departmentsList = Array.from(item.departmentsSet);
      return {
        ...item,
        scheduleCount,
        departmentCount,
        departmentsList,
        avgScore: (item.totalScore / item.count).toFixed(1),
        avgCompliance: (item.totalCompliance / item.count).toFixed(1),
        avgOfi: (item.totalOfi / item.count).toFixed(1),
        avgNcr: (item.totalNcr / item.count).toFixed(1)
      };
    }).sort((a, b) => Number(a.avgScore) - Number(b.avgScore));
  }, [filteredRows]);

  // View 4: Audit Type & Department Breakdown Summary Grouping
  const auditTypeAndDeptSummary = useMemo(() => {
    const map = {};
    filteredRows.forEach((r) => {
      const typeName = r.auditType || 'General Audit';
      if (!map[typeName]) {
        map[typeName] = {
          auditType: typeName,
          count: 0,
          schedulesSet: new Set(),
          departmentsSet: new Set(),
          totalScore: 0,
          items: []
        };
      }
      map[typeName].count += 1;
      map[typeName].totalScore += Number(r.auditScore) || 0;
      if (r.auditScheduleNo) map[typeName].schedulesSet.add(r.auditScheduleNo);
      if (r.departmentName) map[typeName].departmentsSet.add(r.departmentName);
      map[typeName].items.push(r);
    });

    return Object.values(map).map((item) => {
      const avgScore = item.count > 0 ? (item.totalScore / item.count).toFixed(1) : '0.0';
      const sortedItems = [...item.items].sort((a, b) => (Number(a.auditScore) || 0) - (Number(b.auditScore) || 0));
      return {
        ...item,
        items: sortedItems,
        avgScore,
        departmentCount: item.departmentsSet.size || 1,
        scheduleCount: item.schedulesSet.size || 1
      };
    }).sort((a, b) => Number(a.avgScore) - Number(b.avgScore));
  }, [filteredRows]);

  // View 5: Department & Audit Type Breakdown Summary Grouping
  const deptAndAuditTypeSummary = useMemo(() => {
    const map = {};
    filteredRows.forEach((r) => {
      const deptName = r.departmentName || 'General / Unassigned';
      if (!map[deptName]) {
        map[deptName] = {
          departmentName: deptName,
          count: 0,
          schedulesSet: new Set(),
          auditTypesSet: new Set(),
          totalScore: 0,
          items: []
        };
      }
      map[deptName].count += 1;
      map[deptName].totalScore += Number(r.auditScore) || 0;
      if (r.auditScheduleNo) map[deptName].schedulesSet.add(r.auditScheduleNo);
      if (r.auditType) map[deptName].auditTypesSet.add(r.auditType);
      map[deptName].items.push(r);
    });

    return Object.values(map).map((item) => {
      const avgScore = item.count > 0 ? (item.totalScore / item.count).toFixed(1) : '0.0';
      const sortedItems = [...item.items].sort((a, b) => (Number(a.auditScore) || 0) - (Number(b.auditScore) || 0));
      return {
        ...item,
        items: sortedItems,
        avgScore,
        auditTypeCount: item.auditTypesSet.size || 1,
        scheduleCount: item.schedulesSet.size || 1
      };
    }).sort((a, b) => Number(a.avgScore) - Number(b.avgScore));
  }, [filteredRows]);

  // CSV Export Handler
  const handleExportCsv = () => {
    let headers = [];
    let csvRows = [];
    let filename = 'Audit_Score_Report';
    const todayStr = formatIsoDate(new Date());

    if (viewTab === 0) {
      filename = 'Audit_Detailed_Observations_Report';
      headers = [
        'Sl.No',
        'Observation No',
        'Date',
        'Schedule No',
        'Audit Type',
        'Department',
        'Auditee',
        'Auditor',
        'Compliance',
        'NC',
        'OFI',
        'Score',
        'Status'
      ];
      csvRows = filteredRows.map((r, idx) => [
        idx + 1,
        `"${r.observationNo || ''}"`,
        `"${formatDateStr(r.observationDate)}"`,
        `"${r.auditScheduleNo || ''}"`,
        `"${r.auditType || ''}"`,
        `"${r.departmentName || ''}"`,
        `"${r.auditee || ''}"`,
        `"${r.auditor || ''}"`,
        r.complianceCount || 0,
        r.ncrCount || 0,
        r.ofiCount || 0,
        r.auditScore || 0,
        `"${r.status || ''}"`
      ]);
    } else if (viewTab === 1) {
      filename = 'Audit_Department_Score_Summary';
      headers = [
        'Department Name',
        'Total Schedules',
        'Total Audits',
        'Avg Compliance',
        'Avg OFI',
        'Avg NCR',
        'Total NCR',
        'Avg Audit Score',
        'Grade'
      ];
      csvRows = departmentSummary.map((d) => [
        `"${d.departmentName}"`,
        d.scheduleCount || 1,
        d.count,
        d.avgCompliance,
        d.avgOfi,
        d.avgNcr,
        d.totalNcr,
        d.avgScore,
        `"${d.grade}"`
      ]);
    } else if (viewTab === 2) {
      filename = 'Audit_Type_Score_Summary';
      headers = [
        'Audit Type',
        'Total Departments',
        'Total Schedules',
        'Total Audits',
        'Avg Compliance',
        'Avg OFI',
        'Avg NCR',
        'Total NCR',
        'Avg Audit Score'
      ];
      csvRows = auditTypeSummary.map((t) => [
        `"${t.auditType}"`,
        t.departmentCount || 1,
        t.scheduleCount || 1,
        t.count,
        t.avgCompliance,
        t.avgOfi,
        t.avgNcr,
        t.totalNcr,
        t.avgScore
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // BOS Export Report PDF Print Handler
  const handlePrint = () => {
    setReportPdfOpen(true);
  };

  // Render Detailed Cell
  const handleRenderCell = (col, row) => {
    if (col.id === 'observationDate') {
      return formatDateStr(row.observationDate);
    }
    if (col.id === 'auditee') {
      return row.auditee ? String(row.auditee).split(' - ')[0] : '-';
    }
    if (col.id === 'auditor') {
      return row.auditor ? String(row.auditor).split(' - ')[0] : '-';
    }
    if (col.id === 'status') {
      const s = String(row.status || 'OPEN').toUpperCase();
      const color = s === 'CLOSED' || s === 'APPROVED' ? 'success' : s === 'CANCELLED' ? 'error' : 'info';
      return <Chip label={s} size="small" color={color} variant="outlined" sx={{ fontWeight: 600 }} />;
    }
    if (col.id === 'pdf') {
      return (
        <Tooltip title="View Audit Report PDF">
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPdfRow(row);
              setPdfDialogOpen(true);
            }}
          >
            <IconFileTypePdf size={22} color="#d32f2f" />
          </IconButton>
        </Tooltip>
      );
    }
    if (col.id === 'ncrCount') {
      return (
        <Chip
          label={row.ncrCount || 0}
          size="small"
          color={(row.ncrCount || 0) > 0 ? 'error' : 'default'}
          variant={(row.ncrCount || 0) > 0 ? 'filled' : 'outlined'}
          sx={{ fontWeight: 600, minWidth: 32 }}
        />
      );
    }
    if (col.id === 'complianceCount') {
      return (
        <Chip
          label={row.complianceCount || 0}
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 600, minWidth: 32 }}
        />
      );
    }
    if (col.id === 'ofiCount') {
      return (
        <Chip
          label={row.ofiCount || 0}
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 600, minWidth: 32 }}
        />
      );
    }
    if (col.id === 'auditScore') {
      return (
        <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700 }}>
          {row.auditScore || 0}
        </Typography>
      );
    }
    return null;
  };

  // Dynamic BOS Export Designer Data & Columns based on active Tab
  const exportConfig = useMemo(() => {
    if (viewTab === 0) {
      const cols = [
        { id: 'slNo', label: '#', header: '#', render: (r, i) => i + 1 },
        { id: 'departmentName', label: 'Department', header: 'Department' },
        { id: 'auditType', label: 'Audit Type', header: 'Audit Type' },
        { id: 'observationNo', label: 'Observation No', header: 'Observation No' },
        { id: 'auditScheduleNo', label: 'Schedule No', header: 'Schedule No' },
        { id: 'auditScore', label: 'Audit Score', header: 'Audit Score' },
        { id: 'complianceCount', label: 'Compliance', header: 'Compliance' },
        { id: 'ncrCount', label: 'Total NCR', header: 'Total NCR' },
        { id: 'status', label: 'Status', header: 'Status' }
      ];
      return {
        data: filteredRows,
        columns: cols,
        reportName: 'DEPARTMENT & AUDIT TYPE WISE SCORE BREAKDOWN REPORT',
        filename: 'Dept_Audit_Type_Wise_Score_Report'
      };
    }

    if (viewTab === 1) {
      const cols = [
        { id: 'slNo', label: '#', header: '#', render: (r, i) => i + 1 },
        { id: 'auditType', label: 'Audit Type', header: 'Audit Type' },
        { id: 'departmentName', label: 'Department', header: 'Department' },
        { id: 'observationNo', label: 'Observation No', header: 'Observation No' },
        { id: 'auditScheduleNo', label: 'Schedule No', header: 'Schedule No' },
        { id: 'auditScore', label: 'Audit Score', header: 'Audit Score' },
        { id: 'complianceCount', label: 'Compliance', header: 'Compliance' },
        { id: 'ncrCount', label: 'Total NCR', header: 'Total NCR' },
        { id: 'status', label: 'Status', header: 'Status' }
      ];
      return {
        data: filteredRows,
        columns: cols,
        reportName: 'AUDIT TYPE & DEPARTMENT WISE SCORE BREAKDOWN REPORT',
        filename: 'Audit_Type_Dept_Wise_Score_Report'
      };
    }

    if (viewTab === 2) {
      const cols = [
        { id: 'slNo', label: '#', header: '#', render: (r, i) => i + 1 },
        { id: 'auditType', label: 'Audit Type', header: 'Audit Type' },
        {
          id: 'departmentsList',
          label: 'Included Departments',
          header: 'Included Departments',
          render: (r) => (r.departmentsList ? r.departmentsList.join(', ') : '-')
        },
        { id: 'scheduleCount', label: 'Schedules', header: 'Schedules', render: (r) => r.scheduleCount || 1 },
        { id: 'count', label: 'Total Audits', header: 'Total Audits' },
        { id: 'avgCompliance', label: 'Avg Compliance', header: 'Avg Compliance' },
        { id: 'avgOfi', label: 'Avg OFI', header: 'Avg OFI' },
        { id: 'avgNcr', label: 'Avg NCR', header: 'Avg NCR' },
        { id: 'totalNcr', label: 'Total NCR', header: 'Total NCR' },
        { id: 'avgScore', label: 'AVG AUDIT SCORE', header: 'AVG AUDIT SCORE' }
      ];
      return {
        data: auditTypeSummary,
        columns: cols,
        reportName: 'AUDIT TYPE SCORE PERFORMANCE SUMMARY REPORT',
        filename: 'Audit_Type_Score_Summary'
      };
    }

    if (viewTab === 3) {
      const cols = [
        { id: 'slNo', label: '#', header: '#', render: (r, i) => i + 1 },
        { id: 'departmentName', label: 'Department Name', header: 'Department Name' },
        { id: 'scheduleCount', label: 'Schedules', header: 'Schedules', render: (r) => r.scheduleCount || 1 },
        { id: 'count', label: 'Total Audits', header: 'Total Audits' },
        { id: 'avgCompliance', label: 'Avg Compliance', header: 'Avg Compliance' },
        { id: 'avgOfi', label: 'Avg OFI', header: 'Avg OFI' },
        { id: 'avgNcr', label: 'Avg NCR', header: 'Avg NCR' },
        { id: 'totalNcr', label: 'Total NCR', header: 'Total NCR' },
        { id: 'avgScore', label: 'AVG AUDIT SCORE', header: 'AVG AUDIT SCORE' },
        { id: 'grade', label: 'Performance Grade', header: 'Performance Grade' }
      ];
      return {
        data: departmentSummary,
        columns: cols,
        reportName: 'DEPARTMENT AUDIT SCORE PERFORMANCE SUMMARY REPORT',
        filename: 'Department_Audit_Score_Summary'
      };
    }

    // Tab 4: Detailed Observation List
    return {
      data: filteredRows,
      columns: detailedColumns,
      reportName: 'AUDIT OBSERVATIONS & FINDINGS SCORE REPORT',
      filename: 'Audit_Observations_Score_Report'
    };
  }, [viewTab, departmentSummary, auditTypeSummary, filteredRows, detailedColumns]);

  return (
    <MainCard
      fullWidth
      pageCode={PAGE_CODES.QMS_AUDIT_REPORT || 'QM1260'}
      icon={IconReportAnalytics}
      title="Audit Score Report"
      subtitle="QMS Multi-View Quality Audit Score Analysis, Findings Breakdown & Department Performance"
      secondary={
        <Stack direction="row" alignItems="center" spacing={1}>

          <BOSExportButton
            data={exportConfig.data}
            columns={exportConfig.columns}
            reportName={exportConfig.reportName}
            reportTitle={exportConfig.reportName}
            filename={exportConfig.filename}
            buttonLabel="Print"
            buttonIcon={<IconPrinter size={18} />}
            variant="outlined"
            color="secondary"
            size="small"
            pageName="Audit Score Report"
            pageCode="QMS_AUDIT_SCORE_REPORT"
            documentDetails={[
              { label: 'Report Date', value: format(new Date(), 'dd/MM/yyyy') },
              { label: 'Total Audits', value: filteredRows.length },
              { label: 'Overall Avg Score', value: `${metrics.avgScore || 0} / 10` }
            ]}
            signatures={[
              { title: 'Prepared By', name: 'Quality Auditor / Lead' },
              { title: 'Verified By', name: 'Head - Quality Assurance (QA)' }
            ]}
          />
        </Stack>
      }
    >
      {/* Multi-View Tabs & View Switcher Container */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={viewTab}
          onChange={(e, val) => setViewTab(val)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`Department & Audit Type Wise (${deptAndAuditTypeSummary.length})`} sx={{ fontWeight: 600 }} />
          <Tab label={`Audit Type & Department Wise (${auditTypeAndDeptSummary.length})`} sx={{ fontWeight: 600 }} />
          <Tab label={`Audit Type Score Summary (${auditTypeSummary.length})`} sx={{ fontWeight: 600 }} />
          <Tab label={`Department Score Summary (${departmentSummary.length})`} sx={{ fontWeight: 600 }} />
          <Tab label={`Detailed Observation List (${filteredRows.length})`} sx={{ fontWeight: 600 }} />
        </Tabs>

        {(viewTab === 0 || viewTab === 1 || viewTab === 2 || viewTab === 3) && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            {displayMode === 'cards' && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<IconCopy size={16} />}
                  onClick={() => {
                    const tabTitle =
                      viewTab === 0
                        ? 'All Department & Audit Type Cards'
                        : viewTab === 1
                          ? 'All Audit Type & Department Cards'
                          : viewTab === 2
                            ? 'All Audit Type Cards'
                            : 'All Department Cards';
                    copyCardElementAsImage(
                      cardsGridRef.current,
                      tabTitle,
                      (success, name) => setCopySnackbar({ open: true, title: `${name} copied to clipboard!` })
                    );
                  }}
                  sx={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: '10px',
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.12), borderColor: 'primary.dark' }
                  }}
                >
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<IconDeviceFloppy size={16} />}
                  onClick={() => {
                    const filename =
                      viewTab === 0
                        ? 'All_Dept_Audit_Type_Cards'
                        : viewTab === 1
                          ? 'All_Audit_Type_Dept_Cards'
                          : viewTab === 2
                            ? 'All_Audit_Type_Cards'
                            : 'All_Department_Cards';
                    saveCardElementAsImage(
                      cardsGridRef.current,
                      filename,
                      (success, name) => setCopySnackbar({ open: true, title: `${name} Image Saved!` })
                    );
                  }}
                  sx={{
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: '10px',
                    borderColor: 'divider',
                    color: 'text.secondary',
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'action.hover', color: 'text.primary', borderColor: 'text.secondary' }
                  }}
                >
                </Button>
              </Stack>
            )}

            <ToggleButtonGroup
              size="small"
              value={displayMode}
              exclusive
              onChange={(e, val) => val && setDisplayMode(val)}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                p: 0.4,
                borderRadius: '20px',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: '16px !important',
                  px: 1.5,
                  py: 0.4,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: '#ffffff !important',
                    boxShadow: '0 2px 6px rgba(25, 118, 210, 0.4)',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }
                }
              }}
            >
              <ToggleButton value="table" title="Table View">
                <Stack direction="row" alignItems="center" spacing={0.6}>
                  <IconTable size={16} />
                </Stack>
              </ToggleButton>
              <ToggleButton value="cards" title="Card View">
                <Stack direction="row" alignItems="center" spacing={0.6}>
                  <IconLayoutGrid size={16} />
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        )}
      </Stack>

      {/* View Tab 0: Department & Audit Type Wise Breakdown */}
      {viewTab === 0 && (
        <Box sx={{ width: '100%' }}>
          <Grid ref={cardsGridRef} container spacing={2.5} sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {deptAndAuditTypeSummary.map((d, idx) => (
              <DeptAuditTypeBreakdownCard
                key={idx}
                d={d}
                cardIndex={idx}
                onOpenPdf={(r) => {
                  setSelectedPdfRow(r);
                  setPdfDialogOpen(true);
                }}
                onCopyNotify={(name) => setCopySnackbar({ open: true, title: `${name} Card copied to clipboard!` })}
                onSaveNotify={(name) => setCopySnackbar({ open: true, title: `${name} Card Image Saved!` })}
              />
            ))}
          </Grid>
        </Box>
      )}

      {/* View Tab 1: Audit Type & Department Wise Breakdown */}
      {viewTab === 1 && (
        <Box sx={{ width: '100%' }}>
          <Grid ref={cardsGridRef} container spacing={2.5} sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {auditTypeAndDeptSummary.map((t, idx) => (
              <AuditTypeDeptBreakdownCard
                key={idx}
                t={t}
                cardIndex={idx}
                onOpenPdf={(r) => {
                  setSelectedPdfRow(r);
                  setPdfDialogOpen(true);
                }}
                onCopyNotify={(name) => setCopySnackbar({ open: true, title: `${name} Breakdown Card copied to clipboard!` })}
                onSaveNotify={(name) => setCopySnackbar({ open: true, title: `${name} Breakdown Card Image Saved!` })}
              />
            ))}
          </Grid>
        </Box>
      )}

      {/* View Tab 2: Audit Type Score Summary */}
      {viewTab === 2 && (
        displayMode === 'table' ? (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              height: 'calc(100vh - 320px)',
              minHeight: 'calc(100vh - 320px)',
              maxHeight: 'calc(100vh - 320px)',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      bgcolor: '#2196f3 !important',
                      color: '#ffffff !important',
                      fontWeight: 700,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                      py: 1,
                      px: 1.5
                    }
                  }}
                >
                  <TableCell sx={{ color: '#fff !important', fontWeight: 700 }}>Audit Type</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Departments</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Schedules</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Total Audits</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Avg Compliance</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Avg OFI</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Avg NCR</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Total NCR</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700, bgcolor: '#0d47a1 !important' }}>AVG AUDIT SCORE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditTypeSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No audit type summary records found for the selected filters.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  auditTypeSummary.map((t, idx) => {
                    const typeItems = filteredRows.filter(
                      (r) => (r.auditType || 'General Audit') === t.auditType
                    );
                    return (
                      <AuditTypeSummaryRow
                        key={idx}
                        t={t}
                        items={typeItems}
                        onOpenPdf={(row) => {
                          setSelectedPdfRow(row);
                          setPdfDialogOpen(true);
                        }}
                      />
                    );
                  })
                )}
              </TableBody>
              {auditTypeSummary.length > 0 && (
                <TableFooter
                  sx={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 10,
                    bgcolor: 'background.paper',
                    '& td': {
                      borderTop: '2px solid rgba(0,0,0,0.15)',
                      fontWeight: 700,
                      bgcolor: 'background.paper',
                      py: 0.75,
                      px: 1.5
                    }
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Summary Total / Overall Average</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{metrics.totalSchedules}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{metrics.totalAudits}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: 'success.main' }}>{metrics.avgCompliance}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: 'warning.main' }}>{metrics.avgOfi}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: 'error.main' }}>{metrics.avgNcr}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: 'error.main' }}>{metrics.totalNcr}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={metrics.avgScore}
                        size="small"
                        sx={{
                          fontWeight: 900,
                          fontSize: '0.9rem',
                          px: 1.2,
                          bgcolor: '#1565c0',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(21, 101, 192, 0.45)',
                          borderRadius: '12px'
                        }}
                      />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto', p: 1 }}>
            <Grid ref={cardsGridRef} container spacing={2} alignItems="stretch">
              {auditTypeSummary.length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No audit type summary records found for the selected filters.</Typography>
                  </Paper>
                </Grid>
              ) : (
                auditTypeSummary.map((t, idx) => {
                  const typeItems = filteredRows.filter(
                    (r) => (r.auditType || 'General Audit') === t.auditType
                  );
                  return (
                    <AuditTypeCard
                      key={idx}
                      t={t}
                      items={typeItems}
                      cardIndex={idx}
                      onOpenPdf={(row) => {
                        setSelectedPdfRow(row);
                        setPdfDialogOpen(true);
                      }}
                      onCopyNotify={(name) => setCopySnackbar({ open: true, title: `${name} Card copied to clipboard!` })}
                      onSaveNotify={(name) => setCopySnackbar({ open: true, title: `${name} Card Image Saved!` })}
                    />
                  );
                })
              )}
            </Grid>
          </Box>
        )
      )}

      {/* View Tab 3: Department Score Summary */}
      {viewTab === 3 && (
        displayMode === 'table' ? (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              height: 'calc(100vh - 320px)',
              minHeight: 'calc(100vh - 320px)',
              maxHeight: 'calc(100vh - 320px)',
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow
                  sx={{
                    '& th': {
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      bgcolor: '#2196f3 !important',
                      color: '#ffffff !important',
                      fontWeight: 700,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                      py: 1,
                      px: 1.5
                    }
                  }}
                >
                  <TableCell sx={{ color: '#fff !important', fontWeight: 700 }}>Department Name</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Schedules</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Total Audits</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Avg Compliance</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Avg OFI</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Avg NCR</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Total NCR</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700, bgcolor: '#0d47a1 !important' }}>AVG AUDIT SCORE</TableCell>
                  <TableCell align="center" sx={{ color: '#fff !important', fontWeight: 700 }}>Performance Grade</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departmentSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No department score records found for the selected filters.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  departmentSummary.map((d, idx) => {
                    const deptItems = filteredRows.filter(
                      (r) => (r.departmentName || 'General / Unassigned') === d.departmentName
                    );
                    return (
                      <DepartmentSummaryRow
                        key={idx}
                        d={d}
                        items={deptItems}
                        onOpenPdf={(row) => {
                          setSelectedPdfRow(row);
                          setPdfDialogOpen(true);
                        }}
                      />
                    );
                  })
                )}
              </TableBody>
              {departmentSummary.length > 0 && (
                <TableFooter
                  sx={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 10,
                    bgcolor: 'background.paper',
                    '& td': {
                      borderTop: '2px solid rgba(0,0,0,0.15)',
                      fontWeight: 700,
                      bgcolor: 'background.paper',
                      py: 0.75,
                      px: 1.5
                    }
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Summary Total / Overall Average</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>-</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{metrics.totalSchedules}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>{metrics.totalAudits}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: 'success.main' }}>{metrics.avgCompliance}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: 'warning.main' }}>{metrics.avgOfi}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: 'error.main' }}>{metrics.avgNcr}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: 'error.main' }}>{metrics.totalNcr}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={metrics.avgScore}
                        size="small"
                        sx={{
                          fontWeight: 900,
                          fontSize: '0.9rem',
                          px: 1.2,
                          bgcolor: '#1565c0',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(21, 101, 192, 0.45)',
                          borderRadius: '12px'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>-</TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto', p: 1 }}>
            <Grid ref={cardsGridRef} container spacing={2} alignItems="stretch">
              {departmentSummary.length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No department score records found for the selected filters.</Typography>
                  </Paper>
                </Grid>
              ) : (
                departmentSummary.map((d, idx) => {
                  const deptItems = filteredRows.filter(
                    (r) => (r.departmentName || 'General / Unassigned') === d.departmentName
                  );
                  return (
                    <DepartmentCard
                      key={idx}
                      d={d}
                      items={deptItems}
                      cardIndex={idx}
                      onOpenPdf={(row) => {
                        setSelectedPdfRow(row);
                        setPdfDialogOpen(true);
                      }}
                      onCopyNotify={(name) => setCopySnackbar({ open: true, title: `${name} Card copied to clipboard!` })}
                      onSaveNotify={(name) => setCopySnackbar({ open: true, title: `${name} Card Image Saved!` })}
                    />
                  );
                })
              )}
            </Grid>
          </Box>
        )
      )}

      {/* View Tab 4: Detailed Observations List */}
      {viewTab === 4 && (
        <BOSDataTable
          id="qms_audit_score_report_detailed_table"
          columns={detailedColumns}
          data={filteredRows}
          loading={loading}
          showActions={false}
          page={page}
          size={size}
          onPageChange={setPage}
          onSizeChange={setSize}
          renderCell={handleRenderCell}
          sx={{ height: 'calc(100vh - 320px)', minHeight: 'calc(100vh - 320px)' }}
        />
      )}

      {/* Clipboard Copy Success Notification */}
      <Snackbar
        open={copySnackbar.open}
        autoHideDuration={3000}
        onClose={() => setCopySnackbar({ open: false, title: "" })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setCopySnackbar({ open: false, title: "" })}
          severity="success"
          variant="filled"
          sx={{ width: '100%', fontWeight: 700, borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
        >
          {copySnackbar.title} Card copied to clipboard! You can now paste (Ctrl+V) directly into Word, WordPad, or WhatsApp.
        </Alert>
      </Snackbar>

      {/* PDF Dialog */}
      {pdfDialogOpen && (
        <AuditObservationPDFDialog
          open={pdfDialogOpen}
          onClose={() => setPdfDialogOpen(false)}
          row={selectedPdfRow}
        />
      )}

      {/* Full BOS Standard Audit Score Export Report PDF & Print Dialog */}
      {reportPdfOpen && (
        <AuditScoreReportPDFDialog
          open={reportPdfOpen}
          onClose={() => setReportPdfOpen(false)}
          viewTab={viewTab}
          displayMode={displayMode}
          filteredRows={filteredRows}
          departmentSummary={departmentSummary}
          auditTypeSummary={auditTypeSummary}
          metrics={metrics}
          filters={globalFilters}
        />
      )}

    </MainCard>
  );
}
