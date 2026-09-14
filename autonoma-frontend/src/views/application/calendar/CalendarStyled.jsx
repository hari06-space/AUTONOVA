// material-ui
import { styled } from '@mui/material/styles';

const ExperimentalStyled = styled('div')(({ theme }) => ({
  // hide license message
  '& .fc-license-message': {
    display: 'none'
  },

  // basic style
  '& .fc': {
    '--fc-bg-event-opacity': 1,
    '--fc-border-color': theme.vars.palette.divider,
    '--fc-daygrid-event-dot-width': '10px',
    '--fc-list-event-dot-width': '10px',
    '--fc-event-border-color': theme.vars.palette.primary.dark,
    '--fc-now-indicator-color': theme.vars.palette.error.main,
    color: theme.vars.palette.text.primary,
    fontFamily: theme.typography.fontFamily,
    '--fc-today-bg-color': theme.vars.palette.primary.light,
    ...theme.applyStyles('dark', {
      '--fc-today-bg-color': theme.vars.palette.dark[800]
    })
  },

  // date text
  '& .fc .fc-daygrid-day-top': {
    display: 'grid',
    '& .fc-daygrid-day-number': {
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 12
    }
  },

  // weekday header styling
  '& .fc .fc-col-header-cell': {
    backgroundColor: '#f8fafc',
    padding: '8px 0',
    borderBottom: `2px solid ${theme.vars.palette.divider}`,
    ...theme.applyStyles('dark', {
      backgroundColor: theme.vars.palette.dark.main
    })
  },

  '& .fc .fc-col-header-cell-cushion': {
    color: theme.vars.palette.text.primary,
    fontWeight: 700,
    fontSize: '0.85rem',
    padding: '10px 14px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px'
  },
  '& .fc-theme-standard .fc-list': {
    overflowX: 'auto'
  },

  // events
  '& .fc-direction-ltr .fc-daygrid-event.fc-event-end, .fc-direction-rtl .fc-daygrid-event.fc-event-start': {
    marginLeft: 4,
    marginBottom: 6,
    borderRadius: '6px'
  },

  '& .fc-direction-ltr .fc-daygrid-event.fc-event-start, .fc-direction-rtl .fc-daygrid-event.fc-event-end': {
    marginLeft: 4,
    marginBottom: 6,
    borderRadius: '6px'
  },

  '& .fc-daygrid-event': {
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    border: 'none',
    margin: '2px 4px',
    padding: '2px 6px',
    borderRadius: '4px',
    '&:hover': {
      transform: 'translateY(-1px) scale(1.01)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 5
    }
  },

  '& .fc-daygrid-block-event': {
    color: '#fff',
    margin: '2px 4px',
    padding: '2px 4px',
    borderRadius: '6px',
    '& .fc-event-time': {
      fontWeight: 600,
      marginRight: '4px'
    },
    '& .fc-event-title': {
      fontWeight: 500
    }
  },

  '& .fc-h-event .fc-event-main': {
    padding: 4,
    paddingLeft: 8,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },

  // popover when multiple events
  '& .fc .fc-more-popover': {
    border: 'none',
    borderRadius: '14px'
  },

  '& .fc .fc-more-popover .fc-popover-body': {
    backgroundColor: theme.vars.palette.background.paper,
    ...theme.applyStyles('dark', {
      backgroundColor: theme.vars.palette.dark[800]
    }),
    borderBottomLeftRadius: '12px',
    borderBottomRightRadius: '12px',
    maxHeight: '350px',
    overflowY: 'auto',
    padding: '12px',
    // Custom scrollbar
    '&::-webkit-scrollbar': { width: '6px' },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': {
      background: theme.vars.palette.grey[300],
      borderRadius: '4px'
    }
  },

  '& .fc .fc-popover-header': {
    padding: '16px 12px',
    borderTopLeftRadius: '14px',
    borderTopRightRadius: '14px',
    backgroundColor: theme.vars.palette.background.default,
    color: theme.vars.palette.text.primary,
    fontWeight: 'bold',
    borderBottom: `1px solid ${theme.vars.palette.divider}`,
    ...theme.applyStyles('dark', {
      backgroundColor: theme.vars.palette.dark[900],
      color: theme.vars.palette.dark.light
    })
  },

  // agenda view
  '& .fc-theme-standard .fc-list-day-cushion': {
    backgroundColor: theme.vars.palette.grey[100],
    ...theme.applyStyles('dark', {
      backgroundColor: theme.vars.palette.dark.main
    })
  },

  '& .fc .fc-list-event:hover td': {
    backgroundColor: theme.vars.palette.grey[100],
    ...theme.applyStyles('dark', {
      backgroundColor: theme.vars.palette.dark[800]
    })
  },

  '& .fc-timegrid-event-harness-inset .fc-timegrid-event, .fc-timegrid-event.fc-event-mirror, .fc-timegrid-more-link': {
    padding: '4px 6px',
    margin: 2
  },

  '& .fc-event': {
    borderRadius: '6px',
    border: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      transform: 'translateY(-1px)',
      zIndex: 5
    }
  },
  
  // timegrid slots & clean cards styling
  '& .fc-timegrid-slot': {
    height: '42px !important',
    borderBottom: `1px solid ${theme.vars.palette.divider} !important`
  },

  '& .fc-timegrid-slot-label': {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: theme.vars.palette.text.secondary
  },

  '& .fc-timegrid-event': {
    borderRadius: '8px !important',
    border: 'none !important',
    boxShadow: '0 2px 6px rgba(0,0,0,0.12) !important',
    padding: '4px 8px !important',
    margin: '1px 2px !important',
    backdropFilter: 'blur(4px)',
    '&:hover': {
      boxShadow: '0 6px 16px rgba(0,0,0,0.2) !important',
      transform: 'translateY(-1px) scale(1.01)',
      zIndex: 10
    }
  },

  '& .fc-event-main': {
    padding: '2px 4px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  
  '& .fc-event-time': {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.2px',
    opacity: 0.95,
    marginBottom: '2px'
  },
  
  '& .fc-event-title': {
    fontSize: '0.78rem',
    fontWeight: 700,
    lineHeight: 1.25,
    whiteSpace: 'normal',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },
  
  '& .fc-event-disabled': {
    opacity: 0.6,
    borderStyle: 'dashed !important',
    borderColor: 'rgba(255, 255, 255, 0.4) !important',
    boxShadow: 'none !important',
    cursor: 'not-allowed',
    '&:hover': {
      opacity: 0.8,
      transform: 'none !important'
    }
  }
}));

export default ExperimentalStyled;
