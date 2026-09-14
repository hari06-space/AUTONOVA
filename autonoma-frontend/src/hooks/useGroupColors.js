import { useCallback } from 'react';
import { useTheme, alpha } from '@mui/material/styles';

export const useGroupColors = () => {
  const theme = useTheme();
  return useCallback(
    (title) => {
      const t = (title || '').toUpperCase();
      const isDark = theme.palette.mode === 'dark';
      const getLighter = (hex) => alpha(hex, isDark ? 0.18 : 0.08);

      // Distinct Material Palette Colors
      if (t.includes('MASTER')) return { main: '#0277bd', light: '#4fc3f7', lighter: getLighter('#0277bd') }; // Light Blue
      if (t.includes('HRA') || t.includes('HR')) return { main: '#ef6c00', light: '#ffb74d', lighter: getLighter('#ef6c00') }; // Orange
      if (t.includes('SALES') || t.includes('MARKETING')) return { main: '#2e7d32', light: '#81c784', lighter: getLighter('#2e7d32') }; // Green
      if (t.includes('PLANNING') || t.includes('PURCHASE')) return { main: '#283593', light: '#7986cb', lighter: getLighter('#283593') }; // Indigo
      if (t.includes('PRODUCTION')) return { main: '#4527a0', light: '#9575cd', lighter: getLighter('#4527a0') }; // Deep Purple
      if (t.includes('STORE') || t.includes('LOGISTICS')) return { main: '#4e342e', light: '#a1887f', lighter: getLighter('#4e342e') }; // Brown
      if (t.includes('FINANCE')) return { main: '#ff8f00', light: '#ffd54f', lighter: getLighter('#ff8f00') }; // Amber
      if (t.includes('DESIGN')) return { main: '#558b2f', light: '#aed581', lighter: getLighter('#558b2f') }; // Light Green
      if (t.includes('MAINTENANCE')) return { main: '#9e9d24', light: '#dce775', lighter: getLighter('#9e9d24') }; // Lime
      if (t.includes('QMS') || t.includes('QMT') || t.includes('QUALITY')) return { main: '#ad1457', light: '#f06292', lighter: getLighter('#ad1457') }; // Pink
      if (t.includes('ORDER')) return { main: '#424242', light: '#9e9e9e', lighter: getLighter('#424242') }; // Grey
      if (t.includes('REPORT')) return { main: '#c62828', light: '#e57373', lighter: getLighter('#c62828') }; // Red
      if (t.includes('EMPLOYEE')) return { main: '#00695c', light: '#4db6ac', lighter: getLighter('#00695c') }; // Teal
      if (t.includes('ADMIN')) return { main: '#00838f', light: '#4dd0e1', lighter: getLighter('#00838f') }; // Cyan
      if (t.includes('DASHBOARD')) return { main: '#1565c0', light: '#64b5f6', lighter: getLighter('#1565c0') }; // Blue
      if (t.includes('SUPPORT')) return { main: '#6a1b9a', light: '#ba68c8', lighter: getLighter('#6a1b9a') }; // Purple
      if (t.includes('CLIENT')) return { main: '#d84315', light: '#ff8a65', lighter: getLighter('#d84315') }; // Deep Orange

      // Default fallback to blue grey if unknown
      return { main: '#37474f', light: '#90a4ae', lighter: getLighter('#37474f') };
    },
    [theme]
  );
};
