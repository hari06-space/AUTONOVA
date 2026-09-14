import PropTypes from 'prop-types';
// material-ui
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third party
import Slider from 'react-slick';

const CustomSlider = styled(Slider)(({ theme }) => ({
  '.slick-dots li button:before': {
    color: theme.vars.palette.grey[500],
    ...theme.applyStyles('dark', { color: theme.vars.palette.dark.light })
  },

  '.slick-dots li.slick-active button:before': {
    color: theme.vars.palette.grey[800],
    ...theme.applyStyles('dark', { color: theme.vars.palette.common.white })
  }
}));

export default function AuthSlider({ items }) {
  const settings = {
    autoplay: false,
    arrows: false,
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1
  };

  return (
    <CustomSlider {...settings}>
      {items.map((item, i) => (
        <Box key={i}>
          <Stack sx={{ alignItems: 'center', textAlign: 'center', width: 1, gap: 3 }}>
            <Typography variant="h1">{item.title}</Typography>
            <Typography variant="subtitle2">{item.description}</Typography>
          </Stack>
        </Box>
      ))}
    </CustomSlider>
  );
}

AuthSlider.propTypes = { items: PropTypes.array };
