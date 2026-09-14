import PropTypes from 'prop-types';
import useMediaQuery from '@mui/material/useMediaQuery';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// third party
import { format } from 'date-fns';

// assets
import { IconChevronLeft, IconChevronRight, IconLayoutGrid, IconTemplate, IconLayoutList, IconListNumbers } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

// constant
const viewOptions = [
  {
    label: 'Month',
    value: 'dayGridMonth',
    icon: IconLayoutGrid
  },
  {
    label: 'Week',
    value: 'timeGridWeek',
    icon: IconTemplate
  },
  {
    label: 'Day',
    value: 'timeGridDay',
    icon: IconLayoutList
  },
  {
    label: 'Agenda',
    value: 'listWeek',
    icon: IconListNumbers
  }
];

export default function Toolbar({ date, view, onClickNext, onClickPrev, onClickToday, onChangeView, onChangeDate, slotDuration, onSlotDurationChange, sx, ...others }) {
  const matchSm = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const [newViewOption, setNewViewOption] = useState(viewOptions);

  useEffect(() => {
    let newOption = viewOptions;
    if (matchSm) {
      newOption = viewOptions.filter((options) => options.value !== 'dayGridMonth' && options.value !== 'timeGridWeek');
    }
    setNewViewOption(newOption);
  }, [matchSm]);

  return (
    <Grid container spacing={3} {...others} sx={{ alignItems: 'center', justifyContent: 'space-between', pb: 3, ...sx }}>
      <Grid container size={{ xs: 12, sm: 4 }} alignItems="center" spacing={1}>
        <Grid>
          <Button variant="outlined" onClick={onClickToday}>
            Today
          </Button>
        </Grid>
        {view !== 'dayGridMonth' && onSlotDurationChange && (
          <Grid>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 100 }}>
              <Select
                value={slotDuration}
                onChange={(e) => onSlotDurationChange(e.target.value)}
                displayEmpty
              >
                <MenuItem value="01:00:00">1 Hour</MenuItem>
                <MenuItem value="00:30:00">30 Min</MenuItem>
                <MenuItem value="00:15:00">15 Min</MenuItem>
                <MenuItem value="00:10:00">10 Min</MenuItem>
                <MenuItem value="00:05:00">5 Min</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>
      <Grid size={{ xs: 12, sm: 4, lg: 4 }}>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', gap: { xs: 0.5, md: 3 }, justifyContent: { xs: 'space-between', sm: 'center' } }}
        >
          <IconButton onClick={onClickPrev} size="small">
            <IconChevronLeft />
          </IconButton>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              views={['year', 'month', 'day']}
              value={date}
              onChange={(newValue) => {
                if (newValue && onChangeDate) onChangeDate(newValue);
              }}
              slotProps={{
                textField: {
                  variant: 'standard',
                  InputProps: {
                    disableUnderline: true,
                    sx: { typography: 'h3', color: 'text.primary', cursor: 'pointer', input: { cursor: 'pointer', textAlign: 'center', width: 150, p: 0 } }
                  }
                }
              }}
              format="MMMM yyyy"
            />
          </LocalizationProvider>
          <IconButton onClick={onClickNext} size="small">
            <IconChevronRight />
          </IconButton>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, sm: 4 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <ButtonGroup variant="outlined" aria-label="outlined button group">
          {newViewOption.map((viewOption) => {
            const Icon = viewOption.icon;
            return (
              <Tooltip title={viewOption.label} key={viewOption.value}>
                <Button
                  disableElevation
                  variant={viewOption.value === view ? 'contained' : 'outlined'}
                  onClick={() => onChangeView(viewOption.value)}
                >
                  <Icon stroke="2" size="20px" />
                </Button>
              </Tooltip>
            );
          })}
        </ButtonGroup>
      </Grid>
    </Grid>
  );
}

Toolbar.propTypes = {
  date: PropTypes.oneOfType([PropTypes.number, PropTypes.any]),
  view: PropTypes.string,
  onClickNext: PropTypes.func,
  onClickPrev: PropTypes.func,
  onClickToday: PropTypes.func,
  onChangeView: PropTypes.func,
  sx: PropTypes.any,
  others: PropTypes.any
};
