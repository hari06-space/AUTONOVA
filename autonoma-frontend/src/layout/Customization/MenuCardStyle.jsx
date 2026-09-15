// Organization: AUTONOVA
// Updated By: hari06-space
// Updated At: 2026-09-04
// Description: Ultra-premium Menu Card Style selector with sleek visual icon cards.

import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import { MenuCardStyle } from 'config';
import useConfig from 'hooks/useConfig';

// assets
import {
  IconChevronRight,
  IconPuzzle,
  IconSquareRounded,
  IconSlash,
  IconCircle,
  IconSquare,
  IconMessageCircle,
  IconBan,
  IconTicket,
  IconLeaf,
  IconCheck
} from '@tabler/icons-react';

const STYLES = [
  { value: MenuCardStyle.NONE,          label: 'None',      Icon: IconBan },
  { value: MenuCardStyle.CHEVRON,       label: 'Chevron',   Icon: IconChevronRight },
  { value: MenuCardStyle.JIGSAW,        label: 'Jigsaw',    Icon: IconPuzzle },
  { value: MenuCardStyle.ROUNDED,       label: 'Rounded',   Icon: IconSquareRounded },
  { value: MenuCardStyle.PARALLELOGRAM, label: 'Slanted',   Icon: IconSlash },
  { value: MenuCardStyle.CIRCLE,        label: 'Circle',    Icon: IconCircle },
  { value: MenuCardStyle.SQUARE,        label: 'Sharp',     Icon: IconSquare },
  { value: MenuCardStyle.BUBBLE,        label: 'Bubble',    Icon: IconMessageCircle },
  { value: MenuCardStyle.TICKET,        label: 'Ticket',    Icon: IconTicket },
  { value: MenuCardStyle.LEAF,          label: 'Leaf',      Icon: IconLeaf }
];

export default function MenuCardStylePage() {
  const {
    state: { menuCardStyle },
    setField
  } = useConfig();

  const current = menuCardStyle || MenuCardStyle.NONE;

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 1
        }}
      >
        {STYLES.map(({ value, label, Icon }) => {
          const active = current === value;
          return (
            <Tooltip key={value} title={label} placement="top" arrow>
              <Box
                onClick={() => setField('menuCardStyle', value)}
                sx={{
                  position: 'relative',
                  height: 48,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.25,
                  cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: active ? 'secondary.main' : 'divider',
                  bgcolor: active ? 'secondary.lighter' : 'background.paper',
                  color: active ? 'secondary.main' : 'text.secondary',
                  boxShadow: active ? '0 0 10px rgba(236,72,153,0.3)' : 'none',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'secondary.main',
                    bgcolor: 'secondary.lighter',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                <Typography variant="caption" sx={{ fontSize: '0.58rem', fontWeight: active ? 800 : 500 }} noWrap>
                  {label}
                </Typography>
                {active && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: 'secondary.main',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <IconCheck size={7} strokeWidth={4} />
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
