import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import MainCard from './MainCard';

// ============================|| HOVER DATA CARD ||============================ //

export default function HoverDataCard({ title, iconPrimary, primary, secondary, color }) {
  const IconPrimary = iconPrimary;
  const primaryIcon = iconPrimary !== undefined ? <IconPrimary fontSize="large" sx={{ width: 20, height: 20, color }} /> : null;

  return (
    <MainCard>
      <Stack sx={{ gap: 1.75, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ color: 'inherit' }}>
          {title}
        </Typography>
        <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center', mx: 'auto' }}>
          {primaryIcon}
          <Typography variant="h3">{primary}</Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {secondary}
        </Typography>
      </Stack>
    </MainCard>
  );
}

HoverDataCard.propTypes = {
  title: PropTypes.any,
  iconPrimary: PropTypes.object,
  primary: PropTypes.any,
  secondary: PropTypes.any,
  color: PropTypes.any
};
