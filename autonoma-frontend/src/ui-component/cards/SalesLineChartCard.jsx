import PropTypes from 'prop-types';

// material-ui
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third party
import Chart from 'react-apexcharts';

// ============================|| SALES LINE CARD ||============================ //

export default function SalesLineChartCard({ bgColor, chartData, footerData, icon, title, percentage }) {
  let footerHtml;
  if (footerData) {
    footerHtml = footerData.map((item, index) => (
      <Box sx={{ my: 3, p: 1 }} key={index}>
        <Stack sx={{ gap: 0.75, alignItems: 'center' }}>
          <Typography variant="h3">{item.value}</Typography>
          <Typography variant="body1">{item.label}</Typography>
        </Stack>
      </Box>
    ));
  }

  return (
    <Card>
      <Box sx={{ color: 'common.white', bgcolor: bgColor || 'primary.dark', p: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
          {title && (
            <Typography variant="subtitle1" sx={{ color: 'inherit' }}>
              {title}
            </Typography>
          )}
          <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
            {icon && icon}
            {percentage && (
              <Typography variant="subtitle1" sx={{ color: 'inherit' }}>
                {percentage}
              </Typography>
            )}
          </Stack>
        </Stack>
        {chartData && <Chart {...chartData} />}
      </Box>
      {footerData && (
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-around' }}>
          {footerHtml}
        </Stack>
      )}
    </Card>
  );
}

SalesLineChartCard.propTypes = {
  bgColor: PropTypes.string,
  chartData: PropTypes.any,
  footerData: PropTypes.object,
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  title: PropTypes.string,
  percentage: PropTypes.string
};
