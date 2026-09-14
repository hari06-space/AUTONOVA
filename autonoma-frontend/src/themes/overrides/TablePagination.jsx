// ==============================|| OVERRIDES - TABLE PAGINATION ||============================== //
//
// This override applies globally to ALL MUI TablePagination components across the entire app.
// Pagination is right-aligned, compact, and consistent — configure here once, works everywhere.
//

export default function TablePagination() {
  return {
    MuiTablePagination: {
      defaultProps: {
        rowsPerPageOptions: [5, 10, 25, 50]
      },
      styleOverrides: {
        root: {
          // Right-align the entire pagination block
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden'
        },
        toolbar: {
          // Compact height, all items snug to the right
          minHeight: '40px !important',
          height: '40px',
          padding: '0 8px !important',
          justifyContent: 'flex-end',
          flexWrap: 'nowrap',
          gap: '4px'
        },
        spacer: {
          // Remove the left spacer so content stays right-aligned
          display: 'none'
        },
        selectLabel: {
          margin: 0,
          fontSize: '0.75rem',
          fontWeight: 500
        },
        displayedRows: {
          margin: 0,
          fontSize: '0.75rem',
          fontWeight: 500
        },
        select: {
          paddingTop: '2px',
          paddingBottom: '2px',
          fontSize: '0.75rem',
          fontWeight: 500
        },
        actions: {
          marginLeft: '4px'
        }
      }
    }
  };
}
