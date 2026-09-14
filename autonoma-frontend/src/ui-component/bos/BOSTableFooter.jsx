import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setMaxResult } from 'store/slices/search';
import {
  Box, Tooltip, IconButton, Popover, Stack, Typography, Button, Checkbox,
  Pagination, Autocomplete, TextField
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconAdjustmentsHorizontal } from '@tabler/icons-react';

/**
 * BOSTableFooter — Reusable footer for ANY table in the app.
 *
 * Combines:
 *  - Right-aligned TablePagination (styled via global MuiTablePagination theme override)
 *  - Column Visibility toggle popover
 *
 * Usage in a custom-table page:
 *
 *   const [visibleCols, setVisibleCols] = useColumnVisibility(COLUMNS);
 *
 *   <BOSTableFooter
 *     count={filteredRows.length}
 *     page={page}
 *     rowsPerPage={size}
 *     onPageChange={(p) => setPage(p)}
 *     onRowsPerPageChange={(s) => { setSize(s); setPage(0); }}
 *     columns={COLUMNS}
 *     visibleColumnIds={visibleCols}
 *     onToggleColumn={(id) => setVisibleCols(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])}
 *     onShowAllColumns={() => setVisibleCols(COLUMNS.map(c => c.id))}
 *     onResetColumns={() => setVisibleCols(COLUMNS.map(c => c.id))}
 *     leftContent={<SomeFooterAction />}
 *   />
 *
 * Props:
 *  - count, page, rowsPerPage, onPageChange, onRowsPerPageChange  → standard MUI TablePagination props
 *  - rowsPerPageOptions     → default [5, 10, 25, 50]
 *  - columns                → array of { id, label } — if omitted, no toggle button is shown
 *  - requiredColumnIds      → column IDs that cannot be hidden (default: ['index','photo','actions'])
 *  - visibleColumnIds       → controlled list of visible column IDs
 *  - onToggleColumn(id)     → called when user clicks a column row
 *  - onShowAllColumns()     → called when "Show All" is clicked
 *  - onResetColumns()       → called when "Reset to Default" is clicked
 *  - leftContent            → optional ReactNode rendered on the left side (footerActions)
 *  - sx                     → extra sx for the outer Box wrapper
 */
export default function BOSTableFooter({
  // Pagination
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50],
  labelDisplayedRows,

  // Column toggle
  columns,
  requiredColumnIds = ['index', 'photo', 'actions'],
  visibleColumnIds,
  onToggleColumn,
  onShowAllColumns,
  onResetColumns,

  // Layout
  leftContent,
  sx = {}
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const showToggle = columns && columns.length > 0 && visibleColumnIds && onToggleColumn;

  const dispatch = useDispatch();
  const globalMaxResult = useSelector((state) => state.search?.maxResult || '');
  const [localMaxResult, setLocalMaxResult] = useState(globalMaxResult);

  useEffect(() => {
    setLocalMaxResult(globalMaxResult);
  }, [globalMaxResult]);

  const from = count === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min((page + 1) * rowsPerPage, count);
  const pageCount = Math.max(0, Math.ceil(count / rowsPerPage));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        minHeight: '52px',
        gap: { xs: 1.5, sm: 0 },
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: isDark ? 'background.default' : 'grey.50',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
        ...sx
      }}
    >
      {/* Left side — optional footer actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: 1 }}>
        {leftContent}
      </Box>

      {/* Right side — Pagination + Column Toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-end' }, flexWrap: 'wrap', gap: 1.5 }}>
        {count > 0 && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', mr: 1, fontSize: '0.875rem' }}>
                Rows per page:
              </Typography>
              <Tooltip title="Rows Per Page">
                <span>
                  <Autocomplete
                    key={`page-size-auto-${rowsPerPage}`}
                    freeSolo
                    disableClearable
                    options={rowsPerPageOptions.map(String)}
                    value={String(rowsPerPage)}
                    onChange={(e, newValue) => {
                      if (newValue) {
                        const val = parseInt(newValue, 10);
                        if (!isNaN(val) && val > 0) {
                          onRowsPerPageChange(val);
                        } else {
                          onRowsPerPageChange(10);
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val > 0) {
                        onRowsPerPageChange(val);
                      } else {
                        onRowsPerPageChange(10);
                        e.target.value = String(rowsPerPage === 10 ? 10 : rowsPerPage);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val > 0) {
                          onRowsPerPageChange(val);
                        } else {
                          onRowsPerPageChange(10);
                          e.target.value = String(rowsPerPage === 10 ? 10 : rowsPerPage);
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        size="small"
                        sx={{
                          width: 85,
                          '& .MuiOutlinedInput-root': {
                            height: '34px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            bgcolor: 'background.paper',
                            '& fieldset': {
                              borderColor: 'divider',
                            },
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'primary.main',
                              borderWidth: '2px'
                            }
                          },
                          '& .MuiInputBase-input': {
                            textAlign: 'center',
                            color: 'primary.main',
                            fontWeight: 700,
                          }
                        }}
                      />
                    )}
                  />
                </span>
              </Tooltip>
            </Box>

            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : 'primary.lighter',
                px: 1.5,
                py: 0.5,
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isDark ? 'rgba(33, 150, 243, 0.3)' : 'primary.light',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                fontSize: '0.8125rem',
                whiteSpace: 'nowrap'
              }}
            >
              Showing {from} to {to} of {count}
            </Typography>

            <Tooltip title="Pagination">
              <Box sx={{ flexShrink: 0 }}>
                <Pagination
                  count={pageCount}
                  page={page + 1}
                  onChange={(e, newPage) => onPageChange(newPage - 1)}
                  showFirstButton
                  showLastButton
                  size="small"
                  color="primary"
                  shape="rounded"
                  variant="outlined"
                  sx={{
                    '@keyframes flipHorizontal': {
                      '0%': { transform: 'perspective(400px) rotateY(0deg) scale(0.85)' },
                      '100%': { transform: 'perspective(400px) rotateY(360deg) scale(1.15)' }
                    },
                    '& .MuiPagination-ul': {
                      alignItems: 'center',
                    },
                    '& .MuiPaginationItem-root': {
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    '& .MuiPaginationItem-page': {
                      transform: 'scale(0.85)',
                      opacity: 0.6,
                      borderRadius: '6px',
                    },
                    '& .MuiPaginationItem-page:hover': {
                      opacity: 0.9,
                      transform: 'scale(0.95)',
                    },
                    '& .MuiPaginationItem-page.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: '#fff',
                      borderColor: 'primary.main',
                      opacity: 1,
                      transform: 'scale(1.15)',
                      margin: '0 6px',
                      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                      animation: 'flipHorizontal 0.5s ease-out',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                        transform: 'scale(1.15)',
                      }
                    },
                    '& .MuiPaginationItem-previousNext': {
                      borderRadius: '50%',
                      backgroundColor: 'transparent',
                      color: 'primary.main',
                      border: '1px solid',
                      borderColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.lighter'
                      }
                    },
                    '& .MuiPaginationItem-firstLast': {
                      borderRadius: '50%',
                      backgroundColor: 'transparent',
                      color: 'text.secondary',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }
                  }}
                />
              </Box>
            </Tooltip>
          </>
        )}

        <Tooltip title="Max Records">
          <TextField
            placeholder="Max Records"
            variant="outlined"
            size="small"
            type="number"
            value={localMaxResult}
            onChange={(e) => setLocalMaxResult(e.target.value)}
            onBlur={() => {
              if (localMaxResult !== globalMaxResult) {
                dispatch(setMaxResult(localMaxResult));
                sessionStorage.setItem('maxResult', localMaxResult);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.target.blur();
              }
            }}
            sx={{
              width: 140,
              '& .MuiOutlinedInput-root': {
                height: '34px',
                borderRadius: '8px',
                fontWeight: 600,
                bgcolor: 'background.paper',
                '& fieldset': {
                  borderColor: 'divider',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: '2px'
                }
              },
              '& .MuiInputBase-input': {
                textAlign: 'center',
                color: 'primary.main',
                fontWeight: 700,
                '&::placeholder': {
                  color: 'primary.main',
                  fontWeight: 700,
                  opacity: 1
                }
              }
            }}
          />
        </Tooltip>


        {/* Column Toggle Button */}
        {showToggle && (
          <>
            <Tooltip title="Toggle Columns">
              <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  ml: 0.5,
                  mr: 0.5,
                  p: 0.5,
                  color: Boolean(anchorEl) ? 'primary.main' : 'text.secondary',
                  bgcolor: Boolean(anchorEl) ? 'primary.lighter' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <IconAdjustmentsHorizontal size={18} />
              </IconButton>
            </Tooltip>

            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  p: 2,
                  width: 260,
                  maxHeight: 380,
                  boxShadow: '0px -8px 24px rgba(0,0,0,0.12)',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column'
                }
              }}
            >
              {/* Header */}
              <Stack direction="row" justifyContent="space-between" alignItems="center"
                sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Toggle Columns</Typography>
                {onShowAllColumns && (
                  <Button size="small" onClick={onShowAllColumns}
                    sx={{ textTransform: 'none', fontWeight: 600, p: 0 }}>
                    Show All
                  </Button>
                )}
              </Stack>

              {/* Column list */}
              <Box sx={{
                overflowY: 'auto', flex: 1, py: 1, my: 1, pr: 0.5,
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: '4px' }
              }}>
                <Stack spacing={0.5}>
                  {columns.map((col) => {
                    const isRequired = requiredColumnIds.includes(col.id);
                    const isVisible = visibleColumnIds.includes(col.id);
                    return (
                      <Box
                        key={col.id}
                        onClick={() => { if (!isRequired) onToggleColumn(col.id); }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 0.5, px: 1,
                          borderRadius: '6px',
                          cursor: isRequired ? 'default' : 'pointer',
                          bgcolor: isRequired ? 'grey.50' : 'transparent',
                          opacity: isRequired ? 0.7 : 1,
                          '&:hover': { bgcolor: isRequired ? 'grey.50' : 'action.hover' }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontSize: '0.825rem', fontWeight: isRequired ? 600 : 400 }}>
                          {col.id === 'index' ? 'No' : col.label}
                        </Typography>
                        <Checkbox
                          size="small"
                          checked={isVisible}
                          disabled={isRequired}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => { if (!isRequired) onToggleColumn(col.id); }}
                          sx={{ p: 0.5 }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              {/* Reset footer */}
              {onResetColumns && (
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 1, mt: 0.5, display: 'flex', justifyContent: 'center' }}>
                  <Button size="small" variant="text" onClick={onResetColumns}
                    sx={{ textTransform: 'none', fontWeight: 600, color: 'error.main', p: 0 }}>
                    Reset to Default
                  </Button>
                </Box>
              )}
            </Popover>
          </>
        )}
      </Box>
    </Box>
  );
}

BOSTableFooter.propTypes = {
  count: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onRowsPerPageChange: PropTypes.func.isRequired,
  rowsPerPageOptions: PropTypes.array,
  labelDisplayedRows: PropTypes.func,
  columns: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, label: PropTypes.string })),
  requiredColumnIds: PropTypes.arrayOf(PropTypes.string),
  visibleColumnIds: PropTypes.arrayOf(PropTypes.string),
  onToggleColumn: PropTypes.func,
  onShowAllColumns: PropTypes.func,
  onResetColumns: PropTypes.func,
  leftContent: PropTypes.node,
  sx: PropTypes.object
};
