// material-ui
import { styled } from '@mui/material/styles';

// project imports
import { MenuOrientation, RibbonLayout } from 'config';
import { drawerWidth } from 'store/constant';

// ==============================|| MAIN LAYOUT - STYLED ||============================== //

const RIBBON_H = 110; // px — height of expanded ribbon row

const MainContentStyled = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'menuOrientation' && prop !== 'borderRadius' && prop !== 'ribbonOpen' && prop !== 'ribbonLayout'
})(({ theme, open, menuOrientation, borderRadius, ribbonOpen, ribbonLayout }) => {
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL;
  const isQuantum = ribbonLayout === RibbonLayout.QUANTUM || ribbonLayout === 'quantum';
  const isSpeedDial = ribbonLayout === RibbonLayout.SPEED_DIAL || ribbonLayout === 'speed_dial' || ribbonLayout === 'Premium';
  const isOutlook = ribbonLayout === RibbonLayout.OUTLOOK || ribbonLayout === 'outlook';
  const isClassic = ribbonLayout === RibbonLayout.CLASSIC || ribbonLayout === 'classic' || (!isQuantum && !isSpeedDial && !isOutlook);
  // Header is approx 64px (Toolbar). Quantum bar is ~116px (expanded) or ~64px (collapsed). SpeedDial bar is ~112px (expanded) or ~64px (collapsed). Outlook bar is ~78px. Classic ribbon is 110px.
  const hMargin = isHorizontal
    ? (isQuantum
        ? (ribbonOpen ? 64 + 118 : 64 + 64)
        : (isSpeedDial ? (ribbonOpen ? 64 + 112 : 64 + 64) : (isOutlook ? 64 + 78 : (ribbonOpen ? 64 + RIBBON_H : 64 + 62))))
    : 88;

  return {
    backgroundColor: 'transparent',
    ...theme.applyStyles('dark', {
      backgroundColor: 'transparent'
    }),
    minWidth: '1%',
    width: '100%',
    minHeight: 'calc(100vh - 88px)',
    height: 'calc(100vh - 88px)',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    padding: 0,
    marginTop: 88,
    marginRight: 0,
    borderRadius: `${borderRadius}px`,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    transition: theme.transitions.create(['margin-top', 'margin-left', 'width', 'height'], {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.shorter
    }),
    ...(!isHorizontal && !open && {
      [theme.breakpoints.up('md')]: {
        marginLeft: -(drawerWidth - 72),
        width: `calc(100% - ${drawerWidth}px)`,
        marginTop: hMargin,
        minHeight: `calc(100vh - ${hMargin}px)`,
        height: `calc(100vh - ${hMargin}px)`
      }
    }),
    ...(!isHorizontal && open && {
      marginLeft: 0,
      marginTop: hMargin,
      minHeight: `calc(100vh - ${hMargin}px)`,
      width: `calc(100% - ${drawerWidth}px)`,
      [theme.breakpoints.up('md')]: {
        marginTop: hMargin,
        minHeight: `calc(100vh - ${hMargin}px)`,
        height: `calc(100vh - ${hMargin}px)`
      }
    }),
    ...(isHorizontal && {
      marginLeft: 0,
      width: '100%',
      marginTop: hMargin,
      minHeight: `calc(100vh - ${hMargin}px)`,
      height: `calc(100vh - ${hMargin}px)`,
      [theme.breakpoints.up('md')]: {
        marginTop: hMargin,
        minHeight: `calc(100vh - ${hMargin}px)`,
        height: `calc(100vh - ${hMargin}px)`
      }
    }),
    [theme.breakpoints.down('md')]: {
      marginLeft: 0,
      padding: 0,
      marginTop: 88,
      minHeight: 'calc(100vh - 88px)',
      height: 'calc(100vh - 88px)',
      width: '100%'
    },
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 0
    }
  };
});

export default MainContentStyled;
