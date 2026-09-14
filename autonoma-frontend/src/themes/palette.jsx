// project imports
import { extendPaletteWithChannels, withAlpha } from 'utils/colorUtils';
import { lighten, darken } from '@mui/material/styles';

// assets
import defaultColor from './theme/default';
import theme1 from './theme/theme1';
import theme2 from './theme/theme2';
import theme3 from './theme/theme3';
import theme4 from './theme/theme4';
import theme5 from './theme/theme5';
import theme6 from './theme/theme6';
import theme7 from './theme/theme7';
import theme8 from './theme/theme8';
import theme9 from './theme/theme9';
import theme10 from './theme/theme10';
import theme11 from './theme/theme11';
import theme12 from './theme/theme12';
import theme13 from './theme/theme13';
import theme14 from './theme/theme14';
import theme15 from './theme/theme15';
import theme16 from './theme/theme16';
import theme17 from './theme/theme17';
import theme18 from './theme/theme18';
import theme19 from './theme/theme19';
import theme20 from './theme/theme20';
import theme21 from './theme/theme21';
import theme22 from './theme/theme22';
import theme23 from './theme/theme23';
import theme24 from './theme/theme24';
import theme25 from './theme/theme25';
import theme26 from './theme/theme26';
import theme27 from './theme/theme27';
import theme28 from './theme/theme28';
import theme29 from './theme/theme29';

// ==============================|| DEFAULT THEME - PALETTE ||============================== //

export function buildPalette(presetColor) {
  let colors;
  switch (presetColor) {
    case 'theme1':
      colors = theme1;
      break;
    case 'theme2':
      colors = theme2;
      break;
    case 'theme3':
      colors = theme3;
      break;
    case 'theme4':
      colors = theme4;
      break;
    case 'theme5':
      colors = theme5;
      break;
    case 'theme6':
      colors = theme6;
      break;
    case 'theme7':
      colors = theme7;
      break;
    case 'theme8':
      colors = theme8;
      break;
    case 'theme9':
      colors = theme9;
      break;
    case 'theme10':
      colors = theme10;
      break;
    case 'theme11':
      colors = theme11;
      break;
    case 'theme12':
      colors = theme12;
      break;
    case 'theme13':
      colors = theme13;
      break;
    case 'theme14':
      colors = theme14;
      break;
    case 'theme15':
      colors = theme15;
      break;
    case 'theme16':
      colors = theme16;
      break;
    case 'theme17':
      colors = theme17;
      break;
    case 'theme18':
      colors = theme18;
      break;
    case 'theme19':
      colors = theme19;
      break;
    case 'theme20':
      colors = theme20;
      break;
    case 'theme21':
      colors = theme21;
      break;
    case 'theme22':
      colors = theme22;
      break;
    case 'theme23':
      colors = theme23;
      break;
    case 'theme24':
      colors = theme24;
      break;
    case 'theme25':
      colors = theme25;
      break;
    case 'theme26':
      colors = theme26;
      break;
    case 'theme27':
      colors = theme27;
      break;
    case 'theme28':
      colors = theme28;
      break;
    case 'theme29':
      colors = theme29;
      break;
    case 'default':
    default:
      colors = defaultColor;
  }

  // Parse custom colors: custom:#primaryHex:#secondaryHex
  if (presetColor && presetColor.startsWith('custom:')) {
    const parts = presetColor.split(':');
    const pMain = parts[1] || '#2196f3';
    const sMain = parts[2] || '#673ab7';

    colors = {
      ...defaultColor,
      primaryLight: lighten(pMain, 0.85),
      primary200: lighten(pMain, 0.4),
      primaryMain: pMain,
      primaryDark: darken(pMain, 0.2),
      primary800: darken(pMain, 0.4),

      secondaryLight: lighten(sMain, 0.85),
      secondary200: lighten(sMain, 0.4),
      secondaryMain: sMain,
      secondaryDark: darken(sMain, 0.2),
      secondary800: darken(sMain, 0.4),

      darkPrimaryLight: lighten(pMain, 0.8),
      darkPrimaryMain: pMain,
      darkPrimaryDark: darken(pMain, 0.2),
      darkPrimary200: lighten(pMain, 0.4),
      darkPrimary800: darken(pMain, 0.4),

      darkSecondaryLight: lighten(sMain, 0.8),
      darkSecondaryMain: sMain,
      darkSecondaryDark: darken(sMain, 0.2),
      darkSecondary200: lighten(sMain, 0.4),
      darkSecondary800: darken(sMain, 0.4)
    };
  }

  const getContrastColor = (hex) => {
    if (!hex) return '#ffffff';
    const c = hex.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 150 ? '#ffffff' : '#000000';
  };

  const lightColors = {
    primary: {
      light: colors.primaryLight,
      main: colors.primaryMain,
      dark: colors.primaryDark,
      200: colors.primary200,
      800: colors.primary800,
      contrastText: getContrastColor(colors.primaryMain)
    },
    secondary: {
      light: colors.secondaryLight,
      main: colors.secondaryMain,
      dark: colors.secondaryDark,
      200: colors.secondary200,
      800: colors.secondary800
    },
    error: {
      light: colors.errorLight,
      main: colors.errorMain,
      dark: colors.errorDark
    },
    orange: {
      light: colors.orangeLight,
      main: colors.orangeMain,
      dark: colors.orangeDark
    },
    warning: {
      light: colors.warningLight,
      main: colors.warningMain,
      dark: colors.warningDark,
      contrastText: colors.grey700
    },
    success: {
      light: colors.successLight === '#b9f6ca' ? '#e3fcef' : colors.successLight,
      200: colors.success200 === '#69f0ae' ? '#abf5d1' : colors.success200,
      main: colors.successMain === '#00e676' ? '#03b854' : colors.successMain,
      dark: colors.successDark === '#00c853' ? '#029644' : colors.successDark,
      contrastText: colors.successMain === '#00e676' ? '#ffffff' : getContrastColor(colors.successMain)
    },
    grey: {
      50: colors.grey50,
      100: colors.grey100,
      500: colors.grey500,
      600: colors.grey600,
      700: colors.grey700,
      900: colors.grey900
    },
    dark: {
      light: colors.darkTextPrimary,
      main: colors.darkLevel1,
      dark: colors.darkLevel2,
      800: colors.darkBackground,
      900: colors.darkPaper
    },
    text: {
      primary: colors.grey700,
      secondary: colors.grey500,
      dark: colors.grey900,
      hint: colors.grey100,
      heading: colors.grey900
    },
    divider: colors.grey200,
    background: {
      paper: colors.paper,
      default: colors.paper
    }
  };

  const darkColors = {
    primary: {
      light: colors.darkPrimaryLight,
      main: colors.darkPrimaryMain,
      dark: colors.darkPrimaryDark,
      200: colors.darkPrimary200,
      800: colors.darkPrimary800,
      contrastText: getContrastColor(colors.darkPrimaryMain)
    },
    secondary: {
      light: colors.darkSecondaryLight,
      main: colors.darkSecondaryMain,
      dark: colors.darkSecondaryDark,
      200: colors.darkSecondary200,
      800: colors.darkSecondary800
    },
    error: {
      light: colors.errorLight,
      main: colors.errorMain,
      dark: colors.errorDark
    },
    orange: {
      light: colors.orangeLight,
      main: colors.orangeMain,
      dark: colors.orangeDark
    },
    warning: {
      light: colors.warningLight,
      main: colors.warningMain,
      dark: colors.warningDark,
      contrastText: colors.darkTextPrimary
    },
    success: {
      light: colors.successLight === '#b9f6ca' ? '#e3fcef' : colors.successLight,
      200: colors.success200 === '#69f0ae' ? '#abf5d1' : colors.success200,
      main: colors.successMain === '#00e676' ? '#03b854' : colors.successMain,
      dark: colors.successDark === '#00c853' ? '#029644' : colors.successDark,
      contrastText: colors.successMain === '#00e676' ? '#ffffff' : getContrastColor(colors.successMain)
    },
    grey: {
      50: colors.grey50,
      100: colors.grey100,
      500: colors.darkTextSecondary,
      600: colors.darkTextTitle,
      700: colors.darkTextPrimary,
      900: colors.darkTextPrimary
    },
    dark: {
      light: colors.darkTextPrimary,
      main: colors.darkLevel1,
      dark: colors.darkLevel2,
      800: colors.darkBackground,
      900: colors.darkPaper
    },
    text: {
      primary: colors.darkTextPrimary,
      secondary: colors.darkTextSecondary,
      dark: colors.darkTextPrimary,
      hint: colors.grey100,
      heading: colors.darkTextTitle
    },
    divider: withAlpha(colors.grey200, 0.2),
    background: {
      paper: colors.darkLevel2,
      default: colors.darkPaper
    }
  };

  const commonColor = { common: { black: colors.darkPaper, white: '#fff' } };

  const extendedLight = extendPaletteWithChannels(lightColors);
  const extendedDark = extendPaletteWithChannels(darkColors);
  const extendedCommon = extendPaletteWithChannels(commonColor);

  return {
    light: {
      mode: 'light',
      ...extendedCommon,
      ...extendedLight
    },
    dark: {
      mode: 'dark',
      ...extendedCommon,
      ...extendedDark
    }
  };
}
