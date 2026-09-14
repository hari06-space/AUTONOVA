import PropTypes from 'prop-types';
// material-ui
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third party
import Chart from 'react-apexcharts';

// ============================|| TOTAL LINE CHART CARD ||============================ //

export default function TotalLineChartCard({ bgColor, chartData, title, percentage, value }) {
  return (
    <Card>
      <Box sx={{ color: 'common.white', bgcolor: bgColor || 'primary.dark' }}>
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            {value && (
              <Typography variant="h3" sx={{ color: 'inherit' }}>
                {value}
              </Typography>
            )}
            {percentage && (
              <Typography variant="body2" sx={{ color: 'inherit' }}>
                {percentage}
              </Typography>
            )}
          </Stack>
          {title && (
            <Typography variant="body2" sx={{ color: 'inherit' }}>
              {title}
            </Typography>
          )}
        </Box>
        {chartData && <Chart {...chartData} />}
      </Box>
    </Card>
  );
}

TotalLineChartCard.propTypes = {
  bgColor: PropTypes.string,
  chartData: PropTypes.any,
  title: PropTypes.string,
  percentage: PropTypes.string,
  value: PropTypes.number
};
