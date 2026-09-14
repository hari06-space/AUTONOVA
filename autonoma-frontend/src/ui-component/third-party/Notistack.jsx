import PropTypes from 'prop-types';
// third party
import { SnackbarProvider } from 'notistack';
import { Slide } from '@mui/material';

// project imports
import { useSelector } from 'store';

// assets
import { IconCircleCheck, IconSquareRoundedX, IconInfoCircle, IconAlertCircle } from '@tabler/icons-react';

// ===========================|| SNACKBAR - NOTISTACK ||=========================== //

export default function Notistack({ children }) {
  const snackbar = useSelector((state) => state.snackbar);
  const iconSX = { marginRight: 8, fontSize: '1.15rem' };

  return (
    <SnackbarProvider
      maxSnack={1}
      dense={snackbar.dense}
      TransitionComponent={Slide}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      iconVariant={
        snackbar.iconVariant === 'useemojis'
          ? {
              success: <IconCircleCheck style={iconSX} />,
              error: <IconSquareRoundedX style={iconSX} />,
              warning: <IconInfoCircle style={iconSX} />,
              info: <IconAlertCircle style={iconSX} />
            }
          : undefined
      }
      hideIconVariant={snackbar.iconVariant === 'hide' ? true : false}
    >
      {children}
    </SnackbarProvider>
  );
}

Notistack.propTypes = { children: PropTypes.any };
