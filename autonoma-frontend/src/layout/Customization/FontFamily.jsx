// Organization: AUTONOVA
// Updated By: hari06-space
// Updated At: 2026-09-04
// Description: Font Family selector — 100% offline via @fontsource local packages.
//              No Google Fonts CDN dependency. All fonts are bundled with the app.

// material-ui
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';

// project imports
import useConfig from 'hooks/useConfig';
import MainCard from 'ui-component/cards/MainCard';

// ==============================|| CUSTOMIZATION - FONT FAMILY ||============================== //

// ── Font catalogue — 100% local @fontsource packages ─────────────────────────
// Groups are rendered as non-selectable section headers inside the dropdown.
const FONTS = [
  // ── Sans-Serif (installed) ─────────────────────────────────────────────────
  { id: 'poppins', value: `'Poppins', sans-serif`, label: 'Poppins', group: 'Sans-Serif' },
  { id: 'inter', value: `'Inter', sans-serif`, label: 'Inter', group: 'Sans-Serif' },
  { id: 'roboto', value: `'Roboto', sans-serif`, label: 'Roboto', group: 'Sans-Serif' },
  { id: 'outfit', value: `'Outfit', sans-serif`, label: 'Outfit', group: 'Sans-Serif' },
  { id: 'nunito', value: `'Nunito', sans-serif`, label: 'Nunito', group: 'Sans-Serif' },
  { id: 'lato', value: `'Lato', sans-serif`, label: 'Lato', group: 'Sans-Serif' },
  { id: 'montserrat', value: `'Montserrat', sans-serif`, label: 'Montserrat', group: 'Sans-Serif' },
  { id: 'public-sans', value: `'Public Sans', sans-serif`, label: 'Public Sans', group: 'Sans-Serif' },
  { id: 'plus-jakarta-sans', value: `'Plus Jakarta Sans', sans-serif`, label: 'Plus Jakarta Sans', group: 'Sans-Serif' },
  { id: 'raleway', value: `'Raleway', sans-serif`, label: 'Raleway', group: 'Sans-Serif' },
  { id: 'dm-sans', value: `'DM Sans', sans-serif`, label: 'DM Sans', group: 'Sans-Serif' },
  { id: 'josefin-sans', value: `'Josefin Sans', sans-serif`, label: 'Josefin Sans', group: 'Sans-Serif' },
  { id: 'nunito-sans', value: `'Nunito Sans', sans-serif`, label: 'Nunito Sans', group: 'Sans-Serif' },
  { id: 'work-sans', value: `'Work Sans', sans-serif`, label: 'Work Sans', group: 'Sans-Serif' },
  { id: 'manrope', value: `'Manrope', sans-serif`, label: 'Manrope', group: 'Sans-Serif' },
  { id: 'karla', value: `'Karla', sans-serif`, label: 'Karla', group: 'Sans-Serif' },
  { id: 'mulish', value: `'Mulish', sans-serif`, label: 'Mulish', group: 'Sans-Serif' },
  { id: 'quicksand', value: `'Quicksand', sans-serif`, label: 'Quicksand', group: 'Sans-Serif' },
  { id: 'rubik', value: `'Rubik', sans-serif`, label: 'Rubik', group: 'Sans-Serif' },
  { id: 'barlow', value: `'Barlow', sans-serif`, label: 'Barlow', group: 'Sans-Serif' },

  // ── Serif ──────────────────────────────────────────────────────────────────
  { id: 'playfair-display', value: `'Playfair Display', serif`, label: 'Playfair Display', group: 'Serif' },
  { id: 'merriweather', value: `'Merriweather', serif`, label: 'Merriweather', group: 'Serif' },
  { id: 'lora', value: `'Lora', serif`, label: 'Lora', group: 'Serif' },

  // ── Display / Bold ─────────────────────────────────────────────────────────
  { id: 'oswald', value: `'Oswald', sans-serif`, label: 'Oswald', group: 'Display' },

  // ── Monospace ──────────────────────────────────────────────────────────────
  { id: 'source-code-pro', value: `'Source Code Pro', monospace`, label: 'Source Code Pro', group: 'Monospace' },
  { id: 'inconsolata', value: `'Inconsolata', monospace`, label: 'Inconsolata', group: 'Monospace' },

  // ── Handwriting / Script ───────────────────────────────────────────────────
  { id: 'dancing-script', value: `'Dancing Script', cursive`, label: 'Dancing Script', group: 'Handwriting' },
  { id: 'pacifico', value: `'Pacifico', cursive`, label: 'Pacifico', group: 'Handwriting' },

  // ── System (always available — no package needed) ──────────────────────────
  { id: 'arial', value: `Arial, Helvetica, sans-serif`, label: 'Arial', group: 'System' },
  { id: 'georgia', value: `Georgia, serif`, label: 'Georgia', group: 'System' },
  { id: 'times', value: `'Times New Roman', Times, serif`, label: 'Times New Roman', group: 'System' },
  { id: 'courier-new', value: `'Courier New', Courier, monospace`, label: 'Courier New', group: 'System' },
];

// ── Lazy font loader — imports only when a font is selected ──────────────────
const FONT_LOADERS = {
  poppins: () => Promise.all([import('@fontsource/poppins/400.css'), import('@fontsource/poppins/500.css'), import('@fontsource/poppins/700.css')]),
  inter: () => Promise.all([import('@fontsource/inter/400.css'), import('@fontsource/inter/500.css'), import('@fontsource/inter/700.css')]),
  roboto: () => Promise.all([import('@fontsource/roboto/400.css'), import('@fontsource/roboto/500.css'), import('@fontsource/roboto/700.css')]),
  outfit: () => Promise.all([import('@fontsource/outfit/400.css'), import('@fontsource/outfit/500.css'), import('@fontsource/outfit/700.css')]),
  nunito: () => Promise.all([import('@fontsource/nunito/400.css'), import('@fontsource/nunito/500.css'), import('@fontsource/nunito/700.css')]),
  lato: () => Promise.all([import('@fontsource/lato/400.css'), import('@fontsource/lato/700.css')]),
  montserrat: () => Promise.all([import('@fontsource/montserrat/400.css'), import('@fontsource/montserrat/500.css'), import('@fontsource/montserrat/700.css')]),
  'public-sans': () => Promise.all([import('@fontsource/public-sans/400.css'), import('@fontsource/public-sans/500.css'), import('@fontsource/public-sans/700.css')]),
  'plus-jakarta-sans': () => Promise.all([import('@fontsource/plus-jakarta-sans/400.css'), import('@fontsource/plus-jakarta-sans/500.css'), import('@fontsource/plus-jakarta-sans/700.css')]),
  raleway: () => Promise.all([import('@fontsource/raleway/400.css'), import('@fontsource/raleway/500.css'), import('@fontsource/raleway/700.css')]),
  'dm-sans': () => Promise.all([import('@fontsource/dm-sans/400.css'), import('@fontsource/dm-sans/500.css'), import('@fontsource/dm-sans/700.css')]),
  'josefin-sans': () => Promise.all([import('@fontsource/josefin-sans/400.css'), import('@fontsource/josefin-sans/600.css'), import('@fontsource/josefin-sans/700.css')]),
  'nunito-sans': () => Promise.all([import('@fontsource/nunito-sans/400.css'), import('@fontsource/nunito-sans/500.css'), import('@fontsource/nunito-sans/700.css')]),
  'work-sans': () => Promise.all([import('@fontsource/work-sans/400.css'), import('@fontsource/work-sans/500.css'), import('@fontsource/work-sans/700.css')]),
  manrope: () => Promise.all([import('@fontsource/manrope/400.css'), import('@fontsource/manrope/500.css'), import('@fontsource/manrope/700.css')]),
  karla: () => Promise.all([import('@fontsource/karla/400.css'), import('@fontsource/karla/500.css'), import('@fontsource/karla/700.css')]),
  mulish: () => Promise.all([import('@fontsource/mulish/400.css'), import('@fontsource/mulish/500.css'), import('@fontsource/mulish/700.css')]),
  quicksand: () => Promise.all([import('@fontsource/quicksand/400.css'), import('@fontsource/quicksand/500.css'), import('@fontsource/quicksand/700.css')]),
  rubik: () => Promise.all([import('@fontsource/rubik/400.css'), import('@fontsource/rubik/500.css'), import('@fontsource/rubik/700.css')]),
  barlow: () => Promise.all([import('@fontsource/barlow/400.css'), import('@fontsource/barlow/500.css'), import('@fontsource/barlow/700.css')]),
  'playfair-display': () => Promise.all([import('@fontsource/playfair-display/400.css'), import('@fontsource/playfair-display/500.css'), import('@fontsource/playfair-display/700.css')]),
  merriweather: () => Promise.all([import('@fontsource/merriweather/400.css'), import('@fontsource/merriweather/700.css')]),
  lora: () => Promise.all([import('@fontsource/lora/400.css'), import('@fontsource/lora/500.css'), import('@fontsource/lora/700.css')]),
  oswald: () => Promise.all([import('@fontsource/oswald/400.css'), import('@fontsource/oswald/500.css'), import('@fontsource/oswald/700.css')]),
  'source-code-pro': () => Promise.all([import('@fontsource/source-code-pro/400.css'), import('@fontsource/source-code-pro/500.css'), import('@fontsource/source-code-pro/700.css')]),
  inconsolata: () => Promise.all([import('@fontsource/inconsolata/400.css'), import('@fontsource/inconsolata/700.css')]),
  'dancing-script': () => Promise.all([import('@fontsource/dancing-script/400.css'), import('@fontsource/dancing-script/700.css')]),
  pacifico: () => Promise.all([import('@fontsource/pacifico/400.css')]),
};

// Track which fonts have already been loaded to avoid redundant imports
const loadedFonts = new Set();

async function loadFontById(id) {
  if (loadedFonts.has(id)) return;
  const loader = FONT_LOADERS[id];
  if (!loader) return;
  try {
    await loader();
    loadedFonts.add(id);
  } catch (e) {
    console.warn('[FontFamily] Could not load font:', id, e);
  }
}

// Pre-load all fonts once for preview rendering in the dropdown
let allPreviewsLoaded = false;
async function preloadAllForPreview() {
  if (allPreviewsLoaded) return;
  allPreviewsLoaded = true;
  for (const id of Object.keys(FONT_LOADERS)) {
    await loadFontById(id);
  }
}

const GROUPS = [...new Set(FONTS.map(f => f.group))];

// ── Group header style ─────────────────────────────────────────────────────────
const GROUP_HEADER_SX = {
  fontSize: '0.65rem',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  opacity: '1 !important',
  py: 0.6,
  px: 2,
  cursor: 'default',
  pointerEvents: 'none',
  bgcolor: 'action.selected',
  color: 'primary.main',
  borderTop: '1px solid',
  borderColor: 'divider',
  '&:first-of-type': { borderTop: 'none' }
};

export default function FontFamilyPage() {
  const {
    state: { fontFamily, isBold, isItalic },
    setField
  } = useConfig();

  const handleFontChange = async (event) => {
    const val = event.target.value;
    const found = FONTS.find(f => f.value === val);
    if (found) await loadFontById(found.id);
    setField('fontFamily', val);
  };

  const handleOpen = () => {
    preloadAllForPreview();
  };

  const currentFontObj = FONTS.find(f => f.value === fontFamily);

  return (
    <Stack sx={{ p: 2, gap: 2 }}>
      {/* Font Select Dropdown */}
      <FormControl fullWidth size="small">
        <Select
          id="font-family-select"
          value={fontFamily}
          onChange={handleFontChange}
          onOpen={handleOpen}
          sx={{
            fontFamily,
            fontSize: '0.88rem',
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: 'background.paper',
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: 'divider'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main'
            }
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 400,
                borderRadius: 2.5,
                boxShadow: '0 12px 36px rgba(0,0,0,0.16)'
              }
            }
          }}
          renderValue={(val) => {
            const found = FONTS.find(f => f.value === val);
            return (
              <Stack direction="row" alignItems="center" spacing={1}>
                <span style={{ fontFamily: val, fontWeight: 700 }}>{found?.label ?? val}</span>
                {found?.group && (
                  <Box
                    sx={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      px: 0.8,
                      py: 0.1,
                      borderRadius: 1,
                      bgcolor: 'action.selected',
                      color: 'text.secondary'
                    }}
                  >
                    {found.group}
                  </Box>
                )}
              </Stack>
            );
          }}
        >
          {GROUPS.map((group) => [
            <MenuItem key={`hdr-${group}`} disabled sx={GROUP_HEADER_SX}>
              {group}
            </MenuItem>,
            ...FONTS
              .filter(f => f.group === group)
              .map((item) => (
                <MenuItem
                  key={item.id}
                  value={item.value}
                  sx={{
                    fontFamily: item.value,
                    pl: 3,
                    py: 1,
                    fontSize: '0.88rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    '&.Mui-selected': {
                      bgcolor: 'primary.lighter',
                      fontWeight: 700,
                      color: 'primary.main'
                    }
                  }}
                >
                  <span style={{ fontFamily: item.value }}>{item.label}</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.5 }}>Ag 123</span>
                </MenuItem>
              ))
          ])}
        </Select>
      </FormControl>

      {/* Live Preview Sample */}
      <Box
        sx={{
          p: 2,
          borderRadius: 2.5,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(236,72,153,0.04))',
          border: '1px solid',
          borderColor: 'divider',
          fontFamily,
          fontWeight: isBold ? 700 : 400,
          fontStyle: isItalic ? 'italic' : 'normal',
          transition: 'font-family 0.25s ease'
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography
            variant="caption"
            sx={{
              fontFamily: 'inherit',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'primary.main'
            }}
          >
            {currentFontObj?.label || 'Custom'} — {currentFontObj?.group || 'Font'}
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'inherit', fontSize: '0.65rem', opacity: 0.6 }}>
            Live Preview
          </Typography>
        </Stack>
        <Typography
          sx={{
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            fontStyle: 'inherit',
            fontSize: '1rem',
            lineHeight: 1.3,
            color: 'text.primary',
            mb: 0.5
          }}
        >
          <span style={{ color: '#ef4444', fontWeight: 800 }}>Bos(s)</span> — Built for Speed &amp; Precision.
        </Typography>
        <Typography
          variant="caption"
          display="block"
          sx={{ fontFamily: 'inherit', fontSize: '0.72rem', opacity: 0.7, letterSpacing: '0.03em' }}
        >
          ABCDEFGHIJKLM 0123456789 &bull; Modern Workspaces
        </Typography>
      </Box>

      {/* Global Bold & Global Italic Toggles */}
      <Stack direction="row" spacing={1.25}>
        <Box
          onClick={() => setField('isBold', !isBold)}
          sx={{
            flex: 1,
            p: 1.25,
            borderRadius: 2,
            cursor: 'pointer',
            border: '1.5px solid',
            borderColor: isBold ? 'primary.main' : 'divider',
            bgcolor: isBold ? 'primary.lighter' : 'background.paper',
            color: isBold ? 'primary.main' : 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s',
            '&:hover': { borderColor: 'primary.main' }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.8rem' }}>
            Bold
          </Typography>
          <Switch size="small" checked={isBold} onChange={(e) => setField('isBold', e.target.checked)} />
        </Box>

        <Box
          onClick={() => setField('isItalic', !isItalic)}
          sx={{
            flex: 1,
            p: 1.25,
            borderRadius: 2,
            cursor: 'pointer',
            border: '1.5px solid',
            borderColor: isItalic ? 'secondary.main' : 'divider',
            bgcolor: isItalic ? 'secondary.lighter' : 'background.paper',
            color: isItalic ? 'secondary.main' : 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s',
            '&:hover': { borderColor: 'secondary.main' }
          }}
        >
          <Typography variant="body2" sx={{ fontStyle: 'italic', fontWeight: 700, fontSize: '0.8rem' }}>
            Italic
          </Typography>
          <Switch size="small" color="secondary" checked={isItalic} onChange={(e) => setField('isItalic', e.target.checked)} />
        </Box>
      </Stack>
    </Stack>
  );
}
