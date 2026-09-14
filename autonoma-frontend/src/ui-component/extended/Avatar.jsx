import PropTypes from 'prop-types';

// material-ui
import MuiAvatar from '@mui/material/Avatar';

export default function Avatar({ className, color, outline, size, sx, ...others }) {
  const colorSX = color && !outline && { color: 'background.paper', bgcolor: `${color}.main` };
  const outlineSX = outline && {
    color: color ? `${color}.main` : `primary.main`,
    bgcolor: 'background.paper',
    border: '2px solid',
    borderColor: color ? `${color}.main` : `primary.main`
  };
  let sizeSX = {};

  switch (size) {
    case 'badge':
      sizeSX = { width: 28, height: 28 };
      break;
    case 'xs':
      sizeSX = { width: 34, height: 34 };
      break;
    case 'sm':
      sizeSX = { width: 40, height: 40 };
      break;
    case 'lg':
      sizeSX = { width: 72, height: 72 };
      break;
    case 'xl':
      sizeSX = { width: 82, height: 82 };
      break;
    case 'md':
      sizeSX = { width: 60, height: 60 };
      break;
    default:
      sizeSX = {};
  }

  return (
    <MuiAvatar
      sx={{
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.08)'
        },
        ...colorSX,
        ...outlineSX,
        ...sizeSX,
        ...sx
      }}
      {...others}
    />
  );
}

Avatar.propTypes = {
  className: PropTypes.string,
  color: PropTypes.string,
  outline: PropTypes.bool,
  size: PropTypes.oneOf(['badge', 'xs', 'sm', 'md', 'lg', 'xl']),
  sx: PropTypes.any,
  others: PropTypes.any
};
