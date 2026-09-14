import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  InputAdornment,
  Stack,
  IconButton,
  MenuItem
} from '@mui/material';
import { IconSearch, IconCheck } from '@tabler/icons-react';
import { BOSTextField, BOSFormDialog, BOSDataTable } from 'ui-component/bos';

const RM_DATA = [
  { id: 1, partNo: 'NT/NIL', partName: 'NIL' },
  { id: 2, partNo: 'NT/A20101/8R', partName: 'BRAKE PAD RAW MATERIAL WITH TEFLON WIRE' },
  { id: 3, partNo: 'NT/A21101/2R', partName: 'CASTING SG400/15 FOR A21101' },
  { id: 4, partNo: 'NT/A32101A/1R', partName: 'ROD STEEL MS DIA 35 X L 65 MM' },
  { id: 5, partNo: 'NT/A32101B/1R', partName: 'PROFILE CUTTING MS X THK 16 MM' },
  { id: 6, partNo: 'NT/A32101C/8R', partName: 'SHEET ASBESTOS 5 MM THK' },
  { id: 7, partNo: 'NT/A32201A/1R', partName: 'PROFILE CUTTING MS X THK 10 MM' },
  { id: 8, partNo: 'NT/A32201C/8R', partName: 'ASBESTOS LINER' },
  { id: 9, partNo: 'NT/A32302A/1R', partName: 'PLATE STEEL EN 32 A BRIGHT BAR THK 38 X W 60 X L 155 MM' },
  { id: 10, partNo: 'NT/A39201/2R', partName: 'CASTING SG700/2 FOR A39201' },
  { id: 11, partNo: 'NT/A39203A/1R', partName: 'ROD EN353 DIA 265 x L 55 MM' },
  { id: 12, partNo: 'NT/A39204/1R', partName: 'ROD STEEL 16MnCr5 DIA 80 X L 182 MM' },
  { id: 13, partNo: 'NT/A39205A/2R', partName: 'CASTING SG500/7 FOR A39205A' },
  { id: 14, partNo: 'NT/A39205A1-1/1R', partName: 'WASHER - MS -OD 130mm X TH 8mm ( IS 2062 )' },
  { id: 15, partNo: 'NT/A40101/6R', partName: 'BLOCK ALUMINIUM HE 30 SQ 110 X L 150 MM' },
  { id: 16, partNo: 'NT/A40103C/R', partName: 'ROD BRASS DIA 20 X L 8 MM' },
  { id: 17, partNo: 'NT/A40104B/6R', partName: 'BLOCK ALUMINIUM HE 30 THK 80 X W 85 X L 85 MM' },
  { id: 18, partNo: 'NT/A40104C/1R', partName: 'ROD STEEL MS BRIGHT DIA 70 X L 83 MM' },
  { id: 19, partNo: 'NT/A40104F/6R', partName: 'ROD ALUMINIUM HE 30 DIA 25 X L 14 MM' },
  { id: 20, partNo: 'NT/A40104G/6R', partName: 'ROD ALUMINIUM HE 30 DIA 20 X L 38 MM' }
];

const PRODUCT_DATA = [
  { id: 0, partNo: 'NIL', partName: 'NO PRODUCT / UNSELECT' },
  { id: 1, partNo: 'PRD/FIN/001', partName: 'FINISHED PRODUCT A' },
  { id: 2, partNo: 'PRD/FIN/002', partName: 'FINISHED PRODUCT B' },
  { id: 3, partNo: 'PRD/ASM/001', partName: 'ASSEMBLY UNIT 1' }
];

export default function MaterialSelectionDialog({ open, onClose, onSelect, type }) {
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('partName');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const data = type === 'RM' ? RM_DATA : PRODUCT_DATA;

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item[searchBy]?.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search, searchBy]);

  const handleClear = () => {
    onSelect({ partNo: '', partName: '' });
  };

  const columns = [
    { id: 'index', label: 'Sl No', minWidth: 60, align: 'center' },
    { id: 'partNo', label: 'Part No', minWidth: 180 },
    { id: 'partName', label: 'Part Name', minWidth: 300 },
    { id: 'select', label: 'Select', minWidth: 80, align: 'center' }
  ];

  const renderCell = (col, row, idx) => {
    if (col.id === 'index') {
      return (
        <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary' }}>
          {idx + 1 + page * size}
        </Typography>
      );
    }
    if (col.id === 'partNo') {
      return (
        <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main' }}>
          {row.partNo}
        </Typography>
      );
    }
    if (col.id === 'partName') {
      return <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.partName}</Typography>;
    }
    if (col.id === 'select') {
      return (
        <IconButton 
          size="small" 
          color="primary" 
          onClick={() => onSelect(row)}
          sx={{ bgcolor: 'primary.lighter', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
        >
          <IconCheck size={18} />
        </IconButton>
      );
    }
    return row[col.id];
  };

  return (
    <BOSFormDialog
      open={open}
      onClose={onClose}
      onClear={handleClear}
      title={`Select ${type === 'RM' ? 'Raw Material' : 'Product'}`}
      maxWidth="md"
      sx={{ zIndex: 1600 }}
    >
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
          <BOSTextField
            select
            label="Search By"
            value={searchBy}
            onChange={(e) => setSearchBy(e.target.value)}
            sx={{ width: 150 }}
            size="small"
          >
            <MenuItem value="partNo">Part No</MenuItem>
            <MenuItem value="partName">Part Name</MenuItem>
          </BOSTextField>
          <BOSTextField
            fullWidth
            placeholder="Search Here..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={18} />
                </InputAdornment>
              )
            }}
          />
        </Stack>

        <BOSDataTable
          columns={columns}
          rows={filteredData}
          page={page}
          size={size}
          loading={false}
          onPageChange={setPage}
          onSizeChange={(s) => { setSize(s); setPage(0); }}
          onDoubleClickRow={onSelect}
          renderCell={renderCell}
          showActions={false}
          id="material-selection-table"
          disableSearchFilter={true}
          disableTableConfig={true}
          sx={{ height: 420 }}
        />
        
        <Box sx={{ mt: 1, textAlign: 'right' }}>
           <Typography variant="caption" color="text.secondary" fontWeight={800}>
              Showing {filteredData.length} records • Double-click row to select
           </Typography>
        </Box>
      </Box>
    </BOSFormDialog>
  );
}
