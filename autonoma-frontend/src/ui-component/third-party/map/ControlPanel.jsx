import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';

// project imports
import SubCard from 'ui-component/cards/SubCard';
import { withAlpha } from 'utils/colorUtils';

// ==============================|| MAPLIBRE - CONTROL PANEL ||============================== //

export default function ControlPanel({ title, children }) {
  const theme = useTheme();

  return (
    <SubCard
      {...(title && { title })}
      contentSX={{ px: 2, pt: 1, '&:last-child': { pb: 1 } }}
      sx={{
        minWidth: 180,
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1,
        WebkitBackdropFilter: `blur(4px)`, backdropFilter: `blur(4px)`,
        WebkitBackdropFilter: `blur(4px)`,
        backgroundColor: withAlpha(theme.vars.palette.background.paper, 0.8)
      }}
    >
      {children}
    </SubCard>
  );
}

ControlPanel.propTypes = { title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]), children: PropTypes.node };
