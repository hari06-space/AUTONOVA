// Organization: AUTONOVA
// Owner: hari06-space
// Created At: 2026-09-04
// Description: Centralized Header / Top Bar Theme Registry & CSS Style Resolvers.
//              Provides 20 distinctly unique executive presets across Solid/Gradients, Images, Shapes, and Textures/Abstract.

import { HeaderTheme } from 'config';

// Local SVG Assets (Stored directly inside src/assets/images/header-themes/)
import botanicalLeafSvg from 'assets/images/header-themes/botanical_leaf.svg';
import skyglassLightSvg from 'assets/images/header-themes/skyglass_light.svg';
import dawnDunesSvg from 'assets/images/header-themes/dawn_dunes.svg';
import tokyoRainSvg from 'assets/images/header-themes/tokyo_rain.svg';
import geoBauhausSvg from 'assets/images/header-themes/geo_bauhaus.svg';
import geoPrismLightSvg from 'assets/images/header-themes/geo_prism_light.svg';
import geoPrismSpectrumSvg from 'assets/images/header-themes/geo_prism_spectrum.svg';
import geoIsoLightSvg from 'assets/images/header-themes/geo_isometric_light.svg';
import texCarraraGoldMarbleJpg from 'assets/images/header-themes/tex_carrara_gold_marble.jpg';
import texHoloGridSvg from 'assets/images/header-themes/tex_holo_grid.svg';
import texOpalMatrixSvg from 'assets/images/header-themes/tex_opal_matrix.svg';
import texPastelCloudsSvg from 'assets/images/header-themes/tex_pastel_clouds.svg';

export const HEADER_THEME_LIST = [
  // ── 1. SOLID COLORS (4) ──────────────────────────────────────────────────
  {
    id: HeaderTheme.DEFAULT,
    name: 'Dynamic System',
    category: 'solid',
    badge: 'AUTO',
    desc: 'Adapts seamlessly to Light / Dark workspace mode',
    previewBg: 'linear-gradient(90deg, #ffffff 50%, #0f172a 50%)',
    isDark: false
  },
  {
    id: HeaderTheme.CHAMPAGNE_PEARL,
    name: 'Champagne Pearl',
    category: 'solid',
    badge: 'WARM',
    desc: 'Warm luxury alabaster ivory with delicate golden bronze border',
    previewBg: 'linear-gradient(135deg, #fffdfa 0%, #fbf6ec 50%, #f4ebd6 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.EMERALD_MINT,
    name: 'Nordic Sage',
    category: 'solid',
    badge: 'MINT',
    desc: 'Calming executive mint cream with fresh deep emerald accents',
    previewBg: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.ROYAL_OBSIDIAN,
    name: 'Obsidian Gold',
    category: 'solid',
    badge: 'LUXURY',
    desc: 'Stealth jet-black luxury with amber-gold metallic accent',
    previewBg: 'linear-gradient(180deg, #111217 0%, #050508 100%)',
    isDark: true
  },

  // ── 2. IMAGES & SCENIC HORIZONS (4: 3 LIGHT, 1 DARK) ─────────────────────
  {
    id: HeaderTheme.IMG_LEAF,
    name: 'Kyoto Leaf Mist',
    category: 'images',
    badge: 'LEAF',
    desc: 'Fresh botanical leaf green canopy with morning sunbeam rays',
    previewBg: 'linear-gradient(90deg, #f0fdf4 0%, #86efac 40%, #22c55e 80%, #047857 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.IMG_SKYGLASS,
    name: 'Daylight Skyglass',
    category: 'images',
    badge: 'LIGHT',
    desc: 'Crisp corporate skyscraper glass facade reflecting radiant azure sky',
    previewBg: 'linear-gradient(90deg, #bae6fd 0%, #e0f2fe 50%, #ffffff 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.IMG_DUNES,
    name: 'Golden Dawn Dunes',
    category: 'images',
    badge: 'WARM',
    desc: 'Sensual champagne silk & peach blush desert dunes at sunrise',
    previewBg: 'linear-gradient(90deg, #fffdfa 0%, #fed7aa 45%, #f59e0b 85%, #ea580c 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.IMG_TOKYO,
    name: 'Neo Tokyo Rain',
    category: 'images',
    badge: 'CYBER',
    desc: 'Cinematic midnight rain sheen with vibrant neon bokeh city lights',
    previewBg: 'linear-gradient(90deg, #08080f 0%, #06b6d4 35%, #ec4899 70%, #05050a 100%)',
    isDark: true
  },

  // ── 3. SHAPES & GEOMETRY (4: 4 LIGHT) ────────────────────────────────────
  {
    id: HeaderTheme.SHP_BAUHAUS,
    name: 'Bauhaus Modernist',
    category: 'shapes',
    badge: 'MINIMAL',
    desc: 'Pastel geometric circles, triangles & rings on clean white canvas',
    previewBg: 'linear-gradient(90deg, #ffffff 0%, #fbcfe8 35%, #bae6fd 70%, #f1f5f9 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.SHP_PRISM,
    name: 'Prism Origami',
    category: 'shapes',
    badge: 'PRISM',
    desc: 'Crystalline low-poly iridescent diamond facet geometry',
    previewBg: 'linear-gradient(90deg, #ffffff 0%, #ede9fe 35%, #c7d2fe 70%, #bae6fd 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.SHP_SPECTRUM,
    name: 'Prism Spectrum',
    category: 'shapes',
    badge: 'SPECTRUM',
    desc: 'Dynamic 45° angled geometric prism slabs transitioning from golden yellow to coral rose and azure blue',
    previewBg: 'linear-gradient(90deg, #fef08a 0%, #fb923c 30%, #f472b6 60%, #60a5fa 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.SHP_ISO_LIGHT,
    name: 'Isometric 3D Grid',
    category: 'shapes',
    badge: '3D MESH',
    desc: 'Stepped 3D isometric cube terraces on lavender-indigo ground',
    previewBg: 'linear-gradient(90deg, #fdf4ff 0%, #ede9fe 40%, #c084fc 80%, #818cf8 100%)',
    isDark: false
  },

  // ── 4. TEXTURES & ABSTRACT (4: 4 LIGHT) ───────────────────────────────────
  {
    id: HeaderTheme.TEX_CARRARA_MARBLE,
    name: 'Carrara Gold Marble',
    category: 'textures',
    badge: 'MARBLE',
    desc: 'Polished Italian Calacatta marble with organic veins of amber gold and smoky quartz',
    previewBg: 'linear-gradient(135deg, #ffffff 0%, #fbf8f2 50%, #f4eee2 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.TEX_HOLO_GRID,
    name: 'Holo Prism Mesh',
    category: 'textures',
    badge: 'HOLO',
    desc: 'Iridescent laser cyber grid mesh with rainbow holographic sheen',
    previewBg: 'linear-gradient(90deg, #ede9fe 0%, #dbeafe 35%, #fbcfe8 70%, #c7d2fe 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.TEX_OPAL_MATRIX,
    name: 'Opal Crystal Quartz',
    category: 'textures',
    badge: 'OPAL',
    desc: 'Luminous multi-faceted crystalline quartz with iridescent prismatic light shards',
    previewBg: 'linear-gradient(90deg, #fdf4ff 0%, #e0e7ff 35%, #fce7f3 70%, #ede9fe 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.TEX_PASTEL_CLOUDS,
    name: 'Pastel Dream Sky',
    category: 'textures',
    badge: 'CLOUD',
    desc: 'Artistic watercolor sky mist with ethereal azure billows, rose blush, and warm apricot cumulus',
    previewBg: 'linear-gradient(90deg, #bae6fd 0%, #e0f2fe 30%, #fbcfe8 65%, #fed7aa 100%)',
    isDark: false
  },

  // ── 5. GRADIENTS & LIGHT SHIFTS (4: 2 LIGHT, 2 DARK) ─────────────────────
  {
    id: HeaderTheme.GRAD_SUNSET_ROSE,
    name: 'Sunset Velvet',
    category: 'gradients',
    badge: 'SUNSET',
    desc: 'Coral blush rose to warm apricot peach & golden champagne',
    previewBg: 'linear-gradient(90deg, #fff1f2 0%, #ffe4e6 30%, #ffedd5 65%, #fef3c7 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.GRAD_CYAN_FROST,
    name: 'Nordic Cyan Frost',
    category: 'gradients',
    badge: 'FROST',
    desc: 'Glacier ice cyan to luminous periwinkle & soft lavender',
    previewBg: 'linear-gradient(90deg, #f0fdfa 0%, #e0f2fe 35%, #ede9fe 75%, #fae8ff 100%)',
    isDark: false
  },
  {
    id: HeaderTheme.GRAD_COSMIC_NEBULA,
    name: 'Cosmic Nebula',
    category: 'gradients',
    badge: 'NEBULA',
    desc: 'Midnight space indigo to electric ultraviolet purple & neon magenta',
    previewBg: 'linear-gradient(90deg, #090919 0%, #1e1b4b 35%, #3b0764 70%, #581c87 100%)',
    isDark: true
  },
  {
    id: HeaderTheme.GRAD_SOLAR_EMBER,
    name: 'Solar Ember',
    category: 'gradients',
    badge: 'EMBER',
    desc: 'Obsidian charcoal to molten bronze-amber & burning electric gold',
    previewBg: 'linear-gradient(90deg, #0a0a0f 0%, #1c1308 40%, #451a03 75%, #78350f 100%)',
    isDark: true
  }
];

/**
 * Resolves full CSS styling for the AppBar given a theme ID and active color mode.
 * @param {string} themeId
 * @param {boolean} isSystemDark
 * @returns {object} MUI sx style object
 */
export function getHeaderThemeStyles(themeId, isSystemDark, customGradient) {
  switch (themeId) {
    // ════════════ 1. SOLID COLORS ════════════
    case HeaderTheme.CHAMPAGNE_PEARL:
      return {
        backgroundColor: '#fffdf9',
        backgroundImage: 'linear-gradient(180deg, #fffdf9 0%, #f7f3ea 100%)',
        borderBottom: '1.5px solid #dfd4bf',
        boxShadow: '0 2px 12px rgba(217, 119, 6, 0.08)',
        color: '#292218'
      };

    case HeaderTheme.EMERALD_MINT:
      return {
        backgroundColor: '#f0fdf4',
        backgroundImage: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)',
        borderBottom: '1.5px solid #a7f3d0',
        boxShadow: '0 2px 12px rgba(16, 185, 129, 0.08)',
        color: '#065f46'
      };

    case HeaderTheme.ROYAL_OBSIDIAN:
      return {
        backgroundColor: '#050508',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(245, 158, 11, 0.18) 0%, transparent 65%), linear-gradient(180deg, #111217 0%, #050508 100%)',
        borderBottom: '2px solid #f59e0b',
        boxShadow: '0 6px 24px rgba(245, 158, 11, 0.2)',
        color: '#ffffff'
      };

    // ════════════ 2. IMAGES & SCENIC HORIZONS (3 LIGHT, 1 DARK) ════════════
    case HeaderTheme.IMG_LEAF:
      return {
        backgroundColor: '#f0fdf4',
        backgroundImage: `linear-gradient(180deg, rgba(240, 253, 244, 0.4) 0%, rgba(209, 250, 229, 0.85) 100%), url("${botanicalLeafSvg}")`,
        backgroundSize: '100% 100%, 100% 100%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderBottom: '2px solid #10b981',
        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.15)',
        color: '#064e3b'
      };

    case HeaderTheme.IMG_SKYGLASS:
      return {
        backgroundColor: '#e0f2fe',
        backgroundImage: `linear-gradient(180deg, rgba(224, 242, 254, 0.35) 0%, rgba(255, 255, 255, 0.8) 100%), url("${skyglassLightSvg}")`,
        backgroundSize: '100% 100%, 100% 100%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderBottom: '2px solid #38bdf8',
        boxShadow: '0 4px 16px rgba(2, 132, 199, 0.15)',
        color: '#0369a1'
      };

    case HeaderTheme.IMG_DUNES:
      return {
        backgroundColor: '#fffdfa',
        backgroundImage: `linear-gradient(180deg, rgba(255, 253, 250, 0.25) 0%, rgba(254, 215, 170, 0.75) 100%), url("${dawnDunesSvg}")`,
        backgroundSize: '100% 100%, 100% 100%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderBottom: '2px solid #f59e0b',
        boxShadow: '0 4px 16px rgba(217, 119, 6, 0.15)',
        color: '#7c2d12'
      };

    case HeaderTheme.IMG_TOKYO:
      return {
        backgroundColor: '#08080f',
        backgroundImage: `linear-gradient(180deg, rgba(8, 8, 15, 0.2) 0%, rgba(8, 8, 15, 0.8) 100%), url("${tokyoRainSvg}")`,
        backgroundSize: '100% 100%, 100% 100%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderBottom: '2px solid #ec4899',
        boxShadow: '0 6px 25px rgba(236, 72, 153, 0.35)',
        color: '#ffffff'
      };

    // ════════════ 3. SHAPES & GEOMETRY (4 LIGHT, 2 DARK) ════════════
    case HeaderTheme.SHP_BAUHAUS:
      return {
        backgroundColor: '#ffffff',
        backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.4) 0%, rgba(248, 250, 252, 0.7) 100%), url("${geoBauhausSvg}")`,
        backgroundSize: '100% 100%, 100% 100%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderBottom: '2px solid #e2e8f0',
        boxShadow: '0 3px 14px rgba(0, 0, 0, 0.05)',
        color: '#1e293b'
      };

    case HeaderTheme.SHP_PRISM:
      return {
        backgroundColor: '#f8fafc',
        backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0%, rgba(241, 245, 249, 0.6) 100%), url("${geoPrismLightSvg}")`,
        backgroundSize: '100% 100%, 100% 100%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderBottom: '2px solid #c7d2fe',
        boxShadow: '0 3px 14px rgba(99, 102, 241, 0.1)',
        color: '#312e81'
      };

    case HeaderTheme.SHP_SPECTRUM:
      return {
        backgroundColor: '#fff8db',
        backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 100%), url("${geoPrismSpectrumSvg}")`,
        backgroundSize: '100% 100%, 100% 100%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderBottom: '1.5px solid #60a5fa',
        boxShadow: '0 3px 14px rgba(96, 165, 250, 0.15)',
        color: '#1e293b'
      };

    case HeaderTheme.SHP_ISO_LIGHT:
      return {
        backgroundColor: '#faf5ff',
        backgroundImage: `linear-gradient(90deg, rgba(250, 245, 255, 0.35) 0%, rgba(243, 232, 255, 0.65) 100%), url("${geoIsoLightSvg}")`,
        backgroundSize: '100% 100%, 100% 100%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderBottom: '2px solid #a855f7',
        boxShadow: '0 4px 16px rgba(147, 51, 234, 0.12)',
        color: '#581c87'
      };

    // ════════════ 4. TEXTURES & ABSTRACT (4 LIGHT) ════════════
    case HeaderTheme.TEX_CARRARA_MARBLE:
      return {
        backgroundColor: '#ffffff',
        backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.2) 100%), url("${texCarraraGoldMarbleJpg}")`,
        backgroundSize: '100% 100%, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderBottom: '1.5px solid #d4af37',
        boxShadow: '0 3px 14px rgba(212, 175, 55, 0.14)',
        color: '#1e293b'
      };

    case HeaderTheme.TEX_HOLO_GRID:
      return {
        backgroundColor: '#faf5ff',
        backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.15) 0%, rgba(245, 243, 255, 0.35) 100%), url("${texHoloGridSvg}")`,
        backgroundSize: '100% 100%, 100% 100%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderBottom: '2px solid #818cf8',
        boxShadow: '0 4px 16px rgba(129, 140, 248, 0.15)',
        color: '#4338ca'
      };

    case HeaderTheme.TEX_OPAL_MATRIX:
      return {
        backgroundColor: '#ffffff',
        backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.15) 0%, rgba(245, 243, 255, 0.3) 100%), url("${texOpalMatrixSvg}")`,
        backgroundSize: '100% 100%, 100% 100%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderBottom: '2px solid #a855f7',
        boxShadow: '0 4px 18px rgba(168, 85, 247, 0.16)',
        color: '#581c87'
      };

    case HeaderTheme.TEX_PASTEL_CLOUDS:
      return {
        backgroundColor: '#f0f9ff',
        backgroundImage: `linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.15) 100%), url("${texPastelCloudsSvg}")`,
        backgroundSize: '100% 100%, 100% 100%',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
        borderBottom: '1.5px solid #fed7aa',
        boxShadow: '0 3px 14px rgba(251, 146, 60, 0.12)',
        color: '#0369a1'
      };

    // ════════════ 5. GRADIENTS & LIGHT SHIFTS (5 PRESETS, 1 CUSTOM) ════════════
    case HeaderTheme.GRAD_SUNSET_ROSE:
      return {
        backgroundColor: '#fff1f2',
        backgroundImage: 'linear-gradient(90deg, #fff1f2 0%, #ffe4e6 30%, #ffedd5 65%, #fef3c7 100%)',
        borderBottom: '1.5px solid #f43f5e',
        boxShadow: '0 3px 14px rgba(244, 63, 94, 0.12)',
        color: '#881337'
      };

    case HeaderTheme.GRAD_CYAN_FROST:
      return {
        backgroundColor: '#f0fdfa',
        backgroundImage: 'linear-gradient(90deg, #f0fdfa 0%, #e0f2fe 35%, #ede9fe 75%, #fae8ff 100%)',
        borderBottom: '1.5px solid #38bdf8',
        boxShadow: '0 3px 14px rgba(56, 189, 248, 0.12)',
        color: '#0369a1'
      };

    case HeaderTheme.GRAD_COSMIC_NEBULA:
      return {
        backgroundColor: '#090919',
        backgroundImage: 'linear-gradient(90deg, #090919 0%, #1e1b4b 35%, #3b0764 70%, #581c87 100%)',
        borderBottom: '1.5px solid #a855f7',
        boxShadow: '0 6px 25px rgba(168, 85, 247, 0.35)',
        color: '#ffffff'
      };

    case HeaderTheme.GRAD_SOLAR_EMBER:
      return {
        backgroundColor: '#0a0a0f',
        backgroundImage: 'linear-gradient(90deg, #0a0a0f 0%, #1c1308 40%, #451a03 75%, #78350f 100%)',
        borderBottom: '1.5px solid #f59e0b',
        boxShadow: '0 6px 25px rgba(245, 158, 11, 0.35)',
        color: '#ffffff'
      };

    // ════════════ DEFAULT SYSTEM ════════════
    case HeaderTheme.DEFAULT:
    default:
      return {
        bgcolor: isSystemDark ? '#0f172a' : '#ffffff',
        backgroundImage: 'none',
        borderBottom: '1px solid',
        borderColor: isSystemDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        boxShadow: isSystemDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
        color: isSystemDark ? '#ffffff' : 'text.primary'
      };
  }
}
