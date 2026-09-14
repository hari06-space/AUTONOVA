import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { Box, Avatar, Tooltip } from '@mui/material';
import { IconUsers } from '@tabler/icons-react';
import axios from 'utils/axios';
import MainCard from 'ui-component/cards/MainCard';
import { BOSDataTable, BOSTableToolbar } from 'ui-component/bos';
import usePagePermissions from 'hooks/usePagePermissions';
import { setFilterConfig, setFilters } from 'store/slices/search';

export default function UnallocatedResourceReport() {
  const perms = usePagePermissions("QMS2001");
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const urlAssignment = searchParams.get('awaitingAssignment');
  const globalFilters = useSelector((state) => state.search?.filters || {});

  const mapRawRows = (data) => {
    return Array.isArray(data) ? data.map((r, i) => {
      const getField = (key) => {
        if (r[key] !== undefined && r[key] !== null) return r[key];
        const lowerKey = key.toLowerCase();
        const foundKey = Object.keys(r).find(k => k.toLowerCase() === lowerKey || k.toLowerCase().replace(/_/g, '') === lowerKey);
        return foundKey ? r[foundKey] : undefined;
      };

      return {
        ...r,
        id: getField('id') || (i + 1),
        sno: i + 1,
        empCode: getField('empCode') || '',
        employeeName: getField('employeeName') || '',
        departmentName: getField('departmentName') || '',
        designationName: getField('designationName') || '',
        awaitingAssignment: getField('awaitingAssignment') || '',
        categoryName: getField('categoryName') || '',
        dateOfJoining: getField('dateOfJoining') || '',
        verticalHead: getField('verticalHead') || '',
        image: getField('image') || ''
      };
    }) : [];
  };

  // Data - Initialize instantly from session cache if available
  const [rows, setRows] = useState(() => {
    try {
      const cached = sessionStorage.getItem('unallocated_resources_full_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mapRawRows(parsed);
        }
      }
    } catch (e) { }
    return [];
  });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [loading, setLoading] = useState(() => {
    try {
      const cached = sessionStorage.getItem('unallocated_resources_full_cache');
      if (cached && JSON.parse(cached)?.length > 0) return false;
    } catch (e) { }
    return true;
  });

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get('/api/qms/meeting-schedules/unallocated-resources');
      const rawList = Array.isArray(response.data) ? response.data : [];
      try {
        sessionStorage.setItem('unallocated_resources_full_cache', JSON.stringify(rawList));
      } catch (e) { }
      setRows(mapRawRows(rawList));
    } catch (e) {
      console.error('Failed to fetch unallocated resources:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const VALID_FILTER_KEYS = useMemo(() => new Set([
    'empCode',
    'employeeName',
    'departmentName',
    'designationName',
    'awaitingAssignment',
    'categoryName',
    'dateOfJoining',
    'verticalHead'
  ]), []);

  // Global filters configuration
  useEffect(() => {
    dispatch(setFilterConfig({
      config: [
        { id: 'empCode', label: 'Employee Code', type: 'text', isStarred: true },
        { id: 'employeeName', label: 'Employee Name', type: 'text', isStarred: true },
        { id: 'departmentName', label: 'Department', type: 'text', isStarred: true },
        { id: 'designationName', label: 'Designation', type: 'text', isStarred: true },
        {
          id: 'awaitingAssignment',
          label: 'Awaiting Assignment',
          type: 'multiselect',
          multiple: true,
          isStarred: true,
          defaultValue: urlAssignment ? [urlAssignment] : [],
          options: [
            { value: 'Meeting', label: 'Meeting' },
            { value: 'Audit', label: 'Audit' },
            { value: 'CheckList', label: 'CheckList' },
            { value: 'User Access', label: 'User Access' }
          ]
        },
        { id: 'categoryName', label: 'Category', type: 'text' },
        { id: 'dateOfJoining', label: 'Date Of Joining', type: 'text' },
        { id: 'verticalHead', label: 'Vertical Head', type: 'text' }
      ],
      path: '/reports/unallocated-resource'
    }));

    dispatch(setFilters({
      empCode: '',
      employeeName: '',
      departmentName: '',
      designationName: '',
      categoryName: '',
      dateOfJoining: '',
      verticalHead: '',
      awaitingAssignment: urlAssignment ? [urlAssignment] : []
    }));

    return () => {
      dispatch(setFilterConfig({ config: null, path: '/reports/unallocated-resource' }));
      dispatch(setFilters({}));
    };
  }, [dispatch, urlAssignment]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      for (const [key, value] of Object.entries(globalFilters)) {
        if (!VALID_FILTER_KEYS.has(key)) continue;
        if (!value || value === 'All' || value === 'ALL') continue;
        if (Array.isArray(value) && (value.length === 0 || value.includes('All') || value.includes('ALL'))) continue;

        let rowVal = '';
        if (key === 'dateOfJoining' && row[key]) {
          rowVal = new Date(row[key]).toLocaleDateString('en-GB').toLowerCase();
        } else {
          rowVal = row[key] ? String(row[key]).toLowerCase() : '';
        }

        if (Array.isArray(value)) {
          const matches = value.some(val => {
            if (!val || val === 'All' || val === 'ALL') return true;
            return rowVal.includes(String(val).toLowerCase().trim());
          });
          if (!matches) return false;
        } else {
          const filterVal = String(value).toLowerCase().trim();
          if (!rowVal.includes(filterVal)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [rows, globalFilters, VALID_FILTER_KEYS]);

  const columns = useMemo(() => ([
    { id: 'sno', label: 'S.No', align: 'center', width: 70 },
    {
      id: 'image', label: 'Image', align: 'center', width: 80,
      render: (row) => {
        const val = row.image;
        const imgSrc = val ? `${axios.defaults.baseURL || import.meta.env.VITE_APP_API_URL || 'http://localhost:8080'}/api/files/download/${val}` : '/assets/images/users/user-round.svg';
        return (
          <Tooltip
            title={
              <Box
                component="img"
                src={imgSrc}
                alt={row.employeeName}
                sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 1 }}
              />
            }
            placement="top"
            arrow
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'background.paper',
                  boxShadow: 3,
                  p: 0.5,
                  borderRadius: 1
                }
              },
              arrow: {
                sx: {
                  color: 'background.paper'
                }
              }
            }}
          >
            <Avatar
              src={imgSrc}
              alt={row.employeeName}
              sx={{ width: 40, height: 40, margin: 'auto', cursor: 'pointer' }}
            />
          </Tooltip>
        );
      }
    },
    { id: 'empCode', label: 'Employee Code', minWidth: 150, bold: true, align: 'center' },
    { id: 'employeeName', label: 'Employee Name', minWidth: 200, align: 'center' },
    { id: 'departmentName', label: 'Department', minWidth: 180, align: 'center', format: (val) => val || 'N/A' },
    { id: 'designationName', label: 'Designation', minWidth: 180, align: 'center', format: (val) => val || 'N/A' },
    {
      id: 'awaitingAssignment',
      label: 'Awaiting Assignment',
      minWidth: 180,
      align: 'center',
      format: (val, row) => {
        const original = row.awaitingAssignment || val || '';
        if (!original) return 'N/A';
        const filters = globalFilters?.awaitingAssignment || [];
        if (Array.isArray(filters) && filters.length > 0 && !filters.includes('All') && !filters.includes('ALL')) {
          const parts = original.split(',').map(s => s.trim());
          const matched = parts.filter(p => filters.some(f => p.toLowerCase().includes(String(f).toLowerCase().trim())));
          if (matched.length > 0) return matched.join(', ');
        }
        return original;
      }
    },
    { id: 'categoryName', label: 'Category', minWidth: 150, align: 'center', format: (val) => val || 'N/A' },
    {
      id: 'dateOfJoining', label: 'Date Of Joining', minWidth: 150, align: 'center',
      format: (val) => val ? new Date(val).toLocaleDateString('en-GB') : 'N/A'
    },
    { id: 'verticalHead', label: 'Vertical Head', minWidth: 180, align: 'center', format: (val) => val || 'N/A' }
  ]), [globalFilters]);

  return (
    <MainCard
      contentSX={{ p: 0 }}
      icon={IconUsers}
      title="Unallocated Resources"
      secondary={
        <BOSTableToolbar
          onRefresh={fetchData}
          exportData={filteredRows}
          exportFilename="Unallocated_Resources_Report"
          hasExportPermission={perms?.export !== false}
          columns={columns}
        />
      }
    >
      <BOSDataTable
        columns={columns}
        rows={filteredRows}
        page={page}
        size={size}
        loading={loading}
        onPageChange={setPage}
        onSizeChange={(s) => { setSize(s); setPage(0); }}
      />
    </MainCard>
  );
}
