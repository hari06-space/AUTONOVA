import React, { useState, useEffect } from 'react';
import { Popover, Box, Button, Typography, Stack } from '@mui/material';

// Helper to parse 'HH:mm' to 12-hour values
const parseTime = (timeStr) => {
  let [hStr, mStr] = (timeStr || '09:00').split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  if (isNaN(h)) h = 9;
  if (isNaN(m)) m = 0;

  let period = 'AM';
  if (h >= 12) {
    period = 'PM';
    if (h > 12) h -= 12;
  } else if (h === 0) {
    h = 12;
  }

  return { hour: h, minute: m, period };
};

// Helper to format 12-hour values back to 'HH:mm'
const formatTime = (hour, minute, period) => {
  let h = hour;
  if (period === 'PM') {
    if (h < 12) h += 12;
  } else {
    if (h === 12) h = 0;
  }
  let hStr = String(h).padStart(2, '0');
  let mStr = String(minute).padStart(2, '0');
  return `${hStr}:${mStr}`;
};

export default function CustomClockPicker({ open, anchorEl, onClose, value, onChange }) {
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [activeTab, setActiveTab] = useState('hours'); // 'hours' or 'minutes'

  // Initialize from external value when open changes or value changes
  useEffect(() => {
    if (open) {
      const parsed = parseTime(value);
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
      setSelectedPeriod(parsed.period);
      setActiveTab('hours');
    }
  }, [open, value]);

  const handleDialClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - 110;
    const dy = y - 110;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (activeTab === 'hours') {
      let hr = Math.round(angle / 30);
      if (hr === 0) hr = 12;
      setSelectedHour(hr);
      // Auto switch to minutes after selecting hour for better UX, similar to native clock behavior
      setTimeout(() => {
        setActiveTab('minutes');
      }, 300);
    } else {
      let min = Math.round(angle / 6);
      if (min === 60) min = 0;
      setSelectedMinute(min);
    }
  };

  const handleMouseMove = (e) => {
    if (e.buttons !== 1) return; // Only process when holding left click
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - 110;
    const dy = y - 110;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (activeTab === 'hours') {
      let hr = Math.round(angle / 30);
      if (hr === 0) hr = 12;
      setSelectedHour(hr);
    } else {
      let min = Math.round(angle / 6);
      if (min === 60) min = 0;
      setSelectedMinute(min);
    }
  };

  const handleConfirm = () => {
    const formatted = formatTime(selectedHour, selectedMinute, selectedPeriod);
    onChange(formatted);
    onClose();
  };

  // Coordinates for selected dot & line
  const activeAngle = activeTab === 'hours'
    ? (selectedHour * 30 - 90) * (Math.PI / 180)
    : (selectedMinute * 6 - 90) * (Math.PI / 180);

  const selectedX = 110 + 75 * Math.cos(activeAngle);
  const selectedY = 110 + 75 * Math.sin(activeAngle);

  // Numbers to display around clock
  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const currentNumbers = activeTab === 'hours' ? hourNumbers : minuteNumbers;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: '24px',
            p: 3,
            width: '280px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflow: 'hidden'
          }
        }
      }}
    >
      <Stack spacing={2.5}>
        {/* Top Header: Time Boxes & AM/PM switch */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {/* Time digits buttons */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            {/* Hour Capsule */}
            <Box
              onClick={() => setActiveTab('hours')}
              sx={{
                width: '56px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                bgcolor: activeTab === 'hours' ? '#1e88e5' : '#f0f4f9',
                color: activeTab === 'hours' ? '#ffffff' : '#1e88e5',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '18px',
                transition: 'all 0.2s',
                '&:hover': {
                  filter: 'brightness(0.95)'
                }
              }}
            >
              {String(selectedHour).padStart(2, '0')}
            </Box>

            <Typography sx={{ fontWeight: 'bold', color: 'grey.500', fontSize: '20px' }}>:</Typography>

            {/* Minute Capsule */}
            <Box
              onClick={() => setActiveTab('minutes')}
              sx={{
                width: '56px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                bgcolor: activeTab === 'minutes' ? '#1e88e5' : '#f0f4f9',
                color: activeTab === 'minutes' ? '#ffffff' : '#1e88e5',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '18px',
                transition: 'all 0.2s',
                '&:hover': {
                  filter: 'brightness(0.95)'
                }
              }}
            >
              {String(selectedMinute).padStart(2, '0')}
            </Box>
          </Stack>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* AM / PM Capsule */}
          <Box
            sx={{
              display: 'flex',
              bgcolor: '#f0f4f9',
              borderRadius: '12px',
              p: '3px',
              alignItems: 'center'
            }}
          >
            <Box
              onClick={() => setSelectedPeriod('AM')}
              sx={{
                px: 1.5,
                py: 0.6,
                borderRadius: '9px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                bgcolor: selectedPeriod === 'AM' ? '#1e88e5' : 'transparent',
                color: selectedPeriod === 'AM' ? '#ffffff' : '#1e88e5',
                transition: 'all 0.2s'
              }}
            >
              AM
            </Box>
            <Box
              onClick={() => setSelectedPeriod('PM')}
              sx={{
                px: 1.5,
                py: 0.6,
                borderRadius: '9px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '13px',
                bgcolor: selectedPeriod === 'PM' ? '#1e88e5' : 'transparent',
                color: selectedPeriod === 'PM' ? '#ffffff' : '#1e88e5',
                transition: 'all 0.2s'
              }}
            >
              PM
            </Box>
          </Box>
        </Stack>

        {/* Clock Face Dial */}
        <Box
          onMouseDown={handleDialClick}
          onMouseMove={handleMouseMove}
          sx={{
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            bgcolor: '#f4f6f8',
            position: 'relative',
            mx: 'auto',
            cursor: 'pointer',
            WebkitUserSelect: 'none', userSelect: 'none',
            touchAction: 'none'
          }}
        >
          {/* Center Blue Pin Dot */}
          <Box
            sx={{
              position: 'absolute',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              bgcolor: '#1e88e5',
              left: '107px',
              top: '107px',
              pointerEvents: 'none'
            }}
          />

          {/* SVG Hand & Selected Value Circle */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '220px',
              height: '220px',
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            {/* The clock hand line */}
            <line x1="110" y1="110" x2={selectedX} y2={selectedY} stroke="#1e88e5" strokeWidth="2" />
            {/* The circular indicator around the selected position */}
            <circle cx={selectedX} cy={selectedY} r="16" fill="#1e88e5" />
            {/* White text display inside the circle */}
            <text
              x={selectedX}
              y={selectedY}
              fill="#ffffff"
              fontSize="12px"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {activeTab === 'hours' ? selectedHour : String(selectedMinute).padStart(2, '0')}
            </text>
          </svg>

          {/* Clock face numbers placed around the perimeter */}
          {currentNumbers.map((num, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = 110 + 75 * Math.cos(angle);
            const y = 110 + 75 * Math.sin(angle);

            // Hide the text under the blue indicator circle to avoid double-text overlap artifacts
            const isHidden = activeTab === 'hours'
              ? num === selectedHour
              : num === selectedMinute;

            return (
              <Box
                key={num}
                sx={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)',
                  color: isHidden ? 'transparent' : '#4a5568',
                  fontWeight: '600',
                  fontSize: '13px',
                  pointerEvents: 'none',
                  zIndex: 2
                }}
              >
                {activeTab === 'minutes' ? String(num).padStart(2, '0') : num}
              </Box>
            );
          })}
        </Box>

        {/* Dialog Action Buttons */}
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              borderColor: '#673ab7',
              color: '#673ab7',
              fontWeight: '700',
              px: 2.2,
              py: 0.8,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#5e35b1',
                bgcolor: 'rgba(103, 58, 183, 0.04)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            sx={{
              borderRadius: '12px',
              bgcolor: '#673ab7',
              color: '#ffffff',
              fontWeight: '700',
              px: 2.2,
              py: 0.8,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(103, 58, 183, 0.25)',
              '&:hover': {
                bgcolor: '#5e35b1',
                boxShadow: '0 6px 16px rgba(103, 58, 183, 0.35)'
              }
            }}
          >
            Confirm
          </Button>
        </Stack>
      </Stack>
    </Popover>
  );
}
