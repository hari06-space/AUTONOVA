import { useEffect, useState } from 'react';

// material-ui
import { useColorScheme, useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// third party
import Chart from 'react-apexcharts';

// project imports
import marketShareChartOption from './chart-data/market-share-area-chart';
import { ThemeMode } from 'config';
import useConfig from 'hooks/useConfig';
import MainCard from 'ui-component/cards/MainCard';
import { withAlpha } from 'utils/colorUtils';

// assets
import { IconBrandFacebook, IconBrandYoutube, IconBrandTwitter } from '@tabler/icons-react';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// ===========================|| DASHBOARD ANALYTICS - MARKET SHARE AREA CHART CARD ||=========================== //

export default function MarketShareAreaChartCard() {
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const {
    state: { fontFamily }
  } = useConfig();

  const [chartOptions, setChartOptions] = useState(marketShareChartOption);
  const [series] = useState([
    { name: 'Facebook', data: [10, 90, 65, 85, 40, 80, 30] },
    { name: 'Twitter', data: [5, 50, 40, 55, 20, 40, 20] },
    { name: 'Youtube', data: [50, 30, 25, 15, 60, 10, 25] }
  ]);

  const secondaryMain = theme.vars.palette.secondary.main;
  const errorMain = theme.vars.palette.error.main;
  const primaryDark = theme.vars.palette.primary.dark;
  const backgroundPaper = theme.vars.palette.background.paper;

  useEffect(() => {
    setChartOptions({
      ...marketShareChartOption,
      chart: { ...marketShareChartOption.chart, fontFamily: fontFamily },
      fill: {
        gradient: {
          colorStops: [
            [
              { offset: 0, color: secondaryMain, opacity: 0.2 },
              { offset: 100, color: backgroundPaper, opacity: 0 }
            ],
            [
              { offset: 0, color: primaryDark, opacity: 0.2 },
              { offset: 100, color: backgroundPaper, opacity: 0 }
            ],
            [
              { offset: 0, color: errorMain, opacity: 0.2 },
              { offset: 100, color: backgroundPaper, opacity: 0 }
            ]
          ]
        }
      },
      colors: [secondaryMain, primaryDark, errorMain],
      theme: { mode: colorScheme === ThemeMode.DARK ? 'dark' : 'light' }
    });
  }, [colorScheme, fontFamily, secondaryMain, primaryDark, errorMain, backgroundPaper]);

  return (
    <MainCard content={false}>
      <Box sx={{ p: 3 }}>
        <Stack sx={{ gap: 3 }}>
          <Box>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h3">Market Share</Typography>
              <Stack direction="row" sx={{ gap: 1 }}>
                <TrendingDownIcon color="error" sx={{ mb: -0.5 }} />
                <Typography variant="h3">27, 695.65</Typography>
              </Stack>
            </Stack>
            <Typography sx={{ mt: 0.75, fontWeight: 400 }} color="inherit" variant="h5">
              Department wise monthly sales report
            </Typography>
          </Box>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 3 }}>
            <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
              <Typography
                sx={{
                  width: 40,
                  height: 40,
                  color: 'secondary.main',
                  borderRadius: '12px',
                  padding: 1,
                  bgcolor: 'secondary.light',
                  ...theme.applyStyles('dark', { bgcolor: 'background.default' })
                }}
              >
                <IconBrandFacebook stroke={1.5} />
              </Typography>
              <Typography variant="h4">+ 45.36%</Typography>
            </Stack>
            <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
              <Typography
                sx={{
                  width: 40,
                  height: 40,
                  color: 'primary.main',
                  borderRadius: '12px',
                  padding: 1,
                  bgcolor: 'primary.light',
                  ...theme.applyStyles('dark', { bgcolor: 'background.default' })
                }}
              >
                <IconBrandTwitter stroke={1.5} />
              </Typography>
              <Typography variant="h4">- 50.69%</Typography>
            </Stack>
            <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
              <Typography
                sx={{
                  width: 40,
                  height: 40,
                  color: 'error.main',
                  borderRadius: '12px',
                  padding: 1,
                  bgcolor: withAlpha(theme.vars.palette.error.light, 0.25),
                  ...theme.applyStyles('dark', { bgcolor: 'background.default' })
                }}
              >
                <IconBrandYoutube stroke={2} />
              </Typography>
              <Typography variant="h4">+ 16.85%</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Box>
      <Chart options={chartOptions} series={series} type="area" height={200} />
    </MainCard>
  );
}
