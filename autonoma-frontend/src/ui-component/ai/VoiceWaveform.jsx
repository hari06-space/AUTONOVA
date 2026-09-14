import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

const VoiceWaveform = ({ color = 'error.main', height = 20, barWidth = 3, gap = 3 }) => {
  const bars = [
    { h: '8px', delay: '0.1s' },
    { h: '16px', delay: '0.3s' },
    { h: '24px', delay: '0.5s' },
    { h: '16px', delay: '0.7s' },
    { h: '8px', delay: '0.9s' }
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: `${gap}px`,
        height: `${height}px`,
        mx: 0.5,
      }}
    >
      {bars.map((bar, i) => (
        <Box
          key={i}
          sx={{
            width: `${barWidth}px`,
            height: bar.h,
            bgcolor: color,
            borderRadius: '2px',
            animation: 'voiceWaveformBounce 0.8s infinite ease-in-out alternate',
            animationDelay: bar.delay,
            transformOrigin: 'center',
          }}
        />
      ))}
      <style>{`
        @keyframes voiceWaveformBounce {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1.1); }
        }
      `}</style>
    </Box>
  );
};

VoiceWaveform.propTypes = {
  color: PropTypes.string,
  height: PropTypes.number,
  barWidth: PropTypes.number,
  gap: PropTypes.number
};

export default VoiceWaveform;
