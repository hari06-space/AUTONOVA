import PropTypes from 'prop-types';
import Box from '@mui/material/Box';

export default function AvatarStatus({ status, mr = 0 }) {
  const getColor = () => {
    switch (status) {
      case 'available':
        return '#00c853'; // vibrant emerald green
      case 'do_not_disturb':
        return '#ffab00'; // amber warning
      case 'offline':
        return '#9e9e9e'; // muted grey
      default:
        return 'transparent';
    }
  };

  if (!status || status === 'none') return null;

  return (
    <Box
      component="span"
      sx={{
        width: 11,
        height: 11,
        borderRadius: '50%',
        bgcolor: getColor(),
        display: 'inline-block',
        border: '2px solid #ffffff',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.06)',
        mr: mr ? `${mr * 8}px` : 0,
        verticalAlign: 'middle',
        flexShrink: 0
      }}
    />
  );
}

AvatarStatus.propTypes = {
  status: PropTypes.string,
  mr: PropTypes.number
};
