import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Tooltip, Avatar, useTheme, Chip } from '@mui/material';
import { IconCategory } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import usePagePermissions, { PAGE_CODES } from 'hooks/usePagePermissions';
import { setFilterConfig } from 'store/slices/search';
import { API_BASE } from 'utils/api-constants';
import autonomaLogo from 'assets/images/autonoma-logo.png';

export default function CurrentStockReport() {
  const theme = useTheme();
  const perms = usePagePermissions(PAGE_CODES.INV_CURRENT_STOCK_REPORT);
  const dispatch = useDispatch();
  const globalFilters = useSelector((state) => state.search.filters);
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchOptions = async () => {
      try {
        const [divRes, prodRes] = await Promise.all([
          axios.get('/api/admin/divisions'),
          axios.get('/api/master/npd/product-master/list')
        ]);
        if (!active) return;

        const divs = Array.isArray(divRes.data) ? divRes.data : [];
        setDivisions(divs);

        const productOptions = Array.isArray(prodRes.data) ? prodRes.data.map(p => ({
          value: p.id,
          label: `${p.itemNo} - ${p.itemName}`
        })) : [];

        dispatch(setFilterConfig([
          { id: 'productId', label: 'Product (Part No)', type: 'autocomplete', options: productOptions },
          { id: 'inventoryType', label: 'Inventory Type', type: 'text' }
        ]));
      } catch (e) {
        console.error('Failed to fetch filter options:', e);
      }
    };

    dispatch(setFilterConfig([
      { id: 'productId', label: 'Product (Part No)', type: 'autocomplete', options: [] },
      { id: 'inventoryType', label: 'Inventory Type', type: 'text' }
    ]));

    fetchOptions();

    return () => {
      active = false;
      dispatch(setFilterConfig(null));
    };
  }, [dispatch]);

  // Data
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size };
      if (globalFilters?.productId) params.productId = globalFilters.productId;
      if (globalFilters?.inventoryType) params.inventoryType = globalFilters.inventoryType;

      const response = await axios.get('/api/inventory/transaction/reports/current-stock', { params });

      const content = response.data?.content || [];
      const dataWithIds = content.map((r, i) => {
        const row = {
          ...r,
          id: r.id || `row_${i}`,
          productIdentity: `${r.itemNo} - ${r.itemName}`
        };
        divisions.forEach(div => {
          row[`div_stock_${div.id}`] = r.divisionStocks?.[div.id] || 0;
          row[`div_value_${div.id}`] = r.divisionValues?.[div.id] || 0;
        });
        return row;
      });

      setRows(dataWithIds);
      setTotalElements(response.data?.totalElements || 0);
    } catch (e) {
      console.error('Failed to fetch current stock report:', e);
    } finally {
      setLoading(false);
    }
  }, [globalFilters, page, size, divisions]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = useMemo(() => {
    const cols = [
      { id: 'index', label: '#', minWidth: 50, frozen: true },
      {
        id: 'productIdentity',
        label: 'Item No & Product Name',
        minWidth: 300,
        bold: true,
        frozen: true,
        render: (row) => {
          let imgSrc = autonomaLogo;
          if (row.productImage) {
            imgSrc = row.productImage.startsWith('http') ? row.productImage : `${API_BASE}/files${row.productImage}`;
          }
          return (
            <Box display="flex" alignItems="center" gap={1.5}>
              <Tooltip
                title={<img src={imgSrc} alt="Preview" style={{ maxWidth: 200, maxHeight: 200, objectFit: 'contain' }} />}
                placement="right"
                componentsProps={{ tooltip: { sx: { bgcolor: 'background.paper', boxShadow: theme.shadows[5], p: 1, border: '1px solid', borderColor: 'divider' } } }}
              >
                <Avatar variant="rounded" src={imgSrc} sx={{ width: 40, height: 40, cursor: 'pointer', bgcolor: theme.palette.mode === 'dark' ? '#333' : '#f1f5f9' }} />
              </Tooltip>
              <Box>
                <Box sx={{ fontWeight: 'bold' }}>{row.itemNo}</Box>
                <Box sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{row.itemName}</Box>
              </Box>
            </Box>
          );
        }
      },
      { id: 'uom', label: 'UOM', minWidth: 100 },

      {
        id: 'itemGroup',
        label: 'Item Group & Category',
        minWidth: 150,
        render: (row) => (
          <Box display="flex" flexDirection="column" gap={0.5} alignItems="flex-start">
            <Box>{row.itemGroup || '-'}</Box>
            {row.itemCategory && (
              <Chip
                label={row.itemCategory}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', bgcolor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : '#e3f2fd', color: theme.palette.mode === 'dark' ? '#90caf9' : '#1565c0' }}
              />
            )}
          </Box>
        )
      },
      {
        id: 'rackBin',
        label: 'Rack & Bin',
        minWidth: 150,
        render: (row) => (
          <Box display="flex" flexDirection="column" gap={0.5} alignItems="flex-start">
            <Box>{row.rackName || '-'}</Box>
            {row.binName && (
              <Chip
                label={row.binName}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', bgcolor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.2)' : '#f3e5f5', color: theme.palette.mode === 'dark' ? '#ce93d8' : '#7b1fa2' }}
              />
            )}
          </Box>
        )
      }
    ];

    divisions.forEach(div => {
      cols.push({
        id: `div_stock_${div.id}`,
        label: `Stock`,
        groupLabel: div.divisionName,
        minWidth: 130,
        type: 'number',
        align: 'right'
      });
      cols.push({
        id: `div_value_${div.id}`,
        label: `Value`,
        groupLabel: div.divisionName,
        minWidth: 130,
        type: 'number',
        align: 'right'
      });
    });

    cols.push({ id: 'totalStock', label: 'Total Stock', minWidth: 150, type: 'number', bold: true, align: 'right' });
    cols.push({ id: 'avgPrice', label: 'Avg. Price', minWidth: 130, type: 'number', align: 'right' });
    cols.push({ id: 'totalValue', label: 'Total Value', minWidth: 150, type: 'number', bold: true, align: 'right' });

    return cols;
  }, [divisions]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      icon={IconCategory}
      title="Current Stock "
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={rows}
          exportFilename="Current_Stock_Report"
          hasExportPermission={perms?.export}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={rows}
        page={page}
        size={size}
        totalRows={totalElements}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
      />
    </MainCard>
  );
}
