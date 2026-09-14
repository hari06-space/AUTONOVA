import TextField from 'ui-component/CustomTextField';
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Grid, MenuItem, Box, Divider, Button, Stack } from '@mui/material';
import { IconX, IconCalculator } from '@tabler/icons-react';

const WeightCalculator = ({ open, handleClose }) => {
  const [type, setType] = useState('SQUARE/RECTANGLE');
  const [values, setValues] = useState({
    length: 0,
    width: 0,
    thickness: 0,
    diameter: 0,
    density: 7.85 // Default for steel
  });
  const [total, setTotal] = useState(0);

  const calculateWeight = () => {
    let weight = 0;
    const { length, width, thickness, diameter, density } = values;

    if (type === 'SQUARE/RECTANGLE' || type === 'SHEET') {
      weight = (length * width * thickness * density) / 1000000; // Assuming mm and g/cm3 -> kg
    } else if (type === 'ROUND') {
      const radius = diameter / 2;
      weight = (Math.PI * Math.pow(radius, 2) * length * density) / 1000000;
    }
    setTotal(weight.toFixed(3));
  };

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: parseFloat(e.target.value) || 0 });
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconCalculator size={20} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Weight Calculator
          </Typography>
        </Stack>
        <IconButton onClick={handleClose} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField select label="TYPE" fullWidth size="small" value={type} onChange={(e) => setType(e.target.value)}>
              <MenuItem value="SQUARE/RECTANGLE">SQUARE/RECTANGLE</MenuItem>
              <MenuItem value="ROUND">ROUND</MenuItem>
              <MenuItem value="SHEET">SHEET</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField label="Length (mm)" name="length" type="number" fullWidth size="small" onChange={handleChange} />
          </Grid>

          {type !== 'ROUND' && (
            <Grid item xs={12}>
              <TextField label="Width (mm)" name="width" type="number" fullWidth size="small" onChange={handleChange} />
            </Grid>
          )}

          {type === 'ROUND' ? (
            <Grid item xs={12}>
              <TextField label="Diameter (mm)" name="diameter" type="number" fullWidth size="small" onChange={handleChange} />
            </Grid>
          ) : (
            <Grid item xs={12}>
              <TextField label="Thickness (mm)" name="thickness" type="number" fullWidth size="small" onChange={handleChange} />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              label="Density (g/cm³)"
              name="density"
              type="number"
              fullWidth
              size="small"
              value={values.density}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" fullWidth onClick={calculateWeight} sx={{ mt: 1 }}>
              Calculate
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary.dark">
                TOTAL WEIGHT
              </Typography>
              <Typography variant="h3" color="primary.main">
                {total} KG
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default WeightCalculator;
