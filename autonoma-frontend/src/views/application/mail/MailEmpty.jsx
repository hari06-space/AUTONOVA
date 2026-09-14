// material-ui
import { useColorScheme } from '@mui/material/styles';
import CardMedia from '@mui/material/CardMedia';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import { ThemeMode } from 'config';
import { gridSpacing } from 'store/constant';
import imageEmpty from 'assets/images/maintenance/empty.svg';
import imageDarkEmpty from 'assets/images/maintenance/empty-dark.svg';

// ==============================|| NO/EMPTY MAIL ||============================== //

export default function MailEmpty() {
  const { colorScheme } = useColorScheme();

  return (
    <Stack sx={{ alignItems: 'center', gap: gridSpacing }}>
      <CardMedia
        component="img"
        image={colorScheme === ThemeMode.DARK ? imageDarkEmpty : imageEmpty}
        title="Slider5 image"
        sx={{ maxWidth: 720 }}
      />
      <Stack sx={{ gap: 1 }}>
        <Typography variant="h1" sx={{ color: 'inherit' }}>
          There is No Mail
        </Typography>
        <Typography variant="body2">When You have message that will Display here</Typography>
      </Stack>
    </Stack>
  );
}
