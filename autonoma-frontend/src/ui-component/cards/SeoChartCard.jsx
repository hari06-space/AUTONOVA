import PropTypes from 'prop-types';
import useMediaQuery from '@mui/material/useMediaQuery';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third party
import Chart from 'react-apexcharts';

// project imports
import MainCard from './MainCard';

export default function SeoChartCard({ chartData, value, title, icon, type, areaOpacity }) {
  const downMM = useMediaQuery((theme) => theme.breakpoints.down('md'));

  return (
    <MainCard
      content={false}
      sx={(theme) => ({
        p: 2.5,
        '& .apexcharts-tooltip-series-group': {
          color: 'text.primary',
          bgcolor: 'background.paper',
          ...theme.applyStyles('dark', { bgcolor: 'background.default' })
        },
        ...(areaOpacity !== undefined && {
          'path.apexcharts-area[fill-opacity]': {
            fillOpacity: `${areaOpacity} !important`
          }
        })
      })}
    >
      <Stack sx={{ justifyContent: 'space-between', gap: 1.25 }}>
        <Stack direction={type === 1 ? 'column-reverse' : 'column'} sx={{ gap: type === 1 ? 0.5 : 1 }}>
          {value && <Typography variant={downMM ? 'h4' : 'h3'}>{value}</Typography>}
          {(title || icon) && (
            <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
              {title && (
                <Typography variant="body1" sx={{ color: 'grey.500' }}>
                  {title}
                </Typography>
              )}
              {icon && icon}
            </Stack>
          )}
        </Stack>
        {chartData && <Chart {...chartData} />}
      </Stack>
    </MainCard>
  );
}

SeoChartCard.propTypes = {
  chartData: PropTypes.any,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  title: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  type: PropTypes.number,
  areaOpacity: PropTypes.number
};
