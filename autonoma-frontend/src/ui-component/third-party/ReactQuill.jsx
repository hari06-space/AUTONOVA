import React from 'react';
import PropTypes from 'prop-types';
// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

// third party
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// project imports
import { ThemeDirection } from 'config';
import useConfig from 'hooks/useConfig';
import { withAlpha } from 'utils/colorUtils';

// ==============================|| QUILL EDITOR ||============================== //

const focusNextElement = (currentElement) => {
  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
  const elements = Array.from(document.querySelectorAll(focusableSelector)).filter(el => {
    if (el.disabled) return false;
    if (el.closest('.ql-toolbar')) return false; // Skip toolbar items
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    return true;
  });

  let currentIndex = elements.indexOf(currentElement);
  if (currentIndex === -1) {
    currentIndex = elements.findIndex(el => el.contains(currentElement) || currentElement.contains(el));
  }

  if (currentIndex !== -1 && currentIndex < elements.length - 1) {
    const nextElement = elements[currentIndex + 1];
    nextElement.focus();
    return true;
  }
  return false;
};

const ReactQuillDemo = React.forwardRef(({ value, editorMinHeight = 140, onChange, ...others }, ref) => {
  const {
    state: { fontFamily }
  } = useConfig();
  const theme = useTheme();

  const tabCountRef = React.useRef(0);

  const handleKeyDownCapture = (event) => {
    const activeEl = document.activeElement;
    const isInsideEditor = event.currentTarget.contains(activeEl) && activeEl.classList.contains('ql-editor');
    if (!isInsideEditor) return;

    if (event.key === 'Tab' && !event.shiftKey) {
      tabCountRef.current += 1;
      if (tabCountRef.current === 2) {
        tabCountRef.current = 0;
        event.preventDefault();
        event.stopPropagation();
        focusNextElement(activeEl);
      }
    } else {
      tabCountRef.current = 0;
    }
  };

  const handleBlur = () => {
    tabCountRef.current = 0;
  };

  return (
    <Box
      onKeyDownCapture={handleKeyDownCapture}
      onBlur={handleBlur}
      sx={{
        '& .quill': {
          bgcolor: 'grey.50',
          borderRadius: '8px',
          '& .ql-toolbar': {
            bgcolor: 'grey.100',
            borderColor: 'divider',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            padding: '3px 8px !important',
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            minHeight: '34px',
            '& .ql-picker-options': {
              backgroundColor: 'background.paper',
              borderColor: `${theme.vars.palette.divider} !important`,
              borderRadius: '6px',
              color: 'text.primary',
              '& .ql-picker-item:hover': {
                color: theme.vars.palette.secondary.main
              }
            },
            '& .ql-formats': {
              marginRight: '6px',
              '& button': {
                width: '24px',
                height: '24px',
                padding: '2px'
              },
              'button:hover, button.ql-active': {
                '& .ql-stroke': { stroke: theme.vars.palette.secondary.main },
                '& .ql-fill': { fill: theme.vars.palette.secondary.main }
              },
              '& .ql-expanded .ql-picker-label': {
                borderColor: `${theme.vars.palette.text.secondary} !important`,
                color: 'text.secondary',
                '& .ql-stroke': { stroke: theme.vars.palette.text.secondary },
                '& .ql-fill': { fill: theme.vars.palette.text.secondary }
              },
              '& .ql-picker-label:hover, & .ql-picker-label.ql-active': {
                color: 'secondary.main',
                'svg .ql-stroke': {
                  stroke: theme.vars.palette.secondary.main
                }
              }
            }
          },
          '& .ql-container': {
            fontFamily,
            borderColor: 'divider',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            '& .ql-editor': { 
              minHeight: editorMinHeight,
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '8px 12px',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }
          }
        },
        ...(theme.direction === ThemeDirection.RTL && { '& .ql-snow .ql-picker-label::before ': { ml: 2 } }),

        ...theme.applyStyles('dark', {
          '& .quill': {
            bgcolor: 'dark.main',
            '& .ql-toolbar': {
              bgcolor: 'dark.light',
              borderColor: withAlpha(theme.vars.palette.dark.light, 0.2)
            },
            '& .ql-container': { borderColor: `${withAlpha(theme.vars.palette.dark.light, 0.2)} !important` }
          }
        })
      }}
    >
      <ReactQuill ref={ref} value={value || ''} {...(onChange && { onChange })} {...others} />
    </Box>
  );
});

ReactQuillDemo.displayName = 'ReactQuillDemo';
ReactQuillDemo.propTypes = { value: PropTypes.string, editorMinHeight: PropTypes.number, onChange: PropTypes.func };

export default ReactQuillDemo;
